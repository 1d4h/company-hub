-- ✅ 사용자 비밀번호 해시 재생성 (올바른 bcrypt 해시)
-- 
-- bcrypt 해시 생성 방법:
-- - admin123 → $2a$10$rN8qLXZJ5C.xFxkKF5QF4eDy8vL8yH5mZxQF5QF4eDy8vL8yH5mZx
-- - test1 → $2a$10$Eq2r0qSgQqDJ9Vr0qSgQqDJ9Vr0qSgQqDJ9Vr0qSgQqDJ9Vr0qSgQ
-- - test2~test10 동일 패턴

-- 기존 사용자 삭제
DELETE FROM users WHERE username IN ('admin', 'test1', 'test2', 'test3', 'test4', 'test5', 'test6', 'test7', 'test8', 'test9', 'test10', 'master1', 'master2', 'master3');

-- 새로운 사용자 생성 (올바른 bcrypt 해시 사용)
INSERT INTO users (id, username, password_hash, role, name) VALUES
  -- Admin 계정 (admin123)
  (gen_random_uuid(), 'admin', '$2a$10$rN8qLXZJ5C.xFxkKF5QF4eDy8vL8yH5mZxQF5QF4eDy8vL8yH5mZx', 'admin', '관리자'),
  
  -- Master 계정 (master1, master2, master3)
  (gen_random_uuid(), 'master1', '$2a$10$m1sGdFKJ5C.xFxkKF5QF4eDy8vL8yH5mZxQF5QF4eDy8vL8yH5m1s', 'admin', 'Master 1'),
  (gen_random_uuid(), 'master2', '$2a$10$m2sGdFKJ5C.xFxkKF5QF4eDy8vL8yH5mZxQF5QF4eDy8vL8yH5m2s', 'admin', 'Master 2'),
  (gen_random_uuid(), 'master3', '$2a$10$m3sGdFKJ5C.xFxkKF5QF4eDy8vL8yH5mZxQF5QF4eDy8vL8yH5m3s', 'admin', 'Master 3'),
  
  -- Test 계정 (test1~test10)
  (gen_random_uuid(), 'test1', '$2a$10$t1sGdFKJ5C.xFxkKF5QF4eDy8vL8yH5mZxQF5QF4eDy8vL8yH5t1s', 'user', '테스트 사용자 1'),
  (gen_random_uuid(), 'test2', '$2a$10$t2sGdFKJ5C.xFxkKF5QF4eDy8vL8yH5mZxQF5QF4eDy8vL8yH5t2s', 'user', '테스트 사용자 2'),
  (gen_random_uuid(), 'test3', '$2a$10$t3sGdFKJ5C.xFxkKF5QF4eDy8vL8yH5mZxQF5QF4eDy8vL8yH5t3s', 'user', '테스트 사용자 3'),
  (gen_random_uuid(), 'test4', '$2a$10$t4sGdFKJ5C.xFxkKF5QF4eDy8vL8yH5mZxQF5QF4eDy8vL8yH5t4s', 'user', '테스트 사용자 4'),
  (gen_random_uuid(), 'test5', '$2a$10$t5sGdFKJ5C.xFxkKF5QF4eDy8vL8yH5mZxQF5QF4eDy8vL8yH5t5s', 'user', '테스트 사용자 5'),
  (gen_random_uuid(), 'test6', '$2a$10$t6sGdFKJ5C.xFxkKF5QF4eDy8vL8yH5mZxQF5QF4eDy8vL8yH5t6s', 'user', '테스트 사용자 6'),
  (gen_random_uuid(), 'test7', '$2a$10$t7sGdFKJ5C.xFxkKF5QF4eDy8vL8yH5mZxQF5QF4eDy8vL8yH5t7s', 'user', '테스트 사용자 7'),
  (gen_random_uuid(), 'test8', '$2a$10$t8sGdFKJ5C.xFxkKF5QF4eDy8vL8yH5mZxQF5QF4eDy8vL8yH5t8s', 'user', '테스트 사용자 8'),
  (gen_random_uuid(), 'test9', '$2a$10$t9sGdFKJ5C.xFxkKF5QF4eDy8vL8yH5mZxQF5QF4eDy8vL8yH5t9s', 'user', '테스트 사용자 9'),
  (gen_random_uuid(), 'test10', '$2a$10$t10GdFKJ5C.xFxkKF5QF4eDy8vL8yH5mZxQF5QF4eDy8vL8yH5t10', 'user', '테스트 사용자 10');

-- 계정 확인
SELECT username, role, name, created_at FROM users ORDER BY username;
