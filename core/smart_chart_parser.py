"""
Veterinary Clinical Chart & Natural Language Smart Parser.
Parses free-text clinical notes, lab results, symptoms, and diagnoses
into structured parameters and automated checkbox mappings for the Mix-Feeding Engine.
"""
import os
import re
import json
from typing import Dict, Any, Optional, List

class SmartChartParser:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

    def parse_text(self, text: str) -> Dict[str, Any]:
        """
        Parse free-text clinical chart notes into structured parameters.
        Tries Gemini API first, then falls back to rule-based NER parser.
        """
        if self.api_key:
            try:
                res = self._parse_with_gemini(text)
                if res and res.get("success"):
                    return res
            except Exception as e:
                print(f"[SmartChartParser] Gemini API call failed: {e}, falling back to rule-based parser...")

        return self._parse_with_rules(text)

    def _parse_with_gemini(self, text: str) -> Dict[str, Any]:
        """Parse clinical chart note using Google Gemini API."""
        prompt = f"""
당신은 대한민국 수의 임상 진료 기록(EMR / SOAP 노트) 및 영양학 분석 전문 AI입니다.
아래 수의사의 자연어 진료 기록 텍스트를 분석하여, 처방사료 믹스피딩 계산기의 각 항목에 맞게 JSON 규격으로 파싱하세요.
Markdown 코드 블록(```json) 없이 순수 JSON만 출력하세요.

[수의사 진료 기록]:
{text}

[JSON 출력 규격]:
{{
  "success": true,
  "patient": {{
    "name": "환자 이름 (문맥상 없으면 null)",
    "species": "개" 또는 "고양이" (언급 없으면 '개'),
    "breed": "품종명 (예: 말티즈, 포메라니안, 코숏, 푸들 등, 없으면 null)",
    "weight_kg": float (체중 kg, 없으면 null),
    "age_years": float (연령, 예: 11세 -> 11.0, 6개월 -> 0.5, 없으면 null),
    "gender": "수컷 (중성화 완료)" 또는 "수컷 (중성화 안함)" 또는 "암컷 (중성화 완료)" 또는 "암컷 (중성화 안함)" (언급 없으면 null),
    "bcs": int (1~9 사이, 예: 비만 -> 7, 수척 -> 3, 없으면 null),
    "mcs": "정상 (Normal)" 또는 "경도 근감소 (Mild Loss)" 또는 "중등도 근감소 (Moderate Loss)" 또는 "중증 근감소 (Severe Loss)" (언급 없으면 null),
    "eating_habit": "정상" 또는 "급하게 먹음" 또는 "불규칙",
    "fecal_score": float (1.0~7.0, 예: 설사 -> 6.0, 연변 -> 5.0, 정상 -> 3.5, 변비 -> 2.0, 없으면 null)
  }},
  "symptoms": ["구토", "만성 설사", "식욕부진", "혈변", "복부팽만/복통" 중 해당하는 증상 목록],
  "diseases": [
    "심장병 (MMVD, DCM, HCM, 울혈성심부전)",
    "만성신부전 (CKD IRIS 1-4단계)",
    "췌장염 (급성/만성/지방제한)",
    "장질환 (IBD / 단백소실성장병증 PLE / 만성장염)",
    "간질환 / 간부전",
    "담낭질환 (담낭점액종 / 담낭염 / 담석 / 담도염)",
    "당뇨병 (Diabetes Mellitus)",
    "쿠싱 증후군 (부신피질기능항진증)",
    "비뇨기 결석 (스트루바이트 / 칼슘옥살레이트)",
    "관절염 / 퇴행성관절질환 (DJD/OA)",
    "인지장애 (치매 CDS) / 신경계",
    "3복합염 (Triaditis: 췌장염+간담도+IBD)",
    "소화기 림프종 (GI Lymphoma)",
    "특발성 방광염 (FIC / 하부요로계질환 FLUTD)"
  ],
  "blood_lab": {{
    "bun": float (BUN 수치 mg/dL, 없으면 null),
    "creatinine": float (Creatinine 수치 mg/dL, 없으면 null),
    "sdma": float (SDMA 수치 ug/dL, 없으면 null),
    "phosphorus": float (인 P 수치 mg/dL, 없으면 null),
    "albumin": float (Albumin 수치 g/dL, 없으면 null),
    "lipase_or_cpl": float (cPL 또는 Lipase 수치, 없으면 null),
    "alt": float (ALT 수치 U/L, 없으면 null),
    "potassium": float (칼륨 K 수치 mmol/L, 없으면 null)
  }},
  "ultrasound": {{
    "wall_thickness_mm": float (장벽 두께 mm, 없으면 null),
    "loss_of_layering": "정상 (Normal)" 또는 "경도 소실 (Mild)" 또는 "완전 소실 (Loss of layering)" (언급 없으면 null),
    "hyperechoic": "없음 (정상)" 또는 "미만성 고에코 (Hyperechoic speckles)" (언급 없으면 null)
  }},
  "allergies": ["언급된 알러지 유발 단백질원 (예: 닭고기, 소고기, 연어, 오리 등)"],
  "summary": "수의사 메모를 요약한 1~2문장의 임상 브리핑",
  "confidence": "HIGH"
}}
"""

        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=self.api_key)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            raw = response.text
        except Exception:
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=self.api_key)
            model = legacy_genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            raw = response.text

        cleaned = raw.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return json.loads(cleaned.strip())

    def _parse_with_rules(self, text: str) -> Dict[str, Any]:
        """Rule-based NER and regular expression fallback parser."""
        t = text.lower()
        t_nospace = re.sub(r'\s+', '', t)

        # Species
        species = "고양이" if any(w in t for w in ["고양이", "묘", "cat", "feline", "코숏", "러시안블루", "페르시안", "샴", "렉돌"]) else "개"

        # Weight
        weight = None
        m_wt = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(?:kg|킬로)', text, re.IGNORECASE)
        if m_wt:
            weight = float(m_wt.group(1))

        # Age
        age = None
        m_age_yr = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(?:세|살|yr|years?)', text, re.IGNORECASE)
        if m_age_yr:
            age = float(m_age_yr.group(1))
        else:
            m_age_mo = re.search(r'([0-9]+)\s*(?:개월|달|months?)', text, re.IGNORECASE)
            if m_age_mo:
                age = round(float(m_age_mo.group(1)) / 12.0, 1)

        # Gender
        gender = None
        if "중성화" in text:
            if any(w in t for w in ["수컷", "남아", "male", "수"]):
                gender = "수컷 (중성화 완료)"
            elif any(w in t for w in ["암컷", "여아", "female", "암"]):
                gender = "암컷 (중성화 완료)"
        elif any(w in t for w in ["수컷", "남아", "male"]):
            gender = "수컷 (중성화 안함)"
        elif any(w in t for w in ["암컷", "여아", "female"]):
            gender = "암컷 (중성화 안함)"

        # Breed
        breed = None
        breeds = ["말티즈", "포메라니안", "푸들", "시츄", "치와와", "골든리트리버", "비숑", "닥스훈트", "코숏", "러시안블루", "샴", "렉돌", "믹스견"]
        for b in breeds:
            if b in text:
                breed = b
                break

        # Diseases
        diseases = []
        if any(w in t for w in ["신부전", "ckd", "신장", "iris"]):
            diseases.append("만성신부전 (CKD IRIS 1-4단계)")
        if any(w in t for w in ["췌장염", "pancreatitis", "cpl", "fpl"]):
            diseases.append("췌장염 (급성/만성/지방제한)")
        if any(w in t for w in ["심장", "mmvd", "dcm", "hcm", "심부전", "심잡음"]):
            diseases.append("심장병 (MMVD, DCM, HCM, 울혈성심부전)")
        if any(w in t for w in ["ibd", "장염", "장병증", "ple", "단백소실"]):
            diseases.append("장질환 (IBD / 단백소실성장병증 PLE / 만성장염)")
        if any(w in t for w in ["간부전", "간질환", "간수치", "간경화"]):
            diseases.append("간질환 / 간부전")
        if any(w in t for w in ["담낭", "담석", "점액종", "담도"]):
            diseases.append("담낭질환 (담낭점액종 / 담낭염 / 담석 / 담도염)")
        if any(w in t for w in ["당뇨", "diabetes"]):
            diseases.append("당뇨병 (Diabetes Mellitus)")
        if any(w in t for w in ["쿠싱", "부신피질"]):
            diseases.append("쿠싱 증후군 (부신피질기능항진증)")
        if any(w in t for w in ["결석", "스트루바이트", "옥살레이트"]):
            diseases.append("비뇨기 결석 (스트루바이트 / 칼슘옥살레이트)")
        if any(w in t for w in ["관절", "관절염", "djd", "슬개골"]):
            diseases.append("관절염 / 퇴행성관절질환 (DJD/OA)")

        # Symptoms
        symptoms = []
        if any(w in t for w in ["구토", "토함", "vomit"]):
            symptoms.append("구토")
        if any(w in t_nospace for w in ["설사", "묽은변", "diarrhea"]):
            symptoms.append("만성 설사")
        if any(w in t for w in ["식욕부진", "식욕저하", "안먹음", "anorexia"]):
            symptoms.append("식욕부진")
        if any(w in t for w in ["혈변", "melena"]):
            symptoms.append("혈변")
        if any(w in t for w in ["복통", "복부팽만", "배가 빵빵"]):
            symptoms.append("복부팽만/복통")

        # Fecal score
        fecal_score = None
        if "설사" in symptoms or "혈변" in symptoms:
            fecal_score = 6.0
        elif any(w in t_nospace for w in ["묽은변", "연변"]):
            fecal_score = 5.0
        elif "변비" in text:
            fecal_score = 2.0

        # Blood Lab extraction helper
        def extract_lab_val(patterns):
            for pat in patterns:
                m = re.search(pat, text, re.IGNORECASE)
                if m:
                    try:
                        return float(m.group(1))
                    except:
                        pass
            return None

        lab_data = {
            "bun": extract_lab_val([r'bun\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)']),
            "creatinine": extract_lab_val([r'(?:crea|cr|creatinine)\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)']),
            "sdma": extract_lab_val([r'sdma\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)']),
            "phosphorus": extract_lab_val([r'(?:인|phosphorus|phos|p)\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)']),
            "albumin": extract_lab_val([r'(?:alb|albumin)\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)']),
            "lipase_or_cpl": extract_lab_val([r'(?:cpl|fpl|lipase)\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)']),
            "alt": extract_lab_val([r'(?:alt|gpt)\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)']),
            "potassium": extract_lab_val([r'(?:칼륨|potassium|k)\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)'])
        }

        # Ultrasound thickness
        us_thick = extract_lab_val([r'(?:장벽|두께|thickness)\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)\s*mm'])

        return {
            "success": True,
            "method": "RuleBased_NER_Fallback",
            "patient": {
                "name": None,
                "species": species,
                "breed": breed,
                "weight_kg": weight,
                "age_years": age,
                "gender": gender,
                "bcs": None,
                "mcs": None,
                "eating_habit": "정상",
                "fecal_score": fecal_score
            },
            "symptoms": symptoms,
            "diseases": diseases,
            "blood_lab": lab_data,
            "ultrasound": {
                "wall_thickness_mm": us_thick,
                "loss_of_layering": "정상 (Normal)",
                "hyperechoic": "없음 (정상)"
            },
            "allergies": [],
            "summary": f"{species} 환자, {', '.join(diseases) if diseases else '기저질환 없음'}, 증상: {', '.join(symptoms) if symptoms else '특이사항 없음'}",
            "confidence": "MEDIUM"
        }
