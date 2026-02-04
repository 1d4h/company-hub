import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const app = new Hono()

// Supabase 클라이언트 생성
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL 또는 SUPABASE_ANON_KEY가 설정되지 않았습니다.')
  console.error('📝 .env 파일을 확인해주세요.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('✅ Supabase 클라이언트 초기화 완료')
console.log('📍 Supabase URL:', supabaseUrl)

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 제공
app.use('/static/*', serveStatic({ root: './public' }))

// ============================================
// 인증 API
// ============================================
app.post('/api/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    
    console.log('🔐 로그인 시도:', username)
    
    // Supabase에서 사용자 조회
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase 오류:', error)
      return c.json({ success: false, message: '로그인 처리 중 오류가 발생했습니다.' }, 500)
    }
    
    if (!users || users.length === 0) {
      console.log('❌ 사용자를 찾을 수 없음:', username)
      return c.json({ success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' }, 401)
    }
    
    const user = users[0]
    
    // 비밀번호 검증 (bcrypt)
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!isValidPassword) {
      console.log('❌ 비밀번호 불일치:', username)
      return c.json({ success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' }, 401)
    }
    
    console.log('✅ 로그인 성공:', username, '/', user.role)
    
    return c.json({ 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      }
    })
  } catch (error) {
    console.error('❌ 로그인 오류:', error)
    return c.json({ success: false, message: '로그인 처리 중 오류가 발생했습니다.' }, 500)
  }
})

// ============================================
// 고객 관리 API
// ============================================

