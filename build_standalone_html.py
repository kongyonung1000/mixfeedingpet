"""
Standalone HTML generator.
Embeds prescription diets, guidelines, and JavaScript engine with Supplements & Fecal Kit AI Calibration into a single file.
"""
import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from core.data_loader import get_data_loader
from core.nutrition_rules import DISEASE_GUIDELINES

def generate_standalone_html():
    loader = get_data_loader()
    diets_data = [
        {
            'id': d.id,
            'company': d.company,
            'name': d.name,
            'species': d.species.value,
            'type': d.type,
            'indications': d.indications,
            'protein_sources': d.protein_sources,
            'moisture_percent': d.moisture_percent,
            'nutrients': {
                'protein_g': d.nutrients.protein_g,
                'fat_g': d.nutrients.fat_g,
                'carb_g': d.nutrients.carb_g,
                'fiber_g': d.nutrients.fiber_g,
                'calcium_g': d.nutrients.calcium_g,
                'phosphorus_g': d.nutrients.phosphorus_g,
                'potassium_g': d.nutrients.potassium_g,
                'sodium_g': d.nutrients.sodium_g,
                'magnesium_g': d.nutrients.magnesium_g,
                'copper_mg': d.nutrients.copper_mg,
                'zinc_mg': d.nutrients.zinc_mg,
                'taurine_g': d.nutrients.taurine_g,
                'epa_dha_g': d.nutrients.epa_dha_g,
                'energy_density_kcal_per_kg': d.nutrients.energy_density_kcal_per_kg
            }
        }
        for d in loader.diets
    ]

    supplements_data = [
        {
            'id': s.id,
            'company': s.company,
            'name': s.name,
            'tablet_size': s.tablet_size,
            'indications': s.indications,
            'target_diseases': s.target_diseases,
            'description': s.description,
            'key_ingredients': s.key_ingredients
        }
        for s in loader.supplements
    ]

    diets_json = json.dumps(diets_data, ensure_ascii=False)
    supplements_json = json.dumps(supplements_data, ensure_ascii=False)
    guidelines_json = json.dumps(DISEASE_GUIDELINES, ensure_ascii=False)

    template = """<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>처방사료 복합질환 믹스피딩 추천 & 분변키트 AI 캘리브레이션 시스템</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- FontAwesome CDN -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700;800&display=swap');
        body {
            font-family: 'Pretendard', sans-serif;
            background-color: #f8fafc;
        }
        .tab-btn.active {
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            font-weight: 700;
        }
        .disease-checkbox:checked + label {
            background-color: #eff6ff;
            border-color: #3b82f6;
            color: #1d4ed8;
            font-weight: 600;
        }
        .fecal-kit-card {
            transition: all 0.2s ease;
        }
        .fecal-kit-card:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body class="text-slate-800 antialiased min-h-screen flex flex-col">

    <!-- Header -->
    <header class="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white shadow-lg sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="bg-white text-blue-700 p-2.5 rounded-xl shadow-md flex items-center justify-center">
                    <i class="fa-solid fa-stethoscope text-2xl"></i>
                </div>
                <div>
                    <h1 class="text-xl font-extrabold tracking-tight">처방사료 복합질환 믹스피딩 & 분변키트 AI 캘리브레이션</h1>
                    <p class="text-xs text-blue-100 font-medium">Veterinary Clinical Multi-Morbidity Diet Optimization & Bioavailability Error Tuner</p>
                </div>
            </div>
            <div class="flex items-center space-x-3 text-xs bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-white/20">
                <span><i class="fa-solid fa-database mr-1 text-blue-300"></i> 사료 DB: 건식 67종 / 습식 51종</span>
                <span class="text-white/40">|</span>
                <span><i class="fa-solid fa-pills mr-1 text-emerald-300"></i> 영양제 11종</span>
                <span class="text-white/40">|</span>
                <span><i class="fa-solid fa-vial-virus mr-1 text-amber-300"></i> 분변키트 5대 마커</span>
            </div>
        </div>
    </header>

    <!-- Navigation Tabs -->
    <nav class="bg-white border-b border-slate-200 sticky top-[68px] z-40 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex space-x-8">
                <button onclick="switchTab('profile-tab')" id="btn-profile-tab" class="tab-btn active py-4 px-2 text-sm font-semibold flex items-center space-x-2 border-b-2 border-transparent transition">
                    <i class="fa-solid fa-id-card-clip"></i>
                    <span>1. 환자 신상 & 복합 질환</span>
                </button>
                <button onclick="switchTab('feeding-tab')" id="btn-feeding-tab" class="tab-btn py-4 px-2 text-sm font-semibold text-slate-500 hover:text-slate-700 flex items-center space-x-2 border-b-2 border-transparent transition">
                    <i class="fa-solid fa-bowl-food"></i>
                    <span>2. 최적 믹스피딩 & 맞춤 영양제 조율</span>
                </button>
                <button onclick="switchTab('analytics-tab')" id="btn-analytics-tab" class="tab-btn py-4 px-2 text-sm font-semibold text-slate-500 hover:text-slate-700 flex items-center space-x-2 border-b-2 border-transparent transition">
                    <i class="fa-solid fa-chart-pie"></i>
                    <span>3. 영양소 & 수분 분석 차트</span>
                </button>
                <button onclick="switchTab('monitoring-tab')" id="btn-monitoring-tab" class="tab-btn py-4 px-2 text-sm font-semibold text-slate-500 hover:text-slate-700 flex items-center space-x-2 border-b-2 border-transparent transition">
                    <i class="fa-solid fa-vial-virus"></i>
                    <span>4. 분변키트 AI 캘리브레이션 & 모니터링</span>
                </button>
            </div>
        </div>
    </nav>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        <!-- TAB 1: 환자 신상 및 복합 질환 입력 -->
        <section id="profile-tab" class="tab-content space-y-6">
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                    <div class="flex items-center space-x-3">
                        <span class="w-2.5 h-6 bg-blue-600 rounded-full"></span>
                        <h2 class="text-lg font-bold text-slate-800">환자 기본 신상 정보</h2>
                    </div>
                    <span class="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full">필수 진료 정보</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5">환자 이름</label>
                        <input type="text" id="patient-name" value="밍키" class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5">종 (Species)</label>
                        <select id="patient-species" onchange="onSpeciesChange()" class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                            <option value="개" selected>🐶 반려견 (Dog)</option>
                            <option value="고양이">🐱 반려묘 (Cat)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5">현재 체중 (kg)</label>
                        <input type="number" step="0.1" id="patient-weight" value="6.5" class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-blue-700">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5">나이 (세)</label>
                        <input type="number" step="0.5" id="patient-age" value="11.0" class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5">성별 / 중성화</label>
                        <select id="patient-gender" class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="수컷 (중성화 완료)" selected>수컷 (중성화 완료)</option>
                            <option value="수컷 (중성화 안함)">수컷 (중성화 안함)</option>
                            <option value="암컷 (중성화 완료)">암컷 (중성화 완료)</option>
                            <option value="암컷 (중성화 안함)">암컷 (중성화 안함)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5">품종 (Breed)</label>
                        <input type="text" id="patient-breed" value="시츄" class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                </div>

                <!-- BCS & MCS -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-100">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="text-xs font-bold text-slate-700">BCS (Body Condition Score, 1~9 단계)</label>
                            <span id="bcs-badge" class="text-xs font-extrabold px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">BCS 5 (이상적 정상 체중)</span>
                        </div>
                        <input type="range" id="patient-bcs" min="1" max="9" value="5" step="1" oninput="onBcsChange(this.value)" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600">
                        <div class="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                            <span>1: 극심한 저체중</span>
                            <span>3: 마름</span>
                            <span class="text-blue-600 font-bold">5: 이상적 정상</span>
                            <span>7: 과체중</span>
                            <span class="text-red-500">9: 고도 비만</span>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-2">MCS (Muscle Condition Score, 근감소증 평가)</label>
                        <div class="grid grid-cols-4 gap-2 text-center text-xs">
                            <label class="cursor-pointer">
                                <input type="radio" name="mcs" value="정상 (Normal)" class="hidden peer">
                                <div class="py-2.5 px-1 rounded-xl border border-slate-200 peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 font-semibold transition">정상 (Normal)</div>
                            </label>
                            <label class="cursor-pointer">
                                <input type="radio" name="mcs" value="경도 근감소 (Mild Loss)" checked class="hidden peer">
                                <div class="py-2.5 px-1 rounded-xl border border-slate-200 peer-checked:border-amber-500 peer-checked:bg-amber-50 peer-checked:text-amber-700 font-semibold transition">경도 근감소</div>
                            </label>
                            <label class="cursor-pointer">
                                <input type="radio" name="mcs" value="중등도 근감소 (Moderate Loss)" class="hidden peer">
                                <div class="py-2.5 px-1 rounded-xl border border-slate-200 peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:text-orange-700 font-semibold transition">중등도 근감소</div>
                            </label>
                            <label class="cursor-pointer">
                                <input type="radio" name="mcs" value="중증 근감소 (Severe Loss)" class="hidden peer">
                                <div class="py-2.5 px-1 rounded-xl border border-slate-200 peer-checked:border-red-600 peer-checked:bg-red-50 peer-checked:text-red-700 font-semibold transition">중증 근감소</div>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- 식습관 및 분변 스코어 -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-100 bg-slate-50/70 p-4 rounded-xl">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">식습관 (Eating Habit)</label>
                        <select id="patient-eating-habit" class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="정상" selected>정상 (적절한 속도로 섭취)</option>
                            <option value="급하게 먹음">급하게 먹음 (저작 부족, 흡수율 -3%)</option>
                            <option value="불규칙 급여">불규칙 급여 (소화효소 불균형, -2%)</option>
                        </select>
                    </div>

                    <div class="lg:col-span-2">
                        <div class="flex items-center justify-between mb-1.5">
                            <label class="text-xs font-bold text-slate-700">분변 스코어 (Fecal Score 1.0 ~ 7.0)</label>
                            <span id="fecal-badge" class="text-xs font-bold px-2.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">Score 4.0 (무른 변 / 흡수율 -8%)</span>
                        </div>
                        <input type="range" id="patient-fecal" min="1.0" max="7.0" value="4.0" step="0.5" oninput="onFecalChange(this.value)" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600">
                        <div class="flex justify-between text-[11px] text-slate-400 mt-1">
                            <span>1~2: 단단함/건조</span>
                            <span class="text-emerald-600 font-bold">3~3.5: 정상 변</span>
                            <span>4~4.5: 무른 변</span>
                            <span>5~5.5: 점액/묽은 변</span>
                            <span class="text-red-500">6~7: 설사</span>
                        </div>
                    </div>
                </div>

                <!-- 장벽 초음파 영상 소견 입력 -->
                <div class="mt-6 pt-6 border-t border-slate-100 bg-indigo-50/40 p-4 rounded-xl">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center space-x-2 text-xs font-bold text-indigo-900">
                            <i class="fa-solid fa-wave-square text-indigo-600"></i>
                            <span>장벽 초음파 영상 소견 (Intestinal Wall Ultrasound Findings)</span>
                        </div>
                        <span class="text-[11px] text-indigo-600 font-medium">흡수 면적 및 장벽 손상도 사전 추정</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                            <label class="block font-bold text-slate-600 mb-1">장벽 두께 (mm, 정상 &lt; 3.0mm)</label>
                            <input type="number" step="0.1" id="us-thickness" value="3.6" class="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-600 mb-1">장벽 층화 구조 (Layering)</label>
                            <select id="us-layering" class="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="정상 (Normal)" selected>정상 (5개 층 구조 보존)</option>
                                <option value="부분 소실">부분 소실 (장점막 부종/염증)</option>
                                <option value="완전 소실">완전 소실 (중증 IBD/종양성 손상)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-600 mb-1">점막 고에코성 (Hyperechoic Speckles)</label>
                            <select id="us-hyperechoic" class="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="false" selected>음성 (정상 에코)</option>
                                <option value="true">양성 (림프관 확장/유미즙 정체)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- 알러지 -->
                <div class="mt-6 pt-6 border-t border-slate-100">
                    <label class="block text-xs font-bold text-slate-700 mb-2">알러지 및 식이 금기 단백질원</label>
                    <div class="flex flex-wrap gap-2">
                        <label class="cursor-pointer"><input type="checkbox" name="allergy" value="닭고기" class="hidden peer"><span class="inline-block px-3 py-1.5 text-xs rounded-xl border border-slate-200 peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-600 font-medium transition">닭고기 (Chicken)</span></label>
                        <label class="cursor-pointer"><input type="checkbox" name="allergy" value="소고기" checked class="hidden peer"><span class="inline-block px-3 py-1.5 text-xs rounded-xl border border-slate-200 peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-600 font-medium transition">소고기 (Beef)</span></label>
                        <label class="cursor-pointer"><input type="checkbox" name="allergy" value="오리고기" class="hidden peer"><span class="inline-block px-3 py-1.5 text-xs rounded-xl border border-slate-200 peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-600 font-medium transition">오리고기 (Duck)</span></label>
                        <label class="cursor-pointer"><input type="checkbox" name="allergy" value="양고기" class="hidden peer"><span class="inline-block px-3 py-1.5 text-xs rounded-xl border border-slate-200 peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-600 font-medium transition">양고기 (Lamb)</span></label>
                        <label class="cursor-pointer"><input type="checkbox" name="allergy" value="돼지고기" class="hidden peer"><span class="inline-block px-3 py-1.5 text-xs rounded-xl border border-slate-200 peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-600 font-medium transition">돼지고기 (Pork)</span></label>
                        <label class="cursor-pointer"><input type="checkbox" name="allergy" value="연어" class="hidden peer"><span class="inline-block px-3 py-1.5 text-xs rounded-xl border border-slate-200 peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-600 font-medium transition">연어 / 생선 (Salmon/Fish)</span></label>
                        <label class="cursor-pointer"><input type="checkbox" name="allergy" value="칠면조" class="hidden peer"><span class="inline-block px-3 py-1.5 text-xs rounded-xl border border-slate-200 peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-600 font-medium transition">칠면조 (Turkey)</span></label>
                    </div>
                </div>
            </div>

            <!-- 복합 질환 선택 -->
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <div class="flex items-center space-x-3">
                        <span class="w-2.5 h-6 bg-indigo-600 rounded-full"></span>
                        <h2 class="text-lg font-bold text-slate-800">복합 질환 선택 (Multi-Morbidity Matrix)</h2>
                    </div>
                    <span class="text-xs text-slate-500">질환을 다중 선택하면 영양소 충돌을 자동 해결하고 맞춤 영양제를 페어링합니다.</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                        <input type="checkbox" id="dis-heart" name="disease" value="심장병 (MMVD, DCM, HCM, 울혈성심부전)" checked class="hidden disease-checkbox">
                        <label for="dis-heart" class="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition">
                            <div class="text-rose-500 mt-0.5 text-lg"><i class="fa-solid fa-heart-pulse"></i></div>
                            <div>
                                <div class="text-sm font-bold text-slate-800">심장병 (MMVD / DCM / HCM)</div>
                                <div class="text-xs text-slate-500 mt-0.5">저나트륨, 고품질단백질, 타우린/EPA+DHA</div>
                            </div>
                        </label>
                    </div>

                    <div>
                        <input type="checkbox" id="dis-ckd" name="disease" value="만성신부전 (CKD IRIS 1-4단계)" checked class="hidden disease-checkbox">
                        <label for="dis-ckd" class="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition">
                            <div class="text-amber-500 mt-0.5 text-lg"><i class="fa-solid fa-filter"></i></div>
                            <div>
                                <div class="text-sm font-bold text-slate-800">만성신부전 (CKD IRIS 1~4단계)</div>
                                <div class="text-xs text-slate-500 mt-0.5">저인, 단백질 단계별 조절, 수분 극대화</div>
                            </div>
                        </label>
                    </div>

                    <div>
                        <input type="checkbox" id="dis-pancreas" name="disease" value="췌장염 (급성/만성/지방제한)" class="hidden disease-checkbox">
                        <label for="dis-pancreas" class="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition">
                            <div class="text-orange-500 mt-0.5 text-lg"><i class="fa-solid fa-fire"></i></div>
                            <div>
                                <div class="text-sm font-bold text-slate-800">췌장염 (급성 / 만성)</div>
                                <div class="text-xs text-slate-500 mt-0.5">극저지방 (&lt;10~12% DM), 고소화성 식단</div>
                            </div>
                        </label>
                    </div>

                    <div>
                        <input type="checkbox" id="dis-cushing" name="disease" value="쿠싱 증후군 (부신피질기능항진증)" class="hidden disease-checkbox">
                        <label for="dis-cushing" class="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition">
                            <div class="text-purple-500 mt-0.5 text-lg"><i class="fa-solid fa-dna"></i></div>
                            <div>
                                <div class="text-sm font-bold text-slate-800">쿠싱 증후군 (부신피질항진)</div>
                                <div class="text-xs text-slate-500 mt-0.5">저지방, 근감소 방지 양질단백, 적정 섬유소</div>
                            </div>
                        </label>
                    </div>

                    <div>
                        <input type="checkbox" id="dis-liver" name="disease" value="만성간부전 / 간질환" class="hidden disease-checkbox">
                        <label for="dis-liver" class="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition">
                            <div class="text-yellow-600 mt-0.5 text-lg"><i class="fa-solid fa-shield-virus"></i></div>
                            <div>
                                <div class="text-sm font-bold text-slate-800">만성간부전 / 간질환</div>
                                <div class="text-xs text-slate-500 mt-0.5">구리 엄격 제한, 아연 보충, 비육류 양질단백</div>
                            </div>
                        </label>
                    </div>

                    <div>
                        <input type="checkbox" id="dis-ibd" name="disease" value="염증성장질환 (IBD / 만성장병증)" class="hidden disease-checkbox">
                        <label for="dis-ibd" class="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition">
                            <div class="text-teal-500 mt-0.5 text-lg"><i class="fa-solid fa-bacteria"></i></div>
                            <div>
                                <div class="text-sm font-bold text-slate-800">염증성장질환 (IBD / 만성장염)</div>
                                <div class="text-xs text-slate-500 mt-0.5">가수분해/신규 단백질, 고소화율, 오메가3</div>
                            </div>
                        </label>
                    </div>

                    <div>
                        <input type="checkbox" id="dis-diabetes" name="disease" value="당뇨병 (Diabetes Mellitus)" class="hidden disease-checkbox">
                        <label for="dis-diabetes" class="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition">
                            <div class="text-blue-500 mt-0.5 text-lg"><i class="fa-solid fa-syringe"></i></div>
                            <div>
                                <div class="text-sm font-bold text-slate-800">당뇨병 (Diabetes)</div>
                                <div class="text-xs text-slate-500 mt-0.5">개: 고섬유 복합탄수 / 고양이: 초저탄수화물</div>
                            </div>
                        </label>
                    </div>

                    <div>
                        <input type="checkbox" id="dis-stones" name="disease" value="비뇨기 결석 (스트루바이트 / 칼슘옥살레이트)" class="hidden disease-checkbox">
                        <label for="dis-stones" class="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition">
                            <div class="text-cyan-600 mt-0.5 text-lg"><i class="fa-solid fa-gem"></i></div>
                            <div>
                                <div class="text-sm font-bold text-slate-800">비뇨기 결석 (Struvite/Oxalate)</div>
                                <div class="text-xs text-slate-500 mt-0.5">미네랄 조절, 요비중 희석 습식 급여</div>
                            </div>
                        </label>
                    </div>

                    <div>
                        <input type="checkbox" id="dis-brain" name="disease" value="인지기능장애 (치매 CDS) / 뇌신경" class="hidden disease-checkbox">
                        <label for="dis-brain" class="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition">
                            <div class="text-pink-500 mt-0.5 text-lg"><i class="fa-solid fa-brain"></i></div>
                            <div>
                                <div class="text-sm font-bold text-slate-800">치매 (인지기능장애 CDS)</div>
                                <div class="text-xs text-slate-500 mt-0.5">항산화제(Vit E/C), DHA, MCT 중쇄지방산</div>
                            </div>
                        </label>
                    </div>

                    <div>
                        <input type="checkbox" id="dis-obesity" name="disease" value="비만 및 체중관리" class="hidden disease-checkbox">
                        <label for="dis-obesity" class="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition">
                            <div class="text-indigo-400 mt-0.5 text-lg"><i class="fa-solid fa-weight-scale"></i></div>
                            <div>
                                <div class="text-sm font-bold text-slate-800">비만 및 체중 감량</div>
                                <div class="text-xs text-slate-500 mt-0.5">저칼로리 밀도, 고단백/고섬유 포만감</div>
                            </div>
                        </label>
                    </div>

                    <div>
                        <input type="checkbox" id="dis-oa" name="disease" value="골관절염 / 관절질환" class="hidden disease-checkbox">
                        <label for="dis-oa" class="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition">
                            <div class="text-emerald-500 mt-0.5 text-lg"><i class="fa-solid fa-bone"></i></div>
                            <div>
                                <div class="text-sm font-bold text-slate-800">골관절염 / 관절질환</div>
                                <div class="text-xs text-slate-500 mt-0.5">EPA+DHA 고농도, 글루코사민, 체중관리</div>
                            </div>
                        </label>
                    </div>

                    <div id="cat-hyperthyroid-card" class="hidden">
                        <input type="checkbox" id="dis-hyperthyroid" name="disease" value="갑상선기능항진증 (고양이)" class="hidden disease-checkbox">
                        <label for="dis-hyperthyroid" class="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition">
                            <div class="text-amber-600 mt-0.5 text-lg"><i class="fa-solid fa-bolt"></i></div>
                            <div>
                                <div class="text-sm font-bold text-slate-800">갑상선기능항진증 (고양이)</div>
                                <div class="text-xs text-slate-500 mt-0.5">극저요오드 식단 (&lt;0.32 ppm)</div>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="mt-8 flex justify-end">
                    <button type="button" onclick="runRecommendation()" class="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-3 transition transform active:scale-95">
                        <i class="fa-solid fa-calculator text-lg"></i>
                        <span>최적 믹스피딩 & 맞춤 영양제 계산하기</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </section>

        <!-- TAB 2: 최적 믹스피딩 및 급여량 결과 -->
        <section id="feeding-tab" class="tab-content space-y-6 hidden">
            <!-- Summary Banner -->
            <div class="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
                    <div class="p-2">
                        <div class="text-xs text-slate-400 font-medium">휴지기 에너지 (RER)</div>
                        <div class="text-2xl font-extrabold text-white mt-1"><span id="summary-rer">0</span> <span class="text-xs font-normal text-slate-300">kcal/day</span></div>
                        <div class="text-[11px] text-slate-400 mt-0.5" id="summary-ideal-weight">이상체중: 0 kg</div>
                    </div>
                    <div class="p-2 md:pl-4">
                        <div class="text-xs text-slate-400 font-medium">유지/일일 에너지 (DER)</div>
                        <div class="text-2xl font-extrabold text-sky-400 mt-1"><span id="summary-der">0</span> <span class="text-xs font-normal text-slate-300">kcal/day</span></div>
                        <div class="text-[11px] text-sky-200 mt-0.5" id="summary-der-reason">계수: 1.6</div>
                    </div>
                    <div class="p-2 md:pl-4">
                        <div class="text-xs text-slate-400 font-medium">사전 추정 흡수율 (A Priori)</div>
                        <div class="text-2xl font-extrabold text-emerald-400 mt-1"><span id="summary-absorption">100</span> <span class="text-xs font-normal text-slate-300">%</span></div>
                        <div class="text-[11px] text-emerald-200 mt-0.5" id="summary-fecal-desc">분변 상태: 정상</div>
                    </div>
                    <div class="p-2 md:pl-4">
                        <div class="text-xs text-slate-400 font-medium">흡수율 보정 최종 급여 칼로리</div>
                        <div class="text-2xl font-extrabold text-amber-400 mt-1"><span id="summary-adjusted-der">0</span> <span class="text-xs font-normal text-slate-300">kcal/day</span></div>
                        <div class="text-[11px] text-amber-200 mt-0.5">총 1일 급여량: <span id="summary-total-g" class="font-bold">0</span> g/day</div>
                    </div>
                </div>
            </div>

            <!-- Clinical Conflict Notes Box -->
            <div id="clinical-notes-container" class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl text-xs space-y-1.5 text-amber-900">
                <div class="font-bold flex items-center space-x-2 text-amber-800 text-sm">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <span>수의 임상 영양학적 상충 해결 및 핵심 가이드라인</span>
                </div>
                <div id="clinical-notes-list" class="space-y-1 pl-5 list-disc"></div>
            </div>

            <!-- Mix-Feeding Mode Switcher & Sliders -->
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div class="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 mb-6">
                    <div class="flex items-center space-x-3">
                        <span class="w-2.5 h-6 bg-blue-600 rounded-full"></span>
                        <h2 class="text-lg font-bold text-slate-800">믹스피딩 급여 조합 모드</h2>
                    </div>
                    <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                        <button onclick="setFeedingMode('DRY_WET_FRESH')" id="mode-btn-DRY_WET_FRESH" class="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-blue-600 bg-blue-50 text-blue-700 transition">건식 + 습식 + 화식</button>
                        <button onclick="setFeedingMode('DRY_WET')" id="mode-btn-DRY_WET" class="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition">건식 + 습식</button>
                        <button onclick="setFeedingMode('DRY_DRY')" id="mode-btn-DRY_DRY" class="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition">건식 + 건식</button>
                        <button onclick="setFeedingMode('FRESH_ONLY')" id="mode-btn-FRESH_ONLY" class="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition">화식 단독</button>
                    </div>
                </div>

                <div id="ratio-slider-container" class="space-y-4 mb-6 p-4 bg-slate-50 rounded-xl">
                    <div class="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>칼로리 배분 비율 조정 (슬라이더로 조절 시 g수 실시간 연동)</span>
                        <span id="ratio-status-text" class="text-blue-600">합계: 100%</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="ratio-inputs-grid"></div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="food-cards-grid"></div>
            </div>

            <!-- Therapeutic Supplement Pairing Section (영양제 임상 조율 섹션) -->
            <div class="bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-amber-100/60 rounded-2xl p-6 shadow-sm border border-amber-200">
                <div class="flex flex-wrap items-center justify-between border-b border-amber-200/70 pb-4 mb-4">
                    <div class="flex items-center space-x-3">
                        <span class="p-2 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl shadow-md"><i class="fa-solid fa-pills text-lg"></i></span>
                        <div>
                            <h2 class="text-base font-extrabold text-amber-950">임상 조율 맞춤 영양제 처방 (Therapeutic Supplement Pairing)</h2>
                            <p class="text-xs text-amber-800">처방사료로 미처 충족하기 어려운 특정 질환별 핵심 기능성 성분을 보충하여 치료 시너지를 극대화합니다.</p>
                        </div>
                    </div>
                    <span class="text-xs font-black px-3 py-1 bg-amber-200/80 text-amber-900 border border-amber-300 rounded-full">벳앤펫 처방 영양제 연동</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="supplement-cards-grid">
                    <!-- Dynamic Supplement Cards -->
                </div>
            </div>

            <!-- Water Intake Section -->
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <div class="flex items-center space-x-3">
                        <span class="w-2.5 h-6 bg-cyan-500 rounded-full"></span>
                        <h2 class="text-lg font-bold text-slate-800">일일 수분 섭취량 목표 및 음수량 처방</h2>
                    </div>
                    <span class="text-xs font-bold text-cyan-600 px-3 py-1 bg-cyan-50 rounded-full">Water Balance</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div class="space-y-2">
                        <div class="text-xs text-slate-500 font-medium">1일 총 목표 수분 요구량</div>
                        <div class="text-3xl font-extrabold text-cyan-700"><span id="water-target-ml">0</span> <span class="text-sm font-normal text-slate-500">ml/day</span></div>
                        <div class="text-xs text-slate-400">환자 체중 및 질환(신부전/결석/심장) 보정치</div>
                    </div>

                    <div class="space-y-2">
                        <div class="text-xs text-slate-500 font-medium">사료(건식/습식/화식)로부터 섭취 수분</div>
                        <div class="text-3xl font-extrabold text-blue-600"><span id="water-from-diet-ml">0</span> <span class="text-sm font-normal text-slate-500">ml/day</span></div>
                        <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div id="water-coverage-bar" class="bg-blue-500 h-3 rounded-full" style="width: 0%"></div>
                        </div>
                        <div class="text-xs text-slate-400 text-right">사료 수분 충족률: <span id="water-coverage-pct">0</span>%</div>
                    </div>

                    <div class="p-4 bg-sky-50 border border-sky-100 rounded-2xl space-y-1">
                        <div class="text-xs font-bold text-sky-800">추가 필수 권장 음수량 (순수 물)</div>
                        <div class="text-2xl font-black text-sky-600"><span id="water-extra-needed-ml">0</span> <span class="text-xs font-semibold">ml/day</span></div>
                        <p class="text-[11px] text-sky-700 mt-1">종이컵(200ml) 기준 약 <strong id="water-cups-needed">0</strong> 컵을 별도 급수해 주세요.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- TAB 3: 영양소 비율 및 차트 분석 -->
        <section id="analytics-tab" class="tab-content space-y-6 hidden">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- PFC Donut Chart -->
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
                    <div class="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                        <h3 class="text-sm font-bold text-slate-800">PFC 대사 에너지(ME) 비율</h3>
                        <span class="text-[11px] text-slate-400">단백질 : 지방 : 탄수화물</span>
                    </div>
                    <div class="flex-1 flex items-center justify-center p-2 min-h-[220px]">
                        <canvas id="pfcChart"></canvas>
                    </div>
                    <div class="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
                        <div class="p-2 bg-blue-50 rounded-xl">
                            <div class="text-slate-500">단백질 (P)</div>
                            <div class="font-bold text-blue-700" id="chart-p-pct">0%</div>
                        </div>
                        <div class="p-2 bg-amber-50 rounded-xl">
                            <div class="text-slate-500">지방 (F)</div>
                            <div class="font-bold text-amber-700" id="chart-f-pct">0%</div>
                        </div>
                        <div class="p-2 bg-emerald-50 rounded-xl">
                            <div class="text-slate-500">탄수화물 (C)</div>
                            <div class="font-bold text-emerald-700" id="chart-c-pct">0%</div>
                        </div>
                    </div>
                </div>

                <!-- Compliance Table -->
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 lg:col-span-2 flex flex-col">
                    <div class="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                        <h3 class="text-sm font-bold text-slate-800">핵심 임상 영양소 가이드라인 적합성 판정 (Per 1000 kcal)</h3>
                        <span class="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Clinical Compliance</span>
                    </div>
                    <div class="flex-1 overflow-x-auto">
                        <table class="w-full text-xs text-left">
                            <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                <tr>
                                    <th class="py-2.5 px-3">영양소</th>
                                    <th class="py-2.5 px-3">혼합 사료 함량</th>
                                    <th class="py-2.5 px-3">질환 임상 가이드라인</th>
                                    <th class="py-2.5 px-3 text-center">적합성 판정</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100" id="compliance-table-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Bar Chart -->
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div class="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                    <h3 class="text-sm font-bold text-slate-800">영양소 함량 상세 비교 그래프 (Per 1000 kcal)</h3>
                    <span class="text-xs text-slate-400">단백질, 지방, 인(P), 나트륨(Na), 칼륨(K), EPA+DHA</span>
                </div>
                <div class="h-80">
                    <canvas id="nutrientsBarChart"></canvas>
                </div>
            </div>
        </section>

        <!-- TAB 4: 분변키트 5대 POCT 마커 AI 캘리브레이션 & 혈액검사 피드백 -->
        <section id="monitoring-tab" class="tab-content space-y-6 hidden">
            
            <!-- Fecal Kit 5-Marker POCT Calibration Panel -->
            <div class="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/30">
                <div class="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 mb-6">
                    <div class="flex items-center space-x-3">
                        <span class="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 rounded-xl shadow-lg font-black"><i class="fa-solid fa-vial-virus text-xl"></i></span>
                        <div>
                            <h2 class="text-lg font-black text-white">분변 키트 5대 비색 마커 POCT 실측 & AI 캘리브레이션 튜너</h2>
                            <p class="text-xs text-indigo-200">사전 추정치(A Priori)와 분변 비색 검사 결과를 대조하여 실제 사료 이용률과 흡수율 오차를 보정합니다.</p>
                        </div>
                    </div>
                    <span class="text-xs font-extrabold px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full">Digital Biomarker Validation</span>
                </div>

                <!-- 5 Colorimetric Markers Input Grid -->
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <!-- Marker 1: pH -->
                    <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 fecal-kit-card flex flex-col justify-between">
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-extrabold text-amber-300">① 분변 pH</span>
                                <span id="badge-kit-ph" class="text-[11px] font-bold px-2 py-0.5 bg-blue-500/30 text-blue-200 rounded-md">pH 6.8</span>
                            </div>
                            <p class="text-[11px] text-slate-300 mb-2">탄수화물 과발효(&lt;6.0) vs 단백부패(&gt;7.5)</p>
                        </div>
                        <div>
                            <input type="range" id="kit-ph" min="5.0" max="8.5" step="0.1" value="6.8" oninput="document.getElementById('badge-kit-ph').innerText = 'pH ' + this.value" class="w-full h-1.5 bg-white/20 rounded-lg accent-amber-400 cursor-pointer">
                            <div class="flex justify-between text-[10px] text-slate-400 mt-1">
                                <span>5.0 (산성)</span>
                                <span>6.8 (정상)</span>
                                <span>8.5 (알칼리)</span>
                            </div>
                        </div>
                    </div>

                    <!-- Marker 2: Ammonia -->
                    <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 fecal-kit-card flex flex-col justify-between">
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-extrabold text-sky-300">② 암모니아/질소</span>
                                <i class="fa-solid fa-droplet text-sky-400"></i>
                            </div>
                            <p class="text-[11px] text-slate-300 mb-2">단백질 소장 미소화 잔류량 검증</p>
                        </div>
                        <select id="kit-ammonia" class="w-full text-xs bg-slate-800/90 text-white px-2.5 py-2 rounded-xl border border-white/20 outline-none focus:border-sky-400">
                            <option value="정상" selected>정상 (미소화 유실 없음)</option>
                            <option value="주의(경도)">주의 (소화한계 근접)</option>
                            <option value="높음(중등도)">높음 (단백질 흡수 불량)</option>
                            <option value="매우 높음(고농도)">매우 높음 (단백 과다 유실)</option>
                        </select>
                    </div>

                    <!-- Marker 3: Fecal Fat -->
                    <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 fecal-kit-card flex flex-col justify-between">
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-extrabold text-yellow-300">③ 중성지방(지방변)</span>
                                <i class="fa-solid fa-cheese text-yellow-400"></i>
                            </div>
                            <p class="text-[11px] text-slate-300 mb-2">지방 흡수율(Steatorrhea) & 췌장기능</p>
                        </div>
                        <select id="kit-fat" class="w-full text-xs bg-slate-800/90 text-white px-2.5 py-2 rounded-xl border border-white/20 outline-none focus:border-yellow-400">
                            <option value="음성 (0)" selected>음성 (0, 정상 흡수)</option>
                            <option value="약양성 (1+)">약양성 (1+, 경미한 유실)</option>
                            <option value="중등도 (2+)">중등도 (2+, 지방변 확인)</option>
                            <option value="강양성 (3+)">강양성 (3+, 췌장효소 결핍)</option>
                        </select>
                    </div>

                    <!-- Marker 4: Occult Blood -->
                    <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 fecal-kit-card flex flex-col justify-between">
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-extrabold text-rose-300">④ 잠혈/상피자극</span>
                                <i class="fa-solid fa-biohazard text-rose-400"></i>
                            </div>
                            <p class="text-[11px] text-slate-300 mb-2">장벽 융모 손상 & 장관 투과성</p>
                        </div>
                        <select id="kit-blood" class="w-full text-xs bg-slate-800/90 text-white px-2.5 py-2 rounded-xl border border-white/20 outline-none focus:border-rose-400">
                            <option value="음성 (-)" selected>음성 (-, 장벽 온전)</option>
                            <option value="양성 (+)">양성 (+, 점막 미세출혈)</option>
                            <option value="강양성 (++)">강양성 (++, 중증 장벽 손상)</option>
                        </select>
                    </div>

                    <!-- Marker 5: Fecal Phosphate -->
                    <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 fecal-kit-card flex flex-col justify-between">
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-extrabold text-emerald-300">⑤ 분변 인/칼슘</span>
                                <i class="fa-solid fa-link text-emerald-400"></i>
                            </div>
                            <p class="text-[11px] text-slate-300 mb-2">장내 인 결합 배출 vs 체내 축적</p>
                        </div>
                        <select id="kit-phosphate" class="w-full text-xs bg-slate-800/90 text-white px-2.5 py-2 rounded-xl border border-white/20 outline-none focus:border-emerald-400">
                            <option value="낮음 (Low - 체내 흡수 위험)">낮음 (인 결합 부족 / 체내 흡수)</option>
                            <option value="보통 (Normal)" selected>보통 (적정 배출)</option>
                            <option value="높음 (High - 장내 배출 양호)">높음 (장내 결합 배설 원활)</option>
                        </select>
                    </div>
                </div>

                <!-- Execute Button -->
                <div class="mt-6 flex justify-end">
                    <button type="button" onclick="runFecalKitCalibration()" class="px-8 py-3.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-500 hover:to-rose-600 text-slate-950 font-black rounded-xl text-sm shadow-xl flex items-center space-x-2 transition transform active:scale-95">
                        <i class="fa-solid fa-sliders text-base"></i>
                        <span>분변 키트 실측치 기반 AI 오차 보정(Calibration) 실행</span>
                    </button>
                </div>

                <!-- Calibration Output Report Card -->
                <div id="calibration-report-container" class="mt-6 p-6 bg-white/95 text-slate-900 rounded-2xl border border-amber-300 shadow-2xl space-y-6 hidden">
                    <div class="flex items-center justify-between border-b border-slate-200 pb-4">
                        <div class="flex items-center space-x-2">
                            <span class="w-2.5 h-6 bg-amber-500 rounded-full"></span>
                            <h3 class="text-base font-extrabold text-slate-900">AI 캘리브레이션 오차 보정 리포트 (Calibration Result)</h3>
                        </div>
                        <span id="cal-phos-risk-badge" class="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">인 축적 위험도 평가중</span>
                    </div>

                    <!-- Comparison Grid -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                            <div class="text-xs text-slate-500 font-bold">단백질 흡수율 보정</div>
                            <div class="text-lg font-black mt-1">
                                <span id="cal-prot-prior" class="text-slate-400 line-through">82%</span>
                                <span class="text-slate-400 mx-1">➔</span>
                                <span id="cal-prot-after" class="text-blue-700 text-xl font-black">71%</span>
                            </div>
                            <div class="text-[11px] text-slate-400 mt-0.5">암모니아/pH 실측 반영</div>
                        </div>

                        <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                            <div class="text-xs text-slate-500 font-bold">지방 흡수율 보정</div>
                            <div class="text-lg font-black mt-1">
                                <span id="cal-fat-prior" class="text-slate-400 line-through">90%</span>
                                <span class="text-slate-400 mx-1">➔</span>
                                <span id="cal-fat-after" class="text-amber-700 text-xl font-black">80%</span>
                            </div>
                            <div class="text-[11px] text-slate-400 mt-0.5">지방변(Steatorrhea) 반영</div>
                        </div>

                        <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                            <div class="text-xs text-slate-500 font-bold">총 대사 이용률 보정</div>
                            <div class="text-lg font-black mt-1">
                                <span id="cal-overall-prior" class="text-slate-400 line-through">85%</span>
                                <span class="text-slate-400 mx-1">➔</span>
                                <span id="cal-overall-after" class="text-emerald-700 text-xl font-black">77%</span>
                            </div>
                            <div class="text-[11px] text-slate-400 mt-0.5">실제 대사 효율 확정</div>
                        </div>

                        <div class="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                            <div class="text-xs text-amber-900 font-bold">최종 급여량(g) 재계산</div>
                            <div class="text-lg font-black text-amber-800 mt-1">
                                <span id="cal-der-after">0</span> kcal/day
                            </div>
                            <div class="text-xs font-bold text-amber-950 mt-0.5">
                                총 1일 급여: <strong id="cal-total-g-after" class="text-blue-700">0</strong> g/day
                            </div>
                        </div>
                    </div>

                    <!-- Tuning Log Details -->
                    <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div class="font-bold text-slate-800 flex items-center space-x-1.5">
                            <i class="fa-solid fa-list-check text-blue-600"></i>
                            <span>마커별 세부 오차 튜닝 로그</span>
                        </div>
                        <div id="cal-tuning-log-list" class="space-y-1.5 pl-2"></div>
                    </div>

                    <!-- Clinical Actions Recommended -->
                    <div class="bg-blue-50/80 p-4 rounded-xl border border-blue-200 space-y-2 text-xs">
                        <div class="font-bold text-blue-900 flex items-center space-x-1.5">
                            <i class="fa-solid fa-prescription-bottle-medical text-blue-600"></i>
                            <span>임상 조치 및 사료 믹스피딩 재조정 가이드</span>
                        </div>
                        <div id="cal-clinical-actions-list" class="space-y-1 pl-2 text-blue-950 font-medium"></div>
                    </div>
                </div>
            </div>

            <!-- Blood Lab Test Panel -->
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <div class="flex items-center space-x-3">
                        <span class="w-2.5 h-6 bg-red-600 rounded-full"></span>
                        <h2 class="text-lg font-bold text-slate-800">혈액 검사(Lab Test) 결과 연동 & 급여 피드백</h2>
                    </div>
                    <span class="text-xs text-slate-400">검사 수치를 입력하면 영양학적 위험도와 조치 가이드를 제공합니다.</span>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    <div>
                        <label class="block text-[11px] font-bold text-slate-600 mb-1">BUN (mg/dL)</label>
                        <input type="number" step="0.1" id="lab-bun" value="58.0" placeholder="7-27" class="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 outline-none">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-600 mb-1">Creatinine</label>
                        <input type="number" step="0.1" id="lab-cr" value="2.8" placeholder="0.5-1.4" class="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 outline-none">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-600 mb-1">SDMA (ug/dL)</label>
                        <input type="number" step="0.1" id="lab-sdma" value="24.0" placeholder="<14" class="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 outline-none">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-600 mb-1">Phosphorus (P)</label>
                        <input type="number" step="0.1" id="lab-p" value="6.4" placeholder="2.5-5.5" class="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 outline-none">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-600 mb-1">Albumin (g/dL)</label>
                        <input type="number" step="0.1" id="lab-alb" value="2.6" placeholder="2.5-4.0" class="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 outline-none">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-600 mb-1">cPL / Lipase</label>
                        <input type="number" step="1" id="lab-cpl" placeholder="<200" class="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 outline-none">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-600 mb-1">ALT (U/L)</label>
                        <input type="number" step="1" id="lab-alt" placeholder="10-100" class="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 outline-none">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-600 mb-1">Potassium (K)</label>
                        <input type="number" step="0.1" id="lab-k" placeholder="3.5-5.5" class="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 outline-none">
                    </div>
                </div>

                <div class="mt-4 flex justify-end">
                    <button type="button" onclick="evaluateLabTest()" class="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-2">
                        <i class="fa-solid fa-vial"></i>
                        <span>혈액검사 피드백 분석 실행</span>
                    </button>
                </div>

                <div id="lab-feedback-container" class="mt-4 p-4 rounded-xl text-xs hidden"></div>
            </div>

            <!-- Symptom Log Entry Form -->
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <div class="flex items-center space-x-3">
                        <span class="w-2.5 h-6 bg-rose-500 rounded-full"></span>
                        <h2 class="text-lg font-bold text-slate-800">보호자 일일 증상 모니터링 기록</h2>
                    </div>
                    <span class="text-xs text-slate-500">설사, 구토, 잔여 식사량, 체중을 추적 관찰합니다.</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">체중 (kg)</label>
                        <input type="number" step="0.1" id="log-weight" value="6.4" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">분변 스코어 (1~7)</label>
                        <select id="log-fecal" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white outline-none">
                            <option value="1">1 (딱딱함)</option>
                            <option value="2">2 (단단함)</option>
                            <option value="3.5">3.5 (정상변)</option>
                            <option value="4.0" selected>4.0 (무른변)</option>
                            <option value="5.5">5.5 (매우묽음)</option>
                            <option value="6.5">6.5 (설사)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">구토 횟수 (회/일)</label>
                        <input type="number" id="log-vomit" value="0" min="0" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">잔여 식사량 (%)</label>
                        <select id="log-leftover" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white outline-none">
                            <option value="0" selected>0% (전부 다 먹음)</option>
                            <option value="20">20% (조금 남김)</option>
                            <option value="50">50% (절반 남김)</option>
                            <option value="80">80% (거의 안먹음)</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <button type="button" onclick="submitSymptomLog()" class="w-full py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2">
                            <i class="fa-solid fa-plus"></i>
                            <span>기록 추가 및 평가</span>
                        </button>
                    </div>
                </div>

                <div id="symptom-alert-box" class="mt-4 p-4 rounded-xl text-xs hidden"></div>
            </div>
        </section>

    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>© 2026 Veterinary Clinical Prescription Diet & Mix-Feeding Algorithm Platform. All Rights Reserved.</p>
    </footer>

    <!-- Embedded Pure JavaScript Engine with Bayesian Fecal Kit Calibration -->
    <script>
        const EMBEDDED_DIETS = __DIETS_JSON__;
        const EMBEDDED_SUPPLEMENTS = __SUPPLEMENTS_JSON__;
        const EMBEDDED_GUIDELINES = __GUIDELINES_JSON__;

        let currentFeedingMode = "DRY_WET_FRESH";
        let currentCustomRatios = { dry: 50, wet: 30, fresh: 20 };
        let pfcChartInstance = null;
        let nutrientsBarChartInstance = null;
        let symptomLogsHistory = [];

        let currentPriorBioavailability = {
            prior_protein_absorb_pct: 82.0,
            prior_fat_absorb_pct: 90.0,
            prior_carb_absorb_pct: 95.0,
            prior_overall_absorb_pct: 85.0,
            gut_barrier_intact_pct: 90.0
        };
        let currentBaseDerKcal = 350.0;
        let currentBaseTotalG = 200.0;

        function switchTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.tab-btn').forEach(el => {
                el.classList.remove('active', 'text-blue-600', 'border-blue-600');
                el.classList.add('text-slate-500');
            });

            const activeTab = document.getElementById(tabId);
            if (activeTab) activeTab.classList.remove('hidden');

            const activeBtn = document.getElementById(`btn-${tabId}`);
            if (activeBtn) {
                activeBtn.classList.add('active', 'text-blue-600', 'border-blue-600');
                activeBtn.classList.remove('text-slate-500');
            }
        }

        function onBcsChange(val) {
            const badge = document.getElementById('bcs-badge');
            const v = parseInt(val);
            const textMap = {
                1: "BCS 1 (극심한 저체중/기아)",
                2: "BCS 2 (매우 마름)",
                3: "BCS 3 (마른 체형)",
                4: "BCS 4 (약간 마름)",
                5: "BCS 5 (이상적 정상 체중)",
                6: "BCS 6 (경도 과체중)",
                7: "BCS 7 (중등도 과체중)",
                8: "BCS 8 (비만)",
                9: "BCS 9 (고도 비만)"
            };
            badge.innerText = textMap[v] || `BCS ${v}`;
            badge.className = v < 4 ? "text-xs font-extrabold px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full" : (v <= 5 ? "text-xs font-extrabold px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full" : "text-xs font-extrabold px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full");
        }

        function onFecalChange(val) {
            const badge = document.getElementById('fecal-badge');
            const v = parseFloat(val);
            if (v <= 2.0) { badge.innerText = `Score ${v} (단단함/건조)`; badge.className = "text-xs font-bold px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full"; }
            else if (v <= 3.5) { badge.innerText = `Score ${v} (이상적 정상 분변)`; badge.className = "text-xs font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full"; }
            else if (v <= 4.5) { badge.innerText = `Score ${v} (무른 변 / 흡수율 -8%)`; badge.className = "text-xs font-bold px-2.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-full"; }
            else if (v <= 5.5) { badge.innerText = `Score ${v} (매우 묽은 변 / 흡수율 -15%)`; badge.className = "text-xs font-bold px-2.5 py-0.5 bg-orange-100 text-orange-800 rounded-full"; }
            else { badge.innerText = `Score ${v} (설사/수양성 / 흡수율 -25%)`; badge.className = "text-xs font-bold px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full"; }
        }

        function onSpeciesChange() {
            const sp = document.getElementById('patient-species').value;
            const catCard = document.getElementById('cat-hyperthyroid-card');
            if (sp === '고양이') {
                catCard.classList.remove('hidden');
            } else {
                catCard.classList.add('hidden');
                document.getElementById('dis-hyperthyroid').checked = false;
            }
        }

        function setFeedingMode(mode) {
            currentFeedingMode = mode;
            ["DRY_WET_FRESH", "DRY_WET", "DRY_DRY", "FRESH_ONLY"].forEach(m => {
                const btn = document.getElementById(`mode-btn-${m}`);
                btn.className = m === mode ? "px-3.5 py-1.5 text-xs font-bold rounded-xl border border-blue-600 bg-blue-50 text-blue-700 transition" : "px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition";
            });

            if (mode === "DRY_WET_FRESH") currentCustomRatios = { dry: 50, wet: 30, fresh: 20 };
            else if (mode === "DRY_WET") currentCustomRatios = { dry: 60, wet: 40 };
            else if (mode === "DRY_DRY") currentCustomRatios = { dry1: 50, dry2: 50 };
            else if (mode === "FRESH_ONLY") currentCustomRatios = { fresh: 100 };

            renderRatioSliders();
            runRecommendation(false);
        }

        function renderRatioSliders() {
            const container = document.getElementById('ratio-inputs-grid');
            container.innerHTML = '';

            if (currentFeedingMode === "DRY_WET_FRESH") {
                container.innerHTML = `
                    <div>
                        <div class="flex justify-between text-xs mb-1"><span class="font-bold text-blue-700">건식 사료</span><span id="slider-val-dry" class="font-extrabold">${currentCustomRatios.dry || 50}%</span></div>
                        <input type="range" min="0" max="100" value="${currentCustomRatios.dry || 50}" oninput="onRatioChange('dry', this.value)" class="w-full h-2 bg-blue-100 rounded-lg accent-blue-600">
                    </div>
                    <div>
                        <div class="flex justify-between text-xs mb-1"><span class="font-bold text-sky-700">습식 사료</span><span id="slider-val-wet" class="font-extrabold">${currentCustomRatios.wet || 30}%</span></div>
                        <input type="range" min="0" max="100" value="${currentCustomRatios.wet || 30}" oninput="onRatioChange('wet', this.value)" class="w-full h-2 bg-sky-100 rounded-lg accent-sky-600">
                    </div>
                    <div>
                        <div class="flex justify-between text-xs mb-1"><span class="font-bold text-amber-700">맞춤 화식</span><span id="slider-val-fresh" class="font-extrabold">${currentCustomRatios.fresh || 20}%</span></div>
                        <input type="range" min="0" max="100" value="${currentCustomRatios.fresh || 20}" oninput="onRatioChange('fresh', this.value)" class="w-full h-2 bg-amber-100 rounded-lg accent-amber-600">
                    </div>
                `;
            } else if (currentFeedingMode === "DRY_WET") {
                container.innerHTML = `
                    <div>
                        <div class="flex justify-between text-xs mb-1"><span class="font-bold text-blue-700">건식 사료</span><span id="slider-val-dry" class="font-extrabold">${currentCustomRatios.dry || 60}%</span></div>
                        <input type="range" min="0" max="100" value="${currentCustomRatios.dry || 60}" oninput="onRatioChange('dry', this.value)" class="w-full h-2 bg-blue-100 rounded-lg accent-blue-600">
                    </div>
                    <div>
                        <div class="flex justify-between text-xs mb-1"><span class="font-bold text-sky-700">습식 사료</span><span id="slider-val-wet" class="font-extrabold">${currentCustomRatios.wet || 40}%</span></div>
                        <input type="range" min="0" max="100" value="${currentCustomRatios.wet || 40}" oninput="onRatioChange('wet', this.value)" class="w-full h-2 bg-sky-100 rounded-lg accent-sky-600">
                    </div>
                `;
            } else if (currentFeedingMode === "DRY_DRY") {
                container.innerHTML = `
                    <div>
                        <div class="flex justify-between text-xs mb-1"><span class="font-bold text-blue-700">처방건식 1</span><span id="slider-val-dry1" class="font-extrabold">${currentCustomRatios.dry1 || 50}%</span></div>
                        <input type="range" min="0" max="100" value="${currentCustomRatios.dry1 || 50}" oninput="onRatioChange('dry1', this.value)" class="w-full h-2 bg-blue-100 rounded-lg accent-blue-600">
                    </div>
                    <div>
                        <div class="flex justify-between text-xs mb-1"><span class="font-bold text-indigo-700">처방건식 2</span><span id="slider-val-dry2" class="font-extrabold">${currentCustomRatios.dry2 || 50}%</span></div>
                        <input type="range" min="0" max="100" value="${currentCustomRatios.dry2 || 50}" oninput="onRatioChange('dry2', this.value)" class="w-full h-2 bg-indigo-100 rounded-lg accent-indigo-600">
                    </div>
                `;
            } else {
                container.innerHTML = `<div class="text-xs text-amber-700 font-medium col-span-3">화식 100% 단독 급여 모드입니다.</div>`;
            }
        }

        function onRatioChange(key, val) {
            currentCustomRatios[key] = parseFloat(val);
            const label = document.getElementById(`slider-val-${key}`);
            if (label) label.innerText = `${val}%`;
            clearTimeout(window._ratioTimer);
            window._ratioTimer = setTimeout(() => { runRecommendation(false); }, 200);
        }

        // Multimodal A Priori & Recommendation Engine
        function runRecommendation(shouldSwitchTab = true) {
            const name = document.getElementById('patient-name').value;
            const species = document.getElementById('patient-species').value;
            const weight_kg = parseFloat(document.getElementById('patient-weight').value) || 5.0;
            const age_years = parseFloat(document.getElementById('patient-age').value) || 5.0;
            const gender = document.getElementById('patient-gender').value;
            const breed = document.getElementById('patient-breed').value;
            const bcs = parseInt(document.getElementById('patient-bcs').value) || 5;
            
            const mcsEl = document.querySelector('input[name="mcs"]:checked');
            const mcs = mcsEl ? mcsEl.value : "정상 (Normal)";
            const eating_habit = document.getElementById('patient-eating-habit').value;
            const fecal_score = parseFloat(document.getElementById('patient-fecal').value) || 3.5;

            // Ultrasound Findings
            const us_thick = parseFloat(document.getElementById('us-thickness').value) || 2.5;
            const us_layer = document.getElementById('us-layering').value;
            const us_hyper = document.getElementById('us-hyperechoic').value === "true";

            // Blood Lab
            const lab_bun = parseFloat(document.getElementById('lab-bun').value) || null;
            const lab_cr = parseFloat(document.getElementById('lab-cr').value) || null;
            const lab_sdma = parseFloat(document.getElementById('lab-sdma').value) || null;
            const lab_p = parseFloat(document.getElementById('lab-p').value) || null;
            const lab_alb = parseFloat(document.getElementById('lab-alb').value) || null;

            const allergies = [];
            document.querySelectorAll('input[name="allergy"]:checked').forEach(el => allergies.push(el.value));
            const diseases = [];
            document.querySelectorAll('input[name="disease"]:checked').forEach(el => diseases.push(el.value));

            // 1. Energy
            const rer = Math.round(70.0 * Math.pow(weight_kg, 0.75) * 10) / 10;
            const ideal_weight_kg = Math.round((weight_kg / (1.0 + (bcs - 5) * 0.10)) * 100) / 100;
            
            let der_factor = 1.6;
            let der_factor_reason = "중성화 성견";
            const is_dog = species === "개";

            if (age_years < 1.0) { der_factor = 2.0; der_factor_reason = "성장기"; }
            else if (bcs >= 7) { der_factor = is_dog ? 1.0 : 0.8; der_factor_reason = `체중 감량 (BCS ${bcs})`; }
            else if (bcs === 6) { der_factor = is_dog ? 1.2 : 1.0; der_factor_reason = `과체중 관리 (BCS ${bcs})`; }
            else if ((is_dog && age_years >= 7) || (!is_dog && age_years >= 11)) { der_factor = is_dog ? 1.4 : 1.1; der_factor_reason = "노령기 유지"; }
            else {
                der_factor = is_dog ? (gender.includes("완료") ? 1.6 : 1.8) : (gender.includes("완료") ? 1.2 : 1.4);
                der_factor_reason = gender.includes("완료") ? (is_dog ? "중성화 성견" : "중성화 성묘") : (is_dog ? "비중성화 성견" : "비중성화 성묘");
            }

            const target_rer = bcs >= 7 ? Math.round(70.0 * Math.pow(ideal_weight_kg, 0.75) * 10) / 10 : rer;
            const der_kcal = Math.round(target_rer * der_factor * 10) / 10;

            // 2. Multimodal Bioavailability Prior Model
            let prot_rate = 0.88, fat_rate = 0.92, carb_rate = 0.95, overall_rate = 1.00, barrier = 100.0;
            const dis_str = diseases.join(" ");

            if (eating_habit === "급하게 먹음") { overall_rate -= 0.03; prot_rate -= 0.02; }
            if (fecal_score >= 6.0) { overall_rate -= 0.20; prot_rate -= 0.15; fat_rate -= 0.15; barrier -= 20; }
            else if (fecal_score >= 5.0) { overall_rate -= 0.12; prot_rate -= 0.08; fat_rate -= 0.10; barrier -= 10; }
            else if (fecal_score >= 4.0) { overall_rate -= 0.06; prot_rate -= 0.04; fat_rate -= 0.05; }

            if (dis_str.includes("IBD") || dis_str.includes("장염")) { overall_rate -= 0.15; prot_rate -= 0.12; fat_rate -= 0.10; barrier -= 25; }
            if (dis_str.includes("췌장")) { overall_rate -= 0.15; fat_rate -= 0.20; prot_rate -= 0.08; }
            if (dis_str.includes("간")) { overall_rate -= 0.08; fat_rate -= 0.12; }
            if (dis_str.includes("신부전")) { overall_rate -= 0.05; prot_rate -= 0.05; }

            // Ultrasound effect
            if (us_thick >= 3.5) { const d = (us_thick - 3.0) * 0.05; overall_rate -= d; prot_rate -= d; barrier -= 15; }
            if (us_layer.includes("소실")) { overall_rate -= 0.10; barrier -= 25; }
            if (us_hyper) { fat_rate -= 0.10; prot_rate -= 0.08; barrier -= 15; }

            // Lab effect
            if (lab_alb && lab_alb < 2.5) { prot_rate -= 0.10; overall_rate -= 0.08; barrier -= 20; }

            overall_rate = Math.max(0.50, Math.min(1.00, Math.round(overall_rate * 100) / 100));
            prot_rate = Math.max(0.40, Math.min(0.95, Math.round(prot_rate * 100) / 100));
            fat_rate = Math.max(0.40, Math.min(0.98, Math.round(fat_rate * 100) / 100));
            carb_rate = Math.max(0.50, Math.min(0.99, Math.round(carb_rate * 100) / 100));

            currentPriorBioavailability = {
                prior_protein_absorb_pct: Math.round(prot_rate * 100),
                prior_fat_absorb_pct: Math.round(fat_rate * 100),
                prior_carb_absorb_pct: Math.round(carb_rate * 100),
                prior_overall_absorb_pct: Math.round(overall_rate * 100),
                gut_barrier_intact_pct: Math.round(barrier)
            };

            currentBaseDerKcal = der_kcal;
            const adjusted_der_kcal = Math.round((der_kcal / overall_rate) * 10) / 10;

            // 3. Nutrition Constraints & Conflict Resolution
            let p_max = null, na_max = null, fat_max = null, cu_max = null, p_min_prot = null, p_max_prot = null, epa_min = null;
            const clinical_notes = [];

            diseases.forEach(d => {
                if (d.includes("심장")) { na_max = Math.min(na_max || 0.8, 0.8); p_min_prot = Math.max(p_min_prot || (is_dog ? 45 : 65), is_dog ? 45 : 65); epa_min = Math.max(epa_min || 1.0, 1.0); clinical_notes.push("[심장병] 나트륨 엄격 제한 (<0.8g/1000kcal), 고품질 단백질 및 타우린/EPA+DHA 강화"); }
                if (d.includes("신부전")) { p_max = Math.min(p_max || (is_dog ? 0.8 : 0.9), is_dog ? 0.8 : 0.9); p_max_prot = Math.min(p_max_prot || (is_dog ? 55 : 75), is_dog ? 55 : 75); na_max = Math.min(na_max || (is_dog ? 0.9 : 1.0), is_dog ? 0.9 : 1.0); clinical_notes.push("[만성신부전] 인(P) 엄격 제한 (<0.8g/1000kcal), 단계별 단백질 조절 및 음수량 극대화"); }
                if (d.includes("췌장")) { fat_max = Math.min(fat_max || (is_dog ? 25 : 40), is_dog ? 25 : 40); clinical_notes.push("[췌장염] 극저지방 (<25g/1000kcal, <10% DM) 및 고소화성 탄수화물/단백질 급여"); }
                if (d.includes("쿠싱")) { fat_max = Math.min(fat_max || (is_dog ? 30 : 35), is_dog ? 30 : 35); clinical_notes.push("[쿠싱증후군] 고지혈증 대비 저지방 및 근감소증 예방 양질 단백질 유지"); }
                if (d.includes("간")) { cu_max = Math.min(cu_max || 1.2, 1.2); clinical_notes.push("[만성간부전] 구리(Cu) 엄격 제한 (<1.2mg/1000kcal), 비육류 양질 단백질, 아연 보충"); }
                if (d.includes("IBD")) { fat_max = Math.min(fat_max || 35, 35); clinical_notes.push("[IBD] 단일 신규 단백질 또는 가수분해 단백질 필수"); }
            });

            if (dis_str.includes("신부전") && (dis_str.includes("심장") || mcs.includes("근감소"))) {
                clinical_notes.push("⚡ [영양소 상충 해결: 신부전 vs 심장병/근감소] 신장 요독증 방지와 심장성 악액질 방지를 위해 단백질은 극단적 제한 대신 '고생물가 중등도 단백질(42~55g/1000kcal)'로 조율하며, 인과 나트륨은 공통 엄격 제한합니다.");
                p_min_prot = is_dog ? 42.0 : 60.0;
                p_max_prot = is_dog ? 55.0 : 75.0;
            }
            if (dis_str.includes("신부전") && dis_str.includes("췌장")) {
                clinical_notes.push("⚡ [영양소 상충 해결: 신부전 vs 췌장염] 췌장염 급성 악화 방지를 위해 저지방(<25g/1000kcal)을 최우선 제약으로 적용하고 인(P) 제한을 동시 적용합니다.");
                fat_max = Math.min(fat_max || 25.0, 25.0);
                p_max = Math.min(p_max || 0.8, 0.8);
            }

            // 4. Candidate Diets Matching
            const spDiets = EMBEDDED_DIETS.filter(d => d.species === species);
            const filteredDiets = spDiets.filter(d => {
                if (d.name.includes("아날러제닉") || d.name.includes("하이포") || d.name.includes("z/d")) return true;
                for (const alg of allergies) {
                    if (d.protein_sources.includes(alg) || d.name.includes(alg)) return false;
                }
                return true;
            });

            function scoreDiet(d) {
                let s = 0;
                const n = d.nutrients;
                d.indications.forEach(tag => { if (dis_str.includes(tag)) s -= 25.0; });
                if (p_max !== null && n.phosphorus_g > p_max) s += (n.phosphorus_g - p_max) * 80.0;
                if (na_max !== null && n.sodium_g > na_max) s += (n.sodium_g - na_max) * 60.0;
                if (fat_max !== null && n.fat_g > fat_max) s += (n.fat_g - fat_max) * 50.0;
                if (cu_max !== null && n.copper_mg > cu_max) s += (n.copper_mg - cu_max) * 40.0;
                if (p_max_prot !== null && n.protein_g > p_max_prot) s += (n.protein_g - p_max_prot) * 1.5;
                if (p_min_prot !== null && n.protein_g < p_min_prot) s += (p_min_prot - n.protein_g) * 2.0;
                return s;
            }

            const dryCandidates = filteredDiets.filter(d => d.type === "건식").sort((a,b) => scoreDiet(a) - scoreDiet(b));
            const wetCandidates = filteredDiets.filter(d => d.type === "습식").sort((a,b) => scoreDiet(a) - scoreDiet(b));

            const bestDry1 = dryCandidates[0] || { name: "처방건식", company: "수의처방식", moisture_percent: 10, nutrients: { protein_g: 50, fat_g: 30, carb_g: 120, phosphorus_g: 0.7, sodium_g: 0.7, copper_mg: 1.5, epa_dha_g: 0.8, energy_density_kcal_per_kg: 3800 } };
            const bestDry2 = dryCandidates[1] || bestDry1;
            const bestWet1 = wetCandidates[0] || { name: "처방습식", company: "수의처방식", moisture_percent: 78, nutrients: { protein_g: 65, fat_g: 25, carb_g: 80, phosphorus_g: 0.7, sodium_g: 0.7, copper_mg: 1.5, epa_dha_g: 0.8, energy_density_kcal_per_kg: 950 } };

            // 5. Build Mix Items
            const mix_items = [];
            if (currentFeedingMode === "DRY_WET_FRESH") {
                const r_d = currentCustomRatios.dry || 50;
                const r_w = currentCustomRatios.wet || 30;
                const r_f = currentCustomRatios.fresh || 20;
                const tot = r_d + r_w + r_f || 100;

                const c_d = adjusted_der_kcal * (r_d / tot);
                const g_d = Math.round((c_d / (bestDry1.nutrients.energy_density_kcal_per_kg || 3800)) * 1000 * 10) / 10;
                mix_items.push({ name: bestDry1.name, company: bestDry1.company, type: "건식", ratio_percent: Math.round((r_d/tot)*100), daily_calories: Math.round(c_d*10)/10, daily_amount_g: g_d, water_content_ml: Math.round(g_d * (bestDry1.moisture_percent/100)*10)/10, nutrients: bestDry1.nutrients });

                const c_w = adjusted_der_kcal * (r_w / tot);
                const g_w = Math.round((c_w / (bestWet1.nutrients.energy_density_kcal_per_kg || 950)) * 1000 * 10) / 10;
                mix_items.push({ name: bestWet1.name, company: bestWet1.company, type: "습식", ratio_percent: Math.round((r_w/tot)*100), daily_calories: Math.round(c_w*10)/10, daily_amount_g: g_w, water_content_ml: Math.round(g_w * (bestWet1.moisture_percent/100)*10)/10, nutrients: bestWet1.nutrients });

                const c_f = adjusted_der_kcal * (r_f / tot);
                const g_f = Math.round((c_f / 1500) * 1000 * 10) / 10;
                mix_items.push({ name: "맞춤 화식 [삶은 계란흰자/살코기 + 백미밥/귀리 + 단호박/당근]", company: "수의 맞춤 화식", type: "화식", ratio_percent: Math.round((r_f/tot)*100), daily_calories: Math.round(c_f*10)/10, daily_amount_g: g_f, water_content_ml: Math.round(g_f * 0.70 * 10)/10, nutrients: { protein_g: 50, fat_g: 22, carb_g: 130, phosphorus_g: 0.6, sodium_g: 0.5, copper_mg: 0.9, epa_dha_g: 0.8, potassium_g: 2.0 } });
            } else if (currentFeedingMode === "DRY_WET") {
                const r_d = currentCustomRatios.dry || 60;
                const r_w = currentCustomRatios.wet || 40;
                const tot = r_d + r_w || 100;

                const c_d = adjusted_der_kcal * (r_d / tot);
                const g_d = Math.round((c_d / (bestDry1.nutrients.energy_density_kcal_per_kg || 3800)) * 1000 * 10) / 10;
                mix_items.push({ name: bestDry1.name, company: bestDry1.company, type: "건식", ratio_percent: Math.round((r_d/tot)*100), daily_calories: Math.round(c_d*10)/10, daily_amount_g: g_d, water_content_ml: Math.round(g_d * (bestDry1.moisture_percent/100)*10)/10, nutrients: bestDry1.nutrients });

                const c_w = adjusted_der_kcal * (r_w / tot);
                const g_w = Math.round((c_w / (bestWet1.nutrients.energy_density_kcal_per_kg || 950)) * 1000 * 10) / 10;
                mix_items.push({ name: bestWet1.name, company: bestWet1.company, type: "습식", ratio_percent: Math.round((r_w/tot)*100), daily_calories: Math.round(c_w*10)/10, daily_amount_g: g_w, water_content_ml: Math.round(g_w * (bestWet1.moisture_percent/100)*10)/10, nutrients: bestWet1.nutrients });
            } else if (currentFeedingMode === "DRY_DRY") {
                const r_d1 = currentCustomRatios.dry1 || 50;
                const r_d2 = currentCustomRatios.dry2 || 50;
                const tot = r_d1 + r_d2 || 100;

                const c_d1 = adjusted_der_kcal * (r_d1 / tot);
                const g_d1 = Math.round((c_d1 / (bestDry1.nutrients.energy_density_kcal_per_kg || 3800)) * 1000 * 10) / 10;
                mix_items.push({ name: bestDry1.name, company: bestDry1.company, type: "건식1", ratio_percent: Math.round((r_d1/tot)*100), daily_calories: Math.round(c_d1*10)/10, daily_amount_g: g_d1, water_content_ml: Math.round(g_d1 * 0.10 * 10)/10, nutrients: bestDry1.nutrients });

                const c_d2 = adjusted_der_kcal * (r_d2 / tot);
                const g_d2 = Math.round((c_d2 / (bestDry2.nutrients.energy_density_kcal_per_kg || 3800)) * 1000 * 10) / 10;
                mix_items.push({ name: bestDry2.name, company: bestDry2.company, type: "건식2", ratio_percent: Math.round((r_d2/tot)*100), daily_calories: Math.round(c_d2*10)/10, daily_amount_g: g_d2, water_content_ml: Math.round(g_d2 * 0.10 * 10)/10, nutrients: bestDry2.nutrients });
            } else {
                const g_f = Math.round((adjusted_der_kcal / 1500) * 1000 * 10) / 10;
                mix_items.push({ name: "맞춤 화식 [삶은 계란흰자/살코기 + 백미밥/귀리 + 단호박/당근]", company: "수의 맞춤 화식", type: "화식", ratio_percent: 100, daily_calories: adjusted_der_kcal, daily_amount_g: g_f, water_content_ml: Math.round(g_f * 0.70 * 10)/10, nutrients: { protein_g: 50, fat_g: 22, carb_g: 130, phosphorus_g: 0.6, sodium_g: 0.5, copper_mg: 0.9, epa_dha_g: 0.8, potassium_g: 2.0 } });
            }

            const total_daily_g = Math.round(mix_items.reduce((acc, it) => acc + it.daily_amount_g, 0) * 10) / 10;
            currentBaseTotalG = total_daily_g;
            const total_water_from_diet = Math.round(mix_items.reduce((acc, it) => acc + it.water_content_ml, 0) * 10) / 10;

            // Water Target
            let water_mult = 1.0;
            if (dis_str.includes("신부전")) water_mult = Math.max(water_mult, 1.35);
            if (dis_str.includes("결석")) water_mult = Math.max(water_mult, 1.30);
            if (dis_str.includes("당뇨")) water_mult = Math.max(water_mult, 1.25);
            const base_water = ((weight_kg * (is_dog ? 55 : 50)) + der_kcal) / 2.0;
            const daily_water_target = Math.round(base_water * water_mult * 10) / 10;
            const extra_water_needed = Math.max(0, Math.round((daily_water_target - total_water_from_diet) * 10) / 10);

            // Blended Nutrients
            let b_p = 0, b_f = 0, b_c = 0, b_phos = 0, b_na = 0, b_cu = 0, b_epa = 0, b_k = 0;
            mix_items.forEach(it => {
                const w = it.ratio_percent / 100.0;
                const n = it.nutrients;
                b_p += (n.protein_g || 0) * w;
                b_f += (n.fat_g || 0) * w;
                b_c += (n.carb_g || 0) * w;
                b_phos += (n.phosphorus_g || 0) * w;
                b_na += (n.sodium_g || 0) * w;
                b_cu += (n.copper_mg || 0) * w;
                b_epa += (n.epa_dha_g || 0) * w;
                b_k += (n.potassium_g || 2.0) * w;
            });

            const tot_energy = b_p * 3.5 + b_f * 8.5 + b_c * 3.5 || 1000;
            const p_pct = Math.round((b_p * 3.5 / tot_energy) * 1000) / 10;
            const f_pct = Math.round((b_f * 8.5 / tot_energy) * 1000) / 10;
            const c_pct = Math.round((b_c * 3.5 / tot_energy) * 1000) / 10;

            // UI Update
            document.getElementById('summary-rer').innerText = rer;
            document.getElementById('summary-ideal-weight').innerText = `이상체중: ${ideal_weight_kg} kg`;
            document.getElementById('summary-der').innerText = der_kcal;
            document.getElementById('summary-der-reason').innerText = `${der_factor_reason} (계수: ${der_factor})`;
            document.getElementById('summary-absorption').innerText = Math.round(overall_rate * 100);
            document.getElementById('summary-fecal-desc').innerText = `사전 추정: ${Math.round(overall_rate * 100)}% (Score ${fecal_score})`;
            document.getElementById('summary-adjusted-der').innerText = adjusted_der_kcal;
            document.getElementById('summary-total-g').innerText = total_daily_g;

            // Notes
            const notesContainer = document.getElementById('clinical-notes-container');
            const notesList = document.getElementById('clinical-notes-list');
            notesList.innerHTML = '';
            if (clinical_notes.length > 0) {
                notesContainer.classList.remove('hidden');
                clinical_notes.forEach(n => {
                    const d = document.createElement('div');
                    d.className = "text-xs";
                    d.innerText = n;
                    notesList.appendChild(d);
                });
            } else {
                notesContainer.classList.add('hidden');
            }

            // Food Cards
            const cardsGrid = document.getElementById('food-cards-grid');
            cardsGrid.innerHTML = '';
            mix_items.forEach(it => {
                let badgeColor = "bg-blue-100 text-blue-800 border-blue-200";
                let icon = "fa-bone";
                if (it.type.includes("습식")) { badgeColor = "bg-sky-100 text-sky-800 border-sky-200"; icon = "fa-can-food"; }
                else if (it.type.includes("화식")) { badgeColor = "bg-amber-100 text-amber-800 border-amber-200"; icon = "fa-carrot"; }

                const card = document.createElement('div');
                card.className = "p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between";
                card.innerHTML = `
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${badgeColor}">
                                <i class="fa-solid ${icon} mr-1"></i>${it.type} (${it.ratio_percent}%)
                            </span>
                            <span class="text-xs text-slate-400 font-medium">${it.company}</span>
                        </div>
                        <h4 class="text-sm font-bold text-slate-900 line-clamp-2 mb-3">${it.name}</h4>
                    </div>

                    <div class="space-y-2 pt-3 border-t border-slate-100 text-xs">
                        <div class="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                            <span class="font-bold text-slate-700">1일 총 급여량</span>
                            <span class="text-base font-extrabold text-blue-700">${it.daily_amount_g} g <span class="text-[11px] font-normal text-slate-400">(${it.daily_calories} kcal)</span></span>
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-center text-[11px]">
                            <div class="p-1.5 bg-slate-50/80 rounded-lg">
                                <div class="text-slate-400">1일 2회 급여시</div>
                                <div class="font-bold text-slate-800">${(it.daily_amount_g / 2).toFixed(1)} g / 회</div>
                            </div>
                            <div class="p-1.5 bg-slate-50/80 rounded-lg">
                                <div class="text-slate-400">1일 3회 급여시</div>
                                <div class="font-bold text-slate-800">${(it.daily_amount_g / 3).toFixed(1)} g / 회</div>
                            </div>
                        </div>
                        <div class="text-[11px] text-cyan-700 flex justify-between px-1">
                            <span>사료 내 수분 함유량</span>
                            <span class="font-bold">${it.water_content_ml} ml</span>
                        </div>
                    </div>
                `;
                cardsGrid.appendChild(card);
            });

            // Recommend & Render Supplements from 벳앤펫 DB
            const suppGrid = document.getElementById('supplement-cards-grid');
            suppGrid.innerHTML = '';

            const dosageStr = weight_kg >= 10.0 ? "1일 2~3정 (1회 1정 분할 급여)" : (weight_kg >= 5.0 ? "1일 1~2정 (1회 1정 분할 급여)" : "1일 1정 (식후 급여)");
            const matchedSupps = [];

            if (dis_str.includes("심장")) {
                matchedSupps.push({
                    name: "심장케어 카디오맥스",
                    tablet: "800mg",
                    target: "심장병 (MMVD / DCM / HCM)",
                    key_ing: "코엔자임Q10 40mg, 타우린 50mg, L-카르니틴 20mg, EPA+DHA 60mg, 마그네슘 25mg",
                    reason: "처방사료의 저나트륨 환경에서 심근 에너지 대사(CoQ10/L-카르니틴) 및 항부정맥(타우린)을 집중 보강합니다.",
                    color: "border-rose-300 bg-rose-50/30 text-rose-900",
                    badge: "bg-rose-100 text-rose-700"
                });
            }
            if (dis_str.includes("신부전")) {
                matchedSupps.push({
                    name: "신장케어 레날맥스",
                    tablet: "350mg",
                    target: "만성신부전 (CKD IRIS 1~4단계)",
                    key_ing: "요독분해 유산균 150억 CFU, 구연산칼륨 150mg, 엽산 200ug, Vit B12 250ug",
                    reason: "장-신장 축(Gut-Kidney Axis)을 타겟하여 장내 유익균이 혈중 요독소(BUN/IS)를 직접 분해·배출하도록 돕습니다.",
                    color: "border-amber-300 bg-amber-50/30 text-amber-900",
                    badge: "bg-amber-100 text-amber-700"
                });
            }
            if (dis_str.includes("췌장")) {
                matchedSupps.push({
                    name: "췌장케어판크레딘",
                    tablet: "800mg",
                    target: "췌장염 / 소화효소 부전",
                    key_ing: "판크레아틴 36mg, Lipomod 36mg, 베타인 40mg, 헤스페리딘 80mg",
                    reason: "극저지방 사료 급여 시 부족할 수 있는 지질/단백질 소화효소를 외인성으로 보충하여 소장 흡수율을 높입니다.",
                    color: "border-orange-300 bg-orange-50/30 text-orange-900",
                    badge: "bg-orange-100 text-orange-700"
                });
            }
            if (dis_str.includes("간")) {
                matchedSupps.push({
                    name: "간케어헤파맥스",
                    tablet: "800mg",
                    target: "만성간부전 / 간질환",
                    key_ing: "밀크씨슬(실리마린) 160mg, L-글루타치온 20mg, 포스파티딜콜린 20mg",
                    reason: "간세포막 항산화 보호(실리마린/글루타치온)를 통해 구리 축적 독성을 완화하고 담즙 대사를 정상화합니다.",
                    color: "border-yellow-300 bg-yellow-50/30 text-yellow-900",
                    badge: "bg-yellow-100 text-yellow-700"
                });
            }
            if (dis_str.includes("결석")) {
                matchedSupps.push({
                    name: "결석케어칼옥스",
                    tablet: "800mg",
                    target: "비뇨기 결석 (칼슘옥살레이트/스트루바이트)",
                    key_ing: "구연산칼륨 100mg, 콘드로이친 80mg, 마리골드 30mg, 비타민B6 0.6mg",
                    reason: "요중 구연산 농도를 높여 칼슘 옥살레이트 결정 결합을 차단하고 방광 점막 GAG층을 보호합니다.",
                    color: "border-cyan-300 bg-cyan-50/30 text-cyan-900",
                    badge: "bg-cyan-100 text-cyan-700"
                });
            }
            if (dis_str.includes("관절") || mcs.includes("근감소")) {
                matchedSupps.push({
                    name: "관절케어 오스테오",
                    tablet: "800mg",
                    target: "골관절염 / 근감소증 보조",
                    key_ing: "초록입홍합 90mg, 콘드로이친 50mg, N-아세틸글루코사민 50mg, 히알루론산 12mg, 브로멜라인 40mg",
                    reason: "관절 연골 재생 및 활액 윤활을 증진하며, 브로멜라인 효소가 관절 부종 및 통증을 완화합니다.",
                    color: "border-emerald-300 bg-emerald-50/30 text-emerald-900",
                    badge: "bg-emerald-100 text-emerald-700"
                });
            }

            if (matchedSupps.length < 2) {
                if (age_years >= 7.0) {
                    matchedSupps.push({
                        name: "멀티비타시니어",
                        tablet: "800mg",
                        target: "노령견 시니어 (7세 이상)",
                        key_ing: "코엔자임Q10 20mg, 마리골드(루테인) 80mg, 회화나무추출물 20mg, 유산균 20억",
                        reason: "노령기 인지기능 저하 방지, 백내장 예방, 심혈관 항산화를 위한 맞춤 비타민·미네랄 복합체입니다.",
                        color: "border-pink-300 bg-pink-50/30 text-pink-900",
                        badge: "bg-pink-100 text-pink-700"
                    });
                } else if (age_years < 1.0) {
                    matchedSupps.push({
                        name: "멀티비타 퍼피",
                        tablet: "800mg",
                        target: "성장기 퍼피 (<1세)",
                        key_ing: "비타민A 22.5ug, 비타민D 0.125ug, 칼슘 1.2mg, 철 1mg, 유산균 20억 CFU",
                        reason: "성장기 골격 형성 및 면역글로불린 생성을 위한 필수 미량영양소를 완벽 보충합니다.",
                        color: "border-blue-300 bg-blue-50/30 text-blue-900",
                        badge: "bg-blue-100 text-blue-700"
                    });
                } else {
                    matchedSupps.push({
                        name: "멀티비타어덜트",
                        tablet: "800mg",
                        target: "성견 유지기 (1~6세)",
                        key_ing: "코엔자임Q10 20mg, 초록입홍합 30mg, 글루코사민 32mg, 유산균 20억 CFU",
                        reason: "성견의 일상 활력, 모질 개선 및 장내 미생물총 균형을 유지합니다.",
                        color: "border-indigo-300 bg-indigo-50/30 text-indigo-900",
                        badge: "bg-indigo-100 text-indigo-700"
                    });
                }
            }

            matchedSupps.forEach(s => {
                const sCard = document.createElement('div');
                sCard.className = `p-4 rounded-2xl border ${s.color} bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between`;
                sCard.innerHTML = `
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${s.badge}">
                                <i class="fa-solid fa-capsules mr-1"></i>${s.target}
                            </span>
                            <span class="text-[11px] text-slate-400 font-bold">${s.tablet} / 정</span>
                        </div>
                        <h4 class="text-sm font-black text-slate-900 mb-1.5">${s.name}</h4>
                        <div class="text-xs font-bold text-amber-700 bg-amber-50/80 p-2 rounded-xl mb-2.5">
                            <i class="fa-solid fa-clock-rotate-left mr-1"></i>권장 용량: <span class="text-slate-900">${dosageStr}</span>
                        </div>
                        <div class="text-[11px] text-slate-600 mb-2">
                            <strong class="text-slate-800">주요 기능 성분:</strong> ${s.key_ing}
                        </div>
                    </div>
                    <div class="pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                        <strong class="text-indigo-700"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>임상 조율 시너지:</strong> ${s.reason}
                    </div>
                `;
                suppGrid.appendChild(sCard);
            });

            // Water
            document.getElementById('water-target-ml').innerText = daily_water_target;
            document.getElementById('water-from-diet-ml').innerText = total_water_from_diet;
            const cov = Math.min(100, Math.round((total_water_from_diet / Math.max(1, daily_water_target)) * 100));
            document.getElementById('water-coverage-pct').innerText = cov;
            document.getElementById('water-coverage-bar').style.width = `${cov}%`;
            document.getElementById('water-extra-needed-ml').innerText = extra_water_needed;
            document.getElementById('water-cups-needed').innerText = (extra_water_needed / 200.0).toFixed(1);

            // Compliance
            const tbody = document.getElementById('compliance-table-body');
            tbody.innerHTML = '';
            const compItems = [
                { name: "단백질 (Protein)", val: `${b_p.toFixed(1)} g/1000kcal`, guide: p_max_prot ? `${p_min_prot||15} ~ ${p_max_prot} g` : "적정량", ok: (p_min_prot===null || b_p>=p_min_prot) && (p_max_prot===null || b_p<=p_max_prot) },
                { name: "지방 (Fat)", val: `${b_f.toFixed(1)} g/1000kcal`, guide: fat_max ? `최대 ${fat_max} g 이하` : "적정량", ok: fat_max===null || b_f<=fat_max },
                { name: "인 (Phosphorus)", val: `${b_phos.toFixed(2)} g/1000kcal`, guide: p_max ? `최대 ${p_max} g 이하` : "적정량", ok: p_max===null || b_phos<=p_max },
                { name: "나트륨 (Sodium)", val: `${b_na.toFixed(2)} g/1000kcal`, guide: na_max ? `최대 ${na_max} g 이하` : "적정량", ok: na_max===null || b_na<=na_max },
                { name: "구리 (Copper)", val: `${b_cu.toFixed(2)} mg/1000kcal`, guide: cu_max ? `최대 ${cu_max} mg 이하` : "적정량", ok: cu_max===null || b_cu<=cu_max },
                { name: "EPA + DHA (오메가-3)", val: `${b_epa.toFixed(2)} g/1000kcal`, guide: epa_min ? `최소 ${epa_min} g 이상` : "적정량", ok: epa_min===null || b_epa>=epa_min }
            ];
            compItems.forEach(it => {
                const tr = document.createElement('tr');
                const badge = it.ok ? `<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">적합</span>` : `<span class="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">임상 조율</span>`;
                tr.innerHTML = `<td class="py-2.5 px-3 font-semibold text-slate-800">${it.name}</td><td class="py-2.5 px-3 font-extrabold text-blue-700">${it.val}</td><td class="py-2.5 px-3 text-slate-500">${it.guide}</td><td class="py-2.5 px-3 text-center">${badge}</td>`;
                tbody.appendChild(tr);
            });

            // Charts
            document.getElementById('chart-p-pct').innerText = `${p_pct}%`;
            document.getElementById('chart-f-pct').innerText = `${f_pct}%`;
            document.getElementById('chart-c-pct').innerText = `${c_pct}%`;

            const ctxDonut = document.getElementById('pfcChart').getContext('2d');
            if (pfcChartInstance) pfcChartInstance.destroy();
            pfcChartInstance = new Chart(ctxDonut, {
                type: 'doughnut',
                data: {
                    labels: ['단백질 (P)', '지방 (F)', '탄수화물 (C)'],
                    datasets: [{ data: [p_pct, f_pct, c_pct], backgroundColor: ['#2563eb', '#f59e0b', '#10b981'], borderWidth: 0 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Pretendard', size: 11 } } } }, cutout: '70%' }
            });

            const ctxBar = document.getElementById('nutrientsBarChart').getContext('2d');
            if (nutrientsBarChartInstance) nutrientsBarChartInstance.destroy();
            nutrientsBarChartInstance = new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: ['단백질 (g)', '지방 (g)', '탄수화물 (g)', '인 (g)', '나트륨 (g)', '칼륨 (g)', 'EPA+DHA (g)'],
                    datasets: [{
                        label: '혼합 사료 영양소 함량 (Per 1000 kcal)',
                        data: [b_p, b_f, b_c, b_phos * 10, b_na * 10, b_k * 10, b_epa * 10],
                        backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'],
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(ctx) {
                                    let raw = ctx.raw;
                                    if (['인 (g)', '나트륨 (g)', '칼륨 (g)', 'EPA+DHA (g)'].includes(ctx.label)) {
                                        raw = (raw / 10).toFixed(2);
                                    }
                                    return `${ctx.dataset.label}: ${raw}`;
                                }
                            }
                        },
                        legend: { display: false }
                    },
                    scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
                }
            });

            if (shouldSwitchTab) {
                switchTab('feeding-tab');
            }
        }

        // Pure JS Bayesian Fecal Kit Calibration Engine
        function runFecalKitCalibration() {
            const kit_ph = parseFloat(document.getElementById('kit-ph').value) || 6.8;
            const kit_amm = document.getElementById('kit-ammonia').value;
            const kit_fat = document.getElementById('kit-fat').value;
            const kit_blood = document.getElementById('kit-blood').value;
            const kit_phos = document.getElementById('kit-phosphate').value;

            const lab_p = parseFloat(document.getElementById('lab-p').value) || null;

            let cal_prot = currentPriorBioavailability.prior_protein_absorb_pct;
            let cal_fat = currentPriorBioavailability.prior_fat_absorb_pct;
            let cal_carb = currentPriorBioavailability.prior_carb_absorb_pct;
            let cal_overall = currentPriorBioavailability.prior_overall_absorb_pct;
            let barrier = currentPriorBioavailability.gut_barrier_intact_pct;

            const tuning_log = [];
            const clinical_actions = [];

            // 1. pH
            if (kit_ph < 6.0) {
                cal_carb = Math.max(40, cal_carb - 12);
                cal_overall = Math.max(45, cal_overall - 5);
                tuning_log.push({ marker: "① 분변 pH (<6.0 산성)", result: `pH ${kit_ph}`, effect: "소장 탄수화물 흡수 실패 ➔ 대장 과발효/유기산 산화", adj: "탄수화물 흡수율 -12%, 총 흡수율 -5%" });
                clinical_actions.push("사료 내 난소화성 전분 비율을 줄이고 고소화성 탄수화물/섬유소로 조절하십시오.");
            } else if (kit_ph > 7.5) {
                cal_prot = Math.max(40, cal_prot - 6);
                tuning_log.push({ marker: "① 분변 pH (>7.5 알칼리성)", result: `pH ${kit_ph}`, effect: "단백질 미소화 잔류물 대장 유입 ➔ 단백 부패(Putrefaction) 진행", adj: "단백질 흡수율 -6% 추가 하향" });
            }

            // 2. Ammonia
            if (kit_amm.includes("높음")) {
                const loss = kit_amm.includes("매우") ? 18 : 11;
                cal_prot = Math.max(35, cal_prot - loss);
                cal_overall = Math.max(45, cal_overall - 6);
                tuning_log.push({ marker: "② 분변 암모니아/질소 (High)", result: kit_amm, effect: "소장 단백 소화 흡수 용량 초과 및 미소화 유실 과다", adj: `단백질 흡수율 ${currentPriorBioavailability.prior_protein_absorb_pct}% ➔ ${cal_prot}%로 대폭 하향` });
                clinical_actions.push("소장 단백질 소화율이 사전 추정치보다 낮습니다. Cardiac/고단백 사료 비율을 낮추고 초고소화성 가수분해 단백질 또는 백색육 화식 배합으로 전환하십시오.");
            } else if (kit_amm.includes("주의")) {
                cal_prot = Math.max(40, cal_prot - 4);
                tuning_log.push({ marker: "② 분변 암모니아/질소 (주의)", result: "경도 증가", effect: "소장 단백질 소화 한계 근접", adj: "단백질 흡수율 -4% 보정" });
            }

            // 3. Fecal Fat
            if (kit_fat.includes("2+") || kit_fat.includes("3+")) {
                const loss = kit_fat.includes("3+") ? 28 : 18;
                cal_fat = Math.max(30, cal_fat - loss);
                cal_overall = Math.max(45, cal_overall - 10);
                tuning_log.push({ marker: "③ 분변 중성지방 (지방변)", result: kit_fat, effect: "지방 유실(Steatorrhea) 확인: 췌장효소/담즙산 결핍으로 지질 미셀화 장애", adj: `지방 흡수율 -${loss}% 하향, 칼로리 이용률 급감 반영` });
                clinical_actions.push("지방 흡수 부전이 확인되었습니다. 즉시 극저지방(Low-Fat < 10% DM)으로 처방하고 췌장 소화효소제 보충을 시작하십시오.");
            } else if (kit_fat.includes("1+")) {
                cal_fat = Math.max(40, cal_fat - 7);
                cal_overall = Math.max(45, cal_overall - 3);
                tuning_log.push({ marker: "③ 분변 중성지방 (1+)", result: "약양성", effect: "경미한 지방 흡수 지연", adj: "지방 흡수율 -7% 보정" });
            }

            // 4. Occult Blood
            if (kit_blood.includes("+")) {
                const loss = kit_blood.includes("++") ? 25 : 15;
                barrier = Math.max(10, barrier - loss);
                cal_overall = Math.max(40, cal_overall - 8);
                tuning_log.push({ marker: "④ 분변 잠혈/상피자극", result: kit_blood, effect: "장벽 융모 상피 손상 및 미세출혈로 장관 투과성(Permeability) 붕괴", adj: `장벽 온전성 ${barrier}점으로 하향, 생체이용률 페널티` });
                clinical_actions.push("장점막 염증 및 장벽 손상이 존재합니다. 장벽이 안정화될 때까지 저알러지 아날러제닉 사료 및 장점막 보호제(글루타민, 프로바이오틱스)를 우선 처방하십시오.");
            }

            // 5. Phosphate Pair
            let phos_risk = "정상 배출 (안정)";
            if (kit_phos.includes("낮음")) {
                if (lab_p && lab_p > 5.5) {
                    phos_risk = "🔴 최고 위험 (장내 결합 실패 & 체내 축적 가속)";
                    clinical_actions.push("🚨 [인 통제 비상] 혈청 인이 높은 상태에서 분변 인 배출이 저하되어 있습니다. 장이 식이 내 인을 흡수하고 있으므로 장내 인 결합제(Phosphate Binder) 용량을 증량하고 신장 처방식 비율을 극대화하십시오.");
                    tuning_log.push({ marker: "⑤ 분변 인 (Low) + 혈청 인 (High)", result: `Fecal P Low, Blood P ${lab_p} mg/dL`, effect: "식이 내 인이 장에서 불용화 결합되지 않고 체내로 흡수되어 고인혈증 악화", adj: "인 체내 축적 위험도 최고 등급 상향" });
                } else {
                    phos_risk = "🟡 주의 (식이 인 흡수율 높음)";
                    tuning_log.push({ marker: "⑤ 분변 인 (Low)", result: "Fecal P Low", effect: "장내 인 배출량 부족", adj: "인 결합 상태 모니터링 필요" });
                }
            } else if (kit_phos.includes("높음")) {
                if (lab_p && lab_p <= 5.5) {
                    phos_risk = "🟢 치료 성공 (장내 인 불용화 및 대변 배출 원활)";
                    tuning_log.push({ marker: "⑤ 분변 인 (High) + 혈청 인 (정상)", result: "Fecal P High, Blood P 안정", effect: "사료 내 인이 장에서 성공적으로 불용화 결합되어 대변으로 배출됨 (치료 목표 달성)", adj: "현재 신장 식이 및 인 결합 요법 유지" });
                } else {
                    phos_risk = "🟠 인 배설 진행 중 (혈중 인 모니터링)";
                }
            }

            // Recalculate Final Calibrated DER and Food grams
            const recalc_der = Math.round((currentBaseDerKcal / (cal_overall / 100.0)) * 10) / 10;
            const recalc_total_g = Math.round(currentBaseTotalG * (currentPriorBioavailability.prior_overall_absorb_pct / cal_overall) * 10) / 10;

            if (clinical_actions.length === 0) {
                clinical_actions.push("분변 키트 5대 마커가 모두 안정 범위로, 현재 믹스피딩 처방을 안전하게 유지할 수 있습니다.");
            }

            // Render Calibration Report Card
            const reportContainer = document.getElementById('calibration-report-container');
            reportContainer.classList.remove('hidden');

            document.getElementById('cal-prot-prior').innerText = `${currentPriorBioavailability.prior_protein_absorb_pct}%`;
            document.getElementById('cal-prot-after').innerText = `${cal_prot}%`;
            document.getElementById('cal-fat-prior').innerText = `${currentPriorBioavailability.prior_fat_absorb_pct}%`;
            document.getElementById('cal-fat-after').innerText = `${cal_fat}%`;
            document.getElementById('cal-overall-prior').innerText = `${currentPriorBioavailability.prior_overall_absorb_pct}%`;
            document.getElementById('cal-overall-after').innerText = `${cal_overall}%`;

            document.getElementById('cal-der-after').innerText = recalc_der;
            document.getElementById('cal-total-g-after').innerText = recalc_total_g;

            const riskBadge = document.getElementById('cal-phos-risk-badge');
            riskBadge.innerText = phos_risk;
            if (phos_risk.includes("최고 위험")) riskBadge.className = "px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-200 animate-pulse";
            else if (phos_risk.includes("치료 성공")) riskBadge.className = "px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200";
            else riskBadge.className = "px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200";

            // Tuning Log List
            const logList = document.getElementById('cal-tuning-log-list');
            logList.innerHTML = '';
            tuning_log.forEach(t => {
                const d = document.createElement('div');
                d.className = "p-2 rounded-lg bg-white border border-slate-200";
                d.innerHTML = `<strong>${t.marker} [${t.result}]</strong>: ${t.effect} ➔ <span class="text-blue-700 font-bold">${t.adj}</span>`;
                logList.appendChild(d);
            });

            // Clinical Actions List
            const actList = document.getElementById('cal-clinical-actions-list');
            actList.innerHTML = '';
            clinical_actions.forEach(a => {
                const d = document.createElement('div');
                d.innerHTML = `💡 ${a}`;
                actList.appendChild(d);
            });

            // Smooth scroll to report
            reportContainer.scrollIntoView({ behavior: 'smooth' });
        }

        function submitSymptomLog() {
            const wt = parseFloat(document.getElementById('log-weight').value) || 5.0;
            const fs = parseFloat(document.getElementById('log-fecal').value) || 3.5;
            const vc = parseInt(document.getElementById('log-vomit').value) || 0;
            const lo = parseFloat(document.getElementById('log-leftover').value) || 0;

            const box = document.getElementById('symptom-alert-box');
            box.classList.remove('hidden');

            const alerts = [];
            const recs = [];
            if (fs >= 5.0) { alerts.push(`⚠️ [분변 이상] 최근 분변 스코어가 ${fs}로 묽은변/설사 양상입니다.`); recs.push("흡수율 저하가 예상되므로 흡수 보정 계수 하향 및 소화기 처방식 비율 상향을 권장합니다."); }
            if (vc >= 2) { alerts.push(`🚨 [구토 경고] 최근 1일 ${vc}회의 구토가 관찰되었습니다.`); recs.push("급여량을 1회 대량 급여 대신 1일 3~4회 소량 분할 급여로 전환하세요."); }
            if (lo >= 30) { alerts.push(`⚠️ [기호성/식욕 부진] 사료 잔여량이 ${lo}%로 식사량이 부족합니다.`); recs.push("기호성 높은 습식 캔이나 맞춤 화식 비율을 높여 필수 대사 에너지(DER) 섭취를 유도하세요."); }

            if (alerts.length > 0) {
                box.className = "mt-4 p-4 rounded-xl text-xs bg-red-50 border border-red-200 text-red-900 space-y-2";
                box.innerHTML = `<div class="font-bold text-red-800 flex items-center space-x-2"><i class="fa-solid fa-triangle-exclamation"></i><span>증상 모니터링 경고 및 임상 권고</span></div><div class="space-y-1">${alerts.map(a => `<div>${a}</div>`).join('')}</div><div class="pt-2 border-t border-red-200/60 font-medium text-red-700">💡 조치 권고: ${recs.join(' ')}</div>`;
            } else {
                box.className = "mt-4 p-4 rounded-xl text-xs bg-emerald-50 border border-emerald-200 text-emerald-900";
                box.innerHTML = `<div class="font-bold text-emerald-800 flex items-center space-x-2"><i class="fa-solid fa-circle-check"></i><span>모든 증상 및 활력 지표가 양호하게 유지되고 있습니다.</span></div>`;
            }
        }

        function evaluateLabTest() {
            const cr = parseFloat(document.getElementById('lab-cr').value);
            const sdma = parseFloat(document.getElementById('lab-sdma').value);
            const p = parseFloat(document.getElementById('lab-p').value);
            const alb = parseFloat(document.getElementById('lab-alb').value);
            const cpl = parseFloat(document.getElementById('lab-cpl').value);
            const alt = parseFloat(document.getElementById('lab-alt').value);
            const k = parseFloat(document.getElementById('lab-k').value);

            const feedbacks = [];
            let risk = "정상/양호";

            if ((cr && cr > 2.0) || (sdma && sdma > 18.0)) {
                risk = "주의/모니터링";
                feedbacks.push("🔴 [신장 수치 상승] Creatinine/SDMA 상승으로 신기능 저하(IRIS Stage 2~3 의심). 인(P)과 단백질을 더욱 엄격히 제한하고 습식 급여로 음수량을 늘리세요.");
            }
            if (p && p > 5.5) {
                feedbacks.push("🔴 [고인혈증 경고] 혈청 인 수치가 높습니다. 인 흡착제 병용 및 초저인 처방식 전환이 시급합니다.");
            }
            if (alb && alb < 2.5) {
                risk = "위험/조치 필요";
                feedbacks.push("🚨 [저알부민혈증] 알부민 저하(<2.5g/dL)로 PLE/간부전/신소실증 의심. 생물가가 높은 초고소화성 단백질 공급 및 극저지방식이 필수적입니다.");
            }
            if (cpl && cpl > 400.0) {
                risk = "위험/조치 필요";
                feedbacks.push("🚨 [췌장염 수치 급상승] 췌장염 활성화 의심. 지방 함량이 10% 미만인 극저지방(Ultra Low Fat) 처방식 단독 급여를 권장합니다.");
            }
            if (alt && alt > 250.0) {
                feedbacks.push("🟠 [간세포 손상] ALT 수치 상승. 구리(Cu) 함량이 낮은 단백질원 및 항산화제/타우린 보충을 권장합니다.");
            }
            if (k && k < 3.5) {
                feedbacks.push("🟡 [저칼륨혈증] 이뇨제 또는 신부전성 칼륨 소실 의심. 칼륨 보충 사료 또는 보조제 투여를 고려하세요.");
            }

            if (feedbacks.length === 0) {
                feedbacks.push("✅ 혈액 검사 주요 수치가 목표 안전 범위 내에서 안정적으로 유지되고 있습니다.");
            }

            const container = document.getElementById('lab-feedback-container');
            container.classList.remove('hidden');

            const bg = risk.includes("위험") ? "bg-red-50 border-red-200 text-red-900" : (risk.includes("주의") ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-emerald-50 border-emerald-200 text-emerald-900");

            container.className = `mt-4 p-4 rounded-2xl border text-xs space-y-2 ${bg}`;
            container.innerHTML = `
                <div class="flex items-center justify-between font-bold">
                    <span><i class="fa-solid fa-notes-medical mr-1.5"></i>혈액검사 임상 영양 분석 리포트</span>
                    <span class="px-2.5 py-0.5 rounded-full bg-white/80 border text-[11px]">${risk}</span>
                </div>
                <div class="space-y-1.5 pt-2 border-t border-black/5">
                    ${feedbacks.map(f => `<div>${f}</div>`).join('')}
                </div>
            `;
        }

        document.addEventListener('DOMContentLoaded', () => {
            renderRatioSliders();
            runRecommendation(false);
            checkGateAuth();
        });
    </script>

    <!-- Private Access Gatekeeper Modal (SHA-256 단방향 암호화 보호) -->
    <div id="private-access-gate" class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md transition-opacity duration-300">
        <div class="max-w-md w-full mx-4 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/30 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 mb-4">
                <i class="fa-solid fa-stethoscope text-2xl"></i>
            </div>
            <h2 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">처방사료 믹스피딩 시스템</h2>
            <p class="text-xs text-blue-600 font-semibold mt-1">Veterinary Clinical Nutrition System</p>
            <div class="inline-block mt-3 mb-6 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                <i class="fa-solid fa-lock mr-1"></i> 비공개 승인 사용자 전용
            </div>

            <div id="gate-error-msg" class="hidden mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl flex items-center space-x-2 text-left">
                <i class="fa-solid fa-circle-exclamation text-base"></i>
                <span id="gate-error-text">아이디 또는 비밀번호가 올바르지 않습니다.</span>
            </div>

            <form id="gate-login-form" onsubmit="handleGateLogin(event)" class="space-y-4 text-left">
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">사용자 아이디 (ID)</label>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                            <i class="fa-solid fa-user text-sm"></i>
                        </span>
                        <input type="text" id="gate-username" required autocomplete="username" placeholder="아이디를 입력하세요" class="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition bg-slate-50 focus:bg-white font-medium text-slate-800">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">비밀번호 (Password)</label>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                            <i class="fa-solid fa-key text-sm"></i>
                        </span>
                        <input type="password" id="gate-password" required autocomplete="current-password" placeholder="비밀번호를 입력하세요" class="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition bg-slate-50 focus:bg-white font-medium text-slate-800">
                    </div>
                </div>

                <button type="submit" class="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 transition transform active:scale-95 flex items-center justify-center space-x-2">
                    <span>인증 및 입장하기</span>
                    <i class="fa-solid fa-arrow-right text-xs"></i>
                </button>
            </form>

            <div class="mt-6 pt-5 border-t border-slate-100 text-center">
                <p class="text-[11px] text-slate-400">수의사 및 승인된 관계자만 접근이 허가된 비공개 시스템입니다.</p>
            </div>
        </div>
    </div>

    <script>
        // SHA-256 단방향 암호화 해시 검증 (평문 비밀번호 노출 0%)
        const AUTH_USER = "vet";
        const AUTH_HASH = "968fb906ea88477e067a827ad14efe23d5813f09947ffe70507a8a154ebad5a4";

        async function sha256(message) {
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        async function handleGateLogin(e) {
            e.preventDefault();
            const u = document.getElementById('gate-username').value.trim();
            const p = document.getElementById('gate-password').value.trim();
            const errorDiv = document.getElementById('gate-error-msg');

            const pHash = await sha256(p);
            if (u === AUTH_USER && pHash === AUTH_HASH) {
                sessionStorage.setItem('vet_auth_verified', 'true');
                document.getElementById('private-access-gate').classList.add('hidden');
                errorDiv.classList.add('hidden');
            } else {
                errorDiv.classList.remove('hidden');
                document.getElementById('gate-password').value = '';
                document.getElementById('gate-password').focus();
            }
        }

        function checkGateAuth() {
            if (sessionStorage.getItem('vet_auth_verified') === 'true') {
                document.getElementById('private-access-gate').classList.add('hidden');
            } else {
                document.getElementById('private-access-gate').classList.remove('hidden');
            }
        }

        function handleGateLogout(e) {
            if (e) e.preventDefault();
            sessionStorage.removeItem('vet_auth_verified');
            window.location.reload();
        }
    </script>
</body>
</html>
"""
    final_html = template.replace("__DIETS_JSON__", diets_json).replace("__SUPPLEMENTS_JSON__", supplements_json).replace("__GUIDELINES_JSON__", guidelines_json)

    # Generate both standalone html and index.html for static hosting
    for output_filename in ["처방사료_복합질환_믹스피딩_추천시스템.html", "index.html"]:
        with open(output_filename, "w", encoding="utf-8") as f:
            f.write(final_html)
        print(f"Generated file: {output_filename} ({len(final_html)} bytes)")

if __name__ == '__main__':
    generate_standalone_html()
