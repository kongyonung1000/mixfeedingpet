"""
Mix-Feeding Recommendation and Optimization Engine.
Selects optimal diets and calculates blend ratios (Dry+Wet+Fresh, Dry+Wet, Dry+Dry, Fresh) to satisfy complex constraints.
"""
from typing import List, Dict, Tuple, Optional, Any
from core.models import (
    PatientProfile, Species, DietProduct, IngredientItem,
    NutrientConstraint, NutrientProfile, MixFeedingItem,
    MixFeedingResult, FeedingMode
)
from core.data_loader import DataLoader, get_data_loader
from core.energy_calculator import EnergyCalculator
from core.nutrition_rules import NutritionRulesEngine
from core.absorption_model import AbsorptionModel
from core.water_requirement import WaterCalculator

class MixFeedingOptimizer:
    def __init__(self, data_loader: Optional[DataLoader] = None):
        self.loader = data_loader or get_data_loader()

    def filter_allergies(self, diets: List[DietProduct], allergies: List[str]) -> List[DietProduct]:
        """Exclude products containing allergic ingredients."""
        if not allergies:
            return diets
        
        filtered = []
        for d in diets:
            # If product is hypoallergenic or hydrolyzed, it is generally safe
            if any(k in d.name for k in ["아날러제닉", "하이포알러제닉", "z/d", "가수분해"]):
                filtered.append(d)
                continue

            has_allergen = False
            for alg in allergies:
                alg_clean = alg.strip()
                if not alg_clean:
                    continue
                # Check protein sources or name
                if any(alg_clean in src for src in d.protein_sources) or alg_clean in d.name:
                    has_allergen = True
                    break
            if not has_allergen:
                filtered.append(d)
        return filtered

    def score_diet(self, diet: DietProduct, constraint: NutrientConstraint, diseases: List[str]) -> float:
        """
        Calculate compliance penalty score (Lower score = Better match).
        """
        score = 0.0
        n = diet.nutrients
        
        # 1. Indication matching bonus (negative score = good)
        dis_str = " ".join(diseases)
        matched_tags = 0
        for tag in diet.indications:
            if tag in dis_str or any(d in tag for d in diseases):
                matched_tags += 1
        score -= (matched_tags * 25.0)

        # 2. Phosphorus penalty
        if constraint.phosphorus_max_g is not None:
            if n.phosphorus_g > constraint.phosphorus_max_g:
                diff = n.phosphorus_g - constraint.phosphorus_max_g
                score += diff * 80.0  # High penalty

        # 3. Sodium penalty
        if constraint.sodium_max_g is not None:
            if n.sodium_g > constraint.sodium_max_g:
                diff = n.sodium_g - constraint.sodium_max_g
                score += diff * 60.0

        # 4. Fat penalty (Crucial for pancreatitis)
        if constraint.fat_max_g is not None:
            if n.fat_g > constraint.fat_max_g:
                diff = n.fat_g - constraint.fat_max_g
                score += diff * 50.0

        # 5. Copper penalty (For liver)
        if constraint.copper_max_mg is not None:
            if n.copper_mg > constraint.copper_max_mg:
                diff = n.copper_mg - constraint.copper_max_mg
                score += diff * 40.0

        # 6. Protein constraints
        if constraint.protein_max_g is not None and n.protein_g > constraint.protein_max_g:
            score += (n.protein_g - constraint.protein_max_g) * 1.5
        if constraint.protein_min_g is not None and n.protein_g < constraint.protein_min_g:
            score += (constraint.protein_min_g - n.protein_g) * 2.0

        # 7. Omega 3 / EPA+DHA bonus
        if constraint.epa_dha_min_g is not None and n.epa_dha_g >= constraint.epa_dha_min_g:
            score -= 10.0

        return score

    def build_custom_fresh_recipe(
        self,
        species: Species,
        diseases: List[str],
        allergies: List[str]
    ) -> Tuple[str, NutrientProfile, float]:
        """
        Synthesize a balanced fresh food formulation tailored to diseases.
        Returns: (recipe_name, nutrient_profile_per_1000kcal, moisture_pct)
        """
        is_dog = species == Species.DOG
        dis_str = " ".join(diseases)

        # Base default fresh formulation
        # Protein source selection
        protein_name = "닭가슴살(삶음)"
        if "닭고기" in allergies:
            protein_name = "칠면조/연어"
        if any(k in dis_str for k in ["간", "헤파틱"]):
            protein_name = "계란흰자+코티지치즈+두부 (저구리 양질 단백)"
        elif any(k in dis_str for k in ["신부전", "레날"]):
            protein_name = "삶은 계란흰자+소량 살코기 (저인 단백원)"
        elif any(k in dis_str for k in ["췌장", "로우팻"]):
            protein_name = "극저지방 닭가슴살(완전 탈지)"

        carb_name = "백미밥 + 귀리"
        veggie_name = "단호박 + 당근 + 브로콜리"
        
        recipe_title = f"맞춤 화식 [{protein_name} + {carb_name} + {veggie_name}]"

        # Approximate nutrient profile per 1000 kcal for custom fresh diet
        # Fresh typically ~150-180 kcal / 100g, moisture ~70%
        if any(k in dis_str for k in ["췌장", "로우팻"]):
            fresh_nutrients = NutrientProfile(
                protein_g=55.0 if is_dog else 75.0,
                fat_g=12.0,  # Ultra low fat
                carb_g=140.0,
                fiber_g=6.0,
                calcium_g=1.2,
                phosphorus_g=0.8,
                potassium_g=2.2,
                sodium_g=0.6,
                magnesium_g=0.15,
                copper_mg=1.0,
                zinc_mg=25.0,
                taurine_g=0.6,
                epa_dha_g=0.8,
                energy_density_kcal_per_kg=1400.0,
                moisture_g=700.0
            )
        elif any(k in dis_str for k in ["신부전", "신장"]):
            fresh_nutrients = NutrientProfile(
                protein_g=42.0 if is_dog else 62.0,
                fat_g=35.0,
                carb_g=120.0,
                fiber_g=5.0,
                calcium_g=1.1,
                phosphorus_g=0.45,  # Strictly low phosphorus
                potassium_g=2.0,
                sodium_g=0.5,
                magnesium_g=0.12,
                copper_mg=1.0,
                zinc_mg=25.0,
                taurine_g=0.6,
                epa_dha_g=1.0,
                energy_density_kcal_per_kg=1500.0,
                moisture_g=700.0
            )
        elif any(k in dis_str for k in ["간", "헤파틱"]):
            fresh_nutrients = NutrientProfile(
                protein_g=45.0 if is_dog else 65.0,
                fat_g=28.0,
                carb_g=130.0,
                fiber_g=6.0,
                calcium_g=1.2,
                phosphorus_g=0.7,
                potassium_g=2.2,
                sodium_g=0.5,
                magnesium_g=0.14,
                copper_mg=0.6,  # Strictly low copper
                zinc_mg=45.0,   # High zinc to inhibit copper
                taurine_g=0.8,
                epa_dha_g=0.8,
                energy_density_kcal_per_kg=1450.0,
                moisture_g=720.0
            )
        else: # Standard balanced therapeutic fresh
            fresh_nutrients = NutrientProfile(
                protein_g=52.0 if is_dog else 72.0,
                fat_g=28.0,
                carb_g=125.0,
                fiber_g=6.0,
                calcium_g=1.3,
                phosphorus_g=0.9,
                potassium_g=2.2,
                sodium_g=0.7,
                magnesium_g=0.15,
                copper_mg=1.5,
                zinc_mg=30.0,
                taurine_g=0.6,
                epa_dha_g=0.8,
                energy_density_kcal_per_kg=1500.0,
                moisture_g=700.0
            )

        return recipe_title, fresh_nutrients, 70.0

    def optimize_mix(
        self,
        profile: PatientProfile,
        feeding_mode: FeedingMode = FeedingMode.DRY_WET_FRESH,
        custom_ratios: Optional[Dict[str, float]] = None
    ) -> MixFeedingResult:
        """
        Execute full recommendation and mix calculation.
        """
        # 1. Energy Calculation
        energy_res = EnergyCalculator.calculate_energy(profile)
        der_kcal = energy_res["der_kcal"]

        # 2. Nutrition Constraints & Conflict Resolution
        constraint, clinical_notes = NutritionRulesEngine.resolve_constraints(
            profile.species, profile.diseases, profile.mcs
        )

        # 3. Absorption Rate Estimation
        absorb_res = AbsorptionModel.estimate_absorption(profile)
        absorption_rate = absorb_res["absorption_rate"]
        adjusted_der_kcal = round(der_kcal / max(0.5, absorption_rate), 1)

        # 4. Filter Available Diets by Species & Allergies
        dry_diets = self.loader.get_diets(profile.species, "건식")
        wet_diets = self.loader.get_diets(profile.species, "습식")

        dry_diets = self.filter_allergies(dry_diets, profile.allergies)
        wet_diets = self.filter_allergies(wet_diets, profile.allergies)

        # Score candidates
        scored_dry = sorted([(d, self.score_diet(d, constraint, profile.diseases)) for d in dry_diets], key=lambda x: x[1])
        scored_wet = sorted([(d, self.score_diet(d, constraint, profile.diseases)) for d in wet_diets], key=lambda x: x[1])

        best_dry_1 = scored_dry[0][0] if scored_dry else None
        best_dry_2 = scored_dry[1][0] if len(scored_dry) > 1 else best_dry_1
        best_wet_1 = scored_wet[0][0] if scored_wet else None

        # Build Mix Items based on mode
        mix_items: List[MixFeedingItem] = []

        if feeding_mode == FeedingMode.DRY_WET_FRESH:
            r_dry = custom_ratios.get("dry", 50.0) if custom_ratios else 50.0
            r_wet = custom_ratios.get("wet", 30.0) if custom_ratios else 30.0
            r_fresh = custom_ratios.get("fresh", 20.0) if custom_ratios else 20.0
            
            # Normalize to 100%
            tot = r_dry + r_wet + r_fresh
            r_dry, r_wet, r_fresh = (r_dry/tot)*100, (r_wet/tot)*100, (r_fresh/tot)*100

            fresh_title, fresh_nutrients, fresh_moisture = self.build_custom_fresh_recipe(
                profile.species, profile.diseases, profile.allergies
            )

            # Dry item
            if best_dry_1:
                cal_dry = adjusted_der_kcal * (r_dry / 100.0)
                g_dry = (cal_dry / (best_dry_1.nutrients.energy_density_kcal_per_kg or 3800.0)) * 1000.0
                water_dry = g_dry * (best_dry_1.moisture_percent / 100.0)
                mix_items.append(MixFeedingItem(
                    name=best_dry_1.name,
                    company_or_category=best_dry_1.company,
                    feed_type="건식",
                    ratio_percent=round(r_dry, 1),
                    daily_calories=round(cal_dry, 1),
                    daily_amount_g=round(g_dry, 1),
                    water_content_ml=round(water_dry, 1)
                ))

            # Wet item
            if best_wet_1:
                cal_wet = adjusted_der_kcal * (r_wet / 100.0)
                g_wet = (cal_wet / (best_wet_1.nutrients.energy_density_kcal_per_kg or 950.0)) * 1000.0
                water_wet = g_wet * (best_wet_1.moisture_percent / 100.0)
                mix_items.append(MixFeedingItem(
                    name=best_wet_1.name,
                    company_or_category=best_wet_1.company,
                    feed_type="습식",
                    ratio_percent=round(r_wet, 1),
                    daily_calories=round(cal_wet, 1),
                    daily_amount_g=round(g_wet, 1),
                    water_content_ml=round(water_wet, 1)
                ))

            # Fresh item
            cal_fresh = adjusted_der_kcal * (r_fresh / 100.0)
            g_fresh = (cal_fresh / (fresh_nutrients.energy_density_kcal_per_kg or 1500.0)) * 1000.0
            water_fresh = g_fresh * (fresh_moisture / 100.0)
            mix_items.append(MixFeedingItem(
                name=fresh_title,
                company_or_category="수의 맞춤 화식",
                feed_type="화식",
                ratio_percent=round(r_fresh, 1),
                daily_calories=round(cal_fresh, 1),
                daily_amount_g=round(g_fresh, 1),
                water_content_ml=round(water_fresh, 1)
            ))

        elif feeding_mode == FeedingMode.DRY_WET:
            r_dry = custom_ratios.get("dry", 60.0) if custom_ratios else 60.0
            r_wet = custom_ratios.get("wet", 40.0) if custom_ratios else 40.0
            tot = r_dry + r_wet
            r_dry, r_wet = (r_dry/tot)*100, (r_wet/tot)*100

            if best_dry_1:
                cal_dry = adjusted_der_kcal * (r_dry / 100.0)
                g_dry = (cal_dry / (best_dry_1.nutrients.energy_density_kcal_per_kg or 3800.0)) * 1000.0
                water_dry = g_dry * (best_dry_1.moisture_percent / 100.0)
                mix_items.append(MixFeedingItem(
                    name=best_dry_1.name,
                    company_or_category=best_dry_1.company,
                    feed_type="건식",
                    ratio_percent=round(r_dry, 1),
                    daily_calories=round(cal_dry, 1),
                    daily_amount_g=round(g_dry, 1),
                    water_content_ml=round(water_dry, 1)
                ))

            if best_wet_1:
                cal_wet = adjusted_der_kcal * (r_wet / 100.0)
                g_wet = (cal_wet / (best_wet_1.nutrients.energy_density_kcal_per_kg or 950.0)) * 1000.0
                water_wet = g_wet * (best_wet_1.moisture_percent / 100.0)
                mix_items.append(MixFeedingItem(
                    name=best_wet_1.name,
                    company_or_category=best_wet_1.company,
                    feed_type="습식",
                    ratio_percent=round(r_wet, 1),
                    daily_calories=round(cal_wet, 1),
                    daily_amount_g=round(g_wet, 1),
                    water_content_ml=round(water_wet, 1)
                ))

        elif feeding_mode == FeedingMode.DRY_DRY:
            r_dry1 = custom_ratios.get("dry1", 50.0) if custom_ratios else 50.0
            r_dry2 = custom_ratios.get("dry2", 50.0) if custom_ratios else 50.0
            tot = r_dry1 + r_dry2
            r_dry1, r_dry2 = (r_dry1/tot)*100, (r_dry2/tot)*100

            if best_dry_1:
                cal1 = adjusted_der_kcal * (r_dry1 / 100.0)
                g1 = (cal1 / (best_dry_1.nutrients.energy_density_kcal_per_kg or 3800.0)) * 1000.0
                mix_items.append(MixFeedingItem(
                    name=best_dry_1.name,
                    company_or_category=best_dry_1.company,
                    feed_type="건식1",
                    ratio_percent=round(r_dry1, 1),
                    daily_calories=round(cal1, 1),
                    daily_amount_g=round(g1, 1),
                    water_content_ml=round(g1 * (best_dry_1.moisture_percent / 100.0), 1)
                ))

            if best_dry_2 and best_dry_2.name != best_dry_1.name:
                cal2 = adjusted_der_kcal * (r_dry2 / 100.0)
                g2 = (cal2 / (best_dry_2.nutrients.energy_density_kcal_per_kg or 3800.0)) * 1000.0
                mix_items.append(MixFeedingItem(
                    name=best_dry_2.name,
                    company_or_category=best_dry_2.company,
                    feed_type="건식2",
                    ratio_percent=round(r_dry2, 1),
                    daily_calories=round(cal2, 1),
                    daily_amount_g=round(g2, 1),
                    water_content_ml=round(g2 * (best_dry_2.moisture_percent / 100.0), 1)
                ))

        elif feeding_mode == FeedingMode.FRESH_ONLY:
            fresh_title, fresh_nutrients, fresh_moisture = self.build_custom_fresh_recipe(
                profile.species, profile.diseases, profile.allergies
            )
            g_fresh = (adjusted_der_kcal / (fresh_nutrients.energy_density_kcal_per_kg or 1500.0)) * 1000.0
            water_fresh = g_fresh * (fresh_moisture / 100.0)
            mix_items.append(MixFeedingItem(
                name=fresh_title,
                company_or_category="수의 맞춤 화식",
                feed_type="화식",
                ratio_percent=100.0,
                daily_calories=round(adjusted_der_kcal, 1),
                daily_amount_g=round(g_fresh, 1),
                water_content_ml=round(water_fresh, 1)
            ))

        elif feeding_mode == FeedingMode.DRY_ONLY and best_dry_1:
            g_dry = (adjusted_der_kcal / (best_dry_1.nutrients.energy_density_kcal_per_kg or 3800.0)) * 1000.0
            water_dry = g_dry * (best_dry_1.moisture_percent / 100.0)
            mix_items.append(MixFeedingItem(
                name=best_dry_1.name,
                company_or_category=best_dry_1.company,
                feed_type="건식",
                ratio_percent=100.0,
                daily_calories=round(adjusted_der_kcal, 1),
                daily_amount_g=round(g_dry, 1),
                water_content_ml=round(water_dry, 1)
            ))

        elif feeding_mode == FeedingMode.WET_ONLY and best_wet_1:
            g_wet = (adjusted_der_kcal / (best_wet_1.nutrients.energy_density_kcal_per_kg or 950.0)) * 1000.0
            water_wet = g_wet * (best_wet_1.moisture_percent / 100.0)
            mix_items.append(MixFeedingItem(
                name=best_wet_1.name,
                company_or_category=best_wet_1.company,
                feed_type="습식",
                ratio_percent=100.0,
                daily_calories=round(adjusted_der_kcal, 1),
                daily_amount_g=round(g_wet, 1),
                water_content_ml=round(water_wet, 1)
            ))

        # Calculate Blended Nutrients (Weighted average per 1000 kcal)
        total_daily_g = sum(item.daily_amount_g for item in mix_items)
        total_water_from_diet = sum(item.water_content_ml for item in mix_items)

        # Weighted nutrient profile
        blended = NutrientProfile()
        tot_ratio = sum(item.ratio_percent for item in mix_items) or 100.0
        
        # Build dictionary of nutrient sources
        for item in mix_items:
            w = item.ratio_percent / tot_ratio
            nut = None
            if "화식" in item.feed_type or "맞춤" in item.name:
                _, nut, _ = self.build_custom_fresh_recipe(profile.species, profile.diseases, profile.allergies)
            else:
                # Find in diets
                for d in dry_diets + wet_diets:
                    if d.name == item.name:
                        nut = d.nutrients
                        break
            if nut:
                blended.protein_g += nut.protein_g * w
                blended.fat_g += nut.fat_g * w
                blended.carb_g += nut.carb_g * w
                blended.fiber_g += nut.fiber_g * w
                blended.phosphorus_g += nut.phosphorus_g * w
                blended.sodium_g += nut.sodium_g * w
                blended.potassium_g += nut.potassium_g * w
                blended.calcium_g += nut.calcium_g * w
                blended.copper_mg += nut.copper_mg * w
                blended.zinc_mg += nut.zinc_mg * w
                blended.epa_dha_g += nut.epa_dha_g * w
                blended.taurine_g += nut.taurine_g * w

        # Water requirement balance
        water_req = WaterCalculator.calculate_water_requirement(
            profile.species, profile.weight_kg, der_kcal, profile.diseases
        )
        water_balance = WaterCalculator.calculate_balance(
            water_req["daily_target_water_ml"], total_water_from_diet
        )

        # Constraint compliance summary
        compliance = {
            "protein": {
                "val": round(blended.protein_g, 1),
                "min": constraint.protein_min_g,
                "max": constraint.protein_max_g,
                "status": "적합" if (constraint.protein_min_g is None or blended.protein_g >= constraint.protein_min_g) and (constraint.protein_max_g is None or blended.protein_g <= constraint.protein_max_g) else "주의"
            },
            "fat": {
                "val": round(blended.fat_g, 1),
                "max": constraint.fat_max_g,
                "status": "적합" if constraint.fat_max_g is None or blended.fat_g <= constraint.fat_max_g else "주의"
            },
            "phosphorus": {
                "val": round(blended.phosphorus_g, 2),
                "max": constraint.phosphorus_max_g,
                "status": "적합" if constraint.phosphorus_max_g is None or blended.phosphorus_g <= constraint.phosphorus_max_g else "주의"
            },
            "sodium": {
                "val": round(blended.sodium_g, 2),
                "max": constraint.sodium_max_g,
                "status": "적합" if constraint.sodium_max_g is None or blended.sodium_g <= constraint.sodium_max_g else "주의"
            },
            "copper": {
                "val": round(blended.copper_mg, 2),
                "max": constraint.copper_max_mg,
                "status": "적합" if constraint.copper_max_mg is None or blended.copper_mg <= constraint.copper_max_mg else "주의"
            },
            "epa_dha": {
                "val": round(blended.epa_dha_g, 2),
                "min": constraint.epa_dha_min_g,
                "status": "적합" if constraint.epa_dha_min_g is None or blended.epa_dha_g >= constraint.epa_dha_min_g else "보통"
            }
        }

        # Match Recommended Supplements from 벳앤펫 DB
        recommended_supplements = self.loader.recommend_supplements_for_patient(
            profile.species, profile.weight_kg, profile.age_years, profile.diseases
        )

        return MixFeedingResult(
            items=mix_items,
            total_der_kcal=der_kcal,
            absorption_rate=absorption_rate,
            adjusted_der_kcal=adjusted_der_kcal,
            total_daily_g=round(total_daily_g, 1),
            total_water_from_diet_ml=round(total_water_from_diet, 1),
            daily_water_target_ml=water_req["daily_target_water_ml"],
            additional_water_needed_ml=water_balance["additional_water_needed_ml"],
            blended_nutrients=blended,
            constraint_compliance=compliance,
            clinical_notes=clinical_notes,
            recommended_supplements=recommended_supplements
        )
