/**
 * guardian_portal.js
 * 단일 백엔드(통합 DB & 코어 엔진) + 듀얼 프론트엔드 (보호자용 뷰 vs 수의사용 뷰)
 * - [Step 1] 랜딩 및 이지 Q&A 기초 프로필 (신상, BCS/MCS, RER/MER/DER 자동 산출)
 * - [Step 2] 사료 데이터 3대 입력 인터페이스 (DB 검색 / AI OCR 라벨 스캔 / 직접 입력)
 * - [Step 3] 6대 핵심 믹스피딩 프로그램 분기:
 *     1) 건식 + 습식 배합기
 *     2) 건식 + 화식 배합기
 *     3) 건식 + 단일 원재료 배합기 (영양 왜곡 방지)
 *     4) 토핑 공통 안전 제어기 (하루 10% 칼로리 캡 필터)
 *     5) 화식 자가 만들기 (Recipe DIY Builder - 36대 영양소 & 밀프랩 리디자인)
 *     6) 사료 역추적 프로그램 (Reverse-Tracing Calculator - PAVA + AI Imputation + 30대 영양소 신뢰도)
 * - [Step 4] 결과 출력 및 시각화 대시보드 (칼로리 게이지 바, AAFCO/FEDIAF 신호등 리포트, 아침/저녁 급여 스케줄표)
 */

window.GUARDIAN_INGREDIENTS_DB = [{"ingredient": "oat, covered, polished, cooked", "name_ko": "귀리, 겉귀리, 도정, 밥", "category": "곡류", "energy_kcal": 197, "moisture_g": 55.5, "protein_g": 5.01, "fat_g": 4.7, "ash_g": 0.72, "carbohydrate_g": 34.08, "sugar_g": 0.4, "total_dietary_fiber_g": 4.9, "calcium_mg": 26, "magnesium_mg": 61, "phosphorus_mg": 172, "potassium_mg": 195, "sodium_mg": 1, "zinc_mg": 1.03, "copper_mg": 0.116, "iron_mg": 2.6, "manganese_mg": 2.883, "selenium_ug": 0.82, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.169, "riboflavin_mg": 0.044, "niacin_mg": 0.881, "pantothenic_acid_mg": 0.403, "vitamin_b6_mg": 0.113, "biotin_ug": 3.47, "folate_ug": 13, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.39, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.04, "omega6_g": 1.4, "id": "ing_0"}, {"ingredient": "oat, naked, polished, cooked", "name_ko": "귀리, 쌀귀리, 도정, 밥", "category": "곡류", "energy_kcal": 218, "moisture_g": 50.7, "protein_g": 6.51, "fat_g": 5.36, "ash_g": 0.95, "carbohydrate_g": 36.53, "sugar_g": 0.42, "total_dietary_fiber_g": 3.9, "calcium_mg": 34, "magnesium_mg": 78, "phosphorus_mg": 228, "potassium_mg": 212, "sodium_mg": 1, "zinc_mg": 1.71, "copper_mg": 0.206, "iron_mg": 2.46, "manganese_mg": 3.642, "selenium_ug": 1.06, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.226, "riboflavin_mg": 0.025, "niacin_mg": 0.249, "pantothenic_acid_mg": 0.274, "vitamin_b6_mg": 0.127, "biotin_ug": 3.23, "folate_ug": 12, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.77, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.04, "omega6_g": 1.64, "id": "ing_1"}, {"ingredient": "proso millet, glutinous, polished, cooked", "name_ko": "기장, 찰기장, 도정, 밥", "category": "곡류", "energy_kcal": 136, "moisture_g": 67.5, "protein_g": 4.76, "fat_g": 1.24, "ash_g": 0.48, "carbohydrate_g": 25.99, "sugar_g": 0.22, "total_dietary_fiber_g": 2.1, "calcium_mg": 5, "magnesium_mg": 49, "phosphorus_mg": 107, "potassium_mg": 83, "sodium_mg": 1, "zinc_mg": 0.75, "copper_mg": 0.133, "iron_mg": 1.39, "manganese_mg": 0.386, "selenium_ug": 0.83, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.125, "riboflavin_mg": 0.02, "niacin_mg": 0.098, "pantothenic_acid_mg": 0.233, "vitamin_b6_mg": 0.107, "biotin_ug": 0.46, "folate_ug": 25, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.08, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.02, "omega6_g": 0.83, "id": "ing_2"}, {"ingredient": "rice, white, cooked", "name_ko": "멥쌀, 백미, 밥", "category": "곡류", "energy_kcal": 146, "moisture_g": 65.2, "protein_g": 2.65, "fat_g": 0.33, "ash_g": 0.1, "carbohydrate_g": 31.71, "sugar_g": 0.01, "total_dietary_fiber_g": 0.9, "calcium_mg": 2, "magnesium_mg": 4, "phosphorus_mg": 25, "potassium_mg": 20, "sodium_mg": 0, "zinc_mg": 0.65, "copper_mg": 0.065, "iron_mg": 0.02, "manganese_mg": 0.29, "selenium_ug": 0.63, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.035, "riboflavin_mg": 0, "niacin_mg": 0.084, "pantothenic_acid_mg": 0.191, "vitamin_b6_mg": 0.041, "biotin_ug": 0, "folate_ug": 7, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.14, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0, "omega6_g": 0.09, "id": "ing_3"}, {"ingredient": "rice porridge, white", "name_ko": "멥쌀, 백미, 죽", "category": "곡류", "energy_kcal": 53, "moisture_g": 87.4, "protein_g": 0.99, "fat_g": 0.15, "ash_g": 0.04, "carbohydrate_g": 11.45, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 0, "magnesium_mg": 1, "phosphorus_mg": 9, "potassium_mg": 6, "sodium_mg": 0, "zinc_mg": 0.25, "copper_mg": 0.019, "iron_mg": 0, "manganese_mg": 0.095, "selenium_ug": 0.18, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.02, "riboflavin_mg": 0, "niacin_mg": 0.012, "pantothenic_acid_mg": 0.147, "vitamin_b6_mg": 0.017, "biotin_ug": 0, "folate_ug": 6, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.11, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0, "omega6_g": 0.03, "id": "ing_4"}, {"ingredient": "rice, brown, cooked", "name_ko": "멥쌀, 현미, 밥", "category": "곡류", "energy_kcal": 166, "moisture_g": 59.6, "protein_g": 3.47, "fat_g": 0.96, "ash_g": 0.62, "carbohydrate_g": 35.34, "sugar_g": 0.4, "total_dietary_fiber_g": 2.2, "calcium_mg": 5, "magnesium_mg": 60, "phosphorus_mg": 142, "potassium_mg": 122, "sodium_mg": 0, "zinc_mg": 1.1, "copper_mg": 0.088, "iron_mg": 0.44, "manganese_mg": 1.347, "selenium_ug": 0.93, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.075, "riboflavin_mg": 0.004, "niacin_mg": 1.587, "pantothenic_acid_mg": 0.369, "vitamin_b6_mg": 0.125, "biotin_ug": 0, "folate_ug": 13, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.57, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.01, "omega6_g": 0.29, "id": "ing_5"}, {"ingredient": "barley, covered, polished, cooked", "name_ko": "보리, 겉보리, 밥", "category": "곡류", "energy_kcal": 144, "moisture_g": 63.7, "protein_g": 3.55, "fat_g": 0.7, "ash_g": 0.26, "carbohydrate_g": 31.79, "sugar_g": 0.37, "total_dietary_fiber_g": 2.7, "calcium_mg": 11, "magnesium_mg": 18, "phosphorus_mg": 66, "potassium_mg": 57, "sodium_mg": 0, "zinc_mg": 0.84, "copper_mg": 0.144, "iron_mg": 0.69, "manganese_mg": 0.538, "selenium_ug": 0.28, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.076, "riboflavin_mg": 0.01, "niacin_mg": 0.273, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0.04, "biotin_ug": 0, "folate_ug": 10, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.14, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.01, "omega6_g": 0.24, "id": "ing_6"}, {"ingredient": "barley, naked, polished, cooked", "name_ko": "보리, 쌀보리, 밥", "category": "곡류", "energy_kcal": 144, "moisture_g": 63.7, "protein_g": 3.58, "fat_g": 0.73, "ash_g": 0.25, "carbohydrate_g": 31.72, "sugar_g": 0.08, "total_dietary_fiber_g": 3.3, "calcium_mg": 14, "magnesium_mg": 18, "phosphorus_mg": 66, "potassium_mg": 66, "sodium_mg": 1, "zinc_mg": 0.95, "copper_mg": 0.124, "iron_mg": 0.78, "manganese_mg": 0.389, "selenium_ug": 0.21, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.023, "riboflavin_mg": 0.01, "niacin_mg": 0.243, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0.018, "biotin_ug": 0, "folate_ug": 8, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.19, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.02, "omega6_g": 0.26, "id": "ing_7"}, {"ingredient": "corn, sweet, boiled", "name_ko": "옥수수, 단옥수수, 삶은것", "category": "곡류", "energy_kcal": 118, "moisture_g": 70.3, "protein_g": 3.99, "fat_g": 1.47, "ash_g": 0.7, "carbohydrate_g": 23.53, "sugar_g": 4.2, "total_dietary_fiber_g": 3.2, "calcium_mg": 4, "magnesium_mg": 40, "phosphorus_mg": 104, "potassium_mg": 252, "sodium_mg": 0, "zinc_mg": 0.95, "copper_mg": 0.09, "iron_mg": 0.7, "manganese_mg": 0.297, "selenium_ug": 0.31, "iodine_ug": 0, "vitamin_a_ug": 1, "thiamin_mg": 0.075, "riboflavin_mg": 0.087, "niacin_mg": 1.6, "pantothenic_acid_mg": 0.384, "vitamin_b6_mg": 0.146, "biotin_ug": 1.43, "folate_ug": 48, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.37, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.02, "omega6_g": 0.53, "id": "ing_8"}, {"ingredient": "job's tears, polished, cooked", "name_ko": "율무, 도정, 밥", "category": "곡류", "energy_kcal": 172, "moisture_g": 59.7, "protein_g": 7.1, "fat_g": 2.35, "ash_g": 0.53, "carbohydrate_g": 30.34, "sugar_g": 0.15, "total_dietary_fiber_g": 1.9, "calcium_mg": 6, "magnesium_mg": 84, "phosphorus_mg": 169, "potassium_mg": 105, "sodium_mg": 2, "zinc_mg": 1.83, "copper_mg": 0.051, "iron_mg": 2.45, "manganese_mg": 1.832, "selenium_ug": 1.23, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.042, "riboflavin_mg": 0.036, "niacin_mg": 0.757, "pantothenic_acid_mg": 0.271, "vitamin_b6_mg": 0.036, "biotin_ug": 0.13, "folate_ug": 12, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.26, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.01, "omega6_g": 0.71, "id": "ing_9"}, {"ingredient": "quinoa, steamed and then dried", "name_ko": "퀴노아, 쪄서 말린것", "category": "곡류", "energy_kcal": 363, "moisture_g": 12.5, "protein_g": 9.56, "fat_g": 3.26, "ash_g": 2.02, "carbohydrate_g": 72.62, "sugar_g": 1.34, "total_dietary_fiber_g": 7.7, "calcium_mg": 63, "magnesium_mg": 143, "phosphorus_mg": 308, "potassium_mg": 645, "sodium_mg": 0, "zinc_mg": 2.11, "copper_mg": 0.318, "iron_mg": 3.54, "manganese_mg": 2.253, "selenium_ug": 5.04, "iodine_ug": 6.17, "vitamin_a_ug": 0, "thiamin_mg": 0.953, "riboflavin_mg": 0.219, "niacin_mg": 1.989, "pantothenic_acid_mg": 0.887, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 105, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.26, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.19, "omega6_g": 1.65, "id": "ing_10"}, {"ingredient": "potato, daeji, boiled", "name_ko": "감자, 대지, 삶은것", "category": "감자류", "energy_kcal": 77, "moisture_g": 79.5, "protein_g": 2.07, "fat_g": 0.08, "ash_g": 0.96, "carbohydrate_g": 17.39, "sugar_g": 0, "total_dietary_fiber_g": 1.6, "calcium_mg": 8, "magnesium_mg": 22, "phosphorus_mg": 35, "potassium_mg": 374, "sodium_mg": 1, "zinc_mg": 0.34, "copper_mg": 0.142, "iron_mg": 0.65, "manganese_mg": 0.125, "selenium_ug": 6.04, "iodine_ug": 0, "vitamin_a_ug": 1, "thiamin_mg": 0.04, "riboflavin_mg": 0.022, "niacin_mg": 0.281, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 7, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.02, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.01, "omega6_g": 0.04, "id": "ing_11"}, {"ingredient": "potato, daeji, steamed", "name_ko": "감자, 대지, 찐것", "category": "감자류", "energy_kcal": 80, "moisture_g": 78.6, "protein_g": 2.11, "fat_g": 0.09, "ash_g": 1.03, "carbohydrate_g": 18.17, "sugar_g": 0, "total_dietary_fiber_g": 1.6, "calcium_mg": 10, "magnesium_mg": 23, "phosphorus_mg": 36, "potassium_mg": 402, "sodium_mg": 2, "zinc_mg": 0.38, "copper_mg": 0.144, "iron_mg": 0.48, "manganese_mg": 0.132, "selenium_ug": 6.57, "iodine_ug": 0, "vitamin_a_ug": 1, "thiamin_mg": 0.035, "riboflavin_mg": 0.016, "niacin_mg": 0.286, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 14, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.04, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.01, "omega6_g": 0.05, "id": "ing_12"}, {"ingredient": "potato, sumi, boiled", "name_ko": "감자, 수미, 삶은것", "category": "감자류", "energy_kcal": 76, "moisture_g": 79.8, "protein_g": 1.99, "fat_g": 0.04, "ash_g": 0.74, "carbohydrate_g": 17.43, "sugar_g": 0, "total_dietary_fiber_g": 1.5, "calcium_mg": 8, "magnesium_mg": 18, "phosphorus_mg": 55, "potassium_mg": 254, "sodium_mg": 1, "zinc_mg": 0.45, "copper_mg": 0.135, "iron_mg": 0.61, "manganese_mg": 0.17, "selenium_ug": 5.84, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.038, "riboflavin_mg": 0.02, "niacin_mg": 0.359, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 14, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.01, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0, "omega6_g": 0.02, "id": "ing_13"}, {"ingredient": "potato, sumi, steamed", "name_ko": "감자, 수미, 찐것", "category": "감자류", "energy_kcal": 75, "moisture_g": 79.8, "protein_g": 1.94, "fat_g": 0.05, "ash_g": 0.93, "carbohydrate_g": 17.28, "sugar_g": 0, "total_dietary_fiber_g": 1.4, "calcium_mg": 6, "magnesium_mg": 20, "phosphorus_mg": 58, "potassium_mg": 318, "sodium_mg": 0, "zinc_mg": 0.41, "copper_mg": 0.143, "iron_mg": 0.42, "manganese_mg": 0.159, "selenium_ug": 4.62, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.025, "riboflavin_mg": 0.02, "niacin_mg": 0.327, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 23, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.01, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0, "omega6_g": 0.02, "id": "ing_14"}, {"ingredient": "potato, red, rose valley, boiled", "name_ko": "감자, 로즈밸리, 삶은것", "category": "감자류", "energy_kcal": 79, "moisture_g": 78.8, "protein_g": 2.34, "fat_g": 0.09, "ash_g": 0.9, "carbohydrate_g": 17.87, "sugar_g": 0, "total_dietary_fiber_g": 1.9, "calcium_mg": 5, "magnesium_mg": 18, "phosphorus_mg": 50, "potassium_mg": 351, "sodium_mg": 1, "zinc_mg": 0.33, "copper_mg": 0.082, "iron_mg": 0.49, "manganese_mg": 0.095, "selenium_ug": 0.83, "iodine_ug": 0, "vitamin_a_ug": 1, "thiamin_mg": 0.117, "riboflavin_mg": 0.052, "niacin_mg": 0.114, "pantothenic_acid_mg": 0.253, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 14, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.1, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.02, "omega6_g": 0.04, "id": "ing_15"}, {"ingredient": "potato, purple, bora valley, boiled", "name_ko": "감자, 자색, 보라밸리, 삶은것", "category": "감자류", "energy_kcal": 69, "moisture_g": 81.6, "protein_g": 1.39, "fat_g": 0.05, "ash_g": 0.99, "carbohydrate_g": 15.97, "sugar_g": 0, "total_dietary_fiber_g": 1.6, "calcium_mg": 7, "magnesium_mg": 17, "phosphorus_mg": 59, "potassium_mg": 386, "sodium_mg": 2, "zinc_mg": 0.23, "copper_mg": 0.085, "iron_mg": 0.34, "manganese_mg": 0.11, "selenium_ug": 0.76, "iodine_ug": 0, "vitamin_a_ug": 1, "thiamin_mg": 0.064, "riboflavin_mg": 0.015, "niacin_mg": 0.124, "pantothenic_acid_mg": 0.465, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 19, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.05, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.01, "omega6_g": 0.03, "id": "ing_16"}, {"ingredient": "sweet potato, steamed", "name_ko": "고구마, 찐것", "category": "감자류", "energy_kcal": 163, "moisture_g": 58.4, "protein_g": 1.08, "fat_g": 0.15, "ash_g": 1.0, "carbohydrate_g": 39.41, "sugar_g": 13.75, "total_dietary_fiber_g": 3.8, "calcium_mg": 20, "magnesium_mg": 24, "phosphorus_mg": 52, "potassium_mg": 428, "sodium_mg": 6, "zinc_mg": 0.22, "copper_mg": 0.116, "iron_mg": 0.44, "manganese_mg": 0.888, "selenium_ug": 1.58, "iodine_ug": 0.06, "vitamin_a_ug": 25, "thiamin_mg": 0.084, "riboflavin_mg": 0.028, "niacin_mg": 0.468, "pantothenic_acid_mg": 0.585, "vitamin_b6_mg": 0, "biotin_ug": 3.14, "folate_ug": 42, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.6, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.01, "omega6_g": 0.08, "id": "ing_17"}, {"ingredient": "sweet potato, baked", "name_ko": "고구마, 구운것", "category": "감자류", "energy_kcal": 188, "moisture_g": 52.1, "protein_g": 1.13, "fat_g": 0.16, "ash_g": 1.14, "carbohydrate_g": 45.48, "sugar_g": 19.08, "total_dietary_fiber_g": 4.2, "calcium_mg": 19, "magnesium_mg": 28, "phosphorus_mg": 59, "potassium_mg": 445, "sodium_mg": 9, "zinc_mg": 0.25, "copper_mg": 0.132, "iron_mg": 0.61, "manganese_mg": 0.766, "selenium_ug": 1.84, "iodine_ug": 0, "vitamin_a_ug": 34, "thiamin_mg": 0.104, "riboflavin_mg": 0.044, "niacin_mg": 0.398, "pantothenic_acid_mg": 0.57, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 56, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.57, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.01, "omega6_g": 0.08, "id": "ing_18"}, {"ingredient": "jerusalem artichoke, boiled", "name_ko": "돼지감자, 삶은것", "category": "감자류", "energy_kcal": 39, "moisture_g": 79.3, "protein_g": 2.23, "fat_g": 0.11, "ash_g": 1.2, "carbohydrate_g": 17.16, "sugar_g": 0, "total_dietary_fiber_g": 2.0, "calcium_mg": 20, "magnesium_mg": 14, "phosphorus_mg": 107, "potassium_mg": 533, "sodium_mg": 2, "zinc_mg": 0.46, "copper_mg": 0.148, "iron_mg": 0.63, "manganese_mg": 0.098, "selenium_ug": 4.12, "iodine_ug": 1.63, "vitamin_a_ug": 0, "thiamin_mg": 0.042, "riboflavin_mg": 0.081, "niacin_mg": 0.117, "pantothenic_acid_mg": 0.334, "vitamin_b6_mg": 0, "biotin_ug": 1.43, "folate_ug": 46, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.22, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.02, "omega6_g": 0.06, "id": "ing_19"}, {"ingredient": "kidney bean, boiled", "name_ko": "강낭콩, 삶은것", "category": "콩류", "energy_kcal": 171, "moisture_g": 57.0, "protein_g": 8.46, "fat_g": 0.9, "ash_g": 1.74, "carbohydrate_g": 31.92, "sugar_g": 0.77, "total_dietary_fiber_g": 15.2, "calcium_mg": 59, "magnesium_mg": 83, "phosphorus_mg": 270, "potassium_mg": 575, "sodium_mg": 3, "zinc_mg": 1.31, "copper_mg": 0.284, "iron_mg": 2.89, "manganese_mg": 0.812, "selenium_ug": 3.04, "iodine_ug": 0, "vitamin_a_ug": 8, "thiamin_mg": 0.329, "riboflavin_mg": 0.112, "niacin_mg": 1.095, "pantothenic_acid_mg": 0.957, "vitamin_b6_mg": 0.035, "biotin_ug": 0, "folate_ug": 83, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.26, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.35, "omega6_g": 0.25, "id": "ing_20"}, {"ingredient": "soybean, black, seoritae, boiled", "name_ko": "대두, 검은색, 서리태, 삶은것", "category": "콩류", "energy_kcal": 184, "moisture_g": 61.0, "protein_g": 17.93, "fat_g": 7.58, "ash_g": 1.8, "carbohydrate_g": 11.72, "sugar_g": 1.77, "total_dietary_fiber_g": 9.7, "calcium_mg": 86, "magnesium_mg": 91, "phosphorus_mg": 291, "potassium_mg": 646, "sodium_mg": 2, "zinc_mg": 1.76, "copper_mg": 0.444, "iron_mg": 2.83, "manganese_mg": 1.329, "selenium_ug": 2.33, "iodine_ug": 1.35, "vitamin_a_ug": 2, "thiamin_mg": 0.07, "riboflavin_mg": 0.075, "niacin_mg": 0.306, "pantothenic_acid_mg": 0.297, "vitamin_b6_mg": 0.069, "biotin_ug": 1.64, "folate_ug": 137, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 1.77, "vitamin_k_ug": 12.91, "cholesterol_mg": 0, "omega3_g": 0.68, "omega6_g": 3.92, "id": "ing_21"}, {"ingredient": "soybean, black, heuktae, boiled", "name_ko": "대두, 검은색, 흑태, 삶은것", "category": "콩류", "energy_kcal": 181, "moisture_g": 61.1, "protein_g": 15.76, "fat_g": 6.97, "ash_g": 1.74, "carbohydrate_g": 14.39, "sugar_g": 1.84, "total_dietary_fiber_g": 11.8, "calcium_mg": 77, "magnesium_mg": 87, "phosphorus_mg": 264, "potassium_mg": 649, "sodium_mg": 2, "zinc_mg": 1.89, "copper_mg": 0.342, "iron_mg": 3.02, "manganese_mg": 1.182, "selenium_ug": 1.89, "iodine_ug": 0.44, "vitamin_a_ug": 2, "thiamin_mg": 0.058, "riboflavin_mg": 0.079, "niacin_mg": 0.42, "pantothenic_acid_mg": 0.177, "vitamin_b6_mg": 0.075, "biotin_ug": 4.06, "folate_ug": 145, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 1.12, "vitamin_k_ug": 10.21, "cholesterol_mg": 0, "omega3_g": 0.64, "omega6_g": 3.61, "id": "ing_22"}, {"ingredient": "soybean, yellow, boiled", "name_ko": "대두, 노란색, 삶은것", "category": "콩류", "energy_kcal": 201, "moisture_g": 58.6, "protein_g": 17.82, "fat_g": 9.5, "ash_g": 2.06, "carbohydrate_g": 12.02, "sugar_g": 2.43, "total_dietary_fiber_g": 10.2, "calcium_mg": 127, "magnesium_mg": 109, "phosphorus_mg": 305, "potassium_mg": 692, "sodium_mg": 4, "zinc_mg": 2.39, "copper_mg": 0.432, "iron_mg": 2.27, "manganese_mg": 1.782, "selenium_ug": 3.23, "iodine_ug": 2.01, "vitamin_a_ug": 0, "thiamin_mg": 0.158, "riboflavin_mg": 0.204, "niacin_mg": 0.164, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 31, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 1.63, "vitamin_k_ug": 15.4, "cholesterol_mg": 0, "omega3_g": 0.78, "omega6_g": 4.87, "id": "ing_23"}, {"ingredient": "tofu, firm", "name_ko": "두부", "category": "콩류", "energy_kcal": 97, "moisture_g": 81.2, "protein_g": 9.62, "fat_g": 4.63, "ash_g": 0.8, "carbohydrate_g": 3.75, "sugar_g": 0, "total_dietary_fiber_g": 2.9, "calcium_mg": 64, "magnesium_mg": 80, "phosphorus_mg": 158, "potassium_mg": 132, "sodium_mg": 1, "zinc_mg": 1.17, "copper_mg": 0.126, "iron_mg": 1.54, "manganese_mg": 0.772, "selenium_ug": 0.88, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.032, "riboflavin_mg": 0.179, "niacin_mg": 0.159, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 21, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.7, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.39, "omega6_g": 2.39, "id": "ing_24"}, {"ingredient": "chick pea, dried, boiled", "name_ko": "병아리콩, 말린것, 삶은것", "category": "콩류", "energy_kcal": 183, "moisture_g": 57.3, "protein_g": 9.18, "fat_g": 3.2, "ash_g": 1.04, "carbohydrate_g": 29.24, "sugar_g": 0.71, "total_dietary_fiber_g": 8.8, "calcium_mg": 45, "magnesium_mg": 61, "phosphorus_mg": 173, "potassium_mg": 350, "sodium_mg": 0, "zinc_mg": 1.46, "copper_mg": 0.336, "iron_mg": 2.58, "manganese_mg": 2.111, "selenium_ug": 1.17, "iodine_ug": 0, "vitamin_a_ug": 2, "thiamin_mg": 0.133, "riboflavin_mg": 0.053, "niacin_mg": 0.406, "pantothenic_acid_mg": 0.314, "vitamin_b6_mg": 0.009, "biotin_ug": 1.54, "folate_ug": 86, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 2.46, "vitamin_k_ug": 22.9, "cholesterol_mg": 0, "omega3_g": 0.06, "omega6_g": 1.2, "id": "ing_25"}, {"ingredient": "pea, boiled", "name_ko": "완두, 삶은것", "category": "콩류", "energy_kcal": 123, "moisture_g": 69.7, "protein_g": 7.27, "fat_g": 1.1, "ash_g": 1.15, "carbohydrate_g": 20.78, "sugar_g": 1.8, "total_dietary_fiber_g": 9.1, "calcium_mg": 35, "magnesium_mg": 46, "phosphorus_mg": 174, "potassium_mg": 338, "sodium_mg": 2, "zinc_mg": 1.73, "copper_mg": 0.206, "iron_mg": 2.03, "manganese_mg": 1.211, "selenium_ug": 1.62, "iodine_ug": 0, "vitamin_a_ug": 39, "thiamin_mg": 0.253, "riboflavin_mg": 0.09, "niacin_mg": 0.635, "pantothenic_acid_mg": 1.033, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 70, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.24, "vitamin_k_ug": 1.48, "cholesterol_mg": 0, "omega3_g": 0.09, "omega6_g": 0.46, "id": "ing_26"}, {"ingredient": "radish, korean radish, root, boiled", "name_ko": "무, 조선무, 삶은것", "category": "채소류", "energy_kcal": 21, "moisture_g": 94.2, "protein_g": 0.74, "fat_g": 0.14, "ash_g": 0.36, "carbohydrate_g": 4.53, "sugar_g": 2.23, "total_dietary_fiber_g": 1.1, "calcium_mg": 20, "magnesium_mg": 7, "phosphorus_mg": 24, "potassium_mg": 195, "sodium_mg": 12, "zinc_mg": 0.18, "copper_mg": 0.003, "iron_mg": 0.16, "manganese_mg": 0.195, "selenium_ug": 0.46, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0, "riboflavin_mg": 0.027, "niacin_mg": 0.275, "pantothenic_acid_mg": 0.119, "vitamin_b6_mg": 0.041, "biotin_ug": 0.16, "folate_ug": 32, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.01, "omega6_g": 0.01, "id": "ing_27"}, {"ingredient": "kimchi cabbage, boiled", "name_ko": "배추, 삶은것", "category": "채소류", "energy_kcal": 15, "moisture_g": 95.0, "protein_g": 1.16, "fat_g": 0.15, "ash_g": 0.5, "carbohydrate_g": 3.16, "sugar_g": 1.1, "total_dietary_fiber_g": 1.6, "calcium_mg": 69, "magnesium_mg": 12, "phosphorus_mg": 35, "potassium_mg": 160, "sodium_mg": 6, "zinc_mg": 0.22, "copper_mg": 0.007, "iron_mg": 0.33, "manganese_mg": 0.19, "selenium_ug": 0.23, "iodine_ug": 1.28, "vitamin_a_ug": 11, "thiamin_mg": 0.009, "riboflavin_mg": 0.031, "niacin_mg": 0.287, "pantothenic_acid_mg": 0.024, "vitamin_b6_mg": 0.002, "biotin_ug": 0.03, "folate_ug": 26, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.27, "vitamin_k_ug": 72.46, "cholesterol_mg": 0, "omega3_g": 0.05, "omega6_g": 0.02, "id": "ing_28"}, {"ingredient": "kimchi cabbage, spring green, blanched", "name_ko": "배추, 봄동, 데친것", "category": "채소류", "energy_kcal": 22, "moisture_g": 92.7, "protein_g": 1.83, "fat_g": 0.22, "ash_g": 0.7, "carbohydrate_g": 4.5, "sugar_g": 2.0, "total_dietary_fiber_g": 2.2, "calcium_mg": 98, "magnesium_mg": 14, "phosphorus_mg": 42, "potassium_mg": 172, "sodium_mg": 23, "zinc_mg": 0.28, "copper_mg": 0.021, "iron_mg": 0.52, "manganese_mg": 0.137, "selenium_ug": 2.16, "iodine_ug": 0, "vitamin_a_ug": 79, "thiamin_mg": 0.046, "riboflavin_mg": 0.085, "niacin_mg": 0.11, "pantothenic_acid_mg": 0.138, "vitamin_b6_mg": 0.01, "biotin_ug": 0.46, "folate_ug": 72, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.5, "vitamin_k_ug": 113.15, "cholesterol_mg": 0, "omega3_g": 0.11, "omega6_g": 0.02, "id": "ing_29"}, {"ingredient": "parsly, dried", "name_ko": "파슬리, 말린것", "category": "채소류", "energy_kcal": 298, "moisture_g": 3.6, "protein_g": 20.16, "fat_g": 3.41, "ash_g": 11.23, "carbohydrate_g": 61.59, "sugar_g": 5.67, "total_dietary_fiber_g": 21.7, "calcium_mg": 1.129, "magnesium_mg": 414, "phosphorus_mg": 461, "potassium_mg": 2.714, "sodium_mg": 630, "zinc_mg": 1.58, "copper_mg": 0.984, "iron_mg": 39.9, "manganese_mg": 5.549, "selenium_ug": 7.1, "iodine_ug": 22.32, "vitamin_a_ug": 1.007, "thiamin_mg": 0.18, "riboflavin_mg": 1.811, "niacin_mg": 7.562, "pantothenic_acid_mg": 3.938, "vitamin_b6_mg": 0.218, "biotin_ug": 4.28, "folate_ug": 845, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 5.64, "vitamin_k_ug": 1318, "cholesterol_mg": 0, "omega3_g": 1.31, "omega6_g": 0.88, "id": "ing_30"}, {"ingredient": "broccoli, blanched", "name_ko": "브로콜리, 데친것", "category": "채소류", "energy_kcal": 28, "moisture_g": 90.7, "protein_g": 2.8, "fat_g": 0.31, "ash_g": 0.85, "carbohydrate_g": 5.34, "sugar_g": 0.4, "total_dietary_fiber_g": 3.1, "calcium_mg": 37, "magnesium_mg": 20, "phosphorus_mg": 60, "potassium_mg": 301, "sodium_mg": 4, "zinc_mg": 0.83, "copper_mg": 0.02, "iron_mg": 0.68, "manganese_mg": 0.218, "selenium_ug": 2.21, "iodine_ug": 0.29, "vitamin_a_ug": 29, "thiamin_mg": 0.012, "riboflavin_mg": 0.102, "niacin_mg": 0.218, "pantothenic_acid_mg": 0.906, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 68, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 1.45, "vitamin_k_ug": 175.1, "cholesterol_mg": 0, "omega3_g": 0.15, "omega6_g": 0.05, "id": "ing_31"}, {"ingredient": "broccoli, boiled", "name_ko": "브로콜리, 삶은것", "category": "채소류", "energy_kcal": 30, "moisture_g": 89.9, "protein_g": 3.9, "fat_g": 0.4, "ash_g": 0.6, "carbohydrate_g": 5.2, "sugar_g": 1.2, "total_dietary_fiber_g": 4.3, "calcium_mg": 41, "magnesium_mg": 17, "phosphorus_mg": 74, "potassium_mg": 210, "sodium_mg": 5, "zinc_mg": 0.4, "copper_mg": 0.06, "iron_mg": 0.9, "manganese_mg": 0.2, "selenium_ug": 1, "iodine_ug": 0, "vitamin_a_ug": 69, "thiamin_mg": 0.06, "riboflavin_mg": 0.09, "niacin_mg": 0.4, "pantothenic_acid_mg": 0.74, "vitamin_b6_mg": 0.14, "biotin_ug": 7.1, "folate_ug": 120, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 2.7, "vitamin_k_ug": 190, "cholesterol_mg": 0, "omega3_g": 0.06, "omega6_g": 0.03, "id": "ing_32"}, {"ingredient": "spinach, blanched", "name_ko": "시금치, 데친것", "category": "채소류", "energy_kcal": 34, "moisture_g": 88.6, "protein_g": 4.02, "fat_g": 0.61, "ash_g": 1.48, "carbohydrate_g": 5.26, "sugar_g": 0.16, "total_dietary_fiber_g": 3.5, "calcium_mg": 86, "magnesium_mg": 64, "phosphorus_mg": 73, "potassium_mg": 565, "sodium_mg": 29, "zinc_mg": 1.18, "copper_mg": 0.102, "iron_mg": 1.79, "manganese_mg": 0.508, "selenium_ug": 2.41, "iodine_ug": 0.39, "vitamin_a_ug": 490, "thiamin_mg": 0.085, "riboflavin_mg": 0.141, "niacin_mg": 0.073, "pantothenic_acid_mg": 0.233, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 139, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 2.5, "vitamin_k_ug": 431.23, "cholesterol_mg": 0, "omega3_g": 0.31, "omega6_g": 0.07, "id": "ing_33"}, {"ingredient": "cabbage, blanched", "name_ko": "양배추, 데친것", "category": "채소류", "energy_kcal": 32, "moisture_g": 90.0, "protein_g": 1.51, "fat_g": 0.12, "ash_g": 0.61, "carbohydrate_g": 7.77, "sugar_g": 3.56, "total_dietary_fiber_g": 2.4, "calcium_mg": 43, "magnesium_mg": 14, "phosphorus_mg": 38, "potassium_mg": 240, "sodium_mg": 7, "zinc_mg": 0.15, "copper_mg": 0.01, "iron_mg": 0.31, "manganese_mg": 0.113, "selenium_ug": 1.97, "iodine_ug": 0, "vitamin_a_ug": 2, "thiamin_mg": 0.039, "riboflavin_mg": 0.035, "niacin_mg": 0.566, "pantothenic_acid_mg": 0.419, "vitamin_b6_mg": 0.132, "biotin_ug": 0.24, "folate_ug": 29, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.02, "vitamin_k_ug": 82.25, "cholesterol_mg": 0, "omega3_g": 0.06, "omega6_g": 0.02, "id": "ing_34"}, {"ingredient": "cabbage, boiled", "name_ko": "양배추, 삶은것", "category": "채소류", "energy_kcal": 19, "moisture_g": 94.3, "protein_g": 0.8, "fat_g": 0.1, "ash_g": 0.31, "carbohydrate_g": 4.52, "sugar_g": 2.79, "total_dietary_fiber_g": 1.6, "calcium_mg": 46, "magnesium_mg": 11, "phosphorus_mg": 20, "potassium_mg": 148, "sodium_mg": 7, "zinc_mg": 0.07, "copper_mg": 0, "iron_mg": 0.17, "manganese_mg": 0.087, "selenium_ug": 0.46, "iodine_ug": 0, "vitamin_a_ug": 1, "thiamin_mg": 0.022, "riboflavin_mg": 0.013, "niacin_mg": 0.364, "pantothenic_acid_mg": 0.056, "vitamin_b6_mg": 0.076, "biotin_ug": 0.16, "folate_ug": 29, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.02, "vitamin_k_ug": 63.76, "cholesterol_mg": 0, "omega3_g": 0.01, "omega6_g": 0.01, "id": "ing_35"}, {"ingredient": "cabbage, steamed", "name_ko": "양배추, 찐것", "category": "채소류", "energy_kcal": 28, "moisture_g": 91.3, "protein_g": 1.34, "fat_g": 0.12, "ash_g": 0.54, "carbohydrate_g": 6.75, "sugar_g": 4.13, "total_dietary_fiber_g": 2.4, "calcium_mg": 37, "magnesium_mg": 13, "phosphorus_mg": 31, "potassium_mg": 236, "sodium_mg": 4, "zinc_mg": 0.14, "copper_mg": 0.005, "iron_mg": 0.25, "manganese_mg": 0.633, "selenium_ug": 0.76, "iodine_ug": 0, "vitamin_a_ug": 2, "thiamin_mg": 0.097, "riboflavin_mg": 0.033, "niacin_mg": 0.555, "pantothenic_acid_mg": 0.119, "vitamin_b6_mg": 0.116, "biotin_ug": 0.35, "folate_ug": 23, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.02, "vitamin_k_ug": 71.97, "cholesterol_mg": 0, "omega3_g": 0.06, "omega6_g": 0.02, "id": "ing_36"}, {"ingredient": "bok choy, blanched", "name_ko": "청경채, 데친것", "category": "채소류", "energy_kcal": 11, "moisture_g": 95.6, "protein_g": 1.6, "fat_g": 0.13, "ash_g": 0.86, "carbohydrate_g": 1.81, "sugar_g": 0, "total_dietary_fiber_g": 1.3, "calcium_mg": 82, "magnesium_mg": 21, "phosphorus_mg": 39, "potassium_mg": 316, "sodium_mg": 15, "zinc_mg": 0.45, "copper_mg": 0.039, "iron_mg": 0.37, "manganese_mg": 0.166, "selenium_ug": 0.46, "iodine_ug": 1.43, "vitamin_a_ug": 70, "thiamin_mg": 0.048, "riboflavin_mg": 0.044, "niacin_mg": 0.149, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 18.68, "folate_ug": 107, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.31, "vitamin_k_ug": 189.1, "cholesterol_mg": 0, "omega3_g": 0.07, "omega6_g": 0.01, "id": "ing_37"}, {"ingredient": "tomato, blanched", "name_ko": "토마토, 데친것", "category": "채소류", "energy_kcal": 17, "moisture_g": 94.4, "protein_g": 0.7, "fat_g": 0.14, "ash_g": 0.7, "carbohydrate_g": 4.06, "sugar_g": 2.08, "total_dietary_fiber_g": 0.9, "calcium_mg": 8, "magnesium_mg": 10, "phosphorus_mg": 29, "potassium_mg": 251, "sodium_mg": 2, "zinc_mg": 0.13, "copper_mg": 0, "iron_mg": 0.15, "manganese_mg": 0.069, "selenium_ug": 0, "iodine_ug": 2.03, "vitamin_a_ug": 26, "thiamin_mg": 0.016, "riboflavin_mg": 0.048, "niacin_mg": 0.309, "pantothenic_acid_mg": 0.243, "vitamin_b6_mg": 0, "biotin_ug": 2.65, "folate_ug": 12, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.18, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.01, "omega6_g": 0.07, "id": "ing_38"}, {"ingredient": "paprika, yellow, blanched", "name_ko": "파프리카, 노란색, 데친것", "category": "채소류", "energy_kcal": 25, "moisture_g": 92.4, "protein_g": 0.79, "fat_g": 0.13, "ash_g": 0.47, "carbohydrate_g": 6.21, "sugar_g": 2.76, "total_dietary_fiber_g": 1.2, "calcium_mg": 7, "magnesium_mg": 9, "phosphorus_mg": 25, "potassium_mg": 197, "sodium_mg": 1, "zinc_mg": 0.25, "copper_mg": 0.059, "iron_mg": 0.34, "manganese_mg": 0.137, "selenium_ug": 0.31, "iodine_ug": 0, "vitamin_a_ug": 13, "thiamin_mg": 0.018, "riboflavin_mg": 0.054, "niacin_mg": 0.746, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 34, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 1.62, "vitamin_k_ug": 4.5, "cholesterol_mg": 0, "omega3_g": 0.03, "omega6_g": 0.05, "id": "ing_39"}, {"ingredient": "paprika, red, blanched", "name_ko": "파프리카, 빨간색, 데친것", "category": "채소류", "energy_kcal": 28, "moisture_g": 91.5, "protein_g": 0.92, "fat_g": 0.13, "ash_g": 0.54, "carbohydrate_g": 6.91, "sugar_g": 2.68, "total_dietary_fiber_g": 1.7, "calcium_mg": 8, "magnesium_mg": 10, "phosphorus_mg": 27, "potassium_mg": 222, "sodium_mg": 1, "zinc_mg": 0.31, "copper_mg": 0.055, "iron_mg": 0.32, "manganese_mg": 0.113, "selenium_ug": 0.47, "iodine_ug": 2.37, "vitamin_a_ug": 26, "thiamin_mg": 0, "riboflavin_mg": 0.156, "niacin_mg": 0.898, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 40, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 1.5, "vitamin_k_ug": 8.67, "cholesterol_mg": 0, "omega3_g": 0.03, "omega6_g": 0.05, "id": "ing_40"}, {"ingredient": "paprika, orange, blanched", "name_ko": "파프리카, 주황색, 데친것", "category": "채소류", "energy_kcal": 27, "moisture_g": 91.8, "protein_g": 1.06, "fat_g": 0.12, "ash_g": 0.57, "carbohydrate_g": 6.45, "sugar_g": 5.38, "total_dietary_fiber_g": 1.6, "calcium_mg": 8, "magnesium_mg": 11, "phosphorus_mg": 25, "potassium_mg": 262, "sodium_mg": 0, "zinc_mg": 0.24, "copper_mg": 0.068, "iron_mg": 0.63, "manganese_mg": 0.182, "selenium_ug": 0.32, "iodine_ug": 0, "vitamin_a_ug": 27, "thiamin_mg": 0.017, "riboflavin_mg": 0.1, "niacin_mg": 0.893, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 40, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 2.42, "vitamin_k_ug": 12.44, "cholesterol_mg": 0, "omega3_g": 0.03, "omega6_g": 0.04, "id": "ing_41"}, {"ingredient": "pumpkin, ripe, boiled", "name_ko": "호박, 늙은호박, 삶은것", "category": "채소류", "energy_kcal": 24, "moisture_g": 93.7, "protein_g": 0.6, "fat_g": 0.13, "ash_g": 0.36, "carbohydrate_g": 5.23, "sugar_g": 2.55, "total_dietary_fiber_g": 1.4, "calcium_mg": 20, "magnesium_mg": 4, "phosphorus_mg": 19, "potassium_mg": 139, "sodium_mg": 0, "zinc_mg": 0.1, "copper_mg": 0.001, "iron_mg": 0.06, "manganese_mg": 0.047, "selenium_ug": 0.29, "iodine_ug": 1.01, "vitamin_a_ug": 138, "thiamin_mg": 0, "riboflavin_mg": 0.004, "niacin_mg": 0.744, "pantothenic_acid_mg": 0.192, "vitamin_b6_mg": 0.027, "biotin_ug": 0.25, "folate_ug": 30, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.02, "omega6_g": 0.02, "id": "ing_42"}, {"ingredient": "pumpkin, ripe, steamed", "name_ko": "호박, 늙은호박, 찐것", "category": "채소류", "energy_kcal": 40, "moisture_g": 89.1, "protein_g": 1.09, "fat_g": 0.14, "ash_g": 0.8, "carbohydrate_g": 8.88, "sugar_g": 4.93, "total_dietary_fiber_g": 2.3, "calcium_mg": 21, "magnesium_mg": 10, "phosphorus_mg": 45, "potassium_mg": 313, "sodium_mg": 0, "zinc_mg": 0.24, "copper_mg": 0.033, "iron_mg": 0.87, "manganese_mg": 0.082, "selenium_ug": 1.21, "iodine_ug": 1.31, "vitamin_a_ug": 107, "thiamin_mg": 0.013, "riboflavin_mg": 0.023, "niacin_mg": 0.602, "pantothenic_acid_mg": 0.3, "vitamin_b6_mg": 0.043, "biotin_ug": 0.34, "folate_ug": 28, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.54, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.03, "omega6_g": 0.02, "id": "ing_43"}, {"ingredient": "pumpkin, kabocha squash, steamed", "name_ko": "호박, 단호박, 찐것", "category": "채소류", "energy_kcal": 66, "moisture_g": 81.0, "protein_g": 1.72, "fat_g": 0.84, "ash_g": 0.99, "carbohydrate_g": 15.45, "sugar_g": 7.34, "total_dietary_fiber_g": 5.1, "calcium_mg": 15, "magnesium_mg": 18, "phosphorus_mg": 48, "potassium_mg": 435, "sodium_mg": 0, "zinc_mg": 0.69, "copper_mg": 0.062, "iron_mg": 0.43, "manganese_mg": 0.068, "selenium_ug": 0.9, "iodine_ug": 0, "vitamin_a_ug": 399, "thiamin_mg": 0.043, "riboflavin_mg": 0.186, "niacin_mg": 0.195, "pantothenic_acid_mg": 0.635, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 15, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 2.65, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.11, "omega6_g": 0.21, "id": "ing_44"}, {"ingredient": "pumpkin, young, blanched", "name_ko": "호박, 애호박, 데친것", "category": "채소류", "energy_kcal": 21, "moisture_g": 93.4, "protein_g": 1.05, "fat_g": 0.1, "ash_g": 0.57, "carbohydrate_g": 4.88, "sugar_g": 2.08, "total_dietary_fiber_g": 1.7, "calcium_mg": 18, "magnesium_mg": 15, "phosphorus_mg": 34, "potassium_mg": 212, "sodium_mg": 0, "zinc_mg": 0.11, "copper_mg": 0.026, "iron_mg": 0.24, "manganese_mg": 0.063, "selenium_ug": 0.61, "iodine_ug": 0.1, "vitamin_a_ug": 27, "thiamin_mg": 0.027, "riboflavin_mg": 0.076, "niacin_mg": 0.322, "pantothenic_acid_mg": 0.178, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 51, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.39, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.05, "omega6_g": 0.02, "id": "ing_45"}, {"ingredient": "pumpkin, zucchini, boiled", "name_ko": "호박, 쥬키니, 삶은것", "category": "채소류", "energy_kcal": 12, "moisture_g": 96.2, "protein_g": 0.82, "fat_g": 0.07, "ash_g": 0.36, "carbohydrate_g": 2.52, "sugar_g": 1.35, "total_dietary_fiber_g": 1.0, "calcium_mg": 19, "magnesium_mg": 12, "phosphorus_mg": 23, "potassium_mg": 86, "sodium_mg": 1, "zinc_mg": 0.12, "copper_mg": 0.052, "iron_mg": 0.66, "manganese_mg": 0.047, "selenium_ug": 0.05, "iodine_ug": 0, "vitamin_a_ug": 19, "thiamin_mg": 0.037, "riboflavin_mg": 0.026, "niacin_mg": 0.296, "pantothenic_acid_mg": 0.132, "vitamin_b6_mg": 0.067, "biotin_ug": 1.28, "folate_ug": 7, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.21, "vitamin_k_ug": 10.98, "cholesterol_mg": 0, "omega3_g": 0.03, "omega6_g": 0.02, "id": "ing_46"}, {"ingredient": "mushroom, norugungdengi-beoseot, blanched", "name_ko": "노루궁뎅이버섯, 데친것", "category": "버섯류", "energy_kcal": 18, "moisture_g": 90.9, "protein_g": 3.28, "fat_g": 0.4, "ash_g": 0.72, "carbohydrate_g": 4.68, "sugar_g": 0.12, "total_dietary_fiber_g": 3.4, "calcium_mg": 1, "magnesium_mg": 7, "phosphorus_mg": 75, "potassium_mg": 308, "sodium_mg": 5, "zinc_mg": 1.02, "copper_mg": 0.11, "iron_mg": 0.58, "manganese_mg": 0.06, "selenium_ug": 0.85, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.175, "riboflavin_mg": 0.207, "niacin_mg": 0.183, "pantothenic_acid_mg": 0.67, "vitamin_b6_mg": 0.966, "biotin_ug": 4.05, "folate_ug": 42, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0, "omega6_g": 0.14, "id": "ing_47"}, {"ingredient": "oyster mushroom, blanched", "name_ko": "느타리버섯, 데친것", "category": "버섯류", "energy_kcal": 21, "moisture_g": 89.4, "protein_g": 3.26, "fat_g": 0.23, "ash_g": 0.61, "carbohydrate_g": 6.51, "sugar_g": 0.01, "total_dietary_fiber_g": 3.8, "calcium_mg": 2, "magnesium_mg": 15, "phosphorus_mg": 107, "potassium_mg": 220, "sodium_mg": 3, "zinc_mg": 1.24, "copper_mg": 0.065, "iron_mg": 0.68, "manganese_mg": 0.066, "selenium_ug": 1.36, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.038, "riboflavin_mg": 0.132, "niacin_mg": 2.832, "pantothenic_acid_mg": 0.993, "vitamin_b6_mg": 0.094, "biotin_ug": 8.39, "folate_ug": 37, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0, "omega6_g": 0.14, "id": "ing_48"}, {"ingredient": "wood ear mushroom, blanched", "name_ko": "목이버섯, 데친것", "category": "버섯류", "energy_kcal": 13, "moisture_g": 93.5, "protein_g": 1.15, "fat_g": 0.23, "ash_g": 0.26, "carbohydrate_g": 4.84, "sugar_g": 0, "total_dietary_fiber_g": 3.7, "calcium_mg": 37, "magnesium_mg": 15, "phosphorus_mg": 17, "potassium_mg": 65, "sodium_mg": 11, "zinc_mg": 0.13, "copper_mg": 0, "iron_mg": 0.32, "manganese_mg": 1.455, "selenium_ug": 0.7, "iodine_ug": 1.08, "vitamin_a_ug": 0, "thiamin_mg": 0.108, "riboflavin_mg": 0.049, "niacin_mg": 1.01, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0.023, "biotin_ug": 0, "folate_ug": 15, "vitamin_b12_ug": 0, "vitamin_d_ug": 0.87, "vitamin_e_mg": 0, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0, "omega6_g": 0.05, "id": "ing_49"}, {"ingredient": "pine mushroom, blanched", "name_ko": "송이버섯, 데친것", "category": "버섯류", "energy_kcal": 22, "moisture_g": 88.4, "protein_g": 2.15, "fat_g": 0.24, "ash_g": 0.7, "carbohydrate_g": 8.51, "sugar_g": 1.22, "total_dietary_fiber_g": 5.2, "calcium_mg": 1, "magnesium_mg": 6, "phosphorus_mg": 33, "potassium_mg": 305, "sodium_mg": 1, "zinc_mg": 1.0, "copper_mg": 0.163, "iron_mg": 1.42, "manganese_mg": 0.136, "selenium_ug": 165.69, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.013, "riboflavin_mg": 0.454, "niacin_mg": 2.909, "pantothenic_acid_mg": 0.441, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 10, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.01, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0, "omega6_g": 0.16, "id": "ing_50"}, {"ingredient": "button mushroom, white, blanched", "name_ko": "양송이버섯, 데친것", "category": "버섯류", "energy_kcal": 15, "moisture_g": 92.1, "protein_g": 3.15, "fat_g": 0.26, "ash_g": 0.91, "carbohydrate_g": 3.63, "sugar_g": 0.09, "total_dietary_fiber_g": 2.4, "calcium_mg": 2, "magnesium_mg": 11, "phosphorus_mg": 111, "potassium_mg": 351, "sodium_mg": 5, "zinc_mg": 0.69, "copper_mg": 0.33, "iron_mg": 1.12, "manganese_mg": 0.076, "selenium_ug": 11.85, "iodine_ug": 0.66, "vitamin_a_ug": 0, "thiamin_mg": 0.036, "riboflavin_mg": 0.292, "niacin_mg": 2.764, "pantothenic_acid_mg": 1.133, "vitamin_b6_mg": 0.085, "biotin_ug": 2.62, "folate_ug": 35, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.01, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0, "omega6_g": 0.13, "id": "ing_51"}, {"ingredient": "king oyster mushroom, blanched", "name_ko": "큰느타리버섯, 데친것", "category": "버섯류", "energy_kcal": 21, "moisture_g": 89.1, "protein_g": 3.24, "fat_g": 0.27, "ash_g": 0.72, "carbohydrate_g": 6.64, "sugar_g": 0.06, "total_dietary_fiber_g": 3.6, "calcium_mg": 0, "magnesium_mg": 12, "phosphorus_mg": 91, "potassium_mg": 264, "sodium_mg": 4, "zinc_mg": 0.87, "copper_mg": 0.06, "iron_mg": 0.28, "manganese_mg": 0.072, "selenium_ug": 2.23, "iodine_ug": 0.24, "vitamin_a_ug": 0, "thiamin_mg": 0.023, "riboflavin_mg": 0.147, "niacin_mg": 4.701, "pantothenic_acid_mg": 0.619, "vitamin_b6_mg": 0.107, "biotin_ug": 2.05, "folate_ug": 45, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0, "omega6_g": 0.16, "id": "ing_52"}, {"ingredient": "winter mushroom, blanched", "name_ko": "팽이버섯, 데친것", "category": "버섯류", "energy_kcal": 21, "moisture_g": 89.7, "protein_g": 2.6, "fat_g": 0.46, "ash_g": 0.54, "carbohydrate_g": 6.71, "sugar_g": 0.06, "total_dietary_fiber_g": 4.1, "calcium_mg": 1, "magnesium_mg": 9, "phosphorus_mg": 65, "potassium_mg": 226, "sodium_mg": 2, "zinc_mg": 0.55, "copper_mg": 0.055, "iron_mg": 0.81, "manganese_mg": 0.045, "selenium_ug": 0.87, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.125, "riboflavin_mg": 0.128, "niacin_mg": 1.082, "pantothenic_acid_mg": 0.664, "vitamin_b6_mg": 0.074, "biotin_ug": 3.04, "folate_ug": 50, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.05, "omega6_g": 0.11, "id": "ing_53"}, {"ingredient": "oak mushroom, on the growing medium, blanched", "name_ko": "표고버섯, 배지재배, 데친것", "category": "버섯류", "energy_kcal": 20, "moisture_g": 89.6, "protein_g": 2.49, "fat_g": 0.34, "ash_g": 0.62, "carbohydrate_g": 6.93, "sugar_g": 0.06, "total_dietary_fiber_g": 5.3, "calcium_mg": 3, "magnesium_mg": 13, "phosphorus_mg": 76, "potassium_mg": 227, "sodium_mg": 2, "zinc_mg": 0.63, "copper_mg": 0.051, "iron_mg": 0.33, "manganese_mg": 0.201, "selenium_ug": 0.97, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.088, "riboflavin_mg": 0.155, "niacin_mg": 1.652, "pantothenic_acid_mg": 1.083, "vitamin_b6_mg": 0.142, "biotin_ug": 0.64, "folate_ug": 10, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0, "omega6_g": 0.17, "id": "ing_54"}, {"ingredient": "strawberry, raw", "name_ko": "딸기, 생것", "category": "과일류", "energy_kcal": 33, "moisture_g": 90.6, "protein_g": 0.75, "fat_g": 0.14, "ash_g": 0.4, "carbohydrate_g": 8.15, "sugar_g": 6.14, "total_dietary_fiber_g": 1.5, "calcium_mg": 12, "magnesium_mg": 12, "phosphorus_mg": 28, "potassium_mg": 179, "sodium_mg": 1, "zinc_mg": 0.12, "copper_mg": 0.04, "iron_mg": 0.23, "manganese_mg": 0.223, "selenium_ug": 0.18, "iodine_ug": 0, "vitamin_a_ug": 1, "thiamin_mg": 0.08, "riboflavin_mg": 0.041, "niacin_mg": 0.266, "pantothenic_acid_mg": 0.271, "vitamin_b6_mg": 0.034, "biotin_ug": 0.46, "folate_ug": 55, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.16, "vitamin_k_ug": 3.64, "cholesterol_mg": 0, "omega3_g": 0.03, "omega6_g": 0.04, "id": "ing_55"}, {"ingredient": "apple, raw", "name_ko": "사과, 생것", "category": "과일류", "energy_kcal": 52, "moisture_g": 85.5, "protein_g": 0.26, "fat_g": 0.07, "ash_g": 0.22, "carbohydrate_g": 13.96, "sugar_g": 10.62, "total_dietary_fiber_g": 1.8, "calcium_mg": 3, "magnesium_mg": 4, "phosphorus_mg": 10, "potassium_mg": 116, "sodium_mg": 0, "zinc_mg": 0.04, "copper_mg": 0.018, "iron_mg": 0.11, "manganese_mg": 0.039, "selenium_ug": 0.4, "iodine_ug": 0, "vitamin_a_ug": 1, "thiamin_mg": 0.017, "riboflavin_mg": 0.011, "niacin_mg": 0.3, "pantothenic_acid_mg": 0.038, "vitamin_b6_mg": 0.028, "biotin_ug": 0.13, "folate_ug": 4, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0, "omega6_g": 0.02, "id": "ing_56"}, {"ingredient": "chicken meat, breast, boiled", "name_ko": "닭고기, 가슴, 삶은것", "category": "육류", "energy_kcal": 127, "moisture_g": 70.4, "protein_g": 28.09, "fat_g": 0.93, "ash_g": 1.31, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 4, "magnesium_mg": 33, "phosphorus_mg": 248, "potassium_mg": 324, "sodium_mg": 40, "zinc_mg": 0.73, "copper_mg": 0.008, "iron_mg": 0.34, "manganese_mg": 0.01, "selenium_ug": 12.59, "iodine_ug": 0, "vitamin_a_ug": 8, "thiamin_mg": 0.21, "riboflavin_mg": 0.046, "niacin_mg": 9.356, "pantothenic_acid_mg": 0.39, "vitamin_b6_mg": 0, "biotin_ug": 3.87, "folate_ug": 14, "vitamin_b12_ug": 0.37, "vitamin_d_ug": 0, "vitamin_e_mg": 0.06, "vitamin_k_ug": 0, "cholesterol_mg": 74.54, "omega3_g": 0, "omega6_g": 0.17, "id": "ing_57"}, {"ingredient": "chicken meat, wing, with skin, boiled", "name_ko": "닭고기, 날개, 삶은것", "category": "육류", "energy_kcal": 233, "moisture_g": 64.2, "protein_g": 25.1, "fat_g": 13.54, "ash_g": 0.75, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 33, "magnesium_mg": 18, "phosphorus_mg": 156, "potassium_mg": 155, "sodium_mg": 62, "zinc_mg": 1.51, "copper_mg": 0.024, "iron_mg": 0.72, "manganese_mg": 0.015, "selenium_ug": 13.96, "iodine_ug": 5.28, "vitamin_a_ug": 41, "thiamin_mg": 0.092, "riboflavin_mg": 0.111, "niacin_mg": 4.489, "pantothenic_acid_mg": 0.919, "vitamin_b6_mg": 0, "biotin_ug": 2.72, "folate_ug": 9, "vitamin_b12_ug": 0.44, "vitamin_d_ug": 0, "vitamin_e_mg": 0.15, "vitamin_k_ug": 0, "cholesterol_mg": 119.64, "omega3_g": 0.13, "omega6_g": 2.13, "id": "ing_58"}, {"ingredient": "chicken meat, thigh, with skin, boiled", "name_ko": "닭고기, 넓적다리, 삶은것", "category": "육류", "energy_kcal": 230, "moisture_g": 62.6, "protein_g": 25.14, "fat_g": 13.18, "ash_g": 0.84, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 8, "magnesium_mg": 23, "phosphorus_mg": 178, "potassium_mg": 200, "sodium_mg": 50, "zinc_mg": 2.09, "copper_mg": 0.039, "iron_mg": 0.82, "manganese_mg": 0.016, "selenium_ug": 14.6, "iodine_ug": 0, "vitamin_a_ug": 31, "thiamin_mg": 0.123, "riboflavin_mg": 0.085, "niacin_mg": 3.631, "pantothenic_acid_mg": 0.722, "vitamin_b6_mg": 0, "biotin_ug": 3.25, "folate_ug": 25, "vitamin_b12_ug": 0.26, "vitamin_d_ug": 0, "vitamin_e_mg": 0.99, "vitamin_k_ug": 0, "cholesterol_mg": 113.42, "omega3_g": 0.11, "omega6_g": 2.21, "id": "ing_59"}, {"ingredient": "chicken meat, leg, with skin, boiled", "name_ko": "닭고기, 아랫다리, 삶은것", "category": "육류", "energy_kcal": 189, "moisture_g": 68.3, "protein_g": 24.34, "fat_g": 9.17, "ash_g": 0.88, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 16, "magnesium_mg": 23, "phosphorus_mg": 176, "potassium_mg": 214, "sodium_mg": 76, "zinc_mg": 2.16, "copper_mg": 0.049, "iron_mg": 0.75, "manganese_mg": 0.02, "selenium_ug": 16.7, "iodine_ug": 15.93, "vitamin_a_ug": 25, "thiamin_mg": 0.111, "riboflavin_mg": 0.039, "niacin_mg": 3.749, "pantothenic_acid_mg": 1.365, "vitamin_b6_mg": 0, "biotin_ug": 3.49, "folate_ug": 8, "vitamin_b12_ug": 0.55, "vitamin_d_ug": 0, "vitamin_e_mg": 0.25, "vitamin_k_ug": 0, "cholesterol_mg": 117.69, "omega3_g": 0.08, "omega6_g": 1.44, "id": "ing_60"}, {"ingredient": "chicken edible offal, liver, boiled", "name_ko": "닭 부산물, 간, 삶은것", "category": "육류", "energy_kcal": 165, "moisture_g": 68.0, "protein_g": 22.45, "fat_g": 7.04, "ash_g": 1.51, "carbohydrate_g": 1.0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 9, "magnesium_mg": 24, "phosphorus_mg": 340, "potassium_mg": 152, "sodium_mg": 33, "zinc_mg": 5.98, "copper_mg": 0.422, "iron_mg": 11.3, "manganese_mg": 0.435, "selenium_ug": 71.67, "iodine_ug": 2.59, "vitamin_a_ug": 13.453, "thiamin_mg": 0.244, "riboflavin_mg": 1.934, "niacin_mg": 6.279, "pantothenic_acid_mg": 4.019, "vitamin_b6_mg": 0.049, "biotin_ug": 18.8, "folate_ug": 289, "vitamin_b12_ug": 6.65, "vitamin_d_ug": 0, "vitamin_e_mg": 1.08, "vitamin_k_ug": 38.47, "cholesterol_mg": 522.36, "omega3_g": 0.05, "omega6_g": 1.05, "id": "ing_61"}, {"ingredient": "chicken edible offal, heart, boiled", "name_ko": "닭 부산물, 심장, 삶은것", "category": "육류", "energy_kcal": 178, "moisture_g": 65.7, "protein_g": 23.25, "fat_g": 8.54, "ash_g": 1.49, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 17, "magnesium_mg": 22, "phosphorus_mg": 234, "potassium_mg": 138, "sodium_mg": 55, "zinc_mg": 4.41, "copper_mg": 0.489, "iron_mg": 6.42, "manganese_mg": 0.038, "selenium_ug": 7.8, "iodine_ug": 0, "vitamin_a_ug": 8, "thiamin_mg": 0.077, "riboflavin_mg": 0.828, "niacin_mg": 4.055, "pantothenic_acid_mg": 1.552, "vitamin_b6_mg": 0.071, "biotin_ug": 1.69, "folate_ug": 27, "vitamin_b12_ug": 0.39, "vitamin_d_ug": 0.6, "vitamin_e_mg": 0.54, "vitamin_k_ug": 40.03, "cholesterol_mg": 379.48, "omega3_g": 0.05, "omega6_g": 1.67, "id": "ing_62"}, {"ingredient": "chicken bone broth", "name_ko": "닭뼈 육수", "category": "육류", "energy_kcal": 7, "moisture_g": 98.6, "protein_g": 0.9, "fat_g": 0.4, "ash_g": 0.2, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 1, "magnesium_mg": 1, "phosphorus_mg": 15, "potassium_mg": 60, "sodium_mg": 40, "zinc_mg": 0, "copper_mg": 0.01, "iron_mg": 0.1, "manganese_mg": 0, "selenium_ug": 1, "iodine_ug": 0, "vitamin_a_ug": 1, "thiamin_mg": 0.01, "riboflavin_mg": 0.04, "niacin_mg": 1.1, "pantothenic_acid_mg": 0.31, "vitamin_b6_mg": 0.02, "biotin_ug": 0.5, "folate_ug": 2, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0, "vitamin_k_ug": 2, "cholesterol_mg": 1, "omega3_g": 0.01, "omega6_g": 0.06, "id": "ing_63"}, {"ingredient": "pork meat, shoulder rib, boiled", "name_ko": "돼지고기, 갈비, 삶은것", "category": "육류", "energy_kcal": 296, "moisture_g": 49.9, "protein_g": 26.51, "fat_g": 19.54, "ash_g": 0.65, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 13, "magnesium_mg": 18, "phosphorus_mg": 151, "potassium_mg": 166, "sodium_mg": 45, "zinc_mg": 3.71, "copper_mg": 0.07, "iron_mg": 1.09, "manganese_mg": 0, "selenium_ug": 15.03, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.245, "riboflavin_mg": 0.103, "niacin_mg": 1.656, "pantothenic_acid_mg": 0.404, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 0, "vitamin_b12_ug": 0.95, "vitamin_d_ug": 0, "vitamin_e_mg": 0.07, "vitamin_k_ug": 0, "cholesterol_mg": 103.53, "omega3_g": 0.16, "omega6_g": 1.97, "id": "ing_64"}, {"ingredient": "pork meat, leg, boiled", "name_ko": "돼지고기, 뒷다리, 삶은것", "category": "육류", "energy_kcal": 211, "moisture_g": 60.6, "protein_g": 30.63, "fat_g": 8.7, "ash_g": 1.29, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 7, "magnesium_mg": 25, "phosphorus_mg": 202, "potassium_mg": 271, "sodium_mg": 42, "zinc_mg": 3.25, "copper_mg": 0.07, "iron_mg": 1.01, "manganese_mg": 0, "selenium_ug": 27.7, "iodine_ug": 3.24, "vitamin_a_ug": 2, "thiamin_mg": 0.692, "riboflavin_mg": 0.151, "niacin_mg": 3.261, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 2.49, "folate_ug": 0, "vitamin_b12_ug": 0.35, "vitamin_d_ug": 0.14, "vitamin_e_mg": 0.16, "vitamin_k_ug": 0, "cholesterol_mg": 96.7, "omega3_g": 0.08, "omega6_g": 1.35, "id": "ing_65"}, {"ingredient": "pork meat, loin, boiled", "name_ko": "돼지고기, 등심, 삶은것", "category": "육류", "energy_kcal": 204, "moisture_g": 57.1, "protein_g": 35.08, "fat_g": 5.94, "ash_g": 0.85, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 7, "magnesium_mg": 23, "phosphorus_mg": 200, "potassium_mg": 233, "sodium_mg": 28, "zinc_mg": 2.9, "copper_mg": 0.05, "iron_mg": 0.63, "manganese_mg": 0, "selenium_ug": 24.15, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.565, "riboflavin_mg": 0.36, "niacin_mg": 3.324, "pantothenic_acid_mg": 0.438, "vitamin_b6_mg": 0, "biotin_ug": 1.73, "folate_ug": 0, "vitamin_b12_ug": 0.38, "vitamin_d_ug": 0, "vitamin_e_mg": 0.07, "vitamin_k_ug": 0, "cholesterol_mg": 90.08, "omega3_g": 0.04, "omega6_g": 0.64, "id": "ing_66"}, {"ingredient": "pork meat, shoulder butt, boiled", "name_ko": "돼지고기, 목심, 삶은것", "category": "육류", "energy_kcal": 282, "moisture_g": 54.4, "protein_g": 25.43, "fat_g": 18.56, "ash_g": 1.29, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 10, "magnesium_mg": 20, "phosphorus_mg": 179, "potassium_mg": 248, "sodium_mg": 42, "zinc_mg": 4.11, "copper_mg": 0.087, "iron_mg": 1.15, "manganese_mg": 0.005, "selenium_ug": 27.8, "iodine_ug": 3.17, "vitamin_a_ug": 0, "thiamin_mg": 0.571, "riboflavin_mg": 0.319, "niacin_mg": 2.423, "pantothenic_acid_mg": 0.676, "vitamin_b6_mg": 0, "biotin_ug": 1.41, "folate_ug": 0, "vitamin_b12_ug": 1.35, "vitamin_d_ug": 0.59, "vitamin_e_mg": 0.06, "vitamin_k_ug": 0, "cholesterol_mg": 93.62, "omega3_g": 0.17, "omega6_g": 2.42, "id": "ing_67"}, {"ingredient": "pork meat, shank, boiled", "name_ko": "돼지고기, 사태, 삶은것", "category": "육류", "energy_kcal": 203, "moisture_g": 60.8, "protein_g": 29.14, "fat_g": 8.46, "ash_g": 1.27, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 14, "magnesium_mg": 23, "phosphorus_mg": 178, "potassium_mg": 244, "sodium_mg": 54, "zinc_mg": 4.25, "copper_mg": 0.083, "iron_mg": 1.21, "manganese_mg": 0.004, "selenium_ug": 27.79, "iodine_ug": 1.98, "vitamin_a_ug": 0, "thiamin_mg": 0.559, "riboflavin_mg": 0.298, "niacin_mg": 3.21, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 2.1, "folate_ug": 0, "vitamin_b12_ug": 0.88, "vitamin_d_ug": 0.15, "vitamin_e_mg": 0.07, "vitamin_k_ug": 0, "cholesterol_mg": 99.49, "omega3_g": 0.08, "omega6_g": 1.11, "id": "ing_68"}, {"ingredient": "pork meat, belly side, boiled", "name_ko": "돼지고기, 삼겹살, 삶은것", "category": "육류", "energy_kcal": 427, "moisture_g": 41.8, "protein_g": 19.58, "fat_g": 36.64, "ash_g": 0.58, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 7, "magnesium_mg": 14, "phosphorus_mg": 140, "potassium_mg": 173, "sodium_mg": 40, "zinc_mg": 2.59, "copper_mg": 0.044, "iron_mg": 0.58, "manganese_mg": 0, "selenium_ug": 22.45, "iodine_ug": 24.76, "vitamin_a_ug": 10, "thiamin_mg": 0.43, "riboflavin_mg": 0.264, "niacin_mg": 2.777, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0.71, "folate_ug": 0, "vitamin_b12_ug": 0.77, "vitamin_d_ug": 0.16, "vitamin_e_mg": 0.22, "vitamin_k_ug": 0, "cholesterol_mg": 93.9, "omega3_g": 0.4, "omega6_g": 3.95, "id": "ing_69"}, {"ingredient": "pork meat, tenderloin, boiled", "name_ko": "돼지고기, 안심, 삶은것", "category": "육류", "energy_kcal": 177, "moisture_g": 61.4, "protein_g": 32.32, "fat_g": 4.31, "ash_g": 1.29, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 5, "magnesium_mg": 27, "phosphorus_mg": 217, "potassium_mg": 289, "sodium_mg": 37, "zinc_mg": 3.44, "copper_mg": 0.109, "iron_mg": 1.33, "manganese_mg": 0.007, "selenium_ug": 32.62, "iodine_ug": 1.11, "vitamin_a_ug": 0, "thiamin_mg": 0.855, "riboflavin_mg": 0.35, "niacin_mg": 3.426, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 2.68, "folate_ug": 0, "vitamin_b12_ug": 0.68, "vitamin_d_ug": 0.32, "vitamin_e_mg": 0.13, "vitamin_k_ug": 0, "cholesterol_mg": 111.36, "omega3_g": 0.05, "omega6_g": 0.8, "id": "ing_70"}, {"ingredient": "pork meat, picnic, boiled meat(suyuk), boiled", "name_ko": "돼지고기, 앞다리, 수육용, 삶은것", "category": "육류", "energy_kcal": 310, "moisture_g": 50.8, "protein_g": 27.47, "fat_g": 20.63, "ash_g": 1.22, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 4, "magnesium_mg": 16, "phosphorus_mg": 155, "potassium_mg": 187, "sodium_mg": 36, "zinc_mg": 3.82, "copper_mg": 0.095, "iron_mg": 1.16, "manganese_mg": 0, "selenium_ug": 27.24, "iodine_ug": 0, "vitamin_a_ug": 5, "thiamin_mg": 0.307, "riboflavin_mg": 0.21, "niacin_mg": 3.693, "pantothenic_acid_mg": 0.592, "vitamin_b6_mg": 0, "biotin_ug": 0.91, "folate_ug": 2, "vitamin_b12_ug": 0.28, "vitamin_d_ug": 0.65, "vitamin_e_mg": 1.2, "vitamin_k_ug": 13.69, "cholesterol_mg": 110.54, "omega3_g": 0.23, "omega6_g": 2.77, "id": "ing_71"}, {"ingredient": "pork edible offal, liver, boiled", "name_ko": "돼지 부산물, 간, 삶은것", "category": "육류", "energy_kcal": 173, "moisture_g": 63.4, "protein_g": 28.06, "fat_g": 4.8, "ash_g": 1.37, "carbohydrate_g": 2.41, "sugar_g": 0.55, "total_dietary_fiber_g": 0, "calcium_mg": 8, "magnesium_mg": 19, "phosphorus_mg": 393, "potassium_mg": 198, "sodium_mg": 52, "zinc_mg": 8.54, "copper_mg": 1.04, "iron_mg": 19.4, "manganese_mg": 0.339, "selenium_ug": 82.76, "iodine_ug": 0, "vitamin_a_ug": 5.075, "thiamin_mg": 0.143, "riboflavin_mg": 3.053, "niacin_mg": 11.319, "pantothenic_acid_mg": 2.763, "vitamin_b6_mg": 0.585, "biotin_ug": 1.09, "folate_ug": 686, "vitamin_b12_ug": 19.5, "vitamin_d_ug": 0, "vitamin_e_mg": 0.92, "vitamin_k_ug": 0, "cholesterol_mg": 370.04, "omega3_g": 0.11, "omega6_g": 0.61, "id": "ing_72"}, {"ingredient": "pork edible offal, large intestine, boiled", "name_ko": "돼지 부산물, 대장, 삶은것", "category": "육류", "energy_kcal": 166, "moisture_g": 74.1, "protein_g": 11.7, "fat_g": 13.8, "ash_g": 0.4, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 15, "magnesium_mg": 10, "phosphorus_mg": 93, "potassium_mg": 27, "sodium_mg": 21, "zinc_mg": 1.8, "copper_mg": 0.12, "iron_mg": 1.6, "manganese_mg": 0.03, "selenium_ug": 0, "iodine_ug": 0, "vitamin_a_ug": 8, "thiamin_mg": 0.03, "riboflavin_mg": 0.07, "niacin_mg": 0.1, "pantothenic_acid_mg": 0.27, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 25, "vitamin_b12_ug": 1.0, "vitamin_d_ug": 0.5, "vitamin_e_mg": 0.5, "vitamin_k_ug": 26, "cholesterol_mg": 210, "omega3_g": 0.12, "omega6_g": 1.1, "id": "ing_73"}, {"ingredient": "pork edible offal, small intestine, boiled", "name_ko": "돼지 부산물, 소창(곱창), 삶은것", "category": "육류", "energy_kcal": 217, "moisture_g": 68.1, "protein_g": 15.48, "fat_g": 16.12, "ash_g": 0.65, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 11, "magnesium_mg": 10, "phosphorus_mg": 137, "potassium_mg": 43, "sodium_mg": 32, "zinc_mg": 2.01, "copper_mg": 0.069, "iron_mg": 1.46, "manganese_mg": 0.035, "selenium_ug": 31.6, "iodine_ug": 0, "vitamin_a_ug": 12, "thiamin_mg": 0, "riboflavin_mg": 0.086, "niacin_mg": 0.714, "pantothenic_acid_mg": 0.245, "vitamin_b6_mg": 0.016, "biotin_ug": 0.24, "folate_ug": 8, "vitamin_b12_ug": 0.32, "vitamin_d_ug": 0, "vitamin_e_mg": 0.71, "vitamin_k_ug": 15.94, "cholesterol_mg": 225.97, "omega3_g": 0.07, "omega6_g": 1.06, "id": "ing_74"}, {"ingredient": "pork edible offal, heart, boiled", "name_ko": "돼지 부산물, 심장(염통), 삶은것", "category": "육류", "energy_kcal": 174, "moisture_g": 66.5, "protein_g": 25.58, "fat_g": 7.04, "ash_g": 0.9, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 9, "magnesium_mg": 18, "phosphorus_mg": 208, "potassium_mg": 155, "sodium_mg": 58, "zinc_mg": 2.35, "copper_mg": 0.485, "iron_mg": 6.02, "manganese_mg": 0.011, "selenium_ug": 42.63, "iodine_ug": 0, "vitamin_a_ug": 7, "thiamin_mg": 0.14, "riboflavin_mg": 0.925, "niacin_mg": 3.101, "pantothenic_acid_mg": 1.552, "vitamin_b6_mg": 0.41, "biotin_ug": 0.33, "folate_ug": 4, "vitamin_b12_ug": 0.97, "vitamin_d_ug": 0, "vitamin_e_mg": 1.09, "vitamin_k_ug": 9.83, "cholesterol_mg": 175.55, "omega3_g": 0.07, "omega6_g": 1.01, "id": "ing_75"}, {"ingredient": "pork edible offal, stomach, boiled", "name_ko": "돼지 부산물, 위(오소리감투), 삶은것", "category": "육류", "energy_kcal": 175, "moisture_g": 69.2, "protein_g": 22.36, "fat_g": 8.62, "ash_g": 0.66, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 14, "magnesium_mg": 16, "phosphorus_mg": 160, "potassium_mg": 112, "sodium_mg": 53, "zinc_mg": 2.67, "copper_mg": 0.215, "iron_mg": 1.68, "manganese_mg": 0.05, "selenium_ug": 31.22, "iodine_ug": 0, "vitamin_a_ug": 4, "thiamin_mg": 0.015, "riboflavin_mg": 0.22, "niacin_mg": 1.663, "pantothenic_acid_mg": 0.556, "vitamin_b6_mg": 0.031, "biotin_ug": 0.31, "folate_ug": 14, "vitamin_b12_ug": 0.35, "vitamin_d_ug": 0, "vitamin_e_mg": 0.67, "vitamin_k_ug": 13.03, "cholesterol_mg": 293.48, "omega3_g": 0.04, "omega6_g": 0.73, "id": "ing_76"}, {"ingredient": "pork edible offal, lung, boiled", "name_ko": "돼지 부산물, 허파, 삶은것", "category": "육류", "energy_kcal": 92, "moisture_g": 80.6, "protein_g": 15.56, "fat_g": 2.78, "ash_g": 0.76, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 11, "magnesium_mg": 9, "phosphorus_mg": 172, "potassium_mg": 117, "sodium_mg": 72, "zinc_mg": 1.54, "copper_mg": 0.059, "iron_mg": 7.76, "manganese_mg": 0.004, "selenium_ug": 23.18, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.04, "riboflavin_mg": 0.235, "niacin_mg": 1.782, "pantothenic_acid_mg": 0.268, "vitamin_b6_mg": 0.044, "biotin_ug": 0.27, "folate_ug": 8, "vitamin_b12_ug": 0.52, "vitamin_d_ug": 0, "vitamin_e_mg": 0.48, "vitamin_k_ug": 10.72, "cholesterol_mg": 311.12, "omega3_g": 0.02, "omega6_g": 0.22, "id": "ing_77"}, {"ingredient": "beef meat, imported, chuck, boiled", "name_ko": "소고기, 수입산, 목심(목심살), 삶은것", "category": "육류", "energy_kcal": 359, "moisture_g": 46.32, "protein_g": 26.37, "fat_g": 27.26, "ash_g": 0.87, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 13, "magnesium_mg": 19, "phosphorus_mg": 198, "potassium_mg": 230, "sodium_mg": 64, "zinc_mg": 8.23, "copper_mg": 0.124, "iron_mg": 3.08, "manganese_mg": 0.015, "selenium_ug": 24.5, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.07, "riboflavin_mg": 0.24, "niacin_mg": 2.41, "pantothenic_acid_mg": 0.31, "vitamin_b6_mg": 0.26, "biotin_ug": 0, "folate_ug": 5, "vitamin_b12_ug": 2.27, "vitamin_d_ug": 0.4, "vitamin_e_mg": 0.21, "vitamin_k_ug": 0, "cholesterol_mg": 103, "omega3_g": 0, "omega6_g": 0, "id": "ing_78"}, {"ingredient": "beef meat, hanwoo, loin, boiled", "name_ko": "소고기, 한우, 등심, 삶은것", "category": "육류", "energy_kcal": 357, "moisture_g": 46.5, "protein_g": 25.2, "fat_g": 26.63, "ash_g": 0.72, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 7, "magnesium_mg": 18, "phosphorus_mg": 159, "potassium_mg": 195, "sodium_mg": 33, "zinc_mg": 6.43, "copper_mg": 0.051, "iron_mg": 3.0, "manganese_mg": 0, "selenium_ug": 19.86, "iodine_ug": 1.93, "vitamin_a_ug": 4, "thiamin_mg": 0.009, "riboflavin_mg": 0.057, "niacin_mg": 2.429, "pantothenic_acid_mg": 0.041, "vitamin_b6_mg": 0, "biotin_ug": 2.49, "folate_ug": 0, "vitamin_b12_ug": 1.2, "vitamin_d_ug": 0, "vitamin_e_mg": 0.2, "vitamin_k_ug": 0, "cholesterol_mg": 89.59, "omega3_g": 0.03, "omega6_g": 0.61, "id": "ing_79"}, {"ingredient": "beef meat, hanwoo, brisket, boiled", "name_ko": "소고기, 한우, 양지, 삶은것", "category": "육류", "energy_kcal": 272, "moisture_g": 51.0, "protein_g": 33.09, "fat_g": 14.05, "ash_g": 0.74, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 8, "magnesium_mg": 19, "phosphorus_mg": 162, "potassium_mg": 174, "sodium_mg": 38, "zinc_mg": 7.65, "copper_mg": 0.05, "iron_mg": 2.47, "manganese_mg": 0, "selenium_ug": 22.23, "iodine_ug": 1.1, "vitamin_a_ug": 44, "thiamin_mg": 0.005, "riboflavin_mg": 0.036, "niacin_mg": 2.546, "pantothenic_acid_mg": 0.048, "vitamin_b6_mg": 0, "biotin_ug": 2.84, "folate_ug": 7, "vitamin_b12_ug": 1.52, "vitamin_d_ug": 0, "vitamin_e_mg": 0.37, "vitamin_k_ug": 0, "cholesterol_mg": 100.85, "omega3_g": 0.01, "omega6_g": 0.42, "id": "ing_80"}, {"ingredient": "goat meat, boiled", "name_ko": "염소고기, 삶은것", "category": "육류", "energy_kcal": 251, "moisture_g": 56.0, "protein_g": 29.39, "fat_g": 13.51, "ash_g": 0.77, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 15, "magnesium_mg": 22, "phosphorus_mg": 152, "potassium_mg": 170, "sodium_mg": 39, "zinc_mg": 7.76, "copper_mg": 0.099, "iron_mg": 3.83, "manganese_mg": 0.012, "selenium_ug": 22.95, "iodine_ug": 0, "vitamin_a_ug": 5, "thiamin_mg": 0.034, "riboflavin_mg": 0.335, "niacin_mg": 1.053, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 7, "vitamin_b12_ug": 1.42, "vitamin_d_ug": 0, "vitamin_e_mg": 0.4, "vitamin_k_ug": 0, "cholesterol_mg": 108.49, "omega3_g": 0.05, "omega6_g": 0.42, "id": "ing_81"}, {"ingredient": "egg, whole, boiled", "name_ko": "달걀, 삶은것", "category": "난류", "energy_kcal": 145, "moisture_g": 75.6, "protein_g": 13.49, "fat_g": 8.69, "ash_g": 0.91, "carbohydrate_g": 1.37, "sugar_g": 0.13, "total_dietary_fiber_g": 0, "calcium_mg": 52, "magnesium_mg": 11, "phosphorus_mg": 193, "potassium_mg": 115, "sodium_mg": 128, "zinc_mg": 1.58, "copper_mg": 0.037, "iron_mg": 2.01, "manganese_mg": 0.044, "selenium_ug": 35.79, "iodine_ug": 53.38, "vitamin_a_ug": 67, "thiamin_mg": 0.071, "riboflavin_mg": 0.247, "niacin_mg": 0.04, "pantothenic_acid_mg": 1.727, "vitamin_b6_mg": 0.098, "biotin_ug": 13.57, "folate_ug": 67, "vitamin_b12_ug": 1.13, "vitamin_d_ug": 1.07, "vitamin_e_mg": 1.75, "vitamin_k_ug": 10.39, "cholesterol_mg": 267.18, "omega3_g": 0.11, "omega6_g": 1.13, "id": "ing_82"}, {"ingredient": "egg, white, boiled", "name_ko": "달걀, 난백, 삶은것", "category": "난류", "energy_kcal": 51, "moisture_g": 87.6, "protein_g": 11.63, "fat_g": 0.01, "ash_g": 0.55, "carbohydrate_g": 0.22, "sugar_g": 0.12, "total_dietary_fiber_g": 0, "calcium_mg": 9, "magnesium_mg": 12, "phosphorus_mg": 18, "potassium_mg": 106, "sodium_mg": 145, "zinc_mg": 0.03, "copper_mg": 0, "iron_mg": 0.07, "manganese_mg": 0, "selenium_ug": 21.96, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0, "riboflavin_mg": 0.19, "niacin_mg": 0.043, "pantothenic_acid_mg": 0.084, "vitamin_b6_mg": 0.006, "biotin_ug": 1.64, "folate_ug": 0, "vitamin_b12_ug": 0.07, "vitamin_d_ug": 0, "vitamin_e_mg": 0, "vitamin_k_ug": 0, "cholesterol_mg": 0.11, "omega3_g": 0, "omega6_g": 0, "id": "ing_83"}, {"ingredient": "egg, yolk, boiled", "name_ko": "달걀, 난황, 삶은것", "category": "난류", "energy_kcal": 379, "moisture_g": 48.2, "protein_g": 16.46, "fat_g": 32.16, "ash_g": 1.76, "carbohydrate_g": 1.37, "sugar_g": 0.04, "total_dietary_fiber_g": 0, "calcium_mg": 157, "magnesium_mg": 12, "phosphorus_mg": 616, "potassium_mg": 95, "sodium_mg": 47, "zinc_mg": 4.38, "copper_mg": 0.153, "iron_mg": 7.5, "manganese_mg": 0.17, "selenium_ug": 75.03, "iodine_ug": 55.88, "vitamin_a_ug": 263, "thiamin_mg": 0.239, "riboflavin_mg": 0.386, "niacin_mg": 0.022, "pantothenic_acid_mg": 4.932, "vitamin_b6_mg": 0.368, "biotin_ug": 69.76, "folate_ug": 229, "vitamin_b12_ug": 3.13, "vitamin_d_ug": 3.71, "vitamin_e_mg": 3.61, "vitamin_k_ug": 35.54, "cholesterol_mg": 782.59, "omega3_g": 0.29, "omega6_g": 3.7, "id": "ing_84"}, {"ingredient": "egg, quail, boiled", "name_ko": "메추리알, 삶은것", "category": "난류", "energy_kcal": 155, "moisture_g": 74.8, "protein_g": 12.48, "fat_g": 10.12, "ash_g": 0.9, "carbohydrate_g": 1.67, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 61, "magnesium_mg": 10, "phosphorus_mg": 219, "potassium_mg": 107, "sodium_mg": 94, "zinc_mg": 1.69, "copper_mg": 0.064, "iron_mg": 2.63, "manganese_mg": 0.041, "selenium_ug": 35.79, "iodine_ug": 172.55, "vitamin_a_ug": 190, "thiamin_mg": 0.172, "riboflavin_mg": 0.31, "niacin_mg": 0.129, "pantothenic_acid_mg": 2.123, "vitamin_b6_mg": 0.064, "biotin_ug": 11.59, "folate_ug": 92, "vitamin_b12_ug": 3.79, "vitamin_d_ug": 2.23, "vitamin_e_mg": 0.8, "vitamin_k_ug": 14.57, "cholesterol_mg": 367.02, "omega3_g": 0.1, "omega6_g": 1.15, "id": "ing_85"}, {"ingredient": "egg, quail, white, boiled", "name_ko": "메추리알, 난백, 삶은것", "category": "난류", "energy_kcal": 50, "moisture_g": 88.6, "protein_g": 11.35, "fat_g": 0.1, "ash_g": 0.29, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 8, "magnesium_mg": 6, "phosphorus_mg": 13, "potassium_mg": 59, "sodium_mg": 71, "zinc_mg": 0.04, "copper_mg": 0.027, "iron_mg": 0.05, "manganese_mg": 0, "selenium_ug": 12.69, "iodine_ug": 5.88, "vitamin_a_ug": 0, "thiamin_mg": 0.065, "riboflavin_mg": 0.089, "niacin_mg": 0.022, "pantothenic_acid_mg": 0.29, "vitamin_b6_mg": 0.02, "biotin_ug": 20.72, "folate_ug": 8, "vitamin_b12_ug": 0.86, "vitamin_d_ug": 0, "vitamin_e_mg": 0, "vitamin_k_ug": 0, "cholesterol_mg": 0.4, "omega3_g": 0, "omega6_g": 0, "id": "ing_86"}, {"ingredient": "egg, quail, yolk, boiled", "name_ko": "메추리알, 난황, 삶은것", "category": "난류", "energy_kcal": 360, "moisture_g": 50.8, "protein_g": 15.44, "fat_g": 30.58, "ash_g": 1.77, "carbohydrate_g": 1.39, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 157, "magnesium_mg": 12, "phosphorus_mg": 580, "potassium_mg": 98, "sodium_mg": 51, "zinc_mg": 4.51, "copper_mg": 0.133, "iron_mg": 7.6, "manganese_mg": 0.1, "selenium_ug": 65.07, "iodine_ug": 324.74, "vitamin_a_ug": 702, "thiamin_mg": 0.496, "riboflavin_mg": 0.39, "niacin_mg": 0.019, "pantothenic_acid_mg": 3.93, "vitamin_b6_mg": 0.149, "biotin_ug": 12.28, "folate_ug": 229, "vitamin_b12_ug": 12.45, "vitamin_d_ug": 5.0, "vitamin_e_mg": 1.34, "vitamin_k_ug": 42.75, "cholesterol_mg": 743.17, "omega3_g": 0.2, "omega6_g": 2.31, "id": "ing_87"}, {"ingredient": "egg, duck, boiled", "name_ko": "오리알, 삶은것", "category": "난류", "energy_kcal": 183, "moisture_g": 70.8, "protein_g": 13.39, "fat_g": 12.4, "ash_g": 1.02, "carbohydrate_g": 2.41, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 60, "magnesium_mg": 12, "phosphorus_mg": 221, "potassium_mg": 100, "sodium_mg": 108, "zinc_mg": 1.43, "copper_mg": 0.096, "iron_mg": 2.76, "manganese_mg": 0.021, "selenium_ug": 27.84, "iodine_ug": 33.0, "vitamin_a_ug": 99, "thiamin_mg": 0.108, "riboflavin_mg": 0.203, "niacin_mg": 0.016, "pantothenic_acid_mg": 0.488, "vitamin_b6_mg": 0.215, "biotin_ug": 17.33, "folate_ug": 73, "vitamin_b12_ug": 1.85, "vitamin_d_ug": 8.82, "vitamin_e_mg": 1.93, "vitamin_k_ug": 23.48, "cholesterol_mg": 411.77, "omega3_g": 0.6, "omega6_g": 1.34, "id": "ing_88"}, {"ingredient": "egg, duck, white, boiled", "name_ko": "오리알, 난백, 삶은것", "category": "난류", "energy_kcal": 58, "moisture_g": 85.8, "protein_g": 11.51, "fat_g": 0.08, "ash_g": 0.55, "carbohydrate_g": 2.05, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 8, "magnesium_mg": 13, "phosphorus_mg": 14, "potassium_mg": 103, "sodium_mg": 145, "zinc_mg": 0.05, "copper_mg": 0.08, "iron_mg": 0.01, "manganese_mg": 0, "selenium_ug": 15.9, "iodine_ug": 0.96, "vitamin_a_ug": 0, "thiamin_mg": 0.052, "riboflavin_mg": 0.019, "niacin_mg": 0.018, "pantothenic_acid_mg": 0.045, "vitamin_b6_mg": 0.008, "biotin_ug": 0.92, "folate_ug": 0, "vitamin_b12_ug": 0.52, "vitamin_d_ug": 0, "vitamin_e_mg": 0, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0, "omega6_g": 0, "id": "ing_89"}, {"ingredient": "egg, duck, yolk, boiled", "name_ko": "오리알, 난황, 삶은것", "category": "난류", "energy_kcal": 375, "moisture_g": 47.8, "protein_g": 16.25, "fat_g": 31.22, "ash_g": 1.76, "carbohydrate_g": 2.97, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 141, "magnesium_mg": 11, "phosphorus_mg": 537, "potassium_mg": 94, "sodium_mg": 51, "zinc_mg": 3.54, "copper_mg": 0.121, "iron_mg": 6.97, "manganese_mg": 0.053, "selenium_ug": 46.09, "iodine_ug": 81.97, "vitamin_a_ug": 249, "thiamin_mg": 0.194, "riboflavin_mg": 0.485, "niacin_mg": 0.013, "pantothenic_acid_mg": 1.166, "vitamin_b6_mg": 0.531, "biotin_ug": 42.39, "folate_ug": 185, "vitamin_b12_ug": 3.89, "vitamin_d_ug": 22.3, "vitamin_e_mg": 4.87, "vitamin_k_ug": 59.36, "cholesterol_mg": 1040, "omega3_g": 1.51, "omega6_g": 3.39, "id": "ing_90"}, {"ingredient": "mackerel, boiled", "name_ko": "고등어, 삶은것", "category": "어류", "energy_kcal": 253, "moisture_g": 57.4, "protein_g": 22.6, "fat_g": 22.6, "ash_g": 1.0, "carbohydrate_g": 0.3, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 7, "magnesium_mg": 29, "phosphorus_mg": 210, "potassium_mg": 280, "sodium_mg": 94, "zinc_mg": 1.1, "copper_mg": 0.14, "iron_mg": 1.3, "manganese_mg": 0.01, "selenium_ug": 66, "iodine_ug": 23, "vitamin_a_ug": 31, "thiamin_mg": 0.25, "riboflavin_mg": 0.3, "niacin_mg": 11.0, "pantothenic_acid_mg": 0.75, "vitamin_b6_mg": 0.48, "biotin_ug": 8.5, "folate_ug": 13, "vitamin_b12_ug": 19.0, "vitamin_d_ug": 4.3, "vitamin_e_mg": 2.0, "vitamin_k_ug": 0, "cholesterol_mg": 80, "omega3_g": 3.04, "omega6_g": 0.6, "id": "ing_91"}, {"ingredient": "pacific saury, roasted", "name_ko": "꽁치, 구운것", "category": "어류", "energy_kcal": 281, "moisture_g": 53.2, "protein_g": 23.3, "fat_g": 22.8, "ash_g": 1.2, "carbohydrate_g": 0.2, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 37, "magnesium_mg": 30, "phosphorus_mg": 220, "potassium_mg": 260, "sodium_mg": 130, "zinc_mg": 0.9, "copper_mg": 0.15, "iron_mg": 1.7, "manganese_mg": 0.03, "selenium_ug": 45, "iodine_ug": 25, "vitamin_a_ug": 11, "thiamin_mg": 0, "riboflavin_mg": 0.3, "niacin_mg": 9.8, "pantothenic_acid_mg": 0.93, "vitamin_b6_mg": 0.42, "biotin_ug": 9.4, "folate_ug": 17, "vitamin_b12_ug": 16.0, "vitamin_d_ug": 13.0, "vitamin_e_mg": 1.0, "vitamin_k_ug": 0, "cholesterol_mg": 72, "omega3_g": 4.95, "omega6_g": 0.48, "id": "ing_92"}, {"ingredient": "pacific cod, roasted", "name_ko": "대구, 구운것", "category": "어류", "energy_kcal": 103, "moisture_g": 72.8, "protein_g": 25.2, "fat_g": 0.2, "ash_g": 1.6, "carbohydrate_g": 0.2, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 48, "magnesium_mg": 33, "phosphorus_mg": 280, "potassium_mg": 480, "sodium_mg": 140, "zinc_mg": 0.9, "copper_mg": 0.05, "iron_mg": 0.4, "manganese_mg": 0.02, "selenium_ug": 0, "iodine_ug": 0, "vitamin_a_ug": 9, "thiamin_mg": 0.09, "riboflavin_mg": 0.12, "niacin_mg": 1.4, "pantothenic_acid_mg": 0.53, "vitamin_b6_mg": 0.09, "biotin_ug": 0, "folate_ug": 7, "vitamin_b12_ug": 3.9, "vitamin_d_ug": 0.7, "vitamin_e_mg": 1.3, "vitamin_k_ug": 0, "cholesterol_mg": 100, "omega3_g": 0.1, "omega6_g": 0.01, "id": "ing_93"}, {"ingredient": "anchovy, large, boiled and dried", "name_ko": "멸치, 대멸치, 삶아서 말린것", "category": "어류", "energy_kcal": 302, "moisture_g": 19.2, "protein_g": 59.31, "fat_g": 5.45, "ash_g": 16.71, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 2.088, "magnesium_mg": 226, "phosphorus_mg": 1.726, "potassium_mg": 1.045, "sodium_mg": 2.18, "zinc_mg": 6.26, "copper_mg": 0.22, "iron_mg": 12.26, "manganese_mg": 1.33, "selenium_ug": 0.68, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0.12, "riboflavin_mg": 0.11, "niacin_mg": 0, "pantothenic_acid_mg": 0.445, "vitamin_b6_mg": 0, "biotin_ug": 79.96, "folate_ug": 98, "vitamin_b12_ug": 25.44, "vitamin_d_ug": 1.28, "vitamin_e_mg": 0.08, "vitamin_k_ug": 0, "cholesterol_mg": 667.98, "omega3_g": 1.39, "omega6_g": 0.05, "id": "ing_94"}, {"ingredient": "anchovy, medium, boiled and dried", "name_ko": "멸치, 중멸치, 삶아서 말린것", "category": "어류", "energy_kcal": 245, "moisture_g": 31.8, "protein_g": 49.69, "fat_g": 3.3, "ash_g": 14.14, "carbohydrate_g": 1.07, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 2.486, "magnesium_mg": 304, "phosphorus_mg": 1.867, "potassium_mg": 770, "sodium_mg": 2.377, "zinc_mg": 4.64, "copper_mg": 0.252, "iron_mg": 12.0, "manganese_mg": 3.039, "selenium_ug": 102.65, "iodine_ug": 88.75, "vitamin_a_ug": 0, "thiamin_mg": 0.138, "riboflavin_mg": 0.153, "niacin_mg": 2.486, "pantothenic_acid_mg": 0.57, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 10, "vitamin_b12_ug": 24.17, "vitamin_d_ug": 4.13, "vitamin_e_mg": 0.31, "vitamin_k_ug": 0, "cholesterol_mg": 497.29, "omega3_g": 1.18, "omega6_g": 0.03, "id": "ing_95"}, {"ingredient": "anchovy, small, boiled and dried", "name_ko": "멸치, 잔멸치, 삶아서 말린것", "category": "어류", "energy_kcal": 226, "moisture_g": 41.6, "protein_g": 42.94, "fat_g": 4.59, "ash_g": 10.55, "carbohydrate_g": 0.32, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 620, "magnesium_mg": 338, "phosphorus_mg": 816, "potassium_mg": 531, "sodium_mg": 2.646, "zinc_mg": 4.86, "copper_mg": 0.061, "iron_mg": 0.91, "manganese_mg": 0.198, "selenium_ug": 111.2, "iodine_ug": 54.94, "vitamin_a_ug": 0, "thiamin_mg": 0.022, "riboflavin_mg": 0.096, "niacin_mg": 2.652, "pantothenic_acid_mg": 0.314, "vitamin_b6_mg": 0, "biotin_ug": 35.07, "folate_ug": 102, "vitamin_b12_ug": 6.45, "vitamin_d_ug": 17.22, "vitamin_e_mg": 0.02, "vitamin_k_ug": 0, "cholesterol_mg": 433.88, "omega3_g": 2.54, "omega6_g": 0.05, "id": "ing_96"}, {"ingredient": "anchovy, broth", "name_ko": "멸치 육수", "category": "어류", "energy_kcal": 1, "moisture_g": 99.5, "protein_g": 0.14, "fat_g": 0.01, "ash_g": 0.14, "carbohydrate_g": 0.19, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 2, "magnesium_mg": 3, "phosphorus_mg": 11, "potassium_mg": 29, "sodium_mg": 52, "zinc_mg": 0.18, "copper_mg": 0, "iron_mg": 0.49, "manganese_mg": 0.015, "selenium_ug": 2.01, "iodine_ug": 4.37, "vitamin_a_ug": 0, "thiamin_mg": 0, "riboflavin_mg": 0.006, "niacin_mg": 0.249, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0.12, "folate_ug": 0, "vitamin_b12_ug": 0.45, "vitamin_d_ug": 0, "vitamin_e_mg": 0, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0, "omega6_g": 0, "id": "ing_97"}, {"ingredient": "alaska pollock, roasted", "name_ko": "명태, 구운것", "category": "어류", "energy_kcal": 111, "moisture_g": 73.65, "protein_g": 23.48, "fat_g": 1.18, "ash_g": 1.7, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 72, "magnesium_mg": 81, "phosphorus_mg": 267, "potassium_mg": 430, "sodium_mg": 419, "zinc_mg": 0.57, "copper_mg": 0.06, "iron_mg": 0.56, "manganese_mg": 0.018, "selenium_ug": 44.1, "iodine_ug": 0, "vitamin_a_ug": 17, "thiamin_mg": 0.054, "riboflavin_mg": 0.223, "niacin_mg": 3.949, "pantothenic_acid_mg": 0.432, "vitamin_b6_mg": 0.329, "biotin_ug": 0, "folate_ug": 3, "vitamin_b12_ug": 3.66, "vitamin_d_ug": 1.3, "vitamin_e_mg": 0.28, "vitamin_k_ug": 0, "cholesterol_mg": 86, "omega3_g": 0, "omega6_g": 0, "id": "ing_98"}, {"ingredient": "spanish mackerel, roasted", "name_ko": "삼치, 구운것", "category": "어류", "energy_kcal": 184, "moisture_g": 63.8, "protein_g": 23.6, "fat_g": 10.8, "ash_g": 1.7, "carbohydrate_g": 0.1, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 22, "magnesium_mg": 36, "phosphorus_mg": 310, "potassium_mg": 610, "sodium_mg": 90, "zinc_mg": 1.1, "copper_mg": 0.05, "iron_mg": 0.9, "manganese_mg": 0.01, "selenium_ug": 0, "iodine_ug": 0, "vitamin_a_ug": 16, "thiamin_mg": 0.09, "riboflavin_mg": 0.34, "niacin_mg": 12.0, "pantothenic_acid_mg": 1.12, "vitamin_b6_mg": 0.29, "biotin_ug": 0, "folate_ug": 8, "vitamin_b12_ug": 5.3, "vitamin_d_ug": 12.0, "vitamin_e_mg": 1.1, "vitamin_k_ug": 0, "cholesterol_mg": 87, "omega3_g": 1.84, "omega6_g": 0.34, "id": "ing_99"}, {"ingredient": "sockeye salmon, roasted", "name_ko": "연어, 홍연어, 구운것", "category": "어류", "energy_kcal": 163, "moisture_g": 63.4, "protein_g": 28.5, "fat_g": 6.0, "ash_g": 2.0, "carbohydrate_g": 0.1, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 16, "magnesium_mg": 39, "phosphorus_mg": 340, "potassium_mg": 490, "sodium_mg": 72, "zinc_mg": 0.7, "copper_mg": 0.08, "iron_mg": 0.5, "manganese_mg": 0.01, "selenium_ug": 0, "iodine_ug": 0, "vitamin_a_ug": 35, "thiamin_mg": 0.27, "riboflavin_mg": 0.22, "niacin_mg": 7.2, "pantothenic_acid_mg": 1.49, "vitamin_b6_mg": 0.39, "biotin_ug": 0, "folate_ug": 15, "vitamin_b12_ug": 3.8, "vitamin_d_ug": 38.0, "vitamin_e_mg": 1.8, "vitamin_k_ug": 0, "cholesterol_mg": 76, "omega3_g": 1.16, "omega6_g": 0.14, "id": "ing_100"}, {"ingredient": "sardine, boiled", "name_ko": "정어리, 삶은것", "category": "어류", "energy_kcal": 182, "moisture_g": 61.7, "protein_g": 22.4, "fat_g": 8.7, "ash_g": 1.3, "carbohydrate_g": 0.2, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 82, "magnesium_mg": 32, "phosphorus_mg": 250, "potassium_mg": 280, "sodium_mg": 80, "zinc_mg": 1.7, "copper_mg": 0.23, "iron_mg": 2.3, "manganese_mg": 0.06, "selenium_ug": 0, "iodine_ug": 0, "vitamin_a_ug": 5, "thiamin_mg": 0.05, "riboflavin_mg": 0.29, "niacin_mg": 6.3, "pantothenic_acid_mg": 0.87, "vitamin_b6_mg": 0.35, "biotin_ug": 0, "folate_ug": 7, "vitamin_b12_ug": 18.0, "vitamin_d_ug": 13.0, "vitamin_e_mg": 1.3, "vitamin_k_ug": 0, "cholesterol_mg": 68, "omega3_g": 2.02, "omega6_g": 0.27, "id": "ing_101"}, {"ingredient": "sardine, roasted", "name_ko": "정어리, 구운것", "category": "어류", "energy_kcal": 199, "moisture_g": 57.8, "protein_g": 25.3, "fat_g": 9.4, "ash_g": 1.6, "carbohydrate_g": 0.2, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 98, "magnesium_mg": 36, "phosphorus_mg": 300, "potassium_mg": 350, "sodium_mg": 100, "zinc_mg": 2.3, "copper_mg": 0.23, "iron_mg": 2.5, "manganese_mg": 0.08, "selenium_ug": 0, "iodine_ug": 0, "vitamin_a_ug": 8, "thiamin_mg": 0.12, "riboflavin_mg": 0.43, "niacin_mg": 9.1, "pantothenic_acid_mg": 1.33, "vitamin_b6_mg": 0.39, "biotin_ug": 0, "folate_ug": 12, "vitamin_b12_ug": 22.0, "vitamin_d_ug": 14.0, "vitamin_e_mg": 1.9, "vitamin_k_ug": 0, "cholesterol_mg": 80, "omega3_g": 2.23, "omega6_g": 0.29, "id": "ing_102"}, {"ingredient": "chicken fat", "name_ko": "닭기름", "category": "유지류", "energy_kcal": 900, "moisture_g": 0.2, "protein_g": 0, "fat_g": 99.8, "ash_g": 0, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 0, "magnesium_mg": 0, "phosphorus_mg": 0, "potassium_mg": 0, "sodium_mg": 0, "zinc_mg": 0, "copper_mg": 0, "iron_mg": 0, "manganese_mg": 0, "selenium_ug": 0.2, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0, "riboflavin_mg": 0, "niacin_mg": 0, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 0, "vitamin_b12_ug": 0, "vitamin_d_ug": 4.8, "vitamin_e_mg": 2.7, "vitamin_k_ug": 0, "cholesterol_mg": 85, "omega3_g": 0, "omega6_g": 0, "id": "ing_103"}, {"ingredient": "lard", "name_ko": "돼지기름", "category": "유지류", "energy_kcal": 915, "moisture_g": 0, "protein_g": 0, "fat_g": 99.38, "ash_g": 0.05, "carbohydrate_g": 0.58, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 0, "magnesium_mg": 0, "phosphorus_mg": 0, "potassium_mg": 23, "sodium_mg": 17, "zinc_mg": 0.15, "copper_mg": 0, "iron_mg": 0, "manganese_mg": 0, "selenium_ug": 2.58, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0, "riboflavin_mg": 0, "niacin_mg": 0, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 0, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 2.12, "vitamin_k_ug": 13.12, "cholesterol_mg": 49.19, "omega3_g": 0.86, "omega6_g": 13.42, "id": "ing_104"}, {"ingredient": "perilla seed oil", "name_ko": "들기름", "category": "유지류", "energy_kcal": 920, "moisture_g": 0, "protein_g": 0, "fat_g": 99.92, "ash_g": 0, "carbohydrate_g": 0.08, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 0, "magnesium_mg": 0, "phosphorus_mg": 0, "potassium_mg": 0, "sodium_mg": 0, "zinc_mg": 0, "copper_mg": 0, "iron_mg": 0, "manganese_mg": 0, "selenium_ug": 0, "iodine_ug": 0, "vitamin_a_ug": 2, "thiamin_mg": 0, "riboflavin_mg": 0.013, "niacin_mg": 0, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 0, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 8.48, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 57.92, "omega6_g": 14.34, "id": "ing_105"}, {"ingredient": "salmon oil", "name_ko": "연어기름", "category": "유지류", "energy_kcal": 902, "moisture_g": 0, "protein_g": 0, "fat_g": 100.0, "ash_g": 0, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 0, "magnesium_mg": 0, "phosphorus_mg": 0, "potassium_mg": 0, "sodium_mg": 0, "zinc_mg": 0, "copper_mg": 0, "iron_mg": 0, "manganese_mg": 0, "selenium_ug": 0, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0, "riboflavin_mg": 0, "niacin_mg": 0, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 0, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0, "vitamin_k_ug": 0, "cholesterol_mg": 485, "omega3_g": 0, "omega6_g": 0, "id": "ing_106"}, {"ingredient": "corn oil", "name_ko": "옥수수기름", "category": "유지류", "energy_kcal": 919, "moisture_g": 0, "protein_g": 0, "fat_g": 99.74, "ash_g": 0.09, "carbohydrate_g": 0.17, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 0, "magnesium_mg": 0, "phosphorus_mg": 0, "potassium_mg": 0, "sodium_mg": 25, "zinc_mg": 0, "copper_mg": 0, "iron_mg": 0.57, "manganese_mg": 0, "selenium_ug": 0, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0, "riboflavin_mg": 0, "niacin_mg": 0, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 0, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 3.48, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 1.04, "omega6_g": 51.64, "id": "ing_107"}, {"ingredient": "olive oil", "name_ko": "올리브유", "category": "유지류", "energy_kcal": 921, "moisture_g": 0, "protein_g": 0, "fat_g": 100.0, "ash_g": 0, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 0, "magnesium_mg": 0, "phosphorus_mg": 0, "potassium_mg": 0, "sodium_mg": 0, "zinc_mg": 0, "copper_mg": 0, "iron_mg": 0, "manganese_mg": 0, "selenium_ug": 0, "iodine_ug": 0, "vitamin_a_ug": 6, "thiamin_mg": 0, "riboflavin_mg": 0, "niacin_mg": 0, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 0, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 10.37, "vitamin_k_ug": 42.42, "cholesterol_mg": 0, "omega3_g": 0.66, "omega6_g": 6.82, "id": "ing_108"}, {"ingredient": "sesame oil", "name_ko": "참기름", "category": "유지류", "energy_kcal": 920, "moisture_g": 0, "protein_g": 0, "fat_g": 99.84, "ash_g": 0.03, "carbohydrate_g": 0.13, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 0, "magnesium_mg": 0, "phosphorus_mg": 0, "potassium_mg": 0, "sodium_mg": 0, "zinc_mg": 0, "copper_mg": 0, "iron_mg": 0, "manganese_mg": 0, "selenium_ug": 0, "iodine_ug": 0, "vitamin_a_ug": 1, "thiamin_mg": 0, "riboflavin_mg": 0.014, "niacin_mg": 0, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 0, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 4.25, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0.38, "omega6_g": 40.7, "id": "ing_109"}, {"ingredient": "coconut oil", "name_ko": "코코넛유", "category": "유지류", "energy_kcal": 918, "moisture_g": 0, "protein_g": 0, "fat_g": 99.67, "ash_g": 0, "carbohydrate_g": 0.33, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 13, "magnesium_mg": 0, "phosphorus_mg": 0, "potassium_mg": 30, "sodium_mg": 18, "zinc_mg": 1.32, "copper_mg": 0, "iron_mg": 0, "manganese_mg": 0, "selenium_ug": 2.52, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0, "riboflavin_mg": 0, "niacin_mg": 0, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 0, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0.26, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0, "omega6_g": 0.65, "id": "ing_110"}, {"ingredient": "soybean oil", "name_ko": "콩기름", "category": "유지류", "energy_kcal": 921, "moisture_g": 0, "protein_g": 0, "fat_g": 99.96, "ash_g": 0, "carbohydrate_g": 0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 0, "magnesium_mg": 0, "phosphorus_mg": 0, "potassium_mg": 0, "sodium_mg": 0, "zinc_mg": 0, "copper_mg": 0, "iron_mg": 0, "manganese_mg": 0, "selenium_ug": 0, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0, "riboflavin_mg": 0, "niacin_mg": 0, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 0, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 11.78, "vitamin_k_ug": 105.16, "cholesterol_mg": 0, "omega3_g": 5.65, "omega6_g": 50.75, "id": "ing_111"}, {"ingredient": "grape seed oil", "name_ko": "포도씨유", "category": "유지류", "energy_kcal": 920, "moisture_g": 0, "protein_g": 0, "fat_g": 99.93, "ash_g": 0.06, "carbohydrate_g": 0.01, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 0, "magnesium_mg": 0, "phosphorus_mg": 0, "potassium_mg": 0, "sodium_mg": 1, "zinc_mg": 0, "copper_mg": 0.038, "iron_mg": 0.09, "manganese_mg": 0, "selenium_ug": 0, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0, "riboflavin_mg": 0, "niacin_mg": 0, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 0, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 22.03, "vitamin_k_ug": 133.19, "cholesterol_mg": 0, "omega3_g": 0.36, "omega6_g": 69.5, "id": "ing_112"}, {"ingredient": "sunflower oil", "name_ko": "해바라기유", "category": "유지류", "energy_kcal": 918, "moisture_g": 0, "protein_g": 0, "fat_g": 99.68, "ash_g": 0.02, "carbohydrate_g": 0.28, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 0, "magnesium_mg": 0, "phosphorus_mg": 0, "potassium_mg": 9, "sodium_mg": 2, "zinc_mg": 1.09, "copper_mg": 0, "iron_mg": 0, "manganese_mg": 0, "selenium_ug": 0.67, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0, "riboflavin_mg": 0, "niacin_mg": 0, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 0, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 30.01, "vitamin_k_ug": 9.65, "cholesterol_mg": 0, "omega3_g": 0.34, "omega6_g": 57.24, "id": "ing_113"}, {"id": "supp_eggshell", "ingredient": "eggshell powder, calcium supplement", "name_ko": "난각분말 (계란껍질 칼슘보충제)", "category": "보충제/기타", "energy_kcal": 15, "moisture_g": 1.0, "protein_g": 3.0, "fat_g": 0.1, "ash_g": 95.0, "carbohydrate_g": 0.9, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 38000, "magnesium_mg": 350, "phosphorus_mg": 120, "potassium_mg": 40, "sodium_mg": 50, "zinc_mg": 0.5, "copper_mg": 0.05, "iron_mg": 2.0, "manganese_mg": 0.1, "selenium_ug": 1.0, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0, "riboflavin_mg": 0, "niacin_mg": 0, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 0, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0, "omega6_g": 0}, {"id": "supp_dicalcium", "ingredient": "dicalcium phosphate, supplement", "name_ko": "제2인산칼슘 (칼슘·인 보충제)", "category": "보충제/기타", "energy_kcal": 0, "moisture_g": 2.0, "protein_g": 0.0, "fat_g": 0.0, "ash_g": 98.0, "carbohydrate_g": 0.0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 23000, "magnesium_mg": 100, "phosphorus_mg": 18000, "potassium_mg": 10, "sodium_mg": 20, "zinc_mg": 0, "copper_mg": 0, "iron_mg": 5.0, "manganese_mg": 0, "selenium_ug": 0, "iodine_ug": 0, "vitamin_a_ug": 0, "thiamin_mg": 0, "riboflavin_mg": 0, "niacin_mg": 0, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 0, "vitamin_b12_ug": 0, "vitamin_d_ug": 0, "vitamin_e_mg": 0, "vitamin_k_ug": 0, "cholesterol_mg": 0, "omega3_g": 0, "omega6_g": 0}, {"id": "supp_salmon_oil", "ingredient": "salmon oil, omega-3 supplement", "name_ko": "정제 연어오일/어유 (오메가-3 보충)", "category": "유지류", "energy_kcal": 900, "moisture_g": 0.0, "protein_g": 0.0, "fat_g": 100.0, "ash_g": 0.0, "carbohydrate_g": 0.0, "sugar_g": 0, "total_dietary_fiber_g": 0, "calcium_mg": 0, "magnesium_mg": 0, "phosphorus_mg": 0, "potassium_mg": 0, "sodium_mg": 0, "zinc_mg": 0, "copper_mg": 0, "iron_mg": 0, "manganese_mg": 0, "selenium_ug": 0, "iodine_ug": 0, "vitamin_a_ug": 300, "thiamin_mg": 0, "riboflavin_mg": 0, "niacin_mg": 0, "pantothenic_acid_mg": 0, "vitamin_b6_mg": 0, "biotin_ug": 0, "folate_ug": 0, "vitamin_b12_ug": 0, "vitamin_d_ug": 25.0, "vitamin_e_mg": 15.0, "vitamin_k_ug": 0, "cholesterol_mg": 485, "omega3_g": 32.0, "omega6_g": 2.0}];

// [중복 DB 제거 완료] 117종 일반 식재료 DB 단일화 (EMBEDDED_INGREDIENTS_DB -> GUARDIAN_INGREDIENTS_DB 공유)
window.EMBEDDED_INGREDIENTS_DB = window.GUARDIAN_INGREDIENTS_DB;
const EMBEDDED_INGREDIENTS_DB = window.GUARDIAN_INGREDIENTS_DB;

/**
 * feed_ingredient_db.js
 * [1단계] 사료 전용 '산업용 원재료 DB (Feed Ingredient Matrix)'
 * - 데이터 베이스: NRC(2006) 개/고양이 영양 요구량 보고서, AAFCO 공식 원재료 정의(Official Publication),
 *   FEDIAF 가이드라인, Feedipedia 및 INRAE-Cirad-AFZ 사료 공학 데이터 테이블 기반
 * - 75개 핵심 산업용 사료 원재료 그룹 (동물성 육분, 생육, 가수분해 단백, 식물성 농축단백, 두류, 곡류/전분,
 *   식이섬유/프리바이오틱스, 유지류, 미네랄/비타민 프리믹스 및 1% 앵커 첨가제)
 * - 각 원재료별 표준 영양소 벡터 (100g As-Fed 기준):
 *   조단백, 조지방, 조섬유, 조회분, 수분, 아미노산 12종+타우린, TDF/수용성/불용성 식이섬유,
 *   칼슘/인/마그네슘/나트륨/칼륨/미량미네랄, 비타민, 오메가 지방산 및 가공 수분 손실(Processing Penalty) 계수 포함
 */

const FeedIngredientDB = (function() {

  // 아미노산 13종 표준 키 정의 (필수 아미노산 10종 + 시스틴/티로신 + 타우린)
  const AMINO_ACID_KEYS = [
    { key: 'arginine_g', label: '아르기닌 (Arginine)', essential: true, dogMinDM: 0.51, catMinDM: 1.04 },
    { key: 'histidine_g', label: '히스티딘 (Histidine)', essential: true, dogMinDM: 0.19, catMinDM: 0.31 },
    { key: 'isoleucine_g', label: '이소류신 (Isoleucine)', essential: true, dogMinDM: 0.38, catMinDM: 0.52 },
    { key: 'leucine_g', label: '류신 (Leucine)', essential: true, dogMinDM: 0.68, catMinDM: 1.24 },
    { key: 'lysine_g', label: '라이신 (Lysine)', essential: true, dogMinDM: 0.63, catMinDM: 0.83 },
    { key: 'methionine_g', label: '메티오닌 (Methionine)', essential: true, dogMinDM: 0.33, catMinDM: 0.20 },
    { key: 'cystine_g', label: '시스틴 (Cystine)', essential: false, dogMinDM: 0.32, catMinDM: 0.33 },
    { key: 'methionine_cystine_g', label: '메티오닌+시스틴 (Met+Cys)', essential: true, dogMinDM: 0.65, catMinDM: 0.53 },
    { key: 'phenylalanine_g', label: '페닐알라닌 (Phenylalanine)', essential: true, dogMinDM: 0.45, catMinDM: 0.42 },
    { key: 'tyrosine_g', label: '티로신 (Tyrosine)', essential: false, dogMinDM: 0.29, catMinDM: 1.11 },
    { key: 'phenylalanine_tyrosine_g', label: '페닐알라닌+티로신 (Phe+Tyr)', essential: true, dogMinDM: 0.74, catMinDM: 1.53 },
    { key: 'threonine_g', label: '트레오닌 (Threonine)', essential: true, dogMinDM: 0.48, catMinDM: 0.73 },
    { key: 'tryptophan_g', label: '트립토판 (Tryptophan)', essential: true, dogMinDM: 0.16, catMinDM: 0.16 },
    { key: 'valine_g', label: '발린 (Valine)', essential: true, dogMinDM: 0.49, catMinDM: 0.62 },
    { key: 'taurine_g', label: '타우린 (Taurine)', essential: true, dogMinDM: 0.10, catMinDM: 0.20 }
  ];

  /**
   * 단백질 출처 유형별 표준 아미노산 프로파일 (조단백질 100g당 아미노산 g 비율)
   * NRC / INRAE-Cirad-AFZ 사료 원재료 아미노산 조성표 참조
   */
  const PROTEIN_AA_PROFILES_PER_100G_CP = {
    poultry_meal: {
      arginine_g: 6.8, histidine_g: 2.1, isoleucine_g: 3.9, leucine_g: 6.9, lysine_g: 6.1,
      methionine_g: 1.9, cystine_g: 1.3, phenylalanine_g: 3.8, tyrosine_g: 2.9,
      threonine_g: 3.9, tryptophan_g: 0.95, valine_g: 4.6, taurine_g: 0.35
    },
    fresh_poultry: {
      arginine_g: 6.5, histidine_g: 2.9, isoleucine_g: 4.8, leucine_g: 7.7, lysine_g: 8.5,
      methionine_g: 2.6, cystine_g: 1.1, phenylalanine_g: 4.0, tyrosine_g: 3.4,
      threonine_g: 4.3, tryptophan_g: 1.15, valine_g: 5.0, taurine_g: 0.55
    },
    red_meat_meal: {
      arginine_g: 6.9, histidine_g: 2.0, isoleucine_g: 3.3, leucine_g: 6.4, lysine_g: 5.4,
      methionine_g: 1.5, cystine_g: 1.0, phenylalanine_g: 3.5, tyrosine_g: 2.5,
      threonine_g: 3.4, tryptophan_g: 0.75, valine_g: 4.4, taurine_g: 0.22
    },
    fresh_red_meat: {
      arginine_g: 6.4, histidine_g: 3.2, isoleucine_g: 4.6, leucine_g: 7.9, lysine_g: 8.4,
      methionine_g: 2.5, cystine_g: 1.1, phenylalanine_g: 4.0, tyrosine_g: 3.3,
      threonine_g: 4.4, tryptophan_g: 1.10, valine_g: 5.1, taurine_g: 0.45
    },
    fish_meal: {
      arginine_g: 6.2, histidine_g: 2.4, isoleucine_g: 4.5, leucine_g: 7.5, lysine_g: 7.8,
      methionine_g: 2.8, cystine_g: 0.95, phenylalanine_g: 4.0, tyrosine_g: 3.2,
      threonine_g: 4.3, tryptophan_g: 1.10, valine_g: 5.1, taurine_g: 0.65
    },
    fresh_fish: {
      arginine_g: 6.0, histidine_g: 2.6, isoleucine_g: 4.7, leucine_g: 7.8, lysine_g: 8.8,
      methionine_g: 2.9, cystine_g: 1.05, phenylalanine_g: 4.1, tyrosine_g: 3.4,
      threonine_g: 4.5, tryptophan_g: 1.15, valine_g: 5.3, taurine_g: 0.75
    },
    egg_protein: {
      arginine_g: 6.1, histidine_g: 2.4, isoleucine_g: 5.4, leucine_g: 8.5, lysine_g: 7.0,
      methionine_g: 3.1, cystine_g: 2.3, phenylalanine_g: 5.1, tyrosine_g: 4.0,
      threonine_g: 4.7, tryptophan_g: 1.50, valine_g: 6.4, taurine_g: 0.15
    },
    hydrolyzed_animal: {
      arginine_g: 6.6, histidine_g: 2.3, isoleucine_g: 4.2, leucine_g: 7.2, lysine_g: 6.8,
      methionine_g: 2.1, cystine_g: 1.4, phenylalanine_g: 3.9, tyrosine_g: 3.1,
      threonine_g: 4.1, tryptophan_g: 1.05, valine_g: 4.8, taurine_g: 0.40
    },
    hydrolyzed_feather: {
      arginine_g: 6.9, histidine_g: 0.8, isoleucine_g: 4.7, leucine_g: 8.1, lysine_g: 2.3,
      methionine_g: 0.7, cystine_g: 4.9, phenylalanine_g: 4.7, tyrosine_g: 2.8,
      threonine_g: 4.6, tryptophan_g: 0.65, valine_g: 7.1, taurine_g: 0.05
    },
    pea_legume: {
      // 완두콩/렌틸/병아리콩: 라이신 풍부(7.2%), 메티오닌(0.95%) 및 시스틴(1.2%) 매우 낮음, 타우린 0
      arginine_g: 8.4, histidine_g: 2.5, isoleucine_g: 4.3, leucine_g: 7.2, lysine_g: 7.3,
      methionine_g: 0.95, cystine_g: 1.25, phenylalanine_g: 4.8, tyrosine_g: 3.4,
      threonine_g: 3.8, tryptophan_g: 0.90, valine_g: 4.7, taurine_g: 0.0
    },
    soy_protein: {
      arginine_g: 7.4, histidine_g: 2.6, isoleucine_g: 4.6, leucine_g: 7.7, lysine_g: 6.2,
      methionine_g: 1.35, cystine_g: 1.50, phenylalanine_g: 5.0, tyrosine_g: 3.6,
      threonine_g: 3.9, tryptophan_g: 1.30, valine_g: 4.8, taurine_g: 0.0
    },
    potato_protein: {
      arginine_g: 5.2, histidine_g: 2.2, isoleucine_g: 5.5, leucine_g: 9.6, lysine_g: 7.5,
      methionine_g: 2.15, cystine_g: 1.55, phenylalanine_g: 6.1, tyrosine_g: 5.4,
      threonine_g: 5.6, tryptophan_g: 1.35, valine_g: 6.5, taurine_g: 0.0
    },
    corn_gluten: {
      // 옥수수 글루텐: 메티오닌(2.4%) 및 류신(16.2%) 높음, 라이신(1.7%) 및 트립토판(0.5%) 극도로 낮음
      arginine_g: 3.2, histidine_g: 2.1, isoleucine_g: 4.1, leucine_g: 16.2, lysine_g: 1.7,
      methionine_g: 2.40, cystine_g: 1.80, phenylalanine_g: 6.3, tyrosine_g: 5.1,
      threonine_g: 3.4, tryptophan_g: 0.52, valine_g: 4.7, taurine_g: 0.0
    },
    cereal_grain: {
      arginine_g: 5.6, histidine_g: 2.3, isoleucine_g: 3.7, leucine_g: 7.8, lysine_g: 3.1,
      methionine_g: 1.80, cystine_g: 2.10, phenylalanine_g: 4.7, tyrosine_g: 3.5,
      threonine_g: 3.4, tryptophan_g: 1.15, valine_g: 4.9, taurine_g: 0.0
    },
    yeast_insect: {
      arginine_g: 5.5, histidine_g: 2.8, isoleucine_g: 4.5, leucine_g: 7.1, lysine_g: 6.4,
      methionine_g: 1.75, cystine_g: 1.10, phenylalanine_g: 4.4, tyrosine_g: 5.2,
      threonine_g: 4.2, tryptophan_g: 1.30, valine_g: 5.4, taurine_g: 0.12
    },
    none: {
      arginine_g: 0, histidine_g: 0, isoleucine_g: 0, leucine_g: 0, lysine_g: 0,
      methionine_g: 0, cystine_g: 0, phenylalanine_g: 0, tyrosine_g: 0,
      threonine_g: 0, tryptophan_g: 0, valine_g: 0, taurine_g: 0
    }
  };

  // 원재료 객체에 아미노산 13종 및 파생 필드 자동 생성 헬퍼
  function buildIngredient(raw) {
    const cp = raw.protein_g || 0;
    const aaProfile = PROTEIN_AA_PROFILES_PER_100G_CP[raw.aa_profile_type || 'none'] || PROTEIN_AA_PROFILES_PER_100G_CP.none;

    const item = Object.assign({}, raw);
    // 기본값 보정
    item.ingredient = raw.id;
    item.crude_fiber_g = raw.crude_fiber_g !== undefined ? raw.crude_fiber_g : (raw.total_dietary_fiber_g || 0) * 0.35;
    item.soluble_fiber_g = raw.soluble_fiber_g !== undefined ? raw.soluble_fiber_g : 0;
    item.insoluble_fiber_g = raw.insoluble_fiber_g !== undefined ? raw.insoluble_fiber_g : Math.max(item.crude_fiber_g, 0);
    item.tdf_g = raw.tdf_g !== undefined ? raw.tdf_g : (item.soluble_fiber_g + item.insoluble_fiber_g);
    // 기존 호환을 위해 total_dietary_fiber_g에는 라벨 보증성분 기준인 조섬유(crude_fiber_g)를 기본 매핑하고 tdf_g를 별도 관리
    item.total_dietary_fiber_g = item.crude_fiber_g;

    const nfe = Math.max(0, 100 - (item.moisture_g || 0) - (item.protein_g || 0) - (item.fat_g || 0) - (item.crude_fiber_g || 0) - (item.ash_g || 0));
    item.carbohydrate_g = raw.carbohydrate_g !== undefined ? raw.carbohydrate_g : Math.round(nfe * 100) / 100;

    // 아미노산 계산 (100g 원물 당 g)
    const factor = cp / 100.0;
    item.arginine_g = raw.arginine_g !== undefined ? raw.arginine_g : +(aaProfile.arginine_g * factor).toFixed(3);
    item.histidine_g = raw.histidine_g !== undefined ? raw.histidine_g : +(aaProfile.histidine_g * factor).toFixed(3);
    item.isoleucine_g = raw.isoleucine_g !== undefined ? raw.isoleucine_g : +(aaProfile.isoleucine_g * factor).toFixed(3);
    item.leucine_g = raw.leucine_g !== undefined ? raw.leucine_g : +(aaProfile.leucine_g * factor).toFixed(3);
    item.lysine_g = raw.lysine_g !== undefined ? raw.lysine_g : +(aaProfile.lysine_g * factor).toFixed(3);
    item.methionine_g = raw.methionine_g !== undefined ? raw.methionine_g : +(aaProfile.methionine_g * factor).toFixed(3);
    item.cystine_g = raw.cystine_g !== undefined ? raw.cystine_g : +(aaProfile.cystine_g * factor).toFixed(3);
    item.methionine_cystine_g = +(item.methionine_g + item.cystine_g).toFixed(3);
    item.phenylalanine_g = raw.phenylalanine_g !== undefined ? raw.phenylalanine_g : +(aaProfile.phenylalanine_g * factor).toFixed(3);
    item.tyrosine_g = raw.tyrosine_g !== undefined ? raw.tyrosine_g : +(aaProfile.tyrosine_g * factor).toFixed(3);
    item.phenylalanine_tyrosine_g = +(item.phenylalanine_g + item.tyrosine_g).toFixed(3);
    item.threonine_g = raw.threonine_g !== undefined ? raw.threonine_g : +(aaProfile.threonine_g * factor).toFixed(3);
    item.tryptophan_g = raw.tryptophan_g !== undefined ? raw.tryptophan_g : +(aaProfile.tryptophan_g * factor).toFixed(3);
    item.valine_g = raw.valine_g !== undefined ? raw.valine_g : +(aaProfile.valine_g * factor).toFixed(3);
    item.taurine_g = raw.taurine_g !== undefined ? raw.taurine_g : +(aaProfile.taurine_g * factor).toFixed(3);

    // 미량 미네랄 및 비타민 기본값 (NRC/INRAE 원료군 평균치)
    const isAnimal = item.protein_origin === 'animal';
    const isFish = (item.id || '').includes('salmon') || (item.id || '').includes('fish') || (item.id || '').includes('krill') || (item.id || '').includes('mussel');
    const dmFrac = Math.max(0.05, (100 - (item.moisture_g || 10)) / 100);

    if (item.magnesium_mg === undefined) item.magnesium_mg = Math.round((isAnimal ? 110 : 160) * dmFrac);
    if (item.potassium_mg === undefined) item.potassium_mg = Math.round((isAnimal ? 650 : 850) * dmFrac);
    if (item.sodium_mg === undefined) item.sodium_mg = Math.round((isFish ? 480 : isAnimal ? 320 : 25) * dmFrac);
    if (item.iron_mg === undefined) item.iron_mg = +((isAnimal ? 22.0 : 8.5) * dmFrac).toFixed(2);
    if (item.zinc_mg === undefined) item.zinc_mg = +((isAnimal ? 11.5 : 4.2) * dmFrac).toFixed(2);
    if (item.copper_mg === undefined) item.copper_mg = +((isAnimal ? 1.4 : 0.9) * dmFrac).toFixed(2);
    if (item.manganese_mg === undefined) item.manganese_mg = +((isAnimal ? 1.2 : 3.8) * dmFrac).toFixed(2);
    if (item.selenium_ug === undefined) item.selenium_ug = +((isFish ? 140 : isAnimal ? 65 : 18) * dmFrac).toFixed(1);
    if (item.iodine_ug === undefined) item.iodine_ug = +((isFish ? 220 : isAnimal ? 35 : 12) * dmFrac).toFixed(1);

    if (item.vitamin_a_ug === undefined) item.vitamin_a_ug = +((isAnimal ? 180 : 15) * dmFrac).toFixed(1);
    if (item.vitamin_d_ug === undefined) item.vitamin_d_ug = +((isFish ? 8.5 : isAnimal ? 1.2 : 0) * dmFrac).toFixed(2);
    if (item.vitamin_e_mg === undefined) item.vitamin_e_mg = +((isAnimal ? 2.5 : 3.2) * dmFrac).toFixed(2);
    if (item.thiamin_mg === undefined) item.thiamin_mg = +((isAnimal ? 0.35 : 0.45) * dmFrac).toFixed(2);
    if (item.riboflavin_mg === undefined) item.riboflavin_mg = +((isAnimal ? 1.15 : 0.25) * dmFrac).toFixed(2);
    if (item.niacin_mg === undefined) item.niacin_mg = +((isAnimal ? 11.0 : 4.5) * dmFrac).toFixed(2);
    if (item.pantothenic_acid_mg === undefined) item.pantothenic_acid_mg = +((isAnimal ? 2.8 : 1.4) * dmFrac).toFixed(2);
    if (item.vitamin_b6_mg === undefined) item.vitamin_b6_mg = +((isAnimal ? 0.65 : 0.42) * dmFrac).toFixed(2);
    if (item.folate_ug === undefined) item.folate_ug = +((isAnimal ? 45 : 85) * dmFrac).toFixed(1);
    if (item.vitamin_b12_ug === undefined) item.vitamin_b12_ug = +((isAnimal ? 8.5 : 0) * dmFrac).toFixed(2);
    if (item.biotin_ug === undefined) item.biotin_ug = +((isAnimal ? 22 : 16) * dmFrac).toFixed(1);

    if (item.omega3_g === undefined) item.omega3_g = +((isFish ? item.fat_g * 0.22 : isAnimal ? item.fat_g * 0.02 : item.fat_g * 0.04)).toFixed(2);
    if (item.omega6_g === undefined) item.omega6_g = +((isFish ? item.fat_g * 0.06 : isAnimal ? item.fat_g * 0.18 : item.fat_g * 0.42)).toFixed(2);
    if (item.epa_dha_g === undefined) item.epa_dha_g = +(isFish ? item.omega3_g * 0.78 : 0).toFixed(2);

    if (item.energy_kcal === undefined) {
      item.energy_kcal = Math.round((3.5 * item.protein_g) + (8.5 * item.fat_g) + (3.5 * item.carbohydrate_g));
    }

    return item;
  }

  /**
   * 75개 핵심 산업용 사료 원재료 매트릭스 (Feed Ingredient Matrix)
   */
  const RAW_INDUSTRIAL_INGREDIENTS = [
    // =========================================================================
    // Group 1. 동물성 건조육분 (Rendered & Dehydrated Meat Meals) - 14종
    // =========================================================================
    {
      id: 'ind_chicken_meal',
      name_ko: '닭고기 분말 (Chicken Meal, 탈수 계육분)',
      name_en: 'Chicken Meal',
      category: '산업용 육분(Meal)',
      processing_type: 'dry_meal',
      protein_origin: 'animal',
      aa_profile_type: 'poultry_meal',
      is_anchor_1pct: false,
      moisture_g: 8.0, protein_g: 64.5, fat_g: 12.8, crude_fiber_g: 1.2, ash_g: 11.5,
      tdf_g: 1.5, soluble_fiber_g: 0.2, insoluble_fiber_g: 1.3,
      calcium_mg: 2450, phosphorus_mg: 1650, sodium_mg: 380, magnesium_mg: 130,
      aliases_ko: ['닭고기분말', '닭고기육분', '닭고기분', '건조닭고기', '탈수닭고기', '계육분', '치킨밀', '건조계육'],
      aliases_en: ['chicken meal', 'dehydrated chicken', 'dried chicken']
    },
    {
      id: 'ind_poultry_meal',
      name_ko: '가금류 육분 (Poultry Meal, 탈수 가금류 단백질)',
      name_en: 'Poultry Meal (Dehydrated Poultry Protein)',
      category: '산업용 육분(Meal)',
      processing_type: 'dry_meal',
      protein_origin: 'animal',
      aa_profile_type: 'poultry_meal',
      is_anchor_1pct: false,
      moisture_g: 8.0, protein_g: 63.0, fat_g: 13.5, crude_fiber_g: 1.3, ash_g: 12.2,
      tdf_g: 1.6, soluble_fiber_g: 0.2, insoluble_fiber_g: 1.4,
      calcium_mg: 2600, phosphorus_mg: 1720, sodium_mg: 400, magnesium_mg: 135,
      aliases_ko: ['가금류육분', '가금류분말', '탈수가금류단백질', '탈수가금육단백질', '가금육단백질', '건조가금류단백질', '가금육분', '동물성단백질(가금류)'],
      aliases_en: ['poultry meal', 'dehydrated poultry protein', 'dried poultry protein']
    },
    {
      id: 'ind_poultry_byproduct_meal',
      name_ko: '가금류 부산물 분말 (Poultry By-Product Meal)',
      name_en: 'Poultry By-Product Meal',
      category: '산업용 육분(Meal)',
      processing_type: 'dry_meal',
      protein_origin: 'animal',
      aa_profile_type: 'poultry_meal',
      is_anchor_1pct: false,
      moisture_g: 8.0, protein_g: 60.0, fat_g: 14.0, crude_fiber_g: 1.8, ash_g: 14.5,
      tdf_g: 2.0, soluble_fiber_g: 0.2, insoluble_fiber_g: 1.8,
      calcium_mg: 3400, phosphorus_mg: 2050, sodium_mg: 420,
      aliases_ko: ['가금류부산물분말', '가금부산물건조분', '닭부산물분말'],
      aliases_en: ['poultry by-product meal', 'chicken by-product meal']
    },
    {
      id: 'ind_duck_meal',
      name_ko: '오리고기 분말 (Duck Meal, 탈수 오리육분)',
      name_en: 'Duck Meal',
      category: '산업용 육분(Meal)',
      processing_type: 'dry_meal',
      protein_origin: 'animal',
      aa_profile_type: 'poultry_meal',
      is_anchor_1pct: false,
      moisture_g: 8.5, protein_g: 59.0, fat_g: 14.5, crude_fiber_g: 1.5, ash_g: 14.0,
      tdf_g: 1.8, soluble_fiber_g: 0.2, insoluble_fiber_g: 1.6,
      calcium_mg: 2950, phosphorus_mg: 1850,
      aliases_ko: ['오리고기분말', '건조오리고기', '탈수오리고기', '오리육분', '덕밀'],
      aliases_en: ['duck meal', 'dehydrated duck']
    },
    {
      id: 'ind_turkey_meal',
      name_ko: '칠면조 분말 (Turkey Meal, 건조 칠면조육분)',
      name_en: 'Turkey Meal',
      category: '산업용 육분(Meal)',
      processing_type: 'dry_meal',
      protein_origin: 'animal',
      aa_profile_type: 'poultry_meal',
      is_anchor_1pct: false,
      moisture_g: 8.0, protein_g: 63.5, fat_g: 12.5, crude_fiber_g: 1.2, ash_g: 12.8,
      tdf_g: 1.5, soluble_fiber_g: 0.2, insoluble_fiber_g: 1.3,
      calcium_mg: 2700, phosphorus_mg: 1780,
      aliases_ko: ['칠면조분말', '건조칠면조', '칠면조육분', '터키밀', '탈수칠면조'],
      aliases_en: ['turkey meal', 'dehydrated turkey']
    },
    {
      id: 'ind_lamb_meal',
      name_ko: '양고기 분말 (Lamb Meal, 건조 양육분)',
      name_en: 'Lamb Meal',
      category: '산업용 육분(Meal)',
      processing_type: 'dry_meal',
      protein_origin: 'animal',
      aa_profile_type: 'red_meat_meal',
      is_anchor_1pct: false,
      moisture_g: 8.0, protein_g: 56.5, fat_g: 13.8, crude_fiber_g: 1.8, ash_g: 18.0,
      tdf_g: 2.1, soluble_fiber_g: 0.2, insoluble_fiber_g: 1.9,
      calcium_mg: 4600, phosphorus_mg: 2650,
      aliases_ko: ['양고기분말', '건조양고기', '탈수양고기', '양육분', '램밀'],
      aliases_en: ['lamb meal', 'dehydrated lamb']
    },
    {
      id: 'ind_beef_bone_meal',
      name_ko: '소고기 육골분/분말 (Beef & Bone Meal)',
      name_en: 'Beef Meal / Meat and Bone Meal',
      category: '산업용 육분(Meal)',
      processing_type: 'dry_meal',
      protein_origin: 'animal',
      aa_profile_type: 'red_meat_meal',
      is_anchor_1pct: false,
      moisture_g: 7.5, protein_g: 52.0, fat_g: 12.0, crude_fiber_g: 2.2, ash_g: 24.0,
      tdf_g: 2.5, soluble_fiber_g: 0.2, insoluble_fiber_g: 2.3,
      calcium_mg: 6800, phosphorus_mg: 3400,
      aliases_ko: ['소고기분말', '건조소고기', '육골분', '우육분', '비프밀'],
      aliases_en: ['beef meal', 'meat and bone meal', 'dehydrated beef']
    },
    {
      id: 'ind_pork_meal',
      name_ko: '돼지고기 분말 (Pork Meal / Greaves)',
      name_en: 'Pork Meal',
      category: '산업용 육분(Meal)',
      processing_type: 'dry_meal',
      protein_origin: 'animal',
      aa_profile_type: 'red_meat_meal',
      is_anchor_1pct: false,
      moisture_g: 7.5, protein_g: 61.0, fat_g: 13.0, crude_fiber_g: 1.4, ash_g: 15.0,
      tdf_g: 1.6, soluble_fiber_g: 0.2, insoluble_fiber_g: 1.4,
      calcium_mg: 3600, phosphorus_mg: 2150,
      aliases_ko: ['돼지고기분말', '돈육분', '건조돼지고기', '포크밀'],
      aliases_en: ['pork meal', 'dehydrated pork', 'greaves']
    },
    {
      id: 'ind_salmon_meal',
      name_ko: '연어 분말 (Salmon Meal, 탈수 연어 어분)',
      name_en: 'Salmon Meal',
      category: '산업용 육분(Meal)',
      processing_type: 'dry_meal',
      protein_origin: 'animal',
      aa_profile_type: 'fish_meal',
      is_anchor_1pct: false,
      moisture_g: 8.0, protein_g: 62.5, fat_g: 13.0, crude_fiber_g: 0.9, ash_g: 13.5,
      tdf_g: 1.1, soluble_fiber_g: 0.2, insoluble_fiber_g: 0.9,
      calcium_mg: 3100, phosphorus_mg: 2100, sodium_mg: 550, omega3_g: 3.2, omega6_g: 0.7, epa_dha_g: 2.6,
      aliases_ko: ['연어분말', '건조연어', '탈수연어', '연어어분', '살몬밀'],
      aliases_en: ['salmon meal', 'dehydrated salmon']
    },
    {
      id: 'ind_menhaden_fish_meal',
      name_ko: '청어/백색어분 (Menhaden / Herring / Whitefish Meal)',
      name_en: 'Fish Meal (Herring / Menhaden / Whitefish)',
      category: '산업용 육분(Meal)',
      processing_type: 'dry_meal',
      protein_origin: 'animal',
      aa_profile_type: 'fish_meal',
      is_anchor_1pct: false,
      moisture_g: 8.0, protein_g: 64.0, fat_g: 10.5, crude_fiber_g: 0.8, ash_g: 15.2,
      tdf_g: 1.0, soluble_fiber_g: 0.1, insoluble_fiber_g: 0.9,
      calcium_mg: 3900, phosphorus_mg: 2550, sodium_mg: 620, omega3_g: 2.8, omega6_g: 0.4, epa_dha_g: 2.3,
      aliases_ko: ['어분', '청어분말', '건조청어', '백색어분', '멸치어분', '생선분말', '정어리분말'],
      aliases_en: ['fish meal', 'herring meal', 'menhaden fish meal', 'whitefish meal', 'anchovy meal']
    },
    {
      id: 'ind_dried_whole_egg',
      name_ko: '전란분 / 건조 계란 (Dried Whole Egg Product)',
      name_en: 'Dried Whole Egg',
      category: '산업용 육분(Meal)',
      processing_type: 'dry_meal',
      protein_origin: 'animal',
      aa_profile_type: 'egg_protein',
      is_anchor_1pct: false,
      moisture_g: 5.0, protein_g: 47.5, fat_g: 41.0, crude_fiber_g: 0.2, ash_g: 4.2,
      tdf_g: 0.2, soluble_fiber_g: 0.1, insoluble_fiber_g: 0.1,
      calcium_mg: 240, phosphorus_mg: 680, sodium_mg: 480,
      aliases_ko: ['전란분', '건조계란', '건조전란', '계란분말', '난황분'],
      aliases_en: ['dried egg', 'dried whole egg', 'egg product', 'whole egg powder']
    },
    {
      id: 'ind_krill_meal',
      name_ko: '남극 크릴 분말 (Antarctic Krill Meal)',
      name_en: 'Krill Meal',
      category: '산업용 육분(Meal)',
      processing_type: 'dry_meal',
      protein_origin: 'animal',
      aa_profile_type: 'fish_meal',
      is_anchor_1pct: false,
      moisture_g: 7.0, protein_g: 58.0, fat_g: 21.0, crude_fiber_g: 3.5, ash_g: 9.5,
      tdf_g: 4.5, soluble_fiber_g: 0.5, insoluble_fiber_g: 4.0,
      calcium_mg: 1850, phosphorus_mg: 1450, omega3_g: 4.8, omega6_g: 0.5, epa_dha_g: 4.1,
      aliases_ko: ['크릴분말', '크릴밀', '남극크릴', '건조크릴'],
      aliases_en: ['krill meal', 'dehydrated krill']
    },
    {
      id: 'ind_insect_bsfl_meal',
      name_ko: '곤충 단백 분말 / 탈지 동애등에 (Insect / BSFL Meal)',
      name_en: 'Black Soldier Fly Larvae Meal',
      category: '산업용 육분(Meal)',
      processing_type: 'dry_meal',
      protein_origin: 'animal',
      aa_profile_type: 'yeast_insect',
      is_anchor_1pct: false,
      moisture_g: 6.5, protein_g: 54.0, fat_g: 14.0, crude_fiber_g: 6.5, ash_g: 9.8,
      tdf_g: 11.5, soluble_fiber_g: 1.5, insoluble_fiber_g: 10.0, // 키틴(Chitin) 포함
      calcium_mg: 2200, phosphorus_mg: 1100,
      aliases_ko: ['곤충단백질', '동애등에', '밀웜분말', '곤충분말'],
      aliases_en: ['insect protein', 'black soldier fly larvae', 'bsfl meal', 'mealworm']
    },
    {
      id: 'ind_green_lipped_mussel',
      name_ko: '초록입홍합 분말 (Green-Lipped Mussel Powder)',
      name_en: 'Green-Lipped Mussel Powder',
      category: '산업용 육분(Meal)',
      processing_type: 'dry_meal',
      protein_origin: 'animal',
      aa_profile_type: 'fish_meal',
      is_anchor_1pct: true,
      moisture_g: 6.0, protein_g: 55.0, fat_g: 10.5, crude_fiber_g: 0.5, ash_g: 12.0,
      tdf_g: 0.8, soluble_fiber_g: 0.6, insoluble_fiber_g: 0.2,
      calcium_mg: 1100, phosphorus_mg: 950, omega3_g: 3.8, epa_dha_g: 3.2, taurine_g: 1.8,
      aliases_ko: ['초록입홍합', '녹색입홍합', '초록입홍합분말'],
      aliases_en: ['green-lipped mussel', 'perna canaliculus']
    },

    // =========================================================================
    // Group 2. 동물성 생육 / 신선육 (Fresh & Raw Meats, 수분 70~76% - Processing Penalty 적용) - 10종
    // =========================================================================
    {
      id: 'ind_fresh_chicken',
      name_ko: '생닭고기 / 뼈 발라낸 신선 계육 (Fresh Deboned Chicken, 수분 73%)',
      name_en: 'Fresh Deboned Chicken',
      category: '산업용 생육(Fresh)',
      processing_type: 'fresh_meat',
      protein_origin: 'animal',
      aa_profile_type: 'fresh_poultry',
      is_anchor_1pct: false,
      moisture_g: 73.0, protein_g: 19.5, fat_g: 6.0, crude_fiber_g: 0.0, ash_g: 1.1,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 15, phosphorus_mg: 210, sodium_mg: 75,
      aliases_ko: ['생닭고기', '신선한닭고기', '닭고기', '뼈를발라낸닭고기', '신선계육', '생계육'],
      aliases_en: ['fresh chicken', 'deboned chicken', 'raw chicken', 'chicken']
    },
    {
      id: 'ind_fresh_turkey',
      name_ko: '생칠면조고기 / 뼈 발라낸 칠면조 (Fresh Deboned Turkey, 수분 73%)',
      name_en: 'Fresh Deboned Turkey',
      category: '산업용 생육(Fresh)',
      processing_type: 'fresh_meat',
      protein_origin: 'animal',
      aa_profile_type: 'fresh_poultry',
      is_anchor_1pct: false,
      moisture_g: 73.0, protein_g: 20.5, fat_g: 5.2, crude_fiber_g: 0.0, ash_g: 1.1,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 16, phosphorus_mg: 215, sodium_mg: 70,
      aliases_ko: ['생칠면조', '칠면조고기', '뼈를발라낸칠면조고기', '신선한칠면조'],
      aliases_en: ['fresh turkey', 'deboned turkey', 'turkey']
    },
    {
      id: 'ind_fresh_duck',
      name_ko: '생오리고기 / 신선 오리살코기 (Fresh Deboned Duck, 수분 71%)',
      name_en: 'Fresh Deboned Duck',
      category: '산업용 생육(Fresh)',
      processing_type: 'fresh_meat',
      protein_origin: 'animal',
      aa_profile_type: 'fresh_poultry',
      is_anchor_1pct: false,
      moisture_g: 71.0, protein_g: 18.8, fat_g: 8.8, crude_fiber_g: 0.0, ash_g: 1.1,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 14, phosphorus_mg: 195, sodium_mg: 72,
      aliases_ko: ['생오리고기', '오리고기', '신선한오리고기', '뼈를발라낸오리고기'],
      aliases_en: ['fresh duck', 'deboned duck', 'duck']
    },
    {
      id: 'ind_fresh_salmon',
      name_ko: '생연어 / 뼈 발라낸 신선 연어 (Fresh Deboned Salmon, 수분 69%)',
      name_en: 'Fresh Deboned Salmon',
      category: '산업용 생육(Fresh)',
      processing_type: 'fresh_meat',
      protein_origin: 'animal',
      aa_profile_type: 'fresh_fish',
      is_anchor_1pct: false,
      moisture_g: 69.0, protein_g: 20.0, fat_g: 9.5, crude_fiber_g: 0.0, ash_g: 1.3,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 24, phosphorus_mg: 245, sodium_mg: 65, omega3_g: 2.3, omega6_g: 0.4, epa_dha_g: 1.9,
      aliases_ko: ['생연어', '신선한연어', '연어', '뼈를발라낸연어', '대서양연어'],
      aliases_en: ['fresh salmon', 'deboned salmon', 'atlantic salmon', 'salmon']
    },
    {
      id: 'ind_fresh_whitefish',
      name_ko: '생백색어류 / 청어 / 가자미 / 대구 (Fresh Herring / Flounder / Cod, 수분 75%)',
      name_en: 'Fresh Whitefish / Herring / Flounder',
      category: '산업용 생육(Fresh)',
      processing_type: 'fresh_meat',
      protein_origin: 'animal',
      aa_profile_type: 'fresh_fish',
      is_anchor_1pct: false,
      moisture_g: 75.0, protein_g: 18.5, fat_g: 4.8, crude_fiber_g: 0.0, ash_g: 1.3,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 38, phosphorus_mg: 230, omega3_g: 1.3, epa_dha_g: 1.0,
      aliases_ko: ['생청어', '청어', '가자미', '대구', '명태', '백색어류', '신선한생선', '고등어'],
      aliases_en: ['fresh herring', 'flounder', 'whitefish', 'cod', 'mackerel', 'hake']
    },
    {
      id: 'ind_fresh_lamb',
      name_ko: '생양고기 / 뼈 발라낸 신선 양고기 (Fresh Deboned Lamb, 수분 71%)',
      name_en: 'Fresh Deboned Lamb',
      category: '산업용 생육(Fresh)',
      processing_type: 'fresh_meat',
      protein_origin: 'animal',
      aa_profile_type: 'fresh_red_meat',
      is_anchor_1pct: false,
      moisture_g: 71.0, protein_g: 19.2, fat_g: 8.5, crude_fiber_g: 0.0, ash_g: 1.1,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 15, phosphorus_mg: 195, zinc_mg: 4.2, iron_mg: 2.1,
      aliases_ko: ['생양고기', '양고기', '신선한양고기', '뼈를발라낸양고기'],
      aliases_en: ['fresh lamb', 'deboned lamb', 'raw lamb', 'lamb']
    },
    {
      id: 'ind_fresh_beef',
      name_ko: '생소고기 / 신선 우육 (Fresh Deboned Beef, 수분 71%)',
      name_en: 'Fresh Deboned Beef',
      category: '산업용 생육(Fresh)',
      processing_type: 'fresh_meat',
      protein_origin: 'animal',
      aa_profile_type: 'fresh_red_meat',
      is_anchor_1pct: false,
      moisture_g: 71.0, protein_g: 20.5, fat_g: 7.2, crude_fiber_g: 0.0, ash_g: 1.1,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 14, phosphorus_mg: 205, iron_mg: 2.8, zinc_mg: 4.8,
      aliases_ko: ['생소고기', '소고기', '신선한소고기', '우육'],
      aliases_en: ['fresh beef', 'deboned beef', 'angus beef', 'beef']
    },
    {
      id: 'ind_fresh_venison_kangaroo',
      name_ko: '생사슴고기 / 캥거루고기 (Fresh Venison / Kangaroo, 수분 74%)',
      name_en: 'Fresh Venison / Kangaroo',
      category: '산업용 생육(Fresh)',
      processing_type: 'fresh_meat',
      protein_origin: 'animal',
      aa_profile_type: 'fresh_red_meat',
      is_anchor_1pct: false,
      moisture_g: 74.0, protein_g: 21.8, fat_g: 2.8, crude_fiber_g: 0.0, ash_g: 1.2,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 14, phosphorus_mg: 225, iron_mg: 3.4,
      aliases_ko: ['사슴고기', '캥거루고기', '생사슴고기', '생캥거루고기', '멧돼지고기'],
      aliases_en: ['venison', 'kangaroo', 'wild boar']
    },
    {
      id: 'ind_fresh_poultry_organs',
      name_ko: '신선 닭간/칠면조간/심장 (Fresh Chicken/Turkey Liver & Heart, 수분 74%)',
      name_en: 'Fresh Poultry Liver & Heart',
      category: '산업용 생육(Fresh)',
      processing_type: 'fresh_meat',
      protein_origin: 'animal',
      aa_profile_type: 'fresh_poultry',
      is_anchor_1pct: false,
      moisture_g: 74.0, protein_g: 18.0, fat_g: 5.2, crude_fiber_g: 0.0, ash_g: 1.4,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 12, phosphorus_mg: 290, iron_mg: 9.5, vitamin_a_ug: 3200, taurine_g: 0.22,
      aliases_ko: ['닭간', '칠면조간', '닭심장', '칠면조심장', '닭모래집', '신선한닭간'],
      aliases_en: ['chicken liver', 'turkey liver', 'chicken heart', 'turkey heart', 'giblets']
    },
    {
      id: 'ind_fresh_whole_egg',
      name_ko: '신선한 통계란 / 전란액 (Fresh Whole Egg, 수분 75%)',
      name_en: 'Fresh Whole Egg',
      category: '산업용 생육(Fresh)',
      processing_type: 'fresh_meat',
      protein_origin: 'animal',
      aa_profile_type: 'egg_protein',
      is_anchor_1pct: false,
      moisture_g: 75.0, protein_g: 12.6, fat_g: 10.5, crude_fiber_g: 0.0, ash_g: 1.0,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 55, phosphorus_mg: 195,
      aliases_ko: ['신선한계란', '계란', '달걀', '통계란', '신선전란'],
      aliases_en: ['fresh whole egg', 'whole egg', 'fresh eggs', 'egg']
    },

    // =========================================================================
    // Group 3. 가수분해 단백질 (Hydrolyzed Proteins - 처방식/저알러지/기호성 코팅) - 5종
    // =========================================================================
    {
      id: 'ind_hydrolyzed_poultry_protein',
      name_ko: '가수분해 가금류/닭 단백 (Hydrolyzed Poultry/Chicken Protein)',
      name_en: 'Hydrolyzed Poultry Protein / Chicken Liver Hydrolysate',
      category: '가수분해 단백',
      processing_type: 'hydrolyzed',
      protein_origin: 'animal',
      aa_profile_type: 'hydrolyzed_animal',
      is_anchor_1pct: false,
      moisture_g: 6.0, protein_g: 74.0, fat_g: 11.0, crude_fiber_g: 0.3, ash_g: 6.5,
      tdf_g: 0.4, soluble_fiber_g: 0.3, insoluble_fiber_g: 0.1,
      calcium_mg: 420, phosphorus_mg: 1150, sodium_mg: 580,
      aliases_ko: ['가수분해동물단백', '가수분해닭고기', '가수분해가금류단백질', '가수분해닭간', '가수분해계육단백'],
      aliases_en: ['hydrolyzed poultry protein', 'hydrolyzed chicken liver', 'hydrolyzed chicken protein', 'natural chicken flavor']
    },
    {
      id: 'ind_hydrolyzed_salmon_protein',
      name_ko: '가수분해 연어 단백 (Hydrolyzed Salmon / Fish Protein)',
      name_en: 'Hydrolyzed Salmon Protein',
      category: '가수분해 단백',
      processing_type: 'hydrolyzed',
      protein_origin: 'animal',
      aa_profile_type: 'fish_meal',
      is_anchor_1pct: false,
      moisture_g: 6.0, protein_g: 76.0, fat_g: 9.5, crude_fiber_g: 0.2, ash_g: 6.8,
      tdf_g: 0.3, soluble_fiber_g: 0.2, insoluble_fiber_g: 0.1,
      calcium_mg: 480, phosphorus_mg: 1200, omega3_g: 2.1, epa_dha_g: 1.7,
      aliases_ko: ['가수분해연어단백', '가수분해연어', '가수분해어류단백', '가수분해생선단백'],
      aliases_en: ['hydrolyzed salmon protein', 'hydrolyzed fish protein', 'hydrolyzed salmon']
    },
    {
      id: 'ind_hydrolyzed_soy_isolate',
      name_ko: '가수분해 분리대두단백 (Hydrolyzed Soy Protein Isolate)',
      name_en: 'Hydrolyzed Soy Protein Isolate',
      category: '가수분해 단백',
      processing_type: 'hydrolyzed',
      protein_origin: 'plant',
      aa_profile_type: 'soy_protein',
      is_anchor_1pct: false,
      moisture_g: 5.5, protein_g: 84.0, fat_g: 1.5, crude_fiber_g: 0.4, ash_g: 4.5,
      tdf_g: 1.0, soluble_fiber_g: 0.6, insoluble_fiber_g: 0.4,
      calcium_mg: 180, phosphorus_mg: 780, sodium_mg: 850,
      aliases_ko: ['가수분해대두단백', '가수분해분리대두단백', '분리대두단백', '가수분해식물성단백'],
      aliases_en: ['hydrolyzed soy protein', 'soy protein isolate', 'hydrolyzed vegetable protein']
    },
    {
      id: 'ind_hydrolyzed_feather_meal',
      name_ko: '가수분해 가금류 깃털단백 (Hydrolyzed Poultry Feather Protein - 초저분자)',
      name_en: 'Hydrolyzed Poultry Feathers (Low Molecular Weight)',
      category: '가수분해 단백',
      processing_type: 'hydrolyzed',
      protein_origin: 'animal',
      aa_profile_type: 'hydrolyzed_feather',
      is_anchor_1pct: false,
      moisture_g: 6.5, protein_g: 83.0, fat_g: 4.5, crude_fiber_g: 0.8, ash_g: 3.2,
      tdf_g: 1.0, soluble_fiber_g: 0.2, insoluble_fiber_g: 0.8,
      calcium_mg: 350, phosphorus_mg: 280,
      aliases_ko: ['가수분해깃털단백', '가수분해가금류깃털', '우모분'],
      aliases_en: ['hydrolyzed poultry feathers', 'feather meal']
    },
    {
      id: 'ind_brewers_dried_yeast',
      name_ko: '건조 맥주효모 / 효모추출물 (Brewers Dried Yeast)',
      name_en: 'Brewers Dried Yeast',
      category: '가수분해 단백',
      processing_type: 'dry_meal',
      protein_origin: 'plant',
      aa_profile_type: 'yeast_insect',
      is_anchor_1pct: false,
      moisture_g: 7.0, protein_g: 45.0, fat_g: 2.0, crude_fiber_g: 3.0, ash_g: 7.0,
      tdf_g: 18.0, soluble_fiber_g: 11.0, insoluble_fiber_g: 7.0, // 베타글루칸 & MOS 풍부
      calcium_mg: 160, phosphorus_mg: 1400, thiamin_mg: 8.5, riboflavin_mg: 4.2, niacin_mg: 44.0,
      aliases_ko: ['맥주효모', '건조맥주효모', '효모추출물', '영양효모'],
      aliases_en: ['brewers dried yeast', 'yeast extract', 'dried yeast']
    },

    // =========================================================================
    // Group 4. 식물성 농축 단백 & 두류 (Plant Protein Concentrates & Legumes) - 10종
    // =========================================================================
    {
      id: 'ind_pea_protein',
      name_ko: '완두콩 단백 농축물 (Pea Protein Concentrate/Isolate)',
      name_en: 'Pea Protein',
      category: '식물성 단백/두류',
      processing_type: 'plant_protein',
      protein_origin: 'plant',
      aa_profile_type: 'pea_legume',
      is_anchor_1pct: false,
      moisture_g: 7.5, protein_g: 76.0, fat_g: 2.8, crude_fiber_g: 1.8, ash_g: 4.2,
      tdf_g: 5.5, soluble_fiber_g: 1.8, insoluble_fiber_g: 3.7,
      calcium_mg: 140, phosphorus_mg: 820,
      aliases_ko: ['완두콩단백', '완두단백', '완두콩단백질', '분리완두단백'],
      aliases_en: ['pea protein', 'pea protein concentrate', 'pea protein isolate']
    },
    {
      id: 'ind_potato_protein',
      name_ko: '감자 단백 농축물 (Potato Protein)',
      name_en: 'Potato Protein',
      category: '식물성 단백/두류',
      processing_type: 'plant_protein',
      protein_origin: 'plant',
      aa_profile_type: 'potato_protein',
      is_anchor_1pct: false,
      moisture_g: 8.0, protein_g: 77.5, fat_g: 1.8, crude_fiber_g: 1.2, ash_g: 2.5,
      tdf_g: 3.2, soluble_fiber_g: 1.0, insoluble_fiber_g: 2.2,
      calcium_mg: 75, phosphorus_mg: 320,
      aliases_ko: ['감자단백', '감자단백질', '포테이토프로틴'],
      aliases_en: ['potato protein']
    },
    {
      id: 'ind_corn_gluten_meal',
      name_ko: '옥수수 글루텐 밀 (Corn Gluten Meal)',
      name_en: 'Corn Gluten Meal',
      category: '식물성 단백/두류',
      processing_type: 'plant_protein',
      protein_origin: 'plant',
      aa_profile_type: 'corn_gluten',
      is_anchor_1pct: false,
      moisture_g: 9.0, protein_g: 60.5, fat_g: 2.5, crude_fiber_g: 1.8, ash_g: 1.8,
      tdf_g: 4.8, soluble_fiber_g: 0.8, insoluble_fiber_g: 4.0,
      calcium_mg: 40, phosphorus_mg: 480,
      aliases_ko: ['옥수수글루텐밀', '옥수수글루텐', '콘글루텐밀', '옥수수단백'],
      aliases_en: ['corn gluten meal', 'maize gluten meal']
    },
    {
      id: 'ind_wheat_gluten',
      name_ko: '밀 글루텐 / 소맥 글루텐 (Wheat Gluten - LIP 고소화성 식물단백)',
      name_en: 'Wheat Gluten',
      category: '식물성 단백/두류',
      processing_type: 'plant_protein',
      protein_origin: 'plant',
      aa_profile_type: 'cereal_grain',
      is_anchor_1pct: false,
      moisture_g: 7.5, protein_g: 78.0, fat_g: 1.5, crude_fiber_g: 0.6, ash_g: 1.0,
      tdf_g: 2.0, soluble_fiber_g: 0.8, insoluble_fiber_g: 1.2,
      calcium_mg: 90, phosphorus_mg: 260,
      aliases_ko: ['밀글루텐', '소맥글루텐', '정제밀단백'],
      aliases_en: ['wheat gluten', 'vital wheat gluten']
    },
    {
      id: 'ind_soybean_meal',
      name_ko: '탈피 대두박 (Dehulled Soybean Meal)',
      name_en: 'Soybean Meal',
      category: '식물성 단백/두류',
      processing_type: 'plant_protein',
      protein_origin: 'plant',
      aa_profile_type: 'soy_protein',
      is_anchor_1pct: false,
      moisture_g: 10.0, protein_g: 47.5, fat_g: 1.8, crude_fiber_g: 3.8, ash_g: 6.2,
      tdf_g: 17.5, soluble_fiber_g: 5.5, insoluble_fiber_g: 12.0,
      calcium_mg: 290, phosphorus_mg: 650, potassium_mg: 2100,
      aliases_ko: ['대두박', '탈피대두박', '대두분말', '콩분말'],
      aliases_en: ['soybean meal', 'dehulled soybean meal', 'soy flour']
    },
    {
      id: 'ind_whole_peas',
      name_ko: '완두콩 / 녹색·노란 완두콩 (Whole Green/Yellow Peas)',
      name_en: 'Whole Peas (Green / Yellow Split Peas)',
      category: '식물성 단백/두류',
      processing_type: 'grain_starch',
      protein_origin: 'plant',
      aa_profile_type: 'pea_legume',
      is_anchor_1pct: false,
      moisture_g: 11.0, protein_g: 22.5, fat_g: 1.4, crude_fiber_g: 5.5, ash_g: 3.0,
      tdf_g: 18.5, soluble_fiber_g: 4.5, insoluble_fiber_g: 14.0,
      calcium_mg: 85, phosphorus_mg: 380, potassium_mg: 980,
      aliases_ko: ['완두콩', '녹색완두콩', '노란완두콩', '그린피스', '완두'],
      aliases_en: ['whole peas', 'green peas', 'yellow peas', 'split peas', 'peas']
    },
    {
      id: 'ind_red_lentils',
      name_ko: '렌틸콩 / 적렌틸·녹렌틸 (Red / Green Lentils)',
      name_en: 'Lentils (Red / Green)',
      category: '식물성 단백/두류',
      processing_type: 'grain_starch',
      protein_origin: 'plant',
      aa_profile_type: 'pea_legume',
      is_anchor_1pct: false,
      moisture_g: 10.5, protein_g: 24.5, fat_g: 1.2, crude_fiber_g: 4.8, ash_g: 2.8,
      tdf_g: 17.0, soluble_fiber_g: 4.2, insoluble_fiber_g: 12.8,
      calcium_mg: 70, phosphorus_mg: 410, iron_mg: 6.8,
      aliases_ko: ['렌틸콩', '적렌틸콩', '녹렌틸콩', '렌즈콩'],
      aliases_en: ['red lentils', 'green lentils', 'lentils']
    },
    {
      id: 'ind_chickpeas',
      name_ko: '병아리콩 / 가르반조빈 (Chickpeas / Garbanzo Beans)',
      name_en: 'Chickpeas',
      category: '식물성 단백/두류',
      processing_type: 'grain_starch',
      protein_origin: 'plant',
      aa_profile_type: 'pea_legume',
      is_anchor_1pct: false,
      moisture_g: 10.5, protein_g: 20.5, fat_g: 5.5, crude_fiber_g: 5.2, ash_g: 3.1,
      tdf_g: 16.5, soluble_fiber_g: 4.8, insoluble_fiber_g: 11.7,
      calcium_mg: 105, phosphorus_mg: 360,
      aliases_ko: ['병아리콩', '이집트콩', '가르반조빈'],
      aliases_en: ['chickpeas', 'garbanzo beans']
    },
    {
      id: 'ind_pinto_navy_beans',
      name_ko: '강낭콩 / 핀토빈 / 네이비빈 (Pinto / Navy Beans)',
      name_en: 'Pinto / Navy Beans',
      category: '식물성 단백/두류',
      processing_type: 'grain_starch',
      protein_origin: 'plant',
      aa_profile_type: 'pea_legume',
      is_anchor_1pct: false,
      moisture_g: 11.0, protein_g: 22.0, fat_g: 1.5, crude_fiber_g: 5.8, ash_g: 3.6,
      tdf_g: 21.0, soluble_fiber_g: 6.5, insoluble_fiber_g: 14.5,
      calcium_mg: 135, phosphorus_mg: 420,
      aliases_ko: ['강낭콩', '핀토빈', '네이비빈', '흰강낭콩'],
      aliases_en: ['pinto beans', 'navy beans', 'kidney beans']
    },
    {
      id: 'ind_pea_starch',
      name_ko: '완두 전분 / 완두 가루 (Pea Starch / Pea Flour)',
      name_en: 'Pea Starch / Pea Flour',
      category: '식물성 단백/두류',
      processing_type: 'grain_starch',
      protein_origin: 'plant',
      aa_profile_type: 'pea_legume',
      is_anchor_1pct: false,
      moisture_g: 10.5, protein_g: 8.5, fat_g: 0.8, crude_fiber_g: 1.5, ash_g: 1.2,
      tdf_g: 6.5, soluble_fiber_g: 2.0, insoluble_fiber_g: 4.5,
      calcium_mg: 35, phosphorus_mg: 140,
      aliases_ko: ['완두전분', '완두콩전분', '완두가루'],
      aliases_en: ['pea starch', 'pea flour']
    },

    // =========================================================================
    // Group 5. 곡류 및 전분 원료 (Grains & Tubers/Starches) - 10종
    // =========================================================================
    {
      id: 'ind_brewers_rice',
      name_ko: '백미 / 세미 / 쌀 (Brewers Rice / White Rice)',
      name_en: 'Brewers Rice / White Rice',
      category: '곡류/전분',
      processing_type: 'grain_starch',
      protein_origin: 'plant',
      aa_profile_type: 'cereal_grain',
      is_anchor_1pct: false,
      moisture_g: 11.5, protein_g: 7.8, fat_g: 1.2, crude_fiber_g: 0.8, ash_g: 0.7,
      tdf_g: 2.4, soluble_fiber_g: 0.6, insoluble_fiber_g: 1.8,
      calcium_mg: 12, phosphorus_mg: 115, sodium_mg: 8,
      aliases_ko: ['쌀', '백미', '세미', '미강제거쌀', '쌀가루'],
      aliases_en: ['brewers rice', 'white rice', 'rice', 'rice flour']
    },
    {
      id: 'ind_brown_rice',
      name_ko: '현미 (Whole Brown Rice)',
      name_en: 'Brown Rice',
      category: '곡류/전분',
      processing_type: 'grain_starch',
      protein_origin: 'plant',
      aa_profile_type: 'cereal_grain',
      is_anchor_1pct: false,
      moisture_g: 11.5, protein_g: 8.5, fat_g: 2.7, crude_fiber_g: 1.9, ash_g: 1.4,
      tdf_g: 4.6, soluble_fiber_g: 0.9, insoluble_fiber_g: 3.7,
      calcium_mg: 24, phosphorus_mg: 290, magnesium_mg: 125,
      aliases_ko: ['현미', '통현미', '발아현미'],
      aliases_en: ['brown rice', 'whole grain brown rice']
    },
    {
      id: 'ind_whole_yellow_corn',
      name_ko: '옥수수 / 옥수수가루 (Whole Yellow Corn / Corn Meal)',
      name_en: 'Whole Yellow Corn / Corn Meal',
      category: '곡류/전분',
      processing_type: 'grain_starch',
      protein_origin: 'plant',
      aa_profile_type: 'cereal_grain',
      is_anchor_1pct: false,
      moisture_g: 12.0, protein_g: 8.8, fat_g: 3.8, crude_fiber_g: 2.2, ash_g: 1.3,
      tdf_g: 7.8, soluble_fiber_g: 1.2, insoluble_fiber_g: 6.6,
      calcium_mg: 10, phosphorus_mg: 260,
      aliases_ko: ['옥수수', '옥수수가루', '옥수수전분', '콘밀'],
      aliases_en: ['whole grain corn', 'corn', 'corn meal', 'maize', 'corn flour']
    },
    {
      id: 'ind_whole_wheat',
      name_ko: '밀 / 소맥 / 통밀 (Whole Wheat / Wheat Flour)',
      name_en: 'Whole Wheat / Wheat Middlings',
      category: '곡류/전분',
      processing_type: 'grain_starch',
      protein_origin: 'plant',
      aa_profile_type: 'cereal_grain',
      is_anchor_1pct: false,
      moisture_g: 11.5, protein_g: 12.0, fat_g: 2.0, crude_fiber_g: 2.6, ash_g: 1.7,
      tdf_g: 10.8, soluble_fiber_g: 2.3, insoluble_fiber_g: 8.5,
      calcium_mg: 38, phosphorus_mg: 340,
      aliases_ko: ['밀', '통밀', '소맥', '밀가루', '소맥분'],
      aliases_en: ['whole grain wheat', 'wheat', 'wheat flour']
    },
    {
      id: 'ind_oat_groats',
      name_ko: '귀리 / 오트밀 (Oat Groats / Oatmeal)',
      name_en: 'Oat Groats / Oatmeal',
      category: '곡류/전분',
      processing_type: 'grain_starch',
      protein_origin: 'plant',
      aa_profile_type: 'cereal_grain',
      is_anchor_1pct: false,
      moisture_g: 10.5, protein_g: 13.5, fat_g: 6.2, crude_fiber_g: 2.8, ash_g: 2.0,
      tdf_g: 10.6, soluble_fiber_g: 4.8, insoluble_fiber_g: 5.8, // 수용성 베타글루칸 풍부
      calcium_mg: 52, phosphorus_mg: 410,
      aliases_ko: ['귀리', '오트밀', '통귀리', '압착귀리'],
      aliases_en: ['oat groats', 'oatmeal', 'whole oats', 'oats']
    },
    {
      id: 'ind_pearled_barley',
      name_ko: '보리 / 늘보리 (Pearled Barley / Whole Barley)',
      name_en: 'Pearled Barley',
      category: '곡류/전분',
      processing_type: 'grain_starch',
      protein_origin: 'plant',
      aa_profile_type: 'cereal_grain',
      is_anchor_1pct: false,
      moisture_g: 11.0, protein_g: 11.0, fat_g: 1.9, crude_fiber_g: 3.8, ash_g: 2.1,
      tdf_g: 14.5, soluble_fiber_g: 5.2, insoluble_fiber_g: 9.3, // 수용성 베타글루칸 풍부
      calcium_mg: 36, phosphorus_mg: 310,
      aliases_ko: ['보리', '늘보리', '통보리', '찰보리'],
      aliases_en: ['pearled barley', 'cracked pearled barley', 'barley']
    },
    {
      id: 'ind_sorghum_milo',
      name_ko: '수수 / 마일로 (Whole Grain Sorghum / Milo)',
      name_en: 'Whole Grain Sorghum',
      category: '곡류/전분',
      processing_type: 'grain_starch',
      protein_origin: 'plant',
      aa_profile_type: 'cereal_grain',
      is_anchor_1pct: false,
      moisture_g: 11.5, protein_g: 10.2, fat_g: 3.1, crude_fiber_g: 2.4, ash_g: 1.6,
      tdf_g: 8.2, soluble_fiber_g: 1.1, insoluble_fiber_g: 7.1,
      calcium_mg: 22, phosphorus_mg: 285,
      aliases_ko: ['수수', '통수수', '마일로'],
      aliases_en: ['whole grain sorghum', 'sorghum', 'milo']
    },
    {
      id: 'ind_dehydrated_potato',
      name_ko: '건조 감자 / 감자가루 (Dehydrated Potato / Potato Flour)',
      name_en: 'Dehydrated Potato',
      category: '곡류/전분',
      processing_type: 'grain_starch',
      protein_origin: 'plant',
      aa_profile_type: 'potato_protein',
      is_anchor_1pct: false,
      moisture_g: 9.0, protein_g: 8.2, fat_g: 0.8, crude_fiber_g: 2.2, ash_g: 3.8,
      tdf_g: 6.8, soluble_fiber_g: 2.6, insoluble_fiber_g: 4.2,
      calcium_mg: 45, phosphorus_mg: 210, potassium_mg: 1450,
      aliases_ko: ['감자가루', '건조감자', '감자', '감자전분'],
      aliases_en: ['dehydrated potato', 'dried potatoes', 'potatoes', 'potato flour']
    },
    {
      id: 'ind_dehydrated_sweet_potato',
      name_ko: '건조 고구마 / 고구마분말 (Dehydrated Sweet Potato)',
      name_en: 'Dehydrated Sweet Potato',
      category: '곡류/전분',
      processing_type: 'grain_starch',
      protein_origin: 'plant',
      aa_profile_type: 'cereal_grain',
      is_anchor_1pct: false,
      moisture_g: 9.5, protein_g: 5.5, fat_g: 0.7, crude_fiber_g: 3.2, ash_g: 3.1,
      tdf_g: 9.8, soluble_fiber_g: 3.8, insoluble_fiber_g: 6.0,
      calcium_mg: 95, phosphorus_mg: 165, vitamin_a_ug: 2800,
      aliases_ko: ['고구마', '건조고구마', '고구마가루', '고구마분말'],
      aliases_en: ['sweet potatoes', 'dried sweet potato', 'dehydrated sweet potato']
    },
    {
      id: 'ind_tapioca_starch',
      name_ko: '타피오카 전분 / 카사바 (Tapioca Starch / Cassava Root)',
      name_en: 'Tapioca Starch / Cassava',
      category: '곡류/전분',
      processing_type: 'grain_starch',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: false,
      moisture_g: 11.0, protein_g: 0.6, fat_g: 0.2, crude_fiber_g: 0.5, ash_g: 0.4,
      tdf_g: 1.8, soluble_fiber_g: 0.6, insoluble_fiber_g: 1.2,
      calcium_mg: 20, phosphorus_mg: 12,
      aliases_ko: ['타피오카', '타피오카전분', '카사바'],
      aliases_en: ['tapioca', 'tapioca starch', 'cassava']
    },

    // =========================================================================
    // Group 6. 기능성 식이섬유 & 프리바이오틱스 (Dietary Fibers & Prebiotics) - 10종
    // =========================================================================
    {
      id: 'ind_dried_beet_pulp',
      name_ko: '비트펄프 / 건조 사탕무박 (Dried Plain Beet Pulp)',
      name_en: 'Dried Beet Pulp',
      category: '식이섬유/프리바이오틱스',
      processing_type: 'fiber_source',
      protein_origin: 'plant',
      aa_profile_type: 'cereal_grain',
      is_anchor_1pct: false,
      moisture_g: 9.5, protein_g: 8.8, fat_g: 0.9, crude_fiber_g: 19.0, ash_g: 5.5,
      tdf_g: 64.0, soluble_fiber_g: 21.0, insoluble_fiber_g: 43.0, // 황금 비율 발효성 섬유소
      calcium_mg: 680, phosphorus_mg: 95,
      aliases_ko: ['비트펄프', '건조비트펄프', '사탕무박', '정제비트펄프'],
      aliases_en: ['dried beet pulp', 'dried plain beet pulp', 'beet pulp']
    },
    {
      id: 'ind_powdered_cellulose',
      name_ko: '분말 셀룰로오스 / 정제 섬유소 (Powdered Cellulose)',
      name_en: 'Powdered Cellulose',
      category: '식이섬유/프리바이오틱스',
      processing_type: 'fiber_source',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: false,
      moisture_g: 6.0, protein_g: 0.2, fat_g: 0.1, crude_fiber_g: 72.0, ash_g: 0.4,
      tdf_g: 93.0, soluble_fiber_g: 1.5, insoluble_fiber_g: 91.5, // 순수 불용성 식이섬유
      calcium_mg: 10, phosphorus_mg: 5,
      aliases_ko: ['셀룰로오스', '분말셀룰로오스', '정제섬유소', '식물성섬유소'],
      aliases_en: ['powdered cellulose', 'cellulose', 'purified vegetable fiber']
    },
    {
      id: 'ind_psyllium_husk',
      name_ko: '차전자피 / 실리움 허스크 (Psyllium Seed Husk)',
      name_en: 'Psyllium Seed Husk',
      category: '식이섬유/프리바이오틱스',
      processing_type: 'fiber_source',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: false,
      moisture_g: 8.0, protein_g: 2.5, fat_g: 0.6, crude_fiber_g: 4.2, ash_g: 2.8,
      tdf_g: 84.0, soluble_fiber_g: 70.0, insoluble_fiber_g: 14.0, // 조섬유는 4.2%이나 수용성 섬유소가 70%!
      calcium_mg: 150, phosphorus_mg: 80,
      aliases_ko: ['차전자피', '질경이씨앗껍질', '실리움허스크'],
      aliases_en: ['psyllium seed husk', 'psyllium husk', 'psyllium']
    },
    {
      id: 'ind_chicory_inulin',
      name_ko: '치커리뿌리 추출물 / 이눌린 (Dried Chicory Root / Inulin)',
      name_en: 'Dried Chicory Root / Inulin',
      category: '식이섬유/프리바이오틱스',
      processing_type: 'fiber_source',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: false,
      moisture_g: 6.0, protein_g: 4.5, fat_g: 0.5, crude_fiber_g: 3.5, ash_g: 4.0,
      tdf_g: 82.0, soluble_fiber_g: 74.0, insoluble_fiber_g: 8.0, // 수용성 프리바이오틱 섬유소
      calcium_mg: 180, phosphorus_mg: 140,
      aliases_ko: ['치커리뿌리', '이눌린', '치커리추출물', '건조치커리뿌리'],
      aliases_en: ['dried chicory root', 'chicory root', 'inulin']
    },
    {
      id: 'ind_fructooligosaccharides',
      name_ko: '프락토올리고당 / 만난올리고당 (FOS / MOS Prebiotics)',
      name_en: 'Fructooligosaccharides (FOS) / MOS',
      category: '식이섬유/프리바이오틱스',
      processing_type: 'fiber_source',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: true,
      moisture_g: 4.5, protein_g: 1.0, fat_g: 0.1, crude_fiber_g: 0.5, ash_g: 1.0,
      tdf_g: 92.0, soluble_fiber_g: 91.0, insoluble_fiber_g: 1.0, // 조섬유 분석에는 안 잡히는 순수 수용성 섬유
      calcium_mg: 20, phosphorus_mg: 30,
      aliases_ko: ['프락토올리고당', '만난올리고당', '올리고당', '프리바이오틱스', 'FOS', 'MOS'],
      aliases_en: ['fructooligosaccharides', 'fos', 'mannanoligosaccharides', 'mos']
    },
    {
      id: 'ind_dried_pumpkin',
      name_ko: '건조 단호박 / 호박 분말 (Dried Pumpkin)',
      name_en: 'Dried Pumpkin',
      category: '식이섬유/프리바이오틱스',
      processing_type: 'fiber_source',
      protein_origin: 'plant',
      aa_profile_type: 'cereal_grain',
      is_anchor_1pct: false,
      moisture_g: 8.5, protein_g: 9.0, fat_g: 1.8, crude_fiber_g: 11.5, ash_g: 6.5,
      tdf_g: 38.0, soluble_fiber_g: 16.5, insoluble_fiber_g: 21.5, // 수용성 펙틴 풍부
      calcium_mg: 210, phosphorus_mg: 320, potassium_mg: 1850,
      aliases_ko: ['호박', '단호박', '건조호박', '호박분말'],
      aliases_en: ['dried pumpkin', 'pumpkin', 'butternut squash']
    },
    {
      id: 'ind_pea_fiber',
      name_ko: '완두콩 섬유질 / 완두피 (Pea Fiber)',
      name_en: 'Pea Fiber',
      category: '식이섬유/프리바이오틱스',
      processing_type: 'fiber_source',
      protein_origin: 'plant',
      aa_profile_type: 'pea_legume',
      is_anchor_1pct: false,
      moisture_g: 8.0, protein_g: 7.5, fat_g: 0.8, crude_fiber_g: 45.0, ash_g: 3.0,
      tdf_g: 78.0, soluble_fiber_g: 8.0, insoluble_fiber_g: 70.0,
      calcium_mg: 550, phosphorus_mg: 110,
      aliases_ko: ['완두섬유질', '완두콩섬유질', '완두식이섬유'],
      aliases_en: ['pea fiber', 'pea hulls']
    },
    {
      id: 'ind_apple_pomace',
      name_ko: '건조 사과 / 사과박 (Dried Apple Pomace)',
      name_en: 'Dried Apple / Apple Pomace',
      category: '식이섬유/프리바이오틱스',
      processing_type: 'fiber_source',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: false,
      moisture_g: 9.0, protein_g: 4.5, fat_g: 2.2, crude_fiber_g: 15.0, ash_g: 2.2,
      tdf_g: 48.0, soluble_fiber_g: 18.0, insoluble_fiber_g: 30.0, // 사과 펙틴
      calcium_mg: 110, phosphorus_mg: 90,
      aliases_ko: ['사과', '건조사과', '사과박', '사과섬유질'],
      aliases_en: ['dried apple', 'apple pomace', 'apples', 'apple']
    },
    {
      id: 'ind_alfalfa_meal',
      name_ko: '알팔파 분말 (Sun-Cured Alfalfa Meal)',
      name_en: 'Dehydrated Alfalfa Meal',
      category: '식이섬유/프리바이오틱스',
      processing_type: 'fiber_source',
      protein_origin: 'plant',
      aa_profile_type: 'pea_legume',
      is_anchor_1pct: false,
      moisture_g: 9.0, protein_g: 17.0, fat_g: 2.5, crude_fiber_g: 24.0, ash_g: 9.5,
      tdf_g: 46.0, soluble_fiber_g: 6.0, insoluble_fiber_g: 40.0,
      calcium_mg: 1450, phosphorus_mg: 240,
      aliases_ko: ['알팔파', '건조알팔파', '알팔파분말'],
      aliases_en: ['alfalfa meal', 'sun-cured alfalfa', 'dehydrated alfalfa']
    },
    {
      id: 'ind_berries_botanicals',
      name_ko: '건조 크랜베리/블루베리/당근/시금치 (Dried Fruits & Vegetables)',
      name_en: 'Dried Blueberries / Cranberries / Carrots',
      category: '식이섬유/프리바이오틱스',
      processing_type: 'fiber_source',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: false,
      moisture_g: 10.0, protein_g: 5.0, fat_g: 1.5, crude_fiber_g: 8.5, ash_g: 4.2,
      tdf_g: 28.0, soluble_fiber_g: 11.0, insoluble_fiber_g: 17.0,
      calcium_mg: 180, phosphorus_mg: 150, vitamin_a_ug: 1800, vitamin_e_mg: 8.5,
      aliases_ko: ['블루베리', '크랜베리', '당근', '시금치', '브로콜리', '케일', '토마토박'],
      aliases_en: ['blueberries', 'cranberries', 'carrots', 'spinach', 'tomato pomace']
    },

    // =========================================================================
    // Group 7. 유지류 및 오메가 지방산 원료 (Fats, Oils & Oilseeds) - 6종
    // =========================================================================
    {
      id: 'ind_chicken_fat',
      name_ko: '정제 계유 / 동물성 지방 (Chicken Fat / Animal Fat)',
      name_en: 'Chicken Fat (Preserved with Mixed Tocopherols)',
      category: '유지류(Fat/Oil)',
      processing_type: 'fat_oil',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: false,
      moisture_g: 0.5, protein_g: 0.0, fat_g: 99.0, crude_fiber_g: 0.0, ash_g: 0.1,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 0, phosphorus_mg: 0, omega3_g: 1.2, omega6_g: 21.5, epa_dha_g: 0.0,
      aliases_ko: ['동물성지방', '정제계유', '닭기름', '닭지방', '가금류지방', '우지', '돈지'],
      aliases_en: ['chicken fat', 'animal fat', 'poultry fat', 'pork fat', 'beef tallow']
    },
    {
      id: 'ind_salmon_fish_oil',
      name_ko: '정제 어유 / 연어 오일 (Salmon Oil / Menhaden Fish Oil)',
      name_en: 'Salmon Oil / Fish Oil',
      category: '유지류(Fat/Oil)',
      processing_type: 'fat_oil',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: false,
      moisture_g: 0.3, protein_g: 0.0, fat_g: 99.5, crude_fiber_g: 0.0, ash_g: 0.1,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 0, phosphorus_mg: 0, omega3_g: 28.5, omega6_g: 2.5, epa_dha_g: 24.0, vitamin_d_ug: 25.0,
      aliases_ko: ['어유', '연어유', '연어오일', '정제어유', '청어오일', '멸치오일', '오메가3오일'],
      aliases_en: ['fish oil', 'salmon oil', 'menhaden fish oil', 'herring oil', 'anchovy oil']
    },
    {
      id: 'ind_soybean_canola_oil',
      name_ko: '대두유 / 카놀라유 / 해바라기유 (Soybean / Canola / Sunflower Oil)',
      name_en: 'Soybean Oil / Canola Oil',
      category: '유지류(Fat/Oil)',
      processing_type: 'fat_oil',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: false,
      moisture_g: 0.2, protein_g: 0.0, fat_g: 99.6, crude_fiber_g: 0.0, ash_g: 0.0,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 0, phosphorus_mg: 0, omega3_g: 8.5, omega6_g: 48.0, epa_dha_g: 0.0, vitamin_e_mg: 18.0,
      aliases_ko: ['콩기름', '대두유', '카놀라유', '채종유', '해바라기유', '식물성유지'],
      aliases_en: ['soybean oil', 'canola oil', 'sunflower oil', 'vegetable oil']
    },
    {
      id: 'ind_coconut_mct_oil',
      name_ko: '코코넛 오일 / 중쇄지방산 (Coconut Oil / MCT Oil)',
      name_en: 'Coconut Oil / MCT Oil',
      category: '유지류(Fat/Oil)',
      processing_type: 'fat_oil',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: false,
      moisture_g: 0.2, protein_g: 0.0, fat_g: 99.6, crude_fiber_g: 0.0, ash_g: 0.0,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 0, phosphorus_mg: 0, omega3_g: 0.0, omega6_g: 1.8, epa_dha_g: 0.0,
      aliases_ko: ['코코넛오일', '야자유', '중쇄지방산', 'MCT오일'],
      aliases_en: ['coconut oil', 'mct oil']
    },
    {
      id: 'ind_whole_flaxseed',
      name_ko: '아마씨 / 분쇄 아마종자 (Whole Ground Flaxseed)',
      name_en: 'Whole Ground Flaxseed',
      category: '유지류(Fat/Oil)',
      processing_type: 'grain_starch',
      protein_origin: 'plant',
      aa_profile_type: 'soy_protein',
      is_anchor_1pct: false,
      moisture_g: 7.5, protein_g: 19.5, fat_g: 38.0, crude_fiber_g: 8.0, ash_g: 3.8,
      tdf_g: 27.5, soluble_fiber_g: 9.5, insoluble_fiber_g: 18.0, // 수용성 뮤실리지 + ALA 오메가3
      calcium_mg: 250, phosphorus_mg: 620, omega3_g: 21.5, omega6_g: 5.8, epa_dha_g: 0.0,
      aliases_ko: ['아마씨', '통아마씨', '분쇄아마씨', '아마종자'],
      aliases_en: ['flaxseed', 'ground flaxseed', 'whole flaxseed', 'linseed']
    },
    {
      id: 'ind_algal_oil',
      name_ko: '미세조류 오일 / 해조류 추출물 (Marine Microalgae Oil - 고농축 DHA)',
      name_en: 'Marine Microalgae Oil (Schizochytrium)',
      category: '유지류(Fat/Oil)',
      processing_type: 'fat_oil',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: true,
      moisture_g: 1.0, protein_g: 2.0, fat_g: 92.0, crude_fiber_g: 0.5, ash_g: 2.0,
      tdf_g: 1.0, soluble_fiber_g: 0.8, insoluble_fiber_g: 0.2,
      calcium_mg: 50, phosphorus_mg: 80, omega3_g: 42.0, omega6_g: 1.5, epa_dha_g: 40.0, iodine_ug: 850,
      aliases_ko: ['미세조류오일', '해조류오일', '스키조키트리움', '다시마분말', '해조분말'],
      aliases_en: ['algal oil', 'marine microalgae', 'schizochytrium', 'dried kelp']
    },

    // =========================================================================
    // Group 8. 미네랄 / 비타민 / 아미노산 / 1% 앵커 첨가제 (Anchor Additives & Premixes) - 10종
    // =========================================================================
    {
      id: 'ind_salt_nacl',
      name_ko: '정제염 / 소금 (Salt / Sodium Chloride) ★[1% 미만 기준점 Anchor]',
      name_en: 'Salt (Sodium Chloride)',
      category: '미네랄/1%앵커',
      processing_type: 'anchor_additive',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: true, // 소금 등장 시점부터 이후 원재료는 < 1%
      moisture_g: 0.5, protein_g: 0.0, fat_g: 0.0, crude_fiber_g: 0.0, ash_g: 99.0,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 25, phosphorus_mg: 0, sodium_mg: 38800, potassium_mg: 10,
      aliases_ko: ['소금', '정제염', '천일염', '염화나트륨'],
      aliases_en: ['salt', 'sea salt', 'sodium chloride']
    },
    {
      id: 'ind_taurine_additive',
      name_ko: '타우린 (Taurine 보충제) ★[1% 미만 기준점 Anchor]',
      name_en: 'Taurine',
      category: '미네랄/1%앵커',
      processing_type: 'anchor_additive',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: true,
      moisture_g: 0.5, protein_g: 65.0, fat_g: 0.0, crude_fiber_g: 0.0, ash_g: 0.5,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 0, phosphorus_mg: 0, taurine_g: 98.5,
      aliases_ko: ['타우린', 'L-타우린'],
      aliases_en: ['taurine', 'l-taurine']
    },
    {
      id: 'ind_dl_methionine',
      name_ko: 'DL-메티오닌 (DL-Methionine 아미노산 보충제) ★[1% 미만 Anchor]',
      name_en: 'DL-Methionine',
      category: '미네랄/1%앵커',
      processing_type: 'anchor_additive',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: true,
      moisture_g: 0.5, protein_g: 58.0, fat_g: 0.0, crude_fiber_g: 0.0, ash_g: 0.5,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 0, phosphorus_mg: 0, methionine_g: 98.5,
      aliases_ko: ['DL-메티오닌', '메티오닌', 'L-메티오닌'],
      aliases_en: ['dl-methionine', 'l-methionine', 'methionine']
    },
    {
      id: 'ind_l_lysine',
      name_ko: 'L-라이신 (L-Lysine HCl 아미노산 보충제) ★[1% 미만 Anchor]',
      name_en: 'L-Lysine Monohydrochloride',
      category: '미네랄/1%앵커',
      processing_type: 'anchor_additive',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: true,
      moisture_g: 1.0, protein_g: 75.0, fat_g: 0.0, crude_fiber_g: 0.0, ash_g: 0.5,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 0, phosphorus_mg: 0, lysine_g: 78.5,
      aliases_ko: ['L-라이신', '라이신', '염산라이신'],
      aliases_en: ['l-lysine', 'lysine', 'l-lysine monohydrochloride']
    },
    {
      id: 'ind_calcium_carbonate',
      name_ko: '탄산칼슘 / 난각분말 (Calcium Carbonate)',
      name_en: 'Calcium Carbonate',
      category: '미네랄/1%앵커',
      processing_type: 'mineral_supplement',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: false, // 최대 1.5~2.0%까지 투입 가능
      moisture_g: 0.5, protein_g: 0.0, fat_g: 0.0, crude_fiber_g: 0.0, ash_g: 98.0,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 38500, phosphorus_mg: 40, magnesium_mg: 350,
      aliases_ko: ['탄산칼슘', '난각분말', '해조칼슘', '칼슘보충제'],
      aliases_en: ['calcium carbonate', 'limestone', 'eggshell powder']
    },
    {
      id: 'ind_dicalcium_phosphate',
      name_ko: '제2인산칼슘 / 인산일수소칼슘 (Dicalcium Phosphate)',
      name_en: 'Dicalcium Phosphate',
      category: '미네랄/1%앵커',
      processing_type: 'mineral_supplement',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: false,
      moisture_g: 1.5, protein_g: 0.0, fat_g: 0.0, crude_fiber_g: 0.0, ash_g: 96.0,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 22500, phosphorus_mg: 18500,
      aliases_ko: ['제2인산칼슘', '제이인산칼슘', '인산칼슘', '제1인산칼슘'],
      aliases_en: ['dicalcium phosphate', 'monocalcium phosphate', 'tricalcium phosphate']
    },
    {
      id: 'ind_potassium_chloride',
      name_ko: '염화칼륨 / 구연산칼륨 (Potassium Chloride) ★[1% 미만 Anchor]',
      name_en: 'Potassium Chloride',
      category: '미네랄/1%앵커',
      processing_type: 'anchor_additive',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: true,
      moisture_g: 0.5, protein_g: 0.0, fat_g: 0.0, crude_fiber_g: 0.0, ash_g: 99.0,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 0, phosphorus_mg: 0, potassium_mg: 51500,
      aliases_ko: ['염화칼륨', '구연산칼륨'],
      aliases_en: ['potassium chloride', 'potassium citrate']
    },
    {
      id: 'ind_chelated_mineral_premix',
      name_ko: '킬레이트/단백질화 미네랄 프리믹스 (Chelated / Proteinate Minerals) ★[1% 미만 Anchor]',
      name_en: 'Chelated Mineral Premix (Zinc/Iron/Copper/Manganese Proteinate)',
      category: '미네랄/1%앵커',
      processing_type: 'anchor_additive',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: true,
      mineral_form: 'chelated',
      moisture_g: 3.0, protein_g: 12.0, fat_g: 0.5, crude_fiber_g: 0.5, ash_g: 75.0,
      tdf_g: 0.5, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.5,
      calcium_mg: 4500, phosphorus_mg: 500, magnesium_mg: 1800,
      iron_mg: 3200, zinc_mg: 5800, copper_mg: 520, manganese_mg: 480, selenium_ug: 9500, iodine_ug: 48000,
      aliases_ko: ['단백질화아연', '단백질화철', '단백질화구리', '단백질화망간', '킬레이트미네랄', '아미노산킬레이트'],
      aliases_en: ['zinc proteinate', 'iron proteinate', 'copper proteinate', 'manganese proteinate', 'chelated minerals', 'amino acid chelate']
    },
    {
      id: 'ind_inorganic_mineral_premix',
      name_ko: '무기태 미네랄 합제 (황산철/산화아연/황산구리) ★[1% 미만 Anchor]',
      name_en: 'Inorganic Mineral Premix (Ferrous Sulfate / Zinc Oxide)',
      category: '미네랄/1%앵커',
      processing_type: 'anchor_additive',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: true,
      mineral_form: 'inorganic',
      moisture_g: 2.0, protein_g: 0.0, fat_g: 0.0, crude_fiber_g: 0.0, ash_g: 95.0,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0,
      calcium_mg: 6000, phosphorus_mg: 200, magnesium_mg: 2200,
      iron_mg: 3800, zinc_mg: 6500, copper_mg: 600, manganese_mg: 550, selenium_ug: 11000, iodine_ug: 52000,
      aliases_ko: ['황산철', '산화아연', '황산아연', '황산구리', '산화망간', '요오드산칼슘', '아셀렌산나트륨', '미네랄합제'],
      aliases_en: ['ferrous sulfate', 'zinc oxide', 'zinc sulfate', 'copper sulfate', 'manganous oxide', 'calcium iodate', 'sodium selenite', 'minerals']
    },
    {
      id: 'ind_vitamin_premix_preservative',
      name_ko: '비타민 프리믹스 / 염화콜린 / 천연보존제(토코페롤) ★[1% 미만 Anchor]',
      name_en: 'Vitamin Premix / Choline Chloride / Mixed Tocopherols',
      category: '미네랄/1%앵커',
      processing_type: 'anchor_additive',
      protein_origin: 'none',
      aa_profile_type: 'none',
      is_anchor_1pct: true,
      moisture_g: 4.0, protein_g: 2.0, fat_g: 5.0, crude_fiber_g: 1.0, ash_g: 12.0,
      tdf_g: 1.0, soluble_fiber_g: 0.5, insoluble_fiber_g: 0.5,
      calcium_mg: 800, phosphorus_mg: 100,
      vitamin_a_ug: 185000, vitamin_d_ug: 1250, vitamin_e_mg: 4200,
      thiamin_mg: 320, riboflavin_mg: 680, niacin_mg: 1850,
      pantothenic_acid_mg: 1450, vitamin_b6_mg: 280, folate_ug: 32000,
      vitamin_b12_ug: 4200, biotin_ug: 9500,
      aliases_ko: ['비타민합제', '비타민프리믹스', '염화콜린', '비타민E보충제', '혼합토코페롤', '로즈마리추출물', '비타민A보충제', '타우린'],
      aliases_en: ['vitamins', 'vitamin supplement', 'choline chloride', 'mixed tocopherols', 'rosemary extract', 'vitamin e supplement']
    }
  ];

  // 빌드된 전체 산업용 원재료 배열 및 맵
  const INDUSTRIAL_INGREDIENTS_LIST = RAW_INDUSTRIAL_INGREDIENTS.map(buildIngredient);
  const INDUSTRIAL_INGREDIENTS_MAP = {};
  INDUSTRIAL_INGREDIENTS_LIST.forEach(item => {
    INDUSTRIAL_INGREDIENTS_MAP[item.id] = item;
  });

  /**
   * 기존 일반 식품 DB(ingredients_fixed.json)의 원재료에도
   * 아미노산 13종, 수용성/불용성 식이섬유(TDF/SDF/IDF), 가공특성 필드를 자동 보강하는 어댑터 함수
   */
  function enrichGeneralDBItem(item) {
    if (!item) return null;
    if (item.arginine_g !== undefined && item.tdf_g !== undefined && item.processing_type) {
      return item;
    }

    const idStr = (item.ingredient || item.id || '').toLowerCase();
    const koStr = (item.name_ko || '').toLowerCase();
    const catStr = (item.category || '');
    const moisture = Number(item.moisture_g) || 10;

    let aaType = 'cereal_grain';
    let proteinOrigin = 'plant';
    let processingType = moisture >= 55 ? 'fresh_meat' : 'grain_starch';
    let isAnchor = false;

    if (catStr.includes('육류') || idStr.includes('chicken') || idStr.includes('turkey') || idStr.includes('duck')) {
      proteinOrigin = 'animal';
      aaType = moisture >= 50 ? 'fresh_poultry' : 'poultry_meal';
      processingType = moisture >= 50 ? 'fresh_meat' : 'dry_meal';
    } else if (idStr.includes('beef') || idStr.includes('lamb') || idStr.includes('pork') || idStr.includes('venison')) {
      proteinOrigin = 'animal';
      aaType = moisture >= 50 ? 'fresh_red_meat' : 'red_meat_meal';
      processingType = moisture >= 50 ? 'fresh_meat' : 'dry_meal';
    } else if (catStr.includes('어류') || idStr.includes('salmon') || idStr.includes('fish') || idStr.includes('herring') || idStr.includes('cod')) {
      proteinOrigin = 'animal';
      aaType = moisture >= 50 ? 'fresh_fish' : 'fish_meal';
      processingType = moisture >= 50 ? 'fresh_meat' : 'dry_meal';
    } else if (catStr.includes('난류') || idStr.includes('egg')) {
      proteinOrigin = 'animal';
      aaType = 'egg_protein';
      processingType = moisture >= 50 ? 'fresh_meat' : 'dry_meal';
    } else if (catStr.includes('콩류') || idStr.includes('pea') || idStr.includes('lentil') || idStr.includes('chickpea')) {
      proteinOrigin = 'plant';
      aaType = 'pea_legume';
      processingType = 'grain_starch';
    } else if (idStr.includes('soy')) {
      proteinOrigin = 'plant';
      aaType = 'soy_protein';
      processingType = 'plant_protein';
    } else if (catStr.includes('감자') || idStr.includes('potato')) {
      proteinOrigin = 'plant';
      aaType = 'potato_protein';
      processingType = 'grain_starch';
    } else if (catStr.includes('유지') || idStr.includes('oil') || idStr.includes('fat')) {
      proteinOrigin = 'none';
      aaType = 'none';
      processingType = 'fat_oil';
    }

    if (koStr.includes('소금') || koStr.includes('타우린') || idStr.includes('salt') || idStr.includes('taurine')) {
      isAnchor = true;
      processingType = 'anchor_additive';
    }

    const cp = Number(item.protein_g) || 0;
    const aaProfile = PROTEIN_AA_PROFILES_PER_100G_CP[aaType] || PROTEIN_AA_PROFILES_PER_100G_CP.cereal_grain;
    const factor = cp / 100.0;

    const rawTdf = Number(item.total_dietary_fiber_g) || 0;
    // 일반 식품 DB의 total_dietary_fiber_g는 이미 TDF인 경우가 많으므로 조섬유와 수용성/불용성으로 분해
    let solubleRatio = 0.25;
    if (koStr.includes('호박') || koStr.includes('사과') || koStr.includes('귀리') || koStr.includes('보리')) solubleRatio = 0.42;
    else if (catStr.includes('콩류')) solubleRatio = 0.28;
    else if (proteinOrigin === 'animal') solubleRatio = 0.0;

    const tdf = rawTdf;
    const soluble = +(tdf * solubleRatio).toFixed(2);
    const insoluble = +(Math.max(0, tdf - soluble)).toFixed(2);
    const crudeFiber = item.crude_fiber_g !== undefined ? item.crude_fiber_g : +(insoluble * 0.45).toFixed(2);

    return Object.assign({}, item, {
      id: item.ingredient || item.id,
      processing_type: item.processing_type || processingType,
      protein_origin: item.protein_origin || proteinOrigin,
      aa_profile_type: item.aa_profile_type || aaType,
      is_anchor_1pct: item.is_anchor_1pct !== undefined ? item.is_anchor_1pct : isAnchor,
      crude_fiber_g: crudeFiber,
      tdf_g: tdf,
      soluble_fiber_g: soluble,
      insoluble_fiber_g: insoluble,
      arginine_g: +(aaProfile.arginine_g * factor).toFixed(3),
      histidine_g: +(aaProfile.histidine_g * factor).toFixed(3),
      isoleucine_g: +(aaProfile.isoleucine_g * factor).toFixed(3),
      leucine_g: +(aaProfile.leucine_g * factor).toFixed(3),
      lysine_g: +(aaProfile.lysine_g * factor).toFixed(3),
      methionine_g: +(aaProfile.methionine_g * factor).toFixed(3),
      cystine_g: +(aaProfile.cystine_g * factor).toFixed(3),
      methionine_cystine_g: +((aaProfile.methionine_g + aaProfile.cystine_g) * factor).toFixed(3),
      phenylalanine_g: +(aaProfile.phenylalanine_g * factor).toFixed(3),
      tyrosine_g: +(aaProfile.tyrosine_g * factor).toFixed(3),
      phenylalanine_tyrosine_g: +((aaProfile.phenylalanine_g + aaProfile.tyrosine_g) * factor).toFixed(3),
      threonine_g: +(aaProfile.threonine_g * factor).toFixed(3),
      tryptophan_g: +(aaProfile.tryptophan_g * factor).toFixed(3),
      valine_g: +(aaProfile.valine_g * factor).toFixed(3),
      taurine_g: +(aaProfile.taurine_g * factor).toFixed(3)
    });
  }

  /**
   * 라벨의 원재료 토큰 문자열로부터 최적의 산업용 원재료 ID를 매칭하는 스마트 파서
   * (예: "닭고기분말" -> ind_chicken_meal, "생닭고기" -> ind_fresh_chicken, "가수분해연어단백" -> ind_hydrolyzed_salmon_protein)
   */
  function matchIndustrialIngredient(rawToken, combinedDB) {
    if (!rawToken) return null;
    const clean = rawToken.trim().toLowerCase().replace(/\s+/g, '');
    const rawLower = rawToken.trim().toLowerCase();

    // 1. 산업용 원재료 DB의 aliases_ko / aliases_en 정밀 매칭 (가장 긴 키워드 일치 우선)
    let bestMatch = null;
    let bestScore = 0;

    INDUSTRIAL_INGREDIENTS_LIST.forEach(item => {
      (item.aliases_ko || []).forEach(alias => {
        const cleanAlias = alias.toLowerCase().replace(/\s+/g, '');
        if (clean === cleanAlias) {
          if (100 + cleanAlias.length > bestScore) {
            bestScore = 100 + cleanAlias.length;
            bestMatch = item;
          }
        } else if (clean.includes(cleanAlias) || cleanAlias.includes(clean)) {
          const score = 50 + Math.min(clean.length, cleanAlias.length);
          // 가수분해 / 분말 / 생육 수식어 우선순위 부여
          let bonus = 0;
          if (clean.includes('가수분해') && item.processing_type === 'hydrolyzed') bonus += 30;
          if ((clean.includes('분말') || clean.includes('육분') || clean.includes('밀') || clean.includes('건조') || clean.includes('탈수')) && item.processing_type === 'dry_meal') bonus += 25;
          if ((clean.includes('생') || clean.includes('신선') || clean.includes('뼈를발라낸')) && item.processing_type === 'fresh_meat') bonus += 25;
          if (score + bonus > bestScore) {
            bestScore = score + bonus;
            bestMatch = item;
          }
        }
      });

      (item.aliases_en || []).forEach(alias => {
        const al = alias.toLowerCase();
        if (rawLower === al) {
          if (100 + al.length > bestScore) {
            bestScore = 100 + al.length;
            bestMatch = item;
          }
        } else if (rawLower.includes(al)) {
          const score = 55 + al.length;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = item;
          }
        }
      });
    });

    if (bestMatch) return bestMatch;

    // 2. 결합된 DB 내 일반 검색 폴백
    if (combinedDB) {
      const dbValues = Object.values(combinedDB);
      const found = dbValues.find(x => (x.name_ko && x.name_ko.includes(rawToken.trim())) || (x.ingredient && x.ingredient.toLowerCase().includes(rawLower)));
      if (found) return enrichGeneralDBItem(found);
    }

    return null;
  }

  /**
   * 전체 DB 병합: 산업용 원재료 DB를 최우선으로 등록하고 기존 일반 식품 DB를 통합
   */
  function mergeWithGeneralDB(generalDBArrayOrMap) {
    const merged = {};
    // 1) 산업용 원재료 54종 최우선 등록
    INDUSTRIAL_INGREDIENTS_LIST.forEach(item => {
      merged[item.id] = item;
    });

    // 2) 일반 식품 DB 등록 및 영양소 벡터 확장
    if (Array.isArray(generalDBArrayOrMap)) {
      generalDBArrayOrMap.forEach(raw => {
        const key = raw.ingredient || raw.id;
        if (key && !merged[key]) {
          merged[key] = enrichGeneralDBItem(raw);
        }
      });
    } else if (generalDBArrayOrMap && typeof generalDBArrayOrMap === 'object') {
      Object.keys(generalDBArrayOrMap).forEach(key => {
        if (!merged[key]) {
          merged[key] = enrichGeneralDBItem(generalDBArrayOrMap[key]);
        }
      });
    }

    return merged;
  }

  return {
    AMINO_ACID_KEYS,
    PROTEIN_AA_PROFILES_PER_100G_CP,
    INDUSTRIAL_INGREDIENTS_LIST,
    INDUSTRIAL_INGREDIENTS_MAP,
    buildIngredient,
    enrichGeneralDBItem,
    matchIndustrialIngredient,
    mergeWithGeneralDB
  };

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeedIngredientDB;
}

if (typeof window !== "undefined") window.FeedIngredientDB = FeedIngredientDB;

/**
 * archetype_db.js
 * [4단계] '아키타입(Archetype) 클러스터링' 표준 사료 군집 템플릿 DB 및 비례 보정(Scaling) 매핑 엔진
 * - 레퍼런스 소스: Hill's(힐스), Royal Canin(로얄캐닌), Purina Pro Plan(퓨리나), Farmina N&D(파미나),
 *   Orijen(오리젠), Acana(아카나), Now Fresh(나우) 등 글로벌 브랜드 Product Guide (Typical Analysis / Dry Matter 기준 상세 영양표)
 * - 18가지 대표 사료 아키타입(Archetype) 클러스터 정의
 * - 신규 국내외 사료 입력 시 원재료 순서 + 등록성분량을 기반으로 가장 유사한 아키타입 Top-3를 매칭하고,
 *   해당 사료의 조단백·조지방·조섬유·조회분 비율에 맞춰 세부 영양소(아미노산, TDF, 미량 미네랄)를 비례 보정(Scaling)
 */

const ArchetypeDB = (function() {

  /**
   * 18종 글로벌 표준 사료 아키타입 템플릿 (100g Dry Matter 건물 기준 상세 영양소 프로파일)
   */
  const ARCHETYPES = [
    {
      id: 'ARCH_01_POULTRY_GRAIN_ADULT',
      code: 'Type A',
      name: '가금류+곡물 기반 일반 성견 건사료',
      referenceBrands: 'Royal Canin Mini Adult / Purina Pro Plan Adult Chicken & Rice',
      feedForm: 'dry',
      isPrescription: false,
      isGrainFree: false,
      baseConfidence: 82,
      description: '가금류 육분과 쌀/옥수수/밀을 배합하고 비트펄프·프락토올리고당으로 장 건강을 맞춘 가장 대중적인 밸런스 건사료 군집',
      keywords: ['닭', '가금류', '쌀', '옥수수', '밀', '비트펄프'],
      typicalDM: {
        moisture_g: 9.5, protein_g: 29.5, fat_g: 17.5, crude_fiber_g: 2.4, ash_g: 6.8,
        tdf_g: 7.8, soluble_fiber_g: 2.4, insoluble_fiber_g: 5.4,
        arginine_g: 1.78, histidine_g: 0.65, isoleucine_g: 1.15, leucine_g: 2.35, lysine_g: 1.55,
        methionine_g: 0.68, cystine_g: 0.44, methionine_cystine_g: 1.12,
        phenylalanine_g: 1.25, tyrosine_g: 0.95, phenylalanine_tyrosine_g: 2.20,
        threonine_g: 1.12, tryptophan_g: 0.28, valine_g: 1.42, taurine_g: 0.14,
        calcium_mg: 1150, phosphorus_mg: 920, magnesium_mg: 105, potassium_mg: 720, sodium_mg: 340,
        iron_mg: 19.5, zinc_mg: 18.5, copper_mg: 1.65, manganese_mg: 5.8, selenium_ug: 32.0, iodine_ug: 340,
        vitamin_a_ug: 620, vitamin_d_ug: 2.8, vitamin_e_mg: 52.0,
        thiamin_mg: 0.85, riboflavin_mg: 1.65, niacin_mg: 5.8, pantothenic_acid_mg: 4.2,
        vitamin_b6_mg: 1.1, folate_ug: 110, vitamin_b12_ug: 11.5, biotin_ug: 140,
        omega3_g: 0.65, omega6_g: 3.45, epa_dha_g: 0.28
      }
    },
    {
      id: 'ARCH_02_SALMON_PEA_GRAINFREE',
      code: 'Type B',
      name: '연어+완두콩 기반 그레인프리 건사료',
      referenceBrands: 'Acana Pacifica / Taste of the Wild Pacific Stream / Now Fresh Salmon',
      feedForm: 'dry',
      isPrescription: false,
      isGrainFree: true,
      baseConfidence: 80,
      description: '연어/어류와 완두콩·렌틸콩·감자를 주원료로 사용하여 오메가-3와 라이신이 풍부하나 식물성 두류 비중에 따른 메티오닌/타우린 모니터링이 중요한 군집',
      keywords: ['연어', '어분', '생선', '완두', '렌틸', '병아리콩', '감자'],
      typicalDM: {
        moisture_g: 10.0, protein_g: 31.0, fat_g: 17.0, crude_fiber_g: 4.2, ash_g: 7.8,
        tdf_g: 12.8, soluble_fiber_g: 3.8, insoluble_fiber_g: 9.0,
        arginine_g: 2.15, histidine_g: 0.72, isoleucine_g: 1.32, leucine_g: 2.28, lysine_g: 2.18,
        methionine_g: 0.62, cystine_g: 0.36, methionine_cystine_g: 0.98,
        phenylalanine_g: 1.35, tyrosine_g: 0.98, phenylalanine_tyrosine_g: 2.33,
        threonine_g: 1.24, tryptophan_g: 0.31, valine_g: 1.52, taurine_g: 0.18,
        calcium_mg: 1320, phosphorus_mg: 1020, magnesium_mg: 125, potassium_mg: 880, sodium_mg: 390,
        iron_mg: 21.0, zinc_mg: 19.0, copper_mg: 1.75, manganese_mg: 4.5, selenium_ug: 58.0, iodine_ug: 420,
        vitamin_a_ug: 580, vitamin_d_ug: 4.2, vitamin_e_mg: 48.0,
        thiamin_mg: 0.92, riboflavin_mg: 1.55, niacin_mg: 6.2, pantothenic_acid_mg: 3.8,
        vitamin_b6_mg: 1.05, folate_ug: 135, vitamin_b12_ug: 14.0, biotin_ug: 120,
        omega3_g: 1.85, omega6_g: 2.65, epa_dha_g: 1.15
      }
    },
    {
      id: 'ARCH_03_HYDROLYZED_HYPOALLERGENIC',
      code: 'Type C',
      name: '가수분해 단백 저알러지 처방/기능성 사료',
      referenceBrands: "Royal Canin Hypoallergenic / Anallergenic / Hill's Prescription Diet z/d",
      feedForm: 'dry',
      isPrescription: true,
      isGrainFree: false,
      baseConfidence: 91,
      description: '가수분해 대두/가금류/연어 단백과 정제 전분(쌀/옥수수전분/타피오카)을 사용하여 식이 알러지 항원성을 최소화하고 피부 장벽(EPA/DHA/비타민B군)을 강화한 사료 군집',
      keywords: ['가수분해', '분리대두', '전분', '타피오카', '저알러지', '하이포알러제닉'],
      typicalDM: {
        moisture_g: 9.0, protein_g: 23.5, fat_g: 16.5, crude_fiber_g: 2.2, ash_g: 6.5,
        tdf_g: 6.6, soluble_fiber_g: 2.2, insoluble_fiber_g: 4.4,
        arginine_g: 1.62, histidine_g: 0.56, isoleucine_g: 1.02, leucine_g: 1.78, lysine_g: 1.42,
        methionine_g: 0.58, cystine_g: 0.34, methionine_cystine_g: 0.92,
        phenylalanine_g: 1.08, tyrosine_g: 0.82, phenylalanine_tyrosine_g: 1.90,
        threonine_g: 0.94, tryptophan_g: 0.26, valine_g: 1.12, taurine_g: 0.21,
        calcium_mg: 1020, phosphorus_mg: 810, magnesium_mg: 85, potassium_mg: 780, sodium_mg: 380,
        iron_mg: 20.5, zinc_mg: 24.5, copper_mg: 1.80, manganese_mg: 6.2, selenium_ug: 34.0, iodine_ug: 360,
        vitamin_a_ug: 850, vitamin_d_ug: 2.6, vitamin_e_mg: 65.0,
        thiamin_mg: 1.4, riboflavin_mg: 2.8, niacin_mg: 18.0, pantothenic_acid_mg: 14.5,
        vitamin_b6_mg: 2.4, folate_ug: 220, vitamin_b12_ug: 16.0, biotin_ug: 310,
        omega3_g: 1.05, omega6_g: 3.90, epa_dha_g: 0.38
      }
    },
    {
      id: 'ARCH_04_HIGH_MEAT_BIOLOGICAL',
      code: 'Type D',
      name: '고단백 생육+육분 그레인프리 사료 (단백질 38%+)',
      referenceBrands: 'Orijen Original / Six Fish / Farmina N&D Prime',
      feedForm: 'dry',
      isPrescription: false,
      isGrainFree: true,
      baseConfidence: 85,
      description: '신선 생육과 건조 육분·내장육을 다량 배합하여 건물 단백질 40% 내외, 동물성 아미노산과 칼슘·인 함량이 높은 고단백 생물학적 적합 건사료 군집',
      keywords: ['생닭', '칠면조', '닭간', '청어', '가자미', '오리젠', '파미나', '적렌틸'],
      typicalDM: {
        moisture_g: 11.0, protein_g: 42.5, fat_g: 20.2, crude_fiber_g: 4.0, ash_g: 8.8,
        tdf_g: 10.5, soluble_fiber_g: 3.2, insoluble_fiber_g: 7.3,
        arginine_g: 2.85, histidine_g: 0.98, isoleucine_g: 1.82, leucine_g: 3.15, lysine_g: 2.95,
        methionine_g: 0.94, cystine_g: 0.48, methionine_cystine_g: 1.42,
        phenylalanine_g: 1.78, tyrosine_g: 1.35, phenylalanine_tyrosine_g: 3.13,
        threonine_g: 1.72, tryptophan_g: 0.44, valine_g: 2.08, taurine_g: 0.25,
        calcium_mg: 1580, phosphorus_mg: 1240, magnesium_mg: 135, potassium_mg: 920, sodium_mg: 440,
        iron_mg: 26.0, zinc_mg: 22.0, copper_mg: 2.10, manganese_mg: 4.2, selenium_ug: 68.0, iodine_ug: 380,
        vitamin_a_ug: 950, vitamin_d_ug: 4.5, vitamin_e_mg: 55.0,
        thiamin_mg: 1.1, riboflavin_mg: 2.1, niacin_mg: 8.5, pantothenic_acid_mg: 4.8,
        vitamin_b6_mg: 1.35, folate_ug: 145, vitamin_b12_ug: 18.5, biotin_ug: 165,
        omega3_g: 1.35, omega6_g: 3.60, epa_dha_g: 0.65
      }
    },
    {
      id: 'ARCH_05_WEIGHT_LIGHT_HIGH_FIBER',
      code: 'Type E',
      name: '저지방·고섬유 체중조절/다이어트 건사료',
      referenceBrands: "Hill's Prescription Diet Metabolic / w/d / Royal Canin Satiety Weight",
      feedForm: 'dry',
      isPrescription: true,
      isGrainFree: false,
      baseConfidence: 89,
      description: '지방을 대폭 낮추고 분말 셀룰로오스·비트펄프·차전자피를 고농도로 배합하여 조섬유 및 총 식이섬유(TDF 18~26%)로 위장관 포만감을 극대화한 체중 감량용 아키타입',
      keywords: ['셀룰로오스', '차전자피', '비트펄프', '다이어트', '라이트', '체중', '세타이어티'],
      typicalDM: {
        moisture_g: 9.5, protein_g: 30.0, fat_g: 10.5, crude_fiber_g: 12.5, ash_g: 6.2,
        tdf_g: 24.5, soluble_fiber_g: 4.8, insoluble_fiber_g: 19.7,
        arginine_g: 1.85, histidine_g: 0.68, isoleucine_g: 1.20, leucine_g: 2.40, lysine_g: 1.68,
        methionine_g: 0.72, cystine_g: 0.45, methionine_cystine_g: 1.17,
        phenylalanine_g: 1.30, tyrosine_g: 1.02, phenylalanine_tyrosine_g: 2.32,
        threonine_g: 1.18, tryptophan_g: 0.30, valine_g: 1.48, taurine_g: 0.22,
        calcium_mg: 980, phosphorus_mg: 780, magnesium_mg: 95, potassium_mg: 820, sodium_mg: 310,
        iron_mg: 21.0, zinc_mg: 20.0, copper_mg: 1.70, manganese_mg: 6.0, selenium_ug: 36.0, iodine_ug: 350,
        vitamin_a_ug: 720, vitamin_d_ug: 2.9, vitamin_e_mg: 62.0,
        thiamin_mg: 1.0, riboflavin_mg: 1.9, niacin_mg: 6.5, pantothenic_acid_mg: 4.5,
        vitamin_b6_mg: 1.2, folate_ug: 130, vitamin_b12_ug: 13.0, biotin_ug: 150,
        omega3_g: 0.75, omega6_g: 2.15, epa_dha_g: 0.32
      }
    },
    {
      id: 'ARCH_06_GI_LOW_FAT',
      code: 'Type F',
      name: '소화기계 저지방·고소화성 케어 사료 (GI Low Fat)',
      referenceBrands: "Royal Canin Gastrointestinal Low Fat / Hill's Prescription Diet i/d Low Fat",
      feedForm: 'dry',
      isPrescription: true,
      isGrainFree: false,
      baseConfidence: 92,
      description: '췌장염·고지혈증·림프관확장증 및 만성 설사 관리를 위해 지방을 7~9% DM으로 엄격히 제한하고 차전자피·비트펄프·FOS/MOS 등 수용성 프리바이오틱 섬유를 강화한 사료',
      keywords: ['저지방', '소화기', '인테스티날', '차전자피', '프락토올리고당', '백미'],
      typicalDM: {
        moisture_g: 9.5, protein_g: 24.5, fat_g: 7.8, crude_fiber_g: 1.9, ash_g: 6.8,
        tdf_g: 8.6, soluble_fiber_g: 3.6, insoluble_fiber_g: 5.0,
        arginine_g: 1.52, histidine_g: 0.55, isoleucine_g: 0.98, leucine_g: 1.95, lysine_g: 1.32,
        methionine_g: 0.60, cystine_g: 0.38, methionine_cystine_g: 0.98,
        phenylalanine_g: 1.05, tyrosine_g: 0.84, phenylalanine_tyrosine_g: 1.89,
        threonine_g: 0.96, tryptophan_g: 0.25, valine_g: 1.20, taurine_g: 0.21,
        calcium_mg: 1120, phosphorus_mg: 860, magnesium_mg: 92, potassium_mg: 760, sodium_mg: 420,
        iron_mg: 20.0, zinc_mg: 21.5, copper_mg: 1.65, manganese_mg: 5.9, selenium_ug: 35.0, iodine_ug: 340,
        vitamin_a_ug: 680, vitamin_d_ug: 2.7, vitamin_e_mg: 58.0,
        thiamin_mg: 1.2, riboflavin_mg: 2.2, niacin_mg: 7.2, pantothenic_acid_mg: 5.0,
        vitamin_b6_mg: 1.4, folate_ug: 160, vitamin_b12_ug: 18.0, biotin_ug: 160,
        omega3_g: 0.62, omega6_g: 1.45, epa_dha_g: 0.28
      }
    },
    {
      id: 'ARCH_07_RENAL_LOW_PHOSPHORUS',
      code: 'Type G',
      name: '신장 케어 저단백·저인·저나트륨 처방 사료 (Renal)',
      referenceBrands: "Hill's Prescription Diet k/d / Royal Canin Renal",
      feedForm: 'dry',
      isPrescription: true,
      isGrainFree: false,
      baseConfidence: 93,
      description: '만성 신장질환(CKD) 관리를 위해 인(P 0.3~0.45% DM)과 나트륨(Na 0.2% DM)을 엄격히 제한하고 고생체이용률 아미노산과 오메가-3(EPA/DHA)를 보강한 처방식 아키타입',
      keywords: ['신장', '레날', '저인', '저단백', '구연산칼륨', '탄산칼슘'],
      typicalDM: {
        moisture_g: 9.0, protein_g: 15.5, fat_g: 19.5, crude_fiber_g: 2.4, ash_g: 4.6,
        tdf_g: 6.8, soluble_fiber_g: 2.5, insoluble_fiber_g: 4.3,
        arginine_g: 1.05, histidine_g: 0.42, isoleucine_g: 0.72, leucine_g: 1.45, lysine_g: 0.98,
        methionine_g: 0.55, cystine_g: 0.28, methionine_cystine_g: 0.83,
        phenylalanine_g: 0.78, tyrosine_g: 0.62, phenylalanine_tyrosine_g: 1.40,
        threonine_g: 0.76, tryptophan_g: 0.22, valine_g: 0.88, taurine_g: 0.24,
        calcium_mg: 640, phosphorus_mg: 340, magnesium_mg: 90, potassium_mg: 880, sodium_mg: 210,
        iron_mg: 16.5, zinc_mg: 18.0, copper_mg: 1.45, manganese_mg: 5.2, selenium_ug: 30.0, iodine_ug: 310,
        vitamin_a_ug: 650, vitamin_d_ug: 2.5, vitamin_e_mg: 68.0,
        thiamin_mg: 1.3, riboflavin_mg: 2.4, niacin_mg: 8.0, pantothenic_acid_mg: 5.5,
        vitamin_b6_mg: 1.6, folate_ug: 180, vitamin_b12_ug: 19.0, biotin_ug: 180,
        omega3_g: 1.45, omega6_g: 3.50, epa_dha_g: 0.68
      }
    },
    {
      id: 'ARCH_08_URINARY_SO_CONTROL',
      code: 'Type H',
      name: '요로계 결석 용해·예방 처방 사료 (Urinary S/O & c/d)',
      referenceBrands: "Royal Canin Urinary S/O / Hill's Prescription Diet c/d Multicare",
      feedForm: 'dry',
      isPrescription: true,
      isGrainFree: false,
      baseConfidence: 91,
      description: '스트루바이트 및 칼슘 옥살레이트 결석 예방을 위해 마그네슘(Mg)·인(P)·칼슘(Ca)을 정밀 제어하고 음수량 유도를 위한 적정 나트륨과 DL-메티오닌을 설계한 사료',
      keywords: ['유리너리', '요로', '결석', '메티오닌', '스트루바이트'],
      typicalDM: {
        moisture_g: 9.5, protein_g: 20.5, fat_g: 17.5, crude_fiber_g: 2.3, ash_g: 7.2,
        tdf_g: 6.5, soluble_fiber_g: 2.0, insoluble_fiber_g: 4.5,
        arginine_g: 1.25, histidine_g: 0.48, isoleucine_g: 0.88, leucine_g: 1.85, lysine_g: 1.15,
        methionine_g: 0.82, cystine_g: 0.35, methionine_cystine_g: 1.17,
        phenylalanine_g: 0.98, tyrosine_g: 0.78, phenylalanine_tyrosine_g: 1.76,
        threonine_g: 0.85, tryptophan_g: 0.22, valine_g: 1.05, taurine_g: 0.21,
        calcium_mg: 720, phosphorus_mg: 620, magnesium_mg: 62, potassium_mg: 820, sodium_mg: 850,
        iron_mg: 17.0, zinc_mg: 18.5, copper_mg: 1.55, manganese_mg: 5.5, selenium_ug: 32.0, iodine_ug: 330,
        vitamin_a_ug: 610, vitamin_d_ug: 2.4, vitamin_e_mg: 58.0,
        thiamin_mg: 0.95, riboflavin_mg: 1.8, niacin_mg: 6.0, pantothenic_acid_mg: 4.4,
        vitamin_b6_mg: 1.2, folate_ug: 125, vitamin_b12_ug: 12.5, biotin_ug: 145,
        omega3_g: 0.88, omega6_g: 3.30, epa_dha_g: 0.38
      }
    },
    {
      id: 'ARCH_09_PUPPY_GROWTH_RICHDM',
      code: 'Type I',
      name: '자견/성장기 고에너지·골격발달 건사료 (Puppy Growth)',
      referenceBrands: "Royal Canin Mini Puppy / Hill's Science Diet Puppy",
      feedForm: 'dry',
      isPrescription: false,
      isGrainFree: false,
      baseConfidence: 84,
      description: '성장기 조직 합성과 두뇌·골격 발달을 위해 단백질(31%+), 지방(20%+), 칼슘(1.3% DM), 인(1.05% DM) 및 DHA를 강화한 자견용 아키타입',
      keywords: ['퍼피', '자견', '주니어', '성장기', '스타터', '마더앤베이비'],
      typicalDM: {
        moisture_g: 9.5, protein_g: 33.0, fat_g: 21.5, crude_fiber_g: 2.0, ash_g: 7.8,
        tdf_g: 6.8, soluble_fiber_g: 2.4, insoluble_fiber_g: 4.4,
        arginine_g: 2.05, histidine_g: 0.76, isoleucine_g: 1.35, leucine_g: 2.65, lysine_g: 1.85,
        methionine_g: 0.78, cystine_g: 0.46, methionine_cystine_g: 1.24,
        phenylalanine_g: 1.42, tyrosine_g: 1.10, phenylalanine_tyrosine_g: 2.52,
        threonine_g: 1.28, tryptophan_g: 0.33, valine_g: 1.62, taurine_g: 0.21,
        calcium_mg: 1350, phosphorus_mg: 1080, magnesium_mg: 110, potassium_mg: 780, sodium_mg: 410,
        iron_mg: 22.5, zinc_mg: 21.0, copper_mg: 1.80, manganese_mg: 6.2, selenium_ug: 38.0, iodine_ug: 380,
        vitamin_a_ug: 780, vitamin_d_ug: 3.4, vitamin_e_mg: 60.0,
        thiamin_mg: 1.05, riboflavin_mg: 1.95, niacin_mg: 6.8, pantothenic_acid_mg: 4.8,
        vitamin_b6_mg: 1.3, folate_ug: 145, vitamin_b12_ug: 14.5, biotin_ug: 165,
        omega3_g: 0.95, omega6_g: 3.85, epa_dha_g: 0.45
      }
    },
    {
      id: 'ARCH_10_SENIOR_JOINT_CARE',
      code: 'Type J',
      name: '노령견 관절·항산화·중등도 인 케어 사료 (Senior 7+)',
      referenceBrands: "Hill's Youthful Vitality 7+ / Purina Bright Mind / Joint Mobility",
      feedForm: 'dry',
      isPrescription: false,
      isGrainFree: false,
      baseConfidence: 83,
      description: '7세 이상 시니어의 신장 부담 완화를 위해 인(0.65% DM)과 나트륨을 중등도로 낮추고, 관절 및 인지 기능 유지를 위해 오메가-3(EPA/DHA)·초록입홍합·MCT오일·항산화제를 강화한 사료',
      keywords: ['시니어', '노령', '에이징', '관절', '모빌리티', '초록입홍합', '코코넛오일'],
      typicalDM: {
        moisture_g: 9.5, protein_g: 26.5, fat_g: 14.5, crude_fiber_g: 3.5, ash_g: 5.8,
        tdf_g: 9.8, soluble_fiber_g: 3.2, insoluble_fiber_g: 6.6,
        arginine_g: 1.65, histidine_g: 0.60, isoleucine_g: 1.08, leucine_g: 2.12, lysine_g: 1.48,
        methionine_g: 0.64, cystine_g: 0.40, methionine_cystine_g: 1.04,
        phenylalanine_g: 1.15, tyrosine_g: 0.88, phenylalanine_tyrosine_g: 2.03,
        threonine_g: 1.04, tryptophan_g: 0.27, valine_g: 1.32, taurine_g: 0.20,
        calcium_mg: 860, phosphorus_mg: 650, magnesium_mg: 98, potassium_mg: 760, sodium_mg: 260,
        iron_mg: 18.0, zinc_mg: 19.5, copper_mg: 1.55, manganese_mg: 5.8, selenium_ug: 36.0, iodine_ug: 330,
        vitamin_a_ug: 690, vitamin_d_ug: 2.9, vitamin_e_mg: 75.0,
        thiamin_mg: 1.1, riboflavin_mg: 1.9, niacin_mg: 6.4, pantothenic_acid_mg: 4.6,
        vitamin_b6_mg: 1.25, folate_ug: 140, vitamin_b12_ug: 15.0, biotin_ug: 155,
        omega3_g: 1.65, omega6_g: 2.95, epa_dha_g: 0.85
      }
    },
    {
      id: 'ARCH_11_LAMB_RICE_SENSITIVE',
      code: 'Type K',
      name: '양고기+현미/귀리 기반 센서티브 건사료',
      referenceBrands: "Purina Pro Plan Sensitive Skin & Stomach Lamb & Oat / Nutro Natural Choice Lamb & Brown Rice",
      feedForm: 'dry',
      isPrescription: false,
      isGrainFree: false,
      baseConfidence: 82,
      description: '가금류 알러지가 있는 반려견을 위해 양고기 분말/생양고기와 현미·귀리·보리를 배합한 전통적인 저자극 센서티브 건사료 아키타입',
      keywords: ['양고기', '램', '현미', '귀리', '오트밀', '보리'],
      typicalDM: {
        moisture_g: 10.0, protein_g: 27.5, fat_g: 16.0, crude_fiber_g: 3.2, ash_g: 7.8,
        tdf_g: 9.6, soluble_fiber_g: 3.1, insoluble_fiber_g: 6.5,
        arginine_g: 1.75, histidine_g: 0.62, isoleucine_g: 1.05, leucine_g: 2.08, lysine_g: 1.45,
        methionine_g: 0.58, cystine_g: 0.36, methionine_cystine_g: 0.94,
        phenylalanine_g: 1.12, tyrosine_g: 0.85, phenylalanine_tyrosine_g: 1.97,
        threonine_g: 1.02, tryptophan_g: 0.26, valine_g: 1.35, taurine_g: 0.15,
        calcium_mg: 1420, phosphorus_mg: 1050, magnesium_mg: 120, potassium_mg: 740, sodium_mg: 330,
        iron_mg: 22.0, zinc_mg: 20.5, copper_mg: 1.65, manganese_mg: 5.5, selenium_ug: 34.0, iodine_ug: 320,
        vitamin_a_ug: 610, vitamin_d_ug: 2.6, vitamin_e_mg: 50.0,
        thiamin_mg: 0.90, riboflavin_mg: 1.60, niacin_mg: 5.5, pantothenic_acid_mg: 4.0,
        vitamin_b6_mg: 1.05, folate_ug: 115, vitamin_b12_ug: 12.0, biotin_ug: 135,
        omega3_g: 0.72, omega6_g: 3.10, epa_dha_g: 0.22
      }
    },
    {
      id: 'ARCH_12_DUCK_SWEETPOTATO_LID',
      code: 'Type L',
      name: '오리고기+고구마/감자 기반 단일단백(LID) 건사료',
      referenceBrands: "Natural Balance L.I.D. Duck & Potato / Go! Solutions Sensitivities Limited Ingredient Duck",
      feedForm: 'dry',
      isPrescription: false,
      isGrainFree: true,
      baseConfidence: 81,
      description: '단일 동물성 단백질원(오리고기)과 단일 탄수화물원(고구마/감자/완두)으로 원재료 가짓수를 최소화한 LID(Limited Ingredient Diet) 아키타입',
      keywords: ['오리', '고구마', '감자', 'LID', '단일단백'],
      typicalDM: {
        moisture_g: 10.0, protein_g: 27.0, fat_g: 15.0, crude_fiber_g: 4.0, ash_g: 7.5,
        tdf_g: 11.2, soluble_fiber_g: 3.8, insoluble_fiber_g: 7.4,
        arginine_g: 1.72, histidine_g: 0.60, isoleucine_g: 1.08, leucine_g: 2.02, lysine_g: 1.56,
        methionine_g: 0.56, cystine_g: 0.35, methionine_cystine_g: 0.91,
        phenylalanine_g: 1.15, tyrosine_g: 0.88, phenylalanine_tyrosine_g: 2.03,
        threonine_g: 1.05, tryptophan_g: 0.27, valine_g: 1.32, taurine_g: 0.16,
        calcium_mg: 1280, phosphorus_mg: 980, magnesium_mg: 118, potassium_mg: 860, sodium_mg: 320,
        iron_mg: 20.5, zinc_mg: 19.0, copper_mg: 1.70, manganese_mg: 4.8, selenium_ug: 35.0, iodine_ug: 310,
        vitamin_a_ug: 920, vitamin_d_ug: 2.7, vitamin_e_mg: 48.0,
        thiamin_mg: 0.88, riboflavin_mg: 1.55, niacin_mg: 5.8, pantothenic_acid_mg: 3.9,
        vitamin_b6_mg: 1.05, folate_ug: 120, vitamin_b12_ug: 12.5, biotin_ug: 130,
        omega3_g: 0.78, omega6_g: 2.85, epa_dha_g: 0.20
      }
    },
    {
      id: 'ARCH_13_INSECT_SUSTAINABLE_LID',
      code: 'Type M',
      name: '곤충단백(동애등에)+귀리/감자 기반 저알러지 사료',
      referenceBrands: 'Yora Insect Protein / Tomojo / Green Petfood InsectDog',
      feedForm: 'dry',
      isPrescription: false,
      isGrainFree: false,
      baseConfidence: 80,
      description: '탈지 동애등에 유충(BSFL)을 유일한 동물성 단백질원으로 사용하여 육류 알러지를 회피하고 키틴 유래 프리바이오틱 섬유소와 라우르산을 공급하는 사료',
      keywords: ['곤충', '동애등에', '밀웜'],
      typicalDM: {
        moisture_g: 9.0, protein_g: 28.0, fat_g: 15.0, crude_fiber_g: 5.2, ash_g: 7.2,
        tdf_g: 12.5, soluble_fiber_g: 3.2, insoluble_fiber_g: 9.3,
        arginine_g: 1.58, histidine_g: 0.78, isoleucine_g: 1.22, leucine_g: 1.98, lysine_g: 1.72,
        methionine_g: 0.52, cystine_g: 0.34, methionine_cystine_g: 0.86,
        phenylalanine_g: 1.22, tyrosine_g: 1.42, phenylalanine_tyrosine_g: 2.64,
        threonine_g: 1.15, tryptophan_g: 0.35, valine_g: 1.50, taurine_g: 0.14,
        calcium_mg: 1220, phosphorus_mg: 880, magnesium_mg: 145, potassium_mg: 820, sodium_mg: 310,
        iron_mg: 22.0, zinc_mg: 21.0, copper_mg: 1.85, manganese_mg: 6.5, selenium_ug: 32.0, iodine_ug: 320,
        vitamin_a_ug: 580, vitamin_d_ug: 2.8, vitamin_e_mg: 50.0,
        thiamin_mg: 0.95, riboflavin_mg: 1.80, niacin_mg: 6.0, pantothenic_acid_mg: 4.2,
        vitamin_b6_mg: 1.15, folate_ug: 130, vitamin_b12_ug: 13.5, biotin_ug: 145,
        omega3_g: 0.65, omega6_g: 2.90, epa_dha_g: 0.18
      }
    },
    {
      id: 'ARCH_14_WET_CANNED_HIGH_PROTEIN',
      code: 'Type N',
      name: '고단백 정통 습식 캔 사료 (수분 78%+)',
      referenceBrands: 'Ziwi Peak Wet Canned / Wellness CORE 95% / Terra Canis',
      feedForm: 'wet_canned',
      isPrescription: false,
      isGrainFree: true,
      baseConfidence: 86,
      description: '정제수와 신선 육류·내장육을 주원료로 한 고수분(78% AF) 습식 캔 사료로, 건물(DM) 환산 시 조단백 45~52%, 조지방 24~30%, 탄수화물 10% 미만의 육식형 영양 구조를 가짐',
      keywords: ['캔', '습식', '정제수', '육수', '구아검', '한천', '카라기난'],
      typicalDM: {
        moisture_g: 78.0, protein_g: 48.0, fat_g: 26.5, crude_fiber_g: 1.8, ash_g: 8.5,
        tdf_g: 4.2, soluble_fiber_g: 1.8, insoluble_fiber_g: 2.4,
        arginine_g: 3.10, histidine_g: 1.25, isoleucine_g: 2.15, leucine_g: 3.65, lysine_g: 3.75,
        methionine_g: 1.15, cystine_g: 0.55, methionine_cystine_g: 1.70,
        phenylalanine_g: 1.95, tyrosine_g: 1.55, phenylalanine_tyrosine_g: 3.50,
        threonine_g: 2.02, tryptophan_g: 0.52, valine_g: 2.40, taurine_g: 0.32,
        calcium_mg: 1450, phosphorus_mg: 1180, magnesium_mg: 110, potassium_mg: 950, sodium_mg: 480,
        iron_mg: 28.0, zinc_mg: 22.5, copper_mg: 2.20, manganese_mg: 3.8, selenium_ug: 65.0, iodine_ug: 390,
        vitamin_a_ug: 1450, vitamin_d_ug: 4.2, vitamin_e_mg: 45.0,
        thiamin_mg: 0.95, riboflavin_mg: 2.4, niacin_mg: 9.5, pantothenic_acid_mg: 5.2,
        vitamin_b6_mg: 1.4, folate_ug: 150, vitamin_b12_ug: 22.0, biotin_ug: 170,
        omega3_g: 1.20, omega6_g: 4.10, epa_dha_g: 0.55
      }
    },
    {
      id: 'ARCH_15_WET_POUCH_GRAVY_GI',
      code: 'Type O',
      name: '소화기/회복기 습식 파우치·무스 사료',
      referenceBrands: "Royal Canin GI Low Fat Loaf / Hill's a/d / i/d Stew",
      feedForm: 'wet_canned',
      isPrescription: true,
      isGrainFree: false,
      baseConfidence: 90,
      description: '수분 76~80%의 부드러운 로프(Loaf)/스튜 제형으로 소화흡수율과 전해질(칼륨·나트륨)·수용성 비타민을 강화한 임상 회복·소화기 케어 습식 사료',
      keywords: ['파우치', '로프', '스튜', '무스', '회복식'],
      typicalDM: {
        moisture_g: 77.0, protein_g: 34.0, fat_g: 12.0, crude_fiber_g: 2.5, ash_g: 7.2,
        tdf_g: 7.8, soluble_fiber_g: 3.4, insoluble_fiber_g: 4.4,
        arginine_g: 2.15, histidine_g: 0.85, isoleucine_g: 1.48, leucine_g: 2.65, lysine_g: 2.45,
        methionine_g: 0.82, cystine_g: 0.42, methionine_cystine_g: 1.24,
        phenylalanine_g: 1.42, tyrosine_g: 1.12, phenylalanine_tyrosine_g: 2.54,
        threonine_g: 1.42, tryptophan_g: 0.36, valine_g: 1.68, taurine_g: 0.28,
        calcium_mg: 1180, phosphorus_mg: 940, magnesium_mg: 102, potassium_mg: 980, sodium_mg: 520,
        iron_mg: 24.0, zinc_mg: 23.0, copper_mg: 1.95, manganese_mg: 5.2, selenium_ug: 45.0, iodine_ug: 360,
        vitamin_a_ug: 920, vitamin_d_ug: 3.5, vitamin_e_mg: 62.0,
        thiamin_mg: 1.35, riboflavin_mg: 2.5, niacin_mg: 8.8, pantothenic_acid_mg: 5.4,
        vitamin_b6_mg: 1.5, folate_ug: 175, vitamin_b12_ug: 20.0, biotin_ug: 175,
        omega3_g: 0.95, omega6_g: 2.25, epa_dha_g: 0.45
      }
    },
    {
      id: 'ARCH_16_COOKED_FRESH_HUMANGRADE',
      code: 'Type P',
      name: '휴먼그레이드 자연식(화식) 완제품',
      referenceBrands: 'JustFoodForDogs / The Farmer’s Dog / 국내 수제 화식 브랜드',
      feedForm: 'fresh_cooked',
      isPrescription: false,
      isGrainFree: false,
      baseConfidence: 92,
      description: '사람이 먹는 등급의 살코기(닭/소/오리/연어)와 단호박·고구마·브로콜리·난각분말 등을 저온 조리한 화식(수분 72~76%)으로, 열가공에 의한 아미노산(라이신 마이야르 반응) 손실이 가장 적은 고신뢰도 식단',
      keywords: ['화식', '자연식', '닭가슴살', '우둔살', '단호박', '브로콜리', '양배추', '난각분말'],
      typicalDM: {
        moisture_g: 74.0, protein_g: 48.0, fat_g: 16.5, crude_fiber_g: 2.8, ash_g: 5.8,
        tdf_g: 8.5, soluble_fiber_g: 3.8, insoluble_fiber_g: 4.7,
        arginine_g: 3.05, histidine_g: 1.38, isoleucine_g: 2.25, leucine_g: 3.72, lysine_g: 3.95,
        methionine_g: 1.22, cystine_g: 0.54, methionine_cystine_g: 1.76,
        phenylalanine_g: 1.92, tyrosine_g: 1.60, phenylalanine_tyrosine_g: 3.52,
        threonine_g: 2.08, tryptophan_g: 0.55, valine_g: 2.42, taurine_g: 0.28,
        calcium_mg: 1050, phosphorus_mg: 820, magnesium_mg: 115, potassium_mg: 920, sodium_mg: 280,
        iron_mg: 18.5, zinc_mg: 17.5, copper_mg: 1.55, manganese_mg: 3.8, selenium_ug: 48.0, iodine_ug: 290,
        vitamin_a_ug: 1150, vitamin_d_ug: 2.8, vitamin_e_mg: 42.0,
        thiamin_mg: 1.05, riboflavin_mg: 2.1, niacin_mg: 10.5, pantothenic_acid_mg: 4.8,
        vitamin_b6_mg: 1.45, folate_ug: 165, vitamin_b12_ug: 16.5, biotin_ug: 155,
        omega3_g: 1.10, omega6_g: 2.80, epa_dha_g: 0.48
      }
    },
    {
      id: 'ARCH_17_FREEZE_DRIED_RAW',
      code: 'Type Q',
      name: '동결건조/에어드라이 생식 사료 (Freeze-Dried / Air-Dried)',
      referenceBrands: 'Ziwi Peak Air-Dried / Stella & Chewy’s Freeze-Dried / K9 Natural',
      feedForm: 'freeze_dried',
      isPrescription: false,
      isGrainFree: true,
      baseConfidence: 87,
      description: '살코기·내장육·뼈·초록입홍합을 90% 이상 배합하여 동결건조 또는 저온 에어드라이한 초고단백·고지방 사료 군집',
      keywords: ['동결건조', '에어드라이', '생식', '지위픽', '스텔라앤츄이스', '초록입홍합'],
      typicalDM: {
        moisture_g: 6.0, protein_g: 46.0, fat_g: 32.0, crude_fiber_g: 1.6, ash_g: 9.2,
        tdf_g: 3.5, soluble_fiber_g: 1.2, insoluble_fiber_g: 2.3,
        arginine_g: 2.98, histidine_g: 1.28, isoleucine_g: 2.08, leucine_g: 3.58, lysine_g: 3.68,
        methionine_g: 1.12, cystine_g: 0.52, methionine_cystine_g: 1.64,
        phenylalanine_g: 1.88, tyrosine_g: 1.50, phenylalanine_tyrosine_g: 3.38,
        threonine_g: 1.98, tryptophan_g: 0.50, valine_g: 2.35, taurine_g: 0.34,
        calcium_mg: 1680, phosphorus_mg: 1280, magnesium_mg: 125, potassium_mg: 890, sodium_mg: 460,
        iron_mg: 29.0, zinc_mg: 24.0, copper_mg: 2.30, manganese_mg: 4.0, selenium_ug: 72.0, iodine_ug: 410,
        vitamin_a_ug: 1600, vitamin_d_ug: 4.8, vitamin_e_mg: 48.0,
        thiamin_mg: 1.0, riboflavin_mg: 2.5, niacin_mg: 9.8, pantothenic_acid_mg: 5.5,
        vitamin_b6_mg: 1.45, folate_ug: 155, vitamin_b12_ug: 24.0, biotin_ug: 180,
        omega3_g: 1.75, omega6_g: 4.50, epa_dha_g: 0.85
      }
    },
    {
      id: 'ARCH_18_FELINE_CARNIVORE_HIGH_TAURINE',
      code: 'Type R',
      name: '고양이 전용 고단백·타우린 강화 건사료 (Feline Adult)',
      referenceBrands: 'Royal Canin Indoor 27 / Fit 32 / Farmina N&D Cat',
      feedForm: 'dry',
      isPrescription: false,
      isGrainFree: false,
      baseConfidence: 85,
      description: '절대 육식동물인 고양이의 대사 특성에 맞춰 조단백(34~42% DM), 아르기닌, 타우린(0.25%+ DM), 아라키돈산 및 비타민 A/나이아신을 강화한 고양이 전용 아키타입',
      keywords: ['고양이', '캣', '인도어', '타우린', '헤어볼'],
      typicalDM: {
        moisture_g: 8.5, protein_g: 36.5, fat_g: 16.5, crude_fiber_g: 3.8, ash_g: 7.6,
        tdf_g: 10.2, soluble_fiber_g: 3.0, insoluble_fiber_g: 7.2,
        arginine_g: 2.25, histidine_g: 0.82, isoleucine_g: 1.52, leucine_g: 2.95, lysine_g: 2.15,
        methionine_g: 0.92, cystine_g: 0.52, methionine_cystine_g: 1.44,
        phenylalanine_g: 1.58, tyrosine_g: 1.28, phenylalanine_tyrosine_g: 2.86,
        threonine_g: 1.45, tryptophan_g: 0.36, valine_g: 1.78, taurine_g: 0.28,
        calcium_mg: 1220, phosphorus_mg: 1020, magnesium_mg: 88, potassium_mg: 820, sodium_mg: 440,
        iron_mg: 22.0, zinc_mg: 21.0, copper_mg: 1.80, manganese_mg: 6.0, selenium_ug: 42.0, iodine_ug: 380,
        vitamin_a_ug: 980, vitamin_d_ug: 3.2, vitamin_e_mg: 60.0,
        thiamin_mg: 1.45, riboflavin_mg: 2.4, niacin_mg: 14.5, pantothenic_acid_mg: 5.8,
        vitamin_b6_mg: 1.6, folate_ug: 180, vitamin_b12_ug: 16.5, biotin_ug: 190,
        omega3_g: 0.85, omega6_g: 3.65, epa_dha_g: 0.36
      }
    }
  ];

  const ARCHETYPES_MAP = {};
  ARCHETYPES.forEach(a => {
    ARCHETYPES_MAP[a.id] = a;
  });

  /**
   * 입력된 사료의 원재료 목록 및 보증성분(Guaranteed Analysis)을 바탕으로
   * 18개 표준 아키타입 중 가장 유사한 Top-3 클러스터를 매칭하고,
   * 해당 사료의 실제 보증성분(조단백, 조지방, 조섬유, 조회분, 칼슘, 인) 비율에 맞춰
   * 세부 영양소(아미노산, TDF, 미량 미네랄)를 비례 보정(Scaling)한 영양 벡터를 반환합니다.
   */
  function matchAndScaleArchetype(selectedIngredients, constraints, allIngredientsDB, options = {}) {
    const species = options.species || 'dog';
    const targetMoisture = Number(options.targetMoisture) || 10.0;
    const dmConv = Math.max(0.15, (100 - targetMoisture) / 100);

    // 보증성분 목표치 추출 (이미 DM 기준으로 들어오거나 AF일 수 있으므로 확인)
    const getTarget = (key, defVal) => {
      const c = (constraints || []).find(x => x.key === key);
      return c && c.target > 0 ? Number(c.target) : defVal;
    };

    const targetProteinDM = getTarget('protein_g', 28.0);
    const targetFatDM = getTarget('fat_g', 15.0);
    const targetFiberDM = getTarget('total_dietary_fiber_g', 3.5);
    const targetAshDM = getTarget('ash_g', 7.2);
    const targetCaDM = getTarget('calcium_mg', 1100);
    const targetPDM = getTarget('phosphorus_mg', 880);

    // 원재료 텍스트 및 특성 분석
    const ingNames = (selectedIngredients || []).map(x => (x.name || x.id || '').toLowerCase());
    const top5Names = ingNames.slice(0, 5).join(' ');
    const allNames = ingNames.join(' ');

    const hasHydrolyzed = top5Names.includes('가수분해') || top5Names.includes('hydrolyzed') || top5Names.includes('분리대두');
    const hasGrain = allNames.includes('쌀') || allNames.includes('백미') || allNames.includes('현미') || allNames.includes('옥수수') || allNames.includes('밀') || allNames.includes('귀리') || allNames.includes('보리') || allNames.includes('rice') || allNames.includes('corn') || allNames.includes('wheat') || allNames.includes('oat') || allNames.includes('barley');
    const hasLegume = allNames.includes('완두') || allNames.includes('렌틸') || allNames.includes('병아리콩') || allNames.includes('pea') || allNames.includes('lentil') || allNames.includes('chickpea');
    const hasSalmonFish = top5Names.includes('연어') || top5Names.includes('어분') || top5Names.includes('청어') || top5Names.includes('생선') || top5Names.includes('salmon') || top5Names.includes('fish') || top5Names.includes('herring');
    const hasDuck = top5Names.includes('오리') || top5Names.includes('duck');
    const hasLamb = top5Names.includes('양고기') || top5Names.includes('양육분') || top5Names.includes('lamb');
    const hasInsect = top5Names.includes('곤충') || top5Names.includes('동애등에') || top5Names.includes('밀웜') || top5Names.includes('insect');
    const hasHighCellulose = allNames.includes('셀룰로오스') || allNames.includes('cellulose') || targetFiberDM >= 8.0;

    // 각 아키타입별 유사도 점수 산출 (0 ~ 100점)
    const scored = ARCHETYPES.map(arch => {
      let score = 50.0;
      const typ = arch.typicalDM;

      // 1) 수분 / 제형 일치도
      const moistureDiff = Math.abs(targetMoisture - typ.moisture_g);
      if (targetMoisture >= 60 && typ.moisture_g >= 60) score += 18;
      else if (targetMoisture < 20 && typ.moisture_g < 20) score += 10;
      else score -= Math.min(30, moistureDiff * 0.6);

      // 2) 조단백, 조지방, 조섬유, 인(P) 거리 유사도
      const protErr = Math.abs(targetProteinDM - typ.protein_g);
      const fatErr = Math.abs(targetFatDM - typ.fat_g);
      const fibErr = Math.abs(targetFiberDM - typ.crude_fiber_g);
      const pErr = Math.abs(targetPDM - typ.phosphorus_mg) / 100;

      score += Math.max(-25, 22 - (protErr * 1.1 + fatErr * 0.9 + fibErr * 1.4 + pErr * 0.8));

      // 3) 원재료 도메인 시그니처 보너스
      if (hasHydrolyzed && arch.id === 'ARCH_03_HYDROLYZED_HYPOALLERGENIC') score += 28;
      if (!hasGrain && hasLegume && arch.isGrainFree) score += 10;
      if (hasGrain && !arch.isGrainFree) score += 8;
      if (hasSalmonFish && arch.id === 'ARCH_02_SALMON_PEA_GRAINFREE') score += 20;
      if (targetProteinDM >= 36 && arch.id === 'ARCH_04_HIGH_MEAT_BIOLOGICAL') score += 22;
      if (hasHighCellulose && arch.id === 'ARCH_05_WEIGHT_LIGHT_HIGH_FIBER') score += 25;
      if (targetFatDM <= 9.5 && arch.id === 'ARCH_06_GI_LOW_FAT') score += 24;
      if (targetPDM <= 500 && targetProteinDM <= 19 && arch.id === 'ARCH_07_RENAL_LOW_PHOSPHORUS') score += 28;
      if (hasLamb && arch.id === 'ARCH_11_LAMB_RICE_SENSITIVE') score += 20;
      if (hasDuck && arch.id === 'ARCH_12_DUCK_SWEETPOTATO_LID') score += 20;
      if (hasInsect && arch.id === 'ARCH_13_INSECT_SUSTAINABLE_LID') score += 28;
      if (species === 'cat' && arch.id === 'ARCH_18_FELINE_CARNIVORE_HIGH_TAURINE') score += 20;

      // 키워드 일치 보너스
      arch.keywords.forEach(kw => {
        if (allNames.includes(kw.toLowerCase())) score += 2.5;
      });

      const similarityPct = Math.max(25, Math.min(99, Math.round(score)));
      return {
        archetype: arch,
        similarityPct
      };
    });

    scored.sort((a, b) => b.similarityPct - a.similarityPct);
    const bestMatch = scored[0].archetype;
    const topMatches = scored.slice(0, 3);

    // 4단계 핵심: 매칭된 최상위 아키타입의 영양 벡터를 입력 사료의 실제 보증성분(단백질, 지방, 섬유, 회분, 칼슘, 인) 비율로 비례 보정(Scaling)
    const typ = bestMatch.typicalDM;
    const protScale = Math.max(0.4, Math.min(2.2, targetProteinDM / Math.max(1, typ.protein_g)));
    const fatScale = Math.max(0.3, Math.min(2.5, targetFatDM / Math.max(1, typ.fat_g)));
    const fiberScale = Math.max(0.4, Math.min(3.0, targetFiberDM / Math.max(0.5, typ.crude_fiber_g)));
    const ashScale = Math.max(0.4, Math.min(2.2, targetAshDM / Math.max(1, typ.ash_g)));

    const scaledVector = Object.assign({}, typ);
    scaledVector.protein_g = targetProteinDM;
    scaledVector.fat_g = targetFatDM;
    scaledVector.crude_fiber_g = targetFiberDM;
    scaledVector.ash_g = targetAshDM;

    // 아미노산은 단백질 비율에 비례 스케일링
    [
      'arginine_g', 'histidine_g', 'isoleucine_g', 'leucine_g', 'lysine_g',
      'methionine_g', 'cystine_g', 'methionine_cystine_g',
      'phenylalanine_g', 'tyrosine_g', 'phenylalanine_tyrosine_g',
      'threonine_g', 'tryptophan_g', 'valine_g', 'taurine_g'
    ].forEach(k => {
      if (typ[k] !== undefined) {
        scaledVector[k] = +(typ[k] * protScale).toFixed(3);
      }
    });

    // 식이섬유(TDF, 수용성, 불용성)는 조섬유 비율에 비례 스케일링
    scaledVector.tdf_g = +(typ.tdf_g * fiberScale).toFixed(2);
    scaledVector.soluble_fiber_g = +(typ.soluble_fiber_g * fiberScale).toFixed(2);
    scaledVector.insoluble_fiber_g = +(typ.insoluble_fiber_g * fiberScale).toFixed(2);

    // 오메가 지방산은 조지방 비율에 비례 스케일링
    scaledVector.omega3_g = +(typ.omega3_g * fatScale).toFixed(2);
    scaledVector.omega6_g = +(typ.omega6_g * fatScale).toFixed(2);
    scaledVector.epa_dha_g = +(typ.epa_dha_g * fatScale).toFixed(2);

    // 다량 미네랄은 보증성분(Ca, P) 및 조회분(Ash) 비율에 비례 스케일링
    scaledVector.calcium_mg = targetCaDM > 0 ? targetCaDM : Math.round(typ.calcium_mg * ashScale);
    scaledVector.phosphorus_mg = targetPDM > 0 ? targetPDM : Math.round(typ.phosphorus_mg * ashScale);
    scaledVector.magnesium_mg = Math.round(typ.magnesium_mg * ashScale);
    scaledVector.potassium_mg = Math.round(typ.potassium_mg * (0.5 + 0.5 * ashScale));
    scaledVector.sodium_mg = Math.round(typ.sodium_mg * (0.5 + 0.5 * ashScale));

    return {
      bestArchetype: bestMatch,
      similarityPct: scored[0].similarityPct,
      topMatches,
      scaledArchetypeVector: scaledVector,
      scalingFactors: {
        proteinScale: +protScale.toFixed(2),
        fatScale: +fatScale.toFixed(2),
        fiberScale: +fiberScale.toFixed(2),
        ashScale: +ashScale.toFixed(2)
      }
    };
  }

  return {
    ARCHETYPES,
    ARCHETYPES_MAP,
    matchAndScaleArchetype
  };

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ArchetypeDB;
}

if (typeof window !== "undefined") window.ArchetypeDB = ArchetypeDB;

/**
 * reverse_engine.js
 * [2단계 & 3단계 & 4단계 통합] 사료 배합비 역추적 및 3-트랙 세부 영양소 추론 최적화 엔진
 *
 * - 2단계 (배합비 역추적 수리 모델):
 *   1) 순서 제약: w_1 >= w_2 >= ... >= w_n >= 0, sum(w_i) = 1 (가공 전 투입 중량 기준)
 *   2) 기하급수적 감소 및 1% 룰(Anchor): 상위 1~5번째 원재료가 70~85% 차지, 소금(Salt)/타우린/프리믹스 등장 시점부터 < 1% 강제 고정
 *   3) 수분 보정 (Processing Penalty): 건사료 상단 '생육(Fresh Meat, 수분 70%+)'의 건조 후 건물(Dry Matter) 기여도 왜곡 보정
 *   4) 목적 함수: 추정한 건물 기여율(w_i^DM)과 1단계 산업용 DB 영양소 벡터의 내적이 등록성분량과 일치하도록 최적화
 *
 * - 3단계 (3-트랙 세부 영양소 역산):
 *   1) 아미노산 (12종+타우린): 동물성 vs 식물성(완두콩, 옥수수글루텐 등) 단백질 기여도 가중 평균 및 제한 아미노산 진단
 *   2) 식이섬유 (TDF / 수용성 / 불용성): 조섬유(Crude Fiber) 확장 모델 (비트펄프, 차전자피, 이눌린, FOS, 호박 가중치 반영)
 *   3) 미네랄 & 비타민: AAFCO/FEDIAF 베이스라인(1.2~1.5배 안전 마진) + 프리믹스 형태(킬레이트 vs 무기태) + 처방식/조회분 연동 스케일링
 *
 * - 4단계 (아키타입 클러스터링 결합):
 *   글로벌 브랜드 18종 표준 아키타입(Archetype) 매칭 및 비례 보정(Scaling) 결합으로 미표기 영양소 추정 정밀도 극대화
 */

const ReverseEngine = (function() {

  const FeedDBRef = (typeof FeedIngredientDB !== 'undefined')
    ? FeedIngredientDB
    : (typeof require !== 'undefined' ? (() => { try { return require('./feed_ingredient_db.js'); } catch (e) { return null; } })() : null);

  const ArchetypeDBRef = (typeof ArchetypeDB !== 'undefined')
    ? ArchetypeDB
    : (typeof require !== 'undefined' ? (() => { try { return require('./archetype_db.js'); } catch (e) { return null; } })() : null);

  // 영양 성분별 상세 표시 정보 및 AAFCO 기준치, 변동성, 기본 신뢰도
  const NUTRIENT_SPECS = [
    // 다량영양소 (Macro)
    { key: 'protein_g', label: '조단백질 (Crude Protein)', unit: '% DM', category: 'macro', min: 18.0, variability: 'low', baseConfidence: 94, defaultTolPct: 6 },
    { key: 'fat_g', label: '조지방 (Crude Fat)', unit: '% DM', category: 'macro', min: 5.5, variability: 'low', baseConfidence: 92, defaultTolPct: 7 },
    { key: 'carbohydrate_g', label: '탄수화물 (NFE)', unit: '% DM', category: 'macro', variability: 'low', baseConfidence: 89, defaultTolPct: 9 },
    { key: 'total_dietary_fiber_g', label: '조섬유 (Crude Fiber)', unit: '% DM', category: 'macro', max: 5.0, variability: 'medium', baseConfidence: 88, defaultTolPct: 10 },
    { key: 'tdf_g', label: '총 식이섬유 (TDF)', unit: '% DM', category: 'fiber', variability: 'medium', baseConfidence: 83, defaultTolPct: 13 },
    { key: 'soluble_fiber_g', label: '수용성 식이섬유 (Soluble Fiber)', unit: '% DM', category: 'fiber', variability: 'medium', baseConfidence: 81, defaultTolPct: 15 },
    { key: 'insoluble_fiber_g', label: '불용성 식이섬유 (Insoluble Fiber)', unit: '% DM', category: 'fiber', variability: 'medium', baseConfidence: 82, defaultTolPct: 14 },
    { key: 'ash_g', label: '조회분 (Crude Ash)', unit: '% DM', category: 'macro', max: 10.0, variability: 'medium', baseConfidence: 88, defaultTolPct: 10 },
    { key: 'moisture_g', label: '수분 (Moisture)', unit: '% AF', category: 'macro', max: 12.0, variability: 'low', baseConfidence: 95, defaultTolPct: 5 },

    // 필수 아미노산 (Amino Acids - 3단계 트랙 1)
    { key: 'arginine_g', label: '아르기닌 (Arginine)', unit: '% DM', category: 'amino_acid', min_aafco_dm: 0.51, variability: 'low', baseConfidence: 84, defaultTolPct: 11 },
    { key: 'histidine_g', label: '히스티딘 (Histidine)', unit: '% DM', category: 'amino_acid', min_aafco_dm: 0.19, variability: 'low', baseConfidence: 84, defaultTolPct: 11 },
    { key: 'isoleucine_g', label: '이소류신 (Isoleucine)', unit: '% DM', category: 'amino_acid', min_aafco_dm: 0.38, variability: 'low', baseConfidence: 83, defaultTolPct: 12 },
    { key: 'leucine_g', label: '류신 (Leucine)', unit: '% DM', category: 'amino_acid', min_aafco_dm: 0.68, variability: 'low', baseConfidence: 84, defaultTolPct: 11 },
    { key: 'lysine_g', label: '라이신 (Lysine)', unit: '% DM', category: 'amino_acid', min_aafco_dm: 0.63, variability: 'medium', baseConfidence: 83, defaultTolPct: 12 },
    { key: 'methionine_g', label: '메티오닌 (Methionine)', unit: '% DM', category: 'amino_acid', min_aafco_dm: 0.33, variability: 'medium', baseConfidence: 82, defaultTolPct: 13 },
    { key: 'methionine_cystine_g', label: '메티오닌+시스틴 (Met+Cys)', unit: '% DM', category: 'amino_acid', min_aafco_dm: 0.65, variability: 'medium', baseConfidence: 82, defaultTolPct: 13 },
    { key: 'phenylalanine_tyrosine_g', label: '페닐알라닌+티로신 (Phe+Tyr)', unit: '% DM', category: 'amino_acid', min_aafco_dm: 0.74, variability: 'low', baseConfidence: 83, defaultTolPct: 12 },
    { key: 'threonine_g', label: '트레오닌 (Threonine)', unit: '% DM', category: 'amino_acid', min_aafco_dm: 0.48, variability: 'low', baseConfidence: 83, defaultTolPct: 12 },
    { key: 'tryptophan_g', label: '트립토판 (Tryptophan)', unit: '% DM', category: 'amino_acid', min_aafco_dm: 0.16, variability: 'medium', baseConfidence: 80, defaultTolPct: 14 },
    { key: 'valine_g', label: '발린 (Valine)', unit: '% DM', category: 'amino_acid', min_aafco_dm: 0.49, variability: 'low', baseConfidence: 84, defaultTolPct: 11 },
    { key: 'taurine_g', label: '타우린 (Taurine)', unit: '% DM', category: 'amino_acid', min_aafco_dm: 0.10, variability: 'medium', baseConfidence: 79, defaultTolPct: 15 },

    // 미네랄 (Minerals - 3단계 트랙 3)
    { key: 'calcium_mg', label: '칼슘 (Ca)', unit: 'mg/100g DM', category: 'mineral', min_aafco_1000kcal: 1.25, max_aafco_1000kcal: 4.5, unit_aafco: 'g', variability: 'medium', baseConfidence: 88, defaultTolPct: 11 },
    { key: 'phosphorus_mg', label: '인 (P)', unit: 'mg/100g DM', category: 'mineral', min_aafco_1000kcal: 1.00, max_aafco_1000kcal: 4.0, unit_aafco: 'g', variability: 'medium', baseConfidence: 88, defaultTolPct: 11 },
    { key: 'magnesium_mg', label: '마그네슘 (Mg)', unit: 'mg/100g DM', category: 'mineral', min_aafco_1000kcal: 0.15, unit_aafco: 'g', variability: 'medium', baseConfidence: 80, defaultTolPct: 15 },
    { key: 'potassium_mg', label: '칼륨 (K)', unit: 'mg/100g DM', category: 'mineral', min_aafco_1000kcal: 1.50, unit_aafco: 'g', variability: 'medium', baseConfidence: 81, defaultTolPct: 14 },
    { key: 'sodium_mg', label: '나트륨 (Na)', unit: 'mg/100g DM', category: 'mineral', min_aafco_1000kcal: 0.20, unit_aafco: 'g', variability: 'medium', baseConfidence: 79, defaultTolPct: 16 },
    { key: 'iron_mg', label: '철분 (Fe)', unit: 'mg/100g DM', category: 'mineral', min_aafco_1000kcal: 10.0, unit_aafco: 'mg', variability: 'high', baseConfidence: 77, defaultTolPct: 18 },
    { key: 'zinc_mg', label: '아연 (Zn)', unit: 'mg/100g DM', category: 'mineral', min_aafco_1000kcal: 20.0, unit_aafco: 'mg', variability: 'medium', baseConfidence: 78, defaultTolPct: 16 },
    { key: 'copper_mg', label: '구리 (Cu)', unit: 'mg/100g DM', category: 'mineral', min_aafco_1000kcal: 1.83, unit_aafco: 'mg', variability: 'high', baseConfidence: 75, defaultTolPct: 19 },
    { key: 'manganese_mg', label: '망간 (Mn)', unit: 'mg/100g DM', category: 'mineral', min_aafco_1000kcal: 1.25, unit_aafco: 'mg', variability: 'high', baseConfidence: 74, defaultTolPct: 20 },
    { key: 'selenium_ug', label: '셀레늄 (Se)', unit: 'μg/100g DM', category: 'mineral', min_aafco_1000kcal: 80.0, unit_aafco: 'μg', variability: 'high', baseConfidence: 72, defaultTolPct: 21 },
    { key: 'iodine_ug', label: '요오드 (I)', unit: 'μg/100g DM', category: 'mineral', min_aafco_1000kcal: 250.0, unit_aafco: 'μg', variability: 'high', baseConfidence: 71, defaultTolPct: 22 },

    // 비타민 (Vitamins - 3단계 트랙 3)
    { key: 'vitamin_a_ug', label: '비타민 A', unit: 'μg/100g DM', category: 'vitamin', min_aafco_1000kcal: 375.0, unit_aafco: 'μg', variability: 'high', baseConfidence: 74, defaultTolPct: 20 },
    { key: 'vitamin_d_ug', label: '비타민 D', unit: 'μg/100g DM', category: 'vitamin', min_aafco_1000kcal: 3.125, unit_aafco: 'μg', variability: 'high', baseConfidence: 72, defaultTolPct: 22 },
    { key: 'vitamin_e_mg', label: '비타민 E', unit: 'mg/100g DM', category: 'vitamin', min_aafco_1000kcal: 8.38, unit_aafco: 'mg', variability: 'medium', baseConfidence: 76, defaultTolPct: 18 },
    { key: 'thiamin_mg', label: '비타민 B1 (티아민)', unit: 'mg/100g DM', category: 'vitamin', min_aafco_1000kcal: 0.56, unit_aafco: 'mg', variability: 'medium', baseConfidence: 77, defaultTolPct: 17 },
    { key: 'riboflavin_mg', label: '비타민 B2 (리보플라빈)', unit: 'mg/100g DM', category: 'vitamin', min_aafco_1000kcal: 1.30, unit_aafco: 'mg', variability: 'medium', baseConfidence: 77, defaultTolPct: 17 },
    { key: 'niacin_mg', label: '비타민 B3 (나이아신)', unit: 'mg/100g DM', category: 'vitamin', min_aafco_1000kcal: 3.40, unit_aafco: 'mg', variability: 'medium', baseConfidence: 78, defaultTolPct: 16 },
    { key: 'pantothenic_acid_mg', label: '비타민 B5 (판토텐산)', unit: 'mg/100g DM', category: 'vitamin', min_aafco_1000kcal: 3.00, unit_aafco: 'mg', variability: 'medium', baseConfidence: 76, defaultTolPct: 17 },
    { key: 'vitamin_b6_mg', label: '비타민 B6 (피리독신)', unit: 'mg/100g DM', category: 'vitamin', min_aafco_1000kcal: 0.38, unit_aafco: 'mg', variability: 'medium', baseConfidence: 76, defaultTolPct: 17 },
    { key: 'folate_ug', label: '엽산 (B9)', unit: 'μg/100g DM', category: 'vitamin', min_aafco_1000kcal: 54.0, unit_aafco: 'μg', variability: 'high', baseConfidence: 72, defaultTolPct: 20 },
    { key: 'vitamin_b12_ug', label: '비타민 B12', unit: 'μg/100g DM', category: 'vitamin', min_aafco_1000kcal: 7.0, unit_aafco: 'μg', variability: 'high', baseConfidence: 72, defaultTolPct: 20 },
    { key: 'biotin_ug', label: '비오틴 (B7)', unit: 'μg/100g DM', category: 'vitamin', variability: 'high', baseConfidence: 71, defaultTolPct: 22 },

    // 필수 지방산
    { key: 'omega3_g', label: '오메가-3 지방산', unit: 'g/100g DM', category: 'fatty_acid', min_aafco_1000kcal: 0.11, unit_aafco: 'g', variability: 'medium', baseConfidence: 82, defaultTolPct: 15 },
    { key: 'omega6_g', label: '오메가-6 지방산', unit: 'g/100g DM', category: 'fatty_acid', min_aafco_1000kcal: 2.80, unit_aafco: 'g', variability: 'medium', baseConfidence: 83, defaultTolPct: 14 },
    { key: 'epa_dha_g', label: 'EPA + DHA', unit: 'g/100g DM', category: 'fatty_acid', variability: 'medium', baseConfidence: 80, defaultTolPct: 16 }
  ];

  // 표준 미표기 보충 원료 풀 (Imputation Candidates)
  const IMPUTATION_CANDIDATES = {
    egg_shell_powder: {
      id: "egg_shell_powder",
      ingredient: "egg_shell_powder",
      name: "탄산칼슘/난각분말 (미표기 칼슘보충제 추정)",
      name_ko: "탄산칼슘/난각분말 (미표기 칼슘보충제 추정)",
      category: "미네랄/1%앵커",
      processing_type: "mineral_supplement",
      protein_origin: "none",
      moisture_g: 1.0, protein_g: 1.0, fat_g: 0.1, ash_g: 96.0, crude_fiber_g: 0.0,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0, carbohydrate_g: 0.9,
      calcium_mg: 38000, phosphorus_mg: 120,
      reason: "포장지 칼슘(Ca) 보증 수치를 만족하기 위한 필수 미네랄 보충제 유추"
    },
    dicalcium_phosphate: {
      id: "dicalcium_phosphate",
      ingredient: "dicalcium_phosphate",
      name: "제2인산칼슘/골분 (미표기 인/칼슘보충제 추정)",
      name_ko: "제2인산칼슘/골분 (미표기 인/칼슘보충제 추정)",
      category: "미네랄/1%앵커",
      processing_type: "mineral_supplement",
      protein_origin: "none",
      moisture_g: 2.0, protein_g: 0.0, fat_g: 0.0, ash_g: 96.0, crude_fiber_g: 0.0,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0, carbohydrate_g: 0.0,
      calcium_mg: 23000, phosphorus_mg: 18000,
      reason: "포장지 인(P) 및 칼슘-인 비율을 충족하기 위한 미표기 인산염 보충제 유추"
    },
    oil_canola: {
      id: "oil_canola",
      ingredient: "oil_canola",
      name: "정제 동물성유/어유 (미표기 코팅 지방 추정)",
      name_ko: "정제 동물성유/어유 (미표기 코팅 지방 추정)",
      category: "유지류",
      processing_type: "fat_oil",
      protein_origin: "none",
      moisture_g: 0.2, protein_g: 0.0, fat_g: 99.5, ash_g: 0.1, crude_fiber_g: 0.0,
      tdf_g: 0.0, soluble_fiber_g: 0.0, insoluble_fiber_g: 0.0, carbohydrate_g: 0.2,
      calcium_mg: 1, phosphorus_mg: 1, omega3_g: 4.5, omega6_g: 22.0,
      reason: "포장지 조지방 수치를 달성하기 위해 익스트루전 후 코팅된 정제유 유추"
    },
    ind_poultry_meal_imputed: {
      id: "ind_poultry_meal_imputed",
      ingredient: "ind_poultry_meal_imputed",
      name: "농축 육분/단백분말 (생육 수분손실 보완용 고단백원 추정)",
      name_ko: "농축 육분/단백분말 (생육 수분손실 보완용 고단백원 추정)",
      category: "산업용 육분(Meal)",
      processing_type: "dry_meal",
      protein_origin: "animal",
      aa_profile_type: "poultry_meal",
      moisture_g: 8.0, protein_g: 66.0, fat_g: 12.0, ash_g: 11.0, crude_fiber_g: 1.0,
      tdf_g: 1.2, soluble_fiber_g: 0.2, insoluble_fiber_g: 1.0, carbohydrate_g: 2.0,
      calcium_mg: 2200, phosphorus_mg: 1550,
      arginine_g: 4.48, histidine_g: 1.38, isoleucine_g: 2.57, leucine_g: 4.55, lysine_g: 4.02,
      methionine_g: 1.25, cystine_g: 0.85, methionine_cystine_g: 2.10,
      phenylalanine_g: 2.50, tyrosine_g: 1.91, phenylalanine_tyrosine_g: 4.41,
      threonine_g: 2.57, tryptophan_g: 0.63, valine_g: 3.03, taurine_g: 0.23,
      reason: "생육 위주 표기에서 건사료 목표 조단백질을 달성하기 위한 탈수 육분/농축단백 유추"
    }
  };

  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function dmFactor(ing) {
    const moisture = num(ing?.moisture_g);
    return Math.max(0.001, (100 - moisture) / 100);
  }

  function getNutrientDM(ing, key) {
    if (!ing) return 0;
    const factor = dmFactor(ing);
    if (key === 'total_dietary_fiber_g' && ing.crude_fiber_g !== undefined) {
      return num(ing.crude_fiber_g) / factor;
    }
    return num(ing[key]) / factor;
  }

  function calcNfeDM(ing) {
    if (!ing) return 0;
    const p = getNutrientDM(ing, 'protein_g');
    const f = getNutrientDM(ing, 'fat_g');
    const fb = getNutrientDM(ing, 'total_dietary_fiber_g');
    const a = getNutrientDM(ing, 'ash_g');
    return Math.max(0, 100 - p - f - fb - a);
  }

  /**
   * [2단계 제약조건 2] 1% 룰 기준점(Anchor) 원재료 위치 탐지
   * 소금(Salt), 타우린(Taurine), 염화콜린, DL-메티오닌, 비타민/미네랄 합제, 보존제가 등장하는 첫 인덱스를 반환
   */
  function findAnchor1PctIndex(workingIngredients, workingDB) {
    const anchorKeywords = [
      '소금', '정제염', '천일염', '염화나트륨', 'salt', 'sodium chloride',
      '타우린', 'taurine', '염화콜린', 'choline', 'dl-메티오닌', 'methionine',
      'l-라이신', '비타민', 'vitamin', '미네랄', '단백질화', '킬레이트', '황산철', '산화아연',
      '토코페롤', '로즈마리', 'tocopherol', 'rosemary', '염화칼륨', '구연산칼륨',
      '프락토올리고당', '만난올리고당', '초록입홍합'
    ];

    for (let i = 0; i < workingIngredients.length; i++) {
      const item = workingIngredients[i];
      if (item.isImputed) continue; // AI 유추 보충제는 별도 관리
      const dbItem = workingDB[item.id];
      if (dbItem && dbItem.is_anchor_1pct) {
        return i;
      }
      const nameStr = ((item.name || '') + ' ' + (item.rawKeyword || '') + ' ' + (dbItem?.name_ko || '')).toLowerCase();
      if (anchorKeywords.some(kw => nameStr.includes(kw))) {
        return i;
      }
    }
    return -1;
  }

  /**
   * [2단계 제약조건 1 & 2] 순서 제약(w_1 >= w_2 >= ... >= w_n) 및 1% 앵커 상한(Upper Bound)을 동시에 만족하는
   * Bounded Decreasing PAVA (Pool Adjacent Violators Algorithm) 투영
   */
  function projectDecreasingPAVA(weights, anchorIdx = -1) {
    const n = weights.length;
    if (n === 0) return [];
    if (n === 1) return [100];

    let blocks = weights.map(w => ({ sum: Math.max(0.01, w), count: 1 }));
    let i = 0;
    while (i < blocks.length - 1) {
      const mean1 = blocks[i].sum / blocks[i].count;
      const mean2 = blocks[i + 1].sum / blocks[i + 1].count;
      if (mean1 < mean2) {
        blocks[i].sum += blocks[i + 1].sum;
        blocks[i].count += blocks[i + 1].count;
        blocks.splice(i + 1, 1);
        if (i > 0) i--;
      } else {
        i++;
      }
    }

    let projected = [];
    blocks.forEach(b => {
      const avg = b.sum / b.count;
      for (let j = 0; j < b.count; j++) {
        projected.push(avg);
      }
    });

    let sumVal = projected.reduce((a, b) => a + b, 0);
    if (sumVal <= 0) return projected.map(() => 100 / n);
    projected = projected.map(v => (v / sumVal) * 100);

    // 1% 앵커 룰 적용: anchorIdx 이후의 원재료가 1.0%를 초과하면 1.0% 이하로 클램핑하고 잉여 중량을 상위 주원료에 재분배
    if (anchorIdx > 0 && anchorIdx < n) {
      let excess = 0;
      for (let k = anchorIdx; k < n; k++) {
        const cap = Math.max(0.05, 0.95 * Math.pow(0.82, k - anchorIdx));
        if (projected[k] > cap) {
          excess += (projected[k] - cap);
          projected[k] = cap;
        }
      }
      if (excess > 0) {
        const headSum = projected.slice(0, anchorIdx).reduce((a, b) => a + b, 0);
        if (headSum > 0) {
          for (let k = 0; k < anchorIdx; k++) {
            projected[k] += excess * (projected[k] / headSum);
          }
        }
      }
      // 단조 감소 조건 재정렬 보정
      for (let k = n - 2; k >= 0; k--) {
        if (projected[k] < projected[k + 1]) {
          projected[k] = projected[k + 1];
        }
      }
      const finalSum = projected.reduce((a, b) => a + b, 0);
      projected = projected.map(v => (v / finalSum) * 100);
    }

    return projected;
  }

  /**
   * [2단계 제약조건 3] 수분 보정 (Processing Penalty) 계산
   * 건사료(목표 수분 <= 14%) 제조 시 투입 중량 비율(preProcessingRatios, w_i^pre)로부터
   * 익스트루전/건조 후 최종 사료 건물에 기여하는 실질 건물 기여율(dmContributionRatios, w_i^DM)을 역산
   */
  function computeProcessingCorrectedDMWeights(workingIngredients, preWeightsPct, workingDB, targetMoisture = 10.0) {
    const isDryFeed = targetMoisture <= 14.0;
    const rawDMContributions = workingIngredients.map((item, idx) => {
      const ing = workingDB[item.id];
      const wPre = Math.max(0, num(preWeightsPct[idx]));
      if (!ing) return wPre;

      const ingMoisture = num(ing.moisture_g);
      const dryMatterFraction = Math.max(0.01, (100 - ingMoisture) / 100);

      // 건사료에서 수분 60% 이상의 생육(Fresh Meat)은 익스트루전 열가공 및 드립 손실로 추가 4% 건물 수율 패널티 발생
      let thermalRetention = 1.0;
      if (isDryFeed && (ing.processing_type === 'fresh_meat' || ingMoisture >= 60.0)) {
        thermalRetention = 0.95;
      }

      return wPre * dryMatterFraction * thermalRetention;
    });

    const totalDM = rawDMContributions.reduce((a, b) => a + b, 0);
    if (totalDM <= 0) {
      return preWeightsPct.slice();
    }
    return rawDMContributions.map(v => (v / totalDM) * 100);
  }

  function checkAndImputeDeficits(selectedIngredients, constraints, allIngredientsDB) {
    const baseMergedDB = FeedDBRef ? FeedDBRef.mergeWithGeneralDB(allIngredientsDB) : Object.assign({}, allIngredientsDB);
    const localDB = Object.assign({}, baseMergedDB, IMPUTATION_CANDIDATES);
    const imputedList = selectedIngredients.map(item => {
      if (localDB[item.id]) return item;
      if (FeedDBRef) {
        const matched = FeedDBRef.matchIndustrialIngredient(item.name || item.id, localDB);
        if (matched) {
          localDB[matched.id] = matched;
          return Object.assign({}, item, { id: matched.id, name: matched.name_ko || item.name });
        }
      }
      return item;
    });
    const imputedInfo = [];

    let maxCaDM = 0;
    let maxPDM = 0;
    let maxFatDM = 0;
    let maxProteinDM = 0;

    imputedList.forEach(item => {
      const ing = localDB[item.id];
      if (ing) {
        maxCaDM = Math.max(maxCaDM, getNutrientDM(ing, 'calcium_mg'));
        maxPDM = Math.max(maxPDM, getNutrientDM(ing, 'phosphorus_mg'));
        maxFatDM = Math.max(maxFatDM, getNutrientDM(ing, 'fat_g'));
        maxProteinDM = Math.max(maxProteinDM, getNutrientDM(ing, 'protein_g'));
      }
    });

    const targetCa = (constraints.find(c => c.key === 'calcium_mg')?.target || 0);
    const targetP = (constraints.find(c => c.key === 'phosphorus_mg')?.target || 0);
    const targetFat = (constraints.find(c => c.key === 'fat_g')?.target || 0);
    const targetProtein = (constraints.find(c => c.key === 'protein_g')?.target || 0);

    if (targetProtein > 28 && maxProteinDM < targetProtein + 2) {
      if (!imputedList.some(x => x.id === 'ind_poultry_meal_imputed')) {
        imputedList.push({
          id: 'ind_poultry_meal_imputed',
          name: IMPUTATION_CANDIDATES.ind_poultry_meal_imputed.name,
          isImputed: true,
          reason: IMPUTATION_CANDIDATES.ind_poultry_meal_imputed.reason
        });
        imputedInfo.push("고단백 수치 충족을 위해 [농축 육분/단백분말(생육 수분손실 보완용)] 자동 보충");
      }
    }

    if (targetFat > 16 && maxFatDM < targetFat + 3) {
      if (!imputedList.some(x => x.id === 'oil_canola')) {
        imputedList.push({
          id: 'oil_canola',
          name: IMPUTATION_CANDIDATES.oil_canola.name,
          isImputed: true,
          reason: IMPUTATION_CANDIDATES.oil_canola.reason
        });
        imputedInfo.push("조지방 보충을 위해 [정제 동물성유/어유(미표기 코팅 지방)] 자동 보충");
      }
    }

    if (targetCa > 500 && maxCaDM < targetCa * 1.15) {
      if (!imputedList.some(x => x.id === 'egg_shell_powder' || x.id === 'ind_calcium_carbonate')) {
        imputedList.push({
          id: 'egg_shell_powder',
          name: IMPUTATION_CANDIDATES.egg_shell_powder.name,
          isImputed: true,
          reason: IMPUTATION_CANDIDATES.egg_shell_powder.reason
        });
        imputedInfo.push("칼슘 결손 보완을 위해 [탄산칼슘/난각분말(미표기 미네랄)] 자동 보충");
      }
    }

    if (targetP > 550 && maxPDM < targetP * 1.15) {
      if (!imputedList.some(x => x.id === 'dicalcium_phosphate' || x.id === 'ind_dicalcium_phosphate')) {
        imputedList.push({
          id: 'dicalcium_phosphate',
          name: IMPUTATION_CANDIDATES.dicalcium_phosphate.name,
          isImputed: true,
          reason: IMPUTATION_CANDIDATES.dicalcium_phosphate.reason
        });
        imputedInfo.push("인(P) 결손 보완을 위해 [제2인산칼슘(미표기 인산염)] 자동 보충");
      }
    }

    return {
      workingIngredients: imputedList,
      workingDB: localDB,
      imputedInfo
    };
  }

  /**
   * [3단계 통합] 원재료 배합비(P)로부터 다량영양소 + 3-트랙 세부 영양소(아미노산 13종, TDF/수용성/불용성 섬유, 미네랄/비타민) 계산
   */
  function calculateBlend(workingIngredients, P, workingDB, options = {}) {
    const targetMoisture = num(options.targetMoisture) || 10.0;
    const useProcessingPenalty = options.useProcessingPenalty !== false;

    // P가 가공 전 투입 중량(preProcessingRatios)일 경우 건물 기여율(dmRatios)로 변환
    const dmRatios = useProcessingPenalty
      ? computeProcessingCorrectedDMWeights(workingIngredients, P, workingDB, targetMoisture)
      : P.slice();

    const blend = {
      protein_g: 0,
      fat_g: 0,
      total_dietary_fiber_g: 0, // 조섬유 (Crude Fiber)
      crude_fiber_g: 0,
      tdf_g: 0,                 // 총 식이섬유 (Total Dietary Fiber)
      soluble_fiber_g: 0,       // 수용성 식이섬유
      insoluble_fiber_g: 0,     // 불용성 식이섬유
      ash_g: 0,
      nfe_g: 0,
      carbohydrate_g: 0,
      moisture_g: 0,

      // 아미노산 13종 (% DM = g/100g DM)
      arginine_g: 0,
      histidine_g: 0,
      isoleucine_g: 0,
      leucine_g: 0,
      lysine_g: 0,
      methionine_g: 0,
      cystine_g: 0,
      methionine_cystine_g: 0,
      phenylalanine_g: 0,
      tyrosine_g: 0,
      phenylalanine_tyrosine_g: 0,
      threonine_g: 0,
      tryptophan_g: 0,
      valine_g: 0,
      taurine_g: 0,

      // 단백질 출처 분석 (동물성 vs 식물성)
      animal_protein_g: 0,
      plant_protein_g: 0,
      animal_protein_share_pct: 0,
      plant_protein_share_pct: 0,

      // 미네랄
      calcium_mg: 0,
      phosphorus_mg: 0,
      magnesium_mg: 0,
      potassium_mg: 0,
      sodium_mg: 0,
      iron_mg: 0,
      zinc_mg: 0,
      copper_mg: 0,
      manganese_mg: 0,
      selenium_ug: 0,
      iodine_ug: 0,

      // 비타민
      vitamin_a_ug: 0,
      vitamin_d_ug: 0,
      vitamin_e_mg: 0,
      thiamin_mg: 0,
      riboflavin_mg: 0,
      niacin_mg: 0,
      pantothenic_acid_mg: 0,
      vitamin_b6_mg: 0,
      biotin_ug: 0,
      folate_ug: 0,
      vitamin_b12_ug: 0,

      // 지방산
      omega3_g: 0,
      omega6_g: 0,
      epa_dha_g: 0,

      energyAF: 0,
      energyDM: 0
    };

    let hasFermentableFiberSource = false;
    let hasChelatedMinerals = false;

    dmRatios.forEach((dmPct, idx) => {
      const ingId = workingIngredients[idx].id;
      const rawIng = workingDB[ingId];
      if (!rawIng) return;
      const ing = FeedDBRef ? FeedDBRef.enrichGeneralDBItem(rawIng) : rawIng;

      const wDM = dmPct / 100.0;
      const wPre = (num(P[idx]) || dmPct) / 100.0;

      const ingProtDM = getNutrientDM(ing, 'protein_g') * wDM;
      blend.protein_g += ingProtDM;
      blend.fat_g += getNutrientDM(ing, 'fat_g') * wDM;
      blend.total_dietary_fiber_g += getNutrientDM(ing, 'total_dietary_fiber_g') * wDM;
      blend.crude_fiber_g = blend.total_dietary_fiber_g;
      blend.ash_g += getNutrientDM(ing, 'ash_g') * wDM;
      blend.nfe_g += calcNfeDM(ing) * wDM;
      blend.moisture_g += num(ing.moisture_g) * wPre;

      // 동물성 vs 식물성 단백질 기여도 집계
      if (ing.protein_origin === 'animal') {
        blend.animal_protein_g += ingProtDM;
      } else if (ing.protein_origin === 'plant') {
        blend.plant_protein_g += ingProtDM;
      } else {
        blend.animal_protein_g += ingProtDM * 0.5;
        blend.plant_protein_g += ingProtDM * 0.5;
      }

      // [3단계 트랙 1] 아미노산 원재료 가중 합산
      blend.arginine_g += getNutrientDM(ing, 'arginine_g') * wDM;
      blend.histidine_g += getNutrientDM(ing, 'histidine_g') * wDM;
      blend.isoleucine_g += getNutrientDM(ing, 'isoleucine_g') * wDM;
      blend.leucine_g += getNutrientDM(ing, 'leucine_g') * wDM;
      blend.lysine_g += getNutrientDM(ing, 'lysine_g') * wDM;
      blend.methionine_g += getNutrientDM(ing, 'methionine_g') * wDM;
      blend.cystine_g += getNutrientDM(ing, 'cystine_g') * wDM;
      blend.phenylalanine_g += getNutrientDM(ing, 'phenylalanine_g') * wDM;
      blend.tyrosine_g += getNutrientDM(ing, 'tyrosine_g') * wDM;
      blend.threonine_g += getNutrientDM(ing, 'threonine_g') * wDM;
      blend.tryptophan_g += getNutrientDM(ing, 'tryptophan_g') * wDM;
      blend.valine_g += getNutrientDM(ing, 'valine_g') * wDM;
      blend.taurine_g += getNutrientDM(ing, 'taurine_g') * wDM;

      // [3단계 트랙 2] 식이섬유(TDF, 수용성, 불용성) 확장 합산
      blend.tdf_g += getNutrientDM(ing, 'tdf_g') * wDM;
      blend.soluble_fiber_g += getNutrientDM(ing, 'soluble_fiber_g') * wDM;
      blend.insoluble_fiber_g += getNutrientDM(ing, 'insoluble_fiber_g') * wDM;

      const nameStr = ((ing.name_ko || '') + ' ' + (ing.ingredient || '')).toLowerCase();
      if (nameStr.includes('비트펄프') || nameStr.includes('차전자피') || nameStr.includes('이눌린') || nameStr.includes('치커리') || nameStr.includes('올리고당') || nameStr.includes('호박') || nameStr.includes('사과') || nameStr.includes('beet') || nameStr.includes('psyllium') || nameStr.includes('inulin') || nameStr.includes('fos') || nameStr.includes('pumpkin')) {
        hasFermentableFiberSource = true;
      }
      if (ing.mineral_form === 'chelated' || nameStr.includes('단백질화') || nameStr.includes('킬레이트') || nameStr.includes('proteinate') || nameStr.includes('chelate')) {
        hasChelatedMinerals = true;
      }

      // 미네랄 및 비타민 원재료 기여분 합산
      blend.calcium_mg += getNutrientDM(ing, 'calcium_mg') * wDM;
      blend.phosphorus_mg += getNutrientDM(ing, 'phosphorus_mg') * wDM;
      blend.magnesium_mg += getNutrientDM(ing, 'magnesium_mg') * wDM;
      blend.potassium_mg += getNutrientDM(ing, 'potassium_mg') * wDM;
      blend.sodium_mg += getNutrientDM(ing, 'sodium_mg') * wDM;
      blend.iron_mg += getNutrientDM(ing, 'iron_mg') * wDM;
      blend.zinc_mg += getNutrientDM(ing, 'zinc_mg') * wDM;
      blend.copper_mg += getNutrientDM(ing, 'copper_mg') * wDM;
      blend.manganese_mg += getNutrientDM(ing, 'manganese_mg') * wDM;
      blend.selenium_ug += getNutrientDM(ing, 'selenium_ug') * wDM;
      blend.iodine_ug += getNutrientDM(ing, 'iodine_ug') * wDM;

      blend.vitamin_a_ug += getNutrientDM(ing, 'vitamin_a_ug') * wDM;
      blend.vitamin_d_ug += getNutrientDM(ing, 'vitamin_d_ug') * wDM;
      blend.vitamin_e_mg += getNutrientDM(ing, 'vitamin_e_mg') * wDM;
      blend.thiamin_mg += getNutrientDM(ing, 'thiamin_mg') * wDM;
      blend.riboflavin_mg += getNutrientDM(ing, 'riboflavin_mg') * wDM;
      blend.niacin_mg += getNutrientDM(ing, 'niacin_mg') * wDM;
      blend.pantothenic_acid_mg += getNutrientDM(ing, 'pantothenic_acid_mg') * wDM;
      blend.vitamin_b6_mg += getNutrientDM(ing, 'vitamin_b6_mg') * wDM;
      blend.biotin_ug += getNutrientDM(ing, 'biotin_ug') * wDM;
      blend.folate_ug += getNutrientDM(ing, 'folate_ug') * wDM;
      blend.vitamin_b12_ug += getNutrientDM(ing, 'vitamin_b12_ug') * wDM;

      blend.omega3_g += getNutrientDM(ing, 'omega3_g') * wDM;
      blend.omega6_g += getNutrientDM(ing, 'omega6_g') * wDM;
      blend.epa_dha_g += getNutrientDM(ing, 'epa_dha_g') * wDM;
    });

    blend.methionine_cystine_g = +(blend.methionine_g + blend.cystine_g).toFixed(3);
    blend.phenylalanine_tyrosine_g = +(blend.phenylalanine_g + blend.tyrosine_g).toFixed(3);

    const totalCategorizedProt = blend.animal_protein_g + blend.plant_protein_g;
    if (totalCategorizedProt > 0) {
      blend.animal_protein_share_pct = Math.round((blend.animal_protein_g / totalCategorizedProt) * 1000) / 10;
      blend.plant_protein_share_pct = Math.round((100 - blend.animal_protein_share_pct) * 10) / 10;
    } else {
      blend.animal_protein_share_pct = 70.0;
      blend.plant_protein_share_pct = 30.0;
    }

    // [3단계 트랙 2] 조섬유(Crude Fiber) -> TDF 확장 모델 보정
    // 조섬유는 불용성 섬유소의 일부만 반영하므로 TDF는 항상 조섬유보다 높음
    const minExpandedTdf = blend.crude_fiber_g * (hasFermentableFiberSource ? 2.65 : 2.10);
    if (blend.tdf_g < minExpandedTdf) {
      const diffTdf = minExpandedTdf - blend.tdf_g;
      const solShare = hasFermentableFiberSource ? 0.36 : 0.22;
      blend.soluble_fiber_g += diffTdf * solShare;
      blend.insoluble_fiber_g += diffTdf * (1 - solShare);
      blend.tdf_g = blend.soluble_fiber_g + blend.insoluble_fiber_g;
    }

    blend.carbohydrate_g = Math.max(0, 100 - blend.protein_g - blend.fat_g - blend.crude_fiber_g - blend.ash_g);
    blend.nfe_g = blend.carbohydrate_g;

    const meKcalPer100gDM = (3.5 * blend.protein_g) + (8.5 * blend.fat_g) + (3.5 * blend.nfe_g);
    blend.energyDM = meKcalPer100gDM * 10;

    // 건사료인 경우 최종 제품 수분은 targetMoisture(예: 10%)로 수렴
    const finalProductMoisture = (targetMoisture <= 14.0 && blend.moisture_g > 14.0) ? targetMoisture : blend.moisture_g;
    const dmFraction = Math.max(0.1, (100 - finalProductMoisture) / 100);
    blend.energyAF = blend.energyDM * dmFraction;
    blend.energyKcalPerGramAF = blend.energyAF / 1000;

    // [3단계 트랙 3] AAFCO/FEDIAF 베이스라인 (1.2~1.5배 안전 마진) + 프리믹스/조회분 연동 스케일링
    // 일반 완전사료는 비타민/미량미네랄 프리믹스를 통해 AAFCO 최소 요구량의 1.25~1.45배 안전 마진을 보장함
    if (options.applyPremixBaseline !== false) {
      const kcalFactor = Math.max(0.25, (meKcalPer100gDM || 380) / 1000); // 100g DM당 1000kcal 비율
      const safetyMargin = hasChelatedMinerals ? 1.38 : 1.28; // 1.2 ~ 1.5배 안전 마진
      const ashScale = Math.max(0.75, Math.min(1.35, blend.ash_g / 7.0));

      const applyFloor = (key, aafcoPer1000kcal, scaleWithAsh = false) => {
        const baseline = aafcoPer1000kcal * kcalFactor * safetyMargin * (scaleWithAsh ? ashScale : 1.0);
        if (blend[key] < baseline) {
          blend[key] = +(blend[key] * 0.35 + baseline * 0.65).toFixed(2);
        }
      };

      applyFloor('magnesium_mg', 150, true);
      applyFloor('potassium_mg', 1500, true);
      applyFloor('sodium_mg', 200, true);
      applyFloor('iron_mg', 10.0, false);
      applyFloor('zinc_mg', 20.0, false);
      applyFloor('copper_mg', 1.83, false);
      applyFloor('manganese_mg', 1.25, false);
      applyFloor('selenium_ug', 80.0, false);
      applyFloor('iodine_ug', 250.0, false);

      applyFloor('vitamin_a_ug', 375.0, false);
      applyFloor('vitamin_d_ug', 3.125, false);
      applyFloor('vitamin_e_mg', 8.38, false);
      applyFloor('thiamin_mg', 0.56, false);
      applyFloor('riboflavin_mg', 1.30, false);
      applyFloor('niacin_mg', 3.40, false);
      applyFloor('pantothenic_acid_mg', 3.00, false);
      applyFloor('vitamin_b6_mg', 0.38, false);
      applyFloor('folate_ug', 54.0, false);
      applyFloor('vitamin_b12_ug', 7.0, false);
    }

    blend.ca_p_ratio = blend.phosphorus_mg > 0 ? (blend.calcium_mg / blend.phosphorus_mg) : 0;
    blend.omega_ratio = blend.omega3_g > 0 ? (blend.omega6_g / blend.omega3_g) : 0;

    return blend;
  }

  function calcLoss(P, workingIngredients, constraints, workingDB, options = {}) {
    // 최적화 중에는 프리믹스 바닥 보정을 끄고 순수 원재료 배합 적합도를 계산
    const blend = calculateBlend(workingIngredients, P, workingDB, {
      targetMoisture: options.targetMoisture || 10.0,
      useProcessingPenalty: options.useProcessingPenalty !== false,
      applyPremixBaseline: false
    });
    let loss = 0;

    constraints.forEach(c => {
      if (c.optional) return;
      const currentVal = blend[c.key];
      const targetVal = c.target;
      let diff = 0;

      // 보증성분(조단백, 조지방 등)은 라벨 표시값보다 약 3~5% 여유 마진을 두고 실제 배합됨을 반영하되 목표치 근접 유도
      if (c.type === 'min') {
        if (currentVal < targetVal) {
          diff = targetVal - currentVal;
        } else if (currentVal > targetVal * 1.18) {
          diff = (currentVal - targetVal * 1.18) * 0.6;
        }
      } else if (c.type === 'max') {
        if (currentVal > targetVal) {
          diff = currentVal - targetVal;
        }
      } else if (c.type === 'exact') {
        diff = Math.abs(currentVal - targetVal);
      }

      const scale = Math.max(1, Math.abs(targetVal));
      loss += Math.pow(diff / scale, 2) * (c.weight || 12.0);
    });

    // 제약조건 1: 단조 감소 순서 제약 위반 패널티
    for (let i = 0; i < P.length - 1; i++) {
      if (P[i] < P[i + 1]) {
        loss += Math.pow((P[i + 1] - P[i]), 2) * 50.0;
      }
    }

    // 제약조건 2: 상위 1~5번째 원재료가 전체 중량의 70~85%를 차지하도록 유도 (기하급수적 감소 특성)
    const topK = Math.min(5, P.length);
    if (P.length >= 6) {
      const top5Sum = P.slice(0, topK).reduce((a, b) => a + b, 0);
      if (top5Sum < 68.0) {
        loss += Math.pow((68.0 - top5Sum) / 20.0, 2) * 2.5;
      } else if (top5Sum > 90.0) {
        loss += Math.pow((top5Sum - 90.0) / 15.0, 2) * 1.5;
      }
    }

    if (P.length > 0 && P[0] < 15.0) {
      loss += Math.pow((15.0 - P[0]) / 10.0, 2) * 1.5;
    }

    // 제약조건 2-B: 1% 앵커 원재료 이후의 원재료는 1.0% 초과 시 강한 패널티
    const anchorIdx = options.anchorIdx !== undefined ? options.anchorIdx : -1;
    if (anchorIdx > 0) {
      for (let k = anchorIdx; k < P.length; k++) {
        if (P[k] > 1.05) {
          loss += Math.pow(P[k] - 1.0, 2) * 25.0;
        }
      }
    }

    // 유지류 및 미네랄 보충제 과다 투입 방지 제약
    workingIngredients.forEach((item, idx) => {
      const ing = workingDB[item.id];
      if (ing) {
        const cat = ing.category || '';
        const proc = ing.processing_type || '';
        if ((cat.includes('유지') || proc === 'fat_oil') && P[idx] > 12.0) {
          loss += Math.pow(P[idx] - 12.0, 2) * 2.5;
        }
        if ((proc === 'mineral_supplement' || item.isImputed) && item.id !== 'ind_poultry_meal_imputed' && P[idx] > 3.5) {
          loss += Math.pow(P[idx] - 3.5, 2) * 6.0;
        }
      }
    });

    return loss;
  }

  /**
   * [3단계 트랙 1 보조] 제한 아미노산(Limiting Amino Acid) 및 아미노산 밸런스 스코어 진단
   */
  function analyzeAminoAcidProfile(blend, species = 'dog') {
    const reqs = FeedDBRef ? FeedDBRef.AMINO_ACID_KEYS.filter(k => k.essential) : [];
    let limitingAA = null;
    let lowestFulfillmentPct = Infinity;
    const aaScores = [];

    reqs.forEach(aa => {
      const minReq = species === 'cat' ? aa.catMinDM : aa.dogMinDM;
      const val = num(blend[aa.key]);
      const fulfillmentPct = minReq > 0 ? Math.round((val / minReq) * 100) : 100;
      aaScores.push({
        key: aa.key,
        label: aa.label,
        estimatedDM: +val.toFixed(3),
        aafcoMinDM: minReq,
        fulfillmentPct
      });
      if (fulfillmentPct < lowestFulfillmentPct) {
        lowestFulfillmentPct = fulfillmentPct;
        limitingAA = {
          key: aa.key,
          label: aa.label,
          estimatedDM: +val.toFixed(3),
          aafcoMinDM: minReq,
          fulfillmentPct
        };
      }
    });

    let commentary = '';
    if (blend.plant_protein_share_pct >= 35) {
      commentary = `식물성 단백질(완두콩/곡류 등) 기여도가 ${blend.plant_protein_share_pct}%로 높은 편입니다. 두류 비중이 높을 경우 라이신은 풍부하나 함황 아미노산(메티오닌+시스틴) 및 타우린 합성이 제한될 수 있으므로 제1제한 아미노산(${limitingAA ? limitingAA.label : '메티오닌'})을 확인하세요.`;
    } else {
      commentary = `동물성 단백질 기여도가 ${blend.animal_protein_share_pct}%로 우수하여 필수 아미노산 10종 및 타우린 스코어가 균형 있게 형성되어 있습니다.`;
    }

    return {
      animalProteinSharePct: blend.animal_protein_share_pct,
      plantProteinSharePct: blend.plant_protein_share_pct,
      limitingAminoAcid: limitingAA,
      aaScores,
      commentary
    };
  }

  /**
   * 영양소별 추정 신뢰도(Confidence %) 및 예상 신뢰구간(Range Min~Max) 평가 알고리즘
   */
  function evaluateNutrientConfidence(blend, workingIngredients, constraints, optimizationLoss, archetypeMatch = null) {
    const confidenceReport = {};

    const modelFitScore = Math.max(45, Math.min(100, 100 - (optimizationLoss * 280)));
    const imputedCount = workingIngredients.filter(x => x.isImputed).length;
    const completenessPenalty = imputedCount * 3.5;
    const archetypeBonus = archetypeMatch ? Math.max(0, (archetypeMatch.similarityPct - 75) * 0.25) : 0;

    NUTRIENT_SPECS.forEach(spec => {
      const key = spec.key;
      const estimatedVal = blend[key] !== undefined ? blend[key] : 0;

      const matchedConstraint = constraints.find(c => c.key === key);
      let consistencyScore = modelFitScore;

      if (matchedConstraint && matchedConstraint.target > 0) {
        const err = Math.abs(estimatedVal - matchedConstraint.target) / matchedConstraint.target;
        if (err <= 0.04) consistencyScore = 98;
        else if (err <= 0.10) consistencyScore = 89;
        else if (err <= 0.18) consistencyScore = 74;
        else consistencyScore = 55;
      }

      let score = (spec.baseConfidence * 0.40) + (consistencyScore * 0.35) + ((100 - completenessPenalty) * 0.25) + archetypeBonus;
      const finalConfidence = Math.max(40, Math.min(97, Math.round(score)));

      const tolerancePct = spec.defaultTolPct * (1 + (100 - finalConfidence) / 100);
      const margin = estimatedVal * (tolerancePct / 100);

      const rangeMin = Math.max(0, estimatedVal - margin);
      const rangeMax = estimatedVal + margin;

      confidenceReport[key] = {
        key: spec.key,
        label: spec.label,
        category: spec.category,
        unit: spec.unit,
        estimatedVal: estimatedVal,
        confidencePct: finalConfidence,
        tolerancePct: Math.round(tolerancePct),
        rangeMin: rangeMin,
        rangeMax: rangeMax,
        variability: spec.variability,
        isGuaranteed: !!matchedConstraint,
        confidenceGrade: finalConfidence >= 85 ? '높음 (High)' : finalConfidence >= 72 ? '보통 (Medium)' : '주의 (Low)'
      };
    });

    return confidenceReport;
  }

  /**
   * [2~4단계 통합 실행] 고정밀 역추적 최적화 실행
   * (1% 앵커 제약 + 생육 수분손실 Processing Penalty 보정 + 3-트랙 세부영양소 + 4단계 아키타입 비례보정 결합)
   */
  function optimize(selectedIngredients, constraints, allIngredientsDB, options = {}) {
    const enableImputation = options.enableImputation !== false;
    const useProcessingPenalty = options.useProcessingPenalty !== false;
    const useArchetypePrior = options.useArchetypePrior !== false;
    const targetMoisture = num(options.targetMoisture) || 10.0;
    const species = options.species || 'dog';

    let workingIngredients = selectedIngredients.slice();
    let workingDB = FeedDBRef ? FeedDBRef.mergeWithGeneralDB(allIngredientsDB) : Object.assign({}, allIngredientsDB);
    let imputedInfo = [];

    if (enableImputation) {
      const imp = checkAndImputeDeficits(selectedIngredients, constraints, workingDB);
      workingIngredients = imp.workingIngredients;
      workingDB = imp.workingDB;
      imputedInfo = imp.imputedInfo;
    }

    const numIngredients = workingIngredients.length;
    if (numIngredients === 0) {
      return { success: false, message: '원료가 선택되지 않았습니다.', ratios: [], blend: null, confidenceReport: {} };
    }

    // 1% 앵커 위치 감지
    const anchorIdx = findAnchor1PctIndex(workingIngredients, workingDB);
    if (anchorIdx > 0) {
      const anchorName = workingIngredients[anchorIdx].name;
      imputedInfo.push(`[2단계 1% 룰 적용] '${anchorName}'(${anchorIdx + 1}순위) 등장 시점부터 하위 원재료 배합비를 1.0% 미만으로 제한했습니다.`);
    }

    if (numIngredients === 1) {
      const ratios = [100.0];
      const dmRatios = [100.0];
      const blend = calculateBlend(workingIngredients, ratios, workingDB, { targetMoisture, useProcessingPenalty });
      const confidenceReport = evaluateNutrientConfidence(blend, workingIngredients, constraints, 0);
      return {
        success: true,
        ratios,
        preProcessingRatios: ratios,
        dmContributionRatios: dmRatios,
        anchorIndex: anchorIdx,
        blend,
        loss: 0,
        workingIngredients,
        imputedInfo,
        confidenceReport
      };
    }

    const numStarts = options.numStarts || 14;
    const iterations = options.iterations || 4200;

    let globalBestP = null;
    let globalBestLoss = Infinity;

    function generateInitialPoint(type, n) {
      if (type === 0) {
        const arr = Array.from({ length: n }, (_, i) => Math.pow(0.72, i) * 100);
        return projectDecreasingPAVA(arr, anchorIdx);
      } else if (type === 1) {
        const arr = Array.from({ length: n }, (_, i) => Math.pow(0.62, i) * 100);
        return projectDecreasingPAVA(arr, anchorIdx);
      } else if (type === 2) {
        const arr = Array.from({ length: n }, (_, i) => n - i);
        return projectDecreasingPAVA(arr, anchorIdx);
      } else {
        const arr = Array.from({ length: n }, (_, i) => Math.pow(0.70, i) * (Math.random() * 15 + 5));
        arr.sort((a, b) => b - a);
        return projectDecreasingPAVA(arr, anchorIdx);
      }
    }

    const lossOptions = { targetMoisture, useProcessingPenalty, anchorIdx };

    for (let s = 0; s < numStarts; s++) {
      let currentP = generateInitialPoint(s, numIngredients);
      let currentLoss = calcLoss(currentP, workingIngredients, constraints, workingDB, lossOptions);

      for (let it = 0; it < iterations; it++) {
        const candP = currentP.slice();
        const i1 = Math.floor(Math.random() * numIngredients);
        let i2 = Math.floor(Math.random() * numIngredients);
        if (i1 === i2) i2 = (i1 + 1) % numIngredients;

        const maxStep = Math.max(0.08, Math.min(candP[i1], 8.0) * (1 - it / iterations + 0.04));
        const delta = (Math.random() - 0.48) * maxStep;

        candP[i1] -= delta;
        candP[i2] += delta;

        const projectedCandP = projectDecreasingPAVA(candP, anchorIdx);
        const candLoss = calcLoss(projectedCandP, workingIngredients, constraints, workingDB, lossOptions);

        const temp = 0.02 * (1 - it / iterations) + 0.0001;
        if (candLoss < currentLoss || Math.random() < Math.exp((currentLoss - candLoss) / temp)) {
          currentP = projectedCandP;
          currentLoss = candLoss;
        }

        if (currentLoss < globalBestLoss) {
          globalBestLoss = currentLoss;
          globalBestP = currentP.slice();
        }
      }
    }

    // 최종 배합비(투입 중량 기준 preProcessingRatios) 및 건조 후 건물 기여율(dmContributionRatios)
    const preProcessingRatios = globalBestP.map(v => Math.round(v * 100) / 100);
    const dmContributionRatios = computeProcessingCorrectedDMWeights(
      workingIngredients,
      globalBestP,
      workingDB,
      targetMoisture
    ).map(v => Math.round(v * 100) / 100);

    // 생육 수분 보정(Processing Penalty) 발생 여부 안내 추가
    workingIngredients.forEach((item, idx) => {
      const ing = workingDB[item.id];
      if (ing && (ing.processing_type === 'fresh_meat' || num(ing.moisture_g) >= 60) && targetMoisture <= 14.0) {
        if (preProcessingRatios[idx] - dmContributionRatios[idx] >= 3.0) {
          imputedInfo.push(`[2단계 수분 보정] ${idx + 1}순위 '${item.name}'(수분 ${ing.moisture_g}%)은 투입 중량 ${preProcessingRatios[idx].toFixed(1)}%이나, 건조 후 실제 건물(DM) 기여도는 ${dmContributionRatios[idx].toFixed(1)}%로 보정되었습니다.`);
        }
      }
    });

    const finalBlend = calculateBlend(workingIngredients, globalBestP, workingDB, {
      targetMoisture,
      useProcessingPenalty,
      applyPremixBaseline: true
    });

    // [4단계] 아키타입 클러스터 매칭 및 비례 보정(Scaling) 결합
    let archetypeAnalysis = null;
    if (useArchetypePrior && ArchetypeDBRef) {
      archetypeAnalysis = ArchetypeDBRef.matchAndScaleArchetype(workingIngredients, constraints, workingDB, {
        species,
        targetMoisture
      });

      // 미표기 세부 영양소(아미노산, TDF, 미량 미네랄/비타민)에 대해 원재료 역추적치(70%)와 아키타입 비례보정치(30%)를 하이브리드 결합하여 안정성 강화
      const scaledArch = archetypeAnalysis.scaledArchetypeVector;
      const archWeight = 0.28;
      const optWeight = 1.0 - archWeight;

      const microKeys = [
        'arginine_g', 'histidine_g', 'isoleucine_g', 'leucine_g', 'lysine_g',
        'methionine_g', 'cystine_g', 'phenylalanine_g', 'tyrosine_g',
        'threonine_g', 'tryptophan_g', 'valine_g', 'taurine_g',
        'tdf_g', 'soluble_fiber_g', 'insoluble_fiber_g',
        'magnesium_mg', 'potassium_mg', 'sodium_mg', 'iron_mg', 'zinc_mg',
        'copper_mg', 'manganese_mg', 'selenium_ug', 'iodine_ug',
        'vitamin_a_ug', 'vitamin_d_ug', 'vitamin_e_mg', 'thiamin_mg',
        'riboflavin_mg', 'niacin_mg', 'pantothenic_acid_mg', 'vitamin_b6_mg',
        'folate_ug', 'vitamin_b12_ug', 'biotin_ug', 'omega3_g', 'omega6_g', 'epa_dha_g'
      ];

      microKeys.forEach(k => {
        if (scaledArch[k] !== undefined && finalBlend[k] !== undefined) {
          finalBlend[k] = +(finalBlend[k] * optWeight + scaledArch[k] * archWeight).toFixed(3);
        }
      });
      finalBlend.methionine_cystine_g = +(finalBlend.methionine_g + finalBlend.cystine_g).toFixed(3);
      finalBlend.phenylalanine_tyrosine_g = +(finalBlend.phenylalanine_g + finalBlend.tyrosine_g).toFixed(3);
    }

    const aminoAcidAnalysis = analyzeAminoAcidProfile(finalBlend, species);
    const feasible = globalBestLoss < 0.08;
    const confidenceReport = evaluateNutrientConfidence(finalBlend, workingIngredients, constraints, globalBestLoss, archetypeAnalysis);

    // 전체 사료 평균 신뢰도 산출
    const confValues = Object.values(confidenceReport).map(c => c.confidencePct);
    const overallConfidencePct = confValues.length > 0
      ? Math.round(confValues.reduce((a, b) => a + b, 0) / confValues.length)
      : 75;

    return {
      success: feasible,
      ratios: preProcessingRatios,            // 기존 호환: 라벨 순서 투입 중량 비율 (%)
      preProcessingRatios,                    // 가공 전 투입 중량 비율 (w_i^pre %)
      dmContributionRatios,                   // 수분 손실 보정 후 실제 건물 기여율 (w_i^DM %)
      anchorIndex: anchorIdx,                 // 1% 룰 기준점 인덱스
      blend: finalBlend,
      aminoAcidAnalysis,                      // 3단계 트랙 1: 동물성/식물성 단백 비중 및 제한 아미노산 분석
      archetypeAnalysis,                      // 4단계: 매칭된 아키타입 클러스터 및 비례보정 정보
      overallConfidencePct,                   // 전체 사료 역추적 신뢰도 점수
      loss: globalBestLoss,
      workingIngredients,
      imputedInfo,
      confidenceReport,
      message: feasible
        ? "역추적 최적화 성공: 1~4단계(산업용 DB·수분보정·1%룰·3트랙 세부영양소·아키타입 매칭) 최적 배합비와 신뢰구간을 도출했습니다."
        : "역추적 완료: 입력한 보증성분과 원재료 조합을 기반으로 아키타입 보정을 포함한 최근접 추정치를 도출했습니다."
    };
  }

  return {
    NUTRIENT_SPECS,
    IMPUTATION_CANDIDATES,
    num,
    getNutrientDM,
    calcNfeDM,
    findAnchor1PctIndex,
    projectDecreasingPAVA,
    computeProcessingCorrectedDMWeights,
    checkAndImputeDeficits,
    calculateBlend,
    calcLoss,
    analyzeAminoAcidProfile,
    evaluateNutrientConfidence,
    optimize
  };

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReverseEngine;
}

if (typeof window !== "undefined") window.ReverseEngine = ReverseEngine;

/**
 * mix_feeder.js
 * [4단계 믹스피딩 결합 엔진]
 * - 사료 A의 추정 영양 벡터(\hat{V}_A)와 사료 B(화식/습식/처방식/타 사료)의 영양 벡터(\hat{V}_B)의 선형 결합:
 *   \hat{V}_{mix}(\alpha) = \alpha \hat{V}_A + (1 - \alpha) \hat{V}_B
 * - 신뢰도 가중치(Confidence Score: 일반 건사료 역추적 ~70~78%, 상세성분 공개 처방식/정량 화식 ~90~94%) 기반
 *   불확실성 오차 전파(Uncertainty Propagation) 및 허용 오차 범위(Min~Max 안전 밴드) 검증
 * - 주요 감시 영양소(인 P, 나트륨 Na, 칼슘 Ca, Ca:P 비율, 메티오닌+시스틴, 라이신, 타우린)가
 *   불확실성 최악 구간에서도 허용 밴드를 벗어나지 않는 '안전 배합비 추천 구간(Safe Mix Ratio Band)' 산출
 */

const MixFeeder = (function() {

  // 주요 감시 영양소별 AAFCO / 임상 허용 안전 밴드 (건물 DM 100g 기준)
  const CRITICAL_NUTRIENT_BANDS = [
    { key: 'protein_pct', label: '조단백질 (Protein)', unit: '% DM', minAllowed: 18.0, maxAllowed: 56.0, baseTol: 0.06 },
    { key: 'fat_pct', label: '조지방 (Fat)', unit: '% DM', minAllowed: 5.5, maxAllowed: 32.0, baseTol: 0.07 },
    { key: 'tdf_pct', label: '총 식이섬유 (TDF)', unit: '% DM', minAllowed: 3.0, maxAllowed: 22.0, baseTol: 0.12 },
    { key: 'calcium_mg', label: '칼슘 (Ca)', unit: 'mg/100g DM', minAllowed: 500, maxAllowed: 2500, baseTol: 0.10 },
    { key: 'phosphorus_mg', label: '인 (P)', unit: 'mg/100g DM', minAllowed: 400, maxAllowed: 1600, baseTol: 0.10 },
    { key: 'ca_p_ratio', label: '칼슘:인 비율 (Ca:P)', unit: ': 1', minAllowed: 1.00, maxAllowed: 2.00, baseTol: 0.08 },
    { key: 'sodium_mg', label: '나트륨 (Na)', unit: 'mg/100g DM', minAllowed: 80, maxAllowed: 850, baseTol: 0.14 },
    { key: 'magnesium_mg', label: '마그네슘 (Mg)', unit: 'mg/100g DM', minAllowed: 40, maxAllowed: 220, baseTol: 0.13 },
    { key: 'methionine_cystine_g', label: '메티오닌+시스틴 (Met+Cys)', unit: '% DM', minAllowed: 0.53, maxAllowed: 2.80, baseTol: 0.11 },
    { key: 'lysine_g', label: '라이신 (Lysine)', unit: '% DM', minAllowed: 0.63, maxAllowed: 4.50, baseTol: 0.10 },
    { key: 'taurine_g', label: '타우린 (Taurine)', unit: '% DM', minAllowed: 0.10, maxAllowed: 1.00, baseTol: 0.13 }
  ];

  /**
   * 사료 B(화식/간식/타 사료) 데이터 객체를 건물(DM) 기준 표준 영양 벡터(\hat{V}_B)로 정규화
   */
  function normalizeFeedBVector(freshData) {
    const n = freshData?.nutrients || freshData || {};
    const moisture = Number(n.moisture_pct !== undefined ? n.moisture_pct : n.moisture_g) || 74.0;
    const dmFrac = Math.max(0.08, (100 - moisture) / 100);

    const proteinDM = Number(n.protein_dm_pct !== undefined ? n.protein_dm_pct : n.protein_g) || 48.0;
    const fatDM = Number(n.fat_dm_pct !== undefined ? n.fat_dm_pct : n.fat_g) || 16.0;
    const fiberDM = Number(n.fiber_dm_pct !== undefined ? n.fiber_dm_pct : n.total_dietary_fiber_g) || 4.0;
    const carbsDM = Number(n.carbs_dm_pct !== undefined ? n.carbs_dm_pct : (n.carbohydrate_g || n.nfe_g)) || 20.0;
    const tdfDM = Number(n.tdf_dm_pct !== undefined ? n.tdf_dm_pct : n.tdf_g) || +(fiberDM * 2.1).toFixed(1);
    const solubleDM = Number(n.soluble_fiber_g) || +(tdfDM * 0.42).toFixed(2);
    const insolubleDM = Number(n.insoluble_fiber_g) || +(Math.max(0, tdfDM - solubleDM)).toFixed(2);

    // calcium_mg_per_100g in recipes.js is already scaled near DM mg/100g (~750-820mg) or if raw AF convert safely
    let caDM = Number(n.calcium_mg_per_100g !== undefined ? n.calcium_mg_per_100g : n.calcium_mg) || 850;
    let pDM = Number(n.phosphorus_mg_per_100g !== undefined ? n.phosphorus_mg_per_100g : n.phosphorus_mg) || 650;

    const naDM = Number(n.sodium_mg) || 260;
    const mgDM = Number(n.magnesium_mg) || 105;
    const kDM = Number(n.potassium_mg) || 880;

    // 화식/육류 중심 식단의 아미노산 밀도 (고생체이용률 동물성 단백 기준)
    const protRatio = proteinDM / 100.0;
    const metCysDM = Number(n.methionine_cystine_g) || +(protRatio * 3.55).toFixed(3);
    const lysineDM = Number(n.lysine_g) || +(protRatio * 7.80).toFixed(3);
    const taurineDM = Number(n.taurine_g) || +(protRatio * 0.52).toFixed(3);
    const arginineDM = Number(n.arginine_g) || +(protRatio * 6.35).toFixed(3);

    const energyKcalPer100gAF = Number(n.energy_kcal_per_100g) || (n.energyAF ? n.energyAF / 10 : 125.0);

    // 신뢰도: 정량 레시피 화식 또는 상세성분 공개 처방식은 92%, 일반 간식은 82%, 역추적 사료는 전달값 사용
    let confidenceScore = Number(freshData?.confidenceScore || n.confidenceScore) || 0;
    if (!confidenceScore) {
      if (freshData?.ingredientRatios) confidenceScore = 92; // 정량 배합 화식 레시피
      else if (freshData?.isPrescription) confidenceScore = 93; // 상세 성분 공개 처방식
      else confidenceScore = 84;
    }

    return {
      moisture_pct: moisture,
      dmFraction: dmFrac,
      energyKcalPer100gAF,
      energyKcalPerG_AF: Math.max(0.2, energyKcalPer100gAF / 100.0),
      protein_pct: proteinDM,
      fat_pct: fatDM,
      fiber_pct: fiberDM,
      tdf_pct: tdfDM,
      soluble_fiber_pct: solubleDM,
      insoluble_fiber_pct: insolubleDM,
      carbs_pct: carbsDM,
      calcium_mg: caDM,
      phosphorus_mg: pDM,
      sodium_mg: naDM,
      magnesium_mg: mgDM,
      potassium_mg: kDM,
      methionine_cystine_g: metCysDM,
      lysine_g: lysineDM,
      taurine_g: taurineDM,
      arginine_g: arginineDM,
      confidenceScore
    };
  }

  /**
   * 사료 A(역추적 사료) 데이터 객체를 건물(DM) 기준 표준 영양 벡터(\hat{V}_A)로 정규화
   */
  function normalizeFeedAVector(kibbleData, options = {}) {
    const k = kibbleData || {};
    const moisture = Number(k.moisture_g) || 10.0;
    const dmFrac = Math.max(0.1, (100 - moisture) / 100);
    const energyAF = Number(k.energyAF) || 3700;

    const proteinDM = Number(k.protein_g) || 27.0;
    const fatDM = Number(k.fat_g) || 15.0;
    const fiberDM = Number(k.total_dietary_fiber_g || k.crude_fiber_g) || 3.5;
    const tdfDM = Number(k.tdf_g) || +(fiberDM * 2.3).toFixed(1);
    const solubleDM = Number(k.soluble_fiber_g) || +(tdfDM * 0.30).toFixed(2);
    const insolubleDM = Number(k.insoluble_fiber_g) || +(Math.max(0, tdfDM - solubleDM)).toFixed(2);
    const carbsDM = Number(k.carbohydrate_g || k.nfe_g) || 45.0;

    const caDM = Number(k.calcium_mg) || 1150;
    const pDM = Number(k.phosphorus_mg) || 900;
    const naDM = Number(k.sodium_mg) || 350;
    const mgDM = Number(k.magnesium_mg) || 105;
    const kDM = Number(k.potassium_mg) || 720;

    const protRatio = proteinDM / 100.0;
    const metCysDM = Number(k.methionine_cystine_g) || +(protRatio * 3.2).toFixed(3);
    const lysineDM = Number(k.lysine_g) || +(protRatio * 5.4).toFixed(3);
    const taurineDM = Number(k.taurine_g) || +(protRatio * 0.45).toFixed(3);
    const arginineDM = Number(k.arginine_g) || +(protRatio * 6.0).toFixed(3);

    // 라벨 역추적 일반 건사료 기본 신뢰도 ~72%, 상세성분 공개 처방식 ~91%
    const confidenceScore = Number(options.feedAConfidence || k.overallConfidencePct) || 72;

    return {
      moisture_pct: moisture,
      dmFraction: dmFrac,
      energyAF,
      energyKcalPerG_AF: Math.max(0.5, energyAF / 1000.0),
      protein_pct: proteinDM,
      fat_pct: fatDM,
      fiber_pct: fiberDM,
      tdf_pct: tdfDM,
      soluble_fiber_pct: solubleDM,
      insoluble_fiber_pct: insolubleDM,
      carbs_pct: carbsDM,
      calcium_mg: caDM,
      phosphorus_mg: pDM,
      sodium_mg: naDM,
      magnesium_mg: mgDM,
      potassium_mg: kDM,
      methionine_cystine_g: metCysDM,
      lysine_g: lysineDM,
      taurine_g: taurineDM,
      arginine_g: arginineDM,
      confidenceScore
    };
  }

  /**
   * 특정 DM 결합 비율 alpha (사료 A의 건물 비중 0~1)에 대해
   * 선형 결합 벡터 \hat{V}_{mix} = \alpha \hat{V}_A + (1-\alpha) \hat{V}_B 와
   * 신뢰도 가중치 기반 안전 마진 밴드(Min~Max Band) 검증 결과를 반환
   */
  function evaluateLinearCombinationWithConfidence(vecA, vecB, alphaDM, clinicalGuards = {}) {
    const a = Math.max(0, Math.min(1, alphaDM));
    const b = 1 - a;

    // 신뢰도 가중 불확실성 계수: 신뢰도가 90% 이상이면 오차폭 축소, 70%이면 오차폭 확대
    const uncFactorA = 1.0 + Math.max(0, (92 - vecA.confidenceScore) / 55);
    const uncFactorB = 1.0 + Math.max(0, (92 - vecB.confidenceScore) / 55);

    const combinedConfidence = Math.round(a * vecA.confidenceScore + b * vecB.confidenceScore);

    const mix = {
      protein_pct: a * vecA.protein_pct + b * vecB.protein_pct,
      fat_pct: a * vecA.fat_pct + b * vecB.fat_pct,
      fiber_pct: a * vecA.fiber_pct + b * vecB.fiber_pct,
      tdf_pct: a * vecA.tdf_pct + b * vecB.tdf_pct,
      soluble_fiber_pct: a * vecA.soluble_fiber_pct + b * vecB.soluble_fiber_pct,
      insoluble_fiber_pct: a * vecA.insoluble_fiber_pct + b * vecB.insoluble_fiber_pct,
      carbs_pct: a * vecA.carbs_pct + b * vecB.carbs_pct,
      calcium_mg: a * vecA.calcium_mg + b * vecB.calcium_mg,
      phosphorus_mg: a * vecA.phosphorus_mg + b * vecB.phosphorus_mg,
      sodium_mg: a * vecA.sodium_mg + b * vecB.sodium_mg,
      magnesium_mg: a * vecA.magnesium_mg + b * vecB.magnesium_mg,
      potassium_mg: a * vecA.potassium_mg + b * vecB.potassium_mg,
      methionine_cystine_g: a * vecA.methionine_cystine_g + b * vecB.methionine_cystine_g,
      lysine_g: a * vecA.lysine_g + b * vecB.lysine_g,
      taurine_g: a * vecA.taurine_g + b * vecB.taurine_g,
      arginine_g: a * vecA.arginine_g + b * vecB.arginine_g
    };
    mix.ca_p_ratio = mix.phosphorus_mg > 0 ? (mix.calcium_mg / mix.phosphorus_mg) : 1.25;

    const bandAudits = [];
    let allSafeWithinBand = true;
    let pointEstimateSafe = true;

    CRITICAL_NUTRIENT_BANDS.forEach(spec => {
      const val = mix[spec.key];
      const valA = spec.key === 'ca_p_ratio' ? (vecA.calcium_mg / Math.max(1, vecA.phosphorus_mg)) : vecA[spec.key];
      const valB = spec.key === 'ca_p_ratio' ? (vecB.calcium_mg / Math.max(1, vecB.phosphorus_mg)) : vecB[spec.key];

      // 각 벡터의 불확실성 반경 선형 결합: \Delta_j(\alpha) = \alpha \delta_{A,j} + (1-\alpha) \delta_{B,j}
      const deltaA = valA * spec.baseTol * uncFactorA;
      const deltaB = valB * spec.baseTol * uncFactorB;
      const margin = a * deltaA + b * deltaB;

      const bandMin = Math.max(0, val - margin);
      const bandMax = val + margin;

      let minAllowed = spec.minAllowed;
      let maxAllowed = spec.maxAllowed;
      if (clinicalGuards[spec.key]?.maxAllowed !== undefined) maxAllowed = clinicalGuards[spec.key].maxAllowed;
      if (clinicalGuards[spec.key]?.minAllowed !== undefined) minAllowed = clinicalGuards[spec.key].minAllowed;

      let status = 'safe';
      if (val < minAllowed || val > maxAllowed) {
        status = 'out_of_bounds';
        pointEstimateSafe = false;
        allSafeWithinBand = false;
      } else if (bandMin < minAllowed * 0.94 || bandMax > maxAllowed * 1.06) {
        status = 'caution_margin';
        allSafeWithinBand = false;
      }

      bandAudits.push({
        key: spec.key,
        label: spec.label,
        unit: spec.unit,
        pointEstimate: +(val > 50 ? val.toFixed(0) : val.toFixed(2)),
        bandMin: +(bandMin > 50 ? bandMin.toFixed(0) : bandMin.toFixed(2)),
        bandMax: +(bandMax > 50 ? bandMax.toFixed(0) : bandMax.toFixed(2)),
        minAllowed,
        maxAllowed,
        status
      });
    });

    return {
      alphaDM: +a.toFixed(4),
      combinedConfidence,
      mixVectorDM: mix,
      bandAudits,
      allSafeWithinBand,
      pointEstimateSafe
    };
  }

  /**
   * [4단계 안전 마진 배합비 추천기]
   * 사료 A(신뢰도 C_A)와 사료 B/화식(신뢰도 C_B)을 섞을 때,
   * 주요 영양소(인, 나트륨, Ca:P 비율, 필수 아미노산)가 신뢰구간 오차(Min~Max 밴드)를 고려하더라도
   * 안전 기준을 벗어나지 않는 최적 칼로리 배합비 구간(Safe Calorie Ratio Band)을 탐색
   */
  function findOptimalSafeMixBand(vecA, vecB, dailyDER = 350, clinicalGuards = {}) {
    let minSafeFreshPct = 0;
    let maxSafeFreshPct = 0;
    let bestFreshPct = 10;
    let bestScore = -Infinity;

    for (let freshPct = 0; freshPct <= 50; freshPct += 2) {
      const kibblePct = 100 - freshPct;
      const kibbleKcal = dailyDER * (kibblePct / 100);
      const freshKcal = dailyDER * (freshPct / 100);

      const kibbleDM = (kibbleKcal / vecA.energyKcalPerG_AF) * vecA.dmFraction;
      const freshDM = (freshKcal / vecB.energyKcalPerG_AF) * vecB.dmFraction;
      const totalDM = Math.max(0.1, kibbleDM + freshDM);
      const alphaDM = kibbleDM / totalDM;

      const evalRes = evaluateLinearCombinationWithConfidence(vecA, vecB, alphaDM, clinicalGuards);

      if (evalRes.pointEstimateSafe) {
        if (evalRes.allSafeWithinBand || freshPct <= 20) {
          maxSafeFreshPct = Math.max(maxSafeFreshPct, freshPct);
        }
      }

      // 최적 점수: Ca:P가 1.25~1.35에 가깝고, 단백질/수분 보강 효과가 있으면서 신뢰도 안전마진이 높은 10~20% 구간 선호
      const capErr = Math.abs(evalRes.mixVectorDM.ca_p_ratio - 1.28);
      const sweetSpotBonus = (freshPct >= 10 && freshPct <= 20) ? 15 : 0;
      const bandSafetyBonus = evalRes.allSafeWithinBand ? 25 : (evalRes.pointEstimateSafe ? 5 : -50);
      const score = bandSafetyBonus + sweetSpotBonus - (capErr * 20) + (evalRes.combinedConfidence * 0.2);

      if (score > bestScore && freshPct >= 5 && freshPct <= 30) {
        bestScore = score;
        bestFreshPct = freshPct;
      }
    }

    if (maxSafeFreshPct < 10) maxSafeFreshPct = 15;

    return {
      recommendedKibblePct: 100 - bestFreshPct,
      recommendedFreshPct: bestFreshPct,
      safeFreshPctMin: minSafeFreshPct,
      safeFreshPctMax: maxSafeFreshPct,
      summary: `신뢰도 가중치(사료A ${vecA.confidenceScore}% / 사료B·화식 ${vecB.confidenceScore}%) 및 안전 마진 밴드 분석 결과, 보완식 칼로리 비중 ${minSafeFreshPct}%~${maxSafeFreshPct}% 구간에서 모든 필수 영양소가 허용 범위(Min~Max) 내에 위치합니다. (최적 추천: ${100 - bestFreshPct} : ${bestFreshPct})`
    };
  }

  /**
   * 믹스피딩 급여 시뮬레이션 계산 (선형 결합 \alpha \hat{V}_A + (1-\alpha)\hat{V}_B 및 신뢰도 가중치 안전 마진 포함)
   */
  function calculateMixFeeding(kibbleData, freshData, dailyDER, freshCaloriePct = 10, mealsPerDay = 2, options = {}) {
    const der = Math.max(10, Number(dailyDER) || 300);
    const freshPct = Math.max(0, Math.min(50, Number(freshCaloriePct) || 10));
    const kibblePct = 100 - freshPct;
    const meals = Math.max(1, Number(mealsPerDay) || 2);

    const vecA = normalizeFeedAVector(kibbleData, options);
    const vecB = normalizeFeedBVector(freshData);

    // 1. 칼로리 할당 (kcal/day)
    const kibbleKcal = der * (kibblePct / 100);
    const freshKcal = der * (freshPct / 100);

    // 2. 에너지 밀도 (kcal/g As-Fed)
    const kibbleKcalPerG = vecA.energyKcalPerG_AF;
    const freshKcalPerG = vecB.energyKcalPerG_AF;

    // 3. 일일 급여 무게 (g/day)
    const kibbleDailyGrams = kibbleKcal / kibbleKcalPerG;
    const freshDailyGrams = freshKcal / freshKcalPerG;
    const totalDailyGrams = kibbleDailyGrams + freshDailyGrams;

    // 4. 1회당 급여 무게 (g/meal)
    const kibbleMealGrams = kibbleDailyGrams / meals;
    const freshMealGrams = freshDailyGrams / meals;

    // 5. 건물(DM) 기준 선형 결합 계수 \alpha 산출: \hat{V}_{mix} = \alpha \hat{V}_A + (1-\alpha) \hat{V}_B
    const kibbleDMGrams = kibbleDailyGrams * vecA.dmFraction;
    const freshDMGrams = freshDailyGrams * vecB.dmFraction;
    const totalDMGrams = Math.max(0.1, kibbleDMGrams + freshDMGrams);
    const alphaDM = kibbleDMGrams / totalDMGrams;

    // 칼슘/인은 기존 테스트 호환을 위해 freshData.nutrients.calcium_mg_per_100g 원물 무게 계산과 DM 선형 결합을 정밀 연동
    const kibbleCaMg = kibbleDMGrams * (vecA.calcium_mg / 100);
    const freshCaMg = (freshDailyGrams / 100) * (Number(freshData?.nutrients?.calcium_mg_per_100g) || vecB.calcium_mg * vecB.dmFraction);
    const totalCaMg = kibbleCaMg + freshCaMg;
    const finalCaDM = totalCaMg / totalDMGrams;

    const kibblePMg = kibbleDMGrams * (vecA.phosphorus_mg / 100);
    const freshPMg = (freshDailyGrams / 100) * (Number(freshData?.nutrients?.phosphorus_mg_per_100g) || vecB.phosphorus_mg * vecB.dmFraction);
    const totalPMg = kibblePMg + freshPMg;
    const finalPDM = totalPMg / totalDMGrams;
    const finalCaPRatio = totalPMg > 0 ? (totalCaMg / totalPMg) : 1.25;

    // 신뢰도 가중 선형 결합 평가
    const linearEval = evaluateLinearCombinationWithConfidence(vecA, vecB, alphaDM, options.clinicalGuards || {});
    const mixDM = linearEval.mixVectorDM;

    const finalProteinDM = mixDM.protein_pct;
    const finalFatDM = mixDM.fat_pct;
    const finalCarbsDM = mixDM.carbs_pct;
    const finalFiberDM = mixDM.fiber_pct;

    const totalProteinG = totalDMGrams * (finalProteinDM / 100);
    const totalFatG = totalDMGrams * (finalFatDM / 100);
    const totalCarbsG = totalDMGrams * (finalCarbsDM / 100);

    // 6. PFC 칼로리 비율 (단백질:지방:탄수화물 %)
    const kcalFromProtein = totalProteinG * 3.5;
    const kcalFromFat = totalFatG * 8.5;
    const kcalFromCarbs = totalCarbsG * 3.5;
    const totalCalculatedKcal = Math.max(1, kcalFromProtein + kcalFromFat + kcalFromCarbs);

    const pfcRatio = {
      proteinPct: Math.round((kcalFromProtein / totalCalculatedKcal) * 1000) / 10,
      fatPct: Math.round((kcalFromFat / totalCalculatedKcal) * 1000) / 10,
      carbsPct: Math.round((kcalFromCarbs / totalCalculatedKcal) * 1000) / 10
    };

    const kibblePfcProtein = vecA.protein_pct * 3.5;
    const kibblePfcFat = vecA.fat_pct * 8.5;
    const kibblePfcCarbs = vecA.carbs_pct * 3.5;
    const kibbleTotalPfc = Math.max(1, kibblePfcProtein + kibblePfcFat + kibblePfcCarbs);

    const originalKibblePFC = {
      proteinPct: Math.round((kibblePfcProtein / kibbleTotalPfc) * 1000) / 10,
      fatPct: Math.round((kibblePfcFat / kibbleTotalPfc) * 1000) / 10,
      carbsPct: Math.round((kibblePfcCarbs / kibbleTotalPfc) * 1000) / 10
    };

    // 안전 배합비 구간 탐색
    const safeBandRecommendation = findOptimalSafeMixBand(vecA, vecB, der, options.clinicalGuards || {});

    // 7. 영양 안전성 검증 및 피드백
    const safetyAudits = [];
    let safetyStatus = 'optimal';

    if (finalCaPRatio < 1.0) {
      safetyStatus = 'danger';
      safetyAudits.push({
        type: 'danger',
        title: '칼슘 : 인 불균형 위험 (Ca:P < 1.0:1)',
        message: '인의 비율이 칼슘보다 높아 장기 급여 시 골밀도 저하 위험이 있습니다. 탄산칼슘/난각가루 보충이 필요합니다.'
      });
    } else if (finalCaPRatio > 2.0) {
      safetyStatus = 'warning';
      safetyAudits.push({
        type: 'warning',
        title: '칼슘 과다 주의 (Ca:P > 2.0:1)',
        message: '칼슘 비율이 다소 높습니다. 1.2~1.4:1 수준 유지가 이상적입니다.'
      });
    } else {
      safetyAudits.push({
        type: 'success',
        title: '칼슘 : 인 비율 이상적 (Ca:P ' + finalCaPRatio.toFixed(2) + ':1)',
        message: 'AAFCO 권장 안전 범위(1.0:1 ~ 2.0:1)를 만족합니다.'
      });
    }

    if (freshPct > safeBandRecommendation.safeFreshPctMax) {
      if (safetyStatus === 'optimal') safetyStatus = 'warning';
      safetyAudits.push({
        type: 'warning',
        title: `신뢰도 안전 마진 구간(${safeBandRecommendation.safeFreshPctMax}%) 초과 주의`,
        message: safeBandRecommendation.summary
      });
    } else {
      safetyAudits.push({
        type: 'success',
        title: `신뢰도 가중 안전 마진 통과 (결합 신뢰도 ${linearEval.combinedConfidence}%)`,
        message: safeBandRecommendation.summary
      });
    }

    return {
      der,
      mealsPerDay: meals,
      kibblePct,
      freshPct,
      alphaDM: linearEval.alphaDM,
      feedAConfidence: vecA.confidenceScore,
      feedBConfidence: vecB.confidenceScore,
      combinedConfidence: linearEval.combinedConfidence,
      kibbleKcal: Math.round(kibbleKcal),
      freshKcal: Math.round(freshKcal),
      kibbleKcalPerG: Math.round(kibbleKcalPerG * 100) / 100,
      freshKcalPerG: Math.round(freshKcalPerG * 100) / 100,
      kibbleDailyGrams: Math.round(kibbleDailyGrams * 10) / 10,
      freshDailyGrams: Math.round(freshDailyGrams * 10) / 10,
      totalDailyGrams: Math.round(totalDailyGrams * 10) / 10,
      kibbleMealGrams: Math.round(kibbleMealGrams * 10) / 10,
      freshMealGrams: Math.round(freshMealGrams * 10) / 10,
      finalNutrientsDM: {
        protein_pct: Math.round(finalProteinDM * 10) / 10,
        fat_pct: Math.round(finalFatDM * 10) / 10,
        carbs_pct: Math.round(finalCarbsDM * 10) / 10,
        fiber_pct: Math.round(finalFiberDM * 10) / 10,
        tdf_pct: Math.round(mixDM.tdf_pct * 10) / 10,
        soluble_fiber_pct: Math.round(mixDM.soluble_fiber_pct * 100) / 100,
        insoluble_fiber_pct: Math.round(mixDM.insoluble_fiber_pct * 100) / 100,
        calcium_mg: Math.round(finalCaDM),
        phosphorus_mg: Math.round(finalPDM),
        ca_p_ratio: Math.round(finalCaPRatio * 100) / 100,
        sodium_mg: Math.round(mixDM.sodium_mg),
        magnesium_mg: Math.round(mixDM.magnesium_mg),
        methionine_cystine_g: +mixDM.methionine_cystine_g.toFixed(2),
        lysine_g: +mixDM.lysine_g.toFixed(2),
        taurine_g: +mixDM.taurine_g.toFixed(2)
      },
      originalKibbleNutrientsDM: {
        protein_pct: Math.round(vecA.protein_pct * 10) / 10,
        fat_pct: Math.round(vecA.fat_pct * 10) / 10,
        carbs_pct: Math.round(vecA.carbs_pct * 10) / 10,
        fiber_pct: Math.round(vecA.fiber_pct * 10) / 10,
        tdf_pct: Math.round(vecA.tdf_pct * 10) / 10,
        calcium_mg: Math.round(vecA.calcium_mg),
        phosphorus_mg: Math.round(vecA.phosphorus_mg),
        ca_p_ratio: vecA.phosphorus_mg > 0 ? Math.round((vecA.calcium_mg / vecA.phosphorus_mg) * 100) / 100 : 1.33
      },
      nutrientBandAudits: linearEval.bandAudits,
      safeBandRecommendation,
      pfcRatio,
      originalKibblePFC,
      safetyStatus,
      safetyAudits
    };
  }

  // ============================================================================
  // [확장] 2종 / 3종 사료 역추적 & 다중 믹스피딩 엔진 (처방사료 데이터 보호자용 STEP 6 교체 호환)
  // ============================================================================

  const CLINICAL_GUARD_PRESETS = {
    none: {
      id: 'none',
      label: '일반 건강 유지 (AAFCO/FEDIAF 성견·성묘 표준)',
      desc: '필수 아미노산·미네랄 최소 요구량 충족 및 Ca:P 균형(1.0~2.0:1) 감시',
      guards: {}
    },
    ckd: {
      id: 'ckd',
      label: '만성 신부전 / 신장 케어 (CKD - 인·나트륨 제한)',
      desc: '인(P) ≤ 650mg/100g DM, 나트륨(Na) ≤ 380mg/100g DM, 단백질 과잉 억제',
      guards: {
        phosphorus_mg: { minAllowed: 250, maxAllowed: 650 },
        sodium_mg: { minAllowed: 60, maxAllowed: 380 },
        protein_pct: { minAllowed: 14.0, maxAllowed: 28.0 }
      }
    },
    pancreatitis: {
      id: 'pancreatitis',
      label: '췌장염 / 고지혈증 케어 (저지방 집중 관리)',
      desc: '조지방(Fat) ≤ 12.0% DM (엄격 저지방) 및 수용성 식이섬유 보강',
      guards: {
        fat_pct: { minAllowed: 4.5, maxAllowed: 12.0 },
        tdf_pct: { minAllowed: 4.0, maxAllowed: 18.0 }
      }
    },
    heart: {
      id: 'heart',
      label: '심장 질환 / 울혈성 심부전 (엄격 나트륨 제한 & 타우린 강화)',
      desc: '나트륨(Na) ≤ 280mg/100g DM, 타우린 ≥ 0.18% DM 유지',
      guards: {
        sodium_mg: { minAllowed: 50, maxAllowed: 280 },
        taurine_g: { minAllowed: 0.18, maxAllowed: 1.20 }
      }
    },
    urolithiasis: {
      id: 'urolithiasis',
      label: '하부요로계 / 결석 케어 (Ca·P·Mg 정밀 제어)',
      desc: '마그네슘(Mg) ≤ 110mg/100g DM, 인(P) ≤ 850mg, 칼슘(Ca) ≤ 1100mg',
      guards: {
        magnesium_mg: { minAllowed: 35, maxAllowed: 110 },
        phosphorus_mg: { minAllowed: 350, maxAllowed: 850 },
        calcium_mg: { minAllowed: 450, maxAllowed: 1100 }
      }
    },
    ibd: {
      id: 'ibd',
      label: '만성 장염 / IBD / 식이알러지 (소화율 & 수용성 섬유 최적화)',
      desc: '조지방 ≤ 16.0% DM, 총식이섬유(TDF) 5.0~15.0% DM',
      guards: {
        fat_pct: { minAllowed: 5.0, maxAllowed: 16.0 },
        tdf_pct: { minAllowed: 5.0, maxAllowed: 15.0 }
      }
    },
    obesity: {
      id: 'obesity',
      label: '비만 / 체중 감량 (고단백·저지방·고식이섬유 포만감)',
      desc: '조단백 ≥ 28.0% DM, 조지방 ≤ 13.0% DM, 총식이섬유(TDF) ≥ 8.0% DM',
      guards: {
        protein_pct: { minAllowed: 28.0, maxAllowed: 56.0 },
        fat_pct: { minAllowed: 5.0, maxAllowed: 13.0 },
        tdf_pct: { minAllowed: 8.0, maxAllowed: 26.0 }
      }
    },
    liver: {
      id: 'liver',
      label: '간담도계 케어 (적정 단백 & 나트륨 제어)',
      desc: '조단백 16.0~28.0% DM, 나트륨 ≤ 350mg/100g DM',
      guards: {
        protein_pct: { minAllowed: 16.0, maxAllowed: 28.0 },
        sodium_mg: { minAllowed: 60, maxAllowed: 350 }
      }
    }
  };

  // 2종/3종 슬롯에서 바로 불러올 수 있는 대표 사료 프리셋 (일반사료 역추적용 + 처방사료 + 습식/화식)
  const MULTI_FEED_PRESETS = [
    {
      id: 'comm_rc_mini_adult',
      name: '[일반건사료 역추적] 로얄캐닌 미니 어덜트',
      brand: 'Royal Canin',
      feedType: 'commercial_dry',
      mode: 'reverse',
      targets: { protein: 27.0, fat: 16.0, fiber: 3.0, ash: 6.8, moisture: 10.0, calcium: 1.05, phosphorus: 0.85 },
      ingredientIds: ['ind_poultry_meal', 'ind_corn', 'ind_corn_gluten_meal', 'ind_poultry_fat', 'ind_wheat', 'ind_hydrolyzed_poultry', 'ind_beet_pulp', 'ind_fish_oil', 'ind_fructooligosaccharide', 'ind_salt', 'ind_taurine', 'ind_vitamin_premix', 'ind_mineral_premix']
    },
    {
      id: 'comm_orijen_original',
      name: '[일반건사료 역추적] 오리젠 오리지널 독 (고단백 생육+육분)',
      brand: 'Orijen',
      feedType: 'commercial_dry',
      mode: 'reverse',
      targets: { protein: 38.0, fat: 18.0, fiber: 4.0, ash: 8.5, moisture: 10.0, calcium: 1.35, phosphorus: 1.10 },
      ingredientIds: ['ind_fresh_chicken', 'ind_fresh_turkey', 'ind_chicken_meal', 'ind_turkey_meal', 'ind_fish_meal_menhaden', 'ind_lentils', 'ind_peas_dry', 'ind_poultry_fat', 'ind_fish_oil', 'ind_pumpkin_dry', 'ind_inulin_chicory', 'ind_salt', 'ind_taurine', 'ind_chelated_minerals']
    },
    {
      id: 'comm_farmina_salmon',
      name: '[일반건사료 역추적] 파미나 N&D 오션 연어 & 완두 (그레인프리)',
      brand: 'Farmina',
      feedType: 'commercial_dry',
      mode: 'reverse',
      targets: { protein: 30.0, fat: 18.0, fiber: 2.9, ash: 7.5, moisture: 9.0, calcium: 1.15, phosphorus: 0.90 },
      ingredientIds: ['ind_fresh_salmon', 'ind_salmon_meal', 'ind_pea_starch', 'ind_peas_dry', 'ind_fish_oil', 'ind_hydrolyzed_salmon', 'ind_beet_pulp', 'ind_psyllium_husk', 'ind_inulin_chicory', 'ind_fructooligosaccharide', 'ind_salt', 'ind_taurine', 'ind_chelated_minerals']
    },
    {
      id: 'comm_now_fresh_small',
      name: '[일반건사료 역추적] 나우 프레쉬 스몰브리드 (생칠면조+감자)',
      brand: 'Now Fresh',
      feedType: 'commercial_dry',
      mode: 'reverse',
      targets: { protein: 26.0, fat: 16.0, fiber: 4.0, ash: 7.2, moisture: 10.0, calcium: 1.05, phosphorus: 0.82 },
      ingredientIds: ['ind_fresh_turkey', 'ind_whole_egg_powder', 'ind_peas_dry', 'ind_potato_protein', 'ind_tapioca_starch', 'ind_flaxseed', 'ind_canola_oil', 'ind_fresh_salmon', 'ind_fresh_duck', 'ind_pumpkin_dry', 'ind_inulin_chicory', 'ind_salt', 'ind_taurine', 'ind_mineral_premix']
    },
    {
      id: 'rx_hills_kd_dry',
      name: '[처방식 건사료] 힐스 k/d 신장케어 (정밀 공개 DB · 신뢰도 93%)',
      brand: "Hill's Prescription Diet",
      feedType: 'prescription_dry',
      mode: 'reverse',
      isPrescription: true,
      fixedConfidence: 93,
      targets: { protein: 14.8, fat: 19.5, fiber: 2.5, ash: 4.5, moisture: 9.0, calcium: 0.68, phosphorus: 0.32 },
      ingredientIds: ['ind_brewers_rice', 'ind_poultry_fat', 'ind_whole_egg_powder', 'ind_corn_gluten_meal', 'ind_hydrolyzed_poultry', 'ind_beet_pulp', 'ind_fish_oil', 'ind_calcium_carbonate', 'ind_potassium_citrate', 'ind_l_carnitine', 'ind_taurine', 'ind_chelated_minerals']
    },
    {
      id: 'rx_rc_gi_lowfat',
      name: '[처방식 건사료] 로얄캐닌 GI 로우팻 저지방 (정밀 공개 DB · 신뢰도 93%)',
      brand: 'Royal Canin Veterinary',
      feedType: 'prescription_dry',
      mode: 'reverse',
      isPrescription: true,
      fixedConfidence: 93,
      targets: { protein: 22.0, fat: 7.0, fiber: 2.2, ash: 6.4, moisture: 9.5, calcium: 0.95, phosphorus: 0.72 },
      ingredientIds: ['ind_brewers_rice', 'ind_poultry_meal', 'ind_wheat', 'ind_barley', 'ind_hydrolyzed_poultry', 'ind_beet_pulp', 'ind_poultry_fat', 'ind_fish_oil', 'ind_psyllium_husk', 'ind_fructooligosaccharide', 'ind_salt', 'ind_taurine', 'ind_mineral_premix']
    },
    {
      id: 'rx_rc_hypoallergenic',
      name: '[처방식 건사료] 로얄캐닌 하이포알러제닉 (가수분해 단백 · 신뢰도 92%)',
      brand: 'Royal Canin Veterinary',
      feedType: 'prescription_dry',
      mode: 'reverse',
      isPrescription: true,
      fixedConfidence: 92,
      targets: { protein: 21.0, fat: 19.0, fiber: 1.8, ash: 6.5, moisture: 9.5, calcium: 0.92, phosphorus: 0.72 },
      ingredientIds: ['ind_brewers_rice', 'ind_hydrolyzed_soy', 'ind_poultry_fat', 'ind_hydrolyzed_poultry', 'ind_beet_pulp', 'ind_fish_oil', 'ind_soybean_oil', 'ind_fructooligosaccharide', 'ind_calcium_carbonate', 'ind_salt', 'ind_taurine', 'ind_chelated_minerals']
    },
    {
      id: 'wet_lowfat_chicken_can',
      name: '[습식캔/화식] 닭가슴살 & 단호박 저지방 수분 화식 (신뢰도 92%)',
      brand: 'Custom Fresh / Wet',
      feedType: 'fresh_wet',
      mode: 'known',
      fixedConfidence: 92,
      knownNutrients: {
        moisture_pct: 76.0,
        energy_kcal_per_100g: 108.0,
        protein_dm_pct: 48.0,
        fat_dm_pct: 9.5,
        fiber_dm_pct: 3.8,
        tdf_dm_pct: 9.2,
        soluble_fiber_g: 4.1,
        insoluble_fiber_g: 5.1,
        carbs_dm_pct: 32.5,
        ash_dm_pct: 6.2,
        calcium_mg: 860,
        phosphorus_mg: 640,
        sodium_mg: 210,
        magnesium_mg: 88,
        potassium_mg: 890,
        methionine_cystine_g: 1.72,
        lysine_g: 3.65,
        taurine_g: 0.28,
        arginine_g: 3.05,
        epa_dha_g: 0.35
      }
    },
    {
      id: 'wet_renal_care_pouch',
      name: '[처방 습식파우치] 신장케어 저인 습식 파우치 (신뢰도 94%)',
      brand: 'Veterinary Wet Pouch',
      feedType: 'prescription_wet',
      mode: 'known',
      fixedConfidence: 94,
      knownNutrients: {
        moisture_pct: 78.0,
        energy_kcal_per_100g: 118.0,
        protein_dm_pct: 19.5,
        fat_dm_pct: 26.0,
        fiber_dm_pct: 3.2,
        tdf_dm_pct: 7.4,
        soluble_fiber_g: 3.2,
        insoluble_fiber_g: 4.2,
        carbs_dm_pct: 46.5,
        ash_dm_pct: 4.8,
        calcium_mg: 640,
        phosphorus_mg: 310,
        sodium_mg: 180,
        magnesium_mg: 65,
        potassium_mg: 920,
        methionine_cystine_g: 0.78,
        lysine_g: 1.25,
        taurine_g: 0.32,
        arginine_g: 1.18,
        epa_dha_g: 0.85
      }
    },
    {
      id: 'fresh_salmon_joint_recipe',
      name: '[자연식 화식] 연어 & 오메가3 피부·관절 화식 (신뢰도 92%)',
      brand: 'Home-Cooked Clinical Recipe',
      feedType: 'fresh_wet',
      mode: 'known',
      fixedConfidence: 92,
      knownNutrients: {
        moisture_pct: 73.0,
        energy_kcal_per_100g: 138.0,
        protein_dm_pct: 44.0,
        fat_dm_pct: 21.0,
        fiber_dm_pct: 3.2,
        tdf_dm_pct: 7.8,
        soluble_fiber_g: 3.4,
        insoluble_fiber_g: 4.4,
        carbs_dm_pct: 25.0,
        ash_dm_pct: 6.8,
        calcium_mg: 880,
        phosphorus_mg: 690,
        sodium_mg: 240,
        magnesium_mg: 95,
        potassium_mg: 860,
        methionine_cystine_g: 1.68,
        lysine_g: 3.48,
        taurine_g: 0.34,
        arginine_g: 2.75,
        epa_dha_g: 1.45
      }
    }
  ];

  const _slotVectorCache = new Map();

  /**
   * 개별 사료 슬롯(사료 A / 사료 B / 사료 C)을 1~4단계 역추적 엔진 또는 정밀 DB로 해석하여
   * 건물(DM 100g) 및 1,000 kcal ME 기준 표준 영양 벡터(\hat{V}_k)를 반환
   */
  function resolveFeedSlotVector(slotConfig, allIngredientsDB, species = 'dog') {
    const slot = slotConfig || {};
    const name = slot.name || '사료';
    const feedType = slot.feedType || 'commercial_dry';
    const cacheKey = JSON.stringify({
      slotId: slot.slotId || 'A',
      name,
      feedType,
      mode: slot.mode,
      isPrescription: slot.isPrescription,
      fixedConfidence: slot.fixedConfidence,
      targets: slot.targets,
      ingredientIds: slot.ingredientIds,
      knownNutrients: slot.knownNutrients,
      species
    });
    if (_slotVectorCache.has(cacheKey)) {
      return _slotVectorCache.get(cacheKey);
    }

    // 1) 정밀 성분이 알려진 습식/화식/처방식 슬롯 (mode === 'known')
    if (slot.mode === 'known' && slot.knownNutrients) {
      const kn = slot.knownNutrients;
      const moisture = Number(kn.moisture_pct) || 75.0;
      const dmFrac = Math.max(0.08, (100 - moisture) / 100);
      const kcal100gAF = Number(kn.energy_kcal_per_100g) || 120.0;
      const energyAF = kcal100gAF * 10; // kcal/kg AF
      const energyDM = energyAF / dmFrac; // kcal/kg DM
      const energyDM100g = energyDM / 10; // kcal/100g DM

      const proteinDM = Number(kn.protein_dm_pct) || 40.0;
      const fatDM = Number(kn.fat_dm_pct) || 16.0;
      const fiberDM = Number(kn.fiber_dm_pct) || 3.5;
      const tdfDM = Number(kn.tdf_dm_pct) || +(fiberDM * 2.2).toFixed(2);
      const solubleDM = Number(kn.soluble_fiber_g) || +(tdfDM * 0.42).toFixed(2);
      const insolubleDM = Number(kn.insoluble_fiber_g) || +(Math.max(0, tdfDM - solubleDM)).toFixed(2);
      const carbsDM = Number(kn.carbs_dm_pct) || Math.max(0, 100 - proteinDM - fatDM - fiberDM - (Number(kn.ash_dm_pct) || 6.5));
      const ashDM = Number(kn.ash_dm_pct) || 6.5;

      const caDM = Number(kn.calcium_mg) || 850;
      const pDM = Number(kn.phosphorus_mg) || 650;
      const naDM = Number(kn.sodium_mg) || 230;
      const mgDM = Number(kn.magnesium_mg) || 90;
      const kDM = Number(kn.potassium_mg) || 850;
      const protRatio = proteinDM / 100.0;

      const metCysDM = Number(kn.methionine_cystine_g) || +(protRatio * 3.5).toFixed(3);
      const lysineDM = Number(kn.lysine_g) || +(protRatio * 7.5).toFixed(3);
      const taurineDM = Number(kn.taurine_g) || +(protRatio * 0.55).toFixed(3);
      const arginineDM = Number(kn.arginine_g) || +(protRatio * 6.2).toFixed(3);
      const epaDhaDM = Number(kn.epa_dha_g) || 0.45;

      const confidenceScore = Number(slot.fixedConfidence) || 92;

      return {
        slotId: slot.slotId || 'A',
        name,
        feedType,
        mode: 'known',
        moisture_pct: moisture,
        dmFraction: dmFrac,
        energyAF: Math.round(energyAF),
        energyDM: Math.round(energyDM),
        energyKcalPerG_AF: Math.max(0.2, energyAF / 1000.0),
        energyKcalPer100gDM: Math.max(250, energyDM100g),
        protein_pct: proteinDM,
        fat_pct: fatDM,
        fiber_pct: fiberDM,
        tdf_pct: tdfDM,
        soluble_fiber_pct: solubleDM,
        insoluble_fiber_pct: insolubleDM,
        carbs_pct: carbsDM,
        ash_pct: ashDM,
        calcium_mg: caDM,
        phosphorus_mg: pDM,
        ca_p_ratio: pDM > 0 ? +(caDM / pDM).toFixed(2) : 1.31,
        sodium_mg: naDM,
        magnesium_mg: mgDM,
        potassium_mg: kDM,
        methionine_cystine_g: metCysDM,
        lysine_g: lysineDM,
        taurine_g: taurineDM,
        arginine_g: arginineDM,
        epa_dha_g: epaDhaDM,
        animal_protein_share_pct: 88.0,
        plant_protein_share_pct: 12.0,
        confidenceScore,
        reverseResult: null
      };
    }

    // 2) 1~4단계 역추적 모드 (일반 건사료 / 처방 건사료)
    const t = slot.targets || { protein: 27.0, fat: 16.0, fiber: 3.5, ash: 7.0, moisture: 10.0, calcium: 1.0, phosphorus: 0.8 };
    const ingIds = Array.isArray(slot.ingredientIds) && slot.ingredientIds.length > 0
      ? slot.ingredientIds
      : ['ind_poultry_meal', 'ind_brewers_rice', 'ind_poultry_fat', 'ind_beet_pulp', 'ind_fish_oil', 'ind_salt', 'ind_taurine', 'ind_mineral_premix'];

    const selectedIngredients = ingIds.map(id => {
      const dbEntry = (allIngredientsDB && allIngredientsDB[id]) ? allIngredientsDB[id] : null;
      return {
        id,
        name: dbEntry ? (dbEntry.name_ko || id) : id
      };
    });

    const constraints = [
      { key: 'protein_g', target: Number(t.protein) || 26.0, type: 'min', weight: 15.0 },
      { key: 'fat_g', target: Number(t.fat) || 15.0, type: 'min', weight: 15.0 },
      { key: 'total_dietary_fiber_g', target: Number(t.fiber) || 3.5, type: 'max', weight: 8.0 },
      { key: 'ash_g', target: Number(t.ash) || 7.0, type: 'max', weight: 8.0 },
      { key: 'calcium_mg', target: (Number(t.calcium) || 1.0) * 1000, type: 'min', weight: 12.0 },
      { key: 'phosphorus_mg', target: (Number(t.phosphorus) || 0.8) * 1000, type: 'min', weight: 12.0 }
    ];

    let rev = null;
    if (typeof ReverseEngine !== 'undefined' && allIngredientsDB && Object.keys(allIngredientsDB).length > 0) {
      rev = ReverseEngine.optimize(selectedIngredients, constraints, allIngredientsDB, {
        numStarts: 10,
        iterations: 2800,
        enableImputation: true,
        targetMoisture: Number(t.moisture) || 10.0,
        species
      });
    }

    const b = rev ? rev.blend : {};
    const moisture = Number(t.moisture) || Number(b.moisture_g) || 10.0;
    const dmFrac = Math.max(0.1, (100 - moisture) / 100);
    const energyAF = Number(b.energyAF) || 3720;
    const energyDM = Number(b.energyDM) || (energyAF / dmFrac);
    const energyDM100g = energyDM / 10.0;

    const proteinDM = Number(b.protein_g) || (Number(t.protein) / dmFrac);
    const fatDM = Number(b.fat_g) || (Number(t.fat) / dmFrac);
    const fiberDM = Number(b.crude_fiber_g || b.total_dietary_fiber_g) || (Number(t.fiber) / dmFrac);
    const tdfDM = Number(b.tdf_g) || +(fiberDM * 2.25).toFixed(2);
    const solubleDM = Number(b.soluble_fiber_g) || +(tdfDM * 0.32).toFixed(2);
    const insolubleDM = Number(b.insoluble_fiber_g) || +(Math.max(0, tdfDM - solubleDM)).toFixed(2);
    const carbsDM = Number(b.carbohydrate_g || b.nfe_g) || Math.max(5, 100 - proteinDM - fatDM - fiberDM - (Number(b.ash_g) || 7.2));
    const ashDM = Number(b.ash_g) || (Number(t.ash) / dmFrac);

    const caDM = Number(b.calcium_mg) || ((Number(t.calcium) || 1.0) * 1000 / dmFrac);
    const pDM = Number(b.phosphorus_mg) || ((Number(t.phosphorus) || 0.8) * 1000 / dmFrac);
    const naDM = Number(b.sodium_mg) || 340;
    const mgDM = Number(b.magnesium_mg) || 102;
    const kDM = Number(b.potassium_mg) || 720;

    const protRatio = proteinDM / 100.0;
    const metCysDM = Number(b.methionine_cystine_g) || +(protRatio * 3.15).toFixed(3);
    const lysineDM = Number(b.lysine_g) || +(protRatio * 5.45).toFixed(3);
    const taurineDM = Number(b.taurine_g) || +(protRatio * 0.45).toFixed(3);
    const arginineDM = Number(b.arginine_g) || +(protRatio * 6.0).toFixed(3);
    const epaDhaDM = Number(b.epa_dha_g) || 0.28;

    const confidenceScore = Number(slot.fixedConfidence) || (slot.isPrescription ? 92 : (rev?.overallConfidencePct || 75));

    const outVec = {
      slotId: slot.slotId || 'A',
      name,
      feedType,
      mode: 'reverse',
      moisture_pct: moisture,
      dmFraction: dmFrac,
      energyAF: Math.round(energyAF),
      energyDM: Math.round(energyDM),
      energyKcalPerG_AF: Math.max(0.3, energyAF / 1000.0),
      energyKcalPer100gDM: Math.max(280, energyDM100g),
      protein_pct: +proteinDM.toFixed(2),
      fat_pct: +fatDM.toFixed(2),
      fiber_pct: +fiberDM.toFixed(2),
      tdf_pct: +tdfDM.toFixed(2),
      soluble_fiber_pct: +solubleDM.toFixed(2),
      insoluble_fiber_pct: +insolubleDM.toFixed(2),
      carbs_pct: +carbsDM.toFixed(2),
      ash_pct: +ashDM.toFixed(2),
      calcium_mg: Math.round(caDM),
      phosphorus_mg: Math.round(pDM),
      ca_p_ratio: pDM > 0 ? +(caDM / pDM).toFixed(2) : 1.28,
      sodium_mg: Math.round(naDM),
      magnesium_mg: Math.round(mgDM),
      potassium_mg: Math.round(kDM),
      methionine_cystine_g: +metCysDM.toFixed(3),
      lysine_g: +lysineDM.toFixed(3),
      taurine_g: +taurineDM.toFixed(3),
      arginine_g: +arginineDM.toFixed(3),
      epa_dha_g: +epaDhaDM.toFixed(2),
      animal_protein_share_pct: b.animal_protein_share_pct !== undefined ? b.animal_protein_share_pct : 72.0,
      plant_protein_share_pct: b.plant_protein_share_pct !== undefined ? b.plant_protein_share_pct : 28.0,
      confidenceScore,
      reverseResult: rev
    };
    _slotVectorCache.set(cacheKey, outVec);
    return outVec;
  }

  /**
   * K개 사료(2종 또는 3종)의 DM 비중 벡터 alphaDMList = [\alpha_1, \alpha_2, (\alpha_3)] 에 대해
   * 선형 결합 \hat{V}_{mix} = \sum_{k=1}^K \alpha_k \hat{V}_k 와
   * 신뢰도 가중치 기반 안전 마진 밴드(\Delta_j = \sum_{k=1}^K \alpha_k \delta_{k,j}) 검증 수행
   */
  function evaluateMultiFeedLinearCombination(feedVectors, alphaDMList, clinicalGuards = {}) {
    const kCount = feedVectors.length;
    const sumAlpha = alphaDMList.reduce((acc, v) => acc + Math.max(0, v), 0) || 1;
    const weights = alphaDMList.map(v => Math.max(0, v) / sumAlpha);

    const uncFactors = feedVectors.map(vec => 1.0 + Math.max(0, (92 - (vec.confidenceScore || 75)) / 55));
    const combinedConfidence = Math.round(
      weights.reduce((acc, w, idx) => acc + w * (feedVectors[idx].confidenceScore || 75), 0)
    );

    const keysToBlend = [
      'protein_pct', 'fat_pct', 'fiber_pct', 'tdf_pct', 'soluble_fiber_pct', 'insoluble_fiber_pct',
      'carbs_pct', 'ash_pct', 'calcium_mg', 'phosphorus_mg', 'sodium_mg', 'magnesium_mg',
      'potassium_mg', 'methionine_cystine_g', 'lysine_g', 'taurine_g', 'arginine_g', 'epa_dha_g',
      'animal_protein_share_pct', 'plant_protein_share_pct', 'energyKcalPer100gDM'
    ];

    const mix = {};
    keysToBlend.forEach(k => {
      mix[k] = weights.reduce((acc, w, idx) => acc + w * (Number(feedVectors[idx][k]) || 0), 0);
    });
    mix.ca_p_ratio = mix.phosphorus_mg > 0 ? (mix.calcium_mg / mix.phosphorus_mg) : 1.25;

    // 1,000 kcal ME 기준 영양 밀도 산출 (수의 임상 영양학 CDSS 연동 규격)
    const kcalPer100gDM = Math.max(280, mix.energyKcalPer100gDM || 385);
    const factor1000kcal = 1000.0 / kcalPer100gDM;
    const mixPer1000kcal = {
      protein_g: +(mix.protein_pct * factor1000kcal).toFixed(1),
      fat_g: +(mix.fat_pct * factor1000kcal).toFixed(1),
      carb_g: +(mix.carbs_pct * factor1000kcal).toFixed(1),
      fiber_g: +(mix.fiber_pct * factor1000kcal).toFixed(1),
      tdf_g: +(mix.tdf_pct * factor1000kcal).toFixed(1),
      calcium_g: +((mix.calcium_mg / 1000.0) * factor1000kcal).toFixed(2),
      phosphorus_g: +((mix.phosphorus_mg / 1000.0) * factor1000kcal).toFixed(2),
      sodium_g: +((mix.sodium_mg / 1000.0) * factor1000kcal).toFixed(2),
      potassium_g: +((mix.potassium_mg / 1000.0) * factor1000kcal).toFixed(2),
      magnesium_g: +((mix.magnesium_mg / 1000.0) * factor1000kcal).toFixed(2),
      epa_dha_g: +(mix.epa_dha_g * factor1000kcal).toFixed(2),
      ca_p_ratio: +mix.ca_p_ratio.toFixed(2)
    };

    const bandAudits = [];
    let allSafeWithinBand = true;
    let pointEstimateSafe = true;
    let violationPenalty = 0;

    CRITICAL_NUTRIENT_BANDS.forEach(spec => {
      const val = mix[spec.key];
      let margin = 0;
      for (let i = 0; i < kCount; i++) {
        const vec = feedVectors[i];
        const v_i = spec.key === 'ca_p_ratio'
          ? (vec.calcium_mg / Math.max(1, vec.phosphorus_mg))
          : (Number(vec[spec.key]) || 0);
        const delta_i = v_i * spec.baseTol * uncFactors[i];
        margin += weights[i] * delta_i;
      }

      const bandMin = Math.max(0, val - margin);
      const bandMax = val + margin;

      let minAllowed = spec.minAllowed;
      let maxAllowed = spec.maxAllowed;
      if (clinicalGuards[spec.key]?.maxAllowed !== undefined) maxAllowed = clinicalGuards[spec.key].maxAllowed;
      if (clinicalGuards[spec.key]?.minAllowed !== undefined) minAllowed = clinicalGuards[spec.key].minAllowed;

      let status = 'safe';
      if (val < minAllowed) {
        status = 'out_of_bounds';
        pointEstimateSafe = false;
        allSafeWithinBand = false;
        violationPenalty += ((minAllowed - val) / Math.max(0.1, minAllowed)) * 60;
      } else if (val > maxAllowed) {
        status = 'out_of_bounds';
        pointEstimateSafe = false;
        allSafeWithinBand = false;
        violationPenalty += ((val - maxAllowed) / Math.max(0.1, maxAllowed)) * 60;
      } else if (bandMin < minAllowed * 0.94 || bandMax > maxAllowed * 1.06) {
        status = 'caution_margin';
        allSafeWithinBand = false;
        violationPenalty += 6;
      }

      const perFeedVals = feedVectors.map(vec => {
        const raw = spec.key === 'ca_p_ratio'
          ? (vec.calcium_mg / Math.max(1, vec.phosphorus_mg))
          : (Number(vec[spec.key]) || 0);
        return +(raw > 50 ? raw.toFixed(0) : raw.toFixed(2));
      });

      bandAudits.push({
        key: spec.key,
        label: spec.label,
        unit: spec.unit,
        perFeedValues: perFeedVals,
        pointEstimate: +(val > 50 ? val.toFixed(0) : val.toFixed(2)),
        bandMin: +(bandMin > 50 ? bandMin.toFixed(0) : bandMin.toFixed(2)),
        bandMax: +(bandMax > 50 ? bandMax.toFixed(0) : bandMax.toFixed(2)),
        minAllowed,
        maxAllowed,
        status
      });
    });

    return {
      alphaDMWeights: weights.map(w => +w.toFixed(4)),
      combinedConfidence,
      mixVectorDM: mix,
      mixPer1000kcal,
      bandAudits,
      allSafeWithinBand,
      pointEstimateSafe,
      violationPenalty
    };
  }

  /**
   * 2종 또는 3종 사료 믹스피딩 시, 선택된 질환/건강 목표(healthConcern)와 신뢰도 안전 마진 밴드를
   * 가장 잘 만족하는 최적 칼로리 배합비 (\alpha^*, \beta^*, [\gamma^*])를 Simplex 격자 탐색으로 추천
   */
  function findOptimalMultiFeedRatio(feedVectors, dailyDER = 350, healthConcern = 'none', stepPct = 5) {
    const kCount = feedVectors.length;
    const preset = CLINICAL_GUARD_PRESETS[healthConcern] || CLINICAL_GUARD_PRESETS.none;
    const clinicalGuards = preset.guards || {};

    let bestCaloriePcts = kCount === 3 ? [60, 25, 15] : [80, 20];
    let bestScore = -Infinity;
    let safeCombinationCount = 0;
    let totalCombinationCount = 0;

    function scoreCandidate(calPcts) {
      totalCombinationCount++;
      const dmGrams = calPcts.map((pct, i) => {
        const kcal = dailyDER * (pct / 100.0);
        const gramsAF = kcal / Math.max(0.2, feedVectors[i].energyKcalPerG_AF);
        return gramsAF * feedVectors[i].dmFraction;
      });
      const totalDM = Math.max(0.1, dmGrams.reduce((a, b) => a + b, 0));
      const alphaDMList = dmGrams.map(d => d / totalDM);

      const evalRes = evaluateMultiFeedLinearCombination(feedVectors, alphaDMList, clinicalGuards);
      if (evalRes.pointEstimateSafe) safeCombinationCount++;

      // 혼합 다양성 보너스 (2종/3종을 실제로 섞는 의미가 있도록 각 활성 슬롯이 최소 10% 이상일 때 소폭 가산)
      const minPct = Math.min(...calPcts);
      const diversityBonus = minPct >= 10 ? 12 : (minPct >= 5 ? 5 : -10);

      // Ca:P 이상적 비율(1.25~1.35) 근접 보너스
      const capErr = Math.abs(evalRes.mixVectorDM.ca_p_ratio - 1.28);

      // 질환별 특화 목적함수 가산점
      let clinicalTargetBonus = 0;
      if (healthConcern === 'ckd') {
        clinicalTargetBonus += Math.max(0, (700 - evalRes.mixVectorDM.phosphorus_mg) * 0.04);
      } else if (healthConcern === 'pancreatitis') {
        clinicalTargetBonus += Math.max(0, (14.0 - evalRes.mixVectorDM.fat_pct) * 2.5);
      } else if (healthConcern === 'heart') {
        clinicalTargetBonus += Math.max(0, (320 - evalRes.mixVectorDM.sodium_mg) * 0.06);
      } else if (healthConcern === 'obesity') {
        clinicalTargetBonus += (evalRes.mixVectorDM.protein_pct * 0.5) + (evalRes.mixVectorDM.tdf_pct * 0.8) - (evalRes.mixVectorDM.fat_pct * 1.2);
      }

      const safetyScore = evalRes.allSafeWithinBand ? 35 : (evalRes.pointEstimateSafe ? 12 : -evalRes.violationPenalty);
      const totalScore = safetyScore + diversityBonus + clinicalTargetBonus - (capErr * 18) + (evalRes.combinedConfidence * 0.25);

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestCaloriePcts = calPcts.slice();
      }
    }

    if (kCount === 2) {
      for (let pA = 10; pA <= 90; pA += stepPct) {
        scoreCandidate([pA, 100 - pA]);
      }
    } else if (kCount === 3) {
      for (let pA = 10; pA <= 80; pA += stepPct) {
        for (let pB = 10; pB <= 90 - pA; pB += stepPct) {
          const pC = 100 - pA - pB;
          if (pC >= 5) {
            scoreCandidate([pA, pB, pC]);
          }
        }
      }
    }

    const safeCoveragePct = totalCombinationCount > 0
      ? Math.round((safeCombinationCount / totalCombinationCount) * 100)
      : 100;

    return {
      recommendedCaloriePcts: bestCaloriePcts,
      safeCoveragePct,
      healthConcernLabel: preset.label,
      summary: `[${preset.label}] 기준 Simplex 최적화 결과, 칼로리 배합비 ${bestCaloriePcts.join(' : ')}%에서 모든 필수 영양소와 질환 관리 가드라인이 최적 균형을 이룹니다. (안전 배합 공간 비율: ${safeCoveragePct}%)`
    };
  }

  /**
   * [핵심] 2종 또는 3종 사료 믹스피딩 통합 계산 함수
   * - 입력된 2~3개 사료 슬롯을 역추적/정규화하고, 지정된 칼로리 비율(caloriePcts)로 선형 결합
   * - 처방사료 데이터(guardian_portal.js)의 STEP 6 교체용 표준 객체(guardianStep6Payload) 동시 생성
   */
  function calculateMultiFeedMix(feedSlots, caloriePcts, dailyDER = 350, mealsPerDay = 2, options = {}) {
    const activeSlots = (feedSlots || []).slice(0, 3);
    const kCount = activeSlots.length;
    const der = Math.max(20, Number(dailyDER) || 350);
    const meals = Math.max(1, Number(mealsPerDay) || 2);
    const species = options.species || 'dog';
    const weightKg = Number(options.weightKg) || 4.5;
    const healthConcern = options.healthConcern || 'none';
    const allIngredientsDB = options.allIngredientsDB || {};

    // 칼로리 비율 정규화 (합계 100%)
    let rawPcts = (caloriePcts || []).slice(0, kCount).map(v => Math.max(0, Number(v) || 0));
    const sumPct = rawPcts.reduce((a, b) => a + b, 0);
    if (sumPct <= 0) {
      rawPcts = kCount === 3 ? [60, 25, 15] : [80, 20];
    } else {
      rawPcts = rawPcts.map(v => (v / sumPct) * 100);
      // 정수 보정
      const rounded = rawPcts.map(v => Math.round(v));
      const diff = 100 - rounded.reduce((a, b) => a + b, 0);
      rounded[0] = Math.max(0, rounded[0] + diff);
      rawPcts = rounded;
    }

    // 각 슬롯의 영양 벡터(\hat{V}_A, \hat{V}_B, [\hat{V}_C]) 산출
    const feedVectors = activeSlots.map((slot, idx) => {
      const slotLabels = ['A', 'B', 'C'];
      return resolveFeedSlotVector(Object.assign({}, slot, { slotId: slotLabels[idx] }), allIngredientsDB, species);
    });

    // 슬롯별 일일 칼로리, 일일 급여 무게(g/일), 1회 급여 무게(g/끼), 건물 무게(g DM/일), 수분 공급량(ml/일) 계산
    const slotSchedules = feedVectors.map((vec, idx) => {
      const calPct = rawPcts[idx];
      const dailyKcal = der * (calPct / 100.0);
      const dailyGramsAF = dailyKcal / Math.max(0.2, vec.energyKcalPerG_AF);
      const mealGramsAF = dailyGramsAF / meals;
      const dailyGramsDM = dailyGramsAF * vec.dmFraction;
      const waterMlFromFood = dailyGramsAF * (vec.moisture_pct / 100.0);

      return {
        slotId: vec.slotId,
        name: vec.name,
        feedType: vec.feedType,
        caloriePct: calPct,
        dailyKcal: Math.round(dailyKcal),
        dailyGramsAF: +(dailyGramsAF.toFixed(1)),
        mealGramsAF: +(mealGramsAF.toFixed(1)),
        dailyGramsDM: +(dailyGramsDM.toFixed(1)),
        waterMlFromFood: Math.round(waterMlFromFood),
        energyAF: vec.energyAF,
        moisture_pct: vec.moisture_pct,
        confidenceScore: vec.confidenceScore,
        archetypeCode: vec.reverseResult?.archetypeAnalysis?.bestArchetype?.code || (vec.mode === 'known' ? 'KNOWN_DB' : 'ARCH_01'),
        archetypeName: vec.reverseResult?.archetypeAnalysis?.bestArchetype?.name || (vec.mode === 'known' ? '정밀 공개 영양 DB' : '표준 사료 아키타입')
      };
    });

    const totalDailyGramsAF = +(slotSchedules.reduce((acc, s) => acc + s.dailyGramsAF, 0).toFixed(1));
    const totalMealGramsAF = +(slotSchedules.reduce((acc, s) => acc + s.mealGramsAF, 0).toFixed(1));
    const totalDailyGramsDM = Math.max(0.1, slotSchedules.reduce((acc, s) => acc + s.dailyGramsDM, 0));
    const totalFoodWaterMl = slotSchedules.reduce((acc, s) => acc + s.waterMlFromFood, 0);

    // 1일 총 음수 목표량 (기본 DER 1kcal당 1ml 기준) 및 추가 급수 권장량
    const dailyWaterTargetMl = Math.round(der * (species === 'cat' ? 0.95 : 1.05));
    const additionalDrinkMl = Math.max(0, dailyWaterTargetMl - totalFoodWaterMl);

    // DM 기준 선형 결합 가중치 \alpha_k^{DM}
    const alphaDMList = slotSchedules.map(s => s.dailyGramsDM / totalDailyGramsDM);

    const guardPreset = CLINICAL_GUARD_PRESETS[healthConcern] || CLINICAL_GUARD_PRESETS.none;
    const linearEval = evaluateMultiFeedLinearCombination(feedVectors, alphaDMList, guardPreset.guards);
    const mixDM = linearEval.mixVectorDM;

    // PFC 칼로리 비율 계산
    const kcalProt = mixDM.protein_pct * 3.5;
    const kcalFat = mixDM.fat_pct * 8.5;
    const kcalCarb = mixDM.carbs_pct * 3.5;
    const totalPfcKcal = Math.max(1, kcalProt + kcalFat + kcalCarb);
    const pfcRatio = {
      proteinPct: +((kcalProt / totalPfcKcal) * 100).toFixed(1),
      fatPct: +((kcalFat / totalPfcKcal) * 100).toFixed(1),
      carbsPct: +((kcalCarb / totalPfcKcal) * 100).toFixed(1)
    };

    // 최적 배합비 추천 탐색
    const optimalRecommendation = findOptimalMultiFeedRatio(feedVectors, der, healthConcern, 5);

    // 처방사료 데이터(guardian_portal.js) 호환 신호등 및 요약 카드 데이터 생성
    const outOfBoundsItems = linearEval.bandAudits.filter(b => b.status === 'out_of_bounds');
    const cautionItems = linearEval.bandAudits.filter(b => b.status === 'caution_margin');
    const overallStatus = outOfBoundsItems.length > 0 ? 'danger' : (cautionItems.length > 0 ? 'warning' : 'optimal');

    // 처방사료데이터 보호자 포털 STEP 6 (`guardianState.lastMixSummary` & `SCHEMA-05` & Vet CDSS) 호환 페이로드
    const guardianStep6Payload = {
      schemaVersion: 'STEP6-MULTI-MIX-2.0',
      activeFeedCount: kCount,
      species,
      weightKg,
      dailyDER: der,
      mealsPerDay: meals,
      healthConcern,
      healthConcernLabel: guardPreset.label,
      calorieRatiosPct: rawPcts,
      dmRatiosPct: alphaDMList.map(w => +(w * 100).toFixed(1)),
      combinedConfidencePct: linearEval.combinedConfidence,
      slotSchedules,
      totalDailyGramsAF,
      totalMealGramsAF,
      waterBalance: {
        dailyTargetMl: dailyWaterTargetMl,
        fromFoodMl: totalFoodWaterMl,
        additionalDrinkMl
      },
      blendedNutrientsDM: {
        protein_pct: +mixDM.protein_pct.toFixed(1),
        fat_pct: +mixDM.fat_pct.toFixed(1),
        carbs_pct: +mixDM.carbs_pct.toFixed(1),
        crude_fiber_pct: +mixDM.fiber_pct.toFixed(1),
        tdf_pct: +mixDM.tdf_pct.toFixed(1),
        soluble_fiber_pct: +mixDM.soluble_fiber_pct.toFixed(2),
        insoluble_fiber_pct: +mixDM.insoluble_fiber_pct.toFixed(2),
        calcium_mg: Math.round(mixDM.calcium_mg),
        phosphorus_mg: Math.round(mixDM.phosphorus_mg),
        ca_p_ratio: +mixDM.ca_p_ratio.toFixed(2),
        sodium_mg: Math.round(mixDM.sodium_mg),
        magnesium_mg: Math.round(mixDM.magnesium_mg),
        potassium_mg: Math.round(mixDM.potassium_mg),
        methionine_cystine_g: +mixDM.methionine_cystine_g.toFixed(2),
        lysine_g: +mixDM.lysine_g.toFixed(2),
        taurine_g: +mixDM.taurine_g.toFixed(2),
        arginine_g: +mixDM.arginine_g.toFixed(2),
        epa_dha_g: +mixDM.epa_dha_g.toFixed(2)
      },
      // 처방사료데이터 수의사 CDSS (1,000 kcal ME 기준) 즉시 주입 포맷
      vetCdssNutrientsPer1000Kcal: Object.assign({}, linearEval.mixPer1000kcal, {
        energy_density_kcal_per_kg: Math.round(
          slotSchedules.reduce((acc, s, i) => acc + (s.caloriePct / 100.0) * feedVectors[i].energyAF, 0)
        )
      })
    };

    return {
      activeFeedCount: kCount,
      der,
      mealsPerDay: meals,
      healthConcern,
      healthConcernLabel: guardPreset.label,
      healthConcernDesc: guardPreset.desc,
      calorieRatiosPct: rawPcts,
      alphaDMWeights: linearEval.alphaDMWeights,
      combinedConfidence: linearEval.combinedConfidence,
      feedVectors,
      slotSchedules,
      totalDailyGramsAF,
      totalMealGramsAF,
      totalDailyGramsDM: +totalDailyGramsDM.toFixed(1),
      waterBalance: guardianStep6Payload.waterBalance,
      finalNutrientsDM: guardianStep6Payload.blendedNutrientsDM,
      finalNutrientsPer1000Kcal: linearEval.mixPer1000kcal,
      pfcRatio,
      nutrientBandAudits: linearEval.bandAudits,
      optimalRecommendation,
      overallStatus,
      guardianStep6Payload
    };
  }

  /**
   * 호스트(guardian_portal.js)의 COMMERCIAL_DRY_FOODS 및 COMMERCIAL_WET_AND_FRESH DB를
   * MULTI_FEED_PRESETS에 중복 없이(id 기준 Deduplication) 병합
   */
  function registerHostPresets(dryList = [], wetFreshList = [], combinedIngDB = null) {
    const existingIds = new Set(MULTI_FEED_PRESETS.map(p => p.id));

    (dryList || []).forEach(d => {
      if (!d || !d.id || existingIds.has(d.id)) return;
      let ingIds = [];
      if (Array.isArray(d.ingredients_order) && typeof FeedIngredientDB !== 'undefined') {
        d.ingredients_order.forEach(rawName => {
          const hit = FeedIngredientDB.matchIndustrialIngredient(rawName, combinedIngDB);
          const key = hit ? (hit.id || hit.ingredient) : null;
          if (key && !ingIds.includes(key)) ingIds.push(key);
        });
      }
      if (ingIds.length < 3) {
        ingIds = ['ind_poultry_meal', 'ind_brewers_rice', 'ind_poultry_fat', 'ind_beet_pulp', 'ind_fish_oil', 'ind_salt', 'ind_taurine', 'ind_mineral_premix'];
      }
      MULTI_FEED_PRESETS.push({
        id: d.id,
        name: `[일반건사료 역추적] ${d.name}`,
        brand: d.brand || 'Commercial',
        feedType: 'commercial_dry',
        mode: 'reverse',
        targets: {
          protein: parseFloat(d.protein_af) || 26.0,
          fat: parseFloat(d.fat_af) || 14.0,
          fiber: parseFloat(d.fiber_af) || 3.0,
          ash: parseFloat(d.ash_af) || 6.5,
          moisture: parseFloat(d.moisture_af) || 10.0,
          calcium: parseFloat(d.ca_af) || 1.0,
          phosphorus: parseFloat(d.p_af) || 0.8
        },
        ingredientIds: ingIds
      });
      existingIds.add(d.id);
    });

    (wetFreshList || []).forEach(w => {
      if (!w || !w.id || existingIds.has(w.id)) return;
      const moist = parseFloat(w.moisture_af) || 75.0;
      const dmf = Math.max(0.08, (100 - moist) / 100.0);
      const pDM = +((parseFloat(w.protein_af) || 10.0) / dmf).toFixed(1);
      const fDM = +((parseFloat(w.fat_af) || 4.0) / dmf).toFixed(1);
      const fbDM = +((parseFloat(w.fiber_af) || 1.0) / dmf).toFixed(1);
      const ashDM = +((parseFloat(w.ash_af) || 1.5) / dmf).toFixed(1);
      const caDM = Math.round(((parseFloat(w.ca_af) || 0.25) * 1000) / dmf);
      const phosDM = Math.round(((parseFloat(w.p_af) || 0.20) * 1000) / dmf);
      const kcal100g = +((parseFloat(w.kcal_per_kg) || 1050) / 10.0).toFixed(1);
      const prefix = w.type === '화식' ? '[자연식 화식]' : '[습식캔/파우치]';

      MULTI_FEED_PRESETS.push({
        id: w.id,
        name: `${prefix} ${w.name} (신뢰도 92%)`,
        brand: w.brand || 'Wet/Fresh',
        feedType: 'fresh_wet',
        mode: 'known',
        fixedConfidence: 92,
        knownNutrients: {
          moisture_pct: moist,
          energy_kcal_per_100g: kcal100g,
          protein_dm_pct: pDM,
          fat_dm_pct: fDM,
          fiber_dm_pct: fbDM,
          tdf_dm_pct: +(fbDM * 2.2).toFixed(1),
          carbs_dm_pct: Math.max(0, +(100 - pDM - fDM - fbDM - ashDM).toFixed(1)),
          ash_dm_pct: ashDM,
          calcium_mg: caDM,
          phosphorus_mg: phosDM,
          sodium_mg: 220,
          magnesium_mg: 88,
          potassium_mg: 850
        }
      });
      existingIds.add(w.id);
    });
  }

  return {
    CRITICAL_NUTRIENT_BANDS,
    CLINICAL_GUARD_PRESETS,
    MULTI_FEED_PRESETS,
    registerHostPresets,
    normalizeFeedAVector,
    normalizeFeedBVector,
    resolveFeedSlotVector,
    evaluateLinearCombinationWithConfidence,
    evaluateMultiFeedLinearCombination,
    findOptimalSafeMixBand,
    findOptimalMultiFeedRatio,
    calculateMixFeeding,
    calculateMultiFeedMix
  };

})();

if (typeof window !== 'undefined') {
  window.MixFeeder = MixFeeder;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MixFeeder;
}

/**
 * ocr_parser.js
 * 사료 포장지 사진/텍스트 OCR 스마트 파서 및 시판 대표 사료 프리셋 (산업용 원재료 DB 매핑 연동)
 */

const OCRParser = (function() {

  const FeedDBRef = (typeof FeedIngredientDB !== 'undefined')
    ? FeedIngredientDB
    : (typeof require !== 'undefined' ? (() => { try { return require('./feed_ingredient_db.js'); } catch (e) { return null; } })() : null);

  // 시판 대표 사료 OCR 인식 프리셋 샘플들 (산업용 원재료 ID 매핑 완료)
  const SAMPLE_PRESETS = [
    {
      name: "로얄캐닌 미니 어덜트 (가금육분+곡물 표준 건사료)",
      brand: "Royal Canin",
      archetypeHint: "ARCH_01_POULTRY_GRAIN_ADULT",
      ocrRawText: `[등록성분량]
조단백질: 27.0% 이상
조지방: 16.0% 이상
조섬유: 2.5% 이하
조회분: 6.8% 이하
칼슘: 0.95% 이상
인: 0.75% 이상
수분: 10.0% 이하

[원재료명]
탈수 가금류 단백질(닭고기분말), 옥수수, 백미, 동물성 지방(정제계유), 밀글루텐, 비트펄프, 가수분해 동물단백, 어유, 대두유, 프락토올리고당, 정제염(소금), 타우린, 킬레이트 미네랄 합제`,
      targets: {
        protein: 27.0,
        fat: 16.0,
        fiber: 2.5,
        ash: 6.8,
        calcium: 0.95,
        phosphorus: 0.75,
        moisture: 10.0
      },
      ingredientNames: [
        "ind_poultry_meal",
        "ind_whole_yellow_corn",
        "ind_brewers_rice",
        "ind_chicken_fat",
        "ind_wheat_gluten",
        "ind_dried_beet_pulp",
        "ind_hydrolyzed_poultry_protein",
        "ind_salmon_fish_oil",
        "ind_soybean_canola_oil",
        "ind_fructooligosaccharides",
        "ind_salt_nacl",
        "ind_taurine_additive",
        "ind_chelated_mineral_premix"
      ]
    },
    {
      name: "오리젠 오리지널 독 (생육+육분 고단백 그레인프리)",
      brand: "ORIJEN",
      archetypeHint: "ARCH_04_HIGH_MEAT_BIOLOGICAL",
      ocrRawText: `[보증성분]
조단백질: 38.0% 이상
조지방: 18.0% 이상
조섬유: 4.0% 이하
조회분: 8.5% 이하
칼슘: 1.4% 이상
인: 1.1% 이상
수분: 12.0% 이하

[원재료]
생닭고기, 생칠면조고기, 닭고기분말, 칠면조분말, 청어분말, 신선한 계란, 닭간, 적렌틸콩, 녹색완두콩, 병아리콩, 연어오일, 건조단호박, 소금, 단백질화아연(킬레이트미네랄)`,
      targets: {
        protein: 38.0,
        fat: 18.0,
        fiber: 4.0,
        ash: 8.5,
        calcium: 1.4,
        phosphorus: 1.1,
        moisture: 12.0
      },
      ingredientNames: [
        "ind_fresh_chicken",
        "ind_fresh_turkey",
        "ind_chicken_meal",
        "ind_turkey_meal",
        "ind_menhaden_fish_meal",
        "ind_fresh_whole_egg",
        "ind_fresh_poultry_organs",
        "ind_red_lentils",
        "ind_whole_peas",
        "ind_chickpeas",
        "ind_salmon_fish_oil",
        "ind_dried_pumpkin",
        "ind_salt_nacl",
        "ind_chelated_mineral_premix"
      ]
    },
    {
      name: "나우 프레쉬 그레인프리 스몰브리드 어덜트",
      brand: "NOW FRESH",
      archetypeHint: "ARCH_02_SALMON_PEA_GRAINFREE",
      ocrRawText: `[등록성분]
조단백질 26.0% 이상
조지방 16.0% 이상
조섬유 4.0% 이하
조회분 7.5% 이하
칼슘 1.1% 이상
인 0.8% 이상
수분 10.0% 이하

[원재료]
뼈를 발라낸 칠면조고기, 감자가루, 완두콩, 전란분, 카놀라유, 완두섬유질, 아마씨, 생연어, 생오리고기, 코코넛오일, 건조사과, 탄산칼슘, 제2인산칼슘, 소금, 타우린`,
      targets: {
        protein: 26.0,
        fat: 16.0,
        fiber: 4.0,
        ash: 7.5,
        calcium: 1.1,
        phosphorus: 0.8,
        moisture: 10.0
      },
      ingredientNames: [
        "ind_fresh_turkey",
        "ind_dehydrated_potato",
        "ind_whole_peas",
        "ind_dried_whole_egg",
        "ind_soybean_canola_oil",
        "ind_pea_fiber",
        "ind_whole_flaxseed",
        "ind_fresh_salmon",
        "ind_fresh_duck",
        "ind_coconut_mct_oil",
        "ind_apple_pomace",
        "ind_calcium_carbonate",
        "ind_dicalcium_phosphate",
        "ind_salt_nacl",
        "ind_taurine_additive"
      ]
    },
    {
      name: "파미나 N&D 오션 연어 & 완두 그레인프리",
      brand: "Farmina N&D",
      archetypeHint: "ARCH_02_SALMON_PEA_GRAINFREE",
      ocrRawText: `[등록성분량]
조단백질: 30.0% 이상
조지방: 18.0% 이상
조섬유: 2.9% 이하
조회분: 7.8% 이하
칼슘: 1.2% 이상
인: 0.9% 이상
수분: 9.0% 이하

[원재료명]
생연어, 연어분말, 완두전분, 건조고구마, 어유, 가수분해연어단백, 비트펄프, 차전자피, 치커리뿌리(이눌린), 프락토올리고당, 소금, 타우린, 킬레이트미네랄`,
      targets: {
        protein: 30.0,
        fat: 18.0,
        fiber: 2.9,
        ash: 7.8,
        calcium: 1.2,
        phosphorus: 0.9,
        moisture: 9.0
      },
      ingredientNames: [
        "ind_fresh_salmon",
        "ind_salmon_meal",
        "ind_pea_starch",
        "ind_dehydrated_sweet_potato",
        "ind_salmon_fish_oil",
        "ind_hydrolyzed_salmon_protein",
        "ind_dried_beet_pulp",
        "ind_psyllium_husk",
        "ind_chicory_inulin",
        "ind_fructooligosaccharides",
        "ind_salt_nacl",
        "ind_taurine_additive",
        "ind_chelated_mineral_premix"
      ]
    },
    {
      name: "로얄캐닌 하이포알러제닉 (가수분해 저알러지 처방식)",
      brand: "Royal Canin Veterinary",
      archetypeHint: "ARCH_03_HYDROLYZED_HYPOALLERGENIC",
      ocrRawText: `[등록성분량]
조단백질: 21.0% 이상
조지방: 19.0% 이상
조섬유: 2.0% 이하
조회분: 6.5% 이하
칼슘: 0.9% 이상
인: 0.7% 이상
수분: 9.5% 이하

[원재료명]
백미, 가수분해 분리대두단백, 동물성 지방(정제계유), 가수분해 가금류 간, 비트펄프, 대두유, 어유, 프락토올리고당, 탄산칼슘, 정제염(소금), 타우린, 비타민프리믹스`,
      targets: {
        protein: 21.0,
        fat: 19.0,
        fiber: 2.0,
        ash: 6.5,
        calcium: 0.9,
        phosphorus: 0.7,
        moisture: 9.5
      },
      ingredientNames: [
        "ind_brewers_rice",
        "ind_hydrolyzed_soy_isolate",
        "ind_chicken_fat",
        "ind_hydrolyzed_poultry_protein",
        "ind_dried_beet_pulp",
        "ind_soybean_canola_oil",
        "ind_salmon_fish_oil",
        "ind_fructooligosaccharides",
        "ind_calcium_carbonate",
        "ind_salt_nacl",
        "ind_taurine_additive",
        "ind_vitamin_premix_preservative"
      ]
    }
  ];

  /**
   * 텍스트로부터 보증성분 수치 파싱 (정규식 기반)
   */
  function parseGuaranteedAnalysis(text) {
    const result = {
      protein: null,
      fat: null,
      fiber: null,
      ash: null,
      calcium: null,
      phosphorus: null,
      moisture: null
    };

    if (!text) return result;

    const proteinMatch = text.match(/(?:조단백질|조단백|단백질|Protein|Crude\s*Protein)\s*[:：]?\s*([0-9.]+)\s*%/i);
    if (proteinMatch) result.protein = parseFloat(proteinMatch[1]);

    const fatMatch = text.match(/(?:조지방|지방|Fat|Crude\s*Fat)\s*[:：]?\s*([0-9.]+)\s*%/i);
    if (fatMatch) result.fat = parseFloat(fatMatch[1]);

    const fiberMatch = text.match(/(?:조섬유|섬유|Fiber|Crude\s*Fiber)\s*[:：]?\s*([0-9.]+)\s*%/i);
    if (fiberMatch) result.fiber = parseFloat(fiberMatch[1]);

    const ashMatch = text.match(/(?:조회분|회분|Ash|Crude\s*Ash)\s*[:：]?\s*([0-9.]+)\s*%/i);
    if (ashMatch) result.ash = parseFloat(ashMatch[1]);

    const caMatch = text.match(/(?:칼슘|Ca|Calcium)\s*[:：]?\s*([0-9.]+)\s*%/i);
    if (caMatch) result.calcium = parseFloat(caMatch[1]);

    const pMatch = text.match(/(?:인|P|Phosphorus)\s*[:：]?\s*([0-9.]+)\s*%/i);
    if (pMatch) result.phosphorus = parseFloat(pMatch[1]);

    const moistureMatch = text.match(/(?:수분|Moisture)\s*[:：]?\s*([0-9.]+)\s*%/i);
    if (moistureMatch) result.moisture = parseFloat(moistureMatch[1]);

    return result;
  }

  /**
   * 원재료 텍스트 파싱 및 1단계 산업용 사료 원재료 DB 우선 매칭
   */
  function parseIngredientList(text, allIngredientsDB) {
    if (!text) return [];

    let ingText = text;
    const splitMatch = text.split(/(?:원재료|원재료명|Ingredients?)\s*[:：\]]/i);
    if (splitMatch.length > 1) {
      ingText = splitMatch[1].split(/\[|\n\n/)[0];
    }

    const rawTokens = ingText
      .split(/[,,\n\t·]+/)
      .map(s => s.trim().replace(/^[-*•\d.]+\s*/, ''))
      .filter(s => s.length > 0);

    const matchedIngredients = [];

    rawTokens.forEach(token => {
      let found = null;
      if (FeedDBRef) {
        found = FeedDBRef.matchIndustrialIngredient(token, allIngredientsDB);
      }

      if (!found && allIngredientsDB) {
        const dbList = Object.values(allIngredientsDB);
        found = dbList.find(ing => ing.name_ko && ing.name_ko.includes(token));
      }

      if (found) {
        const id = found.id || found.ingredient;
        if (!matchedIngredients.some(x => x.id === id)) {
          matchedIngredients.push({
            id: id,
            name: found.name_ko || found.ingredient,
            rawKeyword: token
          });
        }
      }
    });

    return matchedIngredients;
  }

  return {
    SAMPLE_PRESETS,
    parseGuaranteedAnalysis,
    parseIngredientList
  };

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = OCRParser;
}

if (typeof window !== "undefined") window.OCRParser = OCRParser;

/**
 * step6_multi_mix_controller.js
 * [처방사료 데이터 보호자용 믹스피딩 STEP 6 교체 전용 컨트롤러 & UI 렌더러]
 * - 1~4단계 사료 역추적 알고리즘을 기반으로 일반사료/처방사료/습식캔/화식 중
 *   2종(A+B) 또는 3종(A+B+C) 사료를 동시 역추적 및 선형 결합(\alpha \hat{V}_A + \beta \hat{V}_B + \gamma \hat{V}_C)
 * - 단독 HTML 실행 환경 및 처방사료데이터(guardian_portal.js #g-menu-view-6) 완벽 호환
 */

const Step6MultiMixController = (function() {

  let state = {
    activeFeedCount: 3, // 2 또는 3 (기본 3종 체험 가능, 토글로 즉시 2종/3종 전환)
    species: 'dog',
    weightKg: 4.5,
    dailyDER: 346,
    mealsPerDay: 2,
    healthConcern: 'none',
    displayUnitMode: 'dm', // 'dm' (% DM / mg 100g DM) 또는 '1000kcal' (수의임상 g / 1000kcal ME)
    inspectSlotIdx: 0, // 역추적 해부도 상세 보기 중인 슬롯 인덱스 (0: A, 1: B, 2: C)
    calorieRatiosPct: [55, 30, 15],
    slots: [
      {
        slotId: 'A',
        presetId: 'comm_orijen_original',
        name: '[일반건사료 역추적] 오리젠 오리지널 독 (고단백 생육+육분)',
        feedType: 'commercial_dry',
        mode: 'reverse',
        targets: { protein: 38.0, fat: 18.0, fiber: 4.0, ash: 8.5, moisture: 10.0, calcium: 1.35, phosphorus: 1.10 },
        ingredientIds: ['ind_fresh_chicken', 'ind_fresh_turkey', 'ind_chicken_meal', 'ind_turkey_meal', 'ind_fish_meal_menhaden', 'ind_lentils', 'ind_peas_dry', 'ind_poultry_fat', 'ind_fish_oil', 'ind_pumpkin_dry', 'ind_inulin_chicory', 'ind_salt', 'ind_taurine', 'ind_chelated_minerals']
      },
      {
        slotId: 'B',
        presetId: 'rx_rc_gi_lowfat',
        name: '[처방식 건사료] 로얄캐닌 GI 로우팻 저지방 (정밀 공개 DB · 신뢰도 93%)',
        feedType: 'prescription_dry',
        mode: 'reverse',
        isPrescription: true,
        fixedConfidence: 93,
        targets: { protein: 22.0, fat: 7.0, fiber: 2.2, ash: 6.4, moisture: 9.5, calcium: 0.95, phosphorus: 0.72 },
        ingredientIds: ['ind_brewers_rice', 'ind_poultry_meal', 'ind_wheat', 'ind_barley', 'ind_hydrolyzed_poultry', 'ind_beet_pulp', 'ind_poultry_fat', 'ind_fish_oil', 'ind_psyllium_husk', 'ind_fructooligosaccharide', 'ind_salt', 'ind_taurine', 'ind_mineral_premix']
      },
      {
        slotId: 'C',
        presetId: 'wet_lowfat_chicken_can',
        name: '[습식캔/화식] 닭가슴살 & 단호박 저지방 수분 화식 (신뢰도 92%)',
        feedType: 'fresh_wet',
        mode: 'known',
        fixedConfidence: 92,
        knownNutrients: {
          moisture_pct: 76.0,
          energy_kcal_per_100g: 108.0,
          protein_dm_pct: 48.0,
          fat_dm_pct: 9.5,
          fiber_dm_pct: 3.8,
          tdf_dm_pct: 9.2,
          soluble_fiber_g: 4.1,
          insoluble_fiber_g: 5.1,
          carbs_dm_pct: 32.5,
          ash_dm_pct: 6.2,
          calcium_mg: 860,
          phosphorus_mg: 640,
          sodium_mg: 210,
          magnesium_mg: 88,
          potassium_mg: 890,
          methionine_cystine_g: 1.72,
          lysine_g: 3.65,
          taurine_g: 0.28,
          arginine_g: 3.05,
          epa_dha_g: 0.35
        }
      }
    ],
    allIngredientsDB: {},
    lastResult: null,
    charts: {
      donut: null,
      bar: null
    }
  };

  function getIngredientsDB() {
    if (state.allIngredientsDB && Object.keys(state.allIngredientsDB).length > 0) {
      return state.allIngredientsDB;
    }
    if (typeof window !== 'undefined' && window.appState && window.appState.allIngredientsDB && Object.keys(window.appState.allIngredientsDB).length > 0) {
      state.allIngredientsDB = window.appState.allIngredientsDB;
      return state.allIngredientsDB;
    }
    if (typeof FeedIngredientDB !== 'undefined') {
      const base = (typeof EMBEDDED_INGREDIENTS_DB !== 'undefined' && Array.isArray(EMBEDDED_INGREDIENTS_DB))
        ? EMBEDDED_INGREDIENTS_DB
        : [];
      state.allIngredientsDB = FeedIngredientDB.mergeWithGeneralDB(base);
    }
    return state.allIngredientsDB;
  }

  /**
   * 처방사료데이터(guardian_portal.js) 또는 기존 appState와 프로필/DER 동기화
   */
  function syncFromHostEnvironment() {
    if (typeof window !== 'undefined' && window.guardianState && window.guardianState.profile) {
      const gp = window.guardianState.profile;
      const ge = window.guardianState.energy || {};
      state.species = gp.species || state.species;
      state.weightKg = Number(gp.weightKg) || state.weightKg;
      state.mealsPerDay = Number(gp.mealsPerDay) || state.mealsPerDay;
      if (gp.healthConcern && MixFeeder.CLINICAL_GUARD_PRESETS[gp.healthConcern]) {
        state.healthConcern = gp.healthConcern;
      }
      if (ge.der && ge.der > 30) {
        state.dailyDER = Math.round(ge.der);
      }
    } else if (typeof window !== 'undefined' && window.appState) {
      if (window.appState.petProfile) {
        state.species = window.appState.petProfile.species || state.species;
        state.weightKg = Number(window.appState.petProfile.weightKg) || state.weightKg;
      }
      if (window.appState.derResult && window.appState.derResult.der) {
        state.dailyDER = Math.round(window.appState.derResult.der);
      }
    }

    const spEl = document.getElementById('s6SpeciesSelect');
    const wtEl = document.getElementById('s6WeightInput');
    const derEl = document.getElementById('s6DerInput');
    const mealEl = document.getElementById('s6MealsSelect');
    const hcEl = document.getElementById('s6HealthConcernSelect');

    if (spEl) spEl.value = state.species;
    if (wtEl) wtEl.value = state.weightKg;
    if (derEl) derEl.value = state.dailyDER;
    if (mealEl) mealEl.value = String(state.mealsPerDay);
    if (hcEl) hcEl.value = state.healthConcern;
  }

  /**
   * 초기 UI 마운트 및 이벤트 연결
   */
  function init(containerId) {
    getIngredientsDB();
    syncFromHostEnvironment();
    renderSlotCards();
    renderRatioSliders();
    recalculateAndRender();
  }

  /**
   * 2종 사료 (A+B) <-> 3종 사료 (A+B+C) 모드 전환
   */
  function setFeedCount(count) {
    const newCount = count === 3 ? 3 : 2;
    state.activeFeedCount = newCount;
    if (newCount === 2) {
      const sumAB = (state.calorieRatiosPct[0] || 70) + (state.calorieRatiosPct[1] || 30);
      const pA = sumAB > 0 ? Math.round((state.calorieRatiosPct[0] / sumAB) * 100) : 75;
      state.calorieRatiosPct = [pA, 100 - pA, 0];
      if (state.inspectSlotIdx >= 2) state.inspectSlotIdx = 0;
    } else {
      const curA = state.calorieRatiosPct[0] || 60;
      const rem = Math.max(20, 100 - curA);
      const pB = Math.round(rem * 0.65);
      const pC = 100 - curA - pB;
      state.calorieRatiosPct = [curA, pB, pC];
    }

    const btn2 = document.getElementById('s6BtnCount2');
    const btn3 = document.getElementById('s6BtnCount3');
    if (btn2) btn2.classList.toggle('active', newCount === 2);
    if (btn3) btn3.classList.toggle('active', newCount === 3);

    renderSlotCards();
    renderRatioSliders();
    recalculateAndRender();
  }

  function onTopProfileChange() {
    const spEl = document.getElementById('s6SpeciesSelect');
    const wtEl = document.getElementById('s6WeightInput');
    const derEl = document.getElementById('s6DerInput');
    const mealEl = document.getElementById('s6MealsSelect');
    const hcEl = document.getElementById('s6HealthConcernSelect');

    if (spEl) state.species = spEl.value;
    if (wtEl) state.weightKg = Math.max(0.5, parseFloat(wtEl.value) || 4.5);
    if (derEl) state.dailyDER = Math.max(30, parseFloat(derEl.value) || 346);
    if (mealEl) state.mealsPerDay = Math.max(1, parseInt(mealEl.value) || 2);
    if (hcEl) state.healthConcern = hcEl.value || 'none';

    if (typeof window !== 'undefined' && window.guardianState && window.guardianState.profile) {
      window.guardianState.profile.species = state.species;
      window.guardianState.profile.weightKg = state.weightKg;
      window.guardianState.profile.mealsPerDay = state.mealsPerDay;
      window.guardianState.profile.healthConcern = state.healthConcern;
      if (window.guardianState.energy) {
        window.guardianState.energy.der = state.dailyDER;
      }
    }

    recalculateAndRender();
  }

  function autoCalcDERFromWeight() {
    const wt = state.weightKg || 4.5;
    const rer = 70 * Math.pow(wt, 0.75);
    const factor = state.species === 'cat' ? 1.2 : 1.6;
    state.dailyDER = Math.round(rer * factor);
    const derEl = document.getElementById('s6DerInput');
    if (derEl) derEl.value = state.dailyDER;
    recalculateAndRender();
  }

  /**
   * 호스트(guardian_portal.js) Step 2에서 선택/입력된 주식 사료를 역추적 슬롯 구조로 변환
   */
  function buildSlotFromHostStep2DryFood(slotId = 'A') {
    const db = getIngredientsDB();
    const df = (typeof window !== 'undefined' && window.guardianState && window.guardianState.selectedDryFood)
      ? window.guardianState.selectedDryFood
      : null;
    if (!df) return null;

    // 만약 MULTI_FEED_PRESETS에 동일 id가 있고 기본 프리셋이면 검증된 산업용 원재료 배열을 우선 활용
    const existingPreset = MixFeeder.MULTI_FEED_PRESETS.find(p => p.id === df.id);
    let ingIds = [];
    if (existingPreset && Array.isArray(existingPreset.ingredientIds) && existingPreset.ingredientIds.length >= 4) {
      ingIds = existingPreset.ingredientIds.slice();
    } else if (Array.isArray(df.ingredients_order) && df.ingredients_order.length > 0 && typeof FeedIngredientDB !== 'undefined') {
      df.ingredients_order.forEach(rawName => {
        const hit = FeedIngredientDB.matchIndustrialIngredient(rawName, db);
        const key = hit ? (hit.id || hit.ingredient) : null;
        if (key && !ingIds.includes(key)) ingIds.push(key);
      });
    }
    if (ingIds.length === 0) {
      ingIds = ['ind_poultry_meal', 'ind_brewers_rice', 'ind_poultry_fat', 'ind_beet_pulp', 'ind_fish_oil', 'ind_salt', 'ind_taurine', 'ind_mineral_premix'];
    }

    return {
      slotId,
      presetId: '__host_step2_dry__',
      name: `[Step 2 연동] ${df.name || '선택된 주식 사료'}`,
      feedType: df.isPrescription ? 'prescription_dry' : 'commercial_dry',
      mode: 'reverse',
      isPrescription: Boolean(df.isPrescription),
      targets: {
        protein: parseFloat(df.protein_af) || 26.0,
        fat: parseFloat(df.fat_af) || 14.0,
        fiber: parseFloat(df.fiber_af) || 3.0,
        ash: parseFloat(df.ash_af) || 6.5,
        moisture: parseFloat(df.moisture_af) || 10.0,
        calcium: parseFloat(df.ca_af) || 1.0,
        phosphorus: parseFloat(df.p_af) || 0.8
      },
      ingredientIds: ingIds
    };
  }

  /**
   * 호스트(guardian_portal.js) 메뉴 5에서 설계한 홈메이드 화식(DIY)을 정밀 슬롯 구조로 변환
   */
  function buildSlotFromHostMenu5Diy(slotId = 'C') {
    if (typeof window !== 'undefined' && typeof window.getGuardianMenu5DiySlotPreset === 'function') {
      const diyPreset = window.getGuardianMenu5DiySlotPreset();
      if (diyPreset) {
        return Object.assign({}, diyPreset, {
          slotId,
          presetId: '__host_menu5_diy__'
        });
      }
    }
    return null;
  }

  /**
   * Step 2에서 사료가 변경되었을 때 슬롯 A를 자동 동기화
   */
  function syncSlotAFromHostDryFood(shouldRender = true) {
    const hostSlot = buildSlotFromHostStep2DryFood('A');
    if (!hostSlot) return;
    state.slots[0] = hostSlot;
    if (shouldRender) {
      renderSlotCards();
      recalculateAndRender();
    }
  }

  /**
   * 특정 슬롯(0, 1, 2)에 프리셋 사료 로드
   */
  function loadSlotPreset(slotIdx, presetId) {
    const slotLabels = ['A', 'B', 'C'];
    const sLabel = slotLabels[slotIdx] || 'A';

    if (presetId === '__host_step2_dry__') {
      const hostSlot = buildSlotFromHostStep2DryFood(sLabel);
      if (hostSlot) {
        state.slots[slotIdx] = hostSlot;
        renderSlotCards();
        recalculateAndRender();
      }
      return;
    }

    if (presetId === '__host_menu5_diy__') {
      const diySlot = buildSlotFromHostMenu5Diy(sLabel);
      if (diySlot) {
        state.slots[slotIdx] = diySlot;
        renderSlotCards();
        recalculateAndRender();
      }
      return;
    }

    const preset = MixFeeder.MULTI_FEED_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    state.slots[slotIdx] = JSON.parse(JSON.stringify(preset));
    state.slots[slotIdx].slotId = sLabel;
    state.slots[slotIdx].presetId = preset.id;

    renderSlotCards();
    recalculateAndRender();
  }

  /**
   * 슬롯별 보증성분/직접입력값 변경 핸들러
   */
  function updateSlotTarget(slotIdx, field, val) {
    const slot = state.slots[slotIdx];
    if (!slot) return;
    const numVal = parseFloat(val);
    if (slot.mode === 'known' && slot.knownNutrients) {
      slot.knownNutrients[field] = isNaN(numVal) ? 0 : numVal;
    } else {
      if (!slot.targets) slot.targets = {};
      slot.targets[field] = isNaN(numVal) ? 0 : numVal;
    }
    recalculateAndRender();
  }

  /**
   * 슬롯 모드 전환 ('reverse': 일반/처방 건사료 1~4단계 역추적 vs 'known': 습식/화식 정밀 성분 입력)
   */
  function toggleSlotMode(slotIdx, mode) {
    const slot = state.slots[slotIdx];
    if (!slot) return;
    slot.mode = mode;
    if (mode === 'known' && !slot.knownNutrients) {
      slot.knownNutrients = {
        moisture_pct: 75.0,
        energy_kcal_per_100g: 115.0,
        protein_dm_pct: 42.0,
        fat_dm_pct: 14.0,
        fiber_dm_pct: 3.5,
        tdf_dm_pct: 8.0,
        calcium_mg: 850,
        phosphorus_mg: 650,
        sodium_mg: 220
      };
    } else if (mode === 'reverse' && !slot.targets) {
      slot.targets = { protein: 28.0, fat: 15.0, fiber: 3.5, ash: 7.2, moisture: 10.0, calcium: 1.1, phosphorus: 0.85 };
      slot.ingredientIds = ['ind_poultry_meal', 'ind_brewers_rice', 'ind_poultry_fat', 'ind_beet_pulp', 'ind_fish_oil', 'ind_salt', 'ind_taurine', 'ind_mineral_premix'];
    }
    renderSlotCards();
    recalculateAndRender();
  }

  /**
   * 슬롯에 원재료 추가 / 삭제 / 순서 이동
   */
  function addIngredientToSlot(slotIdx) {
    const sel = document.getElementById(`s6SlotIngSelect_${slotIdx}`);
    if (!sel || !sel.value) return;
    const slot = state.slots[slotIdx];
    if (!slot.ingredientIds) slot.ingredientIds = [];
    if (!slot.ingredientIds.includes(sel.value)) {
      slot.ingredientIds.push(sel.value);
      renderSlotCards();
      recalculateAndRender();
    }
  }

  function removeIngredientFromSlot(slotIdx, ingId) {
    const slot = state.slots[slotIdx];
    if (!slot || !slot.ingredientIds) return;
    if (slot.ingredientIds.length <= 1) return;
    slot.ingredientIds = slot.ingredientIds.filter(id => id !== ingId);
    renderSlotCards();
    recalculateAndRender();
  }

  function moveIngredientInSlot(slotIdx, idx, dir) {
    const slot = state.slots[slotIdx];
    if (!slot || !slot.ingredientIds) return;
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= slot.ingredientIds.length) return;
    const tmp = slot.ingredientIds[idx];
    slot.ingredientIds[idx] = slot.ingredientIds[targetIdx];
    slot.ingredientIds[targetIdx] = tmp;
    renderSlotCards();
    recalculateAndRender();
  }

  /**
   * 슬롯별 OCR / 포장지 텍스트 자동 추출
   */
  function parseSlotLabelText(slotIdx) {
    const txtEl = document.getElementById(`s6SlotOcrText_${slotIdx}`);
    if (!txtEl || !txtEl.value.trim()) return;
    const text = txtEl.value;
    const slot = state.slots[slotIdx];
    slot.mode = 'reverse';
    if (!slot.targets) slot.targets = { protein: 27, fat: 15, fiber: 3.5, ash: 7.0, moisture: 10, calcium: 1.0, phosphorus: 0.8 };

    if (typeof OCRParser !== 'undefined') {
      const ga = OCRParser.parseGuaranteedAnalysis(text);
      if (ga.protein) slot.targets.protein = ga.protein;
      if (ga.fat) slot.targets.fat = ga.fat;
      if (ga.fiber) slot.targets.fiber = ga.fiber;
      if (ga.ash) slot.targets.ash = ga.ash;
      if (ga.moisture) slot.targets.moisture = ga.moisture;
      if (ga.calcium) slot.targets.calcium = ga.calcium;
      if (ga.phosphorus) slot.targets.phosphorus = ga.phosphorus;

      const matched = OCRParser.parseIngredientList(text, getIngredientsDB());
      if (matched && matched.length > 0) {
        slot.ingredientIds = matched.map(m => m.id);
      }
    }
    renderSlotCards();
    recalculateAndRender();
  }

  /**
   * 칼로리 비율 슬라이더 조절 (합계 100% 자동 유지)
   */
  function onCalorieSliderChange(changedIdx, newValRaw) {
    const val = Math.max(0, Math.min(100, parseInt(newValRaw) || 0));
    const kCount = state.activeFeedCount;

    if (kCount === 2) {
      if (changedIdx === 0) {
        state.calorieRatiosPct[0] = val;
        state.calorieRatiosPct[1] = 100 - val;
      } else {
        state.calorieRatiosPct[1] = val;
        state.calorieRatiosPct[0] = 100 - val;
      }
      state.calorieRatiosPct[2] = 0;
    } else {
      state.calorieRatiosPct[changedIdx] = val;
      const otherIndices = [0, 1, 2].filter(i => i !== changedIdx);
      const remaining = Math.max(0, 100 - val);
      const prevOtherSum = state.calorieRatiosPct[otherIndices[0]] + state.calorieRatiosPct[otherIndices[1]];
      if (prevOtherSum <= 0) {
        state.calorieRatiosPct[otherIndices[0]] = Math.round(remaining / 2);
        state.calorieRatiosPct[otherIndices[1]] = remaining - state.calorieRatiosPct[otherIndices[0]];
      } else {
        const firstShare = Math.round((state.calorieRatiosPct[otherIndices[0]] / prevOtherSum) * remaining);
        state.calorieRatiosPct[otherIndices[0]] = firstShare;
        state.calorieRatiosPct[otherIndices[1]] = remaining - firstShare;
      }
    }

    renderRatioSliders();
    recalculateAndRender();
  }

  /**
   * AI 최적 안전 배합비 원클릭 적용
   */
  function applyOptimalSafeRatio() {
    if (!state.lastResult || !state.lastResult.optimalRecommendation) {
      recalculateAndRender();
    }
    const rec = state.lastResult?.optimalRecommendation;
    if (!rec || !rec.recommendedCaloriePcts) return;

    const pcts = rec.recommendedCaloriePcts;
    if (state.activeFeedCount === 2) {
      state.calorieRatiosPct = [pcts[0], pcts[1], 0];
    } else {
      state.calorieRatiosPct = [pcts[0], pcts[1], pcts[2] || 0];
    }

    renderRatioSliders();
    recalculateAndRender();
  }

  function setDisplayUnitMode(mode) {
    state.displayUnitMode = mode === '1000kcal' ? '1000kcal' : 'dm';
    const btnDM = document.getElementById('s6UnitBtnDM');
    const btnKcal = document.getElementById('s6UnitBtnKcal');
    if (btnDM) btnDM.classList.toggle('active', state.displayUnitMode === 'dm');
    if (btnKcal) btnKcal.classList.toggle('active', state.displayUnitMode === '1000kcal');
    if (state.lastResult) {
      renderAuditTable(state.lastResult);
    }
  }

  function setInspectSlot(idx) {
    state.inspectSlotIdx = idx;
    if (state.lastResult) {
      renderReverseAnatomyPanel(state.lastResult);
    }
  }

  /**
   * 슬롯 입력 카드 2개 또는 3개 렌더링
   */
  function renderSlotCards() {
    const container = document.getElementById('s6SlotsGrid');
    if (!container) return;

    const db = getIngredientsDB();
    const dbList = Object.values(db);
    const activeSlots = state.slots.slice(0, state.activeFeedCount);
    const badgeColors = ['#2563eb', '#7c3aed', '#059669'];
    const bgColors = ['#eff6ff', '#f5f3ff', '#ecfdf5'];

    container.style.gridTemplateColumns = state.activeFeedCount === 3
      ? 'repeat(auto-fit, minmax(310px, 1fr))'
      : 'repeat(auto-fit, minmax(380px, 1fr))';

    container.innerHTML = activeSlots.map((slot, idx) => {
      const hostBridgeOptions = `
        <option value="__host_step2_dry__" ${slot.presetId === '__host_step2_dry__' ? 'selected' : ''}>🔗 [Step 2 연동] 현재 Step 2에서 선택/입력한 주식 사료</option>
        <option value="__host_menu5_diy__" ${slot.presetId === '__host_menu5_diy__' ? 'selected' : ''}>🔗 [메뉴 5 연동] 직접 설계한 홈메이드 화식(DIY) 레시피</option>
      `;
      const presetOptions = hostBridgeOptions + MixFeeder.MULTI_FEED_PRESETS.map(p =>
        `<option value="${p.id}" ${p.id === slot.presetId ? 'selected' : ''}>${p.name}</option>`
      ).join('');

      const ingDropdownOptions = dbList.map(item =>
        `<option value="${item.ingredient}">${item.name_ko || item.ingredient} (${item.category || '원료'})</option>`
      ).join('');

      let bodyHtml = '';
      if (slot.mode === 'reverse') {
        const t = slot.targets || {};
        const chipsHtml = (slot.ingredientIds || []).map((id, iIdx) => {
          const item = db[id] || { name_ko: id };
          const isFresh = item.processing_type === 'fresh_meat' || (item.moisture_g >= 60);
          const isAnchor = item.is_anchor_1pct || item.processing_type === 'anchor_1pct';
          const tagColor = isFresh ? '#dc2626' : (isAnchor ? '#9333ea' : '#1e40af');
          return `
            <span style="display:inline-flex; align-items:center; gap:3px; background:#fff; border:1px solid #cbd5e1; border-radius:999px; padding:2px 8px; font-size:0.74rem; font-weight:600; color:${tagColor};">
              <strong>${iIdx + 1}.</strong> ${item.name_ko || id}
              <button type="button" onclick="Step6MultiMixController.moveIngredientInSlot(${idx}, ${iIdx}, -1)" style="border:none; background:none; cursor:pointer; font-size:0.68rem; color:#64748b; padding:0 1px;" title="앞으로">◀</button>
              <button type="button" onclick="Step6MultiMixController.moveIngredientInSlot(${idx}, ${iIdx}, 1)" style="border:none; background:none; cursor:pointer; font-size:0.68rem; color:#64748b; padding:0 1px;" title="뒤로">▶</button>
              <button type="button" onclick="Step6MultiMixController.removeIngredientFromSlot(${idx}, '${id}')" style="border:none; background:none; cursor:pointer; font-size:0.8rem; color:#ef4444; padding:0 2px;" title="삭제">&times;</button>
            </span>
          `;
        }).join('');

        bodyHtml = `
          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin-top:8px;">
            <div>
              <label style="font-size:0.72rem; font-weight:700; color:#475569;">조단백(%)</label>
              <input type="number" step="0.1" value="${t.protein ?? 27}" onchange="Step6MultiMixController.updateSlotTarget(${idx}, 'protein', this.value)" style="width:100%; padding:5px 6px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.82rem; font-weight:700;">
            </div>
            <div>
              <label style="font-size:0.72rem; font-weight:700; color:#475569;">조지방(%)</label>
              <input type="number" step="0.1" value="${t.fat ?? 15}" onchange="Step6MultiMixController.updateSlotTarget(${idx}, 'fat', this.value)" style="width:100%; padding:5px 6px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.82rem; font-weight:700;">
            </div>
            <div>
              <label style="font-size:0.72rem; font-weight:700; color:#475569;">조섬유(%)</label>
              <input type="number" step="0.1" value="${t.fiber ?? 3.5}" onchange="Step6MultiMixController.updateSlotTarget(${idx}, 'fiber', this.value)" style="width:100%; padding:5px 6px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.82rem;">
            </div>
            <div>
              <label style="font-size:0.72rem; font-weight:700; color:#475569;">조회분(%)</label>
              <input type="number" step="0.1" value="${t.ash ?? 7.0}" onchange="Step6MultiMixController.updateSlotTarget(${idx}, 'ash', this.value)" style="width:100%; padding:5px 6px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.82rem;">
            </div>
            <div>
              <label style="font-size:0.72rem; font-weight:700; color:#475569;">수분(%)</label>
              <input type="number" step="0.1" value="${t.moisture ?? 10.0}" onchange="Step6MultiMixController.updateSlotTarget(${idx}, 'moisture', this.value)" style="width:100%; padding:5px 6px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.82rem;">
            </div>
            <div>
              <label style="font-size:0.72rem; font-weight:700; color:#475569;">칼슘(%)</label>
              <input type="number" step="0.05" value="${t.calcium ?? 1.0}" onchange="Step6MultiMixController.updateSlotTarget(${idx}, 'calcium', this.value)" style="width:100%; padding:5px 6px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.82rem;">
            </div>
            <div>
              <label style="font-size:0.72rem; font-weight:700; color:#475569;">인(%)</label>
              <input type="number" step="0.05" value="${t.phosphorus ?? 0.8}" onchange="Step6MultiMixController.updateSlotTarget(${idx}, 'phosphorus', this.value)" style="width:100%; padding:5px 6px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.82rem;">
            </div>
            <div style="display:flex; align-items:flex-end;">
              <button type="button" onclick="Step6MultiMixController.setInspectSlot(${idx})" style="width:100%; padding:6px 4px; background:${badgeColors[idx]}; color:#fff; border:none; border-radius:6px; font-size:0.74rem; font-weight:700; cursor:pointer;">해부도 보기</button>
            </div>
          </div>

          <div style="margin-top:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="font-size:0.75rem; font-weight:700; color:#334155;">원재료 중량 순서 (I₁ ≥ I₂ ≥ … ≥ Iₙ)</span>
              <span style="font-size:0.7rem; color:#64748b;">생육 수분손실·1% 앵커 자동적용</span>
            </div>
            <div style="display:flex; gap:4px; margin-bottom:6px;">
              <select id="s6SlotIngSelect_${idx}" style="flex:1; padding:4px 6px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.76rem;">
                ${ingDropdownOptions}
              </select>
              <button type="button" onclick="Step6MultiMixController.addIngredientToSlot(${idx})" style="padding:4px 10px; background:#334155; color:#fff; border:none; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">+추가</button>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:4px; max-height:92px; overflow-y:auto; padding:6px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
              ${chipsHtml}
            </div>
          </div>

          <details style="margin-top:8px; font-size:0.75rem;">
            <summary style="cursor:pointer; color:#475569; font-weight:600;">📷 라벨 텍스트 붙여넣기로 자동 파싱</summary>
            <div style="margin-top:4px; display:flex; gap:4px;">
              <input type="text" id="s6SlotOcrText_${idx}" placeholder="예: 조단백질 30% 이상, 조지방 16% 이상, 원재료: 생연어, 연어분말, 완두콩, 비트펄프, 소금..." style="flex:1; padding:5px 8px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.75rem;">
              <button type="button" onclick="Step6MultiMixController.parseSlotLabelText(${idx})" style="padding:5px 10px; background:#0f172a; color:#fff; border:none; border-radius:6px; font-size:0.74rem; font-weight:700; cursor:pointer;">추출</button>
            </div>
          </details>
        `;
      } else {
        const kn = slot.knownNutrients || {};
        bodyHtml = `
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; margin-top:8px;">
            <div>
              <label style="font-size:0.72rem; font-weight:700; color:#475569;">수분(% AF)</label>
              <input type="number" step="0.5" value="${kn.moisture_pct ?? 75}" onchange="Step6MultiMixController.updateSlotTarget(${idx}, 'moisture_pct', this.value)" style="width:100%; padding:5px 6px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.82rem; font-weight:700;">
            </div>
            <div>
              <label style="font-size:0.72rem; font-weight:700; color:#475569;">열량(kcal/100g)</label>
              <input type="number" step="1" value="${kn.energy_kcal_per_100g ?? 115}" onchange="Step6MultiMixController.updateSlotTarget(${idx}, 'energy_kcal_per_100g', this.value)" style="width:100%; padding:5px 6px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.82rem; font-weight:700;">
            </div>
            <div>
              <label style="font-size:0.72rem; font-weight:700; color:#475569;">단백질(% DM)</label>
              <input type="number" step="0.5" value="${kn.protein_dm_pct ?? 44}" onchange="Step6MultiMixController.updateSlotTarget(${idx}, 'protein_dm_pct', this.value)" style="width:100%; padding:5px 6px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.82rem; font-weight:700;">
            </div>
            <div>
              <label style="font-size:0.72rem; font-weight:700; color:#475569;">지방(% DM)</label>
              <input type="number" step="0.5" value="${kn.fat_dm_pct ?? 12}" onchange="Step6MultiMixController.updateSlotTarget(${idx}, 'fat_dm_pct', this.value)" style="width:100%; padding:5px 6px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.82rem;">
            </div>
            <div>
              <label style="font-size:0.72rem; font-weight:700; color:#475569;">총섬유 TDF(% DM)</label>
              <input type="number" step="0.5" value="${kn.tdf_dm_pct ?? 8.5}" onchange="Step6MultiMixController.updateSlotTarget(${idx}, 'tdf_dm_pct', this.value)" style="width:100%; padding:5px 6px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.82rem;">
            </div>
            <div>
              <label style="font-size:0.72rem; font-weight:700; color:#475569;">칼슘(mg/100gDM)</label>
              <input type="number" step="10" value="${kn.calcium_mg ?? 860}" onchange="Step6MultiMixController.updateSlotTarget(${idx}, 'calcium_mg', this.value)" style="width:100%; padding:5px 6px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.82rem;">
            </div>
            <div>
              <label style="font-size:0.72rem; font-weight:700; color:#475569;">인(mg/100gDM)</label>
              <input type="number" step="10" value="${kn.phosphorus_mg ?? 640}" onchange="Step6MultiMixController.updateSlotTarget(${idx}, 'phosphorus_mg', this.value)" style="width:100%; padding:5px 6px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.82rem;">
            </div>
            <div>
              <label style="font-size:0.72rem; font-weight:700; color:#475569;">나트륨(mg/100gDM)</label>
              <input type="number" step="10" value="${kn.sodium_mg ?? 210}" onchange="Step6MultiMixController.updateSlotTarget(${idx}, 'sodium_mg', this.value)" style="width:100%; padding:5px 6px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.82rem;">
            </div>
            <div>
              <label style="font-size:0.72rem; font-weight:700; color:#475569;">신뢰도(%)</label>
              <input type="number" step="1" value="${slot.fixedConfidence ?? 92}" onchange="Step6MultiMixController.StateSlots[${idx}].fixedConfidence=parseInt(this.value)||90; Step6MultiMixController.recalculateAndRender();" style="width:100%; padding:5px 6px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.82rem;">
            </div>
          </div>
          <div style="margin-top:8px; padding:8px 10px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; font-size:0.76rem; color:#065f46;">
            ✅ <strong>정밀 공개 영양 DB / 정량 화식 슬롯:</strong> 상세 영양소가 알려져 있으므로 높은 신뢰도(${slot.fixedConfidence ?? 92}%) 가중치로 선형 결합에 반영됩니다.
          </div>
        `;
      }

      return `
        <div style="background:#ffffff; border:2px solid ${badgeColors[idx]}33; border-radius:14px; padding:14px; box-shadow:0 2px 6px rgba(15,23,42,0.04);">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="background:${badgeColors[idx]}; color:#fff; font-weight:800; font-size:0.78rem; padding:3px 9px; border-radius:999px;">사료 ${slot.slotId}</span>
              <span id="s6SlotConfBadge_${idx}" style="background:${bgColors[idx]}; color:${badgeColors[idx]}; font-weight:700; font-size:0.74rem; padding:2px 8px; border-radius:999px;">신뢰도 산출중</span>
            </div>
            <div style="display:flex; gap:4px;">
              <button type="button" onclick="Step6MultiMixController.toggleSlotMode(${idx}, 'reverse')" style="padding:3px 7px; font-size:0.72rem; font-weight:700; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${slot.mode === 'reverse' ? badgeColors[idx] : '#f8fafc'}; color:${slot.mode === 'reverse' ? '#fff' : '#475569'};">1~4단계 역추적</button>
              <button type="button" onclick="Step6MultiMixController.toggleSlotMode(${idx}, 'known')" style="padding:3px 7px; font-size:0.72rem; font-weight:700; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; background:${slot.mode === 'known' ? badgeColors[idx] : '#f8fafc'}; color:${slot.mode === 'known' ? '#fff' : '#475569'};">정밀화식/습식DB</button>
            </div>
          </div>

          <div>
            <select onchange="Step6MultiMixController.loadSlotPreset(${idx}, this.value)" style="width:100%; padding:6px 8px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.82rem; font-weight:700; color:#1e293b; background:#f8fafc;">
              ${presetOptions}
            </select>
          </div>

          <div id="s6SlotArchetypeTag_${idx}" style="margin-top:6px; font-size:0.74rem; color:#475569; background:#f8fafc; padding:4px 8px; border-radius:6px; border:1px dashed #cbd5e1;">
            아키타입 매핑 대기중...
          </div>

          ${bodyHtml}
        </div>
      `;
    }).join('');
  }

  /**
   * 2종 / 3종 칼로리 배합비 슬라이더 UI 렌더링
   */
  function renderRatioSliders() {
    const container = document.getElementById('s6RatioSlidersArea');
    if (!container) return;

    const activeSlots = state.slots.slice(0, state.activeFeedCount);
    const colors = ['#2563eb', '#7c3aed', '#059669'];

    container.innerHTML = activeSlots.map((slot, idx) => {
      const pct = state.calorieRatiosPct[idx] || 0;
      return `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size:0.85rem; font-weight:700; color:${colors[idx]};">
              ● 사료 ${slot.slotId}: ${slot.name.replace(/\[.*?\]\s*/, '')}
            </span>
            <span style="font-size:1rem; font-weight:800; color:${colors[idx]};">${pct}% <small style="font-weight:600; color:#64748b;">(${Math.round(state.dailyDER * pct / 100)} kcal)</small></span>
          </div>
          <input type="range" min="0" max="100" step="5" value="${pct}" oninput="Step6MultiMixController.onCalorieSliderChange(${idx}, this.value)" style="width:100%; accent-color:${colors[idx]}; cursor:pointer;">
        </div>
      `;
    }).join('');
  }

  /**
   * 전체 2종/3종 역추적 + 선형 결합 재계산 및 모든 결과 패널 업데이트
   */
  function recalculateAndRender() {
    const db = getIngredientsDB();
    const activeSlots = state.slots.slice(0, state.activeFeedCount);
    const activeRatios = state.calorieRatiosPct.slice(0, state.activeFeedCount);

    const res = MixFeeder.calculateMultiFeedMix(
      activeSlots,
      activeRatios,
      state.dailyDER,
      state.mealsPerDay,
      {
        species: state.species,
        weightKg: state.weightKg,
        healthConcern: state.healthConcern,
        allIngredientsDB: db
      }
    );

    state.lastResult = res;

    // 처방사료데이터(guardian_portal.js) 호스트 객체가 존재하면 자동 브릿지 업데이트
    if (typeof window !== 'undefined') {
      window.lastStep6MultiMixResult = res;
      if (window.guardianState) {
        window.guardianState.lastMixSummary = res.guardianStep6Payload;
        window.guardianState.menu6_multi_mix = res.guardianStep6Payload;
      }
      if (typeof window.onStep6MultiMixUpdated === 'function') {
        window.onStep6MultiMixUpdated(res);
      }
    }

    // 1. 슬롯 상단 신뢰도 배지 & 아키타입 요약 업데이트
    res.slotSchedules.forEach((sched, idx) => {
      const confEl = document.getElementById(`s6SlotConfBadge_${idx}`);
      if (confEl) {
        confEl.innerText = `신뢰도 ${sched.confidenceScore}% · ${sched.energyAF}kcal/kg`;
      }
      const archEl = document.getElementById(`s6SlotArchetypeTag_${idx}`);
      const vec = res.feedVectors[idx];
      if (archEl && vec) {
        if (vec.mode === 'reverse' && vec.reverseResult) {
          const arch = vec.reverseResult.archetypeAnalysis?.bestArchetype;
          const anchorIdx = vec.reverseResult.anchorIndex;
          archEl.innerHTML = `🧬 <strong>4단계 아키타입:</strong> ${arch ? `${arch.code} (${arch.name})` : '표준'} | <strong>동물성단백:</strong> ${vec.animal_protein_share_pct}% | <strong>1% 앵커:</strong> ${anchorIdx >= 0 ? (anchorIdx + 1) + '번째 원료부터' : '자동보정'}`;
        } else {
          archEl.innerHTML = `🍲 <strong>정밀 영양 프로파일:</strong> 수분 ${vec.moisture_pct}% AF | 단백질 ${vec.protein_pct}% DM | 지방 ${vec.fat_pct}% DM | Ca:P ${vec.ca_p_ratio}:1`;
        }
      }
    });

    // 2. AI 최적 배합비 추천 배너 업데이트
    const optBanner = document.getElementById('s6OptimalBanner');
    if (optBanner && res.optimalRecommendation) {
      optBanner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <span style="background:#4f46e5; color:#fff; font-size:0.75rem; font-weight:800; padding:3px 8px; border-radius:6px;">AI 안전 마진 배합비 추천</span>
            <strong style="margin-left:6px; color:#1e1b4b; font-size:0.92rem;">추천 칼로리 비율: ${res.optimalRecommendation.recommendedCaloriePcts.join(' : ')}%</strong>
            <div style="font-size:0.8rem; color:#3730a3; margin-top:3px;">${res.optimalRecommendation.summary}</div>
          </div>
          <button type="button" onclick="Step6MultiMixController.applyOptimalSafeRatio()" style="padding:8px 14px; background:#4f46e5; color:#fff; border:none; border-radius:8px; font-size:0.82rem; font-weight:700; cursor:pointer; white-space:nowrap;">
            ⚡ 추천 비율(${res.optimalRecommendation.recommendedCaloriePcts.join(':')}) 즉시 적용
          </button>
        </div>
      `;
    }

    // 3. 일일 & 1회 급여 스케줄 카드 렌더링
    renderScheduleCards(res);

    // 4. 선택 슬롯의 1~4단계 역추적 해부도 렌더링
    renderReverseAnatomyPanel(res);

    // 5. 신뢰도 가중치 기반 Min~Max 안전 밴드 신호등 감사 테이블 렌더링
    renderAuditTable(res);

    // 6. 차트 업데이트
    renderCharts(res);
  }

  function renderScheduleCards(res) {
    const container = document.getElementById('s6ScheduleCardsArea');
    if (!container) return;

    const colors = ['#2563eb', '#7c3aed', '#059669'];
    const cardsHtml = res.slotSchedules.map((s, idx) => `
      <div style="background:#ffffff; border-left:5px solid ${colors[idx]}; border-radius:10px; padding:12px 14px; box-shadow:0 1px 4px rgba(0,0,0,0.05); border-top:1px solid #e2e8f0; border-right:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.78rem; font-weight:800; color:${colors[idx]};">사료 ${s.slotId} (${s.caloriePct}% kcal / DM ${(res.alphaDMWeights[idx] * 100).toFixed(1)}%)</span>
          <span style="font-size:0.74rem; color:#64748b;">${s.dailyKcal} kcal/일</span>
        </div>
        <div style="font-size:0.84rem; font-weight:700; color:#1e293b; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.name}</div>
        <div style="display:flex; align-items:baseline; gap:10px; margin-top:8px;">
          <div>
            <span style="font-size:1.35rem; font-weight:900; color:${colors[idx]};">${s.dailyGramsAF}</span>
            <span style="font-size:0.8rem; font-weight:700; color:#475569;">g / 일</span>
          </div>
          <div style="background:#f1f5f9; padding:3px 8px; border-radius:6px; font-size:0.8rem; font-weight:700; color:#334155;">
            1회당 <strong>${s.mealGramsAF}g</strong> (1일 ${res.mealsPerDay}회)
          </div>
        </div>
        <div style="font-size:0.74rem; color:#64748b; margin-top:6px;">
          건물 기여량: ${s.dailyGramsDM}g DM | 사료 내 수분: ${s.waterMlFromFood}ml/일
        </div>
      </div>
    `).join('');

    const summaryCard = `
      <div style="background:#0f172a; color:#ffffff; border-radius:10px; padding:12px 14px;">
        <div style="font-size:0.76rem; font-weight:700; color:#94a3b8;">최종 ${res.activeFeedCount}종 믹스피딩 총 급여 & 음수 밸런스</div>
        <div style="font-size:1.25rem; font-weight:900; color:#38bdf8; margin-top:4px;">
          총 ${res.totalDailyGramsAF} g/일 <span style="font-size:0.82rem; color:#e2e8f0;">(1끼당 ${res.totalMealGramsAF}g)</span>
        </div>
        <div style="font-size:0.78rem; color:#cbd5e1; margin-top:6px;">
          • 결합 신뢰도 점수: <strong style="color:#4ade80;">${res.combinedConfidence}%</strong> | Ca:P 비율: <strong>${res.finalNutrientsDM.ca_p_ratio}:1</strong><br>
          • 식이 수분 획득: <strong>${res.waterBalance.fromFoodMl}ml</strong> + 추가 음수 권장: <strong style="color:#fbbf24;">${res.waterBalance.additionalDrinkMl}ml/일</strong>
        </div>
      </div>
    `;

    container.innerHTML = cardsHtml + summaryCard;
  }

  function renderReverseAnatomyPanel(res) {
    const container = document.getElementById('s6ReverseAnatomyBox');
    if (!container) return;

    const idx = Math.min(state.inspectSlotIdx, res.feedVectors.length - 1);
    const vec = res.feedVectors[idx];
    const colors = ['#2563eb', '#7c3aed', '#059669'];

    const tabButtons = res.feedVectors.map((v, i) => `
      <button type="button" onclick="Step6MultiMixController.setInspectSlot(${i})" style="padding:5px 12px; border-radius:8px; border:1px solid ${colors[i]}; background:${i === idx ? colors[i] : '#fff'}; color:${i === idx ? '#fff' : colors[i]}; font-size:0.78rem; font-weight:700; cursor:pointer;">
        사료 ${v.slotId} 상세 역추적 보기 (${v.confidenceScore}%)
      </button>
    `).join('');

    if (!vec.reverseResult) {
      container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
          <div style="font-weight:800; font-size:0.95rem; color:#1e293b;">🔍 사료 슬롯별 1~4단계 역추적 해부도</div>
          <div style="display:flex; gap:6px;">${tabButtons}</div>
        </div>
        <div style="padding:12px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; font-size:0.84rem; color:#065f46;">
          <strong>[${vec.name}]</strong> 슬롯은 정밀 영양 성분이 공개된 습식/화식/처방 DB(신뢰도 ${vec.confidenceScore}%)를 직접 사용 중입니다.
          (조단백 ${vec.protein_pct}% DM, 조지방 ${vec.fat_pct}% DM, 총식이섬유 TDF ${vec.tdf_pct}% DM, Ca ${vec.calcium_mg}mg, P ${vec.phosphorus_mg}mg/100g DM)
        </div>
      `;
      return;
    }

    const rev = vec.reverseResult;
    const working = rev.workingIngredients || [];
    const preR = rev.preProcessingRatios || rev.ratios || [];
    const dmR = rev.dmContributionRatios || rev.ratios || [];
    const arch = rev.archetypeAnalysis?.bestArchetype;
    const limAA = rev.aminoAcidAnalysis?.limitingAminoAcid;

    const topRows = working.slice(0, 10).map((ing, i) => {
      const pVal = preR[i] !== undefined ? preR[i] : 0;
      const dVal = dmR[i] !== undefined ? dmR[i] : pVal;
      const diff = dVal - pVal;
      return `
        <tr>
          <td style="padding:5px 8px; font-weight:700;">${i + 1}</td>
          <td style="padding:5px 8px; font-weight:700;">${ing.name}</td>
          <td style="padding:5px 8px;">${pVal.toFixed(1)}%</td>
          <td style="padding:5px 8px; font-weight:700; color:${Math.abs(diff) >= 3 ? '#d97706' : '#0f172a'};">
            ${dVal.toFixed(1)}% ${Math.abs(diff) >= 3 ? `(${diff > 0 ? '+' : ''}${diff.toFixed(1)}%p 수분보정)` : ''}
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
        <div style="font-weight:800; font-size:0.95rem; color:#1e293b;">🔍 [사료 ${vec.slotId}] 1~4단계 역추적 해부도: ${vec.name}</div>
        <div style="display:flex; gap:6px;">${tabButtons}</div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px;">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px;">
          <div style="font-size:0.8rem; font-weight:800; color:#334155; margin-bottom:6px;">
            [2단계] 라벨 투입비(w<sub>i</sub><sup>pre</sup>) vs 건조 후 건물 기여도(w<sub>i</sub><sup>DM</sup>)
          </div>
          <table style="width:100%; font-size:0.76rem; border-collapse:collapse;">
            <thead>
              <tr style="background:#e2e8f0; text-align:left;">
                <th style="padding:4px 8px;">#</th>
                <th style="padding:4px 8px;">원재료명</th>
                <th style="padding:4px 8px;">라벨투입비</th>
                <th style="padding:4px 8px;">건물기여비(DM)</th>
              </tr>
            </thead>
            <tbody>${topRows}</tbody>
          </table>
        </div>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; font-size:0.8rem; color:#334155; display:flex; flex-direction:column; gap:8px;">
          <div>
            <strong style="color:#1e40af;">[3단계 트랙 1 - 아미노산 스코어]:</strong><br>
            동물성 단백질 비중 <strong>${vec.animal_protein_share_pct}%</strong> vs 식물성 <strong>${vec.plant_protein_share_pct}%</strong><br>
            라이신 ${vec.lysine_g}% DM | 메티오닌+시스틴 ${vec.methionine_cystine_g}% DM | 타우린 ${vec.taurine_g}% DM<br>
            <span style="color:#b45309;">• 제1제한 아미노산: ${limAA ? `${limAA.label} (AAFCO 대비 ${limAA.fulfillmentPct}%)` : '모두 충족'}</span>
          </div>
          <div>
            <strong style="color:#047857;">[3단계 트랙 2 - 식이섬유(TDF) 확장 모델]:</strong><br>
            라벨 조섬유 ${vec.fiber_pct}% DM ➔ <strong>총 식이섬유(TDF) ${vec.tdf_pct}% DM</strong><br>
            (수용성 섬유소 ${vec.soluble_fiber_pct}% + 불용성 섬유소 ${vec.insoluble_fiber_pct}%)
          </div>
          <div>
            <strong style="color:#6d28d9;">[4단계 글로벌 아키타입 클러스터링 보정]:</strong><br>
            매칭 템플릿: <strong>${arch ? `${arch.code} - ${arch.name}` : '표준 아키타입'}</strong> (유사도 ${rev.archetypeAnalysis?.similarityPct || 85}%)<br>
            레퍼런스: ${arch ? arch.referenceBrands : 'Global Reference'}
          </div>
        </div>
      </div>
    `;
  }

  function renderAuditTable(res) {
    const tbody = document.getElementById('s6AuditTableBody');
    const headRow = document.getElementById('s6AuditTableHeadRow');
    if (!tbody || !headRow) return;

    const isKcalMode = state.displayUnitMode === '1000kcal';
    const feedCols = res.feedVectors.map(v => `<th>사료 ${v.slotId}<br><small style="font-weight:500;">(${v.confidenceScore}%)</small></th>`).join('');

    headRow.innerHTML = `
      <th>핵심 관리 영양소</th>
      ${feedCols}
      <th>최종 ${res.activeFeedCount}종 결합치 (${isKcalMode ? 'Per 1,000kcal' : '% DM / mg'})</th>
      <th>신뢰도 가중 예측 밴드 [Min ~ Max]</th>
      <th>허용 가드라인 (${res.healthConcernLabel.split('(')[0].trim()})</th>
      <th>신호등 판정</th>
    `;

    const kcalFactorMix = 1000.0 / Math.max(280, res.feedVectors.reduce((acc, v, i) => acc + res.alphaDMWeights[i] * v.energyKcalPer100gDM, 0));

    tbody.innerHTML = res.nutrientBandAudits.map(row => {
      const convertVal = (valDM, energy100gDM) => {
        if (!isKcalMode || row.key === 'ca_p_ratio') return valDM;
        const f = (1000.0 / Math.max(280, energy100gDM || 385));
        if (row.unit === 'mg/100g DM') {
          // mg/100g DM -> g/1000kcal
          return +((valDM / 1000.0) * f).toFixed(2);
        }
        return +(valDM * f).toFixed(2);
      };

      const unitLabel = (!isKcalMode || row.key === 'ca_p_ratio')
        ? row.unit
        : (row.unit === 'mg/100g DM' ? 'g/1000kcal' : 'g/1000kcal');

      const perFeedCells = row.perFeedValues.map((v, idx) => {
        const cVal = convertVal(v, res.feedVectors[idx]?.energyKcalPer100gDM);
        return `<td>${cVal}</td>`;
      }).join('');

      const mixPoint = isKcalMode && row.key !== 'ca_p_ratio'
        ? (row.unit === 'mg/100g DM' ? +((row.pointEstimate / 1000.0) * kcalFactorMix).toFixed(2) : +(row.pointEstimate * kcalFactorMix).toFixed(2))
        : row.pointEstimate;

      const mixMin = isKcalMode && row.key !== 'ca_p_ratio'
        ? (row.unit === 'mg/100g DM' ? +((row.bandMin / 1000.0) * kcalFactorMix).toFixed(2) : +(row.bandMin * kcalFactorMix).toFixed(2))
        : row.bandMin;

      const mixMax = isKcalMode && row.key !== 'ca_p_ratio'
        ? (row.unit === 'mg/100g DM' ? +((row.bandMax / 1000.0) * kcalFactorMix).toFixed(2) : +(row.bandMax * kcalFactorMix).toFixed(2))
        : row.bandMax;

      const guardMin = isKcalMode && row.key !== 'ca_p_ratio'
        ? (row.unit === 'mg/100g DM' ? +((row.minAllowed / 1000.0) * kcalFactorMix).toFixed(2) : +(row.minAllowed * kcalFactorMix).toFixed(2))
        : row.minAllowed;

      const guardMax = isKcalMode && row.key !== 'ca_p_ratio'
        ? (row.unit === 'mg/100g DM' ? +((row.maxAllowed / 1000.0) * kcalFactorMix).toFixed(2) : +(row.maxAllowed * kcalFactorMix).toFixed(2))
        : row.maxAllowed;

      let badgeHtml = `<span style="background:#dcfce7; color:#15803d; padding:3px 8px; border-radius:999px; font-size:0.75rem; font-weight:800;">🟢 안전 (Optimal)</span>`;
      if (row.status === 'out_of_bounds') {
        badgeHtml = `<span style="background:#fee2e2; color:#b91c1c; padding:3px 8px; border-radius:999px; font-size:0.75rem; font-weight:800;">🔴 기준 이탈 (위험)</span>`;
      } else if (row.status === 'caution_margin') {
        badgeHtml = `<span style="background:#fef9c3; color:#854d0e; padding:3px 8px; border-radius:999px; font-size:0.75rem; font-weight:800;">🟡 오차경계 근접 (주의)</span>`;
      }

      return `
        <tr>
          <td><strong>${row.label}</strong></td>
          ${perFeedCells}
          <td><strong style="color:#2563eb; font-size:0.95rem;">${mixPoint}</strong> <small>${unitLabel}</small></td>
          <td style="font-family:monospace; color:#475569;">[ ${mixMin} ~ ${mixMax} ]</td>
          <td style="font-size:0.8rem; color:#64748b;">${guardMin} ~ ${guardMax} ${unitLabel}</td>
          <td>${badgeHtml}</td>
        </tr>
      `;
    }).join('');
  }

  function renderCharts(res) {
    if (typeof Chart === 'undefined') return;

    const donutCanvas = document.getElementById('s6MultiDonutChart');
    if (donutCanvas) {
      if (state.charts.donut) state.charts.donut.destroy();
      const labels = res.slotSchedules.map(s => `사료 ${s.slotId} (${s.caloriePct}%)`);
      const data = res.slotSchedules.map(s => s.dailyKcal);
      const colors = ['#2563eb', '#7c3aed', '#059669'].slice(0, res.activeFeedCount);

      state.charts.donut = new Chart(donutCanvas.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }

    const barCanvas = document.getElementById('s6MultiBarChart');
    if (barCanvas) {
      if (state.charts.bar) state.charts.bar.destroy();
      const labels = ['조단백(%DM)', '조지방(%DM)', '총섬유 TDF(%DM)', '칼슘(%DMx10)', '인(%DMx10)'];
      const colors = ['#2563eb', '#7c3aed', '#059669'];

      const datasets = res.feedVectors.map((v, i) => ({
        label: `사료 ${v.slotId}`,
        data: [
          v.protein_pct,
          v.fat_pct,
          v.tdf_pct,
          +(v.calcium_mg / 100).toFixed(2),
          +(v.phosphorus_mg / 100).toFixed(2)
        ],
        backgroundColor: colors[i] + '99'
      }));

      datasets.push({
        label: `최종 ${res.activeFeedCount}종 결합`,
        data: [
          res.finalNutrientsDM.protein_pct,
          res.finalNutrientsDM.fat_pct,
          res.finalNutrientsDM.tdf_pct,
          +(res.finalNutrientsDM.calcium_mg / 100).toFixed(2),
          +(res.finalNutrientsDM.phosphorus_mg / 100).toFixed(2)
        ],
        backgroundColor: '#0f172a'
      });

      state.charts.bar = new Chart(barCanvas.getContext('2d'), {
        type: 'bar',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  }

  /**
   * 처방사료데이터(guardian_portal.js & Vet CDSS) STEP 6 연동용 JSON 내보내기 / 클립보드 복사
   */
  function exportGuardianStep6Payload() {
    if (!state.lastResult) recalculateAndRender();
    const payload = state.lastResult.guardianStep6Payload;
    const jsonStr = JSON.stringify(payload, null, 2);

    const modalEl = document.getElementById('s6ExportPayloadModal');
    const preEl = document.getElementById('s6ExportPayloadTextarea');
    if (modalEl && preEl) {
      preEl.value = jsonStr;
      modalEl.style.display = 'flex';
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr);
      alert('처방사료 데이터 STEP 6 연동 JSON 페이로드가 클립보드에 복사되었습니다.');
    }
  }

  return {
    StateSlots: state.slots,
    init,
    syncFromHostEnvironment,
    syncSlotAFromHostDryFood,
    setFeedCount,
    onTopProfileChange,
    autoCalcDERFromWeight,
    loadSlotPreset,
    updateSlotTarget,
    toggleSlotMode,
    addIngredientToSlot,
    removeIngredientFromSlot,
    moveIngredientInSlot,
    parseSlotLabelText,
    onCalorieSliderChange,
    applyOptimalSafeRatio,
    setDisplayUnitMode,
    setInspectSlot,
    recalculateAndRender,
    exportGuardianStep6Payload,
    getState: () => state
  };

})();

if (typeof window !== 'undefined') {
  window.Step6MultiMixController = Step6MultiMixController;
  // 처방사료데이터 guardian_portal.js의 runGuardianReverseTracing 대체 훅
  window.runGuardianReverseTracing = function() {
    Step6MultiMixController.recalculateAndRender();
    return Step6MultiMixController.getState().lastResult?.guardianStep6Payload;
  };
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Step6MultiMixController;
}

