-- ==========================================================
-- 처방사료 데이터베이스 (Supabase PostgreSQL 스키마)
-- ==========================================================

-- 1. 처방사료 테이블 (diets)
CREATE TABLE IF NOT EXISTS public.diets (
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
CREATE TABLE IF NOT EXISTS public.disease_guidelines (
    id SERIAL PRIMARY KEY,
    disease_name TEXT NOT NULL UNIQUE,         -- 질환명 (예: 만성신부전 (CKD IRIS 1-4단계))
    target_species TEXT NOT NULL,              -- '공통', '개', '고양이'
    description TEXT,                          -- 설명
    rules JSONB NOT NULL DEFAULT '{}'          -- 상한/하한 영양 기준 (JSON)
);

-- 3. 환자 진단 및 추천 이력 테이블 (consultation_logs)
CREATE TABLE IF NOT EXISTS public.consultation_logs (
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

-- Row Level Security (RLS) 정책 활성화
ALTER TABLE public.diets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_logs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자(웹 방문자)에게 읽기 권한 허용 (사료 조회)
CREATE POLICY "Allow public read access for diets" 
    ON public.diets FOR SELECT USING (true);

CREATE POLICY "Allow public read access for guidelines" 
    ON public.disease_guidelines FOR SELECT USING (true);

-- 추천 이력 저장은 누구나 등록 가능
CREATE POLICY "Allow public insert for consultation_logs" 
    ON public.consultation_logs FOR INSERT WITH CHECK (true);
