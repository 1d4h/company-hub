import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'

const app = new Hono()

// 메모리 기반 데이터 저장소
// 필드: 순번, 횟수, 접수일자, 업체, 구분, 고객명, 전화번호, 설치연월, 열원, 주소, AS접수내용, 설치팀, 지역, 접수자, AS결과
let customers = [
  {
    id: 1,
    sequence: 1,
    count: 1,
    receipt_date: '2024-01-15',
    company: '서울지사',
    category: 'AS',
    customer_name: '김철수',
    phone: '010-1234-5678',
    install_date: '2023-12',
    heat_source: '가스',
    address: '서울특별시 강남구 테헤란로 123',
    as_content: '온수 온도 조절 불량',
    install_team: '1팀',
    region: '강남',
    receptionist: '홍길동',
    as_result: '수리 완료',
    latitude: 37.5012,
    longitude: 127.0396,
    created_at: '2024-01-15 10:30:00',
    updated_at: '2024-01-15 10:30:00'
  },
  {
    id: 2,
    sequence: 2,
    count: 1,
    receipt_date: '2024-01-16',
    company: '서울지사',
    category: 'AS',
    customer_name: '이영희',
    phone: '010-2345-6789',
    install_date: '2023-11',
    heat_source: '전기',
    address: '서울특별시 서초구 서초대로 78길 22',
    as_content: '난방 작동 불량',
    install_team: '2팀',
    region: '서초',
    receptionist: '김영희',
    as_result: '부품 교체 완료',
    latitude: 37.4833,
    longitude: 127.0322,
    created_at: '2024-01-16 14:20:00',
    updated_at: '2024-01-16 14:20:00'
  },
  {
    id: 3,
    sequence: 3,
    count: 2,
    receipt_date: '2024-01-17',
    company: '서울지사',
    category: 'AS',
    customer_name: '박민수',
    phone: '010-3456-7890',
    install_date: '2023-10',
    heat_source: '가스',
    address: '서울특별시 송파구 올림픽로 300',
    as_content: '보일러 소음 발생',
    install_team: '1팀',
    region: '송파',
    receptionist: '홍길동',
    as_result: '점검 완료',
    latitude: 37.5125,
    longitude: 127.1025,
    created_at: '2024-01-17 09:15:00',
    updated_at: '2024-01-17 09:15:00'
  }
]

let nextCustomerId = 4

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
      { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: '관리자' },
      { id: 2, username: 'user', password: 'user123', role: 'user', name: '사용자' }
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
      
      if (mappedRow.address && existingAddresses.has(mappedRow.address)) {
        errors.push('이미 등록된 주소입니다 (데이터베이스)')
      }
      
      if (mappedRow.address && currentAddresses.has(mappedRow.address)) {
        errors.push('업로드 파일 내 중복된 주소입니다')
        duplicates.push({ ...mappedRow, rowIndex: i + 1, errors })
      } else if (mappedRow.address) {
        currentAddresses.add(mappedRow.address)
      }
      
      if (errors.length > 0) {
        invalidRows.push({ ...mappedRow, rowIndex: i + 1, errors })
      } else {
        validRows.push({ ...mappedRow, rowIndex: i + 1 })
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
        <!-- T Map API -->
        <script src="https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=vSWmSa8CcO4uvyc0EsAg46SWvxNVAKzL8KGbckPB"></script>
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
