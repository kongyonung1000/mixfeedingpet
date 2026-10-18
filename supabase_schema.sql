-- ==========================================================
-- 처방사료 데이터베이스 (Supabase PostgreSQL 스키마 - 완전 초기화 및 통합본)
-- ==========================================================

-- 기존 테이블 초기화
DROP TABLE IF EXISTS public.consultation_logs CASCADE;
DROP TABLE IF EXISTS public.disease_guidelines CASCADE;
DROP TABLE IF EXISTS public.diets CASCADE;

-- 1. 처방사료 테이블 (diets)
CREATE TABLE public.diets (
    id TEXT PRIMARY KEY,                       -- 제품 고유 ID (예: 개_건_001)
    species TEXT NOT NULL,                     -- 동물종 ('개' 또는 '고양이')
    company TEXT NOT NULL,                     -- 제조사 (로얄캐닌, 힐스 등)
    name TEXT NOT NULL,                        -- 제품명
    type TEXT NOT NULL,                        -- 제형 ('건식', '습식', '액상')
    energy_density NUMERIC DEFAULT 0,          -- 에너지 밀도 (kcal/kg)
    indications TEXT[] DEFAULT '{}',           -- 추천 질환 적응증 목록
    protein_sources TEXT[] DEFAULT '{}',       -- 단백질 원료 목록
    
    -- 1000 kcal 당 영양성분 (g 단위)
    protein_g NUMERIC DEFAULT 0,               -- 조단백질 (g/1000kcal)
    fat_g NUMERIC DEFAULT 0,                   -- 조지방 (g/1000kcal)
    carb_g NUMERIC DEFAULT 0,                  -- 탄수화물 (g/1000kcal)
    fiber_g NUMERIC DEFAULT 0,                 -- 조섬유 (g/1000kcal)
    calcium_g NUMERIC DEFAULT 0,               -- 칼슘 (g/1000kcal)
    phosphorus_g NUMERIC DEFAULT 0,            -- 인 (g/1000kcal)
    sodium_g NUMERIC DEFAULT 0,                -- 나트륨 (g/1000kcal)
    potassium_g NUMERIC DEFAULT 0,             -- 칼륨 (g/1000kcal)
    epa_dha_g NUMERIC DEFAULT 0,               -- EPA+DHA (g/1000kcal)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 질환별 영양 가이드라인 테이블 (disease_guidelines)
CREATE TABLE public.disease_guidelines (
    id SERIAL PRIMARY KEY,
    disease_name TEXT NOT NULL UNIQUE,         -- 질환명 (예: 만성신부전 (CKD IRIS 1-4단계))
    target_species TEXT NOT NULL,              -- '공통', '개', '고양이'
    description TEXT,                          -- 설명
    rules JSONB NOT NULL DEFAULT '{}'          -- 상한/하한 영양 기준 (JSON)
);

-- 3. 환자 진단 및 추천 이력 테이블 (consultation_logs)
CREATE TABLE public.consultation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_name TEXT,
    species TEXT NOT NULL,
    body_weight NUMERIC,
    bcs INTEGER,
    selected_diseases TEXT[],
    recommended_diets JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 인덱스 생성 (조회 속도 최적화)
CREATE INDEX IF NOT EXISTS idx_diets_species ON public.diets(species);
CREATE INDEX IF NOT EXISTS idx_diets_type ON public.diets(type);
CREATE INDEX IF NOT EXISTS idx_diets_company ON public.diets(company);

-- Row Level Security (RLS) 활성화
ALTER TABLE public.diets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_logs ENABLE ROW LEVEL SECURITY;

-- 읽기 및 쓰기 모두 전면 허용 정책 (완벽 마이그레이션 및 서비스 지원)
CREATE POLICY "Public full access on diets" ON public.diets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on guidelines" ON public.disease_guidelines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on logs" ON public.consultation_logs FOR ALL USING (true) WITH CHECK (true);
