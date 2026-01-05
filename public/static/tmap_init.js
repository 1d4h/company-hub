// ============================================
// T Map 지도 초기화
// ============================================
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
    
    // 고객 좌표의 중심점 계산
    const validCustomers = state.customers.filter(c => c.latitude && c.longitude)
    console.log(`📍 표시할 고객 수: ${validCustomers.length}`)
    
    let center, zoom
    if (validCustomers.length > 0) {
      const avgLat = validCustomers.reduce((sum, c) => sum + c.latitude, 0) / validCustomers.length
      const avgLng = validCustomers.reduce((sum, c) => sum + c.longitude, 0) / validCustomers.length
      center = new Tmapv2.LatLng(avgLat, avgLng)
      zoom = 15
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
    
    console.log('✅ T Map 객체 생성 완료')
    
    // 고객 마커 추가
    validCustomers.forEach(customer => {
      const marker = new Tmapv2.Marker({
        position: new Tmapv2.LatLng(customer.latitude, customer.longitude),
        map: state.map,
        title: customer.customer_name,
        icon: 'https://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_a.png',
        iconSize: new Tmapv2.Size(24, 38)
      })
      
      marker.addListener('click', function() {
        showCustomerDetailOnMap(customer)
      })
      
      state.markers.push(marker)
    })
    
    console.log(`✅ T Map 초기화 완료: ${validCustomers.length}개의 마커 표시`)
    showToast('지도가 로드되었습니다', 'success')
    
  } catch (error) {
    console.error('❌ T Map 초기화 오류:', error)
    showMapFallback()
    showToast('지도 로드 실패: T Map API를 확인해주세요', 'error')
  }
}
