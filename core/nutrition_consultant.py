"""
Veterinary Nutrition Consultation and CDSS Literature Agent Module.
Provides specialized consultation for Guardians (easy meal guides, transition schedule, hydration)
and Clinical CDSS with evidence-based literature citations (SACN, NRC, IRIS, ACVIM) for Veterinarians.
"""
import os
import json
from typing import Dict, Any, Optional, List

# Embedded Veterinary Clinical Literature Database
VET_LITERATURE_DB = {
    "ckd": {
        "title": "IRIS Staging of CKD & SACN Ch. 37 Renal Disease",
        "guidelines": "IRIS 2023 Guidelines / SACN 5th Ed.",
        "key_points": [
            "인(Phosphorus) 엄격 제한: Stage 2 (<4.6 mg/dL 혈중타깃, 식이 <0.8g/1000kcal), Stage 3 (<5.0 mg/dL), Stage 4 (<6.0 mg/dL)",
            "단백질: 요독증(Uremia) 임상 증상 조절을 위한 조절 (Dog: 35~55g/1000kcal, Cat: 60~75g/1000kcal), 고생물가 단백질 급여",
            "나트륨: 고혈압 및 사구체 과여과 억제를 위해 <0.9g/1000kcal 제한",
            "EPA+DHA: 사구체 염증 완화 및 신혈류 유지를 위해 0.8~1.5g/1000kcal 권장",
            "음수량 공급: 요농축능 저하 보상을 위해 1.35배 이상 증량 (습식 사료 믹스 필수 권장)"
        ]
    },
    "pancreatitis": {
        "title": "ACVIM Consensus on Pancreatitis in Dogs & SACN Ch. 60 Exocrine Pancreas",
        "guidelines": "ACVIM Consensus / SACN 5th Ed.",
        "key_points": [
            "조지방(Fat) 엄격 제한: 급성/만성 재발형 개에서 <25~30g/1000kcal (<10~12% DM) 권고 (지방 제한이 1순위 타깃)",
            "고양이의 경우 지방 과도 제한 불필요하나 고지혈증 동반 시 조절",
            "소화율 높은 탄수화물/단백질 급여 및 소량 분할 급여 (1일 3~4회 TID/QID)",
            "췌장염과 신부전 동반 시: 지방 제한(Pancreatitis)이 신장 고열량 요구보다 우선 순위 (지방 초과 시 급성 췌장염 재발 위험)"
        ]
    },
    "heart": {
        "title": "ACVIM Consensus Guidelines for MMVD & SACN Ch. 36 Cardiovascular Disease",
        "guidelines": "ACVIM 2019 MMVD Consensus / SACN 5th Ed.",
        "key_points": [
            "나트륨(Sodium) 제한: Stage B2부터 경도 제한 (<0.8g/1000kcal), Stage C/D에서는 울혈 완화를 위한 엄격 제한 (<0.5g/1000kcal)",
            "단백질: 심장성 악액질(Cardiac Cachexia) 방지를 위해 양질 단백질 유지 (>=45g/1000kcal in dog)",
            "타우린(Taurine) & L-카르니틴: 심근 수축력 및 미토콘드리아 지방산 산화 지원 (타우린 >=0.5~1.0g/1000kcal)",
            "EPA+DHA: 항부정맥 및 염증성 사이토카인(TNF-a, IL-1) 억제 위해 >=1.0g/1000kcal 강화"
        ]
    },
    "ibd": {
        "title": "World Small Animal Veterinary Association (WSAVA) GI Guidelines & SACN Ch. 53-56",
        "guidelines": "WSAVA GI Committee / SACN 5th Ed.",
        "key_points": [
            "단일 새로운 단백질원(Novel Protein) 또는 가수분해 단백질(Hydrolyzed Protein) 급여",
            "수용성/발효성 섬유소(FOS, MOS, 차전자피) 보강으로 장내 단쇄지방산(SCFA, 부티레이트) 생산 촉진 및 장점막 재생 지원",
            "소화흡수율 극대화: 단백질 및 지방 소화율 >=85% 유지",
            "비타민 B12(코발라민) 흡수 부전 모니터링 및 보충 필요"
        ]
    }
}

