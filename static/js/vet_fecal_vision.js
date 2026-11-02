/**
 * static/js/vet_fecal_vision.js
 * 스마트폰 분변키트 마커 종이패드 색분해 AI 판독 컨트롤러
 */

(function () {
    "use strict";

    window.runFecalKitVisionAnalysis = async function (event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const statusEl = document.getElementById("fecal-vision-status");
        const resultEl = document.getElementById("fecal-vision-result");

        if (statusEl) {
            statusEl.classList.remove("hidden");
            statusEl.innerHTML = `
                <div class="flex items-center space-x-2 text-indigo-700 font-bold text-xs py-2">
                    <i class="fa-solid fa-spinner fa-spin text-sm"></i>
                    <span>AI Vision이 분변키트 마커 종이패드의 색상을 정밀 분해·판독 중입니다...</span>
                </div>
            `;
        }

        try {
            const formData = new FormData();
            formData.append("file", file);

            // 환자 체중 및 나이 추가 (CDSS 연동용)
            const wt = parseFloat(document.getElementById("patient-weight")?.value || "5.0") || 5.0;
            const age = parseFloat(document.getElementById("patient-age")?.value || "5.0") || 5.0;
            formData.append("weight_kg", wt);
            formData.append("age_years", age);

            const resp = await fetch("/api/fecal-kit/analyze", {
                method: "POST",
                body: formData
            });

            if (!resp.ok) throw new Error(`서버 응답 오류 (HTTP ${resp.status})`);
            const data = await resp.json();
            if (!data || data.success === false) {
                throw new Error(data?.error || "분변키트 이미지 판독에 실패했습니다.");
            }

            // 1. 9대 마커 필드 자동 주입
            const m = data.markers || {};
            if (m.ph != null) { const el = document.getElementById("m9-ph"); if (el) el.value = m.ph; }
            if (m.ammonia != null) { const el = document.getElementById("m9-ammonia"); if (el) el.value = m.ammonia; }
            if (m.indole != null) { const el = document.getElementById("m9-indole"); if (el) el.value = m.indole; }
            if (m.lactate != null) { const el = document.getElementById("m9-lactate"); if (el) el.value = m.lactate; }
            if (m.blood != null) { const el = document.getElementById("m9-blood"); if (el) el.value = m.blood; }
            if (m.protein != null) { const el = document.getElementById("m9-protein"); if (el) el.value = m.protein; }
            if (m.carbo != null) { const el = document.getElementById("m9-carbo"); if (el) el.value = m.carbo; }
            if (m.fat != null) { const el = document.getElementById("m9-fat"); if (el) el.value = m.fat; }
            if (m.absorption != null) { const el = document.getElementById("m9-absorption"); if (el) el.value = m.absorption; }

            // 2. CDSS 엔진 자동 재실행
            if (typeof window.runGutEnvironmentCDSS === "function") {
                window.runGutEnvironmentCDSS();
            }

            // 3. 판독 결과 UI 카드 렌더링
            if (statusEl) {
                statusEl.innerHTML = `
                    <div class="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs">
                        <div class="flex items-center space-x-2">
                            <i class="fa-solid fa-circle-check text-base text-emerald-600"></i>
                            <div>
                                <span class="font-extrabold">분변키트 색분해 판독 완료!</span>
                                <span class="ml-1 text-emerald-700">9대 마커 수치가 계산기 및 장내환경 CDSS에 즉시 반영되었습니다.</span>
                            </div>
                        </div>
                        <span class="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">${data.method || 'AI Vision'}</span>
                    </div>
                `;
            }

            if (resultEl) {
                resultEl.classList.remove("hidden");
                const q = data.gut_4quadrant_evaluation || {};
                resultEl.innerHTML = `
                    <div class="bg-slate-900 text-white rounded-xl p-4 text-xs space-y-3 shadow-md">
                        <div class="flex items-center justify-between border-b border-white/10 pb-2">
                            <span class="font-black text-sky-300"><i class="fa-solid fa-microscope mr-1.5"></i> AI 분변키트 색분해 진단 소견</span>
                            <span class="text-[10px] text-slate-400">소화흡수율: <strong class="text-emerald-400">${m.absorption}%</strong></span>
                        </div>

                        <!-- 4분면 요약 뱃지 -->
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div class="bg-white/5 p-2 rounded-lg border border-white/10">
                                <div class="text-[10px] text-slate-400">단쇄지방산(SCFA)</div>
                                <div class="font-bold text-sky-300 mt-0.5">${q.scfa_production || '보통'}</div>
                            </div>
                            <div class="bg-white/5 p-2 rounded-lg border border-white/10">
                                <div class="text-[10px] text-slate-400">단백질 부패/요독</div>
                                <div class="font-bold ${q.putrefaction_risk === '위험' ? 'text-rose-400' : 'text-emerald-300'} mt-0.5">${q.putrefaction_risk || '안전'}</div>
                            </div>
                            <div class="bg-white/5 p-2 rounded-lg border border-white/10">
                                <div class="text-[10px] text-slate-400">장점막 상태/잠혈</div>
                                <div class="font-bold ${m.blood >= 10 ? 'text-rose-400' : 'text-slate-200'} mt-0.5">${q.mucosal_integrity || '정상'}</div>
                            </div>
                            <div class="bg-white/5 p-2 rounded-lg border border-white/10">
                                <div class="text-[10px] text-slate-400">미생물총 균형</div>
                                <div class="font-bold text-amber-300 mt-0.5">${q.microbiome_balance || '정상'}</div>
                            </div>
                        </div>

                        <!-- 정량 수치 그리드 -->
                        <div class="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-[11px] bg-black/40 p-2.5 rounded-lg">
                            <div><span class="text-slate-400 block text-[10px]">pH</span><strong>${m.ph}</strong></div>
                            <div><span class="text-slate-400 block text-[10px]">암모니아</span><strong>${m.ammonia}</strong> <span class="text-[9px] text-slate-500">μmol/g</span></div>
                            <div><span class="text-slate-400 block text-[10px]">인돌</span><strong>${m.indole}</strong> <span class="text-[9px] text-slate-500">μg/g</span></div>
                            <div><span class="text-slate-400 block text-[10px]">젖산</span><strong>${m.lactate}</strong> <span class="text-[9px] text-slate-500">mmol/g</span></div>
                            <div><span class="text-slate-400 block text-[10px]">잠혈</span><strong>${m.blood}</strong> <span class="text-[9px] text-slate-500">ng/mL</span></div>
                        </div>

                        <!-- 임상 브리핑 및 영양 가이드 -->
                        <div class="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-[11.5px] leading-relaxed">
                            <div class="text-indigo-300 font-bold mb-0.5">💡 임상 브리핑 & 믹스피딩 추천 액션</div>
                            <div class="text-slate-200">${data.clinical_briefing || ''}</div>
                            <div class="text-sky-300 mt-1 font-bold">➔ 권장 영양 중재: ${data.recommended_diet_action || '장내 균형 식단 유지'}</div>
                        </div>
                    </div>
                `;
            }

        } catch (err) {
            console.error("[runFecalKitVisionAnalysis Error]", err);
            if (statusEl) {
                statusEl.innerHTML = `
                    <div class="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs font-bold">
                        ⚠️ 판독 오류: ${err.message}
                    </div>
                `;
            }
        }
    };

})();
