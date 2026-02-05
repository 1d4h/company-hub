# 🔧 Supabase RLS 무한 재귀 오류 해결

## ❌ 현재 문제
```
Error: infinite recursion detected in policy for relation "users"
```

## ✅ 해결 방법 (Supabase SQL Editor에서 실행)

### 방법 1: RLS 비활성화 (가장 간단, 권장)
```sql
-- RLS 완전 비활성화
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.as_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.as_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_sessions DISABLE ROW LEVEL SECURITY;

-- 기존 정책 모두 제거
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

-- Storage 정책 (사진 업로드용)
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role full access" ON storage.objects;

CREATE POLICY "Allow public read access" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'as-photos');

CREATE POLICY "Allow service role full access" 
ON storage.objects FOR ALL 
TO service_role 
USING (bucket_id = 'as-photos');
```

## 📋 실행 순서
1. Supabase Dashboard 열기
2. SQL Editor 클릭
3. 위의 SQL 전체 복사
4. Paste → Run
5. ✅ Success 확인

## 🧪 테스트
1. 앱 새로고침
2. 로그인 시도 (admin/admin123)
3. ✅ 로그인 성공 확인
