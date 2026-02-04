-- ============================================
-- Supabase Database Schema (개발용 - RLS 단순화)
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

CREATE INDEX IF NOT EXISTS idx_as_photos_record ON as_photos(as_record_id);

-- Upload Sessions 테이블
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

CREATE INDEX IF NOT EXISTS idx_upload_sessions_user ON upload_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_status ON upload_sessions(status);

-- Updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_as_records_updated_at ON as_records;
CREATE TRIGGER update_as_records_updated_at
  BEFORE UPDATE ON as_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE as_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE as_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;

-- 개발용 RLS 정책 (모두 허용)
CREATE POLICY "Allow all for development" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON as_records FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON as_photos FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON upload_sessions FOR ALL USING (true);

-- pgcrypto 확장 설치 (비밀번호 해싱용)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 초기 사용자 계정 생성
INSERT INTO users (username, password_hash, role, name) VALUES
  ('admin', crypt('admin123', gen_salt('bf')), 'admin', '관리자'),
  ('test1', crypt('test1', gen_salt('bf')), 'user', '사용자1'),
  ('test2', crypt('test2', gen_salt('bf')), 'user', '사용자2'),
  ('test3', crypt('test3', gen_salt('bf')), 'user', '사용자3'),
  ('test4', crypt('test4', gen_salt('bf')), 'user', '사용자4'),
  ('test5', crypt('test5', gen_salt('bf')), 'user', '사용자5'),
  ('test6', crypt('test6', gen_salt('bf')), 'user', '사용자6'),
  ('test7', crypt('test7', gen_salt('bf')), 'user', '사용자7'),
  ('test8', crypt('test8', gen_salt('bf')), 'user', '사용자8'),
  ('test9', crypt('test9', gen_salt('bf')), 'user', '사용자9'),
  ('test10', crypt('test10', gen_salt('bf')), 'user', '사용자10')
ON CONFLICT (username) DO NOTHING;

-- 확인
SELECT id, username, role, name, created_at FROM users;
