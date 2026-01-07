# 고객관리 시스템 (AS접수현황 관리)

AS 접수현황을 관리하는 지도 기반 웹 애플리케이션

---

## 🎉 **안정 버전 백업 (2026-01-08)**

### 📦 백업 정보
- **백업 날짜**: 2026-01-08
- **백업 버전**: v1.0-stable-2026-01-08
- **완성도**: 90%
- **Git 커밋**: `8ff7d44` (로그인 비밀번호 표시/숨김, T Map 길 안내 추가, Kakao Map 텍스트 변경)
- **백업 파일**: https://www.genspark.ai/api/files/s/AFNsi47e

### 🔄 백업 복원 방법

#### 방법 1: Git 태그로 복원
```bash
cd /home/user/webapp
git checkout v1.0-stable-2026-01-08
pm2 restart webapp
```

#### 방법 2: Git 커밋 해시로 복원
```bash
cd /home/user/webapp
git reset --hard 8ff7d44
pm2 restart webapp
```

#### 방법 3: 백업 파일로 복원
1. 백업 파일 다운로드: https://www.genspark.ai/api/files/s/AFNsi47e
2. 압축 해제:
```bash
cd /home/user
tar -xzf webapp_stable_2026-01-08.tar.gz
pm2 restart webapp
```

---

## 🌐 공개 URL

**웹 애플리케이션**: https://3000-irn3f4j2vutvnwvbf7bwh-cc2fbc16.sandbox.novita.ai

## 📋 프로젝트 개요

- **이름**: 고객관리 시스템 (AS접수현황 관리)
- **목표**: T Map 기반으로 AS 접수 고객 정보를 시각화하고 관리하는 웹 애플리케이션
- **기술 스택**: Hono + Node.js + T Map API + Kakao Map API + TailwindCSS + SheetJS

## ✨ 주요 기능

### 완료된 기능 (v1.0-stable-2026-01-08)

1. **사용자 인증 시스템**
   - ✅ 로그인 화면 비밀번호 표시/숨김 토글 (👁️ 아이콘)
   - ✅ 관리자 계정: admin, master1, master2, master3
   - ✅ 사용자 계정: user, test1~test10
   - ✅ 세션 관리
   - ✅ 회원가입 기능 (관리자 승인 대기)

2. **관리자 대시보드**
   - ✅ AS 접수 통계 (전체 고객, 위치 등록, 오늘 등록)
   - ✅ AS 접수현황 테이블
   - ✅ Excel 파일 업로드 (.xlsx, .xls)
   - ✅ 데이터 검증 및 미리보기
   - ✅ 파일명 표시 기능
   - ✅ 고객 일괄 삭제
   - ✅ 중복/오류 데이터 감지
   - ✅ AS접수현황 템플릿 다운로드

3. **Excel 데이터 업로드**
   - ✅ **새 템플릿 구조**: 순번, 횟수, 접수일자, 업체, 구분, 고객명, 전화번호, 설치연월, 열원, 주소, AS접수내용, 설치팀, 지역, 접수자, AS결과
   - ✅ 파일 검증 (필수 필드, 형식 체크)
   - ✅ Excel 파일 파싱 (.xlsx, .xls)
   - ✅ 중복 데이터 감지 (메모리 DB 및 파일 내)
   - ✅ 업로드 전 미리보기 (파일명, 데이터 요약)
   - ✅ 유효한 데이터만 선택적 업로드
   - ✅ 자동 지오코딩 (주소 → 좌표 변환, T Map API)
   - ✅ 템플릿 파일 다운로드 기능

