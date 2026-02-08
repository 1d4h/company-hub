# 🚨 긴급 수정 가이드 - 로그인 오류 해결

## ❌ 문제 진단

**현재 오류:**
```
Could not find the table 'public.users' in the schema cache
```

**원인:** 새로운 Supabase 프로젝트에 데이터베이스 테이블이 생성되지 않았습니다.

---

## ✅ 해결 방법 (5분 소요)

### 1️⃣ Supabase Dashboard 접속

1. 브라우저에서 https://supabase.com/dashboard 접속
2. 프로젝트 선택: **peelrrycglnqdcxtllfr**

---

### 2️⃣ SQL Editor 열기

1. 왼쪽 사이드바에서 **SQL Editor** 클릭
2. **New query** 버튼 클릭

---

### 3️⃣ 마이그레이션 SQL 실행

**중요: 아래 파일의 전체 내용을 복사하여 실행하세요!**

**파일:** `COMPLETE_MIGRATION.sql`

#### 실행 방법:

1. `COMPLETE_MIGRATION.sql` 파일 열기
2. **전체 내용 복사** (Ctrl+A → Ctrl+C)
3. Supabase SQL Editor에 **붙여넣기** (Ctrl+V)
4. 우측 하단 **"Run"** 버튼 클릭 (또는 Ctrl+Enter)

---

### 4️⃣ 실행 결과 확인

**성공 메시지:**
```
Migration completed successfully!

테이블 목록:
- users
- customers
- upload_sessions
- as_records
- as_photos
- notifications
- push_subscriptions

사용자 계정:
- admin / admin123 (관리자)
- master1 / admin123 (관리자)
- master2 / admin123 (관리자)
- master3 / admin123 (관리자)
- user / admin123 (사용자)
- test1 / admin123 (사용자)
- test2 / admin123 (사용자)
- test3 / admin123 (사용자)
```

---

### 5️⃣ Storage 버킷 생성

1. 왼쪽 사이드바에서 **Storage** 클릭
2. **New bucket** 버튼 클릭
3. 버킷 정보 입력:
   - **Name**: `as-photos`
   - **Public bucket**: ✅ 체크 (또는 RLS 정책 설정)
4. **Create bucket** 클릭

---

## 🔐 로그인 계정 정보

**마이그레이션 실행 후 사용 가능한 계정:**

### 관리자 계정
```
아이디: admin
비밀번호: admin123

아이디: master1
비밀번호: admin123

아이디: master2
비밀번호: admin123

아이디: master3
비밀번호: admin123
```

### 사용자 계정
```
아이디: user
비밀번호: admin123

아이디: test1
비밀번호: admin123

아이디: test2
비밀번호: admin123

아이디: test3
비밀번호: admin123
```

---

## 🧪 테스트 방법

### 1. 웹 앱 접속
```
https://3000-i76on73jhx68e3lvjdosj-02b9cc79.sandbox.novita.ai
```

### 2. 로그인 시도
- 아이디: `admin`
- 비밀번호: `admin123`
- "로그인" 버튼 클릭

### 3. 성공 확인
- ✅ "로그인 성공!" 토스트 메시지
- ✅ 관리자 대시보드 표시
- ✅ AS 접수 통계 표시

---

## ⚠️ 만약 여전히 오류가 발생한다면

### 브라우저 콘솔 확인
1. F12 키 눌러 개발자 도구 열기
2. **Console** 탭 클릭
3. 빨간색 오류 메시지 확인
4. 오류 메시지를 저에게 알려주세요

### 서버 로그 확인
```bash
pm2 logs webapp --nostream --lines 20
```

---

## 📋 빠른 체크리스트

- [ ] Supabase Dashboard 접속
- [ ] SQL Editor 열기
- [ ] `COMPLETE_MIGRATION.sql` 전체 내용 복사
- [ ] SQL Editor에 붙여넣기 후 Run
- [ ] "Migration completed successfully!" 메시지 확인
- [ ] Storage → as-photos 버킷 생성
- [ ] 웹 앱 접속 후 로그인 테스트

---

## 🎯 예상 소요 시간

- SQL 실행: **1분**
- Storage 버킷 생성: **1분**
- 로그인 테스트: **1분**
- **총 3분**

---

**SQL 실행 후 저에게 알려주시면 다음 단계를 진행하겠습니다!** 😊
