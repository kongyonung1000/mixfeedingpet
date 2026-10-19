# -*- coding: utf-8 -*-
"""
수의 임상 장내환경 가중치 결합 모델 및 원인 분해(Differential Attribution) CDSS 엔진
기반 문헌 및 데이터:
1. 장내환경 변수에 따른 가중치 상관관계.xlsx (변수기준, 마커기준, 정상범위)
2. 믹스피딩 가중치의 근거.docx (다차원 감쇠 결합 수식, 지표별 민감도 매트릭스, 5단계 등급화 및 처방 피드백)
"""
from typing import Dict, List, Tuple, Optional, Any
import os
import openpyxl

MARKERS = ["ph", "ammonia", "indole", "lactate", "blood", "protein", "carbo", "fat", "absorption"]

MARKER_INFO = {
    "ph": {"name": "추정 pH", "unit": "-", "base": 6.5, "min": 6.0, "max": 7.0, "direction": "both", "desc": "산성화(<5.8) or 알칼리화(>7.5) 시 이상"},
    "ammonia": {"name": "추정 암모니아 (NH₃)", "unit": "μmol/g", "base": 20.0, "min": 10.0, "max": 30.0, "direction": "high", "desc": "초과 시 단백질 부패 발효"},
    "indole": {"name": "추정 인돌 (Indole)", "unit": "μg/g", "base": 15.0, "min": 5.0, "max": 25.0, "direction": "high", "desc": "초과 시 유해균 증식 및 요독 전구물질"},
    "lactate": {"name": "추정 젖산 (Lactate)", "unit": "mmol/g", "base": 8.0, "min": 5.0, "max": 12.0, "direction": "low", "desc": "저하 시 유익균총 감소"},
    "blood": {"name": "추정 잠혈 (Occult Blood)", "unit": "ng/mL", "base": 0.0, "min": 0.0, "max": 10.0, "direction": "high", "desc": "양성(≥10 검출) 시 점막 손상/출혈"},
    "protein": {"name": "미소화 단백질", "unit": "% (DM)", "base": 5.0, "min": 2.0, "max": 8.0, "direction": "high", "desc": "초과 시 단백질 소화 흡수 장애"},
    "carbo": {"name": "미소화 탄수화물", "unit": "% (DM)", "base": 6.0, "min": 3.0, "max": 10.0, "direction": "high", "desc": "초과 시 탄수화물 소화 흡수 장애"},
    "fat": {"name": "미소화 지방", "unit": "% (DM)", "base": 4.0, "min": 1.0, "max": 7.0, "direction": "high", "desc": "초과 시 지방 흡수 불량 (EPI, 췌장염, 담즙 정체)"},
    "absorption": {"name": "추정 흡수율", "unit": "%", "base": 85.0, "min": 80.0, "max": 95.0, "direction": "low", "desc": "저하 시 영양 결핍/흡수 부전"}
}

IMPORTANCE = {
    "ph": 1.0,
    "ammonia": 1.5,
    "indole": 1.5,
    "lactate": 1.2,
    "blood": 2.5,
    "protein": 1.2,
    "carbo": 1.0,
    "fat": 1.4,
    "absorption": 1.8
}

# 시트2: 마커기준 (검사 지표별 카테고리 민감도 매트릭스 C_k)
CATEGORY_SENSITIVITY = {
    "ph":         {"age": 0.8, "size": 0.6, "diet": 1.5, "drug": 1.0, "disease": 1.2},
    "ammonia":    {"age": 1.0, "size": 0.8, "diet": 1.4, "drug": 1.1, "disease": 1.6},
    "indole":     {"age": 0.9, "size": 0.8, "diet": 1.3, "drug": 1.1, "disease": 1.6},
    "lactate":    {"age": 1.1, "size": 0.7, "diet": 1.6, "drug": 1.2, "disease": 1.1},
    "blood":      {"age": 0.6, "size": 0.5, "diet": 0.5, "drug": 1.8, "disease": 2.0},
    "protein":    {"age": 1.0, "size": 0.8, "diet": 1.5, "drug": 1.2, "disease": 1.8},
    "carbo":      {"age": 1.0, "size": 0.8, "diet": 1.5, "drug": 1.2, "disease": 1.8},
    "fat":        {"age": 1.0, "size": 0.8, "diet": 1.5, "drug": 1.2, "disease": 1.8},
    "absorption": {"age": 1.1, "size": 0.9, "diet": 1.2, "drug": 1.3, "disease": 1.7}
}

