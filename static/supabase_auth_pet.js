// =========================================================================
// Supabase 카카오 로그인 & 반려동물 프로필 / 급여 기록 연동 모듈
// =========================================================================
(function () {
    let sbClient = null;
    let currentUser = null;
    let currentProfile = null;
    let myPets = [];
    let selectedPetId = null;

    // 1. Supabase 클라이언트 초기화
    function initSupabase() {
        if (!window.SUPABASE_CONFIG || !window.supabase) {
            console.warn("[Supabase] SDK 또는 설정이 로드되지 않았습니다.");
            return null;
        }
        if (!sbClient) {
            sbClient = window.supabase.createClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.publishableKey,
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    }
                }
            );
        }
        return sbClient;
    }

    // 2. 카카오 로그인 실행
    window.loginWithKakao = async function () {
        const client = initSupabase();
        if (!client) {
            alert("로그인 서비스 초기화 중입니다. 잠시 후 다시 시도해 주세요.");
            return;
        }

        // 현재 서비스 중인 주소로 정확하게 리다이렉트
        const redirectTo = window.location.origin + window.location.pathname;
        try {
            const { data, error } = await client.auth.signInWithOAuth({
                provider: 'kakao',
                options: {
                    redirectTo: redirectTo,
                    queryParams: {
                        scope: 'profile_nickname,account_email'
                    }
                }
            });
            if (error) throw error;
        } catch (err) {
            console.error("카카오 로그인 실패:", err);
            alert("카카오 로그인 중 오류가 발생했습니다: " + (err.message || err));
        }
    };

    // 3. 로그아웃
    window.logoutGuardian = async function () {
        const client = initSupabase();
        if (!client) return;
        if (confirm("로그아웃 하시겠습니까?")) {
            await client.auth.signOut();
            currentUser = null;
            currentProfile = null;
            myPets = [];
            selectedPetId = null;
            updateAuthUI();
            alert("로그아웃 되었습니다.");
        }
    };

    // 4. 세션 감지 및 프로필/반려동물 로드
    async function checkAuthSession() {
        const client = initSupabase();
        if (!client) return;

        try {
            const { data: { session }, error } = await client.auth.getSession();
            if (error) {
                console.error("세션 확인 오류:", error);
                return;
            }

            if (session && session.user) {
                currentUser = session.user;
                await loadUserProfile();
                await loadGuardianPets();
            } else {
                currentUser = null;
            }
            updateAuthUI();
        } catch (e) {
            console.error("인증 상태 체크 예외:", e);
        }

        // 세션 변화 리스너 등록
        client.auth.onAuthStateChange(async (event, session) => {
            if (session && session.user) {
                currentUser = session.user;
                await loadUserProfile();
                await loadGuardianPets();
            } else {
                currentUser = null;
                currentProfile = null;
                myPets = [];
            }
            updateAuthUI();
        });
    }

    // 프로필 로드
    async function loadUserProfile() {
        if (!sbClient || !currentUser) return;
        try {
            const { data, error } = await sbClient
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();
            if (!error && data) {
                currentProfile = data;
            }
        } catch (err) {
            console.warn("프로필 조회 실패:", err);
        }
    }

    // 반려동물 목록 로드
    async function loadGuardianPets() {
        if (!sbClient || !currentUser) return;
        try {
            const { data, error } = await sbClient
                .from('pets')
                .select('*')
                .eq('owner_id', currentUser.id)
                .order('created_at', { ascending: true });
            if (!error && data) {
                myPets = data;
                if (!selectedPetId && myPets.length > 0) {
                    selectedPetId = myPets[0].id;
                }
            }
        } catch (err) {
            console.warn("반려동물 목록 조회 실패:", err);
        }
    }

    // 5. UI 동적 업데이트 (헤더 및 결과창 배너)
    function updateAuthUI() {
        const userBar = document.getElementById("guardian-auth-header-slot");
        const nickname = currentUser ? (
            (currentUser.user_metadata && (currentUser.user_metadata.name || currentUser.user_metadata.nickname)) ||
            (currentProfile && currentProfile.display_name) ||
            "보호자"
        ) : null;

        if (userBar) {
            if (currentUser) {
                userBar.innerHTML = `
                    <div class="flex items-center space-x-2 bg-emerald-800/80 border border-emerald-500/50 px-3 py-1.5 rounded-xl shadow-sm text-xs">
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 text-slate-900 font-black text-xs">
                            <i class="fa-solid fa-comment"></i>
                        </span>
                        <div class="flex flex-col text-left">
                            <span class="font-black text-white text-[13px] leading-tight">${nickname}님</span>
                            <span class="text-emerald-200 text-[11px]">내 아이 ${myPets.length}마리 등록됨</span>
                        </div>
                        <button type="button" onclick="openPetManageModal()" class="ml-2 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center space-x-1">
                            <i class="fa-solid fa-paw"></i>
                            <span>내 아이 관리</span>
                        </button>
                        <button type="button" onclick="logoutGuardian()" class="px-2 py-1 rounded-lg bg-emerald-900/80 hover:bg-emerald-950 text-emerald-300 transition text-[11px]">
                            로그아웃
                        </button>
                    </div>
                `;
            } else {
                userBar.innerHTML = `
                    <button type="button" onclick="loginWithKakao()" class="px-3.5 py-1.5 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-black text-xs shadow-md transition transform active:scale-95 flex items-center space-x-1.5 border border-yellow-400">
                        <i class="fa-solid fa-comment text-sm"></i>
                        <span>카카오 1초 로그인 (기록 저장)</span>
                    </button>
                `;
            }
        }

        // Step 4 급여표 하단 저장 배너 업데이트
        const saveSlot = document.getElementById("guardian-auth-save-cta-slot");
        if (saveSlot) {
            if (currentUser) {
                saveSlot.innerHTML = `
                    <div class="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                        <div class="flex items-center space-x-3 text-left">
                            <div class="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg font-bold shadow">
                                <i class="fa-solid fa-floppy-disk"></i>
                            </div>
                            <div>
                                <h4 class="font-black text-emerald-950 text-sm sm:text-base">오늘의 맞춤 식단 & 급여표를 내 아이 차트에 저장할까요?</h4>
                                <p class="text-xs text-emerald-700">체중, 체형(BCS/MCS), 계산된 일일 급여량이 안전하게 보존됩니다.</p>
                            </div>
                        </div>
                        <button type="button" onclick="saveCurrentPetAndRecord()" class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-md transition flex items-center justify-center space-x-1.5">
                            <i class="fa-solid fa-check"></i>
                            <span>현재 식단 기록 저장하기</span>
                        </button>
                    </div>
                `;
            } else {
                saveSlot.innerHTML = `
                    <div class="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                        <div class="flex items-center space-x-3 text-left">
                            <div class="w-10 h-10 rounded-full bg-yellow-400 text-slate-900 flex items-center justify-center text-lg font-bold shadow">
                                <i class="fa-solid fa-comment"></i>
                            </div>
                            <div>
                                <h4 class="font-black text-amber-950 text-sm sm:text-base">이 급여표를 카카오 계정에 저장해두고 매일 확인하세요!</h4>
                                <p class="text-xs text-amber-800">카카오 1초 로그인 한 번이면 언제든 우리 아이 맞춤 식단을 다시 꺼내볼 수 있습니다.</p>
                            </div>
                        </div>
                        <button type="button" onclick="loginWithKakao()" class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-black text-sm shadow-md transition flex items-center justify-center space-x-1.5 border border-yellow-400">
                            <i class="fa-solid fa-comment"></i>
                            <span>카카오로 1초 저장하기</span>
                        </button>
                    </div>
                `;
            }
        }
    }

    // 6. 현재 화면의 입력값을 읽어 반려동물 생성/업데이트 및 기록 저장
    window.saveCurrentPetAndRecord = async function () {
        if (!currentUser) {
            loginWithKakao();
            return;
        }

        // 현재 입력창 값 읽기
        const species = document.getElementById("g-species-dog")?.checked ? "dog" : "cat";
        const petName = (document.getElementById("g-pet-name")?.value || "").trim() || (species === "dog" ? "우리 강아지" : "우리 고양이");
        const breed = (document.getElementById("g-pet-breed")?.value || "").trim() || null;
        const weight = parseFloat(document.getElementById("g-weight")?.value) || null;
        
        // BCS
        let bcs = 5;
        const bcsChecked = document.querySelector('input[name="g-bcs-score"]:checked');
        if (bcsChecked) bcs = parseInt(bcsChecked.value, 10);

        // MCS
        let mcs = 2;
        const mcsChecked = document.querySelector('input[name="g-mcs-score"]:checked');
        if (mcsChecked) mcs = parseInt(mcsChecked.value, 10);

        // 건강 고민
        const healthConcerns = [];
        document.querySelectorAll('input[name="g-health-concern"]:checked').forEach(cb => {
            healthConcerns.push(cb.value);
        });

        // 급여 결과 데이터 스냅샷
        const summaryData = {
            saved_at: new Date().toISOString(),
            rer: document.getElementById("g-rer-disp")?.innerText || "-",
            der: document.getElementById("g-der-disp")?.innerText || "-",
            dry_food_name: document.getElementById("g-dry-food-search")?.value || "사료",
            active_menu: window.guardianState?.activeMenu || 1,
            feeding_guide: {
                total_grams: document.getElementById("g-total-grams-disp")?.innerText || "-",
                morning: document.getElementById("g-morning-disp")?.innerText || "-",
                evening: document.getElementById("g-evening-disp")?.innerText || "-"
            }
        };

        const client = initSupabase();
        try {
            // 기존 선택된 펫이 있으면 업데이트, 없으면 신규 추가
            let targetPetId = selectedPetId;
            if (!targetPetId) {
                // 이름과 종이 같은 아이가 이미 있는지 확인
                const existing = myPets.find(p => p.name === petName && p.species === species);
                if (existing) {
                    targetPetId = existing.id;
                }
            }

            if (targetPetId) {
                // 기존 펫 정보 업데이트
                const { error: updateErr } = await client
                    .from('pets')
                    .update({
                        name: petName,
                        species: species,
                        breed: breed,
                        weight_kg: weight,
                        bcs: bcs,
                        mcs: mcs,
                        health_concerns: healthConcerns,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', targetPetId);
                if (updateErr) throw updateErr;
            } else {
                // 신규 펫 생성
                const { data: newPet, error: insertErr } = await client
                    .from('pets')
                    .insert([{
                        owner_id: currentUser.id,
                        name: petName,
                        species: species,
                        breed: breed,
                        weight_kg: weight,
                        bcs: bcs,
                        mcs: mcs,
                        health_concerns: healthConcerns
                    }])
                    .select()
                    .single();
                if (insertErr) throw insertErr;
                targetPetId = newPet.id;
                selectedPetId = targetPetId;
            }

            // 시계열 기록(pet_records)에 추가
            const { error: recErr } = await client
                .from('pet_records')
                .insert([{
                    pet_id: targetPetId,
                    owner_id: currentUser.id,
                    weight_kg: weight,
                    bcs: bcs,
                    mcs: mcs,
                    note: `${petName} 맞춤 믹스피딩 급여표 기록`,
                    data: summaryData
                }]);
            if (recErr) throw recErr;

            await loadGuardianPets();
            updateAuthUI();
            alert(`🎉 [${petName}]의 프로필과 오늘 급여표 기록이 안전하게 저장되었습니다!`);
        } catch (err) {
            console.error("저장 오류:", err);
            alert("저장 중 오류가 발생했습니다: " + (err.message || err));
        }
    };

    // 7. 내 아이 목록 모달 열기
    window.openPetManageModal = function () {
        if (!currentUser) {
            loginWithKakao();
            return;
        }

        let modal = document.getElementById("pet-manage-modal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "pet-manage-modal";
            modal.className = "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm";
            document.body.appendChild(modal);
        }

        const petCards = myPets.length > 0 ? myPets.map(p => `
            <div class="border rounded-2xl p-4 transition ${selectedPetId === p.id ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-400' : 'border-slate-200 bg-white hover:border-slate-300'} flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-11 h-11 rounded-2xl ${p.species === 'dog' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'} flex items-center justify-center text-xl font-bold shadow-sm">
                        <i class="fa-solid ${p.species === 'dog' ? 'fa-dog' : 'fa-cat'}"></i>
                    </div>
                    <div>
                        <div class="flex items-center space-x-2">
                            <h4 class="font-black text-slate-900 text-base">${p.name}</h4>
                            <span class="px-2 py-0.5 rounded text-[11px] font-bold ${p.species === 'dog' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}">${p.species === 'dog' ? '강아지' : '고양이'}</span>
                            ${p.breed ? `<span class="text-xs text-slate-500 font-medium">${p.breed}</span>` : ''}
                        </div>
                        <p class="text-xs text-slate-600 mt-0.5">
                            체중 <strong>${p.weight_kg ? p.weight_kg + 'kg' : '미입력'}</strong> · BCS <strong>${p.bcs || '-'}/9</strong> · MCS <strong>${p.mcs !== undefined ? p.mcs + '/3' : '-'}</strong>
                        </p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button type="button" onclick="applyPetToForm('${p.id}')" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm">
                        불러오기
                    </button>
                    <button type="button" onclick="deletePet('${p.id}', '${p.name}')" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition text-xs">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `).join("") : `
            <div class="text-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                <i class="fa-solid fa-paw text-3xl text-slate-400 mb-2"></i>
                <p class="text-sm font-bold text-slate-600">아직 등록된 아이가 없습니다.</p>
                <p class="text-xs text-slate-400 mt-1">계산 결과를 입력하고 [현재 식단 기록 저장하기]를 눌러보세요.</p>
            </div>
        `;

        modal.innerHTML = `
            <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                    <div class="flex items-center space-x-2.5">
                        <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            <i class="fa-solid fa-paw"></i>
                        </div>
                        <div>
                            <h3 class="font-black text-slate-900 text-lg">내 아이 프로필 관리</h3>
                            <p class="text-xs text-slate-500">저장된 아이의 정보를 클릭하여 계산기에 즉시 불러올 수 있습니다.</p>
                        </div>
                    </div>
                    <button type="button" onclick="closePetManageModal()" class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div class="space-y-3 overflow-y-auto flex-1 pr-1 mb-4">
                    ${petCards}
                </div>

                <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-xs text-slate-400">총 ${myPets.length}마리 관리 중</span>
                    <button type="button" onclick="closePetManageModal()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition">
                        닫기
                    </button>
                </div>
            </div>
        `;
        modal.style.display = "flex";
    };

    window.closePetManageModal = function () {
        const modal = document.getElementById("pet-manage-modal");
        if (modal) modal.style.display = "none";
    };

    // 8. 저장된 아이 정보를 폼에 불러오기
    window.applyPetToForm = function (petId) {
        const pet = myPets.find(p => p.id === petId);
        if (!pet) return;

        selectedPetId = pet.id;

        // 종 선택
        if (pet.species === "dog") {
            const dogRadio = document.getElementById("g-species-dog");
            if (dogRadio) { dogRadio.checked = true; dogRadio.dispatchEvent(new Event('change')); }
        } else {
            const catRadio = document.getElementById("g-species-cat");
            if (catRadio) { catRadio.checked = true; catRadio.dispatchEvent(new Event('change')); }
        }

        // 이름, 품종, 체중
        const nameEl = document.getElementById("g-pet-name");
        if (nameEl) nameEl.value = pet.name || "";
        const breedEl = document.getElementById("g-pet-breed");
        if (breedEl) breedEl.value = pet.breed || "";
        const weightEl = document.getElementById("g-weight");
        if (weightEl && pet.weight_kg) weightEl.value = pet.weight_kg;

        // BCS
        if (pet.bcs) {
            const bcsRadio = document.querySelector(`input[name="g-bcs-score"][value="${pet.bcs}"]`);
            if (bcsRadio) {
                bcsRadio.checked = true;
                if (typeof window.selectGuardianBcs === 'function') {
                    window.selectGuardianBcs(pet.bcs);
                }
            }
        }

        // MCS
        if (pet.mcs !== undefined && pet.mcs !== null) {
            const mcsRadio = document.querySelector(`input[name="g-mcs-score"][value="${pet.mcs}"]`);
            if (mcsRadio) {
                mcsRadio.checked = true;
                if (typeof window.selectGuardianMcs === 'function') {
                    window.selectGuardianMcs(pet.mcs);
                }
            }
        }

        // 건강 고민 체크박스 복원
        if (Array.isArray(pet.health_concerns)) {
            document.querySelectorAll('input[name="g-health-concern"]').forEach(cb => {
                cb.checked = pet.health_concerns.includes(cb.value);
            });
        }

        closePetManageModal();
        if (typeof window.onGuardianProfileChange === 'function') {
            window.onGuardianProfileChange();
        }
        alert(`🐾 [${pet.name}]의 프로필을 불러왔습니다!`);
    };

    // 9. 아이 삭제
    window.deletePet = async function (petId, petName) {
        if (!confirm(`정말로 [${petName}]의 프로필과 모든 급여 기록을 삭제하시겠습니까?`)) {
            return;
        }
        const client = initSupabase();
        try {
            const { error } = await client.from('pets').delete().eq('id', petId);
            if (error) throw error;
            if (selectedPetId === petId) selectedPetId = null;
            await loadGuardianPets();
            openPetManageModal();
            updateAuthUI();
        } catch (e) {
            alert("삭제 중 오류가 발생했습니다: " + (e.message || e));
        }
    };

    // 10. DOM 로드 시 자동 실행
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            setTimeout(checkAuthSession, 300);
        });
    } else {
        setTimeout(checkAuthSession, 300);
    }

    // 외부 노출
    window.guardianAuthModule = {
        checkAuthSession,
        updateAuthUI,
        getCurrentUser: () => currentUser,
        getMyPets: () => myPets
    };
})();
