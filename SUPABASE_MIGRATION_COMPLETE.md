# ✅ Supabase 프로젝트 변경 완료

## 📋 변경 요약

**날짜**: 2026-02-08  
**Git 커밋**: bce64ee  
**공개 URL**: https://3000-i76on73jhx68e3lvjdosj-02b9cc79.sandbox.novita.ai

---

## 🔄 변경된 Supabase 키

### **이전 (Old)**
```
SUPABASE_URL=https://zgeunzvwozsfzwxasdee.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZXVuenZ3b3pzZnp3eGFzZGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDA2OTgsImV4cCI6MjA4NTc3NjY5OH0.tzhVRxNdd2a-I702YeBpVrWBUWfebdah6oi77GpMx2g
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **신규 (New)** ✅
```
SUPABASE_URL=https://peelrrycglnqdcxtllfr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZWxycnljZ2xucWRjeHRsbGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjM5NzAsImV4cCI6MjA4NjA5OTk3MH0.t_Hap-t_4DurLLCPzSD-o88uhtL5HbpNsxvrhTTCNyw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZWxycnljZ2xucWRjeHRsbGZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDUyMzk3MCwiZXhwIjoyMDg2MDk5OTcwfQ.lcIF0QiTZ28BMEfTACW3DATwBqaiqwUaoB3BtMnq0s4
```

---

## 📝 변경된 파일

### 1. **.env 파일** ✅
```bash
# .env (Git에 커밋되지 않음 - 보안)
SUPABASE_URL=https://peelrrycglnqdcxtllfr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZWxycnljZ2xucWRjeHRsbGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjM5NzAsImV4cCI6MjA4NjA5OTk3MH0.t_Hap-t_4DurLLCPzSD-o88uhtL5HbpNsxvrhTTCNyw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZWxycnljZ2xucWRjeHRsbGZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDUyMzk3MCwiZXhwIjoyMDg2MDk5OTcwfQ.lcIF0QiTZ28BMEfTACW3DATwBqaiqwUaoB3BtMnq0s4
```

**변경 사항:**
- 백엔드 Supabase 클라이언트가 이 환경 변수를 자동으로 사용
- `server.js`의 `createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)`

---

### 2. **server.js** ✅ (Git 커밋됨)

**변경 위치: HTML 템플릿 내 프론트엔드 Supabase 클라이언트**

```javascript
// server.js 약 1487번째 줄
<script>
  const { createClient } = supabase
  window.supabaseClient = createClient(
    'https://peelrrycglnqdcxtllfr.supabase.co',  // ✅ 변경됨
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZWxycnljZ2xucWRjeHRsbGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjM5NzAsImV4cCI6MjA4NjA5OTk3MH0.t_Hap-t_4DurLLCPzSD-o88uhtL5HbpNsxvrhTTCNyw'  // ✅ 변경됨
  )
  console.log('✅ Supabase 클라이언트 초기화 완료')
