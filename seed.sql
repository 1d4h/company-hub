-- Sample customer data for testing
INSERT OR IGNORE INTO customers (customer_name, phone, email, address, address_detail, latitude, longitude, memo, created_by) VALUES 
  ('김철수', '010-1234-5678', 'kim@example.com', '서울특별시 강남구 테헤란로 123', '456호', 37.5012, 127.0396, '중요 고객', 1),
  ('이영희', '010-2345-6789', 'lee@example.com', '서울특별시 서초구 서초대로 45', '101호', 37.4833, 127.0322, '정기 방문', 1),
  ('박민수', '010-3456-7890', 'park@example.com', '서울특별시 송파구 올림픽로 300', '202호', 37.5145, 127.1059, '신규 고객', 1);
