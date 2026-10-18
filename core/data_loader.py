"""
Data loader module for Prescription Diets and Fresh Food Ingredients.
"""
import openpyxl
import json
import os
import re
from typing import List, Dict, Tuple, Optional
from core.models import DietProduct, IngredientItem, NutrientProfile, Species, SupplementProduct, RecommendedSupplement

def clean_float(val) -> float:
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    val_str = str(val).strip().replace(',', '.')
    # Extract float using regex
    m = re.search(r'[-+]?\d*\.?\d+', val_str)
    if m:
        try:
            return float(m.group(0))
        except ValueError:
            return 0.0
    return 0.0

def tag_indications(product_name: str) -> List[str]:
    name = product_name.lower().replace(" ", "")
    tags = []
    
    # 신장 / 신부전
    if any(k in name for k in ['레날', 'renal', 'k/d', 'kd', 'u/d', 'ud', '얼리레날']):
        tags.append("만성신부전")
        tags.append("신장질환")
    # 심장
    if any(k in name for k in ['카디악', 'cardiac', 'h/d', 'hd']):
        tags.append("심장병")
        tags.append("심장질환")
    # 췌장염 / 소화기 로우팻
    if any(k in name for k in ['로우팻', 'lowfat', '가스트로로우팻', 'i/d로우팻', 'id로우팻']):
        tags.append("췌장염")
        tags.append("저지방소화기")
    # 위장관 / IBD / 소화기 일반
    if any(k in name for k in ['가스트로', 'gastro', 'i/d', 'id', '바이옴', 'biome', '소화기']):
        tags.append("위장관질환")
        tags.append("IBD")
        tags.append("설사/장염")
    # 간질환
    if any(k in name for k in ['헤파틱', 'hepatic', 'l/d', 'ld', '간질환']):
        tags.append("간질환")
        tags.append("만성간부전")
    # 알러지 / 피부
    if any(k in name for k in ['아날러제닉', 'anallergenic', '하이포알러제닉', 'hypoallergenic', 'z/d', 'zd', 'd/d', 'dd', '센시티비티', '스킨']):
        tags.append("알러지")
        tags.append("피부병")
        tags.append("식이역반응")
    # 결석 / 비뇨기
    if any(k in name for k in ['유리너리', 'urinary', 'c/d', 'cd', 's/o', 'so']):
        tags.append("결석")
        tags.append("비뇨기질환")
    # 비만 / 체중 / 당뇨
    if any(k in name for k in ['세타이어티', 'satiety', 'r/d', 'rd', 'w/d', 'wd', '다이아베틱', 'diabetic', '체중', '메타볼릭']):
        tags.append("비만")
        tags.append("당뇨병")
        tags.append("쿠싱")
    # 관절
    if any(k in name for k in ['모빌리티', 'mobility', 'j/d', 'jd']):
        tags.append("관절염")
    # 갑상선
    if any(k in name for k in ['y/d', 'yd']):
        tags.append("갑상선기능항진증")
    # 회복 / 중환자
    if any(k in name for k in ['리커버리', 'recovery', 'a/d', 'ad', 'onc']):
        tags.append("회복기/종양")
        tags.append("암")
        
    return list(set(tags))

def tag_protein_sources(product_name: str) -> List[str]:
    name = product_name.lower()
    sources = []
    if '치킨' in name or '닭' in name:
        sources.append("닭고기")
    if '오리' in name or 'duck' in name:
        sources.append("오리고기")
    if '연어' in name or 'salmon' in name:
        sources.append("연어")
    if '터키' in name or '칠면조' in name:
        sources.append("칠면조")
    if '피시' in name or '생선' in name or '참치' in name:
        sources.append("어류/생선")
    if '양고기' in name or 'lamb' in name:
        sources.append("양고기")
    if '소고기' in name or 'beef' in name:
        sources.append("소고기")
    if '돼지' in name or 'pork' in name:
        sources.append("돼지고기")
    if '가수분해' in name or '하이포' in name or '아날러제닉' in name or 'z/d' in name:
        sources.append("가수분해단백질")
    return sources

