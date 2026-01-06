// ============================================
// 전역 상태 관리
// ============================================
const state = {
  currentUser: null,
  customers: [],
  currentView: 'login',
  map: null,
  markers: [],
  selectedCustomer: null,
  uploadPreviewData: null
}

// ============================================
// 유틸리티 함수
// ============================================
function saveSession(user) {
  sessionStorage.setItem('user', JSON.stringify(user))
  state.currentUser = user
}

function loadSession() {
  const userStr = sessionStorage.getItem('user')
  if (userStr) {
    state.currentUser = JSON.parse(userStr)
    return true
  }
  return false
}

function clearSession() {
  sessionStorage.removeItem('user')
  state.currentUser = null
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div')
  toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
    type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  }`
  toast.textContent = message
  document.body.appendChild(toast)
  
  setTimeout(() => {
    toast.remove()
  }, 3000)
}

// ============================================
// API 호출 함수
// ============================================
async function login(username, password) {
  try {
    const response = await axios.post('/api/auth/login', { username, password })
    if (response.data.success) {
      saveSession(response.data.user)
      return true
    } else {
      showToast(response.data.message, 'error')
      return false
    }
  } catch (error) {
    showToast('로그인 중 오류가 발생했습니다', 'error')
    return false
  }
}

async function loadCustomers() {
  try {
    const response = await axios.get('/api/customers')
    if (response.data.success) {
      state.customers = response.data.customers
      return true
    }
    return false
  } catch (error) {
    showToast('고객 목록 조회 중 오류가 발생했습니다', 'error')
    return false
  }
}

async function deleteCustomer(id) {
  try {
    const response = await axios.delete(`/api/customers/${id}`)
    if (response.data.success) {
      showToast('고객이 삭제되었습니다', 'success')
      await loadCustomers()
      return true
    }
    return false
  } catch (error) {
    showToast('고객 삭제 중 오류가 발생했습니다', 'error')
    return false
  }
}

async function batchDeleteCustomers(ids) {
  try {
    const response = await axios.post('/api/customers/batch-delete', { ids })
    if (response.data.success) {
      showToast(`${response.data.deleted}명의 고객이 삭제되었습니다`, 'success')
      await loadCustomers()
      return true
    }
    return false
  } catch (error) {
    showToast('고객 일괄 삭제 중 오류가 발생했습니다', 'error')
    return false
  }
}

async function validateCustomerData(data) {
  try {
    const response = await axios.post('/api/customers/validate', { data })
    return response.data
  } catch (error) {
    showToast('데이터 검증 중 오류가 발생했습니다', 'error')
    return null
  }
}

async function batchUploadCustomers(data) {
  try {
    const response = await axios.post('/api/customers/batch-upload', {
      data,
      userId: state.currentUser.id
    })
    if (response.data.success) {
      showToast(`${response.data.summary.success}명의 고객이 등록되었습니다`, 'success')
      await loadCustomers()
      return true
    }
    return false
  } catch (error) {
    showToast('고객 업로드 중 오류가 발생했습니다', 'error')
    return false
  }
}

async function geocodeAddress(address) {
  try {
    const response = await axios.post('/api/geocode', { address })
    if (response.data.success) {
      return response.data.result
    }
    return null
  } catch (error) {
    console.error('지오코딩 오류:', error)
    return null
  }
}

// ============================================
// Excel 파싱 함수
// ============================================
function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // 첫 번째 시트 가져오기
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // 시트를 JSON으로 변환
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,  // 배열 형태로 반환
          defval: ''  // 빈 셀은 빈 문자열로
        })
        
        if (jsonData.length < 2) {
          reject(new Error('파일에 데이터가 없습니다'))
          return
        }
        
        // 헤더와 데이터 분리
        const headers = jsonData[0]
        const rows = []
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = {}
          headers.forEach((header, index) => {
            row[header] = jsonData[i][index] !== undefined ? String(jsonData[i][index]).trim() : ''
          })
          rows.push(row)
        }
        
        resolve(rows)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

// ============================================
// 렌더링 함수
// ============================================

// 로그인 화면
function renderLogin() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div class="text-center mb-8">
          <i class="fas fa-map-marked-alt text-5xl text-blue-600 mb-4"></i>
          <h1 class="text-3xl font-bold text-gray-800">고객관리 시스템</h1>
          <p class="text-gray-600 mt-2">지도 기반 고객 관리 솔루션</p>
        </div>
        
        <form id="loginForm" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-user mr-2"></i>아이디
            </label>
            <input 
              type="text" 
              id="username" 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="아이디를 입력하세요"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-lock mr-2"></i>비밀번호
            </label>
            <input 
              type="password" 
              id="password" 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>
          
          <button 
            type="submit" 
            class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            <i class="fas fa-sign-in-alt mr-2"></i>로그인
          </button>
        </form>
        
        <div class="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p class="font-semibold mb-2">테스트 계정:</p>
          <p>관리자: admin / admin123</p>
          <p>사용자: user / user123</p>
        </div>
      </div>
    </div>
  `
  
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const username = document.getElementById('username').value
    const password = document.getElementById('password').value
    
    const success = await login(username, password)
    if (success) {
      showToast('로그인 성공!', 'success')
      if (state.currentUser.role === 'admin') {
        renderAdminDashboard()
      } else {
        renderUserMap()
      }
    }
  })
}

