"""
Patient Monitoring, Clinical Symptom Logging, and Blood Test Feedback Engine.
Includes slots for future Fecal Microbiome/Absorption Test Kits.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from datetime import datetime

@dataclass
class SymptomLog:
    log_date: str = field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    weight_kg: float = 5.0
    fecal_score: float = 3.5
    vomiting_count: int = 0
    leftover_percent: float = 0.0  # 0% = 전부 먹음, 50% = 절반 남김
    water_intake_ml: float = 250.0
    vitality_score: int = 5  # 1 (기력 없음) ~ 5 (매우 활발)
    notes: str = ""

@dataclass
class BloodLabTest:
    test_date: str = field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    bun_mg_dl: Optional[float] = None          # Ref: 개 7-27, 고양이 16-36
    creatinine_mg_dl: Optional[float] = None   # Ref: 개 0.5-1.4, 고양이 0.8-2.4
    sdma_ug_dl: Optional[float] = None         # Ref: < 14
    phosphorus_mg_dl: Optional[float] = None   # Ref: 2.5-5.5
    albumin_g_dl: Optional[float] = None       # Ref: 2.5-4.0
    alt_u_l: Optional[float] = None            # Ref: 개 10-100, 고양이 12-130
    alkp_u_l: Optional[float] = None           # Ref: 23-212
    lipase_or_cpl: Optional[float] = None      # Ref: Spec cPL < 200 ug/L
    sodium_mmol_l: Optional[float] = None      # Ref: 140-155
    potassium_mmol_l: Optional[float] = None   # Ref: 3.5-5.5

@dataclass
class FecalKitSlot:
    """Future feature slot for Fecal Bioavailability Kit"""
    test_date: str = field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    fat_absorption_efficiency_pct: Optional[float] = None     # e.g. 92%
    protein_digestibility_pct: Optional[float] = None         # e.g. 88%
    microbiome_diversity_score: Optional[float] = None        # e.g. 85 / 100
    dysbiosis_index: Optional[float] = None                   # e.g. < 0 is normal
    status: str = "미래 기획 슬롯 (준비중)"

class MonitoringEngine:
    @classmethod
    def evaluate_symptom_trend(cls, logs: List[SymptomLog]) -> Dict[str, Any]:
        """Analyze symptom patterns and generate warnings/recommendations."""
        if not logs:
            return {"status": "기록 없음", "alerts": [], "recommendations": []}

        latest = logs[-1]
        alerts = []
        recommendations = []

        # 1. Diarrhea / Fecal Score
        if latest.fecal_score >= 5.0:
            alerts.append(f"⚠️ [분변 이상] 최근 분변 스코어가 {latest.fecal_score}로 묽은변/설사 양상입니다.")
            recommendations.append("흡수율 저하가 예상되므로 흡수 보정 계수 하향(-15~25%) 및 가수분해/소화기 처방식 비율 상향을 권장합니다.")
        
        # 2. Vomiting
        if latest.vomiting_count >= 2:
            alerts.append(f"🚨 [구토 경고] 최근 1일 {latest.vomiting_count}회의 구토가 관찰되었습니다.")
            recommendations.append("급여량을 1회 대량 급여 대신 1일 3~4회 소량 분할 급여로 전환하고, 췌장염/위염 여부를 재평가하세요.")

        # 3. Leftover / Palatability
        if latest.leftover_percent >= 30.0:
            alerts.append(f"⚠️ [기호성/식욕 부진] 사료 잔여량이 {latest.leftover_percent}%로 식사량이 부족합니다.")
            recommendations.append("기호성 높은 습식 캔이나 수의 맞춤 화식 비율을 높여 필수 대사 에너지(DER) 섭취를 유도하세요.")

        # 4. Weight Trend (if multiple logs)
        if len(logs) >= 2:
            prev = logs[0]
            wt_diff = latest.weight_kg - prev.weight_kg
            wt_diff_pct = (wt_diff / prev.weight_kg) * 100
            if wt_diff_pct < -3.0:
                alerts.append(f"🚨 [체중 급감 경고] 초기 대비 체중이 {abs(round(wt_diff_pct, 1))}% 감소했습니다.")
                recommendations.append("에너지 공급 부족 또는 질환성 악액질이 우려됩니다. DER 계수 상향 조정을 검토하세요.")

        return {
            "latest_log": latest,
            "alerts": alerts,
            "recommendations": recommendations,
            "is_stable": len(alerts) == 0
        }

    @classmethod
    def evaluate_blood_lab(cls, lab: BloodLabTest) -> Dict[str, Any]:
        """Clinical blood panel interpretation and feeding feedback."""
        feedbacks = []
        risk_level = "정상/양호"

        # 1. Kidney Panel (BUN / Creatinine / SDMA / Phosphorus)
        if (lab.creatinine_mg_dl and lab.creatinine_mg_dl > 2.0) or (lab.sdma_ug_dl and lab.sdma_ug_dl > 18.0):
            risk_level = "주의/모니터링"
            feedbacks.append("🔴 [신장 수치 상승] Creatinine/SDMA 상승으로 신기능 저하(IRIS Stage 2~3 의심). 인(P)과 단백질을 더욱 엄격히 제한하고 습식 급여로 음수량을 늘리세요.")
        
        if lab.phosphorus_mg_dl and lab.phosphorus_mg_dl > 5.5:
            feedbacks.append("🔴 [고인혈증 경고] 혈청 인 수치가 높습니다. 인 흡착제 병용 및 초저인(Low-P) 처방식 전환이 시급합니다.")

        # 2. Albumin (Hypoalbuminemia)
        if lab.albumin_g_dl and lab.albumin_g_dl < 2.5:
            risk_level = "위험/조치 필요"
            feedbacks.append("🚨 [저알부민혈증] 알부민 저하(<2.5g/dL)로 PLE/간부전/신소실증 의심. 생물가가 높은 초고소화성 단백질 공급 및 극저지방식이 필수적입니다.")

        # 3. Pancreatitis Panel (cPL / Lipase)
        if lab.lipase_or_cpl and lab.lipase_or_cpl > 400.0:
            risk_level = "위험/조치 필요"
            feedbacks.append("🚨 [췌장염 수치 급상승] 췌장염 활성화 의심. 지방 함량이 10% 미만인 극저지방(Ultra Low Fat) 처방식 단독 급여를 권장합니다.")

        # 4. Liver Panel (ALT / ALKP)
        if lab.alt_u_l and lab.alt_u_l > 250.0:
            feedbacks.append("🟠 [간세포 손상] ALT 수치 상승. 구리(Cu) 함량이 낮은 단백질원 및 항산화제/타우린 보충을 권장합니다.")

        # 5. Electrolytes (Potassium)
        if lab.potassium_mmol_l and lab.potassium_mmol_l < 3.5:
            feedbacks.append("🟡 [저칼륨혈증] 이뇨제 또는 신부전성 칼륨 소실 의심. 칼륨 보충 사료 또는 보조제 투여를 고려하세요.")
        elif lab.potassium_mmol_l and lab.potassium_mmol_l > 5.8:
            feedbacks.append("🔴 [고칼륨혈증] 칼륨 배설 저하 위험. 고칼륨 식단 제한 필요.")

        if not feedbacks:
            feedbacks.append("✅ 혈액 검사 주요 수치가 목표 안전 범위 내에서 안정적으로 유지되고 있습니다.")

        return {
            "risk_level": risk_level,
            "feedbacks": feedbacks
        }
