"""
Flask Backend Web Server & REST API for Prescription Diet Recommendation System.
Includes Bioavailability & Fecal Kit AI Calibration Engine.
"""
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_from_directory
import os
import sys
import hashlib

# Ensure core modules can be imported
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Auto-load .env for local credentials
def _load_env_if_needed():
    env_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        if k.strip() not in os.environ:
                            os.environ[k.strip()] = v.strip()
        except Exception:
            pass

_load_env_if_needed()

from core.models import (
    Species, Gender, MuscleConditionScore, PatientProfile, FeedingMode,
    UltrasoundFindings, FecalKitResult
)
from core.data_loader import get_data_loader
from core.energy_calculator import EnergyCalculator
from core.nutrition_rules import NutritionRulesEngine, DISEASE_GUIDELINES
from core.absorption_model import BioavailabilityEngine, AbsorptionModel
from core.water_requirement import WaterCalculator
from core.optimizer import MixFeedingOptimizer
from core.monitoring import SymptomLog, BloodLabTest, MonitoringEngine

app = Flask(__name__, template_folder="templates", static_folder="static")
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "vet-mixfeeding-auth-secret-key-2026")

# 비공개 승인 인증 정보 (코드에 평문 비밀번호를 절대 남기지 않고 단방향 해시로 검증)
EXPECTED_USER = os.environ.get("SITE_USERNAME", "vet")
EXPECTED_PW_HASH = "968fb906ea88477e067a827ad14efe23d5813f09947ffe70507a8a154ebad5a4"

def verify_credentials(user: str, pwd: str) -> bool:
    if user != EXPECTED_USER:
        return False
    env_pw = os.environ.get("SITE_PASSWORD")
    if env_pw:
        return pwd == env_pw
    return hashlib.sha256(pwd.encode()).hexdigest() == EXPECTED_PW_HASH

@app.before_request
def require_login():
    return None

@app.route('/login', methods=['GET', 'POST'])
def login():
    return redirect(url_for('index'))

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

loader = get_data_loader()
optimizer = MixFeedingOptimizer(loader)

@app.route('/')
def index():
    root_dir = os.path.abspath(os.path.dirname(__file__))
    return send_from_directory(root_dir, 'index.html')

@app.route('/api/diseases', methods=['GET'])
def get_diseases():
    return jsonify({
        "diseases": list(DISEASE_GUIDELINES.keys()),
        "guidelines": DISEASE_GUIDELINES
    })

@app.route('/api/diets', methods=['GET'])
def get_diets():
    species_str = request.args.get('species', '개')
    sp = Species.DOG if species_str == '개' else Species.CAT
    diets = loader.get_diets(sp)
    
    return jsonify({
        "total": len(diets),
        "diets": [
            {
                "id": d.id,
                "company": d.company,
                "name": d.name,
                "type": d.type,
                "indications": d.indications,
                "protein_sources": d.protein_sources,
                "nutrients": {
                    "protein_g": d.nutrients.protein_g,
                    "fat_g": d.nutrients.fat_g,
                    "carb_g": d.nutrients.carb_g,
                    "phosphorus_g": d.nutrients.phosphorus_g,
                    "sodium_g": d.nutrients.sodium_g,
                    "copper_mg": d.nutrients.copper_mg,
                    "epa_dha_g": d.nutrients.epa_dha_g
                }
            }
            for d in diets
        ]
    })

