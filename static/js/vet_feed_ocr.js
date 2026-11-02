/**
 * static/js/vet_feed_ocr.js
 * 수의사용 AI 사료 포장지 OCR 라벨 스캐너 및 믹스피딩 실시간 시뮬레이터 클라이언트 컨트롤러
 */

(function () {
    "use strict";

    // OCR 추출 사료 슬롯 상태
    window.vetOcrState = {
        feeds: [
            {
                name: "주 사료",
                type: "건식사료",
                ratio: 70.0,
                me_kcal_per_kg: 3800.0,
                moisture_pct: 10.0,
                nutrients: {
                    protein_g: 65.0,
                    fat_g: 38.0,
                    carb_g: 110.0,
                    fiber_g: 8.0,
                    calcium_g: 2.2,
                    phosphorus_g: 1.6,
                    sodium_g: 0.6
                },
                raw_data: null
            },
            {
                name: "믹스피딩 사료",
                type: "습식사료",
                ratio: 30.0,
                me_kcal_per_kg: 1050.0,
                moisture_pct: 78.0,
                nutrients: {
                    protein_g: 45.0,
                    fat_g: 50.0,
                    carb_g: 45.0,
                    fiber_g: 4.0,
                    calcium_g: 1.2,
                    phosphorus_g: 0.8,
                    sodium_g: 0.4
                },
                raw_data: null
            }
        ]
    };

    window.toggleVetOcrCard = function () {
        const p = document.getElementById("vet-ocr-panel");
        const btn = document.getElementById("btn-toggle-vet-ocr");
        if (!p) return;
        const isHidden = p.classList.contains("hidden");
        p.classList.toggle("hidden", !isHidden);
    };

    window.updateVetOcrRatio = function (val) {
        const v = parseInt(val, 10) || 70;
        window.vetOcrState.feeds[0].ratio = v;
        window.vetOcrState.feeds[1].ratio = 100 - v;
        const lbl = document.getElementById("vet-ocr-ratio-label");
        if (lbl) {
            lbl.innerText = `주 ${v}% : 믹스 ${100 - v}%`;
        }
    };

    window.runVetOcrFeed = async function (event, slotIdx) {
        const file = event.target.files?.[0];
        if (!file) return;

        const statusEl = document.getElementById(`vet-ocr-status-${slotIdx}`);
        const resEl = document.getElementById(`vet-ocr-result-${slotIdx}`);
        if (statusEl) {
            statusEl.innerHTML = '<span class="inline-flex items-center text-sky-300 font-bold"><i class="fa-solid fa-spinner fa-spin mr-1.5"></i> AI Vision 모델이 포장지 라벨을 판독 중입니다...</span>';
        }

        try {
            const formData = new FormData();
            formData.append("file", file);

            const resp = await fetch("/api/ocr/feed", {
                method: "POST",
                body: formData
            });

            if (!resp.ok) {
                throw new Error(`서버 응답 오류 (HTTP ${resp.status})`);
            }

            const data = await resp.json();
            if (!data || data.success === false) {
                throw new Error(data?.error || "라벨 영양성분 인식에 실패했습니다.");
            }

            const ga = data.guaranteed_analysis || {};
            const me = data.metabolic_energy || {};
            const p1000 = data.per_1000kcal || {};

            // 상태 업데이트
            window.vetOcrState.feeds[slotIdx] = {
                name: data.name || (slotIdx === 0 ? "주 사료" : "믹스피딩 사료"),
                type: data.feed_type || (slotIdx === 0 ? "건식사료" : "습식사료"),
                ratio: window.vetOcrState.feeds[slotIdx].ratio,
                me_kcal_per_kg: me.kcal_per_kg || (slotIdx === 0 ? 3800.0 : 1050.0),
                moisture_pct: ga.moisture_pct || (slotIdx === 0 ? 10.0 : 78.0),
                nutrients: {
                    protein_g: p1000.protein_g || 50.0,
                    fat_g: p1000.fat_g || 35.0,
                    carb_g: p1000.carb_g || 80.0,
                    fiber_g: p1000.fiber_g || 5.0,
                    calcium_g: p1000.calcium_g || 1.5,
                    phosphorus_g: p1000.phosphorus_g || 1.0,
                    sodium_g: p1000.sodium_g || 0.4
                },
                raw_data: data
            };

            if (statusEl) {
                const estText = me.is_estimated ? " (Atwater 계산)" : "";
                statusEl.innerHTML = `✅ <strong>${data.name || '사료'}</strong> 판독 성공! (${me.kcal_per_kg} kcal/kg${estText})`;
            }

            if (resEl) {
                resEl.classList.remove("hidden");
                resEl.innerHTML = `
                    <div class="font-bold text-white">${data.company || ''} ${data.name || ''}</div>
                    <div class="text-[10px] text-slate-300">
                        단백 ${ga.crude_protein_pct}% | 지방 ${ga.crude_fat_pct}% | 수분 ${ga.moisture_pct}% | 인 ${ga.phosphorus_pct || '-'}%
                    </div>
                    <div class="text-[10px] text-sky-300 font-mono">
                        DM: 단백질 ${data.dry_matter_analysis?.protein_dm_pct}% · 지방 ${data.dry_matter_analysis?.fat_dm_pct}%
                    </div>
                `;
            }

            // 시뮬레이션 즉시 자동 실행
            runVetOcrSimulation();

        } catch (err) {
            console.error("[runVetOcrFeed Error]", err);
            if (statusEl) {
                statusEl.innerHTML = `<span class="text-rose-300 font-bold">⚠️ 판독 실패: ${err.message}</span>`;
            }
        }
    };

    window.runVetOcrSimulation = async function () {
        const outEl = document.getElementById("vet-ocr-sim-output");
        if (!outEl) return;

        // 현재 환자 정보 수집
        const weightVal = parseFloat(document.getElementById("patient-weight")?.value || "5.0") || 5.0;
        const ageVal = parseFloat(document.getElementById("patient-age")?.value || "5.0") || 5.0;
        const speciesVal = document.getElementById("patient-species")?.value || "개";
        const bcsVal = parseInt(document.getElementById("patient-bcs")?.value || "5", 10) || 5;

        // 선택된 질환 수집
        const selectedDiseases = [];
        document.querySelectorAll(".disease-checkbox:checked").forEach(cb => {
            selectedDiseases.push(cb.value);
        });

        const payload = {
            patient: {
                name: document.getElementById("patient-name")?.value || "환자",
                species: speciesVal,
                weight_kg: weightVal,
                age_years: ageVal,
                bcs: bcsVal,
                diseases: selectedDiseases
            },
            feeds: window.vetOcrState.feeds,
            ratio_mode: "CALORIE"
        };

        try {
            outEl.classList.remove("hidden");
            outEl.innerHTML = '<div class="text-center py-4 text-xs text-sky-300 font-bold"><i class="fa-solid fa-spinner fa-spin mr-2"></i> 믹스피딩 및 질환 가이드라인 안전도 시뮬레이션 중...</div>';

            const resp = await fetch("/api/simulate-custom-mix", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) throw new Error("시뮬레이션 서버 오류");

            const res = await resp.json();
            renderVetOcrResult(res);

        } catch (err) {
            outEl.innerHTML = `<div class="text-xs text-rose-300 p-2">시뮬레이션 실패: ${err.message}</div>`;
        }
    };

    function renderVetOcrResult(res) {
        const outEl = document.getElementById("vet-ocr-sim-output");
        if (!outEl) return;

        const f1 = res.feeds[0];
        const f2 = res.feeds[1];
        const blended = res.blended_nutrients_per_1000kcal || {};
        const dm = res.dry_matter_analysis || {};
        const water = res.water || {};
        const alerts = res.compliance_alerts || [];

        let alertHtml = "";
        if (alerts.length > 0) {
            alertHtml = `
                <div class="space-y-1.5 mt-2">
                    ${alerts.map(a => `
                        <div class="p-2 rounded-lg text-[11px] font-bold ${a.severity === 'DANGER' ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300' : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'}">
                            <i class="fa-solid fa-triangle-exclamation mr-1"></i> [${a.nutrient}] ${a.message}
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            alertHtml = `
                <div class="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                    <i class="fa-solid fa-shield-halved mr-1"></i> 현재 질환 가이드라인 영양 상한선 및 하한선을 모두 안전하게 충족합니다.
                </div>
            `;
        }

        outEl.innerHTML = `
            <div class="flex flex-wrap items-center justify-between border-b border-white/10 pb-2">
                <span class="text-xs font-black text-sky-300">📊 믹스피딩 시뮬레이션 결과 (일일 총 필요 열량: ${res.der_kcal} kcal)</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${res.overall_safety === 'SAFE' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}">
                    ${res.overall_safety === 'SAFE' ? '안전 (Safe)' : '임상 주의 필요 (Caution)'}
                </span>
            </div>

            <!-- 급여량 2열 카드 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div class="bg-white/5 p-3 rounded-lg border border-sky-400/20">
                    <div class="font-black text-sky-200">${f1.name} (${f1.ratio_pct}%)</div>
                    <div class="text-lg font-black text-white mt-1">${f1.daily_grams} <span class="text-xs font-normal text-slate-300">g/일</span></div>
                    <div class="text-[11px] text-slate-300">1일 2회 급여시 1회당 <strong>${f1.bid_grams}g</strong> (3회시 ${f1.tid_grams}g)</div>
                    <div class="text-[10px] text-sky-300">사료내 수분 공급: ${f1.water_from_feed_ml} ml</div>
                </div>

                <div class="bg-white/5 p-3 rounded-lg border border-emerald-400/20">
                    <div class="font-black text-emerald-200">${f2.name} (${f2.ratio_pct}%)</div>
                    <div class="text-lg font-black text-white mt-1">${f2.daily_grams} <span class="text-xs font-normal text-slate-300">g/일</span></div>
                    <div class="text-[11px] text-slate-300">1일 2회 급여시 1회당 <strong>${f2.bid_grams}g</strong> (3회시 ${f2.tid_grams}g)</div>
                    <div class="text-[10px] text-emerald-300">사료내 수분 공급: ${f2.water_from_feed_ml} ml</div>
                </div>
            </div>

            <!-- 혼합 영양소 수치 (g/1,000 kcal & DM %) -->
            <div class="bg-black/30 p-3 rounded-lg border border-white/5">
                <div class="text-[11px] font-bold text-slate-300 mb-1.5">🔬 혼합 식단 영양소 밀도 (Blended Nutrient Profile)</div>
                <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                    <div class="bg-white/5 p-1.5 rounded">
                        <div class="text-[10px] text-slate-400">단백질</div>
                        <div class="font-bold text-white">${blended.protein_g}g</div>
                        <div class="text-[9px] text-slate-400">${dm.protein_dm_pct}% DM</div>
                    </div>
                    <div class="bg-white/5 p-1.5 rounded">
                        <div class="text-[10px] text-slate-400">지방</div>
                        <div class="font-bold text-amber-300">${blended.fat_g}g</div>
                        <div class="text-[9px] text-slate-400">${dm.fat_dm_pct}% DM</div>
                    </div>
                    <div class="bg-white/5 p-1.5 rounded">
                        <div class="text-[10px] text-slate-400">탄수화물</div>
                        <div class="font-bold text-white">${blended.carb_g}g</div>
                        <div class="text-[9px] text-slate-400">${dm.carb_dm_pct}% DM</div>
                    </div>
                    <div class="bg-white/5 p-1.5 rounded">
                        <div class="text-[10px] text-slate-400">인 (P)</div>
                        <div class="font-bold text-sky-300">${blended.phosphorus_g}g</div>
                        <div class="text-[9px] text-slate-400">/1000kcal</div>
                    </div>
                    <div class="bg-white/5 p-1.5 rounded">
                        <div class="text-[10px] text-slate-400">칼슘 (Ca)</div>
                        <div class="font-bold text-white">${blended.calcium_g}g</div>
                        <div class="text-[9px] text-slate-400">/1000kcal</div>
                    </div>
                    <div class="bg-white/5 p-1.5 rounded">
                        <div class="text-[10px] text-slate-400">나트륨 (Na)</div>
                        <div class="font-bold text-white">${blended.sodium_g}g</div>
                        <div class="text-[9px] text-slate-400">/1000kcal</div>
                    </div>
                </div>
            </div>

            <!-- 음수량 관리 -->
            <div class="bg-blue-950/40 p-2.5 rounded-lg border border-blue-400/20 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                    <span class="text-blue-300 font-bold"><i class="fa-solid fa-droplet mr-1"></i> 일일 총 권장 음수량: <strong>${water.daily_target_water_ml} ml</strong></span>
                    <span class="text-slate-300 text-[11px] ml-2">(사료 수분 ${water.water_from_diet_ml}ml 충족, 순수 음수 필요량: <strong>${water.additional_water_needed_ml} ml</strong> · 약 ${water.cups_needed_approx}컵)</span>
                </div>
            </div>

            <!-- 질환별 임상 경고 및 가이드 -->
            ${alertHtml}
        `;
    }

})();
