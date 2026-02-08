-- 계정 비밀번호 업데이트 SQL
-- 비밀번호는 각 계정의 username과 동일하게 설정
-- 예: master1의 비밀번호는 'master1', test1의 비밀번호는 'test1'

-- 관리자 계정 (master1, master2, master3)
UPDATE users SET password = '$2b$10$AUT/dEyCbJv/kk8NHdu/yOCJa/me3qcz7ZmKRcF8j8uhQDG5E1pSu' WHERE username = 'master1';
UPDATE users SET password = '$2b$10$LT18zkrmPBbh3qYbXcpJdugyggX19EEqRWG2b2lBTSiOlQPerqbfm' WHERE username = 'master2';
UPDATE users SET password = '$2b$10$tFsSUtE2ctsL1MFei1YlruVwWxfaR84LTxAfQeI2txc9xNGRTfGyK' WHERE username = 'master3';

-- 사용자 계정 (test1 ~ test10)
UPDATE users SET password = '$2b$10$2Z5aHAukoeIlddm6Ezpotu7TCyuhpRr08rnufKAXYWPkLjLg81VgG' WHERE username = 'test1';
UPDATE users SET password = '$2b$10$OOlHRGfzHVWp.FggOWdOzOx6Hz69BITwOAS0dDM9phoqbYufL66Mi' WHERE username = 'test2';
UPDATE users SET password = '$2b$10$QcTEIdCIZWAlI/eq3kRhfOrfz3yKfX1g9i6kkeQGoiTkZGHiP/sHS' WHERE username = 'test3';
UPDATE users SET password = '$2b$10$D3dliMYDuKcJiUOjZ1M8/egDlhIB3muNjgCjifkOMkCMWgIZxi5fC' WHERE username = 'test4';
UPDATE users SET password = '$2b$10$g96J/0rSAP1UXL3UjGBagu2tjFkp3OiOFz6M6TdaYZQH2nogahGk.' WHERE username = 'test5';
UPDATE users SET password = '$2b$10$HlxPRAaG3.2ixc0MiK.C0.yZq6EpNyL1wf2ia5M8nSXhRCJ5pAEMq' WHERE username = 'test6';
UPDATE users SET password = '$2b$10$0jMAHYLQGt6s27VF5Ue2Jubm/DPrPQppGiuie0opNh/ILacZx.K4W' WHERE username = 'test7';
UPDATE users SET password = '$2b$10$6tEWbQQGv.dbcL/mEtuf1eaXwRWcrhZCqp/GRvxQMKq04eU6XsNqG' WHERE username = 'test8';
UPDATE users SET password = '$2b$10$k8k7JuXBMMMfzCbnP9oXluSS3ll1D6J8CbzA7FfLzCQbsDTQcHXWi' WHERE username = 'test9';
UPDATE users SET password = '$2b$10$2XYIfFYJw.bVUJnL0nLu7.k4S.mih3M/94RN0CMfv38jmdgYPqB86' WHERE username = 'test10';

-- 확인 쿼리
SELECT username, role, name FROM users WHERE username IN ('master1', 'master2', 'master3', 'test1', 'test2', 'test3', 'test4', 'test5', 'test6', 'test7', 'test8', 'test9', 'test10') ORDER BY role, username;