def _w(ph, amm, ind, lac, bld, pro, car, fat, abs_r) -> Dict[str, float]:
    return {
        "ph": ph, "ammonia": amm, "indole": ind, "lactate": lac,
        "blood": bld, "protein": pro, "carbo": car, "fat": fat, "absorption": abs_r
    }

# 시트1: 변수기준 전체 가중치 매트릭스
AGE_WEIGHTS = {
    "1년령 이하 (성장기)": _w(0.95, 0.85, 0.80, 1.30, 1.00, 1.15, 1.10, 1.10, 0.90),
    "1년 ~ 7년 (성견 기준)": _w(1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00),
    "7년령 이상 (노령기)": _w(1.05, 1.25, 1.20, 0.85, 1.10, 1.20, 1.15, 1.25, 0.85)
}

SIZE_WEIGHTS = {
    "소형견 (<10kg)": _w(0.98, 0.90, 0.90, 1.10, 1.00, 0.95, 0.95, 0.95, 1.05),
    "중형견 (10~25kg, 기준)": _w(1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00),
    "대형견 (>25kg)": _w(1.05, 1.20, 1.25, 0.90, 1.05, 1.15, 1.10, 1.10, 0.92)
}

DIET_NUTRIENT_WEIGHTS = {
    "고단백사료": _w(1.08, 1.45, 1.40, 0.85, 1.00, 1.30, 0.80, 1.05, 0.98),
    "저단백사료": _w(0.94, 0.70, 0.70, 1.15, 1.00, 0.70, 1.15, 1.00, 1.02),
    "중단백사료 (표준)": _w(1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00),
    "저지방사료": _w(0.98, 0.95, 0.95, 1.05, 1.00, 1.00, 1.10, 0.60, 1.03),
    "고탄수화물사료": _w(0.92, 0.75, 0.75, 1.35, 1.00, 0.85, 1.35, 0.90, 0.95),
    "가수분해사료": _w(1.00, 0.85, 0.85, 1.05, 0.95, 0.80, 0.95, 0.95, 1.10)
}

DIET_FORM_WEIGHTS = {
    "건식 (표준)": _w(1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00),
    "습식 (캔/파우치)": _w(1.04, 1.15, 1.10, 0.95, 1.00, 1.05, 0.85, 1.10, 1.05),
    "화식 (신선식)": _w(1.02, 1.05, 1.00, 1.00, 1.00, 0.90, 0.90, 0.95, 1.08),
    "간식 (트릿/육포 등)": _w(1.10, 1.35, 1.30, 0.80, 1.00, 1.25, 0.85, 1.20, 0.92)
}

DRUG_WEIGHTS = {
    "NSAIDs": _w(1.02, 1.05, 1.05, 0.95, 1.80, 1.10, 1.00, 1.00, 0.95),
    "소화제 (소화효소/위장관조절제)": _w(0.98, 0.90, 0.90, 1.05, 1.00, 0.80, 0.80, 0.80, 1.15),
    "심장약 (이뇨제/ACEi/피모벤단)": _w(1.02, 1.10, 1.05, 0.95, 1.00, 1.05, 1.05, 1.10, 0.92),
    "신장약 (인바인더/요독소흡착제 등)": _w(0.98, 0.75, 0.75, 1.00, 1.05, 1.05, 1.00, 1.00, 0.95),
    "간약 (UDCA/SAMe/실리마린)": _w(0.97, 0.90, 0.90, 1.05, 1.00, 0.95, 0.95, 0.85, 1.08),
    "간질약 (Phenobarbital/KBr/Pexion)": _w(1.00, 1.05, 1.05, 0.95, 1.00, 1.05, 1.05, 1.05, 0.95),
    "기관지 폐 약 (기관지확장제/진해제)": _w(1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00),
    "스테로이드 (Prednisolone 등)": _w(1.05, 1.15, 1.15, 0.90, 1.50, 1.15, 1.10, 1.20, 0.88),
    "관절염, 디스크약 (진통소염/신경통약)": _w(1.02, 1.05, 1.05, 0.95, 1.40, 1.05, 1.00, 1.00, 0.95),
    "쿠싱약 (Trilostane)": _w(1.00, 1.05, 1.05, 1.00, 1.05, 1.05, 1.05, 1.10, 0.95),
    "에디슨약 (Fludrocortisone/DOCP)": _w(1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00),
    "갑상선기능항진증약 (Methimazole)": _w(1.02, 1.05, 1.05, 0.95, 1.00, 1.05, 1.05, 1.05, 0.95),
    "갑상선기능저하증약 (Levothyroxine)": _w(0.98, 0.95, 0.95, 1.05, 1.00, 0.95, 0.95, 0.95, 1.05),
    "항암제 (Cytotoxic agents)": _w(1.10, 1.35, 1.30, 0.80, 1.70, 1.30, 1.25, 1.35, 0.75),
    "피부병약 (항생제/항히스타민/Apoquel)": _w(1.04, 1.15, 1.15, 0.90, 1.05, 1.10, 1.05, 1.05, 0.95),
    "해당없음 (정상 대조군)": _w(1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00)
}