</script>
```

---

## ✅ 변경 완료 확인

### 1. **서버 로그 확인**
```
✅ Web Push VAPID 설정 완료
✅ Supabase 클라이언트 초기화 완료
📍 Supabase URL: https://peelrrycglnqdcxtllfr.supabase.co  ← 새 URL 확인
🚀 서버가 http://localhost:3000 에서 실행 중입니다
🗄️ Supabase 연동 완료
```

### 2. **HTML 응답 확인**
```bash
$ curl http://localhost:3000 | grep peelrrycglnqdcxtllfr
peelrrycglnqdcxtllfr  ← 새 URL이 HTML에 포함됨 ✅
```

### 3. **브라우저 콘솔 확인**
프론트엔드에서 브라우저 개발자 도구 → Console:
```
✅ Supabase 클라이언트 초기화 완료
```

---

## 🗂️ 새 Supabase 프로젝트 설정 필요 사항

**⚠️ 중요: 새 Supabase 프로젝트에 데이터베이스 스키마를 적용해야 합니다!**

### 1. **마이그레이션 파일 순차 실행**

Supabase Dashboard → SQL Editor에서 다음 파일들을 순서대로 실행:

```bash
1. migrations/0001_initial_schema.sql        # 기본 테이블 생성
2. migrations/0002_add_excel_fields.sql      # Excel 필드 추가
3. migrations/0003_add_kakao_login.sql       # 카카오 로그인 필드
4. migrations/0004_add_notifications.sql     # 알림 테이블
5. migrations/0005_add_push_subscriptions.sql # 푸시 구독 테이블
```

---

### 2. **Storage 버킷 생성**

Supabase Dashboard → Storage:

1. **버킷 생성**: `as-photos`
2. **Public 설정**: ✅ Public bucket (또는 RLS 정책 설정)
3. **파일 크기 제한**: 10MB

---

### 3. **RLS 정책 활성화 확인**

각 테이블에 대해 RLS(Row Level Security)가 활성화되어 있는지 확인:

- `users` - ✅ RLS 활성화
- `customers` - ✅ RLS 활성화
- `as_records` - ✅ RLS 활성화
- `as_photos` - ✅ RLS 활성화
- `upload_sessions` - ✅ RLS 활성화
- `notifications` - ✅ RLS 활성화
- `push_subscriptions` - ✅ RLS 활성화

---

## 🧪 테스트 체크리스트

새 Supabase 프로젝트로 전환 후 다음 기능들을 테스트하세요:

- [ ] 1. **로그인** - 사용자 로그인 가능 여부
- [ ] 2. **카카오 로그인** - 카카오 간편 로그인
- [ ] 3. **고객 조회** - 고객 목록 불러오기
- [ ] 4. **Excel 업로드** - Excel 파일 업로드 및 고객 추가
- [ ] 5. **A/S 결과 입력** - A/S 결과 저장
- [ ] 6. **사진 업로드** - A/S 사진 업로드 (Supabase Storage)
- [ ] 7. **알림 시스템** - A/S 완료 시 알림 수신
- [ ] 8. **푸시 알림** - 브라우저 푸시 알림 수신
- [ ] 9. **지도 표시** - Kakao Maps 정상 작동
- [ ] 10. **자동 로그인** - 자동 로그인 기능

---

## 📋 마이그레이션 빠른 가이드

### **방법 1: Supabase SQL Editor 사용**

1. Supabase Dashboard 접속
2. SQL Editor 메뉴 클릭
3. 각 마이그레이션 파일 내용 복사
4. SQL Editor에 붙여넣기
5. "Run" 버튼 클릭
6. 순서대로 반복 (0001 → 0005)

---

### **방법 2: Supabase CLI 사용 (추천)**

```bash
# 1. Supabase CLI 설치
npm install -g supabase

# 2. Supabase 프로젝트와 연결
supabase link --project-ref peelrrycglnqdcxtllfr

# 3. 마이그레이션 실행
supabase db push

# 4. 원격 DB 상태 확인
supabase db remote status
```

---

## 🔒 보안 참고사항

### **1. .env 파일은 Git에 커밋되지 않습니다**
- `.gitignore`에 `.env` 포함
- 서버 환경 변수로만 관리
- **절대 GitHub에 업로드하지 마세요!**

### **2. ANON_KEY는 공개되어도 괜찮습니다**
- 브라우저(HTML)에서 사용되므로 노출됨
- RLS 정책으로 보호됨
- **반드시 Supabase에서 RLS를 활성화하세요!**

### **3. SERVICE_ROLE_KEY는 절대 노출 금지**
- 관리자 권한 키
- RLS를 우회할 수 있음
- 서버 코드에만 사용 (클라이언트 절대 금지)

---

## ✅ 변경 완료 요약

1. ✅ **.env 파일 업데이트** - 새 Supabase 키로 교체
2. ✅ **server.js 백엔드** - 환경 변수 자동 사용
3. ✅ **server.js 프론트엔드** - HTML 템플릿 내 Supabase URL/Key 업데이트
4. ✅ **서버 재시작** - PM2로 재시작 완료
5. ✅ **Git 커밋** - server.js 변경 사항 커밋

---

## 🚀 다음 단계

1. **Supabase 마이그레이션 실행** - 데이터베이스 스키마 생성
2. **Storage 버킷 생성** - `as-photos` 버킷 생성
3. **RLS 정책 확인** - 모든 테이블의 RLS 활성화 확인
4. **기능 테스트** - 로그인, 고객 조회, A/S 입력 등 테스트
5. **데이터 마이그레이션** (필요 시) - 이전 DB에서 데이터 이전

---

**모든 Supabase 키 변경이 완료되었습니다!** 🎉

새 Supabase 프로젝트에서 마이그레이션 파일을 실행하면 바로 사용할 수 있습니다.