4. **사용자 지도 뷰**
   - ✅ **T Map 통합**: 실제 지도 렌더링
   - ✅ AS 상태별 마커 색상 구분:
     - 🟢 **초록색**: AS 완료 (수리 완료, 교체 완료 등)
     - 🟡 **노란색**: 점검/대기 중
     - 🔵 **파란색**: 기본 상태 (AS결과 없음, 보류/취소)
     - 🔴 **빨간색**: 미완료/문제 있음
   - ✅ 고객 목록에 AS결과 및 상태 아이콘 표시
   - ✅ 거리 단위 표시 (m/km 자동 변환)
   - ✅ 고객 상세 정보 패널
   - ✅ **Kakao Map 길 안내** (노란색 버튼)
   - ✅ **T Map 길 안내** (파란색 버튼)
   - ✅ 핀포인트 클릭 상세 정보
   - ✅ 접수일자 형식 개선 (YYYY-MM-DD)

5. **데이터 구조 (메모리 기반)**
   - ✅ Users: 사용자 계정 (하드코딩 15개 계정)
   - ✅ Customers: AS 접수 고객 정보, 위치 좌표, AS결과
   - ✅ PendingUsers: 회원가입 승인 대기 목록

### 구현 대기 중인 기능

1. **회원가입 승인 시스템**
   - 관리자 승인 페이지
   - SMS 발송 기능 실제 연동
   - 승인/반려 처리

2. **영구 데이터베이스 연결**
   - SQLite 또는 PostgreSQL 연결
   - 서버 재시작 후 데이터 보존

3. **고급 필터링**
   - AS결과별 필터링
   - 지역별 필터링
   - 날짜 범위 검색

4. **통계 대시보드**
   - AS 완료율 차트
   - 지역별 통계
   - 팀별 실적

## 📊 데이터 구조

### Customers (AS 접수현황)
```javascript
{
  id: INTEGER,              // 고유 ID
  sequence: INTEGER,        // 순번
  count: INTEGER,           // 횟수
  receipt_date: TEXT,       // 접수일자
  company: TEXT,            // 업체
  category: TEXT,           // 구분
  customer_name: TEXT,      // 고객명 (필수)
  phone: TEXT,              // 전화번호
  install_date: TEXT,       // 설치연,월
  heat_source: TEXT,        // 열원
  address: TEXT,            // 주소 (필수)
  as_content: TEXT,         // AS접수내용
  install_team: TEXT,       // 설치팀
  region: TEXT,             // 지역
  receptionist: TEXT,       // 접수자
  as_result: TEXT,          // AS결과 (마커 색상 결정)
  latitude: REAL,           // 위도
  longitude: REAL,          // 경도
  created_at: DATETIME,     // 생성일시
  updated_at: DATETIME      // 수정일시
}
```

## 🗺️ 길 안내 시스템

### Kakao Map 길 안내 (노란색 버튼)
- **모바일**: Kakao Navi 앱 → Kakao Map 웹 (폴백)
- **데스크톱**: Kakao Map 웹
- **URL 스킴**: `kakaonavi://navigate?destination=...`
- **웹 URL**: `https://map.kakao.com/link/to/...`

### T Map 길 안내 (파란색 버튼)
- **모바일**: T Map 앱 → T Map 웹 (폴백)
- **데스크톱**: T Map 웹
- **URL 스킴**: `tmap://route?goalname=...&goalx=...&goaly=...`
- **웹 URL**: `https://apis.openapi.sk.com/tmap/app/routes?...`
- **App Key**: `vSWmSa8CcO4uvyc0EsAg46SWvxNVAKzL8KGbckPB`

## 🗺️ T Map API 색상 매핑

| AS결과 키워드 | 마커 색상 | 아이콘 | 의미 |
|-------------|---------|-------|------|
| 완료, 수리, 교체 | 🟢 초록색 | fa-check-circle | AS 완료 |
| 점검, 대기, 예정 | 🟡 노란색 | fa-clock | 점검/대기 중 |
| 취소, 불가, 보류 | 🔵 파란색 | fa-circle | 보류/취소 |
| 기타 | 🔴 빨간색 | fa-exclamation-circle | 미완료/문제 |
| (없음) | 🔵 파란색 | fa-circle | 기본 상태 |

## 🗄️ 스토리지 서비스

- **메모리 기반**: 현재 서버 재시작 시 데이터 초기화
- **향후 계획**: SQLite 또는 PostgreSQL 연결

