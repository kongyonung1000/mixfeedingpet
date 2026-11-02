/**
 * static/js/vet_literature_cdss.js
 * 수의사용 임상 의사결정 지원(CDSS) & 문헌/논문(SACN, NRC, IRIS, ACVIM) 근거 검색 컨트롤러
 */

(function () {
    "use strict";

    window.openVetLiteratureModal = function () {
        const modal = document.getElementById("vet-literature-modal");
        if (modal) modal.classList.remove("hidden");
    };

    window.closeVetLiteratureModal = function () {
        const modal = document.getElementById("vet-literature-modal");
        if (modal) modal.classList.add("hidden");
    };

    window.setVetCdssQuestion = function (qText) {
        const inp = document.getElementById("vet-cdss-question-input");
        if (inp) inp.value = qText;
    };

    window.runVetLiteratureConsultation = async function () {
        const inp = document.getElementById("vet-cdss-question-input");
        const outBox = document.getElementById("vet-cdss-output-box");
        const statusBox = document.getElementById("vet-cdss-status-box");

        const question = (inp?.value || "").trim();
        if (!question) {
            alert("임상 영양 질의나 문헌 검색 키워드를 입력해주세요.");
            return;
        }

        // 환자 컨텍스트 수집
        const selectedDiseases = [];
        document.querySelectorAll(".disease-checkbox:checked").forEach(cb => {
            selectedDiseases.push(cb.value);
        });

        const context = {
            species: document.getElementById("patient-species")?.value || "개",
            weight_kg: parseFloat(document.getElementById("patient-weight")?.value || "5.0") || 5.0,
            age_years: parseFloat(document.getElementById("patient-age")?.value || "5.0") || 5.0,
            diseases: selectedDiseases,
            lab: {
                bun: document.getElementById("lab-bun")?.value || null,
                creatinine: document.getElementById("lab-cr")?.value || null,
                sdma: document.getElementById("lab-sdma")?.value || null,
                phosphorus: document.getElementById("lab-p")?.value || null,
                cpl: document.getElementById("lab-cpl")?.value || null
            }
        };

        if (statusBox) {
            statusBox.classList.remove("hidden");
            statusBox.innerHTML = `
                <div class="flex items-center space-x-2 text-sky-400 font-bold text-xs py-2">
                    <i class="fa-solid fa-spinner fa-spin text-sm"></i>
                    <span>SACN 5th Ed, NRC 2006, IRIS 가이드라인 및 관련 임상 논문을 검색 중입니다...</span>
                </div>
            `;
        }

        try {
            const resp = await fetch("/api/consult/vet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: question, context: context })
            });

            if (!resp.ok) throw new Error("CDSS 서버 응답 오류");
            const data = await resp.json();
            if (!data || data.success === false) throw new Error(data?.error || "검색 실패");

            if (statusBox) statusBox.classList.add("hidden");

            if (outBox) {
                outBox.classList.remove("hidden");
                // Markdown 간단 렌더링
                let formatted = data.answer || "";
                formatted = formatted
                    .replace(/^### (.*$)/gim, '<h3 class="text-sm font-extrabold text-sky-300 mt-2 mb-1 border-b border-white/10 pb-1">$1</h3>')
                    .replace(/^#### (.*$)/gim, '<h4 class="text-xs font-bold text-indigo-300 mt-2 mb-1">$1</h4>')
                    .replace(/\*\*(.*?)\*\*/gim, '<strong class="text-white">$1</strong>')
                    .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-slate-200 text-xs">$1</li>')
                    .replace(/\n/gim, '<br>');

                outBox.innerHTML = `
                    <div class="bg-slate-900 border border-sky-500/30 rounded-xl p-4 text-xs space-y-2 leading-relaxed shadow-lg">
                        <div class="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/10 pb-2 mb-2">
                            <span class="font-bold text-sky-300"><i class="fa-solid fa-book-bookmark mr-1"></i> 임상 영양 CDSS & 문헌 검색 결과</span>
                            <span class="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px]">${data.method || 'CDSS'}</span>
                        </div>
                        <div class="text-slate-200">${formatted}</div>
                    </div>
                `;
            }

        } catch (err) {
            if (statusBox) {
                statusBox.innerHTML = `<div class="text-xs text-rose-400 font-bold p-2">⚠️ 조회 오류: ${err.message}</div>`;
            }
        }
    };

})();