DISEASE_WEIGHTS = {
    "MMVD stage A, B": _w(1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00),
    "MMVD stage C, D": _w(1.04, 1.20, 1.15, 0.90, 1.25, 1.15, 1.10, 1.20, 0.85),
    "HCM A, B": _w(1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00),
    "HCM C, D": _w(1.04, 1.20, 1.15, 0.90, 1.20, 1.15, 1.10, 1.20, 0.85),
    "폐성고혈압": _w(1.03, 1.15, 1.10, 0.95, 1.15, 1.10, 1.05, 1.15, 0.88),
    "기타 심장병(PDA 등)": _w(1.02, 1.10, 1.05, 0.95, 1.10, 1.05, 1.05, 1.10, 0.92),
    "CKD stage 1, 2": _w(1.02, 1.15, 1.15, 0.95, 1.05, 1.05, 1.00, 1.05, 0.95),
    "CKD stage 3, 4": _w(1.08, 1.55, 1.50, 0.80, 1.30, 1.20, 1.10, 1.15, 0.82),
    "만성췌장염": _w(1.06, 1.25, 1.20, 0.85, 1.20, 1.40, 1.30, 1.65, 0.65),
    "만성담낭염": _w(1.04, 1.15, 1.10, 0.95, 1.10, 1.10, 1.05, 1.45, 0.80),
    "IBD (염증성장질환)": _w(1.08, 1.45, 1.40, 0.75, 1.85, 1.45, 1.35, 1.40, 0.60),
    "만성 폐렴": _w(1.02, 1.10, 1.05, 0.95, 1.05, 1.05, 1.05, 1.05, 0.95),
    "만성기관지염": _w(1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00),
    "천식": _w(1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00),
    "만성간질환": _w(1.06, 1.40, 1.30, 0.90, 1.25, 1.20, 1.10, 1.45, 0.78),
    "쿠싱 (부신피질기능항진)": _w(1.03, 1.15, 1.10, 0.95, 1.20, 1.15, 1.10, 1.15, 0.90),
    "에디슨 (부신피질기능저하)": _w(1.02, 1.10, 1.05, 0.95, 1.15, 1.10, 1.05, 1.10, 0.90),
    "갑상선기능항진증": _w(0.98, 1.15, 1.10, 1.10, 1.10, 1.15, 1.15, 1.15, 0.88),
    "갑상선기능저하증": _w(1.02, 1.05, 1.05, 0.95, 1.00, 1.05, 1.05, 1.15, 0.92),
    "관절염": _w(1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00),
    "디스크": _w(1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00),
    "요로결석": _w(1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00),
    "담낭점액종": _w(1.05, 1.15, 1.15, 0.95, 1.10, 1.10, 1.05, 1.50, 0.78),
    "담낭슬러지 25%이상": _w(1.03, 1.08, 1.05, 0.98, 1.05, 1.05, 1.00, 1.25, 0.88),
    "담낭결석": _w(1.04, 1.10, 1.10, 0.95, 1.05, 1.05, 1.00, 1.35, 0.85),
    "만성외이염 (알러지 기반)": _w(1.02, 1.08, 1.08, 0.98, 1.05, 1.05, 1.00, 1.00, 0.96),
    "뇌질환 (뇌수막염/경색 등)": _w(1.00, 1.05, 1.05, 0.98, 1.05, 1.05, 1.05, 1.05, 0.95),
    "종양 (전신/악성)": _w(1.08, 1.35, 1.30, 0.80, 1.60, 1.30, 1.20, 1.25, 0.75),
    "해당없음 (정상)": _w(1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00)
}


