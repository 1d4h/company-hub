// Kakao Maps 완전 버전 - initKakaoMap 함수

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
    
    let centerLat, centerLng, level
    
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
      level = 8  // Kakao Maps level (낮을수록 확대)
    } else {
      // 기본 서울 중심
      centerLat = defaultCenterLat
      centerLng = defaultCenterLng
      level = 9
    }
    
    // Kakao Maps 생성
    const mapOption = {
      center: new kakao.maps.LatLng(centerLat, centerLng),
      level: level
    }
    
    state.map = new kakao.maps.Map(mapDiv, mapOption)
    
    // 지도 타입 컨트롤 추가 (일반/위성 전환)
    const mapTypeControl = new kakao.maps.MapTypeControl()
    state.map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT)
    
    // 줌 컨트롤 추가
    const zoomControl = new kakao.maps.ZoomControl()
    state.map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT)
    
    console.log('✅ Kakao Maps 객체 생성 완료')
    console.log('🗺️ 지도 중심:', centerLat, centerLng, 'Level:', level)
    
    // 고객 마커 추가
    console.log(`📍 마커 생성 시작 - 고객 수: ${validCustomers.length}`)
    
    validCustomers.forEach((customer, index) => {
      try {
        // AS결과에 따라 마커 색상 결정
        const markerColor = getMarkerColorByStatus(customer.as_result)
        
        // Kakao Maps 기본 마커 이미지 URL
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
        
        const imageSize = new kakao.maps.Size(24, 35)
        const markerImage = new kakao.maps.MarkerImage(markerImageUrl, imageSize)
        
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

// GPS 위치 마커 추가 (Kakao CustomOverlay 버전)
function addUserLocationMarker() {
  if (!state.map || !state.userLocation) {
    console.log('⚠️ GPS 마커 생성 불가:', !state.map ? '지도 없음' : '위치 없음')
    return
  }
  
  try {
    // 기존 GPS 마커 제거
    if (state.userLocationMarker) {
      state.userLocationMarker.setMap(null)
      state.userLocationMarker = null
    }
    
    console.log('📍 GPS 마커 생성 시작:', state.userLocation.lat, state.userLocation.lng)
    
    // Kakao CustomOverlay로 펄스 애니메이션 마커 생성
    const markerContent = `
      <div style="position: relative; width: 80px; height: 80px; transform: translate(-50%, -50%);">
        <!-- 펄스 애니메이션 외부 링 -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; height: 60px; background: rgba(255, 0, 0, 0.3); border-radius: 50%; animation: pulse-gps 2s infinite;"></div>
        <!-- 중간 링 -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: rgba(255, 0, 0, 0.5); border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(255,0,0,0.5);"></div>
        <!-- 내부 점 -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: #FF0000; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); z-index: 10;"></div>
      </div>
      <style>
        @keyframes pulse-gps {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.9;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 0.3;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.9;
          }
        }
      </style>
    `
    
    const customOverlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(state.userLocation.lat, state.userLocation.lng),
      content: markerContent,
      zIndex: 999
    })
    
    customOverlay.setMap(state.map)
    state.userLocationMarker = customOverlay
    
    console.log('✅ GPS 마커 추가 완료 (빨간색 펄스 애니메이션)')
    
  } catch (error) {
    console.error('❌ GPS 마커 생성 실패:', error)
  }
}

// 내 위치로 이동 (Kakao Maps 버전)
function moveToUserLocation() {
  if (!state.map) {
    showToast('지도를 먼저 로드해주세요', 'error')
    return
  }
  
  if (state.userLocation) {
    // 저장된 GPS 위치로 이동
    const moveLatLon = new kakao.maps.LatLng(state.userLocation.lat, state.userLocation.lng)
    state.map.setCenter(moveLatLon)
    state.map.setLevel(4)  // Kakao Maps level (낮을수록 확대)
    
    // GPS 마커 업데이트
    addUserLocationMarker()
    
    showToast('현재 위치로 이동했습니다', 'success')
  } else {
    // GPS 위치 새로 요청
    if (!navigator.geolocation) {
      showToast('GPS를 지원하지 않는 브라우저입니다', 'error')
      return
    }
    
    showToast('GPS 위치를 가져오는 중...', 'info')
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        state.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        console.log(`✅ GPS 위치: ${state.userLocation.lat}, ${state.userLocation.lng}`)
        
        // GPS 위치로 지도 중심 이동
        const moveLatLon = new kakao.maps.LatLng(state.userLocation.lat, state.userLocation.lng)
        state.map.setCenter(moveLatLon)
        state.map.setLevel(4)
        
        // GPS 마커 추가
        addUserLocationMarker()
        
        showToast('현재 위치로 이동했습니다', 'success')
      },
      (error) => {
        console.error('GPS 오류:', error)
        let errorMsg = '위치를 가져올 수 없습니다'
        if (error.code === 1) errorMsg = '위치 권한이 필요합니다'
        else if (error.code === 2) errorMsg = '위치 정보를 사용할 수 없습니다'
        else if (error.code === 3) errorMsg = '위치 요청 시간이 초과되었습니다'
        showToast(errorMsg, 'warning')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }
}

// 지도 타입 전환 (일반 ↔ 위성)
function toggleMapType() {
  if (!state.map) {
    showToast('지도를 먼저 로드해주세요', 'error')
    return
  }
  
  try {
    const mapTypeText = document.getElementById('mapTypeText')
    const mapTypeIcon = document.getElementById('mapTypeIcon')
    
    if (state.mapType === 'normal') {
      // 위성 지도로 전환
      state.map.setMapTypeId(kakao.maps.MapTypeId.HYBRID)
      state.mapType = 'satellite'
      if (mapTypeText) mapTypeText.textContent = '일반 지도'
      if (mapTypeIcon) mapTypeIcon.className = 'fas fa-map'
      showToast('위성 지도로 전환되었습니다', 'success')
    } else {
      // 일반 지도로 전환
      state.map.setMapTypeId(kakao.maps.MapTypeId.ROADMAP)
      state.mapType = 'normal'
      if (mapTypeText) mapTypeText.textContent = '위성 지도'
      if (mapTypeIcon) mapTypeIcon.className = 'fas fa-satellite'
      showToast('일반 지도로 전환되었습니다', 'success')
    }
    
    console.log('✅ 지도 타입 전환 완료:', state.mapType)
  } catch (error) {
    console.error('❌ 지도 타입 전환 실패:', error)
    showToast('지도 타입 전환에 실패했습니다', 'error')
  }
}
