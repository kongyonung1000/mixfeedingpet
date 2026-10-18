# -*- coding: utf-8 -*-
"""
Supabase Database Client & Repository for Prescription Diets.
Fallback gracefully to local embedded_data.json if Supabase is not configured.
"""
import os
import json
from typing import List, Dict, Any, Optional

def _load_env_if_needed():
    if not os.environ.get("SUPABASE_URL"):
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            os.environ[k.strip()] = v.strip()
            except Exception:
                pass

class SupabaseDietRepository:
    def __init__(self):
        _load_env_if_needed()
        self.url = os.environ.get("SUPABASE_URL")
        self.key = os.environ.get("SUPABASE_ANON_KEY")
        self.client = None
        
        if self.url and self.key:
            try:
                from supabase import create_client
                self.client = create_client(self.url, self.key)
            except Exception as e:
                print(f"[Supabase] 클라이언트 초기화 실패 (로컬 모드로 전환): {e}")
                self.client = None

    def is_connected(self) -> bool:
        return self.client is not None

    def get_diets(self, species: Optional[str] = None) -> List[Dict[str, Any]]:
        """Supabase에서 사료 목록 조회"""
        if not self.is_connected():
            return []
            
        try:
            query = self.client.table("diets").select("*")
            if species:
                query = query.eq("species", species)
            res = query.execute()
            return res.data or []
        except Exception as e:
            print(f"[Supabase] get_diets 오류: {e}")
            return []

    def log_consultation(self, log_data: Dict[str, Any]) -> bool:
        """추천/상담 이력을 Supabase에 저장"""
        if not self.is_connected():
            return False
        try:
            self.client.table("consultation_logs").insert(log_data).execute()
            return True
        except Exception as e:
            print(f"[Supabase] log_consultation 오류: {e}")
            return False

_repo_instance = None

def get_supabase_repo() -> SupabaseDietRepository:
    global _repo_instance
    if _repo_instance is None:
        _repo_instance = SupabaseDietRepository()
    return _repo_instance