@app.route('/api/recommend', methods=['POST'])
def recommend_diet():
    data = request.json or {}
    
    species_val = Species.DOG if data.get('species') == '개' else Species.CAT
    
    gender_map = {
        "수컷 (중성화 안함)": Gender.INTACT_MALE,
        "수컷 (중성화 완료)": Gender.NEUTERED_MALE,
        "암컷 (중성화 안함)": Gender.INTACT_FEMALE,
        "암컷 (중성화 완료)": Gender.NEUTERED_FEMALE
    }
    gender_val = gender_map.get(data.get('gender', ''), Gender.NEUTERED_MALE)
    
    mcs_map = {
        "정상 (Normal)": MuscleConditionScore.NORMAL,
        "경도 근감소 (Mild Loss)": MuscleConditionScore.MILD,
        "중등도 근감소 (Moderate Loss)": MuscleConditionScore.MODERATE,
        "중증 근감소 (Severe Loss)": MuscleConditionScore.SEVERE
    }
    mcs_val = mcs_map.get(data.get('mcs', ''), MuscleConditionScore.NORMAL)
    
    mode_map = {
        "DRY_WET_FRESH": FeedingMode.DRY_WET_FRESH,
        "DRY_WET": FeedingMode.DRY_WET,
        "DRY_DRY": FeedingMode.DRY_DRY,
        "FRESH_ONLY": FeedingMode.FRESH_ONLY,
        "DRY_ONLY": FeedingMode.DRY_ONLY,
        "WET_ONLY": FeedingMode.WET_ONLY
    }
    feeding_mode = mode_map.get(data.get('feeding_mode', 'DRY_WET_FRESH'), FeedingMode.DRY_WET_FRESH)

    profile = PatientProfile(
        name=data.get('name', '환자'),
        species=species_val,
        weight_kg=float(data.get('weight_kg', 5.0) or 5.0),
        age_years=float(data.get('age_years', 5.0) or 5.0),
        gender=gender_val,
        breed=data.get('breed', '믹스견'),
        bcs=int(data.get('bcs', 5) or 5),
        mcs=mcs_val,
        activity_level=data.get('activity_level', '보통'),
        allergies=data.get('allergies', []),
        fecal_score=float(data.get('fecal_score', 3.5) or 3.5),
        eating_habit=data.get('eating_habit', '정상'),
        diseases=data.get('diseases', []),
        custom_der_factor=float(data.get('custom_der_factor')) if data.get('custom_der_factor') else None,
        target_weight_kg=float(data.get('target_weight_kg')) if data.get('target_weight_kg') else None
    )

    custom_ratios = data.get('custom_ratios')

    # Optional Ultrasound and Lab
    us_data = data.get('ultrasound')
    us = None
    if us_data:
        us = UltrasoundFindings(
            wall_thickness_mm=float(us_data.get('wall_thickness_mm', 2.5) or 2.5),
            loss_of_layering=us_data.get('loss_of_layering', '정상 (Normal)'),
            mucosal_hyperechoic=bool(us_data.get('mucosal_hyperechoic', False))
        )

    lab_data = data.get('lab')
    lab = None
    if lab_data:
        lab = BloodLabTest(
            bun_mg_dl=float(lab_data['bun']) if lab_data.get('bun') else None,
            creatinine_mg_dl=float(lab_data['creatinine']) if lab_data.get('creatinine') else None,
            sdma_ug_dl=float(lab_data['sdma']) if lab_data.get('sdma') else None,
            phosphorus_mg_dl=float(lab_data['phosphorus']) if lab_data.get('phosphorus') else None,
            albumin_g_dl=float(lab_data['albumin']) if lab_data.get('albumin') else None,
            lipase_or_cpl=float(lab_data['lipase_or_cpl']) if lab_data.get('lipase_or_cpl') else None,
            alt_u_l=float(lab_data['alt']) if lab_data.get('alt') else None,
            potassium_mmol_l=float(lab_data['potassium']) if lab_data.get('potassium') else None
        )

    # Prior Estimation
    prior_res = BioavailabilityEngine.estimate_a_priori(profile, us, lab)

    # Run Mix Optimization
    energy_res = EnergyCalculator.calculate_energy(profile)
    mix_res = optimizer.optimize_mix(profile, feeding_mode, custom_ratios)

    items_json = [
        {
            "name": item.name,
            "company": item.company_or_category,
            "type": item.feed_type,
            "ratio_percent": item.ratio_percent,
            "daily_calories_kcal": item.daily_calories,
            "daily_amount_g": item.daily_amount_g,
            "per_meal_g_bid": round(item.daily_amount_g / 2.0, 1),
            "per_meal_g_tid": round(item.daily_amount_g / 3.0, 1),
            "water_content_ml": item.water_content_ml
        }
        for item in mix_res.items
    ]

    dm_nutrients = mix_res.blended_nutrients.to_dm_percent()

    supplements_json = [
        {
            "name": s.name,
            "company": s.company,
            "tablet_size": s.tablet_size,
            "daily_dosage": s.daily_dosage,
            "target_disease_or_age": s.target_disease_or_age,
            "key_functional_components": s.key_functional_components,
            "clinical_synergy_reason": s.clinical_synergy_reason
        }
        for s in mix_res.recommended_supplements
    ]

    return jsonify({
        "patient": {
            "name": profile.name,
            "species": profile.species.value,
            "weight_kg": profile.weight_kg,
            "ideal_weight_kg": energy_res["ideal_weight_kg"],
            "target_weight_kg": energy_res["target_weight_kg"],
            "rer_kcal": energy_res["rer_kcal"],
            "der_factor": energy_res["der_factor"],
            "der_factor_reason": energy_res["der_factor_reason"],
            "der_kcal": energy_res["der_kcal"],
            "adjusted_der_kcal": mix_res.adjusted_der_kcal
        },
        "prior_bioavailability": prior_res,
        "absorption": {
            "absorption_percent": prior_res["prior_overall_absorb_pct"],
            "fecal_desc": f"Score {profile.fecal_score}"
        },
        "feeding_plan": {
            "mode": feeding_mode.value,
            "total_daily_g": mix_res.total_daily_g,
            "total_calories_kcal": mix_res.adjusted_der_kcal,
            "items": items_json
        },
        "recommended_supplements": supplements_json,
        "water_analysis": {
            "daily_target_water_ml": mix_res.daily_water_target_ml,
            "water_from_diet_ml": mix_res.total_water_from_diet_ml,
            "additional_water_needed_ml": mix_res.additional_water_needed_ml,
            "coverage_pct": round((mix_res.total_water_from_diet_ml / max(1.0, mix_res.daily_water_target_ml)) * 100, 1)
        },
        "nutrients_blended": {
            "per_1000kcal": {
                "protein_g": round(mix_res.blended_nutrients.protein_g, 1),
                "fat_g": round(mix_res.blended_nutrients.fat_g, 1),
                "carb_g": round(mix_res.blended_nutrients.carb_g, 1),
                "fiber_g": round(mix_res.blended_nutrients.fiber_g, 1),
                "calcium_g": round(mix_res.blended_nutrients.calcium_g, 2),
                "phosphorus_g": round(mix_res.blended_nutrients.phosphorus_g, 2),
                "sodium_g": round(mix_res.blended_nutrients.sodium_g, 2),
                "potassium_g": round(mix_res.blended_nutrients.potassium_g, 2),
                "copper_mg": round(mix_res.blended_nutrients.copper_mg, 2),
                "zinc_mg": round(mix_res.blended_nutrients.zinc_mg, 1),
                "epa_dha_g": round(mix_res.blended_nutrients.epa_dha_g, 2),
                "taurine_g": round(mix_res.blended_nutrients.taurine_g, 2)
            },
            "energy_ratios": dm_nutrients
        },
        "compliance": mix_res.constraint_compliance,
        "clinical_notes": mix_res.clinical_notes
    })

