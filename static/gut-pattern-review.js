(function () {
  "use strict";

  if (window.GutPatternReview) {
    console.warn("[GutPatternReview] 중복 로딩을 확인하세요.");
    return;
  }

  const VERSION = "gut-pattern-review-1.0";
  const BASELINE_STORAGE_KEY = "vet_gpr_saved_baselines_v1";

  // 마커 목록 및 역할 정비 ('9대 마커' 고정 표현 배제, 인돌·젖산 제외, 비중 보조 추가)
  const MARKERS = {
    ph: {
      label: "분변 pH",
      axis: "대장 대사·화학적 환경 검토",
      note: "배출 검체의 산·염기 상태 (단독으로 악화/대장질환 단정 금지)"
    },
    ammonia: {
      label: "암모니아 (NH₃)",
      axis: "대장 중심 질소성 대사 검토",
      note: "질소성 기질 공급·미생물 대사·장내 흡수를 함께 검토"
    },
    sg: {
      label: "분변 비중 (SG · 보조)",
      axis: "동일 조건 전후 비교 보조 항목",
      note: "추출액 이온·용질 반응 참고치 (원분변 수분율·변비 단정 금지)"
    },
    protein: {
      label: "분변 단백질 반응 (출처 미분리)",
      axis: "식이·숙주·미생물 출처 미분리 신호",
      note: "단독 상승으로 장누수(PLE) 또는 소장 흡수율 단정 금지"
    },
    fat: {
      label: "지방 잔류 신호",
      axis: "소장계 처리 우선 검토",
      note: "식이 지방량 변화·소화·통과 조건을 함께 검토하는 잔류 단서"
    },
    carbo: {
      label: "전분 잔류 신호 (루골)",
      axis: "소장계 처리·식이 전분 특성 검토",
      note: "저항성 전분·가공도·소장계 처리를 함께 검토 (흡수장애 단정 금지)"
    },
    blood: {
      label: "잠혈 반응",
      axis: "소화·대사 축과 분리된 별도 확인 신호",
      note: "타 마커 양호 결과로 상쇄하지 않음 (식이 간섭·점막 출혈 수의사 검토)"
    },
    glucose: {
      label: "포도당 패드",
      axis: "탐색적 잔류 단당류 신호",
      note: "병변 위치 판별보다 동일 환자의 개인별 전후 변화 관찰에 활용"
    }
  };

  const DEFAULT_UNITS = {
    ph: "-",
    ammonia: "μmol/g",
    sg: "-",
    protein: "% DM",
    fat: "% DM",
    carbo: "% DM",
    blood: "ng/mL",
    glucose: "mg/dL"
  };

  const DEFAULT_MARGINS = {
    ph: 0.3,
    ammonia: 5.0,
    sg: "",
    protein: 1.5,
    fat: 1.5,
    carbo: 1.5,
    blood: 2.0,
    glucose: 10.0
  };

  // 시연(Demo) 전용 예시 수치 — 검사 전 기본 자동 입력 금지 원칙에 따라 버튼 클릭 시에만 입력됨
  const DEMO_SAMPLE_VALUES = {
    ph: 6.6,
    ammonia: 21.5,
    sg: 1.025,
    protein: 5.2,
    fat: 4.1,
    carbo: 6.3,
    blood: 0.0,
    glucose: 0.0
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
      <div class="flex flex-wrap items-center justify-between border-b border-indigo-100 pb-3 mb-4 gap-2">
        <div class="flex items-center space-x-2.5">
          <span class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-base shadow-sm">🔬</span>
          <div>
            <h3 class="text-base font-extrabold text-slate-800">
              분변 패턴 분석 · 이전 기록 비교 모듈 (관찰·검토형)
            </h3>
            <p class="text-xs text-indigo-700 font-medium">
              실측값·모형 예상값·시연 예시값을 엄격히 분리하며, 미측정 항목은 임의 생성하지 않고 빈 값(판단 보류)으로 보존합니다.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span id="gpr-source-badge" class="text-[11px] font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-300">
            ⚪ 현재 상태: 실측값 입력 대기 (미측정 보존)
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
          <label class="block text-xs font-bold text-slate-700 mb-1">검사법·검체 기준 (원분변/추출액)</label>
          <input id="gpr-protocol" type="text"
            class="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
            value="STD-FECAL-V1 (추출액·패드 병행)"
            placeholder="시약/추출비율/건물·습중량 기준">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">실제 급여 식단 조합 (제품·제형·비율)</label>
          <input id="gpr-diet" type="text"
            class="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
            value="${escapeHtml(ctx.dietMix)}"
            placeholder="혼합 사료 제품명과 비율">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">약물·처방 내역</label>
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
            <span>1. 현재 조건으로 검사 세션 시작</span>
          </button>
          <button type="button" data-gpr-action="fill-demo"
            class="border border-amber-300 rounded-xl px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition shadow-sm flex items-center space-x-1.5">
            <i class="fa-solid fa-flask text-amber-600"></i>
            <span>시연용 예시 수치 채우기 (실측 분리)</span>
          </button>
          <button type="button" data-gpr-action="reset-inputs"
            class="border border-slate-300 rounded-xl px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs transition flex items-center space-x-1">
            <i class="fa-solid fa-eraser"></i>
            <span>실측란 비우기 (미측정 초기화)</span>
          </button>
        </div>
        <p id="gpr-context" class="text-xs text-slate-500 font-medium"></p>
      </div>

      <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mb-4">
        <table class="w-full text-xs text-left bg-white">
          <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th class="p-2.5">검사 마커 (실측 반응 기준)</th>
              <th class="p-2.5">단위 기준</th>
              <th class="p-2.5 bg-blue-50/50 text-blue-900">모형 예상 범위 (미검증 초기 가설 Prior · ±오차폭)</th>
              <th class="p-2.5 bg-amber-50/50 text-amber-900">실제 측정값 (미측정 시 빈칸 유지)</th>
              <th class="p-2.5 text-slate-600">개인별 판독폭 (±허용편차)</th>
              <th class="p-2.5 text-slate-500">해석 역할 및 주의사항</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${KEYS.map(key => `
              <tr class="hover:bg-slate-50/80 transition">
                <td class="p-2.5 font-bold text-slate-800">
                  ${escapeHtml(MARKERS[key].label)}
                </td>
                <td class="p-2.5">
                  <input id="gpr-unit-${key}" type="text"
                    value="${escapeHtml(DEFAULT_UNITS[key] || '')}"
                    class="border border-slate-300 rounded px-2 py-1 w-24 text-center font-medium bg-slate-50"
                    ${key === 'sg' ? 'readonly' : ''}>
                </td>
                <td id="gpr-expected-${key}" class="p-2.5 font-extrabold text-blue-700 bg-blue-50/30">
                  ${key === 'sg' ? '전후 비교 전용 (예상치 미적용)' : '—'}
                </td>
                <td class="p-2.5 bg-amber-50/30">
                  <input id="gpr-value-${key}" type="number"
                    step="any" min="0"
                    value=""
                    placeholder="미측정 (직접 입력)"
                    class="border border-amber-300 rounded px-2 py-1 w-32 font-bold text-amber-900 bg-white focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400 placeholder:font-normal">
                </td>
                <td class="p-2.5">
                  <input id="gpr-margin-${key}" type="number"
                    step="any" min="0"
                    value="${DEFAULT_MARGINS[key] !== '' ? DEFAULT_MARGINS[key] : ''}"
                    class="border border-slate-300 rounded px-2 py-1 w-24 text-center font-medium"
                    ${key === 'sg' ? 'disabled placeholder="전후비교"' : 'placeholder="기본권장"'}>
                </td>
                <td class="p-2.5 text-[11px] text-slate-500">
                  <div class="font-semibold text-slate-700">${escapeHtml(MARKERS[key].axis)}</div>
                  <div class="text-[10px] text-slate-400">${escapeHtml(MARKERS[key].note)}</div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100 mb-4">
        <label class="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
          <input id="gpr-confirm" type="checkbox" class="w-4 h-4 text-indigo-600 rounded">
          <span>입력한 수치는 자동 생성값이 아닌 실제 검사값(또는 명시적 시연값)이며, 검사법·단위·채취 조건을 확인했습니다.</span>
        </label>

        <div class="flex flex-wrap items-center gap-2">
          <button type="button" data-gpr-action="analyze"
            class="rounded-xl px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5">
            <i class="fa-solid fa-magnifying-glass-chart"></i>
            <span>2. 분변 패턴 분석 · 이전 기록 비교 실행</span>
          </button>

          <button type="button" data-gpr-action="baseline"
            class="border border-slate-300 hover:bg-slate-100 rounded-xl px-3.5 py-2 text-slate-700 font-bold text-xs transition">
            현재 측정 기록을 개인 기준선(Baseline)으로 저장
          </button>

          <button type="button" data-gpr-action="clear"
            class="border border-slate-300 hover:bg-slate-100 rounded-xl px-3.5 py-2 text-slate-500 font-bold text-xs transition">
            개인 기준선 해제
          </button>
        </div>
      </div>

      <p id="gpr-message" role="status" class="text-xs font-semibold my-2 text-indigo-900">
        💡 실제 측정한 마커만 입력하신 뒤 확인 체크박스를 선택하고 [2. 분변 패턴 분석 · 이전 기록 비교 실행]을 눌러주세요. (미입력 항목은 자동으로 '미측정·판단 보류' 처리됩니다.)
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
        "입력이 변경되었습니다. 확인 후 [2. 분변 패턴 분석 · 이전 기록 비교 실행]을 눌러주세요.";
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
            ["ph", "ammonia", "glucose", "blood", "protein", "carbo", "fat"].forEach(function (k) {
              var gEl = document.getElementById("gpr-value-" + k);
              var mEl = document.getElementById("m9-" + k);
              if (gEl && mEl && gEl.value !== "") {
                mEl.value = gEl.value;
              }
            });
            window._fecalManualOverride = true;
            if (typeof window.runGutEnvironmentCDSS === "function") {
              window.runGutEnvironmentCDSS();
            }
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
      badge.textContent = "🟢 자료 상태: 실제 측정값 입력 (출처 보존)";
    } else if (currentDataSource === "DEMO_SAMPLE") {
      badge.className = "text-[11px] font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg border border-amber-300";
      badge.textContent = "🟠 자료 상태: 시연용 예시값 (실제 환자 기록과 분리)";
    } else {
      badge.className = "text-[11px] font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-300";
      badge.textContent = "⚪ 자료 상태: 실측값 입력 대기 (미측정 보존)";
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
      "🟠 시연용 예시 수치가 입력되었습니다(실제 환자 측정 기록과 분리됨). [2. 분변 패턴 분석 · 이전 기록 비교 실행]을 눌러 결과를 확인하세요.";
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
      "⚪ 모든 실측 입력란을 비우고 미측정 상태로 초기화했습니다.";
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
      const unit =
        key === "sg" ? "-" : element("gpr-unit-" + key).value.trim();
      const value = numberOrNull(element("gpr-value-" + key).value);
      const margin =
        key === "sg" ? null : numberOrNull(element("gpr-margin-" + key).value);

      if (value !== null && !unit) {
        throw new Error(
          MARKERS[key].label + "의 입력 단위를 확인하세요."
        );
      }

      if (value !== null) count += 1;

      markers[key] = { unit, value, margin };
    });

    if (count === 0) {
      throw new Error("측정한 실제 검사값을 1개 이상 입력하거나 [시연용 예시 수치 채우기]를 사용해 주세요.");
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
    if (!expected || expected.value === null) return "예상값 미적용 (전후비교 전용)";
    if (actual.unit !== expected.unit) return "단위 불일치 (비교 불가)";

    // 잠혈(blood) 및 포도당(glucose)은 기준값이 0(음성)이므로 배수 곱셈 대신 검출한계(Cut-off) 및 위험 등급 모형으로 비교
    if (key === "blood" || key === "glucose") {
      const cutOff = key === "blood" ? 10.0 : 20.0;
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
    const low = Math.round((expected.value - actual.margin) * 100) / 100;
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

    const fatHigh = compared.fat.includes("상회");
    const carboHigh = compared.carbo.includes("상회");
    const proteinHigh = compared.protein.includes("상회");
    const phLow = compared.ph.includes("하회");
    const phHigh = compared.ph.includes("상회");
    const ammoniaHigh = compared.ammonia.includes("상회");

    // 1. 영양성분 잔류 패턴 (소장계 처리 검토)
    if (fatHigh || carboHigh || proteinHigh) {
      const items = [];
      if (fatHigh) items.push("지방 잔류 신호 증가");
      if (carboHigh) items.push("전분 잔류 신호 증가");
      if (proteinHigh) items.push("분변 단백질 반응 증가");

      patterns.push({
        title: "영양성분 잔류 패턴 변화 관찰 (소장계 처리 및 식이 기질 검토)",
        items,
        observation: `[관찰] 측정 항목 중 ${items.join(", ")}가 모형 예상 범위 밖(상회)으로 관찰되었습니다.`,
        interpretation: `[관련 해석] 식이 원료·혼합비 변화에 따른 기질 유입량 변화, 소장계 처리(소화·흡수) 조건, 장관 통과 시간 및 검체 처리 조건을 함께 연결해 검토합니다(단독 상승만으로 췌장 기능 저하·흡수장애·장누수를 확진하지 않습니다).`,
        nextCheck: `[동반 조건 및 다음 확인사항] 최근 사료 제형/지방·전분 함량 변경 여부, 실제 섭취량, 변 성상 및 체중 추이를 함께 대조하고 필요 시 수의사 판단하에 추가 기능 검사(TLI, cPL/fPL 등)를 선별 검토합니다.`
      });
    }

    // 2. 단백질 ↑ + 암모니아 비동반 (잔류-대사 불일치)
    if (proteinHigh && !ammoniaHigh && record.markers.ammonia.value !== null) {
      patterns.push({
        title: "단백질 반응 증가 · 암모니아 비동반 (잔류–대사 불일치 검토 패턴)",
        items: ["단백질 반응 증가", "암모니아 예상 범위 이내/낮음"],
        observation: `[관찰] 분변 단백질 반응은 예상 범위를 상회하였으나, 암모니아는 동반 상승하지 않았습니다.`,
        interpretation: `[관련 해석] 단백질 출처(식이·숙주·미생물), 미생물 이용 조건, 대장 접촉(통과) 시간 또는 검사법 반응 차이와 연결해 검토합니다(빠른 통과나 단백소실성 장병증[PLE] 중 하나로 강제 단정하지 않습니다).`,
        nextCheck: `[동반 조건 및 다음 확인사항] 배변 빈도·수분 상태, 혈중 알부민/총단백 이력 및 식단 단백질 원료 변경 시점을 함께 확인합니다.`
      });
    }

    // 3. 대장 대사·화학적 환경 변화 패턴
    if (phLow || phHigh || ammoniaHigh) {
      const items = [
        phLow ? "분변 pH 하회(산성화 방향)" : phHigh ? "분변 pH 상회(알칼리화 방향)" : null,
        ammoniaHigh ? "암모니아 상회" : null
      ].filter(Boolean);

      patterns.push({
        title: "대장 관련 대사 · 화학적 환경 변화 관찰",
        items,
        observation: `[관찰] 대장 대사 환경 지표에서 ${items.join(" 및 ")} 변화가 관찰되었습니다.`,
        interpretation: `[관련 해석] 하류로 전달된 발효 기질(질소성 기질 또는 탄수화물)의 양, 장관 체류 시간, NH₃/NH₄⁺ 화학종 평형 및 배출 조건과 연결해 검토합니다(단일 수치로 대장염이나 특정 세균 증식을 단정하지 않습니다).`,
        nextCheck: `[동반 조건 및 다음 확인사항] 고단백 간식 급여 여부, 약물(인바인더·락툴로스·항생제 등) 변경 시점 및 이전 개인 기준선 대비 변화 방향을 대조합니다.`
      });
    }

    // 4. 잠혈 반응 (타 마커 양호 여부와 상쇄하지 않고 별도 표시)
    if (
      record.markers.blood.value !== null &&
      record.markers.blood.value > 0
    ) {
      patterns.push({
        title: "잠혈 반응 별도 확인 신호 (타 마커와 상쇄 금지)",
        items: [`잠혈 측정값: ${format(record.markers.blood.value)} ${record.markers.blood.unit}`],
        observation: `[관찰] 분변 잠혈 반응(${format(record.markers.blood.value)} ${record.markers.blood.unit})이 관찰되었습니다.`,
        interpretation: `[관련 해석] 다른 소화·대사 마커가 안정적이더라도 잠혈 신호는 상쇄하지 않고 별도로 검토합니다. 상·하부 소화관 출혈 가능성, 숙주 점막 유래 성분 및 식이성(육류 헤모글로빈·간섭 물질) 요인을 함께 검토합니다.`,
        nextCheck: `[동반 조건 및 다음 확인사항] NSAIDs·스테로이드 등 점막 자극 약물 복용 여부, 변의 육안적 혈흔(흑변/선혈변) 유무 및 재검 일관성을 수의사가 직접 확인합니다.`
      });
    }

    // 5. 분변 비중(SG) 및 포도당 탐색 지표
    if (record.markers.sg.value !== null || (record.markers.glucose.value !== null && record.markers.glucose.value > 0)) {
      const subItems = [];
      if (record.markers.sg.value !== null) subItems.push(`분변 비중(SG): ${format(record.markers.sg.value)}`);
      if (record.markers.glucose.value !== null && record.markers.glucose.value > 0) subItems.push(`포도당 반응: ${format(record.markers.glucose.value)} ${record.markers.glucose.unit}`);
      patterns.push({
        title: "보조 · 탐색 항목 관찰 기록 (개인별 전후 비교용)",
        items: subItems,
        observation: `[관찰] 보조·탐색 항목에서 ${subItems.join(" / ")} 기록이 확인되었습니다.`,
        interpretation: `[관련 해석] 비중(SG)은 추출액 용질·이온 농도 반응이므로 원분변 수분율이나 변비로 단정하지 않으며, 포도당 패드 반응 역시 당뇨 확진이나 병변 위치 단정에 쓰지 않고 동일 조건 내 개인별 전후 변화 추적에 활용합니다.`,
        nextCheck: `[동반 조건 및 다음 확인사항] 동일 추출 프로토콜(${record.protocol}) 하에서 이전 측정값 대비 증감 추세를 비교합니다.`
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
        ? '<div class="p-3.5 bg-emerald-50 text-emerald-900 rounded-xl text-xs font-semibold border border-emerald-200 space-y-1"><div>• <strong>[관찰]</strong> 측정한 항목에서 모형 예상 범위로부터 뚜렷한 이탈이 관찰되지 않았습니다.</div><div>• <strong>[관련 해석 및 유의사항]</strong> 관찰 기간 내 측정 패널상 큰 변화가 없음을 뜻하며, 미측정 항목이나 장 전체의 완전한 정상·고흡수율을 보증하지는 않습니다.</div></div>'
        : summary.analysis.patterns.map(p => `
            <div class="border border-slate-200 bg-slate-50 rounded-xl p-3.5 space-y-1.5">
              <div class="font-extrabold text-xs text-indigo-950 flex items-center space-x-1.5">
                <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span>${escapeHtml(p.title)}</span>
              </div>
              <div class="text-[11px] font-bold text-indigo-700">${escapeHtml(p.items.join(" · "))}</div>
              <div class="text-xs text-slate-800 leading-relaxed">${escapeHtml(p.observation)}</div>
              <div class="text-xs text-slate-700 leading-relaxed">${escapeHtml(p.interpretation)}</div>
              <div class="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80">${escapeHtml(p.nextCheck)}</div>
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
      : '<span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">실제 측정 데이터</span>';

    card.innerHTML = `
      <div class="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div>
          <div class="flex items-center space-x-2">
            <h4 class="font-black text-sm text-slate-900">개인 기준 대비 변화 요약 & 관찰·검토 패턴</h4>
            ${srcLabel}
          </div>
          <p class="text-xs text-slate-500 mt-0.5">환자 ID: ${escapeHtml(summary.record.patient)} | 채취일시: ${escapeHtml(summary.record.time)} | 규칙버전: ${escapeHtml(summary.record.ruleVersion)}</p>
        </div>
        <div>${baselineNotice}</div>
      </div>

      <div class="space-y-2">
        <h5 class="text-xs font-bold text-slate-700">관찰된 변화 · 함께 검토할 기전 후보 ([관찰 ➔ 해석 ➔ 동반조건 ➔ 다음 확인사항]):</h5>
        ${patternsHtml}
      </div>

      <div class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full text-xs text-left">
          <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th class="p-2.5">마커 항목</th>
              <th class="p-2.5">① 실제 측정값</th>
              <th class="p-2.5">② 환자 이전 기록 대비 변화</th>
              <th class="p-2.5">③ 모형 예상 대비 차이</th>
              <th class="p-2.5">④ 연결 검토할 기능·조건</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${KEYS.map(k => {
              const mVal = summary.record.markers[k].value;
              const valStr = mVal === null ? "미측정 (판단 보류)" : `${format(mVal)} ${summary.record.markers[k].unit !== '-' ? summary.record.markers[k].unit : ''}`;
              const compStr = summary.analysis.compared[k];
              const compColor = compStr.includes("이내")
                ? "text-emerald-700"
                : compStr.includes("범위 밖")
                ? "text-amber-700"
                : "text-slate-500";
              return `
              <tr class="hover:bg-slate-50">
                <td class="p-2.5 font-bold text-slate-800">${escapeHtml(MARKERS[k].label)}</td>
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
      "✅ 관찰·검토형 분변 패턴 분석이 완료되었습니다. 아래 4대 분리 표시 표와 검토 후보를 확인하세요.";
  }

  function setBaseline() {
    if (!current) {
      throw new Error("먼저 [2. 분변 패턴 분석 · 이전 기록 비교 실행]을 완료한 뒤 기준선으로 저장하세요.");
    }

    baseline = clone(current.record);
    saveStoredBaseline(baseline.patient, baseline);
    element("gpr-message").textContent =
      "📌 현재 측정 기록(" + baseline.time + ")을 환자(" + baseline.patient + ")의 개인 기준선(Baseline)으로 브라우저 저장소에 영구 보관했습니다.";
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
      if (key === "sg") {
        expected[key] = { value: null, unit: "-" };
        return;
      }

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
      "환자 조건 연결: " +
      (latest.species || "종 정보") +
      ` (${latest.weight_kg}kg, ${latest.age_years}세) | 미검증 초기 가설 계수(Prior) · 중복 통제 반영 완료`;

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
        if (key === "sg") {
          expEl.textContent = "전후 비교 전용 (예상치 미적용)";
        } else {
          const item = expected[key];
          if (item && item.rangeText) {
            expEl.innerHTML = `<div>${escapeHtml(item.rangeText)}</div>` +
              (item.formulaNote ? `<div class="text-[10px] font-semibold text-slate-500 mt-0.5">${escapeHtml(item.formulaNote)}</div>` : "");
          } else if (item && item.value !== null) {
            const mVal = numberOrNull(marginEl?.value) ?? DEFAULT_MARGINS[key] ?? 0;
            const low = Math.max(0, Math.round((item.value - mVal) * 100) / 100);
            const high = Math.round((item.value + mVal) * 100) / 100;
            const uStr = item.unit !== "-" ? " " + item.unit : "";
            expEl.innerHTML = `<div>${format(item.value)} ± ${format(mVal)}${escapeHtml(uStr)} <span class="text-[10px] text-slate-600">[${format(low)}~${format(high)}]</span></div><div class="text-[10px] font-normal text-slate-500">미검증 초기 가설(Prior)</div>`;
          } else {
            expEl.textContent = "미설정";
          }
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
