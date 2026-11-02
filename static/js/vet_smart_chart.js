/**
 * static/js/vet_smart_chart.js
 * 수의사용 자연어 진료 기록 스마트 파서 & 믹스피딩 계산기 자동 체크 컨트롤러
 */

(function () {
    "use strict";

    // 샘플 템플릿 문구
    window.setSmartChartTemplate = function (type) {
        const txtArea = document.getElementById("vet-smart-chart-input");
        if (!txtArea) return;

        if (type === "ckd_panc") {
            txtArea.value = "11세 중성화 수컷 말티즈 3.8kg. 만성 신부전 2단계(BUN 42, Crea 2.1, SDMA 17, P 5.8), 약간의 췌장염 병력 있음(cPL 240). 최근 식욕부진 및 묽은 변 간헐적 관찰됨.";
        } else if (type === "feline_ibd") {
            txtArea.value = "9살 코숏 여아 4.2kg 중성화 완료. 구토와 만성 설사, 혈변으로 내원. 복부 초음파 검사상 장벽 두께 3.8mm 비후 소견 관찰됨. IBD 의심.";
        } else if (type === "heart_senior") {
            txtArea.value = "13세 시츄 암컷 5.5kg 중성화 완료. 심잡음 청진(청진상 Grade 4/6 MMVD 울혈성심부전 Stage B2). 근감소증 경도 관찰됨. BUN 28, Crea 1.2, 나트륨 조절 필요.";
        }
    };

    // AI 자연어 파싱 및 계산기 자동 체크 실행
    window.runSmartChartParsing = async function () {
        const txtArea = document.getElementById("vet-smart-chart-input");
        const statusBox = document.getElementById("vet-smart-chart-status");
        const summaryBox = document.getElementById("vet-smart-chart-summary");
        const btn = document.getElementById("btn-run-smart-chart");

        const text = (txtArea?.value || "").trim();
        if (!text) {
            alert("수의사 진료 기록 또는 EMR 메모를 입력해주세요.");
            return;
        }

        if (statusBox) {
            statusBox.classList.remove("hidden");
            statusBox.innerHTML = `
                <div class="flex items-center space-x-2 text-indigo-700 font-bold text-xs py-2">
                    <i class="fa-solid fa-spinner fa-spin text-sm"></i>
                    <span>AI가 진료 기록을 분석하여 계산기 항목(환자정보, 질환, 혈액수치, 증상)을 매핑 중입니다...</span>
                </div>
            `;
        }

        try {
            const resp = await fetch("/api/chart/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text })
            });

            if (!resp.ok) throw new Error(`서버 응답 오류 (HTTP ${resp.status})`);
            const data = await resp.json();
            if (!data || data.success === false) {
                throw new Error(data?.error || "진료 기록 분석에 실패했습니다.");
            }

            // 폼 필드 자동 입력 및 체크박스 동기화
            const appliedCounts = applySmartChartDataToForm(data);

            if (statusBox) {
                statusBox.innerHTML = `
                    <div class="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs">
                        <div class="flex items-center space-x-2">
                            <i class="fa-solid fa-circle-check text-base text-emerald-600"></i>
                            <div>
                                <span class="font-extrabold">자동 체크 완료!</span>
                                <span class="ml-1 text-emerald-700">총 <strong>${appliedCounts.total}개</strong>의 임상 항목(기본정보 ${appliedCounts.patient}건, 질환 ${appliedCounts.diseases}건, 혈액수치 ${appliedCounts.lab}건, 증상 ${appliedCounts.symptoms}건)이 자동으로 체크·입력되었습니다.</span>
                            </div>
                        </div>
                        <span class="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">${data.method || 'AI Parser'}</span>
                    </div>
                `;
            }

            if (summaryBox) {
                summaryBox.classList.remove("hidden");
                summaryBox.innerHTML = `
                    <div class="p-3 bg-slate-900 text-white rounded-xl text-xs space-y-1.5 shadow-sm">
                        <div class="flex items-center justify-between text-indigo-300 font-bold border-b border-white/10 pb-1">
                            <span>📋 AI 임상 브리핑 및 자동 세팅 요약</span>
                            <span class="text-[10px] text-slate-400">신뢰도: ${data.confidence || 'HIGH'}</span>
                        </div>
                        <div class="text-[11px] text-slate-200">${data.summary || '환자 분석이 완료되었습니다.'}</div>
                        <div class="flex flex-wrap gap-1.5 pt-1">
                            ${(data.diseases || []).map(d => `<span class="px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 text-[10px] border border-blue-500/30">질환: ${d.split(' ')[0]}</span>`).join('')}
                            ${(data.symptoms || []).map(s => `<span class="px-2 py-0.5 rounded bg-amber-600/30 text-amber-300 text-[10px] border border-amber-500/30">증상: ${s}</span>`).join('')}
                        </div>
                    </div>
                `;
            }

            // 계산기 엔진 자동 재계산 트리거
            if (typeof window.runRecommendation === "function") {
                window.runRecommendation(false);
            }
            if (typeof window.runGutEnvironmentCDSS === "function") {
                window.runGutEnvironmentCDSS();
            }

        } catch (err) {
            console.error("[runSmartChartParsing Error]", err);
            if (statusBox) {
                statusBox.innerHTML = `
                    <div class="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs font-bold">
                        ⚠️ 분석 실패: ${err.message}
                    </div>
                `;
            }
        }
    };

    function applySmartChartDataToForm(data) {
        let counts = { patient: 0, diseases: 0, lab: 0, symptoms: 0, total: 0 };
        const p = data.patient || {};
        const lab = data.blood_lab || {};
        const us = data.ultrasound || {};
        const symptoms = data.symptoms || [];
        const diseases = data.diseases || [];

        // 1. 환자 기본 정보
        if (p.species) {
            const spEl = document.getElementById("patient-species");
            if (spEl) {
                spEl.value = p.species;
                if (typeof window.onSpeciesChange === "function") window.onSpeciesChange();
                counts.patient++;
            }
        }
        if (p.name) {
            const nameEl = document.getElementById("patient-name");
            if (nameEl) { nameEl.value = p.name; counts.patient++; }
        }
        if (p.breed) {
            const breedEl = document.getElementById("patient-breed");
            if (breedEl) { breedEl.value = p.breed; counts.patient++; }
        }
        if (p.weight_kg != null) {
            const wtEl = document.getElementById("patient-weight");
            if (wtEl) { wtEl.value = p.weight_kg; counts.patient++; }
        }
        if (p.age_years != null) {
            const ageEl = document.getElementById("patient-age");
            if (ageEl) { ageEl.value = p.age_years; counts.patient++; }
        }
        if (p.gender) {
            const genEl = document.getElementById("patient-gender");
            if (genEl) {
                for (let opt of genEl.options) {
                    if (opt.value.includes(p.gender) || p.gender.includes(opt.value.replace(/\s+/g, ''))) {
                        genEl.value = opt.value;
                        counts.patient++;
                        break;
                    }
                }
            }
        }
        if (p.bcs != null) {
            const bcsEl = document.getElementById("patient-bcs");
            if (bcsEl) {
                bcsEl.value = p.bcs;
                if (typeof window.onBcsChange === "function") window.onBcsChange(p.bcs);
                counts.patient++;
            }
        }
        if (p.mcs) {
            const mcsRadios = document.querySelectorAll('input[name="mcs"]');
            mcsRadios.forEach(r => {
                if (r.value.includes(p.mcs) || p.mcs.includes(r.value.split(' ')[0])) {
                    r.checked = true;
                    counts.patient++;
                }
            });
        }
        if (p.fecal_score != null) {
            const fEl = document.getElementById("patient-fecal");
            if (fEl) {
                fEl.value = p.fecal_score;
                if (typeof window.onFecalChange === "function") window.onFecalChange(p.fecal_score);
                counts.patient++;
            }
        }

        // 2. 질환 체크박스 (자동 체크)
        if (diseases.length > 0) {
            const diseaseCheckboxes = document.querySelectorAll('input[name="disease"]');
            diseaseCheckboxes.forEach(cb => {
                const cbVal = cb.value;
                const isMatched = diseases.some(d => {
                    const key = d.split(' ')[0].replace(/[\(\)]/g, '');
                    return cbVal.includes(key) || d.includes(cbVal.split(' ')[0]);
                });
                if (isMatched) {
                    cb.checked = true;
                    counts.diseases++;
                }
            });
        }

        // 3. 임상 증상 체크박스
        if (symptoms.length > 0) {
            const sxCheckboxes = document.querySelectorAll('input[name="acute-sx"]');
            sxCheckboxes.forEach(cb => {
                if (symptoms.includes(cb.value)) {
                    cb.checked = true;
                    counts.symptoms++;
                }
            });
        }

        // 4. 혈액 검사 수치 (Blood Lab)
        if (lab.bun != null) { const el = document.getElementById("lab-bun"); if (el) { el.value = lab.bun; counts.lab++; } }
        if (lab.creatinine != null) { const el = document.getElementById("lab-cr"); if (el) { el.value = lab.creatinine; counts.lab++; } }
        if (lab.sdma != null) { const el = document.getElementById("lab-sdma"); if (el) { el.value = lab.sdma; counts.lab++; } }
        if (lab.phosphorus != null) { const el = document.getElementById("lab-p"); if (el) { el.value = lab.phosphorus; counts.lab++; } }
        if (lab.albumin != null) { const el = document.getElementById("lab-alb"); if (el) { el.value = lab.albumin; counts.lab++; } }
        if (lab.lipase_or_cpl != null) { const el = document.getElementById("lab-cpl"); if (el) { el.value = lab.lipase_or_cpl; counts.lab++; } }
        if (lab.alt != null) { const el = document.getElementById("lab-alt"); if (el) { el.value = lab.alt; counts.lab++; } }
        if (lab.potassium != null) { const el = document.getElementById("lab-k"); if (el) { el.value = lab.potassium; counts.lab++; } }

        // 5. 초음파 장벽 두께
        if (us.wall_thickness_mm != null) {
            const el = document.getElementById("us-thickness");
            if (el) { el.value = us.wall_thickness_mm; counts.patient++; }
        }

        counts.total = counts.patient + counts.diseases + counts.lab + counts.symptoms;
        return counts;
    }

})();
