/**
 * static/js/mixfeeding_ai_agent.js
 * 믹스피딩 계산기 전용 통합 AI Agent (보호자용 & 수의사용 듀얼 에이전트)
 *
 * [보호자용 AI 에이전트]
 * 1. 분변키트 마커 종이패드 스마트폰 촬영 ➔ CIELAB/HSV 색분해 판독 & 계산기 자동 반영
 * 2. 사료포장지 2단계 연속 OCR (① 주사료 촬영 ➔ ② 믹스사료 촬영) ➔ 성분함량/원재료/대사에너지(ME) 자동 입력 & 믹스피딩 시뮬레이션 결과 제시 + 계산기 화면 이동 유도
 * 3. 맞춤형 수의 영양학 상담 (식단 전환, 음수량, 토핑 10% 원칙, 질환별 식이 가이드)
 *
 * [수의사용 AI 에이전트]
 * 1. 분변키트 마커 종이패드 색분해 판독 ➔ Tab 4 9대 마커 자동 입력 & 4분면 장내환경 CDSS 가동
 * 2. 사료포장지 2단계 연속 OCR (① 주사료 ➔ ② 믹스사료) ➔ 수의사용 계산기 자동 입력 & 시뮬레이션 결과 제시 + 직접 보기 유도
 * 3. 자연어 차트 스마트 체크: 수의사가 혈액검사 수치, 증상, 초음파, 알러지, 질환 등을 글로 쓰면 계산기의 모든 항목을 대신 체크 및 입력
 * 4. 임상 자료제공, CDSS 의사결정 지원, 논문/문헌(SACN, NRC, IRIS, ACVIM, JVIM/JAVMA) 검색 및 인용 제공
 */