class NutritionConsultantService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

    def consult_guardian(self, question: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        AI consultation tailored for pet owners (Guardians).
        Generates kind, clear, actionable feeding advice, meal transition plans, and hydration tips.
        """
        if self.api_key:
            try:
                res = self._consult_guardian_with_gemini(question, context)
                if res and res.get("success"):
                    return res
            except Exception as e:
                print(f"[NutritionConsultantService] Guardian Gemini error: {e}, falling back to rule-based coach...")

        return self._consult_guardian_fallback(question, context)

    def consult_vet_cdss(self, question: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Clinical Decision Support System (CDSS) for Veterinarians.
        Provides in-depth veterinary clinical nutrition rationale with SACN/NRC/IRIS literature citations.
        """
        if self.api_key:
            try:
                res = self._consult_vet_with_gemini(question, context)
                if res and res.get("success"):
                    return res
            except Exception as e:
                print(f"[NutritionConsultantService] Vet CDSS Gemini error: {e}, falling back to rule-based CDSS...")

        return self._consult_vet_fallback(question, context)

    def _consult_guardian_with_gemini(self, question: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Guardian AI coach powered by Gemini 2.5 Flash."""
        ctx_str = json.dumps(context, ensure_ascii=False, indent=2)
        prompt = f"""
당신은 반려동물(개/고양이) 맞춤 믹스피딩 및 영양 관리 전문 [AI 수의 영양 코치]입니다.
보호자의 눈높이에 맞추어 친절하고 따뜻하며 명확하고 실천하기 쉬운 식단 가이드를 제공하세요.
반드시 Markdown 형식으로 읽기 쉽게 작성하세요.

[현재 반려동물 및 믹스피딩 컨텍스트]:
{ctx_str}

[보호자의 질문]:
{question}

[답변 작성 가이드]:
1. **공감 및 브리핑:** 아이의 건강 상태(체중, 질환, 변 상태 등)를 반영하여 따뜻하게 답변 시작.
2. **믹스피딩 급여 방법:** 주사료와 믹스사료(습식캔 등)를 어떻게 배합하고 하루 몇 g씩, 종이컵 몇 컵인지 알기 쉽게 설명.
3. **7일 식단 전환 플랜 (필요시):** 위장 자극 없이 부드럽게 사료를 바꾸는 스케줄 (1~2일차 25% -> 3~4일차 50% -> 5~6일차 75% -> 7일차 100%).
4. **음수량 관리 꿀팁:** 물을 잘 안 마실 때 습식캔에 따뜻한 물 섞어주기 등 실용적인 팁 제시.
5. **주의사항:** 절대 주면 안 되는 음식, 배변 상태 체크 포인트.
"""
        from google import genai
        client = genai.Client(api_key=self.api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return {
            "success": True,
            "answer": response.text,
            "role": "guardian_coach",
            "method": "Gemini_VLM_Agent"
        }

    def _consult_vet_with_gemini(self, question: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Veterinary CDSS Literature Agent powered by Gemini 2.5 Flash."""
        ctx_str = json.dumps(context, ensure_ascii=False, indent=2)
        prompt = f"""
당신은 수의 임상 영양학 전문 의사결정 지원 시스템(Veterinary Clinical CDSS & Literature Agent)입니다.
임상 수의사의 질의에 대해 **SACN(Small Animal Clinical Nutrition 5th Ed.), NRC(2006), IRIS(2023), ACVIM 가이드라인**을 기반으로 과학적 근거와 정량적 영양소 수치(g/1,000kcal, DM%)를 명확하게 제시하세요.

[환자 임상 컨텍스트 (체중, 질환, 혈액검사치, 믹스피딩 배합비, 장내환경 지표)]:
{ctx_str}

[수의사 임상 질의]:
{question}

[답변 작성 요구사항]:
1. **임상 영양학적 핵심 결론 (Executive Clinical Summary):** 2~3줄 요약.
2. **복합 질환 영양 충돌 해결 근거 (Nutritional Conflict Resolution):**
   - 질환 간 상충되는 영양소(예: CKD 인 제한 vs 췌장염 지방 제한) 우선순위 및 타깃 수치 근거.
3. **문헌 및 저널 인용 (Evidence & Citations):**
   - SACN, NRC, IRIS, ACVIM 등 공인 문헌의 챕터/조항 구체적 인용.
4. **처방 식단 모니터링 플랜 (Monitoring Biomarkers):**
   - 급여 후 추적 검사할 혈액 지표(BUN, Crea, SDMA, cPL, P) 및 분변 마커(pH, 암모니아, SCFA).
"""
        from google import genai
        client = genai.Client(api_key=self.api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return {
            "success": True,
            "answer": response.text,
            "role": "vet_cdss",
            "method": "Gemini_CDSS_Agent"
        }

    def _consult_guardian_fallback(self, question: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Rule-based guardian consultation coach."""
        p_name = context.get("name", "반려동물")
        wt = context.get("weight_kg", 5.0)
        der = context.get("der_kcal", 300.0)
        feeds = context.get("feeds", [])

        feed_desc = []
        for f in feeds:
            feed_desc.append(f"- **{f.get('name', '사료')}**: 하루 약 {f.get('daily_grams', 50)}g (1회 약 {f.get('bid_grams', 25)}g)")

        answer = f"""### 🐾 {p_name} 맞춤 믹스피딩 식단 코칭

보호자님, {p_name}(체중 {wt}kg)의 하루 필요 칼로리는 약 **{der} kcal**입니다. 아이의 건강과 기호성을 모두 잡을 수 있도록 설계된 맞춤 급여 방법입니다.

#### 🥣 1. 하루 추천 배합 급여량 (1일 2회 급여 기준)
{chr(10).join(feed_desc) if feed_desc else "- 주 사료와 믹스 사료를 7:3 비율로 급여해 주세요."}

#### 📅 2. 소화 장애 없는 7일 적응 플랜 (식단 전환 가이드)
갑자기 사료를 바꾸면 묽은 변이나 구토가 발생할 수 있으니 7일에 걸쳐 서서히 섞어주세요:
- **1~2일차:** 기존 사료 75% + 새 사료(믹스) 25%
- **3~4일차:** 기존 사료 50% + 새 사료 50% (절반씩)
- **5~6일차:** 기존 사료 25% + 새 사료 75%
- **7일차 이후:** 새로운 맞춤 믹스피딩 100% 급여!

#### 💧 3. 음수량 관리 꿀팁
- 수분이 풍부한 습식 사료를 함께 섞여 먹이면 자연스럽게 하루 음수량의 20~30%가 충족됩니다.
- 물을 잘 안 마시는 아이는 습식캔에 미온수 20~30ml를 자작하게 섞어 특식처럼 급여해 보세요.

궁금하신 점이 있다면 언제든 편하게 물어보세요!
"""
        return {
            "success": True,
            "answer": answer,
            "role": "guardian_coach",
            "method": "RuleBased_Consultant_Fallback"
        }

    def _consult_vet_fallback(self, question: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Rule-based veterinary CDSS rationale with literature citations."""
        diseases = context.get("diseases", [])
        dis_text = ", ".join(diseases) if diseases else "특이 기저질환 없음"

        citations = []
        for d in diseases:
            for k, info in VET_LITERATURE_DB.items():
                if k in d.lower() or any(w in d for w in ["신부전", "신장", "췌장염", "심장", "ibd"]):
                    citations.append(f"**[{info['title']}]** ({info['guidelines']})\n" + "\n".join([f"  • {p}" for p in info["key_points"]]))
                    break

        citations_text = "\n\n".join(citations) if citations else "**[SACN 5th Ed. & NRC 2006]** 표준 성견/성묘 유지 영양 요구량 충족 권고"

        answer = f"""### 🩺 수의 임상 영양학 CDSS 분석 리포트 & 문헌 근거

**환자 질환군:** {dis_text}

#### 1. 임상 영양 타깃 및 다차원 상충 해결 (Clinical Rationale)
- **만성신부전(CKD) & 췌장염 동반 시:** ACVIM 및 SACN 가이드라인에 따라 **췌장염의 초저지방(<25g/1000kcal) 타깃이 신부전의 고열량 지방 유지보다 우선**합니다. 지방 과다 시 췌장염 재발로 급격한 신장 관류 저하가 유발되므로, 탄수화물 에너지원으로 대체하고 인(Phosphorus)을 <0.8g/1000kcal로 엄격 제한합니다.
- **심장병(MMVD) & 신부전:** 나트륨을 0.5~0.8g/1000kcal로 제한하되 급격한 저나트륨혈증을 방지하고, 양질의 고생물가 단백질로 심장성/신장성 악액질(Cachexia)을 억제합니다.

#### 2. 핵심 문헌 근거 및 가이드라인 인용 (Literature Citations)
{citations_text}

#### 3. 임상 모니터링 권고 지표 (Follow-up Protocol)
- **4주 후 혈액 검사:** BUN, Creatinine, SDMA, P, Ca, cPL/fPL, 전해질(Na/K)
- **분변 마커 추적:** 분변 pH, 젖산(Lactate, 유익균총 회복 지표), 암모니아(단백질 부패 여부)
"""
        return {
            "success": True,
            "answer": answer,
            "role": "vet_cdss",
            "method": "Literature_DB_Fallback"
        }
