// Kakao Maps 초기화 (T Map 대체)
function initKakaoMap() {
  console.log('🗺️ Kakao Maps 초기화 시작...')
  
  const mapDiv = document.getElementById('map')
  if (!mapDiv) {
    console.error('❌ 지도 컨테이너를 찾을 수 없습니다')
    return
  }
  
  // Kakao Maps API 로드 확인
  if (typeof kakao === 'undefined' || !kakao.maps) {
    console.error('❌ Kakao Maps API가 로드되지 않았습니다')
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
    console.log('🗺️ Kakao Maps 지도 초기화 시작...')
    
    // 서울 중심 좌표 (기본값)
    const defaultCenterLat = 37.5665
    const defaultCenterLng = 126.9780
    
    // 고객 좌표의 중심점 계산 (가장 밀집된 지역 찾기)
    const validCustomers = state.customers.filter(c => c.latitude && c.longitude)
    console.log(`📍 표시할 고객 수: ${validCustomers.length}`)
    
    let centerLat, centerLng, zoom
    
    // 지도 중심 결정: 1) 가장 밀집된 고객 지역 2) 서울 중심
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
      centerLat = maxDensityCustomer.latitude
      centerLng = maxDensityCustomer.longitude
      zoom = 8  // Kakao Maps 줌 레벨 (T Map 14 ≈ Kakao 8)
    } else {
      // 기본 서울 중심
      centerLat = defaultCenterLat
      centerLng = defaultCenterLng
      zoom = 7  // Kakao Maps 줌 레벨 (T Map 13 ≈ Kakao 7)
    }
    
    // Kakao Maps 생성
    const mapOptions = {
      center: new kakao.maps.LatLng(centerLat, centerLng),
      level: zoom
    }
    
    state.map = new kakao.maps.Map(mapDiv, mapOptions)
    
    // 지도 타입 설정
    if (state.mapType === 'satellite') {
      state.map.setMapTypeId(kakao.maps.MapTypeId.HYBRID)
    } else {
      state.map.setMapTypeId(kakao.maps.MapTypeId.ROADMAP)
    }
    
    console.log('✅ Kakao Maps 객체 생성 완료')
    console.log('🗺️ 지도 중심:', centerLat, centerLng, '줌 레벨:', zoom)
    console.log('🗺️ 지도 타입:', state.mapType)
    
    // 고객 마커 추가
    console.log(`📍 마커 생성 시작 - 고객 수: ${validCustomers.length}`)
    
    validCustomers.forEach((customer, index) => {
      try {
        // AS결과에 따라 마커 색상 결정
        const markerColor = getMarkerColorByStatus(customer.as_result)
        
        // 색상별 이미지 URL 생성 (Kakao Maps 마커 이미지)
        let markerImageUrl
        if (markerColor === 'g') {
          markerImageUrl = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_green.png'
        } else if (markerColor === 'y') {
          markerImageUrl = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_yellow.png'
        } else if (markerColor === 'r') {
          markerImageUrl = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png'
        } else {
          markerImageUrl = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png'
        }
        
        const markerSize = new kakao.maps.Size(24, 35)  // 마커 크기
        const markerImage = new kakao.maps.MarkerImage(markerImageUrl, markerSize)
        
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(customer.latitude, customer.longitude),
          map: state.map,
          title: customer.customer_name,
          image: markerImage
        })
        
        // 클릭 이벤트
        kakao.maps.event.addListener(marker, 'click', function() {
          console.log('🖱️ 마커 클릭:', customer.customer_name)
          
          // 고객 상세 정보 표시
          showCustomerDetailOnMap(customer)
          
          // 클릭한 위치 기준으로 거리순 고객 목록 표시
          showNearbyCustomers(customer.latitude, customer.longitude)
        })
        
        state.markers.push(marker)
        console.log(`✅ 마커 ${index + 1} 생성 완료: ${customer.customer_name}`)
      } catch (error) {
        console.error(`❌ 마커 ${index + 1} 생성 실패:`, error)
      }
    })
    
    console.log(`✅ Kakao Maps 초기화 완료: ${validCustomers.length}개의 마커 생성 시도, ${state.markers.length}개 성공`)
    
    showToast('지도가 로드되었습니다', 'success')
    
    // 지도 초기화 완료 후 GPS 위치 요청
    requestUserLocation()
    
  } catch (error) {
    console.error('❌ Kakao Maps 초기화 실패:', error)
    showMapFallback()
    showToast('지도 로드 실패: Kakao Maps API를 확인해주세요', 'error')
  }
}
