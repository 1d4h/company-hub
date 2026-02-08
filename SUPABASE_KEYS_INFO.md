# 🔑 Supabase API Keys 정보

## 현재 사용 중인 Supabase 키

이 앱은 **3가지 Supabase 키**를 사용합니다:

---

## 1️⃣ SUPABASE_URL (필수 ✅)

**현재 값:**
```
https://zgeunzvwozsfzwxasdee.supabase.co
```

**설명:**
- Supabase 프로젝트의 API URL
- 프로젝트 고유 주소
- 변경 시: 새 프로젝트의 URL로 교체

**위치:**
- `.env` 파일: `SUPABASE_URL`
- `server.js` (하드코딩): 1292번째 줄 근처

**찾는 방법 (Supabase Dashboard):**
```
Project Settings → API → Project URL
```

---

## 2️⃣ SUPABASE_ANON_KEY (필수 ✅)

**현재 값:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZXVuenZ3b3pzZnp3eGFzZGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDA2OTgsImV4cCI6MjA4NTc3NjY5OH0.tzhVRxNdd2a-I702YeBpVrWBUWfebdah6oi77GpMx2g
```

**설명:**
- 클라이언트(브라우저)에서 사용하는 공개 API 키
- RLS(Row Level Security) 정책을 따름
- **브라우저에 노출되어도 안전** (RLS가 제대로 설정되어 있다면)

**위치:**
- `.env` 파일: `SUPABASE_ANON_KEY`
- `server.js` (하드코딩): 1293번째 줄 근처

**찾는 방법 (Supabase Dashboard):**
```
Project Settings → API → Project API keys → anon public
```

---

## 3️⃣ SUPABASE_SERVICE_ROLE_KEY (선택 ⚠️)

**현재 값:**
```
your-service-role-key  (설정되지 않음)
```

**설명:**
- **서버 전용 비밀 키** (절대 브라우저에 노출 금지)
- RLS를 우회할 수 있는 관리자 권한 키
- **현재 앱에서는 사용하지 않음**
- 필요한 경우: Admin API 작업, RLS 우회, 일괄 데이터 작업 등

**위치:**
- `.env` 파일: `SUPABASE_SERVICE_ROLE_KEY`
- 코드에서는 사용하지 않음

**찾는 방법 (Supabase Dashboard):**
```
Project Settings → API → Project API keys → service_role (⚠️ 비밀 키)
```

---

## 📍 키가 사용되는 위치

### **백엔드 (server.js)**
```javascript
// 환경 변수에서 로드 시도 (우선순위)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

// 환경 변수가 없으면 하드코딩된 값 사용 (fallback)
const supabase = createClient(
  supabaseUrl || 'https://zgeunzvwozsfzwxasdee.supabase.co',
  supabaseKey || 'eyJhbGci...'
)
```

**위치:** `server.js` 약 30번째 줄, 1292-1293번째 줄

### **프론트엔드 (HTML)**
```html
<script>
  const { createClient } = supabase
  window.supabaseClient = createClient(
    'https://zgeunzvwozsfzwxasdee.supabase.co',
    'eyJhbGci...'
  )
</script>
```

**위치:** `server.js` 1292-1293번째 줄 (HTML 템플릿 내)

---

## 🔄 키 변경 시 수정해야 하는 파일

### 1. `.env` 파일
```bash
SUPABASE_URL=https://새로운프로젝트.supabase.co
SUPABASE_ANON_KEY=새로운_anon_key
SUPABASE_SERVICE_ROLE_KEY=새로운_service_role_key  # 선택사항
```

### 2. `server.js` (2곳)

**① 백엔드 Supabase 클라이언트 (30번째 줄 근처)**
```javascript
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://새로운프로젝트.supabase.co',
  process.env.SUPABASE_ANON_KEY || '새로운_anon_key'
)
```

**② HTML 템플릿 내 프론트엔드 클라이언트 (1292-1293번째 줄)**
```javascript
window.supabaseClient = createClient(
  'https://새로운프로젝트.supabase.co',
  '새로운_anon_key'
)
```

---

## ⚠️ 중요 주의사항

### 1. **ANON_KEY는 공개되어도 괜찮습니다**
- 브라우저에서 사용되는 키이므로 노출됨
- RLS(Row Level Security) 정책으로 보호됨
- **반드시 Supabase에서 RLS를 활성화하세요!**

### 2. **SERVICE_ROLE_KEY는 절대 노출 금지**
- 관리자 권한 키
- RLS를 우회할 수 있음
- 서버 코드에만 사용 (클라이언트 절대 금지)
- 현재 앱에서는 사용하지 않음

### 3. **환경 변수 우선순위**
```
.env 파일 값 > 하드코딩된 값 (fallback)
```

---

## 🗂️ Supabase 데이터베이스 스키마

현재 앱에서 사용하는 Supabase 테이블:

1. **users** - 사용자 정보
2. **customers** - 고객 정보
3. **as_records** - A/S 기록
4. **as_photos** - A/S 사진
5. **upload_sessions** - 업로드 세션
6. **notifications** - 알림
7. **push_subscriptions** - 푸시 구독 정보

**마이그레이션 파일:**
- `migrations/0001_initial_schema.sql`
- `migrations/0002_add_excel_fields.sql`
- `migrations/0003_add_kakao_login.sql`
- `migrations/0004_add_notifications.sql`
- `migrations/0005_add_push_subscriptions.sql`

---

## 📋 새 Supabase 프로젝트로 마이그레이션 체크리스트

- [ ] 1. 새 Supabase 프로젝트 생성
- [ ] 2. Project URL 확인 및 복사
- [ ] 3. anon public key 확인 및 복사
- [ ] 4. service_role key 확인 (선택사항)
- [ ] 5. `.env` 파일 업데이트
- [ ] 6. `server.js` 하드코딩 부분 업데이트 (2곳)
- [ ] 7. 마이그레이션 파일 순차 실행 (0001 → 0005)
- [ ] 8. RLS 정책 활성화 확인
- [ ] 9. Storage 버킷 생성 (`as-photos`)
- [ ] 10. 서버 재시작 (`pm2 restart webapp`)
- [ ] 11. 테스트: 로그인, 고객 조회, A/S 등록

---

## 🔍 키 찾는 방법 상세

### Supabase Dashboard에서:

1. **프로젝트 선택**
2. 왼쪽 사이드바 → **⚙️ Project Settings**
3. **API** 메뉴 클릭
4. 화면에 표시되는 정보:

```
┌─────────────────────────────────────────┐
│ Project URL                             │
│ https://xxxxx.supabase.co               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Project API keys                        │
│                                         │
│ anon public                             │
│ eyJhbGci... (클릭하여 복사)              │
│                                         │
│ service_role (비밀, 노출 주의)           │
│ eyJhbGci... (클릭하여 복사)              │
└─────────────────────────────────────────┘
```

---

**현재 키를 새 키로 변경하려면, 위의 정보를 참고하여 새 키를 찾아서 알려주세요!**

변경이 필요한 키:
1. ✅ **SUPABASE_URL**
2. ✅ **SUPABASE_ANON_KEY**
3. ⚠️ **SUPABASE_SERVICE_ROLE_KEY** (선택사항, 현재 미사용)
