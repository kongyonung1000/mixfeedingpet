"""
Custom Mix-Feeding Simulation Engine.
Simulates mix-feeding combinations using custom OCR-extracted diets or DB diets,
evaluates blended nutrient density against clinical disease guidelines,
and computes daily feeding grams and hydration targets.
"""
from typing import Dict, Any, List, Optional
from core.models import Species, PatientProfile, NutrientProfile, FeedingMode
from core.energy_calculator import EnergyCalculator
from core.nutrition_rules import NutritionRulesEngine, DISEASE_GUIDELINES
from core.water_requirement import WaterCalculator

class CustomMixSimulator:
    @staticmethod
    def simulate(
        patient: PatientProfile,
        feeds: List[Dict[str, Any]],
        ratio_mode: str = "CALORIE", # "CALORIE" or "GRAM"
    ) -> Dict[str, Any]:
        """
        Simulate custom feed blend.
        feeds: list of dicts:
        [
            {
                "name": str,
                "type": "건식사료" or "습식사료",
                "ratio": float (e.g. 70.0 for 70%),
                "me_kcal_per_kg": float (e.g. 3850),
                "moisture_pct": float (e.g. 10.0),
                "nutrients": {
                    "protein_g": float (per 1000kcal),
                    "fat_g": float,
                    "carb_g": float,
                    "fiber_g": float,
                    "calcium_g": float,
                    "phosphorus_g": float,
                    "sodium_g": float
                }
            },
            ...
        ]
        """
        energy_info = EnergyCalculator.calculate_energy(patient)
        der_kcal = energy_info["der_kcal"]

        # Normalize ratios to sum to 100%
        total_ratio = sum(f.get("ratio", 0.0) for f in feeds)
        if total_ratio <= 0:
            # Default equal split
            num_feeds = max(1, len(feeds))
            for f in feeds:
                f["ratio"] = 100.0 / num_feeds
            total_ratio = 100.0

        for f in feeds:
            f["ratio"] = round((f.get("ratio", 0.0) / total_ratio) * 100.0, 1)

        feed_results = []
        total_feed_water_ml = 0.0
        blended_nutrients = {
            "protein_g": 0.0,
            "fat_g": 0.0,
            "carb_g": 0.0,
            "fiber_g": 0.0,
            "calcium_g": 0.0,
            "phosphorus_g": 0.0,
            "sodium_g": 0.0
        }

        # Calculate amounts
        for f in feeds:
            ratio = f["ratio"]
            me_kg = float(f.get("me_kcal_per_kg") or 3800.0)
            if me_kg <= 0:
                me_kg = 3800.0
            
            allocated_kcal = der_kcal * (ratio / 100.0)
            # grams = (allocated_kcal / me_kg) * 1000
            daily_amount_g = round((allocated_kcal / me_kg) * 1000.0, 1)
            moisture_pct = float(f.get("moisture_pct") or 10.0)
            water_ml = round(daily_amount_g * (moisture_pct / 100.0), 1)
            total_feed_water_ml += water_ml

            # Blended nutrients per 1000 kcal
            weight = ratio / 100.0
            nut = f.get("nutrients", {})
            for k in blended_nutrients.keys():
                blended_nutrients[k] += float(nut.get(k, 0.0)) * weight

            feed_results.append({
                "name": f.get("name", "미지정 사료"),
                "feed_type": f.get("type", "사료"),
                "ratio_pct": ratio,
                "me_kcal_per_kg": me_kg,
                "daily_kcal": round(allocated_kcal, 1),
                "daily_grams": daily_amount_g,
                "bid_grams": round(daily_amount_g / 2.0, 1),
                "tid_grams": round(daily_amount_g / 3.0, 1),
                "water_from_feed_ml": water_ml
            })

        for k in blended_nutrients:
            blended_nutrients[k] = round(blended_nutrients[k], 2)

        # Hydration calculation
        target_water_info = WaterCalculator.calculate_water_requirement(
            species=patient.species,
            weight_kg=patient.weight_kg,
            der_kcal=der_kcal,
            diseases=patient.diseases
        )
        water_calc = WaterCalculator.calculate_balance(
            target_water_ml=target_water_info["daily_target_water_ml"],
            water_from_diet_ml=total_feed_water_ml
        )
        water_calc["reasons"] = target_water_info.get("reasons", [])

        # Clinical compliance evaluation
        compliance_alerts = []
        if patient.diseases:
            constraint, clinical_notes = NutritionRulesEngine.resolve_constraints(
                species=patient.species,
                diseases=patient.diseases,
                mcs=patient.mcs
            )
            
            # Phosphorus check
            if constraint.phosphorus_max_g is not None and blended_nutrients["phosphorus_g"] > constraint.phosphorus_max_g:
                compliance_alerts.append({
                    "severity": "WARNING",
                    "nutrient": "인 (Phosphorus)",
                    "message": f"혼합 사료의 인 함량({blended_nutrients['phosphorus_g']}g/1,000kcal)이 {patient.diseases} 질환 권장 상한선({constraint.phosphorus_max_g}g)을 초과합니다. 신장/비뇨기 질환 환자는 주의가 필요합니다."
                })
            
            # Sodium check
            if constraint.sodium_max_g is not None and blended_nutrients["sodium_g"] > constraint.sodium_max_g:
                compliance_alerts.append({
                    "severity": "WARNING",
                    "nutrient": "나트륨 (Sodium)",
                    "message": f"혼합 사료의 나트륨 함량({blended_nutrients['sodium_g']}g/1,000kcal)이 심장/신장 질환 권장 상한치({constraint.sodium_max_g}g)를 초과합니다."
                })

            # Fat check (Pancreatitis)
            if constraint.fat_max_g is not None and blended_nutrients["fat_g"] > constraint.fat_max_g:
                compliance_alerts.append({
                    "severity": "DANGER",
                    "nutrient": "조지방 (Fat)",
                    "message": f"혼합 사료의 지방 함량({blended_nutrients['fat_g']}g/1,000kcal)이 췌장염/고지혈증 상한 기준({constraint.fat_max_g}g)을 초과하여 췌장염 재발 위험이 있습니다."
                })

            # Protein min check
            if constraint.protein_min_g is not None and blended_nutrients["protein_g"] < constraint.protein_min_g:
                compliance_alerts.append({
                    "severity": "INFO",
                    "nutrient": "조단백질 (Protein)",
                    "message": f"혼합 사료의 단백질 함량({blended_nutrients['protein_g']}g/1,000kcal)이 최소 요구량({constraint.protein_min_g}g)보다 낮아 근손실(Cachexia) 관찰이 필요합니다."
                })

        # Dry Matter estimation of blended food
        # Estimate total dry weight
        total_pfc = blended_nutrients["protein_g"] * 3.5 + blended_nutrients["fat_g"] * 8.5 + blended_nutrients["carb_g"] * 3.5
        if total_pfc <= 0:
            total_pfc = 1000.0

        dm_analysis = {
            "protein_dm_pct": round((blended_nutrients["protein_g"] * 3.5 / total_pfc) * 100, 1),
            "fat_dm_pct": round((blended_nutrients["fat_g"] * 8.5 / total_pfc) * 100, 1),
            "carb_dm_pct": round((blended_nutrients["carb_g"] * 3.5 / total_pfc) * 100, 1),
            "phosphorus_g_per_1000kcal": blended_nutrients["phosphorus_g"],
            "calcium_g_per_1000kcal": blended_nutrients["calcium_g"],
            "sodium_g_per_1000kcal": blended_nutrients["sodium_g"]
        }

        return {
            "der_kcal": round(der_kcal, 1),
            "rer_kcal": round(energy_info["rer_kcal"], 1),
            "feeds": feed_results,
            "blended_nutrients_per_1000kcal": blended_nutrients,
            "dry_matter_analysis": dm_analysis,
            "water": water_calc,
            "compliance_alerts": compliance_alerts,
            "overall_safety": "SAFE" if not any(a["severity"] == "DANGER" for a in compliance_alerts) else "CAUTION"
        }
