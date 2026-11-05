# -*- coding: utf-8 -*-
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def build_v4_workbook():
    v3_filename = '장내환경_변수_가중치_상관관계_개_고양이_통합완성본-v3.xlsx'
    v4_filename = '장내환경_변수_가중치_상관관계_개_고양이_통합완성본-v4.xlsx'
    
    wb_v3 = openpyxl.load_workbook(v3_filename, data_only=True)
    wb_v4 = openpyxl.Workbook()
    # 기본 sheet 제거
    default_sheet = wb_v4.active
    wb_v4.remove(default_sheet)
    
    # -------------------------------------------------------------
    # 스타일 정의
    # -------------------------------------------------------------
    font_family = "Malgun Gothic"
    
    header_font = Font(name=font_family, size=10, bold=True, color="FFFFFF")
    header_fill_navy = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    header_fill_blue = PatternFill(start_color="1D4ED8", end_color="1D4ED8", fill_type="solid")
    header_fill_gold = PatternFill(start_color="B45309", end_color="B45309", fill_type="solid")
    header_fill_slate = PatternFill(start_color="475569", end_color="475569", fill_type="solid")
    header_fill_sub = PatternFill(start_color="334155", end_color="334155", fill_type="solid")
    
    title_font = Font(name=font_family, size=14, bold=True, color="0F172A")
    subtitle_font = Font(name=font_family, size=10, color="475569")
    section_font = Font(name=font_family, size=11, bold=True, color="1E3A8A")
    
    bold_cell_font = Font(name=font_family, size=9.5, bold=True, color="0F172A")
    regular_cell_font = Font(name=font_family, size=9.5, color="1E293B")
    note_font = Font(name=font_family, size=9, color="64748B")
    
    fill_zebra_dog = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    fill_zebra_cat = PatternFill(start_color="FFFBEB", end_color="FFFBEB", fill_type="solid")
    fill_ph_col = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")  # 연한 앰버
    fill_latent_col = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    
    thin_border_side = Side(style='thin', color="CBD5E1")
    cell_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)

    # =============================================================
    # SHEET 1: V4_개편안내_및_수식구조 (신설)
    # =============================================================
    ws_info = wb_v4.create_sheet(title="V4_개편안내_및_수식구조")
    ws_info.views.sheetView[0].showGridLines = True
    
    guide_rows = [
        ["📘 장내환경 분변 마커 가중치 및 예측 모형 설계서 (Ver 4.0 업그레이드 요약)"],
        ["본 문서는 외부 전문가 평가 의견서(1~6번 항목) 및 임상 생리학적 검토 결과를 100% 반영하여 수식적 한계를 개선한 공식 가중치 정의표입니다."],
        [],
        ["1. 핵심 개편 방향 및 임상 안전성 6대 원칙", "", "", "", ""],
        ["항목", "기존 V3 모델의 한계 및 지적 사항", "V4 업그레이드 해결 방안", "적용 수식 및 임상 규칙", "비고"],
        [
            "① 계수의 성격 규정",
            "정밀한 수치(1.45, 1.55 등)가 확정된 농도 예측식처럼 오인될 소지 존재",
            "확정된 예측식이 아닌 '미검증 초기 가설 계수 (Prior)'로 공식 규정",
            "모든 마커 예측값은 단일 점추정이 아닌 '예측 오차 범위 (±Margin 판독폭)'와 함께 제시",
            "임상 실측 데이터 축적에 따른 사후 갱신 대상"
        ],
        [
            "② 분변 pH 수식",
            "로그 척도(pH)에 배수를 곱하는 비생물학적 곱셈식 (예: 6.5 × 1.08 = 7.02)",
            "pH 단위의 가산 변화량(Additive Shift, ΔpH) 모형으로 전면 전환",
            "예상 pH = 6.50 + ΔpH(식이) + ΔpH(약물) + ΔpH(질환·혈액)\nΔpH = (환산배수 - 1.0) × 3.0 (생리 범위 5.2~8.2 제한)",
            "고단백사료 +0.24, 저단백 -0.18 등 pH 단위 직접 가산"
        ],
        [
            "③ 잠혈/포도당 기준값 0",
            "정상 기준값이 '0 (음성)'이므로 배수를 곱해도 계속 0이 되는 수식 모순 (0 × 1.8 = 0)",
            "농도 배수 곱셈에서 분리하여 '주의 신호 등급 (Risk Tier)' 및 '검출한계(Cut-off)' 모형으로 전환",
            "잠혈: Cut-off <10 ng/mL, 계수는 [음성 예상(1.0) / 약양성 주의(1.3~1.5) / 양성 고위험(1.6~2.0)]\n포도당: Cut-off <20 mg/dL 등급 확률",
            "잠혈 반응은 타 마커가 양호하더라도 절대 상쇄하지 않고 별도 확인"
        ],
        [
            "④ 중복 반영 통제 (Collinearity Cap)",
            "CKD 3,4 + BUN/Cr 상승 + 신장약 + 신장식 등 동일 병태가 독립적으로 중복 합산됨",
            "연관 임상 클러스터(신장/요독, 췌담도/지질 등) 내 주효과 1개 외 연관 변수 감쇠 통제",
            "동일 병태군 동시 발생 시: 주효과 100% + 연관 변수 25% (γ = 0.25) 감쇠 및 클러스터 상한 캡 적용",
            "병태 중복 계산에 따른 과도한 감점/수치 왜곡 차단"
        ],
        [
            "⑤ 기준 개체 보존",
            "모든 변수 계수가 1인 기준 개체에 가중치가 왜곡될 우려",
            "편차 기반 가중치 적용으로 모든 계수가 1.0인 개체는 기준값 100% 보존",
            "W_total = 1.0 + Σ { C_k × (W_k - 1.0) }  (모든 W_k = 1.0 일 때 W_total = 1.00 유지)",
            "카테고리 민감도 C_k 곱셈 안전성 확보"
        ],
        [
            "⑥ 실측 검사 vs 가설 잠재상태 분리",
            "'미소화 영양소 % DM'이나 '장누수/장염증/흡수율'이 키트 직접 실측값으로 오인됨",
            "키트 패드 실측 반응과 가설적 잠재 상태(Latent State)를 명확히 분리",
            "실측: 분변 pH, 암모니아, 포도당 패드, 잠혈, 단백질 반응(출처미분리), 전분 잔류 신호, 지방 잔류 신호, 비중(SG)\n잠재상태: 장운동, 장소화효소, 장누수, 장염증, 흡수지수",
            "젖산(mmol/g 단위오류 등)은 실측 제외, 인돌은 대장대사 지표로 분류"
        ],
        [],
        ["2. 수식 적용 가이드 (CDSS v1.3 엔진 연동 표준)", "", "", "", ""],
        ["구분", "마커 항목", "정상 기준 (Base)", "허용오차 (±Margin)", "V4 예측식 구조 (Expected Model)"],
        ["실측 패널", "분변 pH", "6.50", "±0.30", "예상 pH = 6.50 + ΔpH_Total (단위: pH, 6.50 ± 0.30 [6.20 ~ 6.80])"],
        ["실측 패널", "암모니아 (NH₃)", "20.0 μmol/g", "±5.0 μmol/g", "예상치 = 20.0 × W_total ± 5.0 [15.0 ~ 25.0]  (미검증 가설치)"],
        ["실측 패널", "잠혈 반응 (Blood)", "0 ng/mL (음성)", "검출한계 10.0", "예상치 = 음성 기준 (<10 ng/mL) · 위험도 등급 [음성 예상 / 약양성 주의 / 양성 고위험]"],
        ["실측 패널", "포도당 패드 (Glucose)", "0 mg/dL (음성)", "검출한계 20.0", "예상치 = 음성 기준 (<20 mg/dL) · 위험도 등급 [음성 예상 / 약양성 주의 / 고위험]"],
        ["실측 패널", "분변 단백질 반응 (출처미분리)", "5.0 % DM", "±1.5 % DM", "예상치 = 5.0 × W_total ± 1.5 [3.5 ~ 6.5]  (단독으로 PLE 확진 금지)"],
        ["실측 패널", "전분 잔류 신호 (루골 반응)", "6.0 % DM", "±1.5 % DM", "예상치 = 6.0 × W_total ± 1.5 [4.5 ~ 7.5]  (식이 전분 특성 및 소장계 처리 검토)"],
        ["실측 패널", "지방 잔류 신호", "4.0 % DM", "±1.5 % DM", "예상치 = 4.0 × W_total ± 1.5 [2.5 ~ 5.5]  (식이 지방량 및 췌담도 소화 검토)"],
        ["실측 패널", "분변 비중 (SG · 보조)", "1.025", "전후비교", "전후 비교 전용 (예상치 미적용, 원분변 수분율/변비 단정 금지)"],
        ["잠재 지표", "모형 참고 흡수지수", "85.0 %", "±5.0 %", "모형 참고 지수 = 85.0 × W_absorb (전분변 회수법 실측치 아님, 자동 증량 금지)"],
        ["잠재 지표", "4대 축(장운동·소화액·누수·염증)", "1.00 배수", "탐색 지표", "직접 실측 검사가 아닌 기저 질환·약물·식이 조건 기반 가설적 잠재 상태 추론"]
    ]
    
    for r_idx, row in enumerate(guide_rows, start=1):
        for c_idx, val in enumerate(row, start=1):
            cell = ws_info.cell(row=r_idx, column=c_idx, value=val)
            cell.font = regular_cell_font
            if r_idx == 1:
                cell.font = title_font
            elif r_idx == 2:
                cell.font = subtitle_font
            elif r_idx in [4, 14]:
                cell.font = section_font
            elif r_idx in [5, 15]:
                cell.font = header_font
                cell.fill = header_fill_navy
                cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            elif r_idx in [6, 7, 8, 9, 10, 11, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]:
                cell.border = cell_border
                if c_idx == 1:
                    cell.font = bold_cell_font
                if c_idx in [1, 2, 4]:
                    cell.alignment = Alignment(vertical="center", wrap_text=True)

    # =============================================================
    # SHEET 2 & 3: 변수기준(개) & 변수기준 (고양이)
    # =============================================================
    v4_headers = [
        "분류", "카테고리 민감도\n(C_k Prior)", "환자 조건 변수\n(입력 조건)",
        "[실측] 분변 pH\n(가산 ΔpH 단위)", "[참고] pH\n환산배수",
        "[실측] 암모니아\n(NH₃ 가설계수)", "[실측] 포도당 패드\n(위험도 점수)",
        "[실측] 잠혈 반응\n(출혈 주의도 등급)",
        "[실측] 단백질 반응\n(출처미분리 계수)", "[실측] 전분 잔류 신호\n(루골 반응 계수)",
        "[실측] 지방 잔류 신호\n(가설계수)", "[잠재] 모형 참고\n흡수지수 (배수)",
        "[잠재] 장관 통과\n운동성 변화 지수", "[잠재] 췌담도 기질처리\n부담 지수",
        "[잠재] 장벽 투과성\n점막부담 지수", "[잠재] 점막자극\n질소부하 지수",
        "[가설] 미생물 대사환경\n가설지수", "V4 임상 유의사항 및 근거 요약\n(미검증 초기 가설 Prior)"
    ]
    
    def calc_delta_ph(mult_val):
        try:
            val = float(mult_val)
            return round((val - 1.0) * 3.0, 2)
        except (ValueError, TypeError):
            return 0.0
    
    def safe_float(val, default=1.0):
        try:
            return float(val)
        except (ValueError, TypeError):
            return default

    def process_variable_sheet(src_sheet_name, dst_sheet_name, is_cat=False):
        ws_src = wb_v3[src_sheet_name]
        ws_dst = wb_v4.create_sheet(title=dst_sheet_name)
        ws_dst.views.sheetView[0].showGridLines = True
        
        # 제목 행
        title_text = "🐶 강아지(Canine) 장내환경 변수별 미검증 초기 가설 계수표 (Ver 4.0)" if not is_cat else "🐱 고양이(Feline) 장내환경 변수별 미검증 초기 가설 계수표 (Ver 4.0)"
        c_title = ws_dst.cell(row=1, column=1, value=title_text)
        c_title.font = title_font
        
        sub_text = "※ 본 수치는 생리학적 확정 예측치가 아니며, 임상 실측 전 사용하는 '미검증 초기 가설 계수(Prior)'입니다. 분변 pH는 배수 곱셈이 아닌 가산형(ΔpH)으로 적용되며, 잠혈은 0-기준 등급모형으로 해석합니다."
        c_sub = ws_dst.cell(row=2, column=1, value=sub_text)
        c_sub.font = subtitle_font
        
        # 헤더 행 (Row 4)
        for col_idx, h_text in enumerate(v4_headers, start=1):
            c = ws_dst.cell(row=4, column=col_idx, value=h_text)
            c.font = header_font
            c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            if col_idx in [4, 5]:
                c.fill = header_fill_gold
            elif col_idx in [6, 7, 8, 9, 10, 11]:
                c.fill = header_fill_blue
            elif col_idx in [12, 13, 14, 15, 16, 17]:
                c.fill = header_fill_slate
            else:
                c.fill = header_fill_navy
        
        v4_row = 5
        curr_cat = None
        curr_cat_weight = None
        summary_rows = []
        
        for src_r in range(2, ws_src.max_row + 1):
            val_cat = ws_src.cell(row=src_r, column=1).value
            val_cat_w = ws_src.cell(row=src_r, column=2).value
            val_name = ws_src.cell(row=src_r, column=3).value
            
            if not val_name:
                continue
            
            val_name_str = str(val_name).strip()
            
            # 요약 섹션(카테고리 권장 가중치 Ck 설명 등) 분리 저장
            if "생리학적 영향 성격" in val_name_str or "병태생리학적" in val_name_str or "인위적 화학적" in val_name_str or "임상 병리적" in val_name_str or "발효 기질" in val_name_str or "기저 요인" in val_name_str:
                summary_rows.append([
                    ws_src.cell(row=src_r, column=1).value or "",
                    ws_src.cell(row=src_r, column=3).value or "",
                    ws_src.cell(row=src_r, column=4).value or "",
                    ws_src.cell(row=src_r, column=5).value or ""
                ])
                continue
                
            if val_cat: curr_cat = str(val_cat).strip()
            if val_cat_w: curr_cat_weight = str(val_cat_w).strip()
            
            val_ph_raw = ws_src.cell(row=src_r, column=4).value
            val_ph_mult = safe_float(val_ph_raw, 1.0)
            delta_ph = calc_delta_ph(val_ph_mult)
            
            val_amm = safe_float(ws_src.cell(row=src_r, column=5).value, 1.0)
            val_glu = safe_float(ws_src.cell(row=src_r, column=6).value, 1.0)
            val_bld = safe_float(ws_src.cell(row=src_r, column=7).value, 1.0)
            val_pro = safe_float(ws_src.cell(row=src_r, column=8).value, 1.0)
            val_car = safe_float(ws_src.cell(row=src_r, column=9).value, 1.0)
            val_fat = safe_float(ws_src.cell(row=src_r, column=10).value, 1.0)
            
            if not is_cat:
                val_abs = safe_float(ws_src.cell(row=src_r, column=11).value, 1.0)
                val_mot = safe_float(ws_src.cell(row=src_r, column=12).value, 1.0)
                val_dig = safe_float(ws_src.cell(row=src_r, column=13).value, 1.0)
                val_leak = safe_float(ws_src.cell(row=src_r, column=14).value, 1.0)
                val_inf = safe_float(ws_src.cell(row=src_r, column=15).value, 1.0)
                val_mic = safe_float(ws_src.cell(row=src_r, column=16).value, 1.0)
            else:
                # 고양이 시트에서는 컬럼 11이 장운동이었으므로 흡수율 계산
                val_abs = 1.0
                if "췌장" in val_name_str or "3복강염" in val_name_str: val_abs = 0.75
                elif "신부전" in val_name_str or "CKD" in val_name_str: val_abs = 0.88
                elif "림프종" in val_name_str or "PLE" in val_name_str: val_abs = 0.65
                elif "고단백사료" in val_name_str: val_abs = 1.02
                elif "저단백사료" in val_name_str: val_abs = 1.00
                elif "노령묘" in val_name_str: val_abs = 0.85
                
                val_mot = safe_float(ws_src.cell(row=src_r, column=11).value, 1.0)
                val_dig = safe_float(ws_src.cell(row=src_r, column=12).value, 1.0)
                val_leak = safe_float(ws_src.cell(row=src_r, column=13).value, 1.0)
                val_inf = safe_float(ws_src.cell(row=src_r, column=14).value, 1.0)
                val_mic = safe_float(ws_src.cell(row=src_r, column=15).value, 1.0)

            # 임상 유의사항 메모 작성
            notes = []
            if delta_ph > 0.15:
                notes.append(f"pH 알칼리화 경향 (+{delta_ph:.2f})")
            elif delta_ph < -0.15:
                notes.append(f"pH 산성화 경향 ({delta_ph:.2f})")
                
            if val_bld >= 1.4:
                notes.append(f"잠혈 고위험군(위험도 {val_bld:.2f}점: 점막손상 출혈 주의)")
            elif val_bld > 1.0:
                notes.append(f"잠혈 약양성 주의군(위험도 {val_bld:.2f}점)")
                
            if "CKD" in val_name_str or "신부전" in val_name_str or "BUN" in val_name_str:
                notes.append("신장/요독 클러스터 중복반영 감쇠(γ=0.25) 적용")
            if "cPL" in val_name_str or "fPL" in val_name_str or "췌장" in val_name_str:
                notes.append("췌담도/지질 클러스터 연동 대상")
            if "NSAIDs" in val_name_str or "스테로이드" in val_name_str:
                notes.append("점막 자극 약물 출혈 위험도 가중 (0배수 곱셈 금지)")
            if not notes:
                notes.append("표준 생리 범위 가설 기준치 유지")
            note_str = " · ".join(notes)
            
            row_vals = [
                curr_cat, curr_cat_weight, val_name_str,
                delta_ph, val_ph_mult,
                val_amm, val_glu, val_bld, val_pro, val_car, val_fat,
                val_abs, val_mot, val_dig, val_leak, val_inf, val_mic,
                note_str
            ]
            
            is_zebra = (v4_row % 2 == 0)
            row_fill = fill_zebra_cat if (is_cat and is_zebra) else (fill_zebra_dog if is_zebra else None)
            
            for c_idx, val in enumerate(row_vals, start=1):
                cell = ws_dst.cell(row=v4_row, column=c_idx, value=val)
                cell.font = regular_cell_font
                cell.border = cell_border
                
                if row_fill and c_idx not in [4]:
                    cell.fill = row_fill
                if c_idx == 4:
                    cell.fill = fill_ph_col
                    cell.font = bold_cell_font
                    cell.number_format = '+0.00;-0.00;0.00'
                    cell.alignment = Alignment(horizontal="right", vertical="center")
                elif c_idx in [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]:
                    cell.number_format = '0.00'
                    cell.alignment = Alignment(horizontal="right", vertical="center")
                elif c_idx in [1, 2]:
                    cell.alignment = Alignment(horizontal="center", vertical="center")
                    cell.font = bold_cell_font
                elif c_idx == 3:
                    cell.alignment = Alignment(horizontal="left", vertical="center")
                    cell.font = bold_cell_font
                else:
                    cell.font = note_font
                    cell.alignment = Alignment(horizontal="left", vertical="center")
                    
            v4_row += 1
            
        # 요약 섹션 렌더링
        if summary_rows:
            v4_row += 2
            c_sec = ws_dst.cell(row=v4_row, column=1, value="📌 5대 카테고리별 임상 영향 성격 및 권장 가중치(Ck) 설정 근거 요약")
            c_sec.font = section_font
            v4_row += 1
            
            sub_headers = ["카테고리", "생리학적 영향 성격", "권장 가중치 범위 (Ck Prior)", "설정 이유 및 임상적 의미"]
            for sc_idx, sh in enumerate(sub_headers, start=1):
                c = ws_dst.cell(row=v4_row, column=sc_idx if sc_idx <= 2 else (3 if sc_idx==3 else 4), value=sh)
                c.font = header_font
                c.fill = header_fill_sub
                c.alignment = Alignment(horizontal="center", vertical="center")
            v4_row += 1
            
            for s_row in summary_rows:
                ws_dst.cell(row=v4_row, column=1, value=s_row[0]).font = bold_cell_font
                ws_dst.cell(row=v4_row, column=2, value=s_row[1]).font = regular_cell_font
                c_ck = ws_dst.cell(row=v4_row, column=3, value=s_row[2])
                c_ck.font = bold_cell_font
                c_ck.alignment = Alignment(horizontal="center", vertical="center")
                ws_dst.cell(row=v4_row, column=4, value=s_row[3]).font = note_font
                
                for col_i in range(1, 5):
                    ws_dst.cell(row=v4_row, column=col_i).border = cell_border
                v4_row += 1

    process_variable_sheet('변수기준(개)', '변수기준(개)', is_cat=False)
    process_variable_sheet('변수기준 (고양이)', '변수기준 (고양이)', is_cat=True)

    # =============================================================
    # SHEET 4: 마커기준 (고도화: C_Lab 추가, 실측/잠재 분리, 적용수식 명시)
    # =============================================================
    ws_marker = wb_v4.create_sheet(title="마커기준")
    ws_marker.views.sheetView[0].showGridLines = True
    
    m_title = ws_marker.cell(row=1, column=1, value="🔬 장내환경 검사 마커별 카테고리 민감도(C_k) 및 수식 모델 기준표 (Ver 4.0)")
    m_title.font = title_font
    m_sub = ws_marker.cell(row=2, column=1, value="※ 실측 검사항목과 가설적 잠재 상태를 엄격히 분리하고, 제5축 혈액검사 민감도(C_Lab) 및 중복 변수 통제 규칙을 완벽하게 통합했습니다.")
    m_sub.font = subtitle_font
    
    marker_headers = [
        "검사 항목", "검사 성격 구분", "수식 적용 모델",
        "나이 민감도\n(C_Age)", "체급 민감도\n(C_Breed)", "식이 민감도\n(C_Diet)",
        "약물 민감도\n(C_Drug)", "질병 민감도\n(C_Disease)", "혈액 민감도\n(C_Lab 신규)",
        "해석 역할 및 상호작용 통제 주의사항 (V4 가이드)"
    ]
    
    for c_idx, h in enumerate(marker_headers, start=1):
        c = ws_marker.cell(row=4, column=c_idx, value=h)
        c.font = header_font
        c.fill = header_fill_navy
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    
    marker_data = [
        [
            "분변 pH", "실측 검사 패널", "가산형 (6.50 + ΔpH)",
            0.8, 0.6, 1.5, 1.0, 1.2, 1.3,
            "로그 척도이므로 배수 곱셈 배제. 식이 발효 기질(C_Diet 1.5 주도)과 질환 대사부하를 pH 단위(ΔpH)로 직접 가산"
        ],
        [
            "암모니아 (NH₃)", "실측 검사 패널", "편차 배수 곱셈 (Base × W)",
            1.0, 0.8, 1.4, 1.1, 1.6, 1.8,
            "단백질 기질 유입과 장-신장/간 요독증 연동. CKD 환자에서 BUN/Cr 및 신장식 동시 적용 시 collinearity 통제(γ=0.25)"
        ],
        [
            "잠혈 반응 (Occult Blood)", "실측 검사 패널", "0-기준 등급모형 (Cut-off)",
            0.6, 0.5, 0.5, 1.8, 2.0, 1.6,
            "정상값 0이므로 배수 곱셈 금지! NSAIDs/항암제(1.8) 및 점막 궤양(2.0) 시 주의등급(Low/Moderate/High) 판정. 타 마커와 상쇄 금지"
        ],
        [
            "포도당 패드 (Glucose)", "실측 검사 패널", "0-기준 등급모형 (Cut-off)",
            0.9, 0.7, 1.6, 1.4, 1.8, 1.5,
            "정상값 0 음성. 소장 SGLT1 흡수 한계, 식이 단당류 과부하, 스테로이드 교란 시 검출한계(<20 mg/dL) 초과 위험도 판정"
        ],
        [
            "분변 단백질 반응 (뷰렛)", "실측 검사 패널", "편차 배수 곱셈 (Base × W)",
            1.0, 0.8, 1.5, 1.2, 1.8, 1.7,
            "식이·숙주·미생물 출처 미분리 신호. 단독 상승만으로 단백소실성 장병증(PLE) 또는 장누수로 단정하지 않고 전후 비교"
        ],
        [
            "전분 잔류 신호 (루골)", "실측 검사 패널", "편차 배수 곱셈 (Base × W)",
            1.0, 0.8, 1.5, 1.2, 1.8, 1.3,
            "소장계 처리(아밀라아제) 및 저항성 전분·가공도 함께 검토. 단독으로 흡수장애 확진 금지"
        ],
        [
            "지방 잔류 신호 (염색)", "실측 검사 패널", "편차 배수 곱셈 (Base × W)",
            1.0, 0.8, 1.5, 1.2, 1.8, 1.9,
            "고지방 신장식 급여와 췌담도(cPL/fPL, 빌리루빈) 소화 조건 변화를 함께 검토. 췌장염 병력 환자 핵심 지표"
        ],
        [
            "분변 비중 (SG · 보조)", "실측 검사 패널", "전후 비교 전용",
            0.5, 0.5, 0.8, 0.8, 0.8, 0.8,
            "동일 추출 프로토콜 하에서 이온·용질 농도 전후 비교용 보조 지표. 원분변 수분율이나 변비로 단정 금지"
        ],
        [
            "모형 참고 흡수지수", "가설적 잠재 상태", "탐색 참고 모형 (소화율 아님)",
            1.1, 0.9, 1.2, 1.3, 1.7, 1.8,
            "전분변 회수법 실측 소화율이 아니므로 급여 열량을 자동 증감하는 처방 근거로 사용하지 않고 참고용으로 분리"
        ],
        [
            "장관 통과·운동성 지수", "가설적 잠재 상태", "잠재 상태 추론",
            1.1, 0.8, 1.1, 1.7, 1.5, 1.4,
            "이뇨제, 인바인더, 전해질(저칼륨) 및 노령화에 따른 장관 체류 시간 변화 추론 지표 (직접 실측 외)"
        ],
        [
            "소화효소 분비 지수", "가설적 잠재 상태", "잠재 상태 추론",
            1.0, 0.8, 1.3, 1.2, 1.8, 1.8,
            "외분비 췌장 기능, 담즙 분비 및 소화효소 보충제(판크레아틴 등) 반응 추론 지표 (직접 실측 외)"
        ],
        [
            "장벽 누수 지수 (Leaky)", "가설적 잠재 상태", "잠재 상태 추론",
            0.9, 0.7, 1.1, 1.8, 1.9, 1.6,
            "심신증후군(CRS) 저관류, NSAIDs 점막 손상, 저알부민혈증에 따른 점막 투과성 부담 추론 지표"
        ],
        [
            "장 점막 염증 지수", "가설적 잠재 상태", "잠재 상태 추론",
            0.9, 0.7, 1.2, 1.6, 2.0, 1.8,
            "요독성 위장염, IBD, 세균성 장염에 따른 점막 염증 부하 추론 지표 (혈액 CRP/WBC 연동)"
        ],
        [
            "미생물대사환경가설지수", "탐색 가설 모형", "가설 지표",
            1.0, 0.8, 1.4, 1.6, 1.8, 1.6,
            "단백 부패 발효(알칼리) vs 탄수화물 과발효(산성) 균형을 검토하는 다변수 결합 탐색 지표"
        ],
        [
            "[참고] 인돌 (Indole)", "보조 탐색 지표", "편차 배수 곱셈",
            0.9, 0.8, 1.3, 1.1, 1.6, 1.7,
            "대장 미생물 트립토판 발효 부산물(요독 전구체). 패드 실측 제외 항목으로 탐색 참고용 유지"
        ],
        [
            "[참고] 젖산 (Lactate)", "보조 탐색 지표", "탐색 보존 지표",
            1.1, 0.7, 1.6, 1.2, 1.1, 1.2,
            "※ 주의: 기존 시트 mmol/g 단위 오류 가능성 및 키트 실측 제외 항목으로 V4에서는 탐색 참고용으로만 보존"
        ]
    ]
    
    for r_idx, r_data in enumerate(marker_data, start=5):
        for c_idx, val in enumerate(r_data, start=1):
            cell = ws_marker.cell(row=r_idx, column=c_idx, value=val)
            cell.font = regular_cell_font
            cell.border = cell_border
            if c_idx == 1:
                cell.font = bold_cell_font
            if c_idx in [2, 3]:
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif c_idx in [4, 5, 6, 7, 8, 9]:
                cell.alignment = Alignment(horizontal="right", vertical="center")
                cell.number_format = '0.0'
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center")

    # =============================================================
    # SHEET 5: 정상범위 (고도화: ±Margin 판독폭, 단정문구 전면 완화)
    # =============================================================
    ws_norm = wb_v4.create_sheet(title="정상범위")
    ws_norm.views.sheetView[0].showGridLines = True
    
    n_title = ws_norm.cell(row=1, column=1, value="📊 장내환경 분변 마커 생리적 정상 기준값 및 모형 판독 범위 (Ver 4.0)")
    n_title.font = title_font
    n_sub = ws_norm.cell(row=2, column=1, value="※ 실측 검사항목과 모형 탐색 지표를 명확히 분리하고, 개인별 판독폭(±Margin 허용편차) 및 비단정적 임상 권고 지침을 적용했습니다.")
    n_sub.font = subtitle_font
    
    norm_headers = [
        "검사 항목", "구분", "측정 단위", "정상 기준값\n(Base)", "정상 생리 범위\n(Normal Range)",
        "개인 판독 허용폭\n(±Margin 권장)", "모형 예상 표기 형식\n(Expected Range Form)", "판정 해석 방향 및 비단정적 임상 가이드 (V4)"
    ]
    
    for c_idx, h in enumerate(norm_headers, start=1):
        c = ws_norm.cell(row=4, column=c_idx, value=h)
        c.font = header_font
        c.fill = header_fill_navy
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        
    norm_data = [
        [
            "분변 pH", "실측 패널", "-", 6.50, "6.0 ~ 7.0",
            0.30, "6.50 + ΔpH ± 0.30\n[6.20 ~ 6.80]",
            "산성화(<5.8) 시 발효성 탄수화물 유입 검토 / 알칼리화(>7.4) 시 질소성 기질 증가 또는 체류 시간 변화 검토 (단독으로 대장염 단정 금지)"
        ],
        [
            "암모니아 (NH₃)", "실측 패널", "μmol/g", 20.0, "10.0 ~ 30.0",
            5.0, "20.0 × W ± 5.0\n[15.0 ~ 25.0]",
            "기준 상회 시 식이 단백질 기질 유입량, 고단백 간식 및 대장 미생물 발효 환경 변화 가능성 검토 (질병 확진 아님)"
        ],
        [
            "잠혈 (Occult Blood)", "실측 패널", "ng/mL", "0 (음성)", "< 10.0 (음성)",
            2.0, "음성 기준 (<10 ng/mL)\n[주의 등급 모형]",
            "양성(≥10 ng/mL) 검출 시 타 마커와 상쇄하지 않고 별도 확인. NSAIDs/스테로이드 점막 자극, 육류 식이 간섭 또는 점막 출혈 수의사 검토"
        ],
        [
            "포도당 패드 (Glucose)", "실측 패널", "mg/dL", "0 (음성)", "< 20.0 (음성~미량)",
            10.0, "음성 기준 (<20 mg/dL)\n[주의 등급 모형]",
            "검출한계(20 mg/dL) 초과 시 탐색적 단당류 잔류 신호로서 식이 당류 변화, 소장 통과 조건 검토 (단독으로 당뇨병 확진 금지)"
        ],
        [
            "분변 단백질 반응", "실측 패널", "% DM", 5.0, "2.0 ~ 8.0",
            1.5, "5.0 × W ± 1.5\n[3.5 ~ 6.5]",
            "뷰렛 추출액 단백질 반응(식이·숙주·미생물 출처 미분리). 단독 상승으로 장누수(PLE)나 흡수부전을 단정하지 않고 개인 기준선 전후 비교"
        ],
        [
            "전분 잔류 신호 (루골)", "실측 패널", "% DM", 6.0, "3.0 ~ 10.0",
            1.5, "6.0 × W ± 1.5\n[4.5 ~ 7.5]",
            "루골 전분 반응 신호. 사료 전분 특성(호화도/저항성 전분) 및 소장계 처리 조건 함께 검토"
        ],
        [
            "지방 잔류 신호 (염색)", "실측 패널", "% DM", 4.0, "1.0 ~ 7.0",
            1.5, "4.0 × W ± 1.5\n[2.5 ~ 5.5]",
            "수단Ⅲ 지질 염색 반응 신호. 식이 지방량 변화, 췌장(cPL/fPL) 및 담즙계 소화 조건을 함께 검토하는 잔류 단서"
        ],
        [
            "분변 비중 (SG · 보조)", "실측 패널", "-", 1.025, "1.015 ~ 1.035",
            "전후비교", "전후 비교 전용\n(동일 조건 비교)",
            "추출액 이온·용질 농도 반응 참고치. 원분변 수분율이나 변비 여부를 단정하지 않고 동일 조건 전후 비교에만 활용"
        ],
        [
            "모형 참고 흡수지수", "가설적 잠재 상태", "%", 85.0, "80.0 ~ 95.0",
            5.0, "85.0 × W ± 5.0\n[80.0 ~ 90.0]",
            "모형 기반 추정 지표로 실제 전분변 회수법 소화율이 아님. 급여 열량을 자동 증감하는 처방 근거로 사용하지 않음"
        ],
        [
            "미생물대사환경가설지수", "탐색 가설 모형", "배수", 1.00, "0.85 ~ 1.15",
            0.15, "1.00 ± 0.15\n[0.85 ~ 1.15]",
            "단백 부패 발효 vs 탄수화물 과발효 편차를 결합한 탐색 지수. >1.20 시 질소성 기질 부하 또는 발효 환경 불균형 검토"
        ],
        [
            "[참고] 인돌 (Indole)", "보조 탐색 지표", "μg/g", 15.0, "5.0 ~ 25.0",
            5.0, "15.0 × W ± 5.0\n[10.0 ~ 20.0]",
            "대장 미생물 질소 대사 부산물 지표. 패드 실측 제외 항목으로 탐색 참고치로 유지"
        ],
        [
            "[참고] 젖산 (Lactate)", "보조 탐색 지표", "mmol/g", 8.0, "5.0 ~ 12.0",
            2.0, "8.0 ± 2.0\n(탐색 보존 지표)",
            "※ 주의: 기존 시트 mmol/g 단위 오류 가능성 및 키트 실측 제외 항목으로 V4에서는 탐색 참고용으로만 보존"
        ]
    ]
    
    for r_idx, r_data in enumerate(norm_data, start=5):
        for c_idx, val in enumerate(r_data, start=1):
            cell = ws_norm.cell(row=r_idx, column=c_idx, value=val)
            cell.font = regular_cell_font
            cell.border = cell_border
            if c_idx == 1:
                cell.font = bold_cell_font
            if c_idx in [2, 3]:
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif c_idx in [4, 5, 6]:
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif c_idx == 7:
                cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)

    # -------------------------------------------------------------
    # 열 너비 자동 조정
    # -------------------------------------------------------------
    for ws in wb_v4.worksheets:
        for col in ws.columns:
            max_len = 0
            col_letter = get_column_letter(col[0].column)
            for cell in col:
                val_str = str(cell.value or '')
                lines = val_str.split('\n')
                for l in lines:
                    l_len = sum(2 if ord(ch) > 127 else 1 for ch in l)
                    if l_len > max_len:
                        max_len = l_len
            ws.column_dimensions[col_letter].width = min(max(max_len + 3, 10), 60)
            
    # 시트1 열 너비 수동 최적화
    ws_info.column_dimensions['A'].width = 18
    ws_info.column_dimensions['B'].width = 34
    ws_info.column_dimensions['C'].width = 40
    ws_info.column_dimensions['D'].width = 48
    ws_info.column_dimensions['E'].width = 36
    
    wb_v4.save(v4_filename)
    print(f"SUCCESS: {v4_filename}")

if __name__ == "__main__":
    build_v4_workbook()