## 📖 사용자 가이드

### 1. 로그인
- **관리자 계정**: 
  - `admin` / `admin123`
  - `master1` / `master1`
  - `master2` / `master2`
  - `master3` / `master3`
- **사용자 계정**: 
  - `user` / `user123`
  - `test1` / `test1` ~ `test10` / `test10`
- **비밀번호 표시/숨김**: 👁️ 아이콘 클릭

### 2. 관리자 모드
1. **AS 접수현황 확인**: 대시보드에서 전체 고객 통계 및 목록 확인
2. **Excel 업로드**: 
   - "Excel 업로드" 버튼 클릭
   - Excel 파일 선택 (.xlsx 또는 .xls)
   - **템플릿 다운로드**: "AS접수현황_템플릿.xlsx 다운로드" 버튼 클릭
   - 파일명 및 데이터 수 확인
   - 검증 결과 확인 (유효/오류/중복)
   - 유효한 데이터만 업로드
3. **고객 삭제**: 체크박스 선택 후 "선택 삭제" 버튼 클릭

### 3. 사용자 모드
1. **T Map 보기**: AS 접수 고객 위치를 지도에서 확인
2. **상태 확인**: 마커 색상으로 AS 완료 여부 확인
3. **고객 상세**: 고객 항목 클릭하여 상세 정보 보기
4. **길찾기**: 
   - **Kakao Map에서 길 안내** (노란색 버튼)
   - **T Map에서 길 안내** (파란색 버튼)

### 4. Excel 파일 형식
Excel 파일의 첫 번째 행은 헤더여야 합니다:

| 순번 | 횟수 | 접수일자 | 업체 | 구분 | 고객명 | 전화번호 | 설치연,월 | 열원 | 주소 | AS접수내용 | 설치팀 | 지역 | 접수자 | AS결과 |
|------|------|---------|------|------|--------|----------|-----------|------|------|-----------|--------|------|--------|--------|
| 1 | 1 | 2024-01-15 | 서울지사 | AS | 김철수 | 010-1234-5678 | 2023-12 | 가스 | 서울특별시 강남구 테헤란로 123 | 온수 온도 조절 불량 | 1팀 | 강남 | 홍길동 | 수리 완료 |

**필수 항목**: 고객명, 주소  
**중요 항목**: AS결과 (마커 색상 결정)  
**선택 항목**: 나머지 모든 필드

**템플릿 파일**: 관리자 대시보드의 "Excel 업로드" 모달에서 템플릿 파일을 다운로드할 수 있습니다.

## 🚀 배포 상태

- **플랫폼**: Node.js + PM2
- **상태**: ✅ 활성
- **최종 업데이트**: 2026-01-08
- **안정 버전**: v1.0-stable-2026-01-08

## 🛠️ 개발 환경 설정

### 로컬 실행
```bash
# 1. 의존성 설치
npm install

# 2. 포트 정리
fuser -k 3000/tcp || true

# 3. 서버 시작 (PM2)
pm2 start ecosystem.config.cjs

# 4. 서비스 확인
curl http://localhost:3000/api/customers
```

### 유용한 명령어
```bash
# PM2 관리
pm2 list                    # 서비스 목록
pm2 logs webapp --nostream  # 로그 확인
pm2 restart webapp          # 재시작
pm2 delete webapp           # 중지 및 제거
pm2 status                  # 상태 확인

# Git
git status                  # 변경사항 확인
git add .                   # 모든 변경사항 스테이징
git commit -m "메시지"      # 커밋
git tag -l                  # 태그 목록
git checkout <태그명>       # 특정 태그로 이동

# 백업 복원
git checkout v1.0-stable-2026-01-08  # 안정 버전으로 복원
git reset --hard 8ff7d44             # 특정 커밋으로 복원
```

## 🔧 API 설정

### T Map API
- **App Key**: `vSWmSa8CcO4uvyc0EsAg46SWvxNVAKzL8KGbckPB`
- **API 문서**: https://openapi.sk.com/

