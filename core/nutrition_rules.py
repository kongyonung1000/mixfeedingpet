"""
Nutritional Rules and Conflict Resolution Engine for Complex Multi-morbidities.
Based on '영양학정리.xlsx' clinical guidelines, ACVIM consensus, IRIS CKD guidelines, and veterinary clinical nutrition standards.
"""
from typing import List, Dict, Tuple, Optional, Any
from core.models import Species, NutrientConstraint, MuscleConditionScore

# Standard Disease Guidelines (Per 1000 kcal ME or DM% approximations)
# Conversion: 1000 kcal typically corresponds to ~250g dry matter for 4000 kcal/kg diet.
# So 1% DM ≈ 2.5g / 1000kcal.

DISEASE_GUIDELINES = {
    "심장병 (MMVD, DCM, HCM, 울혈성심부전)": {
        "priority": 1,
        "dog": {
            "sodium_max_g": 0.8,     # < 0.25% DM (< 80mg/100kcal)
            "protein_min_g": 45.0,    # >= 4.5g/100kcal (근감소증 방지)
            "epa_dha_min_g": 1.0,     # EPA/DHA 항염증/부정맥 방지
            "taurine_min_g": 0.5,
            "potassium_min_g": 2.0,   # 이뇨제 저칼륨혈증 대비
            "notes": ["나트륨 엄격 제한 (<0.8g/1000kcal)", "심장성 악액질 방지용 양질 단백질 유지", "EPA/DHA 및 타우린 강화"]
        },
        "cat": {
            "sodium_max_g": 0.8,     # < 0.30% DM
            "protein_min_g": 65.0,    # >= 6.5g/100kcal
            "epa_dha_min_g": 0.8,
            "taurine_min_g": 0.8,
            "potassium_min_g": 2.0,
            "notes": ["나트륨 엄격 제한", "타우린 필수 보충 (DCM/HCM)", "EPA/DHA 보충"]
        }
    },
    "만성신부전 (CKD IRIS 1-4단계)": {
        "priority": 1,
        "dog": {
            "phosphorus_max_g": 0.8,  # 0.15~0.30% DM (< 0.8g/1000kcal)
            "protein_max_g": 55.0,    # 요독증 감소를 위한 조절 (< 15~18% DM)
            "sodium_max_g": 0.9,      # 0.25% DM 이하
            "epa_dha_min_g": 0.8,     # 사구체 염증 완화
            "notes": ["인(Phosphorus) 엄격 제한 (<0.8g/1000kcal)", "단백질 조절 및 고생물가 급여", "음수량 공급 최우선 (습식 추천)"]
        },
        "cat": {
            "phosphorus_max_g": 0.9,  # 0.04~0.60% DM
            "protein_max_g": 75.0,    # < 30% DM
            "sodium_max_g": 1.0,      # < 0.35% DM
            "epa_dha_min_g": 0.8,
            "notes": ["인(Phosphorus) 엄격 제한", "신부전 단계별 단백질 조절", "충분한 수분 공급"]
        }
    },
    "췌장염 (급성/만성/지방제한)": {
        "priority": 1,
        "dog": {
            "fat_max_g": 25.0,        # < 10~12% DM (극저지방)
            "fiber_max_g": 8.0,       # 섬유소 과다 억제 (소화율 극대화)
            "notes": ["극저지방 필수 (<25g/1000kcal, <10% DM)", "소화율 높은 탄수화물/단백질 급여", "소량 다회 급여"]
        },
        "cat": {
            "fat_max_g": 40.0,        # < 15~18% DM (고양이는 극단적 저지방 불필요/기호성 고려)
            "fiber_max_g": 8.0,
            "notes": ["중등도 저지방 (<40g/1000kcal)", "소화율 극대화"]
        }
    },
    "쿠싱 증후군 (부신피질기능항진증)": {
        "priority": 2,
        "dog": {
            "fat_max_g": 30.0,        # 고지혈증/췌장염 예방 저지방
            "protein_min_g": 45.0,    # 근감소증 방지 양질 단백질
            "fiber_min_g": 8.0,       # 당 대사 조절 및 포만감
            "notes": ["고지혈증 대비 저지방 (<30g/1000kcal)", "근육 위축 방지용 양질 단백질", "적정 섬유질 유지"]
        },
        "cat": {
            "fat_max_g": 35.0,
            "protein_min_g": 70.0,
            "notes": ["인슐린 저항성 및 지질 대사 관리"]
        }
    },
    "만성간부전 / 간질환": {
        "priority": 1,
        "dog": {
            "copper_max_mg": 1.2,     # 구리 엄격 제한 (<1.2mg/1000kcal, <5mg/kg DM)
            "sodium_max_g": 0.9,      # 복수/고혈압 예방
            "protein_min_g": 38.0,
            "protein_max_g": 60.0,    # 간성뇌증 위험 시 단백질 조절, 비육류 단백질 권장
            "notes": ["구리(Cu) 엄격 제한 (<1.2mg/1000kcal)", "식물성/유제품/달걀 등 비육류 양질 단백질", "아연(Zn) 보충으로 구리 흡수 억제"]
        },
        "cat": {
            "copper_max_mg": 1.5,
            "protein_min_g": 65.0,
            "taurine_min_g": 1.0,     # 담즙산 결합용 타우린 필수
            "notes": ["구리 제한", "타우린 충분 공급", "간지질증 예방 칼로리 공급"]
        }
    },
    "염증성장질환 (IBD / 만성장병증)": {
        "priority": 2,
        "dog": {
            "fat_max_g": 35.0,        # 림프관 확장/흡수장애 고려 저~중등도 지방
            "fiber_min_g": 3.0,
            "fiber_max_g": 12.0,
            "epa_dha_min_g": 0.8,
            "notes": ["단일 신규 단백질 또는 가수분해 단백질 필수", "고소화율 레시피", "오메가-3 항염증"]
        },
        "cat": {
            "fat_max_g": 40.0,
            "epa_dha_min_g": 0.8,
            "notes": ["가수분해/단일 단백질원", "장점막 보호 및 고소화성"]
        }
    },
    "비만 및 체중관리": {
        "priority": 3,
        "dog": {
            "fat_max_g": 25.0,
            "fiber_min_g": 15.0,      # 포만감 증가
            "protein_min_g": 55.0,    # 감량 중 근육량 보존
            "notes": ["저지방/고섬유 식단", "칼로리 밀도 제한", "근육량 유지를 위한 고단백"]
        },
        "cat": {
            "fat_max_g": 30.0,
            "fiber_min_g": 12.0,
            "protein_min_g": 85.0,
            "notes": ["고단백 저지방 포만감 식단"]
        }
    },
    "당뇨병 (Diabetes Mellitus)": {
        "priority": 2,
        "dog": {
            "fat_max_g": 30.0,
            "carb_max_g": 120.0,      # 복합탄수화물 위주
            "fiber_min_g": 15.0,      # 혈당 피크 완화 고섬유
            "notes": ["고섬유 복합탄수화물 식단", "혈당 급상승 방지", "규칙적 식사"]
        },
        "cat": {
            "carb_max_g": 35.0,       # 고양이는 초저탄수화물 (<12% ME)
            "protein_min_g": 80.0,
            "notes": ["초저탄수화물/고단백 식단 필수", "인슐린 요구량 감소 및 관해 유도"]
        }
    },
    "비뇨기 결석 (스트루바이트 / 칼슘옥살레이트)": {
        "priority": 2,
        "dog": {
            "phosphorus_max_g": 1.5,
            "magnesium_max_g": 0.25,
            "notes": ["소변 상대과포화도(RSS) 제어", "충분한 음수량으로 요 희석"]
        },
        "cat": {
            "magnesium_max_g": 0.20,
            "notes": ["요비중(USG < 1.030) 유지를 위한 습식 급여", "미네랄 균형"]
        }
    },
    "갑상선기능항진증 (고양이)": {
        "priority": 1,
        "dog": {},
        "cat": {
            "notes": ["극저요오드 식단 (<0.32 ppm) (y/d)", "신부전 동반 시 병기별 약물치료 병행 고려"]
        }
    },
    "인지기능장애 (치매 CDS) / 뇌신경": {
        "priority": 3,
        "dog": {
            "epa_dha_min_g": 1.2,
            "vitamin_e_min_mg": 150.0,
            "notes": ["DHA/EPA 오메가-3 뇌신경 보호", "비타민 E/C 항산화 복합체", "MCT 중쇄지방산"]
        },
        "cat": {
            "epa_dha_min_g": 1.0,
            "notes": ["항산화제 및 DHA 보충"]
        }
    },
    "골관절염 / 관절질환": {
        "priority": 3,
        "dog": {
            "epa_dha_min_g": 1.5,
            "notes": ["EPA+DHA 고농도 급여 (염증 완화)", "체중 감량/유지", "글루코사민/콘드로이틴"]
        },
        "cat": {
            "epa_dha_min_g": 1.2,
            "notes": ["EPA+DHA 보충", "체중 관리"]
        }
    }
}

