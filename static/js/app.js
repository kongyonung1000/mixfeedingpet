/**
 * Frontend JavaScript for Prescription Diet Recommendation System.
 */

let currentFeedingMode = "DRY_WET_FRESH";
let currentCustomRatios = { dry: 50, wet: 30, fresh: 20 };
let currentResultData = null;

let pfcChartInstance = null;
let nutrientsBarChartInstance = null;
let symptomLogsHistory = [];

// 1. Tab Switching
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

// 2. BCS & Fecal Change Handlers
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
    if (v < 4) {
        badge.className = "text-xs font-extrabold px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full";
    } else if (v <= 5) {
        badge.className = "text-xs font-extrabold px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full";
    } else {
        badge.className = "text-xs font-extrabold px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full";
    }
}

function onFecalChange(val) {
    const badge = document.getElementById('fecal-badge');
    const v = parseFloat(val);
    if (v <= 2.0) {
        badge.innerText = `Score ${v} (단단함/건조)`;
        badge.className = "text-xs font-bold px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full";
    } else if (v <= 3.5) {
        badge.innerText = `Score ${v} (이상적 정상 분변)`;
        badge.className = "text-xs font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full";
    } else if (v <= 4.5) {
        badge.innerText = `Score ${v} (무른 변 / 흡수율 -8%)`;
        badge.className = "text-xs font-bold px-2.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-full";
    } else if (v <= 5.5) {
        badge.innerText = `Score ${v} (매우 묽은 변 / 흡수율 -15%)`;
        badge.className = "text-xs font-bold px-2.5 py-0.5 bg-orange-100 text-orange-800 rounded-full";
    } else {
        badge.innerText = `Score ${v} (설사/수양성 / 흡수율 -25%)`;
        badge.className = "text-xs font-bold px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full";
    }
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

function updateEnergyPreview() {
    // Optional live quick check
}

// 3. Feeding Mode Selection
function setFeedingMode(mode) {
    currentFeedingMode = mode;
    
    // Update button styles
    ["DRY_WET_FRESH", "DRY_WET", "DRY_DRY", "FRESH_ONLY"].forEach(m => {
        const btn = document.getElementById(`mode-btn-${m}`);
        if (m === mode) {
            btn.className = "px-3.5 py-1.5 text-xs font-bold rounded-xl border border-blue-600 bg-blue-50 text-blue-700 transition";
        } else {
            btn.className = "px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition";
        }
    });

    // Default ratios
    if (mode === "DRY_WET_FRESH") {
        currentCustomRatios = { dry: 50, wet: 30, fresh: 20 };
    } else if (mode === "DRY_WET") {
        currentCustomRatios = { dry: 60, wet: 40 };
    } else if (mode === "DRY_DRY") {
        currentCustomRatios = { dry1: 50, dry2: 50 };
    } else if (mode === "FRESH_ONLY") {
        currentCustomRatios = { fresh: 100 };
    }

    renderRatioSliders();
    runRecommendation(false); // Re-run without changing tab
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
    
    // Auto-normalize if needed or trigger debounced update
    clearTimeout(window._ratioTimer);
    window._ratioTimer = setTimeout(() => {
        runRecommendation(false);
    }, 250);
}

// 4. Recommendation Runner
async function runRecommendation(shouldSwitchTab = true) {
    // Gather patient profile data
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

    // Selected allergies
    const allergies = [];
    document.querySelectorAll('input[name="allergy"]:checked').forEach(el => allergies.push(el.value));

    // Selected diseases
    const diseases = [];
    document.querySelectorAll('input[name="disease"]:checked').forEach(el => diseases.push(el.value));

    const payload = {
        name,
        species,
        weight_kg,
        age_years,
        gender,
        breed,
        bcs,
        mcs,
        eating_habit,
        fecal_score,
        allergies,
        diseases,
        feeding_mode: currentFeedingMode,
        custom_ratios: currentCustomRatios
    };

    try {
        const res = await fetch('/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("API Error");
        const data = await res.json();
        currentResultData = data;

        // Render UI
        renderResults(data);

        if (shouldSwitchTab) {
            switchTab('feeding-tab');
        }
    } catch (e) {
        console.error(e);
        alert("계산 중 오류가 발생했습니다: " + e.message);
    }
}

// 5. Render Results to UI
function renderResults(data) {
    // 1. Summary Banner
    document.getElementById('summary-rer').innerText = data.patient.rer_kcal;
    document.getElementById('summary-ideal-weight').innerText = `이상체중: ${data.patient.ideal_weight_kg} kg`;
    document.getElementById('summary-der').innerText = data.patient.der_kcal;
    document.getElementById('summary-der-reason').innerText = `${data.patient.der_factor_reason} (계수: ${data.patient.der_factor})`;
    document.getElementById('summary-absorption').innerText = data.absorption.absorption_percent;
    document.getElementById('summary-fecal-desc').innerText = data.absorption.fecal_desc;
    document.getElementById('summary-adjusted-der').innerText = data.patient.adjusted_der_kcal;
    document.getElementById('summary-total-g').innerText = data.feeding_plan.total_daily_g;

    // 2. Clinical Notes Box
    const notesContainer = document.getElementById('clinical-notes-container');
    const notesList = document.getElementById('clinical-notes-list');
    notesList.innerHTML = '';
    
    if (data.clinical_notes && data.clinical_notes.length > 0) {
        notesContainer.classList.remove('hidden');
        data.clinical_notes.forEach(note => {
            const div = document.createElement('div');
            div.className = "text-xs";
            div.innerText = note;
            notesList.appendChild(div);
        });
    } else {
        notesContainer.classList.add('hidden');
    }

    // 3. Recommended Food Cards
    const cardsGrid = document.getElementById('food-cards-grid');
    cardsGrid.innerHTML = '';

    data.feeding_plan.items.forEach(item => {
        let badgeColor = "bg-blue-100 text-blue-800 border-blue-200";
        let icon = "fa-bone";
        if (item.type.includes("습식")) {
            badgeColor = "bg-sky-100 text-sky-800 border-sky-200";
            icon = "fa-can-food";
        } else if (item.type.includes("화식")) {
            badgeColor = "bg-amber-100 text-amber-800 border-amber-200";
            icon = "fa-carrot";
        }

        const card = document.createElement('div');
        card.className = "p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between";
        card.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${badgeColor}">
                        <i class="fa-solid ${icon} mr-1"></i>${item.type} (${item.ratio_percent}%)
                    </span>
                    <span class="text-xs text-slate-400 font-medium">${item.company}</span>
                </div>
                <h4 class="text-sm font-bold text-slate-900 line-clamp-2 mb-3">${item.name}</h4>
            </div>

            <div class="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div class="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                    <span class="font-bold text-slate-700">1일 총 급여량</span>
                    <span class="text-base font-extrabold text-blue-700">${item.daily_amount_g} g <span class="text-[11px] font-normal text-slate-400">(${item.daily_calories_kcal} kcal)</span></span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-center text-[11px]">
                    <div class="p-1.5 bg-slate-50/80 rounded-lg">
                        <div class="text-slate-400">1일 2회 급여시</div>
                        <div class="font-bold text-slate-800">${item.per_meal_g_bid} g / 회</div>
                    </div>
                    <div class="p-1.5 bg-slate-50/80 rounded-lg">
                        <div class="text-slate-400">1일 3회 급여시</div>
                        <div class="font-bold text-slate-800">${item.per_meal_g_tid} g / 회</div>
                    </div>
                </div>
                <div class="text-[11px] text-cyan-700 flex justify-between px-1">
                    <span>사료 내 수분 함유량</span>
                    <span class="font-bold">${item.water_content_ml} ml</span>
                </div>
            </div>
        `;
        cardsGrid.appendChild(card);
    });

    // 4. Water Analysis
    document.getElementById('water-target-ml').innerText = data.water_analysis.daily_target_water_ml;
    document.getElementById('water-from-diet-ml').innerText = data.water_analysis.water_from_diet_ml;
    document.getElementById('water-coverage-pct').innerText = data.water_analysis.coverage_pct;
    document.getElementById('water-coverage-bar').style.width = `${Math.min(100, data.water_analysis.coverage_pct)}%`;
    document.getElementById('water-extra-needed-ml').innerText = data.water_analysis.additional_water_needed_ml;
    document.getElementById('water-cups-needed').innerText = (data.water_analysis.additional_water_needed_ml / 200.0).toFixed(1);

    // 5. Compliance Table
    renderComplianceTable(data.compliance);

    // 6. Charts
    renderCharts(data);
}

function renderComplianceTable(comp) {
    const tbody = document.getElementById('compliance-table-body');
    tbody.innerHTML = '';

    const labels = {
        protein: "단백질 (Protein)",
        fat: "지방 (Fat)",
        phosphorus: "인 (Phosphorus)",
        sodium: "나트륨 (Sodium)",
        copper: "구리 (Copper)",
        epa_dha: "EPA + DHA (오메가-3)"
    };

    const units = {
        protein: "g/1000kcal",
        fat: "g/1000kcal",
        phosphorus: "g/1000kcal",
        sodium: "g/1000kcal",
        copper: "mg/1000kcal",
        epa_dha: "g/1000kcal"
    };

    for (const [key, item] of Object.entries(comp)) {
        let guideStr = "일반 유지 기준";
        if (item.min !== undefined && item.min !== null && item.max !== undefined && item.max !== null) {
            guideStr = `${item.min} ~ ${item.max} ${units[key]}`;
        } else if (item.max !== undefined && item.max !== null) {
            guideStr = `최대 ${item.max} ${units[key]} 이하`;
        } else if (item.min !== undefined && item.min !== null) {
            guideStr = `최소 ${item.min} ${units[key]} 이상`;
        }

        let badge = `<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">적합</span>`;
        if (item.status === "주의") {
            badge = `<span class="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">임상 조율</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-2.5 px-3 font-semibold text-slate-800">${labels[key] || key}</td>
            <td class="py-2.5 px-3 font-extrabold text-blue-700">${item.val} ${units[key]}</td>
            <td class="py-2.5 px-3 text-slate-500">${guideStr}</td>
            <td class="py-2.5 px-3 text-center">${badge}</td>
        `;
        tbody.appendChild(tr);
    }
}

// 6. Charts Rendering
function renderCharts(data) {
    const pfc = data.nutrients_blended.energy_ratios;
    document.getElementById('chart-p-pct').innerText = `${pfc.protein_pct}%`;
    document.getElementById('chart-f-pct').innerText = `${pfc.fat_pct}%`;
    document.getElementById('chart-c-pct').innerText = `${pfc.carb_pct}%`;

    // 1. PFC Donut Chart
    const ctxDonut = document.getElementById('pfcChart').getContext('2d');
    if (pfcChartInstance) pfcChartInstance.destroy();

    pfcChartInstance = new Chart(ctxDonut, {
        type: 'doughnut',
        data: {
            labels: ['단백질 (P)', '지방 (F)', '탄수화물 (C)'],
            datasets: [{
                data: [pfc.protein_pct, pfc.fat_pct, pfc.carb_pct],
                backgroundColor: ['#2563eb', '#f59e0b', '#10b981'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Pretendard', size: 11 } } }
            },
            cutout: '70%'
        }
    });

    // 2. Nutrients Bar Chart
    const ctxBar = document.getElementById('nutrientsBarChart').getContext('2d');
    if (nutrientsBarChartInstance) nutrientsBarChartInstance.destroy();

    const n = data.nutrients_blended.per_1000kcal;
    nutrientsBarChartInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['단백질 (g)', '지방 (g)', '탄수화물 (g)', '인 (g)', '나트륨 (g)', '칼륨 (g)', 'EPA+DHA (g)'],
            datasets: [{
                label: '혼합 사료 영양소 함량 (Per 1000 kcal)',
                data: [n.protein_g, n.fat_g, n.carb_g, n.phosphorus_g * 10, n.sodium_g * 10, n.potassium_g * 10, n.epa_dha_g * 10],
                backgroundColor: [
                    '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'
                ],
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
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// 7. Symptom Logging
async function submitSymptomLog() {
    const weight_kg = parseFloat(document.getElementById('log-weight').value) || 5.0;
    const fecal_score = parseFloat(document.getElementById('log-fecal').value) || 3.5;
    const vomiting_count = parseInt(document.getElementById('log-vomit').value) || 0;
    const leftover_percent = parseFloat(document.getElementById('log-leftover').value) || 0;

    const logEntry = {
        date: new Date().toISOString().split('T')[0],
        weight_kg,
        fecal_score,
        vomiting_count,
        leftover_percent
    };

    symptomLogsHistory.push(logEntry);

    try {
        const res = await fetch('/api/monitoring/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logs: symptomLogsHistory })
        });

        const data = await res.json();
        const box = document.getElementById('symptom-alert-box');
        box.classList.remove('hidden');

        if (data.alerts && data.alerts.length > 0) {
            box.className = "mt-4 p-4 rounded-xl text-xs bg-red-50 border border-red-200 text-red-900 space-y-2";
            box.innerHTML = `
                <div class="font-bold text-red-800 flex items-center space-x-2">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <span>증상 모니터링 경고 및 임상 권고</span>
                </div>
                <div class="space-y-1">
                    ${data.alerts.map(a => `<div>${a}</div>`).join('')}
                </div>
                <div class="pt-2 border-t border-red-200/60 font-medium text-red-700">
                    💡 조치 권고: ${data.recommendations.join(' ')}
                </div>
            `;
        } else {
            box.className = "mt-4 p-4 rounded-xl text-xs bg-emerald-50 border border-emerald-200 text-emerald-900";
            box.innerHTML = `
                <div class="font-bold text-emerald-800 flex items-center space-x-2">
                    <i class="fa-solid fa-circle-check"></i>
                    <span>모든 증상 및 활력 지표가 양호하게 유지되고 있습니다.</span>
                </div>
            `;
        }
    } catch (e) {
        console.error(e);
    }
}

// 8. Blood Lab Test Evaluation
async function evaluateLabTest() {
    const payload = {
        bun: document.getElementById('lab-bun').value,
        creatinine: document.getElementById('lab-cr').value,
        sdma: document.getElementById('lab-sdma').value,
        phosphorus: document.getElementById('lab-p').value,
        albumin: document.getElementById('lab-alb').value,
        lipase_or_cpl: document.getElementById('lab-cpl').value,
        alt: document.getElementById('lab-alt').value,
        potassium: document.getElementById('lab-k').value
    };

    try {
        const res = await fetch('/api/lab/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        const container = document.getElementById('lab-feedback-container');
        container.classList.remove('hidden');

        let bg = "bg-slate-50 border-slate-200 text-slate-800";
        if (data.risk_level.includes("위험")) {
            bg = "bg-red-50 border-red-200 text-red-900";
        } else if (data.risk_level.includes("주의")) {
            bg = "bg-amber-50 border-amber-200 text-amber-900";
        } else {
            bg = "bg-emerald-50 border-emerald-200 text-emerald-900";
        }

        container.className = `mt-4 p-4 rounded-2xl border text-xs space-y-2 ${bg}`;
        container.innerHTML = `
            <div class="flex items-center justify-between font-bold">
                <span><i class="fa-solid fa-notes-medical mr-1.5"></i>혈액검사 임상 영양 분석 리포트</span>
                <span class="px-2.5 py-0.5 rounded-full bg-white/80 border text-[11px]">${data.risk_level}</span>
            </div>
            <div class="space-y-1.5 pt-2 border-t border-black/5">
                ${data.feedbacks.map(f => `<div>${f}</div>`).join('')}
            </div>
        `;
    } catch (e) {
        console.error(e);
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    renderRatioSliders();
    runRecommendation(false);
});