// 관리자 대시보드
function renderAdminDashboard() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      <!-- 헤더 -->
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <i class="fas fa-user-shield text-2xl text-blue-600"></i>
            <div>
              <h1 class="text-xl font-bold text-gray-800">관리자 대시보드</h1>
              <p class="text-sm text-gray-600">${state.currentUser.name}님 환영합니다</p>
            </div>
          </div>
          <div class="flex space-x-3">
            <button onclick="switchToUserView()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              <i class="fas fa-map mr-2"></i>지도 보기
            </button>
            <button onclick="logout()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
              <i class="fas fa-sign-out-alt mr-2"></i>로그아웃
            </button>
          </div>
        </div>
      </header>
      
      <!-- 메인 컨텐츠 -->
      <main class="max-w-7xl mx-auto px-4 py-8">
        <!-- 통계 카드 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white p-6 rounded-xl shadow-sm border">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm">전체 고객</p>
                <p class="text-3xl font-bold text-gray-800 mt-2" id="totalCustomers">0</p>
              </div>
              <div class="bg-blue-100 p-4 rounded-full">
                <i class="fas fa-users text-2xl text-blue-600"></i>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-xl shadow-sm border">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm">위치 등록</p>
                <p class="text-3xl font-bold text-gray-800 mt-2" id="geoCodedCustomers">0</p>
              </div>
              <div class="bg-green-100 p-4 rounded-full">
                <i class="fas fa-map-marker-alt text-2xl text-green-600"></i>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-xl shadow-sm border">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm">오늘 등록</p>
                <p class="text-3xl font-bold text-gray-800 mt-2" id="todayCustomers">0</p>
              </div>
              <div class="bg-purple-100 p-4 rounded-full">
                <i class="fas fa-calendar-day text-2xl text-purple-600"></i>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 고객 관리 섹션 -->
        <div class="bg-white rounded-xl shadow-sm border p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-gray-800">
              <i class="fas fa-list mr-2"></i>고객 목록
            </h2>
            <div class="flex space-x-3">
              <button onclick="openUploadModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <i class="fas fa-file-excel mr-2"></i>Excel 업로드
              </button>
              <button onclick="deleteSelectedCustomers()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                <i class="fas fa-trash mr-2"></i>선택 삭제
              </button>
            </div>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th class="px-4 py-3 text-left">
                    <input type="checkbox" id="selectAll" onchange="toggleSelectAll(this)" class="rounded">
                  </th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">고객명</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">전화번호</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">주소</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">위치</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">등록일</th>
                  <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">작업</th>
                </tr>
              </thead>
              <tbody id="customerTableBody" class="divide-y divide-gray-200">
                <tr>
                  <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-2"></i>
                    <p>고객 데이터를 불러오는 중...</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
    
    <!-- Excel 업로드 모달 -->
    <div id="uploadModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div class="p-6 border-b flex justify-between items-center">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-file-excel mr-2 text-green-600"></i>Excel 파일 업로드
          </h3>
          <button onclick="closeUploadModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto" style="max-height: calc(90vh - 140px)">
          <div id="uploadStep1" class="space-y-4">
            <!-- 메일 첨부 형식 UI -->
            <div class="bg-white border border-gray-300 rounded-lg">
              <!-- 파일 첨부 영역 -->
              <div class="p-4 border-b border-gray-200">
                <div class="flex items-center gap-3">
                  <label class="text-sm font-medium text-gray-700 w-20">파일 첨부:</label>
                  <div class="flex-1">
                    <input type="file" id="excelFile" accept=".xlsx,.xls" class="hidden" onchange="handleFileSelect(event)">
                    <button onclick="document.getElementById('excelFile').click()" class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
                      <i class="fas fa-paperclip mr-2"></i>파일 선택
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- 첨부된 파일 목록 -->
              <div id="attachedFilesList" class="p-4 bg-gray-50 min-h-[100px]">
                <p class="text-sm text-gray-500 text-center py-8">
                  <i class="fas fa-inbox text-3xl text-gray-300 mb-2"></i><br>
                  첨부된 파일이 없습니다
                </p>
              </div>
            </div>
            
            <!-- 샘플 파일 다운로드 -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-semibold text-blue-900 mb-1">
                    <i class="fas fa-info-circle mr-2"></i>템플릿 파일
                  </p>
                  <p class="text-xs text-blue-700">
                    AS접수현황 Excel 템플릿을 다운로드하여 작성하세요
                  </p>
                </div>
                <button onclick="downloadSampleExcel()" class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
                  <i class="fas fa-download mr-2"></i>다운로드
                </button>
              </div>
            </div>
          </div>
          
          <div id="uploadStep2" class="hidden">
            <div id="validationSummary" class="mb-6"></div>
            <div id="dataPreview"></div>
          </div>
        </div>
      </div>
    </div>
  `
  
  loadCustomers().then(() => {
    updateDashboardStats()
    renderCustomerTable()
  })
}

// 사용자 지도 화면
function renderUserMap() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="h-screen flex flex-col">
      <!-- 헤더 -->
      <header class="bg-white shadow-sm border-b flex-shrink-0">
        <div class="px-4 py-4 flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <i class="fas fa-map-marked-alt text-2xl text-blue-600"></i>
            <div>
              <h1 class="text-xl font-bold text-gray-800">고객 지도</h1>
              <p class="text-sm text-gray-600">${state.currentUser.name}님</p>
            </div>
          </div>
          <div class="flex space-x-3">
            ${state.currentUser.role === 'admin' ? `
            <button onclick="renderAdminDashboard()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
              <i class="fas fa-user-shield mr-2"></i>관리자 모드
            </button>
            ` : ''}
            <button onclick="logout()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
              <i class="fas fa-sign-out-alt mr-2"></i>로그아웃
            </button>
          </div>
        </div>
      </header>
      
      <!-- 지도/목록 컨테이너 -->
      <div class="flex-1 relative">
        <div id="map" class="w-full h-full"></div>
        
        <!-- 고객 상세 정보 패널 -->
        <div id="customerDetailPanel" class="hidden absolute top-4 right-4 bg-white rounded-xl shadow-xl p-6 w-80 max-h-[calc(100vh-120px)] overflow-y-auto z-10">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-bold text-gray-800">고객 상세 정보</h3>
            <button onclick="closeCustomerDetail()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div id="customerDetailContent"></div>
        </div>
        
        <!-- 고객 목록 사이드 패널 (접기 가능) -->
        <div id="customerSidePanel" class="absolute top-4 left-4 bg-white rounded-xl shadow-xl w-80 max-h-[calc(100vh-120px)] z-10 transition-all duration-300">
          <div class="p-4">
            <!-- 타이틀 헤더 (항상 표시) -->
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-bold text-gray-800 flex items-center">
                  <i class="fas fa-users mr-2"></i>고객 목록
                </h3>
                <p class="text-xs text-gray-500 mt-1">
                  <span id="totalCustomerCount">0</span>명 등록됨
                </p>
              </div>
              <!-- 접기/펼치기 버튼 -->
              <button onclick="toggleCustomerPanel()" class="text-blue-600 hover:text-blue-800 transition">
                <i id="panelToggleIcon" class="fas fa-chevron-left text-xl"></i>
              </button>
            </div>
            
            <!-- 고객 목록 콘텐츠 (접기 가능) -->
            <div id="customerListContent" class="overflow-y-auto" style="max-height: calc(100vh - 200px);">
              <div id="customerList"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
  
  // 먼저 고객 데이터 로드
  loadCustomers().then(() => {
    // 초기에는 고객 목록 비우기 (접힌 상태로 시작)
    const listEl = document.getElementById('customerList')
    if (listEl) {
      listEl.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">지도에서 위치를 선택하면<br/>주변 고객 목록이 표시됩니다</p>'
    }
    
    // 전체 고객 수 표시
    const totalCountEl = document.getElementById('totalCustomerCount')
    if (totalCountEl) {
      totalCountEl.textContent = state.customers.length
    }
    
    // 고객 목록 패널 기본값 접기
    setTimeout(() => {
      const content = document.getElementById('customerListContent')
      const panel = document.getElementById('customerSidePanel')
      const icon = document.getElementById('panelToggleIcon')
      
      if (content && panel && icon) {
        content.style.display = 'none'
        panel.style.width = 'auto'
        icon.className = 'fas fa-chevron-right text-xl'
      }
    }, 100)
    
    // DOM이 완전히 렌더링될 때까지 대기
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // T Map API 로드 시도
        const mapDiv = document.getElementById('map')
        if (!mapDiv) {
          console.error('❌ 지도 컨테이너를 찾을 수 없습니다')
          showMapFallback()
          return
        }
        
        if (typeof Tmapv2 !== 'undefined') {
          console.log('✅ T Map API 로드됨, 지도 초기화 시작...')
          initTMap()
        } else {
          console.warn('⚠️ T Map API를 사용할 수 없습니다')
          showMapFallback()
        }
      })
    })
  }).catch(error => {
    console.error('고객 데이터 로드 실패:', error)
    showMapFallback()
  })
}

// 두 좌표 간 거리 계산 (미터)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000 // 지구 반지름 (미터)
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c) // 미터 단위로 반올림
}

// 주변 고객 목록 표시 (거리순)
function showNearbyCustomers(centerLat, centerLng) {
  // 모든 고객에 대해 거리 계산 (제한 없이 전체 표시)
  const customersWithDistance = state.customers
    .filter(c => c.latitude && c.longitude)
    .map(customer => ({
      ...customer,
      distance: calculateDistance(centerLat, centerLng, customer.latitude, customer.longitude)
    }))
    .sort((a, b) => a.distance - b.distance) // 거리순 정렬
  
  // 정렬된 고객 목록 저장
  state.sortedCustomers = customersWithDistance
  
  // 고객 목록 렌더링
  renderCustomerList()
  
  // 전체 고객 수 업데이트
  const totalCountEl = document.getElementById('totalCustomerCount')
  if (totalCountEl) {
    totalCountEl.textContent = state.customers.length
  }
  
  // 고객 목록 패널 펼치기
  const content = document.getElementById('customerListContent')
  const panel = document.getElementById('customerSidePanel')
  const icon = document.getElementById('panelToggleIcon')
  
  if (content && panel && icon) {
    content.style.display = 'block'
    panel.style.width = '20rem'
    icon.className = 'fas fa-chevron-left text-xl'
  }
}

// 고객 목록 렌더링 (지도 뷰용)
function renderCustomerList() {
  const listEl = document.getElementById('customerList')
  if (!listEl) return
  
  if (state.customers.length === 0) {
    listEl.innerHTML = '<p class="text-gray-500 text-center py-4">등록된 고객이 없습니다</p>'
    return
  }
  
  // 거리순 정렬 옵션이 있으면 사용, 없으면 모든 고객 표시
  const displayCustomers = state.sortedCustomers || state.customers
  
  listEl.innerHTML = displayCustomers.map(customer => {
    // AS결과에 따라 상태 색상 결정
    const markerColor = getMarkerColorByStatus(customer.as_result)
    let statusColor = 'gray'
    let statusIcon = 'fa-circle'
    
    if (markerColor === 'g') {
      statusColor = 'green'
      statusIcon = 'fa-check-circle'
    } else if (markerColor === 'y') {
      statusColor = 'yellow'
      statusIcon = 'fa-clock'
    } else if (markerColor === 'r') {
      statusColor = 'red'
      statusIcon = 'fa-exclamation-circle'
    } else {
      statusColor = 'blue'
      statusIcon = 'fa-circle'
    }
    
    // 간소화된 고객명만 표시
    return `
    <div class="p-2 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition mb-1 border border-gray-200" onclick="showCustomerDetail(${customer.id})">
      <div class="flex items-center justify-between gap-2">
        <span class="text-${statusColor}-500"><i class="fas ${statusIcon} text-xs"></i></span>
        <p class="font-medium text-gray-800 text-sm flex-1">${customer.customer_name}</p>
        ${customer.distance ? `<span class="text-xs text-gray-500">${customer.distance}m</span>` : ''}
      </div>
    </div>
    `
  }).join('')
}

// 지도 로드 실패시 대체 UI
function showMapFallback() {
  const mapDiv = document.getElementById('map')
  if (!mapDiv) return
  
  mapDiv.innerHTML = `
    <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div class="text-center p-8 max-w-md">
        <div class="mb-6">
          <i class="fas fa-map-marked-alt text-6xl text-blue-400 mb-4"></i>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-3">T Map 로딩 중</h2>
        <p class="text-gray-600 mb-4">
          T Map API를 불러오는 중입니다. 잠시만 기다려주세요.
        </p>
        <div class="bg-white rounded-lg p-4 mb-4 text-left shadow-sm">
          <p class="text-sm font-semibold text-gray-700 mb-2">T Map API 상태:</p>
          <p class="text-xs text-gray-600">
            페이지를 새로고침하면 지도가 표시됩니다.
          </p>
        </div>
        <p class="text-sm text-gray-500 mb-4">
          좌측 고객 목록에서 고객을 선택하여 상세 정보를 확인하고 길안내를 이용할 수 있습니다.
        </p>
        <button onclick="location.reload()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <i class="fas fa-sync-alt mr-2"></i>새로고침
        </button>
      </div>
    </div>
  `
}

// AS결과에 따라 마커 색상 결정
function getMarkerColorByStatus(asResult) {
  if (!asResult) return 'b' // 기본 파란색
  
  const result = String(asResult).trim().toLowerCase()
  
  // "완료" 키워드 포함 시 초록색
  if (result.includes('완료') || result.includes('수리') || result.includes('교체')) {
    return 'g' // green - 완료된 AS
  }
  // "점검" 또는 "대기" 키워드 포함 시 노란색
  else if (result.includes('점검') || result.includes('대기') || result.includes('예정')) {
    return 'y' // yellow - 점검/대기
  }
  // "취소" 또는 "불가" 키워드 포함 시 회색
  else if (result.includes('취소') || result.includes('불가') || result.includes('보류')) {
    return 'b' // blue(neutral) - 보류/취소
  }
  // 기타는 빨간색 (미완료/문제 있음)
  else {
    return 'r' // red - 미완료/문제
  }
}

// 마커 색상 → 배경색 변환
function getMarkerBgColor(markerColor) {
  const colors = {
    'g': '#10B981',  // 초록색
    'y': '#F59E0B',  // 노란색
    'r': '#EF4444',  // 빨간색
    'b': '#3B82F6'   // 파란색
  }
  return colors[markerColor] || colors['b']
}

// 네이버 지도 초기화
function initTMap() {
  console.log('🗺️ T Map 초기화 시작...')
  
  const mapDiv = document.getElementById('map')
  if (!mapDiv) {
    console.error('❌ 지도 컨테이너를 찾을 수 없습니다')
    return
  }
  
  // T Map API 로드 확인
  if (typeof Tmapv2 === 'undefined') {
    console.error('❌ T Map API가 로드되지 않았습니다')
    showMapFallback()
    return
  }
  
  // 기존 맵 제거 (중복 초기화 방지)
  if (state.map) {
    console.log('🔄 기존 지도 제거 중...')
    state.markers.forEach(marker => marker.setMap(null))
    state.markers = []
    state.map = null
  }
  
  try {
    console.log('🗺️ T Map 지도 초기화 시작...')
    
    // 서울 중심 좌표
    const centerLat = 37.5665
    const centerLng = 126.9780
    
    // 고객 좌표의 중심점 계산 (가장 밀집된 지역 찾기)
    const validCustomers = state.customers.filter(c => c.latitude && c.longitude)
    console.log(`📍 표시할 고객 수: ${validCustomers.length}`)
    
    let center, zoom
    if (validCustomers.length > 0) {
      // 가장 밀집된 지역 찾기 (각 고객 주변 반경 5km 내 고객 수 계산)
      let maxDensityCustomer = validCustomers[0]
      let maxDensity = 0
      
      validCustomers.forEach(customer => {
        let nearbyCount = 0
        validCustomers.forEach(other => {
          const distance = calculateDistance(
            customer.latitude, customer.longitude,
            other.latitude, other.longitude
          )
          if (distance <= 5000) { // 5km 반경
            nearbyCount++
          }
        })
        
        if (nearbyCount > maxDensity) {
          maxDensity = nearbyCount
          maxDensityCustomer = customer
        }
      })
      
      console.log(`🎯 가장 밀집된 지역: ${maxDensityCustomer.customer_name} 주변 (${maxDensity}명)`)
      center = new Tmapv2.LatLng(maxDensityCustomer.latitude, maxDensityCustomer.longitude)
      zoom = 14
    } else {
      center = new Tmapv2.LatLng(centerLat, centerLng)
      zoom = 13
    }
    
    // T Map 생성
    state.map = new Tmapv2.Map('map', {
      center: center,
      width: '100%',
      height: '100%',
      zoom: zoom,
      zoomControl: true,
      scrollwheel: true
    })
    
    console.log('✅ T Map 객체 생성 완료', state.map)
    console.log('🗺️ 지도 중심:', center.toString(), '줌 레벨:', zoom)
    
    // 고객 마커 추가
    console.log(`📍 마커 생성 시작 - 고객 수: ${validCustomers.length}`)
    
    validCustomers.forEach((customer, index) => {
      try {
        // AS결과에 따라 마커 색상 결정
        const markerColor = getMarkerColorByStatus(customer.as_result)
        
        // 색상별 SVG 아이콘 선택
        let markerColorName = 'blue'
        if (markerColor === 'g') markerColorName = 'green'
        else if (markerColor === 'y') markerColorName = 'yellow'
        else if (markerColor === 'r') markerColorName = 'red'
        
        console.log(`📍 마커 ${index + 1}: ${customer.customer_name} (${customer.latitude}, ${customer.longitude}) - 색상: ${markerColorName}`)
        
        // SVG 기반 마커 (샘플 코드 스타일)
        const markerHtml = `
          <div class='_t_marker' style="position:relative; width: 48px; height: 48px;">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 2C15.163 2 8 9.163 8 18C8 29.25 24 46 24 46C24 46 40 29.25 40 18C40 9.163 32.837 2 24 2Z" 
                    fill="${markerColorName === 'green' ? '#10B981' : markerColorName === 'yellow' ? '#F59E0B' : markerColorName === 'red' ? '#EF4444' : '#3B82F6'}" 
                    stroke="white" stroke-width="2"/>
              <circle cx="24" cy="18" r="6" fill="white"/>
            </svg>
            <div style="position:absolute; top:0; left:0; width:48px; height:48px; display:flex; align-items:center; justify-content: center; padding-bottom: 16px;">
              <span style="color:${markerColorName === 'green' ? '#10B981' : markerColorName === 'yellow' ? '#F59E0B' : markerColorName === 'red' ? '#EF4444' : '#3B82F6'}; font-weight: 700; font-size: 14px;">📍</span>
            </div>
          </div>
        `
        
        const marker = new Tmapv2.Marker({
          position: new Tmapv2.LatLng(customer.latitude, customer.longitude),
          map: state.map,
          title: customer.customer_name,
          iconHTML: markerHtml,
          iconSize: new Tmapv2.Size(48, 48),
          offset: new Tmapv2.Point(24, 48)
        })
        
        marker.addListener('click', function() {
          // 고객 상세 정보 표시
          showCustomerDetailOnMap(customer)
          
          // 클릭한 위치 기준으로 거리순 고객 목록 표시
          showNearbyCustomers(customer.latitude, customer.longitude)
        })
        
        state.markers.push(marker)
        console.log(`✅ 마커 ${index + 1} 생성 완료`)
      } catch (error) {
        console.error(`❌ 마커 ${index + 1} 생성 실패:`, error)
      }
    })
    
    console.log(`✅ T Map 초기화 완료: ${validCustomers.length}개의 마커 생성 시도, ${state.markers.length}개 성공`)
    showToast('지도가 로드되었습니다', 'success')
    
  } catch (error) {
    console.error('❌ T Map 초기화 오류:', error)
    showMapFallback()
    showToast('지도 로드 실패: T Map API를 확인해주세요', 'error')
  }
}

// 대시보드 통계 업데이트
function updateDashboardStats() {
  const totalEl = document.getElementById('totalCustomers')
  const geoEl = document.getElementById('geoCodedCustomers')
  const todayEl = document.getElementById('todayCustomers')
  
  if (totalEl) totalEl.textContent = state.customers.length
  
  if (geoEl) {
    const geoCodedCount = state.customers.filter(c => c.latitude && c.longitude).length
    geoEl.textContent = geoCodedCount
  }
  
  if (todayEl) {
    const today = new Date().toISOString().split('T')[0]
    const todayCount = state.customers.filter(c => c.created_at.startsWith(today)).length
    todayEl.textContent = todayCount
  }
}

// 고객 테이블 렌더링
function renderCustomerTable() {
  const tbody = document.getElementById('customerTableBody')
  if (!tbody) return
  
  if (state.customers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-4 py-8 text-center text-gray-500">
          <i class="fas fa-inbox text-4xl mb-2"></i>
          <p>등록된 고객이 없습니다</p>
        </td>
      </tr>
    `
    return
  }
  
  tbody.innerHTML = state.customers.map(customer => `
    <tr class="hover:bg-gray-50">
      <td class="px-4 py-3">
        <input type="checkbox" class="customer-checkbox rounded" value="${customer.id}">
      </td>
      <td class="px-4 py-3 text-sm text-gray-900">${customer.customer_name}</td>
      <td class="px-4 py-3 text-sm text-gray-600">${customer.phone || '-'}</td>
      <td class="px-4 py-3 text-sm text-gray-600">${customer.address}</td>
      <td class="px-4 py-3 text-sm">
        ${customer.latitude && customer.longitude 
          ? '<span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>등록됨</span>' 
          : '<span class="text-gray-400"><i class="fas fa-times-circle mr-1"></i>미등록</span>'}
      </td>
      <td class="px-4 py-3 text-sm text-gray-600">${new Date(customer.created_at).toLocaleDateString('ko-KR')}</td>
      <td class="px-4 py-3 text-center">
        <button onclick="deleteCustomer(${customer.id})" class="text-red-600 hover:text-red-800">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('')
}

// ============================================
// 이벤트 핸들러
// ============================================

function logout() {
  clearSession()
  showToast('로그아웃 되었습니다', 'info')
  renderLogin()
}

function switchToUserView() {
  renderUserMap()
}

function toggleSelectAll(checkbox) {
  const checkboxes = document.querySelectorAll('.customer-checkbox')
  checkboxes.forEach(cb => cb.checked = checkbox.checked)
}

async function deleteSelectedCustomers() {
  const checkboxes = document.querySelectorAll('.customer-checkbox:checked')
  const ids = Array.from(checkboxes).map(cb => parseInt(cb.value))
  
  if (ids.length === 0) {
    showToast('삭제할 고객을 선택해주세요', 'error')
    return
  }
  
  if (!confirm(`선택한 ${ids.length}명의 고객을 삭제하시겠습니까?`)) {
    return
  }
  
  await batchDeleteCustomers(ids)
  updateDashboardStats()
  renderCustomerTable()
}

function openUploadModal() {
  document.getElementById('uploadModal').classList.remove('hidden')
  document.getElementById('uploadStep1').classList.remove('hidden')
  document.getElementById('uploadStep2').classList.add('hidden')
}

function closeUploadModal() {
  document.getElementById('uploadModal').classList.add('hidden')
  state.uploadPreviewData = null
  state.uploadFile = null
  state.uploadFileName = null
  state.uploadRawData = null
  
  // 첨부 파일 목록 초기화
  const listEl = document.getElementById('attachedFilesList')
  if (listEl) {
    listEl.innerHTML = `
      <p class="text-sm text-gray-500 text-center py-8">
        <i class="fas fa-inbox text-3xl text-gray-300 mb-2"></i><br>
        첨부된 파일이 없습니다
      </p>
    `
  }
  
  // uploadStep1 보이기
  document.getElementById('uploadStep1').classList.remove('hidden')
  document.getElementById('uploadStep2').classList.add('hidden')
}

async function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  
  // 파일 확장자 확인
  const fileName = file.name.toLowerCase()
  if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
    showToast('Excel 파일(.xlsx, .xls)만 업로드 가능합니다', 'error')
    event.target.value = ''
    return
  }
  
  try {
    // 파일명 저장
    state.uploadFileName = file.name
    state.uploadFile = file
    
    // 첨부 파일 목록에 표시
    renderAttachedFile(file)
    
    showToast('파일이 첨부되었습니다. "파일 열기"로 내용을 확인하세요', 'success')
  } catch (error) {
    console.error('파일 첨부 오류:', error)
    showToast('파일을 첨부할 수 없습니다: ' + error.message, 'error')
  }
  
  // 파일 입력 초기화
  event.target.value = ''
}

// 첨부 파일 표시 (메일 형식)
function renderAttachedFile(file) {
  const listEl = document.getElementById('attachedFilesList')
  const fileSize = (file.size / 1024).toFixed(2) // KB
  
  listEl.innerHTML = `
    <div class="bg-white border border-gray-200 rounded-lg p-3">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3 flex-1">
          <i class="fas fa-file-excel text-green-600 text-2xl"></i>
          <div class="flex-1 min-w-0">
            <a href="#" onclick="previewAttachedFile(); return false;" class="text-blue-600 hover:text-blue-800 underline cursor-pointer font-medium">
              ${file.name}
            </a>
            <p class="text-xs text-gray-500 mt-1">${fileSize} KB</p>
          </div>
        </div>
        <button onclick="removeAttachedFile()" class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="flex justify-end">
        <button onclick="validateAttachedFile()" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          <i class="fas fa-upload mr-2"></i>업로드
        </button>
      </div>
    </div>
  `
}

// 첨부 파일 열기 (새 탭에서)
function previewAttachedFile() {
  if (!state.uploadFile) {
    showToast('첨부된 파일이 없습니다', 'error')
    return
  }
  
  try {
    // Blob URL 생성
    const url = URL.createObjectURL(state.uploadFile)
    
    // 다운로드 링크 생성 및 클릭 (Excel에서 바로 열기)
    const link = document.createElement('a')
    link.href = url
    link.download = state.uploadFileName || 'file.xlsx'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showToast('Excel 파일을 다운로드했습니다. Excel에서 열어주세요', 'success')
    
    // URL 해제
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
  } catch (error) {
    console.error('파일 열기 오류:', error)
    showToast('파일을 열 수 없습니다: ' + error.message, 'error')
  }
}

// 파일 검증 (업로드 전)
async function validateAttachedFile() {
  if (!state.uploadFile) {
    showToast('첨부된 파일이 없습니다', 'error')
    return
  }
  
  try {
    // 즉시 다음 화면으로 전환 (로딩 표시)
    document.getElementById('uploadStep1').classList.add('hidden')
    document.getElementById('uploadStep2').classList.remove('hidden')
    
    // 로딩 표시
    const summaryEl = document.getElementById('validationSummary')
    summaryEl.innerHTML = `
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p class="text-gray-600">파일을 검증하는 중...</p>
        </div>
      </div>
    `
    
    // Excel 파일 파싱
    const data = await parseExcel(state.uploadFile)
    
    if (data.length === 0) {
      showToast('파일에 데이터가 없습니다', 'error')
      return
    }
    
    // 원본 데이터 저장
    state.uploadRawData = data
    
    // 데이터 검증
    const validation = await validateCustomerData(data)
    if (!validation) return
    
    state.uploadPreviewData = validation
    
    // 검증 결과 표시
    renderFileInfo()
    renderValidationSummary(validation)
    renderDataPreview(validation)
    
    showToast('파일 검증이 완료되었습니다', 'success')
  } catch (error) {
    console.error('파일 검증 오류:', error)
    showToast('파일을 검증할 수 없습니다: ' + error.message, 'error')
  }
}

// 첨부 파일 제거
function removeAttachedFile() {
  state.uploadFile = null
  state.uploadFileName = null
  state.uploadRawData = null
  state.uploadPreviewData = null
  
  const listEl = document.getElementById('attachedFilesList')
  listEl.innerHTML = `
    <p class="text-sm text-gray-500 text-center py-8">
      <i class="fas fa-inbox text-3xl text-gray-300 mb-2"></i><br>
      첨부된 파일이 없습니다
    </p>
  `
  
  showToast('파일이 제거되었습니다', 'success')
}

// 샘플 Excel 파일 다운로드
function downloadSampleExcel() {
  // 샘플 데이터 생성 (실제 업무 양식)
  const sampleData = [
    ['순번', '횟수', '접수일자', '업체', '구분', '고객명', '전화번호', '설치연,월', '열원', '주소', 'AS접수내용', '설치팀', '지역', '접수자', 'AS결과'],
    [1, 1, '2024-01-15', '서울지사', 'AS', '김철수', '010-1234-5678', '2023-12', '가스', '서울특별시 강남구 테헤란로 123', '온수 온도 조절 불량', '1팀', '강남', '홍길동', '수리 완료'],
    [2, 1, '2024-01-16', '서울지사', 'AS', '이영희', '010-2345-6789', '2023-11', '전기', '서울특별시 서초구 서초대로 78길 22', '난방 작동 불량', '2팀', '서초', '김영희', '부품 교체 완료'],
    [3, 2, '2024-01-17', '서울지사', 'AS', '박민수', '010-3456-7890', '2023-10', '가스', '서울특별시 송파구 올림픽로 300', '보일러 소음 발생', '1팀', '송파', '홍길동', '점검 완료']
  ]
  
  // 워크북 생성
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(sampleData)
  
  // 열 너비 설정
  ws['!cols'] = [
    { wch: 8 },   // 순번
    { wch: 8 },   // 횟수
    { wch: 12 },  // 접수일자
    { wch: 12 },  // 업체
    { wch: 8 },   // 구분
    { wch: 12 },  // 고객명
    { wch: 15 },  // 전화번호
    { wch: 12 },  // 설치연,월
    { wch: 8 },   // 열원
    { wch: 40 },  // 주소
    { wch: 30 },  // AS접수내용
    { wch: 10 },  // 설치팀
    { wch: 10 },  // 지역
    { wch: 10 },  // 접수자
    { wch: 20 }   // AS결과
  ]
  
  XLSX.utils.book_append_sheet(wb, ws, 'AS접수현황')
  
  // 파일 다운로드
  XLSX.writeFile(wb, 'AS접수현황_템플릿.xlsx')
  showToast('템플릿 파일이 다운로드되었습니다', 'success')
}

// 파일 정보 표시
function renderFileInfo() {
  const fileInfoEl = document.getElementById('fileInfo')
  if (!fileInfoEl) return
  
  fileInfoEl.innerHTML = `
    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
      <div class="flex items-center">
        <i class="fas fa-file-excel text-blue-600 text-2xl mr-3"></i>
        <div class="flex-1">
          <p class="font-semibold">
            <a href="#" onclick="previewAttachedFile(); return false;" class="text-blue-600 hover:text-blue-800 underline cursor-pointer">
              ${state.uploadFileName || '파일명 없음'}
            </a>
          </p>
          <p class="text-sm text-blue-700">총 ${state.uploadRawData?.length || 0}개의 데이터</p>
        </div>
      </div>
    </div>
  `
}

function renderValidationSummary(validation) {
  const summaryEl = document.getElementById('validationSummary')
  summaryEl.innerHTML = `
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p class="text-2xl font-bold text-blue-700">${validation.summary.total}</p>
        <p class="text-sm text-blue-600">전체</p>
      </div>
      <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p class="text-2xl font-bold text-green-700">${validation.summary.valid}</p>
        <p class="text-sm text-green-600">유효</p>
      </div>
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p class="text-2xl font-bold text-red-700">${validation.summary.invalid}</p>
        <p class="text-sm text-red-600">오류</p>
      </div>
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p class="text-2xl font-bold text-yellow-700">${validation.summary.duplicates}</p>
        <p class="text-sm text-yellow-600">중복</p>
      </div>
    </div>
    
    <div class="flex justify-end space-x-3">
      <button onclick="closeUploadModal()" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
        취소
      </button>
      ${validation.summary.valid > 0 ? `
      <button onclick="confirmUpload()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        ${validation.summary.valid}건 업로드
      </button>
      ` : ''}
    </div>
  `
}

function renderDataPreview(validation) {
  const previewEl = document.getElementById('dataPreview')
  
  let html = ''
  
  // 유효한 데이터 - 간단한 요약만 표시
  if (validation.validRows.length > 0) {
    html += `
      <div class="mb-6">
        <h4 class="font-semibold text-green-700 mb-3">
          <i class="fas fa-check-circle mr-2"></i>유효한 데이터 (${validation.validRows.length}건)
        </h4>
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <p class="text-sm text-green-800">
            <i class="fas fa-info-circle mr-2"></i>
            ${validation.validRows.length}건의 고객 데이터가 업로드 준비되었습니다.
          </p>
          <p class="text-xs text-green-700 mt-2">
            파일을 확인하려면 Excel 프로그램에서 직접 열어보세요.
          </p>
        </div>
      </div>
    `
  }
  
  // 오류 데이터
  if (validation.invalidRows.length > 0) {
    html += `
      <div class="mb-6">
        <h4 class="font-semibold text-red-700 mb-3">
          <i class="fas fa-exclamation-triangle mr-2"></i>오류 데이터 (${validation.invalidRows.length}건)
        </h4>
        <div class="overflow-x-auto max-h-60 overflow-y-auto border rounded-lg">
          <table class="w-full text-sm">
            <thead class="bg-red-50 sticky top-0">
              <tr>
                <th class="px-3 py-2 text-left">No</th>
                <th class="px-3 py-2 text-left">고객명</th>
                <th class="px-3 py-2 text-left">주소</th>
                <th class="px-3 py-2 text-left">오류</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              ${validation.invalidRows.map(row => `
                <tr>
                  <td class="px-3 py-2">${row.rowIndex}</td>
                  <td class="px-3 py-2">${row.customer_name || '-'}</td>
                  <td class="px-3 py-2">${row.address || '-'}</td>
                  <td class="px-3 py-2 text-red-600">${row.errors.join(', ')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  }
  
  // 중복 데이터
  if (validation.duplicates && validation.duplicates.length > 0) {
    html += `
      <div class="mb-6">
        <h4 class="font-semibold text-yellow-700 mb-3">
          <i class="fas fa-copy mr-2"></i>중복 데이터 (${validation.duplicates.length}건)
        </h4>
        <div class="overflow-x-auto max-h-60 overflow-y-auto border rounded-lg">
          <table class="w-full text-sm">
            <thead class="bg-yellow-50 sticky top-0">
              <tr>
                <th class="px-3 py-2 text-left">No</th>
                <th class="px-3 py-2 text-left">고객명</th>
                <th class="px-3 py-2 text-left">주소</th>
                <th class="px-3 py-2 text-left">사유</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              ${validation.duplicates.map(row => `
                <tr>
                  <td class="px-3 py-2">${row.rowIndex}</td>
                  <td class="px-3 py-2">${row.customer_name || '-'}</td>
                  <td class="px-3 py-2">${row.address || '-'}</td>
                  <td class="px-3 py-2 text-yellow-700">${row.reason || '중복된 주소'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  }
  
  previewEl.innerHTML = html
}

async function confirmUpload() {
  if (!state.uploadPreviewData || !state.uploadPreviewData.validRows.length) {
    showToast('업로드할 데이터가 없습니다', 'error')
    return
  }
  
  try {
    // 즉시 로딩 화면으로 전환
    const summaryEl = document.getElementById('validationSummary')
    const previewEl = document.getElementById('dataPreview')
    
    summaryEl.innerHTML = `
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p class="text-gray-600 text-lg font-semibold">고객 데이터를 업로드하는 중...</p>
          <p class="text-gray-500 text-sm mt-2">잠시만 기다려주세요</p>
        </div>
      </div>
    `
    previewEl.innerHTML = ''
    
    // 주소를 좌표로 변환 (병렬 처리로 속도 향상)
    const geocodePromises = state.uploadPreviewData.validRows.map(async (row) => {
      const geoData = await geocodeAddress(row.address)
      return {
        ...row,
        latitude: geoData?.latitude,
        longitude: geoData?.longitude
      }
    })
    
    const validRowsWithGeo = await Promise.all(geocodePromises)
    
    // 데이터 업로드
    await batchUploadCustomers(validRowsWithGeo)
    
    // 완료 후 모달 닫기
    closeUploadModal()
    showToast('고객 데이터가 성공적으로 업로드되었습니다', 'success')
    
    // 대시보드 업데이트
    updateDashboardStats()
    renderCustomerTable()
  } catch (error) {
    console.error('업로드 오류:', error)
    showToast('업로드 중 오류가 발생했습니다: ' + error.message, 'error')
  }
}

function showCustomerDetail(customerId) {
  const customer = state.customers.find(c => c.id === customerId)
  if (!customer) return
  
  const panel = document.getElementById('customerDetailPanel')
  const content = document.getElementById('customerDetailContent')
  
  content.innerHTML = `
    <div class="space-y-4">
      <div>
        <p class="text-sm text-gray-600">고객명</p>
        <p class="text-lg font-semibold text-gray-800">${customer.customer_name}</p>
      </div>
      
      <div>
        <p class="text-sm text-gray-600">전화번호</p>
        <div class="flex items-center gap-2">
          <p class="text-gray-800 flex-1">${customer.phone || '-'}</p>
          ${customer.phone ? `
          <a href="tel:${customer.phone}" class="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition">
            <i class="fas fa-phone mr-1"></i>통화연결
          </a>
          ` : ''}
        </div>
      </div>
      
      <div>
        <p class="text-sm text-gray-600">주소</p>
        <p class="text-gray-800">${customer.address}</p>
      </div>
      
      <div>
        <p class="text-sm text-gray-600">지역</p>
        <p class="text-gray-800">${customer.region || '-'}</p>
      </div>
      
      <div>
        <p class="text-sm text-gray-600">AS접수내용</p>
        <p class="text-gray-800">${customer.as_content || '-'}</p>
      </div>
      
      ${customer.as_result ? `
      <div>
        <p class="text-sm text-gray-600">AS결과</p>
        <p class="text-gray-800">${customer.as_result}</p>
      </div>
      ` : ''}
      
      ${customer.install_team ? `
      <div>
        <p class="text-sm text-gray-600">설치팀</p>
        <p class="text-gray-800">${customer.install_team}</p>
      </div>
      ` : ''}
      
      <div>
        <p class="text-sm text-gray-600">접수일자</p>
        <p class="text-gray-800">${customer.receipt_date || customer.created_at || '-'}</p>
      </div>
      
      <div class="pt-4 border-t">
        ${customer.latitude && customer.longitude ? `
        <button onclick="openNavigation(${customer.latitude}, ${customer.longitude}, '${customer.customer_name.replace(/'/g, "\\'")}')" class="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition">
          <i class="fas fa-location-arrow mr-2"></i>카카오내비에서 길 안내
        </button>
        ` : ''}
      </div>
    </div>
  `
  
  panel.classList.remove('hidden')
  
  // 지도에서 해당 고객 위치로 이동
  if (state.map && customer.latitude && customer.longitude) {
    state.map.setCenter(new Tmapv2.LatLng(customer.latitude, customer.longitude))
    state.map.setZoom(17)
  }
}

// 지도에서 고객 상세정보 표시 (마커 클릭시)
function showCustomerDetailOnMap(customer) {
  showCustomerDetail(customer.id)
}

function closeCustomerDetail() {
  document.getElementById('customerDetailPanel').classList.add('hidden')
}

// 네이버 지도 길 안내 (내비게이션 모드)
function openNavigation(lat, lng, name) {
  // Kakao JavaScript API를 사용한 길 안내
  // JavaScript Key: c933c69ba4e0228895438c6a8c327e74
  
  try {
    if (typeof Kakao === 'undefined') {
      console.error('Kakao JavaScript SDK가 로드되지 않았습니다')
      // 폴백: 웹 URL 사용
      const kakaoMapUrl = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`
      window.open(kakaoMapUrl, '_blank')
      showToast('카카오맵에서 길 안내를 시작합니다', 'success')
      return
    }
    
    // Kakao Navi 앱 URL 스킴
    const kakaoNaviUrl = `kakaonavi://navigate?destination=${encodeURIComponent(name)}&lat=${lat}&lng=${lng}`
    
    // Kakao Map 웹 URL (앱이 없을 경우 대체)
    const kakaoMapUrl = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`
    
    // 모바일 환경 체크
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (isMobile) {
      // 모바일에서는 Kakao Navi 앱 스킴 시도
      window.location.href = kakaoNaviUrl
      
      // 1.5초 후에도 페이지가 그대로면 앱이 없는 것으로 판단
      setTimeout(() => {
        // 앱이 없으면 Kakao Map 웹으로 이동
        if (!document.hidden) {
          window.location.href = kakaoMapUrl
        }
      }, 1500)
    } else {
      // 데스크톱에서는 Kakao Map 웹으로 연결
      window.open(kakaoMapUrl, '_blank')
    }
    
    showToast('카카오내비로 길 안내를 시작합니다', 'success')
  } catch (error) {
    console.error('길 안내 오류:', error)
    showToast('길 안내를 실행할 수 없습니다', 'error')
  }
}

// T Map에서 검색 (길찾기)
function openDirections(address) {
  // T Map 검색 URL
  const url = `https://www.tmap.co.kr/tmap2/mobile/search.jsp?name=${encodeURIComponent(address)}`
  window.open(url, '_blank')
  showToast('T Map에서 주소를 검색합니다', 'info')
}

// 고객 목록 패널 접기/펼치기
function toggleCustomerPanel() {
  const panel = document.getElementById('customerSidePanel')
  const content = document.getElementById('customerListContent')
  const icon = document.getElementById('panelToggleIcon')
  
  if (!panel || !content || !icon) return
  
  const isCollapsed = content.style.display === 'none'
  
  if (isCollapsed) {
    // 펼치기
    content.style.display = 'block'
    panel.style.width = '20rem' // w-80
    icon.className = 'fas fa-chevron-left text-xl'
  } else {
    // 접기
    content.style.display = 'none'
    panel.style.width = 'auto' // 타이틀만 보이도록
    icon.className = 'fas fa-chevron-right text-xl'
  }
}

// ============================================
// 초기화
// ============================================
window.addEventListener('DOMContentLoaded', () => {
  if (loadSession()) {
    if (state.currentUser.role === 'admin') {
      renderAdminDashboard()
    } else {
      renderUserMap()
    }
  } else {
    renderLogin()
  }
})

// 전역 함수로 등록
window.logout = logout
window.switchToUserView = switchToUserView
window.toggleSelectAll = toggleSelectAll
window.deleteSelectedCustomers = deleteSelectedCustomers
window.openUploadModal = openUploadModal
window.closeUploadModal = closeUploadModal
window.handleFileSelect = handleFileSelect
window.downloadSampleExcel = downloadSampleExcel
window.confirmUpload = confirmUpload
window.showCustomerDetail = showCustomerDetail
window.showCustomerDetailOnMap = showCustomerDetailOnMap
window.closeCustomerDetail = closeCustomerDetail
window.openDirections = openDirections
window.openNavigation = openNavigation
window.renderAdminDashboard = renderAdminDashboard
window.toggleCustomerPanel = toggleCustomerPanel
