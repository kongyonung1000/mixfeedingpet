"""
Energy requirement calculator (RER, DER/MER, Target Weight)
"""
from typing import Dict, Any, Tuple
from core.models import PatientProfile, Species, Gender

class EnergyCalculator:
    @staticmethod
    def calculate_rer(weight_kg: float) -> float:
        """
        Calculate Resting Energy Requirement (RER)
        RER = 70 * (weight_kg ** 0.75)
        """
        if weight_kg <= 0:
            return 0.0
        return round(70.0 * (weight_kg ** 0.75), 1)

    @staticmethod
    def calculate_ideal_weight(current_weight_kg: float, bcs: int) -> float:
        """
        Estimate Ideal Body Weight based on BCS (1~9 scale).
        BCS 5 = 100% (ideal)
        Each score deviation represents ~10-15% body fat change.
        """
        if current_weight_kg <= 0:
            return 0.0
        if bcs <= 0 or bcs > 9:
            bcs = 5
        
        factor = 1.0 + (bcs - 5) * 0.10
        ideal_wt = current_weight_kg / factor
        return round(ideal_wt, 2)

    @staticmethod
    def get_default_der_factor(profile: PatientProfile) -> Tuple[float, str]:
        """
        Determine standard DER/MER factor based on patient clinical parameters.
        Returns: (der_factor, reason_description)
        """
        if profile.custom_der_factor is not None and profile.custom_der_factor > 0:
            return profile.custom_der_factor, "사용자 지정 계수"

        is_dog = profile.species == Species.DOG
        age = profile.age_years
        bcs = profile.bcs
        gender = profile.gender
        activity = profile.activity_level

        # 자견 / 자묘 (성장기)
        if age < 1.0:
            if age < 0.4:
                return (3.0 if is_dog else 2.5), "어린 성장기 (<4개월)"
            else:
                return (2.0 if is_dog else 2.0), "후기 성장기 (4~12개월)"

        # 비만 관리 (BCS 7 이상)
        if bcs >= 7:
            return (1.0 if is_dog else 0.8), f"체중 감량 목표 (BCS {bcs})"

        # 과체중 경향 (BCS 6)
        if bcs == 6:
            return (1.2 if is_dog else 1.0), f"체중 유지/경도 과체중 (BCS {bcs})"

        # 노령견 / 노령묘 (개 >= 7세, 고양이 >= 11세)
        if (is_dog and age >= 7.0) or (not is_dog and age >= 11.0):
            # 중성화 여부 반영
            if is_dog:
                return 1.4, "노령견 유지 관리"
            else:
                return 1.1, "노령묘 유지 관리"

        # 성견 / 성묘
        is_neutered = "완료" in gender.value or "NEUTERED" in gender.name
        
        if is_dog:
            if is_neutered:
                base = 1.6
                desc = "중성화 성견"
            else:
                base = 1.8
                desc = "비중성화 성견"
            
            if activity == "높음":
                base += 0.4
                desc += " (높은 활동량)"
            elif activity == "낮음":
                base -= 0.2
                desc += " (낮은 활동량)"
            return round(base, 2), desc
        else: # Cat
            if is_neutered:
                base = 1.2
                desc = "중성화 성묘"
            else:
                base = 1.4
                desc = "비중성화 성묘"
            
            if activity == "높음":
                base += 0.2
                desc += " (활동적)"
            elif activity == "낮음":
                base -= 0.1
                desc += " (비활동적)"
            return round(base, 2), desc

    @classmethod
    def calculate_energy(cls, profile: PatientProfile) -> Dict[str, Any]:
        """
        Complete energy requirement evaluation
        """
        rer = cls.calculate_rer(profile.weight_kg)
        ideal_weight = cls.calculate_ideal_weight(profile.weight_kg, profile.bcs)
        
        target_weight = profile.target_weight_kg
        if target_weight is None or target_weight <= 0:
            target_weight = ideal_weight

        der_factor, reason = cls.get_default_der_factor(profile)
        
        # If weight loss is required (BCS >= 7), DER is typically based on ideal weight RER or target weight RER
        if profile.bcs >= 7:
            target_rer = cls.calculate_rer(target_weight)
            der_kcal = round(target_rer * der_factor, 1)
        else:
            der_kcal = round(rer * der_factor, 1)

        return {
            "current_weight_kg": profile.weight_kg,
            "ideal_weight_kg": ideal_weight,
            "target_weight_kg": target_weight,
            "rer_kcal": rer,
            "der_factor": der_factor,
            "der_factor_reason": reason,
            "der_kcal": der_kcal
        }