class GutEnvironmentCDSS:
    """
    4대 축(연령/체급, 식이 믹스피딩, 약물, 질병) 가중치 결합 및
    실측 분변 마커 원인 분해(Attribution) & 처방 피드백 엔진
    """
    def __init__(self, attenuation_alpha: float = 0.40):
        self.alpha = attenuation_alpha

    def get_age_weight(self, age_years: float) -> Tuple[str, Dict[str, float]]:
        if age_years <= 1.0:
            label = "1년령 이하 (성장기)"
        elif age_years < 7.0:
            label = "1년 ~ 7년 (성견 기준)"
        else:
            label = "7년령 이상 (노령기)"
        return label, AGE_WEIGHTS[label]

    def get_size_weight(self, weight_kg: float) -> Tuple[str, Dict[str, float]]:
        if weight_kg < 10.0:
            label = "소형견 (<10kg)"
        elif weight_kg <= 25.0:
            label = "중형견 (10~25kg, 기준)"
        else:
            label = "대형견 (>25kg)"
        return label, SIZE_WEIGHTS[label]

    def _attenuate_deltas(self, weight_dicts: List[Dict[str, float]], marker: str) -> float:
        """
        복합 질환 및 복합 약물 감쇠 결합 (주 요인 100%, 부차 요인 40% 감쇠)
        """
        if not weight_dicts:
            return 0.0
        deltas = [d.get(marker, 1.0) - 1.0 for d in weight_dicts]
        deltas.sort(key=lambda x: abs(x), reverse=True)
        total_delta = deltas[0]
        for d in deltas[1:]:
            total_delta += self.alpha * d
        return total_delta

    def compute_expected_baseline(
        self,
        age_years: float,
        weight_kg: float,
        diet_weights_with_ratios: List[Tuple[Dict[str, float], float]],
        selected_drugs: List[str],
        selected_diseases: List[str]
    ) -> Dict[str, Any]:
        """
        환자 맞춤형 장내환경 9대 마커 예상 기준치(Expected Baseline) 및 요인별 기여도 산출
        """
        age_label, age_w = self.get_age_weight(age_years)
        size_label, size_w = self.get_size_weight(weight_kg)

        # 식이 믹스피딩 가중평균 산출
        diet_w = {m: 1.0 for m in MARKERS}
        if diet_weights_with_ratios:
            total_ratio = sum(r for _, r in diet_weights_with_ratios) or 1.0
            for m in MARKERS:
                diet_w[m] = sum(dw.get(m, 1.0) * (r / total_ratio) for dw, r in diet_weights_with_ratios)

        drug_w_list = [DRUG_WEIGHTS[d] for d in selected_drugs if d in DRUG_WEIGHTS]
        dis_w_list = [DISEASE_WEIGHTS[d] for d in selected_diseases if d in DISEASE_WEIGHTS]

        markers_baseline = {}
        for m in MARKERS:
            c_map = CATEGORY_SENSITIVITY[m]
            raw_age = age_w[m] - 1.0
            raw_size = size_w[m] - 1.0
            # 연령/체급 결합
            d_age_size_raw = raw_age + raw_size
            d_diet_raw = diet_w[m] - 1.0
            d_drug_raw = self._attenuate_deltas(drug_w_list, m)
            d_dis_raw = self._attenuate_deltas(dis_w_list, m)

            # W_total 산출 (문헌 단락 936~943 수식 반영)
            if m in ["ammonia", "indole"] and d_drug_raw < 0 and d_diet_raw < 0:
                # 식이 저단백 및 신장약 방어 시 요독소 기대 상한 보정
                w_total = 1.0 + d_age_size_raw + (0.35 * d_diet_raw) + (0.35 * d_drug_raw) + d_dis_raw
            elif m == "absorption":
                w_total = 1.0 + (0.5 * d_age_size_raw) + d_diet_raw + d_drug_raw + (0.55 * d_dis_raw)
            else:
                w_total = 1.0 + d_age_size_raw + d_diet_raw + d_drug_raw + d_dis_raw

            # Safety clipping
            if m == "absorption":
                w_total = max(0.55, min(1.15, w_total))
            else:
                w_total = max(0.50, min(2.50, w_total))

            info = MARKER_INFO[m]
            base_val = info["base"]
            if m == "blood":
                expected_val = round(max(0.0, (w_total - 1.0) * 10.0), 1)
                expected_upper = round(max(10.0, 10.0 * w_total), 1)
            elif m in ["ammonia", "indole"]:
                expected_val = round(base_val * w_total, 1)
                expected_upper = round(info["max"] * (1.0 + max(0.0, w_total - 1.0) * 0.45), 1)
                expected_val = max(expected_val, expected_upper)
            elif m == "fat":
                expected_val = round(base_val * w_total * 1.18, 1)
                expected_upper = expected_val
            else:
                expected_val = round(base_val * w_total, 2 if m == "ph" else 1)
                expected_upper = round(info["max"] * w_total, 1)

            # 카테고리 민감도(C_k)가 반영된 원인 기여 편차
            weighted_age_size = ((c_map["age"] * abs(raw_age)) + (c_map["size"] * abs(raw_size)))
            weighted_diet = c_map["diet"] * abs(d_diet_raw)
            weighted_drug = c_map["drug"] * abs(d_drug_raw)
            weighted_dis = c_map["disease"] * abs(d_dis_raw)

            abs_sum = weighted_age_size + weighted_diet + weighted_drug + weighted_dis
            if abs_sum > 0.001:
                pct_age_size = round((weighted_age_size / abs_sum) * 100, 1)
                pct_diet = round((weighted_diet / abs_sum) * 100, 1)
                pct_drug = round((weighted_drug / abs_sum) * 100, 1)
                pct_dis = round(max(0.0, 100.0 - pct_age_size - pct_diet - pct_drug), 1)
            else:
                pct_age_size, pct_diet, pct_drug, pct_dis = 25.0, 25.0, 25.0, 25.0

            markers_baseline[m] = {
                "name": info["name"],
                "unit": info["unit"],
                "base_norm": base_val,
                "normal_min": info["min"],
                "normal_max": info["max"],
                "w_total": round(w_total, 2),
                "expected_val": expected_val,
                "expected_upper": expected_upper,
                "deltas": {
                    "age_size": round(d_age_size_raw, 3),
                    "diet": round(d_diet_raw, 3),
                    "drug": round(d_drug_raw, 3),
                    "disease": round(d_dis_raw, 3)
                },
                "weighted_sens": {
                    "age_size": round(weighted_age_size, 3),
                    "diet": round(weighted_diet, 3),
                    "drug": round(weighted_drug, 3),
                    "disease": round(weighted_dis, 3)
                },
                "factor_shares_pct": {
                    "age_size": pct_age_size,
                    "diet": pct_diet,
                    "drug": pct_drug,
                    "disease": pct_dis
                }
            }

        return {
            "age_label": age_label,
            "size_label": size_label,
            "markers": markers_baseline
        }

    def evaluate_and_attribute(
        self,
        measurements: Dict[str, float],
        baseline_result: Dict[str, Any],
        selected_drugs: List[str],
        selected_diseases: List[str]
    ) -> Dict[str, Any]:
        """
        실측치(9대 분변 마커)와 환자 맞춤형 기대 기준치(Expected Baseline) 비교,
        5대 원인(식이 / 약물 / 질병 / 연령·체급 / 기타 초과요인) 기여도 분해 및 임상 솔루션 도출
        """
        markers_base = baseline_result["markers"]
        total_penalty = 0.0
        max_possible_penalty = 80.0
        abnormal_tags = []
        marker_evaluations = {}

        # 전체 원인 기여도 누적용 가중합
        cause_scores = {"diet": 0.0, "drug": 0.0, "disease": 0.0, "age_size": 0.0, "other_excess": 0.0}

        for m in MARKERS:
            mb = markers_base[m]
            info = MARKER_INFO[m]
            meas = measurements.get(m, mb["expected_val"])
            expected = mb["expected_val"]
            norm_max = info["max"]
            norm_min = info["min"]
            imp = IMPORTANCE[m]
            ws = mb["weighted_sens"]

            status = "정상 범위"
            status_code = "NORMAL"
            penalty = 0.0
            interpretation = "정상 생리 범위 내 안정 유지"

            if m == "blood":
                exp_limit = mb["expected_upper"]
                if meas >= 10.0:
                    if meas <= exp_limit:
                        status = "기대 경계 내 (약물/질병 영향)"
                        status_code = "COMPENSATED"
                        penalty = min(18.0, (meas / 15.0) * 6.0 * imp)
                        interpretation = f"양성 검출({meas} ng/mL)되었으나 복용 약물/기저 질환 가중치 상한({exp_limit}) 이내로 식이 외 요인 우세"
                    else:
                        status = "기대치 초과 검출 (위험)"
                        status_code = "DECOMPENSATED"
                        penalty = min(35.0, (meas / 15.0) * 10.0 * imp)
                        interpretation = f"환자 기대 상한({exp_limit} ng/mL)마저 초과한 점막 손상/출혈 소견"
                    abnormal_tags.append("장 점막 손상/미세출혈")
            elif m == "absorption":
                if meas < expected:
                    diff = (expected - meas) / max(1.0, expected)
                    penalty = diff * 115.0 * imp
                    status = "기대치 미달 (흡수 부전 심화)"
                    status_code = "DECOMPENSATED"
                    interpretation = f"환자 맞춤 기대치({expected}%)보다도 추가 하락하여 실질 영양 결핍 위험"
                    abnormal_tags.append("영양소 흡수 부전")
                elif meas < norm_min:
                    status = "기대 범위 내 방어 중 (선방)"
                    status_code = "COMPENSATED"
                    interpretation = f"정상견 기준({norm_min}%)보다는 낮으나 질환/연령 감안 기대치({expected}%) 이상으로 방어 중"
            elif m == "lactate":
                if meas < expected and meas < norm_min:
                    diff = (expected - meas) / max(1.0, expected)
                    penalty = diff * 30.0 * imp
                    status = "유익균 발효능 저하"
                    status_code = "DECOMPENSATED"
                    interpretation = f"기대치({expected}) 미달로 장내 유익균총 및 단쇄지방산 생성 저하"
                    abnormal_tags.append("유익균총/발효능 저하")
                elif meas < norm_min:
                    status = "기대 범위 내 유지"
                    status_code = "COMPENSATED"
                    interpretation = f"정상 기준({norm_min}) 대비 낮으나 현재 식이/약물 조건의 기대치({expected}) 부합"
            elif m == "ph":
                if meas < 5.8:
                    penalty = ((5.8 - meas) / 5.8) * 35.0 * imp
                    status = "산성화 과발효 이상"
                    status_code = "DECOMPENSATED"
                    interpretation = "탄수화물/전분 미소화로 인한 대장 내 산성 과발효 진행"
                    abnormal_tags.append("탄수화물 과발효/산성변")
                elif meas > max(7.4, expected + 0.3):
                    penalty = ((meas - expected) / expected) * 35.0 * imp
                    status = "알칼리화 부패 이상"
                    status_code = "DECOMPENSATED"
                    interpretation = "단백질 부패 발효 및 암모니아 축적에 의한 알칼리화"
                    abnormal_tags.append("단백질 부패 발효/독소 축적")
                elif meas > 7.0 and meas <= expected + 0.3:
                    status = "기대 범위 내 방어 중"
                    status_code = "COMPENSATED"
                    interpretation = f"정상 상한(7.0)을 넘었으나 기저 질환 기대치({expected}) 이내로 통제 중"
            else:
                # ammonia, indole, protein, carbo, fat (높을수록 이상)
                if meas > expected and meas > norm_max:
                    diff = (meas - expected) / max(1.0, expected)
                    penalty = diff * 55.0 * imp
                    status = "기대치 초과 이상 (집중 교정 대상)"
                    status_code = "DECOMPENSATED"
                    interpretation = f"환자 맞춤 기대치({expected}{info['unit']})마저 초과! 현재 식이/효소 용량의 소화 한계 초과"
                    if m in ["ammonia", "indole"]:
                        abnormal_tags.append("단백질 부패 발효/독소 축적")
                    elif m == "fat":
                        abnormal_tags.append("지방 소화불량/담즙·췌장 부전 심화")
                    elif m == "protein":
                        abnormal_tags.append("단백질 소화 흡수 불량")
                    elif m == "carbo":
                        abnormal_tags.append("탄수화물 소화 흡수 불량")
                elif meas > norm_max and meas <= expected:
                    status = "기대 범위 내 방어 중 (선방!)"
                    status_code = "COMPENSATED"
                    interpretation = f"정상견 상한({norm_max})은 넘었으나 질환/연령 기대치({expected}) 이내로 양호하게 방어 중"

            total_penalty += penalty

            # 이상 소견이 있거나 정상 범위를 벗어난 마커의 원인 기여도 누적 (카테고리 민감도 C_k 반영)
            if status_code in ["COMPENSATED", "DECOMPENSATED"]:
                w_weight = imp * (1.8 if status_code == "DECOMPENSATED" else 0.7)
                pos_diet = max(0.05, ws["diet"])
                pos_drug = max(0.05, ws["drug"])
                pos_dis = max(0.05, ws["disease"])
                pos_age = max(0.05, ws["age_size"])
                pos_other = 0.25 if status_code == "DECOMPENSATED" else 0.05
                if status_code == "DECOMPENSATED" and m in ["fat", "protein", "carbo", "ph"]:
                    pos_diet += 0.65
                tot_pos = pos_diet + pos_drug + pos_dis + pos_age + pos_other
                cause_scores["diet"] += w_weight * (pos_diet / tot_pos)
                cause_scores["drug"] += w_weight * (pos_drug / tot_pos)
                cause_scores["disease"] += w_weight * (pos_dis / tot_pos)
                cause_scores["age_size"] += w_weight * (pos_age / tot_pos)
                cause_scores["other_excess"] += w_weight * (pos_other / tot_pos)

            marker_evaluations[m] = {
                "measured": meas,
                "expected": expected,
                "status": status,
                "status_code": status_code,
                "penalty": round(penalty, 1),
                "interpretation": interpretation
            }

        score = max(0.0, round(100.0 - min(max_possible_penalty, total_penalty), 1))
        abnormal_tags = list(dict.fromkeys(abnormal_tags))

        if score >= 85:
            grade, grade_name = 1, "최적 (Optimal)"
        elif score >= 70:
            grade, grade_name = 2, "경미한 불균형 (Mild Dysbiosis)"
        elif score >= 55:
            grade, grade_name = 3, "주의 (Moderate Imbalance)"
        elif score >= 40:
            grade, grade_name = 4, "경고 (Severe Dysbiosis)"
        else:
            grade, grade_name = 5, "위험 (Critical / Leaky Gut)"

        # 5대 원인 기여도 백분율 정규화
        tot_cause = sum(cause_scores.values())
        if tot_cause > 0.001:
            attribution_pct = {k: round((v / tot_cause) * 100, 1) for k, v in cause_scores.items()}
        else:
            attribution_pct = {"diet": 25.0, "drug": 15.0, "disease": 30.0, "age_size": 20.0, "other_excess": 10.0}

        # 임상 코멘트 및 3대 솔루션(믹스피딩 재조정, 타깃 영양제, 수의사 처치) 도출
        ai_comments = []
        diet_actions = []
        supplement_actions = []
        vet_actions = []

        amm_ev = marker_evaluations["ammonia"]
        ind_ev = marker_evaluations["indole"]
        fat_ev = marker_evaluations["fat"]
        abs_ev = marker_evaluations["absorption"]
        bld_ev = marker_evaluations["blood"]
        ph_ev = marker_evaluations["ph"]

        if amm_ev["status_code"] == "COMPENSATED" and ind_ev["status_code"] == "COMPENSATED":
            ai_comments.append(
                f"정상 성견 기준으로는 암모니아({amm_ev['measured']} μmol/g)와 인돌({ind_ev['measured']} μg/g)이 상승해 있으나, "
                f"기저 질환 및 연령 가중치가 반영된 환자 맞춤 기대치({amm_ev['expected']} / {ind_ev['expected']}) 이내로 방어 중입니다. "
                f"현재 단백질 제한 및 장내 요독소 흡착 관리가 훌륭히 작동하고 있습니다."
            )
        elif amm_ev["status_code"] == "DECOMPENSATED" or ind_ev["status_code"] == "DECOMPENSATED":
            ai_comments.append(
                f"암모니아({amm_ev['measured']}) 또는 인돌({ind_ev['measured']})이 환자 맞춤 기대 상한({amm_ev['expected']} / {ind_ev['expected']})마저 초과했습니다. "
                f"소장 내 미소화 단백질이 대장으로 유입되어 부패 발효(Putrefaction) 및 요독소 생성을 가속화하고 있습니다."
            )
            diet_actions.append("고단백/일반 사료 및 육류 간식(트릿/육포)을 즉시 중단하고, 초고소화성 가수분해 단백질 또는 저단백 처방식 비율을 +20% 상향하십시오.")
            supplement_actions.append("[최우선 추가] 장-신장 축 타깃 요독소 분해 프로바이오틱스(레날맥스 등 S. thermophilus / L. acidophilus) 및 프리바이오틱스(락툴로오스/이눌린) 증량")
            vet_actions.append("혈중 BUN, Creatinine, SDMA 및 인(P) 수치를 재평가하고 구강 요독소 흡착제(크레메진/레날어드밴스 등) 용량 증량을 검토하십시오.")

        if fat_ev["status_code"] == "DECOMPENSATED" or abs_ev["status_code"] == "DECOMPENSATED":
            ai_comments.append(
                f"미소화 지방({fat_ev['measured']}% DM)이 환자 맞춤 기대치({fat_ev['expected']}%)마저 돌파하고 흡수율({abs_ev['measured']}%)이 기대치({abs_ev['expected']}%) 아래로 하락했습니다. "
                f"신장 처방식(k/d, 레날 등)의 높은 지방 함량 또는 췌장/담낭 기능 저하로 인해 현재 외인성 소화효소 용량의 한계를 넘어선 상태입니다."
            )
            diet_actions.append("처방식 믹스피딩 비율 재조정: [극저지방 소화기 사료(i/d Low Fat / GI Low Fat) 70% : 신장 처방식(k/d / Renal) 30%] 비율로 저지방 사료 비중을 상향하고, 부족한 열량은 중쇄지방산(MCT 오일)이나 탄수화물로 보충하십시오.")
            supplement_actions.append("[용량 증량] 고역가 췌장 소화효소제(판크레아틴/Lipase 강화 제품) 현 용량 대비 1.5배 증량 및 크릴오일(인지질 결합형 오메가-3)로 교체")
            vet_actions.append("만성 췌장염 및 담즙 정체 악화 여부를 감별하기 위해 혈중 cPL(개 췌장특이리파아제) 수치 및 복부 초음파(췌장 실질/담낭 슬러지) 재검을 권장합니다.")

        if bld_ev["measured"] >= 10.0:
            ai_comments.append(
                f"분변 잠혈이 {bld_ev['measured']} ng/mL 검출되었습니다(환자 기대 상한 { markers_base['blood']['expected_upper']} ng/mL). "
                f"카테고리 민감도 분석 결과 식이 요인보다는 복용 약물(NSAIDs/스테로이드 등) 또는 기저 질환(요독성 위장염/IBD)의 영향이 지배적입니다."
            )
            supplement_actions.append("[점막 보호 추가] 장 상피세포 재생을 위한 L-글루타민(L-Glutamine), 아연-카르노신 및 점막 보호 보충제 병용")
            vet_actions.append("위장관 미세출혈 제어를 위해 위장관 점막보호제(Sucralfate 0.5~1g TID) 또는 위산분비억제제(Omeprazole) 단기 처방을 고려하고, NSAIDs 복용 중이라면 휴약 또는 Coxib 계열/항체 주사제(Librela 등) 대체를 검토하십시오.")

        if ph_ev["status_code"] == "DECOMPENSATED":
            if ph_ev["measured"] < 5.8:
                diet_actions.append("분변 산성화(pH < 5.8) 교정: 난소화성 전분/과도한 탄수화물 비율을 낮추고 수용성·불용성 복합 섬유소 밸런스를 조정하십시오.")
            else:
                diet_actions.append("분변 알칼리화(pH > 7.4) 교정: 단백질 부패 억제를 위해 발효성 섬유소(베타글루칸, 프락토올리고당)를 보강하여 장내 pH를 약산성(6.2~6.8)으로 유도하십시오.")

        if not ai_comments:
            ai_comments.append("9대 장내환경 마커가 모두 환자 맞춤형 기대 기준치 이내에서 안정적으로 관리되고 있습니다. 현재의 믹스피딩 비율과 투약 스케줄이 환견의 소화·대사 능력과 잘 조화되고 있습니다.")
        if not diet_actions:
            diet_actions.append("현재 급여 중인 처방사료 믹스피딩 배합 비율이 환자의 장내 환경과 최적의 균형을 이루고 있으므로 현 식단을 유지하십시오.")
        if not supplement_actions:
            supplement_actions.append("[현 용량 유지] 현재 급여 중인 유산균 및 질환 맞춤 보조제 용량을 그대로 유지하십시오.")
        if not vet_actions:
            vet_actions.append("장내환경 마커상 급성 점막 손상이나 비보상성 소화 부전 소견이 없으므로, 정기 추적 검사(4~8주 간격)를 유지하십시오.")

        return {
            "score": score,
            "grade": grade,
            "grade_label": f"Grade {grade} ({grade_name})",
            "abnormal_tags": abnormal_tags,
            "attribution_pct": attribution_pct,
            "marker_evaluations": marker_evaluations,
            "ai_comments": ai_comments,
            "diet_actions": diet_actions,
            "supplement_actions": supplement_actions,
            "vet_actions": vet_actions
        }

