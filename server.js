import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'

const app = new Hono()

// 메모리 기반 데이터 저장소
// 필드: 순번, 횟수, 접수일자, 업체, 구분, 고객명, 전화번호, 설치연월, 열원, 주소, AS접수내용, 설치팀, 지역, 접수자, AS결과
let customers = []

let nextCustomerId = 1

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
    
    const testUsers = [
      // 기존 계정
      { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: '관리자' },
      { id: 2, username: 'user', password: 'user123', role: 'user', name: '사용자' },
      // 관리자 계정 3개
      { id: 3, username: 'master1', password: 'master1', role: 'admin', name: '관리자1' },
      { id: 4, username: 'master2', password: 'master2', role: 'admin', name: '관리자2' },
      { id: 5, username: 'master3', password: 'master3', role: 'admin', name: '관리자3' },
      // 사용자 계정 10개
      { id: 6, username: 'test1', password: 'test1', role: 'user', name: '사용자1' },
      { id: 7, username: 'test2', password: 'test2', role: 'user', name: '사용자2' },
      { id: 8, username: 'test3', password: 'test3', role: 'user', name: '사용자3' },
      { id: 9, username: 'test4', password: 'test4', role: 'user', name: '사용자4' },
      { id: 10, username: 'test5', password: 'test5', role: 'user', name: '사용자5' },
      { id: 11, username: 'test6', password: 'test6', role: 'user', name: '사용자6' },
      { id: 12, username: 'test7', password: 'test7', role: 'user', name: '사용자7' },
      { id: 13, username: 'test8', password: 'test8', role: 'user', name: '사용자8' },
      { id: 14, username: 'test9', password: 'test9', role: 'user', name: '사용자9' },
      { id: 15, username: 'test10', password: 'test10', role: 'user', name: '사용자10' }
    ]
    
    const user = testUsers.find(u => u.username === username && u.password === password)
    
    if (!user) {
      return c.json({ success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' }, 401)
    }
    
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
    return c.json({ success: false, message: '로그인 처리 중 오류가 발생했습니다.' }, 500)
  }
})

// ============================================
// 고객 관리 API
// ============================================

// 모든 고객 조회
app.get('/api/customers', async (c) => {
  return c.json({ success: true, customers: customers })
})

// 고객 상세 조회
app.get('/api/customers/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const customer = customers.find(c => c.id === id)
  
  if (!customer) {
    return c.json({ success: false, message: '고객을 찾을 수 없습니다.' }, 404)
  }
  
  return c.json({ success: true, customer })
})

// 고객 생성
app.post('/api/customers', async (c) => {
  try {
    const data = await c.req.json()
    const newCustomer = {
      id: nextCustomerId++,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    customers.push(newCustomer)
    return c.json({ success: true, id: newCustomer.id })
  } catch (error) {
    return c.json({ success: false, message: '고객 등록 중 오류가 발생했습니다.' }, 500)
  }
})

// 고객 수정
app.put('/api/customers/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const data = await c.req.json()
    const index = customers.findIndex(c => c.id === id)
    
    if (index === -1) {
      return c.json({ success: false, message: '고객을 찾을 수 없습니다.' }, 404)
    }
    
    customers[index] = {
      ...customers[index],
      ...data,
      updated_at: new Date().toISOString()
    }
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, message: '고객 수정 중 오류가 발생했습니다.' }, 500)
  }
})

// 고객 삭제
app.delete('/api/customers/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    customers = customers.filter(c => c.id !== id)
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, message: '고객 삭제 중 오류가 발생했습니다.' }, 500)
  }
})

// 고객 일괄 삭제
app.post('/api/customers/batch-delete', async (c) => {
  try {
    const { ids } = await c.req.json()
    customers = customers.filter(c => !ids.includes(c.id))
    return c.json({ success: true, deleted: ids.length })
  } catch (error) {
    return c.json({ success: false, message: '고객 일괄 삭제 중 오류가 발생했습니다.' }, 500)
  }
})

// CSV 데이터 검증 및 미리보기
app.post('/api/customers/validate', async (c) => {
  try {
    const { data } = await c.req.json()
    
    const validRows = []
    const invalidRows = []
    const duplicates = []
    
    const existingAddresses = new Set(customers.map(c => c.address))
    const currentAddresses = new Set()
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const errors = []
      
      // 필드 매핑: 엑셀 헤더 → DB 필드
      const mappedRow = {
        sequence: row['순번'],
        count: row['횟수'],
        receipt_date: row['접수일자'],
        company: row['업체'],
        category: row['구분'],
        customer_name: row['고객명'],
        phone: row['전화번호'],
        install_date: row['설치연,월'],
        heat_source: row['열원'],
        address: row['주소'],
        as_content: row['AS접수내용'],
        install_team: row['설치팀'],
        region: row['지역'],
        receptionist: row['접수자'],
        as_result: row['AS결과']
      }
      
      if (!mappedRow.customer_name || mappedRow.customer_name.toString().trim() === '') {
        errors.push('고객명은 필수입니다')
      }
      if (!mappedRow.address || mappedRow.address.toString().trim() === '') {
        errors.push('주소는 필수입니다')
      }
      
      if (mappedRow.phone && !/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(mappedRow.phone.toString().replace(/-/g, ''))) {
        errors.push('전화번호 형식이 올바르지 않습니다')
      }
      
      // 중복 체크 (오류가 아닌 중복으로 분류)
      let isDuplicate = false
      
      if (mappedRow.address && existingAddresses.has(mappedRow.address)) {
        isDuplicate = true
        duplicates.push({ ...mappedRow, rowIndex: i + 1, reason: '이미 등록된 주소입니다 (데이터베이스)' })
      } else if (mappedRow.address && currentAddresses.has(mappedRow.address)) {
        isDuplicate = true
        duplicates.push({ ...mappedRow, rowIndex: i + 1, reason: '업로드 파일 내 중복된 주소입니다' })
      } else if (mappedRow.address) {
        currentAddresses.add(mappedRow.address)
      }
      
      // 중복이 아닌 경우에만 유효/오류로 분류
      if (!isDuplicate) {
        if (errors.length > 0) {
          invalidRows.push({ ...mappedRow, rowIndex: i + 1, errors })
        } else {
          validRows.push({ ...mappedRow, rowIndex: i + 1 })
        }
      }
    }
    
    return c.json({
      success: true,
      summary: {
        total: data.length,
        valid: validRows.length,
        invalid: invalidRows.length,
        duplicates: duplicates.length
      },
      validRows,
      invalidRows,
      duplicates
    })
  } catch (error) {
    return c.json({ success: false, message: '데이터 검증 중 오류가 발생했습니다.' }, 500)
  }
})

