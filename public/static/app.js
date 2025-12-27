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
// CSV 파싱 함수
// ============================================
function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim())
  const data = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    data.push(row)
  }
  
  return data
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
                <i class="fas fa-file-upload mr-2"></i>CSV 업로드
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
    
    <!-- CSV 업로드 모달 -->
    <div id="uploadModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div class="p-6 border-b flex justify-between items-center">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-file-upload mr-2"></i>CSV 파일 업로드
          </h3>
          <button onclick="closeUploadModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto" style="max-height: calc(90vh - 140px)">
          <div id="uploadStep1" class="space-y-4">
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <i class="fas fa-cloud-upload-alt text-5xl text-gray-400 mb-4"></i>
              <p class="text-gray-600 mb-4">CSV 파일을 선택하거나 드래그하여 업로드하세요</p>
              <input type="file" id="csvFile" accept=".csv" class="hidden" onchange="handleFileSelect(event)">
              <button onclick="document.getElementById('csvFile').click()" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                파일 선택
              </button>
            </div>
            
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p class="font-semibold text-blue-900 mb-2">
                <i class="fas fa-info-circle mr-2"></i>CSV 파일 형식
              </p>
              <p class="text-sm text-blue-800">
                customer_name, phone, email, address, address_detail, memo
              </p>
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
      
      <!-- 지도 컨테이너 -->
      <div class="flex-1 relative">
        <div id="map" class="w-full h-full bg-gray-200 flex items-center justify-center">
          <div class="text-center">
            <i class="fas fa-map text-6xl text-gray-400 mb-4"></i>
            <p class="text-xl text-gray-600 font-semibold">네이버 지도 API 연동 필요</p>
            <p class="text-gray-500 mt-2">네이버 클라우드 플랫폼에서 API 키를 발급받아주세요</p>
            <div class="mt-6 p-4 bg-white rounded-lg shadow-md inline-block text-left">
              <p class="font-semibold mb-2">임시 고객 목록:</p>
              <div id="customerList" class="space-y-2 max-h-96 overflow-y-auto"></div>
            </div>
          </div>
        </div>
        
        <!-- 고객 상세 정보 패널 -->
        <div id="customerDetailPanel" class="hidden absolute top-4 right-4 bg-white rounded-xl shadow-xl p-6 w-80 max-h-[calc(100vh-120px)] overflow-y-auto">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-bold text-gray-800">고객 상세 정보</h3>
            <button onclick="closeCustomerDetail()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div id="customerDetailContent"></div>
        </div>
      </div>
    </div>
  `
  
  loadCustomers().then(() => {
    renderCustomerList()
    // 실제 네이버 맵 API가 있다면 여기서 지도 초기화
    // initNaverMap()
  })
}

// 고객 목록 렌더링 (지도 뷰용)
function renderCustomerList() {
  const listEl = document.getElementById('customerList')
  if (!listEl) return
  
  if (state.customers.length === 0) {
    listEl.innerHTML = '<p class="text-gray-500">등록된 고객이 없습니다</p>'
    return
  }
  
  listEl.innerHTML = state.customers.map(customer => `
    <div class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition" onclick="showCustomerDetail(${customer.id})">
      <p class="font-semibold text-gray-800">${customer.customer_name}</p>
      <p class="text-sm text-gray-600 truncate">${customer.address}</p>
    </div>
  `).join('')
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
}

async function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = async (e) => {
    const text = e.target.result
    const data = parseCSV(text)
    
    if (data.length === 0) {
      showToast('파일에서 데이터를 읽을 수 없습니다', 'error')
      return
    }
    
    // 데이터 검증
    const validation = await validateCustomerData(data)
    if (!validation) return
    
    state.uploadPreviewData = validation
    
    // 검증 결과 표시
    document.getElementById('uploadStep1').classList.add('hidden')
    document.getElementById('uploadStep2').classList.remove('hidden')
    
    renderValidationSummary(validation)
    renderDataPreview(validation)
  }
  reader.readAsText(file)
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
  
  // 유효한 데이터
  if (validation.validRows.length > 0) {
    html += `
      <div class="mb-6">
        <h4 class="font-semibold text-green-700 mb-3">
          <i class="fas fa-check-circle mr-2"></i>유효한 데이터 (${validation.validRows.length}건)
        </h4>
        <div class="overflow-x-auto max-h-60 overflow-y-auto border rounded-lg">
          <table class="w-full text-sm">
            <thead class="bg-green-50 sticky top-0">
              <tr>
                <th class="px-3 py-2 text-left">No</th>
                <th class="px-3 py-2 text-left">고객명</th>
                <th class="px-3 py-2 text-left">전화번호</th>
                <th class="px-3 py-2 text-left">주소</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              ${validation.validRows.slice(0, 10).map(row => `
                <tr>
                  <td class="px-3 py-2">${row.rowIndex}</td>
                  <td class="px-3 py-2">${row.customer_name}</td>
                  <td class="px-3 py-2">${row.phone || '-'}</td>
                  <td class="px-3 py-2">${row.address}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${validation.validRows.length > 10 ? `<p class="text-sm text-gray-600 mt-2">외 ${validation.validRows.length - 10}건...</p>` : ''}
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
  
  previewEl.innerHTML = html
}

async function confirmUpload() {
  if (!state.uploadPreviewData || !state.uploadPreviewData.validRows.length) {
    showToast('업로드할 데이터가 없습니다', 'error')
    return
  }
  
  // 주소를 좌표로 변환
  const validRowsWithGeo = []
  for (const row of state.uploadPreviewData.validRows) {
    const geoData = await geocodeAddress(row.address)
    validRowsWithGeo.push({
      ...row,
      latitude: geoData?.latitude,
      longitude: geoData?.longitude
    })
  }
  
  await batchUploadCustomers(validRowsWithGeo)
  closeUploadModal()
  updateDashboardStats()
  renderCustomerTable()
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
        <p class="text-gray-800">${customer.phone || '-'}</p>
      </div>
      
      <div>
        <p class="text-sm text-gray-600">이메일</p>
        <p class="text-gray-800">${customer.email || '-'}</p>
      </div>
      
      <div>
        <p class="text-sm text-gray-600">주소</p>
        <p class="text-gray-800">${customer.address}</p>
        ${customer.address_detail ? `<p class="text-sm text-gray-600 mt-1">${customer.address_detail}</p>` : ''}
      </div>
      
      <div>
        <p class="text-sm text-gray-600">위치 정보</p>
        ${customer.latitude && customer.longitude 
          ? `<p class="text-gray-800">위도: ${customer.latitude}, 경도: ${customer.longitude}</p>`
          : '<p class="text-gray-500">미등록</p>'}
      </div>
      
      ${customer.memo ? `
      <div>
        <p class="text-sm text-gray-600">메모</p>
        <p class="text-gray-800">${customer.memo}</p>
      </div>
      ` : ''}
      
      <div class="pt-4 border-t">
        <button onclick="openDirections('${customer.address}')" class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <i class="fas fa-directions mr-2"></i>길찾기
        </button>
      </div>
    </div>
  `
  
  panel.classList.remove('hidden')
}

function closeCustomerDetail() {
  document.getElementById('customerDetailPanel').classList.add('hidden')
}

function openDirections(address) {
  // 네이버 지도 길찾기 URL
  const url = `https://map.naver.com/v5/search/${encodeURIComponent(address)}`
  window.open(url, '_blank')
  showToast('새 창에서 길찾기를 엽니다', 'info')
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
window.confirmUpload = confirmUpload
window.showCustomerDetail = showCustomerDetail
window.closeCustomerDetail = closeCustomerDetail
window.openDirections = openDirections
window.renderAdminDashboard = renderAdminDashboard