class NutritionRulesEngine:
    @classmethod
    def resolve_constraints(cls, species: Species, diseases: List[str], mcs: MuscleConditionScore = MuscleConditionScore.NORMAL) -> Tuple[NutrientConstraint, List[str]]:
        """
        Merge and resolve conflicting nutritional constraints based on clinical priority.
        """
        is_dog = species == Species.DOG
        species_key = "dog" if is_dog else "cat"
        
        constraint = NutrientConstraint()
        clinical_notes = []

        if not diseases:
            clinical_notes.append("특이 질환 없음: 일반 성견/성묘 AAFCO/FEDIAF 기준 영양 밸런스 권장")
            return constraint, clinical_notes

        # Track active rules
        matched_rules = []
        for dis in diseases:
            for rule_name, rule_data in DISEASE_GUIDELINES.items():
                # Matching logic
                key_words = rule_name.split()[0].replace("(", "").replace(")", "")
                if key_words in dis or dis in rule_name:
                    sp_rules = rule_data.get(species_key, {})
                    if sp_rules:
                        matched_rules.append((rule_name, rule_data.get("priority", 2), sp_rules))
                    break

        if not matched_rules:
            clinical_notes.append(f"선택 질환 ({', '.join(diseases)})에 대한 맞춤 영양 타겟 계산")
            return constraint, clinical_notes

        # Sort by priority (1 is highest)
        matched_rules.sort(key=lambda x: x[1])

        # Conflict resolution logic
        for name, priority, rules in matched_rules:
            # Notes
            for n in rules.get("notes", []):
                if n not in clinical_notes:
                    clinical_notes.append(f"[{name.split()[0]}] {n}")

            # 1. Phosphorus (Strictly take the lowest MAX)
            if "phosphorus_max_g" in rules:
                val = rules["phosphorus_max_g"]
                if constraint.phosphorus_max_g is None or val < constraint.phosphorus_max_g:
                    constraint.phosphorus_max_g = val

            # 2. Sodium (Strictly take the lowest MAX)
            if "sodium_max_g" in rules:
                val = rules["sodium_max_g"]
                if constraint.sodium_max_g is None or val < constraint.sodium_max_g:
                    constraint.sodium_max_g = val

            # 3. Copper (Strictly take the lowest MAX for Liver)
            if "copper_max_mg" in rules:
                val = rules["copper_max_mg"]
                if constraint.copper_max_mg is None or val < constraint.copper_max_mg:
                    constraint.copper_max_mg = val

            # 4. Fat (Strictly take the lowest MAX, e.g. Pancreatitis is King)
            if "fat_max_g" in rules:
                val = rules["fat_max_g"]
                if constraint.fat_max_g is None or val < constraint.fat_max_g:
                    constraint.fat_max_g = val

            # 5. Fiber
            if "fiber_min_g" in rules:
                val = rules["fiber_min_g"]
                if constraint.fiber_min_g is None or val > constraint.fiber_min_g:
                    constraint.fiber_min_g = val
            if "fiber_max_g" in rules:
                val = rules["fiber_max_g"]
                if constraint.fiber_max_g is None or val < constraint.fiber_max_g:
                    constraint.fiber_max_g = val

            # 6. Omega 3 / EPA+DHA / Taurine (Take highest MIN)
            if "epa_dha_min_g" in rules:
                val = rules["epa_dha_min_g"]
                if constraint.epa_dha_min_g is None or val > constraint.epa_dha_min_g:
                    constraint.epa_dha_min_g = val
            if "taurine_min_g" in rules:
                val = rules["taurine_min_g"]
                if constraint.taurine_min_g is None or val > constraint.taurine_min_g:
                    constraint.taurine_min_g = val

            # 7. Protein Trade-off (Cardiac vs CKD vs Muscle Wasting)
            if "protein_min_g" in rules:
                val = rules["protein_min_g"]
                if constraint.protein_min_g is None or val > constraint.protein_min_g:
                    constraint.protein_min_g = val
            if "protein_max_g" in rules:
                val = rules["protein_max_g"]
                if constraint.protein_max_g is None or val < constraint.protein_max_g:
                    constraint.protein_max_g = val

        # Special Complex Multi-morbidity Trade-offs
        disease_str = " ".join(diseases)
        
        # Conflict: CKD (needs low protein) vs Heart/MCS loss (needs high quality protein)
        has_ckd = any(k in disease_str for k in ["신부전", "신장", "CKD", "레날"])
        has_heart = any(k in disease_str for k in ["심장", "MMVD", "DCM", "카디악"])
        has_pancreas = any(k in disease_str for k in ["췌장", "로우팻"])
        has_cushing = any(k in disease_str for k in ["쿠싱", "부신"])
        has_ibd = any(k in disease_str for k in ["IBD", "장염", "가스트로"])
        has_liver = any(k in disease_str for k in ["간", "헤파틱"])

        if has_ckd and (has_heart or mcs in [MuscleConditionScore.MODERATE, MuscleConditionScore.SEVERE]):
            clinical_notes.append(
                "⚡ [영양소 상충 해결: 신부전 vs 심장병/근감소] 신장 요독증 방지와 심장성 악액질 방지를 위해 "
                "단백질은 극단적 제한 대신 '고생물가(High Biological Value) 중등도 단백질'로 조율하며, "
                "인(P)과 나트륨(Na)은 공통으로 엄격 제한합니다."
            )
            # Intermediate protein window
            if is_dog:
                constraint.protein_min_g = 42.0
                constraint.protein_max_g = 55.0
            else:
                constraint.protein_min_g = 60.0
                constraint.protein_max_g = 75.0

        if has_ckd and has_pancreas:
            clinical_notes.append(
                "⚡ [영양소 상충 해결: 신부전 vs 췌장염] 췌장염 급성 악화 방지를 위해 "
                "저지방(<25g/1000kcal)을 최우선 제약으로 적용하고, 신장 보호를 위해 인(P) 제한을 동시 적용합니다."
            )
            if is_dog:
                constraint.fat_max_g = min(constraint.fat_max_g or 25.0, 25.0)
                constraint.phosphorus_max_g = min(constraint.phosphorus_max_g or 0.8, 0.8)

        if has_cushing and has_pancreas:
            clinical_notes.append(
                "⚡ [영양소 상충 해결: 쿠싱 vs 췌장염] 쿠싱 환자의 고지혈증 및 췌장염 위험을 고려하여 "
                "저지방 및 적정 섬유소 식단을 엄격 적용합니다."
            )
            if is_dog:
                constraint.fat_max_g = min(constraint.fat_max_g or 25.0, 25.0)

        if has_liver and has_ibd:
            clinical_notes.append(
                "⚡ [영양소 상충 해결: 간부전 vs IBD] 간 구리 축적 방지(저구리)와 장점막 면역 보호(가수분해/신규단백)를 "
                "결합한 저구리 가수분해 포뮬러를 추천합니다."
            )
            constraint.copper_max_mg = min(constraint.copper_max_mg or 1.2, 1.2)

        return constraint, clinical_notes
