# 카카오 로그인 설정 가이드

## 🎯 개요
이 가이드는 카카오 로그인 간편 인증 기능을 설정하는 방법을 설명합니다.

## 📋 사전 준비

### 1. 카카오 개발자 계정 생성
1. https://developers.kakao.com/ 접속
2. 카카오 계정으로 로그인
3. 개발자 등록 (본인 인증 필요)

### 2. 애플리케이션 생성
1. "내 애플리케이션" 메뉴 클릭
2. "애플리케이션 추가하기" 클릭
3. 앱 정보 입력:
   - 앱 이름: `AS접수현황 관리`
   - 사업자명: 본인 이름 또는 회사명
4. "저장" 클릭

## 🔑 API 키 발급

### JavaScript 키 (현재 사용 중)
- **Maps API 키**: `c933c69ba4e0228895438c6a8c327e74`
- 이미 설정되어 있어 지도 기능에 사용 중

### REST API 키 (새로 필요)
1. "내 애플리케이션" → 앱 선택
2. "앱 키" 탭 클릭
3. **REST API 키** 복사
4. `.env` 파일에 추가:
```bash
KAKAO_REST_API_KEY=your-rest-api-key
```

## 🔧 플랫폼 설정

### 1. Web 플랫폼 등록
1. "내 애플리케이션" → 앱 선택
2. "플랫폼" 탭 → "Web 플랫폼 등록"
3. 사이트 도메인 입력:
   - **로컬 개발**: `http://localhost:3000`
   - **샌드박스**: `https://3000-irn3f4j2vutvnwvbf7bwh-cc2fbc16.sandbox.novita.ai`
   - **프로덕션**: 실제 배포 도메인
4. "저장" 클릭

### 2. Redirect URI 설정
1. "제품 설정" → "카카오 로그인" 클릭
2. "활성화 설정" → **ON**으로 변경
3. "Redirect URI 등록" 클릭
4. 다음 URI 추가:
```
http://localhost:3000/api/auth/kakao/callback
https://3000-irn3f4j2vutvnwvbf7bwh-cc2fbc16.sandbox.novita.ai/api/auth/kakao/callback
```
5. "저장" 클릭

### 3. 동의 항목 설정
1. "제품 설정" → "카카오 로그인" → "동의 항목"
2. 다음 항목 설정:
   - **닉네임**: 필수 동의 (ON)
   - **프로필 사진**: 선택 동의 (ON)
   - **카카오계정(이메일)**: 선택 동의 (ON)
3. "저장" 클릭

## 📦 채널톡 설정 (선택)

### 1. 카카오톡 채널 생성
1. https://center-pf.kakao.com/ 접속
2. "새 채널 만들기" 클릭
3. 채널 정보 입력:
   - 채널명: `AS접수 고객센터`
   - 검색용 아이디: 영문 소문자, 숫자 조합
4. "확인" 클릭

### 2. 채널 ID 확인
1. 채널 관리자센터 → "관리" → "상세 설정"
2. "채널 ID" 복사
3. `.env` 파일에 추가:
```bash
KAKAO_CHANNEL_ID=_your_channel_id
```

### 3. JavaScript SDK 설정
프론트엔드 코드에서 자동으로 설정됩니다:
```javascript
Kakao.Channel.createChatButton({
  container: '#kakao-talk-channel-chat-button',
  channelPublicId: 'YOUR_CHANNEL_ID'
})
```

## 🔐 환경 변수 설정

### `.env` 파일 생성
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# T Map API Key
TMAP_APP_KEY=vSWmSa8CcO4uvyc0EsAg46SWvxNVAKzL8KGbckPB

# Kakao API Keys
KAKAO_REST_API_KEY=your-rest-api-key
KAKAO_JAVASCRIPT_KEY=c933c69ba4e0228895438c6a8c327e74
KAKAO_CHANNEL_ID=_your_channel_id
```

## 🗄️ Supabase 스키마 업데이트

### Users 테이블 수정
```sql
-- 카카오 로그인 필드 추가
ALTER TABLE public.users
ADD COLUMN kakao_id BIGINT UNIQUE,
ADD COLUMN kakao_nickname TEXT,
ADD COLUMN kakao_profile_image TEXT,
ADD COLUMN kakao_email TEXT,
ADD COLUMN login_type TEXT DEFAULT 'local' CHECK (login_type IN ('local', 'kakao'));

-- 인덱스 추가
CREATE INDEX idx_users_kakao_id ON public.users(kakao_id);
CREATE INDEX idx_users_login_type ON public.users(login_type);

-- 카카오 로그인 사용자는 password_hash NULL 허용
ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;

-- Comment 추가
COMMENT ON COLUMN public.users.kakao_id IS '카카오 사용자 고유 ID';
COMMENT ON COLUMN public.users.login_type IS '로그인 타입: local(일반), kakao(카카오)';
```

## 🧪 테스트

### 1. 로컬 테스트
```bash
# 서버 시작
pm2 restart webapp

# 브라우저에서 접속
http://localhost:3000

# 카카오 로그인 버튼 클릭
# 카카오 계정으로 로그인
# 동의 화면에서 권한 승인
# 자동으로 애플리케이션에 로그인됨
```

### 2. 로그 확인
```bash
pm2 logs webapp --nostream
```

다음과 같은 로그가 표시되어야 합니다:
```
✅ 카카오 로그인 성공: kakao_123456789
📝 신규 카카오 사용자 등록: 홍길동
```

## 🚨 문제 해결

### 1. "redirect_uri mismatch" 오류
- Kakao Developers에서 Redirect URI가 정확히 등록되었는지 확인
- URL 끝에 `/` 여부 확인 (정확히 일치해야 함)

### 2. "invalid client" 오류
- REST API 키가 `.env` 파일에 올바르게 설정되었는지 확인
- 서버 재시작 후 다시 시도

### 3. "KakaoTalk channel not found" 오류
- 채널 ID가 `_`로 시작하는지 확인
- 채널이 공개 상태인지 확인

### 4. 로그인 후 사용자 정보가 저장되지 않음
- Supabase 스키마가 업데이트되었는지 확인
- RLS 정책이 올바르게 설정되었는지 확인

## 📚 참고 문서

- [카카오 로그인 REST API](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
- [카카오 JavaScript SDK](https://developers.kakao.com/docs/latest/ko/javascript/getting-started)
- [카카오톡 채널](https://developers.kakao.com/docs/latest/ko/kakaotalk-channel/common)

## 🎉 완료!

설정이 완료되면 다음 기능을 사용할 수 있습니다:
- ✅ 카카오 계정으로 간편 로그인
- ✅ 자동 회원가입 (최초 로그인 시)
- ✅ 프로필 사진 및 닉네임 자동 설정
- ✅ 지도 화면에서 카카오톡 채널 채팅
