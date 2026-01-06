-- Add Excel template fields to customers table
ALTER TABLE customers ADD COLUMN sequence INTEGER;
ALTER TABLE customers ADD COLUMN count INTEGER;
ALTER TABLE customers ADD COLUMN receipt_date TEXT;
ALTER TABLE customers ADD COLUMN company TEXT;
ALTER TABLE customers ADD COLUMN category TEXT;
ALTER TABLE customers ADD COLUMN install_date TEXT;
ALTER TABLE customers ADD COLUMN heat_source TEXT;
ALTER TABLE customers ADD COLUMN as_content TEXT;
ALTER TABLE customers ADD COLUMN install_team TEXT;
ALTER TABLE customers ADD COLUMN region TEXT;
ALTER TABLE customers ADD COLUMN receptionist TEXT;
ALTER TABLE customers ADD COLUMN as_result TEXT;