// 모든 고객 조회
app.get('/api/customers', async (c) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ 고객 조회 오류:', error)
      return c.json({ success: false, message: '고객 조회 중 오류가 발생했습니다.' }, 500)
    }
    
    console.log(`✅ 고객 조회 성공: ${data.length}명`)
    return c.json({ success: true, customers: data })
  } catch (error) {
    console.error('❌ 고객 조회 오류:', error)
    return c.json({ success: false, message: '고객 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// 고객 상세 조회
app.get('/api/customers/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ success: false, message: '고객을 찾을 수 없습니다.' }, 404)
      }
      console.error('❌ 고객 상세 조회 오류:', error)
      return c.json({ success: false, message: '고객 조회 중 오류가 발생했습니다.' }, 500)
    }
    
    return c.json({ success: true, customer: data })
  } catch (error) {
    console.error('❌ 고객 상세 조회 오류:', error)
    return c.json({ success: false, message: '고객 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// 고객 생성
app.post('/api/customers', async (c) => {
  try {
    const customerData = await c.req.json()
    
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single()
    
    if (error) {
      console.error('❌ 고객 생성 오류:', error)
      return c.json({ success: false, message: '고객 생성 중 오류가 발생했습니다.' }, 500)
    }
    
    console.log('✅ 고객 생성 성공:', data.customer_name)
    return c.json({ success: true, id: data.id })
  } catch (error) {
    console.error('❌ 고객 생성 오류:', error)
    return c.json({ success: false, message: '고객 생성 중 오류가 발생했습니다.' }, 500)
  }
})

// Excel 날짜 변환 함수 (Excel의 날짜 직렬 번호를 YYYY-MM-DD로 변환)
function excelDateToJSDate(serial) {
  if (!serial || typeof serial !== 'number') return null
  const utc_days = Math.floor(serial - 25569)
  const utc_value = utc_days * 86400
  const date_info = new Date(utc_value * 1000)
  
  const year = date_info.getUTCFullYear()
  const month = String(date_info.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date_info.getUTCDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

// 날짜 형식 정규화 함수
function normalizeDate(dateStr) {
  if (!dateStr) return null
  
  // 숫자인 경우 (Excel 직렬 번호)
  if (typeof dateStr === 'number') {
    return excelDateToJSDate(dateStr)
  }
  
  // 문자열인 경우
  const str = String(dateStr).trim()
  
  // 이미 YYYY-MM-DD 형식
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str
  }
  
  // YYYY.MM.DD 또는 YYYY/MM/DD 형식
  if (/^\d{4}[.\/]\d{1,2}[.\/]\d{1,2}$/.test(str)) {
    const parts = str.split(/[.\/]/)
    const year = parts[0]
    const month = parts[1].padStart(2, '0')
    const day = parts[2].padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // YYYY-MM 형식 (일자 없음)
  if (/^\d{4}-\d{2}$/.test(str)) {
    return `${str}-01`
  }
  
  // YYYY.MM 또는 YYYY/MM 형식
  if (/^\d{4}[.\/]\d{1,2}$/.test(str)) {
    const parts = str.split(/[.\/]/)
    const year = parts[0]
    const month = parts[1].padStart(2, '0')
    return `${year}-${month}-01`
  }
  
  return null
}

// 고객 일괄 업로드
app.post('/api/customers/batch-upload', async (c) => {
  try {
    const requestBody = await c.req.json()
    console.log('📥 업로드 요청 받음:', Object.keys(requestBody))
    
    // 프론트엔드에서 'data' 또는 'customers'로 전송 가능
    const customers = requestBody.data || requestBody.customers
    const userId = requestBody.userId
    
    if (!customers || !Array.isArray(customers)) {
      console.error('❌ 잘못된 데이터 형식:', typeof customers)
      return c.json({ 
        success: false, 
        message: '올바른 형식의 고객 데이터가 필요합니다.' 
      }, 400)
    }
    
    console.log(`📤 고객 일괄 업로드 시작: ${customers.length}명`)
    console.log('📄 첫 번째 고객 원본 데이터:', JSON.stringify(customers[0], null, 2))
    
    // 허용되는 컬럼 목록 (Supabase customers 테이블 스키마)
    const allowedColumns = [
      'sequence', 'count', 'receipt_date', 'company', 'category',
      'customer_name', 'phone', 'install_date', 'heat_source',
      'address', 'address_detail', 'as_content', 'install_team',
      'region', 'receptionist', 'as_result', 'latitude', 'longitude',
      'created_by'
    ]
    
    // 날짜 컬럼 목록
    const dateColumns = ['receipt_date', 'install_date']
    
    // 데이터 정제: 허용된 컬럼만 추출하고 잘못된 키 제거
    const cleanCustomers = customers.map((customer, index) => {
      const cleaned = {
        created_by: userId || null
      }
      
      // 허용된 컬럼만 복사
      allowedColumns.forEach(col => {
        let value = customer[col]
        
        // 값이 비어있거나 undefined면 건너뛰기
        if (value === undefined || value === null || value === '') {
          return
        }
        
        // 날짜 컬럼인 경우 형식 변환
        if (dateColumns.includes(col)) {
          value = normalizeDate(value)
          if (!value) {
            console.warn(`⚠️ 고객 ${index + 1}: ${col} 날짜 변환 실패 -`, customer[col])
            return
          }
        }
        
        cleaned[col] = value
      })
      
      return cleaned
    })
    
    console.log('🧹 데이터 정제 완료:', cleanCustomers.length, '명')
    console.log('📝 첫 번째 고객 정제된 데이터:', JSON.stringify(cleanCustomers[0], null, 2))
    
    const { data, error } = await supabase
      .from('customers')
      .insert(cleanCustomers)
      .select()
    
    if (error) {
      console.error('❌ 고객 일괄 업로드 오류:', error)
      return c.json({ 
        success: false, 
        message: `고객 업로드 중 오류가 발생했습니다: ${error.message}` 
      }, 500)
    }
    
    console.log(`✅ 고객 일괄 업로드 성공: ${data.length}명`)
    return c.json({ 
      success: true, 
      count: data.length,
      summary: {
        success: data.length,
        failed: 0
      }
    })
  } catch (error) {
    console.error('❌ 고객 일괄 업로드 오류:', error)
    return c.json({ 
      success: false, 
      message: `고객 업로드 중 오류가 발생했습니다: ${error.message}` 
    }, 500)
  }
})

// 고객 수정
app.put('/api/customers/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const updates = await c.req.json()
    
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('❌ 고객 수정 오류:', error)
      return c.json({ success: false, message: '고객 수정 중 오류가 발생했습니다.' }, 500)
    }
    
    console.log('✅ 고객 수정 성공:', data.customer_name)
    return c.json({ success: true, customer: data })
  } catch (error) {
    console.error('❌ 고객 수정 오류:', error)
    return c.json({ success: false, message: '고객 수정 중 오류가 발생했습니다.' }, 500)
  }
})

// 고객 삭제
app.delete('/api/customers/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('❌ 고객 삭제 오류:', error)
      return c.json({ success: false, message: '고객 삭제 중 오류가 발생했습니다.' }, 500)
    }
    
    console.log('✅ 고객 삭제 성공:', id)
    return c.json({ success: true })
  } catch (error) {
    console.error('❌ 고객 삭제 오류:', error)
    return c.json({ success: false, message: '고객 삭제 중 오류가 발생했습니다.' }, 500)
  }
})

// 고객 일괄 삭제
app.post('/api/customers/batch-delete', async (c) => {
  try {
    const { ids } = await c.req.json()
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ success: false, message: '삭제할 고객 ID가 필요합니다.' }, 400)
    }
    
    console.log(`🗑️ 고객 일괄 삭제 시작: ${ids.length}명, IDs:`, ids)
    
    const { data, error } = await supabase
      .from('customers')
      .delete()
      .in('id', ids)
      .select()
    
    if (error) {
      console.error('❌ 고객 일괄 삭제 오류:', error)
      return c.json({ success: false, message: `고객 삭제 중 오류가 발생했습니다: ${error.message}` }, 500)
    }
    
    const deletedCount = data ? data.length : ids.length
    console.log(`✅ 고객 일괄 삭제 성공: ${deletedCount}명`)
    return c.json({ success: true, deleted: deletedCount })
  } catch (error) {
    console.error('❌ 고객 일괄 삭제 오류:', error)
    return c.json({ success: false, message: `고객 삭제 중 오류가 발생했습니다: ${error.message}` }, 500)
  }
})

