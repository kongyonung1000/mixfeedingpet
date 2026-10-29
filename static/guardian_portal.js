/**
 * static/guardian_portal.js
 * 보호자용 믹스피딩 + 수의사용 믹스피딩 통합 아키텍처 (Single Backend, Dual Frontend)
 * - Role-Based Access Control & Lazy Loading
 * - [Step 1] 랜딩 및 이지 Q&A 기초 프로필 (신상, BCS/MCS, RER/MER/DER 자동 산출)
 * - [Step 2] 사료 데이터 입력 인터페이스 (DB 검색 / AI OCR 라벨 스캔 / 직접 입력)
 * - [Step 3] 핵심 메뉴 분기: 6대 믹스피딩 프로그램
 *     1) 건식 + 습식 배합기
 *     2) 건식 + 화식 배합기
 *     3) 건식 + 원재료 배합기 (영양 왜곡 방지)
 *     4) 토핑 공통 모듈 (하루 10% 허용 칼로리 안전 제어기)
 *     5) 화식 자가 만들기 (Recipe DIY Builder - 세련된 전면 리디자인 & 36대 영양소·밀프랩)
 *     6) 사료 역추적 프로그램 (Reverse-Tracing Calculator - PAVA + AI Imputation + 30대 영양소 신뢰도)
 * - [Step 4] 결과 출력 및 시각화 대시보드 (칼로리 게이지 바, AAFCO/FEDIAF 신호등 리포트, 아침/저녁 급여 스케줄표)
 */

