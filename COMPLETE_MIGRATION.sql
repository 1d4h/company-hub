-- =============================================
-- 통합 마이그레이션 파일 (Supabase PostgreSQL용)
-- 실행 방법: Supabase Dashboard → SQL Editor → 전체 복사 후 실행
-- =============================================

-- =============================================
-- 0001: 기본 스키마 생성
-- =============================================

-- Users 테이블 생성
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers 테이블 생성
CREATE TABLE IF NOT EXISTS public.customers (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT NOT NULL,
  address_detail TEXT,
  latitude REAL,
  longitude REAL,
  memo TEXT,
  created_by BIGINT REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upload sessions 테이블 생성
CREATE TABLE IF NOT EXISTS public.upload_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id),
  filename TEXT NOT NULL,
  total_rows INTEGER NOT NULL,
  valid_rows INTEGER NOT NULL,
  invalid_rows INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AS Records 테이블 생성
CREATE TABLE IF NOT EXISTS public.as_records (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES public.customers(id) ON DELETE CASCADE,
  result_text TEXT,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AS Photos 테이블 생성
CREATE TABLE IF NOT EXISTS public.as_photos (
  id BIGSERIAL PRIMARY KEY,
  as_record_id BIGINT REFERENCES public.as_records(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_customers_address ON public.customers(address);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON public.customers(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_location ON public.customers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_user_id ON public.upload_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_as_records_customer_id ON public.as_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_as_photos_as_record_id ON public.as_photos(as_record_id);

-- =============================================
-- 0002: Excel 필드 추가
-- =============================================

-- Customers 테이블에 Excel 관련 필드 추가
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS sequence_number INTEGER;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS count INTEGER;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS receipt_date DATE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS install_date TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS heat_source TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS as_content TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS install_team TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS receptionist TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS as_result TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS as_result_text TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS as_result_photos JSONB DEFAULT '[]';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS as_result_status TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS as_completed_at TIMESTAMPTZ;

-- =============================================
-- 0003: 카카오 로그인 필드 추가
-- =============================================

-- Users 테이블에 카카오 로그인 관련 필드 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kakao_id TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kakao_email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kakao_nickname TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kakao_profile_image TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS login_type TEXT DEFAULT 'local' CHECK(login_type IN ('local', 'kakao'));

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_kakao_id ON public.users(kakao_id);
CREATE INDEX IF NOT EXISTS idx_users_login_type ON public.users(login_type);

-- =============================================
-- 0004: 알림 테이블 생성
-- =============================================

-- Notifications 테이블 생성
CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  customer_id BIGINT REFERENCES public.customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('as_complete', 'as_update', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- =============================================
-- 0005: 푸시 구독 테이블 생성
-- =============================================

-- Push Subscriptions 테이블 생성
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created_at ON public.push_subscriptions(created_at);

-- =============================================
-- RLS (Row Level Security) 설정
-- =============================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.as_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.as_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users 테이블 RLS 정책 (모든 사용자 조회 가능)
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
CREATE POLICY "Users are viewable by everyone" ON public.users
  FOR SELECT USING (true);

-- Customers 테이블 RLS 정책 (모든 사용자 조회/수정 가능)
DROP POLICY IF EXISTS "Customers are viewable by everyone" ON public.customers;
CREATE POLICY "Customers are viewable by everyone" ON public.customers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Customers are modifiable by everyone" ON public.customers;
CREATE POLICY "Customers are modifiable by everyone" ON public.customers
  FOR ALL USING (true);

-- Notifications 테이블 RLS 정책 (모든 사용자 조회/생성 가능)
DROP POLICY IF EXISTS "Notifications are viewable by everyone" ON public.notifications;
CREATE POLICY "Notifications are viewable by everyone" ON public.notifications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Notifications are creatable by everyone" ON public.notifications;
CREATE POLICY "Notifications are creatable by everyone" ON public.notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Notifications are updatable by everyone" ON public.notifications;
CREATE POLICY "Notifications are updatable by everyone" ON public.notifications
  FOR UPDATE USING (true);

-- Push Subscriptions 테이블 RLS 정책 (모든 사용자 조회/수정 가능)
DROP POLICY IF EXISTS "Push subscriptions are viewable by everyone" ON public.push_subscriptions;
CREATE POLICY "Push subscriptions are viewable by everyone" ON public.push_subscriptions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Push subscriptions are modifiable by everyone" ON public.push_subscriptions;
CREATE POLICY "Push subscriptions are modifiable by everyone" ON public.push_subscriptions
  FOR ALL USING (true);

-- AS Records 테이블 RLS 정책
DROP POLICY IF EXISTS "AS records are viewable by everyone" ON public.as_records;
CREATE POLICY "AS records are viewable by everyone" ON public.as_records
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "AS records are modifiable by everyone" ON public.as_records;
CREATE POLICY "AS records are modifiable by everyone" ON public.as_records
  FOR ALL USING (true);

-- AS Photos 테이블 RLS 정책
DROP POLICY IF EXISTS "AS photos are viewable by everyone" ON public.as_photos;
CREATE POLICY "AS photos are viewable by everyone" ON public.as_photos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "AS photos are modifiable by everyone" ON public.as_photos;
CREATE POLICY "AS photos are modifiable by everyone" ON public.as_photos
  FOR ALL USING (true);

-- Upload Sessions 테이블 RLS 정책
DROP POLICY IF EXISTS "Upload sessions are viewable by everyone" ON public.upload_sessions;
CREATE POLICY "Upload sessions are viewable by everyone" ON public.upload_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Upload sessions are modifiable by everyone" ON public.upload_sessions;
CREATE POLICY "Upload sessions are modifiable by everyone" ON public.upload_sessions
  FOR ALL USING (true);

-- =============================================
-- 초기 데이터 삽입
-- =============================================

-- 기본 사용자 계정 (모든 계정 비밀번호: admin123)
-- bcrypt 해시: $2b$10$rRE984pX.nIstXK9mUhOu.veoCh7MHVElxt.XygjOOujL.8ntimAG
INSERT INTO public.users (username, password, role, name, login_type)
VALUES 
  ('admin', '$2b$10$rRE984pX.nIstXK9mUhOu.veoCh7MHVElxt.XygjOOujL.8ntimAG', 'admin', 'Administrator', 'local'),
  ('master1', '$2b$10$rRE984pX.nIstXK9mUhOu.veoCh7MHVElxt.XygjOOujL.8ntimAG', 'admin', 'Master 1', 'local'),
  ('master2', '$2b$10$rRE984pX.nIstXK9mUhOu.veoCh7MHVElxt.XygjOOujL.8ntimAG', 'admin', 'Master 2', 'local'),
  ('master3', '$2b$10$rRE984pX.nIstXK9mUhOu.veoCh7MHVElxt.XygjOOujL.8ntimAG', 'admin', 'Master 3', 'local'),
  ('user', '$2b$10$rRE984pX.nIstXK9mUhOu.veoCh7MHVElxt.XygjOOujL.8ntimAG', 'user', 'User', 'local'),
  ('test1', '$2b$10$rRE984pX.nIstXK9mUhOu.veoCh7MHVElxt.XygjOOujL.8ntimAG', 'user', 'Test User 1', 'local'),
  ('test2', '$2b$10$rRE984pX.nIstXK9mUhOu.veoCh7MHVElxt.XygjOOujL.8ntimAG', 'user', 'Test User 2', 'local'),
  ('test3', '$2b$10$rRE984pX.nIstXK9mUhOu.veoCh7MHVElxt.XygjOOujL.8ntimAG', 'user', 'Test User 3', 'local'),
  ('test4', '$2b$10$rRE984pX.nIstXK9mUhOu.veoCh7MHVElxt.XygjOOujL.8ntimAG', 'user', 'Test User 4', 'local'),
  ('test5', '$2b$10$rRE984pX.nIstXK9mUhOu.veoCh7MHVElxt.XygjOOujL.8ntimAG', 'user', 'Test User 5', 'local'),
  ('test6', '$2b$10$rRE984pX.nIstXK9mUhOu.veoCh7MHVElxt.XygjOOujL.8ntimAG', 'user', 'Test User 6', 'local'),
  ('test7', '$2b$10$rRE984pX.nIstXK9mUhOu.veoCh7MHVElxt.XygjOOujL.8ntimAG', 'user', 'Test User 7', 'local'),
  ('test8', '$2b$10$rRE984pX.nIstXK9mUhOu.veoCh7MHVElxt.XygjOOujL.8ntimAG', 'user', 'Test User 8', 'local'),
  ('test9', '$2b$10$rRE984pX.nIstXK9mUhOu.veoCh7MHVElxt.XygjOOujL.8ntimAG', 'user', 'Test User 9', 'local'),
  ('test10', '$2b$10$rRE984pX.nIstXK9mUhOu.veoCh7MHVElxt.XygjOOujL.8ntimAG', 'user', 'Test User 10', 'local')
ON CONFLICT (username) DO NOTHING;

-- =============================================
-- 완료 메시지
-- =============================================

-- 테이블 생성 확인
SELECT 'Migration completed successfully!' as message;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 사용자 계정 확인
SELECT id, username, role, name, login_type FROM public.users ORDER BY id;
