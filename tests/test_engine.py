"""
Automated unit & integration tests for the Prescription Diet Engine.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.stdout.reconfigure(encoding='utf-8')

from core.models import Species, Gender, MuscleConditionScore, PatientProfile, FeedingMode
from core.data_loader import DataLoader, get_data_loader
from core.energy_calculator import EnergyCalculator
from core.nutrition_rules import NutritionRulesEngine
from core.absorption_model import AbsorptionModel
from core.water_requirement import WaterCalculator
from core.optimizer import MixFeedingOptimizer
from core.monitoring import SymptomLog, BloodLabTest, MonitoringEngine

def run_tests():
    print("==================================================")
    print("  RUNNING PRESCRIPTION DIET ENGINE TESTS")
    print("==================================================")

    # 1. Data Loader Test
    loader = get_data_loader()
    print(f"\n[1] DataLoader Check:")
    print(f"  - Total Diets loaded: {len(loader.diets)}")
    dog_dry = loader.get_diets(Species.DOG, "건식")
    dog_wet = loader.get_diets(Species.DOG, "습식")
    cat_dry = loader.get_diets(Species.CAT, "건식")
    cat_wet = loader.get_diets(Species.CAT, "습식")
    print(f"  - Dog Dry: {len(dog_dry)}, Dog Wet: {len(dog_wet)}")
    print(f"  - Cat Dry: {len(cat_dry)}, Cat Wet: {len(cat_wet)}")
    print(f"  - Ingredients loaded: {len(loader.ingredients)}")
    assert len(loader.diets) > 50, "Diets should be at least 50"
    assert len(loader.ingredients) > 100, "Ingredients should be at least 100"

    # 2. Energy Calculator Test
    print(f"\n[2] Energy Calculator Check:")
    profile_dog = PatientProfile(
        name="콩이",
        species=Species.DOG,
        weight_kg=6.0,
        age_years=9.0,
        gender=Gender.NEUTERED_MALE,
        bcs=6,
        mcs=MuscleConditionScore.NORMAL
    )
    energy_res = EnergyCalculator.calculate_energy(profile_dog)
    print(f"  - Weight: {profile_dog.weight_kg}kg, RER: {energy_res['rer_kcal']} kcal, DER: {energy_res['der_kcal']} kcal (Factor: {energy_res['der_factor']})")
    assert energy_res['rer_kcal'] > 0
    assert energy_res['der_kcal'] > energy_res['rer_kcal']

    # 3. Multi-Morbidity Nutrition Rules Test
    print(f"\n[3] Nutrition Rules Conflict Resolution Check:")
    diseases = ["심장병 (MMVD, DCM, HCM, 울혈성심부전)", "만성신부전 (CKD IRIS 1-4단계)"]
    constraint, notes = NutritionRulesEngine.resolve_constraints(Species.DOG, diseases, MuscleConditionScore.MILD)
    print(f"  - Constraints for Heart + CKD:")
    print(f"    * Phosphorus Max: {constraint.phosphorus_max_g} g/1000kcal")
    print(f"    * Sodium Max: {constraint.sodium_max_g} g/1000kcal")
    print(f"    * Protein Window: {constraint.protein_min_g} ~ {constraint.protein_max_g} g/1000kcal")
    print(f"    * Clinical notes count: {len(notes)}")
    assert constraint.phosphorus_max_g <= 0.8
    assert constraint.sodium_max_g <= 0.8

    # 4. Absorption Model Test
    print(f"\n[4] Absorption Model Check:")
    profile_dog.diseases = diseases
    profile_dog.fecal_score = 4.5  # Soft stool
    profile_dog.eating_habit = "급하게 먹음"
    absorb_res = AbsorptionModel.estimate_absorption(profile_dog)
    print(f"  - Absorption Rate: {absorb_res['absorption_percent']}%")
    print(f"  - Penalties: {absorb_res['penalties']}")
    assert absorb_res['absorption_rate'] < 1.0

    # 5. Mix-Feeding Optimizer Test
    print(f"\n[5] Mix-Feeding Recommendation Test (Heart + CKD, Dry+Wet+Fresh):")
    optimizer = MixFeedingOptimizer(loader)
    mix_res = optimizer.optimize_mix(profile_dog, FeedingMode.DRY_WET_FRESH)
    print(f"  - Total DER: {mix_res.total_der_kcal} kcal -> Adjusted for absorption: {mix_res.adjusted_der_kcal} kcal")
    print(f"  - Recommended Diet Items:")
    for item in mix_res.items:
        print(f"    * [{item.feed_type}] {item.company_or_category} - {item.name}: {item.ratio_percent}% ({item.daily_amount_g}g, {item.daily_calories}kcal)")
    print(f"  - Total Daily Food: {mix_res.total_daily_g} g/day")
    print(f"  - Daily Target Water: {mix_res.daily_water_target_ml} ml (Diet water: {mix_res.total_water_from_diet_ml} ml, Extra Drink: {mix_res.additional_water_needed_ml} ml)")
    print(f"  - Blended Nutrients (Per 1000 kcal): Protein {mix_res.blended_nutrients.protein_g:.1f}g, Fat {mix_res.blended_nutrients.fat_g:.1f}g, P {mix_res.blended_nutrients.phosphorus_g:.2f}g, Na {mix_res.blended_nutrients.sodium_g:.2f}g")

    # 6. Pancreatitis + CKD Test
    print(f"\n[6] Mix-Feeding Test (Pancreatitis + CKD, Ultra Low Fat):")
    profile_panc = PatientProfile(
        name="보리",
        species=Species.DOG,
        weight_kg=4.0,
        age_years=11.0,
        diseases=["만성신부전 (CKD IRIS 1-4단계)", "췌장염 (급성/만성/지방제한)"]
    )
    mix_res_panc = optimizer.optimize_mix(profile_panc, FeedingMode.DRY_WET)
    for item in mix_res_panc.items:
        print(f"    * [{item.feed_type}] {item.name}: {item.daily_amount_g}g ({item.daily_calories}kcal)")
    print(f"  - Blended Fat: {mix_res_panc.blended_nutrients.fat_g:.1f} g/1000kcal, Phosphorus: {mix_res_panc.blended_nutrients.phosphorus_g:.2f} g/1000kcal")
    assert mix_res_panc.blended_nutrients.fat_g <= 30.0, "Fat should be restricted for pancreatitis"

    # 7. Monitoring & Feedback Test
    print(f"\n[7] Monitoring & Blood Feedback Check:")
    lab = BloodLabTest(creatinine_mg_dl=2.4, phosphorus_mg_dl=6.1, lipase_or_cpl=450.0)
    eval_res = MonitoringEngine.evaluate_blood_lab(lab)
    print(f"  - Lab Risk Level: {eval_res['risk_level']}")
    for fb in eval_res['feedbacks']:
        print(f"    {fb}")
    assert len(eval_res['feedbacks']) >= 2

    print("\n==================================================")
    print("  ALL TESTS PASSED SUCCESSFULLY! (100%)")
    print("==================================================")

if __name__ == '__main__':
    run_tests()