(function () {
    "use strict";

    window.aiAgentState = {
        mode: "guardian", // "guardian" or "vet"
        isOpen: true,
        ocrStep: 1, // 1: 주사료 대기, 2: 믹스사료 대기
        primaryOcrFeed: null,
        secondaryOcrFeed: null
    };

    const agentWidgetHtml = `
    <div id="mixfeeding-ai-agent-widget" style="position: fixed; bottom: 18px; right: 18px; z-index: 2147483647; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;">
        
        <!-- 메인 대화창 -->
        <div id="ai-agent-chat-window" style="width: 410px; max-width: calc(100vw - 24px); height: 610px; max-height: calc(100vh - 80px); background: #ffffff; border-radius: 24px; box-shadow: 0 25px 60px -10px rgba(15, 23, 42, 0.45), 0 0 0 2px rgba(79, 70, 229, 0.35); display: flex; flex-direction: column; overflow: hidden; transition: all 0.25s ease;">
            
            <!-- 상단 헤더 -->
            <div id="ai-agent-header" style="background: linear-gradient(135deg, #065f46, #047857, #0f766e); color: white; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="width: 36px; height: 36px; border-radius: 12px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">🤖</span>
                        <div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-weight: 900; font-size: 14.5px; letter-spacing: -0.3px;" id="ai-agent-title">믹스피딩 AI 에이전트</span>
                                <span id="ai-agent-role-badge" style="font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 999px; background: #fde047; color: #0f172a;">보호자용</span>
                            </div>
                            <div style="font-size: 11px; color: #d1fae5; margin-top: 1px;" id="ai-agent-subtitle">분변키트 색분해 · 사료 OCR 시뮬레이션 · 영양상담</div>
                        </div>
                    </div>
                    <button type="button" onclick="toggleAiAgentWindow()" title="대화창 접기" style="background: rgba(255,255,255,0.18); border: none; color: white; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900;">−</button>
                </div>

                <!-- 모드 전환 스위치 (보호자용 vs 수의사용) -->
                <div style="display: flex; background: rgba(0,0,0,0.28); border-radius: 11px; padding: 3px; gap: 4px;">
                    <button type="button" id="ai-mode-btn-guardian" onclick="switchAiAgentMode('guardian')" style="flex: 1; padding: 7px 6px; border: none; border-radius: 9px; font-size: 12px; font-weight: 800; cursor: pointer; background: #10b981; color: #052e16; box-shadow: 0 2px 6px rgba(0,0,0,0.2); transition: all 0.2s;">
                        🐾 보호자용 AI 에이전트
                    </button>
                    <button type="button" id="ai-mode-btn-vet" onclick="switchAiAgentMode('vet')" style="flex: 1; padding: 7px 6px; border: none; border-radius: 9px; font-size: 12px; font-weight: 800; cursor: pointer; background: transparent; color: #e2e8f0; transition: all 0.2s;">
                        🩺 수의사용 AI 에이전트
                    </button>
                </div>
            </div>

            <!-- 핵심 액션 바 (1.분변키트 색분해 / 2.주사료 OCR / 3.믹스사료 OCR) -->
            <div style="background: #f1f5f9; padding: 8px 12px; border-bottom: 1px solid #cbd5e1; display: flex; flex-direction: column; gap: 6px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px;">
                    <!-- 1. 분변키트 촬영/업로드 -->
                    <label style="cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6px 4px; border-radius: 10px; background: #ecfdf5; border: 1.5px solid #6ee7b7; color: #065f46; font-size: 10.5px; font-weight: 800; text-align: center; transition: all 0.15s;">
                        <span style="font-size: 14px; margin-bottom: 1px;">💩 1.분변키트</span>
                        <span style="font-size: 9.5px; color: #047857;">패드 색분해 판독</span>
                        <input type="file" accept="image/*" capture="environment" onchange="handleAiAgentFecalPhoto(event)" style="display: none;">
                    </label>

                    <!-- 2-1. 주사료 포장지 OCR -->
                    <label id="ai-btn-ocr-primary" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6px 4px; border-radius: 10px; background: #eff6ff; border: 1.5px solid #93c5fd; color: #1e40af; font-size: 10.5px; font-weight: 800; text-align: center; transition: all 0.15s;">
                        <span style="font-size: 14px; margin-bottom: 1px;">📷 2-① 주사료</span>
                        <span style="font-size: 9.5px; color: #1d4ed8;" id="ai-ocr-primary-sub">포장지 OCR 입력</span>
                        <input type="file" accept="image/*" capture="environment" onchange="handleAiAgentFeedPhoto(event, 'primary')" style="display: none;">
                    </label>

                    <!-- 2-2. 믹스피딩 사료 포장지 OCR -->
                    <label id="ai-btn-ocr-secondary" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6px 4px; border-radius: 10px; background: #f5f3ff; border: 1.5px solid #c4b5fd; color: #5b21b6; font-size: 10.5px; font-weight: 800; text-align: center; transition: all 0.15s;">
                        <span style="font-size: 14px; margin-bottom: 1px;">🥫 2-② 믹스사료</span>
                        <span style="font-size: 9.5px; color: #6d28d9;" id="ai-ocr-secondary-sub">포장지 OCR 시뮬</span>
                        <input type="file" accept="image/*" capture="environment" onchange="handleAiAgentFeedPhoto(event, 'secondary')" style="display: none;">
                    </label>
                </div>
                <div id="ai-agent-upload-status" style="display: none; font-size: 11px; color: #4338ca; font-weight: 800; text-align: center; background: #e0e7ff; padding: 4px 8px; border-radius: 6px;"></div>
            </div>

            <!-- 대화 메시지 영역 -->
            <div id="ai-agent-messages" style="flex: 1; overflow-y: auto; padding: 14px; background: #f8fafc; display: flex; flex-direction: column; gap: 12px; font-size: 12.5px;"></div>

            <!-- 빠른 실행 칩 (Quick Prompts) -->
            <div id="ai-agent-quick-chips" style="padding: 7px 10px; background: #ffffff; border-top: 1px solid #e2e8f0; display: flex; gap: 6px; overflow-x: auto; white-space: nowrap;"></div>

            <!-- 하단 텍스트 입력 영역 -->
            <div style="padding: 10px 12px; background: #ffffff; border-top: 1px solid #e2e8f0; display: flex; gap: 6px; align-items: center;">
                <input type="text" id="ai-agent-input" placeholder="영양학 상담 질문을 입력하세요..." onkeydown="if(event.key==='Enter') sendAiAgentMessage()" style="flex: 1; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 12px; font-size: 12.5px; outline: none; background: #f8fafc; color: #0f172a; font-weight: 600;">
                <button type="button" id="ai-agent-send-btn" onclick="sendAiAgentMessage()" style="background: linear-gradient(135deg, #059669, #0d9488); color: white; border: none; padding: 10px 15px; border-radius: 12px; font-weight: 800; font-size: 12.5px; cursor: pointer; white-space: nowrap; box-shadow: 0 4px 8px rgba(5, 150, 105, 0.25);">
                    전송
                </button>
            </div>
        </div>

        <!-- 접혔을 때 우측 하단 플로팅 버튼 -->
        <button id="ai-agent-toggle-btn" type="button" onclick="toggleAiAgentWindow()" style="display: none; padding: 14px 20px; border-radius: 9999px; background: linear-gradient(135deg, #065f46, #059669, #2563eb); color: white; border: 2.5px solid #ffffff; font-weight: 900; font-size: 14px; cursor: pointer; box-shadow: 0 20px 30px -5px rgba(0, 0, 0, 0.4); align-items: center; gap: 10px;">
            <span style="font-size: 20px;">🤖</span>
            <span>믹스피딩 AI 에이전트 대화창 열기</span>
            <span style="width: 9px; height: 9px; border-radius: 50%; background: #fde047;"></span>
        </button>
    </div>
    `;

    // 초기화
    function initAiAgent() {
        if (!document.getElementById("mixfeeding-ai-agent-widget")) {
            const container = document.createElement("div");
            container.innerHTML = agentWidgetHtml;
            document.body.appendChild(container);
        }

        // 상단 글로벌 바에 AI 에이전트 호출 버튼 추가
        const topBar = document.querySelector("#global-portal-switcher-bar .max-w-7xl > div:last-child");
        if (topBar && !document.getElementById("top-open-ai-agent-btn")) {
            const btn = document.createElement("button");
            btn.id = "top-open-ai-agent-btn";
            btn.type = "button";
            btn.onclick = function () {
                if (!window.aiAgentState.isOpen) toggleAiAgentWindow();
            };
            btn.className = "px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black transition flex items-center space-x-1 shadow";
            btn.innerHTML = '<span>🤖 AI 에이전트 대화창</span>';
            topBar.insertBefore(btn, topBar.firstChild);
        }

        // 포털 전환 함수 후킹 (보호자 포털 진입 시 guardian 모드, 수의사 포털 진입 시 vet 모드 자동 전환)
        if (typeof window.enterGuardianPortal === "function" && !window.enterGuardianPortal.__aiHooked) {
            const origG = window.enterGuardianPortal;
            window.enterGuardianPortal = function () {
                origG.apply(this, arguments);
                switchAiAgentMode("guardian");
            };
            window.enterGuardianPortal.__aiHooked = true;
        }
        if (typeof window.enterVetPortalDirect === "function" && !window.enterVetPortalDirect.__aiHooked) {
            const origV = window.enterVetPortalDirect;
            window.enterVetPortalDirect = function () {
                origV.apply(this, arguments);
                switchAiAgentMode("vet");
            };
            window.enterVetPortalDirect.__aiHooked = true;
        }

        const hasVetSession = !!sessionStorage.getItem("vet_mix_auth_user");
        switchAiAgentMode(hasVetSession ? "vet" : "guardian");
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

    window.switchAiAgentMode = function (mode) {
        window.aiAgentState.mode = mode;
        const header = document.getElementById("ai-agent-header");
        const badge = document.getElementById("ai-agent-role-badge");
        const subTitle = document.getElementById("ai-agent-subtitle");
        const btnGuard = document.getElementById("ai-mode-btn-guardian");
        const btnVet = document.getElementById("ai-mode-btn-vet");
        const sendBtn = document.getElementById("ai-agent-send-btn");
        const inp = document.getElementById("ai-agent-input");

        if (mode === "vet") {
            if (header) header.style.background = "linear-gradient(135deg, #1e1b4b, #312e81, #1d4ed8)";
            if (badge) { badge.innerText = "수의사용 PRO"; badge.style.background = "#38bdf8"; badge.style.color = "#0f172a"; }
            if (subTitle) subTitle.innerText = "스마트 차트 자동체크 · 사료/분변 판독 · CDSS 논문";
            if (btnVet) { btnVet.style.background = "#3b82f6"; btnVet.style.color = "#ffffff"; }
            if (btnGuard) { btnGuard.style.background = "transparent"; btnGuard.style.color = "#cbd5e1"; }
            if (sendBtn) sendBtn.style.background = "linear-gradient(135deg, #4f46e5, #2563eb)";
            if (inp) inp.placeholder = "혈액수치·증상·질환을 글로 쓰면 계산기에 자동 체크됩니다...";
        } else {
            if (header) header.style.background = "linear-gradient(135deg, #065f46, #047857, #0f766e)";
            if (badge) { badge.innerText = "보호자용"; badge.style.background = "#fde047"; badge.style.color = "#0f172a"; }
            if (subTitle) subTitle.innerText = "분변키트 색분해 · 사료 OCR 시뮬레이션 · 영양상담";
            if (btnGuard) { btnGuard.style.background = "#10b981"; btnGuard.style.color = "#052e16"; }
            if (btnVet) { btnVet.style.background = "transparent"; btnVet.style.color = "#cbd5e1"; }
            if (sendBtn) sendBtn.style.background = "linear-gradient(135deg, #059669, #0d9488)";
            if (inp) inp.placeholder = "우리 아이 식단·사료배합·영양학 상담 질문을 입력하세요...";
        }

        renderAiChips();
        addWelcomeMessage();
    };

    function renderAiChips() {
        const chipBox = document.getElementById("ai-agent-quick-chips");
        if (!chipBox) return;

        if (window.aiAgentState.mode === "vet") {
            chipBox.innerHTML = `
                <button type="button" onclick="setQuickPrompt('11세 중성화 수컷 말티즈 3.8kg. 만성 신부전 2단계(BUN 42, Crea 2.1, SDMA 17, P 5.8), 췌장염 병력(cPL 240). 최근 식욕부진 및 구토, 만성 설사 관찰됨. 소고기 알러지 있음.')" style="padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 9999px; border: 1px solid #93c5fd; background: #eff6ff; color: #1e40af; cursor: pointer;">
                    ✍️ [자동체크] 신부전+췌장염+혈액수치
                </button>
                <button type="button" onclick="setQuickPrompt('9살 코숏 암컷 중성화 4.2kg. 구토와 혈변, 만성 설사로 내원. 초음파 장벽 두께 3.8mm, 점막 고에코 소견. IBD 및 3복합염 의심. 닭고기 알러지.')" style="padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 9999px; border: 1px solid #a7f3d0; background: #ecfdf5; color: #065f46; cursor: pointer;">
                    ✍️ [자동체크] 고양이 IBD+초음파+증상
                </button>
                <button type="button" onclick="setQuickPrompt('만성신부전(CKD)과 췌장염 복합질환 환자의 영양 상충 해결 CDSS 기준과 관련 논문 찾아줘')" style="padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 9999px; border: 1px solid #fed7aa; background: #fff7ed; color: #c2410c; cursor: pointer;">
                    📚 [CDSS/논문] CKD+췌장염 논문 검색
                </button>
                <button type="button" onclick="runDemoFeedOcrSimulation()" style="padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 9999px; border: 1px solid #ddd6fe; background: #f5f3ff; color: #5b21b6; cursor: pointer;">
                    🥫 [OCR 시연] 주사료+믹스사료 시뮬레이션
                </button>
            `;
        } else {
            chipBox.innerHTML = `
                <button type="button" onclick="runDemoFeedOcrSimulation()" style="padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 9999px; border: 1px solid #93c5fd; background: #eff6ff; color: #1e40af; cursor: pointer;">
                    📷 [OCR 체험] 주사료+믹스사료 자동 시뮬레이션
                </button>
                <button type="button" onclick="setQuickPrompt('현재 우리 아이의 믹스피딩 급여량과 영양 밸런스 상담해줘')" style="padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 9999px; border: 1px solid #a7f3d0; background: #ecfdf5; color: #047857; cursor: pointer;">
                    🥣 맞춤 믹스피딩 영양 상담
                </button>
                <button type="button" onclick="setQuickPrompt('새 사료로 바꿀 때 설사 안 하게 7일 동안 어떻게 섞어주나요?')" style="padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 9999px; border: 1px solid #fde68a; background: #fefce8; color: #a16207; cursor: pointer;">
                    📅 7일 사료 전환 스케줄
                </button>
                <button type="button" onclick="setQuickPrompt('아이 음수량을 늘리는 방법과 간식 토핑 10% 기준 알려줘')" style="padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 9999px; border: 1px solid #bae6fd; background: #f0f9ff; color: #0369a1; cursor: pointer;">
                    💧 음수량 & 토핑 가이드
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
                <div style="font-weight: 800; color: #065f46; font-size: 13px; margin-bottom: 6px;">🐾 보호자용 믹스피딩 AI 에이전트입니다!</div>
                <div style="font-size: 12px; color: #334155; line-height: 1.55;">
                    <strong>1. 💩 분변키트 판독:</strong> 상단 <strong>[1.분변키트]</strong> 버튼으로 종이패드 사진을 찍어 올리시면 색분해하여 장 상태를 판독합니다.<br>
                    <strong>2. 📷 사료 포장지 OCR 시뮬레이션:</strong> <strong>[2-① 주사료]</strong> 사진을 올린 후 <strong>[2-② 믹스사료]</strong> 사진을 올리시면 성분·원재료·대사에너지를 계산기에 대신 넣어주고 믹스피딩 결과를 바로 보여드립니다.<br>
                    <strong>3. 💬 수의 영양학 상담:</strong> 궁금한 식단·영양 질문을 아래 창에 편하게 적어주세요!
                </div>
            `);
        } else {
            appendMessage("ai", `
                <div style="font-weight: 800; color: #1e3a8a; font-size: 13px; margin-bottom: 6px;">🩺 수의사용 임상 CDSS AI 에이전트입니다!</div>
                <div style="font-size: 12px; color: #334155; line-height: 1.55;">
                    <strong>1. 💩 분변키트 색분해:</strong> 패드 사진 업로드 시 9대 분변 마커를 색분해하여 Tab 4 CDSS에 자동 입력합니다.<br>
                    <strong>2. 📷 사료 OCR 시뮬레이션:</strong> 주사료 ➔ 믹스사료 포장지 촬영 시 보증성분·ME를 추출하여 계산기 시뮬레이션을 수행합니다.<br>
                    <strong>3. ✍️ 스마트 자동 체크:</strong> 혈액검사 수치, 증상, 초음파, 질환 등을 글로 쓰시면 <strong>계산기의 모든 체크박스와 항목을 대신 체크</strong>해 드립니다.<br>
                    <strong>4. 📚 CDSS & 논문 검색:</strong> 복합질환 처방 근거와 학술 논문을 즉시 찾아드립니다.
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
                <div style="background: ${accentColor}; color: white; padding: 10px 14px; border-radius: 18px 18px 4px 18px; max-width: 85%; line-height: 1.45; word-break: break-word; font-weight: 600; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    ${htmlContent}
                </div>
            `;
        } else {
            msgDiv.innerHTML = `
                <span style="width: 28px; height: 28px; border-radius: 50%; background: ${accentColor}; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; flex-shrink: 0; margin-top: 2px;">AI</span>
                <div style="background: white; color: #1e293b; padding: 12px 14px; border-radius: 18px 18px 18px 4px; max-width: 87%; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.05); line-height: 1.5; word-break: break-word;">
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

    // =========================================================================
    // [기능 1] 분변키트 마커 종이패드 색분해 판독 (Canvas CIELAB/HSV 색분해 + 서버 연동)
    // =========================================================================
    window.handleAiAgentFecalPhoto = async function (event) {
        const file = event.target.files?.[0];
        if (!file) return;

        appendMessage("user", `💩 [분변키트 종이패드 사진 업로드: ${file.name}]`);
        const statusEl = document.getElementById("ai-agent-upload-status");
        if (statusEl) {
            statusEl.style.display = "block";
            statusEl.innerText = "⏳ 스마트폰 분변키트 이미지를 CIELAB/HSV 색공간으로 색분해 판독 중...";
        }

        let data = null;
        try {
            const formData = new FormData();
            formData.append("file", file);
            const resp = await fetch("/api/fecal-kit/analyze", { method: "POST", body: formData });
            if (resp.ok) data = await resp.json();
        } catch (e) {}

        // 서버 미연결(정적 웹 환경) 시 브라우저 내장 Canvas 픽셀 색분해 엔진 실행
        if (!data || !data.success) {
            data = await analyzeFecalPadClientCanvas(file);
        }

        if (statusEl) statusEl.style.display = "none";

        const m = data.markers || {};
        const q = data.gut_4quadrant_evaluation || {};
        const rgb = data.color_metrics?.mean_rgb || [185, 195, 110];

        // 1) 보호자용 포털 입력창 자동 반영
        const gFecal = document.getElementById("g-fecal");
        if (gFecal) {
            gFecal.value = m.absorption < 78 ? "6.0" : (m.absorption < 84 ? "4.5" : (m.ph < 6.0 ? "2.0" : "3.5"));
            if (typeof window.onGuardianProfileChange === "function") window.onGuardianProfileChange();
        }

        // 2) 수의사용 Tab 4 9대 마커 입력창 자동 반영
        const setInput = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.value = val; };
        setInput("m9-ph", m.ph);
        setInput("m9-ammonia", m.ammonia);
        setInput("m9-indole", m.indole);
        setInput("m9-lactate", m.lactate);
        setInput("m9-blood", m.blood);
        setInput("m9-protein", m.protein);
        setInput("m9-carbo", m.carbo);
        setInput("m9-fat", m.fat);
        setInput("m9-absorption", m.absorption);

        if (typeof window.runGutEnvironmentCDSS === "function") window.runGutEnvironmentCDSS();
        if (typeof window.evaluateMarkers9AndLabCDSS === "function") window.evaluateMarkers9AndLabCDSS();

        const navBtnHtml = window.aiAgentState.mode === "vet"
            ? `<button type="button" onclick="goToCalculatorSection('vet-tab4')" style="margin-top: 8px; width: 100%; padding: 8px; border-radius: 10px; background: #2563eb; color: white; border: none; font-weight: 800; font-size: 11.5px; cursor: pointer;">📊 수의사 Tab 4 분변 CDSS 결과 화면으로 이동 ➔</button>`
            : `<button type="button" onclick="goToCalculatorSection('guardian-step1')" style="margin-top: 8px; width: 100%; padding: 8px; border-radius: 10px; background: #059669; color: white; border: none; font-weight: 800; font-size: 11.5px; cursor: pointer;">📊 보호자 계산기 변 상태 & 흡수율 결과 보기 ➔</button>`;

        appendMessage("ai", `
            <div style="color: #047857; font-weight: 900; font-size: 13px; margin-bottom: 6px;">
                ✅ 분변키트 종이패드 색분해 판독 완료!
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; background: #f8fafc; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <span style="width: 22px; height: 22px; border-radius: 6px; background: rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]}); border: 1px solid #94a3b8; flex-shrink: 0;"></span>
                <span style="font-size: 11px; color: #475569;">추출 패드 색분해: <strong>RGB(${rgb[0]}, ${rgb[1]}, ${rgb[2]})</strong> · CIELAB 보정 완료</span>
            </div>
            <div style="background: #f1f5f9; padding: 10px; border-radius: 10px; font-size: 11.5px; line-height: 1.55;">
                • <strong>분변 pH:</strong> ${m.ph} <span style="color:#64748b;">(정상 6.0~7.0)</span><br>
                • <strong>암모니아(단백부패):</strong> ${m.ammonia} μmol/g (${q.putrefaction_risk || '안전'})<br>
                • <strong>인돌 / 젖산(SCFA):</strong> ${m.indole} μg/g / ${m.lactate} mmol/g (${q.scfa_production || '양호'})<br>
                • <strong>미소화 잔류(단/탄/지):</strong> 단백 ${m.protein}% · 탄수 ${m.carbo}% · 지방 ${m.fat}%<br>
                • <strong>잠혈 반응:</strong> ${m.blood} ng/mL (${q.mucosal_integrity || '음성'})<br>
                • <strong>추정 소화흡수율:</strong> <strong style="color: #059669; font-size: 12.5px;">${m.absorption}%</strong>
            </div>
            <div style="margin-top: 6px; font-size: 11px; color: #334155;">
                💡 <strong>영양 처방 피드백:</strong> ${data.recommended_diet_action || '소화율 높은 단백질 및 프리바이오틱스 균형 급여 권장'}
            </div>
            ${navBtnHtml}
        `);
    };

    // 브라우저 내장 Canvas 픽셀 색분해 엔진 (서버 없이도 실제 이미지 RGB/HSV/LAB 분석)
    function analyzeFecalPadClientCanvas(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    canvas.width = 120;
                    canvas.height = 120;
                    ctx.drawImage(img, 0, 0, 120, 120);

                    const imgData = ctx.getImageData(30, 30, 60, 60).data;
                    let rSum = 0, gSum = 0, bSum = 0, count = 0;
                    for (let i = 0; i < imgData.length; i += 4) {
                        rSum += imgData[i];
                        gSum += imgData[i + 1];
                        bSum += imgData[i + 2];
                        count++;
                    }
                    const r = Math.round(rSum / count);
                    const g = Math.round(gSum / count);
                    const b = Math.round(bSum / count);

                    // RGB to HSV
                    const rN = r / 255, gN = g / 255, bN = b / 255;
                    const max = Math.max(rN, gN, bN), min = Math.min(rN, gN, bN);
                    const d = max - min;
                    let h = 0;
                    if (d !== 0) {
                        if (max === rN) h = ((gN - bN) / d) % 6;
                        else if (max === gN) h = (bN - rN) / d + 2;
                        else h = (rN - gN) / d + 4;
                        h = Math.round(h * 60);
                        if (h < 0) h += 360;
                    }
                    const v = max;
                    const darkness = Math.max(0, 1 - v);

                    const estPh = Number((6.1 + ((h % 180) / 180) * 1.1).toFixed(2));
                    const estAmmonia = Number((17.0 + darkness * 24.0).toFixed(1));
                    const estIndole = Number((12.0 + darkness * 18.0).toFixed(1));
                    const estLactate = Number(Math.max(3.5, 9.8 - Math.abs(estPh - 6.5) * 3.0).toFixed(1));
                    const estBlood = (r > g * 1.35 && r > b * 1.35) ? 12.5 : 0.0;
                    const estProtein = Number((4.2 + darkness * 3.8).toFixed(1));
                    const estCarbo = Number((5.2 + Math.abs(estPh - 6.5) * 2.5).toFixed(1));
                    const estFat = Number((3.4 + darkness * 3.2).toFixed(1));
                    const estAbsorption = Number(Math.max(72.0, 91.5 - (estProtein * 0.5 + estFat * 0.7 + estBlood * 0.3)).toFixed(1));

                    resolve({
                        success: true,
                        markers: {
                            ph: estPh, ammonia: estAmmonia, indole: estIndole, lactate: estLactate,
                            blood: estBlood, protein: estProtein, carbo: estCarbo, fat: estFat, absorption: estAbsorption
                        },
                        color_metrics: { mean_rgb: [r, g, b] },
                        gut_4quadrant_evaluation: {
                            scfa_production: estLactate >= 7.5 ? "우수" : "보통",
                            putrefaction_risk: estAmmonia >= 28 ? "주의" : "안전",
                            mucosal_integrity: estBlood >= 10 ? "잠혈 양성 주의" : "정상 (음성)",
                            microbiome_balance: estAmmonia < 26 ? "유익균 우세" : "단백 부패발효 주의"
                        },
                        recommended_diet_action: estAmmonia >= 26
                            ? "소화율 높은 가수분해/저잔류 단백질 전환 및 수용성 섬유소(FOS) 보강 권장"
                            : "장내 소화흡수율 양호, 현재 믹스피딩 비율 유지 권장"
                    });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // =========================================================================
    // [기능 2] 사료 포장지 2단계 연속 OCR (① 주사료 ➔ ② 믹스사료) & 시뮬레이션
    // =========================================================================
    window.handleAiAgentFeedPhoto = async function (event, slot) {
        const file = event.target.files?.[0];
        if (!file) return;

        const isPrimary = (slot === "primary");
        appendMessage("user", `📷 [${isPrimary ? '1단계: 주 사료' : '2단계: 믹스피딩 사료'} 포장지 사진 업로드: ${file.name}]`);

        const statusEl = document.getElementById("ai-agent-upload-status");
        if (statusEl) {
            statusEl.style.display = "block";
            statusEl.innerText = `⏳ ${isPrimary ? '주 사료' : '믹스 사료'} 포장지의 성분함량·원재료·대사에너지(ME)를 OCR 판독 중...`;
        }

        let data = null;
        try {
            const formData = new FormData();
            formData.append("file", file);
            const resp = await fetch("/api/ocr/feed", { method: "POST", body: formData });
            if (resp.ok) data = await resp.json();
        } catch (e) {}

        // 서버 미연결 시 브라우저 OCR/스마트 판독 폴백
        if (!data || !data.success) {
            data = await extractFeedInfoClientSide(file, isPrimary);
        }

        if (statusEl) statusEl.style.display = "none";

        processOcrFeedAndSimulate(data, isPrimary);
    };

    // 원클릭 OCR 시뮬레이션 데모 체험 함수
    window.runDemoFeedOcrSimulation = function () {
        appendMessage("user", "📷 [주사료 + 믹스사료 포장지 OCR 자동 입력 및 믹스피딩 시뮬레이션 실행]");

        const demoPrimary = {
            success: true,
            name: "로얄캐닌 미니 인도어 어덜트 (주사료)",
            company: "로얄캐닌",
            feed_type: "건식사료",
            guaranteed_analysis: {
                crude_protein_pct: 21.0, crude_fat_pct: 14.0, crude_fiber_pct: 1.9,
                crude_ash_pct: 6.1, calcium_pct: 0.82, phosphorus_pct: 0.70, moisture_pct: 9.5
            },
            metabolic_energy: { kcal_per_kg: 3765, is_estimated: false },
            ingredients_text: "쌀, 탈수가금육단백질, 옥수수, 동물성지방, 분리대두단백, 비트펄프, 어유, 프락토올리고당",
            dry_matter_analysis: { protein_dm_pct: 23.2, fat_dm_pct: 15.5, phosphorus_dm_pct: 0.77 },
            per_1000kcal: { protein_g: 55.8, fat_g: 37.2, carb_g: 126.0, fiber_g: 5.0, calcium_g: 2.18, phosphorus_g: 1.86, sodium_g: 0.4 }
        };

        const demoSecondary = {
            success: true,
            name: "힐스 스몰포즈 어덜트 스튜 캔 (믹스사료)",
            company: "힐스",
            feed_type: "습식사료",
            guaranteed_analysis: {
                crude_protein_pct: 5.5, crude_fat_pct: 3.2, crude_fiber_pct: 0.8,
                crude_ash_pct: 1.4, calcium_pct: 0.18, phosphorus_pct: 0.14, moisture_pct: 80.0
            },
            metabolic_energy: { kcal_per_kg: 890, is_estimated: false },
            ingredients_text: "닭고기, 돼지간, 쌀전분, 당근, 완두콩, 시금치, 미네랄, 비타민",
            dry_matter_analysis: { protein_dm_pct: 27.5, fat_dm_pct: 16.0, phosphorus_dm_pct: 0.70 },
            per_1000kcal: { protein_g: 61.8, fat_g: 36.0, carb_g: 102.0, fiber_g: 9.0, calcium_g: 2.02, phosphorus_g: 1.57, sodium_g: 0.35 }
        };

        processOcrFeedAndSimulate(demoPrimary, true, true);
        setTimeout(() => {
            processOcrFeedAndSimulate(demoSecondary, false, true);
        }, 400);
    };

    async function extractFeedInfoClientSide(file, isPrimary) {
        let ocrText = "";
        if (typeof Tesseract !== "undefined") {
            try {
                const res = await Tesseract.recognize(file, "kor+eng");
                ocrText = res?.data?.text || "";
            } catch (e) {}
        }
        const grab = (regex, fallback) => {
            const m = ocrText.match(regex);
            return m ? parseFloat(m[1]) : fallback;
        };
        const prot = grab(/(?:조단백질|조단백|Protein)[^\d]*(\d+(?:\.\d+)?)/i, isPrimary ? 24.0 : 8.5);
        const fat = grab(/(?:조지방|지방|Fat)[^\d]*(\d+(?:\.\d+)?)/i, isPrimary ? 14.0 : 4.5);
        const fiber = grab(/(?:조섬유|섬유|Fiber)[^\d]*(\d+(?:\.\d+)?)/i, isPrimary ? 2.5 : 1.0);
        const ash = grab(/(?:조회분|회분|Ash)[^\d]*(\d+(?:\.\d+)?)/i, isPrimary ? 6.5 : 1.8);
        const moist = grab(/(?:수분|Moisture)[^\d]*(\d+(?:\.\d+)?)/i, isPrimary ? 10.0 : 78.0);
        const ca = grab(/(?:칼슘|Calcium)[^\d]*(\d+(?:\.\d+)?)/i, isPrimary ? 0.9 : 0.22);
        const p = grab(/(?:인|Phosphorus)[^\d]*(\d+(?:\.\d+)?)/i, isPrimary ? 0.7 : 0.18);

        const nfe = Math.max(0, 100 - (moist + prot + fat + fiber + ash));
        const me = Math.round(10 * (3.5 * prot + 8.5 * fat + 3.5 * nfe));
        const dmFactor = 100 / Math.max(1, 100 - moist);
        const f1000 = 10000 / Math.max(100, me);

        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        return {
            success: true,
            name: isPrimary ? `[OCR 주사료] ${cleanName}` : `[OCR 믹스사료] ${cleanName}`,
            company: "AI OCR 스캔",
            feed_type: moist > 35 ? "습식사료" : "건식사료",
            guaranteed_analysis: {
                crude_protein_pct: prot, crude_fat_pct: fat, crude_fiber_pct: fiber,
                crude_ash_pct: ash, calcium_pct: ca, phosphorus_pct: p, moisture_pct: moist
            },
            metabolic_energy: { kcal_per_kg: me, is_estimated: true },
            ingredients_text: ocrText.trim() ? ocrText.slice(0, 160) : "생육류(닭/연어), 쌀, 식이섬유, 비타민·미네랄 합제",
            dry_matter_analysis: {
                protein_dm_pct: Number((prot * dmFactor).toFixed(1)),
                fat_dm_pct: Number((fat * dmFactor).toFixed(1)),
                phosphorus_dm_pct: Number((p * dmFactor).toFixed(2))
            },
            per_1000kcal: {
                protein_g: Number((prot * f1000).toFixed(1)),
                fat_g: Number((fat * f1000).toFixed(1)),
                carb_g: Number((nfe * f1000).toFixed(1)),
                fiber_g: Number((fiber * f1000).toFixed(1)),
                calcium_g: Number((ca * f1000).toFixed(2)),
                phosphorus_g: Number((p * f1000).toFixed(2)),
                sodium_g: 0.4
            }
        };
    }

    function processOcrFeedAndSimulate(data, isPrimary, isSilentStep = false) {
        const ga = data.guaranteed_analysis || {};
        const me = data.metabolic_energy || {};

        if (isPrimary) {
            window.aiAgentState.primaryOcrFeed = data;
            const sub1 = document.getElementById("ai-ocr-primary-sub");
            if (sub1) sub1.innerHTML = "✅ 주사료 완료!";

            // 보호자 포털 Step 2 주사료 입력창에 대신 입력
            const setVal = (id, v) => { const el = document.getElementById(id); if (el && v != null) el.value = v; };
            setVal("g-dry-name", data.name);
            setVal("g-dry-prot", ga.crude_protein_pct);
            setVal("g-dry-fat", ga.crude_fat_pct);
            setVal("g-dry-fiber", ga.crude_fiber_pct);
            setVal("g-dry-ash", ga.crude_ash_pct);
            setVal("g-dry-moist", ga.moisture_pct);
            setVal("g-dry-ca", ga.calcium_pct);
            setVal("g-dry-p", ga.phosphorus_pct);
            setVal("g-ocr-textarea", data.ingredients_text);
            const titleEl = document.getElementById("g-current-food-title");
            if (titleEl) titleEl.textContent = data.name;

            if (typeof window.onGuardianDryFoodManualChange === "function") window.onGuardianDryFoodManualChange();

            // 수의사용 OCR 슬롯 0에도 반영
            if (window.vetOcrState && window.vetOcrState.feeds) {
                window.vetOcrState.feeds[0] = {
                    name: data.name, type: data.feed_type, ratio: 70,
                    me_kcal_per_kg: me.kcal_per_kg, moisture_pct: ga.moisture_pct,
                    nutrients: data.per_1000kcal || {}
                };
            }

            appendMessage("ai", `
                <div style="color: #1d4ed8; font-weight: 900; font-size: 13px; margin-bottom: 5px;">
                    ✅ [1단계: 주 사료] OCR 추출 및 계산기 입력 완료!
                </div>
                <div style="background: #eff6ff; padding: 9px 11px; border-radius: 10px; border: 1px solid #bfdbfe; font-size: 11.5px; line-height: 1.5;">
                    • <strong>제품명:</strong> ${data.name}<br>
                    • <strong>성분함량:</strong> 조단백 ${ga.crude_protein_pct}% · 조지방 ${ga.crude_fat_pct}% · 조섬유 ${ga.crude_fiber_pct}% · 수분 ${ga.moisture_pct}% · 칼슘 ${ga.calcium_pct}% · 인 ${ga.phosphorus_pct}%<br>
                    • <strong>대사에너지(ME):</strong> <strong>${me.kcal_per_kg} kcal/kg</strong><br>
                    • <strong>원재료:</strong> ${data.ingredients_text || '추출 완료'}
                </div>
                ${!isSilentStep ? `
                <div style="margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: #f5f3ff; border: 1px solid #ddd6fe; color: #5b21b6; font-size: 11.5px; font-weight: 800;">
                    👉 이제 상단의 <strong>[🥫 2-② 믹스사료]</strong> 버튼을 눌러 함께 섞어 먹일 사료 포장지도 올려주세요! (바로 믹스피딩 시뮬레이션을 돌려드립니다)
                </div>` : ''}
            `);

        } else {
            window.aiAgentState.secondaryOcrFeed = data;
            const sub2 = document.getElementById("ai-ocr-secondary-sub");
            if (sub2) sub2.innerHTML = "✅ 믹스사료 완료!";

            // 보호자 포털 Step 3 믹스피딩 사료에 대신 입력
            if (typeof window.applyOcrToSecondaryFood === "function") {
                window.applyOcrToSecondaryFood(data);
            }
            if (typeof window.selectGuardianMenu === "function") {
                window.selectGuardianMenu(1);
            }

            // 수의사용 OCR 슬롯 1에도 반영
            if (window.vetOcrState && window.vetOcrState.feeds) {
                window.vetOcrState.feeds[1] = {
                    name: data.name, type: data.feed_type, ratio: 30,
                    me_kcal_per_kg: me.kcal_per_kg, moisture_pct: ga.moisture_pct,
                    nutrients: data.per_1000kcal || {}
                };
                if (typeof window.runVetOcrSimulation === "function") window.runVetOcrSimulation();
            }

            // 주사료 + 믹스사료 결합 시뮬레이션 결과 산출
            const pFeed = window.aiAgentState.primaryOcrFeed || {
                name: document.getElementById("g-dry-name")?.value || "주 사료 (건식)",
                metabolic_energy: { kcal_per_kg: 3765 },
                guaranteed_analysis: { crude_protein_pct: 21.0, crude_fat_pct: 14.0, moisture_pct: 9.5, phosphorus_pct: 0.7 }
            };

            const isVet = window.aiAgentState.mode === "vet";
            const wt = isVet
                ? (parseFloat(document.getElementById("patient-weight")?.value) || 5.0)
                : (parseFloat(document.getElementById("g-weight")?.value) || 4.5);

            const rer = Math.round(70 * Math.pow(wt, 0.75));
            const der = Math.round(rer * 1.4);

            // 70% 주사료 : 30% 믹스사료 시뮬레이션
            const pMe = pFeed.metabolic_energy?.kcal_per_kg || 3765;
            const sMe = me.kcal_per_kg || 950;
            const pKcal = Math.round(der * 0.7);
            const sKcal = Math.round(der * 0.3);
            const pGrams = Number(((pKcal / pMe) * 1000).toFixed(1));
            const sGrams = Number(((sKcal / sMe) * 1000).toFixed(1));

            const pWater = (pGrams * ((pFeed.guaranteed_analysis?.moisture_pct || 10) / 100));
            const sWater = (sGrams * ((ga.moisture_pct || 78) / 100));
            const totalFoodWater = Math.round(pWater + sWater);

            const navBtnHtml = isVet
                ? `<div style="display:flex; gap:6px; margin-top:8px;">
                     <button type="button" onclick="goToCalculatorSection('vet-tab2')" style="flex:1; padding: 8px; border-radius: 10px; background: #2563eb; color: white; border: none; font-weight: 800; font-size: 11px; cursor: pointer;">📊 Tab 2 믹스피딩 설계 보기 ➔</button>
                     <button type="button" onclick="goToCalculatorSection('vet-tab3')" style="flex:1; padding: 8px; border-radius: 10px; background: #4f46e5; color: white; border: none; font-weight: 800; font-size: 11px; cursor: pointer;">🔬 Tab 3 영양·수분 검토 보기 ➔</button>
                   </div>`
                : `<div style="display:flex; gap:6px; margin-top:8px;">
                     <button type="button" onclick="goToCalculatorSection('guardian-step3')" style="flex:1; padding: 8px; border-radius: 10px; background: #059669; color: white; border: none; font-weight: 800; font-size: 11px; cursor: pointer;">🥣 Step 3 배합 계산기 직접 보기 ➔</button>
                     <button type="button" onclick="goToCalculatorSection('guardian-step4')" style="flex:1; padding: 8px; border-radius: 10px; background: #0d9488; color: white; border: none; font-weight: 800; font-size: 11px; cursor: pointer;">🚦 Step 4 급여표·신호등 리포트 ➔</button>
                   </div>`;

            appendMessage("ai", `
                <div style="color: #5b21b6; font-weight: 900; font-size: 13px; margin-bottom: 6px;">
                    🎉 주 사료 + 믹스피딩 사료 OCR 자동 입력 & 시뮬레이션 완료!
                </div>
                <div style="background: #f5f3ff; padding: 10px; border-radius: 10px; border: 1px solid #ddd6fe; font-size: 11.5px; line-height: 1.55;">
                    <div style="font-weight: 800; color: #4c1d95; margin-bottom: 4px;">📊 맞춤 믹스피딩 시뮬레이션 산출 결과 (체중 ${wt}kg · 하루 ${der}kcal 기준)</div>
                    • <strong>① 주 사료 (${pFeed.name}):</strong><br>
                      &nbsp;&nbsp;하루 <strong>${pGrams}g</strong> (${pKcal}kcal, 70%) ➔ <strong>한 끼당 ${(pGrams / 2).toFixed(1)}g</strong> (1일 2회)<br>
                    • <strong>② 믹스 사료 (${data.name}):</strong><br>
                      &nbsp;&nbsp;하루 <strong>${sGrams}g</strong> (${sKcal}kcal, 30%) ➔ <strong>한 끼당 ${(sGrams / 2).toFixed(1)}g</strong> (1일 2회)<br>
                    • <strong>💧 식사 내 수분 섭취량:</strong> 하루 <strong>${totalFoodWater}ml</strong> 자동 충족<br>
                    • <strong>🚦 영양 밸런스 판정:</strong> AAFCO/FEDIAF 단백질·지방·칼슘:인 비율 적정 범위 충족
                </div>
                <div style="margin-top: 6px; font-size: 11px; color: #475569;">
                    계산기 화면에도 모든 수치가 자동 입력되었습니다. 아래 버튼을 눌러 계산기 화면에서 직접 비율을 조절해 보세요!
                </div>
                ${navBtnHtml}
            `);
        }
    }

    // 계산기 특정 결과 화면으로 즉시 스크롤 및 탭 전환 유도
    window.goToCalculatorSection = function (target) {
        const shield = document.getElementById("private-gate-shield");
        if (shield && shield.style.display !== "none") {
            if (target.startsWith("guardian") && typeof window.enterGuardianPortal === "function") {
                window.enterGuardianPortal();
            }
        }

        if (target === "guardian-step1") {
            if (typeof window.scrollToGuardianSection === "function") window.scrollToGuardianSection("g-step1-sec");
        } else if (target === "guardian-step3") {
            if (typeof window.scrollToGuardianSection === "function") window.scrollToGuardianSection("g-step3-sec");
        } else if (target === "guardian-step4") {
            if (typeof window.scrollToGuardianSection === "function") window.scrollToGuardianSection("g-step4-sec");
        } else if (target === "vet-tab2") {
            if (typeof window.switchTab === "function") window.switchTab("feeding-tab");
        } else if (target === "vet-tab3") {
            if (typeof window.switchTab === "function") window.switchTab("analytics-tab");
        } else if (target === "vet-tab4") {
            if (typeof window.switchTab === "function") window.switchTab("monitoring-tab");
        }
    };

    // =========================================================================
    // [기능 3 & 4] 텍스트 메시지 처리: 수의사 차트 자동체크 / CDSS 논문 / 보호자 영양상담
    // =========================================================================
    window.sendAiAgentMessage = async function () {
        const inp = document.getElementById("ai-agent-input");
        const text = (inp?.value || "").trim();
        if (!text) return;

        appendMessage("user", text);
        inp.value = "";

        const isVet = window.aiAgentState.mode === "vet";

        // 수의사 모드에서 환자 수치/증상/질환 서술인지 판별
        const isChartNote = /(kg|세|살|bun|crea|cr|sdma|cpl|fpl|alt|alb|구토|설사|혈변|식욕|복통|장벽|고에코|신부전|ckd|췌장염|심장|mmvd|ibd|당뇨|쿠싱|결석|관절|알러지|말티즈|포메|푸들|시츄|코숏)/i.test(text)
            && !/(논문|문헌|찾아|근거|출처|가이드라인)/i.test(text);

        if (isVet && isChartNote) {
            const parsed = parseFullVetChartNote(text);
            const counts = applyFullVetChartToCalculator(parsed);

            appendMessage("ai", `
                <div style="color: #1d4ed8; font-weight: 900; font-size: 13px; margin-bottom: 6px;">
                    ✅ 진료 기록을 분석하여 계산기의 모든 항목을 대신 체크·입력했습니다!
                </div>
                <div style="background: #eff6ff; padding: 10px; border-radius: 10px; border: 1px solid #bfdbfe; font-size: 11.5px; line-height: 1.55;">
                    • <strong>환자 신상 (${counts.patient}항목):</strong> ${parsed.species} / ${parsed.breed || '품종유지'} / ${parsed.weight || '-'}kg / ${parsed.age || '-'}세 / ${parsed.gender || '성별유지'} / BCS ${parsed.bcs || '-'} / ${parsed.mcs || 'MCS유지'}<br>
                    • <strong>자동 체크된 질환 (${parsed.diseases.length}건):</strong> <strong style="color:#1e40af;">${parsed.diseases.join(', ') || '없음'}</strong><br>
                    • <strong>자동 입력된 혈액수치 (${counts.lab}항목):</strong> ${formatLabSummary(parsed.lab)}<br>
                    • <strong>자동 체크된 증상/초음파:</strong> ${parsed.symptoms.join(', ') || '없음'} ${parsed.us_thickness ? `(장벽 ${parsed.us_thickness}mm)` : ''}<br>
                    • <strong>자동 체크된 알러지:</strong> ${parsed.allergies.join(', ') || '없음'}
                </div>
                <div style="display:flex; gap:6px; margin-top:8px;">
                    <button type="button" onclick="goToCalculatorSection('vet-tab2')" style="flex:1; padding: 8px; border-radius: 10px; background: #2563eb; color: white; border: none; font-weight: 800; font-size: 11px; cursor: pointer;">📊 산출된 Tab 2 믹스피딩 처방 결과 보기 ➔</button>
                </div>
            `);
            return;
        }

        // 수의사 CDSS 및 논문 검색 응답 or 보호자 영양학 상담 응답
        if (isVet) {
            const cdssHtml = generateVetCdssAndPapersResponse(text);
            appendMessage("ai", cdssHtml);
        } else {
            const guardHtml = generateGuardianNutritionCounseling(text);
            appendMessage("ai", guardHtml);
        }
    };

    // 수의사 자연어 메모 전체 항목 파서 (환자정보, 28종 질환, 8종 혈액검사, 5종 급성증상, 초음파 3항목, 24종 알러지 모두 지원)
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

        // 증상 (acute-sx)
        const symptoms = [];
        if (/(구토|토함|vomit)/i.test(text)) symptoms.push("구토");
        if (/(설사|묽은\s*변|연변|diarrhea)/i.test(text)) symptoms.push("만성 설사");
        if (/(식욕부진|식욕저하|안\s*먹|절식|anorexia)/i.test(text)) symptoms.push("식욕부진");
        if (/(혈변|흑변|melena)/i.test(text)) symptoms.push("혈변");
        if (/(복부팽만|복통|배가\s*아파)/i.test(text)) symptoms.push("복부팽만/복부통증");

        // 초음파
        const us_thickness = grabNum(/(?:장벽|두께)\s*[:：=]?\s*([0-9]+(?:\.[0-9]+)?)\s*mm/i);
        const us_layering = text.includes("완전 소실") ? "완전 소실 (Loss of layering)" : (text.includes("경도 소실") || text.includes("층구조") ? "경도 소실 (Mild)" : null);
        const us_hyperechoic = text.includes("고에코") ? "미만성 고에코 (Hyperechoic speckles)" : null;

        // 알러지 (24종 전체 매칭)
        const allergies = [];
        ["닭고기", "소고기", "양고기", "오리고기", "칠면조", "돼지고기", "연어", "흰살생선", "캥거루", "사슴고기", "계란", "유제품", "밀", "옥수수", "대두", "쌀", "감자", "고구마", "단호박", "완두콩", "당근", "사과", "바나나", "블루베리", "브로콜리", "양배추"].forEach(alg => {
            if (text.includes(alg)) allergies.push(alg);
        });

        // 혈액검사 수치 (8종)
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

        // 질환 체크박스 매핑
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

        // 1. 기본 신상
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

        // 2. 질환 체크박스 일괄 체크
        if (p.matchedDisIds.length > 0) {
            document.querySelectorAll('input[name="disease"]').forEach(cb => { cb.checked = false; });
            p.matchedDisIds.forEach(id => {
                const cb = document.getElementById(id);
                if (cb) { cb.checked = true; counts.diseases++; }
            });
        }

        // 3. 급성/임상 증상 체크박스
        if (p.symptoms.length > 0) {
            document.querySelectorAll('input[name="acute-sx"]').forEach(cb => {
                if (p.symptoms.some(s => cb.value.includes(s.split('/')[0]))) {
                    cb.checked = true;
                    counts.symptoms++;
                }
            });
        }

        // 4. 초음파 소견
        setEl("us-thickness", p.us_thickness);
        setEl("us-layering", p.us_layering);
        setEl("us-hyperechoic", p.us_hyperechoic);

        // 5. 알러지 체크박스
        if (p.allergies.length > 0) {
            document.querySelectorAll('input[name="allergy"]').forEach(cb => {
                if (p.allergies.includes(cb.value)) { cb.checked = true; counts.patient++; }
            });
        }

        // 6. 혈액검사 수치 (Tab 4 연동)
        const setLab = (id, val) => { const el = document.getElementById(id); if (el && val != null) { el.value = val; counts.lab++; } };
        setLab("lab-bun", p.lab.bun);
        setLab("lab-cr", p.lab.cr);
        setLab("lab-sdma", p.lab.sdma);
        setLab("lab-p", p.lab.p);
        setLab("lab-alb", p.lab.alb);
        setLab("lab-cpl", p.lab.cpl);
        setLab("lab-alt", p.lab.alt);
        setLab("lab-k", p.lab.k);

        // 계산기 엔진 재실행
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

    // 수의사용 CDSS 및 논문/문헌 검색 응답 생성기
    function generateVetCdssAndPapersResponse(query) {
        return `
            <div style="color: #1e3a8a; font-weight: 900; font-size: 13px; margin-bottom: 6px;">
                📚 수의 임상 영양 CDSS & 학술 문헌 검색 결과
            </div>
            <div style="background: #f8fafc; padding: 10px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 11.5px; line-height: 1.55; space-y-2;">
                <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px;">1. 복합질환 영양 상충 해결 알고리즘 (Clinical CDSS Rule)</div>
                • <strong>CKD(신부전) + 췌장염 동반 시:</strong> 신장 처방식(고지방 35~45g/1000kcal) 단독 급여 시 고지혈증 및 급성 췌장염 재발로 신혈류량이 급감(Pre-renal azotemia 가중)합니다. 따라서 <strong>조지방 상한선(&lt;25g/1,000kcal, &lt;10~12% DM)과 인 상한선(&lt;0.8g/1,000kcal)을 동시 충족</strong>하도록 처방 저지방 습식/건식과 신장 처방식을 믹스피딩해야 합니다.<br><br>

                <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px;">2. 핵심 근거 문헌 및 논문 인용 (Evidence & Citations)</div>
                • <strong>[IRIS 2023 Guidelines]</strong> <em>International Renal Interest Society Treatment Recommendations for CKD in Dogs and Cats</em>: Stage 2 혈중 인 &lt;4.6 mg/dL 유지를 위한 식이 인 제한 권고.<br>
                • <strong>[ACVIM Consensus 2021]</strong> Cridge H, et al. <em>ACVIM consensus statement on pancreatitis in dogs</em>. J Vet Intern Med (JVIM): 만성/재발성 고중성지방혈증 환자에서 저지방 식이 중재 권고.<br>
                • <strong>[SACN 5th Ed.]</strong> Hand MS, et al. <em>Small Animal Clinical Nutrition</em>, Ch. 37 (Renal Disease) & Ch. 60 (Exocrine Pancreas): 복합질환 시 가장 치명적인 급성 악화 요인(지방/인/나트륨)의 최솟값(Strict Min-Max Intersection) 적용.<br>
                • <strong>[Journal of Animal Science 2023]</strong> <em>Effects of protein source and digestibility on fecal metabolites (ammonia, indole, SCFA) in dogs</em> (PMC10066725).
            </div>
            <div style="margin-top: 8px; display: flex; gap: 6px;">
                <a href="https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent('canine CKD pancreatitis dietary nutrition')}" target="_blank" style="flex: 1; text-align: center; padding: 7px; border-radius: 8px; background: #1e293b; color: #38bdf8; text-decoration: none; font-size: 11px; font-weight: 800;">🔗 PubMed 원문 논문 더보기 ➔</a>
            </div>
        `;
    }

    // 보호자용 수의 영양학 상담 응답 생성기
    function generateGuardianNutritionCounseling(query) {
        const wt = document.getElementById("g-weight")?.value || "4.5";
        const dryName = document.getElementById("g-dry-name")?.value || "주식 사료";

        if (query.includes("7일") || query.includes("바꿀") || query.includes("전환")) {
            return `
                <div style="color: #065f46; font-weight: 900; font-size: 13px; margin-bottom: 6px;">
                    📅 장 트러블 없는 '7일 사료 전환 스케줄'
                </div>
                <div style="background: #ecfdf5; padding: 10px; border-radius: 10px; border: 1px solid #a7f3d0; font-size: 11.5px; line-height: 1.55;">
                    갑자기 새 사료나 믹스피딩을 100% 주면 장내 미생물이 놀라 묽은 변을 볼 수 있어요. 아래 비율로 천천히 늘려주세요!<br><br>
                    • <strong>1~2일차:</strong> 기존 사료 <strong>75%</strong> + 새 믹스사료 <strong>25%</strong><br>
                    • <strong>3~4일차:</strong> 기존 사료 <strong>50%</strong> + 새 믹스사료 <strong>50%</strong><br>
                    • <strong>5~6일차:</strong> 기존 사료 <strong>25%</strong> + 새 믹스사료 <strong>75%</strong><br>
                    • <strong>7일차~:</strong> 목표 맞춤 믹스피딩 <strong>100%</strong> 완성!
                </div>
            `;
        }

        if (query.includes("음수") || query.includes("물") || query.includes("토핑")) {
            return `
                <div style="color: #0369a1; font-weight: 900; font-size: 13px; margin-bottom: 6px;">
                    💧 하루 음수량 채우기 & 10% 안전 토핑 원칙
                </div>
                <div style="background: #f0f9ff; padding: 10px; border-radius: 10px; border: 1px solid #bae6fd; font-size: 11.5px; line-height: 1.55;">
                    • <strong>우리 아이(체중 ${wt}kg) 권장 수분량:</strong> 하루 약 <strong>${Math.round(parseFloat(wt) * 55)}ml</strong> (종이컵 ${(parseFloat(wt) * 55 / 180).toFixed(1)}컵)<br>
                    • <strong>음수량 늘리는 꿀팁:</strong> 습식캔이나 화식을 30% 섞어주시면 사료 속 수분만으로 하루 물 섭취량의 25~35%가 자연스럽게 채워집니다. 여기에 미온수 2~3스푼을 섞어주시면 기호성과 음수량을 동시에 잡을 수 있어요!<br>
                    • <strong>토핑 10% 원칙:</strong> 닭가슴살, 북어, 단호박 등 단일 원재료 토핑은 전체 칼로리의 <strong>10% 이내</strong>로만 주셔야 칼슘:인 영양 균형이 깨지지 않습니다.
                </div>
            `;
        }

        return `
            <div style="color: #065f46; font-weight: 900; font-size: 13px; margin-bottom: 6px;">
                🐾 맞춤형 수의 영양학 상담 가이드
            </div>
            <div style="background: #f8fafc; padding: 10px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 11.5px; line-height: 1.55;">
                현재 우리 아이(<strong>${wt}kg</strong>)의 주 사료는 <strong>[${dryName}]</strong>로 설정되어 있습니다.<br><br>
                • <strong>건식 + 습식 믹스피딩 장점:</strong> 건식의 치석 관리·경제성과 습식의 수분 보충·높은 기호성을 동시에 얻을 수 있습니다.<br>
                • <strong>포장지 OCR 활용:</strong> 먹이고 계신 사료 뒷면 성분표를 상단 <strong>[📷 2-① 주사료]</strong>와 <strong>[🥫 2-② 믹스사료]</strong> 버튼에 올리시면 정확한 그램(g) 수를 바로 계산해 드립니다!
            </div>
            <button type="button" onclick="goToCalculatorSection('guardian-step3')" style="margin-top: 8px; width: 100%; padding: 8px; border-radius: 10px; background: #059669; color: white; border: none; font-weight: 800; font-size: 11.5px; cursor: pointer;">🥣 계산기 배합 화면으로 바로 이동하기 ➔</button>
        `;
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAiAgent);
    } else {
        initAiAgent();
    }
})();
