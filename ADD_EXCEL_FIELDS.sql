-- customers 테이블에 Excel 업로드 필드 추가
-- 실행 날짜: 2026-02-08
-- 목적: Excel 파일 업로드 시 필요한 모든 필드 지원

-- 새로운 컬럼 추가
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS sequence TEXT,
ADD COLUMN IF NOT EXISTS count TEXT,
ADD COLUMN IF NOT EXISTS receipt_date DATE,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS install_date DATE,
ADD COLUMN IF NOT EXISTS heat_source TEXT,
ADD COLUMN IF NOT EXISTS as_content TEXT,
ADD COLUMN IF NOT EXISTS install_team TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS receptionist TEXT,
ADD COLUMN IF NOT EXISTS as_result TEXT;

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_customers_receipt_date ON public.customers(receipt_date);
CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers(company);
CREATE INDEX IF NOT EXISTS idx_customers_category ON public.customers(category);
CREATE INDEX IF NOT EXISTS idx_customers_region ON public.customers(region);
CREATE INDEX IF NOT EXISTS idx_customers_as_result ON public.customers(as_result);

-- 확인 쿼리
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'customers'
ORDER BY ordinal_position;
