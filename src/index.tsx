import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'

const app = new Hono()

// 메모리 기반 데이터 저장소 (서버 재시작 시 초기화됨)
let customers: any[] = []
let nextCustomerId = 1

// 회원 관리
let users: any[] = [
  // 기본 관리자 (앱 개발자)
  { 
    id: 1, 
    username: 'developer', 
    password: 'dev123!@#', 
    role: 'admin', 
    name: '개발자',
    phone: '010-7597-4541',
    status: 'approved',
    created_at: new Date().toISOString()
  }
]
let nextUserId = 2

// 승인 대기 회원
let pendingUsers: any[] = []
let nextPendingId = 1

// 활성 세션 (동시 로그인 제한)
let activeSessions: any[] = []

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 제공
app.use('/static/*', serveStatic({ root: './public' }))

// ============================================
// 인증 API
// ============================================

// 로그인 API
app.post('/api/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    
    // 회원 찾기
    const user = users.find(u => u.username === username && u.password === password)
    
    if (!user) {
      return c.json({ success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' }, 401)
    }
    
    // 승인 상태 확인
    if (user.status !== 'approved') {
      return c.json({ success: false, message: '승인 대기 중입니다. 관리자의 승인을 기다려주세요.' }, 403)
    }
    
    // 동시 로그인 제한 확인
    const roleLimit = user.role === 'admin' ? 3 : 10
    const currentSessions = activeSessions.filter(s => s.role === user.role)
    
    if (currentSessions.length >= roleLimit) {
      return c.json({ 
        success: false, 
        message: `${user.role === 'admin' ? '관리자' : '사용자'} 최대 동시 접속 인원(${roleLimit}명)을 초과했습니다.` 
      }, 403)
    }
    
    // 세션 생성
    const sessionId = `${Date.now()}-${Math.random()}`
    activeSessions.push({
      sessionId,
      userId: user.id,
      username: user.username,
      role: user.role,
      loginAt: new Date().toISOString()
    })
    
    return c.json({ 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        phone: user.phone
      },
      sessionId
    })
  } catch (error) {
    return c.json({ success: false, message: '로그인 처리 중 오류가 발생했습니다.' }, 500)
  }
})

// 회원가입 API
app.post('/api/auth/register', async (c) => {
  try {
    const { username, password, name, phone } = await c.req.json()
    
    // 필수 필드 검증
    if (!username || !password || !name || !phone) {
      return c.json({ success: false, message: '모든 필드를 입력해주세요.' }, 400)
    }
    
    // 아이디 중복 체크
    if (users.find(u => u.username === username)) {
      return c.json({ success: false, message: '이미 사용 중인 아이디입니다.' }, 400)
    }
    
    // 전화번호 중복 체크
    if (users.find(u => u.phone === phone)) {
      return c.json({ success: false, message: '이미 등록된 전화번호입니다.' }, 400)
    }
    
    // 승인 대기 목록에 추가
    const pendingUser = {
      id: nextPendingId++,
      username,
      password,
      name,
      phone,
      status: 'pending',
      created_at: new Date().toISOString()
    }
    
    pendingUsers.push(pendingUser)
    
    // SMS 발송 (실제로는 SMS API 호출)
    console.log(`📱 SMS 발송: 010-7597-4541`)
    console.log(`내용: [고객관리시스템] 신규 회원가입 승인 요청`)
    console.log(`- 이름: ${name}`)
    console.log(`- 연락처: ${phone}`)
    console.log(`- 아이디: ${username}`)
    
    return c.json({ 
      success: true, 
      message: '회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.' 
    })
  } catch (error) {
    return c.json({ success: false, message: '회원가입 처리 중 오류가 발생했습니다.' }, 500)
  }
})