@app.route('/api/fecal-kit/calibrate', methods=['POST'])
def calibrate_fecal_kit():
    data = request.json or {}
    prior = data.get('prior', {
        "prior_protein_absorb_pct": 82.0,
        "prior_fat_absorb_pct": 90.0,
        "prior_carb_absorb_pct": 95.0,
        "prior_overall_absorb_pct": 85.0,
        "gut_barrier_intact_pct": 90.0
    })

    kit_raw = data.get('fecal_kit', {})
    fecal_kit = FecalKitResult(
        fecal_ph=float(kit_raw.get('fecal_ph', 6.8) or 6.8),
        fecal_ammonia=kit_raw.get('fecal_ammonia', '정상'),
        fecal_fat=kit_raw.get('fecal_fat', '음성 (0)'),
        fecal_occult_blood=kit_raw.get('fecal_occult_blood', '음성 (-)'),
        fecal_phosphate=kit_raw.get('fecal_phosphate', '보통 (Normal)')
    )

    lab_raw = data.get('lab', {})
    lab = BloodLabTest(
        phosphorus_mg_dl=float(lab_raw['phosphorus']) if lab_raw.get('phosphorus') else None,
        bun_mg_dl=float(lab_raw['bun']) if lab_raw.get('bun') else None,
        creatinine_mg_dl=float(lab_raw['creatinine']) if lab_raw.get('creatinine') else None,
        albumin_g_dl=float(lab_raw['albumin']) if lab_raw.get('albumin') else None,
        lipase_or_cpl=float(lab_raw['lipase_or_cpl']) if lab_raw.get('lipase_or_cpl') else None
    )

    diseases = data.get('diseases', [])
    base_der = float(data.get('base_der_kcal', 350.0) or 350.0)
    base_g = float(data.get('base_total_g', 200.0) or 200.0)

    cal_res = BioavailabilityEngine.calibrate_with_fecal_kit(
        prior=prior,
        fecal_kit=fecal_kit,
        lab=lab,
        diseases=diseases,
        base_der_kcal=base_der,
        base_total_g=base_g
    )

    return jsonify({
        "prior": {
            "protein_pct": cal_res.prior_protein_absorb_pct,
            "fat_pct": cal_res.prior_fat_absorb_pct,
            "carb_pct": cal_res.prior_carb_absorb_pct,
            "overall_pct": cal_res.prior_overall_absorb_pct
        },
        "calibrated": {
            "protein_pct": cal_res.calibrated_protein_absorb_pct,
            "fat_pct": cal_res.calibrated_fat_absorb_pct,
            "carb_pct": cal_res.calibrated_carb_absorb_pct,
            "overall_pct": cal_res.calibrated_overall_absorb_pct,
            "phosphorus_risk_level": cal_res.phosphorus_risk_level,
            "gut_barrier_intact_pct": cal_res.gut_barrier_intact_pct,
            "recalculated_der_kcal": cal_res.recalculated_der_kcal,
            "recalculated_total_g": cal_res.recalculated_total_g
        },
        "tuning_log": cal_res.tuning_log,
        "clinical_actions": cal_res.clinical_actions
    })

