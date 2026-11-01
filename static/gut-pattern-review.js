(function () {
  "use strict";

  if (window.GutPatternReview) {
    console.warn("[GutPatternReview] 중복 로딩을 확인하세요.");
    return;
  }

  const VERSION = "gut-pattern-review-0.2";

  // 임상 확률이 아니라, 개발용 기본 해석 분류입니다.
  // 인돌(indole)은 분변 비중(sg)으로 전면 교체되었습니다.
  const MARKERS = {
    ph: {
      label: "분변 pH",
      axis: "대장 관련 환경 우선",
      note: "최종 분변의 산·염기 환경. 방향만으로 좋고 나쁨을 정하지 않음."
    },
    ammonia: {
      label: "암모니아",
      axis: "대장 관련 대사 우선",
      note: "질소성 기질 공급과 대사·흡수·통과 조건을 함께 검토."
    },
    sg: {
      label: "분변 비중 (SG)",
      axis: "수분 보존·삼투 균형 검토",
      note: "수분 보유 및 삼투 특성을 검토하는 탐색 지표. 인돌 대체 마커."
    },
    lactate: {
      label: "젖산",
      axis: "탐색적 대사 정보",
      note: "증감만으로 유익균량이나 건강 상태를 확정하지 않음."
    },
    protein: {
      label: "단백질 반응",
      axis: "위치·출처 미분리",
      note: "식이·숙주·미생물 유래를 이 검사만으로 구별하지 않음."
    },
    fat: {
      label: "지방 잔류 신호",
      axis: "소장계 처리 우선 검토",
      note: "식이·검사법·통과 조건을 함께 보는 잔류 단서."
    },
    carbo: {
      label: "전분 잔류 신호",
      axis: "소장계 처리 우선 검토",
      note: "전체 탄수화물이 아닌 전분 반응. 식이 특성을 함께 검토."
    },
    blood: {
      label: "잠혈",
      axis: "별도 확인",
      note: "다른 마커와 상쇄하지 않음. 위치·원인은 자동 배정하지 않음."
    },
    glucose: {
      label: "포도당",
      axis: "탐색적 정보",
      note: "초기에는 관찰값으로 보존. 위치 추정에는 사용하지 않음."
    }
  };

  const DEFAULT_UNITS = {
    ph: "-",
    ammonia: "μmol/g",
    sg: "-",
    lactate: "mmol/g",
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
    lactate: 2.0,
    protein: 1.5,
    fat: 1.5,
    carbo: 1.5,
    blood: 2.0,
    glucose: 10.0
  };

  const DEFAULT_MEAS_VALUES = {
    ph: 6.6,
    ammonia: 21.5,
    sg: 1.025,
    lactate: 8.2,
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
    if (value === null || value === undefined) return "—";
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

  function getAutoContextValues() {
    const patientName = document.getElementById("patient-name")?.value || "밍키 (환자-001)";
    const dietMix = (window.currentCdssState?.diet_mix || [])
      .map(d => d.label || d.name)
      .filter(Boolean)
      .join(" + ") || "표준 처방식 혼합 급여";
    const drugs = (window.currentCdssState?.drugs || [])
      .join(", ") || "복용 약물 없음";
    
    // 현재 일시 (YYYY-MM-DDTHH:mm)
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

    root.innerHTML = `
      <div class="flex flex-wrap items-center justify-between border-b border-indigo-100 pb-3 mb-4">
        <div class="flex items-center space-x-2.5">
          <span class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-base shadow-sm">🔬</span>
          <div>
            <h3 class="text-base font-extrabold text-slate-800">
              믹스피딩 반응 · 소장계 / 대장 관련 분변 패턴 검토 모듈
            </h3>
            <p class="text-xs text-indigo-700 font-medium">
              5대 축 모형 예상값과 실제 분변 검사값을 대조 분석하며, 인돌 대신 <strong>분변 비중(SG)</strong>을 정밀 탐색합니다.
            </p>
          </div>
        </div>
        <span class="text-[11px] font-bold px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg">
          v0.2 비중(SG) 탑재형
        </span>
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
          <label class="block text-xs font-bold text-slate-700 mb-1">검사법·검체 프로토콜 ID</label>
          <input id="gpr-protocol" type="text"
            class="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
            value="STD-FECAL-V01 (표준 추출법)"
            placeholder="시약/추출비율 식별자">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">실제 급여 식단 조합</label>
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

      <div class="flex items-center justify-between mb-3">
        <button type="button" data-gpr-action="start"
          class="border border-indigo-300 rounded-xl px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-xs transition shadow-sm flex items-center space-x-1.5">
          <i class="fa-solid fa-play text-indigo-600"></i>
          <span>1. 현재 조건으로 검사 세션 시작</span>
        </button>
        <p id="gpr-context" class="text-xs text-slate-500 font-medium"></p>
      </div>

      <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mb-4">
        <table class="w-full text-xs text-left bg-white">
          <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th class="p-2.5">검사 마커</th>
              <th class="p-2.5">입력 단위</th>
              <th class="p-2.5 bg-blue-50/50 text-blue-900">모형 예상값 (가설치)</th>
              <th class="p-2.5 bg-amber-50/50 text-amber-900">실제 검사값 (실측치)</th>
              <th class="p-2.5 text-slate-600">판독폭 (허용편차)</th>
              <th class="p-2.5 text-slate-500">지표 성격</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${KEYS.map(key => `
              <tr class="hover:bg-slate-50/80 transition">
                <td class="p-2.5 font-bold text-slate-800">
                  ${escapeHtml(MARKERS[key].label)}
                  ${key === 'sg' ? '<span class="ml-1 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-extrabold">신규</span>' : ''}
                </td>
                <td class="p-2.5">
                  <input id="gpr-unit-${key}" type="text"
                    value="${escapeHtml(DEFAULT_UNITS[key] || '')}"
                    class="border border-slate-300 rounded px-2 py-1 w-24 text-center font-medium bg-slate-50"
                    ${key === 'sg' ? 'readonly' : ''}>
                </td>
                <td id="gpr-expected-${key}" class="p-2.5 font-extrabold text-blue-700 bg-blue-50/30">
                  ${key === 'sg' ? '미설정 · 전후비교' : '—'}
                </td>
                <td class="p-2.5 bg-amber-50/30">
                  <input id="gpr-value-${key}" type="number"
                    step="any" min="0"
                    value="${DEFAULT_MEAS_VALUES[key] ?? ''}"
                    class="border border-amber-300 rounded px-2 py-1 w-28 font-bold text-amber-900 bg-white focus:ring-2 focus:ring-amber-500">
                </td>
                <td class="p-2.5">
                  <input id="gpr-margin-${key}" type="number"
                    step="any" min="0"
                    value="${DEFAULT_MARGINS[key] !== '' ? DEFAULT_MARGINS[key] : ''}"
                    class="border border-slate-300 rounded px-2 py-1 w-24 text-center font-medium"
                    ${key === 'sg' ? 'disabled placeholder="비교제외"' : 'placeholder="기본권장"'}>
                </td>
                <td class="p-2.5 text-[11px] text-slate-500">
                  ${escapeHtml(MARKERS[key].axis)}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100 mb-4">
        <label class="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
          <input id="gpr-confirm" type="checkbox" checked class="w-4 h-4 text-indigo-600 rounded">
          <span>자동 생성값이 아닌 실제 검사값이며, 검사법·단위·채취 조건을 확인했습니다.</span>
        </label>

        <div class="flex flex-wrap items-center gap-2">
          <button type="button" data-gpr-action="analyze"
            class="rounded-xl px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5">
            <i class="fa-solid fa-chart-pie"></i>
            <span>2. 해석 및 이전 검사와 비교</span>
          </button>

          <button type="button" data-gpr-action="baseline"
            class="border border-slate-300 hover:bg-slate-100 rounded-xl px-3.5 py-2 text-slate-700 font-bold text-xs transition">
            현재 검사를 기준선(Baseline)으로 보관
          </button>

          <button type="button" data-gpr-action="clear"
            class="border border-slate-300 hover:bg-slate-100 rounded-xl px-3.5 py-2 text-slate-500 font-bold text-xs transition">
            기준선 해제
          </button>
        </div>
      </div>

      <p id="gpr-message" role="status" class="text-xs font-semibold my-2 text-indigo-900"></p>
      <div id="gpr-result" class="space-y-4"></div>
    `;

    root.dataset.gprMounted = VERSION;

    root.addEventListener("input", function () {
      current = null;
      element("gpr-result").replaceChildren();
      element("gpr-message").textContent =
        "입력이 변경되었습니다. [2. 해석 및 이전 검사와 비교]를 다시 실행하세요.";
    });

    root.addEventListener("click", function (event) {
      const button = event.target.closest("button[data-gpr-action]");
      if (!button) return;

      const action = button.dataset.gprAction;

      try {
        if (action === "start") startSession();
        if (action === "analyze") runAnalysis();
        if (action === "baseline") setBaseline();
        if (action === "clear") clearBaseline();
      } catch (error) {
        element("gpr-message").textContent = error.message;
      }
    });

    // 마운트 직후 바로 기본 세션 시작
    try {
      startSession();
    } catch (e) {
      // ignore
    }

    return root;
  }

  function readRecord() {
    const confirm = element("gpr-confirm");

    if (!confirm.checked) {
      throw new Error(
        "실제 검사값 확인 체크를 완료해야 해석할 수 있습니다."
      );
    }

    const patient = element("gpr-patient").value.trim();
    const protocol = element("gpr-protocol").value.trim();
    const diet = element("gpr-diet").value.trim();
    const medication = element("gpr-medication").value.trim();
    const time = element("gpr-time").value;

    if (!patient || !protocol || !diet || !time) {
      throw new Error(
        "환자 ID, 검사법 ID, 식이 정보, 채취 일시는 필수 입력입니다."
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
          MARKERS[key].label + "의 입력 단위를 입력하세요."
        );
      }

      if (value !== null) count += 1;

      markers[key] = { unit, value, margin };
    });

    if (count === 0) {
      throw new Error("해석할 실제 검사값을 1개 이상 입력하세요.");
    }

    return {
      recordedAt: new Date().toISOString(),
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
      // 만약 latest가 아직 없으면 기본 latest 생성
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

    current = null;
    element("gpr-result").replaceChildren();
    element("gpr-message").textContent =
      "검사 세션이 활성화되었습니다. [2. 해석 및 이전 검사와 비교]를 실행하세요.";
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

  function compareToExpected(actual, expected) {
    if (!actual || actual.value === null) return "미측정";
    if (!expected || expected.value === null) return "예상값 없음";
    if (actual.unit !== expected.unit) return "단위 불일치";
    if (actual.margin === null) return "차이만 확인";

    const diff = actual.value - expected.value;
    if (Math.abs(diff) <= actual.margin) return "예상 부합";
    return diff > 0 ? "예상 초과" : "예상 미달";
  }

  function compareToPrevious(actual, prev) {
    if (!actual || actual.value === null) return "미측정";
    if (!prev || prev.value === null) return "이전값 없음";
    if (actual.unit !== prev.unit) return "단위 불일치";

    const diff = actual.value - prev.value;
    if (diff === 0) return "변화 없음";
    return diff > 0 ? "증가" : "감소";
  }

  function analyze(record, expectedSource, baseRecord) {
    const compared = {};
    const shifts = {};

    KEYS.forEach(key => {
      compared[key] = compareToExpected(
        record.markers[key],
        expectedSource?.[key]
      );
      shifts[key] = compareToPrevious(
        record.markers[key],
        baseRecord?.markers[key]
      );
    });

    const patterns = [];

    // 소장계 처리 잔류 단서
    const fatHigh = compared.fat === "예상 초과";
    const carboHigh = compared.carbo === "예상 초과";
    const proteinHigh = compared.protein === "예상 초과";

    if (fatHigh || carboHigh || proteinHigh) {
      const items = [];
      if (fatHigh) items.push("지방 잔류 신호");
      if (carboHigh) items.push("전분 잔류 신호");
      if (proteinHigh) items.push("단백질 반응");

      patterns.push({
        title: "소장계 처리 우선 검토 패턴",
        items,
        text:
          "식이 성분별 처리 역량, 검체 처리법, 통과 속도를 " +
          "함께 검토합니다. 흡수 불량을 확정하는 판정이 아닙니다."
      });
    }

    // 대장 관련 환경 검토
    const phLow = compared.ph === "예상 미달";
    const phHigh = compared.ph === "예상 초과";
    const ammoniaHigh = compared.ammonia === "예상 초과";

    if (phLow || phHigh || ammoniaHigh) {
      patterns.push({
        title: "대장 관련 환경·대사 검토 패턴",
        items: [
          phLow ? "분변 pH 예상 미달" : phHigh ? "분변 pH 예상 초과" : null,
          ammoniaHigh ? "암모니아 예상 초과" : null
        ].filter(Boolean),
        text:
          "발효 기질의 유입량, 장관 통과 시간, 장벽 상태를 함께 봅니다. " +
          "단일 수치로 균총 상태나 병증을 단정하지 않습니다."
      });
    }

    // 잠혈 단독 경고
    if (
      record.markers.blood.value !== null &&
      record.markers.blood.value > 0
    ) {
      patterns.push({
        title: "잠혈 반응 확인",
        items: ["잠혈 관찰값 확인"],
        text:
          "소화관 출혈 여부와 검사법의 특이도를 별도로 확인합니다. " +
          "다른 마커가 안정적이더라도 이 신호는 독립적으로 다룹니다."
      });
    }

    // 분변 비중(SG) 탐색 패턴
    const sgVal = record.markers.sg.value;
    if (sgVal !== null) {
      patterns.push({
        title: "분변 비중(SG) 탐색 지표",
        items: [`실측 비중: ${format(sgVal)}`],
        text:
          "분변의 수분 보존율 및 삼투성 대사 균형을 검토합니다. " +
          "인돌 대체 마커로서 전후 비교 및 추세를 중심으로 관찰합니다."
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
        ? '<div class="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">현재 입력 조건에서 특이 패턴 조합이 발견되지 않았습니다.</div>'
        : summary.analysis.patterns.map(p => `
            <div class="border border-slate-200 bg-slate-50 rounded-xl p-3.5 space-y-1.5">
              <div class="font-extrabold text-xs text-indigo-950 flex items-center space-x-1.5">
                <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span>${escapeHtml(p.title)}</span>
              </div>
              <div class="text-[11px] text-slate-600">${escapeHtml(p.items.join(" · "))}</div>
              <div class="text-xs text-slate-700 font-medium leading-relaxed">${escapeHtml(p.text)}</div>
            </div>
          `).join("");

    const baselineNotice = summary.baseline
      ? matchCondition(summary.record, summary.baseline)
        ? '<span class="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[11px]">동일 조건 기준선과 비교 중</span>'
        : '<span class="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold text-[11px]">주의: 기준선과 환자·검사법·식이가 달라졌습니다.</span>'
      : '<span class="text-slate-500 text-[11px]">기준선(Baseline) 미설정</span>';

    card.innerHTML = `
      <div class="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h4 class="font-black text-sm text-slate-900">분변 해석 판독 요약</h4>
          <p class="text-xs text-slate-500">환자 ID: ${escapeHtml(summary.record.patient)} | 일시: ${escapeHtml(summary.record.time)}</p>
        </div>
        <div>${baselineNotice}</div>
      </div>

      <div class="space-y-2">
        <h5 class="text-xs font-bold text-slate-700">검토 패턴 매칭 결과:</h5>
        ${patternsHtml}
      </div>

      <div class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full text-xs text-left">
          <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th class="p-2">마커</th>
              <th class="p-2">실제 검사값</th>
              <th class="p-2">모형 예상값 대비</th>
              <th class="p-2">이전(기준선) 대비</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${KEYS.map(k => `
              <tr class="hover:bg-slate-50">
                <td class="p-2 font-bold text-slate-800">${escapeHtml(MARKERS[k].label)}</td>
                <td class="p-2 font-semibold">
                  ${format(summary.record.markers[k].value)} ${escapeHtml(summary.record.markers[k].unit || '')}
                </td>
                <td class="p-2 font-bold ${summary.analysis.compared[k] === '예상 부합' ? 'text-emerald-600' : summary.analysis.compared[k].includes('초과') ? 'text-rose-600' : 'text-blue-600'}">
                  ${escapeHtml(summary.analysis.compared[k])}
                </td>
                <td class="p-2 text-slate-600">
                  ${escapeHtml(summary.analysis.shifts[k])}
                </td>
              </tr>
            `).join("")}
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
      "해석이 완료되었습니다. 결과 요약을 확인하세요.";
  }

  function setBaseline() {
    if (!current) {
      throw new Error("먼저 '해석 및 이전 검사와 비교'를 실행하세요.");
    }

    baseline = clone(current.record);
    element("gpr-message").textContent =
      "현재 검사(" + baseline.time + ")를 비교 기준선으로 저장했습니다.";
    render(current);
  }

  function clearBaseline() {
    baseline = null;
    element("gpr-message").textContent = "비교 기준선을 해제했습니다.";
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
        unit
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

    const changed = JSON.stringify(latest) !== JSON.stringify(next);
    latest = next;

    const root = mount();
    if (!root) return;

    // 환자 기본 정보 입력란 동기화 (비어있는 경우만)
    const ctx = getAutoContextValues();
    const patEl = document.getElementById("gpr-patient");
    if (patEl && (!patEl.value || patEl.value === "밍키 (환자-001)")) {
      patEl.value = ctx.patientName;
    }
    const dietEl = document.getElementById("gpr-diet");
    if (dietEl && (!dietEl.value || dietEl.value === "표준 처방식 혼합 급여")) {
      dietEl.value = ctx.dietMix;
    }
    const medEl = document.getElementById("gpr-medication");
    if (medEl && (!medEl.value || medEl.value === "복용 약물 없음")) {
      medEl.value = ctx.drugs;
    }

    element("gpr-context").textContent =
      "5대 축 모형 연결: " +
      (latest.species || "종 정보") +
      ` (${latest.weight_kg}kg, ${latest.age_years}세) / 실측값 대조 준비 완료`;

    KEYS.forEach(key => {
      // 단위 동기화
      const unitEl = document.getElementById("gpr-unit-" + key);
      if (unitEl && !unitEl.value) {
        unitEl.value = DEFAULT_UNITS[key] || "-";
      }

      // 판독폭 동기화
      const marginEl = document.getElementById("gpr-margin-" + key);
      if (marginEl && !marginEl.value && DEFAULT_MARGINS[key] !== "") {
        marginEl.value = DEFAULT_MARGINS[key];
      }

      // 예상값 텍스트 출력
      const expEl = document.getElementById("gpr-expected-" + key);
      if (expEl) {
        if (key === "sg") {
          expEl.textContent = "미설정 · 전후비교";
        } else {
          const item = expected[key];
          expEl.textContent = item && item.value !== null
            ? format(item.value) + " " + (item.unit !== "-" ? item.unit : "")
            : "미설정";
        }
      }

      // 실측값 입력칸 동기화 (기존 CDSS 측정값이 있으면 채움)
      const valEl = document.getElementById("gpr-value-" + key);
      if (valEl && (!valEl.value || valEl.value === "0")) {
        if (map[key]?.meas !== undefined && map[key]?.meas !== null) {
          valEl.value = map[key].meas;
        } else if (DEFAULT_MEAS_VALUES[key] !== undefined) {
          valEl.value = DEFAULT_MEAS_VALUES[key];
        }
      }
    });

    if (changed && session) {
      current = null;
      element("gpr-result").replaceChildren();
      element("gpr-message").textContent =
        "계산 조건이 갱신되었습니다. [2. 해석 및 이전 검사와 비교]를 실행하세요.";
    }

    // 초기 마운트 시 자동 1회 분석 실행하여 빈칸 화면 방지
    if (!current) {
      try {
        runAnalysis();
      } catch (err) {
        // ignore initial error
      }
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
    clearBaseline
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
