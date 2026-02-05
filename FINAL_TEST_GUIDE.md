# 🎯 최종 테스트 가이드

## ✅ 완료된 작업

### 1️⃣ 환경 변수 설정 완료
- ✅ `SUPABASE_SERVICE_ROLE_KEY` 추가
- ✅ 서버 재시작 완료
- ✅ Supabase 연동 확인

### 2️⃣ 로그인 테스트 성공
```json
{
  "success": true,
  "user": {
    "id": "b1a3a382-b8be-4020-b14f-afd6625da3f8",
    "username": "admin",
    "role": "admin",
    "name": "관리자"
  }
}
```

---

## 📋 다음 단계: Supabase SQL 실행

### ⚠️ 중요: RLS 무한 재귀 오류 해결 필요

**현재 상태**: 로그인은 성공했지만, RLS 정책에서 무한 재귀가 발생할 수 있습니다.

**해결 방법**: 아래 SQL을 Supabase SQL Editor에서 실행하세요.

### 1️⃣ Supabase Dashboard 열기
https://supabase.com → 프로젝트 선택 → SQL Editor

### 2️⃣ 아래 SQL 전체 복사 후 실행

```sql
-- ============================================
-- 🔧 RLS 정책 수정: 무한 재귀 제거
-- ============================================

-- 1️⃣ RLS 완전 비활성화
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.as_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.as_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_sessions DISABLE ROW LEVEL SECURITY;

-- 2️⃣ 기존 정책 모두 제거
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

-- 3️⃣ Storage 정책 설정 (사진 업로드용)
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
```

### 3️⃣ 실행 확인
- ✅ "Success. No rows returned" 메시지 확인
- ✅ 오류가 없는지 확인

---

## 🧪 테스트 시나리오

### ✅ 테스트 1: 로그인 (이미 성공)
- [x] admin/admin123 로그인 성공
- [x] 서버 로그 확인: "✅ 로그인 성공: admin / admin"

### 🔄 테스트 2: 웹 앱 로그인
1. https://3000-irn3f4j2vutvnwvbf7bwh-cc2fbc16.sandbox.novita.ai 접속
2. 로그인:
   - ID: `admin`
   - PW: `admin123`
3. ✅ 관리자 대시보드 표시 확인

### 📸 테스트 3: 사진 업로드
1. **지도 화면 이동** (상단 "지도 보기" 버튼)
2. **마커 클릭** → 고객 상세 정보 표시
3. **"A/S 결과"** 버튼 클릭
4. **"사진 촬영/업로드"** 버튼 클릭
5. **사진 3장 선택**
6. ✅ **즉시 미리보기 표시** (1/10, 2/10, 3/10)
7. **작업 내용 입력**: "A/S 작업 완료"
8. **"완료"** 버튼 클릭
9. ✅ **"A/S 작업 저장 중..."** → **"A/S 작업이 완료되었습니다"**
10. ✅ **마커 색상 회색으로 변경** 확인

### 🗄️ 테스트 4: Supabase Storage 확인
1. Supabase Dashboard → Storage → `as-photos` 버킷
2. ✅ 고객 ID 폴더 확인
3. ✅ 업로드된 사진 파일 확인 (timestamp_random_filename.jpg)

### 📊 테스트 5: Database 확인
1. Supabase Dashboard → Table Editor
2. **as_photos 테이블**:
   - ✅ `storage_path` 확인
   - ✅ `filename` 확인
   - ✅ `file_size` 확인
3. **as_records 테이블**:
   - ✅ `customer_id` 확인
   - ✅ `result_text` 확인
   - ✅ `status: 'completed'` 확인

---

## 🎯 예상 결과

### ✅ 성공 시:
- 로그인 정상 작동
- 사진 업로드 정상 작동
- Supabase Storage에 파일 저장
- Database에 메타데이터 저장
- 마커 색상 변경 (회색)

### ❌ 실패 시:
1. **로그인 실패**:
   - RLS 정책 확인 (무한 재귀 오류)
   - 위의 SQL 다시 실행

2. **사진 업로드 실패**:
   - Storage 버킷 확인 (`as-photos` 존재 여부)
   - Storage 정책 확인

---

## 📞 문제 발생 시

### 콘솔 로그 확인
브라우저 개발자 도구 (F12) → Console 탭

**성공 로그 예시:**
```
📤 백그라운드에서 사진 업로드 및 메타데이터 저장 중...
📤 사진 1/3 업로드 중: photo1.jpg
✅ 사진 1 업로드 성공: customer-id/timestamp_random_photo1.jpg
📸 업로드 완료된 사진: 3개
✅ 메타데이터 저장 성공
```

**실패 로그 예시:**
```
❌ 사진 1 업로드 실패: {error message}
```

---

## 🔗 참고 링크

- **테스트 URL**: https://3000-irn3f4j2vutvnwvbf7bwh-cc2fbc16.sandbox.novita.ai
- **GitHub**: https://github.com/1d4h/ISAAC-APP.git
- **Supabase Dashboard**: https://supabase.com
- **수정 가이드**: `SUPABASE_FIX.md`

---

## 🎉 최종 목표

- [x] ✅ 로그인 성공
- [ ] 🔄 Supabase SQL 실행
- [ ] 📸 사진 업로드 테스트
- [ ] 🎨 마커 디자인 변경 (핀포인트 말풍선)

**다음 단계**: Supabase SQL을 실행하신 후 웹 앱 로그인 테스트를 진행해주세요!