class DataLoader:
    def __init__(self, data_dir: str = "."):
        self.data_dir = data_dir
        self.diets: List[DietProduct] = []
        self.ingredients: List[IngredientItem] = []
        self.supplements: List[SupplementProduct] = []
        self._load_all()

    def _load_all(self):
        self._load_prescriptions()
        self._load_ingredients()
        self._load_supplements()

    def _load_supplements(self):
        supp_path = os.path.join(self.data_dir, "벳앤펫영양제데이터.xlsx")
        if not os.path.exists(supp_path):
            return

        wb = openpyxl.load_workbook(supp_path, data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
        if len(rows) < 3:
            return

        headers = [str(c).strip() if c is not None else "" for c in rows[1]]
        for r in rows[2:]:
            if not any(r):
                continue
            name = str(r[2] or "").strip()
            if not name or name == "None":
                continue

            tablet_size = str(r[3] or "800mg").strip()
            key_ing = {}
            for h, val in zip(headers[4:], r[4:]):
                if val is not None and str(val).strip() not in ["N/A", "-", ""]:
                    key_ing[h] = val

            indications = []
            target_dis = []
            desc = ""

            if "퍼피" in name:
                indications = ["성장기", "자견", "면역"]
                target_dis = ["성장기 (<1세)"]
                desc = "성장기 면역 증진 및 기초 영양 밸런스"
            elif "어덜트" in name:
                indications = ["성견", "기초영양", "항산화"]
                target_dis = ["성견 유지 (1~6세)"]
                desc = "성견 활력 및 기초 면역/항산화 케어"
            elif "시니어" in name:
                indications = ["노령견", "항산화", "루테인", "Q10"]
                target_dis = ["노령기 (>=7세)"]
                desc = "노령견 활력, 눈 건강(마리골드/루테인), 심뇌혈관 항산화"
            elif "리케어" in name:
                indications = ["회복기", "면역저하", "수술후", "글루타민"]
                target_dis = ["회복기", "면역저하", "악액질"]
                desc = "L-글루타민, L-아르기닌, 프로폴리스 함유 면역/장점막 회복"
            elif "심장" in name or "카디오" in name:
                indications = ["심장병", "MMVD", "DCM", "HCM", "부정맥"]
                target_dis = ["심장병 (MMVD, DCM, HCM, 울혈성심부전)"]
                desc = "CoQ10 40mg, 타우린 50mg, L-카르니틴 20mg, EPA+DHA 60mg 심근 에너지 강화"
            elif "신장" in name or "레날" in name:
                indications = ["만성신부전", "CKD", "요독증", "구연산칼륨"]
                target_dis = ["만성신부전 (CKD IRIS 1-4단계)"]
                desc = "요독 분해 프로바이오틱스 150억 CFU, 구연산칼륨 150mg, 엽산/비타민B12 신기능 보호"
            elif "췌장" in name or "판크레" in name:
                indications = ["췌장염", "EPI", "소화효소", "판크레아틴"]
                target_dis = ["췌장염 (급성/만성/지방제한)"]
                desc = "판크레아틴 36mg, Lipomod 소화효소 36mg, 헤스페리딘 80mg 소화 지원"
            elif "간" in name or "헤파" in name:
                indications = ["간부전", "간질환", "밀크씨슬", "실리마린", "글루타치온"]
                target_dis = ["만성간부전 / 간질환"]
                desc = "밀크씨슬(실리마린) 160mg, L-글루타치온 20mg, 포스파티딜콜린 간세포 보호"
            elif "칼옥스" in name:
                indications = ["칼슘옥살레이트", "결석", "구연산칼륨"]
                target_dis = ["비뇨기 결석 (스트루바이트 / 칼슘옥살레이트)"]
                desc = "구연산칼륨 100mg, 콘드로이친 80mg 소변 알칼리화 및 칼슘 억제"
            elif "스투루" in name:
                indications = ["스트루바이트", "결석", "크랜베리", "D-만노오스"]
                target_dis = ["비뇨기 결석 (스트루바이트 / 칼슘옥살레이트)"]
                desc = "크랜베리 100mg, D-만노오스 50mg, L-메티오닌 15mg 요로 항균 및 산성화"
            elif "관절" in name or "오스테오" in name:
                indications = ["관절염", "슬개골", "초록입홍합", "NAG", "콘드로이친"]
                target_dis = ["골관절염 / 관절질환"]
                desc = "초록입홍합 90mg, 콘드로이친 50mg, N-아세틸글루코사민 50mg, 히알루론산 12mg 연골 재생"

            supp = SupplementProduct(
                id=f"SUPP_{len(self.supplements)+1:02d}",
                company=str(r[1] or "벳앤펫").strip(),
                name=name,
                tablet_size=tablet_size,
                indications=indications,
                key_ingredients=key_ing,
                target_diseases=target_dis,
                description=desc
            )
            self.supplements.append(supp)

    def recommend_supplements_for_patient(
        self,
        species: Species,
        weight_kg: float,
        age_years: float,
        diseases: List[str]
    ) -> List[RecommendedSupplement]:
        """
        Match optimal 1~3 veterinary supplements to synergize with mix-feeding.
        """
        recommended = []
        dis_str = " ".join(diseases)

        # Dosage rule based on weight
        dosage = "1일 1정 (식후 급여)"
        if weight_kg >= 10.0:
            dosage = "1일 2~3정 (1회 1정씩 분할 급여)"
        elif weight_kg >= 5.0:
            dosage = "1일 1~2정 (1회 1정씩 분할 급여)"

        # 1. Disease specific matching
        if any(k in dis_str for k in ["심장", "MMVD", "DCM", "HCM"]):
            recommended.append(RecommendedSupplement(
                name="심장케어 카디오맥스",
                company="벳앤펫",
                tablet_size="800mg",
                daily_dosage=dosage,
                target_disease_or_age="심장병 (MMVD/DCM/HCM)",
                key_functional_components="코엔자임Q10 40mg, 타우린 50mg, L-카르니틴 20mg, EPA+DHA 60mg, 마그네슘 25mg",
                clinical_synergy_reason="처방사료로 제한된 나트륨 환경에서 심근 에너지 대사(CoQ10/L-카르니틴) 및 항부정맥(타우린)을 집중 보강합니다."
            ))

        if any(k in dis_str for k in ["신부전", "CKD", "신장"]):
            recommended.append(RecommendedSupplement(
                name="신장케어 레날맥스",
                company="벳앤펫",
                tablet_size="350mg",
                daily_dosage=dosage,
                target_disease_or_age="만성신부전 (CKD IRIS 1~4단계)",
                key_functional_components="요독물질 분해 유산균 150억 CFU, 구연산칼륨 150mg, 엽산 200ug, Vit B12 250ug",
                clinical_synergy_reason="장-신장 축(Gut-Kidney Axis)을 타겟하여 장내 유익균이 혈중 요독소(BUN/IS)를 직접 분해·배출하도록 돕습니다."
            ))

        if any(k in dis_str for k in ["췌장", "EPI", "외분비"]):
            recommended.append(RecommendedSupplement(
                name="췌장케어판크레딘",
                company="벳앤펫",
                tablet_size="800mg",
                daily_dosage=dosage,
                target_disease_or_age="췌장염 / 소화효소 부전",
                key_functional_components="판크레아틴 36mg, Lipomod 36mg, 베타인 40mg, 헤스페리딘 80mg, 엔조제놀 10mg",
                clinical_synergy_reason="극저지방 사료 급여 시 부족할 수 있는 지질/단백질 소화효소를 외인성으로 보충하여 소장 흡수율을 20% 이상 향상시킵니다."
            ))

        if any(k in dis_str for k in ["간", "헤파틱", "간부전"]):
            recommended.append(RecommendedSupplement(
                name="간케어헤파맥스",
                company="벳앤펫",
                tablet_size="800mg",
                daily_dosage=dosage,
                target_disease_or_age="만성간부전 / 간질환",
                key_functional_components="밀크씨슬(실리마린) 160mg, L-글루타치온 20mg, 포스파티딜콜린 20mg, 베타인 20mg",
                clinical_synergy_reason="간세포막 항산화 보호(실리마린/글루타치온)를 통해 구리 축적 독성을 완화하고 담즙 대사를 정상화합니다."
            ))

        if any(k in dis_str for k in ["결석", "유리너리"]):
            recommended.append(RecommendedSupplement(
                name="결석케어칼옥스",
                company="벳앤펫",
                tablet_size="800mg",
                daily_dosage=dosage,
                target_disease_or_age="비뇨기 결석 (칼슘옥살레이트)",
                key_functional_components="구연산칼륨 100mg, 콘드로이친 80mg, 마리골드 30mg, 비타민B6 0.6mg",
                clinical_synergy_reason="요중 구연산 농도를 높여 칼슘 옥살레이트 결정 결합을 차단하고 방광 점막 GAG층을 보호합니다."
            ))

        if any(k in dis_str for k in ["관절", "골관절", "OA"]):
            recommended.append(RecommendedSupplement(
                name="관절케어 오스테오",
                company="벳앤펫",
                tablet_size="800mg",
                daily_dosage=dosage,
                target_disease_or_age="골관절염 / 슬개골 / 디스크",
                key_functional_components="초록입홍합 90mg, 콘드로이친 50mg, N-아세틸글루코사민 50mg, 히알루론산 12mg, 브로멜라인 40mg",
                clinical_synergy_reason="관절 연골 재생 및 활액 윤활을 증진하며, 브로멜라인 효소가 관절 부종 및 통증을 완화합니다."
            ))

        # 2. Age-based Multi-Vitamin if no specific disease supplement or room for general care
        if len(recommended) < 2:
            if age_years >= 7.0:
                recommended.append(RecommendedSupplement(
                    name="멀티비타시니어",
                    company="벳앤펫",
                    tablet_size="800mg",
                    daily_dosage=dosage,
                    target_disease_or_age="노령견 시니어 (7세 이상)",
                    key_functional_components="코엔자임Q10 20mg, 마리골드(루테인) 80mg, 회화나무추출물 20mg, 유산균 20억, 비타민A/E",
                    clinical_synergy_reason="노령기 인지기능 저하 방지, 백내장 예방, 심혈관 항산화를 위한 맞춤 비타민·미네랄 복합체입니다."
                ))
            elif age_years < 1.0:
                recommended.append(RecommendedSupplement(
                    name="멀티비타 퍼피",
                    company="벳앤펫",
                    tablet_size="800mg",
                    daily_dosage=dosage,
                    target_disease_or_age="성장기 퍼피 (<1세)",
                    key_functional_components="비타민A 22.5ug, 비타민D 0.125ug, 칼슘 1.2mg, 철 1mg, 유산균 20억 CFU, L-카르니틴 20mg",
                    clinical_synergy_reason="성장기 골격 형성 및 면역글로불린 생성을 위한 필수 미량영양소를 완벽 보충합니다."
                ))
            else:
                recommended.append(RecommendedSupplement(
                    name="멀티비타어덜트",
                    company="벳앤펫",
                    tablet_size="800mg",
                    daily_dosage=dosage,
                    target_disease_or_age="성견 유지기 (1~6세)",
                    key_functional_components="코엔자임Q10 20mg, 초록입홍합 30mg, 글루코사민 32mg, 유산균 20억 CFU, 비타민C 7mg",
                    clinical_synergy_reason="성견의 일상 활력, 모질 개선 및 장내 미생물총 균형을 유지합니다."
                ))

        return recommended

    def _load_prescriptions(self):
        excel_path = os.path.join(self.data_dir, "처방사료데이터 정리260821.xlsx")
        if not os.path.exists(excel_path):
            excel_path = os.path.join(self.data_dir, "처방사료데이터 정리 -최종.xlsx")
        if not os.path.exists(excel_path):
            return

        wb = openpyxl.load_workbook(excel_path, data_only=True)
        
        sheet_mapping = {
            "반려견건식": (Species.DOG, "건식", 10.0),
            "반려묘건식": (Species.CAT, "건식", 10.0),
            "반려견습식": (Species.DOG, "습식", 78.0),
            "반려묘습식": (Species.CAT, "습식", 78.0)
        }

        count = 0
        for sheet_name, (species, feed_type, default_moisture) in sheet_mapping.items():
            if sheet_name not in wb.sheetnames:
                continue
            ws = wb[sheet_name]
            rows = list(ws.iter_rows(values_only=True))
            if not rows:
                continue
            
            # Find header
            headers = [str(c).strip() if c is not None else "" for c in rows[0]]
            
            # Map column indices
            col_map = {}
            for idx, h in enumerate(headers):
                h_clean = h.replace(" ", "").replace("(g)", "").replace("(mg)", "").replace("(%)", "")
                if "제품회사명" in h_clean or "사료회사명" in h_clean:
                    col_map["company"] = idx
                elif "제품명" in h_clean or "습식사료명" in h_clean:
                    col_map["name"] = idx
                elif "단백질" in h_clean:
                    col_map["protein"] = idx
                elif "지방" in h_clean:
                    col_map["fat"] = idx
                elif "탄수화물" in h_clean and "전분" not in h_clean:
                    col_map["carb"] = idx
                elif "조섬유" in h_clean:
                    col_map["fiber"] = idx
                elif "식이섬유" in h_clean and "fiber" not in col_map:
                    col_map["dietary_fiber"] = idx
                elif "칼슘" in h_clean:
                    col_map["calcium"] = idx
                elif "인" in h_clean and "인(g)" in h or h_clean == "인":
                    col_map["phosphorus"] = idx
                elif "칼륨" in h_clean:
                    col_map["potassium"] = idx
                elif "나트륨" in h_clean:
                    col_map["sodium"] = idx
                elif "마그네슘" in h_clean:
                    col_map["magnesium"] = idx
                elif "구리" in h_clean:
                    col_map["copper"] = idx
                elif "아연" in h_clean:
                    col_map["zinc"] = idx
                elif "타우린" in h_clean:
                    col_map["taurine"] = idx
                elif "오메가3" in h_clean or "오메가 3" in h:
                    col_map["omega3"] = idx
                elif "오메가6" in h_clean or "오메가 6" in h:
                    col_map["omega6"] = idx
                elif "EPA+DHA" in h_clean or "EPA + DHA" in h:
                    col_map["epa_dha"] = idx
                elif "카르니틴" in h_clean or "L-카르니틴" in h:
                    col_map["carnitine"] = idx
                elif "수분" in h_clean:
                    col_map["moisture"] = idx

            for r_idx, row in enumerate(rows[1:], start=1):
                if not any(row):
                    continue
                company = str(row[col_map.get("company", 1)] or "").strip()
                name = str(row[col_map.get("name", 2)] or "").strip()
                if not name or name == "None":
                    continue

                count += 1
                prod_id = f"{species.value[:1]}_{feed_type[:1]}_{count:03d}"
                
                moisture_val = clean_float(row[col_map["moisture"]]) if "moisture" in col_map else default_moisture
                if moisture_val <= 0:
                    moisture_val = default_moisture
                
                # Energy density estimation (kcal/kg)
                # Dry typically 3600-4200 kcal/kg, Wet typically 800-1100 kcal/kg, Liquid ~1000
                energy_density = 3800.0 if feed_type == "건식" else (1000.0 if "리퀴드" in name else 950.0)

                nutrients = NutrientProfile(
                    protein_g=clean_float(row[col_map["protein"]]) if "protein" in col_map else 0.0,
                    fat_g=clean_float(row[col_map["fat"]]) if "fat" in col_map else 0.0,
                    carb_g=clean_float(row[col_map["carb"]]) if "carb" in col_map else 0.0,
                    fiber_g=clean_float(row[col_map["fiber"]]) if "fiber" in col_map else 0.0,
                    calcium_g=clean_float(row[col_map["calcium"]]) if "calcium" in col_map else 0.0,
                    phosphorus_g=clean_float(row[col_map["phosphorus"]]) if "phosphorus" in col_map else 0.0,
                    potassium_g=clean_float(row[col_map["potassium"]]) if "potassium" in col_map else 0.0,
                    sodium_g=clean_float(row[col_map["sodium"]]) if "sodium" in col_map else 0.0,
                    magnesium_g=clean_float(row[col_map["magnesium"]]) if "magnesium" in col_map else 0.0,
                    copper_mg=clean_float(row[col_map["copper"]]) if "copper" in col_map else 0.0,
                    zinc_mg=clean_float(row[col_map["zinc"]]) if "zinc" in col_map else 0.0,
                    taurine_g=clean_float(row[col_map["taurine"]]) if "taurine" in col_map else 0.0,
                    omega3_g=clean_float(row[col_map["omega3"]]) if "omega3" in col_map else 0.0,
                    omega6_g=clean_float(row[col_map["omega6"]]) if "omega6" in col_map else 0.0,
                    epa_dha_g=clean_float(row[col_map["epa_dha"]]) if "epa_dha" in col_map else 0.0,
                    l_carnitine_mg=clean_float(row[col_map["carnitine"]]) if "carnitine" in col_map else 0.0,
                    moisture_g=moisture_val,
                    energy_density_kcal_per_kg=energy_density
                )

                diet = DietProduct(
                    id=prod_id,
                    company=company,
                    name=name,
                    species=species,
                    type=feed_type,
                    nutrients=nutrients,
                    ingredients_text="",
                    protein_sources=tag_protein_sources(name),
                    indications=tag_indications(name),
                    moisture_percent=moisture_val if moisture_val <= 100 else (78.0 if feed_type == "습식" else 10.0)
                )
                self.diets.append(diet)

    def _load_ingredients(self):
        json_path = os.path.join(self.data_dir, "ingredients.json")
        if not os.path.exists(json_path):
            return
        
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        for idx, item in enumerate(data, start=1):
            ing = IngredientItem(
                id=f"ING_{idx:03d}",
                name=item.get("ingredient", ""),
                name_ko=item.get("name_ko", ""),
                category=item.get("category", "기타"),
                energy_kcal=float(item.get("energy_kcal", 0) or 0),
                moisture_g=float(item.get("moisture_g", 0) or 0),
                protein_g=float(item.get("protein_g", 0) or 0),
                fat_g=float(item.get("fat_g", 0) or 0),
                carb_g=float(item.get("carbohydrate_g", 0) or 0),
                fiber_g=float(item.get("total_dietary_fiber_g", 0) or 0),
                calcium_mg=float(item.get("calcium_mg", 0) or 0),
                phosphorus_mg=float(item.get("phosphorus_mg", 0) or 0),
                potassium_mg=float(item.get("potassium_mg", 0) or 0),
                sodium_mg=float(item.get("sodium_mg", 0) or 0),
                magnesium_mg=float(item.get("magnesium_mg", 0) or 0),
                copper_mg=float(item.get("copper_mg", 0) or 0),
                zinc_mg=float(item.get("zinc_mg", 0) or 0),
                iron_mg=float(item.get("iron_mg", 0) or 0),
                omega3_g=float(item.get("omega3_g", 0) or 0),
                omega6_g=float(item.get("omega6_g", 0) or 0)
            )
            self.ingredients.append(ing)

    def get_diets(self, species: Optional[Species] = None, feed_type: Optional[str] = None) -> List[DietProduct]:
        res = self.diets
        if species:
            res = [d for d in res if d.species == species]
        if feed_type:
            res = [d for d in res if d.type == feed_type]
        return res

    def get_ingredients(self, category: Optional[str] = None) -> List[IngredientItem]:
        if category:
            return [i for i in self.ingredients if i.category == category]
        return self.ingredients

# Singleton helper
_loader = None
def get_data_loader(data_dir: str = ".") -> DataLoader:
    global _loader
    if _loader is None:
        _loader = DataLoader(data_dir)
    return _loader
