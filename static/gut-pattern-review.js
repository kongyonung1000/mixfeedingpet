(function () {
  "use strict";

  if (window.GutPatternReview) {
    console.warn("[GutPatternReview] 중복 로딩을 확인하세요.");
    return;
  }

  const VERSION = "gut-pattern-review-track2-2.0";
  const BASELINE_STORAGE_KEY = "vet_gpr_track2_baselines_v2";

  // =========================================================================
  // [트랙 2] 믹스피딩 및 약물 사용에 대한 예측 vs 실측 비교 전용 4대 핵심 분변키트 마커
  // 근거 파일: 트랙2_장내환경_변수별_가중치_상관관계.xlsx (pH, 암모니아, 잠혈, 유리 인)
  // =========================================================================
  const MARKERS = {
    ph: {
      label: "① 분변 pH",
      axis: "식이(탄수화물·단백질) 발효 균형 및 산·염기 반응 검토",
      note: "가산형(ΔpH) 예측 모형 · 기준 6.50 (정상 6.0~7.0) | 믹스피딩 배합비·소화제·신장약 반응 비교"
    },
    ammonia: {
      label: "② 암모니아 (NH₃)",
      axis: "단백질 소화·대장 질소 대사 및 요독 흡착 약물 효과 검토",
      note: "기준 20.0 μmol/g (정상 10~30) | 고단백/저단백 사료 비율·간식 통제·신장약(크레메진/아조딜) 반응 비교"
    },
    blood: {
      label: "③ 분변 잠혈 (Occult Blood)",
      axis: "약물(NSAIDs·스테로이드·항암제) 점막 자극 및 장벽 출혈 신호 검토",
      note: "기준 0(음성, <10 ng/mL) 위험 등급 모형 | 타 마커 양호 결과로 상쇄 금지 · 점막보호제/소염제 조정 판단"
    },
    free_p: {
      label: "④ 분변 유리 인 (Free Phosphorus)",
      axis: "식이 인(P) 유입·장관 흡수 및 인바인더(신장약) 결합·배출 효능 검토",
      note: "기준 2.5 mg/g (정상 1.0~4.0) | 신장 처방식 배합 비율 및 인바인더(Phosphorus Binder) 용량 적정성 판단"
    }
  };

  const DEFAULT_UNITS = {
    ph: "-",
    ammonia: "μmol/g",
    blood: "ng/mL",
    free_p: "mg/g"
  };

  const DEFAULT_MARGINS = {
    ph: 0.3,
    ammonia: 5.0,
    blood: 2.0,
    free_p: 0.6
  };

  // 시연(Demo) 전용 4종 예시 수치 — 버튼 클릭 시에만 입력됨 (실측과 엄격 분리)
  const DEMO_SAMPLE_VALUES = {
    ph: 6.9,
    ammonia: 26.0,
    blood: 0.0,
    free_p: 2.2
  };

  const KEYS = Object.keys(MARKERS);
  const warned = new Set();

  let latest = null;
  let session = null;
  let baseline = null;
  let current = null;
  let currentDataSource = "UNMEASURED"; // "UNMEASURED" | "REAL_MEASURED" | "DEMO_SAMPLE"

  function warnOnce(key, message) {
    if (!warned.has(key)) {
      warned.add(key);
      console.warn("[GutPatternReview] " + message);
    }
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function numberOrNull(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === "string" && value.trim() === "") return null;

    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  function format(value) {
    if (value === null || value === undefined) return "미측정";
    return new Intl.NumberFormat("ko-KR", {
      maximumSignificantDigits: 6
    }).format(value);
  }

  function element(id) {
    const el = document.getElementById(id);
    if (!el) {
      throw new Error(
        id + " 요소가 없습니다. 패널 HTML과 파일 연결을 확인하세요."
      );
    }
    return el;
  }

  function loadStoredBaseline(patientName) {
    try {
      const raw = localStorage.getItem(BASELINE_STORAGE_KEY);
      if (!raw) return null;
      const map = JSON.parse(raw);
      return map[patientName || "default"] || null;
    } catch (e) {
      return null;
    }
  }

  function saveStoredBaseline(patientName, recordObj) {
    try {
      const raw = localStorage.getItem(BASELINE_STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      if (recordObj) {
        map[patientName || "default"] = recordObj;
      } else {
        delete map[patientName || "default"];
      }
      localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(map));
    } catch (e) {}
  }

  function getAutoContextValues() {
    const patientName = document.getElementById("patient-name")?.value || "밍키 (환자-001)";
    const dietMix = (window.currentCdssState?.diet_mix || [])
      .map(d => d.label || d.name)
      .filter(Boolean)
      .join(" + ") || "표준 처방식 혼합 급여";
    const drugs = (window.currentCdssState?.drugs || [])
      .join(", ") || "복용 약물 없음";

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const timeStr = `${year}-${month}-${day}T${hours}:${minutes}`;

    return { patientName, dietMix, drugs, timeStr };
  }

  function mount() {
    const root = document.getElementById("gut-pattern-review");

    if (!root) {
      warnOnce(
        "missing-root",
        "index.html에 gut-pattern-review 영역을 추가하세요."
      );
      return null;
    }

    if (root.dataset.gprMounted === VERSION) return root;

    const ctx = getAutoContextValues();
    baseline = loadStoredBaseline(ctx.patientName);

    root.innerHTML = `
      <div class="flex flex-wrap items-center justify-between border-b border-indigo-100 pb-3.5 mb-4 gap-2">
        <div class="flex items-start space-x-3">
          <span class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center text-base shadow-sm shrink-0">🧪</span>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-black shadow-2xs">트랙 2 · 예측 vs 실측 비교 모형</span>
              <h3 class="text-base font-extrabold text-slate-900">
                믹스피딩 및 약물 사용에 대한 4대 핵심 분변키트 (pH · 암모니아 · 잠혈 · 유리 인) 실측 비교 폼
              </h3>
            </div>
            <p class="text-xs text-slate-600 font-medium mt-1">
              『트랙2 장내환경 변수별 가중치 상관관계』 기준 — 실질적인 4종 분변키트 측정값과 모형 예측치를 대조하여 <strong>식이 배합 비율 조정 및 약물(인바인더·소염진통제·요독흡착제·소화제) 의사결정</strong>에 직접 활용합니다. (트랙 1은 실측치 없이 작동하는 장내환경 상태 예측 모형입니다.)
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span id="gpr-source-badge" class="text-[11px] font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-300">
            ⚪ 현재 상태: 4종 키트 실측값 입력 대기 (미측정 보존)
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">환자 고유 ID</label>
          <input id="gpr-patient" type="text"
            class="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
            value="${escapeHtml(ctx.patientName)}"
            placeholder="병원 환자 ID">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">검사 키트 프로토콜 (4종 패드)</label>
          <input id="gpr-protocol" type="text"
            class="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
            value="TRACK2-4KIT-V2 (pH·NH₃·잠혈·유리인)"
            placeholder="4종 분변키트 기준">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">실제 급여 믹스피딩 조합 (제품·비율)</label>
          <input id="gpr-diet" type="text"
            class="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
            value="${escapeHtml(ctx.dietMix)}"
            placeholder="혼합 사료 제품명과 비율">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">복용 약물·처방 내역 (인바인더·NSAIDs 등)</label>
          <input id="gpr-medication" type="text"
            class="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
            value="${escapeHtml(ctx.drugs)}"
            placeholder="약물명 및 용량">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">검체 채취 일시</label>
          <input id="gpr-time" type="datetime-local"
            class="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
            value="${escapeHtml(ctx.timeStr)}">
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" data-gpr-action="start"
            class="border border-indigo-300 rounded-xl px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-xs transition shadow-sm flex items-center space-x-1.5">
            <i class="fa-solid fa-play text-indigo-600"></i>
            <span>1. 현재 조건으로 트랙 2 비교 세션 시작</span>
          </button>
          <button type="button" data-gpr-action="fill-demo"
            class="border border-amber-300 rounded-xl px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition shadow-sm flex items-center space-x-1.5">
            <i class="fa-solid fa-flask text-amber-600"></i>
            <span>시연용 4종 예시 수치 채우기 (실측 분리)</span>
          </button>
          <button type="button" data-gpr-action="reset-inputs"
            class="border border-slate-300 rounded-xl px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs transition flex items-center space-x-1">
            <i class="fa-solid fa-eraser"></i>
            <span>4종 실측란 비우기 (미측정 초기화)</span>
          </button>
        </div>
        <p id="gpr-context" class="text-xs text-slate-500 font-medium"></p>
      </div>

      <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mb-4">
        <table class="w-full text-xs text-left bg-white">
          <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th class="p-2.5">트랙 2 실측 분변키트 (4대 핵심 마커)</th>
              <th class="p-2.5">단위 기준</th>
              <th class="p-2.5 bg-blue-50/50 text-blue-900">트랙 2 모형 예측 범위 (미검증 초기 가설 Prior · ±오차폭)</th>
              <th class="p-2.5 bg-amber-50/50 text-amber-900">실제 키트 측정값 입력 (미측정 시 빈칸 유지)</th>
              <th class="p-2.5 text-slate-600">개인별 판독폭 (±허용편차)</th>
              <th class="p-2.5 text-slate-500">믹스피딩 · 약물 의사결정 연결 역할</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${KEYS.map(key => `
              <tr class="hover:bg-slate-50/80 transition">
                <td class="p-2.5 font-extrabold text-slate-800">
                  ${escapeHtml(MARKERS[key].label)}
                </td>
                <td class="p-2.5">
                  <input id="gpr-unit-${key}" type="text"
                    value="${escapeHtml(DEFAULT_UNITS[key] || '')}"
                    class="border border-slate-300 rounded px-2 py-1 w-24 text-center font-medium bg-slate-50">
                </td>
                <td id="gpr-expected-${key}" class="p-2.5 font-extrabold text-blue-700 bg-blue-50/30">
                  —
                </td>
                <td class="p-2.5 bg-amber-50/30">
                  <input id="gpr-value-${key}" type="number"
                    step="any" min="0"
                    value=""
                    placeholder="미측정 (직접 입력)"
                    class="border border-amber-300 rounded px-2.5 py-1.5 w-36 font-extrabold text-amber-900 bg-white focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400 placeholder:font-normal">
                </td>
                <td class="p-2.5">
                  <input id="gpr-margin-${key}" type="number"
                    step="any" min="0"
                    value="${DEFAULT_MARGINS[key] !== '' ? DEFAULT_MARGINS[key] : ''}"
                    class="border border-slate-300 rounded px-2 py-1 w-24 text-center font-medium"
                    placeholder="기본권장">
                </td>
                <td class="p-2.5 text-[11px] text-slate-500">
                  <div class="font-bold text-slate-700">${escapeHtml(MARKERS[key].axis)}</div>
                  <div class="text-[10px] text-slate-400 mt-0.5">${escapeHtml(MARKERS[key].note)}</div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100 mb-4">
        <label class="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
          <input id="gpr-confirm" type="checkbox" class="w-4 h-4 text-indigo-600 rounded">
          <span>입력한 4종 키트 수치는 실제 검사값(또는 명시적 시연값)이며, 검사 프로토콜·단위·채취 조건을 확인했습니다.</span>
        </label>

        <div class="flex flex-wrap items-center gap-2">
          <button type="button" data-gpr-action="analyze"
            class="rounded-xl px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5">
            <i class="fa-solid fa-magnifying-glass-chart"></i>
            <span>2. 트랙 2 예측 vs 실측 비교 및 의사결정 분석 실행</span>
          </button>

          <button type="button" data-gpr-action="baseline"
            class="border border-slate-300 hover:bg-slate-100 rounded-xl px-3.5 py-2 text-slate-700 font-bold text-xs transition">
            현재 4종 측정 기록을 개인 기준선(Baseline)으로 저장
          </button>

          <button type="button" data-gpr-action="clear"
            class="border border-slate-300 hover:bg-slate-100 rounded-xl px-3.5 py-2 text-slate-500 font-bold text-xs transition">
            개인 기준선 해제
          </button>
        </div>
      </div>

      <p id="gpr-message" role="status" class="text-xs font-semibold my-2 text-indigo-900">
        💡 [트랙 2] 실제 측정한 분변키트 항목(pH, 암모니아, 잠혈, 유리 인 중 1개 이상)을 입력하신 뒤 확인 체크박스를 선택하고 [2. 트랙 2 예측 vs 실측 비교 및 의사결정 분석 실행]을 눌러주세요.
      </p>
      <div id="gpr-result" class="space-y-4"></div>
    `;

    root.dataset.gprMounted = VERSION;

    root.addEventListener("input", function (ev) {
      if (ev.target && ev.target.id && ev.target.id.startsWith("gpr-value-")) {
        currentDataSource = "REAL_MEASURED";
        updateSourceBadge();
      }
      current = null;
      element("gpr-result").replaceChildren();
      element("gpr-message").textContent =
        "입력이 변경되었습니다. 확인 후 [2. 트랙 2 예측 vs 실측 비교 및 의사결정 분석 실행]을 눌러주세요.";
    });

    root.addEventListener("click", function (event) {
      const button = event.target.closest("button[data-gpr-action]");
      if (!button) return;

      const action = button.dataset.gprAction;

      try {
        if (action === "start") startSession();
        if (action === "fill-demo") fillDemoSampleValues();
        if (action === "reset-inputs") resetMeasuredInputs();
        if (action === "analyze") {
          try {
            ["ph", "ammonia", "blood", "free_p"].forEach(function (k) {
              var gEl = document.getElementById("gpr-value-" + k);
              var mEl = document.getElementById("m9-" + k);
              if (gEl && mEl && gEl.value !== "") {
                mEl.value = gEl.value;
              }
            });
          } catch (syncErr) {}
          runAnalysis();
        }
        if (action === "baseline") setBaseline();
        if (action === "clear") clearBaseline();
      } catch (error) {
        element("gpr-message").textContent = "⚠️ " + error.message;
      }
    });

    try {
      startSession();
    } catch (e) {}

    return root;
  }

  function updateSourceBadge() {
    const badge = document.getElementById("gpr-source-badge");
    if (!badge) return;
    if (currentDataSource === "REAL_MEASURED") {
      badge.className = "text-[11px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300";
      badge.textContent = "🟢 자료 상태: 4종 키트 실제 측정값 입력됨";
    } else if (currentDataSource === "DEMO_SAMPLE") {
      badge.className = "text-[11px] font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg border border-amber-300";
      badge.textContent = "🟠 자료 상태: 시연용 예시값 (실제 환자 기록과 분리)";
    } else {
      badge.className = "text-[11px] font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-300";
      badge.textContent = "⚪ 자료 상태: 4종 키트 실측값 입력 대기 (미측정 보존)";
    }
  }

  function fillDemoSampleValues() {
    KEYS.forEach(key => {
      const valEl = document.getElementById("gpr-value-" + key);
      if (valEl && DEMO_SAMPLE_VALUES[key] !== undefined) {
        valEl.value = DEMO_SAMPLE_VALUES[key];
      }
    });
    const confirmEl = document.getElementById("gpr-confirm");
    if (confirmEl) confirmEl.checked = true;
    currentDataSource = "DEMO_SAMPLE";
    updateSourceBadge();
    element("gpr-message").textContent =
      "🟠 트랙 2 시연용 4종 예시 수치(pH, 암모니아, 잠혈, 유리 인)가 입력되었습니다. [2. 트랙 2 예측 vs 실측 비교 및 의사결정 분석 실행]을 눌러 결과를 확인하세요.";
  }

  function resetMeasuredInputs() {
    KEYS.forEach(key => {
      const valEl = document.getElementById("gpr-value-" + key);
      if (valEl) valEl.value = "";
    });
    const confirmEl = document.getElementById("gpr-confirm");
    if (confirmEl) confirmEl.checked = false;
    currentDataSource = "UNMEASURED";
    window._fecalManualOverride = false;
    updateSourceBadge();
    current = null;
    element("gpr-result").replaceChildren();
    try {
      if (window.STEPWISE_DATA && session && session.context) {
        const initialStepwise = computeStepwiseEngine(session.context, {});
        if (initialStepwise) {
          renderStepwiseAttribution(initialStepwise, element("gpr-result"));
        }
      }
    } catch (initErr) {
      console.warn("[initialStepwise error]", initErr);
    }
    element("gpr-message").textContent =
      "⚪ 4종 분변키트 실측 입력란을 모두 비우고 미측정 상태로 초기화했습니다.";
  }

  function readRecord() {
    const confirm = element("gpr-confirm");

    if (!confirm.checked) {
      throw new Error(
        "실제 검사값(또는 시연값) 확인 체크박스를 선택한 뒤 분석을 실행해 주세요."
      );
    }

    const patient = element("gpr-patient").value.trim();
    const protocol = element("gpr-protocol").value.trim();
    const diet = element("gpr-diet").value.trim();
    const medication = element("gpr-medication").value.trim();
    const time = element("gpr-time").value;

    if (!patient || !protocol || !diet || !time) {
      throw new Error(
        "환자 ID, 검사법 기준, 급여 식단 정보, 채취 일시는 필수 입력입니다."
      );
    }

    const markers = {};
    let count = 0;

    KEYS.forEach(key => {
      const unit = element("gpr-unit-" + key).value.trim();
      const value = numberOrNull(element("gpr-value-" + key).value);
      const margin = numberOrNull(element("gpr-margin-" + key).value);

      if (value !== null && !unit) {
        throw new Error(
          MARKERS[key].label + "의 입력 단위를 확인하세요."
        );
      }

      if (value !== null) count += 1;

      markers[key] = { unit, value, margin };
    });

    if (count === 0) {
      throw new Error("측정한 4종 분변키트(pH, 암모니아, 잠혈, 유리 인) 중 1개 이상 입력하거나 [시연용 4종 예시 수치 채우기]를 사용해 주세요.");
    }

    return {
      recordedAt: new Date().toISOString(),
      dataSource: currentDataSource === "UNMEASURED" ? "REAL_MEASURED" : currentDataSource,
      ruleVersion: VERSION,
      patient,
      protocol,
      diet,
      medication,
      time,
      markers
    };
  }

  function startSession() {
    if (!latest) {
      latest = {
        species: "개",
        age_years: 5.0,
        weight_kg: 6.5,
        diet_mix: [],
        drugs: [],
        diseases: [],
        expected: {}
      };
    }

    session = {
      startedAt: new Date().toISOString(),
      context: clone(latest)
    };

    const pat = document.getElementById("gpr-patient")?.value?.trim();
    if (pat) {
      const savedBase = loadStoredBaseline(pat);
      if (savedBase) baseline = savedBase;
    }

    current = null;
    element("gpr-result").replaceChildren();
    try {
      if (window.STEPWISE_DATA && session && session.context) {
        const initialStepwise = computeStepwiseEngine(session.context, {});
        if (initialStepwise) {
          renderStepwiseAttribution(initialStepwise, element("gpr-result"));
        }
      }
    } catch (initErr) {
      console.warn("[initialStepwise error]", initErr);
    }
  }

  function matchCondition(target, base) {
    if (!target || !base) return false;
    return (
      target.patient === base.patient &&
      target.protocol === base.protocol &&
      target.diet === base.diet &&
      target.medication === base.medication
    );
  }

  function compareToExpected(actual, expected, key) {
    if (!actual || actual.value === null) return "미측정 (판단 보류)";
    if (!expected || expected.value === null) return "예상값 미적용";
    if (actual.unit !== expected.unit) return "단위 불일치 (비교 불가)";

    // 잠혈(blood)은 기준값이 0(음성)이므로 배수 곱셈 대신 검출한계(Cut-off = 10.0) 및 위험 등급 모형으로 비교
    if (key === "blood") {
      const cutOff = 10.0;
      const tierLabel = expected.riskTier || "음성 예상 (Low Risk)";
      if (actual.value <= 0) {
        return `음성 확인 (모형 등급: ${tierLabel})`;
      }
      if (actual.value < cutOff) {
        return `검출한계 미만/약반응 (${actual.value} < ${cutOff}, 모형 등급: ${tierLabel})`;
      }
      return `양성/검출한계 이상 (${actual.value} ≥ ${cutOff} · 별도 확인 신호, 모형 등급: ${tierLabel})`;
    }

    if (actual.margin === null) return "차이만 확인";

    const diff = actual.value - expected.value;
    const low = Math.max(0, Math.round((expected.value - actual.margin) * 100) / 100);
    const high = Math.round((expected.value + actual.margin) * 100) / 100;
    if (Math.abs(diff) <= actual.margin) {
      return `모형 예상 범위 이내 (${low}~${high})`;
    }
    return diff > 0
      ? `모형 예상 범위 밖 상회 (> ${high})`
      : `모형 예상 범위 밖 하회 (< ${low})`;
  }

  function compareToPrevious(actual, prev) {
    if (!actual || actual.value === null) return "미측정 (판단 보류)";
    if (!prev || prev.value === null) return "이전 기록 없음";
    if (actual.unit !== prev.unit) return "단위 불일치";

    const diff = Math.round((actual.value - prev.value) * 1000) / 1000;
    if (diff === 0) return "↔ 변화 없음 (0)";
    return diff > 0 ? `↑ 증가 (+${diff})` : `↓ 감소 (${diff})`;
  }

  function analyze(record, expectedSource, baseRecord) {
    const compared = {};
    const shifts = {};

    KEYS.forEach(key => {
      compared[key] = compareToExpected(
        record.markers[key],
        expectedSource?.[key],
        key
      );
      shifts[key] = compareToPrevious(
        record.markers[key],
        baseRecord?.markers[key]
      );
    });

    const patterns = [];

    const phLow = compared.ph.includes("하회");
    const phHigh = compared.ph.includes("상회");
    const ammoniaHigh = compared.ammonia.includes("상회");
    const ammoniaLow = compared.ammonia.includes("하회");
    const freePHigh = compared.free_p.includes("상회");
    const freePLow = compared.free_p.includes("하회");
    const freePMeasured = record.markers.free_p.value !== null;

    // 1. 분변 pH & 암모니아 (믹스피딩 단백질/탄수화물 비율 & 요독소 흡착제·소화효소 의사결정)
    if (phLow || phHigh || ammoniaHigh || ammoniaLow) {
      const items = [
        phLow ? "분변 pH 예측치 하회(산성화)" : phHigh ? "분변 pH 예측치 상회(알칼리화)" : null,
        ammoniaHigh ? "암모니아 예측치 상회(질소 부하↑)" : ammoniaLow ? "암모니아 예측치 하회(질소 억제 양호)" : null
      ].filter(Boolean);

      let decisionGuide = "";
      if (ammoniaHigh || phHigh) {
        decisionGuide = `[믹스피딩 & 약물 의사결정] ① 믹스피딩 조정: 고단백 사료·육류 간식 유입량이 현재 소화능을 초과했을 가능성이 높으므로 저단백/가수분해 처방식 비율 상향 및 발효성 수용성 섬유소 보강을 검토합니다. ② 약물 점검: 신장약(구강 요독소 흡착제·아조딜·락툴로스) 또는 소화효소제를 복용 중이라면 복약 순응도와 용량 적정성을 재점검하세요.`;
      } else if (phLow) {
        decisionGuide = `[믹스피딩 & 약물 의사결정] ① 믹스피딩 조정: 소장에서 미처 흡수되지 못한 전분·탄수화물이 대장으로 유입되어 산성 과발효를 일으킨 신호입니다. 고탄수화물 사료나 고구마·과일 간식 비중을 낮추고 소화율이 높은 배합비로 조정을 검토합니다. ② 약물 점검: 소화효소제(아밀라아제 포함) 보충 여부를 검토합니다.`;
      } else {
        decisionGuide = `[믹스피딩 & 약물 의사결정] 암모니아가 모형 예측치보다 낮게 유지되어 저단백 식이 배합 및 요독소 흡착제(신장약)의 장내 질소 억제 반응이 매우 양호합니다. 현 배합 비율과 약물 용량 유지를 권장합니다.`;
      }

      patterns.push({
        title: "① 분변 pH · 암모니아 예측 vs 실측 비교 (식이 단백질/탄수화물 배합 & 요독흡착·소화제 의사결정)",
        items,
        observation: `[관찰] 트랙 2 대사·산염기 키트에서 ${items.join(" 및 ")} 패턴이 확인되었습니다.`,
        interpretation: `[관련 해석] 믹스피딩 식단의 단백질·탄수화물 기질 비율, 장관 체류 시간, 그리고 요독소 흡착제·소화효소제 투여에 따른 대장 내 NH₃/pH 평형 반응을 반영합니다.`,
        nextCheck: decisionGuide
      });
    }

    // 2. 분변 유리 인 (Free Phosphorus) — 신장 처방식 배합비 & 인바인더(Phosphorus Binder) 의사결정
    if (freePMeasured) {
      const fpVal = record.markers.free_p.value;
      const fpUnit = record.markers.free_p.unit;
      const fpExp = expectedSource?.free_p?.value ?? 2.5;
      if (freePHigh) {
        patterns.push({
          title: "② 분변 유리 인(Free P) 예측 범위 상회 (식이 인(P) 배합 비율 & 인바인더 용량 의사결정)",
          items: [`실측 유리 인: ${format(fpVal)} ${fpUnit} (예측치 ${format(fpExp)} ${fpUnit} 상회)`],
          observation: `[관찰] 분변 유리 인(${format(fpVal)} ${fpUnit})이 환자·식이·약물 조건으로 산출한 트랙 2 예측 범위를 상회하였습니다.`,
          interpretation: `[관련 해석] ① 식단(고단백 사료·육류 토핑/간식)을 통한 인(P) 유입량이 예상보다 많거나, ② 인바인더(신장약) 복용 시 결합되지 못한 유리 인이 잔류하거나, ③ 장 점막 손상(IBD·PLE·췌장염)으로 인한 인 흡수 저하 가능성을 함께 시사합니다.`,
          nextCheck: `[믹스피딩 & 약물 의사결정] 혈중 인(Serum P) 수치를 즉시 대조하세요. 혈중 인이 함께 높다면 육류 간식을 중단하고 저인 신장 처방식(k/d·레날) 배합 비율을 상향하며, 인바인더(Phosphorus Binder)의 식사 직후 혼합 급여 여부 및 용량 증량을 검토합니다.`
        });
      } else if (freePLow) {
        patterns.push({
          title: "② 분변 유리 인(Free P) 예측 범위 하회 (인바인더 결합 효능 및 저인 식단 반응 확인)",
          items: [`실측 유리 인: ${format(fpVal)} ${fpUnit} (예측치 ${format(fpExp)} ${fpUnit} 하회)`],
          observation: `[관찰] 분변 유리 인(${format(fpVal)} ${fpUnit})이 모형 예측 범위보다 낮게 측정되었습니다.`,
          interpretation: `[관련 해석] 저단백·저인 처방식 급여 및 인바인더(가중치 0.65~0.68)가 장관 내 가용 유리 인을 효과적으로 결합·억제하고 있거나, 전체 식사 섭취량이 감소한 상태일 수 있습니다.`,
          nextCheck: `[믹스피딩 & 약물 의사결정] 혈중 인(P) 및 알부민 수치와 실제 일일 사료 섭취량(g)을 확인하여, 저인산혈증이나 식욕부진이 없다면 현재 신장식 배합 비율과 인바인더 용량을 유지합니다.`
        });
      } else {
        patterns.push({
          title: "② 분변 유리 인(Free P) 모형 예측 범위 일치 (식이 인 & 인바인더 균형 유지)",
          items: [`실측 유리 인: ${format(fpVal)} ${fpUnit} (예측 범위 이내)`],
          observation: `[관찰] 분변 유리 인(${format(fpVal)} ${fpUnit})이 현재 믹스피딩 및 약물(인바인더 등) 가중치 예측 범위 이내로 확인되었습니다.`,
          interpretation: `[관련 해석] 현재 설계된 처방식 혼합 비율과 신장약(인바인더) 용량이 예측 모형과 부합하게 작동하고 있습니다.`,
          nextCheck: `[믹스피딩 & 약물 의사결정] 정기 혈액검사(BUN, Cr, SDMA, P) 추이와 대조하며 현 식단 인(P) 배합 비율과 인바인더 투약 프로토콜을 유지합니다.`
        });
      }
    }

    // 3. 분변 잠혈 반응 (NSAIDs·스테로이드·항암제 점막 안전성 및 식이 제형 의사결정)
    if (
      record.markers.blood.value !== null &&
      record.markers.blood.value > 0
    ) {
      patterns.push({
        title: "③ 분변 잠혈 반응 검출 — 별도 확인 신호 (소염진통제·스테로이드 조정 및 점막보호 의사결정)",
        items: [`잠혈 측정값: ${format(record.markers.blood.value)} ${record.markers.blood.unit} (모형 등급: ${expectedSource?.blood?.riskTier || '확인 필요'})`],
        observation: `[관찰] 분변 잠혈 반응(${format(record.markers.blood.value)} ${record.markers.blood.unit})이 검출되었습니다. 다른 대사 마커가 안정적이더라도 잠혈 신호는 절대 상쇄하지 않습니다.`,
        interpretation: `[관련 해석] NSAIDs(가중치 1.80~1.85), 스테로이드(1.45~1.50), 항암제(1.65~1.70) 복용에 따른 위장관 점막 미란·출혈 가능성 또는 기저 장질환(IBD·림프종·PLE) 및 육류 헤모글로빈 식이 간섭을 함께 검토합니다.`,
        nextCheck: `[믹스피딩 & 약물 의사결정] ① 약물 조정: NSAIDs·스테로이드 복용 중이라면 위장관 점막보호제(Sucralfate, 오메프라졸 등) 즉시 병용 또는 비궤양성 진통제(가바펜틴 등)로의 대체·휴약을 수의사가 판단합니다. ② 식이 조정: 물리적 점막 자극을 줄이기 위해 습식·화식 또는 가수분해 처방식 비율 상향을 검토합니다.`
      });
    }

    return { compared, shifts, patterns };
  }

  function render(summary) {
    const area = element("gpr-result");
    area.replaceChildren();

    const card = document.createElement("div");
    card.className = "border-2 border-indigo-200 bg-white rounded-2xl p-5 shadow-sm space-y-4";

    const patternsHtml =
      summary.analysis.patterns.length === 0
        ? '<div class="p-3.5 bg-emerald-50 text-emerald-900 rounded-xl text-xs font-semibold border border-emerald-200 space-y-1"><div>• <strong>[관찰]</strong> 측정한 4종 핵심 분변키트(pH, 암모니아, 잠혈, 유리 인)에서 트랙 2 모형 예측 범위로부터 뚜렷한 이탈이 관찰되지 않았습니다.</div><div>• <strong>[믹스피딩 · 약물 의사결정]</strong> 현재 설계된 믹스피딩 배합 비율과 투약 중인 약물 용량이 장내에서 예측 범위 내로 안정적인 반응을 보이고 있으므로 현 처방 유지를 검토합니다.</div></div>'
        : summary.analysis.patterns.map(p => `
            <div class="border border-slate-200 bg-slate-50 rounded-xl p-3.5 space-y-1.5">
              <div class="font-extrabold text-xs text-indigo-950 flex items-center space-x-1.5">
                <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span>${escapeHtml(p.title)}</span>
              </div>
              <div class="text-[11px] font-bold text-indigo-700">${escapeHtml(p.items.join(" · "))}</div>
              <div class="text-xs text-slate-800 leading-relaxed">${escapeHtml(p.observation)}</div>
              <div class="text-xs text-slate-700 leading-relaxed">${escapeHtml(p.interpretation)}</div>
              <div class="text-[11px] text-indigo-950 font-semibold bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-200/80">${escapeHtml(p.nextCheck)}</div>
            </div>
          `).join("");

    const sameDiet = summary.baseline && summary.record.diet === summary.baseline.diet;
    const sameMed = summary.baseline && summary.record.medication === summary.baseline.medication;

    let baselineNotice = '<span class="text-slate-500 text-[11px] bg-slate-100 px-2.5 py-1 rounded-lg font-semibold">개인 기준선(Baseline) 미설정</span>';
    if (summary.baseline) {
      if (matchCondition(summary.record, summary.baseline)) {
        baselineNotice = '<span class="text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg font-bold text-[11px]">✅ 동일 식단·약물·검사법 기준선과 비교 중</span>';
      } else {
        const diffNotes = [];
        if (!sameDiet) diffNotes.push("식단 변경됨");
        if (!sameMed) diffNotes.push("약물 동시 변경됨(해석 주의)");
        if (summary.record.protocol !== summary.baseline.protocol) diffNotes.push("검사법 변경됨");
        baselineNotice = `<span class="text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg font-bold text-[11px]">⚠️ 기준선 대비 조건 변경 (${escapeHtml(diffNotes.join(" · ") || "환자 정보 변경")})</span>`;
      }
    }

    const srcLabel = summary.record.dataSource === "DEMO_SAMPLE"
      ? '<span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">시연 예시 데이터</span>'
      : '<span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">4종 키트 실제 측정 데이터</span>';

    card.innerHTML = `
      <div class="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div>
          <div class="flex items-center space-x-2">
            <h4 class="font-black text-sm text-slate-900">[트랙 2 결과] 4대 핵심 분변키트 예측 vs 실측 비교 & 믹스피딩·약물 의사결정 리포트</h4>
            ${srcLabel}
          </div>
          <p class="text-xs text-slate-500 mt-0.5">환자 ID: ${escapeHtml(summary.record.patient)} | 채취일시: ${escapeHtml(summary.record.time)} | 규칙버전: ${escapeHtml(summary.record.ruleVersion)}</p>
        </div>
        <div>${baselineNotice}</div>
      </div>

      <div class="space-y-2">
        <h5 class="text-xs font-bold text-slate-700">트랙 2 실측 비교 기반 의사결정 가이드 ([관찰 ➔ 해석 ➔ 믹스피딩·약물 조정 액션]):</h5>
        ${patternsHtml}
      </div>

      <div class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full text-xs text-left">
          <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th class="p-2.5">트랙 2 분변키트 (4종)</th>
              <th class="p-2.5">① 실제 키트 측정값</th>
              <th class="p-2.5">② 환자 이전 기록 대비 변화</th>
              <th class="p-2.5">③ 트랙 2 모형 예측 대비 판정</th>
              <th class="p-2.5">④ 연결 검토할 믹스피딩·약물 요인</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${KEYS.map(k => {
              const mVal = summary.record.markers[k].value;
              const valStr = mVal === null ? "미측정 (판단 보류)" : `${format(mVal)} ${summary.record.markers[k].unit !== '-' ? summary.record.markers[k].unit : ''}`;
              const compStr = summary.analysis.compared[k];
              const compColor = compStr.includes("이내") || compStr.includes("음성 확인")
                ? "text-emerald-700"
                : compStr.includes("범위 밖") || compStr.includes("양성")
                ? "text-rose-700"
                : "text-slate-500";
              return `
              <tr class="hover:bg-slate-50">
                <td class="p-2.5 font-extrabold text-slate-800">${escapeHtml(MARKERS[k].label)}</td>
                <td class="p-2.5 font-semibold ${mVal === null ? 'text-slate-400 italic' : 'text-slate-900'}">
                  ${escapeHtml(valStr)}
                </td>
                <td class="p-2.5 font-semibold text-indigo-700">
                  ${escapeHtml(summary.analysis.shifts[k])}
                </td>
                <td class="p-2.5 font-bold ${compColor}">
                  ${escapeHtml(compStr)}
                </td>
                <td class="p-2.5 text-[11px] text-slate-600">
                  ${escapeHtml(MARKERS[k].axis)}
                </td>
              </tr>
            `;}).join("")}
          </tbody>
        </table>
      </div>
    `;

    area.appendChild(card);

    if (summary.stepwise) {
      renderStepwiseAttribution(summary.stepwise, area);
    }
  }

  // =========================================================================
  // [트랙 1 V5 순차 감별 엔진] 4단계 순차 감별 (Stepwise Factor Attribution)
  // Step 1 생리적 기저선 ➔ Step 2 식이 기질 부하 ➔ Step 3 병태·약물 부하 ➔ Step 4 분변키트 편차
  // =========================================================================
  function computeStepwiseEngine(context, markers) {
    if (!window.STEPWISE_DATA) return null;
    const SD = window.STEPWISE_DATA;
    const isCat = context.species === "고양이";
    const tbl = isCat ? SD.cat : SD.dog;
    const P = SD.params;
    const LAT = SD.latent;
    const KIT = SD.kit;

    // 1. Step 1: 연령 및 체급 매칭
    const age = Number(context.age_years) || 5.0;
    const wt = Number(context.weight_kg) || (isCat ? 4.5 : 10.0);

    let ageTarget = "";
    if (isCat) {
      ageTarget = age <= 1 ? "1년령 이하 (자묘/성장기)" : (age >= 7 ? "7년령 이상 (노령묘/시니어)" : "1년 ~ 7년 (성묘 기준)");
    } else {
      ageTarget = age <= 1 ? "1년령 이하 (성장기)" : (age >= 7 ? "7년령 이상 (노령기)" : "1년 ~ 7년 (성견 기준)");
    }

    let sizeTarget = "";
    if (isCat) {
      sizeTarget = wt < 3.5 ? "소형묘 (<3.5kg / 싱가푸라 등)" : (wt > 6.0 ? "대형묘 (>6kg / 메인쿤·랙돌 등)" : "중형묘 (3.5~6kg, 코숏/표준 기준)");
    } else {
      sizeTarget = wt < 10.0 ? "소형견 (<10kg)" : (wt > 25.0 ? "대형견 (>25kg)" : "중형견 (10~25kg, 기준)");
    }

    const rowAge = tbl.find(r => r[0] === ageTarget) || tbl.find(r => r[2] === "연령");
    const rowSize = tbl.find(r => r[0] === sizeTarget) || tbl.find(r => r[2].includes("체"));

    const getWeights = row => row ? row[3].concat(row[4]) : [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const wAge = getWeights(rowAge);
    const wSize = getWeights(rowSize);

    const d1 = [];
    for (let i = 0; i < 10; i++) {
      d1.push((wAge[i] - 1.0) + (wSize[i] - 1.0));
    }
    const s1 = d1.map(v => 1.0 + v);

    // 2. Step 2: 식이 기질 부하 (믹스피딩 비율 가중평균)
    let dietItems = Array.isArray(context.diet_mix) && context.diet_mix.length > 0 ? context.diet_mix : [];
    if (dietItems.length === 0) {
      dietItems = [{ label: "표준 사료", ratio: 100 }];
    }
    const totRatio = dietItems.reduce((acc, cur) => acc + (Number(cur.ratio) || 0), 0) || 100;

    const dietRows = [];
    dietItems.forEach(d => {
      const lbl = (d.label || d.name || "").trim();
      const r = (Number(d.ratio) || 0) / totRatio;
      let matched = tbl.find(x => x[1] === 2 && x[0] === lbl);
      if (!matched) {
        matched = tbl.find(x => x[1] === 2 && (lbl.includes(x[0]) || x[0].includes(lbl)));
      }
      if (!matched) {
        if (lbl.includes("신장")) matched = tbl.find(x => x[0].includes("신장 질환 처방식"));
        else if (lbl.includes("소화") || lbl.includes("위장관")) matched = tbl.find(x => x[0].includes("위장관 처방식"));
        else if (lbl.includes("습식") || lbl.includes("캔")) matched = tbl.find(x => x[0].includes("습식"));
        else if (lbl.includes("가수분해")) matched = tbl.find(x => x[0].includes("가수분해"));
        else matched = tbl.find(x => x[0].includes("건식 (Kibble)")) || tbl.find(x => x[1] === 2);
      }
      if (matched) {
        dietRows.push({ row: matched, ratio: r });
      }
    });

    const d2 = [];
    for (let i = 0; i < 10; i++) {
      let sum = 0;
      dietRows.forEach(dr => {
        const w = getWeights(dr.row);
        sum += dr.ratio * (w[i] - 1.0);
      });
      d2.push(sum);
    }
    const s2 = [];
    for (let i = 0; i < 10; i++) {
      s2.push(s1[i] + d2[i]);
    }

    // 3. Step 3: 약물, 질병, 혈액마커
    const drugs = Array.isArray(context.drugs) ? context.drugs : [];
    const diseases = Array.isArray(context.diseases) ? context.diseases : [];

    let labs = [];
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      document.querySelectorAll("input[id^='lab-marker-']:checked").forEach(el => {
        const txt = el.parentElement?.textContent?.trim();
        if (txt) labs.push(txt);
      });
    }

    const matchRows = (arr, cat) => {
      const matched = [];
      arr.forEach(name => {
        const nm = String(name).trim();
        let r = tbl.find(x => x[2].includes(cat) && x[0] === nm);
        if (!r) r = tbl.find(x => x[2].includes(cat) && (nm.includes(x[0]) || x[0].includes(nm)));
        if (r && !matched.includes(r)) matched.push(r);
      });
      return matched;
    };

    const matchedDrugs = matchRows(drugs, "약물");
    const matchedDiseases = matchRows(diseases, "질병");
    const matchedLabs = matchRows(labs, "혈액");

    function aggEffects(effects, alpha) {
      if (!effects || effects.length === 0) return 0.0;
      const s = effects.slice().sort((a, b) => Math.abs(b) - Math.abs(a));
      let sum = s[0];
      for (let i = 1; i < s.length; i++) sum += (alpha ?? 0.40) * s[i];
      return sum;
    }

    const d3 = [];
    const raw3 = [];
    for (let i = 0; i < 10; i++) {
      const drugDeltas = matchedDrugs.map(r => getWeights(r)[i] - 1.0);
      const disDeltas = matchedDiseases.map(r => getWeights(r)[i] - 1.0);
      const labDeltas = matchedLabs.map(r => getWeights(r)[i] - 1.0);

      const effDrug = aggEffects(drugDeltas, P.alpha);
      const effDis = aggEffects(disDeltas, P.alpha);
      const effLab = aggEffects(labDeltas, P.alpha);

      let effDisLab = 0.0;
      if (effDis * effLab > 0) {
        effDisLab = Math.abs(effDis) >= Math.abs(effLab) ? effDis + P.gamma * effLab : effLab + P.gamma * effDis;
      } else {
        effDisLab = effDis + effLab;
      }

      const effDrugAdj = (effDrug * effDisLab > 0) ? effDrug * P.drugCollinear : effDrug;
      const effDietAdj = (d2[i] * effDisLab > 0 && Math.abs(effDisLab) > P.dietCorrThr) ? (P.dietCorr * d2[i] - d2[i]) : 0.0;

      const r3 = effDrugAdj + effDisLab + effDietAdj;
      raw3.push(r3);
      const delta3 = P.satCap * Math.tanh(r3 / P.satCap);
      d3.push(delta3);
    }

    const s3 = [];
    for (let i = 0; i < 10; i++) {
      s3.push(s2[i] + d3[i]);
    }

    // 4종 키트 예측치 산출 (Step1, Step2, Step3)
    const kitPred = {};
    KIT.forEach((k, ki) => {
      const idx = 6 + ki;
      if (k === "ph") {
        kitPred[k] = [
          SD.kitBase[k],
          Math.min(8.2, Math.max(5.2, SD.kitBase[k] * s1[idx])),
          Math.min(8.2, Math.max(5.2, SD.kitBase[k] * s2[idx])),
          Math.min(8.2, Math.max(5.2, SD.kitBase[k] * s3[idx]))
        ];
      } else if (k === "nh3" || k === "freep") {
        kitPred[k] = [
          SD.kitBase[k],
          SD.kitBase[k] * Math.min(2.1, Math.max(0.55, s1[idx])),
          SD.kitBase[k] * Math.min(2.1, Math.max(0.55, s2[idx])),
          SD.kitBase[k] * Math.min(2.1, Math.max(0.55, s3[idx]))
        ];
      } else if (k === "blood") {
        const calcTier = (sVal, isFinal) => {
          const risk = Math.max(0, Math.min(2.1, Math.max(0.55, sVal)) - 1.0);
          const hasUlcer = isFinal && matchedDrugs.some(r => r[0].includes("NSAIDs") || r[0].includes("스테로이드") || r[0].includes("항암제"));
          if (risk >= 0.42 || hasUlcer) return 2;
          if (risk >= 0.16) return 1;
          return 0;
        };
        kitPred[k] = [
          0,
          calcTier(s1[idx], false),
          calcTier(s2[idx], false),
          calcTier(s3[idx], true)
        ];
      }
    });

    // 4. Step 4: 분변키트 실측 편차 및 6대 잠재 지수 이동
    const z = {};
    const zeff = {};
    const kitMeasured = {};

    KIT.forEach(k => {
      const mKey = k === "nh3" ? "ammonia" : (k === "freep" ? "free_p" : k);
      const mObj = markers[mKey];
      const val = mObj ? mObj.value : null;
      kitMeasured[k] = val;

      if (val !== null && val !== undefined) {
        if (k === "blood") {
          const g = val < 10 ? 0 : (val < 20 ? 1 : 2);
          const predG = kitPred[k][3];
          const rawZ = g - predG;
          z[k] = Math.max(-P.zClamp, Math.min(P.zClamp, rawZ));
          zeff[k] = Math.max(0, z[k]);
        } else {
          const predVal = kitPred[k][3];
          const margin = SD.kitMargin[k];
          const rawZ = (val - predVal) / margin;
          const clampedZ = Math.max(-P.zClamp, Math.min(P.zClamp, rawZ));
          z[k] = clampedZ;
          if (Math.abs(clampedZ) <= P.deadZone) {
            zeff[k] = 0.0;
          } else {
            if (k === "ph" && clampedZ < 0 && val >= 6.0) {
              zeff[k] = 0.0;
            } else {
              zeff[k] = (clampedZ > 0 ? 1 : -1) * (Math.abs(clampedZ) - P.deadZone);
            }
          }
        }
      } else {
        z[k] = 0.0;
        zeff[k] = 0.0;
      }
    });

    const d4 = [];
    const s4 = [];
    for (let i = 0; i < 6; i++) {
      let trans = 0.0;
      KIT.forEach(k => {
        const ze = zeff[k] || 0.0;
        if (ze > 0) {
          trans += SD.loading[k].pos[i] * ze;
        } else if (ze < 0) {
          trans += SD.loading[k].neg[i] * Math.abs(ze);
        }
      });
      d4.push(trans);
      const finalVal = Math.min(P.latMax, Math.max(P.latMin, s3[i] + trans));
      s4.push(finalVal);
    }

    return {
      species: context.species,
      age,
      weight: wt,
      matched: {
        age: rowAge ? rowAge[0] : ageTarget,
        size: rowSize ? rowSize[0] : sizeTarget,
        diet: dietRows.map(dr => `${dr.row[0]} (${Math.round(dr.ratio * 100)}%)`),
        drugs: matchedDrugs.map(r => r[0]),
        diseases: matchedDiseases.map(r => r[0]),
        labs: matchedLabs.map(r => r[0])
      },
      latent: {
        s0: [1, 1, 1, 1, 1, 1],
        s1: s1.slice(0, 6),
        d1: d1.slice(0, 6),
        s2: s2.slice(0, 6),
        d2: d2.slice(0, 6),
        s3: s3.slice(0, 6),
        d3: d3.slice(0, 6),
        s4: s4,
        d4: d4
      },
      kitPred,
      kitMeasured,
      z,
      zeff
    };
  }

  function renderStepwiseAttribution(stepwise, area) {
    if (!stepwise) return;
    const SD = window.STEPWISE_DATA;
    if (!SD) return;
    const LAT = SD.latent;
    const LAT_KO = SD.latentKo;
    const KIT = SD.kit;
    const KIT_KO = SD.kitKo;

    const wrap = document.createElement("div");
    wrap.className = "border-2 border-indigo-500/40 bg-white rounded-2xl p-5 shadow-sm space-y-5 mt-4";

    const headerHtml = `
      <div class="flex flex-wrap items-center justify-between border-b border-indigo-100 pb-3.5 gap-3">
        <div class="flex items-center space-x-3">
          <span class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 text-white flex items-center justify-center text-lg shadow-sm">🧭</span>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-indigo-700 text-white text-[11px] font-black shadow-2xs">트랙 1 · V5 순차 감별 모형</span>
              <h4 class="text-sm font-black text-slate-900">
                장내환경 4단계 순차 감별 (Stepwise Attribution) & 6대 잠재 지수 워터폴 리포트
              </h4>
            </div>
            <p class="text-xs text-slate-600 font-medium mt-1">
              <strong>가로줄(결과): 6대 장내환경 잠재 지수</strong> × <strong>세로줄(원인): Step 1(생리 기저) ➔ Step 2(식이 부하) ➔ Step 3(병태·약물 부하) ➔ Step 4(4종 키트 실측 편차 보정)</strong>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <a href="트랙1_순차감별_장내환경_변수_가중치_상관관계_V5.xlsx" download
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition">
            <i class="fa-solid fa-file-excel"></i>
            <span>V5 순차감별 엑셀 다운로드 (수식 계산기 포함)</span>
          </a>
        </div>
      </div>
    `;

    const matched = stepwise.matched;
    const stepperHtml = `
      <div class="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
        <div class="p-3 rounded-xl bg-blue-50/80 border border-blue-200">
          <div class="font-black text-blue-900 flex items-center gap-1.5 mb-1">
            <span class="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
            <span>Step 1 생리적 기저선</span>
          </div>
          <div class="text-[11px] text-blue-950 font-semibold">${escapeHtml(matched.age)}</div>
          <div class="text-[11px] text-blue-800">${escapeHtml(matched.size)}</div>
          <div class="text-[10px] text-blue-600 mt-1">나이·체급 기저 편향</div>
        </div>
        <div class="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
          <div class="font-black text-emerald-900 flex items-center gap-1.5 mb-1">
            <span class="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">2</span>
            <span>Step 2 식이 기질 부하</span>
          </div>
          <div class="text-[11px] text-emerald-950 font-semibold truncate" title="${escapeHtml(matched.diet.join(' + '))}">
            ${escapeHtml(matched.diet.join(" + ") || "표준 사료")}
          </div>
          <div class="text-[10px] text-emerald-600 mt-1">믹스피딩 비율 가중평균 부하</div>
        </div>
        <div class="p-3 rounded-xl bg-amber-50/80 border border-amber-200">
          <div class="font-black text-amber-900 flex items-center gap-1.5 mb-1">
            <span class="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">3</span>
            <span>Step 3 병태·약물 부하</span>
          </div>
          <div class="text-[11px] text-amber-950 font-semibold truncate" title="약물: ${escapeHtml(matched.drugs.join(', ') || '없음')} / 질병: ${escapeHtml(matched.diseases.join(', ') || '없음')}">
            약물: ${escapeHtml(matched.drugs.join(", ") || "없음")}
          </div>
          <div class="text-[11px] text-amber-800 truncate">
            질병: ${escapeHtml(matched.diseases.join(", ") || "없음")}
          </div>
          <div class="text-[10px] text-amber-600 mt-1">감쇠(α=0.4)·중복통제(γ=0.25)·포화(tanh)</div>
        </div>
        <div class="p-3 rounded-xl bg-purple-50/80 border border-purple-200">
          <div class="font-black text-purple-900 flex items-center gap-1.5 mb-1">
            <span class="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">4</span>
            <span>Step 4 키트 실측 편차</span>
          </div>
          <div class="text-[11px] text-purple-950 font-semibold">
            pH: ${stepwise.kitMeasured.ph !== null ? stepwise.kitMeasured.ph : '미측정'} | NH₃: ${stepwise.kitMeasured.nh3 !== null ? stepwise.kitMeasured.nh3 : '미측정'}
          </div>
          <div class="text-[11px] text-purple-800">
            잠혈: ${stepwise.kitMeasured.blood !== null ? stepwise.kitMeasured.blood + ' ng/mL' : '미측정'} | 인: ${stepwise.kitMeasured.freep !== null ? stepwise.kitMeasured.freep : '미측정'}
          </div>
          <div class="text-[10px] text-purple-600 mt-1">허용구간(±Margin) 초과분 지수 전이</div>
        </div>
      </div>
    `;

    const L = stepwise.latent;
    const formatDelta = v => {
      const n = Math.round(v * 100) / 100;
      return (n >= 0 ? "+" : "") + n.toFixed(2);
    };
    const formatScore = v => (Math.round(v * 100) / 100).toFixed(2);

    const latRowsHtml = LAT.map((m, idx) => {
      const s0 = L.s0[idx];
      const s1 = L.s1[idx];
      const d1 = L.d1[idx];
      const s2 = L.s2[idx];
      const d2 = L.d2[idx];
      const s3 = L.s3[idx];
      const d3 = L.d3[idx];
      const s4 = L.s4[idx];
      const d4 = L.d4[idx];
      const tot = s4 - s0;

      let statusText = "안정적";
      let statusColor = "text-slate-600";
      if (m === "abs" || m === "dig") {
        if (tot < -0.15) { statusText = "저하/부담 심화"; statusColor = "text-rose-600 font-bold"; }
        else if (tot < -0.05) { statusText = "경미한 저하"; statusColor = "text-amber-600 font-semibold"; }
      } else if (m === "mot") {
        if (tot < -0.15) { statusText = "장관 정체/지연(↓)"; statusColor = "text-amber-600 font-bold"; }
        else if (tot > 0.15) { statusText = "장관 통과 과속(↑)"; statusColor = "text-rose-600 font-bold"; }
      } else {
        if (tot > 0.20) { statusText = "부담/불균형 심화"; statusColor = "text-rose-600 font-bold"; }
        else if (tot > 0.08) { statusText = "경미한 부담"; statusColor = "text-amber-600 font-semibold"; }
      }

      return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
          <td class="p-2.5 font-black text-slate-800">${escapeHtml(LAT_KO[m])}</td>
          <td class="p-2.5 text-center text-slate-500 font-medium">1.00</td>
          <td class="p-2.5 text-center font-bold text-blue-900">${formatScore(s1)}</td>
          <td class="p-2.5 text-center text-[11px] font-semibold bg-blue-50/50 ${d1 < 0 ? 'text-blue-700' : 'text-slate-600'}">${formatDelta(d1)}</td>
          <td class="p-2.5 text-center font-bold text-emerald-900">${formatScore(s2)}</td>
          <td class="p-2.5 text-center text-[11px] font-semibold bg-emerald-50/50 ${d2 < 0 ? 'text-emerald-700' : 'text-slate-600'}">${formatDelta(d2)}</td>
          <td class="p-2.5 text-center font-bold text-amber-900">${formatScore(s3)}</td>
          <td class="p-2.5 text-center text-[11px] font-semibold bg-amber-50/50 ${d3 < 0 ? 'text-amber-700' : 'text-slate-600'}">${formatDelta(d3)}</td>
          <td class="p-2.5 text-center font-black text-indigo-900 bg-indigo-50/40">${formatScore(s4)}</td>
          <td class="p-2.5 text-center text-[11px] font-bold bg-purple-50/50 ${Math.abs(d4) > 0.01 ? 'text-purple-700' : 'text-slate-400'}">${formatDelta(d4)}</td>
          <td class="p-2.5 text-center font-black ${tot < 0 ? 'text-blue-700' : 'text-rose-700'}">${formatDelta(tot)}</td>
          <td class="p-2.5 text-[11px] ${statusColor}">${escapeHtml(statusText)}</td>
        </tr>
      `;
    }).join("");

    const tableAHtml = `
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h5 class="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
            <span>① 6대 장내환경 잠재 지수 순차 누적 워터폴 (가로줄)</span>
          </h5>
          <span class="text-[11px] text-slate-500 font-medium">1.00 = 표준 건강 기준선</span>
        </div>
        <div class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full text-xs text-left bg-white">
            <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th class="p-2.5">6대 장내환경 지수</th>
                <th class="p-2.5 text-center">기준</th>
                <th class="p-2.5 text-center text-blue-900">Step 1</th>
                <th class="p-2.5 text-center bg-blue-50/70 text-blue-800">Δ1</th>
                <th class="p-2.5 text-center text-emerald-900">Step 2</th>
                <th class="p-2.5 text-center bg-emerald-50/70 text-emerald-800">Δ2</th>
                <th class="p-2.5 text-center text-amber-900">Step 3</th>
                <th class="p-2.5 text-center bg-amber-50/70 text-amber-800">Δ3</th>
                <th class="p-2.5 text-center bg-indigo-100/60 text-indigo-950 font-black">Step 4 최종</th>
                <th class="p-2.5 text-center bg-purple-50/70 text-purple-800">Δ4(편차)</th>
                <th class="p-2.5 text-center font-black">총 변화</th>
                <th class="p-2.5">종합 판정</th>
              </tr>
            </thead>
            <tbody>
              ${latRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const kitRowsHtml = KIT.map(k => {
      const pred = stepwise.kitPred[k];
      const meas = stepwise.kitMeasured[k];
      const zVal = stepwise.z[k];
      const zeVal = stepwise.zeff[k];
      const margin = SD.kitMargin[k];
      const base = SD.kitBase[k];

      const tierKo = { 0: "음성 예상", 1: "약양성 주의", 2: "고위험" };
      let baseStr = String(base);
      let s1Str = "", s2Str = "", s3Str = "", marginStr = `±${margin}`, measStr = "", deltaStr = "", zStr = "", zeStr = "", verdictStr = "";

      if (k === "blood") {
        baseStr = "0 (음성)";
        s1Str = tierKo[pred[1]];
        s2Str = tierKo[pred[2]];
        s3Str = tierKo[pred[3]];
        marginStr = "±1 등급";
        if (meas !== null) {
          const g = meas < 10 ? 0 : (meas < 20 ? 1 : 2);
          measStr = `${meas} ng/mL (${tierKo[g]})`;
          deltaStr = `${g - pred[3] >= 0 ? '+' : ''}${g - pred[3]} 등급`;
          zStr = `${zVal >= 0 ? '+' : ''}${zVal.toFixed(1)}`;
          zeStr = `${zeVal >= 0 ? '+' : ''}${zeVal.toFixed(1)}`;
          verdictStr = zeVal > 0 ? "예측 상회 (장벽 출혈/점막미란 의심)" : (g < pred[3] ? "예측 하회 (호전)" : "예측 범위 내(설명됨)");
        } else {
          measStr = "미측정";
          deltaStr = "—"; zStr = "—"; zeStr = "—"; verdictStr = "미측정";
        }
      } else {
        s1Str = pred[1].toFixed(2);
        s2Str = pred[2].toFixed(2);
        s3Str = pred[3].toFixed(2);
        if (meas !== null) {
          measStr = String(meas);
          const diff = meas - pred[3];
          deltaStr = (diff >= 0 ? "+" : "") + diff.toFixed(2);
          zStr = (zVal >= 0 ? "+" : "") + zVal.toFixed(2);
          zeStr = (zeVal >= 0 ? "+" : "") + zeVal.toFixed(2);
          if (zeVal > 0.001) verdictStr = "예측 상회 (숨은 요인 감별)";
          else if (zeVal < -0.001) verdictStr = "예측 하회";
          else verdictStr = "예측 범위 내(설명됨)";
        } else {
          measStr = "미측정";
          deltaStr = "—"; zStr = "—"; zeStr = "—"; verdictStr = "미측정";
        }
      }

      const isElevated = zeVal > 0.001;
      const verdictBg = isElevated ? "bg-rose-100 text-rose-800 font-bold" : (meas !== null ? "bg-emerald-100 text-emerald-800 font-semibold" : "text-slate-400");

      return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
          <td class="p-2.5 font-black text-slate-800">${escapeHtml(KIT_KO[k])}</td>
          <td class="p-2.5 text-center text-slate-500">${baseStr}</td>
          <td class="p-2.5 text-center font-medium text-blue-900">${s1Str}</td>
          <td class="p-2.5 text-center font-medium text-emerald-900">${s2Str}</td>
          <td class="p-2.5 text-center font-extrabold text-amber-900 bg-amber-50/40">${s3Str}</td>
          <td class="p-2.5 text-center text-slate-500">${marginStr}</td>
          <td class="p-2.5 text-center font-black ${meas !== null ? 'text-indigo-950 bg-indigo-50/30' : 'text-slate-400 italic'}">${measStr}</td>
          <td class="p-2.5 text-center font-bold ${meas !== null && deltaStr.startsWith('+') ? 'text-rose-700' : 'text-slate-700'}">${deltaStr}</td>
          <td class="p-2.5 text-center text-[11px] text-slate-600">${zStr}</td>
          <td class="p-2.5 text-center font-extrabold ${isElevated ? 'text-rose-700' : 'text-slate-500'}">${zeStr}</td>
          <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[11px] ${verdictBg}">${escapeHtml(verdictStr)}</span></td>
        </tr>
      `;
    }).join("");

    const tableBHtml = `
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h5 class="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-purple-600"></span>
            <span>② 4종 분변키트 세로줄 블록 (Step 1~3 기대치 vs 실측치 대조 및 잔차 감별)</span>
          </h5>
          <span class="text-[11px] text-slate-500 font-medium">Margin: pH ±0.30 | NH₃ ±5.0 | 잠혈 ±1등급 | 유리 인 ±0.60</span>
        </div>
        <div class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full text-xs text-left bg-white">
            <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th class="p-2.5">분변키트 항목</th>
                <th class="p-2.5 text-center">기준</th>
                <th class="p-2.5 text-center text-blue-900">Step 1 예측</th>
                <th class="p-2.5 text-center text-emerald-900">Step 2 예측</th>
                <th class="p-2.5 text-center bg-amber-100/60 text-amber-950 font-black">Step 3 예측(최종)</th>
                <th class="p-2.5 text-center">허용 ±Margin</th>
                <th class="p-2.5 text-center bg-indigo-100/70 text-indigo-950 font-black">[실측값]</th>
                <th class="p-2.5 text-center">편차(실측-예측)</th>
                <th class="p-2.5 text-center">표준화편차(z)</th>
                <th class="p-2.5 text-center font-bold">반영분(z_eff)</th>
                <th class="p-2.5">감별 판정</th>
              </tr>
            </thead>
            <tbody>
              ${kitRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    let sumD1 = 0, sumD2 = 0, sumD3 = 0, sumD4 = 0;
    for (let i = 0; i < 6; i++) {
      sumD1 += Math.abs(L.d1[i]);
      sumD2 += Math.abs(L.d2[i]);
      sumD3 += Math.abs(L.d3[i]);
      sumD4 += Math.abs(L.d4[i]);
    }
    const sumTot = (sumD1 + sumD2 + sumD3 + sumD4) || 1.0;
    const p1 = Math.round((sumD1 / sumTot) * 100);
    const p2 = Math.round((sumD2 / sumTot) * 100);
    const p3 = Math.round((sumD3 / sumTot) * 100);
    const p4 = Math.round((sumD4 / sumTot) * 100);

    let storyText = "";
    if (sumD4 > 0.15) {
      storyText = `⚠️ <strong>[숨은 요인 감별 경보]</strong> Step 1~3(생리·식이·질환·약물)로 설명되지 않는 유의미한 분변키트 실측 편차(기여도 ${p4}%)가 검출되었습니다. 특히 실측값 상회로 인해 장내 미생물 대사환경 불균형 및 점막부담 지수가 Step 4에서 추가 상승 보정되었습니다. 은닉 식이(보호자 임의 간식 급여), 급성 장내 이상 발효, 또는 약물 복용 순응도 문제를 수의사와 상담하여 점검하세요.`;
    } else if (p3 >= 50) {
      storyText = `💡 <strong>[병태생리 주도형]</strong> 현재 장내환경 변화의 주원인은 기저질환 및 투약 약물(Step 3 기여도 ${p3}%)입니다. 분변키트 실측값은 치료상 불가피한 부하를 감안한 모형 예측 허용구간 내에 잘 위치하고 있어 급성 장벽 출혈이나 새로운 미생물 이상은 배제됩니다. 현재의 약물 치료와 보조적 믹스피딩 설계를 유지합니다.`;
    } else if (p2 >= 40) {
      storyText = `🥣 <strong>[식이 기질 주도형]</strong> 현재 장내환경 변화의 상당 부분(Step 2 기여도 ${p2}%)이 믹스피딩 사료 배합에 기인하고 있습니다. 소화 흡수율과 점막 부담 완화를 위해 건식/습식 비율 또는 단백질·지방 함량 조정을 검토하세요.`;
    } else {
      storyText = `✅ <strong>[안정적 기저선]</strong> 생리적 기저선과 식이 배합이 균형을 이루고 있으며, 분변키트 실측치 역시 예측 범위 내로 안정적입니다.`;
    }

    const narrativeHtml = `
      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="font-black text-xs text-slate-800 flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <span>③ 단계별 장내환경 변화 요인 분해 (Factor Attribution Ratio)</span>
          </div>
          <div class="text-[11px] font-bold text-slate-600">
            총 부하 기여도: 생리 ${p1}% | 식이 ${p2}% | 병태·약물 ${p3}% | 실측편차 ${p4}%
          </div>
        </div>
        <div class="w-full bg-slate-200 rounded-full h-3 flex overflow-hidden shadow-inner">
          <div class="bg-blue-600 h-3 text-[9px] font-bold text-white flex items-center justify-center transition-all" style="width: ${p1}%" title="Step 1 생리 기저선 ${p1}%">${p1 > 8 ? p1 + '%' : ''}</div>
          <div class="bg-emerald-600 h-3 text-[9px] font-bold text-white flex items-center justify-center transition-all" style="width: ${p2}%" title="Step 2 식이 기질 부하 ${p2}%">${p2 > 8 ? p2 + '%' : ''}</div>
          <div class="bg-amber-600 h-3 text-[9px] font-bold text-white flex items-center justify-center transition-all" style="width: ${p3}%" title="Step 3 병태·약물 부하 ${p3}%">${p3 > 8 ? p3 + '%' : ''}</div>
          <div class="bg-purple-600 h-3 text-[9px] font-bold text-white flex items-center justify-center transition-all" style="width: ${p4}%" title="Step 4 실측 편차 ${p4}%">${p4 > 8 ? p4 + '%' : ''}</div>
        </div>
        <div class="text-xs text-slate-700 leading-relaxed pt-1">
          ${storyText}
        </div>
      </div>
    `;

    wrap.innerHTML = headerHtml + stepperHtml + tableAHtml + tableBHtml + narrativeHtml;
    area.appendChild(wrap);
  }

  function runAnalysis() {
    if (!session) {
      startSession();
    }

    const record = readRecord();
    const analysis = analyze(record, session.context.expected, baseline);

    let stepwise = null;
    try {
      stepwise = computeStepwiseEngine(session.context, record.markers);
    } catch (swErr) {
      console.error("[computeStepwiseEngine error]", swErr);
    }

    current = {
      record,
      analysis,
      baseline: baseline ? clone(baseline) : null,
      stepwise
    };

    render(current);
    element("gpr-message").textContent =
      "✅ [트랙 2] 4종 핵심 분변키트(pH · 암모니아 · 잠혈 · 유리 인) 예측 vs 실측 비교 & [트랙 1] 4단계 순차 감별 분석이 완료되었습니다.";
  }

  function setBaseline() {
    if (!current) {
      throw new Error("먼저 [2. 트랙 2 예측 vs 실측 비교 및 의사결정 분석 실행]을 완료한 뒤 기준선으로 저장하세요.");
    }

    baseline = clone(current.record);
    saveStoredBaseline(baseline.patient, baseline);
    element("gpr-message").textContent =
      "📌 현재 4종 키트 측정 기록(" + baseline.time + ")을 환자(" + baseline.patient + ")의 개인 기준선(Baseline)으로 브라우저 저장소에 영구 보관했습니다.";
    current.baseline = clone(baseline);
    render(current);
  }

  function clearBaseline() {
    const pat = document.getElementById("gpr-patient")?.value?.trim() || "default";
    baseline = null;
    saveStoredBaseline(pat, null);
    element("gpr-message").textContent = "개인 비교 기준선을 해제했습니다.";
    if (current) {
      current.baseline = null;
      render(current);
    }
  }

  function update({
    evalMap = null,
    st = null,
    markerInfo = null,
    species = null
  } = {}) {
    const map =
      evalMap && typeof evalMap === "object" ? evalMap : {};
    const info =
      markerInfo && typeof markerInfo === "object"
        ? markerInfo
        : {};
    const context =
      st && typeof st === "object" ? st : {};

    const expected = {};

    KEYS.forEach(key => {
      const unit =
        typeof info[key]?.unit === "string" && info[key].unit !== ""
          ? info[key].unit
          : DEFAULT_UNITS[key] || "-";

      const val = map[key]?.expected !== undefined
        ? numberOrNull(map[key]?.expected)
        : null;

      expected[key] = {
        value: val,
        unit,
        rangeText: map[key]?.expectedRangeText || null,
        riskTier: map[key]?.riskTier || null,
        formulaNote: map[key]?.formulaNote || null
      };
    });

    const next = {
      species: species || context.species || "개",
      age_years: numberOrNull(context.age_years) ?? 5.0,
      weight_kg: numberOrNull(context.weight_kg) ?? 6.5,
      diet_mix: Array.isArray(context.diet_mix)
        ? clone(context.diet_mix)
        : [],
      drugs: Array.isArray(context.drugs)
        ? clone(context.drugs)
        : [],
      diseases: Array.isArray(context.diseases)
        ? clone(context.diseases)
        : [],
      expected
    };

    latest = next;

    const root = mount();
    if (!root) return;

    const ctx = getAutoContextValues();
    const patEl = document.getElementById("gpr-patient");
    if (patEl) {
      const livePat = context.patient_name || ctx.patientName;
      if (livePat) {
        patEl.value = livePat;
        const storedB = loadStoredBaseline(livePat);
        if (storedB) baseline = storedB;
      }
    }
    const dietEl = document.getElementById("gpr-diet");
    if (dietEl) {
      const liveDiet = (context.diet_mix && context.diet_mix.length > 0)
        ? context.diet_mix.map(d => d.label || d.name).join(" + ")
        : ctx.dietMix;
      if (liveDiet) dietEl.value = liveDiet;
    }
    const medEl = document.getElementById("gpr-medication");
    if (medEl) {
      const liveDrugs = (context.drugs && context.drugs.length > 0)
        ? context.drugs.join(", ")
        : ctx.drugs;
      if (liveDrugs) medEl.value = liveDrugs;
    }

    element("gpr-context").textContent =
      "트랙 2 가중치 연동: " +
      (latest.species || "종 정보") +
      ` (${latest.weight_kg}kg, ${latest.age_years}세) | 4종 핵심 키트(pH·암모니아·잠혈·유리 인) 예측치 산출 완료`;

    KEYS.forEach(key => {
      const unitEl = document.getElementById("gpr-unit-" + key);
      if (unitEl && !unitEl.value) {
        unitEl.value = DEFAULT_UNITS[key] || "-";
      }

      const marginEl = document.getElementById("gpr-margin-" + key);
      if (marginEl && !marginEl.value && DEFAULT_MARGINS[key] !== "") {
        marginEl.value = DEFAULT_MARGINS[key];
      }

      const expEl = document.getElementById("gpr-expected-" + key);
      if (expEl) {
        const item = expected[key];
        if (item && item.rangeText) {
          expEl.innerHTML = `<div>${escapeHtml(item.rangeText)}</div>` +
            (item.formulaNote ? `<div class="text-[10px] font-semibold text-slate-500 mt-0.5">${escapeHtml(item.formulaNote)}</div>` : "");
        } else if (item && item.value !== null) {
          const mVal = numberOrNull(marginEl?.value) ?? DEFAULT_MARGINS[key] ?? 0;
          const low = Math.max(0, Math.round((item.value - mVal) * 100) / 100);
          const high = Math.round((item.value + mVal) * 100) / 100;
          const uStr = item.unit !== "-" ? " " + item.unit : "";
          expEl.innerHTML = `<div>${format(item.value)} ± ${format(mVal)}${escapeHtml(uStr)} <span class="text-[10px] text-slate-600">[${format(low)}~${format(high)}]</span></div><div class="text-[10px] font-normal text-slate-500">트랙 2 가중치 예측치</div>`;
        } else {
          expEl.textContent = "미설정";
        }
      }
      // [데이터 무결성 원칙] 실측값 입력칸(gpr-value-*)은 절대 모형 예상값이나 예시값으로 자동 덮어쓰지 않음!
    });

    if (session) {
      session.context = clone(latest);
    }
  }

  window.GutPatternReview = Object.freeze({
    VERSION,
    MARKERS: clone(MARKERS),
    mount,
    update,
    readRecord,
    analyze,
    render,
    startSession,
    runAnalysis,
    setBaseline,
    clearBaseline,
    fillDemoSampleValues,
    resetMeasuredInputs
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