@app.route('/api/monitoring/evaluate', methods=['POST'])
def evaluate_monitoring():
    data = request.json or {}
    logs_raw = data.get('logs', [])
    logs = []
    for l in logs_raw:
        logs.append(SymptomLog(
            log_date=l.get('date', ''),
            weight_kg=float(l.get('weight_kg', 5.0) or 5.0),
            fecal_score=float(l.get('fecal_score', 3.5) or 3.5),
            vomiting_count=int(l.get('vomiting_count', 0) or 0),
            leftover_percent=float(l.get('leftover_percent', 0) or 0),
            water_intake_ml=float(l.get('water_intake_ml', 200) or 200),
            vitality_score=int(l.get('vitality_score', 5) or 5),
            notes=l.get('notes', '')
        ))
    result = MonitoringEngine.evaluate_symptom_trend(logs)
    return jsonify(result)

@app.route('/api/lab/evaluate', methods=['POST'])
def evaluate_lab():
    data = request.json or {}
    lab = BloodLabTest(
        bun_mg_dl=float(data.get('bun')) if data.get('bun') else None,
        creatinine_mg_dl=float(data.get('creatinine')) if data.get('creatinine') else None,
        sdma_ug_dl=float(data.get('sdma')) if data.get('sdma') else None,
        phosphorus_mg_dl=float(data.get('phosphorus')) if data.get('phosphorus') else None,
        albumin_g_dl=float(data.get('albumin')) if data.get('albumin') else None,
        alt_u_l=float(data.get('alt')) if data.get('alt') else None,
        alkp_u_l=float(data.get('alkp')) if data.get('alkp') else None,
        lipase_or_cpl=float(data.get('lipase_or_cpl')) if data.get('lipase_or_cpl') else None,
        sodium_mmol_l=float(data.get('sodium')) if data.get('sodium') else None,
        potassium_mmol_l=float(data.get('potassium')) if data.get('potassium') else None
    )
    result = MonitoringEngine.evaluate_blood_lab(lab)
    return jsonify(result)

