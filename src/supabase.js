import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 설정
// 환경 변수에서 URL과 Key를 가져옵니다
const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 연결 테스트 함수
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count')
    
    if (error) {
      console.error('❌ Supabase 연결 실패:', error.message)
      return false
    }
    
    console.log('✅ Supabase 연결 성공!')
    return true
  } catch (error) {
    console.error('❌ Supabase 연결 오류:', error)
    return false
  }
}

// 비밀번호 해싱 (bcrypt 사용)
import bcrypt from 'bcryptjs'

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash)
}
