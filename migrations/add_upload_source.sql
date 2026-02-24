-- Add upload_source column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS upload_source text DEFAULT 'as_reception';

-- Add comment
COMMENT ON COLUMN customers.upload_source IS 'Upload source: as_reception (A/S 접수대장) or field_management (현장 통합 관리)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_customers_upload_source ON customers(upload_source);