// CSV 데이터 일괄 업로드
app.post('/api/customers/batch-upload', async (c) => {
  try {
    const { data, userId } = await c.req.json()
    
    let successCount = 0
    
    for (const row of data) {
      const newCustomer = {
        id: nextCustomerId++,
        sequence: row.sequence || null,
        count: row.count || null,
        receipt_date: row.receipt_date || new Date().toISOString().split('T')[0],
        company: row.company || null,
        category: row.category || null,
        customer_name: row.customer_name,
        phone: row.phone || null,
        install_date: row.install_date || null,
        heat_source: row.heat_source || null,
        address: row.address,
        as_content: row.as_content || null,
        install_team: row.install_team || null,
        region: row.region || null,
        receptionist: row.receptionist || null,
        as_result: row.as_result || null,
        latitude: row.latitude || null,
        longitude: row.longitude || null,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      customers.push(newCustomer)
      successCount++
    }
    
    return c.json({
      success: true,
      summary: {
        total: data.length,
        success: successCount,
        failed: 0
      }
    })
  } catch (error) {
    return c.json({ success: false, message: '데이터 업로드 중 오류가 발생했습니다.' }, 500)
  }
})

// ============================================
// T Map API - 지오코딩 (주소 → 좌표)
// ============================================
app.post('/api/geocode', async (c) => {
  try {
    const { address } = await c.req.json()
    
    const tmapAppKey = process.env.TMAP_APP_KEY || 'vSWmSa8CcO4uvyc0EsAg46SWvxNVAKzL8KGbckPB'
    
    if (tmapAppKey && tmapAppKey !== 'YOUR_TMAP_APP_KEY') {
      try {
        const response = await fetch(
          `https://apis.openapi.sk.com/tmap/geo/fullAddrGeo?version=1&format=json&callback=result&coordType=WGS84GEO&fullAddr=${encodeURIComponent(address)}`,
          {
            headers: {
              'Accept': 'application/json',
              'appKey': tmapAppKey
            }
          }
        )
        
        const data = await response.json()
        
        if (data.coordinateInfo && data.coordinateInfo.coordinate && data.coordinateInfo.coordinate.length > 0) {
          const result = data.coordinateInfo.coordinate[0]
          return c.json({
            success: true,
            result: {
              latitude: parseFloat(result.lat || result.newLat),
              longitude: parseFloat(result.lon || result.newLon),
              address: address
            }
          })
        }
      } catch (apiError) {
        console.error('T Map 지오코딩 API 오류:', apiError)
      }
    }
    
    // API 키가 없거나 오류 발생시 더미 데이터
    return c.json({
      success: true,
      result: {
        latitude: 37.5665 + (Math.random() - 0.5) * 0.1,
        longitude: 126.9780 + (Math.random() - 0.5) * 0.1,
        address: address
      }
    })
  } catch (error) {
    return c.json({ success: false, message: '주소 변환 중 오류가 발생했습니다.' }, 500)
  }
})

// ============================================
// A/S 결과 API
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
    
    // 고객 찾기
    const customer = customers.find(c => String(c.id) === String(customerId))
    
    if (!customer) {
      return c.json({ success: false, message: '고객을 찾을 수 없습니다.' }, 404)
    }
    
    // A/S 결과 업데이트
    customer.as_result = 'completed'
    customer.as_result_text = resultText
    customer.as_result_photos = photos || []
    customer.as_completed_at = completedAt
    customer.updated_at = new Date().toISOString()
    
    console.log('✅ A/S 결과 저장 완료:', customer.customer_name)
    
    return c.json({
      success: true,
      customer: customer
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
    
    const customer = customers.find(c => String(c.id) === String(customerId))
    
    if (!customer) {
      return c.json({ success: false, message: '고객을 찾을 수 없습니다.' }, 404)
    }
    
    return c.json({
      success: true,
      asResult: {
        status: customer.as_result || 'pending',
        text: customer.as_result_text || '',
        photos: customer.as_result_photos || [],
        completedAt: customer.as_completed_at || null
      }
    })
  } catch (error) {
    console.error('❌ A/S 결과 조회 오류:', error)
    return c.json({ success: false, message: 'A/S 결과 조회 중 오류가 발생했습니다.' }, 500)
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
console.log(`📍 T Map API 키: ${process.env.TMAP_APP_KEY || 'vSWmSa8CcO4uvyc0EsAg46SWvxNVAKzL8KGbckPB'}`)

serve({
  fetch: app.fetch,
  port
})
