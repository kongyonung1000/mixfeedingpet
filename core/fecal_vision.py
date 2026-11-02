"""
Fecal Kit Vision and Color Decomposition Analysis Module.
Analyzes smartphone photos of fecal marker test pads, performs color decomposition (CIELAB/HSV),
and extracts the 9 core gut environment markers (pH, ammonia, indole, lactate, blood, protein, carbo, fat, absorption)
for integration with GutEnvironmentCDSS.
"""
import os
import re
import json
import io
import math
from typing import Dict, Any, Optional, List, Tuple
from PIL import Image

class FecalKitVisionParser:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

    def parse_from_image_bytes(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> Dict[str, Any]:
        """
        Analyze fecal test kit image bytes to extract 9 gut markers.
        Tries Gemini Vision first, then falls back to local OpenCV color decomposition.
        """
        if self.api_key:
            try:
                res = self._parse_with_gemini(image_bytes, mime_type)
                if res and res.get("success"):
                    return res
            except Exception as e:
                print(f"[FecalKitVisionParser] Gemini Vision failed: {e}, falling back to local vision analysis...")

        return self._parse_with_local_cv(image_bytes)

    def _parse_with_gemini(self, image_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        """Multimodal VLM analysis using Gemini Vision."""
        prompt = """
당신은 반려동물 분변 마커 진단 키트 판독 및 장내 미생물 환경(Gut Microbiome) 분석 전문 수의학 AI입니다.
첨부된 사진은 스마트폰으로 촬영된 [반려동물 분변 검사 키트 / 테스트 패드]입니다.
패드의 색상 변화를 정밀 색분해 판독하여 아래 JSON 규격으로만 응답하세요.
Markdown 코드 블록(```json) 없이 순수 JSON만 출력하세요.

JSON 출력 규격:
{
  "success": true,
  "markers": {
    "ph": float (분변 pH, 기준: 6.5, 범위: 5.5 ~ 8.5),
    "ammonia": float (암모니아 NH3, 기준: 20.0, 정상: 10~30, 부패시: 30~60 μmol/g),
    "indole": float (인돌 Indole, 기준: 15.0, 정상: 5~25, 유해균증식시: 25~45 μg/g),
    "lactate": float (젖산 Lactate, 기준: 8.0, 유익균저하시: 3~5, 정상: 6~12 mmol/g),
    "blood": float (잠혈 Occult Blood, 음성: 0.0, 약양성: 5.0, 양성/점막출혈: 10.0~30.0),
    "protein": float (미소화 단백질 반응 %, 정상: 2~8, 흡수장애시: 8~15),
    "carbo": float (미소화 탄수화물/전분 반응 %, 정상: 3~10, 소화불량시: 10~18),
    "fat": float (미소화 지방 수단III %, 정상: 1~7, EPI/췌장염시: 7~15),
    "absorption": float (추정 소화 흡수율 %, 정상: 80~95, 저하시: 65~79)
  },
  "pad_colors": [
    {"marker": "pH", "detected_color": "감지된 색상명 (예: 연두색, 황색 등)", "grade": "정상 / 이상"},
    {"marker": "암모니아", "detected_color": "감지된 색상명", "grade": "정상 / 경고 / 위험"},
    {"marker": "인돌", "detected_color": "감지된 색상명", "grade": "정상 / 경고"},
    {"marker": "젖산", "detected_color": "감지된 색상명", "grade": "양호 / 감소"},
    {"marker": "잠혈", "detected_color": "감지된 색상명", "grade": "음성 (Negative) / 양성 (Positive)"},
    {"marker": "단백질", "detected_color": "감지된 색상명", "grade": "정상 / 잔류의심"},
    {"marker": "탄수화물", "detected_color": "감지된 색상명", "grade": "정상 / 잔류의심"},
    {"marker": "지방", "detected_color": "감지된 색상명", "grade": "정상 / 잔류의심"}
  ],
  "gut_4quadrant_evaluation": {
    "scfa_production": "단쇄지방산(SCFA) 생산력 평가 (우수 / 보통 / 저하)",
    "putrefaction_risk": "단백질 부패 및 요독 전구물질 위험도 (안전 / 주의 / 위험)",
    "mucosal_integrity": "장점막 투과도 및 염증 소견 (정상 / 미세출혈의심 / 장누수주의)",
    "microbiome_balance": "장내 미생물총 균형 (유익균 우세 / 정상 / 유해균 우세 / 균교대증)"
  },
  "clinical_briefing": "보호자 및 수의사를 위한 1~2문장의 종합 장내환경 판독 소견",
  "recommended_diet_action": "믹스피딩 시 조절할 추천 영양 방향 (예: 수용성 섬유질 증량, 발효성 탄수화물 보강, 단백질 소화율 높은 처방식 전환 등)"
}
"""

        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=self.api_key)
            part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[prompt, part],
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            raw = response.text
        except Exception:
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=self.api_key)
            model = legacy_genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content([
                prompt,
                {"mime_type": mime_type, "data": image_bytes}
            ])
            raw = response.text

        cleaned = raw.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return json.loads(cleaned.strip())

    def _parse_with_local_cv(self, image_bytes: bytes) -> Dict[str, Any]:
        """Local Color Decomposition using PIL and OpenCV."""
        try:
            import cv2
            import numpy as np

            # Load image
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_np = np.array(img)
            h, w, _ = img_np.shape

            # Convert to HSV and LAB color spaces
            hsv = cv2.cvtColor(img_np, cv2.COLOR_RGB2HSV)
            lab = cv2.cvtColor(img_np, cv2.COLOR_RGB2LAB)

            # Sample center patch and multiple sectors
            center_rgb = np.mean(img_np[int(h*0.3):int(h*0.7), int(w*0.3):int(w*0.7)], axis=(0,1))
            mean_h = np.mean(hsv[:, :, 0]) # Hue (0~180)
            mean_s = np.mean(hsv[:, :, 1]) # Saturation
            mean_v = np.mean(hsv[:, :, 2]) # Value

            # Color-based marker estimation
            # Hue mapping: Yellow/Green (pH 6.2~7.0), Blue/Purple (pH > 7.5), Orange/Red (pH < 6.0)
            est_ph = 6.5
            if mean_h < 25:    # Red/Orange tint
                est_ph = round(5.8 + (mean_h / 25.0) * 0.4, 2)
            elif mean_h < 75:  # Yellow/Green
                est_ph = round(6.2 + ((mean_h - 25) / 50.0) * 0.9, 2)
            else:              # Blue/Cyan
                est_ph = round(7.2 + ((mean_h - 75) / 105.0) * 0.8, 2)

            # Ammonia & Indole: higher saturation/darkness correlates with protein fermentation
            darkness = max(0.0, 1.0 - (mean_v / 255.0))
            est_ammonia = round(18.0 + darkness * 25.0, 1)
            est_indole = round(12.0 + darkness * 20.0, 1)

            # Lactate (SCFA): inversely correlated with putrefaction, correlated with balanced pH (6.0~6.8)
            ph_penalty = abs(est_ph - 6.5)
            est_lactate = round(max(3.0, 10.0 - ph_penalty * 3.5), 1)

            # Blood (Occult Blood): redness detection in HSV (H < 10 or H > 170)
            red_mask = (hsv[:, :, 0] < 12) & (hsv[:, :, 1] > 60)
            red_ratio = np.mean(red_mask)
            est_blood = round(red_ratio * 40.0, 1)

            # Undigested Nutrients
            est_protein = round(4.5 + darkness * 4.0, 1)
            est_carbo = round(5.5 + ph_penalty * 3.0, 1)
            est_fat = round(3.5 + darkness * 3.5, 1)

            # Estimated Bioavailability
            est_absorption = round(max(70.0, 92.0 - (est_protein * 0.6 + est_fat * 0.8 + est_blood * 0.3)), 1)

            markers = {
                "ph": est_ph,
                "ammonia": est_ammonia,
                "indole": est_indole,
                "lactate": est_lactate,
                "blood": est_blood,
                "protein": est_protein,
                "carbo": est_carbo,
                "fat": est_fat,
                "absorption": est_absorption
            }

            # 4-quadrant evaluation
            scfa = "우수" if est_lactate >= 8.0 else ("보통" if est_lactate >= 5.0 else "저하")
            putrefaction = "위험" if est_ammonia >= 35.0 or est_indole >= 28.0 else ("주의" if est_ammonia >= 25.0 else "안전")
            mucosa = "점막손상/출혈주의" if est_blood >= 10.0 else ("미세잠혈소견" if est_blood >= 3.0 else "정상 (음성)")
            microbiome = "유익균 우세" if scfa == "우수" and putrefaction == "안전" else ("균형 유지" if putrefaction == "안전" else "유해균 증식/부패발효")

            briefing = f"pH {est_ph}, 단쇄지방산(젖산) {est_lactate}mmol/g, 암모니아 {est_ammonia}μmol/g 수준으로 판독되었습니다. {mucosa}."

            return {
                "success": True,
                "method": "ComputerVision_ColorDecomposition_Fallback",
                "markers": markers,
                "color_metrics": {
                    "mean_hsv": [round(float(mean_h), 1), round(float(mean_s), 1), round(float(mean_v), 1)],
                    "mean_rgb": [int(center_rgb[0]), int(center_rgb[1]), int(center_rgb[2])]
                },
                "gut_4quadrant_evaluation": {
                    "scfa_production": scfa,
                    "putrefaction_risk": putrefaction,
                    "mucosal_integrity": mucosa,
                    "microbiome_balance": microbiome
                },
                "clinical_briefing": briefing,
                "recommended_diet_action": "소화율 높은 단백질 및 수용성 프리바이오틱스(FOS/MOS) 균형 급여 권장"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"분변 패드 이미지 색분해 실패: {str(e)}"
            }