// Excel 데이터 검증 (메모리 기반 - 변경 없음)
app.post('/api/customers/validate', async (c) => {
  try {
    const { customers: newCustomers } = await c.req.json()
    
    // 기존 고객 조회
    const { data: existingCustomers, error } = await supabase
      .from('customers')
      .select('customer_name, phone, address')
    
    if (error) {
      console.error('❌ 고객 조회 오류:', error)
      return c.json({ success: false, message: '데이터 검증 중 오류가 발생했습니다.' }, 500)
    }
    
    const validCustomers = []
    const invalidCustomers = []
    const duplicateCustomers = []
    
    newCustomers.forEach((customer, index) => {
      // 필수 필드 검증
      if (!customer.customer_name || !customer.address) {
        invalidCustomers.push({
          ...customer,
          rowNumber: index + 2,
          reason: '고객명 또는 주소가 누락되었습니다'
        })
        return
      }
      
      // 중복 검사
      const isDuplicate = existingCustomers.some(existing => 
        existing.customer_name === customer.customer_name &&
        existing.phone === customer.phone &&
        existing.address === customer.address
      )
      
      if (isDuplicate) {
        duplicateCustomers.push({
          ...customer,
          rowNumber: index + 2,
          reason: '이미 등록된 고객입니다'
        })
        return
      }
      
      validCustomers.push(customer)
    })
    
    return c.json({
      success: true,
      valid: validCustomers,
      invalid: invalidCustomers,
      duplicates: duplicateCustomers
    })
  } catch (error) {
    console.error('❌ 데이터 검증 오류:', error)
    return c.json({ success: false, message: '데이터 검증 중 오류가 발생했습니다.' }, 500)
  }
})

// ============================================
// A/S 결과 API (Supabase 연동)
// ============================================
app.post('/api/customers/as-result', async (c) => {
  try {
    const { customerId, resultText, photos, completedAt } = await c.req.json()
    
    console.log('📋 A/S 결과 저장 요청:', {
      customerId,
      resultText: resultText?.substring(0, 50) + '...',
      photoCount: photos?.length || 0,
      completedAt
    })
    
    // 1. as_records 테이블에 저장
    const { data: asRecord, error: recordError } = await supabase
      .from('as_records')
      .insert([{
        customer_id: customerId,
        result_text: resultText,
        status: 'completed',
        completed_at: completedAt
      }])
      .select()
      .single()
    
    if (recordError) {
      console.error('❌ A/S 기록 저장 오류:', recordError)
      return c.json({ success: false, message: 'A/S 결과 저장 중 오류가 발생했습니다.' }, 500)
    }
    
    console.log('✅ A/S 기록 저장 성공:', asRecord.id)
    
    // 2. 사진 업로드 (Supabase Storage)
    if (photos && photos.length > 0) {
      for (const photo of photos) {
        try {
          // Base64를 Blob으로 변환
          const base64Data = photo.dataUrl.split(',')[1]
          const buffer = Buffer.from(base64Data, 'base64')
          
          // Storage에 업로드
          const storagePath = `${asRecord.id}/${photo.filename}`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('as-photos')
            .upload(storagePath, buffer, {
              contentType: photo.type,
              upsert: false
            })
          
          if (uploadError) {
            console.error('❌ 사진 업로드 오류:', uploadError)
            continue
          }
          
          console.log('✅ 사진 업로드 성공:', storagePath)
          
          // 3. as_photos 테이블에 메타데이터 저장
          const { error: photoError } = await supabase
            .from('as_photos')
            .insert([{
              as_record_id: asRecord.id,
              storage_path: storagePath,
              filename: photo.filename,
              file_size: photo.size,
              mime_type: photo.type
            }])
          
          if (photoError) {
            console.error('❌ 사진 메타데이터 저장 오류:', photoError)
          }
        } catch (photoErr) {
          console.error('❌ 사진 처리 오류:', photoErr)
        }
      }
    }
    
    // 4. customers 테이블의 as_result 상태 업데이트
    const { error: updateError } = await supabase
      .from('customers')
      .update({ as_result: 'completed' })
      .eq('id', customerId)
    
    if (updateError) {
      console.error('❌ 고객 상태 업데이트 오류:', updateError)
    }
    
    console.log('✅ A/S 결과 저장 완료')
    
    return c.json({
      success: true,
      asRecordId: asRecord.id
    })
  } catch (error) {
    console.error('❌ A/S 결과 저장 오류:', error)
    return c.json({ success: false, message: 'A/S 결과 저장 중 오류가 발생했습니다.' }, 500)
  }
})

