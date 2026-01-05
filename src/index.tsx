import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
  NAVER_MAP_CLIENT_ID?: string;
  NAVER_MAP_CLIENT_SECRET?: string;
}

const app = new Hono<{ Bindings: Bindings }>()

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
    
    const user = await c.env.DB.prepare(
      'SELECT id, username, role, name FROM users WHERE username = ? AND password = ?'
    ).bind(username, password).first()
    
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
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM customers ORDER BY created_at DESC'
    ).all()
    
    return c.json({ success: true, customers: results })
  } catch (error) {
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
    const { results: existingCustomers } = await c.env.DB.prepare(
      'SELECT address FROM customers'
    ).all()
    const existingAddresses = new Set(existingCustomers.map((c: any) => c.address))
    
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
        await c.env.DB.prepare(
          `INSERT INTO customers (customer_name, phone, email, address, address_detail, latitude, longitude, memo, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          row.customer_name,
          row.phone || null,
          row.email || null,
          row.address,
          row.address_detail || null,
          row.latitude || null,
          row.longitude || null,
          row.memo || null,
          userId
        ).run()
        successCount++
      } catch (error) {
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
// 네이버 맵 API - 지오코딩 (주소 → 좌표)
// ============================================
app.post('/api/geocode', async (c) => {
  try {
    const { address } = await c.req.json()
    
    // 네이버 맵 API 키 확인
    const clientId = c.env.NAVER_MAP_CLIENT_ID
    const clientSecret = c.env.NAVER_MAP_CLIENT_SECRET
    
    // API 키가 설정되어 있으면 실제 네이버 지오코딩 API 호출
    if (clientId && clientSecret && clientId !== 't29b9q2500') {
      try {
        const response = await fetch(
          `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`,
          {
            headers: {
              'X-NCP-APIGW-API-KEY-ID': clientId,
              'X-NCP-APIGW-API-KEY': clientSecret
            }
          }
        )
        
        const data = await response.json()
        
        // 네이버 API 응답 처리
        if (data.status === 'OK' && data.addresses && data.addresses.length > 0) {
          const result = data.addresses[0]
          return c.json({
            success: true,
            result: {
              latitude: parseFloat(result.y),
              longitude: parseFloat(result.x),
              address: result.roadAddress || result.jibunAddress || address
            }
          })
        }
      } catch (apiError) {
        console.error('네이버 지오코딩 API 오류:', apiError)
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
      notice: '네이버 맵 API 키가 설정되지 않아 더미 좌표를 반환합니다. .dev.vars 파일에 API 키를 설정해주세요.'
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
        <!-- 네이버 지도 API -->
        <script type="text/javascript" src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=t29b9q2500"></script>
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
