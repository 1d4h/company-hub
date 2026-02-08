-- =============================================
-- Migration: 0005_add_push_subscriptions
-- Description: Web Push 구독 정보 저장용 테이블
-- Created: 2026-02-08
-- =============================================

-- 1. Push Subscriptions 테이블 생성
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created_at ON public.push_subscriptions(created_at);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성
-- 사용자는 자신의 구독 정보만 조회 가능
CREATE POLICY select_own_subscriptions ON public.push_subscriptions
  FOR SELECT
  USING (auth.uid()::BIGINT = user_id);

-- 사용자는 자신의 구독 정보만 생성 가능
CREATE POLICY insert_own_subscriptions ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid()::BIGINT = user_id);

-- 사용자는 자신의 구독 정보만 업데이트 가능
CREATE POLICY update_own_subscriptions ON public.push_subscriptions
  FOR UPDATE
  USING (auth.uid()::BIGINT = user_id);

-- 사용자는 자신의 구독 정보만 삭제 가능
CREATE POLICY delete_own_subscriptions ON public.push_subscriptions
  FOR DELETE
  USING (auth.uid()::BIGINT = user_id);

-- 5. 코멘트 추가
COMMENT ON TABLE public.push_subscriptions IS 'Web Push 구독 정보 저장';
COMMENT ON COLUMN public.push_subscriptions.user_id IS '사용자 ID';
COMMENT ON COLUMN public.push_subscriptions.endpoint IS 'Push 서비스 엔드포인트 URL';
COMMENT ON COLUMN public.push_subscriptions.p256dh IS '공개키 (암호화용)';
COMMENT ON COLUMN public.push_subscriptions.auth IS '인증 시크릿';
COMMENT ON COLUMN public.push_subscriptions.user_agent IS '브라우저 User Agent';
COMMENT ON COLUMN public.push_subscriptions.created_at IS '생성일시';
COMMENT ON COLUMN public.push_subscriptions.updated_at IS '수정일시';
COMMENT ON COLUMN public.push_subscriptions.last_used_at IS '마지막 사용일시';
