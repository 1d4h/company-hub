// 비밀번호 해시 생성 스크립트
const bcrypt = require('bcryptjs');

const accounts = [
  { username: 'admin', password: 'admin123', role: 'admin', name: '관리자' },
  { username: 'master1', password: 'master1', role: 'admin', name: 'Master 1' },
  { username: 'master2', password: 'master2', role: 'admin', name: 'Master 2' },
  { username: 'master3', password: 'master3', role: 'admin', name: 'Master 3' },
  { username: 'test1', password: 'test1', role: 'user', name: '테스트 사용자 1' },
  { username: 'test2', password: 'test2', role: 'user', name: '테스트 사용자 2' },
  { username: 'test3', password: 'test3', role: 'user', name: '테스트 사용자 3' },
  { username: 'test4', password: 'test4', role: 'user', name: '테스트 사용자 4' },
  { username: 'test5', password: 'test5', role: 'user', name: '테스트 사용자 5' },
  { username: 'test6', password: 'test6', role: 'user', name: '테스트 사용자 6' },
  { username: 'test7', password: 'test7', role: 'user', name: '테스트 사용자 7' },
  { username: 'test8', password: 'test8', role: 'user', name: '테스트 사용자 8' },
  { username: 'test9', password: 'test9', role: 'user', name: '테스트 사용자 9' },
  { username: 'test10', password: 'test10', role: 'user', name: '테스트 사용자 10' }
];

console.log('🔐 비밀번호 해시 생성 중...\n');
console.log('-- ✅ Supabase SQL Editor에서 실행할 SQL:');
console.log('-- 기존 사용자 삭제');
console.log("DELETE FROM users WHERE username IN ('admin', 'master1', 'master2', 'master3', 'test1', 'test2', 'test3', 'test4', 'test5', 'test6', 'test7', 'test8', 'test9', 'test10');\n");
console.log('-- 새로운 사용자 생성 (올바른 bcrypt 해시)');
console.log('INSERT INTO users (id, username, password_hash, role, name) VALUES');

const values = [];
accounts.forEach((account, index) => {
  const hash = bcrypt.hashSync(account.password, 10);
  values.push(`  (gen_random_uuid(), '${account.username}', '${hash}', '${account.role}', '${account.name}')`);
  console.log(`-- ${account.username} (${account.password}) → ${hash.substring(0, 30)}...`);
});

console.log('\n' + values.join(',\n') + ';\n');
console.log('-- 계정 확인');
console.log('SELECT username, role, name, created_at FROM users ORDER BY username;');
console.log('\n✅ 위 SQL을 복사해서 Supabase SQL Editor에서 실행하세요!');
