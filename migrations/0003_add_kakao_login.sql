-- ============================================
-- 카카오 로그인 필드 추가
-- ============================================

-- 카카오 로그인 관련 컬럼 추가
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS kakao_id BIGINT UNIQUE,
ADD COLUMN IF NOT EXISTS kakao_nickname TEXT,
ADD COLUMN IF NOT EXISTS kakao_profile_image TEXT,
ADD COLUMN IF NOT EXISTS kakao_email TEXT,
ADD COLUMN IF NOT EXISTS login_type TEXT DEFAULT 'local';

-- login_type 체크 제약 조건 추가 (이미 있으면 무시)
DO $$ 
BEGIN
  ALTER TABLE public.users 
  ADD CONSTRAINT users_login_type_check 
  CHECK (login_type IN ('local', 'kakao'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 카카오 로그인 사용자는 password_hash NULL 허용
ALTER TABLE public.users 
ALTER COLUMN password_hash DROP NOT NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_kakao_id ON public.users(kakao_id);
CREATE INDEX IF NOT EXISTS idx_users_login_type ON public.users(login_type);

-- Comment 추가
COMMENT ON COLUMN public.users.kakao_id IS '카카오 사용자 고유 ID';
COMMENT ON COLUMN public.users.kakao_nickname IS '카카오 닉네임';
COMMENT ON COLUMN public.users.kakao_profile_image IS '카카오 프로필 사진 URL';
COMMENT ON COLUMN public.users.kakao_email IS '카카오 이메일';
COMMENT ON COLUMN public.users.login_type IS '로그인 타입: local(일반), kakao(카카오)';

-- ============================================
-- 카카오톡 채팅 메시지 테이블 (선택사항)
-- ============================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  customer_id BIGINT REFERENCES public.customers(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- 채팅 메시지 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_customer_id ON public.chat_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- RLS 활성화
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 메시지만 조회
CREATE POLICY "Users can view own messages" 
ON public.chat_messages FOR SELECT 
USING (auth.uid()::text = user_id::text);

-- RLS 정책: 본인 메시지 작성
CREATE POLICY "Users can insert own messages" 
ON public.chat_messages FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- Comment 추가
COMMENT ON TABLE public.chat_messages IS '카카오톡 채팅 메시지 (선택사항)';
COMMENT ON COLUMN public.chat_messages.sender_type IS '발신자 타입: user(사용자), admin(관리자)';
