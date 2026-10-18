# -*- coding: utf-8 -*-
"""
Supabase 데이터베이스 마이그레이션 스크립트
embedded_data.json의 사료 데이터와 가이드라인을 Supabase 테이블로 일괄 업로드합니다.
"""
import os
import sys
import json
from supabase import create_client, Client

def get_supabase_client() -> Client:
    # 1. 시스템 환경변수 또는 .env 파일에서 확인
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
    
    # .env 파일이 있으면 우선 읽기
    if (not url or not key) and os.path.exists(".env"):
        with open(".env", "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("SUPABASE_URL="):
                    url = line.split("=", 1)[1].strip()
                elif line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    key = line.split("=", 1)[1].strip()
                elif line.startswith("SUPABASE_ANON_KEY=") and not key:
                    key = line.split("=", 1)[1].strip()
                    
    if not url or not key:
        print("[오류] SUPABASE_URL 또는 SUPABASE_ANON_KEY / SERVICE_ROLE_KEY 가 설정되지 않았습니다.")
        print("실행 방법 예시:")
        print("  $env:SUPABASE_URL = 'https://xyz.supabase.co'")
        print("  $env:SUPABASE_ANON_KEY = 'eyJhbGciOi...'")
        print("  python migrate_to_supabase.py")
        sys.exit(1)
        
    return create_client(url, key)

def migrate():
    supabase = get_supabase_client()
    print("Supabase 클라이언트 연결 성공.")
    
    # embedded_data.json 읽기
    json_path = os.path.join(os.path.dirname(__file__), "embedded_data.json")
    if not os.path.exists(json_path):
        print(f"[오류] {json_path} 파일을 찾을 수 없습니다.")
        return
        
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    diets = data.get("diets", [])
    guidelines = data.get("guidelines", {})
    
    print(f"총 {len(diets)}개의 처방사료 데이터와 {len(guidelines)}개의 질환 가이드라인을 준비 중...")
    
    # 1. Diets 테이블 업로드
    diet_rows = []
    for d in diets:
        nut = d.get("nutrients", {})
        diet_rows.append({
            "id": d.get("id"),
            "species": d.get("species"),
            "company": d.get("company"),
            "name": d.get("name"),
            "type": d.get("type"),
            "energy_density": d.get("energy_density", 0),
            "indications": d.get("indications", []),
            "protein_sources": d.get("protein_sources", []),
            "protein_g": nut.get("protein_g", 0),
            "fat_g": nut.get("fat_g", 0),
            "carb_g": nut.get("carb_g", 0),
            "fiber_g": nut.get("fiber_g", 0),
            "calcium_g": nut.get("calcium_g", 0),
            "phosphorus_g": nut.get("phosphorus_g", 0),
            "sodium_g": nut.get("sodium_g", 0),
            "potassium_g": nut.get("potassium_g", 0),
            "epa_dha_g": nut.get("epa_dha_g", 0)
        })
        
    # 50개씩 청크 분할 업로드
    chunk_size = 50
    for i in range(0, len(diet_rows), chunk_size):
        chunk = diet_rows[i:i + chunk_size]
        res = supabase.table("diets").upsert(chunk).execute()
        print(f"  [Diets] {i + len(chunk)} / {len(diet_rows)} 건 이관 완료...")
        
    # 2. Disease Guidelines 테이블 업로드
    gl_rows = []
    for gname, rules in guidelines.items():
        gl_rows.append({
            "disease_name": gname,
            "target_species": "공통",
            "description": f"{gname} 임상 영양 가이드라인",
            "rules": rules
        })
        
    if gl_rows:
        res = supabase.table("disease_guidelines").upsert(gl_rows, on_conflict="disease_name").execute()
        print(f"  [Guidelines] {len(gl_rows)} 건 질환 가이드라인 이관 완료.")
        
    print("\n축하합니다! Supabase 데이터베이스 마이그레이션이 성공적으로 완료되었습니다.")

if __name__ == '__main__':
    migrate()
