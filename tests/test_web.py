"""
Flask Web API test suite including Fecal Kit Calibration.
"""
import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.stdout.reconfigure(encoding='utf-8')

from app import app

def run_web_tests():
    print("==================================================")
    print("  RUNNING WEB API ENDPOINT TESTS (WITH FECAL KIT)")
    print("==================================================")

    client = app.test_client()

    # 1. Main Page Test
    res = client.get('/')
    print(f"[1] GET / -> Status Code: {res.status_code}")
    assert res.status_code == 200

    # 2. POST /api/recommend Test with Ultrasound & Lab
    payload = {
        "name": "초코",
        "species": "개",
        "weight_kg": 7.2,
        "age_years": 10.0,
        "gender": "수컷 (중성화 완료)",
        "breed": "시츄",
        "bcs": 6,
        "mcs": "중등도 근감소 (Moderate Loss)",
        "eating_habit": "급하게 먹음",
        "fecal_score": 4.5,
        "allergies": ["소고기"],
        "diseases": [
            "심장병 (MMVD, DCM, HCM, 울혈성심부전)",
            "만성신부전 (CKD IRIS 1-4단계)"
        ],
        "ultrasound": {
            "wall_thickness_mm": 3.6,
            "loss_of_layering": "부분 소실",
            "mucosal_hyperechoic": False
        },
        "lab": {
            "bun": 48.0,
            "creatinine": 2.4,
            "sdma": 20.0,
            "phosphorus": 6.2,
            "albumin": 2.6
        },
        "feeding_mode": "DRY_WET_FRESH",
        "custom_ratios": {"dry": 50, "wet": 30, "fresh": 20}
    }
    res = client.post('/api/recommend', json=payload)
    print(f"[2] POST /api/recommend -> Status Code: {res.status_code}")
    assert res.status_code == 200
    rec = res.get_json()
    print(f"  - Prior Protein Absorb: {rec['prior_bioavailability']['prior_protein_absorb_pct']}%")
    print(f"  - Prior Overall Absorb: {rec['prior_bioavailability']['prior_overall_absorb_pct']}%")
    print(f"  - Gut Barrier Score: {rec['prior_bioavailability']['gut_barrier_intact_pct']}")

    # 3. POST /api/fecal-kit/calibrate Test
    cal_payload = {
        "prior": rec['prior_bioavailability'],
        "fecal_kit": {
            "fecal_ph": 7.8,
            "fecal_ammonia": "높음(중등도)",
            "fecal_fat": "약양성 (1+)",
            "fecal_occult_blood": "음성 (-)",
            "fecal_phosphate": "낮음 (Low - 체내 흡수 위험)"
        },
        "lab": {
            "phosphorus": 6.2,
            "bun": 48.0,
            "creatinine": 2.4
        },
        "diseases": payload["diseases"],
        "base_der_kcal": rec['patient']['der_kcal'],
        "base_total_g": rec['feeding_plan']['total_daily_g']
    }

    res = client.post('/api/fecal-kit/calibrate', json=cal_payload)
    print(f"[3] POST /api/fecal-kit/calibrate -> Status Code: {res.status_code}")
    assert res.status_code == 200
    cal_res = res.get_json()
    print(f"  - Calibrated Protein: {cal_res['prior']['protein_pct']}% ➔ {cal_res['calibrated']['protein_pct']}%")
    print(f"  - Calibrated Overall: {cal_res['prior']['overall_pct']}% ➔ {cal_res['calibrated']['overall_pct']}%")
    print(f"  - Phosphorus Risk: {cal_res['calibrated']['phosphorus_risk_level']}")
    print(f"  - Recalculated DER: {cal_res['calibrated']['recalculated_der_kcal']} kcal (Food: {cal_res['calibrated']['recalculated_total_g']} g/day)")
    print(f"  - Tuning logs: {len(cal_res['tuning_log'])}")
    print(f"  - Clinical actions: {len(cal_res['clinical_actions'])}")

    assert cal_res['calibrated']['protein_pct'] < cal_res['prior']['protein_pct']
    assert "최고 위험" in cal_res['calibrated']['phosphorus_risk_level']

    print("\n==================================================")
    print("  ALL API TESTS PASSED SUCCESSFULLY! (100%)")
    print("==================================================")

if __name__ == '__main__':
    run_web_tests()
