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
  }

  function runAnalysis() {
    if (!session) {
      startSession();
    }

    const record = readRecord();
    const analysis = analyze(record, session.context.expected, baseline);

    current = {
      record,
      analysis,
      baseline: baseline ? clone(baseline) : null
    };

    render(current);
    element("gpr-message").textContent =
      "✅ [트랙 2] 4종 핵심 분변키트(pH · 암모니아 · 잠혈 · 유리 인) 예측 vs 실측 비교 및 의사결정 분석이 완료되었습니다.";
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