// A/S 결과 조회
app.get('/api/customers/:id/as-result', async (c) => {
  try {
    const customerId = c.req.param('id')
    
    // A/S 기록 조회
    const { data: asRecords, error: recordError } = await supabase
      .from('as_records')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    
    if (recordError) {
      console.error('❌ A/S 기록 조회 오류:', recordError)
      return c.json({ success: false, message: 'A/S 기록 조회 중 오류가 발생했습니다.' }, 500)
    }
    
    // 각 기록의 사진 정보 조회
    const recordsWithPhotos = await Promise.all(
      asRecords.map(async (record) => {
        const { data: photos, error: photoError } = await supabase
          .from('as_photos')
          .select('*')
          .eq('as_record_id', record.id)
        
        if (photoError) {
          console.error('❌ 사진 조회 오류:', photoError)
          return { ...record, photos: [] }
        }
        
        // 사진 URL 생성
        const photosWithUrls = photos.map(photo => {
          const { data: urlData } = supabase.storage
            .from('as-photos')
            .getPublicUrl(photo.storage_path)
          
          return {
            ...photo,
            url: urlData.publicUrl
          }
        })
        
        return { ...record, photos: photosWithUrls }
      })
    )
    
    return c.json({
      success: true,
      asRecords: recordsWithPhotos
    })
  } catch (error) {
    console.error('❌ A/S 결과 조회 오류:', error)
    return c.json({ success: false, message: 'A/S 결과 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// 지오코딩 API (변경 없음)
app.post('/api/geocode', async (c) => {
  try {
    const { address } = await c.req.json()
    
    if (!address || address.trim() === '') {
      return c.json({
        success: true,
        result: {
          latitude: 37.5665,
          longitude: 126.9780,
          address: address
        }
      })
    }
    
    // Kakao Maps Geocoding API 사용
    // 참고: Kakao Maps API는 클라이언트에서 직접 호출해야 하므로
    // 여기서는 기본 좌표만 반환하고 실제 지오코딩은 프론트엔드에서 수행
    
    // 지역별 대략적인 좌표 (더 정확한 위치 제공)
    const regionCoords = {
      '서울': { lat: 37.5665, lng: 126.9780 },
      '강남': { lat: 37.4979, lng: 127.0276 },
      '강북': { lat: 37.6396, lng: 127.0254 },
      '송파': { lat: 37.5145, lng: 127.1059 },
      '강서': { lat: 37.5509, lng: 126.8495 },
      '인천': { lat: 37.4563, lng: 126.7052 },
      '경기': { lat: 37.4138, lng: 127.5183 },
      '부산': { lat: 35.1796, lng: 129.0756 },
      '대구': { lat: 35.8714, lng: 128.6014 },
      '대전': { lat: 36.3504, lng: 127.3845 },
      '광주': { lat: 35.1595, lng: 126.8526 },
      '울산': { lat: 35.5384, lng: 129.3114 },
      '세종': { lat: 36.4800, lng: 127.2890 }
    }
    
    // 주소에서 지역 추출
    let coords = { lat: 37.5665, lng: 126.9780 } // 기본값: 서울
    
    for (const [region, coord] of Object.entries(regionCoords)) {
      if (address.includes(region)) {
        coords = coord
        // 같은 지역 내에서 약간씩 다른 위치로 (최대 ±0.01도)
        coords.lat += (Math.random() - 0.5) * 0.02
        coords.lng += (Math.random() - 0.5) * 0.02
        break
      }
    }
    
    console.log(`📍 지오코딩: ${address} → (${coords.lat}, ${coords.lng})`)
    
    return c.json({
      success: true,
      result: {
        latitude: coords.lat,
        longitude: coords.lng,
        address: address
      }
    })
  } catch (error) {
    console.error('❌ 지오코딩 오류:', error)
    return c.json({ 
      success: true,  // 실패해도 기본 좌표 반환
      result: {
        latitude: 37.5665,
        longitude: 126.9780,
        address: address
      }
    })
  }
})

// ============================================
// 메인 페이지
// ============================================
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>고객관리 시스템</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <!-- Kakao Maps API -->
        <script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=c933c69ba4e0228895438c6a8c327e74&libraries=services"></script>
        <!-- SheetJS for Excel file parsing -->
        <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    </head>
    <body class="bg-gray-50">
        <div id="app"></div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

const port = 3000
console.log(`🚀 서버가 http://localhost:${port} 에서 실행 중입니다`)
console.log(`🗄️ Supabase 연동 완료`)

serve({
  fetch: app.fetch,
  port
})
