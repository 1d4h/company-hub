# 네이버 맵 API 설정 가이드

## 📍 네이버 맵 API 키 발급 및 설정 방법

### 1단계: 네이버 클라우드 플랫폼 가입

1. **[네이버 클라우드 플랫폼](https://www.ncloud.com/)** 접속
2. **회원가입** 또는 **로그인**
3. **본인인증** 완료 (휴대폰 인증 또는 신용카드 인증)

### 2단계: Maps API 신청

1. 콘솔 로그인 후 **Services** 메뉴 클릭
2. **AI·NAVER API** 카테고리 선택
3. **Maps** 클릭
4. **이용 신청하기** 버튼 클릭
5. 약관 동의 후 신청 완료

### 3단계: Application 등록

1. **Application 등록** 버튼 클릭
2. 다음 정보 입력:
   - **Application 이름**: 고객관리시스템 (또는 원하는 이름)
   - **Service 선택**: 
     - ✅ **Web Dynamic Map** (지도 표시용)
     - ✅ **Geocoding** (주소 → 좌표 변환용)
   - **Web 서비스 URL**: `http://localhost:3000` (개발용)
3. **등록** 버튼 클릭

### 4단계: 인증 정보 확인

등록이 완료되면 다음 정보를 확인할 수 있습니다:
- **Client ID**: `abc123def456` (예시)
- **Client Secret**: `xyz789uvw012` (예시)

⚠️ **중요**: Client Secret은 외부에 노출되지 않도록 주의하세요!

---

## 💻 프로젝트 설정

### 1. `.dev.vars` 파일 수정

프로젝트 루트 디렉토리의 `.dev.vars` 파일을 열어서 발급받은 키를 입력하세요:

```env
# 네이버 맵 API 인증 정보
NAVER_MAP_CLIENT_ID=여기에_발급받은_Client_ID_입력
NAVER_MAP_CLIENT_SECRET=여기에_발급받은_Client_Secret_입력
```

**예시**:
```env
NAVER_MAP_CLIENT_ID=abc123def456
NAVER_MAP_CLIENT_SECRET=xyz789uvw012
```

### 2. HTML에 네이버 맵 스크립트 추가

`src/index.tsx` 파일의 다음 라인을 수정하세요:

**변경 전**:
```html
<script type="text/javascript" src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=YOUR_CLIENT_ID"></script>
```

**변경 후**:
```html
<script type="text/javascript" src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=여기에_발급받은_Client_ID_입력"></script>
```

**예시**:
```html
<script type="text/javascript" src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=abc123def456"></script>
```

### 3. 서비스 재시작

```bash
# 포트 정리
npm run clean-port

# 다시 빌드
npm run build

# PM2로 재시작
pm2 restart webapp

# 또는 완전히 재시작
pm2 delete webapp
pm2 start ecosystem.config.cjs
```

---

## 🧪 테스트 방법

### 1. 지오코딩 API 테스트

터미널에서 다음 명령어 실행:

```bash
curl -X POST http://localhost:3000/api/geocode \
  -H "Content-Type: application/json" \
  -d '{"address":"서울특별시 강남구 테헤란로 123"}'
```

**성공 응답 예시**:
```json
{
  "success": true,
  "result": {
    "latitude": 37.5012,
    "longitude": 127.0396,
    "address": "서울특별시 강남구 테헤란로 123"
  }
}
```

**API 키가 설정되지 않은 경우**:
```json
{
  "success": true,
  "result": {
    "latitude": 37.5665,
    "longitude": 126.9780,
    "address": "서울특별시 강남구 테헤란로 123"
  },
  "notice": "네이버 맵 API 키가 설정되지 않아 더미 좌표를 반환합니다."
}
```

### 2. 웹 UI에서 테스트

1. 브라우저에서 `http://localhost:3000` 접속
2. `admin` / `admin123`으로 로그인
3. **CSV 업로드** 기능 사용
4. 업로드 시 주소가 자동으로 좌표로 변환되는지 확인

---

## 🗺️ 지도 렌더링 추가 (선택사항)

현재는 고객 목록만 표시되고 있습니다. 실제 지도를 렌더링하려면 `public/static/app.js` 파일의 `renderUserMap()` 함수에서 지도 초기화 코드를 추가해야 합니다.

**참고 코드**:
```javascript
// public/static/app.js의 renderUserMap() 함수 내부에 추가
function initNaverMap() {
  if (typeof naver === 'undefined') {
    console.error('네이버 맵 API가 로드되지 않았습니다')
    return
  }
  
  const mapDiv = document.getElementById('map')
  const mapOptions = {
    center: new naver.maps.LatLng(37.5665, 126.9780),
    zoom: 12
  }
  
  state.map = new naver.maps.Map(mapDiv, mapOptions)
  
  // 고객 마커 추가
  state.customers.forEach(customer => {
    if (customer.latitude && customer.longitude) {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(customer.latitude, customer.longitude),
        map: state.map,
        title: customer.customer_name
      })
      
      naver.maps.Event.addListener(marker, 'click', function() {
        showCustomerDetail(customer.id)
      })
      
      state.markers.push(marker)
    }
  })
}
```

---

## 🔒 보안 주의사항

1. **`.dev.vars` 파일은 절대 Git에 커밋하지 마세요!**
   - 이미 `.gitignore`에 추가되어 있습니다

2. **프로덕션 배포시 환경변수 설정**:
   ```bash
   # Cloudflare Pages에 환경변수 설정
   wrangler pages secret put NAVER_MAP_CLIENT_ID
   wrangler pages secret put NAVER_MAP_CLIENT_SECRET
   ```

3. **Web 서비스 URL 제한**:
   - 네이버 클라우드 플랫폼 콘솔에서 허용된 도메인만 API를 사용하도록 설정 가능

---

## 📚 참고 문서

- [네이버 클라우드 플랫폼 Maps API](https://www.ncloud.com/product/applicationService/maps)
- [Maps API 가이드](https://guide.ncloud-docs.com/docs/maps-overview)
- [Geocoding API 문서](https://api.ncloud-docs.com/docs/ai-naver-mapsgeocoding-geocode)
- [Web Dynamic Map API 문서](https://navermaps.github.io/maps.js.ncp/)

---

## ❓ 문제 해결

### API 호출 시 401 오류
- Client ID/Secret이 정확한지 확인
- Application에서 Geocoding 서비스가 활성화되어 있는지 확인

### API 호출 시 403 오류
- Web 서비스 URL이 등록되어 있는지 확인
- 허용된 도메인에서 요청하고 있는지 확인

### 지도가 표시되지 않음
- 브라우저 콘솔에서 에러 메시지 확인
- 네이버 맵 스크립트의 Client ID가 올바른지 확인
- `naver` 객체가 로드되었는지 확인: `console.log(typeof naver)`

---

**작성일**: 2025-12-27  
**버전**: 1.0
