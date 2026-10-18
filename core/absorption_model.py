"""
Bioavailability, Nutrient Absorption, Ultrasound GI Imaging, and Fecal Kit POCT Calibration Engine.
Implements Bayesian Error Tuner linking A Priori estimates with empirical 5-marker dipstick results.
"""
from typing import Dict, Any, List, Tuple, Optional
from core.models import (
    PatientProfile, UltrasoundFindings, FecalKitResult, CalibrationResult
)
from core.monitoring import BloodLabTest

class BioavailabilityEngine:
    @classmethod
    def estimate_a_priori(
        cls,
        profile: PatientProfile,
        us: Optional[UltrasoundFindings] = None,
        lab: Optional[BloodLabTest] = None
    ) -> Dict[str, Any]:
        """
        Multimodal A Priori Estimation combining:
        1. Patient profile & diseases
        2. Eating habits & fecal score
        3. Intestinal Ultrasound imaging
        4. Blood metabolic biomarkers
        """
        # Baseline normal digestive absorption
        prot_rate = 0.88   # 88%
        fat_rate = 0.92    # 92%
        carb_rate = 0.95   # 95%
        overall_rate = 1.00 # 100%
        barrier_intact = 100.0 # 100%

        prior_log = []

        # 1. 식습관
        if profile.eating_habit == "급하게 먹음":
            overall_rate -= 0.03
            prot_rate -= 0.02
            prior_log.append("식습관: 급하게 먹음 (-3% 대사효율)")
        elif profile.eating_habit == "불규칙 급여":
            overall_rate -= 0.02
            prior_log.append("식습관: 불규칙 급여 (-2%)")

        # 2. 분변 스코어 (Fecal Score 1~7)
        fs = profile.fecal_score
        if fs >= 6.0:
            overall_rate -= 0.20
            prot_rate -= 0.15
            fat_rate -= 0.15
            carb_rate -= 0.10
            barrier_intact -= 20.0
            prior_log.append(f"분변 스코어 {fs} (설사): 소장 흡수 접촉시간 급감")
        elif fs >= 5.0:
            overall_rate -= 0.12
            prot_rate -= 0.08
            fat_rate -= 0.10
            barrier_intact -= 10.0
            prior_log.append(f"분변 스코어 {fs} (매우 묽음): 장관 수분 재흡수 저하")
        elif fs >= 4.0:
            overall_rate -= 0.06
            prot_rate -= 0.04
            fat_rate -= 0.05
            prior_log.append(f"분변 스코어 {fs} (무른변): 소화율 경도 감소")

        # 3. 기저 질환 영향
        dis_str = " ".join(profile.diseases)
        if any(k in dis_str for k in ["IBD", "만성장염", "단백소실"]):
            overall_rate -= 0.15
            prot_rate -= 0.12
            fat_rate -= 0.10
            barrier_intact -= 25.0
            prior_log.append("기저질환 (IBD/장염): 장점막 투과성 이상 및 융모 위축")
        if any(k in dis_str for k in ["췌장", "EPI", "외분비"]):
            overall_rate -= 0.15
            fat_rate -= 0.20
            prot_rate -= 0.08
            prior_log.append("기저질환 (췌장염/EPI): 소화 효소(Lipase/Protease) 분비 저하")
        if any(k in dis_str for k in ["간", "헤파틱", "간부전"]):
            overall_rate -= 0.08
            fat_rate -= 0.12
            prior_log.append("기저질환 (간부전): 담즙산 합성 감소로 인한 미셀 형성 장애")
        if any(k in dis_str for k in ["신부전", "CKD"]):
            overall_rate -= 0.05
            prot_rate -= 0.05
            prior_log.append("기저질환 (신부전): 요독성 위장관 환경")

        # 4. 장벽 초음파 영상 소견 (Ultrasound Findings)
        if us:
            if us.wall_thickness_mm >= 3.5:
                diff = (us.wall_thickness_mm - 3.0) * 0.05
                overall_rate -= diff
                prot_rate -= diff
                barrier_intact -= 15.0
                prior_log.append(f"초음파 소견: 장벽 비후 ({us.wall_thickness_mm}mm, 염증/부종 반영)")
            if us.loss_of_layering in ["부분 소실", "완전 소실"]:
                overall_rate -= 0.10
                barrier_intact -= 25.0
                prior_log.append(f"초음파 소견: 장벽 층화구조 {us.loss_of_layering} (점막 손상 중증)")
            if us.mucosal_hyperechoic:
                fat_rate -= 0.10
                prot_rate -= 0.08
                barrier_intact -= 15.0
                prior_log.append("초음파 소견: 점막 고에코성(점막하 림프관 확장/유미즙 정체)")

        # 5. 혈액 대사 마커 (Blood Lab Markers)
        if lab:
            if lab.albumin_g_dl and lab.albumin_g_dl < 2.5:
                prot_rate -= 0.10
                overall_rate -= 0.08
                barrier_intact -= 20.0
                prior_log.append(f"혈액 검사: 저알부민혈증 ({lab.albumin_g_dl}g/dL, PLE/흡수장애 시그니처)")
            if lab.lipase_or_cpl and lab.lipase_or_cpl > 400.0:
                fat_rate -= 0.12
                prior_log.append(f"혈액 검사: 췌장 수치 상승 (cPL/Lipase {lab.lipase_or_cpl}, 지방 소화율 급감)")

        # Clamping
        prot_rate = max(0.40, min(0.95, round(prot_rate, 3)))
        fat_rate = max(0.40, min(0.98, round(fat_rate, 3)))
        carb_rate = max(0.50, min(0.99, round(carb_rate, 3)))
        overall_rate = max(0.50, min(1.00, round(overall_rate, 3)))
        barrier_intact = max(20.0, min(100.0, round(barrier_intact, 1)))

        return {
            "prior_protein_absorb_pct": round(prot_rate * 100, 1),
            "prior_fat_absorb_pct": round(fat_rate * 100, 1),
            "prior_carb_absorb_pct": round(carb_rate * 100, 1),
            "prior_overall_absorb_pct": round(overall_rate * 100, 1),
            "gut_barrier_intact_pct": barrier_intact,
            "prior_log": prior_log
        }

    @classmethod
    def calibrate_with_fecal_kit(
        cls,
        prior: Dict[str, Any],
        fecal_kit: FecalKitResult,
        lab: Optional[BloodLabTest] = None,
        diseases: Optional[List[str]] = None,
        base_der_kcal: float = 350.0,
        base_total_g: float = 200.0
    ) -> CalibrationResult:
        """
        Bayesian Calibration & Error Tuner using the 5 Fecal POCT Colorimetric Markers.
        Outputs calibrated absorption rates, clinical actions, and adjusted feeding grams.
        """
        cal_prot = prior["prior_protein_absorb_pct"]
        cal_fat = prior["prior_fat_absorb_pct"]
        cal_carb = prior["prior_carb_absorb_pct"]
        cal_overall = prior["prior_overall_absorb_pct"]
        barrier = prior["gut_barrier_intact_pct"]

        tuning_log = []
        clinical_actions = []

        # =====================================================================
        # 마커 1: 분변 pH (Fecal pH)
        # =====================================================================
        ph = fecal_kit.fecal_ph
        if ph < 6.0:
            loss = 12.0
            cal_carb = max(40.0, cal_carb - loss)
            cal_overall = max(45.0, cal_overall - 5.0)
            tuning_log.append({
                "marker": "① 분변 pH (<6.0 산성)",
                "result": f"pH {ph} 검출",
                "effect": "소장 탄수화물 흡수 실패 ➔ 대장 내 난소화성 전분 과발효 (유기산 산화)",
                "adjustment": f"탄수화물 흡수율 -{loss}% 하향, 총 흡수율 -5% 하향"
            })
            clinical_actions.append("사료 내 난소화성 전분 비율을 줄이고, 수용성/불용성 식이섬유 비율을 최적화하세요.")
        elif ph > 7.5:
            loss = 6.0
            cal_prot = max(40.0, cal_prot - loss)
            tuning_log.append({
                "marker": "① 분변 pH (>7.5 알칼리성)",
                "result": f"pH {ph} 검출",
                "effect": "단백질 미소화 잔류물 대장 유입 ➔ 단백 부패(Putrefaction) 및 알칼리 대사산물 증가",
                "adjustment": f"단백질 흡수율 -{loss}% 추가 하향"
            })

        # =====================================================================
        # 마커 2: 분변 암모니아 / 질소 화합물 (Fecal Ammonia / Total Nitrogen)
        # =====================================================================
        amm = fecal_kit.fecal_ammonia
        if amm in ["높음(중등도)", "매우 높음(고농도)"]:
            loss = 11.0 if amm == "높음(중등도)" else 18.0
            cal_prot = max(35.0, cal_prot - loss)
            cal_overall = max(45.0, cal_overall - 6.0)
            tuning_log.append({
                "marker": "② 분변 암모니아/질소 (High)",
                "result": f"{amm} 반응",
                "effect": "소장 단백 소화 흡수율 불량 및 흡수 용량 초과로 대장 아민 분해 과다",
                "adjustment": f"단백질 흡수율 {prior['prior_protein_absorb_pct']}% ➔ {round(cal_prot, 1)}%로 대폭 하향 확정"
            })
            clinical_actions.append(
                f"소장 단백질 소화율이 사전 추정치보다 낮습니다. 고단백/심장 사료 비율을 낮추고 "
                f"초고소화성 가수분해 단백질 또는 백색육 화식 배합으로 전환하십시오."
            )
        elif amm == "주의(경도)":
            cal_prot = max(40.0, cal_prot - 4.0)
            tuning_log.append({
                "marker": "② 분변 암모니아/질소 (주의)",
                "result": "경도 증가",
                "effect": "소장 단백질 소화 한계 근접",
                "adjustment": "단백질 흡수율 -4% 미세 튜닝"
            })

        # =====================================================================
        # 마커 3: 분변 중성지방 및 유리지방산 (Fecal Fat / Steatorrhea)
        # =====================================================================
        fat_st = fecal_kit.fecal_fat
        if fat_st in ["중등도 (2+)", "강양성 (3+)"]:
            loss = 18.0 if fat_st == "중등도 (2+)" else 28.0
            cal_fat = max(30.0, cal_fat - loss)
            cal_overall = max(45.0, cal_overall - 10.0)
            tuning_log.append({
                "marker": "③ 분변 중성지방 (지방변)",
                "result": f"{fat_st} 양성",
                "effect": "지방 유실(Steatorrhea) 확인: 췌장 효소 부전 또는 담즙산 분비 장애로 지질 미셀화 실패",
                "adjustment": f"지방 흡수율 -{loss}% 하향, 칼로리 이용률 급감 반영"
            })
            clinical_actions.append(
                "지방 흡수 부전(Steatorrhea)이 확인되었습니다. 사료를 즉시 극저지방(Low-Fat < 10% DM)으로 처방하고, "
                "췌장 소화효소제(Pancreatic Enzyme) 보충을 시작하십시오."
            )
        elif fat_st == "약양성 (1+)":
            cal_fat = max(40.0, cal_fat - 7.0)
            cal_overall = max(45.0, cal_overall - 3.0)
            tuning_log.append({
                "marker": "③ 분변 중성지방 (1+)",
                "result": "약양성",
                "effect": "경미한 지방 흡수 지연",
                "adjustment": "지방 흡수율 -7% 보정"
            })

        # =====================================================================
        # 마커 4: 분변 잠혈 / 칼프로텍틴 유사 마커 (Fecal Occult Blood / TMB)
        # =====================================================================
        blood = fecal_kit.fecal_occult_blood
        if blood in ["양성 (+)", "강양성 (++)"]:
            loss = 15.0 if blood == "양성 (+)" else 25.0
            barrier = max(10.0, barrier - loss)
            cal_overall = max(40.0, cal_overall - 8.0)
            tuning_log.append({
                "marker": "④ 분변 잠혈/상피자극 (TMB)",
                "result": f"{blood} 반응",
                "effect": "장벽 융모 상피 손상 및 미세출혈로 장관 투과성(Permeability) 붕괴",
                "adjustment": f"장벽 온전성 점수 {barrier}점으로 하향, 총 생체이용률 페널티"
            })
            clinical_actions.append(
                "장점막 염증 및 장벽 손상이 존재합니다. 장벽이 안정화될 때까지 저알러지 아날러제닉 사료 및 "
                "장점막 보호제(글루타민, 프로바이오틱스)를 우선 처방하십시오."
            )

        # =====================================================================
        # 마커 5: 분변 칼슘 / 인 (Fecal Phosphate & Calcium) - Pair Matrix
        # =====================================================================
        f_phos = fecal_kit.fecal_phosphate
        b_phos = lab.phosphorus_mg_dl if (lab and lab.phosphorus_mg_dl) else None
        
        phos_risk = "정상 배출 (안정)"
        if f_phos in ["낮음 (Low)", "낮음 (Low - 체내 흡수 위험)"]:
            if b_phos and b_phos > 5.5:
                phos_risk = "🔴 최고 위험 (장내 결합 실패 & 체내 축적 가속)"
                clinical_actions.append(
                    "🚨 [인 통제 비상] 혈청 인이 높은 상태에서 분변 인 배출이 저하되어 있습니다. "
                    "장이 식이 내 인을 흡수하고 있으므로 장내 인 결합제(Phosphate Binder) 용량을 증량하고 "
                    "신장 처방식 비율을 극대화하십시오."
                )
                tuning_log.append({
                    "marker": "⑤ 분변 인 (Low) + 혈청 인 (High)",
                    "result": f"Fecal P Low, Blood P {b_phos} mg/dL",
                    "effect": "식이 내 인이 장에서 불용화 결합되지 않고 체내로 흡수되어 고인혈증 악화",
                    "adjustment": "인 체내 축적 위험도 최고 등급 상향"
                })
            else:
                phos_risk = "🟡 주의 (식이 인 흡수율 높음)"
                tuning_log.append({
                    "marker": "⑤ 분변 인 (Low)",
                    "result": "Fecal P Low",
                    "effect": "장내 인 배출량 부족",
                    "adjustment": "인 결합 상태 모니터링 필요"
                })
        elif f_phos == "높음 (High - 장내 배출 양호)" or f_phos == "높음 (High)":
            if b_phos and b_phos <= 5.5:
                phos_risk = "🟢 치료 성공 (장내 인 불용화 및 대변 배출 원활)"
                tuning_log.append({
                    "marker": "⑤ 분변 인 (High) + 혈청 인 (정상)",
                    "result": "Fecal P High, Blood P 안정",
                    "effect": "사료 내 인이 장에서 성공적으로 불용화 결합되어 대변으로 배출됨 (치료 목표 달성)",
                    "adjustment": "현재 신장 식이 및 인 결합 요법 유지"
                })
            else:
                phos_risk = "🟠 인 배설 진행 중 (혈중 인 모니터링)"

        # =====================================================================
        # 최종 보정 칼로리 및 급여량(g) 재계산
        # =====================================================================
        cal_prot = round(cal_prot, 1)
        cal_fat = round(cal_fat, 1)
        cal_carb = round(cal_carb, 1)
        cal_overall = round(cal_overall, 1)

        # Recalculate DER based on final calibrated overall absorption
        recalc_der = round((base_der_kcal / (cal_overall / 100.0)), 1)
        # Recalculate total grams
        recalc_total_g = round(base_total_g * (prior["prior_overall_absorb_pct"] / max(1.0, cal_overall)), 1)

        if not clinical_actions:
            clinical_actions.append("분변 키트 5대 마커가 모두 안정 범위로, 현재 믹스피딩 처방을 안전하게 유지할 수 있습니다.")

        return CalibrationResult(
            prior_protein_absorb_pct=prior["prior_protein_absorb_pct"],
            calibrated_protein_absorb_pct=cal_prot,
            prior_fat_absorb_pct=prior["prior_fat_absorb_pct"],
            calibrated_fat_absorb_pct=cal_fat,
            prior_carb_absorb_pct=prior["prior_carb_absorb_pct"],
            calibrated_carb_absorb_pct=cal_carb,
            prior_overall_absorb_pct=prior["prior_overall_absorb_pct"],
            calibrated_overall_absorb_pct=cal_overall,
            phosphorus_risk_level=phos_risk,
            gut_barrier_intact_pct=round(barrier, 1),
            recalculated_der_kcal=recalc_der,
            recalculated_total_g=recalc_total_g,
            clinical_actions=clinical_actions,
            tuning_log=tuning_log
        )

# Backward compatible helper class
class AbsorptionModel:
    @classmethod
    def estimate_absorption(cls, profile: PatientProfile) -> Dict[str, Any]:
        prior = BioavailabilityEngine.estimate_a_priori(profile)
        rate = prior["prior_overall_absorb_pct"] / 100.0
        return {
            "absorption_rate": rate,
            "absorption_percent": prior["prior_overall_absorb_pct"],
            "fecal_score": profile.fecal_score,
            "fecal_desc": f"Score {profile.fecal_score}",
            "penalties": [(item, "") for item in prior["prior_log"]],
            "clinical_interpretation": f"환자의 소화 흡수율은 약 {int(rate*100)}%로 추정됩니다."
        }
