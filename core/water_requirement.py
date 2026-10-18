"""
Daily Water Requirement and Diet Water Intake Calculator.
"""
from typing import Dict, Any, List
from core.models import Species

class WaterCalculator:
    @classmethod
    def calculate_water_requirement(
        cls,
        species: Species,
        weight_kg: float,
        der_kcal: float,
        diseases: List[str]
    ) -> Dict[str, Any]:
        """
        Calculate total daily water target (ml/day) based on species, weight, DER, and diseases.
        """
        is_dog = species == Species.DOG
        
        # Base requirement: ~50-60 ml/kg/day or ~1.0 ml/kcal
        base_ml_by_weight = weight_kg * (55.0 if is_dog else 50.0)
        base_ml_by_der = der_kcal * 1.0
        
        # Average baseline
        target_water_ml = (base_ml_by_weight + base_ml_by_der) / 2.0
        
        # Disease multipliers
        dis_str = " ".join(diseases)
        disease_multiplier = 1.0
        reasons = []

        if any(k in dis_str for k in ["신부전", "신장", "CKD"]):
            disease_multiplier = max(disease_multiplier, 1.35)
            reasons.append("만성신부전 (요농축능 저하 및 탈수 예방을 위한 수분 증량)")
        if any(k in dis_str for k in ["결석", "유리너리", "FLUTD"]):
            disease_multiplier = max(disease_multiplier, 1.30)
            reasons.append("비뇨기 결석 (요비중 희석 및 결석 결정화 억제)")
        if any(k in dis_str for k in ["당뇨", "다뇨"]):
            disease_multiplier = max(disease_multiplier, 1.25)
            reasons.append("당뇨병 (삼투성 이뇨로 인한 수분 손실 보충)")
        if any(k in dis_str for k in ["심장", "울혈성심부전"]):
            # Heart patients need careful water balance (not dehydrated, but no volume overload)
            reasons.append("심장병 (과도한 수분 정체 주의 및 적정 음수 유지)")

        target_water_ml *= disease_multiplier
        target_water_ml = round(target_water_ml, 1)

        return {
            "daily_target_water_ml": target_water_ml,
            "multiplier": disease_multiplier,
            "reasons": reasons,
            "ml_per_kg": round(target_water_ml / max(0.1, weight_kg), 1)
        }

    @classmethod
    def calculate_balance(
        cls,
        target_water_ml: float,
        water_from_diet_ml: float
    ) -> Dict[str, Any]:
        """
        Calculate net water deficit that must be provided by drinking water.
        """
        additional_needed = max(0.0, target_water_ml - water_from_diet_ml)
        diet_water_pct = round((water_from_diet_ml / max(1.0, target_water_ml)) * 100, 1)

        return {
            "daily_target_water_ml": round(target_water_ml, 1),
            "water_from_diet_ml": round(water_from_diet_ml, 1),
            "additional_water_needed_ml": round(additional_needed, 1),
            "diet_water_coverage_pct": min(100.0, diet_water_pct),
            "cups_needed_approx": round(additional_needed / 200.0, 1)  # 200ml cup
        }
