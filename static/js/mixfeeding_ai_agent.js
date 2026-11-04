/**
 * static/js/mixfeeding_ai_agent.js
 * 포털별 전용 AI 도우미 (보호자 포털 = 보호자 상담·사용법 Q&A 전용 / 수의사 포털 = 수의사 가이드·자동체크 전용)
 *
 * [핵심 설계]
 * 1. 수동 모드 전환 스위치를 제거하여, 현재 접속한 포털에 맞는 에이전트만 1:1로 표시됨.
 *    - 초기 게이트(로그인/포털 선택 창)에서는 플로팅 에이전트를 숨김.
 *    - 보호자용 믹스피딩 계산기 진입 시 ➔ '🐾 보호자용 믹스피딩 상담 & 사용법 Q&A'만 단독 작동.
 *    - 수의사용 믹스피딩 계산기(로그인 후) 진입 시 ➔ '🩺 수의사용 임상 가이드 & 차트 자동체크 Q&A'만 단독 작동.
 * 2. 첫 진입 시 화면을 가리지 않도록 우측 하단 컴팩트 플로팅 버튼(기본 접힘 상태)으로 시작.
 */

(function () {
    "use strict";

    window.aiAgentState = {
        mode: "guardian", // 현재 활성 포털에 의해 자동 결정 ("guardian" | "vet")
        isOpen: false
    };

    const agentWidgetHtml = `
    <div id="mixfeeding-ai-agent-widget" style="position: fixed; bottom: 18px; right: 18px; z-index: 2147483647; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif; display: none;">
        
        <!-- 메인 대화창 (기본 숨김, 버튼 클릭 시 열림) -->
        <div id="ai-agent-chat-window" style="width: 400px; max-width: calc(100vw - 24px); height: 540px; max-height: calc(100vh - 90px); background: #ffffff; border-radius: 24px; box-shadow: 0 25px 60px -10px rgba(15, 23, 42, 0.45), 0 0 0 2px rgba(16, 185, 129, 0.35); display: none; flex-direction: column; overflow: hidden; transition: all 0.25s ease;">
            
            <!-- 상단 헤더 (현재 포털 전용 헤더만 표시, 수동 전환 버튼 없음) -->
            <div id="ai-agent-header" style="background: linear-gradient(135deg, #065f46, #047857, #0f766e); color: white; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span id="ai-agent-icon" style="width: 34px; height: 34px; border-radius: 11px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">🐾</span>
                    <div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-weight: 900; font-size: 14px; letter-spacing: -0.3px;" id="ai-agent-title">보호자 믹스피딩 상담 · Q&A</span>
                            <span id="ai-agent-role-badge" style="font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 999px; background: #fde047; color: #0f172a;">보호자 전용</span>
                        </div>
                        <div style="font-size: 11px; color: #d1fae5; margin-top: 2px;" id="ai-agent-subtitle">계산기 1분 사용법 안내 · 맞춤 믹스피딩 영양 상담</div>
                    </div>
                </div>
                <button type="button" onclick="toggleAiAgentWindow()" title="대화창 접기" style="background: rgba(255,255,255,0.18); border: none; color: white; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900;">−</button>
            </div>

            <!-- 웹사이트 단계별 바로가기 네비게이션 바 -->
            <div id="ai-agent-step-nav" style="background: #f1f5f9; padding: 7px 10px; border-bottom: 1px solid #cbd5e1; display: flex; align-items: center; gap: 5px; overflow-x: auto; white-space: nowrap;"></div>

            <!-- 대화 메시지 영역 -->
            <div id="ai-agent-messages" style="flex: 1; overflow-y: auto; padding: 14px; background: #f8fafc; display: flex; flex-direction: column; gap: 12px; font-size: 12.5px;"></div>

            <!-- 자주 묻는 질문 칩 (Quick Q&A Prompts) -->
            <div id="ai-agent-quick-chips" style="padding: 7px 10px; background: #ffffff; border-top: 1px solid #e2e8f0; display: flex; gap: 6px; overflow-x: auto; white-space: nowrap;"></div>

            <!-- 하단 텍스트 입력 영역 -->
            <div style="padding: 10px 12px; background: #ffffff; border-top: 1px solid #e2e8f0; display: flex; gap: 6px; align-items: center;">
                <input type="text" id="ai-agent-input" placeholder="궁금한 사용법이나 믹스피딩 질문을 입력하세요..." onkeydown="if(event.key==='Enter') sendAiAgentMessage()" style="flex: 1; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 12px; font-size: 12px; outline: none; background: #f8fafc; color: #0f172a; font-weight: 600;">
                <button type="button" id="ai-agent-send-btn" onclick="sendAiAgentMessage()" style="background: linear-gradient(135deg, #059669, #0d9488); color: white; border: none; padding: 9px 14px; border-radius: 12px; font-weight: 800; font-size: 12px; cursor: pointer; white-space: nowrap; box-shadow: 0 4px 8px rgba(5, 150, 105, 0.25);">
                    질문
                </button>
            </div>
        </div>

        <!-- 기본 표시되는 우측 하단 컴팩트 플로팅 버튼 -->
        <button id="ai-agent-toggle-btn" type="button" onclick="toggleAiAgentWindow()" style="display: flex; padding: 12px 18px; border-radius: 9999px; background: linear-gradient(135deg, #065f46, #059669); color: white; border: 2px solid #ffffff; font-weight: 900; font-size: 13px; cursor: pointer; box-shadow: 0 14px 28px -5px rgba(15, 23, 42, 0.4); align-items: center; gap: 8px;">
            <span id="ai-agent-toggle-icon" style="font-size: 17px;">🐾</span>
            <span id="ai-agent-toggle-label">보호자 믹스피딩 상담 · 사용법 Q&A</span>
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #fde047;"></span>
        </button>
    </div>
    `;

    // 현재 활성화된 포털을 감지하여 보호자용/수의사용 에이전트를 1:1 동기화
    window.syncAiAgentWithActivePortal = function () {
        const widget = document.getElementById("mixfeeding-ai-agent-widget");
        const topBtn = document.getElementById("top-open-ai-agent-btn");
        if (!widget) return;

        const shield = document.getElementById("private-gate-shield");
        const isGateVisible = shield && window.getComputedStyle(shield).display !== "none";

        // 초기 게이트(포털 선택/로그인 화면)에서는 에이전트 숨김
        if (isGateVisible) {
            widget.style.display = "none";
            if (topBtn) topBtn.style.display = "none";
            return;
        }

        const gRoot = document.getElementById("guardian-portal-root");
        const isGuardianActive = gRoot && !gRoot.classList.contains("hidden");
        const hasVetSession = !!sessionStorage.getItem("vet_mix_auth_user");

        widget.style.display = "block";
        if (topBtn) topBtn.style.display = "flex";

        if (isGuardianActive) {
            if (window.aiAgentState.mode !== "guardian" || widget.dataset.initializedMode !== "guardian") {
                widget.dataset.initializedMode = "guardian";
                applyPortalAgentTheme("guardian");
            }
        } else if (hasVetSession) {
            if (window.aiAgentState.mode !== "vet" || widget.dataset.initializedMode !== "vet") {
                widget.dataset.initializedMode = "vet";
                applyPortalAgentTheme("vet");
            }
        } else {
            widget.style.display = "none";
        }
    };

    function initAiAgent() {
        if (!document.getElementById("mixfeeding-ai-agent-widget")) {
            const container = document.createElement("div");
            container.innerHTML = agentWidgetHtml;
            document.body.appendChild(container);
        }

        // 상단 글로벌 바에 AI 상담·Q&A 호출 버튼 추가
        const topBar = document.querySelector("#global-portal-switcher-bar .max-w-7xl > div:last-child");
        if (topBar && !document.getElementById("top-open-ai-agent-btn")) {
            const btn = document.createElement("button");
            btn.id = "top-open-ai-agent-btn";
            btn.type = "button";
            btn.onclick = function () {
                if (!window.aiAgentState.isOpen) toggleAiAgentWindow();
            };
            btn.className = "px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black transition flex items-center space-x-1 shadow";
            btn.innerHTML = '<span id="top-open-ai-agent-label">💬 상담 · 사용법 Q&A</span>';
            topBar.insertBefore(btn, topBar.firstChild);
        }

        // 포털 전환 함수 후킹
        ["enterGuardianPortal", "enterVetPortalDirect", "switchToVetPortalFromTop", "logoutVetSession"].forEach(fnName => {
            if (typeof window[fnName] === "function" && !window[fnName].__aiPortalHooked) {
                const orig = window[fnName];
                window[fnName] = function () {
                    const res = orig.apply(this, arguments);
                    setTimeout(window.syncAiAgentWithActivePortal, 50);
                    return res;
                };
                window[fnName].__aiPortalHooked = true;
            }
        });

        window.syncAiAgentWithActivePortal();
        setInterval(window.syncAiAgentWithActivePortal, 600);
    }

    window.toggleAiAgentWindow = function () {
        const win = document.getElementById("ai-agent-chat-window");
        const btn = document.getElementById("ai-agent-toggle-btn");
        if (!win || !btn) return;

        window.aiAgentState.isOpen = !window.aiAgentState.isOpen;
        if (window.aiAgentState.isOpen) {
            win.style.display = "flex";
            btn.style.display = "none";
        } else {
            win.style.display = "none";
            btn.style.display = "flex";
        }
    };

    function applyPortalAgentTheme(mode) {
        window.aiAgentState.mode = mode;
        const header = document.getElementById("ai-agent-header");
        const icon = document.getElementById("ai-agent-icon");
        const title = document.getElementById("ai-agent-title");
        const badge = document.getElementById("ai-agent-role-badge");
        const subTitle = document.getElementById("ai-agent-subtitle");
        const sendBtn = document.getElementById("ai-agent-send-btn");
        const inp = document.getElementById("ai-agent-input");
        const toggleBtn = document.getElementById("ai-agent-toggle-btn");
        const toggleIcon = document.getElementById("ai-agent-toggle-icon");
        const toggleLabel = document.getElementById("ai-agent-toggle-label");
        const topLabel = document.getElementById("top-open-ai-agent-label");
        const chatWin = document.getElementById("ai-agent-chat-window");

        if (mode === "vet") {
            if (header) header.style.background = "linear-gradient(135deg, #1e1b4b, #312e81, #1d4ed8)";
            if (icon) icon.innerText = "🩺";
            if (title) title.innerText = "수의사 임상 가이드 · 자동체크";
            if (badge) { badge.innerText = "수의사 전용"; badge.style.background = "#38bdf8"; badge.style.color = "#0f172a"; }
            if (subTitle) subTitle.innerText = "4대 탭 사용법 · 자연어 차트 자동체크 · 임상 문헌 Q&A";
            if (sendBtn) sendBtn.style.background = "linear-gradient(135deg, #4f46e5, #2563eb)";
            if (inp) inp.placeholder = "탭 사용법 질문 또는 환자 차트(체중·질환·혈액수치) 입력...";
            if (toggleBtn) toggleBtn.style.background = "linear-gradient(135deg, #1e1b4b, #2563eb)";
            if (toggleIcon) toggleIcon.innerText = "🩺";
            if (toggleLabel) toggleLabel.innerText = "수의사 가이드 · 차트 자동체크 Q&A";
            if (topLabel) topLabel.innerText = "🩺 수의사 가이드 · 자동체크";
            if (chatWin) chatWin.style.boxShadow = "0 25px 60px -10px rgba(15, 23, 42, 0.45), 0 0 0 2px rgba(59, 130, 246, 0.4)";
        } else {
            if (header) header.style.background = "linear-gradient(135deg, #065f46, #047857, #0f766e)";
            if (icon) icon.innerText = "🐾";
            if (title) title.innerText = "보호자 믹스피딩 상담 · Q&A";
            if (badge) { badge.innerText = "보호자 전용"; badge.style.background = "#fde047"; badge.style.color = "#0f172a"; }
            if (subTitle) subTitle.innerText = "계산기 1분 사용법 안내 · 맞춤 믹스피딩 영양 상담";
            if (sendBtn) sendBtn.style.background = "linear-gradient(135deg, #059669, #0d9488)";
            if (inp) inp.placeholder = "계산기 사용법, 사료 등록법, 믹스피딩 질문을 입력하세요...";
            if (toggleBtn) toggleBtn.style.background = "linear-gradient(135deg, #065f46, #059669)";
            if (toggleIcon) toggleIcon.innerText = "🐾";
            if (toggleLabel) toggleLabel.innerText = "보호자 믹스피딩 상담 · 사용법 Q&A";
            if (topLabel) topLabel.innerText = "🐾 보호자 상담 · 사용법 Q&A";
            if (chatWin) chatWin.style.boxShadow = "0 25px 60px -10px rgba(15, 23, 42, 0.45), 0 0 0 2px rgba(16, 185, 129, 0.35)";
        }

        renderStepNavBar();
        renderAiChips();
        addWelcomeMessage();
    }

    // 호환용 별칭
    window.switchAiAgentMode = applyPortalAgentTheme;

    function renderStepNavBar() {
        const navBox = document.getElementById("ai-agent-step-nav");
        if (!navBox) return;

        if (window.aiAgentState.mode === "vet") {
            navBox.innerHTML = `
                <span style="font-size: 10.5px; font-weight: 900; color: #334155; margin-right: 2px;">📍 탭 이동:</span>
                <button type="button" onclick="goToCalculatorSection('vet-tab1')" style="padding: 4px 8px; border-radius: 7px; border: 1px solid #cbd5e1; background: #ffffff; color: #1e293b; font-size: 10.5px; font-weight: 800; cursor: pointer;">1.환자·질환</button>
                <button type="button" onclick="goToCalculatorSection('vet-tab2-ocr')" style="padding: 4px 8px; border-radius: 7px; border: 1px solid #93c5fd; background: #eff6ff; color: #1d4ed8; font-size: 10.5px; font-weight: 800; cursor: pointer;">2.처방식·외부사료OCR</button>
                <button type="button" onclick="goToCalculatorSection('vet-tab3')" style="padding: 4px 8px; border-radius: 7px; border: 1px solid #cbd5e1; background: #ffffff; color: #1e293b; font-size: 10.5px; font-weight: 800; cursor: pointer;">3.영양소검토</button>
                <button type="button" onclick="goToCalculatorSection('vet-tab4')" style="padding: 4px 8px; border-radius: 7px; border: 1px solid #cbd5e1; background: #ffffff; color: #1e293b; font-size: 10.5px; font-weight: 800; cursor: pointer;">4.분변·혈액CDSS</button>
            `;
        } else {
            navBox.innerHTML = `
                <span style="font-size: 10.5px; font-weight: 900; color: #334155; margin-right: 2px;">📍 단계 이동:</span>
                <button type="button" onclick="goToCalculatorSection('guardian-step1')" style="padding: 4px 8px; border-radius: 7px; border: 1px solid #cbd5e1; background: #ffffff; color: #1e293b; font-size: 10.5px; font-weight: 800; cursor: pointer;">STEP 1 기본정보</button>
                <button type="button" onclick="goToCalculatorSection('guardian-step2-ocr')" style="padding: 4px 8px; border-radius: 7px; border: 1px solid #a7f3d0; background: #ecfdf5; color: #047857; font-size: 10.5px; font-weight: 800; cursor: pointer;">STEP 2 사료검색·OCR</button>
                <button type="button" onclick="goToCalculatorSection('guardian-step3')" style="padding: 4px 8px; border-radius: 7px; border: 1px solid #cbd5e1; background: #ffffff; color: #1e293b; font-size: 10.5px; font-weight: 800; cursor: pointer;">STEP 3 혼합비율</button>
                <button type="button" onclick="goToCalculatorSection('guardian-step4')" style="padding: 4px 8px; border-radius: 7px; border: 1px solid #cbd5e1; background: #ffffff; color: #1e293b; font-size: 10.5px; font-weight: 800; cursor: pointer;">STEP 4 하루급여표</button>
            `;
        }
    }

    function renderAiChips() {
        const chipBox = document.getElementById("ai-agent-quick-chips");
        if (!chipBox) return;

        if (window.aiAgentState.mode === "vet") {
            chipBox.innerHTML = `
                <button type="button" onclick="setQuickPrompt('수의사용 계산기 4개 탭 사용법과 외부사료 OCR 저장 방법 알려줘')" style="padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 9999px; border: 1px solid #c7d2fe; background: #eef2ff; color: #3730a3; cursor: pointer;">
                    📖 수의사용 탭별 사용법
                </button>
                <button type="button" onclick="setQuickPrompt('11세 중성화 수컷 말티즈 3.8kg. 만성 신부전 2단계(BUN 42, Crea 2.1, SDMA 17, P 5.8), 췌장염 병력(cPL 240). 최근 식욕부진 및 구토, 만성 설사 관찰됨. 소고기 알러지 있음.')" style="padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 9999px; border: 1px solid #93c5fd; background: #eff6ff; color: #1e40af; cursor: pointer;">
                    ✍️ [차트 자동체크] CKD+췌장염 예시
                </button>
                <button type="button" onclick="setQuickPrompt('Tab 4 분변 마커와 혈액 가중치(ΔW_Lab, α=0.40) 교차검증 원리 설명해줘')" style="padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 9999px; border: 1px solid #a7f3d0; background: #ecfdf5; color: #065f46; cursor: pointer;">
                    🔬 분변·혈액 ΔW_Lab 알고리즘 원리
                </button>
                <button type="button" onclick="setQuickPrompt('만성신부전(CKD)과 췌장염 복합질환 환자의 영양 상충 해결 CDSS 기준과 관련 논문 찾아줘')" style="padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 9999px; border: 1px solid #fed7aa; background: #fff7ed; color: #c2410c; cursor: pointer;">
                    📚 CKD+췌장염 처방 근거 논문
                </button>
            `;
        } else {
            chipBox.innerHTML = `
                <button type="button" onclick="setQuickPrompt('보호자용 믹스피딩 계산기 1분 사용법 알려줘')" style="padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 9999px; border: 1px solid #93c5fd; background: #eff6ff; color: #1e40af; cursor: pointer;">
                    📖 계산기 1분 사용법
                </button>
                <button type="button" onclick="setQuickPrompt('사료 포장지 사진 OCR 스캔은 어디서 하고 어디에 저장되나요?')" style="padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 9999px; border: 1px solid #ddd6fe; background: #f5f3ff; color: #5b21b6; cursor: pointer;">
                    📷 사료 OCR 등록 & 저장 위치
                </button>
                <button type="button" onclick="setQuickPrompt('현재 우리 아이의 믹스피딩 급여량과 영양 밸런스 상담해줘')" style="padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 9999px; border: 1px solid #a7f3d0; background: #ecfdf5; color: #047857; cursor: pointer;">
                    🥣 우리 아이 맞춤 배합 상담
                </button>
                <button type="button" onclick="setQuickPrompt('새 사료로 바꿀 때 설사 안 하게 7일 동안 어떻게 섞어주나요?')" style="padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 9999px; border: 1px solid #fde68a; background: #fefce8; color: #a16207; cursor: pointer;">
                    📅 7일 사료 전환표
                </button>
                <button type="button" onclick="setQuickPrompt('아이 음수량을 늘리는 방법과 간식 토핑 10% 기준 알려줘')" style="padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 9999px; border: 1px solid #bae6fd; background: #f0f9ff; color: #0369a1; cursor: pointer;">
                    💧 음수량 & 간식 10% 계산
                </button>
            `;
        }
    }

    function addWelcomeMessage() {
        const box = document.getElementById("ai-agent-messages");
        if (!box) return;
        box.innerHTML = "";

        if (window.aiAgentState.mode === "guardian") {
            appendMessage("ai", `
                <div style="font-weight: 900; color: #065f46; font-size: 13px; margin-bottom: 6px;">🐾 안녕하세요! 보호자 전용 믹스피딩 상담 · 사용법 도우미입니다.</div>
                <div style="font-size: 12px; color: #334155; line-height: 1.55;">
                    보호자용 계산기의 모든 기능(사료 검색·라벨 OCR·비율 배합·하루 급여표)을 쉽게 쓰실 수 있도록 도와드립니다.<br><br>
                    • <strong>📖 웹사이트 사용법:</strong> 아래 <strong>[계산기 1분 사용법]</strong>이나 <strong>[사료 OCR 등록 위치]</strong> 버튼을 눌러보세요.<br>
                    • <strong>🥣 맞춤 영양 상담:</strong> 건식+습식/화식 섞어 먹이는 비율, 7일 사료 전환법, 하루 물 섭취량, 간식 10% 계산을 바로 답변해 드립니다.
                </div>
            `);
        } else {
            appendMessage("ai", `
                <div style="font-weight: 900; color: #1e3a8a; font-size: 13px; margin-bottom: 6px;">🩺 수의사 전용 임상 가이드 & 스마트 차트 도우미입니다.</div>
                <div style="font-size: 12px; color: #334155; line-height: 1.55;">
                    • <strong>📖 4대 탭 & 외부사료 OCR 안내:</strong> 외부 사료 추가(Tab 2), 분변·혈액 교차검증(Tab 4), 환자 EMR 백업 사용법을 안내합니다.<br>
                    • <strong>✍️ 자연어 차트 자동 체크:</strong> 환자 신상·질환·혈액수치·초음파 소견을 문장으로 입력하시면 <strong>Tab 1·Tab 4의 해당 항목을 일괄 체크</strong>합니다.<br>
                    • <strong>📚 복합질환 처방 근거 Q&A:</strong> IRIS, ACVIM, WSAVA, SACN 기반 영양 상충 해결 원칙을 요약해 드립니다.
                </div>
            `);
        }
    }

    function appendMessage(sender, htmlContent) {
        const box = document.getElementById("ai-agent-messages");
        if (!box) return;

        const isUser = sender === "user";
        const isVet = window.aiAgentState.mode === "vet";
        const accentColor = isVet ? "#2563eb" : "#059669";

        const msgDiv = document.createElement("div");
        msgDiv.style.display = "flex";
        msgDiv.style.justifyContent = isUser ? "flex-end" : "flex-start";
        msgDiv.style.gap = "8px";
        msgDiv.style.alignItems = "flex-start";

        if (isUser) {
            msgDiv.innerHTML = `
                <div style="background: ${accentColor}; color: white; padding: 9px 13px; border-radius: 18px 18px 4px 18px; max-width: 85%; line-height: 1.45; word-break: break-word; font-weight: 600; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    ${htmlContent}
                </div>
            `;
        } else {
            msgDiv.innerHTML = `
                <span style="width: 26px; height: 26px; border-radius: 50%; background: ${accentColor}; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; flex-shrink: 0; margin-top: 2px;">Q&A</span>
                <div style="background: white; color: #1e293b; padding: 11px 13px; border-radius: 18px 18px 18px 4px; max-width: 88%; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.05); line-height: 1.55; word-break: break-word;">
                    ${htmlContent}
                </div>
            `;
        }

        box.appendChild(msgDiv);
        box.scrollTop = box.scrollHeight;
    }

    window.setQuickPrompt = function (text) {
        const inp = document.getElementById("ai-agent-input");
        if (inp) {
            inp.value = text;
            sendAiAgentMessage();
        }
    };

    // 계산기 특정 섹션/탭으로 즉시 이동
    window.goToCalculatorSection = function (target) {
        if (target.startsWith("guardian")) {
            if (target === "guardian-step1") {
                if (typeof window.scrollToGuardianSection === "function") window.scrollToGuardianSection("g-step1-sec");
            } else if (target === "guardian-step2-ocr") {
                if (typeof window.switchGuardianIngestTab === "function") window.switchGuardianIngestTab("ocr");
                if (typeof window.scrollToGuardianSection === "function") window.scrollToGuardianSection("g-step2-sec");
            } else if (target === "guardian-step2") {
                if (typeof window.scrollToGuardianSection === "function") window.scrollToGuardianSection("g-step2-sec");
            } else if (target === "guardian-step3") {
                if (typeof window.scrollToGuardianSection === "function") window.scrollToGuardianSection("g-step3-sec");
            } else if (target === "guardian-step4") {
                if (typeof window.scrollToGuardianSection === "function") window.scrollToGuardianSection("g-step4-sec");
            }
        } else if (target.startsWith("vet")) {
            if (target === "vet-tab1") {
                if (typeof window.switchTab === "function") window.switchTab("patient-tab");
            } else if (target === "vet-tab2") {
                if (typeof window.switchTab === "function") window.switchTab("feeding-tab");
            } else if (target === "vet-tab2-ocr") {
                if (typeof window.switchTab === "function") window.switchTab("feeding-tab");
                const panel = document.getElementById("custom-diet-studio-panel");
                if (panel && panel.classList.contains("hidden") && typeof window.toggleCustomDietStudio === "function") {
                    window.toggleCustomDietStudio();
                }
                if (panel) panel.scrollIntoView({ behavior: "smooth", block: "center" });
            } else if (target === "vet-tab3") {
                if (typeof window.switchTab === "function") window.switchTab("analytics-tab");
            } else if (target === "vet-tab4") {
                if (typeof window.switchTab === "function") window.switchTab("monitoring-tab");
            }
        }
    };

    window.sendAiAgentMessage = async function () {
        const inp = document.getElementById("ai-agent-input");
        const text = (inp?.value || "").trim();
        if (!text) return;

        appendMessage("user", text);
        inp.value = "";

        const isVet = window.aiAgentState.mode === "vet";

        // 수의사 모드에서 환자 수치/증상/질환 서술인지 판별 (사용법/원리 질문 제외)
        const isChartNote = /(kg|세|살|bun|crea|cr|sdma|cpl|fpl|alt|alb|구토|설사|혈변|식욕|복통|장벽|고에코|신부전|ckd|췌장염|심장|mmvd|ibd|당뇨|쿠싱|결석|관절|알러지|말티즈|포메|푸들|시츄|코숏)/i.test(text)
            && !/(논문|문헌|찾아|근거|출처|가이드라인|사용법|어디|저장|원리|설명|알려)/i.test(text);

        if (isVet && isChartNote) {
            const parsed = parseFullVetChartNote(text);
            const counts = applyFullVetChartToCalculator(parsed);

            appendMessage("ai", `
                <div style="color: #1d4ed8; font-weight: 900; font-size: 13px; margin-bottom: 6px;">
                    ✅ 진료 기록을 분석하여 계산기 항목을 자동 체크·입력했습니다!
                </div>
                <div style="background: #eff6ff; padding: 10px; border-radius: 10px; border: 1px solid #bfdbfe; font-size: 11.5px; line-height: 1.55;">
                    • <strong>환자 신상 (${counts.patient}항목):</strong> ${parsed.species} / ${parsed.breed || '품종유지'} / ${parsed.weight || '-'}kg / ${parsed.age || '-'}세 / ${parsed.gender || '성별유지'} / BCS ${parsed.bcs || '-'} / ${parsed.mcs || 'MCS유지'}<br>
                    • <strong>자동 체크된 질환 (${parsed.diseases.length}건):</strong> <strong style="color:#1e40af;">${parsed.diseases.join(', ') || '없음'}</strong><br>
                    • <strong>자동 입력된 혈액수치 (${counts.lab}항목):</strong> ${formatLabSummary(parsed.lab)}<br>
                    • <strong>자동 체크된 증상/초음파:</strong> ${parsed.symptoms.join(', ') || '없음'} ${parsed.us_thickness ? `(장벽 ${parsed.us_thickness}mm)` : ''}<br>
                    • <strong>자동 체크된 알러지:</strong> ${parsed.allergies.join(', ') || '없음'}
                </div>
                <div style="display:flex; gap:6px; margin-top:8px;">
                    <button type="button" onclick="goToCalculatorSection('vet-tab2')" style="flex:1; padding: 8px; border-radius: 10px; background: #2563eb; color: white; border: none; font-weight: 800; font-size: 11px; cursor: pointer;">📊 Tab 2 믹스피딩 처방 결과 보기 ➔</button>
                </div>
            `);
            return;
        }

        if (isVet) {
            appendMessage("ai", generateVetGuideAndCdssResponse(text));
        } else {
            appendMessage("ai", generateGuardianGuideAndCounseling(text));
        }
    };

    function generateVetGuideAndCdssResponse(query) {
        const q = query.toLowerCase();

        if (q.includes("사용법") || q.includes("탭") || q.includes("ocr") || q.includes("저장") || q.includes("어디")) {
            return `
                <div style="color: #1e3a8a; font-weight: 900; font-size: 13px; margin-bottom: 6px;">
                    📖 수의사용 포털 4대 탭 사용법 & 사료 OCR 저장 안내
                </div>
                <div style="background: #f8fafc; padding: 10px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 11.5px; line-height: 1.55;">
                    • <strong>Tab 1 (환자·병력·약물):</strong> 체중, BCS/MCS, 28종 기저질환, 투약 중인 약물, 알러지 원료를 선택합니다.<br>
                    • <strong>Tab 2 (믹스피딩 설계 & 외부사료 OCR):</strong> 처방식 조합 비율과 기본 DER 기준 급여량(g)을 산출합니다. 상단 우측의 <strong>[+ DB에 없는 외부 사료 추가 (사진 OCR)]</strong>을 누르면 성분표 사진을 스캔해 등록할 수 있습니다.<br>
                    • <strong>💾 외부 사료는 어디에 저장되나요?</strong><br>
                      &nbsp;&nbsp;👉 <code>[주사료/보조사료로 적용]</code> 클릭 시 <strong>현재 로그인한 수의사 계정의 브라우저 저장소(<code>localStorage</code>)에 영구 보관</strong>되며, 사료 선택 드롭다운 맨 위에 <code>⭐ [내 등록사료]</code>로 언제든 다시 불러올 수 있습니다.<br>
                    • <strong>Tab 3 (다중 영양소 & 음수량):</strong> 건물(DM) 및 1,000kcal 기준 영양소 충족도와 일일 목표 음수량을 검토합니다.<br>
                    • <strong>Tab 4 (분변·혈액 교차검증 CDSS):</strong> 실측 분변 마커 또는 혈액검사(BUN/Cr/P/Alb/cPL 등) 입력 시 <code>ΔW_Lab(α=0.40)</code> 가중치를 교차 검증합니다.
                </div>
                <div style="display:flex; gap:6px; margin-top:8px;">
                    <button type="button" onclick="goToCalculatorSection('vet-tab2-ocr')" style="flex:1; padding: 8px; border-radius: 10px; background: #2563eb; color: white; border: none; font-weight: 800; font-size: 11px; cursor: pointer;">📷 Tab 2 외부사료 OCR 스튜디오 열기 ➔</button>
                </div>
            `;
        }

        if (q.includes("분변") || q.includes("마커") || q.includes("혈액") || q.includes("가중치") || q.includes("원리") || q.includes("0.4")) {
            return `
                <div style="color: #065f46; font-weight: 900; font-size: 13px; margin-bottom: 6px;">
                    🔬 Tab 4 분변 마커 & 혈액 가중치(ΔW_Lab) 알고리즘 원리
                </div>
                <div style="background: #ecfdf5; padding: 10px; border-radius: 10px; border: 1px solid #a7f3d0; font-size: 11.5px; line-height: 1.55;">
                    • <strong>실측치 vs 모형 추정치 분리 원칙:</strong> 실제 분변키트 측정값을 입력하지 않은 상태에서는 모든 수치가 <code>(모형 추정)</code>으로 표기되며, 정상/안정 단정 문구를 생성하지 않습니다.<br>
                    • <strong>혈액 가중치 결합 계수 (α = 0.40):</strong> 질환·식이·약물 사전가중치(Prior)에 혈액검사 이상도(<code>ΔW_Lab</code>)를 <code>α=0.40</code> 비율(최대 보정폭 ±12%p 이내)로 결합한 탐색적 보조지표입니다.<br>
                    • <strong>급여량 안전 분리:</strong> 추정 흡수율 보정치는 참고용으로만 표시하며, 실제 처방 급여량(g/day)은 항상 <strong>기본 DER(1일 권장 칼로리) 단일 기준</strong>으로 안전하게 유지됩니다.
                </div>
                <button type="button" onclick="goToCalculatorSection('vet-tab4')" style="margin-top: 8px; width: 100%; padding: 8px; border-radius: 10px; background: #059669; color: white; border: none; font-weight: 800; font-size: 11px; cursor: pointer;">🔬 Tab 4 분변·혈액 CDSS 화면으로 이동 ➔</button>
            `;
        }

        return `
            <div style="color: #1e3a8a; font-weight: 900; font-size: 13px; margin-bottom: 6px;">
                📚 수의 임상 영양 CDSS & 학술 문헌 검색 결과
            </div>
            <div style="background: #f8fafc; padding: 10px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 11.5px; line-height: 1.55;">
                <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px;">1. 복합질환 영양 상충 해결 알고리즘 (Strict Min-Max Intersection)</div>
                • <strong>CKD(신부전) + 췌장염 동반 시:</strong> 일반 신장 처방식(고지방 35~45g/1,000kcal) 단독 급여 시 고중성지방혈증 및 췌장 자극 우려가 있으므로, <strong>지방 상한선(&lt;25~30g/1,000kcal)과 인 상한선(&lt;0.8g/1,000kcal)의 교집합</strong>을 만족하도록 저지방 처방식과 신장 처방식의 믹스피딩 비율을 설계합니다.<br><br>
                <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px;">2. 핵심 근거 문헌 (Evidence & Citations)</div>
                • <strong>[IRIS 2023 Guidelines]</strong> Stage별 혈중 인(P) 목표치 유지를 위한 식이 인 제한 권고.<br>
                • <strong>[ACVIM Consensus 2021 (JVIM)]</strong> 만성/재발성 췌장염 및 고지혈증 환자의 식이 지방 제한 권고.<br>
                • <strong>[WSAVA Global Nutrition Guidelines & SACN 5th Ed.]</strong> 복합질환 환자의 다중 영양소 상충 제어 기준.
            </div>
            <div style="margin-top: 8px; display: flex; gap: 6px;">
                <a href="https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent('canine CKD pancreatitis dietary nutrition')}" target="_blank" style="flex: 1; text-align: center; padding: 7px; border-radius: 8px; background: #1e293b; color: #38bdf8; text-decoration: none; font-size: 11px; font-weight: 800;">🔗 PubMed 관련 논문 검색 ➔</a>
            </div>
        `;
    }

    function generateGuardianGuideAndCounseling(query) {
        const q = query.toLowerCase();
        const wt = parseFloat(document.getElementById("g-weight")?.value) || 4.5;
        const dryName = document.getElementById("g-dry-name")?.value || "주식 사료";
        const derText = document.getElementById("g-out-der")?.innerText || Math.round(70 * Math.pow(wt, 0.75) * 1.4);
        const derNum = parseFloat(derText) || 320;

        if (q.includes("사용법") || q.includes("1분") || q.includes("어떻게") || q.includes("순서") || q.includes("처음")) {
            return `
                <div style="color: #1d4ed8; font-weight: 900; font-size: 13px; margin-bottom: 6px;">
                    📖 보호자용 믹스피딩 계산기 1분 사용법
                </div>
                <div style="background: #eff6ff; padding: 10px; border-radius: 10px; border: 1px solid #bfdbfe; font-size: 11.5px; line-height: 1.55;">
                    상단의 <strong>[⚡ 1분 간편 모드]</strong>가 켜져 있으면 복잡한 항목 없이 딱 4단계로 끝납니다!<br><br>
                    • <strong>STEP 1 (기본 정보):</strong> 강아지/고양이, 체중(kg), 체형(BCS), 변 상태만 선택하세요.<br>
                    • <strong>STEP 2 (사료 선택/OCR):</strong> 먹이는 사료를 검색하거나, 없으면 <strong>[📸 2. 포장지 OCR 스캔]</strong> 탭에서 성분표 사진을 찍어 올리세요.<br>
                    • <strong>STEP 3 (혼합 비율):</strong> 건식+습식, 건식+화식, 건식+생식/토핑 중 원하는 메뉴와 비율(%) 슬라이더를 움직이세요.<br>
                    • <strong>STEP 4 (하루 급여표):</strong> 한 끼당 정확한 그램(g) 수와 종이컵 계량표, AAFCO 영양 신호등을 확인하세요!
                </div>
                <div style="display:flex; gap:6px; margin-top:8px;">
                    <button type="button" onclick="goToCalculatorSection('guardian-step1')" style="flex:1; padding: 8px; border-radius: 10px; background: #2563eb; color: white; border: none; font-weight: 800; font-size: 11px; cursor: pointer;">① STEP 1부터 시작하기 ➔</button>
                    <button type="button" onclick="goToCalculatorSection('guardian-step4')" style="flex:1; padding: 8px; border-radius: 10px; background: #059669; color: white; border: none; font-weight: 800; font-size: 11px; cursor: pointer;">④ 하루 급여표 바로보기 ➔</button>
                </div>
            `;
        }

        if (q.includes("ocr") || q.includes("사진") || q.includes("포장지") || q.includes("저장") || q.includes("등록")) {
            return `
                <div style="color: #5b21b6; font-weight: 900; font-size: 13px; margin-bottom: 6px;">
                    📷 사료 라벨 사진 OCR 사용법 & 저장 위치 안내
                </div>
                <div style="background: #f5f3ff; padding: 10px; border-radius: 10px; border: 1px solid #ddd6fe; font-size: 11.5px; line-height: 1.55;">
                    <strong>1. 어디서 스캔하나요?</strong><br>
                    • 본문 <strong>[STEP 2] ➔ [📸 2. 포장지 OCR 스캔]</strong> 버튼을 누르시면 주사료(건식)와 믹스사료(습식/화식) 뒷면 성분표 사진을 각각 올리실 수 있습니다.<br><br>
                    <strong>2. OCR로 입력하면 어디에 저장되나요?</strong><br>
                    • 사진 스캔이 끝나거나 숫자를 수정하신 뒤 <strong>[⭐ 내 사료 목록에 영구 저장]</strong> 버튼을 누르시면, <strong>현재 사용 중인 스마트폰/PC 브라우저(<code>localStorage</code>)에 자동 저장</strong>됩니다.<br>
                    • 저장된 사료는 페이지를 새로고침해도 사라지지 않고, <strong>[🔍 1. 사료 DB 검색] 목록 맨 위에 <code>⭐ [내 저장사료]</code></strong>로 언제든 다시 선택할 수 있습니다!
                </div>
                <button type="button" onclick="goToCalculatorSection('guardian-step2-ocr')" style="margin-top: 8px; width: 100%; padding: 8px; border-radius: 10px; background: #6d28d9; color: white; border: none; font-weight: 800; font-size: 11.5px; cursor: pointer;">📸 STEP 2 포장지 OCR 스캔 화면으로 바로 이동 ➔</button>
            `;
        }

        if (q.includes("7일") || q.includes("바꿀") || q.includes("전환") || q.includes("설사")) {
            return `
                <div style="color: #065f46; font-weight: 900; font-size: 13px; margin-bottom: 6px;">
                    📅 장 트러블 없는 '7일 사료 전환 스케줄'
                </div>
                <div style="background: #ecfdf5; padding: 10px; border-radius: 10px; border: 1px solid #a7f3d0; font-size: 11.5px; line-height: 1.55;">
                    갑자기 새 사료나 습식/화식을 많이 섞어주면 장내 미생물과 소화효소가 적응하지 못해 연변을 볼 수 있습니다.<br><br>
                    • <strong>1~2일차:</strong> 기존 식단 <strong>75%</strong> + 새 믹스사료 <strong>25%</strong><br>
                    • <strong>3~4일차:</strong> 기존 식단 <strong>50%</strong> + 새 믹스사료 <strong>50%</strong><br>
                    • <strong>5~6일차:</strong> 기존 식단 <strong>25%</strong> + 새 믹스사료 <strong>75%</strong><br>
                    • <strong>7일차~:</strong> 목표 믹스피딩 비율 <strong>100%</strong> 적용!<br>
                    <span style="color:#047857; font-size:11px;">💡 전환 중 변이 무르면 그 단계 비율에서 2~3일 더 머물렀다가 천천히 넘어가세요.</span>
                </div>
            `;
        }

        if (q.includes("음수") || q.includes("물") || q.includes("토핑") || q.includes("간식") || q.includes("10%")) {
            const waterGoal = Math.round(derNum * 1.0);
            const treatLimit = Math.round(derNum * 0.1);
            return `
                <div style="color: #0369a1; font-weight: 900; font-size: 13px; margin-bottom: 6px;">
                    💧 우리 아이 하루 음수량 & 간식·토핑 10% 안전 기준
                </div>
                <div style="background: #f0f9ff; padding: 10px; border-radius: 10px; border: 1px solid #bae6fd; font-size: 11.5px; line-height: 1.55;">
                    • <strong>현재 체중(${wt}kg) 권장 칼로리(DER):</strong> 하루 약 <strong>${Math.round(derNum)} kcal</strong><br>
                    • <strong>💧 하루 목표 수분 섭취량:</strong> 약 <strong>${waterGoal} ml</strong> (종이컵 약 ${(waterGoal / 180).toFixed(1)}컵)<br>
                      &nbsp;&nbsp;👉 습식캔/화식을 25~30% 섞어주시면 식사 속 수분만으로 하루 물 목표량의 상당 부분을 자연스럽게 채울 수 있습니다.<br>
                    • <strong>🍖 간식·단일 토핑 10% 안전선:</strong> 하루 최대 <strong>${treatLimit} kcal 이내</strong><br>
                      &nbsp;&nbsp;👉 삶은 닭가슴살 기준 약 <strong>${Math.round(treatLimit / 1.09)}g</strong> 이내로 주셔야 주식 사료의 칼슘:인 영양 균형이 깨지지 않습니다.
                </div>
                <button type="button" onclick="goToCalculatorSection('guardian-step3')" style="margin-top: 8px; width: 100%; padding: 8px; border-radius: 10px; background: #0284c7; color: white; border: none; font-weight: 800; font-size: 11.5px; cursor: pointer;">🍖 STEP 3 토핑·믹스피딩 배합기 바로가기 ➔</button>
            `;
        }

        return `
            <div style="color: #065f46; font-weight: 900; font-size: 13px; margin-bottom: 6px;">
                🐾 우리 아이 맞춤 믹스피딩 영양 상담
            </div>
            <div style="background: #f8fafc; padding: 10px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 11.5px; line-height: 1.55;">
                현재 설정된 아이 체중은 <strong>${wt}kg</strong>(하루 목표 <strong>${Math.round(derNum)} kcal</strong>), 주 사료는 <strong>[${dryName}]</strong>입니다.<br><br>
                • <strong>추천 황금 배합비:</strong> 처음 믹스피딩을 시작하신다면 <strong>주사료(건식) 70% : 보조사료(습식/화식) 30%</strong> 칼로리 비율이 변 상태 유지와 기호성·수분 보충 면에서 가장 안정적입니다.<br>
                • <strong>질환/처방식이 있는 경우:</strong> 신장·췌장·심장·결석 등 처방식을 급여 중이라면 일반 간식이나 고단백/고지방 캔 혼합 시 처방 효과가 희석될 수 있으므로 담당 수의사와 먼저 상의해 주세요.
            </div>
            <div style="display:flex; gap:6px; margin-top:8px;">
                <button type="button" onclick="goToCalculatorSection('guardian-step3')" style="flex:1; padding: 8px; border-radius: 10px; background: #059669; color: white; border: none; font-weight: 800; font-size: 11px; cursor: pointer;">🥣 STEP 3 비율 조절하기 ➔</button>
                <button type="button" onclick="goToCalculatorSection('guardian-step4')" style="flex:1; padding: 8px; border-radius: 10px; background: #0d9488; color: white; border: none; font-weight: 800; font-size: 11px; cursor: pointer;">🚦 STEP 4 급여표 확인 ➔</button>
            </div>
        `;
    }

    function parseFullVetChartNote(text) {
        const t = text.toLowerCase();
        const species = /(고양이|묘|코숏|러시안|페르시안|샴|렉돌|뱅갈|먼치킨|cat|feline)/i.test(text) ? "고양이" : "개";

        let breed = null;
        ["말티즈", "포메라니안", "푸들", "시츄", "치와와", "골든리트리버", "비숑", "닥스훈트", "요크셔테리어", "진돗개", "코숏", "러시안블루", "페르시안", "샴", "렉돌", "브리티쉬숏헤어"].forEach(b => {
            if (text.includes(b)) breed = b;
        });

        const grabNum = (re) => { const m = text.match(re); return m ? parseFloat(m[1]) : null; };
        const weight = grabNum(/([0-9]+(?:\.[0-9]+)?)\s*(?:kg|킬로)/i);
        const age = grabNum(/([0-9]+(?:\.[0-9]+)?)\s*(?:세|살|년령)/i);
        const bcs = grabNum(/bcs\s*[:：=]?\s*([1-9])/i);
        const fecal = grabNum(/(?:분변점수|변점수|fecal)\s*[:：=]?\s*([1-7](?:\.[05])?)/i) || (t.includes("설사") || t.includes("혈변") ? 6.0 : (t.includes("묽은") || t.includes("연변") ? 5.0 : null));

        let gender = null;
        if (text.includes("중성화")) {
            gender = /(암컷|여아|암)/.test(text) ? "암컷 (중성화 완료)" : "수컷 (중성화 완료)";
        } else if (/(수컷|남아)/.test(text)) {
            gender = "수컷 (중성화 안함)";
        } else if (/(암컷|여아)/.test(text)) {
            gender = "암컷 (중성화 안함)";
        }

        let mcs = null;
        if (text.includes("중증 근감소")) mcs = "중증 근감소 (Severe Loss)";
        else if (text.includes("중등도 근감소")) mcs = "중등도 근감소 (Moderate Loss)";
        else if (text.includes("경도 근감소") || text.includes("근감소")) mcs = "경도 근감소 (Mild Loss)";
        else if (text.includes("근육 정상")) mcs = "정상 (Normal)";

        const symptoms = [];
        if (/(구토|토함|vomit)/i.test(text)) symptoms.push("구토");
        if (/(설사|묽은\s*변|연변|diarrhea)/i.test(text)) symptoms.push("만성 설사");
        if (/(식욕부진|식욕저하|안\s*먹|절식|anorexia)/i.test(text)) symptoms.push("식욕부진");
        if (/(혈변|흑변|melena)/i.test(text)) symptoms.push("혈변");
        if (/(복부팽만|복통|배가\s*아파)/i.test(text)) symptoms.push("복부팽만/복부통증");

        const us_thickness = grabNum(/(?:장벽|두께)\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)\s*mm/i);
        const us_layering = text.includes("완전 소실") ? "완전 소실 (Loss of layering)" : (text.includes("경도 소실") || text.includes("층구조") ? "경도 소실 (Mild)" : null);
        const us_hyperechoic = text.includes("고에코") ? "미만성 고에코 (Hyperechoic speckles)" : null;

        const allergies = [];
        ["닭고기", "소고기", "양고기", "오리고기", "칠면조", "돼지고기", "연어", "흰살생선", "캥거루", "사슴고기", "계란", "유제품", "밀", "옥수수", "대두", "쌀", "감자", "고구마", "단호박", "완두콩", "당근", "사과", "바나나", "블루베리", "브로콜리", "양배추"].forEach(alg => {
            if (text.includes(alg)) allergies.push(alg);
        });

        const lab = {
            bun: grabNum(/bun\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)/i),
            cr: grabNum(/(?:crea|creatinine|cr)\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)/i),
            sdma: grabNum(/sdma\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)/i),
            p: grabNum(/(?:인|phosphorus|phos|\bp)\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)/i),
            alb: grabNum(/(?:알부민|albumin|alb)\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)/i),
            cpl: grabNum(/(?:cpl|fpl|lipase|리파아제)\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)/i),
            alt: grabNum(/(?:alt|gpt)\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)/i),
            k: grabNum(/(?:칼륨|potassium|\bk)\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)/i)
        };

        const diseases = [];
        const disRules = [
            { kw: /(심장|mmvd|dcm|hcm|심부전|심잡음)/i, id: "dis-heart", label: "심장병(MMVD/심부전)" },
            { kw: /(신부전|신장|ckd|iris)/i, id: "dis-ckd", label: "만성신부전(CKD)" },
            { kw: /(췌장염|pancreatitis|cpl\s*[2-9]\d\d)/i, id: "dis-pancreas", label: "췌장염" },
            { kw: /(ibd|장염|장병증|ple|단백소실)/i, id: "dis-ibd", label: "장질환(IBD/PLE)" },
            { kw: /(간질환|간부전|간수치|간염)/i, id: "dis-liver", label: "간질환/간부전" },
            { kw: /(담낭|점액종|담석|담도)/i, id: "dis-gallbladder", label: "담낭질환" },
            { kw: /(당뇨|diabetes)/i, id: "dis-diabetes", label: "당뇨병" },
            { kw: /(쿠싱|부신피질기능항진)/i, id: "dis-cushing", label: "쿠싱증후군" },
            { kw: /(결석|스트루바이트|옥살레이트)/i, id: "dis-stones", label: "비뇨기결석" },
            { kw: /(관절염|슬개골|djd)/i, id: "dis-oa", label: "관절염" },
            { kw: /(치매|인지장애|cds|뇌전증|발작)/i, id: "dis-brain", label: "인지장애/신경계" },
            { kw: /(기관허탈|천식|기관지염|호흡기)/i, id: "dis-resp", label: "호흡기질환" },
            { kw: /(종양|암|림프종)/i, id: "dis-tumor", label: "종양/암" },
            { kw: /(비만|과체중)/i, id: "dis-obesity", label: "비만/체중관리" },
            { kw: /(갑상선기능저하|갑상선저하)/i, id: "dis-hypothyroid", label: "갑상선기능저하증" },
            { kw: /(에디슨|부신피질기능저하)/i, id: "dis-addison", label: "에디슨병" },
            { kw: /(외이염|아토피|피부알러지)/i, id: "dis-otitis", label: "외이염/피부알러지" },
            { kw: /(디스크|ivdd)/i, id: "dis-disc", label: "디스크(IVDD)" },
            { kw: /(갑상선기능항진|갑상선항진)/i, id: "dis-hyperthyroid", label: "갑상선기능항진증(묘)" },
            { kw: /(3복합염|triaditis)/i, id: "dis-cat-triaditis", label: "3복합염(Triaditis)" },
            { kw: /(지방간|lipidosis)/i, id: "dis-cat-lipidosis", label: "고양이 지방간" },
            { kw: /(방광염|fic|flutd)/i, id: "dis-cat-fic", label: "특발성방광염(FIC)" },
            { kw: /(전염성복막염|fip)/i, id: "dis-cat-fip", label: "고양이 복막염(FIP)" },
            { kw: /(구내염|fcgs|forl)/i, id: "dis-cat-fcgs", label: "고양이 구내염(FCGS)" },
            { kw: /(거대결장|변비|megacolon)/i, id: "dis-cat-megacolon", label: "거대결장/만성변비" },
            { kw: /(고혈압|hypertension)/i, id: "dis-cat-htn", label: "고혈압" }
        ];

        const matchedDisIds = [];
        disRules.forEach(r => {
            if (r.kw.test(text)) {
                diseases.push(r.label);
                matchedDisIds.push(r.id);
            }
        });

        return {
            species, breed, weight, age, gender, bcs, mcs, fecal,
            symptoms, us_thickness, us_layering, us_hyperechoic,
            allergies, lab, diseases, matchedDisIds
        };
    }

    function applyFullVetChartToCalculator(p) {
        let counts = { patient: 0, diseases: 0, lab: 0, symptoms: 0 };

        const setEl = (id, val) => { const el = document.getElementById(id); if (el && val != null) { el.value = val; counts.patient++; } };
        if (p.species) {
            setEl("patient-species", p.species);
            if (typeof window.onSpeciesChange === "function") window.onSpeciesChange();
        }
        setEl("patient-breed", p.breed);
        setEl("patient-weight", p.weight);
        setEl("patient-age", p.age);
        setEl("patient-gender", p.gender);
        if (p.bcs != null) {
            setEl("patient-bcs", p.bcs);
            if (typeof window.onBcsChange === "function") window.onBcsChange(p.bcs);
        }
        if (p.fecal != null) {
            setEl("patient-fecal", p.fecal);
            if (typeof window.onFecalChange === "function") window.onFecalChange(p.fecal);
        }
        if (p.mcs) {
            document.querySelectorAll('input[name="mcs"]').forEach(r => {
                if (r.value === p.mcs) { r.checked = true; counts.patient++; }
            });
        }

        if (p.matchedDisIds.length > 0) {
            document.querySelectorAll('input[name="disease"]').forEach(cb => { cb.checked = false; });
            p.matchedDisIds.forEach(id => {
                const cb = document.getElementById(id);
                if (cb) { cb.checked = true; counts.diseases++; }
            });
        }

        if (p.symptoms.length > 0) {
            document.querySelectorAll('input[name="acute-sx"]').forEach(cb => {
                if (p.symptoms.some(s => cb.value.includes(s.split('/')[0]))) {
                    cb.checked = true;
                    counts.symptoms++;
                }
            });
        }

        setEl("us-thickness", p.us_thickness);
        setEl("us-layering", p.us_layering);
        setEl("us-hyperechoic", p.us_hyperechoic);

        if (p.allergies.length > 0) {
            document.querySelectorAll('input[name="allergy"]').forEach(cb => {
                if (p.allergies.includes(cb.value)) { cb.checked = true; counts.patient++; }
            });
        }

        const setLab = (id, val) => { const el = document.getElementById(id); if (el && val != null) { el.value = val; counts.lab++; } };
        setLab("lab-bun", p.lab.bun);
        setLab("lab-cr", p.lab.cr);
        setLab("lab-sdma", p.lab.sdma);
        setLab("lab-p", p.lab.p);
        setLab("lab-alb", p.lab.alb);
        setLab("lab-cpl", p.lab.cpl);
        setLab("lab-alt", p.lab.alt);
        setLab("lab-k", p.lab.k);

        if (typeof window.runRecommendation === "function") window.runRecommendation(false);
        if (typeof window.syncGutCdssFromCurrentTabs === "function") window.syncGutCdssFromCurrentTabs(true);
        if (typeof window.runGutEnvironmentCDSS === "function") window.runGutEnvironmentCDSS();

        return counts;
    }

    function formatLabSummary(lab) {
        const items = [];
        if (lab.bun != null) items.push(`BUN ${lab.bun}`);
        if (lab.cr != null) items.push(`Cr ${lab.cr}`);
        if (lab.sdma != null) items.push(`SDMA ${lab.sdma}`);
        if (lab.p != null) items.push(`P ${lab.p}`);
        if (lab.alb != null) items.push(`Alb ${lab.alb}`);
        if (lab.cpl != null) items.push(`cPL ${lab.cpl}`);
        if (lab.alt != null) items.push(`ALT ${lab.alt}`);
        if (lab.k != null) items.push(`K ${lab.k}`);
        return items.length > 0 ? items.join(" · ") : "입력 없음";
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAiAgent);
    } else {
        initAiAgent();
    }
})();