from core.gut_cdss import (
    GutEnvironmentCDSS, DIET_NUTRIENT_WEIGHTS, DIET_FORM_WEIGHTS,
    DRUG_WEIGHTS, DISEASE_WEIGHTS
)

gut_cdss_engine = GutEnvironmentCDSS(attenuation_alpha=0.40)
from core.nutrition_consultant import NutritionConsultantService
from core.fecal_vision import FecalKitVisionParser
from core.smart_chart_parser import SmartChartParser
from core.feed_ocr import FeedOCRParser
from core.custom_mix_simulation import CustomMixSimulator
import base64

feed_ocr_parser = FeedOCRParser()
smart_chart_parser = SmartChartParser()
fecal_vision_parser = FecalKitVisionParser()
nutrition_consultant_service = NutritionConsultantService()

@app.route('/api/consult/guardian', methods=['POST'])
def consult_guardian():
    """
    보호자용 AI 영양 코치 상담 엔드포인트.
    """
    data = request.json or {}
    question = data.get('question', '').strip()
    context = data.get('context', {})
    if not question:
        return jsonify({"success": False, "error": "질문 내용을 입력해주세요."}), 400

    result = nutrition_consultant_service.consult_guardian(question, context)
    return jsonify(result)

@app.route('/api/consult/vet', methods=['POST'])
def consult_vet_cdss():
    """
    수의사용 임상 영양학 CDSS 및 문헌(SACN, NRC, IRIS) 근거 검색 엔드포인트.
    """
    data = request.json or {}
    question = data.get('question', '').strip()
    context = data.get('context', {})
    if not question:
        return jsonify({"success": False, "error": "임상 질의를 입력해주세요."}), 400

    result = nutrition_consultant_service.consult_vet_cdss(question, context)
    return jsonify(result)


@app.route('/api/fecal-kit/analyze', methods=['POST'])
def analyze_fecal_kit_image():
    """
    분변키트 마커 종이패드 사진 업로드 및 색분해 장내환경 판독 엔드포인트.
    """
    image_bytes = None
    mime_type = "image/jpeg"

    if 'file' in request.files:
        uploaded_file = request.files['file']
        image_bytes = uploaded_file.read()
        mime_type = uploaded_file.mimetype or "image/jpeg"
    elif request.is_json:
        req_data = request.json or {}
        b64_str = req_data.get('image_base64', '')
        if ',' in b64_str:
            header, b64_str = b64_str.split(',', 1)
            if 'image/png' in header:
                mime_type = 'image/png'
            elif 'image/webp' in header:
                mime_type = 'image/webp'
        if b64_str:
            try:
                image_bytes = base64.b64decode(b64_str)
            except Exception as e:
                return jsonify({"success": False, "error": f"Base64 디코딩 실패: {str(e)}"}), 400

    if not image_bytes:
        return jsonify({"success": False, "error": "분변키트 이미지 데이터가 없습니다."}), 400

    analysis_res = fecal_vision_parser.parse_from_image_bytes(image_bytes, mime_type=mime_type)
    if not analysis_res.get("success"):
        return jsonify(analysis_res), 400

    # CDSS 엔진과 즉시 연동 (장내환경 종합 평가)
    markers = analysis_res.get("markers", {})
    age_years = float(request.form.get('age_years') or 11.0)
    weight_kg = float(request.form.get('weight_kg') or 5.0)

    try:
        baseline = gut_cdss_engine.compute_expected_baseline(
            age_years=age_years,
            weight_kg=weight_kg,
            diet_weights_with_ratios=[],
            selected_drugs=[],
            selected_diseases=[]
        )
        evaluation = gut_cdss_engine.evaluate_and_attribute(
            measurements=markers,
            baseline_result=baseline,
            selected_drugs=[],
            selected_diseases=[]
        )
        analysis_res["cdss_baseline"] = baseline
        analysis_res["cdss_evaluation"] = evaluation
    except Exception as e:
        analysis_res["cdss_error"] = str(e)

    return jsonify(analysis_res)


