"""
Feed Package OCR and Nutrition Parsing Module.
Extracts guaranteed analysis, ingredients, and ME from pet food packaging images
using Gemini Multimodal Vision API (with EasyOCR/Regex fallback).
Converts extracted data to DietProduct and NutrientProfile compatible with the Mix-Feeding Engine.
"""
import os
import re
import json
import io
import math
from typing import Dict, Any, Optional, List, Tuple
from PIL import Image

from core.models import Species, NutrientProfile, DietProduct

class FeedOCRParser:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

    def parse_from_image_bytes(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> Dict[str, Any]:
        """
        Main entry point: Parse feed package image bytes to structured nutrition data.
        Tries Gemini Vision first, then falls back to EasyOCR if Gemini is unavailable.
        """
        if self.api_key:
            try:
                result = self._parse_with_gemini(image_bytes, mime_type)
                if result and result.get("success"):
                    return result
            except Exception as e:
                print(f"[FeedOCRParser] Gemini vision parsing failed: {e}, falling back to local OCR...")

        # Fallback to local EasyOCR
        return self._parse_with_easyocr(image_bytes)

    def _parse_with_gemini(self, image_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        """Parse feed package using Google Gemini Vision API."""
        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=self.api_key)
            model_name = "gemini-2.5-flash"
        except Exception:
            # Try legacy google-generativeai if google.genai is not configured
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=self.api_key)
            model = legacy_genai.GenerativeModel("gemini-1.5-flash")
            
            prompt = self._get_gemini_prompt()
            response = model.generate_content([
                prompt,
                {"mime_type": mime_type, "data": image_bytes}
            ])
            return self._clean_and_normalize_response(response.text)

        prompt = self._get_gemini_prompt()
        part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        response = client.models.generate_content(
            model=model_name,
            contents=[prompt, part],
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return self._clean_and_normalize_response(response.text)

    def _get_gemini_prompt(self) -> str:
        return """
당신은 반려동물(개/고양이) 사료 포장지 라벨 영양 분석 전문 수의 영양학 AI입니다.
첨부된 사료 포장지 사진(등록성분량, 원재료명, 제품명 등)을 분석하여 아래 JSON 규격으로만 응답하세요.
Markdown 코드 블록(```json) 없이 순수 JSON만 출력하세요.

JSON 출력 포맷:
{
  "success": true,
  "name": "사료 제품명 (예: 로얄캐닌 캣 레날 파우치)",
  "company": "제조사/브랜드 (예: 로얄캐닌, 힐스, 퓨리나 등)",
  "species": "개" 또는 "고양이",
  "feed_type": "건식사료" 또는 "습식사료" 또는 "화식/동결건조",
  "guaranteed_analysis": {
    "crude_protein_pct": float (조단백질 %, 예: 28.0),
    "crude_fat_pct": float (조지방 %, 예: 16.0),
    "crude_fiber_pct": float (조섬유 %, 예: 3.5, 없으면 0.0),
    "crude_ash_pct": float (조회분 %, 예: 7.0, 없으면 0.0),
    "calcium_pct": float (칼슘 %, 예: 1.1, 없으면 null),
    "phosphorus_pct": float (인 %, 예: 0.9, 없으면 null),
    "moisture_pct": float (수분 %, 예: 10.0, 습식이면 보통 75~85%, 건식이면 10% 내외),
    "sodium_pct": float (나트륨 %, 없으면 null),
    "potassium_pct": float (칼륨 %, 없으면 null),
    "magnesium_pct": float (마그네슘 %, 없으면 null),
    "epa_dha_pct": float (EPA+DHA %, 없으면 null),
    "omega3_pct": float (오메가3 지방산 %, 없으면 null)
  },
  "metabolic_energy": {
    "kcal_per_kg": float (대사에너지 kcal/kg, 포장지에 표기되어 있으면 추출, 없으면 null),
    "kcal_per_can_or_unit": float (캔/파우치당 칼로리, 표기시 추출 없으면 null)
  },
  "ingredients_text": "포장지에 적힌 원재료명 전체 텍스트",
  "protein_sources": ["주요 단백질원 배열, 예: 닭고기, 연어, 칠면조, 가수분해단백 등"],
  "target_indications": ["사료가 타깃하는 기능/질환, 예: 신장, 관절, 피부, 췌장, 체중조절, 일반건강"],
  "notes": "추출 시 특이사항이나 보호자가 참고할 내용"
}

* 주의사항:
1. 숫자는 '%' 기호를 떼고 순수 float 형태로 넣으세요 (예: 28% -> 28.0).
2. '이상', '이하' 등의 표기는 해당 숫자를 그대로 float로 넣으세요 (예: 조단백 25.0% 이상 -> 25.0).
3. 수분이 적혀있지 않다면 건식사료는 10.0, 습식사료는 80.0으로 추정하세요.
4. 축종(개/고양이)이 명확하지 않으면 제품명이나 문맥으로 추론하고, 불명확하면 '개'로 지정하세요.
"""

    def _clean_and_normalize_response(self, text: str) -> Dict[str, Any]:
        """Clean JSON response and convert to standardized DietProduct format."""
        try:
            cleaned = text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            data = json.loads(cleaned.strip())
        except Exception as e:
            return {
                "success": False,
                "error": f"JSON 파싱 오류: {str(e)}",
                "raw_text": text
            }

        return self._post_process_nutrition(data)

    def _parse_with_easyocr(self, image_bytes: bytes) -> Dict[str, Any]:
        """Local OCR fallback using EasyOCR and Regex extraction."""
        try:
            import easyocr
            import numpy as np
            
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_np = np.array(image)
            
            # EasyOCR with Korean and English
            reader = easyocr.Reader(['ko', 'en'], gpu=False)
            results = reader.readtext(img_np, detail=0)
            full_text = " ".join(results)
            
            # Parse text with regex
            data = self._regex_extract_feed_info(full_text)
            data["success"] = True
            data["method"] = "EasyOCR_Local_Fallback"
            return self._post_process_nutrition(data)
        except Exception as e:
            return {
                "success": False,
                "error": f"로컬 OCR 판독 실패: {str(e)}",
                "hint": "GEMINI_API_KEY를 설정하시면 훨씬 정밀한 VLM 인식이 가능합니다."
            }

    def _regex_extract_feed_info(self, text: str) -> Dict[str, Any]:
        """Extract nutrition parameters from raw text using regular expressions."""
        def extract_num(patterns: List[str], default=0.0):
            for pat in patterns:
                m = re.search(pat, text, re.IGNORECASE)
                if m:
                    try:
                        return float(m.group(1).replace(",", "."))
                    except:
                        pass
            return default

        # Nutrition regex patterns
        protein = extract_num([
            r'조단백(?:질)?\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*%',
            r'crude\s*protein\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*%'
        ], 24.0)

        fat = extract_num([
            r'조지방\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*%',
            r'crude\s*fat\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*%'
        ], 14.0)

        fiber = extract_num([
            r'조섬유\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*%',
            r'crude\s*fiber\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*%'
        ], 3.0)

        ash = extract_num([
            r'조회분\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*%',
            r'crude\s*ash\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*%'
        ], 7.0)

        calcium = extract_num([
            r'칼슘\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*%',
            r'calcium\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*%'
        ], 0.8)

        phosphorus = extract_num([
            r'인\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*%',
            r'phosphorus\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*%'
        ], 0.6)

        moisture = extract_num([
            r'수분\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*%',
            r'moisture\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*%'
        ], 10.0)

        # Energy ME
        me_val = extract_num([
            r'대사에너지.*?([0-9]{3,4})\s*(?:kcal|칼로리)',
            r'me\s*[:：]?\s*([0-9]{3,4})\s*kcal',
            r'칼로리.*?([0-9]{3,4})\s*kcal'
        ], None)

        species = "고양이" if any(w in text for w in ["고양이", "캣", "feline", "cat"]) else "개"
        feed_type = "습식사료" if moisture > 30.0 or any(w in text for w in ["파우치", "캔", "습식", "can", "pouch"]) else "건식사료"

        return {
            "name": "OCR 인식 사료 (직접 확인 필요)",
            "company": "기타/인식필요",
            "species": species,
            "feed_type": feed_type,
            "guaranteed_analysis": {
                "crude_protein_pct": protein,
                "crude_fat_pct": fat,
                "crude_fiber_pct": fiber,
                "crude_ash_pct": ash,
                "calcium_pct": calcium,
                "phosphorus_pct": phosphorus,
                "moisture_pct": moisture,
                "sodium_pct": None,
                "potassium_pct": None,
                "magnesium_pct": None,
                "epa_dha_pct": None,
                "omega3_pct": None
            },
            "metabolic_energy": {
                "kcal_per_kg": me_val,
                "kcal_per_can_or_unit": None
            },
            "ingredients_text": text[:300],
            "protein_sources": [],
            "target_indications": [],
            "notes": "로컬 OCR로 감지되었습니다. 수치를 확인해 주세요."
        }

    def _post_process_nutrition(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate ME (Modified Atwater) if missing, and convert nutrients to
        per 1,000 kcal standards compatible with NutrientProfile.
        """
        ga = data.get("guaranteed_analysis", {})
        protein_pct = float(ga.get("crude_protein_pct") or 0.0)
        fat_pct = float(ga.get("crude_fat_pct") or 0.0)
        fiber_pct = float(ga.get("crude_fiber_pct") or 0.0)
        ash_pct = float(ga.get("crude_ash_pct") or 0.0)
        moisture_pct = float(ga.get("moisture_pct") or (80.0 if "습식" in str(data.get("feed_type")) else 10.0))
        ca_pct = float(ga.get("calcium_pct") or 0.0)
        p_pct = float(ga.get("phosphorus_pct") or 0.0)
        na_pct = float(ga.get("sodium_pct") or 0.0)

        # NFE (Nitrogen-Free Extract: Carbohydrate estimate)
        nfe_pct = max(0.0, 100.0 - (moisture_pct + protein_pct + fat_pct + fiber_pct + ash_pct))

        # ME Calculation (Modified Atwater: Protein*3.5 + Fat*8.5 + NFE*3.5) * 10
        me_data = data.get("metabolic_energy", {})
        me_kcal_kg = me_data.get("kcal_per_kg")
        is_me_estimated = False
        
        if not me_kcal_kg or float(me_kcal_kg) <= 0:
            # Modified Atwater equation for commercial pet food
            calculated_me = 10.0 * (3.5 * protein_pct + 8.5 * fat_pct + 3.5 * nfe_pct)
            me_kcal_kg = round(calculated_me, 1)
            is_me_estimated = True
        else:
            me_kcal_kg = float(me_kcal_kg)

        data["metabolic_energy"]["kcal_per_kg"] = me_kcal_kg
        data["metabolic_energy"]["is_estimated"] = is_me_estimated
        data["nfe_carb_pct"] = round(nfe_pct, 2)

        # Convert to 1,000 kcal basis (g/1,000 kcal)
        # Factor: (nutrient_% * 10,000) / ME_kcal_per_kg
        factor = 10000.0 / me_kcal_kg if me_kcal_kg > 0 else 0.0

        protein_g_per_1000kcal = round(protein_pct * factor, 2)
        fat_g_per_1000kcal = round(fat_pct * factor, 2)
        carb_g_per_1000kcal = round(nfe_pct * factor, 2)
        fiber_g_per_1000kcal = round(fiber_pct * factor, 2)
        calcium_g_per_1000kcal = round(ca_pct * factor, 2)
        phosphorus_g_per_1000kcal = round(p_pct * factor, 2)
        sodium_g_per_1000kcal = round(na_pct * factor, 2)

        # Dry Matter (DM) Basis %
        dm_factor = 100.0 / (100.0 - moisture_pct) if moisture_pct < 100 else 1.0
        data["dry_matter_analysis"] = {
            "protein_dm_pct": round(protein_pct * dm_factor, 2),
            "fat_dm_pct": round(fat_pct * dm_factor, 2),
            "carb_dm_pct": round(nfe_pct * dm_factor, 2),
            "fiber_dm_pct": round(fiber_pct * dm_factor, 2),
            "calcium_dm_pct": round(ca_pct * dm_factor, 2),
            "phosphorus_dm_pct": round(p_pct * dm_factor, 2),
        }

        # Compatible NutrientProfile
        data["per_1000kcal"] = {
            "protein_g": protein_g_per_1000kcal,
            "fat_g": fat_g_per_1000kcal,
            "carb_g": carb_g_per_1000kcal,
            "fiber_g": fiber_g_per_1000kcal,
            "calcium_g": calcium_g_per_1000kcal,
            "phosphorus_g": phosphorus_g_per_1000kcal,
            "sodium_g": sodium_g_per_1000kcal
        }

        return data
