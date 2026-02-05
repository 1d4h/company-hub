-- ============================================
-- 🔧 RLS 정책 수정: 무한 재귀 제거
-- ============================================

-- 1️⃣ 기존 정책 모두 제거
DROP POLICY IF EXISTS "Allow authenticated users to read users" ON public.users;
DROP POLICY IF EXISTS "Allow service role full access to users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON public.customers;
DROP POLICY IF EXISTS "Allow service role full access to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated users to insert as_records" ON public.as_records;
DROP POLICY IF EXISTS "Allow authenticated users to read as_records" ON public.as_records;
DROP POLICY IF EXISTS "Allow service role full access to as_records" ON public.as_records;
DROP POLICY IF EXISTS "Allow authenticated users to insert as_photos" ON public.as_photos;
DROP POLICY IF EXISTS "Allow authenticated users to read as_photos" ON public.as_photos;
DROP POLICY IF EXISTS "Allow service role full access to as_photos" ON public.as_photos;
DROP POLICY IF EXISTS "Allow authenticated users to manage upload_sessions" ON public.upload_sessions;
DROP POLICY IF EXISTS "Allow service role full access to upload_sessions" ON public.upload_sessions;

-- 2️⃣ RLS 비활성화 (서버에서 SERVICE_ROLE_KEY 사용)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.as_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.as_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_sessions DISABLE ROW LEVEL SECURITY;

-- 3️⃣ Storage 정책만 유지 (Public 읽기 허용)
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role full access" ON storage.objects;

-- Public 읽기 허용 (사진 URL 접근)
CREATE POLICY "Allow public read access" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'as-photos');

-- Service Role: 모든 권한 (서버에서 업로드/삭제)
CREATE POLICY "Allow service role full access" 
ON storage.objects FOR ALL 
TO service_role 
USING (bucket_id = 'as-photos');

-- ============================================
-- ✅ 완료: RLS 무한 재귀 제거
-- ============================================
-- 결과:
-- - users, customers, as_records, as_photos, upload_sessions: RLS 비활성화
-- - 서버에서 SERVICE_ROLE_KEY로 모든 권한 사용
-- - Storage: Public 읽기 + Service Role 쓰기
-- ============================================
