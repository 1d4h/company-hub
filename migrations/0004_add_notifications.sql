-- ============================================
-- 알림 시스템 테이블 생성
-- ============================================

-- 알림 테이블
CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  customer_id BIGINT REFERENCES public.customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('as_complete', 'as_update', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_customer_id ON public.notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- RLS 활성화
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 알림만 조회
CREATE POLICY "Users can view own notifications" 
ON public.notifications FOR SELECT 
USING (user_id = (SELECT id FROM public.users WHERE username = current_user));

-- RLS 정책: 본인 알림만 업데이트 (읽음 처리)
CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE 
USING (user_id = (SELECT id FROM public.users WHERE username = current_user));

-- RLS 정책: 시스템에서 알림 생성 (service_role)
CREATE POLICY "Service role can insert notifications" 
ON public.notifications FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Comment 추가
COMMENT ON TABLE public.notifications IS '사용자 알림 테이블';
COMMENT ON COLUMN public.notifications.type IS '알림 타입: as_complete(A/S완료), as_update(A/S업데이트), system(시스템)';
COMMENT ON COLUMN public.notifications.is_read IS '읽음 여부';
