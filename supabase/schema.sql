-- =====================================================================
-- Mixfeeding BtoC schema (Supabase)
-- 실행 위치: Supabase 대시보드 > SQL Editor > New query > 붙여넣고 Run
-- 여러 번 실행해도 안전하도록 작성됨 (idempotent)
-- =====================================================================

-- 1) profiles : 계정 1개당 1행. role 은 서버(관리자)만 변경 가능
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  role          text not null default 'guardian' check (role in ('guardian','vet','admin')),
  display_name  text,
  clinic        text,
  vet_approved  boolean not null default false,
  data_consent  boolean not null default false,   -- 익명화 통계 활용 동의 (선택)
  created_at    timestamptz not null default now()
);

-- 기존 테이블이 이미 만들어졌을 경우를 대비한 컬럼 추가
alter table public.profiles add column if not exists email text;

-- 2) pets : 보호자 1명 : 반려동물 N마리
create table if not exists public.pets (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name             text not null,
  species          text not null check (species in ('dog','cat')),
  breed            text,
  sex              text check (sex in ('male','female')),
  neutered         boolean,
  birth_date       date,
  weight_kg        numeric(5,2) check (weight_kg is null or weight_kg > 0),
  bcs              smallint check (bcs between 1 and 9),
  mcs              smallint check (mcs between 0 and 3),
  health_concerns  text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists pets_owner_idx on public.pets(owner_id);

-- 3) pet_records : 체중/체형/급여 기록 (시계열)
create table if not exists public.pet_records (
  id           uuid primary key default gen_random_uuid(),
  pet_id       uuid not null references public.pets(id) on delete cascade,
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recorded_at  timestamptz not null default now(),
  weight_kg    numeric(5,2),
  bcs          smallint check (bcs between 1 and 9),
  mcs          smallint check (mcs between 0 and 3),
  note         text,
  data         jsonb not null default '{}'::jsonb   -- 급여표, 분변키트 결과 등 자유 확장
);
create index if not exists pet_records_pet_idx on public.pet_records(pet_id, recorded_at desc);

-- 4) 신규 가입 시 profiles 자동 생성 (항상 guardian 으로 시작: 권한 상승 방지)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name',
             new.raw_user_meta_data->>'nickname',
             new.raw_user_meta_data->>'full_name')
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    display_name = coalesce(excluded.display_name, public.profiles.display_name);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) updated_at 자동 갱신
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists pets_touch on public.pets;
create trigger pets_touch before update on public.pets
  for each row execute function public.touch_updated_at();

-- 6) pet_records.owner_id 는 반드시 해당 pet 의 주인이어야 함
create or replace function public.check_record_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.pets p where p.id = new.pet_id and p.owner_id = new.owner_id) then
    raise exception 'pet does not belong to owner';
  end if;
  return new;
end $$;

drop trigger if exists pet_records_owner_check on public.pet_records;
create trigger pet_records_owner_check before insert or update on public.pet_records
  for each row execute function public.check_record_owner();

-- =====================================================================
-- RLS (Row Level Security): 보호자는 본인 데이터만 접근
-- =====================================================================
alter table public.profiles    enable row level security;
alter table public.pets        enable row level security;
alter table public.pet_records enable row level security;

-- profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- role / vet_approved 는 클라이언트가 못 바꾸도록 컬럼 권한 제한 (수정 가능한 컬럼만 허용)
revoke update on public.profiles from authenticated, anon;
grant  update (display_name, clinic, data_consent) on public.profiles to authenticated;

-- pets
drop policy if exists pets_all_own on public.pets;
create policy pets_all_own on public.pets
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- pet_records
drop policy if exists pet_records_all_own on public.pet_records;
create policy pet_records_all_own on public.pet_records
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- 익명(비로그인) 접근은 전부 차단 (게스트는 기존처럼 브라우저 안에서만 계산)
revoke all on public.profiles, public.pets, public.pet_records from anon;

-- =====================================================================
-- 수의사 승인 (관리자가 SQL Editor 에서 직접 실행). 예시:
--   update public.profiles
--      set role = 'vet', vet_approved = true
--    where id = '<해당 사용자 uuid>';
-- =====================================================================
