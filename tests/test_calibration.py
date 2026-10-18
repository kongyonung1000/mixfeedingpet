"""
Unit test for Fecal Kit 5-Marker AI Calibration Engine.
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.stdout.reconfigure(encoding='utf-8')

from core.models import Species, PatientProfile, UltrasoundFindings, FecalKitResult
from core.absorption_model import BioavailabilityEngine
from core.monitoring import BloodLabTest

def run_calibration_test():
    print("==================================================")
    print("  TESTING FECAL KIT 5-MARKER AI CALIBRATION ENGINE")
    print("==================================================")

    # 1. Patient: CKD Stage 3 + MMVD B2
    profile = PatientProfile(
        name="밍키",
        species=Species.DOG,
        weight_kg=6.5,
        age_years=11.0,
        diseases=["만성신부전 (CKD IRIS 1-4단계)", "심장병 (MMVD, DCM, HCM, 울혈성심부전)"],
        fecal_score=4.0
    )

    # 2. Ultrasound finding: Mild wall thickening
    us = UltrasoundFindings(
        wall_thickness_mm=3.6,
        loss_of_layering="정상 (Normal)",
        mucosal_hyperechoic=False
    )

    # 3. Blood Lab: High BUN/Cr, High SDMA, High Phosphorus
    lab = BloodLabTest(
        bun_mg_dl=58.0,
        creatinine_mg_dl=2.8,
        sdma_ug_dl=24.0,
        phosphorus_mg_dl=6.4,
        albumin_g_dl=2.6
    )

    # 4. A Priori Estimation
    prior = BioavailabilityEngine.estimate_a_priori(profile, us, lab)
    print(f"\n[1] A Priori Estimation:")
    print(f"  - Protein Absorb: {prior['prior_protein_absorb_pct']}%")
    print(f"  - Fat Absorb: {prior['prior_fat_absorb_pct']}%")
    print(f"  - Carb Absorb: {prior['prior_carb_absorb_pct']}%")
    print(f"  - Overall Absorb: {prior['prior_overall_absorb_pct']}%")
    print(f"  - Gut Barrier Score: {prior['gut_barrier_intact_pct']}")
    print(f"  - Prior Log: {prior['prior_log']}")

    # 5. Fecal Kit Empirical Results:
    # Ammonia High, pH 7.8 (Alkaline), Fecal P Low, Fecal Fat 1+, Blood Neg
    fecal_kit = FecalKitResult(
        fecal_ph=7.8,
        fecal_ammonia="높음(중등도)",
        fecal_fat="약양성 (1+)",
        fecal_occult_blood="음성 (-)",
        fecal_phosphate="낮음 (Low - 체내 흡수 위험)"
    )

    # 6. Run AI Calibration
    cal_res = BioavailabilityEngine.calibrate_with_fecal_kit(
        prior=prior,
        fecal_kit=fecal_kit,
        lab=lab,
        diseases=profile.diseases,
        base_der_kcal=340.0,
        base_total_g=210.0
    )

    print(f"\n[2] Empirical Fecal Kit Calibration Output:")
    print(f"  - Protein Absorb: {cal_res.prior_protein_absorb_pct}% ➔ {cal_res.calibrated_protein_absorb_pct}%")
    print(f"  - Fat Absorb: {cal_res.prior_fat_absorb_pct}% ➔ {cal_res.calibrated_fat_absorb_pct}%")
    print(f"  - Carb Absorb: {cal_res.prior_carb_absorb_pct}% ➔ {cal_res.calibrated_carb_absorb_pct}%")
    print(f"  - Overall Absorb: {cal_res.prior_overall_absorb_pct}% ➔ {cal_res.calibrated_overall_absorb_pct}%")
    print(f"  - Phosphorus Risk: {cal_res.phosphorus_risk_level}")
    print(f"  - Recalculated DER: {cal_res.recalculated_der_kcal} kcal (Total Food: {cal_res.recalculated_total_g} g/day)")
    
    print(f"\n[3] Tuning Log:")
    for t in cal_res.tuning_log:
        print(f"  * [{t['marker']}] {t['result']} ➔ {t['effect']} ({t['adjustment']})")

    print(f"\n[4] Clinical Actions:")
    for a in cal_res.clinical_actions:
        print(f"  💡 {a}")

    assert cal_res.calibrated_protein_absorb_pct < cal_res.prior_protein_absorb_pct
    assert "최고 위험" in cal_res.phosphorus_risk_level
    print("\n==================================================")
    print("  CALIBRATION TEST PASSED SUCCESSFULLY! (100%)")
    print("==================================================")

if __name__ == '__main__':
    run_calibration_test()