### T Map API 기능:
1. **지도 렌더링**: JavaScript API로 지도 표시
2. **마커 표시**: AS 상태별 색상 구분
3. **Geocoding**: 주소 → 좌표 변환
4. **길찾기**: T Map 앱/웹 연동

### Kakao Map API
- **JavaScript Key**: `c933c69ba4e0228895438c6a8c327e74`
- **API 문서**: https://developers.kakao.com/

## 📝 API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입 (승인 대기)
- `GET /api/auth/pending` - 승인 대기 목록 (관리자 전용)

### 고객 관리 (AS 접수현황)
- `GET /api/customers` - 모든 고객 조회
- `GET /api/customers/:id` - 고객 상세 조회
- `POST /api/customers` - 고객 생성
- `PUT /api/customers/:id` - 고객 수정
- `DELETE /api/customers/:id` - 고객 삭제
- `POST /api/customers/batch-delete` - 고객 일괄 삭제
- `POST /api/customers/validate` - Excel 데이터 검증
- `POST /api/customers/batch-upload` - Excel 데이터 일괄 업로드

### 지오코딩 (T Map API)
- `POST /api/geocode` - 주소를 좌표로 변환

## 🎯 다음 개발 단계

1. ✅ T Map 실제 통합
2. ✅ AS 상태별 마커 색상 구분
3. ✅ 실시간 지도 마커 렌더링
4. ✅ 로그인 비밀번호 표시/숨김
5. ✅ T Map + Kakao Map 이중 길 안내
6. ✅ 거리 단위 표시 (m/km)
7. ✅ 접수일자 형식 개선
8. ⏳ 회원가입 승인 시스템 완성
9. ⏳ 영구 데이터베이스 연결 (SQLite/PostgreSQL)
10. ⏳ 고객 필터링 및 검색 (AS결과, 지역, 날짜)
11. ⏳ 클러스터링 (많은 고객 핀포인트 그룹화)
12. ⏳ 통계 대시보드 (AS 완료율, 지역별, 팀별)
13. ⏳ 방문 일정 관리
14. ⏳ 모바일 반응형 최적화
15. ⏳ 비밀번호 암호화 (bcrypt)
16. ⏳ JWT 토큰 인증

## 🐛 문제 해결

### T Map 지도가 표시되지 않는 경우
1. 브라우저 캐시 완전 삭제 (Ctrl + Shift + R)
2. 시크릿 모드로 접속
3. 개발자 도구 Console 탭에서 오류 확인
4. T Map API 키 확인

### 마커가 표시되지 않는 경우
1. 고객 데이터에 latitude, longitude 값 확인
2. AS결과 필드 확인 (마커 색상 결정)
3. 개발자 도구 Console 탭에서 "마커 표시" 로그 확인

### Excel 업로드가 실패하는 경우
1. 템플릿 파일 다운로드 후 형식 확인
2. 필수 필드 (고객명, 주소) 입력 확인
3. 파일명에 한글 포함 가능
4. 검증 결과에서 오류 메시지 확인

### 길 안내가 작동하지 않는 경우
1. **모바일**: 앱 설치 확인 (T Map, Kakao Navi)
2. **데스크톱**: 팝업 차단 해제
3. 고객 데이터에 위도/경도 확인
4. 개발자 도구 Console 탭에서 오류 확인

## 📄 라이센스

MIT License

## 👤 작성자

GenSpark AI - AS 접수현황 관리 시스템

---

**참고**: 
- 📦 **안정 버전 백업**: https://www.genspark.ai/api/files/s/AFNsi47e
- 🔖 **Git 태그**: v1.0-stable-2026-01-08
- 📌 **커밋 해시**: 8ff7d44
- T Map API는 이미 설정되어 있으며 정상 작동합니다.
- 데이터는 메모리 기반이므로 서버 재시작 시 초기화됩니다.
- 영구 데이터베이스 연결은 향후 추가될 예정입니다.
- 회원가입 승인 시스템은 개발 중입니다.