@app.route('/api/chart/parse', methods=['POST'])
def parse_clinical_chart():
    """
    수의사 자연어 진료 기록(SOAP / 임상 노트) 파싱 및 계산기 파라미터 자동 추출 엔드포인트.
    """
    data = request.json or {}
    text = data.get('text', '').strip()
    if not text:
        return jsonify({"success": False, "error": "진료 기록 텍스트를 입력해주세요."}), 400

    result = smart_chart_parser.parse_text(text)
    return jsonify(result)


@app.route('/api/ocr/feed', methods=['POST'])
def ocr_feed_label():
    image_bytes = None
    mime_type = 'image/jpeg'

    if 'file' in request.files:
        uploaded_file = request.files['file']
        image_bytes = uploaded_file.read()
        mime_type = uploaded_file.mimetype or 'image/jpeg'
    elif request.is_json:
        req_data = request.json or {}
        b64_str = req_data.get('image_base64', '')
        if ',' in b64_str:
            header, b64_str = b64_str.split(',', 1)
            if 'image/png' in header:
                mime_type = 'image/png'
            elif 'image/webp' in header:
                mime_type = 'image/webp'
        if b64_str:
            try:
                image_bytes = base64.b64decode(b64_str)
            except Exception as e:
                return jsonify({'success': False, 'error': f'Base64 디코딩 실패: {str(e)}'}), 400

    if not image_bytes:
        return jsonify({'success': False, 'error': '업로드된 이미지 파일 또는 base64 데이터가 없습니다.'}), 400

    result = feed_ocr_parser.parse_from_image_bytes(image_bytes, mime_type=mime_type)
    return jsonify(result)

@app.route('/api/simulate-custom-mix', methods=['POST'])
def simulate_custom_mix():
    data = request.json or {}
    patient_data = data.get('patient', {})
    feeds_data = data.get('feeds', [])

    species_val = Species.DOG if patient_data.get('species') == '개' else Species.CAT
    patient = PatientProfile(
        name=patient_data.get('name', '반려동물'),
        species=species_val,
        weight_kg=float(patient_data.get('weight_kg', 5.0) or 5.0),
        age_years=float(patient_data.get('age_years', 5.0) or 5.0),
        bcs=int(patient_data.get('bcs', 5) or 5),
        diseases=patient_data.get('diseases', []),
        activity_level=patient_data.get('activity_level', '보통'),
        target_weight_kg=float(patient_data.get('target_weight_kg')) if patient_data.get('target_weight_kg') else None
    )

    simulation_result = CustomMixSimulator.simulate(
        patient=patient,
        feeds=feeds_data,
        ratio_mode=data.get('ratio_mode', 'CALORIE')
    )
    return jsonify(simulation_result)


@app.route('/api/gut-cdss/evaluate', methods=['POST'])
def evaluate_gut_cdss():
    data = request.json or {}
    age_years = float(data.get('age_years', 11.0) or 11.0)
    weight_kg = float(data.get('weight_kg', 5.0) or 5.0)
    selected_drugs = data.get('drugs', [])
    selected_diseases = data.get('diseases', [])
    diet_mix = data.get('diet_mix', [])  # [{"profile": "저지방사료", "ratio": 0.5}, ...]
    measurements = data.get('measurements', {})

    diet_weights_with_ratios = []
    for item in diet_mix:
        prof = item.get('profile', '중단백사료 (표준)')
        ratio = float(item.get('ratio', 1.0) or 1.0)
        w_dict = dict(DIET_NUTRIENT_WEIGHTS.get(prof, DIET_NUTRIENT_WEIGHTS['중단백사료 (표준)']))
        if item.get('is_renal_high_fat'):
            w_dict['fat'] = 1.20
        diet_weights_with_ratios.append((w_dict, ratio))

    baseline = gut_cdss_engine.compute_expected_baseline(
        age_years=age_years,
        weight_kg=weight_kg,
        diet_weights_with_ratios=diet_weights_with_ratios,
        selected_drugs=selected_drugs,
        selected_diseases=selected_diseases
    )
    evaluation = gut_cdss_engine.evaluate_and_attribute(
        measurements=measurements,
        baseline_result=baseline,
        selected_drugs=selected_drugs,
        selected_diseases=selected_diseases
    )
    return jsonify({
        "baseline": baseline,
        "evaluation": evaluation
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Prescription Diet Recommendation Server on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)