(function () {
    "use strict";

    // =========================================================================
    // 1. 통합 상용 사료 & 습식 & 화식 & 원재료 & 토핑 데이터베이스
    // =========================================================================
    const COMMERCIAL_DRY_FOODS = [
        {
            id: "comm_rc_mini_adult",
            name: "로얄캐닌 미니 인도어 어덜트 (소형 성견용)",
            brand: "로얄캐닌 (Royal Canin)",
            species: "dog",
            type: "건식",
            protein_af: 21.0, fat_af: 14.0, fiber_af: 1.9, ash_af: 6.1, moisture_af: 9.5, ca_af: 0.82, p_af: 0.70,
            kcal_per_kg: 3765,
            ingredients_order: ["쌀", "탈수가금육단백질", "옥수수", "동물성지방", "분리대두단백", "가수분해동물성단백질", "비트펄프", "어유", "대두유", "프락토올리고당"]
        },
        {
            id: "comm_orijen_original",
            name: "오리젠 오리지널 독 (고단백 그레인프리)",
            brand: "오리젠 (Orijen)",
            species: "dog",
            type: "건식",
            protein_af: 38.0, fat_af: 18.0, fiber_af: 4.0, ash_af: 8.5, moisture_af: 10.0, ca_af: 1.40, p_af: 1.10,
            kcal_per_kg: 3860,
            ingredients_order: ["생닭고기", "생칠면조고기", "생연어", "생닭간", "통청어", "완두콩", "붉은렌틸콩", "병아리콩", "계란", "단호박"]
        },
        {
            id: "comm_acana_singles_duck",
            name: "아카나 싱글즈 프리런 오리 (단일육류 저알러지)",
            brand: "아카나 (Acana)",
            species: "dog",
            type: "건식",
            protein_af: 31.0, fat_af: 15.0, fiber_af: 5.0, ash_af: 7.5, moisture_af: 10.0, ca_af: 1.30, p_af: 1.00,
            kcal_per_kg: 3393,
            ingredients_order: ["생오리고기", "건조오리육", "녹색완두콩", "붉은렌틸콩", "생오리간", "오리지방", "병아리콩", "단호박", "배", "어유"]
        },
        {
            id: "comm_now_fresh_small",
            name: "나우 프레시 스몰브리드 어덜트 (칠면조·연어·오리)",
            brand: "나우 프레시 (NOW Fresh)",
            species: "dog",
            type: "건식",
            protein_af: 26.0, fat_af: 16.0, fiber_af: 3.5, ash_af: 7.5, moisture_af: 10.0, ca_af: 1.10, p_af: 0.75,
            kcal_per_kg: 3742,
            ingredients_order: ["순살칠면조", "감자분말", "완두콩", "사과", "전란", "카놀라유", "아마씨", "순살연어", "순살오리", "당근"]
        },
        {
            id: "comm_hills_sd_small",
            name: "힐스 사이언스 다이어트 어덜트 스몰포즈 (닭고기)",
            brand: "힐스 (Hill's)",
            species: "dog",
            type: "건식",
            protein_af: 22.5, fat_af: 14.5, fiber_af: 1.8, ash_af: 5.5, moisture_af: 9.0, ca_af: 0.85, p_af: 0.68,
            kcal_per_kg: 3740,
            ingredients_order: ["닭고기분", "양조용쌀", "통밀", "대두분", "수수", "닭지방", "보리", "옥수수글루텐", "아마씨", "당근"]
        },
        {
            id: "comm_ziwipeak_lamb",
            name: "지위픽 에어드라이 독 양고기 (초고단백 육류 96%)",
            brand: "지위픽 (ZiwiPeak)",
            species: "dog",
            type: "건식",
            protein_af: 35.0, fat_af: 33.0, fiber_af: 2.0, ash_af: 10.0, moisture_af: 14.0, ca_af: 1.80, p_af: 1.30,
            kcal_per_kg: 5200,
            ingredients_order: ["양고기", "양심장", "양트라이프", "양간", "양신장", "초록입홍합", "레시틴", "치커리이눌린", "다시마"]
        },
        {
            id: "comm_harim_thereal_chicken",
            name: "하림 더리얼 그레인프리 크런치 닭고기 어덜트",
            brand: "하림펫푸드",
            species: "dog",
            type: "건식",
            protein_af: 28.0, fat_af: 14.0, fiber_af: 4.0, ash_af: 8.5, moisture_af: 10.0, ca_af: 1.15, p_af: 0.85,
            kcal_per_kg: 3650,
            ingredients_order: ["생닭고기", "고구마", "완두콩", "닭간", "병아리콩", "닭기름", "아마씨", "당근", "브로콜리", "블루베리"]
        },
        {
            id: "comm_cat_rc_indoor",
            name: "로얄캐닌 인도어 27 (실내 성묘용)",
            brand: "로얄캐닌 (Royal Canin)",
            species: "cat",
            type: "건식",
            protein_af: 27.0, fat_af: 13.0, fiber_af: 4.0, ash_af: 7.3, moisture_af: 8.0, ca_af: 1.10, p_af: 0.84,
            kcal_per_kg: 3750,
            ingredients_order: ["탈수가금육단백질", "쌀", "밀", "옥수수", "분리대두단백", "동물성지방", "가수분해동물성단백질", "비트펄프", "어유"]
        },
        {
            id: "comm_cat_orijen_cat",
            name: "오리젠 캣 앤 키튼 (고단백 전연령 고양이)",
            brand: "오리젠 (Orijen)",
            species: "cat",
            type: "건식",
            protein_af: 40.0, fat_af: 20.0, fiber_af: 3.0, ash_af: 8.0, moisture_af: 10.0, ca_af: 1.40, p_af: 1.10,
            kcal_per_kg: 4160,
            ingredients_order: ["생닭고기", "생칠면조고기", "생연어", "통청어", "생닭간", "계란", "완두콩", "병아리콩", "명태오일"]
        }
    ];

    const COMMERCIAL_WET_AND_FRESH = [
        {
            id: "wet_rc_instinctive",
            name: "로얄캐닌 어덜트 인스팅티브 습식 파우치 (고수분)",
            brand: "로얄캐닌",
            type: "습식",
            moisture_af: 79.0, protein_af: 10.5, fat_af: 3.2, fiber_af: 1.1, ash_af: 1.6, ca_af: 0.24, p_af: 0.20,
            kcal_per_kg: 870,
            desc: "수분 79% 함유로 음수량 보충 및 신장·요로계 보호에 탁월한 주식형 습식 파우치"
        },
        {
            id: "wet_hills_id_stew",
            name: "힐스 소화기/저지방 치킨&베지터블 스튜 캔 (습식)",
            brand: "힐스",
            type: "습식",
            moisture_af: 78.0, protein_af: 5.5, fat_af: 2.2, fiber_af: 0.8, ash_af: 1.4, ca_af: 0.19, p_af: 0.14,
            kcal_per_kg: 810,
            desc: "소화기가 약하거나 췌장·장 건강 관리가 필요한 아이를 위한 저지방 고소화성 스튜"
        },
        {
            id: "wet_ziwi_mackerel_can",
            name: "지위픽 고등어 & 양고기 주식 캔 (습식)",
            brand: "지위픽",
            type: "습식",
            moisture_af: 76.0, protein_af: 10.5, fat_af: 5.5, fiber_af: 0.5, ash_af: 2.5, ca_af: 0.35, p_af: 0.28,
            kcal_per_kg: 1125,
            desc: "오메가-3가 풍부한 고등어와 양고기를 사용한 그레인프리 고기호성 주식 캔"
        },
        {
            id: "fresh_slim_chicken",
            name: "슬림 & 라이트 닭안심·단호박·양배추 화식 (다이어트/저지방)",
            brand: "맞춤 조리/상용 화식",
            type: "화식",
            moisture_af: 74.0, protein_af: 11.2, fat_af: 1.8, fiber_af: 1.2, ash_af: 1.1, ca_af: 0.26, p_af: 0.20,
            kcal_per_kg: 1050,
            desc: "삶은 닭안심 50% + 찐 단호박 25% + 데친 양배추/브로콜리 23% + 칼슘/오메가3 2%"
        },
        {
            id: "fresh_joint_beef",
            name: "머슬 & 액티브 소고기 우둔살·고구마·계란 화식 (근육/활력)",
            brand: "맞춤 조리/상용 화식",
            type: "화식",
            moisture_af: 71.0, protein_af: 13.5, fat_af: 4.2, fiber_af: 1.0, ash_af: 1.3, ca_af: 0.30, p_af: 0.24,
            kcal_per_kg: 1280,
            desc: "삶은 소고기 우둔살 50% + 삶은 계란 15% + 찐 고구마 20% + 당근/브로콜리 13% + 칼슘 2%"
        },
        {
            id: "fresh_renal_cod",
            name: "저인(Low-P) 흰살생선(대구)·백미진밥·계란흰자 화식 (신장/시니어)",
            brand: "맞춤 조리/상용 화식",
            type: "화식",
            moisture_af: 75.0, protein_af: 8.2, fat_af: 3.5, fiber_af: 0.8, ash_af: 0.9, ca_af: 0.25, p_af: 0.13,
            kcal_per_kg: 1080,
            desc: "스팀 찐 대구살 30% + 삶은 계란흰자 20% + 무염 백미진밥 30% + 단호박/양배추 18% + 연어오일/칼슘 2%"
        },
        {
            id: "fresh_skin_salmon",
            name: "피부·모질 케어 스팀 연어·귀리·블루베리 화식",
            brand: "맞춤 조리/상용 화식",
            type: "화식",
            moisture_af: 72.0, protein_af: 11.8, fat_af: 5.2, fiber_af: 1.1, ash_af: 1.2, ca_af: 0.28, p_af: 0.23,
            kcal_per_kg: 1340,
            desc: "스팀 연어 순살 48% + 익힌 귀리/감자 27% + 브로콜리/블루베리 23% + 칼슘 2%"
        }
    ];

    // 메뉴 3: 건식 + 단일 원재료 배합기용 핵심 원재료 풀
    const SINGLE_RAW_INGREDIENTS = [
        { id: "raw_chicken_breast", name: "삶은 닭가슴살/닭안심 (무염)", category: "육류", kcal_100g: 109, moisture: 73.8, protein: 22.97, fat: 1.24, ca_mg: 6, p_mg: 210, maxSafePct: 15, prepTip: "껍질과 기름기를 제거하고 끓는 물에 10분간 삶아 잘게 찢어 급여하세요. (인 함량이 높으므로 일일 칼로리의 15% 이내 권장)" },
        { id: "raw_pollack", name: "무염 황태채 / 북어살 (푹 삶아 염분 제거)", category: "어류", kcal_100g: 115, moisture: 72.0, protein: 24.5, fat: 0.9, ca_mg: 28, p_mg: 240, maxSafePct: 12, prepTip: "찬물에 1시간 이상 담가 염분을 완전히 뺀 뒤 끓는 물에 한 번 더 데쳐 가시를 발라내고 급여하세요." },
        { id: "raw_egg_whole", name: "삶은 계란 (완숙 전란)", category: "난류", kcal_100g: 138, moisture: 75.8, protein: 12.4, fat: 9.7, ca_mg: 48, p_mg: 185, maxSafePct: 15, prepTip: "날계란 흰자의 아비딘(Avidin)이 비오틴 흡수를 방해하므로 반드시 완숙으로 삶아 으깨어 주세요." },
        { id: "raw_egg_white", name: "삶은 계란 흰자 (난백 · 초저지방/저인)", category: "난류", kcal_100g: 48, moisture: 88.0, protein: 10.8, fat: 0.1, ca_mg: 7, p_mg: 14, maxSafePct: 20, prepTip: "인과 지방이 거의 없는 최고급 단백질원입니다. 신장·췌장염 환견의 단백질 보충용으로 이상적입니다." },
        { id: "raw_pumpkin", name: "찐 단호박 (씨와 껍질 제거)", category: "채소류", kcal_100g: 51, moisture: 86.2, protein: 1.66, fat: 0.24, ca_mg: 19, p_mg: 42, maxSafePct: 15, prepTip: "찜기에 부드럽게 쪄서 으깨어 급여하세요. 수용성 식이섬유가 풍부해 변 상태 개선에 도움을 줍니다." },
        { id: "raw_cabbage", name: "데친 양배추 (위장 점막 보호)", category: "채소류", kcal_100g: 24, moisture: 93.0, protein: 1.3, fat: 0.2, ca_mg: 38, p_mg: 26, maxSafePct: 10, prepTip: "비타민 U가 위점막을 보호합니다. 생으로 주면 가스가 찰 수 있으니 살짝 데쳐서 잘게 다져 주세요." },
        { id: "raw_broccoli", name: "데친 브로콜리 (꽃송이 부분)", category: "채소류", kcal_100g: 32, moisture: 90.3, protein: 3.1, fat: 0.3, ca_mg: 42, p_mg: 65, maxSafePct: 10, prepTip: "끓는 물에 1분간 살짝 데쳐 잘게 다져 주세요. 설포라판 항산화 성분이 풍부합니다." },
        { id: "raw_sweetpotato", name: "찐 고구마 (껍질 제거)", category: "감자류", kcal_100g: 134, moisture: 65.5, protein: 1.5, fat: 0.2, ca_mg: 24, p_mg: 46, maxSafePct: 10, prepTip: "혈당 지수(GI)와 칼로리가 높으므로 하루 권장 칼로리의 10%를 넘지 않도록 주의하세요." },
        { id: "raw_tofu", name: "무염 순두부 / 끓는 물에 데친 두부", category: "콩류", kcal_100g: 84, moisture: 82.5, protein: 8.5, fat: 4.6, ca_mg: 120, p_mg: 110, maxSafePct: 15, prepTip: "끓는 물에 3분간 데쳐 간수(염분)를 빼고 으깨어 급여하세요. 식물성 단백질로 간 부담이 적습니다." },
        { id: "raw_beef_round", name: "삶은 소고기 우둔살/홍두깨살 (살코기)", category: "육류", kcal_100g: 132, moisture: 71.5, protein: 21.8, fat: 4.3, ca_mg: 8, p_mg: 198, maxSafePct: 15, prepTip: "기름기가 없는 살코기 부위를 끓는 물에 삶아 육수는 버리고 살코기만 잘게 다져 급여하세요." }
    ];

    // 메뉴 4: 토핑/간식 10% 안전 제어기용 프리셋
    const TOPPING_SNACK_ITEMS = [
        { id: "top_jerky", name: "소고기/오리 육포 (1조각, 약 8g)", unitLabel: "조각", weightPerUnitG: 8, kcalPerUnit: 26, proteinPct: 55, fatPct: 8, warning: "고단백·고인 간식이므로 신장/췌장 질환 시 주의" },
        { id: "top_freezedried", name: "동결건조 닭가슴살/북어 트릿 (5개, 약 5g)", unitLabel: "회분(5알)", weightPerUnitG: 5, kcalPerUnit: 19, proteinPct: 78, fatPct: 5, warning: "수분이 거의 없으므로 급여 시 음수량을 함께 늘려주세요" },
        { id: "top_churu", name: "짜먹는 액상 스틱 간식 (츄르 1포, 14g)", unitLabel: "스틱(14g)", weightPerUnitG: 14, kcalPerUnit: 9, proteinPct: 8, fatPct: 1.5, warning: "나트륨/인 함량을 확인하고 하루 1~2포 이내로 제한하세요" },
        { id: "top_dental", name: "소형견 덴탈껌 (1개, 약 15g)", unitLabel: "개", weightPerUnitG: 15, kcalPerUnit: 48, proteinPct: 12, fatPct: 2.5, warning: "생각보다 칼로리가 높습니다! 급여 시 저녁 사료량을 반드시 줄여주세요" },
        { id: "top_cheese", name: "반려동물용 무염 코티지/슬라이스 치즈 (1장, 12g)", unitLabel: "장", weightPerUnitG: 12, kcalPerUnit: 32, proteinPct: 18, fatPct: 18, warning: "지방 함량이 높으므로 췌장염 이력이 있다면 피하세요" },
        { id: "top_apple_berry", name: "사과/블루베리 과일 토핑 (한 줌, 20g)", unitLabel: "줌(20g)", weightPerUnitG: 20, kcalPerUnit: 11, proteinPct: 0.5, fatPct: 0.2, warning: "사과 씨는 독성이 있으므로 반드시 제거 후 급여하세요" }
    ];

    // =========================================================================
    // 2. 보호자 포털 전역 상태 (Guardian App State)
    // =========================================================================
    const guardianState = {
        initialized: false,
        currentStep: 1,
        activeMenu: 1, // 1: 건식+습식, 2: 건식+화식, 3: 건식+원재료, 4: 토핑 10% 제어기, 5: 화식 DIY 빌더, 6: 사료 역추적
        profile: {
            species: "dog",
            name: "보리",
            breed: "말티즈",
            weightKg: 4.5,
            lifeStage: "adult", // puppy_young, puppy_older, adult, senior, pregnant
            neutered: true,
            activity: "moderate", // low, moderate, high, very_high
            bcs: 5,
            mcs: 4,
            fecalScore: 3.5,
            mealsPerDay: 2,
            healthConcern: "none" // none, ckd, pancreatitis, heart, liver, urolithiasis, obesity, ibd
        },
        energy: {
            rer: 216,
            der: 346,
            idealWeightKg: 4.5,
            factor: 1.6,
            maxTreatKcal: 34.6,
            perMealKcal: 173
        },
        selectedDryFood: { ...COMMERCIAL_DRY_FOODS[0] },
        menu1: {
            wetFoodId: "wet_rc_instinctive",
            dryRatioPct: 70
        },
        menu2: {
            freshFoodId: "fresh_slim_chicken",
            dryRatioPct: 70
        },
        menu3: {
            rawIngId: "raw_chicken_breast",
            rawRatioPct: 10
        },
        menu4: {
            selectedToppings: {
                "top_jerky": 0,
                "top_freezedried": 1,
                "top_churu": 1,
                "top_dental": 0,
                "top_cheese": 0,
                "top_apple_berry": 0
            }
        },
        menu5_diy: {
            prepDays: 7,
            targetDisease: "none",
            items: [
                { id: "ing_57", name_ko: "닭고기, 가슴, 삶은것", ratio: 48.0 },
                { id: "ing_0", name_ko: "귀리, 겉귀리, 도정, 밥", ratio: 22.0 },
                { id: "ing_44", name_ko: "호박, 단호박, 찐것", ratio: 18.0 },
                { id: "ing_35", name_ko: "양배추, 삶은것", ratio: 9.8 },
                { id: "supp_salmon_oil", name_ko: "정제 연어오일/어유 (오메가-3 보충)", ratio: 1.6 },
                { id: "supp_eggshell", name_ko: "난각분말 (계란껍질 칼슘보충제)", ratio: 0.6 }
            ]
        },
        menu6_reverse: {
            selectedIngIds: [],
            enableImputation: true,
            lastResult: null
        },
        fecalKit: {
            preset: "normal",
            phLevel: "normal",      // normal (6.4) | acidic (5.4) | alkaline (7.6)
            phValue: 6.4,
            ammonia: "normal",      // normal | warn | high
            indole: "normal",       // normal | warn | high
            undigestedFat: "neg",   // neg | trace | pos
            reducingSugar: "normal",// normal | warn | high
            mucosalInflam: "neg",   // neg | trace | pos
            stoolOdor: "mild",      // mild | sour | foul
            mucusSeen: "no",        // no | sometimes | yes
            estimatedAbsorption: 93.0,
            applyAbsorptionToDiet: false
        },
        charts: {
            calDonut: null,
            macroBar: null,
            unifiedRadar: null
        },
        activeSchemaTab: "schema_patient"
    };
    window.guardianState = guardianState;
    let isSyncingStep6 = false;

    // =========================================================================
    // 3. 수학 및 임상 영양 코어 연산 함수 (공통 백엔드 로직)
    // =========================================================================
    function getActiveDryFoodMetrics() {
        return calcDryFoodMetrics(guardianState.selectedDryFood);
    }

    function calcDryFoodMetrics(food) {
        const moisture = Math.min(88, Math.max(1, parseFloat(food.moisture_af) || 10.0));
        const dmFactor = (100.0 - moisture) / 100.0;
        const p_af = parseFloat(food.protein_af) || 24.0;
        const f_af = parseFloat(food.fat_af) || 14.0;
        const fb_af = parseFloat(food.fiber_af) || 3.0;
        const ash_af = parseFloat(food.ash_af) || 6.5;
        const ca_af = parseFloat(food.ca_af) || 1.0;
        const phos_af = parseFloat(food.p_af) || 0.8;

        const nfe_af = Math.max(0, 100.0 - moisture - p_af - f_af - fb_af - ash_af);
        // Modified Atwater ME (kcal/kg AF)
        const autoKcalKg = Math.round(((3.5 * p_af) + (8.5 * f_af) + (3.5 * nfe_af)) * 10);
        const kcal_per_kg = parseFloat(food.kcal_per_kg) || autoKcalKg;

        return {
            ...food,
            moisture_af: moisture,
            nfe_af: Math.round(nfe_af * 10) / 10,
            kcal_per_kg,
            p_dm: Math.round((p_af / dmFactor) * 10) / 10,
            f_dm: Math.round((f_af / dmFactor) * 10) / 10,
            fb_dm: Math.round((fb_af / dmFactor) * 10) / 10,
            ash_dm: Math.round((ash_af / dmFactor) * 10) / 10,
            nfe_dm: Math.round((nfe_af / dmFactor) * 10) / 10,
            ca_dm: Math.round((ca_af / dmFactor) * 100) / 100,
            phos_dm: Math.round((phos_af / dmFactor) * 100) / 100,
            ca_p_ratio: phos_af > 0 ? Math.round((ca_af / phos_af) * 100) / 100 : 1.25
        };
    }

    const GUARDIAN_CONSULT_CONCERNS = ["heart","ckd","pancreatitis","cushing","liver","gallbladder","ibd","diabetes","urolithiasis","cognitive","hypothyroid","addison","oncology","hypertension","obesity","osteoarthritis","atopy"];
    function isGuardianConsultVet() {
        return GUARDIAN_CONSULT_CONCERNS.includes(guardianState.profile.healthConcern);
    }

    function computeGuardianEnergy() {
        if (isGuardianConsultVet()) {
            guardianState.energy = { rer: 0, der: 0, idealWeightKg: 0, factor: 0, maxTreatKcal: 0, perMealKcal: 0, consultVet: true, fecalNote: "수의사와 상담하세요." };
            return guardianState.energy;
        }
        const p = guardianState.profile;
        const w = Math.max(0.5, parseFloat(p.weightKg) || 4.5);
        const bcs = parseInt(p.bcs) || 5;
        const idealW = Math.round((w / (1.0 + (bcs - 5) * 0.10)) * 100) / 100;

        // 비만(BCS >= 7)일 때는 이상 체중 기준 RER 적용
        const baseW = bcs >= 7 ? idealW : w;
        const rer = Math.round(70.0 * Math.pow(baseW, 0.75) * 10) / 10;

        let factor = 1.6;
        const isDog = p.species === "dog";

        if (p.lifeStage === "puppy_young") factor = isDog ? 3.0 : 2.5;
        else if (p.lifeStage === "puppy_older") factor = isDog ? 2.0 : 2.0;
        else if (p.lifeStage === "pregnant") factor = isDog ? 3.0 : 2.5;
        else if (bcs >= 8) factor = isDog ? 1.0 : 0.8;
        else if (bcs === 7) factor = isDog ? 1.1 : 0.9;
        else if (bcs <= 3) factor = isDog ? 1.8 : 1.5;
        else if (p.lifeStage === "senior") {
            factor = isDog ? (p.neutered ? 1.3 : 1.4) : (p.neutered ? 1.1 : 1.2);
        } else {
            factor = isDog ? (p.neutered ? 1.6 : 1.8) : (p.neutered ? 1.2 : 1.4);
        }

        // 활동량 보정
        if (p.activity === "low") factor = Math.max(0.8, Math.round((factor - 0.2) * 10) / 10);
        else if (p.activity === "high") factor = Math.round((factor + 0.2) * 10) / 10;
        else if (p.activity === "very_high") factor = Math.round((factor + 0.5) * 10) / 10;

        // 변 상태(흡수율) 및 Step 5 분변키트 흡수율 보정
        let fecalNote = "정상 소화 흡수율 (92~95%)";
        if (p.fecalScore >= 6.0) {
            fecalNote = "수양성/설사 변 상태 감지 — 소화 부담 완화를 위해 저지방·고소화성 배합 권장";
        } else if (p.fecalScore >= 4.5) {
            fecalNote = "무른 변 상태 감지 — 간식/토핑을 5% 이내로 줄이고 식이섬유 밸런스 조절 권장";
        }

        let der = Math.round(rer * factor);
        if (guardianState.fecalKit && guardianState.fecalKit.applyAbsorptionToDiet) {
            const abs = Math.max(60, Math.min(98, parseFloat(guardianState.fecalKit.estimatedAbsorption) || 93.0));
            const absRatio = 90.0 / abs; // 정상 흡수율(90%) 대비 보정
            der = Math.round(der * Math.min(1.18, Math.max(0.88, absRatio)));
            fecalNote = `[Step 5 분변키트 연동됨] 추정 소화 흡수율 ${abs.toFixed(1)}% 반영 (목표 열량 자동 보정)`;
        }

        const maxTreatKcal = Math.round(der * 0.10 * 10) / 10;
        const meals = parseInt(p.mealsPerDay) || 2;
        const perMealKcal = Math.round(der / meals);

        guardianState.energy = {
            rer,
            der,
            idealWeightKg: idealW,
            factor,
            maxTreatKcal,
            perMealKcal,
            fecalNote
        };
        return guardianState.energy;
    }

    function getAafcoStandardForProfile() {
        const p = guardianState.profile;
        const isDog = p.species === "dog";
        const isGrowth = p.lifeStage === "puppy_young" || p.lifeStage === "puppy_older" || p.lifeStage === "pregnant";

        if (isDog) {
            return isGrowth
                ? { label: "강아지 성장기/번식기 (AAFCO/FEDIAF)", p_min: 22.5, p_max: 42.0, f_min: 8.5, f_max: 25.0, ca_min: 1.2, ca_max: 1.8, phos_min: 1.0, phos_max: 1.6, cap_min: 1.1, cap_max: 1.8 }
                : { label: "성견/시니어 유지기 (AAFCO/FEDIAF)", p_min: 18.0, p_max: 38.0, f_min: 5.5, f_max: 22.0, ca_min: 0.5, ca_max: 1.8, phos_min: 0.4, phos_max: 1.4, cap_min: 1.0, cap_max: 2.0 };
        } else {
            return isGrowth
                ? { label: "고양이 성장기/번식기 (AAFCO/FEDIAF)", p_min: 30.0, p_max: 50.0, f_min: 9.0, f_max: 28.0, ca_min: 1.0, ca_max: 1.8, phos_min: 0.8, phos_max: 1.6, cap_min: 1.0, cap_max: 1.8 }
                : { label: "성묘/시니어 유지기 (AAFCO/FEDIAF)", p_min: 26.0, p_max: 46.0, f_min: 9.0, f_max: 25.0, ca_min: 0.6, ca_max: 1.8, phos_min: 0.5, phos_max: 1.4, cap_min: 1.0, cap_max: 2.0 };
        }
    }

    // =========================================================================
    // 4. 듀얼 포털 랜딩 게이트 & 상단 모드 스위처 주입
    // =========================================================================
    function setupDualPortalLandingAndHeader() {
        const shield = document.getElementById("private-gate-shield");
        if (shield && !document.getElementById("dual-portal-role-cards")) {
            const innerCard = shield.firstElementChild;
            if (innerCard) {
                innerCard.style.maxWidth = "960px";
                innerCard.className = (innerCard.className || "") + " p-4 sm:p-7 md:p-8";
                innerCard.style.padding = ""; // 클래스(p-4 sm:p-7 md:p-8)로 반응형 여백 제어

                const existingContent = innerCard.innerHTML;
                innerCard.innerHTML = `
                    <!-- 듀얼 포털 선택 화면 (Role-Based Access Control) -->
                    <div id="dual-portal-role-cards">
                        <div class="flex items-center justify-center flex-wrap gap-2 mb-3">
                            <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">100% 무료</span>
                            <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">로그인 없이</span>
                            <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">1분이면 끝</span>
                        </div>
                        <h2 style="font-size: 30px; line-height: 1.25; font-weight: 900; color: #0f172a; margin: 0 0 8px; letter-spacing: -0.8px;">
                            🐾 우리 아이 밥, 이제 <span style="color:#059669;">'감'</span>이 아니라 <span style="color:#059669;">'계산'</span>으로
                        </h2>
                        <p style="font-size: 14.5px; color: #475569; margin: 0 0 24px;">
                            "이만큼 주는 게 맞나?" 매일 하던 고민, 우리 아이 몸에 딱 맞는 한 끼로 끝내세요.
                        </p>

                        <!-- 보호자용 60% : 수의사용 40% 비중 레이아웃 (충분한 내부/외부 여백 및 모바일 가독성 최적화) -->
                        <div class="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6 text-left items-stretch my-2">
                            <!-- [Frontend A] 보호자용 메인 카드 (약 60%) -->
                            <div onclick="enterGuardianPortal()" class="lg:col-span-3 p-5 sm:p-7 rounded-3xl transition flex flex-col justify-between" style="cursor: pointer; border: 2.5px solid #10b981; background: linear-gradient(145deg, #ecfdf5 0%, #ffffff 100%); box-shadow: 0 16px 32px -10px rgba(16, 185, 129, 0.25);">
                                <div>
                                    <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
                                        <span class="bg-emerald-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-sm">
                                            🐾 보호자용 · 맞춤 믹스피딩
                                        </span>
                                        <span class="text-xs text-emerald-800 font-extrabold bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg">
                                            100% 무료 · 즉시 시작
                                        </span>
                                    </div>

                                    <h3 class="text-xl sm:text-2xl font-black text-emerald-950 mb-2 leading-tight tracking-tight break-keep">
                                        우리 아이 맞춤 한 끼, 밥상 혁명
                                    </h3>
                                    <p class="text-xs sm:text-sm text-emerald-850 leading-relaxed mb-4 text-slate-600 break-keep">
                                        어려운 수의학 용어 없이 쉬운 질문 몇 개로 <strong class="text-emerald-900 font-black">하루 필요 칼로리</strong>부터 <strong class="text-emerald-900 font-black">아침·저녁 맞춤 급여표</strong>까지 1분 만에 완성하세요.
                                    </p>

                                    <!-- 보호자용 4대 핵심 기능 그리드 (내부 패딩 & 갭 여유 확보) -->
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
                                        <div class="bg-white/90 border border-emerald-200/90 rounded-xl p-3 shadow-sm">
                                            <div class="text-xs font-black text-emerald-900 flex items-center space-x-1 mb-1">
                                                <span>⚖️</span> <span>하루 정확한 칼로리</span>
                                            </div>
                                            <div class="text-[11.5px] text-slate-500 leading-snug break-keep">체중·체형·활동량 기반 RER·DER 산출</div>
                                        </div>
                                        <div class="bg-white/90 border border-emerald-200/90 rounded-xl p-3 shadow-sm">
                                            <div class="text-xs font-black text-emerald-900 flex items-center space-x-1 mb-1">
                                                <span>📷</span> <span>포장지 AI 스캔 & 검색</span>
                                            </div>
                                            <div class="text-[11.5px] text-slate-500 leading-snug break-keep">사료 DB 검색 및 라벨 OCR 영양 분석</div>
                                        </div>
                                        <div class="bg-white/90 border border-emerald-200/90 rounded-xl p-3 shadow-sm">
                                            <div class="text-xs font-black text-emerald-900 flex items-center space-x-1 mb-1">
                                                <span>🍲</span> <span>6가지 맞춤 식단</span>
                                            </div>
                                            <div class="text-[11.5px] text-slate-500 leading-snug break-keep">건+습식·화식·토핑·DIY·역추적</div>
                                        </div>
                                        <div class="bg-white/90 border border-emerald-200/90 rounded-xl p-3 shadow-sm">
                                            <div class="text-xs font-black text-emerald-900 flex items-center space-x-1 mb-1">
                                                <span>🚦</span> <span>AAFCO 신호등 리포트</span>
                                            </div>
                                            <div class="text-[11.5px] text-slate-500 leading-snug break-keep">영양 과부족 체크 및 아침/저녁 급여표</div>
                                        </div>
                                    </div>
                                </div>

                                <button type="button" onclick="event.stopPropagation(); enterGuardianPortal();" class="w-full py-3.5 sm:py-4 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-sm sm:text-base shadow-lg hover:shadow-emerald-500/25 transition active:scale-[0.98] flex items-center justify-center space-x-2">
                                    <span>🐾 보호자용 무료 믹스피딩 시작 ➔</span>
                                </button>
                            </div>

                            <!-- [Frontend B] 수의사용 대폭 확대 카드 (약 40%) -->
                            <div onclick="showVetLoginFormInGate()" class="lg:col-span-2 p-5 sm:p-7 rounded-3xl transition flex flex-col justify-between" style="cursor: pointer; border: 2.5px solid #3b82f6; background: linear-gradient(145deg, #eff6ff 0%, #ffffff 100%); box-shadow: 0 16px 32px -10px rgba(37, 99, 235, 0.25);">
                                <div>
                                    <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
                                        <span class="bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-sm">
                                            🩺 수의사 전용 (PRO)
                                        </span>
                                        <span class="text-xs text-blue-800 font-extrabold bg-blue-100 border border-blue-300 px-2.5 py-1 rounded-lg">
                                            임상 인증 접속
                                        </span>
                                    </div>

                                    <h3 class="text-xl sm:text-2xl font-black text-blue-950 mb-2 leading-tight tracking-tight break-keep">
                                        임상 영양 CDSS & 차트
                                    </h3>
                                    <p class="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 break-keep">
                                        복합질환 영양 상충 해결 알고리즘과 9대 분변 마커 정밀 처방 및 수의 EMR 시스템입니다.
                                    </p>

                                    <!-- 수의사용 핵심 임상 기능 목록 -->
                                    <div class="bg-white/90 border border-blue-200/90 rounded-xl p-3.5 shadow-sm mb-5">
                                        <ul class="text-xs text-slate-700 space-y-2 list-none p-0 m-0">
                                            <li class="flex items-center space-x-2">
                                                <span class="text-blue-600 font-bold">🩺</span>
                                                <span class="break-keep"><strong>[Tab 1~3]</strong> 28종 복합질환 & 처방식 믹스피딩</span>
                                            </li>
                                            <li class="flex items-center space-x-2">
                                                <span class="text-blue-600 font-bold">🔬</span>
                                                <span class="break-keep"><strong>[Tab 4]</strong> 장내 9대 마커 + 혈액(ΔW_Lab) CDSS</span>
                                            </li>
                                            <li class="flex items-center space-x-2">
                                                <span class="text-blue-600 font-bold">📋</span>
                                                <span class="break-keep"><strong>[Tab 5]</strong> 병원 환자별 차트(EMR) 초진·재진 비교</span>
                                            </li>
                                            <li class="flex items-center space-x-2">
                                                <span class="text-blue-600 font-bold">🔄</span>
                                                <span class="break-keep"><strong>[연동]</strong> 보호자 상담 데이터 실시간 수신</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <button type="button" onclick="event.stopPropagation(); showVetLoginFormInGate();" class="w-full py-3.5 sm:py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm sm:text-base shadow-lg hover:shadow-blue-500/25 transition active:scale-[0.98] flex items-center justify-center space-x-2">
                                    <span>🩺 수의사 로그인 / CDSS 접속 ➔</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 수의사 전용 로그인/회원가입 컨테이너 (클릭 시 표시) -->
                    <div id="vet-auth-box-wrapper" style="display: none; max-width: 420px; margin: 0 auto;">
                        <div style="margin-bottom: 14px; text-align: left;">
                            <button type="button" onclick="backToDualPortalCards()" style="background: #f1f5f9; color: #334155; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer;">
                                ← 포털 선택 화면으로 돌아가기
                            </button>
                        </div>
                        ${existingContent}
                    </div>
                `;
            }
        }

        // 상단 글로벌 모드 전환 스위처 바 추가
        if (!document.getElementById("global-portal-switcher-bar")) {
            const switcherBar = document.createElement("div");
            switcherBar.id = "global-portal-switcher-bar";
            switcherBar.className = "bg-slate-900 text-white border-b border-slate-800 px-4 py-2 text-xs sticky top-0 z-[60]";
            switcherBar.innerHTML = `
                <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center space-x-2">
                        <span class="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 font-black text-[11px]">Dual Frontend</span>
                        <span id="current-portal-indicator" class="font-bold text-emerald-300">현재 화면: 🐾 보호자용 믹스피딩 & 화식·역추적 포털</span>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                        <button type="button" onclick="enterGuardianPortal()" id="top-switch-guardian-btn" class="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black transition flex items-center space-x-1 shadow">
                            <i class="fa-solid fa-paw"></i>
                            <span>🐾 보호자용 포털 (Easy Q&A · 6대 메뉴)</span>
                        </button>
                        <button type="button" onclick="switchToVetPortalFromTop()" id="top-switch-vet-btn" class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700 font-bold transition flex items-center space-x-1">
                            <i class="fa-solid fa-user-doctor"></i>
                            <span>🩺 수의사용 PRO 포털 (임상 CDSS)</span>
                        </button>
                        <button type="button" onclick="openAdminSchemaDashboardModal()" id="top-admin-schema-btn" class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 font-black transition flex items-center space-x-1 shadow">
                            <i class="fa-solid fa-lock"></i>
                            <span>🔒 관리자 대시보드 & 데이터 스키마</span>
                        </button>
                        <button type="button" onclick="openDualLandingModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold transition">
                            <i class="fa-solid fa-house"></i> 포털 선택창
                        </button>
                    </div>
                </div>
            `;
            document.body.insertBefore(switcherBar, document.body.firstChild);
        }
        if (shield) {
            backToDualPortalCards();
            shield.style.setProperty("display", "flex", "important");
        }
    }

    window.showVetLoginFormInGate = function () {
        // 만약 이미 수의사 로그인 세션이 있으면 바로 수의사 뷰로 진입
        const rawSession = sessionStorage.getItem("vet_mix_auth_user");
        if (rawSession) {
            enterVetPortalDirect();
            return;
        }
        const roleCards = document.getElementById("dual-portal-role-cards");
        const authBox = document.getElementById("vet-auth-box-wrapper");
        const shield = document.getElementById("private-gate-shield");
        if (shield && shield.firstElementChild) {
            shield.firstElementChild.style.maxWidth = "460px";
        }
        if (roleCards) roleCards.style.display = "none";
        if (authBox) authBox.style.display = "block";
    };

    window.backToDualPortalCards = function () {
        const roleCards = document.getElementById("dual-portal-role-cards");
        const authBox = document.getElementById("vet-auth-box-wrapper");
        const shield = document.getElementById("private-gate-shield");
        if (shield && shield.firstElementChild) {
            shield.firstElementChild.style.maxWidth = "880px";
        }
        if (authBox) authBox.style.display = "none";
        if (roleCards) roleCards.style.display = "block";
    };

    window.openDualLandingModal = function () {
        const shield = document.getElementById("private-gate-shield");
        if (shield) {
            backToDualPortalCards();
            shield.style.setProperty("display", "flex", "important");
        }
    };

    window.switchToVetPortalFromTop = function () {
        const rawSession = sessionStorage.getItem("vet_mix_auth_user");
        if (rawSession) {
            enterVetPortalDirect();
        } else {
            const shield = document.getElementById("private-gate-shield");
            if (shield) {
                shield.style.setProperty("display", "flex", "important");
                showVetLoginFormInGate();
            }
        }
    };

    function setVetElementsVisibility(visible) {
        const vetHeader = document.querySelector("body > header");
        const vetNav = document.querySelector("body > nav");
        const vetMain = document.querySelector("body > main");
        const vetFooter = document.querySelector("body > footer");
        [vetHeader, vetNav, vetMain, vetFooter].forEach(el => {
            if (el) el.style.display = visible ? "" : "none";
        });
    }

    // 보호자 화면에서는 수의사 로그인 전까지 수의사용/관리자 전환 버튼을 숨김 (포털 분리)
    function syncSwitcherRoleVisibility() {
        const isVet = !!sessionStorage.getItem("vet_mix_auth_user");
        ['top-switch-vet-btn', 'top-admin-schema-btn'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = isVet ? '' : 'none';
        });
    }

    window.enterVetPortalDirect = function () {
        const shield = document.getElementById("private-gate-shield");
        if (shield) shield.style.setProperty("display", "none", "important");

        const gRoot = document.getElementById("guardian-portal-root");
        if (gRoot) gRoot.classList.add("hidden");
        syncSwitcherRoleVisibility();

        setVetElementsVisibility(true);

        if (typeof window.syncStickyTopBars === "function") {

            window.syncStickyTopBars();

            setTimeout(window.syncStickyTopBars, 50);

        }

        const ind = document.getElementById("current-portal-indicator");
        if (ind) {
            ind.innerText = "현재 화면: 🩺 수의사용 PRO 임상 영양 & 9대 마커 CDSS 포털";
            ind.className = "font-bold text-sky-300";
        }
        const gBtn = document.getElementById("top-switch-guardian-btn");
        const vBtn = document.getElementById("top-switch-vet-btn");
        if (gBtn && vBtn) {
            gBtn.className = "px-3 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700 font-bold transition flex items-center space-x-1";
            vBtn.className = "px-3 py-1 rounded-lg bg-blue-500 text-white font-black transition flex items-center space-x-1 shadow";
        }
    };

    // 수의사/관리자 로그인 성공 시 자동으로 수의사용 포털 뷰 또는 예약된 관리자 스키마 모달 활성화
    const origOnVetSwitched = window.onVetAccountSwitched;
    window.onVetAccountSwitched = function (userProfile) {
        if (typeof origOnVetSwitched === "function") origOnVetSwitched(userProfile);
        if (guardianState.pendingAdminSchemaOpen) {
            guardianState.pendingAdminSchemaOpen = false;
            const shield = document.getElementById("private-gate-shield");
            if (shield) shield.style.setProperty("display", "none", "important");
            openAdminSchemaDashboardModal();
        } else {
            enterVetPortalDirect();
        }
    };

    // =========================================================================
    // 5. 보호자용 포털 진입 및 지연 렌더링 (Lazy Initialization)
    // =========================================================================
    window.enterGuardianPortal = function () {
        const shield = document.getElementById("private-gate-shield");
        if (shield) shield.style.setProperty("display", "none", "important");

        // 수의사용 무거운 화면은 숨김
        setVetElementsVisibility(false);

        let gRoot = document.getElementById("guardian-portal-root");
        if (!gRoot) {
            gRoot = document.createElement("div");
            gRoot.id = "guardian-portal-root";
            gRoot.className = "min-h-screen bg-slate-50 pb-20";
            document.body.appendChild(gRoot);
        }
        gRoot.classList.remove("hidden");
        syncSwitcherRoleVisibility();

        const ind = document.getElementById("current-portal-indicator");
        if (ind) {
            ind.innerText = "현재 화면: 🐾 보호자용 믹스피딩 & 화식·역추적 포털";
            ind.className = "font-bold text-emerald-300";
        }
        const gBtn = document.getElementById("top-switch-guardian-btn");
        const vBtn = document.getElementById("top-switch-vet-btn");
        if (gBtn && vBtn) {
            gBtn.className = "px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black transition flex items-center space-x-1 shadow";
            vBtn.className = "px-3 py-1 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700 font-bold transition flex items-center space-x-1";
        }

        if (!guardianState.initialized) {
            buildGuardianPortalDOM(gRoot);
            guardianState.initialized = true;
            // 초기 역추적 원재료 세팅
            syncReverseIngredientsFromDryFood();
            refreshAllGuardianCalculations();
        }
        if (window.guardianAuthModule && typeof window.guardianAuthModule.updateAuthUI === "function") {
            window.guardianAuthModule.updateAuthUI();
        }
    };

    // =========================================================================
    // 6. 보호자용 포털 전체 UI 빌드 (Step 1 ~ Step 4 + 6대 핵심 메뉴)
    // =========================================================================
    function buildGuardianPortalDOM(container) {
        container.innerHTML = `
            <!-- 보호자용 전용 헤더 -->
            <div class="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 text-white shadow-lg">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center space-x-3.5">
                        <div class="bg-white text-emerald-700 p-3 rounded-2xl shadow-md text-2xl">
                            <i class="fa-solid fa-bowl-rice"></i>
                        </div>
                        <div>
                            <div class="flex items-center space-x-2">
                                <span class="px-2.5 py-0.5 rounded-full bg-amber-300 text-slate-950 text-[11px] font-black">보호자 맞춤형 이지 케어</span>
                                <span class="text-xs text-emerald-100">AAFCO · FEDIAF 국제 영양 기준 연동</span>
                            </div>
                            <h1 class="text-xl sm:text-2xl font-black tracking-tight mt-0.5">우리 아이 맞춤 믹스피딩 · 화식 DIY · 사료 역추적 스튜디오</h1>
                        </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 text-xs">
                        <div id="guardian-auth-header-slot"></div>
                        <button type="button" onclick="sendGuardianDataToVetCdss()" class="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 font-black shadow-md flex items-center space-x-1.5 transition">
                            <i class="fa-solid fa-stethoscope text-emerald-600"></i>
                            <span>이 결과를 수의사용 정밀 CDSS로 연동하기 ➔</span>
                        </button>
                    </div>
                </div>

            </div>
            <!-- 5단계 스텝 바로가기 바 (스크롤 시 상단 고정) -->
            <div id="guardian-sticky-step-bar" class="bg-emerald-900/95 backdrop-blur-md border-b border-emerald-700/60 sticky top-[38px] z-[55] shadow-md">
                <div>
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 grid grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
                        <button type="button" onclick="scrollToGuardianSection('g-step1-sec')" class="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-left transition flex items-center space-x-2.5">
                            <span class="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0">1</span>
                            <div>
                                <div class="font-black text-white">[Step 1] 기초 프로필 & Q&A</div>
                                <div class="text-[11px] text-emerald-200">체형(BCS/MCS) · RER/DER 산출</div>
                            </div>
                        </button>
                        <button type="button" onclick="scrollToGuardianSection('g-step2-sec')" class="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-left transition flex items-center space-x-2.5">
                            <span class="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0">2</span>
                            <div>
                                <div class="font-black text-white">[Step 2] 사료 데이터 입력</div>
                                <div class="text-[11px] text-emerald-200">DB 검색 · OCR 스캔 · 직접 입력</div>
                            </div>
                        </button>
                        <button type="button" onclick="scrollToGuardianSection('g-step3-sec')" class="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-left transition flex items-center space-x-2.5">
                            <span class="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0">3</span>
                            <div>
                                <div class="font-black text-white">[Step 3] 6대 믹스피딩 프로그램</div>
                                <div class="text-[11px] text-emerald-200">배합기 · 토핑10% · 화식DIY · 역추적</div>
                            </div>
                        </button>
                        <button type="button" onclick="scrollToGuardianSection('g-step4-sec')" class="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-left transition flex items-center space-x-2.5">
                            <span class="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0">4</span>
                            <div>
                                <div class="font-black text-white">[Step 4] 신호등 리포트 & 급여표</div>
                                <div class="text-[11px] text-emerald-200">칼로리 게이지 · 아침/저녁 스케줄</div>
                            </div>
                        </button>
                        <button type="button" onclick="scrollToGuardianSection('g-step5-sec')" class="p-2 rounded-xl bg-amber-400/25 hover:bg-amber-400/35 border border-amber-300/40 text-left transition flex items-center space-x-2.5 col-span-2 lg:col-span-1">
                            <span class="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0">5</span>
                            <div>
                                <div class="font-black text-amber-200">[Step 5] 분변키트 & 장내환경</div>
                                <div class="text-[11px] text-emerald-100">키트 결과 입력 · 장내환경 쉬운 해설</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 메인 컨텐츠 영역 -->
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

                <!-- ================================================================== -->
                <!-- [STEP 1] 랜딩 및 기초 프로필 페이지 (Easy Q&A Assessment) -->
                <!-- ================================================================== -->
                <section id="g-step1-sec" class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
                    <div class="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
                        <div class="flex items-center space-x-3">
                            <span class="px-3 py-1 rounded-xl bg-emerald-600 text-white font-black text-xs">STEP 1</span>
                            <div>
                                <h2 class="text-lg sm:text-xl font-black text-slate-900">우리 아이 기초 프로필 & 쉬운 Q&A 체형 진단 (Landing & Assessment)</h2>
                                <p class="text-xs text-slate-500">질문에 맞게 카드를 선택하시면 기초대사량(RER)과 하루 권장 칼로리(MER/DER)가 자동으로 계산됩니다.</p>
                            </div>
                        </div>
                        <span class="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">이지 플로우 Q&A</span>
                    </div>

                    <!-- Q1. 기본 신상 정보 -->
                    <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                        <div class="text-sm font-black text-slate-800 flex items-center space-x-2">
                            <span class="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">Q1</span>
                            <span>아이의 기본 정보(이름, 종류, 생애주기, 체중, 중성화 여부)를 알려주세요.</span>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                            <div>
                                <label class="block font-bold text-slate-600 mb-1">반려동물 종류</label>
                                <select id="g-species" onchange="onGuardianProfileChange()" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800">
                                    <option value="dog" selected>🐶 강아지 (Canine)</option>
                                    <option value="cat">🐱 고양이 (Feline)</option>
                                </select>
                            </div>
                            <div>
                                <label class="block font-bold text-slate-600 mb-1">아이 이름</label>
                                <input type="text" id="g-name" value="보리" oninput="onGuardianProfileChange()" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-600 mb-1">품종</label>
                                <input type="text" id="g-breed" value="말티즈" oninput="onGuardianProfileChange()" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-600 mb-1">현재 체중 (kg)</label>
                                <input type="number" step="0.1" min="0.5" id="g-weight" value="4.5" oninput="onGuardianProfileChange()" class="w-full px-3 py-2 rounded-xl border border-emerald-400 bg-emerald-50/40 font-black text-emerald-900">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-600 mb-1">연령대 (생애주기)</label>
                                <select id="g-lifestage" onchange="onGuardianProfileChange()" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800">
                                    <option value="puppy_young">🍼 성장기 자견/자묘 (4개월 미만)</option>
                                    <option value="puppy_older">🌱 성장기 자견/자묘 (4~12개월)</option>
                                    <option value="adult" selected>🐕 성견/성묘 유지기 (1~7세)</option>
                                    <option value="senior">🦮 노령기 시니어 (7세 이상)</option>
                                    <option value="pregnant">🤰 임신/수유기</option>
                                </select>
                            </div>
                            <div>
                                <label class="block font-bold text-slate-600 mb-1">중성화 여부</label>
                                <select id="g-neutered" onchange="onGuardianProfileChange()" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800">
                                    <option value="true" selected>중성화 완료</option>
                                    <option value="false">미중성화</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Q2 & Q3: 쉬운 체형(BCS) & 근육량(MCS) Q&A 선택 가이드 -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <!-- Q2: BCS 체형 평가 -->
                        <div class="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                            <div class="flex items-center justify-between">
                                <div class="text-sm font-black text-slate-800 flex items-center space-x-2">
                                    <span class="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">Q2</span>
                                    <span>위에서 본 허리선과 갈비뼈 촉감은 어떤가요? (체형 BCS)</span>
                                </div>
                                <span id="g-bcs-badge" class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">BCS 5/9 (이상적)</span>
                            </div>

                            <div class="grid grid-cols-2 gap-2.5 text-xs">
                                <button type="button" onclick="selectGuardianBcs(3)" id="g-bcs-card-3" class="g-bcs-card text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-400 transition">
                                    <div class="font-black text-slate-800">🦴 말랐어요 (BCS 3)</div>
                                    <p class="text-[11px] text-slate-500 mt-1">갈비뼈가 눈에 보이고 만지면 지방층 없이 뼈가 바로 만져져요.</p>
                                </button>
                                <button type="button" onclick="selectGuardianBcs(5)" id="g-bcs-card-5" class="g-bcs-card text-left p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50/60 transition">
                                    <div class="font-black text-emerald-950">✨ 딱 좋아요 (BCS 5)</div>
                                    <p class="text-[11px] text-emerald-800 mt-1">위에서 보면 허리가 잘록하고 갈비뼈가 기분 좋게 만져져요.</p>
                                </button>
                                <button type="button" onclick="selectGuardianBcs(7)" id="g-bcs-card-7" class="g-bcs-card text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-400 transition">
                                    <div class="font-black text-slate-800">🎈 통통해요 (BCS 7)</div>
                                    <p class="text-[11px] text-slate-500 mt-1">허리 잘록함이 없고 갈비뼈를 힘주어 눌러야 만져져요.</p>
                                </button>
                                <button type="button" onclick="selectGuardianBcs(8)" id="g-bcs-card-8" class="g-bcs-card text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-400 transition">
                                    <div class="font-black text-slate-800">🐻 뚱뚱해요 (BCS 8~9)</div>
                                    <p class="text-[11px] text-slate-500 mt-1">배가 옆으로 볼록 나와 있고 등·꼬리 주변에 지방이 두툼해요.</p>
                                </button>
                            </div>

                            <div class="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                                <span>세부 점수 직접 조정 (1~9점):</span>
                                <div class="flex space-x-1" id="g-bcs-num-btns">
                                    ${[1,2,3,4,5,6,7,8,9].map(n => `<button type="button" onclick="selectGuardianBcs(${n})" data-bcs="${n}" class="w-6 h-6 rounded-lg font-bold border ${n===5 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-600 border-slate-200'}">${n}</button>`).join('')}
                                </div>
                            </div>
                        </div>

                        <!-- Q3: MCS 근육량 평가 -->
                        <div class="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                            <div class="flex items-center justify-between">
                                <div class="text-sm font-black text-slate-800 flex items-center space-x-2">
                                    <span class="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">Q3</span>
                                    <span>등줄기·엉덩이·허벅지를 쓰다듬을 때 근육은 어떤가요? (MCS)</span>
                                </div>
                                <span id="g-mcs-badge" class="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-black">MCS 4/4 (정상 근육)</span>
                            </div>

                            <div class="grid grid-cols-2 gap-2.5 text-xs">
                                <button type="button" onclick="selectGuardianMcs(4)" id="g-mcs-card-4" class="g-mcs-card text-left p-3 rounded-xl border-2 border-blue-500 bg-blue-50/60 transition">
                                    <div class="font-black text-blue-950">💪 탄탄해요 (MCS 4 정상)</div>
                                    <p class="text-[11px] text-blue-800 mt-1">등뼈나 골반뼈가 도드라지지 않고 허벅지 근육이 탄탄해요.</p>
                                </button>
                                <button type="button" onclick="selectGuardianMcs(3)" id="g-mcs-card-3" class="g-mcs-card text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 transition">
                                    <div class="font-black text-slate-800">🍂 살짝 빠졌어요 (MCS 3 경도)</div>
                                    <p class="text-[11px] text-slate-500 mt-1">예전보다 등줄기나 뒷다리 허벅지가 약간 홀쭉해졌어요.</p>
                                </button>
                                <button type="button" onclick="selectGuardianMcs(2)" id="g-mcs-card-2" class="g-mcs-card text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 transition">
                                    <div class="font-black text-slate-800">⚠️ 많이 빠졌어요 (MCS 2 중등도)</div>
                                    <p class="text-[11px] text-slate-500 mt-1">어깨뼈와 골반뼈가 도드라져 만져질 만큼 근육이 줄었어요.</p>
                                </button>
                                <button type="button" onclick="selectGuardianMcs(1)" id="g-mcs-card-1" class="g-mcs-card text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 transition">
                                    <div class="font-black text-slate-800">🚨 앙상해요 (MCS 1 심한 손실)</div>
                                    <p class="text-[11px] text-slate-500 mt-1">근육이 심하게 빠져 뼈 윤곽이 그대로 드러나요 (단백질 보강 필수).</p>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Q4: 활동량, 변 상태, 급여 횟수, 건강 관심사 -->
                    <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        <div>
                            <label class="block font-black text-slate-700 mb-1">🏃 Q4-1. 하루 산책·놀이 활동량</label>
                            <select id="g-activity" onchange="onGuardianProfileChange()" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800">
                                <option value="low">🛋️ 낮음 (실내 휴식 위주, 산책 적음)</option>
                                <option value="moderate" selected>🐕 보통 (매일 30분~1시간 산책/놀이)</option>
                                <option value="high">⚡ 활발함 (매일 1~2시간 이상 운동)</option>
                                <option value="very_high">🔥 매우 높음 (에너자이저/스포츠견)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block font-black text-slate-700 mb-1">💩 Q4-2. 최근 응가(변) 상태</label>
                            <select id="g-fecal" onchange="onGuardianProfileChange()" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800">
                                <option value="2.0">🌰 토끼똥처럼 딱딱하고 건조해요 (Score 2)</option>
                                <option value="3.5" selected>🍌 바나나처럼 예쁘고 촉촉해요 (Score 3.5 정상)</option>
                                <option value="4.5">🍦 형태는 있지만 집으면 뭉개져요 (Score 4.5 무른변)</option>
                                <option value="6.0">💧 형태가 없는 죽 같거나 물설사예요 (Score 6)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block font-black text-slate-700 mb-1">🍽️ Q4-3. 하루 식사 횟수</label>
                            <select id="g-meals" onchange="onGuardianProfileChange()" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800">
                                <option value="2" selected>하루 2끼 (아침 / 저녁 급여)</option>
                                <option value="3">하루 3끼 (아침 / 점심 / 저녁 급여)</option>
                                <option value="1">하루 1끼 급여</option>
                            </select>
                        </div>
                                                <div>
                            <label class="block font-black text-slate-700 mb-1">🩺 Q4-4. 특별히 관리 중인 건강 고민 (수의사 17대 복합질환 연동)</label>
                            <select id="g-concern" onchange="onGuardianProfileChange()" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white text-slate-900">
                                <option value="none" selected>없음 (일반 건강 유지 · AAFCO 성견/성묘 기준)</option>
                                <option value="heart">❤️ 심장병 (심부전 · 저나트륨 · 타우린 보강)</option>
                                <option value="ckd">💧 만성신부전 (CKD · 저단백 · 초저인 식단)</option>
                                <option value="pancreatitis">🥦 췌장염 (급성/만성 · 엄격한 초저지방 식단)</option>
                                <option value="cushing">⚡ 쿠싱증후군 (부신피질항진증 · 고섬유 · 중등도 단백)</option>
                                <option value="liver">🍀 간질환 (간염 · 간경화 · 간성뇌증 예방)</option>
                                <option value="gallbladder">🍈 담낭질환 (담낭점액종 · 담낭염 · 초저지방 식단)</option>
                                <option value="ibd">🌿 염증성 장질환 (IBD · 만성장염 · 장점막 보호)</option>
                                <option value="diabetes">🩸 당뇨병 (혈당 스파이크 방지 · 복합 탄수화물/고단백)</option>
                                <option value="urolithiasis">💎 요로결석 (스트루바이트/옥살레이트 요pH 조절)</option>
                                <option value="cognitive">🧠 인지장애증후군 (치매 · 뇌신경 영양 · 항산화)</option>
                                <option value="obesity">🎈 비만증 (과체중 · 체중 감량 다이어트 식단)</option>
                                <option value="osteoarthritis">🦴 골관절염 (관절염 · 슬개골 탈구 · 오메가3)</option>
                                <option value="hypothyroid">🦋 갑상선기능저하증 / 항진증 (호르몬 대사 균형)</option>
                                <option value="addison">🛡️ 부신피질기능저하증 (에디슨병 · 전해질 균형)</option>
                                <option value="oncology">🧬 종양 / 암 환자 (악액질 방지 · 고열량/고단백/저탄수)</option>
                                <option value="atopy">🌸 아토피 / 알러지성 피부염 (가수분해 · 단일단백질)</option>
                                <option value="hypertension">🩺 고혈압 / 단백뇨 (신장-심장 보호 식단)</option>
                            </select>
                        </div>
                    </div>

                    <!-- 보호자용 Q4-5 알러지 및 식이 금기 (동물성 단백질 / 식물성 알러지원 / 환경알러지원 - 수의사용 1:1 완벽 연동) -->
                    <div class="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <label class="block text-xs font-black text-slate-800">
                                🚫 Q4-5. 알러지 및 식이 금기 단백질 · 식물성 알러지원 · 환경알러지원
                            </label>
                            <span class="text-[11px] text-slate-500">체크된 식이 알러지원(동물성·식물성)은 처방사료 매칭 및 맞춤 화식 조리법에서 자동 배제됩니다.</span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <!-- 1) 동물성 단백질 -->
                            <div class="p-3 rounded-xl bg-rose-50/60 border border-rose-200/80 space-y-1.5">
                                <div class="text-xs font-black text-rose-800 flex items-center space-x-1.5">
                                    <i class="fa-solid fa-drumstick-bite text-rose-600"></i>
                                    <span>동물성 단백질 알러지원</span>
                                </div>
                                <div class="flex flex-wrap gap-1.5">
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="닭고기" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-600 font-bold transition">닭고기</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="소고기" checked onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-600 font-bold transition">소고기</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="오리고기" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-600 font-bold transition">오리고기</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="양고기" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-600 font-bold transition">양고기</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="돼지고기" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-600 font-bold transition">돼지고기</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="연어" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-600 font-bold transition">연어/생선</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="칠면조" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-600 font-bold transition">칠면조</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="계란" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-600 font-bold transition">계란/난류</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="유제품" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-600 font-bold transition">유제품/치즈</span></label>
                                </div>
                            </div>
                            <!-- 2) 식물성 알러지원 -->
                            <div class="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
                                <div class="text-xs font-black text-amber-900 flex items-center space-x-1.5">
                                    <i class="fa-solid fa-carrot text-amber-600"></i>
                                    <span>식물성 알러지원</span>
                                </div>
                                <div class="flex flex-wrap gap-1.5">
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="당근" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-amber-100 peer-checked:border-amber-500 peer-checked:text-amber-800 font-bold transition">당근</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="감자" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-amber-100 peer-checked:border-amber-500 peer-checked:text-amber-800 font-bold transition">감자</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="고구마" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-amber-100 peer-checked:border-amber-500 peer-checked:text-amber-800 font-bold transition">고구마</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="단호박" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-amber-100 peer-checked:border-amber-500 peer-checked:text-amber-800 font-bold transition">단호박</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="완두콩" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-amber-100 peer-checked:border-amber-500 peer-checked:text-amber-800 font-bold transition">완두콩/대두</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="옥수수" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-amber-100 peer-checked:border-amber-500 peer-checked:text-amber-800 font-bold transition">옥수수/밀</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="브로콜리" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-amber-100 peer-checked:border-amber-500 peer-checked:text-amber-800 font-bold transition">브로콜리/양배추</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="사과" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-amber-100 peer-checked:border-amber-500 peer-checked:text-amber-800 font-bold transition">사과/과일류</span></label>
                                </div>
                            </div>
                            <!-- 3) 환경알러지원 -->
                            <div class="p-3 rounded-xl bg-teal-50/60 border border-teal-200/80 space-y-1.5">
                                <div class="text-xs font-black text-teal-900 flex items-center space-x-1.5">
                                    <i class="fa-solid fa-couch text-teal-600"></i>
                                    <span>환경알러지원</span>
                                </div>
                                <div class="flex flex-wrap gap-1.5">
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="집먼지 진드기" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-teal-100 peer-checked:border-teal-600 peer-checked:text-teal-900 font-bold transition">집먼지 진드기</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="털옷" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-teal-100 peer-checked:border-teal-600 peer-checked:text-teal-900 font-bold transition">털옷 (니트/울)</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="털방석" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-teal-100 peer-checked:border-teal-600 peer-checked:text-teal-900 font-bold transition">털방석 (극세사)</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="집안 카페트" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-teal-100 peer-checked:border-teal-600 peer-checked:text-teal-900 font-bold transition">집안 카페트</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="집안 소파" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-teal-100 peer-checked:border-teal-600 peer-checked:text-teal-900 font-bold transition">집안 소파</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="꽃가루" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-teal-100 peer-checked:border-teal-600 peer-checked:text-teal-900 font-bold transition">꽃가루/화분</span></label>
                                    <label class="cursor-pointer"><input type="checkbox" name="g-allergy" value="실내 곰팡이" onchange="onGuardianProfileChange()" class="hidden peer"><span class="inline-block px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white peer-checked:bg-teal-100 peer-checked:border-teal-600 peer-checked:text-teal-900 font-bold transition">실내 곰팡이</span></label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Step 1 자동 산출 결과 배너 (RER / MER·DER / 1회 급여량 / 10% 토핑 한도) -->
                    <div class="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-5 shadow-md">
                        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                            <div class="p-3 rounded-xl bg-white/10 border border-white/15">
                                <div class="text-[11px] text-emerald-200 font-bold">기초대사량 (RER)</div>
                                <div class="text-2xl font-black text-white mt-0.5"><span id="g-out-rer">216</span> <span class="text-xs font-normal">kcal</span></div>
                                <div class="text-[10px] text-slate-300">숨만 쉬어도 쓰는 에너지</div>
                            </div>
                            <div class="p-3 rounded-xl bg-amber-400/20 border-2 border-amber-400">
                                <div class="text-[11px] text-amber-300 font-black">1일 총 목표 칼로리 (DER/MER)</div>
                                <div class="text-2xl font-black text-amber-300 mt-0.5"><span id="g-out-der">346</span> <span class="text-xs font-normal">kcal/일</span></div>
                                <div class="text-[10px] text-amber-100">에너지 계수 <span id="g-out-factor">1.6</span> × RER</div>
                            </div>
                            <div class="p-3 rounded-xl bg-white/10 border border-white/15">
                                <div class="text-[11px] text-sky-200 font-bold">1끼당 권장 칼로리</div>
                                <div class="text-2xl font-black text-sky-300 mt-0.5"><span id="g-out-permeal">173</span> <span class="text-xs font-normal">kcal/끼</span></div>
                                <div class="text-[10px] text-slate-300" id="g-out-meals-label">하루 2끼 급여 기준</div>
                            </div>
                            <div class="p-3 rounded-xl bg-white/10 border border-white/15">
                                <div class="text-[11px] text-rose-200 font-bold">간식/토핑 10% 허용 상한</div>
                                <div class="text-2xl font-black text-rose-300 mt-0.5"><span id="g-out-maxtreat">34.6</span> <span class="text-xs font-normal">kcal/일</span></div>
                                <div class="text-[10px] text-slate-300">영양 불균형 방지 안전선</div>
                            </div>
                            <div class="p-3 rounded-xl bg-white/10 border border-white/15 col-span-2 sm:col-span-1">
                                <div class="text-[11px] text-purple-200 font-bold">추정 이상 체중</div>
                                <div class="text-2xl font-black text-purple-300 mt-0.5"><span id="g-out-idealw">4.5</span> <span class="text-xs font-normal">kg</span></div>
                                <div class="text-[10px] text-slate-300" id="g-out-bcs-comment">현재 이상적 체형 유지 중</div>
                            </div>
                        </div>
                        <div id="g-out-fecal-banner" class="mt-3 pt-2.5 border-t border-white/15 text-xs text-emerald-200 flex items-center justify-between flex-wrap gap-2">
                            <span>💡 <strong>변 상태 & 체형 진단 피드백:</strong> 정상 소화 흡수율(92~95%) 상태입니다.</span>
                            <span id="g-out-aafco-badge" class="px-2.5 py-0.5 rounded-full bg-white/15 text-white font-bold text-[11px]">적용 기준: 성견 유지기 (단백질 ≥18% DM, 지방 ≥5.5% DM)</span>
                        </div>
                    </div>
                </section>

                <!-- ================================================================== -->
                <!-- [STEP 2] 사료 데이터 입력 인터페이스 (Data Ingestion: 검색 / OCR / 직접입력) -->
                <!-- ================================================================== -->
                <section id="g-step2-sec" class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
                    <div class="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
                        <div class="flex items-center space-x-3">
                            <span class="px-3 py-1 rounded-xl bg-blue-600 text-white font-black text-xs">STEP 2</span>
                            <div>
                                <h2 class="text-lg sm:text-xl font-black text-slate-900">현재 급여 중인 주식 사료 데이터 입력 (Data Ingestion)</h2>
                                <p class="text-xs text-slate-500">① 사료 DB 검색, ② 사료 뒷면 성분표 사진 OCR 스캔, ③ 직접 입력 중 편한 방법을 선택하세요.</p>
                            </div>
                        </div>
                        <div class="flex space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs">
                            <button type="button" onclick="switchGuardianIngestTab('search')" id="g-ingest-btn-search" class="px-3 py-1.5 rounded-lg bg-white text-blue-700 font-black shadow-sm transition">🔍 1. 사료 DB 검색</button>
                            <button type="button" onclick="switchGuardianIngestTab('ocr')" id="g-ingest-btn-ocr" class="px-3 py-1.5 rounded-lg text-slate-600 font-bold hover:text-slate-900 transition">📸 2. 포장지 OCR 스캔</button>
                            <button type="button" onclick="switchGuardianIngestTab('manual')" id="g-ingest-btn-manual" class="px-3 py-1.5 rounded-lg text-slate-600 font-bold hover:text-slate-900 transition">✍️ 3. 직접 입력</button>
                        </div>
                    </div>

                    <!-- 방식 1: 사료 DB 검색 자동완성 -->
                    <div id="g-ingest-panel-search" class="bg-blue-50/50 p-5 rounded-2xl border border-blue-200 space-y-3">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div>
                                <label class="block text-xs font-black text-blue-950 mb-1.5"><i class="fa-solid fa-magnifying-glass mr-1"></i>국내외 인기 상용 사료 & 처방사료 키워드 검색</label>
                                <input type="text" id="g-food-search-input" placeholder="예: 로얄캐닌, 오리젠, 아카나, 나우, 힐스, 지위픽, 더리얼..." oninput="filterGuardianFoodSearch(this.value)" class="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 bg-white text-xs font-bold outline-none focus:border-blue-600">
                            </div>
                                                        <div>
                                <div class="flex items-center justify-between mb-1.5">
                                    <label class="block text-xs font-black text-blue-950">검색 결과에서 사료 선택 (클릭 시 성분 & 원재료 즉시 반영)</label>
                                    <button type="button" onclick="applyCurrentGuardianFoodSearchSelect()" class="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition">
                                        <i class="fa-solid fa-check"></i> 선택 적용
                                    </button>
                                </div>
                                <select id="g-food-search-select" onchange="onSelectGuardianCommercialFood(this.value)" class="w-full px-3 py-2 rounded-xl border border-blue-300 font-bold text-xs bg-white text-blue-950 shadow-inner">
                                    <option value="" disabled>👉 검색된 사료 목록에서 선택하세요</option>
                                    <option value="rc_mini_adult" selected>로얄캐닌 미니 인도어 어덜트 (소형견 유지용)</option>
                                    <option value="orijen_original">오리젠 오리지널 독 (고단백 건식)</option>
                                    <option value="acana_pacifica">아카나 패시피카 독 (단일 어류 단백질)</option>
                                    <option value="hills_kd">힐스 처방식 k/d (신장 케어 건식)</option>
                                    <option value="rc_gastro_lowfat">로얄캐닌 처방식 가스트로 로우팻 (췌장/저지방)</option>
                                    <option value="now_fresh_small">나우 프레시 그레인프리 스몰브리드</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- 방식 2: 포장지 뒷면 AI OCR 스캔 -->
                    <div id="g-ingest-panel-ocr" class="hidden bg-indigo-50/50 p-5 rounded-2xl border border-indigo-200 space-y-4">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="block text-xs font-black text-indigo-950">📷 사료 포장지 뒷면(등록성분량/원재료명) 사진 업로드</label>
                                <div class="flex items-center space-x-2">
                                    <input type="file" id="g-ocr-file" accept="image/*" onchange="runGuardianImageOCR(event)" class="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-600 file:text-white hover:file:bg-indigo-700">
                                    <span id="g-ocr-status" class="text-xs font-bold text-indigo-700"></span>
                                </div>
                                <p class="text-[11px] text-slate-500">포장지 사진을 선택하면 AI OCR(Tesseract)이 조단백·조지방·칼슘·인 수치와 원재료 순서를 자동으로 읽어옵니다.</p>
                            </div>
                            <div class="space-y-2">
                                <label class="block text-xs font-black text-indigo-950">📋 또는 포장지 성분/원재료 텍스트 붙여넣기 후 자동 파싱</label>
                                <textarea id="g-ocr-textarea" rows="3" placeholder="예: 조단백질 27% 이상, 조지방 16% 이상, 조섬유 3.5% 이하, 조회분 7.0% 이하, 칼슘 1.0% 이상, 인 0.8% 이상, 수분 10% 이하 / 원재료: 생닭고기, 쌀, 완두콩, 단호박, 어유..." class="w-full p-2.5 rounded-xl border border-indigo-300 text-xs"></textarea>
                                <button type="button" onclick="parseGuardianOcrText()" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow">
                                    🔍 텍스트에서 영양소 & 원재료 순서 자동 추출
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 방식 3 (및 공통 확인창): 보증성분 & 원재료 직접 입력/수정 폼 -->
                    <div id="g-ingest-panel-manual" class="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div class="text-xs font-black text-slate-800">
                                📌 현재 선택/입력된 주식 사료: <span id="g-current-food-title" class="text-blue-700 underline">로얄캐닌 미니 인도어 어덜트</span>
                            </div>
                            <span class="text-[11px] text-slate-500">수치를 직접 수정하면 건물(DM) 영양소와 칼로리가 즉시 재계산됩니다</span>
                        </div>

                        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2.5 text-xs">
                            <div class="col-span-2 sm:col-span-2">
                                <label class="block text-[11px] font-bold text-slate-600 mb-1">사료 제품명</label>
                                <input type="text" id="g-dry-name" value="로얄캐닌 미니 인도어 어덜트" oninput="onGuardianDryFoodManualChange()" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-600 mb-1">조단백 (% AF)</label>
                                <input type="number" step="0.1" id="g-dry-prot" value="21.0" oninput="onGuardianDryFoodManualChange()" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-blue-900">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-600 mb-1">조지방 (% AF)</label>
                                <input type="number" step="0.1" id="g-dry-fat" value="14.0" oninput="onGuardianDryFoodManualChange()" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-amber-900">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-600 mb-1">조섬유 (% AF)</label>
                                <input type="number" step="0.1" id="g-dry-fiber" value="1.9" oninput="onGuardianDryFoodManualChange()" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-600 mb-1">조회분 (% AF)</label>
                                <input type="number" step="0.1" id="g-dry-ash" value="6.1" oninput="onGuardianDryFoodManualChange()" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-600 mb-1">수분 (% AF)</label>
                                <input type="number" step="0.1" id="g-dry-moist" value="9.5" oninput="onGuardianDryFoodManualChange()" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-600 mb-1">칼슘 Ca (%)</label>
                                <input type="number" step="0.05" id="g-dry-ca" value="0.82" oninput="onGuardianDryFoodManualChange()" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-emerald-900">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-600 mb-1">인 P (%)</label>
                                <input type="number" step="0.05" id="g-dry-p" value="0.70" oninput="onGuardianDryFoodManualChange()" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-rose-900">
                            </div>
                        </div>

                        <!-- DM 자동 환산 요약 줄 -->
                        <div id="g-dry-dm-summary-bar" class="p-3 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                        </div>
                    </div><!-- end of g-kit-report-body -->
</div>
                </section>

                <!-- ================================================================== -->
                <!-- [STEP 3] 핵심 메뉴 분기: 6대 믹스피딩 프로그램 (Menu Routing) -->
                <!-- ================================================================== -->
                <section id="g-step3-sec" class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
                    <div class="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
                        <div class="flex items-center space-x-3">
                            <span class="px-3 py-1 rounded-xl bg-indigo-600 text-white font-black text-xs">STEP 3</span>
                            <div>
                                <h2 class="text-lg sm:text-xl font-black text-slate-900">핵심 메뉴 분기: 6대 믹스피딩 & 화식 · 사료 역추적 프로그램</h2>
                                <p class="text-xs text-slate-500">원하시는 급여 조합이나 분석 프로그램을 선택하세요. 어떤 메뉴를 선택하든 하단 [Step 4] 신호등 리포트에 즉시 반영됩니다.</p>
                            </div>
                        </div>
                    </div>

                    <!-- 6대 핵심 메뉴 선택 카드 그리드 -->
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                        <button type="button" onclick="selectGuardianMenu(1)" id="g-menu-card-1" class="g-menu-card text-left p-3.5 rounded-2xl border-2 border-emerald-600 bg-emerald-50/70 transition flex flex-col justify-between">
                            <div>
                                <span class="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[10px]">메뉴 1</span>
                                <div class="font-black text-slate-900 text-sm mt-1.5">🥫 건식 + 습식</div>
                                <p class="text-[11px] text-slate-600 mt-1">주식 건식과 고수분 습식캔/파우치 칼로리 배분 & 음수량 보충</p>
                            </div>
                        </button>
                        <button type="button" onclick="selectGuardianMenu(2)" id="g-menu-card-2" class="g-menu-card text-left p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 bg-white transition flex flex-col justify-between">
                            <div>
                                <span class="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-black text-[10px]">메뉴 2</span>
                                <div class="font-black text-slate-900 text-sm mt-1.5">🍲 건식 + 화식</div>
                                <p class="text-[11px] text-slate-600 mt-1">상용/조리 화식과 건식사료 조합 시 단백질·지방 과부족 & Fit 검증</p>
                            </div>
                        </button>
                        <button type="button" onclick="selectGuardianMenu(3)" id="g-menu-card-3" class="g-menu-card text-left p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 bg-white transition flex flex-col justify-between">
                            <div>
                                <span class="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-black text-[10px]">메뉴 3</span>
                                <div class="font-black text-slate-900 text-sm mt-1.5">🍗 건식 + 원재료</div>
                                <p class="text-[11px] text-slate-600 mt-1">닭가슴살·황태·단호박·계란 등 단일 식재료 부식 영양왜곡 방지</p>
                            </div>
                        </button>
                        <button type="button" onclick="selectGuardianMenu(4)" id="g-menu-card-4" class="g-menu-card text-left p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 bg-white transition flex flex-col justify-between">
                            <div>
                                <span class="px-2 py-0.5 rounded-md bg-amber-500 text-white font-black text-[10px]">메뉴 4 · 공통필터</span>
                                <div class="font-black text-slate-900 text-sm mt-1.5">🍖 토핑 10% 제어기</div>
                                <p class="text-[11px] text-slate-600 mt-1">육포·트릿·츄르·껌이 하루 칼로리의 10%를 넘지 않도록 안전 제어</p>
                            </div>
                        </button>
                        <button type="button" onclick="selectGuardianMenu(5)" id="g-menu-card-5" class="g-menu-card text-left p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 bg-white transition flex flex-col justify-between">
                            <div>
                                <span class="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-black text-[10px]">메뉴 5 · 리디자인</span>
                                <div class="font-black text-slate-900 text-sm mt-1.5">👩‍🍳 화식 자가 만들기</div>
                                <p class="text-[11px] text-slate-600 mt-1">117종 원료 기반 AAFCO 칼슘:인 황금비율 DIY 빌더 & 밀프랩 레시피</p>
                            </div>
                        </button>
                        <button type="button" onclick="selectGuardianMenu(6)" id="g-menu-card-6" class="g-menu-card text-left p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 bg-white transition flex flex-col justify-between">
                            <div>
                                <span class="px-2 py-0.5 rounded-md bg-purple-600 text-white font-black text-[10px]">메뉴 6 · 다중 믹스피딩</span>
                                <div class="font-black text-slate-900 text-sm mt-1.5">🔬 1~4단계 역추적 & 2·3종 믹스</div>
                                <p class="text-[11px] text-slate-600 mt-1">사료공학 DB·PAVA·1%앵커·아키타입 역추적 및 2·3종 복합 믹스피딩</p>
                            </div>
                        </button>
                    </div>

                    <!-- ==================== [메뉴 1] 건식 + 습식 배합기 ==================== -->
                    <div id="g-menu-view-1" class="g-menu-view bg-emerald-50/40 p-6 rounded-2xl border border-emerald-200 space-y-4">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 class="text-base font-black text-emerald-950">🥫 [메뉴 1] 건식 + 습식 사료 칼로리 배합기</h3>
                                <p class="text-xs text-emerald-800">주식형 건식사료와 수분감이 높은 습식사료(캔/파우치)의 칼로리 비율을 배분하고 영양 밸런스를 검증합니다.</p>
                            </div>
                            <div class="flex gap-1.5 text-xs">
                                <button type="button" onclick="setMenu1Ratio(70)" class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black">70 : 30 (추천)</button>
                                <button type="button" onclick="setMenu1Ratio(50)" class="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-bold">50 : 50 (반반)</button>
                                <button type="button" onclick="setMenu1Ratio(80)" class="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-bold">80 : 20</button>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div class="bg-white p-4 rounded-xl border border-emerald-200 space-y-2">
                                <label class="block font-black text-slate-700">조합할 습식 사료(캔/파우치) 선택</label>
                                <select id="g-m1-wet-select" onchange="onChangeMenu1Wet(this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold">
                                    ${COMMERCIAL_WET_AND_FRESH.filter(x => x.type === "습식").map(w => `<option value="${w.id}">${w.name} (${w.kcal_per_kg} kcal/kg · 수분 ${w.moisture_af}%)</option>`).join('')}
                                </select>
                                <p id="g-m1-wet-desc" class="text-[11px] text-slate-500">${COMMERCIAL_WET_AND_FRESH[0].desc}</p>
                            </div>

                            <div class="bg-white p-4 rounded-xl border border-emerald-200 space-y-2">
                                <div class="flex justify-between font-black text-slate-800">
                                    <span>건식 사료 칼로리 비중: <strong id="g-m1-dry-pct-label" class="text-blue-700">70%</strong></span>
                                    <span>습식 사료 칼로리 비중: <strong id="g-m1-wet-pct-label" class="text-emerald-700">30%</strong></span>
                                </div>
                                <input type="range" id="g-m1-slider" min="10" max="90" step="5" value="70" oninput="setMenu1Ratio(this.value)" class="w-full h-2.5 bg-emerald-100 rounded-lg accent-emerald-600">
                                <div id="g-m1-summary-box" class="pt-1 text-xs font-bold text-slate-700"></div>
                            </div>
                        </div>
                    </div>

                    <!-- ==================== [메뉴 2] 건식 + 화식 배합기 ==================== -->
                    <div id="g-menu-view-2" class="g-menu-view hidden bg-amber-50/40 p-6 rounded-2xl border border-amber-200 space-y-4">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 class="text-base font-black text-amber-950">🍲 [메뉴 2] 건식 + 상용/맞춤 화식 배합기</h3>
                                <p class="text-xs text-amber-800">건식사료와 화식(신선식) 조합 시 단백질 및 지방의 과부족 여부와 칼로리 핏(Fit)을 확인합니다.</p>
                            </div>
                            <div class="flex gap-1.5 text-xs">
                                <button type="button" onclick="setMenu2Ratio(80)" class="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-black">80 : 20 (추천)</button>
                                <button type="button" onclick="setMenu2Ratio(70)" class="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold">70 : 30</button>
                                <button type="button" onclick="setMenu2Ratio(50)" class="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold">50 : 50</button>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div class="bg-white p-4 rounded-xl border border-amber-200 space-y-2">
                                <label class="block font-black text-slate-700">조합할 맞춤/상용 화식 포뮬러 선택</label>
                                <select id="g-m2-fresh-select" onchange="onChangeMenu2Fresh(this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold">
                                    ${COMMERCIAL_WET_AND_FRESH.filter(x => x.type === "화식").map(w => `<option value="${w.id}">${w.name} (${w.kcal_per_kg} kcal/kg)</option>`).join('')}
                                </select>
                                <p id="g-m2-fresh-desc" class="text-[11px] text-slate-500">${COMMERCIAL_WET_AND_FRESH.find(x => x.type === "화식").desc}</p>
                            </div>

                            <div class="bg-white p-4 rounded-xl border border-amber-200 space-y-2">
                                <div class="flex justify-between font-black text-slate-800">
                                    <span>건식 사료 칼로리 비중: <strong id="g-m2-dry-pct-label" class="text-blue-700">70%</strong></span>
                                    <span>화식 칼로리 비중: <strong id="g-m2-fresh-pct-label" class="text-amber-700">30%</strong></span>
                                </div>
                                <input type="range" id="g-m2-slider" min="10" max="90" step="5" value="70" oninput="setMenu2Ratio(this.value)" class="w-full h-2.5 bg-amber-100 rounded-lg accent-amber-600">
                                <div id="g-m2-summary-box" class="pt-1 text-xs font-bold text-slate-700"></div>
                            </div>
                        </div>
                    </div>

                    <!-- ==================== [메뉴 3] 건식 + 단일 원재료 배합기 ==================== -->
                    <div id="g-menu-view-3" class="g-menu-view hidden bg-sky-50/50 p-6 rounded-2xl border border-sky-200 space-y-4">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 class="text-base font-black text-sky-950">🍗 [메뉴 3] 건식 + 단일 원재료(닭가슴살·황태·채소 등) 배합기</h3>
                                <p class="text-xs text-sky-800">건식사료에 단일 식재료를 토핑/부식으로 줄 때 <strong>칼슘:인(Ca:P) 불균형 등 영양 왜곡을 방지</strong>하고 안전한 정량(g)을 계산합니다.</p>
                            </div>
                            <div class="flex gap-1.5 text-xs">
                                <button type="button" onclick="setMenu3Ratio(10)" class="px-3 py-1.5 rounded-xl bg-sky-600 text-white font-black">원재료 10% (안전 표준)</button>
                                <button type="button" onclick="setMenu3Ratio(15)" class="px-3 py-1.5 rounded-xl bg-white border border-sky-300 text-sky-900 font-bold">원재료 15% (상한선)</button>
                                <button type="button" onclick="setMenu3Ratio(25)" class="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 font-bold">25% (과다 시뮬레이션)</button>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div class="bg-white p-4 rounded-xl border border-sky-200 space-y-2">
                                <label class="block font-black text-slate-700">토핑/부식으로 섞어줄 단일 원재료 선택</label>
                                <select id="g-m3-raw-select" onchange="onChangeMenu3Raw(this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold">
                                    ${SINGLE_RAW_INGREDIENTS.map(r => `<option value="${r.id}">[${r.category}] ${r.name} (${r.kcal_100g} kcal/100g)</option>`).join('')}
                                </select>
                                <div id="g-m3-prep-tip" class="p-2.5 rounded-lg bg-sky-50 text-sky-900 text-[11px] font-medium">${SINGLE_RAW_INGREDIENTS[0].prepTip}</div>
                            </div>

                            <div class="bg-white p-4 rounded-xl border border-sky-200 space-y-2">
                                <div class="flex justify-between font-black text-slate-800">
                                    <span>주식 건식사료: <strong id="g-m3-dry-pct-label" class="text-blue-700">90%</strong></span>
                                    <span>단일 원재료 비중: <strong id="g-m3-raw-pct-label" class="text-sky-700">10%</strong></span>
                                </div>
                                <input type="range" id="g-m3-slider" min="5" max="40" step="1" value="10" oninput="setMenu3Ratio(this.value)" class="w-full h-2.5 bg-sky-100 rounded-lg accent-sky-600">
                                <div id="g-m3-distortion-alert" class="mt-2"></div>
                            </div>
                        </div>
                    </div>

                    <!-- ==================== [메뉴 4] 토핑 공통 안전 제어기 (10% Rule) ==================== -->
                    <div id="g-menu-view-4" class="g-menu-view hidden bg-rose-50/40 p-6 rounded-2xl border border-rose-200 space-y-4">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 class="text-base font-black text-rose-950">🍖 [메뉴 4] 토핑 & 간식 공통 안전 제어기 (10% 칼로리 캡 필터)</h3>
                                <p class="text-xs text-rose-800">어떤 사료 조합이든 간에 <strong>'하루 간식/토핑 허용 칼로리(일일 섭취량 DER의 10%)'</strong>를 넘지 않도록 제어하고 본식 차감량을 계산합니다.</p>
                            </div>
                            <button type="button" onclick="resetMenu4Toppings()" class="px-3 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-800 text-xs font-bold hover:bg-rose-100">간식 선택 초기화</button>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs" id="g-m4-topping-cards">
                            ${TOPPING_SNACK_ITEMS.map(t => `
                                <div class="bg-white p-3.5 rounded-xl border border-rose-200/80 flex flex-col justify-between space-y-2">
                                    <div>
                                        <div class="font-black text-slate-800">${t.name}</div>
                                        <div class="text-[11px] text-rose-600 font-bold">1${t.unitLabel}당 ${t.kcalPerUnit} kcal (약 ${t.weightPerUnitG}g)</div>
                                        <p class="text-[10px] text-slate-400 mt-0.5">${t.warning}</p>
                                    </div>
                                    <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                                        <span class="text-[11px] font-bold text-slate-600">하루 급여 수량:</span>
                                        <div class="flex items-center space-x-2">
                                            <button type="button" onclick="changeToppingCount('${t.id}', -1)" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-black text-slate-700">-</button>
                                            <span id="g-top-cnt-${t.id}" class="w-6 text-center font-black text-sm text-rose-700">${guardianState.menu4.selectedToppings[t.id] || 0}</span>
                                            <button type="button" onclick="changeToppingCount('${t.id}', 1)" class="w-7 h-7 rounded-lg bg-rose-600 hover:bg-rose-700 font-black text-white">+</button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- 토핑 10% 게이지 및 본식 사료 차감 안내 -->
                        <div id="g-m4-gauge-banner" class="p-4 rounded-xl bg-white border border-rose-200 space-y-2 text-xs"></div>
                    </div>

                    <!-- ==================== [메뉴 5] 화식 자가 만들기 (Recipe DIY Builder - 세련된 리디자인) ==================== -->
                    <div id="g-menu-view-5" class="g-menu-view hidden bg-indigo-50/40 p-6 rounded-2xl border border-indigo-200 space-y-5">
                        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-200/70 pb-4">
                            <div>
                                <div class="flex items-center space-x-2">
                                    <span class="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black">사료배합성분계산기 모던 리디자인</span>
                                    <h3 class="text-base font-black text-indigo-950">👩‍🍳 [메뉴 5] 화식 자가 만들기 (Recipe DIY Builder & 36대 영양소 분석)</h3>
                                </div>
                                <p class="text-xs text-indigo-800 mt-0.5">고기, 곡류/감자, 채소, 오일, 칼슘보충제를 조합해 <strong>AAFCO/FEDIAF 영양 기준(칼슘:인 비율 등)</strong>에 맞는 홈메이드 화식을 설계합니다.</p>
                            </div>
                            <div class="flex flex-wrap gap-2 text-xs">
                                <button type="button" onclick="autoBalanceDiyRecipe()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black shadow-md flex items-center space-x-1.5">
                                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                                    <span>⚡ AAFCO 황금비율(칼슘:인 1.25:1) 자동 맞춤</span>
                                </button>
                                <button type="button" onclick="saveCurrentDiyRecipe()" class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">💾 레시피 저장</button>
                            </div>
                        </div>

                        <!-- 카테고리별 원재료 빠른 추가 바 -->
                        <div class="bg-white p-4 rounded-2xl border border-indigo-200/80 grid grid-cols-1 md:grid-cols-3 gap-3 items-end text-xs">
                            <div>
                                <label class="block font-black text-slate-700 mb-1">1. 식품군 카테고리 필터</label>
                                <select id="g-diy-cat-select" onchange="populateDiyIngredientDropdown(this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold">
                                    <option value="ALL">전체 원재료 보기 (117종)</option>
                                    <option value="육류">🥩 육류 (닭/오리/소/돼지/양/사슴)</option>
                                    <option value="어류">🐟 어류 / 해산물 (연어/대구/명태/고등어)</option>
                                    <option value="난류">🥚 난류 (계란 전란/흰자/노른자/메추리알)</option>
                                    <option value="곡류">🌾 곡류 (귀리/백미/현미/보리/퀴노아)</option>
                                    <option value="감자류">🍠 감자 / 고구마 / 전분류</option>
                                    <option value="채소류">🥦 채소류 (단호박/양배추/브로콜리/당근)</option>
                                    <option value="콩류">🫘 콩류 / 두부</option>
                                    <option value="과일류">🍎 과일류 (사과/블루베리/바나나)</option>
                                    <option value="버섯류">🍄 버섯류</option>
                                    <option value="유지류">🫗 유지류 (연어오일/들기름/올리브유)</option>
                                    <option value="보충제/기타">💊 칼슘/미네랄 보충제 (난각분말/인산칼슘)</option>
                                </select>
                            </div>
                            <div>
                                <label class="block font-black text-slate-700 mb-1">2. 화식에 넣을 식재료 선택</label>
                                <select id="g-diy-ing-select" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"></select>
                            </div>
                            <div class="flex gap-2">
                                <button type="button" onclick="addDiyIngredientRow()" class="flex-1 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black">+ 식재료 레시피에 추가</button>
                                <select id="g-diy-preset-select" onchange="loadDiyPresetTemplate(this.value)" class="px-3 py-2 rounded-xl border border-indigo-300 bg-indigo-50 text-indigo-900 font-bold">
                                    <option value="">✨ 추천 화식 템플릿 불러오기</option>
                                    <option value="standard_chicken">닭안심·귀리·단호박 표준 화식</option>
                                    <option value="lowfat_cod">저지방 대구살·감자·양배추 (췌장/다이어트)</option>
                                    <option value="renal_lowp">저인 닭안심·계란흰자·백미밥 (신장케어)</option>
                                    <option value="beef_energy">소고기 우둔살·고구마·브로콜리 (근육/활력)</option>
                                </select>
                            </div>
                        </div>

                        <!-- DIY 배합 리스트 & 밀프랩(1일/3일/7일/14일) 조리 계량표 -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
                            <!-- 좌측: 원재료 배합비(%) 슬라이더/입력 -->
                            <div class="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                                <div class="flex items-center justify-between">
                                    <h4 class="font-black text-slate-800">⚖️ 1. 화식 원재료 배합 비율 조절</h4>
                                    <span id="g-diy-total-pct-badge" class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black">총합 100.0%</span>
                                </div>
                                <div id="g-diy-items-container" class="space-y-2 max-h-80 overflow-y-auto pr-1"></div>
                            </div>

                            <!-- 우측: 밀프랩(Meal-Prep) 조리 정량(g) & 조리 순서 -->
                            <div class="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                                <div class="flex flex-wrap items-center justify-between gap-2">
                                    <h4 class="font-black text-slate-800">🍳 2. 밀프랩(Meal-Prep) 조리용 정량 계량표</h4>
                                    <div class="flex space-x-1">
                                        ${[1, 3, 7, 14].map(d => `<button type="button" onclick="setDiyPrepDays(${d})" id="g-diy-prep-btn-${d}" class="px-2.5 py-1 rounded-lg font-bold ${d===7 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}">${d}일분</button>`).join('')}
                                    </div>
                                </div>
                                <div id="g-diy-mealprep-summary" class="p-2.5 rounded-xl bg-indigo-50 text-indigo-950 font-bold text-[11px]"></div>
                                <div class="overflow-x-auto">
                                    <table class="w-full text-left border-collapse">
                                        <thead class="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                            <tr>
                                                <th class="py-2 px-2.5">식재료명</th>
                                                <th class="py-2 px-2.5 text-right">배합비</th>
                                                <th class="py-2 px-2.5 text-right text-indigo-700">1일 급여량(g)</th>
                                                <th class="py-2 px-2.5 text-right text-emerald-700" id="g-diy-prep-col-header">7일분 총량(g)</th>
                                            </tr>
                                        </thead>
                                        <tbody id="g-diy-mealprep-tbody" class="divide-y divide-slate-100"></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <!-- DIY 핵심 영양 신호등 요약 + 36대 전 영양소 정밀 분석표 (접이식 토글 지원) -->
                        <div class="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                            <div class="flex flex-wrap items-center justify-between gap-2">
                                <div class="font-black text-slate-800">🔬 3. 설계된 화식의 AAFCO / 질환별 영양 적정성 평가</div>
                                <button type="button" onclick="toggleDiyFull36Table()" class="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-[11px]">
                                    📊 36대 전 영양소(비타민·미네랄 포함) 상세 분석표 펼치기/접기
                                </button>
                            </div>
                            <div id="g-diy-kpi-strip" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5"></div>

                            <div id="g-diy-full36-wrapper" class="hidden pt-3 border-t border-slate-100 overflow-x-auto">
                                <table class="w-full text-[11px] text-left border-collapse">
                                    <thead class="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                                        <tr>
                                            <th class="py-2 px-2.5">영양소 (단위)</th>
                                            <th class="py-2 px-2.5 text-right">100g 원물(AF) 함량</th>
                                            <th class="py-2 px-2.5 text-right text-blue-700">건물(DM 100g) 환산치</th>
                                            <th class="py-2 px-2.5 text-right text-indigo-700">1일 급여 총섭취량</th>
                                            <th class="py-2 px-2.5 text-center">AAFCO 생애주기 판정</th>
                                        </tr>
                                    </thead>
                                    <tbody id="g-diy-full36-tbody" class="divide-y divide-slate-100"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- ==================== [메뉴 6] 1~4단계 사료 역추적 & 2·3종 사료 믹스피딩 시뮬레이터 (step6_multi_mix_feeding 교체 모듈) ==================== -->
                    <style>
                        #g-menu-view-6 .btn, #s6ExportPayloadModal .btn {
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            padding: 9px 18px;
                            font-size: 0.88rem;
                            font-weight: 700;
                            border-radius: 8px;
                            border: none;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        }
                        #g-menu-view-6 .btn-primary, #s6ExportPayloadModal .btn-primary {
                            background: #2563eb;
                            color: #ffffff;
                        }
                        #g-menu-view-6 .btn-primary:hover, #s6ExportPayloadModal .btn-primary:hover {
                            background: #1d4ed8;
                        }
                        #g-menu-view-6 .btn-secondary, #s6ExportPayloadModal .btn-secondary {
                            background: #f1f5f9;
                            color: #1e293b;
                            border: 1px solid #cbd5e1;
                        }
                        #g-menu-view-6 .btn-secondary:hover, #s6ExportPayloadModal .btn-secondary:hover {
                            background: #e2e8f0;
                        }
                        #g-menu-view-6 .btn-sm, #s6ExportPayloadModal .btn-sm {
                            padding: 6px 12px;
                            font-size: 0.82rem;
                        }
                        #g-menu-view-6 .btn.active {
                            background: #6d28d9 !important;
                            color: #ffffff !important;
                            border-color: #6d28d9 !important;
                        }
                        #g-menu-view-6 .form-control, #s6ExportPayloadModal .form-control {
                            width: 100%;
                            padding: 8px 11px;
                            border-radius: 8px;
                            border: 1px solid #cbd5e1;
                            font-size: 0.88rem;
                            background-color: #ffffff;
                        }
                        #g-menu-view-6 .table-responsive {
                            width: 100%;
                            overflow-x: auto;
                            margin-top: 10px;
                            border-radius: 8px;
                            border: 1px solid #e2e8f0;
                        }
                        #g-menu-view-6 .table-responsive table {
                            width: 100%;
                            border-collapse: collapse;
                            text-align: left;
                            font-size: 0.84rem;
                        }
                        #g-menu-view-6 .table-responsive th, #g-menu-view-6 .table-responsive td {
                            padding: 9px 12px;
                            border-bottom: 1px solid #e2e8f0;
                        }
                        #g-menu-view-6 .table-responsive th {
                            background: #f8fafc;
                            font-weight: 800;
                            color: #334155;
                        }
                    </style>
                    <div id="g-menu-view-6" class="g-menu-view hidden bg-purple-50/40 p-6 rounded-2xl border border-purple-200 space-y-5 shadow-sm">
                        <!-- 상단 헤더 -->
                        <div class="flex flex-wrap items-start justify-between gap-4 bg-white p-5 rounded-2xl border border-purple-200 shadow-sm">
                            <div>
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="bg-purple-700 text-white text-xs font-black px-3 py-1 rounded-full">
                                        <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>GUARDIAN PORTAL · STEP 6 통합 모듈
                                    </span>
                                    <span class="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-full">
                                        SCHEMA-05 & Vet CDSS (Per 1,000 kcal ME) 호환
                                    </span>
                                </div>
                                <h3 class="text-lg md:text-xl font-black text-slate-900 mt-2">
                                    1~4단계 일반사료 영양소 역추적 & 2·3종 사료 믹스피딩 프로그램
                                </h3>
                                <p class="text-xs md:text-sm text-slate-600 mt-1">
                                    사료 공학 전용 원재료 DB(54종) + 일반 식재료 DB(117종 통합) · PAVA 순서/1% 앵커/수분 손실 페널티 · 3-트랙(아미노산 12종·TDF 식이섬유·미네랄) · 글로벌 18대 아키타입 보정을 통해 사료 성분을 역추적하고, <strong>2종(α·V̂<sub>A</sub> + β·V̂<sub>B</sub>) 또는 3종(α·V̂<sub>A</sub> + β·V̂<sub>B</sub> + γ·V̂<sub>C</sub>)</strong> 사료를 안전 마진 내에서 믹스피딩합니다.
                                </p>
                            </div>

                            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                                <button type="button" id="s6BtnCount2" class="btn btn-secondary btn-sm" onclick="Step6MultiMixController.setFeedCount(2)">
                                    <i class="fa-solid fa-layer-group mr-1"></i>2종 사료 믹스 (A + B)
                                </button>
                                <button type="button" id="s6BtnCount3" class="btn btn-secondary btn-sm active" onclick="Step6MultiMixController.setFeedCount(3)">
                                    <i class="fa-solid fa-cubes mr-1"></i>3종 사료 믹스 (A + B + C)
                                </button>
                                <button type="button" class="btn btn-secondary btn-sm" onclick="Step6MultiMixController.syncSlotAFromHostDryFood(true)" title="Step 2에서 선택/입력한 사료를 사료 A 슬롯에 즉시 반영">
                                    <i class="fa-solid fa-arrows-rotate mr-1 text-purple-700"></i>Step 2 사료➔슬롯A 반영
                                </button>
                                <button type="button" class="btn btn-primary btn-sm" style="background:#0f172a;" onclick="Step6MultiMixController.exportGuardianStep6Payload()">
                                    <i class="fa-solid fa-code mr-1"></i>처방사료 STEP 6 연동 데이터
                                </button>
                            </div>
                        </div>

                        <!-- 환자 프로필 및 임상 질환 가드라인 설정 바 (처방사료데이터 guardianState.profile 자동 연동) -->
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(155px, 1fr)); gap:10px; padding:14px; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px;">
                            <div>
                                <label style="font-size:0.75rem; font-weight:800; color:#475569;"><i class="fa-solid fa-paw mr-1 text-purple-600"></i>반려동물 축종</label>
                                <select id="s6SpeciesSelect" class="form-control" onchange="Step6MultiMixController.onTopProfileChange()">
                                    <option value="dog">강아지 (Canine)</option>
                                    <option value="cat">고양이 (Feline)</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size:0.75rem; font-weight:800; color:#475569;"><i class="fa-solid fa-weight-scale mr-1 text-purple-600"></i>체중 (kg)</label>
                                <div style="display:flex; gap:4px;">
                                    <input type="number" id="s6WeightInput" class="form-control" value="4.5" step="0.1" min="0.5" onchange="Step6MultiMixController.onTopProfileChange()">
                                    <button type="button" class="btn btn-secondary btn-sm" onclick="Step6MultiMixController.autoCalcDERFromWeight()" title="체중으로 DER 자동계산">자동DER</button>
                                </div>
                            </div>
                            <div>
                                <label style="font-size:0.75rem; font-weight:800; color:#475569;"><i class="fa-solid fa-fire-flame-curved mr-1 text-orange-500"></i>1일 목표 열량 DER (kcal)</label>
                                <input type="number" id="s6DerInput" class="form-control" value="346" step="5" min="30" onchange="Step6MultiMixController.onTopProfileChange()">
                            </div>
                            <div>
                                <label style="font-size:0.75rem; font-weight:800; color:#475569;"><i class="fa-solid fa-clock mr-1 text-blue-600"></i>1일 급여 횟수</label>
                                <select id="s6MealsSelect" class="form-control" onchange="Step6MultiMixController.onTopProfileChange()">
                                    <option value="2" selected>1일 2회 (아침·저녁)</option>
                                    <option value="3">1일 3회 (아침·점심·저녁)</option>
                                    <option value="1">1일 1회</option>
                                </select>
                            </div>
                            <div style="grid-column: span 2;">
                                <label style="font-size:0.75rem; font-weight:800; color:#5b21b6;"><i class="fa-solid fa-shield-heart mr-1 text-purple-700"></i>임상 질환/건강 가드라인 (신뢰도 안전 마진 Min~Max 밴드)</label>
                                <select id="s6HealthConcernSelect" class="form-control" onchange="Step6MultiMixController.onTopProfileChange()">
                                    <option value="none">일반 건강 유지 (AAFCO/FEDIAF 성견·성묘 표준)</option>
                                    <option value="ckd">만성 신부전 / 신장 케어 (CKD - 인·나트륨 제한)</option>
                                    <option value="pancreatitis">췌장염 / 고지혈증 케어 (엄격 저지방 ≤12% DM)</option>
                                    <option value="heart">심장 질환 케어 (나트륨 제한 & 타우린 강화)</option>
                                    <option value="urolithiasis">하부요로계 / 결석 케어 (Ca·P·Mg 정밀 제어)</option>
                                    <option value="ibd">만성 장염 / IBD / 식이알러지 (소화율 & 수용성 섬유)</option>
                                    <option value="obesity">비만 / 체중 감량 (고단백·저지방·고식이섬유)</option>
                                    <option value="liver">간담도계 케어 (적정 단백 & 나트륨 제어)</option>
                                </select>
                            </div>
                        </div>

                        <!-- 2개 또는 3개 사료 슬롯 입력 그리드 -->
                        <div id="s6SlotsGrid" style="display:grid; gap:14px;"></div>

                        <!-- 칼로리 배합비 컨트롤러 & AI 최적 안전 배합비 추천 배너 -->
                        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 class="text-base font-black text-slate-800 mb-2">
                                <i class="fa-solid fa-sliders mr-1.5 text-purple-700"></i>2·3종 사료 칼로리 배합비(α : β : γ) 조절 & AI 안전 마진 최적화
                            </h3>
                            <div id="s6OptimalBanner" style="background:#eef2ff; border:1px solid #c7d2fe; border-radius:10px; padding:12px 14px; margin-bottom:12px;"></div>
                            <div id="s6RatioSlidersArea" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:10px;"></div>
                        </div>

                        <!-- 사료별 1일 / 1회 급여 무게(g) 및 음수량 스케줄 카드 -->
                        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 class="text-base font-black text-slate-800 mb-3">
                                <i class="fa-solid fa-bowl-food mr-1.5 text-emerald-600"></i>사료별 1일 급여량(g/일) · 1끼 급여량(g/회) · 수분 밸런스
                            </h3>
                            <div id="s6ScheduleCardsArea" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:12px;"></div>
                        </div>

                        <!-- 차트 영역 -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <h4 class="text-sm font-black text-slate-800 mb-2">1. 다중 사료 칼로리 분배 도넛 차트</h4>
                                <div style="height:240px; position:relative;">
                                    <canvas id="s6MultiDonutChart"></canvas>
                                </div>
                            </div>
                            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <h4 class="text-sm font-black text-slate-800 mb-2">2. 사료 A · B · (C) vs 최종 믹스 영양 밸런스 비교</h4>
                                <div style="height:240px; position:relative;">
                                    <canvas id="s6MultiBarChart"></canvas>
                                </div>
                            </div>
                        </div>

                        <!-- 사료 슬롯별 1~4단계 역추적 해부도 -->
                        <div id="s6ReverseAnatomyBox" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"></div>

                        <!-- 신뢰도 가중치 기반 Min~Max 안전 밴드 신호등 감사 테이블 -->
                        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
                                <div>
                                    <h3 class="text-base font-black text-slate-900">
                                        <i class="fa-solid fa-traffic-light mr-1.5 text-amber-500"></i>신뢰도 가중치(C<sub>k</sub>) 기반 선형 결합 영양소 & Min~Max 안전 마진 신호등 감사표
                                    </h3>
                                    <p class="text-xs text-slate-500 mt-0.5">
                                        일반 건사료 역추적 추정치(신뢰도 ~75%)와 처방식/화식(신뢰도 ~93%)의 불확실성 오차(Δ<sub>j</sub> = ∑ α<sub>k</sub>·δ<sub>k,j</sub>)가 전파된 최악 구간에서도 질환별 허용 범위를 벗어나지 않는지 검증합니다.
                                    </p>
                                </div>
                                <div style="display:flex; gap:6px;">
                                    <button type="button" id="s6UnitBtnDM" class="btn btn-secondary btn-sm active" onclick="Step6MultiMixController.setDisplayUnitMode('dm')">건물 기준 (% DM / mg)</button>
                                    <button type="button" id="s6UnitBtnKcal" class="btn btn-secondary btn-sm" onclick="Step6MultiMixController.setDisplayUnitMode('1000kcal')">수의 임상 기준 (Per 1,000 kcal ME)</button>
                                </div>
                            </div>

                            <div class="table-responsive">
                                <table>
                                    <thead>
                                        <tr id="s6AuditTableHeadRow"></tr>
                                    </thead>
                                    <tbody id="s6AuditTableBody"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Modal: STEP 6 Guardian & Vet CDSS Payload Exporter -->
                    <div id="s6ExportPayloadModal" class="modal-overlay" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.55); z-index:9999; align-items:center; justify-content:center; padding:20px;">
                        <div class="modal-card" style="background:#fff; border-radius:16px; max-width:680px; width:100%; padding:24px;">
                            <h3 style="font-size:1.15rem; font-weight:800; color:#1e293b; margin-bottom:6px;">
                                📤 처방사료 데이터 (Guardian Portal STEP 6 & Vet CDSS) 연동 페이로드
                            </h3>
                            <p style="font-size:0.82rem; color:#64748b; margin-bottom:10px;">
                                이 JSON 객체는 <code>처방사료데이터/static/guardian_portal.js</code>의 <code>guardianState.lastMixSummary</code>, <code>SCHEMA-05</code> 및 수의사 CDSS의 <code>1,000 kcal ME</code> 커스텀 식단 규격과 1:1 호환됩니다.
                            </p>
                            <textarea id="s6ExportPayloadTextarea" class="form-control" rows="14" readonly style="width:100%; font-family:monospace; font-size:0.78rem; background:#0f172a; color:#38bdf8; padding:12px; border-radius:10px;"></textarea>
                            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
                                <button type="button" class="btn btn-secondary" onclick="document.getElementById('s6ExportPayloadModal').style.display='none'">닫기</button>
                                <button type="button" class="btn btn-primary" onclick="navigator.clipboard.writeText(document.getElementById('s6ExportPayloadTextarea').value); alert('클립보드에 복사되었습니다.');">📋 JSON 복사</button>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ================================================================== -->
                <!-- [STEP 4] 결과 출력 및 시각화 대시보드 (Visualization & Dashboard) -->
                <!-- ================================================================== -->
                <section id="g-step4-sec" class="bg-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-emerald-500/40 space-y-6">
                    <div class="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
                        <div class="flex items-center space-x-3">
                            <span class="px-3 py-1 rounded-xl bg-emerald-600 text-white font-black text-xs">STEP 4</span>
                            <div>
                                <h2 class="text-lg sm:text-xl font-black text-slate-900">맞춤 믹스피딩 결과 시각화 & 신호등 리포트 · 일일 급여 스케줄표</h2>
                                <p class="text-xs text-slate-500">① 칼로리 밸런스 게이지 & 차트, ② AAFCO/FEDIAF 신호등(Green/Yellow/Red) 판정, ③ 아침·저녁 실전 급여 스케줄을 확인하세요.</p>
                            </div>
                        </div>
                        <div class="flex gap-2 text-xs">
                            <button type="button" onclick="window.print()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold flex items-center space-x-1.5">
                                <i class="fa-solid fa-print"></i>
                                <span>식단 처방표 인쇄 / PDF 저장</span>
                            </button>
                        </div>
                    </div>

                    <!-- 1. 칼로리 밸런스 게이지 바 (Gauge Bar) -->
                    <div class="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div class="text-sm font-black flex items-center space-x-2">
                                <i class="fa-solid fa-gauge-high text-amber-400"></i>
                                <span>1. 목표 DER 대비 현재 믹스피딩 + 토핑 칼로리 밸런스 게이지</span>
                            </div>
                            <span id="g-dash-gauge-status" class="px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-black">🟢 적정 칼로리 Fit (100%)</span>
                        </div>

                        <div class="w-full h-5 bg-slate-800 rounded-full overflow-hidden flex p-0.5 border border-white/15">
                            <div id="g-dash-gauge-bar" class="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 transition-all duration-300" style="width: 100%"></div>
                        </div>

                        <div class="flex flex-wrap justify-between text-xs text-slate-300 pt-1 gap-2">
                            <span id="g-dash-cal-breakdown">주식 사료: 242 kcal + 배합식: 104 kcal + 토핑: 0 kcal = 총 346 kcal</span>
                            <span>목표 DER: <strong id="g-dash-target-der" class="text-amber-300">346 kcal/일</strong></span>
                        </div>
                    </div>

                    <!-- 2. 생애주기 맞춤 AAFCO / FEDIAF 영양 적정성 신호등 리포트 (Green / Yellow / Red) -->
                    <div class="space-y-3">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <h3 class="text-sm font-black text-slate-800"><i class="fa-solid fa-traffic-light text-emerald-600 mr-1.5"></i>2. 생애주기 맞춤 AAFCO / FEDIAF 영양 적정성 신호등 리포트 (Dry Matter 기준)</h3>
                            <span class="text-[11px] text-slate-500">🟢 Green(적정 범위) · 🟡 Yellow(경계/주의) · 🔴 Red(부족 또는 과잉 경고)</span>
                        </div>
                        <div id="g-dash-traffic-lights" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs"></div>
                    </div>

                    <!-- 3. 실천형 일일 급여 스케줄표 (아침 / 점심 / 저녁 그램수 가이드) & 차트 -->
                    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
                        <!-- 좌측(3칸): 아침/저녁 실천형 급여 스케줄표 -->
                        <div class="lg:col-span-3 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white p-5 rounded-2xl border-2 border-emerald-300 flex flex-col justify-between space-y-4">
                            <div class="space-y-3">
                                <div class="flex items-center justify-between border-b border-emerald-200 pb-2.5">
                                    <h3 class="text-base font-black text-emerald-950">🍽️ 3. 주방에서 바로 따라 하는 일일 급여 스케줄표</h3>
                                    <span id="g-dash-active-menu-badge" class="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-black">건식 + 습식 배합</span>
                                </div>
                                <div id="g-dash-schedule-cards" class="space-y-2.5 text-xs"></div>
                            </div>

                            <div id="g-dash-water-advice" class="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-950 flex items-center justify-between flex-wrap gap-2"></div>
                        </div>

                        <!-- 우측(2칸): 칼로리 기여도 & 다량영양소(DM %) 시각화 차트 -->
                        <div class="lg:col-span-2 grid grid-cols-1 gap-4">
                            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col">
                                <div class="text-xs font-black text-slate-700 mb-2">📊 칼로리 공급 비율 & 다량영양소(% DM) 밸런스</div>
                                <div class="grid grid-cols-2 gap-2 items-center flex-1 min-h-[170px]">
                                    <div class="h-40 flex items-center justify-center">
                                        <canvas id="gCalDonutCanvas"></canvas>
                                    </div>
                                    <div class="h-40 flex items-center justify-center">
                                        <canvas id="gMacroBarCanvas"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- 카카오 로그인 & 반려동물 프로필 급여표 저장 CTA 슬롯 -->
                        <div id="guardian-auth-save-cta-slot" class="pt-4"></div>
                    </div>
                </section>

                <!-- ================================================================== -->
                <!-- [STEP 5] 분변키트 검사 결과 폼 & 장내 환경 쉬운 분석/해설 (Guardian Fecal Kit) -->
                <!-- ================================================================== -->
                <section id="g-step5-sec" class="bg-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-teal-300 space-y-6">
                    <div class="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
                        <div class="flex items-center space-x-3">
                            <span class="px-3 py-1 rounded-full bg-teal-600 text-white text-xs font-black">STEP 5</span>
                            <div>
                                <h2 class="text-xl font-black text-slate-900">🧪 분변키트 검사 결과 입력 & 우리 아이 장내 환경 쉬운 해설</h2>
                                <p class="text-xs text-slate-500">아직 키트가 없어도 상단 <strong class="text-teal-700">[체험 시나리오 버튼]</strong>을 눌러 장내 환경 분석과 맞춤 유산균·식단 코칭을 미리 체험해 보세요!</p>
                            </div>
                        </div>
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="text-[11px] font-bold text-slate-500">키트 결과 미리 체험하기:</span>
                            <button type="button" onclick="loadGuardianKitPreset('normal')" id="g-kit-preset-normal" class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-sm transition">
                                🟢 정상 황금변 체험
                            </button>
                            <button type="button" onclick="loadGuardianKitPreset('protein_putrefaction')" id="g-kit-preset-protein_putrefaction" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 border border-slate-200 text-xs font-bold transition">
                                🟡 고기·간식 과다 (독소 주의)
                            </button>
                            <button type="button" onclick="loadGuardianKitPreset('carb_ferment')" id="g-kit-preset-carb_ferment" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 border border-slate-200 text-xs font-bold transition">
                                🟠 탄수화물 과발효 (산성·가스)
                            </button>
                            <button type="button" onclick="loadGuardianKitPreset('fat_mucosal')" id="g-kit-preset-fat_mucosal" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 border border-slate-200 text-xs font-bold transition">
                                🔴 지방 소화불량 & 장점막 민감
                            </button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <!-- 좌측(5칸): 보호자용 분변키트 간편 결과 입력 폼 (기본 접힘 아코디언) -->
                        <div class="lg:col-span-5 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                            <div onclick="toggleGuardianKitStripInput()" class="flex items-center justify-between cursor-pointer select-none p-2.5 rounded-xl bg-white border border-teal-200 hover:bg-teal-50/50 shadow-sm transition">
                                <div class="flex items-center space-x-2">
                                    <div class="text-sm font-black text-slate-800 flex items-center space-x-1.5">
                                        <i class="fa-solid fa-vial-virus text-teal-600"></i>
                                        <span>📋 분변키트 스트립 색상 / 결과 선택</span>
                                    </div>
                                    <span class="text-[11px] text-teal-700 font-bold">(클릭하여 펼치기)</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <span class="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[10px]">체험/입력</span>
                                    <i id="g-kit-strip-chevron" class="fa-solid fa-chevron-down text-teal-700 text-xs transition-transform duration-200"></i>
                                </div>
                            </div>

                            <!-- 아코디언 본문 (기본 hidden) -->
                            <div id="g-kit-strip-body" class="hidden space-y-4 pt-1">

                            <!-- 1. 장내 산도 (pH) -->
                            <div class="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                                <div class="flex items-center justify-between text-xs">
                                    <span class="font-black text-slate-800">① 장내 산도 (분변 pH 패드)</span>
                                    <span id="g-kit-ph-badge" class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px]">pH 6.4 (정상 약산성)</span>
                                </div>
                                <select id="g-kit-ph-level" onchange="onGuardianKitFormChange('phLevel')" class="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold bg-white">
                                    <option value="normal" selected>🟢 정상 약산성 (pH 6.0 ~ 7.0) — 유익균이 살기 좋은 환경</option>
                                    <option value="acidic">🟡 산성 변 (pH 5.5 이하) — 탄수화물/전분 과발효 신호</option>
                                    <option value="alkaline">🔴 알칼리성 변 (pH 7.3 이상) — 단백질 부패·유해균 증식 신호</option>
                                </select>
                                <div class="flex items-center space-x-2 text-[11px] text-slate-500">
                                    <span>세부 pH 수치:</span>
                                    <input type="range" id="g-kit-ph-slider" min="4.8" max="8.5" step="0.1" value="6.4" oninput="onGuardianKitPhSlider(this.value)" class="flex-1 accent-teal-600 cursor-pointer">
                                    <span id="g-kit-ph-val-txt" class="font-black text-teal-700 w-10 text-right">6.4</span>
                                </div>
                            </div>

                            <!-- 2. 암모니아 & 3. 인돌 (단백질 부패 / 장내 유해균 독소) -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div class="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                                    <label class="block text-xs font-black text-slate-800">② 암모니아 (단백질 부패)</label>
                                    <p class="text-[11px] text-slate-500">소화 못 된 고기·간식 독소</p>
                                    <select id="g-kit-ammonia" onchange="onGuardianKitFormChange()" class="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold bg-white">
                                        <option value="normal" selected>🟢 정상 (단백질 소화 양호)</option>
                                        <option value="warn">🟡 주의 (고기·간식 약간 과다)</option>
                                        <option value="high">🔴 높음 (부패 독소·악취 심함)</option>
                                    </select>
                                </div>
                                <div class="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                                    <label class="block text-xs font-black text-slate-800">③ 인돌 (유익균·유해균 균형)</label>
                                    <p class="text-[11px] text-slate-500">장내 미생물 생태계 지표</p>
                                    <select id="g-kit-indole" onchange="onGuardianKitFormChange()" class="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold bg-white">
                                        <option value="normal" selected>🟢 정상 (유익균 우세)</option>
                                        <option value="warn">🟡 경계 (미생물 불균형 시작)</option>
                                        <option value="high">🔴 높음 (유해균 증식·유산균 필수)</option>
                                    </select>
                                </div>
                            </div>

                            <!-- 4. 미소화 지방 & 5. 환원당/젖산 (소화 효소 흡수력) -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div class="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                                    <label class="block text-xs font-black text-slate-800">④ 미소화 지방 (지방변)</label>
                                    <p class="text-[11px] text-slate-500">기름기·췌장/담즙 소화력</p>
                                    <select id="g-kit-fat" onchange="onGuardianKitFormChange()" class="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold bg-white">
                                        <option value="neg" selected>🟢 음성 (지방 소화 우수)</option>
                                        <option value="trace">🟡 미량 검출 (기름진 음식 주의)</option>
                                        <option value="pos">🔴 양성 (지방 소화불량·저지방 필수)</option>
                                    </select>
                                </div>
                                <div class="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                                    <label class="block text-xs font-black text-slate-800">⑤ 환원당·젖산 (탄수화물)</label>
                                    <p class="text-[11px] text-slate-500">전분·당류 소화 및 가스</p>
                                    <select id="g-kit-sugar" onchange="onGuardianKitFormChange()" class="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold bg-white">
                                        <option value="normal" selected>🟢 정상 (탄수화물 흡수 양호)</option>
                                        <option value="warn">🟡 주의 (전분 발효·가스/꾸르륵)</option>
                                        <option value="high">🔴 높음 (탄수화물 소화불량)</option>
                                    </select>
                                </div>
                            </div>

                            <!-- 6. 장 점막 염증 · 잠혈 & 육안 변 냄새/점액 체크 -->
                            <div class="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                                <div>
                                    <label class="block text-xs font-black text-slate-800 mb-1">⑥ 장 점막 자극 · 잠혈 패드 (칼프로텍틴/잠혈)</label>
                                    <select id="g-kit-mucosal" onchange="onGuardianKitFormChange()" class="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold bg-white">
                                        <option value="neg" selected>🟢 음성 (장 점막 장벽 튼튼함)</option>
                                        <option value="trace">🟡 미량 반응 (식이 민감성 · 점막 가벼운 자극)</option>
                                        <option value="pos">🔴 양성 반응 (장 점막 손상 의심 · 수의사 상담 권장)</option>
                                    </select>
                                </div>
                                <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                                    <div>
                                        <label class="block text-[11px] font-bold text-slate-600 mb-1">보호자 관찰: 변 냄새</label>
                                        <select id="g-kit-odor" onchange="onGuardianKitFormChange()" class="w-full p-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-slate-50">
                                            <option value="mild" selected>😊 보통 (건강한 냄새)</option>
                                            <option value="sour">🍋 시큼한 냄새 (발효)</option>
                                            <option value="foul">🤢 심한 악취/계란썩는내</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-[11px] font-bold text-slate-600 mb-1">보호자 관찰: 코 같은 점액변</label>
                                        <select id="g-kit-mucus" onchange="onGuardianKitFormChange()" class="w-full p-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-slate-50">
                                            <option value="no" selected>✨ 없음 (깔끔한 변)</option>
                                            <option value="sometimes">💧 가끔 반짝이는 점액</option>
                                            <option value="yes">⚠️ 젤리 같은 점액 자주 보임</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                            </div><!-- end of g-kit-strip-body -->
                        </div>

                        <!-- 우측(7칸): 장내 환경 쉬운 분석 & 맞춤 식단·유산균 리포트 (기본 접힘 아코디언) -->
                        <div class="lg:col-span-7 space-y-3">
                            <div onclick="toggleGuardianKitReport()" class="flex items-center justify-between cursor-pointer select-none p-3 rounded-2xl bg-white border border-teal-200 hover:bg-teal-50/50 shadow-sm transition">
                                <div class="flex items-center space-x-2">
                                    <div class="text-sm font-black text-slate-800 flex items-center space-x-1.5">
                                        <i class="fa-solid fa-chart-pie text-teal-600"></i>
                                        <span>장내 불균형 주의 단계 및 쉬운 해설 리포트</span>
                                    </div>
                                    <span class="text-[11px] text-teal-700 font-bold">(클릭하여 결과 보기)</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <span id="g-kit-summary-badge" class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">정상 황금변</span>
                                    <i id="g-kit-report-chevron" class="fa-solid fa-chevron-down text-teal-700 text-xs transition-transform duration-200"></i>
                                </div>
                            </div>

                            <!-- 아코디언 본문 (기본 hidden) -->
                            <div id="g-kit-report-body" class="hidden space-y-4 pt-1">
                                <!-- 상단 종합 점수 & 장내 미생물 밸런스 게이지 -->
                            <div class="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-4">
                                <div class="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <span id="g-kit-status-pill" class="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[11px] font-black">🟢 황금 장내 환경</span>
                                        <h3 id="g-kit-headline" class="text-lg font-black mt-1">유익균이 활발하고 소화 흡수력이 매우 훌륭해요!</h3>
                                        <p id="g-kit-subline" class="text-xs text-emerald-200 mt-0.5">현재 식단과 장내 미생물 생태계가 좋은 균형을 이루고 있습니다.</p>
                                    </div>
                                    <div class="flex items-center space-x-3 bg-white/10 px-4 py-2.5 rounded-2xl border border-white/15">
                                        <div class="text-center">
                                            <div class="text-[10px] text-emerald-200 font-bold">장내 환경 점수</div>
                                            <div class="text-2xl font-black text-amber-300"><span id="g-kit-score-num">94</span><span class="text-xs font-normal text-white">/100</span></div>
                                        </div>
                                        <div class="h-8 w-px bg-white/20"></div>
                                        <div class="text-center">
                                            <div class="text-[10px] text-emerald-200 font-bold">추정 소화 흡수율</div>
                                            <div class="text-2xl font-black text-emerald-300"><span id="g-kit-abs-num">93.0</span><span class="text-xs font-normal text-white">%</span></div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 유익균 vs 유해균 장내 생태계 밸런스 바 -->
                                <div class="space-y-1.5">
                                    <div class="flex justify-between text-[11px] font-bold">
                                        <span class="text-emerald-300">🌱 유익균 (유산균·비피더스균) <span id="g-kit-good-pct">78%</span></span>
                                        <span class="text-rose-300">🦠 부패·유해균 및 독소 부담 <span id="g-kit-bad-pct">22%</span></span>
                                    </div>
                                    <div class="w-full h-3.5 bg-rose-500/40 rounded-full overflow-hidden flex border border-white/20">
                                        <div id="g-kit-good-bar" class="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-300" style="width: 78%;"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- 4대 장내 환경 항목별 쉬운 해설 카드 그리드 -->
                            <div>
                                <div class="text-xs font-black text-slate-700 mb-2">🔍 우리 아이 배 속에서 지금 어떤 일이 일어나고 있을까요? (항목별 쉬운 해설)</div>
                                <div id="g-kit-explanation-cards" class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"></div>
                            </div>

                            <!-- 맞춤 식단 & 유산균·보조제 홈케어 가이드 -->
                            <div class="bg-amber-50/90 border-2 border-amber-200 rounded-2xl p-4 space-y-3">
                                <div class="flex items-center justify-between">
                                    <div class="text-sm font-black text-amber-950">💊 분변키트 결과 기반 맞춤 식단 & 유산균 홈케어 처방</div>
                                    <span class="text-[11px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-lg">맞춤 액션 플랜</span>
                                </div>
                                <div id="g-kit-care-guide" class="space-y-2 text-xs text-slate-800"></div>

                                <div class="pt-2 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-2">
                                    <button type="button" onclick="toggleApplyKitAbsorptionToDiet()" id="g-kit-apply-abs-btn" class="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-sm transition flex items-center space-x-1.5">
                                        <i class="fa-solid fa-bolt"></i>
                                        <span>⚡ 추정 소화 흡수율을 Step 1·4 하루 사료 급여량에 반영하기</span>
                                    </button>
                                    <button type="button" onclick="sendGuardianDataToVetCdss()" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm transition flex items-center space-x-1.5">
                                        <i class="fa-solid fa-user-doctor"></i>
                                        <span>🩺 이 분변키트 결과를 수의사용 정밀 CDSS로 보내기</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ================================================================== -->
                <!-- [ADMIN ONLY MODAL] 관리자 전용 통합 대시보드 & 6대 표준 데이터 스키마 센터 (보호자에게는 숨김) -->
                <!-- ================================================================== -->
                <div id="admin-schema-dashboard-modal" class="hidden fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-md overflow-y-auto p-4 sm:p-8">
                    <div class="max-w-7xl mx-auto">
                        <section id="g-unified-dashboard-sec" class="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-indigo-400/60 space-y-6">
                            <div class="flex flex-wrap items-center justify-between border-b border-slate-700/80 pb-4 gap-3">
                                <div class="flex items-center space-x-3">
                                    <span class="px-3 py-1 rounded-full bg-indigo-500 text-white text-xs font-black shadow">🔒 ADMIN & VET PRO ONLY</span>
                                    <div>
                                        <h2 class="text-xl font-black text-white">📊 관리자 통합 컨트롤 타워 대시보드 & 6대 표준 데이터 스키마 아키텍처</h2>
                                        <p class="text-xs text-slate-300">인증된 관리자·수의사 전용 화면입니다. 단일 백엔드(Single Backend)의 6대 표준 데이터 스키마 무결성과 실시간 JSON 페이로드를 관리합니다.</p>
                                    </div>
                                </div>
                                <div class="flex flex-wrap items-center gap-2 text-xs">
                                    <button type="button" onclick="copyLiveSchemaJson()" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-indigo-200 font-bold transition flex items-center space-x-1.5">
                                        <i class="fa-solid fa-copy"></i>
                                        <span id="g-schema-copy-txt">현재 통합 JSON 복사</span>
                                    </button>
                                    <button type="button" onclick="downloadLiveSchemaJson()" class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow transition flex items-center space-x-1.5">
                                        <i class="fa-solid fa-download"></i>
                                        <span>통합 스키마 데이터(.json) 다운로드</span>
                                    </button>
                                    <button type="button" onclick="closeAdminSchemaDashboardModal()" class="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black shadow transition flex items-center space-x-1.5">
                                        <i class="fa-solid fa-xmark"></i>
                                        <span>대시보드 닫기</span>
                                    </button>
                                </div>
                            </div>

                    <!-- 1. 상단 4대 핵심 KPI 요약 카드 -->
                    <div id="g-unified-kpi-cards" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs"></div>

                    <!-- 2. 중단: 5축 통합 영양·장내 밸런스 레이더 차트 & 데이터 스키마 무결성 매트릭스 -->
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                        <!-- 좌측(5칸): 5축 통합 건강 밸런스 레이더 차트 -->
                        <div class="lg:col-span-5 bg-slate-800/90 p-5 rounded-2xl border border-slate-700 flex flex-col justify-between">
                            <div>
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-sm font-black text-indigo-200">🎯 5축 통합 영양·장내환경 밸런스 레이더</span>
                                    <span id="g-unified-total-grade" class="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[11px] font-black">종합 S등급</span>
                                </div>
                                <p class="text-[11px] text-slate-400 mb-3">칼로리 적정성 · 다량영양소 · 칼슘:인(Ca:P) · 간식 안전성 · 장내 유익균/흡수율 5대 지표를 100점 만점으로 통합 시각화합니다.</p>
                            </div>
                            <div class="h-60 flex items-center justify-center bg-slate-900/60 rounded-xl p-2 border border-slate-700/60">
                                <canvas id="gUnifiedRadarCanvas"></canvas>
                            </div>
                        </div>

                        <!-- 우측(7칸): 단일 백엔드 6대 데이터 스키마 무결성 검증(Validation) 상태 테이블 -->
                        <div class="lg:col-span-7 bg-slate-800/90 p-5 rounded-2xl border border-slate-700 flex flex-col justify-between space-y-3">
                            <div class="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h3 class="text-sm font-black text-emerald-300">🛡️ 단일 백엔드(Single Backend) 6대 핵심 데이터 스키마 무결성 & 연동 현황</h3>
                                    <p class="text-[11px] text-slate-400">보호자용 포털(Frontend A)과 수의사용 CDSS(Frontend B)가 실시간 공유하는 표준 데이터 스키마 규격입니다.</p>
                                </div>
                                <span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-black">✔ 6/6 스키마 검증 통과</span>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="w-full text-[11.5px] text-left border-collapse">
                                    <thead class="bg-slate-900/90 text-slate-300 font-black border-b border-slate-700">
                                        <tr>
                                            <th class="py-2 px-2.5">스키마 ID</th>
                                            <th class="py-2 px-2.5">데이터 도메인 명칭</th>
                                            <th class="py-2 px-2.5">핵심 필드 및 정규화 기준</th>
                                            <th class="py-2 px-2.5 text-center">레코드/상태</th>
                                        </tr>
                                    </thead>
                                    <tbody id="g-unified-schema-summary-tbody" class="divide-y divide-slate-700/60 text-slate-200"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- 3. 하단: 6대 표준 데이터 스키마(JSON Schema) 명세 & 실시간 데이터(Live Payload) 인터랙티브 뷰어 -->
                    <div class="bg-slate-950/90 p-5 rounded-2xl border border-slate-800 space-y-4">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div class="text-sm font-black text-white flex items-center space-x-2">
                                <i class="fa-solid fa-database text-indigo-400"></i>
                                <span>🗄️ 6대 데이터 스키마(JSON Schema) 구조 명세 & 현재 실시간 레코드 인스펙터</span>
                            </div>
                            <div class="flex flex-wrap gap-1.5 text-[11px]">
                                <button type="button" onclick="selectGuardianSchemaTab('schema_patient')" id="g-sch-tab-schema_patient" class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-black transition">① 환자·에너지 스키마</button>
                                <button type="button" onclick="selectGuardianSchemaTab('schema_feed')" id="g-sch-tab-schema_feed" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition">② 사료·DM 환산 스키마</button>
                                <button type="button" onclick="selectGuardianSchemaTab('schema_ingredient')" id="g-sch-tab-schema_ingredient" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition">③ 117종 원재료(36영양소)</button>
                                <button type="button" onclick="selectGuardianSchemaTab('schema_mix_diy')" id="g-sch-tab-schema_mix_diy" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition">④ 믹스피딩·화식DIY 스키마</button>
                                <button type="button" onclick="selectGuardianSchemaTab('schema_reverse')" id="g-sch-tab-schema_reverse" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition">⑤ 사료역추적(PAVA) 스키마</button>
                                <button type="button" onclick="selectGuardianSchemaTab('schema_fecal_cdss')" id="g-sch-tab-schema_fecal_cdss" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition">⑥ 분변키트·수의사CDSS 스키마</button>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                            <!-- 좌측: 선택된 스키마의 필드 정의서 (Schema Spec) -->
                            <div class="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                                <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                                    <span id="g-schema-spec-title" class="font-black text-indigo-300">📐 스키마 필드 정의서 (Field Type & Validation Rules)</span>
                                    <span class="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">JSON Schema Draft-07</span>
                                </div>
                                <pre id="g-schema-spec-pre" class="text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-72 leading-relaxed"></pre>
                            </div>

                            <!-- 우측: 현재 화면에서 실시간 생성된 Live JSON 데이터 -->
                            <div class="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                                <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                                    <span class="font-black text-amber-300">⚡ 실시간 바인딩 데이터 (Live Instance Payload)</span>
                                    <span class="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">Real-time Synced</span>
                                </div>
                                <pre id="g-schema-live-pre" class="text-[11px] font-mono text-sky-200 overflow-x-auto max-h-72 leading-relaxed"></pre>
                            </div>
                        </div>
                    </div>
                        </section>
                    </div>
                </div>

            </div>
        `;

        // 초기 드롭다운 채우기
        filterGuardianFoodSearch("");
        populateDiyIngredientDropdown("ALL");
        populateReverseIngredientDropdown();
        evaluateGuardianFecalKit();
        renderUnifiedDashboardAndSchemas();
    }

    // =========================================================================
    // 7. Step 1 & Step 2 이벤트 핸들러
    // =========================================================================
    window.scrollToGuardianSection = function (secId) {
        const el = document.getElementById(secId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    window.selectGuardianBcs = function (score) {
        guardianState.profile.bcs = score;
        const badge = document.getElementById("g-bcs-badge");
        const labels = {
            1: "BCS 1/9 (극심한 저체중)", 2: "BCS 2/9 (매우 마름)", 3: "BCS 3/9 (마른 체형)",
            4: "BCS 4/9 (살짝 마름)", 5: "BCS 5/9 (이상적 표준)", 6: "BCS 6/9 (약간 통통)",
            7: "BCS 7/9 (과체중)", 8: "BCS 8/9 (비만)", 9: "BCS 9/9 (고도 비만)"
        };
        if (badge) badge.innerText = labels[score] || `BCS ${score}/9`;

        // 카드 하이라이트
        [3, 5, 7, 8].forEach(c => {
            const card = document.getElementById(`g-bcs-card-${c}`);
            if (!card) return;
            const active = (c === 3 && score <= 3) || (c === 5 && (score === 4 || score === 5)) || (c === 7 && (score === 6 || score === 7)) || (c === 8 && score >= 8);
            card.className = active
                ? "g-bcs-card text-left p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50/60 transition"
                : "g-bcs-card text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-400 transition";
        });

        document.querySelectorAll("#g-bcs-num-btns button").forEach(btn => {
            const v = parseInt(btn.getAttribute("data-bcs"));
            btn.className = v === score
                ? "w-6 h-6 rounded-lg font-bold border bg-emerald-600 text-white border-emerald-600"
                : "w-6 h-6 rounded-lg font-bold border bg-slate-100 text-slate-600 border-slate-200";
        });

        refreshAllGuardianCalculations();
    };

    window.selectGuardianMcs = function (score) {
        guardianState.profile.mcs = score;
        const badge = document.getElementById("g-mcs-badge");
        const labels = {
            4: "MCS 4/4 (정상 근육)",
            3: "MCS 3/4 (경도 근육감소)",
            2: "MCS 2/4 (중등도 감소)",
            1: "MCS 1/4 (심한 근육손실)"
        };
        if (badge) badge.innerText = labels[score];

        [1, 2, 3, 4].forEach(c => {
            const card = document.getElementById(`g-mcs-card-${c}`);
            if (!card) return;
            card.className = c === score
                ? "g-mcs-card text-left p-3 rounded-xl border-2 border-blue-500 bg-blue-50/60 transition"
                : "g-mcs-card text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 transition";
        });

        refreshAllGuardianCalculations();
    };

    window.onGuardianProfileChange = function () {
        const p = guardianState.profile;
        p.species = document.getElementById("g-species")?.value || "dog";
        p.name = document.getElementById("g-name")?.value || "보리";
        p.breed = document.getElementById("g-breed")?.value || "말티즈";
        p.weightKg = parseFloat(document.getElementById("g-weight")?.value) || 4.5;
        p.lifeStage = document.getElementById("g-lifestage")?.value || "adult";
        p.neutered = document.getElementById("g-neutered")?.value === "true";
        p.activity = document.getElementById("g-activity")?.value || "moderate";
        p.fecalScore = parseFloat(document.getElementById("g-fecal")?.value) || 3.5;
        p.mealsPerDay = parseInt(document.getElementById("g-meals")?.value) || 2;
        p.healthConcern = document.getElementById("g-concern")?.value || "none";

        // 알러지 3대 카테고리 실시간 수집
        p.allergies = Array.from(document.querySelectorAll("input[name='g-allergy']:checked")).map(el => el.value);

        refreshAllGuardianCalculations();
    };

    window.switchGuardianIngestTab = function (tab) {
        ["search", "ocr", "manual"].forEach(t => {
            const btn = document.getElementById(`g-ingest-btn-${t}`);
            if (btn) {
                btn.className = t === tab
                    ? "px-3 py-1.5 rounded-lg bg-white text-blue-700 font-black shadow-sm transition"
                    : "px-3 py-1.5 rounded-lg text-slate-600 font-bold hover:text-slate-900 transition";
            }
        });
        const sPanel = document.getElementById("g-ingest-panel-search");
        const oPanel = document.getElementById("g-ingest-panel-ocr");
        if (sPanel) sPanel.classList.toggle("hidden", tab !== "search");
        if (oPanel) oPanel.classList.toggle("hidden", tab !== "ocr");
    };

    function getCombinedDryFoodPool() {
        const list = [...COMMERCIAL_DRY_FOODS];
        if (typeof EMBEDDED_DIETS !== "undefined" && Array.isArray(EMBEDDED_DIETS)) {
            EMBEDDED_DIETS.filter(d => d.type === "건식").forEach((d, idx) => {
                const moist = d.moisture_percent || 9.0;
                const kcalKg = d.nutrients?.energy_density_kcal_per_kg || 3750;
                const factor = kcalKg / 1000.0;
                list.push({
                    id: `vet_dry_${idx}`,
                    name: `[처방식] ${d.company} ${d.name}`,
                    brand: d.company,
                    species: d.species === "고양이" ? "cat" : "dog",
                    type: "건식",
                    protein_af: Math.round((d.nutrients.protein_g * factor / 10.0) * 10) / 10,
                    fat_af: Math.round((d.nutrients.fat_g * factor / 10.0) * 10) / 10,
                    fiber_af: 2.5,
                    ash_af: 6.0,
                    moisture_af: moist,
                    ca_af: 0.85,
                    p_af: Math.round((d.nutrients.phosphorus_g * factor / 10.0) * 100) / 100,
                    kcal_per_kg: kcalKg,
                    ingredients_order: ["쌀", "가수분해가금육단백질", "옥수수", "동물성지방", "비트펄프", "어유", "미네랄합제"]
                });
            });
        }
        return list;
    }

    window.filterGuardianFoodSearch = function (keyword) {
        const sel = document.getElementById("g-food-search-select");
        if (!sel) return;
        const kw = (keyword || "").trim().toLowerCase();
        const pool = getCombinedDryFoodPool();
        const filtered = kw ? pool.filter(f => f.name.toLowerCase().includes(kw) || f.brand.toLowerCase().includes(kw)) : pool;

        if (filtered.length === 0) {
            sel.innerHTML = `<option value="" disabled selected>❌ '${keyword}' 검색 결과가 없습니다 (직접 입력을 이용해주세요)</option>`;
            return;
        }

        sel.innerHTML = `<option value="" disabled selected>👉 사료를 선택해주세요 (총 ${filtered.length}종 검색됨)</option>` +
            filtered.map(f => `<option value="${f.id}">${f.name} (조단백 ${f.protein_af}% · 조지방 ${f.fat_af}% · ${f.kcal_per_kg}kcal/kg)</option>`).join("");
    };

    window.applyCurrentGuardianFoodSearchSelect = function () {
        const sel = document.getElementById("g-food-search-select");
        if (sel && sel.value) {
            onSelectGuardianCommercialFood(sel.value);
        } else {
            alert("선택할 사료를 드롭다운 목록에서 먼저 지정해주세요.");
        }
    };

    window.onSelectGuardianCommercialFood = function (foodId) {
        if (!foodId) return;
        const pool = getCombinedDryFoodPool();
        const found = pool.find(f => f.id === foodId);
        if (!found) return;

        guardianState.selectedDryFood = { ...found };

        // 1. '현재 선택/입력된 주식 사료' 타이틀 즉각 갱신 및 시각 효과
        const titleEl = document.getElementById("g-current-food-title");
        if (titleEl) {
            titleEl.textContent = found.name;
            titleEl.className = "text-emerald-700 underline font-black transition-colors duration-300";
            titleEl.parentElement.style.backgroundColor = "#ecfdf5";
            setTimeout(() => { if (titleEl.parentElement) titleEl.parentElement.style.backgroundColor = ""; }, 1200);
        }

        // 2. 수동 수정 입력창 값들 즉시 동기화
        const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
        setVal("g-dry-name", found.name);
        setVal("g-dry-prot", found.protein_af);
        setVal("g-dry-fat", found.fat_af);
        setVal("g-dry-fiber", found.fiber_af);
        setVal("g-dry-ash", found.ash_af);
        setVal("g-dry-moist", found.moisture_af);
        setVal("g-dry-ca", found.ca_af);
        setVal("g-dry-p", found.p_af);

        // 3. 역추적 및 전체 계산 동기화
        syncReverseIngredientsFromDryFood();
        refreshAllGuardianCalculations();
        if (guardianState.activeMenu === 6) runGuardianReverseTracing();
    };


    // [Step 5] 분변키트 아코디언 토글 (아직 키트 미출시 상태이므로 기본 접힘)
    window.toggleGuardianKitStripInput = function (forceOpen) {
        const body = document.getElementById("g-kit-strip-body");
        const chevron = document.getElementById("g-kit-strip-chevron");
        if (!body) return;
        const shouldOpen = forceOpen !== undefined ? forceOpen : body.classList.contains("hidden");
        body.classList.toggle("hidden", !shouldOpen);
        if (chevron) {
            chevron.className = shouldOpen
                ? "fa-solid fa-chevron-up text-teal-700 text-xs transition-transform duration-200"
                : "fa-solid fa-chevron-down text-teal-700 text-xs transition-transform duration-200";
        }
    };

    window.toggleGuardianKitReport = function (forceOpen) {
        const body = document.getElementById("g-kit-report-body");
        const chevron = document.getElementById("g-kit-report-chevron");
        if (!body) return;
        const shouldOpen = forceOpen !== undefined ? forceOpen : body.classList.contains("hidden");
        body.classList.toggle("hidden", !shouldOpen);
        if (chevron) {
            chevron.className = shouldOpen
                ? "fa-solid fa-chevron-up text-teal-700 text-xs transition-transform duration-200"
                : "fa-solid fa-chevron-down text-teal-700 text-xs transition-transform duration-200";
        }
    };

    window.onGuardianDryFoodManualChange = function () {
        const f = guardianState.selectedDryFood;
        f.name = document.getElementById("g-dry-name")?.value || "사용자 입력 사료";
        f.protein_af = parseFloat(document.getElementById("g-dry-prot")?.value) || 24.0;
        f.fat_af = parseFloat(document.getElementById("g-dry-fat")?.value) || 14.0;
        f.fiber_af = parseFloat(document.getElementById("g-dry-fiber")?.value) || 2.5;
        f.ash_af = parseFloat(document.getElementById("g-dry-ash")?.value) || 6.5;
        f.moisture_af = parseFloat(document.getElementById("g-dry-moist")?.value) || 10.0;
        f.ca_af = parseFloat(document.getElementById("g-dry-ca")?.value) || 0.9;
        f.p_af = parseFloat(document.getElementById("g-dry-p")?.value) || 0.75;
        delete f.kcal_per_kg; // 수동 변경 시 Atwater 자동 계산 사용

        refreshAllGuardianCalculations();
    };

    // 포장지 OCR 텍스트 파싱
    window.parseGuardianOcrText = function () {
        const raw = document.getElementById("g-ocr-textarea")?.value || "";
        if (!raw.trim()) {
            alert("분석할 포장지 성분/원재료 텍스트를 입력하거나 사진을 업로드해주세요.");
            return;
        }
        const grab = (regex, fallback) => {
            const m = raw.match(regex);
            return m ? parseFloat(m[1]) : fallback;
        };
        document.getElementById("g-dry-prot").value = grab(/(?:조단백질|단백질|Protein)[^\d]*(\d+(?:\.\d+)?)/i, 26.0);
        document.getElementById("g-dry-fat").value = grab(/(?:조지방|지방|Fat)[^\d]*(\d+(?:\.\d+)?)/i, 15.0);
        document.getElementById("g-dry-fiber").value = grab(/(?:조섬유|섬유|Fiber)[^\d]*(\d+(?:\.\d+)?)/i, 3.0);
        document.getElementById("g-dry-ash").value = grab(/(?:조회분|회분|Ash)[^\d]*(\d+(?:\.\d+)?)/i, 7.0);
        document.getElementById("g-dry-moist").value = grab(/(?:수분|Moisture)[^\d]*(\d+(?:\.\d+)?)/i, 10.0);
        document.getElementById("g-dry-ca").value = grab(/(?:칼슘|Calcium)[^\d]*(\d+(?:\.\d+)?)/i, 1.0);
        document.getElementById("g-dry-p").value = grab(/(?:인|Phosphorus)[^\d]*(\d+(?:\.\d+)?)/i, 0.8);

        // 원재료 키워드 매칭
        const db = window.GUARDIAN_INGREDIENTS_DB || [];
        const matchedIds = [];
        const tokens = raw.split(/[,،·/()\n]+/).map(s => s.trim()).filter(Boolean);
        tokens.forEach(tok => {
            const hit = db.find(ing => tok.length >= 2 && (ing.name_ko.includes(tok) || tok.includes(ing.name_ko.split(",")[0])));
            if (hit && !matchedIds.includes(hit.id)) matchedIds.push(hit.id);
        });
        if (matchedIds.length >= 2) {
            guardianState.menu6_reverse.selectedIngIds = matchedIds.slice(0, 10);
        }

        onGuardianDryFoodManualChange();
        if (guardianState.activeMenu === 6) runGuardianReverseTracing();
        alert("✅ 포장지 텍스트에서 보증성분 수치와 원재료 목록을 성공적으로 추출했습니다!");
    };

    window.runGuardianImageOCR = async function (event) {
        const file = event.target.files?.[0];
        if (!file) return;
        const statusEl = document.getElementById("g-ocr-status");
        if (statusEl) statusEl.innerText = "⏳ AI OCR이 포장지 글자를 판독 중입니다...";
        try {
            if (typeof Tesseract !== "undefined") {
                const res = await Tesseract.recognize(file, "kor+eng");
                const txt = res?.data?.text || "";
                const area = document.getElementById("g-ocr-textarea");
                if (area) area.value = txt;
                if (statusEl) statusEl.innerText = "✅ OCR 스캔 완료! 성분을 자동 추출합니다.";
                parseGuardianOcrText();
            } else {
                if (statusEl) statusEl.innerText = "⚠️ OCR 모듈 로드 대기 중입니다. 우측 텍스트창을 이용해 주세요.";
            }
        } catch (err) {
            if (statusEl) statusEl.innerText = "⚠️ 이미지 인식 중 오류가 발생했습니다.";
        }
    };

    // =========================================================================
    // 8. Step 3: 6대 핵심 메뉴 라우팅 및 개별 메뉴 로직
    // =========================================================================
    window.selectGuardianMenu = function (menuNum) {
        guardianState.activeMenu = menuNum;
        [1, 2, 3, 4, 5, 6].forEach(n => {
            const card = document.getElementById(`g-menu-card-${n}`);
            const view = document.getElementById(`g-menu-view-${n}`);
            if (card) {
                card.className = n === menuNum
                    ? "g-menu-card text-left p-3.5 rounded-2xl border-2 border-emerald-600 bg-emerald-50/70 shadow-sm transition flex flex-col justify-between"
                    : "g-menu-card text-left p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 bg-white transition flex flex-col justify-between";
            }
            if (view) {
                view.classList.toggle("hidden", n !== menuNum);
            }
        });

        if (menuNum === 5) renderDiyBuilderAll();
        if (menuNum === 6 && typeof window.Step6MultiMixController !== "undefined") {
            isSyncingStep6 = true;
            window.Step6MultiMixController.syncFromHostEnvironment();
            window.Step6MultiMixController.recalculateAndRender();
            isSyncingStep6 = false;
            setTimeout(() => {
                if (guardianState.activeMenu === 6 && typeof window.Step6MultiMixController !== "undefined") {
                    isSyncingStep6 = true;
                    window.Step6MultiMixController.recalculateAndRender();
                    isSyncingStep6 = false;
                }
            }, 60);
        }
        refreshAllGuardianCalculations(true);
    };

    // --- 메뉴 1: 건식 + 습식 ---
    window.setMenu1Ratio = function (dryPct) {
        const v = Math.min(90, Math.max(10, parseInt(dryPct) || 70));
        guardianState.menu1.dryRatioPct = v;
        const sl = document.getElementById("g-m1-slider");
        if (sl) sl.value = v;
        document.getElementById("g-m1-dry-pct-label").innerText = `${v}%`;
        document.getElementById("g-m1-wet-pct-label").innerText = `${100 - v}%`;
        refreshAllGuardianCalculations();
    };

    window.onChangeMenu1Wet = function (wetId) {
        guardianState.menu1.wetFoodId = wetId;
        const w = COMMERCIAL_WET_AND_FRESH.find(x => x.id === wetId);
        if (w && document.getElementById("g-m1-wet-desc")) {
            document.getElementById("g-m1-wet-desc").innerText = w.desc;
        }
        refreshAllGuardianCalculations();
    };

    // --- 메뉴 2: 건식 + 화식 ---
    window.setMenu2Ratio = function (dryPct) {
        const v = Math.min(90, Math.max(10, parseInt(dryPct) || 70));
        guardianState.menu2.dryRatioPct = v;
        const sl = document.getElementById("g-m2-slider");
        if (sl) sl.value = v;
        document.getElementById("g-m2-dry-pct-label").innerText = `${v}%`;
        document.getElementById("g-m2-fresh-pct-label").innerText = `${100 - v}%`;
        refreshAllGuardianCalculations();
    };

    window.onChangeMenu2Fresh = function (freshId) {
        guardianState.menu2.freshFoodId = freshId;
        const f = COMMERCIAL_WET_AND_FRESH.find(x => x.id === freshId);
        if (f && document.getElementById("g-m2-fresh-desc")) {
            document.getElementById("g-m2-fresh-desc").innerText = f.desc;
        }
        refreshAllGuardianCalculations();
    };

    // --- 메뉴 3: 건식 + 단일 원재료 ---
    window.setMenu3Ratio = function (rawPct) {
        const v = Math.min(40, Math.max(5, parseInt(rawPct) || 10));
        guardianState.menu3.rawRatioPct = v;
        const sl = document.getElementById("g-m3-slider");
        if (sl) sl.value = v;
        document.getElementById("g-m3-dry-pct-label").innerText = `${100 - v}%`;
        document.getElementById("g-m3-raw-pct-label").innerText = `${v}%`;
        refreshAllGuardianCalculations();
    };

    window.onChangeMenu3Raw = function (rawId) {
        guardianState.menu3.rawIngId = rawId;
        const r = SINGLE_RAW_INGREDIENTS.find(x => x.id === rawId);
        if (r && document.getElementById("g-m3-prep-tip")) {
            document.getElementById("g-m3-prep-tip").innerText = r.prepTip;
        }
        refreshAllGuardianCalculations();
    };

    // --- 메뉴 4: 토핑 10% 안전 제어기 ---
    window.changeToppingCount = function (topId, delta) {
        const cur = guardianState.menu4.selectedToppings[topId] || 0;
        const next = Math.max(0, Math.min(10, cur + delta));
        guardianState.menu4.selectedToppings[topId] = next;
        const el = document.getElementById(`g-top-cnt-${topId}`);
        if (el) el.innerText = next;
        refreshAllGuardianCalculations();
    };

    window.resetMenu4Toppings = function () {
        Object.keys(guardianState.menu4.selectedToppings).forEach(k => {
            guardianState.menu4.selectedToppings[k] = 0;
            const el = document.getElementById(`g-top-cnt-${k}`);
            if (el) el.innerText = "0";
        });
        refreshAllGuardianCalculations();
    };

    function calcTotalToppingsSummary() {
        let totalKcal = 0;
        let totalGrams = 0;
        const activeItems = [];
        TOPPING_SNACK_ITEMS.forEach(t => {
            const cnt = guardianState.menu4.selectedToppings[t.id] || 0;
            if (cnt > 0) {
                const k = cnt * t.kcalPerUnit;
                const g = cnt * t.weightPerUnitG;
                totalKcal += k;
                totalGrams += g;
                activeItems.push({ ...t, count: cnt, kcal: k, grams: g });
            }
        });
        return { totalKcal, totalGrams, activeItems };
    }

    // =========================================================================
    // 9. [메뉴 5] 화식 자가 만들기 (Recipe DIY Builder - 세련된 리디자인)
    // =========================================================================
    window.populateDiyIngredientDropdown = function (cat) {
        const sel = document.getElementById("g-diy-ing-select");
        if (!sel) return;
        const db = window.GUARDIAN_INGREDIENTS_DB || [];
        const filtered = cat === "ALL" ? db : db.filter(x => x.category === cat);
        sel.innerHTML = filtered.map(x => `<option value="${x.id}">[${x.category}] ${x.name_ko} (${x.energy_kcal}kcal · 단백 ${x.protein_g}g · 지방 ${x.fat_g}g)</option>`).join("");
    };

    window.addDiyIngredientRow = function () {
        const sel = document.getElementById("g-diy-ing-select");
        if (!sel || !sel.value) return;
        const db = window.GUARDIAN_INGREDIENTS_DB || [];
        const found = db.find(x => x.id === sel.value);
        if (!found) return;

        if (guardianState.menu5_diy.items.some(i => i.id === found.id)) {
            alert("이미 레시피에 추가된 식재료입니다.");
            return;
        }
        guardianState.menu5_diy.items.push({ id: found.id, name_ko: found.name_ko, ratio: 10.0 });
        renderDiyBuilderAll();
        refreshAllGuardianCalculations();
    };

    window.removeDiyIngredientRow = function (idx) {
        guardianState.menu5_diy.items.splice(idx, 1);
        renderDiyBuilderAll();
        refreshAllGuardianCalculations();
    };

    window.onDiyItemRatioChange = function (idx, val) {
        if (guardianState.menu5_diy.items[idx]) {
            guardianState.menu5_diy.items[idx].ratio = Math.max(0, parseFloat(val) || 0);
            renderDiyBuilderAll();
            refreshAllGuardianCalculations();
        }
    };

    window.setDiyPrepDays = function (days) {
        guardianState.menu5_diy.prepDays = days;
        [1, 3, 7, 14].forEach(d => {
            const btn = document.getElementById(`g-diy-prep-btn-${d}`);
            if (btn) {
                btn.className = d === days
                    ? "px-2.5 py-1 rounded-lg font-bold bg-indigo-600 text-white"
                    : "px-2.5 py-1 rounded-lg font-bold bg-slate-100 text-slate-600";
            }
        });
        renderDiyBuilderAll();
    };

    window.loadDiyPresetTemplate = function (tpl) {
        if (!tpl) return;
        const db = window.GUARDIAN_INGREDIENTS_DB || [];
        const findByKeyword = (kw, fallbackIdx) => db.find(x => x.name_ko.includes(kw)) || db[fallbackIdx] || db[0];

        if (tpl === "standard_chicken") {
            const m = findByKeyword("닭고기", 89);
            const c = findByKeyword("귀리", 0);
            const v1 = findByKeyword("단호박", 34);
            const v2 = findByKeyword("양배추", 46);
            guardianState.menu5_diy.items = [
                { id: m.id, name_ko: m.name_ko, ratio: 48.0 },
                { id: c.id, name_ko: c.name_ko, ratio: 22.0 },
                { id: v1.id, name_ko: v1.name_ko, ratio: 18.0 },
                { id: v2.id, name_ko: v2.name_ko, ratio: 9.0 },
                { id: "supp_salmon_oil", name_ko: "정제 연어오일/어유 (오메가-3 보충)", ratio: 1.8 },
                { id: "supp_eggshell", name_ko: "난각분말 (계란껍질 칼슘보충제)", ratio: 1.2 }
            ];
        } else if (tpl === "lowfat_cod") {
            const m = findByKeyword("대구", 70);
            const c = findByKeyword("감자", 18);
            const v1 = findByKeyword("양배추", 46);
            const v2 = findByKeyword("브로콜리", 40);
            guardianState.menu5_diy.items = [
                { id: m.id, name_ko: m.name_ko, ratio: 52.0 },
                { id: c.id, name_ko: c.name_ko, ratio: 25.0 },
                { id: v1.id, name_ko: v1.name_ko, ratio: 12.0 },
                { id: v2.id, name_ko: v2.name_ko, ratio: 8.5 },
                { id: "supp_salmon_oil", name_ko: "정제 연어오일/어유 (오메가-3 보충)", ratio: 1.2 },
                { id: "supp_eggshell", name_ko: "난각분말 (계란껍질 칼슘보충제)", ratio: 1.3 }
            ];
        } else if (tpl === "renal_lowp") {
            const m = findByKeyword("닭고기", 89);
            const e = findByKeyword("달걀", 60);
            const c = findByKeyword("쌀", 2);
            const v1 = findByKeyword("단호박", 34);
            guardianState.menu5_diy.items = [
                { id: m.id, name_ko: m.name_ko, ratio: 28.0 },
                { id: e.id, name_ko: e.name_ko, ratio: 18.0 },
                { id: c.id, name_ko: c.name_ko, ratio: 34.0 },
                { id: v1.id, name_ko: v1.name_ko, ratio: 17.0 },
                { id: "supp_salmon_oil", name_ko: "정제 연어오일/어유 (오메가-3 보충)", ratio: 1.8 },
                { id: "supp_eggshell", name_ko: "난각분말 (계란껍질 칼슘보충제)", ratio: 1.2 }
            ];
        } else if (tpl === "beef_energy") {
            const m = findByKeyword("소고기", 95);
            const c = findByKeyword("고구마", 20);
            const v1 = findByKeyword("브로콜리", 40);
            const v2 = findByKeyword("당근", 36);
            guardianState.menu5_diy.items = [
                { id: m.id, name_ko: m.name_ko, ratio: 50.0 },
                { id: c.id, name_ko: c.name_ko, ratio: 24.0 },
                { id: v1.id, name_ko: v1.name_ko, ratio: 13.0 },
                { id: v2.id, name_ko: v2.name_ko, ratio: 10.0 },
                { id: "supp_salmon_oil", name_ko: "정제 연어오일/어유 (오메가-3 보충)", ratio: 1.6 },
                { id: "supp_eggshell", name_ko: "난각분말 (계란껍질 칼슘보충제)", ratio: 1.4 }
            ];
        }
        renderDiyBuilderAll();
        refreshAllGuardianCalculations();
    };

    // AAFCO 황금비율(총합 100% + 칼슘:인 1.25:1) 원클릭 자동 밸런서
    window.autoBalanceDiyRecipe = function () {
        const items = guardianState.menu5_diy.items;
        if (items.length === 0) return;

        // 난각분말이 없으면 자동 추가
        let eggItem = items.find(i => i.id === "supp_eggshell");
        if (!eggItem) {
            eggItem = { id: "supp_eggshell", name_ko: "난각분말 (계란껍질 칼슘보충제)", ratio: 1.2 };
            items.push(eggItem);
        }

        // 나머지 원료 합을 98.8%로 정규화 후 인(P) 함량 계산
        const db = window.GUARDIAN_INGREDIENTS_DB || [];
        let otherSum = items.filter(i => i.id !== "supp_eggshell").reduce((a, b) => a + b.ratio, 0) || 100;
        items.forEach(i => {
            if (i.id !== "supp_eggshell") {
                i.ratio = Math.round((i.ratio / otherSum) * 98.8 * 10) / 10;
            }
        });

        let totalP = 0;
        let otherCa = 0;
        items.forEach(i => {
            if (i.id === "supp_eggshell") return;
            const ing = db.find(x => x.id === i.id);
            if (ing) {
                totalP += (ing.phosphorus_mg || 0) * (i.ratio / 100.0);
                otherCa += (ing.calcium_mg || 0) * (i.ratio / 100.0);
            }
        });

        // 목표 Ca = totalP * 1.28
        const neededCa = Math.max(0, totalP * 1.28 - otherCa);
        const eggRatio = Math.min(3.5, Math.max(0.4, Math.round((neededCa / 380.0) * 10) / 10));
        eggItem.ratio = eggRatio;

        // 전체 합 100.0% 정밀 맞춤
        const finalOtherSum = items.filter(i => i.id !== "supp_eggshell").reduce((a, b) => a + b.ratio, 0) || 1;
        const targetOther = 100.0 - eggRatio;
        items.forEach(i => {
            if (i.id !== "supp_eggshell") {
                i.ratio = Math.round((i.ratio / finalOtherSum) * targetOther * 10) / 10;
            }
        });

        renderDiyBuilderAll();
        refreshAllGuardianCalculations();
    };

    window.saveCurrentDiyRecipe = function () {
        const name = prompt("저장할 나만의 화식 레시피 이름을 입력하세요:", `${guardianState.profile.name} 맞춤 건강 화식`);
        if (!name) return;
        const saved = JSON.parse(localStorage.getItem("guardian_diy_recipes_v1") || "[]");
        saved.unshift({ name, items: guardianState.menu5_diy.items, savedAt: new Date().toLocaleDateString("ko-KR") });
        localStorage.setItem("guardian_diy_recipes_v1", JSON.stringify(saved.slice(0, 20)));
        alert(`✅ [${name}] 레시피가 브라우저에 저장되었습니다!`);
    };

    window.toggleDiyFull36Table = function () {
        const el = document.getElementById("g-diy-full36-wrapper");
        if (el) el.classList.toggle("hidden");
    };

    function computeDiyBlendStats() {
        const db = window.GUARDIAN_INGREDIENTS_DB || [];
        const items = guardianState.menu5_diy.items;
        const totalRatio = items.reduce((a, b) => a + (parseFloat(b.ratio) || 0), 0) || 100.0;

        const keys36 = [
            { k: "energy_kcal", label: "대사에너지 (칼로리)", unit: "kcal" },
            { k: "moisture_g", label: "수분", unit: "g" },
            { k: "protein_g", label: "조단백질", unit: "g", aafcoMinDM: 18.0 },
            { k: "fat_g", label: "조지방", unit: "g", aafcoMinDM: 5.5 },
            { k: "carbohydrate_g", label: "탄수화물", unit: "g" },
            { k: "total_dietary_fiber_g", label: "총 식이섬유", unit: "g" },
            { k: "ash_g", label: "조회분", unit: "g" },
            { k: "calcium_mg", label: "칼슘 (Ca)", unit: "mg", aafcoMinDM: 500 },
            { k: "phosphorus_mg", label: "인 (P)", unit: "mg", aafcoMinDM: 400 },
            { k: "magnesium_mg", label: "마그네슘 (Mg)", unit: "mg", aafcoMinDM: 60 },
            { k: "potassium_mg", label: "칼륨 (K)", unit: "mg", aafcoMinDM: 600 },
            { k: "sodium_mg", label: "나트륨 (Na)", unit: "mg", aafcoMinDM: 80 },
            { k: "zinc_mg", label: "아연 (Zn)", unit: "mg", aafcoMinDM: 8.0 },
            { k: "iron_mg", label: "철분 (Fe)", unit: "mg", aafcoMinDM: 4.0 },
            { k: "copper_mg", label: "구리 (Cu)", unit: "mg", aafcoMinDM: 0.73 },
            { k: "manganese_mg", label: "망간 (Mn)", unit: "mg", aafcoMinDM: 0.5 },
            { k: "selenium_ug", label: "셀레늄 (Se)", unit: "μg", aafcoMinDM: 32 },
            { k: "iodine_ug", label: "요오드 (I)", unit: "μg", aafcoMinDM: 100 },
            { k: "vitamin_a_ug", label: "비타민 A", unit: "μg", aafcoMinDM: 150 },
            { k: "vitamin_d_ug", label: "비타민 D", unit: "μg", aafcoMinDM: 1.25 },
            { k: "vitamin_e_mg", label: "비타민 E", unit: "mg", aafcoMinDM: 5.0 },
            { k: "thiamin_mg", label: "비타민 B1 (티아민)", unit: "mg", aafcoMinDM: 0.22 },
            { k: "riboflavin_mg", label: "비타민 B2 (리보플라빈)", unit: "mg", aafcoMinDM: 0.52 },
            { k: "niacin_mg", label: "비타민 B3 (나이아신)", unit: "mg", aafcoMinDM: 1.36 },
            { k: "pantothenic_acid_mg", label: "비타민 B5 (판토텐산)", unit: "mg", aafcoMinDM: 1.2 },
            { k: "vitamin_b6_mg", label: "비타민 B6 (피리독신)", unit: "mg", aafcoMinDM: 0.15 },
            { k: "folate_ug", label: "엽산 (비타민 B9)", unit: "μg", aafcoMinDM: 21.6 },
            { k: "vitamin_b12_ug", label: "비타민 B12", unit: "μg", aafcoMinDM: 2.8 },
            { k: "biotin_ug", label: "비오틴 (B7)", unit: "μg" },
            { k: "vitamin_k_ug", label: "비타민 K", unit: "μg" },
            { k: "cholesterol_mg", label: "콜레스테롤", unit: "mg" },
            { k: "omega3_g", label: "오메가-3 지방산", unit: "g" },
            { k: "omega6_g", label: "오메가-6 지방산", unit: "g" }
        ];

        const sumAF = {};
        keys36.forEach(meta => { sumAF[meta.k] = 0; });

        items.forEach(it => {
            const ing = db.find(x => x.id === it.id);
            if (!ing) return;
            const w = (parseFloat(it.ratio) || 0) / totalRatio;
            keys36.forEach(meta => {
                sumAF[meta.k] += (parseFloat(ing[meta.k]) || 0) * w;
            });
        });

        const dmFraction = Math.max(0.05, (100.0 - sumAF.moisture_g) / 100.0);
        const sumDM = {};
        keys36.forEach(meta => {
            sumDM[meta.k] = meta.k === "moisture_g" ? 0 : sumAF[meta.k] / dmFraction;
        });

        const kcalPer100gAF = Math.max(40, sumAF.energy_kcal);
        const dailyTotalGrams = Math.round((guardianState.energy.der / kcalPer100gAF) * 100);
        const caPRatio = sumAF.phosphorus_mg > 0 ? Math.round((sumAF.calcium_mg / sumAF.phosphorus_mg) * 100) / 100 : 1.25;

        return { totalRatio, sumAF, sumDM, dmFraction, kcalPer100gAF, dailyTotalGrams, caPRatio, keys36 };
    }

    function renderDiyBuilderAll() {
        const itemsCont = document.getElementById("g-diy-items-container");
        if (!itemsCont) return;

        const stats = computeDiyBlendStats();
        const badge = document.getElementById("g-diy-total-pct-badge");
        if (badge) {
            const is100 = Math.abs(stats.totalRatio - 100.0) < 0.5;
            badge.innerText = `배합비 총합: ${stats.totalRatio.toFixed(1)}%`;
            badge.className = is100
                ? "px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black"
                : "px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black";
        }

        itemsCont.innerHTML = guardianState.menu5_diy.items.map((it, idx) => `
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div class="truncate font-bold text-slate-800 flex-1">${idx + 1}. ${it.name_ko}</div>
                <div class="flex items-center space-x-1.5 shrink-0">
                    <input type="number" step="0.5" min="0" max="100" value="${it.ratio}" oninput="onDiyItemRatioChange(${idx}, this.value)" class="w-16 px-2 py-1 rounded-lg border border-indigo-300 text-right font-black text-indigo-900">
                    <span class="text-slate-500 font-bold">%</span>
                    <button type="button" onclick="removeDiyIngredientRow(${idx})" class="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold">✕</button>
                </div>
            </div>
        `).join("");

        // 밀프랩 테이블
        const prepDays = guardianState.menu5_diy.prepDays || 7;
        const colHeader = document.getElementById("g-diy-prep-col-header");
        if (colHeader) colHeader.innerText = `${prepDays}일분 총 조리량(g)`;

        const prepSummary = document.getElementById("g-diy-mealprep-summary");
        if (prepSummary) {
            prepSummary.innerHTML = `💡 100g당 <strong>${Math.round(stats.kcalPer100gAF)} kcal</strong> (수분 ${stats.sumAF.moisture_g.toFixed(1)}%) · 100% 화식 급여 시 하루 총 <strong>${stats.dailyTotalGrams}g</strong> (${prepDays}일분 총 <strong>${stats.dailyTotalGrams * prepDays}g</strong>)`;
        }

        const prepTbody = document.getElementById("g-diy-mealprep-tbody");
        if (prepTbody) {
            prepTbody.innerHTML = guardianState.menu5_diy.items.map(it => {
                const w = (parseFloat(it.ratio) || 0) / stats.totalRatio;
                const dailyG = Math.round(stats.dailyTotalGrams * w * 10) / 10;
                const prepG = Math.round(dailyG * prepDays * 10) / 10;
                return `
                    <tr>
                        <td class="py-1.5 px-2.5 font-bold text-slate-800">${it.name_ko}</td>
                        <td class="py-1.5 px-2.5 text-right text-slate-500">${(w * 100).toFixed(1)}%</td>
                        <td class="py-1.5 px-2.5 text-right font-black text-indigo-700">${dailyG} g</td>
                        <td class="py-1.5 px-2.5 text-right font-black text-emerald-700">${prepG} g</td>
                    </tr>
                `;
            }).join("");
        }

        // KPI 스트립
        const kpiStrip = document.getElementById("g-diy-kpi-strip");
        if (kpiStrip) {
            const capOk = stats.caPRatio >= 1.1 && stats.caPRatio <= 1.8;
            kpiStrip.innerHTML = `
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div class="text-[10px] text-slate-500 font-bold">조단백질 (% DM)</div>
                    <div class="text-base font-black text-blue-700">${stats.sumDM.protein_g.toFixed(1)}%</div>
                    <div class="text-[10px] text-emerald-600 font-bold">🟢 AAFCO 충족</div>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div class="text-[10px] text-slate-500 font-bold">조지방 (% DM)</div>
                    <div class="text-base font-black text-amber-700">${stats.sumDM.fat_g.toFixed(1)}%</div>
                    <div class="text-[10px] text-emerald-600 font-bold">🟢 적정 에너지원</div>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div class="text-[10px] text-slate-500 font-bold">칼슘 : 인 비율 (Ca:P)</div>
                    <div class="text-base font-black ${capOk ? 'text-emerald-700' : 'text-rose-600'}">${stats.caPRatio} : 1</div>
                    <div class="text-[10px] font-bold ${capOk ? 'text-emerald-600' : 'text-rose-600'}">${capOk ? '🟢 황금비율 (1.1~1.8)' : '🔴 난각칼슘 조절 필요'}</div>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div class="text-[10px] text-slate-500 font-bold">인 함량 (% DM)</div>
                    <div class="text-base font-black text-indigo-700">${(stats.sumDM.phosphorus_mg / 1000).toFixed(2)}%</div>
                    <div class="text-[10px] text-slate-500">${stats.sumDM.phosphorus_mg < 600 ? '신장 친화적 저인' : '표준 인 함량'}</div>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div class="text-[10px] text-slate-500 font-bold">오메가-3 (g/100g DM)</div>
                    <div class="text-base font-black text-teal-700">${stats.sumDM.omega3_g.toFixed(2)}g</div>
                    <div class="text-[10px] text-slate-500">항염·피부모질</div>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div class="text-[10px] text-slate-500 font-bold">수분 함량 (% AF)</div>
                    <div class="text-base font-black text-cyan-700">${stats.sumAF.moisture_g.toFixed(1)}%</div>
                    <div class="text-[10px] text-cyan-700 font-bold">자연 음수 보충</div>
                </div>
            `;
        }

        // 36대 전 영양소 테이블
        const fullTbody = document.getElementById("g-diy-full36-tbody");
        if (fullTbody) {
            fullTbody.innerHTML = stats.keys36.map(meta => {
                const afVal = stats.sumAF[meta.k];
                const dmVal = stats.sumDM[meta.k];
                const dailyVal = afVal * (stats.dailyTotalGrams / 100.0);
                let judgeHtml = `<span class="text-slate-400">-</span>`;
                if (meta.aafcoMinDM) {
                    const ok = dmVal >= meta.aafcoMinDM * 0.85;
                    judgeHtml = ok
                        ? `<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">🟢 충족 (≥${meta.aafcoMinDM})</span>`
                        : `<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">🟡 보충 권장 (&lt;${meta.aafcoMinDM})</span>`;
                }
                return `
                    <tr class="hover:bg-slate-50">
                        <td class="py-1.5 px-2.5 font-bold text-slate-800">${meta.label} (${meta.unit})</td>
                        <td class="py-1.5 px-2.5 text-right">${afVal.toFixed(2)} ${meta.unit}</td>
                        <td class="py-1.5 px-2.5 text-right font-bold text-blue-700">${meta.k === 'moisture_g' ? '-' : dmVal.toFixed(2) + ' ' + meta.unit}</td>
                        <td class="py-1.5 px-2.5 text-right font-bold text-indigo-700">${dailyVal.toFixed(1)} ${meta.unit}/일</td>
                        <td class="py-1.5 px-2.5 text-center">${judgeHtml}</td>
                    </tr>
                `;
            }).join("");
        }
    }

    // =========================================================================
    // 10. [메뉴 6] 1~4단계 사료 역추적 & 2·3종 사료 믹스피딩 컨트롤러 브릿지 (중복 제거 및 단일 통합)
    // =========================================================================
    window.getGuardianMenu5DiySlotPreset = function () {
        const stats = computeDiyBlendStats();
        const moist = +(stats.sumAF.moisture_g || 74.0).toFixed(1);
        const kcal100g = +(stats.kcalPer100gAF || 120.0).toFixed(1);
        const pDM = +(stats.sumDM.protein_g || 42.0).toFixed(1);
        const fDM = +(stats.sumDM.fat_g || 15.0).toFixed(1);
        const fbDM = +(stats.sumDM.total_dietary_fiber_g || 3.5).toFixed(1);
        const carbsDM = +(stats.sumDM.carbohydrate_g || 28.0).toFixed(1);
        const ashDM = +(stats.sumDM.ash_g || 6.0).toFixed(1);
        const caDM = Math.round(stats.sumDM.calcium_mg || 880);
        const phosDM = Math.round(stats.sumDM.phosphorus_mg || 680);
        const naDM = Math.round(stats.sumDM.sodium_mg || 210);
        const mgDM = Math.round(stats.sumDM.magnesium_mg || 95);
        const kDM = Math.round(stats.sumDM.potassium_mg || 820);

        return {
            id: "__host_menu5_diy__",
            name: `[메뉴 5 DIY 연동] ${guardianState.profile.name} 홈메이드 맞춤 화식 (신뢰도 94%)`,
            brand: "Guardian DIY Builder",
            feedType: "fresh_wet",
            mode: "known",
            fixedConfidence: 94,
            knownNutrients: {
                moisture_pct: moist,
                energy_kcal_per_100g: kcal100g,
                protein_dm_pct: pDM,
                fat_dm_pct: fDM,
                fiber_dm_pct: fbDM,
                tdf_dm_pct: +(fbDM * 2.1).toFixed(1),
                carbs_dm_pct: carbsDM,
                ash_dm_pct: ashDM,
                calcium_mg: caDM,
                phosphorus_mg: phosDM,
                sodium_mg: naDM,
                magnesium_mg: mgDM,
                potassium_mg: kDM
            }
        };
    };

    function populateReverseIngredientDropdown() {
        // 호스트 사료 프리셋(COMMERCIAL_DRY_FOODS & COMMERCIAL_WET_AND_FRESH)을 MixFeeder에 중복 없이 등록하고 Step 6 컨트롤러 초기화
        if (typeof window.MixFeeder !== "undefined" && typeof window.MixFeeder.registerHostPresets === "function") {
            const mergedIngDB = (typeof window.FeedIngredientDB !== "undefined")
                ? window.FeedIngredientDB.mergeWithGeneralDB(window.GUARDIAN_INGREDIENTS_DB || [])
                : null;
            window.MixFeeder.registerHostPresets(COMMERCIAL_DRY_FOODS, COMMERCIAL_WET_AND_FRESH, mergedIngDB);
        }
        if (typeof window.Step6MultiMixController !== "undefined") {
            isSyncingStep6 = true;
            window.Step6MultiMixController.init("g-menu-view-6");
            isSyncingStep6 = false;
        }
    }

    function syncReverseIngredientsFromDryFood() {
        if (typeof window.Step6MultiMixController !== "undefined") {
            isSyncingStep6 = true;
            window.Step6MultiMixController.syncFromHostEnvironment();
            if (typeof window.Step6MultiMixController.syncSlotAFromHostDryFood === "function") {
                window.Step6MultiMixController.syncSlotAFromHostDryFood(true);
            }
            isSyncingStep6 = false;
        }
    }

    window.runGuardianReverseTracing = function () {
        if (typeof window.Step6MultiMixController !== "undefined") {
            isSyncingStep6 = true;
            window.Step6MultiMixController.syncFromHostEnvironment();
            window.Step6MultiMixController.recalculateAndRender();
            isSyncingStep6 = false;
            return window.Step6MultiMixController.getState().lastResult?.guardianStep6Payload;
        }
        return null;
    };

    window.onStep6MultiMixUpdated = function (res) {
        if (res && res.guardianStep6Payload) {
            guardianState.menu6_reverse.lastResult = res.guardianStep6Payload;
        }
        if (!isSyncingStep6 && guardianState.initialized) {
            refreshAllGuardianCalculations(true);
        }
    };

    // =========================================================================
    // 11. 전체 계산 통합 갱신 및 [Step 4] 신호등·게이지·스케줄표 렌더링
    // =========================================================================
    function refreshAllGuardianCalculations(skipStep6Sync) {
        const energy = computeGuardianEnergy();
        (function () {
            let b = document.getElementById("g-consult-banner");
            if (energy.consultVet) {
                if (!b) {
                    const anchor = document.getElementById("g-concern");
                    const grid = anchor ? anchor.closest(".grid") : null;
                    if (grid) {
                        b = document.createElement("div");
                        b.id = "g-consult-banner";
                        b.className = "mt-3 p-4 rounded-2xl bg-rose-600 text-white text-center text-lg font-black shadow-lg";
                        grid.insertAdjacentElement("afterend", b);
                    }
                }
                if (b) b.innerHTML = "🩺 수의사와 상담하세요.<div class='text-xs font-bold mt-1'>관리 중인 질환이 선택되어 기초대사량·DER·급여량·간식·이상체중 계산을 제공하지 않습니다.</div>";
            } else if (b) {
                b.remove();
            }
        })();
        if (energy.consultVet) {
            const MSG = "수의사와 상담하세요.";
            const st = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
            ["g-out-rer","g-out-der","g-out-permeal","g-out-maxtreat","g-out-idealw"].forEach(id => st(id, 0));
            st("g-out-factor", 0);
            st("g-out-bcs-comment", MSG);
            st("g-dash-target-der", "0 kcal/일");
            st("g-dash-cal-breakdown", MSG);
            st("g-dash-active-menu-badge", MSG);
            const fb = document.getElementById("g-out-fecal-banner");
            if (fb && fb.firstElementChild) fb.firstElementChild.innerHTML = "🩺 <strong>" + MSG + "</strong> 선택하신 질환은 맞춤 칼로리·사료·간식 계산을 제공하지 않습니다.";
            const box = '<div class="col-span-full p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-800 font-black text-sm">🩺 ' + MSG + ' (DER/MER·급여량·간식/토핑 0)</div>';
            ["g-dash-schedule-cards","g-dash-traffic-lights","g-dash-water-advice","g-m4-gauge-banner","g-m1-summary-box","g-m2-summary-box"].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = box; });
            const gb = document.getElementById("g-dash-gauge-bar"); if (gb) gb.style.width = "0%";
            const gs = document.getElementById("g-dash-gauge-status"); if (gs) gs.innerText = "🩺 " + MSG;
            return;
        }
        if (!skipStep6Sync && typeof window.Step6MultiMixController !== "undefined" && guardianState.initialized) {
            isSyncingStep6 = true;
            window.Step6MultiMixController.syncFromHostEnvironment();
            if (guardianState.activeMenu === 6) {
                window.Step6MultiMixController.recalculateAndRender();
            }
            isSyncingStep6 = false;
        }
        const dryMetrics = calcDryFoodMetrics(guardianState.selectedDryFood);
        const aafco = getAafcoStandardForProfile();

        // Step 1 출력 업데이트
        const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
        setTxt("g-out-rer", energy.rer);
        setTxt("g-out-der", energy.der);
        setTxt("g-out-factor", energy.factor);
        setTxt("g-out-permeal", energy.perMealKcal);
        setTxt("g-out-meals-label", `하루 ${guardianState.profile.mealsPerDay}끼 급여 기준`);
        setTxt("g-out-maxtreat", energy.maxTreatKcal);
        setTxt("g-out-idealw", energy.idealWeightKg);

        const bcs = guardianState.profile.bcs;
        setTxt("g-out-bcs-comment", bcs <= 3 ? "저체중 — 체중 증량 식단 권장" : (bcs <= 5 ? "현재 이상적 체형 유지 중" : "과체중/비만 — 칼로리 조절 권장"));
        setTxt("g-out-aafco-badge", `적용 기준: ${aafco.label} (단백질 ≥${aafco.p_min}% DM, 지방 ≥${aafco.f_min}% DM)`);

        const fecalBanner = document.getElementById("g-out-fecal-banner");
        if (fecalBanner) {
            fecalBanner.firstElementChild.innerHTML = `💡 <strong>변 상태 & 체형 진단 피드백:</strong> ${energy.fecalNote}`;
        }

        // Step 2 DM 요약 업데이트
        setTxt("g-current-food-title", dryMetrics.name);
        const dmBar = document.getElementById("g-dry-dm-summary-bar");
        if (dmBar) {
            dmBar.innerHTML = `
                <div class="flex flex-wrap gap-3 font-bold text-slate-700">
                    <span>⚡ 추정 대사에너지: <strong class="text-blue-700">${dryMetrics.kcal_per_kg} kcal/kg</strong></span>
                    <span>• 건물(DM) 조단백: <strong>${dryMetrics.p_dm}%</strong></span>
                    <span>• 건물(DM) 조지방: <strong>${dryMetrics.f_dm}%</strong></span>
                    <span>• 건물(DM) 탄수화물(NFE): <strong>${dryMetrics.nfe_dm}%</strong></span>
                    <span>• 칼슘:인 비율(Ca:P): <strong class="${dryMetrics.ca_p_ratio >= 1.0 && dryMetrics.ca_p_ratio <= 2.0 ? 'text-emerald-700' : 'text-rose-600'}">${dryMetrics.ca_p_ratio} : 1</strong></span>
                </div>
                <span class="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-black">100g당 ${Math.round(dryMetrics.kcal_per_kg / 10)} kcal</span>
            `;
        }

        // 토핑(메뉴 4) 칼로리 합산 (공통 모듈)
        const toppingSum = calcTotalToppingsSummary();
        const toppingPctOfDer = Math.round((toppingSum.totalKcal / energy.der) * 1000) / 10;

        // 메뉴 4 배너 업데이트
        const m4Banner = document.getElementById("g-m4-gauge-banner");
        if (m4Banner) {
            const over10 = toppingSum.totalKcal > energy.maxTreatKcal;
            const deductDryG = Math.round((toppingSum.totalKcal / (dryMetrics.kcal_per_kg / 1000.0)) * 10) / 10;
            m4Banner.innerHTML = `
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="font-black ${over10 ? 'text-rose-700' : 'text-emerald-800'}">
                        ${over10 ? '🚨 [경고: 10% 허용 칼로리 초과!]' : '🟢 [안전: 10% 허용 칼로리 이내]'}
                        선택한 간식/토핑 총 칼로리: <strong>${toppingSum.totalKcal} kcal</strong> (일일 DER의 <strong>${toppingPctOfDer}%</strong> / 허용 상한 ${energy.maxTreatKcal} kcal)
                    </div>
                    <span class="px-3 py-1 rounded-lg bg-slate-900 text-amber-300 font-black">본식 사료 차감 권장량: -${deductDryG} g/일</span>
                </div>
                <p class="text-[11px] text-slate-600">비만과 영양 불균형을 막기 위해 오늘 급여할 간식(${toppingSum.totalKcal} kcal)만큼 Step 4의 본식 급여량에서 자동으로 조절하거나 본식 사료를 <strong>${deductDryG}g</strong> 덜어내고 급여하세요.</p>
            `;
        }

        // 현재 활성 메뉴(1~6)에 따른 혼합 식단(Main + Sub) 구성 계산
        let mainLabel = dryMetrics.name;
        let subLabel = "보조 배합식 없음";
        let mainKcal = energy.der;
        let subKcal = 0;
        let mainGrams = 0;
        let subGrams = 0;
        let mixP_dm = dryMetrics.p_dm;
        let mixF_dm = dryMetrics.f_dm;
        let mixFb_dm = dryMetrics.fb_dm || 2.5;
        let mixNfe_dm = dryMetrics.nfe_dm;
        let mixCa_dm = dryMetrics.ca_dm;
        let mixPhos_dm = dryMetrics.phos_dm;
        let waterFromFoodMl = 0;
        let menuBadgeText = "건식 + 습식 배합";

        if (guardianState.activeMenu === 1) {
            menuBadgeText = "메뉴 1: 건식 + 습식 배합";
            const wet = COMMERCIAL_WET_AND_FRESH.find(x => x.id === guardianState.menu1.wetFoodId) || COMMERCIAL_WET_AND_FRESH[0];
            const wetM = calcDryFoodMetrics(wet);
            const rDry = guardianState.menu1.dryRatioPct / 100.0;
            const rWet = 1.0 - rDry;

            mainKcal = Math.round(energy.der * rDry);
            subKcal = Math.round(energy.der * rWet);
            mainGrams = Math.round((mainKcal / (dryMetrics.kcal_per_kg / 1000.0)) * 10) / 10;
            subGrams = Math.round((subKcal / (wetM.kcal_per_kg / 1000.0)) * 10) / 10;
            subLabel = wet.name;

            mixP_dm = dryMetrics.p_dm * rDry + wetM.p_dm * rWet;
            mixF_dm = dryMetrics.f_dm * rDry + wetM.f_dm * rWet;
            mixNfe_dm = dryMetrics.nfe_dm * rDry + wetM.nfe_dm * rWet;
            mixCa_dm = dryMetrics.ca_dm * rDry + wetM.ca_dm * rWet;
            mixPhos_dm = dryMetrics.phos_dm * rDry + wetM.phos_dm * rWet;
            waterFromFoodMl = Math.round(mainGrams * (dryMetrics.moisture_af / 100) + subGrams * (wetM.moisture_af / 100));

            const m1Box = document.getElementById("g-m1-summary-box");
            if (m1Box) {
                m1Box.innerHTML = `✅ 1일 총 급여량: 건식 <strong class="text-blue-700">${mainGrams}g</strong> (${mainKcal}kcal) + 습식 <strong class="text-emerald-700">${subGrams}g</strong> (${subKcal}kcal) · 식사 내 수분 섭취 <strong>${waterFromFoodMl}ml</strong>`;
            }
        } else if (guardianState.activeMenu === 2) {
            menuBadgeText = "메뉴 2: 건식 + 화식 배합";
            const fresh = COMMERCIAL_WET_AND_FRESH.find(x => x.id === guardianState.menu2.freshFoodId) || COMMERCIAL_WET_AND_FRESH[3];
            const freshM = calcDryFoodMetrics(fresh);
            const rDry = guardianState.menu2.dryRatioPct / 100.0;
            const rFresh = 1.0 - rDry;

            mainKcal = Math.round(energy.der * rDry);
            subKcal = Math.round(energy.der * rFresh);
            mainGrams = Math.round((mainKcal / (dryMetrics.kcal_per_kg / 1000.0)) * 10) / 10;
            subGrams = Math.round((subKcal / (freshM.kcal_per_kg / 1000.0)) * 10) / 10;
            subLabel = fresh.name;

            mixP_dm = dryMetrics.p_dm * rDry + freshM.p_dm * rFresh;
            mixF_dm = dryMetrics.f_dm * rDry + freshM.f_dm * rFresh;
            mixNfe_dm = dryMetrics.nfe_dm * rDry + freshM.nfe_dm * rFresh;
            mixCa_dm = dryMetrics.ca_dm * rDry + freshM.ca_dm * rFresh;
            mixPhos_dm = dryMetrics.phos_dm * rDry + freshM.phos_dm * rFresh;
            waterFromFoodMl = Math.round(mainGrams * (dryMetrics.moisture_af / 100) + subGrams * (freshM.moisture_af / 100));

            const m2Box = document.getElementById("g-m2-summary-box");
            if (m2Box) {
                m2Box.innerHTML = `✅ 1일 총 급여량: 건식 <strong class="text-blue-700">${mainGrams}g</strong> (${mainKcal}kcal) + 맞춤 화식 <strong class="text-amber-700">${subGrams}g</strong> (${subKcal}kcal)`;
            }
        } else if (guardianState.activeMenu === 3) {
            menuBadgeText = "메뉴 3: 건식 + 단일 원재료 배합";
            const raw = SINGLE_RAW_INGREDIENTS.find(x => x.id === guardianState.menu3.rawIngId) || SINGLE_RAW_INGREDIENTS[0];
            const rRaw = guardianState.menu3.rawRatioPct / 100.0;
            const rDry = 1.0 - rRaw;

            mainKcal = Math.round(energy.der * rDry);
            subKcal = Math.round(energy.der * rRaw);
            mainGrams = Math.round((mainKcal / (dryMetrics.kcal_per_kg / 1000.0)) * 10) / 10;
            subGrams = Math.round((subKcal / (raw.kcal_100g / 100.0)) * 10) / 10;
            subLabel = raw.name;

            const dmf = Math.max(0.05, (100 - raw.moisture) / 100.0);
            const rawP_dm = raw.protein / dmf;
            const rawF_dm = raw.fat / dmf;
            const rawCa_dm = (raw.ca_mg / 1000.0) / dmf;
            const rawPhos_dm = (raw.p_mg / 1000.0) / dmf;
            const rawNfe_dm = Math.max(0, 100 - rawP_dm - rawF_dm - 2.0);

            mixP_dm = dryMetrics.p_dm * rDry + rawP_dm * rRaw;
            mixF_dm = dryMetrics.f_dm * rDry + rawF_dm * rRaw;
            mixNfe_dm = dryMetrics.nfe_dm * rDry + rawNfe_dm * rRaw;
            mixCa_dm = dryMetrics.ca_dm * rDry + rawCa_dm * rRaw;
            mixPhos_dm = dryMetrics.phos_dm * rDry + rawPhos_dm * rRaw;
            waterFromFoodMl = Math.round(mainGrams * (dryMetrics.moisture_af / 100) + subGrams * (raw.moisture / 100));

            const m3Alert = document.getElementById("g-m3-distortion-alert");
            if (m3Alert) {
                const overLimit = guardianState.menu3.rawRatioPct > raw.maxSafePct;
                const capRatio = mixPhos_dm > 0 ? (mixCa_dm / mixPhos_dm).toFixed(2) : "1.20";
                m3Alert.innerHTML = overLimit
                    ? `<div class="p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 font-bold">🚨 <strong>[영양 왜곡 경고]</strong> 단일 원재료(${raw.name}) 비중이 안전선(${raw.maxSafePct}%)을 초과하여 칼슘:인 비율(${capRatio}:1) 및 미량영양소 균형이 무너질 수 있습니다! <strong>${raw.maxSafePct}% 이하</strong>로 낮춰주세요.</div>`
                    : `<div class="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold">🟢 <strong>[영양 밸런스 안전]</strong> 건식 <strong>${mainGrams}g</strong> + ${raw.name} <strong>${subGrams}g/일</strong> 급여 시 Ca:P 비율(${capRatio}:1)이 안전하게 유지됩니다.</div>`;
            }
        } else if (guardianState.activeMenu === 5) {
            menuBadgeText = "메뉴 5: 홈메이드 화식 DIY 100% 급여";
            const diyStats = computeDiyBlendStats();
            mainLabel = "직접 설계한 홈메이드 화식 (DIY)";
            subLabel = "추가 배합 없음 (단독 화식)";
            mainKcal = energy.der;
            subKcal = 0;
            mainGrams = diyStats.dailyTotalGrams;
            subGrams = 0;
            mixP_dm = diyStats.sumDM.protein_g;
            mixF_dm = diyStats.sumDM.fat_g;
            mixNfe_dm = diyStats.sumDM.carbohydrate_g;
            mixCa_dm = diyStats.sumDM.calcium_mg / 1000.0;
            mixPhos_dm = diyStats.sumDM.phosphorus_mg / 1000.0;
            waterFromFoodMl = Math.round(mainGrams * (diyStats.sumAF.moisture_g / 100.0));
        } else if (guardianState.activeMenu === 6 && typeof window.Step6MultiMixController !== "undefined" && window.Step6MultiMixController.getState().lastResult?.guardianStep6Payload) {
            const p6 = window.Step6MultiMixController.getState().lastResult.guardianStep6Payload;
            menuBadgeText = `메뉴 6: ${p6.activeFeedCount}종 역추적 & 믹스피딩 (${p6.calorieRatiosPct.join(" : ")}%)`;
            const s0 = p6.slotSchedules[0] || {};
            const restSlots = p6.slotSchedules.slice(1);
            mainLabel = `사료 A: ${(s0.name || "사료 A").replace(/\[.*?\]\s*/, "")}`;
            subLabel = restSlots.map(s => `사료 ${s.slotId}: ${(s.name || "").replace(/\[.*?\]\s*/, "")}`).join(" + ") || "보조 배합 사료";
            mainKcal = s0.dailyKcal || 0;
            subKcal = restSlots.reduce((acc, s) => acc + (s.dailyKcal || 0), 0);
            mainGrams = s0.dailyGramsAF || 0;
            subGrams = +(restSlots.reduce((acc, s) => acc + (s.dailyGramsAF || 0), 0)).toFixed(1);
            mixP_dm = p6.blendedNutrientsDM.protein_pct || dryMetrics.p_dm;
            mixF_dm = p6.blendedNutrientsDM.fat_pct || dryMetrics.f_dm;
            mixFb_dm = p6.blendedNutrientsDM.crude_fiber_pct || dryMetrics.fb_dm || 2.5;
            mixNfe_dm = p6.blendedNutrientsDM.carbs_pct || dryMetrics.nfe_dm;
            mixCa_dm = (p6.blendedNutrientsDM.calcium_mg || 1000) / 1000.0;
            mixPhos_dm = (p6.blendedNutrientsDM.phosphorus_mg || 800) / 1000.0;
            waterFromFoodMl = p6.waterBalance?.fromFoodMl || 0;
        } else {
            // 메뉴 4일 때는 주식 사료 + 토핑 기준
            menuBadgeText = guardianState.activeMenu === 4 ? "메뉴 4: 주식 건식 + 10% 안전 토핑" : "메뉴 6: 역추적 사료 급여 가이드";
            mainKcal = Math.max(0, energy.der - toppingSum.totalKcal);
            subKcal = 0;
            mainGrams = Math.round((mainKcal / (dryMetrics.kcal_per_kg / 1000.0)) * 10) / 10;
            subGrams = 0;
            waterFromFoodMl = Math.round(mainGrams * (dryMetrics.moisture_af / 100));
        }

        // Step 4: 1) 칼로리 밸런스 게이지 업데이트
        const totalCombinedKcal = mainKcal + subKcal + (guardianState.activeMenu === 4 ? 0 : toppingSum.totalKcal);
        const calRatioPct = Math.round((totalCombinedKcal / energy.der) * 100);
        const gaugeBar = document.getElementById("g-dash-gauge-bar");
        const gaugeStatus = document.getElementById("g-dash-gauge-status");
        if (gaugeBar && gaugeStatus) {
            gaugeBar.style.width = `${Math.min(100, calRatioPct)}%`;
            if (calRatioPct > 110) {
                gaugeBar.className = "h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-600 transition-all duration-300";
                gaugeStatus.className = "px-3 py-0.5 rounded-full bg-rose-500 text-white text-xs font-black";
                gaugeStatus.innerText = `🔴 과체중 위험 (${calRatioPct}% — 간식/토핑 감량 필요)`;
            } else if (calRatioPct < 90) {
                gaugeBar.className = "h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-300";
                gaugeStatus.className = "px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black";
                gaugeStatus.innerText = `🟡 칼로리 부족 경고 (${calRatioPct}%)`;
            } else {
                gaugeBar.className = "h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 transition-all duration-300";
                gaugeStatus.className = "px-3 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-xs font-black";
                gaugeStatus.innerText = `🟢 적정 칼로리 Fit (${calRatioPct}%)`;
            }
        }
        setTxt("g-dash-target-der", `${energy.der} kcal/일`);
        setTxt("g-dash-cal-breakdown", `주식: ${mainKcal} kcal + 배합식: ${subKcal} kcal + 토핑/간식: ${toppingSum.totalKcal} kcal = 총 ${totalCombinedKcal} kcal`);

        // Step 4: 2) AAFCO / FEDIAF 신호등 리포트 업데이트
        const mixCaP = mixPhos_dm > 0 ? Math.round((mixCa_dm / mixPhos_dm) * 100) / 100 : 1.25;
        const concern = guardianState.profile.healthConcern;

        const trafficItems = [
            {
                title: "조단백질 (% DM)",
                val: `${mixP_dm.toFixed(1)}%`,
                target: `권장 ${aafco.p_min}~${aafco.p_max}%`,
                status: mixP_dm < aafco.p_min ? "RED" : (concern === "ckd" && mixP_dm > 24 ? "YELLOW" : "GREEN"),
                desc: mixP_dm < aafco.p_min ? "단백질 부족 위험" : (concern === "ckd" && mixP_dm > 24 ? "신장케어 시 단백질 중등도 조절 권장" : "근육 유지 적정 범위")
            },
            {
                title: "조지방 (% DM)",
                val: `${mixF_dm.toFixed(1)}%`,
                target: concern === "pancreatitis" ? "췌장케어 <12% 권장" : `권장 ${aafco.f_min}~${aafco.f_max}%`,
                status: (concern === "pancreatitis" && mixF_dm > 12) ? "RED" : (mixF_dm > aafco.f_max ? "YELLOW" : "GREEN"),
                desc: (concern === "pancreatitis" && mixF_dm > 12) ? "췌장염 주의: 저지방 배합으로 낮추세요" : "필수지방산 및 에너지 적정"
            },
            {
                title: "탄수화물 NFE (% DM)",
                val: `${mixNfe_dm.toFixed(1)}%`,
                target: "적정 20~55% DM",
                status: mixNfe_dm > 60 ? "YELLOW" : "GREEN",
                desc: mixNfe_dm > 60 ? "탄수화물 비중 다소 높음" : "소화 흡수 에너지원 균형"
            },
            {
                title: "칼슘 Ca (% DM)",
                val: `${mixCa_dm.toFixed(2)}%`,
                target: `권장 ${aafco.ca_min}~${aafco.ca_max}%`,
                status: (mixCa_dm < aafco.ca_min || mixCa_dm > aafco.ca_max) ? "RED" : "GREEN",
                desc: mixCa_dm < aafco.ca_min ? "칼슘 부족 (난각분말 보충 필요)" : "골격 및 대사 적정 범위"
            },
            {
                title: "인 P (% DM)",
                val: `${mixPhos_dm.toFixed(2)}%`,
                target: concern === "ckd" ? "신장케어 <0.6% 권장" : `권장 ${aafco.phos_min}~${aafco.phos_max}%`,
                status: (concern === "ckd" && mixPhos_dm > 0.65) ? "RED" : (mixPhos_dm > aafco.phos_max ? "YELLOW" : "GREEN"),
                desc: (concern === "ckd" && mixPhos_dm > 0.65) ? "신장 부담 주의: 저인 화식/습식 권장" : "세포 대사 적정 범위"
            },
            {
                title: "칼슘 : 인 비율 (Ca:P)",
                val: `${mixCaP} : 1`,
                target: "황금비율 1.1 ~ 1.8 : 1",
                status: (mixCaP < 1.0 || mixCaP > 2.2) ? "RED" : (mixCaP < 1.1 ? "YELLOW" : "GREEN"),
                desc: mixCaP < 1.0 ? "역전 위험! 고기 토핑을 줄이거나 칼슘 보충" : "AAFCO 이상적 비율 충족"
            }
        ];

        const tlGrid = document.getElementById("g-dash-traffic-lights");
        if (tlGrid) {
            tlGrid.innerHTML = trafficItems.map(item => {
                const styles = item.status === "GREEN"
                    ? { bg: "bg-emerald-50/70 border-emerald-300", dot: "🟢 적정", text: "text-emerald-900", badge: "bg-emerald-100 text-emerald-800" }
                    : (item.status === "YELLOW"
                        ? { bg: "bg-amber-50/80 border-amber-300", dot: "🟡 주의", text: "text-amber-900", badge: "bg-amber-100 text-amber-800" }
                        : { bg: "bg-rose-50/80 border-rose-300", dot: "🔴 경고", text: "text-rose-900", badge: "bg-rose-100 text-rose-800" });
                return `
                    <div class="p-3.5 rounded-2xl border ${styles.bg} flex flex-col justify-between space-y-1.5">
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-slate-600 text-[11px]">${item.title}</span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${styles.badge}">${styles.dot}</span>
                        </div>
                        <div class="text-lg font-black ${styles.text}">${item.val}</div>
                        <div class="text-[10px] text-slate-500 font-semibold">${item.target}</div>
                        <div class="text-[10px] font-bold ${styles.text}">${item.desc}</div>
                    </div>
                `;
            }).join("");
        }

        // Step 4: 3) 아침/점심/저녁 실천형 급여 스케줄표
        setTxt("g-dash-active-menu-badge", menuBadgeText);
        const meals = guardianState.profile.mealsPerDay || 2;
        const mealNames = meals === 1 ? ["🌅 하루 1끼 통합 식사"] : (meals === 2 ? ["🌅 아침 식사 (1회차)", "🌙 저녁 식사 (2회차)"] : ["🌅 아침 식사", "☀️ 점심 식사", "🌙 저녁 식사"]);
        const mainPerMealG = Math.round((mainGrams / meals) * 10) / 10;
        const subPerMealG = Math.round((subGrams / meals) * 10) / 10;

        const schedCont = document.getElementById("g-dash-schedule-cards");
        if (schedCont) {
            schedCont.innerHTML = mealNames.map((mTitle, idx) => {
                const showToppingHere = idx === 0 && toppingSum.activeItems.length > 0;
                const toppingText = showToppingHere
                    ? ` + <span class="text-rose-700 font-black">간식/토핑 (${toppingSum.activeItems.map(t => `${t.name.split('(')[0].trim()} ${t.count}${t.unitLabel}`).join(', ')})</span>`
                    : "";
                return `
                    <div class="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-sm flex flex-wrap items-center justify-between gap-2">
                        <div class="font-black text-emerald-950 text-sm">${mTitle}</div>
                        <div class="text-xs font-bold text-slate-800">
                            🥣 <strong>${mainLabel}</strong>: <span class="text-blue-700 font-black text-sm">${mainPerMealG} g</span>
                            ${subPerMealG > 0 ? ` + 🍲 <strong>${subLabel.split('(')[0].trim()}</strong>: <span class="text-emerald-700 font-black text-sm">${subPerMealG} g</span>` : ""}
                            ${toppingText}
                        </div>
                    </div>
                `;
            }).join("") + `
                <div class="p-3 rounded-xl bg-emerald-900 text-white flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span>📌 <strong>하루 총 급여량 합계:</strong> 주식 ${mainGrams}g ${subGrams > 0 ? `+ 배합식 ${subGrams}g` : ""} ${toppingSum.totalGrams > 0 ? `+ 간식 ${toppingSum.totalGrams}g` : ""}</span>
                    <span class="text-amber-300 font-black">종이컵(1컵≈75g 사료 기준) 하루 약 ${(mainGrams / 75.0).toFixed(1)}컵</span>
                </div>
            `;
        }

        // 수분 섭취 가이드
        const targetWaterMl = Math.round(energy.der * 1.0);
        const extraWaterMl = Math.max(0, targetWaterMl - waterFromFoodMl);
        const waterAdv = document.getElementById("g-dash-water-advice");
        if (waterAdv) {
            waterAdv.innerHTML = `
                <div>
                    💧 <strong>일일 음수량 처방:</strong> 하루 목표 수분 <strong>${targetWaterMl}ml</strong> 중 식단(사료+습식/화식)으로 <strong>${waterFromFoodMl}ml</strong>가 자연 공급됩니다.
                </div>
                <div class="font-black text-sky-800">
                    추가 급수 필요량: 하루 약 ${extraWaterMl} ml (종이컵 ${(extraWaterMl / 180.0).toFixed(1)}컵)
                </div>
            `;
        }

        updateGuardianCharts(mainKcal, subKcal, toppingSum.totalKcal, mixP_dm, mixF_dm, mixNfe_dm);

        // 통합 대시보드용 최신 혼합 영양 수치 캐싱
        guardianState.lastMixSummary = {
            menuBadgeText,
            mainLabel,
            subLabel,
            mainKcal,
            subKcal,
            toppingKcal: toppingSum.totalKcal,
            totalSupplyKcal: totalCombinedKcal,
            mainGrams,
            subGrams,
            mixP_dm,
            mixF_dm,
            mixFb_dm,
            mixNfe_dm,
            mixCa_dm,
            mixPhos_dm,
            mixCaP,
            waterFromFoodMl
        };
        if (typeof renderUnifiedDashboardAndSchemas === "function") {
            renderUnifiedDashboardAndSchemas();
        }
    }

    function updateGuardianCharts(mainKcal, subKcal, topKcal, p_dm, f_dm, nfe_dm) {
        if (typeof Chart === "undefined") return;
        const c1 = document.getElementById("gCalDonutCanvas");
        const c2 = document.getElementById("gMacroBarCanvas");
        if (!c1 || !c2) return;

        if (guardianState.charts.calDonut) guardianState.charts.calDonut.destroy();
        guardianState.charts.calDonut = new Chart(c1.getContext("2d"), {
            type: "doughnut",
            data: {
                labels: ["주식 사료", "습식/화식/원재료", "토핑/간식"],
                datasets: [{
                    data: [mainKcal, subKcal, topKcal],
                    backgroundColor: ["#2563eb", "#10b981", "#f43f5e"],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } }
                }
            }
        });

        if (guardianState.charts.macroBar) guardianState.charts.macroBar.destroy();
        guardianState.charts.macroBar = new Chart(c2.getContext("2d"), {
            type: "bar",
            data: {
                labels: ["단백질", "지방", "탄수화물"],
                datasets: [{
                    label: "혼합식 (% DM)",
                    data: [Math.round(p_dm * 10) / 10, Math.round(f_dm * 10) / 10, Math.round(nfe_dm * 10) / 10],
                    backgroundColor: ["#3b82f6", "#f59e0b", "#14b8a6"],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, max: 60 } }
            }
        });
    }

    // =========================================================================
    // 12. [Step 5] 분변키트 검사 결과 폼 & 장내 환경 쉬운 분석/해설
    // =========================================================================
    window.loadGuardianKitPreset = function (presetKey) {
        const fk = guardianState.fecalKit;
        fk.preset = presetKey;

        const presets = {
            normal: {
                phLevel: "normal", phValue: 6.4,
                ammonia: "normal", indole: "normal",
                undigestedFat: "neg", reducingSugar: "normal",
                mucosalInflam: "neg", stoolOdor: "mild", mucusSeen: "no"
            },
            protein_putrefaction: {
                phLevel: "alkaline", phValue: 7.5,
                ammonia: "high", indole: "warn",
                undigestedFat: "neg", reducingSugar: "normal",
                mucosalInflam: "neg", stoolOdor: "foul", mucusSeen: "no"
            },
            carb_ferment: {
                phLevel: "acidic", phValue: 5.3,
                ammonia: "normal", indole: "warn",
                undigestedFat: "neg", reducingSugar: "high",
                mucosalInflam: "trace", stoolOdor: "sour", mucusSeen: "sometimes"
            },
            fat_mucosal: {
                phLevel: "alkaline", phValue: 7.3,
                ammonia: "warn", indole: "high",
                undigestedFat: "pos", reducingSugar: "warn",
                mucosalInflam: "pos", stoolOdor: "foul", mucusSeen: "yes"
            }
        };

        const sel = presets[presetKey] || presets.normal;
        Object.assign(fk, sel);

        // UI 폼 동기화
        if (document.getElementById("g-kit-ph-level")) document.getElementById("g-kit-ph-level").value = fk.phLevel;
        if (document.getElementById("g-kit-ph-slider")) document.getElementById("g-kit-ph-slider").value = fk.phValue;
        if (document.getElementById("g-kit-ph-val-txt")) document.getElementById("g-kit-ph-val-txt").innerText = fk.phValue.toFixed(1);
        if (document.getElementById("g-kit-ammonia")) document.getElementById("g-kit-ammonia").value = fk.ammonia;
        if (document.getElementById("g-kit-indole")) document.getElementById("g-kit-indole").value = fk.indole;
        if (document.getElementById("g-kit-fat")) document.getElementById("g-kit-fat").value = fk.undigestedFat;
        if (document.getElementById("g-kit-sugar")) document.getElementById("g-kit-sugar").value = fk.reducingSugar;
        if (document.getElementById("g-kit-mucosal")) document.getElementById("g-kit-mucosal").value = fk.mucosalInflam;
        if (document.getElementById("g-kit-odor")) document.getElementById("g-kit-odor").value = fk.stoolOdor;
        if (document.getElementById("g-kit-mucus")) document.getElementById("g-kit-mucus").value = fk.mucusSeen;

        // 프리셋 버튼 강조 스타일
        ["normal", "protein_putrefaction", "carb_ferment", "fat_mucosal"].forEach(k => {
            const btn = document.getElementById(`g-kit-preset-${k}`);
            if (!btn) return;
            if (k === presetKey) {
                btn.className = "px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-black shadow-sm transition";
            } else {
                btn.className = "px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-700 border border-slate-200 text-xs font-bold transition";
            }
        });

        evaluateGuardianFecalKit();
    };

    window.onGuardianKitPhSlider = function (val) {
        const num = parseFloat(val) || 6.4;
        guardianState.fecalKit.phValue = num;
        if (document.getElementById("g-kit-ph-val-txt")) {
            document.getElementById("g-kit-ph-val-txt").innerText = num.toFixed(1);
        }
        const phSel = document.getElementById("g-kit-ph-level");
        if (phSel) {
            if (num <= 5.8) phSel.value = "acidic";
            else if (num >= 7.2) phSel.value = "alkaline";
            else phSel.value = "normal";
            guardianState.fecalKit.phLevel = phSel.value;
        }
        evaluateGuardianFecalKit();
    };

    window.onGuardianKitFormChange = function (changedField) {
        const fk = guardianState.fecalKit;
        const phSel = document.getElementById("g-kit-ph-level");
        if (phSel) {
            fk.phLevel = phSel.value;
            if (changedField === "phLevel") {
                if (fk.phLevel === "acidic") fk.phValue = 5.4;
                else if (fk.phLevel === "alkaline") fk.phValue = 7.5;
                else fk.phValue = 6.4;
                if (document.getElementById("g-kit-ph-slider")) document.getElementById("g-kit-ph-slider").value = fk.phValue;
                if (document.getElementById("g-kit-ph-val-txt")) document.getElementById("g-kit-ph-val-txt").innerText = fk.phValue.toFixed(1);
            }
        }
        if (document.getElementById("g-kit-ammonia")) fk.ammonia = document.getElementById("g-kit-ammonia").value;
        if (document.getElementById("g-kit-indole")) fk.indole = document.getElementById("g-kit-indole").value;
        if (document.getElementById("g-kit-fat")) fk.undigestedFat = document.getElementById("g-kit-fat").value;
        if (document.getElementById("g-kit-sugar")) fk.reducingSugar = document.getElementById("g-kit-sugar").value;
        if (document.getElementById("g-kit-mucosal")) fk.mucosalInflam = document.getElementById("g-kit-mucosal").value;
        if (document.getElementById("g-kit-odor")) fk.stoolOdor = document.getElementById("g-kit-odor").value;
        if (document.getElementById("g-kit-mucus")) fk.mucusSeen = document.getElementById("g-kit-mucus").value;

        evaluateGuardianFecalKit();
    };

    window.toggleApplyKitAbsorptionToDiet = function () {
        guardianState.fecalKit.applyAbsorptionToDiet = !guardianState.fecalKit.applyAbsorptionToDiet;
        const btn = document.getElementById("g-kit-apply-abs-btn");
        if (btn) {
            if (guardianState.fecalKit.applyAbsorptionToDiet) {
                btn.className = "px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-sm transition flex items-center space-x-1.5";
                btn.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>✅ 추정 소화 흡수율(${guardianState.fecalKit.estimatedAbsorption.toFixed(1)}%)이 하루 급여량에 반영됨 (클릭 시 해제)</span>`;
            } else {
                btn.className = "px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-sm transition flex items-center space-x-1.5";
                btn.innerHTML = `<i class="fa-solid fa-bolt"></i><span>⚡ 추정 소화 흡수율을 Step 1·4 하루 사료 급여량에 반영하기</span>`;
            }
        }
        refreshAllGuardianCalculations();
    };

    function evaluateGuardianFecalKit() {
        const fk = guardianState.fecalKit;
        if (!document.getElementById("g-step5-sec")) return;

        // pH 배지 업데이트
        const phBadge = document.getElementById("g-kit-ph-badge");
        if (phBadge) {
            if (fk.phLevel === "normal") {
                phBadge.className = "px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px]";
                phBadge.innerText = `pH ${fk.phValue.toFixed(1)} (정상 약산성)`;
            } else if (fk.phLevel === "acidic") {
                phBadge.className = "px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[11px]";
                phBadge.innerText = `pH ${fk.phValue.toFixed(1)} (산성 과발효)`;
            } else {
                phBadge.className = "px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[11px]";
                phBadge.innerText = `pH ${fk.phValue.toFixed(1)} (알칼리 부패성)`;
            }
        }

        // 점수 및 소화 흡수율 계산
        let score = 96;
        let abs = 93.5;

        if (fk.phLevel === "acidic") { score -= 10; abs -= 3.0; }
        else if (fk.phLevel === "alkaline") { score -= 12; abs -= 3.5; }

        if (fk.ammonia === "warn") { score -= 8; abs -= 2.0; }
        else if (fk.ammonia === "high") { score -= 18; abs -= 5.0; }

        if (fk.indole === "warn") { score -= 7; abs -= 1.5; }
        else if (fk.indole === "high") { score -= 16; abs -= 4.0; }

        if (fk.undigestedFat === "trace") { score -= 10; abs -= 3.5; }
        else if (fk.undigestedFat === "pos") { score -= 22; abs -= 8.0; }

        if (fk.reducingSugar === "warn") { score -= 8; abs -= 2.5; }
        else if (fk.reducingSugar === "high") { score -= 15; abs -= 5.5; }

        if (fk.mucosalInflam === "trace") { score -= 10; abs -= 2.5; }
        else if (fk.mucosalInflam === "pos") { score -= 24; abs -= 7.0; }

        if (fk.stoolOdor === "sour") score -= 3;
        else if (fk.stoolOdor === "foul") score -= 6;

        if (fk.mucusSeen === "sometimes") score -= 4;
        else if (fk.mucusSeen === "yes") score -= 9;

        score = Math.max(35, Math.min(99, score));
        abs = Math.max(68.0, Math.min(95.5, Math.round(abs * 10) / 10));
        fk.estimatedAbsorption = abs;

        // 유익균 비율 추정
        const goodPct = Math.max(25, Math.min(88, Math.round(score * 0.85)));
        const badPct = 100 - goodPct;

        if (document.getElementById("g-kit-score-num")) document.getElementById("g-kit-score-num").innerText = score;
        if (document.getElementById("g-kit-abs-num")) document.getElementById("g-kit-abs-num").innerText = abs.toFixed(1);
        if (document.getElementById("g-kit-good-pct")) document.getElementById("g-kit-good-pct").innerText = `${goodPct}%`;
        if (document.getElementById("g-kit-bad-pct")) document.getElementById("g-kit-bad-pct").innerText = `${badPct}%`;
        if (document.getElementById("g-kit-good-bar")) document.getElementById("g-kit-good-bar").style.width = `${goodPct}%`;

        // 상단 헤드라인 요약
        const pill = document.getElementById("g-kit-status-pill");
        const head = document.getElementById("g-kit-headline");
        const sub = document.getElementById("g-kit-subline");

        if (score >= 85) {
            if (pill) { pill.className = "px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[11px] font-black"; pill.innerText = "🟢 황금 장내 환경"; }
            if (head) head.innerText = "유익균이 활발하고 소화 흡수력이 매우 훌륭해요!";
            if (sub) sub.innerText = "장내 산도(약산성)와 소화 효소 기능이 균형을 이루어 영양소가 알차게 흡수되고 있습니다.";
        } else if (score >= 68) {
            if (pill) { pill.className = "px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black"; pill.innerText = "🟡 장내 불균형 주의 단계"; }
            if (head) head.innerText = "소화되지 않은 영양소가 장내 가스와 독소를 만들고 있어요.";
            if (sub) sub.innerText = "간식·육류 비율이나 전분/지방 소화 부담을 조절하고 맞춤 유산균 급여를 시작해 주세요.";
        } else {
            if (pill) { pill.className = "px-2.5 py-0.5 rounded-full bg-rose-400 text-slate-950 text-[11px] font-black"; pill.innerText = "🔴 집중 장 케어 & 식단 교정 필요"; }
            if (head) head.innerText = "소화 흡수력이 떨어지고 장 점막과 유익균이 지쳐 있어요!";
            if (sub) sub.innerText = "저지방·고소화성 화식/습식 배합으로 장 부담을 줄이고, 점막 자극이 지속되면 수의사 상담을 권장합니다.";
        }

        // 4대 장내 환경 항목별 쉬운 해설 카드 생성
        const cardsEl = document.getElementById("g-kit-explanation-cards");
        if (cardsEl) {
            // 1) 장내 산도(pH) 해설
            let phCard = {
                title: "① 장내 산도(pH)와 유익균 터전",
                badge: "🟢 약산성 최적",
                badgeCls: "bg-emerald-100 text-emerald-800",
                borderCls: "border-emerald-200 bg-emerald-50/40",
                desc: `현재 분변 산도(pH ${fk.phValue.toFixed(1)})는 <strong>약산성</strong>으로, 유산균·비피더스균 같은 유익균이 단쇄지방산(SCFA)을 잘 만들어내며 나쁜 균의 침입을 막아주는 건강한 상태입니다.`
            };
            if (fk.phLevel === "acidic") {
                phCard = {
                    title: "① 장내 산도(pH)와 유익균 터전",
                    badge: "🟡 산성 과발효",
                    badgeCls: "bg-amber-100 text-amber-800",
                    borderCls: "border-amber-200 bg-amber-50/50",
                    desc: `산도(pH ${fk.phValue.toFixed(1)})가 <strong>산성</strong>으로 기울어 있어요. 소장에서 다 흡수되지 못한 탄수화물(전분·당류)이 대장에서 과하게 발효되면서 젖산과 가스가 차고 시큼한 무른 변이 나올 수 있습니다.`
                };
            } else if (fk.phLevel === "alkaline") {
                phCard = {
                    title: "① 장내 산도(pH)와 유익균 터전",
                    badge: "🔴 알칼리성 부패",
                    badgeCls: "bg-rose-100 text-rose-800",
                    borderCls: "border-rose-200 bg-rose-50/50",
                    desc: `산도(pH ${fk.phValue.toFixed(1)})가 <strong>알칼리성</strong>으로 높아졌어요. 단백질이 대장에서 부패하면서 암모니아가 생성되면 장내 환경이 알칼리화되어 유익균이 줄고 유해균이 쉽게 증식합니다.`
                };
            }

            // 2) 단백질 부패 독소 (암모니아 & 인돌) 해설
            let protCard = {
                title: "② 단백질 소화 & 부패 가스(암모니아·인돌)",
                badge: "🟢 독소 안전",
                badgeCls: "bg-emerald-100 text-emerald-800",
                borderCls: "border-emerald-200 bg-emerald-50/40",
                desc: `먹은 사료와 고기 단백질이 소장에서 깔끔하게 아미노산으로 흡수되어, 대장 내 부패 독소(암모니아·인돌) 생성이 적고 변 냄새도 양호합니다.`
            };
            if (fk.ammonia === "high" || fk.indole === "high") {
                protCard = {
                    title: "② 단백질 소화 & 부패 가스(암모니아·인돌)",
                    badge: "🔴 부패 독소 높음",
                    badgeCls: "bg-rose-100 text-rose-800",
                    borderCls: "border-rose-200 bg-rose-50/50",
                    desc: `소화 능력을 넘긴 <strong>과도한 고단백 사료나 육류 간식(육포·건조간식)</strong>이 대장으로 내려가 유해균의 먹이가 되고 있어요! 이 과정에서 암모니아·인돌 독소가 생겨 방귀/변 냄새가 심해지고 간·신장에도 부담을 줍니다.`
                };
            } else if (fk.ammonia === "warn" || fk.indole === "warn") {
                protCard = {
                    title: "② 단백질 소화 & 부패 가스(암모니아·인돌)",
                    badge: "🟡 경계 (간식 조절)",
                    badgeCls: "bg-amber-100 text-amber-800",
                    borderCls: "border-amber-200 bg-amber-50/50",
                    desc: `단백질 부패 지표(암모니아·인돌)가 살짝 올라가 있습니다. 육류 토핑이나 간식이 하루 권장량(10%)을 넘지 않는지 점검하고 소화 잘되는 단백질로 바꿔주세요.`
                };
            }

            // 3) 지방 & 탄수화물 소화 효소 흡수력 해설
            let digCard = {
                title: "③ 지방 · 탄수화물 소화 흡수력",
                badge: "🟢 소화효소 우수",
                badgeCls: "bg-emerald-100 text-emerald-800",
                borderCls: "border-emerald-200 bg-emerald-50/40",
                desc: `췌장 소화효소(리파아제·아밀라아제)와 담즙이 원활하게 작동하여 지방과 탄수화물이 남김없이 에너지로 흡수되고 있습니다.`
            };
            if (fk.undigestedFat === "pos" || fk.reducingSugar === "high") {
                digCard = {
                    title: "③ 지방 · 탄수화물 소화 흡수력",
                    badge: "🔴 소화불량 감지",
                    badgeCls: "bg-rose-100 text-rose-800",
                    borderCls: "border-rose-200 bg-rose-50/50",
                    desc: `${fk.undigestedFat === "pos" ? "<strong>미소화 지방(기름기)</strong>이 변으로 배출되고 있어 췌장·담즙 소화력에 부담이 큰 상태입니다. " : ""}${fk.reducingSugar === "high" ? "<strong>탄수화물(환원당)</strong>이 다 흡수되지 못해 장으로 수분을 끌어당겨 무른 변을 유발합니다." : ""}`
                };
            } else if (fk.undigestedFat === "trace" || fk.reducingSugar === "warn") {
                digCard = {
                    title: "③ 지방 · 탄수화물 소화 흡수력",
                    badge: "🟡 소화력 경계",
                    badgeCls: "bg-amber-100 text-amber-800",
                    borderCls: "border-amber-200 bg-amber-50/50",
                    desc: `기름진 음식이나 전분이 많은 간식을 먹었을 때 소화 효소가 조금 버거워하고 있어요. 저지방 화식(닭안심·흰살생선 등)을 섞어주면 소화 흡수율이 훨씬 높아집니다.`
                };
            }

            // 4) 장 점막 장벽 & 점액변 해설
            let mucCard = {
                title: "④ 장 점막 장벽 & 면역 건강",
                badge: "🟢 장벽 튼튼",
                badgeCls: "bg-emerald-100 text-emerald-800",
                borderCls: "border-emerald-200 bg-emerald-50/40",
                desc: `장 점막 세포들이 빈틈없이 튼튼하게 연결되어 있어, 염증 반응이나 잠혈·점액변 없이 건강한 장 장벽을 유지하고 있습니다.`
            };
            if (fk.mucosalInflam === "pos" || fk.mucusSeen === "yes") {
                mucCard = {
                    title: "④ 장 점막 장벽 & 면역 건강",
                    badge: "🔴 점막 보호 시급",
                    badgeCls: "bg-rose-100 text-rose-800",
                    borderCls: "border-rose-200 bg-rose-50/50",
                    desc: `장 점막이 자극받아 <strong>염증 마커(칼프로텍틴/잠혈) 또는 코 같은 점액변</strong>이 관찰됩니다. 대장 점막이 스스로를 보호하려고 점액을 뿜어내는 신호이므로 자극적인 간식을 끊고 수의사 상담을 받아보세요.`
                };
            } else if (fk.mucosalInflam === "trace" || fk.mucusSeen === "sometimes") {
                mucCard = {
                    title: "④ 장 점막 장벽 & 면역 건강",
                    badge: "🟡 점막 예민함",
                    badgeCls: "bg-amber-100 text-amber-800",
                    borderCls: "border-amber-200 bg-amber-50/50",
                    desc: `특정 사료 원료에 식이 민감성이 있거나 가벼운 장 점막 자극이 있습니다. 단일 단백질(오리·양·가수분해 등) 식단과 오메가-3·유산균 급여가 점막 진정에 도움을 줍니다.`
                };
            }

            cardsEl.innerHTML = [phCard, protCard, digCard, mucCard].map(c => `
                <div class="p-3.5 rounded-2xl border ${c.borderCls} space-y-1.5">
                    <div class="flex items-center justify-between gap-2">
                        <span class="font-black text-slate-900">${c.title}</span>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${c.badgeCls}">${c.badge}</span>
                    </div>
                    <p class="text-[11.5px] text-slate-700 leading-relaxed">${c.desc}</p>
                </div>
            `).join("");
        }

        // 맞춤 식단 & 유산균·보조제 홈케어 처방 가이드 생성
        const careEl = document.getElementById("g-kit-care-guide");
        if (careEl) {
            const tips = [];
            if (fk.ammonia !== "normal" || fk.indole !== "normal" || fk.phLevel === "alkaline") {
                tips.push(`🥩 <strong>단백질 부패·악취 케어 식단:</strong> 육포·건조 고기 간식을 즉시 줄이고(Step 3의 4번 토핑 제어기 5% 이내), 유익균의 먹이가 되는 <strong>수용성 식이섬유(찐 단호박·양배추)</strong>와 <strong>고농도 프로바이오틱스(유산균)</strong>를 급여해 장내 pH를 약산성으로 낮춰주세요.`);
            }
            if (fk.undigestedFat !== "neg") {
                tips.push(`🍗 <strong>지방 소화불량 케어 식단:</strong> 기름기가 많은 사료나 간식은 췌장과 담낭에 무리를 줍니다. 위 Step 3에서 <strong>[2. 건식+화식 (슬림 닭안심 저지방 화식)]</strong>을 50:50으로 배합하거나 <strong>소화효소(리파아제 포함)</strong> 보조제를 함께 급여해 보세요.`);
            }
            if (fk.reducingSugar !== "normal" || fk.phLevel === "acidic") {
                tips.push(`🌾 <strong>탄수화물 과발효·가스 케어:</strong> 고구마·빵·과일 간식이나 곡물 함량이 너무 높은 사료가 장내 가스를 만들고 있어요. 소화가 잘되는 백미·귀리 죽 형태나 수분 함량이 높은 습식 파우치 배합을 추천합니다.`);
            }
            if (fk.mucosalInflam !== "neg" || fk.mucusSeen !== "no") {
                tips.push(`🛡️ <strong>장 점막 진정 & 면역 케어:</strong> 장 점막 세포의 회복을 돕는 <strong>L-글루타민, 정제 오메가-3(EPA/DHA), 장 점막 보호 유산균(S. boulardii 등)</strong>을 챙겨주시고, 양성 반응이 지속되면 오른쪽 아래 버튼으로 <strong>수의사용 정밀 CDSS</strong>에 데이터를 보내 진료를 받아보세요.`);
            }
            if (tips.length === 0) {
                tips.push(`✨ <strong>황금 장내 환경 유지 팁:</strong> 현재 식단의 소화 흡수율(${abs.toFixed(1)}%)과 유익균 밸런스가 매우 이상적입니다! 지금 급여 중인 주식+습식/화식 비율을 유지하시고, 데일리 유산균과 충분한 음수량만 꾸준히 챙겨주세요.`);
            }
            careEl.innerHTML = tips.map(t => `<div class="p-2.5 rounded-xl bg-white border border-amber-200/80 leading-relaxed">${t}</div>`).join("");
        }

        // 만약 이미 흡수율 반영 토글이 켜져 있다면 급여량도 실시간 재계산
        if (fk.applyAbsorptionToDiet) {
            refreshAllGuardianCalculations();
        } else if (typeof renderUnifiedDashboardAndSchemas === "function") {
            renderUnifiedDashboardAndSchemas();
        }
    }

    // =========================================================================
    // 13. [통합 대시보드 & 6대 표준 데이터 스키마 아키텍처 센터]
    // =========================================================================
    const UNIFIED_SCHEMA_REGISTRY = {
        schema_patient: {
            id: "SCHEMA-01",
            name: "PatientProfile & Energy Schema (환자 신상 · 체형 · 대사에너지)",
            fieldsSummary: "patient_id, species(dog|cat), weight_kg, ideal_weight_kg, bcs_9(1~9), mcs_4(1~4), rer_kcal, der_kcal, max_treat_10pct_kcal",
            recordCount: "실시간 환자 세션 (1:1)",
            jsonSchema: {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "title": "PatientProfileAndEnergySchema",
                "type": "object",
                "required": ["name", "species", "weightKg", "bcs", "mcs", "energy"],
                "properties": {
                    "name": { "type": "string", "description": "반려동물 이름" },
                    "species": { "type": "string", "enum": ["dog", "cat"], "description": "축종 구분" },
                    "breed": { "type": "string", "description": "품종명" },
                    "weightKg": { "type": "number", "minimum": 0.3, "maximum": 100.0, "description": "현재 체중 (kg)" },
                    "bcs": { "type": "integer", "minimum": 1, "maximum": 9, "description": "WSAVA 9단계 체형 점수 (이상치=5)" },
                    "mcs": { "type": "integer", "minimum": 1, "maximum": 4, "description": "근육량 점수 (4=정상, 1=심한 근감소증)" },
                    "lifeStage": { "type": "string", "enum": ["puppy_young", "puppy_older", "adult", "senior", "pregnant"] },
                    "energy": {
                        "type": "object",
                        "properties": {
                            "rer": { "type": "number", "description": "기초대사량 RER = 70 * (체중_kg)^0.75" },
                            "der": { "type": "number", "description": "일일 목표 에너지 요구량 DER (kcal/day)" },
                            "idealWeightKg": { "type": "number", "description": "BCS 기반 추정 이상 체중 (kg)" },
                            "maxTreatKcal": { "type": "number", "description": "간식·토핑 10% 안전 허용 상한 (kcal/day)" }
                        }
                    }
                }
            }
        },
        schema_feed: {
            id: "SCHEMA-02",
            name: "Commercial & Prescription Feed Schema (상용·처방 사료 & DM 정규화)",
            fieldsSummary: "feed_id, brand, type(건식|습식|화식), moisture_af, protein_af/dm, fat_af/dm, nfe_af/dm, ca_dm, phos_dm, ca_p_ratio, kcal_per_kg",
            recordCount: "처방식 142종 + 상용 건·습·화식 16종",
            jsonSchema: {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "title": "NormalizedFeedNutrientSchema",
                "type": "object",
                "required": ["id", "name", "moisture_af", "p_dm", "f_dm", "ca_p_ratio", "kcal_per_kg"],
                "properties": {
                    "id": { "type": "string" },
                    "name": { "type": "string", "description": "사료 제품명 (국문/영문)" },
                    "inputMode": { "type": "string", "enum": ["db_search", "ai_ocr_scan", "manual_input"] },
                    "asFed": {
                        "type": "object",
                        "description": "포장지 표기 보증성분 (As-Fed %)",
                        "properties": {
                            "moisture_af": { "type": "number" },
                            "protein_af": { "type": "number" },
                            "fat_af": { "type": "number" },
                            "fiber_af": { "type": "number" },
                            "ash_af": { "type": "number" },
                            "nfe_af": { "type": "number" }
                        }
                    },
                    "dryMatter": {
                        "type": "object",
                        "description": "수분 제거 건물 기준 정규화 성분 (% DM = As-Fed / (100 - 수분) * 100)",
                        "properties": {
                            "p_dm": { "type": "number", "description": "조단백질 (% DM)" },
                            "f_dm": { "type": "number", "description": "조지방 (% DM)" },
                            "nfe_dm": { "type": "number", "description": "순탄수화물 NFE (% DM)" },
                            "ca_dm": { "type": "number", "description": "칼슘 (% DM)" },
                            "phos_dm": { "type": "number", "description": "인 (% DM)" },
                            "ca_p_ratio": { "type": "number", "description": "칼슘:인 비율 (AAFCO 권장 1.1~1.8:1)" },
                            "kcal_per_kg": { "type": "number", "description": "Modified Atwater 대사에너지 (kcal/kg)" }
                        }
                    }
                }
            }
        },
        schema_ingredient: {
            id: "SCHEMA-03",
            name: "Natural Ingredient 36-Nutrient Schema (농진청/USDA 117종 화식 원재료)",
            fieldsSummary: "ing_id, category(육류|어류|채소|곡물|보충제), group(P|C|F|S), 36대 영양소(단백질·지방·미네랄10종·비타민12종·아미노산·EPA/DHA per 100g)",
            recordCount: "원재료 117종 + 보충제 6종 × 36영양소",
            jsonSchema: {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "title": "NaturalIngredient36NutrientsSchema",
                "type": "object",
                "required": ["id", "name_ko", "category", "group", "nutrients_per_100g_af"],
                "properties": {
                    "id": { "type": "string", "description": "원재료 고유 식별자 (예: ing_89)" },
                    "name_ko": { "type": "string", "description": "국가표준식품성분표 원재료명" },
                    "category": { "type": "string", "enum": ["육류/가금류/난류", "어패류/수산물", "채소/버섯/해조류", "곡류/고구마/감자", "필수 보충제 (칼슘·오메가3)"] },
                    "group": { "type": "string", "enum": ["P", "C", "F", "S"], "description": "핵심 영양 역할 그룹" },
                    "nutrients_per_100g_af": {
                        "type": "object",
                        "description": "생원료/조리원료 100g당 36대 영양소 벡터",
                        "properties": {
                            "macros": { "type": "string", "example": "에너지(kcal), 수분(g), 단백질(g), 지방(g), 탄수화물(g), 식이섬유(g), 회분(g)" },
                            "minerals": { "type": "string", "example": "칼슘(mg), 인(mg), 칼륨(mg), 나트륨(mg), 마그네슘(mg), 철(mg), 아연(mg), 구리(mg), 망간(mg), 셀레늄(ug)" },
                            "vitamins": { "type": "string", "example": "비타민A, D, E, B1, B2, B3, B5, B6, B12, 엽산, 콜린" },
                            "fattyAcidsAndAmino": { "type": "string", "example": "EPA+DHA(g), 오메가-3(g), 오메가-6(g), 아르기닌, 타우린, 라이신, 메티오닌" }
                        }
                    }
                }
            }
        },
        schema_mix_diy: {
            id: "SCHEMA-04",
            name: "Mix-Feeding & DIY Recipe Schema (6대 배합 프로그램 · 10% 토핑 · 밀프랩)",
            fieldsSummary: "active_menu(menu1~6), main_ratio_pct, sub_ratio_pct, topping_items[], diy_recipe_items[], prep_days, traffic_light_status",
            recordCount: "6대 메뉴 실시간 배합 파이프라인",
            jsonSchema: {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "title": "MixFeedingAndDiyRecipeSchema",
                "type": "object",
                "properties": {
                    "activeMenu": { "type": "string", "enum": ["menu1", "menu2", "menu3", "menu4", "menu5", "menu6"] },
                    "dailyFeedingGramPlan": {
                        "type": "object",
                        "properties": {
                            "mainFoodGramsPerDay": { "type": "number" },
                            "subFoodGramsPerDay": { "type": "number" },
                            "toppingTotalKcal": { "type": "number" },
                            "toppingShareOfDerPct": { "type": "number", "maximum": 10.0, "description": "10% 초과 시 영양 불균형 경고 트리거" }
                        }
                    },
                    "diyRecipeBuilder": {
                        "type": "object",
                        "properties": {
                            "prepDays": { "type": "integer", "enum": [1, 7, 14, 30] },
                            "targetDisease": { "type": "string" },
                            "items": { "type": "array", "items": { "type": "object", "properties": { "id": { "type": "string" }, "ratio": { "type": "number" } } } }
                        }
                    }
                }
            }
        },
        schema_reverse: {
            id: "SCHEMA-05",
            name: "Reverse-Tracing (PAVA + AI Imputation) Schema (사료 역추적 & 28대 영양소 신뢰도)",
            fieldsSummary: "ordered_ingredients[], pava_weights_pct[], l1_fit_error, 28_nutrients_prediction[dm_est, min_bound, max_bound, confidence_pct]",
            recordCount: "비음수 단조감소(PAVA) 최적화 엔진",
            jsonSchema: {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "title": "ReverseTracingPavaOutputSchema",
                "type": "object",
                "properties": {
                    "constraintRule": { "type": "string", "default": "w_1 >= w_2 >= ... >= w_n >= 0, sum(w_i) = 100%" },
                    "imputationEnabled": { "type": "boolean", "description": "결측 영양소 AI 카테고리 다중 보간 활성화 여부" },
                    "estimatedWeights": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "rank": { "type": "integer" },
                                "ingredientName": { "type": "string" },
                                "weightPct": { "type": "number" }
                            }
                        }
                    },
                    "unlabeled28NutrientsConfidence": {
                        "type": "array",
                        "description": "포장지 미표기 28대 영양소의 역추적 추정치 및 신뢰구간(Min~Max)",
                        "items": {
                            "type": "object",
                            "properties": {
                                "nutrient": { "type": "string" },
                                "estimatedDm": { "type": "number" },
                                "confidencePct": { "type": "number" }
                            }
                        }
                    }
                }
            }
        },
        schema_fecal_cdss: {
            id: "SCHEMA-06",
            name: "Fecal Kit Biomarker & Vet Lab CDSS Schema (분변키트 · 혈액 가중치 연동)",
            fieldsSummary: "fecal_ph, ammonia, indole, undigested_fat, reducing_sugar, mucosal_calprotectin, gut_score_100, est_absorption_pct, vet_lab_delta_w",
            recordCount: "보호자 Step 5 ⇄ 수의사 Tab 4 양방향 연동",
            jsonSchema: {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "title": "FecalKitAndVetCdssBridgeSchema",
                "type": "object",
                "properties": {
                    "fecalBiomarkers": {
                        "type": "object",
                        "properties": {
                            "phValue": { "type": "number", "minimum": 4.5, "maximum": 9.0 },
                            "phLevel": { "type": "string", "enum": ["normal", "acidic", "alkaline"] },
                            "ammonia": { "type": "string", "enum": ["normal", "warn", "high"] },
                            "indole": { "type": "string", "enum": ["normal", "warn", "high"] },
                            "undigestedFat": { "type": "string", "enum": ["neg", "trace", "pos"] },
                            "reducingSugar": { "type": "string", "enum": ["normal", "warn", "high"] },
                            "mucosalInflam": { "type": "string", "enum": ["neg", "trace", "pos"] }
                        }
                    },
                    "gutAssessment": {
                        "type": "object",
                        "properties": {
                            "gutHealthScore100": { "type": "integer", "minimum": 0, "maximum": 100 },
                            "estimatedAbsorptionPct": { "type": "number", "minimum": 60.0, "maximum": 98.0 },
                            "applyAbsorptionToDer": { "type": "boolean" }
                        }
                    },
                    "vetCdssMapping": {
                        "type": "object",
                        "description": "수의사용 Tab 4 장내환경 9대 마커 & 혈액 가중치(ΔW_Lab) 자동 매핑 페이로드"
                    }
                }
            }
        }
    };

    function findNaturalIngredientById(id) {
        return (window.GUARDIAN_NATURAL_INGREDIENTS || []).find(x => x.id === id);
    }

    function buildLiveUnifiedPayload() {
        const p = guardianState.profile;
        const e = guardianState.energy || {};
        const dry = getActiveDryFoodMetrics();
        const mix = guardianState.lastMixSummary || {};
        const fk = guardianState.fecalKit || {};
        const gutScoreEl = document.getElementById("g-kit-score-num");
        const gutScore = gutScoreEl ? parseInt(gutScoreEl.innerText) || 94 : 94;

        return {
            schemaVersion: "2.5.0-SingleBackend-DualFrontend",
            generatedAt: new Date().toISOString(),
            schema_patient: {
                profile: { ...p },
                energyCalculation: { ...e }
            },
            schema_feed: {
                inputMode: guardianState.step2Mode,
                selectedMainFood: {
                    id: dry.id,
                    name: dry.name,
                    brand: dry.brand,
                    asFed: {
                        moisture_af: dry.moisture_af,
                        protein_af: dry.protein_af,
                        fat_af: dry.fat_af,
                        fiber_af: dry.fiber_af,
                        ash_af: dry.ash_af,
                        nfe_af: dry.nfe_af
                    },
                    dryMatter: {
                        p_dm: dry.p_dm,
                        f_dm: dry.f_dm,
                        fb_dm: dry.fb_dm,
                        nfe_dm: dry.nfe_dm,
                        ca_dm: dry.ca_dm,
                        phos_dm: dry.phos_dm,
                        ca_p_ratio: dry.ca_p_ratio,
                        kcal_per_kg: dry.kcal_per_kg
                    }
                }
            },
            schema_ingredient: {
                databaseSource: "농촌진흥청 국가표준식품성분표 + USDA 36대 영양소 통합 DB",
                totalNaturalIngredientsCount: (window.GUARDIAN_NATURAL_INGREDIENTS || []).length,
                totalSupplementsCount: (window.GUARDIAN_SUPPLEMENTS || []).length,
                sampleActiveDiyIngredients: guardianState.menu5_diy.items.map(it => {
                    const found = findNaturalIngredientById(it.id);
                    return {
                        id: it.id,
                        name_ko: it.name_ko,
                        ratio_pct: it.ratio,
                        category: found ? found.category : "기타",
                        group: found ? found.group : "P",
                        kcal_100g: found && found.nutrients ? found.nutrients["에너지(kcal)"] : null,
                        protein_g_100g: found && found.nutrients ? found.nutrients["단백질(g)"] : null,
                        calcium_mg_100g: found && found.nutrients ? found.nutrients["칼슘(mg)"] : null,
                        phosphorus_mg_100g: found && found.nutrients ? found.nutrients["인(mg)"] : null
                    };
                })
            },
            schema_mix_diy: {
                activeMenu: guardianState.activeMenu,
                activeMenuTitle: mix.menuBadgeText || "건식 + 습식 배합",
                dailyGramsAndKcal: {
                    mainLabel: mix.mainLabel,
                    mainGrams: mix.mainGrams,
                    mainKcal: mix.mainKcal,
                    subLabel: mix.subLabel,
                    subGrams: mix.subGrams,
                    subKcal: mix.subKcal,
                    toppingKcal: mix.toppingKcal,
                    totalSupplyKcal: mix.totalSupplyKcal
                },
                mixedDryMatterProfile: {
                    protein_dm_pct: mix.mixP_dm,
                    fat_dm_pct: mix.mixF_dm,
                    carb_nfe_dm_pct: mix.mixNfe_dm,
                    ca_dm_pct: mix.mixCa_dm,
                    phos_dm_pct: mix.mixPhos_dm,
                    ca_to_p_ratio: mix.mixCaP
                },
                diyMealPrepConfig: {
                    prepDays: guardianState.menu5_diy.prepDays,
                    targetDisease: guardianState.menu5_diy.targetDisease,
                    recipeItems: guardianState.menu5_diy.items
                }
            },
            schema_reverse: (typeof window.Step6MultiMixController !== "undefined" && window.Step6MultiMixController.getState().lastResult?.guardianStep6Payload)
                ? window.Step6MultiMixController.getState().lastResult.guardianStep6Payload
                : {
                    note: "Step 3 메뉴 6 (1~4단계 역추적 & 2·3종 믹스피딩) 실행 결과 연동 대기"
                },
            schema_fecal_cdss: {
                guardianFecalKitInput: { ...fk },
                gutEnvironmentScore100: gutScore,
                estimatedDigestiveAbsorptionPct: fk.estimatedAbsorption,
                vetTab4MappedMarkers: {
                    m9_ph: fk.phValue,
                    m9_ammonia_ppm: fk.ammonia === "high" ? 85 : (fk.ammonia === "warn" ? 48 : 22),
                    m9_indole_ug_g: fk.indole === "high" ? 72 : (fk.indole === "warn" ? 42 : 18),
                    m9_undigested_fat: fk.undigestedFat,
                    m9_reducing_sugar_pct: fk.reducingSugar === "high" ? 1.2 : (fk.reducingSugar === "warn" ? 0.6 : 0.15),
                    m9_calprotectin_ug_g: fk.mucosalInflam === "pos" ? 160 : (fk.mucosalInflam === "trace" ? 75 : 20),
                    m9_occult_blood: fk.mucosalInflam
                }
            }
        };
    }

    window.selectGuardianSchemaTab = function (tabKey) {
        guardianState.activeSchemaTab = tabKey;
        const keys = ["schema_patient", "schema_feed", "schema_ingredient", "schema_mix_diy", "schema_reverse", "schema_fecal_cdss"];
        keys.forEach(k => {
            const btn = document.getElementById(`g-sch-tab-${k}`);
            if (!btn) return;
            if (k === tabKey) {
                btn.className = "px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-black transition shadow";
            } else {
                btn.className = "px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition";
            }
        });
        renderUnifiedDashboardAndSchemas();
    };

    window.openAdminSchemaDashboardModal = function () {
        // 관리자/수의사 로그인 세션 검증 (보호자는 열람 불가)
        const rawSession = sessionStorage.getItem("vet_mix_auth_user");
        if (!rawSession) {
            guardianState.pendingAdminSchemaOpen = true;
            const shield = document.getElementById("private-gate-shield");
            if (shield) {
                shield.style.setProperty("display", "flex", "important");
                showVetLoginFormInGate();
            }
            return;
        }

        // 아직 보호자 포털 DOM이 초기화되지 않았다면 백그라운드에서 생성
        let gRoot = document.getElementById("guardian-portal-root");
        if (!gRoot) {
            gRoot = document.createElement("div");
            gRoot.id = "guardian-portal-root";
            gRoot.className = "hidden min-h-screen bg-slate-50 pb-20";
            const switcher = document.getElementById("global-portal-switcher-bar");
            if (switcher && switcher.nextSibling) {
                document.body.insertBefore(gRoot, switcher.nextSibling);
            } else {
                document.body.appendChild(gRoot);
            }
            buildGuardianPortalDOM(gRoot);
            refreshAllGuardianCalculations();
        }

        // 만약 수의사 뷰에서 열었을 때도 모달이 보이도록 관리자 모달을 body 직속으로 이동 보장
        const modal = document.getElementById("admin-schema-dashboard-modal");
        if (modal) {
            if (modal.parentElement !== document.body) {
                document.body.appendChild(modal);
            }
            modal.classList.remove("hidden");
            renderUnifiedDashboardAndSchemas();
        }
    };

    window.closeAdminSchemaDashboardModal = function () {
        const modal = document.getElementById("admin-schema-dashboard-modal");
        if (modal) {
            modal.classList.add("hidden");
        }
    };

    window.copyLiveSchemaJson = function () {
        const payload = buildLiveUnifiedPayload();
        const jsonStr = JSON.stringify(payload, null, 2);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(jsonStr).then(() => {
                const el = document.getElementById("g-schema-copy-txt");
                if (el) {
                    el.innerText = "✅ 클립보드에 복사 완료!";
                    setTimeout(() => { el.innerText = "현재 통합 JSON 복사"; }, 2000);
                }
            });
        }
    };

    window.downloadLiveSchemaJson = function () {
        const payload = buildLiveUnifiedPayload();
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mixfeeding_unified_schema_${guardianState.profile.name || "pet"}_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    function renderUnifiedDashboardAndSchemas() {
        const sec = document.getElementById("g-unified-dashboard-sec");
        if (!sec) return;

        const p = guardianState.profile;
        const e = guardianState.energy || { rer: 216, der: 346, idealWeightKg: 4.5, maxTreatKcal: 34.6 };
        const mix = guardianState.lastMixSummary || {
            menuBadgeText: "건식 + 습식 배합",
            totalSupplyKcal: e.der,
            toppingKcal: 0,
            mixP_dm: 26.5,
            mixF_dm: 14.5,
            mixCaP: 1.25
        };
        const fk = guardianState.fecalKit || { estimatedAbsorption: 93.0 };
        const gutScoreEl = document.getElementById("g-kit-score-num");
        const gutScore = gutScoreEl ? parseInt(gutScoreEl.innerText) || 94 : 94;

        // 1. 상단 4대 KPI 카드 렌더링
        const kpiCont = document.getElementById("g-unified-kpi-cards");
        const treatPctOfDer = e.der > 0 ? Math.round((mix.toppingKcal / e.der) * 1000) / 10 : 0;
        if (kpiCont) {
            kpiCont.innerHTML = `
                <div class="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 space-y-1">
                    <div class="flex items-center justify-between text-slate-400 text-[11px] font-bold">
                        <span>① 환자 대사에너지 (DER)</span>
                        <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black">BCS ${p.bcs}/9 · MCS ${p.mcs}/4</span>
                    </div>
                    <div class="text-2xl font-black text-white">${e.der} <span class="text-xs font-normal text-slate-300">kcal/일</span></div>
                    <div class="text-[11px] text-slate-400">기초 RER ${e.rer} kcal · 이상체중 ${e.idealWeightKg} kg</div>
                </div>
                <div class="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 space-y-1">
                    <div class="flex items-center justify-between text-slate-400 text-[11px] font-bold">
                        <span>② 믹스피딩 영양 밸런스 (DM)</span>
                        <span class="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-black">Ca:P ${mix.mixCaP}:1</span>
                    </div>
                    <div class="text-2xl font-black text-sky-300">단백 ${mix.mixP_dm}% <span class="text-sm text-amber-300">/ 지방 ${mix.mixF_dm}%</span></div>
                    <div class="text-[11px] text-slate-400">활성 프로그램: ${mix.menuBadgeText}</div>
                </div>
                <div class="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 space-y-1">
                    <div class="flex items-center justify-between text-slate-400 text-[11px] font-bold">
                        <span>③ 토핑·간식 10% 안전 한도</span>
                        <span class="px-2 py-0.5 rounded ${treatPctOfDer <= 10 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'} font-black">${treatPctOfDer <= 10 ? '🟢 안전' : '🔴 초과'}</span>
                    </div>
                    <div class="text-2xl font-black ${treatPctOfDer <= 10 ? 'text-emerald-300' : 'text-rose-400'}">${mix.toppingKcal} <span class="text-xs font-normal text-slate-300">/ ${e.maxTreatKcal} kcal (${treatPctOfDer}%)</span></div>
                    <div class="text-[11px] text-slate-400">하루 총 열량의 10% 이내 영양왜곡 방지</div>
                </div>
                <div class="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 space-y-1">
                    <div class="flex items-center justify-between text-slate-400 text-[11px] font-bold">
                        <span>④ 분변키트 장내환경 & 흡수율</span>
                        <span class="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-black">pH ${(fk.phValue || 6.4).toFixed(1)}</span>
                    </div>
                    <div class="text-2xl font-black text-amber-300">${gutScore}점 <span class="text-sm text-teal-300">/ 흡수율 ${fk.estimatedAbsorption.toFixed(1)}%</span></div>
                    <div class="text-[11px] text-slate-400">${fk.applyAbsorptionToDiet ? '⚡ 급여량에 흡수율 보정 반영 중' : 'Step 5 분변키트 바이오마커 연동'}</div>
                </div>
            `;
        }

        // 2. 6대 스키마 요약 테이블 렌더링
        const tbody = document.getElementById("g-unified-schema-summary-tbody");
        if (tbody) {
            tbody.innerHTML = Object.keys(UNIFIED_SCHEMA_REGISTRY).map(key => {
                const s = UNIFIED_SCHEMA_REGISTRY[key];
                const isSelected = guardianState.activeSchemaTab === key;
                return `
                    <tr onclick="selectGuardianSchemaTab('${key}')" class="cursor-pointer transition ${isSelected ? 'bg-indigo-950/80 font-bold' : 'hover:bg-slate-800/60'}">
                        <td class="py-2 px-2.5 font-mono text-indigo-300 font-black">${s.id}</td>
                        <td class="py-2 px-2.5 text-white">${s.name.split('(')[0].trim()}</td>
                        <td class="py-2 px-2.5 text-slate-400 text-[11px]">${s.fieldsSummary}</td>
                        <td class="py-2 px-2.5 text-center">
                            <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black">🟢 ${s.recordCount}</span>
                        </td>
                    </tr>
                `;
            }).join("");
        }

        // 3. 5축 통합 밸런스 레이더 차트 업데이트
        const calScore = e.der > 0 ? Math.max(40, Math.round(100 - Math.abs(mix.totalSupplyKcal - e.der) / e.der * 100)) : 95;
        const macroScore = (mix.mixP_dm >= 18 && mix.mixP_dm <= 45 && mix.mixF_dm >= 8 && mix.mixF_dm <= 25) ? 94 : 76;
        const capScore = (mix.mixCaP >= 1.1 && mix.mixCaP <= 1.8) ? 96 : (mix.mixCaP >= 1.0 && mix.mixCaP <= 2.1 ? 78 : 52);
        const treatSafetyScore = treatPctOfDer <= 10 ? 98 : Math.max(40, Math.round(100 - (treatPctOfDer - 10) * 4));
        const gutTotalScore = gutScore;

        const avgTotal = Math.round((calScore + macroScore + capScore + treatSafetyScore + gutTotalScore) / 5);
        const gradeBadge = document.getElementById("g-unified-total-grade");
        if (gradeBadge) {
            const grade = avgTotal >= 90 ? "S등급" : (avgTotal >= 80 ? "A등급" : (avgTotal >= 70 ? "B등급" : "주의 등급"));
            gradeBadge.innerText = `종합 ${grade} (${avgTotal}점)`;
            gradeBadge.className = avgTotal >= 85
                ? "px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[11px] font-black"
                : "px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black";
        }

        if (typeof Chart !== "undefined") {
            const radarCanvas = document.getElementById("gUnifiedRadarCanvas");
            if (radarCanvas) {
                if (guardianState.charts.unifiedRadar) guardianState.charts.unifiedRadar.destroy();
                guardianState.charts.unifiedRadar = new Chart(radarCanvas.getContext("2d"), {
                    type: "radar",
                    data: {
                        labels: ["칼로리 적정성", "단백·지방 균형", "칼슘:인(Ca:P) 안전", "간식 10% 한도", "장내환경·흡수율"],
                        datasets: [{
                            label: `${p.name || '우리 아이'} 통합 건강 밸런스`,
                            data: [calScore, macroScore, capScore, treatSafetyScore, gutTotalScore],
                            backgroundColor: "rgba(99, 102, 241, 0.28)",
                            borderColor: "#818cf8",
                            pointBackgroundColor: "#34d399",
                            pointBorderColor: "#ffffff",
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            r: {
                                min: 0,
                                max: 100,
                                ticks: { stepSize: 25, display: false },
                                grid: { color: "rgba(148, 163, 184, 0.2)" },
                                angleLines: { color: "rgba(148, 163, 184, 0.2)" },
                                pointLabels: { color: "#e2e8f0", font: { size: 11, weight: "bold" } }
                            }
                        },
                        plugins: {
                            legend: { display: false }
                        }
                    }
                });
            }
        }

        // 4. 하단 선택된 스키마의 JSON Schema 명세 & Live JSON Payload 출력
        const activeKey = guardianState.activeSchemaTab || "schema_patient";
        const schemaObj = UNIFIED_SCHEMA_REGISTRY[activeKey] || UNIFIED_SCHEMA_REGISTRY.schema_patient;
        const livePayload = buildLiveUnifiedPayload();

        const specTitle = document.getElementById("g-schema-spec-title");
        const specPre = document.getElementById("g-schema-spec-pre");
        const livePre = document.getElementById("g-schema-live-pre");

        if (specTitle) specTitle.innerText = `📐 [${schemaObj.id}] ${schemaObj.name}`;
        if (specPre) specPre.textContent = JSON.stringify(schemaObj.jsonSchema, null, 2);
        if (livePre) livePre.textContent = JSON.stringify(livePayload[activeKey], null, 2);
    }

    // =========================================================================
    // 13. 보호자용 데이터 ➔ 수의사용 정밀 CDSS 원클릭 연동 브릿지 (Step 1~5 통합 연동)
    // =========================================================================
    window.sendGuardianDataToVetCdss = function () {
        const p = guardianState.profile;
        if (document.getElementById("patient-name")) document.getElementById("patient-name").value = p.name;
        if (document.getElementById("patient-species")) {
            document.getElementById("patient-species").value = p.species === "cat" ? "고양이" : "개";
            if (typeof onSpeciesChange === "function") onSpeciesChange();
        }
        if (document.getElementById("patient-weight")) document.getElementById("patient-weight").value = p.weightKg;
        if (document.getElementById("patient-breed")) document.getElementById("patient-breed").value = p.breed;
        if (document.getElementById("patient-bcs")) {
            document.getElementById("patient-bcs").value = p.bcs;
            if (typeof onBcsChange === "function") onBcsChange(p.bcs);
        }
        if (document.getElementById("patient-fecal")) {
            document.getElementById("patient-fecal").value = p.fecalScore;
            if (typeof onFecalChange === "function") onFecalChange(p.fecalScore);
        }

        // 수의사용 17대 복합질환 1:1 완벽 연동
        const mapDis = {
            heart: "dis-heart",
            ckd: "dis-ckd",
            pancreatitis: "dis-pancreas",
            cushing: "dis-cushing",
            liver: "dis-liver",
            gallbladder: "dis-gallbladder",
            ibd: "dis-ibd",
            diabetes: "dis-diabetes",
            urolithiasis: "dis-stones",
            cognitive: "dis-cognitive",
            obesity: "dis-obesity",
            osteoarthritis: "dis-osteoarthritis",
            hypothyroid: "dis-hypothyroid",
            addison: "dis-addison",
            oncology: "dis-oncology",
            atopy: "dis-atopy",
            hypertension: "dis-hypertension"
        };
        if (p.healthConcern && mapDis[p.healthConcern]) {
            const chk = document.getElementById(mapDis[p.healthConcern]);
            if (chk) chk.checked = true;
        }

        // 보호자용 3대 알러지원 (동물성 단백질 / 식물성 / 환경알러지) ➔ 수의사용 환자 프로필 알러지 100% 동기화
        if (Array.isArray(p.allergies)) {
            document.querySelectorAll("input[name='allergy']").forEach(chk => {
                chk.checked = p.allergies.includes(chk.value);
            });
        }

        // [Step 5] 분변키트 검사 결과 ➔ 수의사용 Tab 4 (장내환경 9대 마커 CDSS) 자동 매핑
        const fk = guardianState.fecalKit;
        if (fk) {
            if (document.getElementById("m9-ph")) document.getElementById("m9-ph").value = fk.phValue;
            if (document.getElementById("m9-ammonia")) {
                document.getElementById("m9-ammonia").value = fk.ammonia === "high" ? 85 : (fk.ammonia === "warn" ? 48 : 22);
            }
            if (document.getElementById("m9-indole")) {
                document.getElementById("m9-indole").value = fk.indole === "high" ? 72 : (fk.indole === "warn" ? 42 : 18);
            }
            if (document.getElementById("m9-fat")) {
                document.getElementById("m9-fat").value = fk.undigestedFat === "pos" ? "pos" : (fk.undigestedFat === "trace" ? "trace" : "neg");
            }
            if (document.getElementById("m9-sugar")) {
                document.getElementById("m9-sugar").value = fk.reducingSugar === "high" ? 1.2 : (fk.reducingSugar === "warn" ? 0.6 : 0.15);
            }
            if (document.getElementById("m9-lactate")) {
                document.getElementById("m9-lactate").value = fk.phLevel === "acidic" ? 28 : 10;
            }
            if (document.getElementById("m9-calprotectin")) {
                document.getElementById("m9-calprotectin").value = fk.mucosalInflam === "pos" ? 160 : (fk.mucosalInflam === "trace" ? 75 : 20);
            }
            if (document.getElementById("m9-blood")) {
                document.getElementById("m9-blood").value = fk.mucosalInflam === "pos" ? "pos" : (fk.mucosalInflam === "trace" ? "trace" : "neg");
            }
            if (document.getElementById("m9-absorption")) {
                document.getElementById("m9-absorption").value = fk.estimatedAbsorption;
            }
        }

        if (typeof runRecommendation === "function") runRecommendation(false);
        if (typeof syncGutCdssFromCurrentTabs === "function") syncGutCdssFromCurrentTabs(false);
        if (typeof evaluateMarkers9AndLabCDSS === "function") evaluateMarkers9AndLabCDSS();

        switchToVetPortalFromTop();
    };

    // 페이지 로드 시 초기화
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", setupDualPortalLandingAndHeader);
    } else {
        setupDualPortalLandingAndHeader();
    }
})();
