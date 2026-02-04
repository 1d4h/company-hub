-- ============================================
-- Supabase Database Schema for 고객관리 시스템
-- ============================================

-- Users 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users 인덱스
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Customers 테이블
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence INTEGER,
  count INTEGER,
  receipt_date DATE,
  company VARCHAR(200),
  category VARCHAR(100),
  customer_name VARCHAR(200) NOT NULL,
  phone VARCHAR(50),
  install_date DATE,
  heat_source VARCHAR(100),
  address TEXT NOT NULL,
  address_detail TEXT,
  as_content TEXT,
  install_team VARCHAR(200),
  region VARCHAR(100),
  receptionist VARCHAR(100),
  as_result VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers 인덱스
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_region ON customers(region);
CREATE INDEX IF NOT EXISTS idx_customers_location ON customers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_as_result ON customers(as_result);

-- AS Records 테이블
CREATE TABLE IF NOT EXISTS as_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  result_text TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'draft', 'completed')),
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AS Records 인덱스
CREATE INDEX IF NOT EXISTS idx_as_records_customer ON as_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_as_records_status ON as_records(status);
CREATE INDEX IF NOT EXISTS idx_as_records_completed_by ON as_records(completed_by);

-- AS Photos 테이블
CREATE TABLE IF NOT EXISTS as_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  as_record_id UUID NOT NULL REFERENCES as_records(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AS Photos 인덱스
CREATE INDEX IF NOT EXISTS idx_as_photos_record ON as_photos(as_record_id);

-- Upload Sessions 테이블 (Excel 업로드 이력)
CREATE TABLE IF NOT EXISTS upload_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  total_rows INTEGER NOT NULL,
  valid_rows INTEGER NOT NULL,
  invalid_rows INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Upload Sessions 인덱스
CREATE INDEX IF NOT EXISTS idx_upload_sessions_user ON upload_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_status ON upload_sessions(status);

-- ============================================
-- Functions & Triggers
-- ============================================

-- Updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users 테이블 트리거
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Customers 테이블 트리거
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- AS Records 테이블 트리거
DROP TRIGGER IF EXISTS update_as_records_updated_at ON as_records;
CREATE TRIGGER update_as_records_updated_at
  BEFORE UPDATE ON as_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) 설정
-- ============================================

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE as_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE as_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;

-- Users 정책 (관리자만 전체 조회 가능)
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Customers 정책 (모든 인증된 사용자가 조회 가능)
CREATE POLICY "Authenticated users can view customers" ON customers
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert customers" ON customers
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update customers" ON customers
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin users can delete customers" ON customers
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- AS Records 정책
CREATE POLICY "Authenticated users can view AS records" ON as_records
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert AS records" ON as_records
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update AS records" ON as_records
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- AS Photos 정책
CREATE POLICY "Authenticated users can view AS photos" ON as_photos
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert AS photos" ON as_photos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Upload Sessions 정책
CREATE POLICY "Users can view their own upload sessions" ON upload_sessions
  FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can insert their own upload sessions" ON upload_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 초기 데이터 (테스트 계정)
-- ============================================

-- 비밀번호는 bcrypt로 해싱해야 합니다
-- 예: admin123 -> $2a$10$...
-- 아래는 예시이므로 실제 환경에서는 적절한 해시값을 사용하세요

INSERT INTO users (username, password_hash, role, name) VALUES
  ('admin', '$2a$10$YourHashedPasswordHere', 'admin', '관리자'),
  ('test1', '$2a$10$YourHashedPasswordHere', 'user', '사용자1'),
  ('test2', '$2a$10$YourHashedPasswordHere', 'user', '사용자2')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- Storage Buckets (Supabase Storage)
-- ============================================

-- A/S 사진 저장용 버킷
-- Supabase 대시보드에서 수동으로 생성하거나 아래 SQL 사용
-- INSERT INTO storage.buckets (id, name, public) VALUES ('as-photos', 'as-photos', false);