// 승인 대기 회원 목록 조회 (관리자 전용)
app.get('/api/auth/pending', async (c) => {
  try {
    return c.json({ success: true, users: pendingUsers })
  } catch (error) {
    return c.json({ success: false, message: '목록 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// 회원 승인 (관리자 전용)
app.post('/api/auth/approve', async (c) => {
  try {
    const { id, role } = await c.req.json()
    
    const pendingUser = pendingUsers.find(u => u.id === id)
    if (!pendingUser) {
      return c.json({ success: false, message: '해당 회원을 찾을 수 없습니다.' }, 404)
    }
    
    // 승인된 회원으로 이동
    const approvedUser = {
      id: nextUserId++,
      username: pendingUser.username,
      password: pendingUser.password,
      name: pendingUser.name,
      phone: pendingUser.phone,
      role: role || 'user',
      status: 'approved',
      created_at: pendingUser.created_at,
      approved_at: new Date().toISOString()
    }
    
    users.push(approvedUser)
    pendingUsers = pendingUsers.filter(u => u.id !== id)
    
    console.log(`✅ 회원 승인: ${approvedUser.name} (${approvedUser.username})`)
    
    return c.json({ success: true, message: '회원이 승인되었습니다.' })
  } catch (error) {
    return c.json({ success: false, message: '승인 처리 중 오류가 발생했습니다.' }, 500)
  }
})

// 회원 거절 (관리자 전용)
app.post('/api/auth/reject', async (c) => {
  try {
    const { id } = await c.req.json()
    
    pendingUsers = pendingUsers.filter(u => u.id !== id)
    
    return c.json({ success: true, message: '회원 신청이 거절되었습니다.' })
  } catch (error) {
    return c.json({ success: false, message: '거절 처리 중 오류가 발생했습니다.' }, 500)
  }
})

// 전체 회원 목록 조회 (관리자 전용)
app.get('/api/users', async (c) => {
  try {
    return c.json({ 
      success: true, 
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        name: u.name,
        phone: u.phone,
        role: u.role,
        status: u.status,
        created_at: u.created_at
      }))
    })
  } catch (error) {
    return c.json({ success: false, message: '목록 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// 로그아웃 API
app.post('/api/auth/logout', async (c) => {
  try {
    const { sessionId } = await c.req.json()
    
    activeSessions = activeSessions.filter(s => s.sessionId !== sessionId)
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, message: '로그아웃 처리 중 오류가 발생했습니다.' }, 500)
  }
})

// ============================================
// 고객 관리 API
// ============================================

// 모든 고객 조회
app.get('/api/customers', async (c) => {
  try {
    return c.json({ success: true, customers: customers })
  } catch (error) {
    console.error('고객 목록 조회 오류:', error)
    return c.json({ success: false, message: '고객 목록 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// 고객 상세 조회
app.get('/api/customers/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const customer = await c.env.DB.prepare(
      'SELECT * FROM customers WHERE id = ?'
    ).bind(id).first()
    
    if (!customer) {
      return c.json({ success: false, message: '고객을 찾을 수 없습니다.' }, 404)
    }
    
    return c.json({ success: true, customer })
  } catch (error) {
    return c.json({ success: false, message: '고객 조회 중 오류가 발생했습니다.' }, 500)
  }
})

// 고객 생성
app.post('/api/customers', async (c) => {
  try {
    const data = await c.req.json()
    const { customer_name, phone, email, address, address_detail, latitude, longitude, memo, created_by } = data
    
    const result = await c.env.DB.prepare(
      `INSERT INTO customers (customer_name, phone, email, address, address_detail, latitude, longitude, memo, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(customer_name, phone, email, address, address_detail, latitude, longitude, memo, created_by).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ success: false, message: '고객 등록 중 오류가 발생했습니다.' }, 500)
  }
})

// 고객 수정
app.put('/api/customers/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const data = await c.req.json()
    const { customer_name, phone, email, address, address_detail, latitude, longitude, memo } = data
    
    await c.env.DB.prepare(
      `UPDATE customers 
       SET customer_name = ?, phone = ?, email = ?, address = ?, address_detail = ?, 
           latitude = ?, longitude = ?, memo = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(customer_name, phone, email, address, address_detail, latitude, longitude, memo, id).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, message: '고객 수정 중 오류가 발생했습니다.' }, 500)
  }
})

// 고객 삭제
app.delete('/api/customers/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    await c.env.DB.prepare('DELETE FROM customers WHERE id = ?').bind(id).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, message: '고객 삭제 중 오류가 발생했습니다.' }, 500)
  }
})

// 고객 일괄 삭제
app.post('/api/customers/batch-delete', async (c) => {
  try {
    const { ids } = await c.req.json()
    
    if (!ids || ids.length === 0) {
      return c.json({ success: false, message: '삭제할 고객을 선택해주세요.' }, 400)
    }
    
    const placeholders = ids.map(() => '?').join(',')
    await c.env.DB.prepare(
      `DELETE FROM customers WHERE id IN (${placeholders})`
    ).bind(...ids).run()
    
    return c.json({ success: true, deleted: ids.length })
  } catch (error) {
    return c.json({ success: false, message: '고객 일괄 삭제 중 오류가 발생했습니다.' }, 500)
  }
})

// CSV 데이터 검증 및 미리보기
app.post('/api/customers/validate', async (c) => {
  try {
    const { data } = await c.req.json()
    
    const validRows: any[] = []
    const invalidRows: any[] = []
    const duplicates: any[] = []
    
    // 기존 고객 주소 목록 조회 (중복 체크용)
    const existingAddresses = new Set(customers.map((c: any) => c.address))
    
    // 현재 데이터 내 주소 중복 체크
    const currentAddresses = new Set()
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const errors: string[] = []
      
      // 필수 필드 검증
      if (!row.customer_name || row.customer_name.trim() === '') {
        errors.push('고객명은 필수입니다')
      }
      if (!row.address || row.address.trim() === '') {
        errors.push('주소는 필수입니다')
      }
      
      // 전화번호 형식 검증 (선택사항이지만 있다면 검증)
      if (row.phone && !/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(row.phone.replace(/-/g, ''))) {
        errors.push('전화번호 형식이 올바르지 않습니다')
      }
      
      // 이메일 형식 검증 (선택사항이지만 있다면 검증)
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push('이메일 형식이 올바르지 않습니다')
      }
      
      // 중복 체크
      if (row.address && existingAddresses.has(row.address)) {
        errors.push('이미 등록된 주소입니다 (데이터베이스)')
      }
      
      if (row.address && currentAddresses.has(row.address)) {
        errors.push('업로드 파일 내 중복된 주소입니다')
        duplicates.push({ ...row, rowIndex: i + 1, errors })
      } else if (row.address) {
        currentAddresses.add(row.address)
      }
      
      if (errors.length > 0) {
        invalidRows.push({ ...row, rowIndex: i + 1, errors })
      } else {
        validRows.push({ ...row, rowIndex: i + 1 })
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
    
    if (!data || data.length === 0) {
      return c.json({ success: false, message: '업로드할 데이터가 없습니다.' }, 400)
    }
    
    let successCount = 0
    let failCount = 0
    
    for (const row of data) {
      try {
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        customers.push(newCustomer)
        successCount++
      } catch (error) {
        console.error('고객 추가 오류:', error)
        failCount++
      }
    }
    
    return c.json({
      success: true,
      summary: {
        total: data.length,
        success: successCount,
        failed: failCount
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
    
    // T Map API 키 확인
    const tmapAppKey = c.env.TMAP_APP_KEY
    
    // API 키가 설정되어 있으면 실제 T Map 지오코딩 API 호출
    if (tmapAppKey) {
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
        
        // T Map API 응답 처리
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
        // API 오류시 더미 데이터로 폴백
      }
    }
    
    // API 키가 없거나 오류 발생시 개발용 더미 데이터 반환
    return c.json({
      success: true,
      result: {
        latitude: 37.5665 + (Math.random() - 0.5) * 0.1,
        longitude: 126.9780 + (Math.random() - 0.5) * 0.1,
        address: address
      },
      notice: 'T Map API 키가 설정되지 않아 더미 좌표를 반환합니다. .dev.vars 파일에 TMAP_APP_KEY를 설정해주세요.'
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
        <!-- T Map API (지도 표시용) -->
        <script src="https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=vSWmSa8CcO4uvyc0EsAg46SWvxNVAKzL8KGbckPB"></script>
        <!-- Kakao JavaScript API (길 안내용) -->
        <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=c933c69ba4e0228895438c6a8c327e74&libraries=services"></script>
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

export default app
