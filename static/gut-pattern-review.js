(function () {
  "use strict";
  if (window.GutPatternReview) {
    console.warn("[GutPatternReview] 중복 로딩을 확인하세요.");
    return;
  }
  const VERSION = "gut-pattern-review-0.2";
  // 임상 확률이 아니라, 개발용 기본 해석 분류입니다.
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
      axis: "물리적 보조 정보",
      note:
        "동일한 검체 처리·측정 조건의 전후 변화를 비교합니다. " +
        "수분율·장 통과시간·소화흡수율로 직접 환산하지 않습니다."
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
    root.innerHTML = `
      <h3 class="text-lg font-bold mb-2">
        믹스피딩 반응 · 소장계/대장 관련 패턴 검토
      </h3>
      <p class="text-sm text-slate-600 mb-4">
        개발용 해석 규칙입니다. 실제 검사값만 입력하세요.
        예상값은 기존 가중치 모형의 가설값이며,
        확률·흡수율·처방을 자동 산출하지 않습니다.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <label>
          환자 고유 ID
          <input id="gpr-patient" type="text"
            class="w-full border rounded p-2"
            placeholder="이름 대신 중복되지 않는 병원 환자 ID">
        </label>
        <label>
          검사법·검체 처리 기준 ID
          <input id="gpr-protocol" type="text"
            class="w-full border rounded p-2"
            placeholder="시약/추출비율/습중량·건물량/처리법 식별자">
        </label>
        <label>
          실제 급여 조합·비율·섭취량
          <input id="gpr-diet" type="text"
            class="w-full border rounded p-2"
            placeholder="제품명, 혼합 기준과 비율, 실제 섭취량">
        </label>
        <label>
          약물·용량·변경 시점
          <input id="gpr-medication" type="text"
            class="w-full border rounded p-2"
            placeholder="변경 없으면 동일한 내용으로 기록">
        </label>
        <label>
          검체 채취 일시
          <input id="gpr-time" type="datetime-local"
            class="w-full border rounded p-2">
        </label>
      </div>
      <button type="button" data-gpr-action="start"
        class="border rounded px-4 py-2 bg-slate-100">
        1. 현재 조건으로 새 검사 시작
      </button>
      <p id="gpr-context" class="text-sm my-3"></p>
      <p class="text-xs text-slate-600 mb-2">
        단위는 검사 결과에 맞게 확인하세요.
        기존 예상값과 단위가 다르면 예상값 비교에서 제외합니다.
        '판독폭'은 예상값과의 차이를 분류하기 위해
        검토자가 설정하는 개발용 기준이며,
        정상범위·통계적 유의성·검사오차를 뜻하지 않습니다.
        비워두면 차이만 표시하고 해당 마커의 조합 규칙은 보류합니다.
      </p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border">
          <thead>
            <tr>
              <th class="p-2">마커</th>
              <th class="p-2">입력 단위</th>
              <th class="p-2">모형 예상값</th>
              <th class="p-2">실제 검사값</th>
              <th class="p-2">판독폭</th>
            </tr>
          </thead>
          <tbody>
            ${KEYS.map(key => `
              <tr class="border-t">
                <td class="p-2">${escapeHtml(MARKERS[key].label)}</td>
                <td class="p-2">
                  <input id="gpr-unit-${key}" type="text"
                    class="border rounded p-1 w-28">
                </td>
                <td id="gpr-expected-${key}" class="p-2">—</td>
                <td class="p-2">
                  <input id="gpr-value-${key}" type="number"
                    step="any" min="0"
                    class="border rounded p-1 w-28">
                </td>
                <td class="p-2">
                  <input id="gpr-margin-${key}" type="number"
                    step="any" min="0"
                    class="border rounded p-1 w-28">
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <label class="block text-sm my-4">
        <input id="gpr-confirm" type="checkbox">
        자동 생성값이 아닌 실제 검사값이며,
        검사법·단위·채취 조건을 확인했습니다.
      </label>
      <div class="flex flex-wrap gap-2">
        <button type="button" data-gpr-action="analyze"
          class="border rounded px-4 py-2 bg-blue-50">
          2. 해석 및 이전 검사와 비교
        </button>
        <button type="button" data-gpr-action="baseline"
          class="border rounded px-4 py-2">
          현재 검사를 비교 기준으로 보관
        </button>
        <button type="button" data-gpr-action="clear"
          class="border rounded px-4 py-2">
          비교 기준 해제
        </button>
      </div>
      <p id="gpr-message" role="status" class="text-sm my-3"></p>
      <div id="gpr-result" class="space-y-4"></div>
    `;
    root.dataset.gprMounted = VERSION;
    root.addEventListener("input", function () {
      current = null;
      element("gpr-result").replaceChildren();
      element("gpr-message").textContent =
        "입력이 변경되었습니다. 해석을 다시 실행하세요.";
    });
    root.addEventListener("change", function () {
      current = null;
      element("gpr-result").replaceChildren();
    });
    root.addEventListener("click", function (event) {
      const button = event.target.closest("[data-gpr-action]");
      if (!button || !root.contains(button)) return;
      try {
        const action = button.dataset.gprAction;
        if (action === "start") {
          startSession();
        } else if (action === "clear") {
          baseline = null;
          current = null;
          element("gpr-result").replaceChildren();
          element("gpr-message").textContent = "비교 기준을 해제했습니다.";
        } else {
          const record = readRecord();
          const report = analyze(record);
          current = { record, report };
          if (action === "baseline") {
            baseline = clone(record);
            render(current, null);
            element("gpr-message").textContent =
              "비교 기준으로 보관했습니다. 새 검사 시작 후 비교하세요.";
          } else {
            render(current, baseline ? compare(baseline, record) : null);
            element("gpr-message").textContent =
              baseline ? "현재 검사와 기준 검사를 비교했습니다." :
              "현재 검사를 해석했습니다. 비교 기준은 아직 없습니다.";
          }
        }
      } catch (error) {
        element("gpr-message").textContent = error.message;
        console.error("[GutPatternReview]", error);
      }
    });
    return root;
  }
  function metadata() {
    const data = {
      patientId: element("gpr-patient").value.trim(),
      protocol: element("gpr-protocol").value.trim(),
      diet: element("gpr-diet").value.trim(),
      medication: element("gpr-medication").value.trim(),
      collectedAt: element("gpr-time").value
    };
    if (Object.values(data).some(value => !value)) {
      throw new Error(
        "환자 ID, 검사법, 실제 식단, 약물 기록, 채취 일시를 입력하세요."
      );
    }
    const time = new Date(data.collectedAt).getTime();
    if (!Number.isFinite(time) || time > Date.now()) {
      throw new Error("채취 일시를 확인하세요. 미래 일시는 사용할 수 없습니다.");
    }
    data.collectedAt = new Date(time).toISOString();
    return data;
  }
  function startSession() {
    if (!latest) {
      throw new Error("기존 장내환경 계산을 먼저 실행하세요.");
    }
    session = {
      metadata: metadata(),
      context: clone(latest),
      signature: JSON.stringify(latest)
    };
    current = null;
    KEYS.forEach(key => {
      element("gpr-value-" + key).value = "";
      element("gpr-margin-" + key).value = "";
      element("gpr-unit-" + key).value =
        session.context.expected[key].unit;
    });
    element("gpr-confirm").checked = false;
    element("gpr-result").replaceChildren();
    element("gpr-message").textContent =
      "조건을 고정했습니다. 이 검체의 실제 검사값을 입력하세요.";
  }
  function readRecord() {
    if (!session) {
      throw new Error("'현재 조건으로 새 검사 시작'을 먼저 누르세요.");
    }
    if (JSON.stringify(latest) !== session.signature) {
      throw new Error("계산 조건이 변경되었습니다. 새 검사를 시작하세요.");
    }
    const meta = metadata();
    if (JSON.stringify(meta) !== JSON.stringify(session.metadata)) {
      throw new Error("검사 정보가 변경되었습니다. 새 검사를 시작하세요.");
    }
    if (!element("gpr-confirm").checked) {
      throw new Error("실제 검사값·검사법·단위 확인란을 체크하세요.");
    }
    const warnings = [];
    const markers = {};
    KEYS.forEach(key => {
      const valueText = element("gpr-value-" + key).value.trim();
      const marginText = element("gpr-margin-" + key).value.trim();
      const unit = element("gpr-unit-" + key).value.trim();
      let value = numberOrNull(valueText);
      let margin = numberOrNull(marginText);
      const predicted = session.context.expected[key];
      // 한 항목이 잘못되어도 다른 항목은 계속 처리합니다.
      if (
        valueText &&
        (
          value === null ||
          value < 0 ||
          !unit ||
          (key === "sg" && (value <= 0 || unit !== "-"))
        )
      ) {
        warnings.push(
          key === "sg"
            ? "분변 비중: 0보다 큰 값인지 확인하세요. 단위 표시는 '-'입니다."
            : MARKERS[key].label + ": 값 또는 단위를 확인하세요."
        );
        value = null;
      }
      if (marginText && (margin === null || margin < 0)) {
        warnings.push(MARKERS[key].label + ": 판독폭을 확인하세요.");
        margin = null;
      }
      const expected =
        key !== "sg" && unit && unit === predicted.unit
          ? predicted.value
          : null;
      if (value !== null && expected === null && key !== "sg") {
        warnings.push(
          MARKERS[key].label +
          ": 비교 가능한 예상값이 없어 예상 대비 규칙은 보류합니다."
        );
      }
      markers[key] = {
        value,
        expected,
        margin,
        unit,
        source: value === null ? "missing" : "manual-observation"
      };
    });
    if (!KEYS.some(key => markers[key].value !== null)) {
      throw new Error(
        [
          ...warnings,
          "유효한 실제 검사값을 하나 이상 입력하세요."
        ].join(" ")
      );
    }
    return {
      version: VERSION,
      metadata: meta,
      context: clone(session.context),
      markers,
      warnings
    };
  }
  function analyze(record) {
    const rows = {};
    const groups = {
      small: [],
      large: [],
      cross: [],
      separate: []
    };
    KEYS.forEach(key => {
      const marker = record.markers[key];
      const delta =
        marker.value !== null && marker.expected !== null
          ? marker.value - marker.expected
          : null;
      let state = "unclassified";
      if (delta !== null && marker.margin !== null) {
        state = delta > marker.margin ? "above" :
          delta < -marker.margin ? "below" : "within";
      }
      rows[key] = { ...marker, delta, state };
    });
    const is = (key, state) => rows[key].state === state;
    const has = key => rows[key].value !== null;
    const add = (group, text) => groups[group].push(text);
    const residueAbove = is("fat", "above") || is("carbo", "above");
    if (residueAbove) {
      add("small",
        "지방 또는 전분 잔류 신호가 예상값을 설정 폭 이상 상회합니다. " +
        "식이 특성·소장계 처리·통과 조건을 함께 검토합니다."
      );
    }
    if (is("ammonia", "above")) {
      add(
        "large",
        "암모니아가 예상값을 설정 폭 이상 상회합니다. " +
        "질소성 기질 공급과 대사·흡수·통과 조건을 검토합니다."
      );
    }
    if (is("ph", "above") || is("ph", "below")) {
      add("large",
        "pH가 예상보다 " +
        (is("ph", "above") ? "높은" : "낮은") +
        " 방향으로 이동했습니다. 이 방향 자체를 악화로 판정하지 않습니다."
      );
    }
    if (is("protein", "above")) {
      add("separate",
        "단백질 반응이 예상보다 높습니다. " +
        "식이·숙주·미생물 유래를 구별하지 못하므로 위치를 단독 배정하지 않습니다."
      );
    }
    if (is("protein", "above") && is("ammonia", "below")) {
      add("cross",
        "단백질 반응 상회 + 암모니아 하회: " +
        "잔류 신호와 대사산물의 불일치입니다. " +
        "단백질 출처·미생물 이용·통과시간·검사 조건을 검토합니다."
      );
    }
    if (residueAbove && is("ammonia", "above")) {
      add("cross",
        "잔류 신호와 암모니아가 함께 상회합니다. " +
        "상류 처리 변화와 하류 대사 변화의 연결 후보로 기록합니다."
      );
    }
    if (is("ph", "above") && is("ammonia", "within")) {
      add("cross",
        "pH 상회 + 암모니아는 설정 폭 이내: " +
        "암모니아만으로 pH 변화를 설명하지 않고 다른 기질·대사 조건을 검토합니다."
      );
    }
    if (has("blood")) {
      add("separate",
        "잠혈 결과를 별도 보존합니다. " +
        "이 모듈은 검사법별 양성 기준이나 출혈 위치를 자동 판정하지 않습니다."
      );
    }
    if (has("glucose") || has("lactate")) {
      add("separate",
        "포도당·젖산은 탐색적 관찰값입니다. " +
        "이번 규칙에서는 흡수율·유익균량·건강 점수로 환산하지 않습니다."
      );
    }
    if (has("sg")) {
      add(
        "separate",
        "분변 비중을 물리적 보조 정보로 기록합니다. " +
        "동일 환자·검사법·검체 처리 조건의 이전 측정값과 비교하며, " +
        "비중의 상승·하락을 곧바로 개선·악화로 판정하지 않습니다."
      );
    }

    return {
      rows,
      groups,
      warnings: record.warnings,
      compartmentProbability: { small: null, large: null },
      absorptionRate: null
    };
  }
  function compare(before, after) {
    const warnings = [];
    if (
      before.metadata.patientId !== after.metadata.patientId ||
      before.context.species !== after.context.species
    ) {
      return { rows: [], warnings: ["다른 환자 또는 종은 비교하지 않습니다."] };
    }
    if (before.metadata.protocol !== after.metadata.protocol) {
      return {
        rows: [],
        warnings: ["검사법·검체 처리 기준이 달라 수치 비교를 보류합니다."]
      };
    }
    if (
      new Date(after.metadata.collectedAt).getTime() <=
      new Date(before.metadata.collectedAt).getTime()
    ) {
      return {
        rows: [],
        warnings: ["이후 시점에 채취한 새 검사가 있어야 전후 비교할 수 있습니다."]
      };
    }
    const changes = [];
    if (before.metadata.diet !== after.metadata.diet) {
      changes.push("실제 식단 기록");
    }
    if (
      before.metadata.medication !== after.metadata.medication ||
      JSON.stringify(before.context.drugs) !==
      JSON.stringify(after.context.drugs)
    ) {
      changes.push("약물 기록");
    }
    if (
      JSON.stringify(before.context.diseases) !==
      JSON.stringify(after.context.diseases)
    ) {
      changes.push("질환 조건");
    }
    warnings.push(
      changes.length
        ? "변경된 조건: " + changes.join(", ") + "."
        : "기록된 식단·약물·질환 조건에는 차이가 없습니다."
    );
    warnings.push(
      "관찰 전후 비교입니다. 단독 효과·임상적 개선·인과관계를 확정하지 않습니다."
    );
    const rows = [];
    KEYS.forEach(key => {
      const a = before.markers[key];
      const b = after.markers[key];
      if (a.value === null || b.value === null) return;
      if (!a.unit || a.unit !== b.unit) {
        warnings.push(MARKERS[key].label + ": 단위가 달라 비교에서 제외합니다.");
        return;
      }
      rows.push({
        key,
        unit: b.unit,
        before: a.value,
        after: b.value,
        delta: b.value - a.value,
        residualDelta:
          a.expected !== null && b.expected !== null
            ? (b.value - b.expected) - (a.value - a.expected)
            : null
      });
    });
    return { rows, warnings };
  }

  function render(result, comparison) {
    const { record, report } = result;
    const states = {
      above: "예상 상회",
      below: "예상 하회",
      within: "설정 폭 이내",
      unclassified: "미분류"
    };
    const groupNames = {
      small: "소장계 처리 관련 검토",
      large: "대장 관련 환경·대사 검토",
      cross: "상류–하류 조합 해석",
      separate: "위치 미분리·별도 확인"
    };
    const list = items =>
      "<ul class='list-disc pl-5 space-y-1'>" +
      items.map(text =>
        "<li>" + escapeHtml(text) + "</li>"
      ).join("") +
      "</ul>";
    const row = cells =>
      "<tr class='border-t'>" +
      cells.map(cell =>
        "<td class='p-2 align-top'>" +
        escapeHtml(cell) +
        "</td>"
      ).join("") +
      "</tr>";
    const table = (headers, rows) => `
      <div class="overflow-x-auto">
        <table class="w-full text-sm border">
          <thead>
            <tr>
              ${headers.map(header =>
                "<th class='p-2 text-left'>" +
                escapeHtml(header) +
                "</th>"
              ).join("")}
            </tr>
          </thead>
          <tbody>${rows.join("")}</tbody>
        </table>
      </div>
    `;
    const parts = [
      `
        <p>
          <strong>검사 기록:</strong>
          ${escapeHtml(record.metadata.patientId)} /
          ${escapeHtml(record.metadata.diet)} /
          ${escapeHtml(record.metadata.collectedAt)}
        </p>
      `
    ];
    if (report.warnings.length) {
      parts.push(
        "<h4 class='font-bold'>입력·비교 확인사항</h4>",
        list(report.warnings)
      );
    }
    parts.push(table(
      [
        "마커",
        "기본 해석축",
        "단위",
        "예상값",
        "실측값",
        "실측−예상",
        "분류"
      ],
      KEYS.map(key => {
        const item = report.rows[key];
        return row([
          MARKERS[key].label,
          MARKERS[key].axis,
          item.unit || "—",
          key === "sg" ? "미설정" : format(item.expected),
          format(item.value),
          format(item.delta),
          key === "sg"
            ? "전후 비교용"
            : states[item.state]
        ]);
      })
    ));
    Object.entries(groupNames).forEach(([key, title]) => {
      if (!report.groups[key].length) return;
      parts.push(
        "<h4 class='font-bold'>" + escapeHtml(title) + "</h4>",
        list(report.groups[key])
      );
    });
    if (!Object.values(report.groups).some(items => items.length)) {
      parts.push(
        "<p>현재 입력으로 적용된 조합 규칙이 없습니다. " +
        "이는 정상 판정을 의미하지 않습니다.</p>"
      );
    }
    if (comparison) {
      parts.push(
        "<h4 class='font-bold'>이전 검사와 비교</h4>",
        list(comparison.warnings)
      );
      if (comparison.rows.length) {
        parts.push(table(
          [
            "마커",
            "단위",
            "이전 실측",
            "현재 실측",
            "현재−이전",
            "예상 대비 차이의 변화"
          ],
          comparison.rows.map(item => row([
            MARKERS[item.key].label,
            item.unit,
            format(item.before),
            format(item.after),
            format(item.delta),
            format(item.residualDelta)
          ]))
        ));
      } else {
        parts.push("<p>비교 가능한 측정값이 없습니다.</p>");
      }
    }
    parts.push(
      "<p class='text-xs text-slate-600'>" +
      "개발용 규칙 기반 해석입니다. " +
      "소장·대장 확률, 흡수율, 자동 처방은 산출하지 않습니다. " +
      "비중은 동일한 측정 조건의 변화만 비교합니다." +
      "</p>"
    );
    element("gpr-result").innerHTML = parts.join("");
  }
  // 기존 계산기 → 별도 해석 패널 연결.
  // 기존 evalMap의 meas는 가져오지 않습니다.
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
    if (!evalMap) {
      warnOnce(
        "missing-eval-map",
        "예상값 evalMap이 전달되지 않았습니다. " +
        "기존 계산기의 연결 코드를 확인하세요."
      );
    }
    if (!markerInfo) {
      warnOnce(
        "missing-marker-info",
        "CDSS_MARKER_INFO가 전달되지 않았습니다. " +
        "단위를 확인할 수 없는 예상값은 비교에서 제외됩니다."
      );
    }
    const expected = {};
    KEYS.forEach(key => {
      // 비중에는 인돌의 예상값·단위·가중치를 재사용하지 않습니다.
      if (key === "sg") {
        expected[key] = { value: null, unit: "-" };
        return;
      }
      const unit =
        typeof info[key]?.unit === "string"
          ? info[key].unit
          : "";
      expected[key] = {
        value: unit ? numberOrNull(map[key]?.expected) : null,
        unit
      };
    });
    const next = {
      species: species || context.species || null,
      age_years: numberOrNull(context.age_years),
      weight_kg: numberOrNull(context.weight_kg),
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
    element("gpr-context").textContent =
      "계산기 조건 연결: " +
      (latest.species || "종 정보 미확인") +
      " / 실제 검사값은 아래에 별도로 입력합니다.";
    element("gpr-unit-sg").value = "-";
    element("gpr-unit-sg").readOnly = true;
    // 비중의 예상값은 설정하지 않으므로 예상 대비 판독폭도 비활성화.
    element("gpr-margin-sg").value = "";
    element("gpr-margin-sg").disabled = true;
    KEYS.forEach(key => {
      const item = expected[key];
      element("gpr-expected-" + key).textContent =
        key === "sg"
          ? "미설정 · 전후 비교"
          : item.value === null
            ? "미설정"
            : format(item.value) + " " + item.unit;
    });
    if (changed && session) {
      current = null;
      element("gpr-result").replaceChildren();
      element("gpr-message").textContent =
        "계산 조건이 변경되었습니다. " +
        "'현재 조건으로 새 검사 시작'을 다시 누르세요.";
    }
  }
  window.GutPatternReview = Object.freeze({
    version: VERSION,
    update
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
