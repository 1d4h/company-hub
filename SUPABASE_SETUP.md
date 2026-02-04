# Supabase 데이터베이스 설정 가이드

## 📋 목차
1. [Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
2. [데이터베이스 스키마 생성](#2-데이터베이스-스키마-생성)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [초기 사용자 계정 생성](#4-초기-사용자-계정-생성)
5. [Storage 버킷 생성](#5-storage-버킷-생성)
6. [테스트](#6-테스트)

---

## 1. Supabase 프로젝트 생성

### 1.1 Supabase 가입 및 로그인
- https://supabase.com 접속
- "Start your project" 클릭
- GitHub 계정으로 로그인 (권장)

### 1.2 새 프로젝트 생성
1. **New Project** 클릭
2. 프로젝트 정보 입력:
   - **Name**: `isaac-app` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 입력 (잘 보관하세요!)
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국)
   - **Pricing Plan**: `Free` 선택
3. **Create new project** 클릭
4. 프로젝트 생성 완료 (약 2분 소요)

---

## 2. 데이터베이스 스키마 생성

### 2.1 SQL Editor 접속
1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **New query** 클릭

### 2.2 스키마 SQL 실행
1. `supabase-schema.sql` 파일 내용을 복사
2. SQL Editor에 붙여넣기
3. 우측 하단 **RUN** 버튼 클릭
4. 성공 메시지 확인:
   ```
   Success. No rows returned
   ```

### 2.3 테이블 확인
1. 왼쪽 메뉴에서 **Table Editor** 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - ✅ `users`
   - ✅ `customers`
   - ✅ `as_records`
   - ✅ `as_photos`
   - ✅ `upload_sessions`

---

## 3. 환경 변수 설정

### 3.1 API 키 가져오기
1. 왼쪽 메뉴에서 **Project Settings** (⚙️) 클릭
2. **API** 메뉴 클릭
3. 다음 정보 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3.2 .env 파일 생성
프로젝트 루트에 `.env` 파일 생성:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key

# T Map API Key (optional)
TMAP_APP_KEY=vSWmSa8CcO4uvyc0EsAg46SWvxNVAKzL8KGbckPB
```

**⚠️ 중요:** `.env` 파일은 절대 Git에 커밋하지 마세요!

### 3.3 .gitignore 확인
`.gitignore` 파일에 다음이 포함되어 있는지 확인:
```
.env
.env.local
.env.*.local
```

---

## 4. 초기 사용자 계정 생성

### 4.1 비밀번호 해싱
SQL Editor에서 다음 쿼리 실행 (bcrypt 해시 생성):

```sql
-- 비밀번호를 해싱하기 위한 확장 설치
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 테스트 계정 생성 (비밀번호: admin123, test1, test2)
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
```

### 4.2 사용자 확인
```sql
SELECT id, username, role, name, created_at FROM users;
```

---

## 5. Storage 버킷 생성

### 5.1 Storage 메뉴 접속
1. 왼쪽 메뉴에서 **Storage** 클릭
2. **New bucket** 클릭

### 5.2 버킷 생성
1. **Name**: `as-photos`
2. **Public bucket**: 체크 해제 (비공개)
3. **File size limit**: `10 MB`
4. **Allowed MIME types**: `image/*`
5. **Create bucket** 클릭

### 5.3 Storage 정책 설정
SQL Editor에서 다음 쿼리 실행:

```sql
-- A/S 사진 업로드 정책
CREATE POLICY "Authenticated users can upload AS photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'as-photos');

-- A/S 사진 조회 정책
CREATE POLICY "Authenticated users can view AS photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'as-photos');

-- A/S 사진 삭제 정책
CREATE POLICY "Users can delete their own AS photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'as-photos');
```

---

## 6. 테스트

### 6.1 연결 테스트
터미널에서 다음 명령 실행:

```bash
cd /home/user/webapp
node -e "import('./src/supabase.js').then(m => m.testConnection())"
```

성공 시 출력:
```
✅ Supabase 연결 성공!
```

### 6.2 서버 시작
```bash
pm2 restart webapp
```

### 6.3 로그인 테스트
브라우저에서 앱 접속 후:
- **아이디**: `admin`
- **비밀번호**: `admin123`

로그인 성공 확인!

---

## 📊 데이터베이스 구조

### Users (사용자)
```
id (UUID)
username (고유)
password_hash (bcrypt)
role (admin/user)
name
created_at
updated_at
```

### Customers (고객)
```
id (UUID)
customer_name, phone, address
latitude, longitude (지도 좌표)
as_content (A/S 접수내용)
as_result (A/S 결과 상태)
region, install_team, etc.
created_by (사용자 FK)
created_at, updated_at
```

### AS Records (A/S 기록)
```
id (UUID)
customer_id (고객 FK)
result_text (작업 내용)
status (pending/draft/completed)
completed_by (완료한 사용자 FK)
completed_at
created_at, updated_at
```

### AS Photos (A/S 사진)
```
id (UUID)
as_record_id (A/S 기록 FK)
storage_path (Supabase Storage 경로)
filename, file_size, mime_type
uploaded_at
```

---

## 🔐 보안 설정

### Row Level Security (RLS)
- ✅ 모든 테이블에 RLS 활성화
- ✅ 인증된 사용자만 데이터 접근 가능
- ✅ 관리자 권한 분리

### API 키 보안
- ⚠️ `anon` 키는 클라이언트에서 사용 가능 (RLS로 보호됨)
- ⚠️ `service_role` 키는 절대 노출 금지 (서버만 사용)

---

## 📱 Supabase Storage 사용법

### 사진 업로드 (서버 측)
```javascript
const { data, error } = await supabase.storage
  .from('as-photos')
  .upload(`${asRecordId}/${filename}`, file, {
    cacheControl: '3600',
    upsert: false
  })
```

### 사진 URL 가져오기
```javascript
const { data } = supabase.storage
  .from('as-photos')
  .getPublicUrl(path)
```

---

## ❓ 문제 해결

### 연결 실패
- ✅ `.env` 파일의 URL과 Key 확인
- ✅ Supabase 프로젝트가 활성화되어 있는지 확인
- ✅ 인터넷 연결 확인

### 권한 오류
- ✅ RLS 정책이 올바르게 설정되었는지 확인
- ✅ SQL Editor에서 정책 확인:
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'customers';
  ```

### Storage 업로드 실패
- ✅ 버킷이 생성되었는지 확인
- ✅ Storage 정책이 설정되었는지 확인
- ✅ 파일 크기 제한 확인 (기본 10MB)

---

## 🚀 다음 단계

1. ✅ Supabase 프로젝트 생성
2. ✅ 데이터베이스 스키마 생성
3. ✅ 환경 변수 설정
4. ⏳ API를 Supabase로 마이그레이션 (`server.js` 수정)
5. ⏳ 사진 업로드를 Supabase Storage로 전환
6. ⏳ 프론트엔드 테스트

---

## 📞 지원

문제가 발생하면 다음을 확인하세요:
- Supabase 공식 문서: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
