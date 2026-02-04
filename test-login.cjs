// 로그인 테스트 스크립트
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

const testAccounts = [
  { username: 'admin', password: 'admin123', name: '관리자' },
  { username: 'test1', password: 'test1', name: '테스트 사용자 1' },
  { username: 'test2', password: 'test2', name: '테스트 사용자 2' },
  { username: 'test3', password: 'test3', name: '테스트 사용자 3' }
];

async function testLogin(username, password) {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username,
      password
    });
    
    if (response.data.success) {
      console.log(`✅ ${username} 로그인 성공! (${response.data.user.name})`);
      return true;
    } else {
      console.log(`❌ ${username} 로그인 실패: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${username} 로그인 오류: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 로그인 테스트 시작...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const account of testAccounts) {
    const success = await testLogin(account.username, account.password);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // 0.5초 대기
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 테스트 결과: ${successCount}개 성공, ${failCount}개 실패`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (failCount === 0) {
    console.log('🎉 모든 로그인 테스트 통과!');
  } else {
    console.log('⚠️  일부 테스트 실패. 로그를 확인하세요.');
  }
}

runTests();
