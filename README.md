# 고객관리 시스템 (Customer Management System)

쿠팡플렉스와 유사한 지도 기반 고객관리 웹 애플리케이션

## 🌐 공개 URL

**웹 애플리케이션**: https://3000-irn3f4j2vutvnwvbf7bwh-cc2fbc16.sandbox.novita.ai

## 📋 프로젝트 개요

- **이름**: 고객관리 시스템
- **목표**: 지도 기반으로 고객 정보를 시각화하고 관리하는 웹 애플리케이션
- **기술 스택**: Hono + Cloudflare D1 + TailwindCSS + Vite

## ✨ 주요 기능

### 완료된 기능

1. **사용자 인증 시스템**
   - 관리자 모드 (admin/admin123)
   - 사용자 모드 (user/user123)
   - 세션 관리

2. **관리자 대시보드**
   - 고객 통계 (전체 고객, 위치 등록, 오늘 등록)
   - 고객 목록 테이블
   - CSV 파일 업로드
   - 데이터 검증 및 미리보기
   - 고객 일괄 삭제
   - 중복/오류 데이터 감지

3. **CSV 데이터 업로드**
   - 파일 검증 (필수 필드, 형식 체크)
   - 중복 데이터 감지 (DB 및 파일 내)
   - 업로드 전 미리보기
   - 유효한 데이터만 선택적 업로드
   - 자동 지오코딩 (주소 → 좌표 변환)

4. **사용자 지도 뷰**
   - 고객 목록 표시
   - 고객 상세 정보 패널
   - 네이버 지도 길찾기 연동
   - 핀포인트 클릭 상세 정보

5. **데이터베이스 구조**
   - Users 테이블 (사용자 계정)
   - Customers 테이블 (고객 정보, 위치 좌표)
   - Upload Sessions 테이블 (업로드 이력)

### 구현 대기 중인 기능

1. **네이버 맵 API 통합**
   - 실제 지도 렌더링
   - 마커/핀포인트 표시
   - 실시간 지오코딩
   - 길찾기 API 통합

## 📊 데이터 구조

### Users 테이블
```sql
- id: INTEGER (PK)
- username: TEXT (UNIQUE)
- password: TEXT
- role: TEXT ('admin' | 'user')
- name: TEXT
- created_at: DATETIME
```

### Customers 테이블
```sql
- id: INTEGER (PK)
- customer_name: TEXT
- phone: TEXT
- email: TEXT
- address: TEXT
- address_detail: TEXT
- latitude: REAL
- longitude: REAL
- memo: TEXT
- created_by: INTEGER (FK → users.id)
- created_at: DATETIME
- updated_at: DATETIME
```

## 🗄️ 스토리지 서비스

- **Cloudflare D1**: SQLite 기반 관계형 데이터베이스
- **로컬 개발**: `.wrangler/state/v3/d1` 디렉토리에 로컬 SQLite DB

## 📖 사용자 가이드

### 1. 로그인
- 관리자 계정: `admin` / `admin123`
- 사용자 계정: `user` / `user123`

### 2. 관리자 모드
1. **고객 목록 확인**: 대시보드에서 전체 고객 통계 및 목록 확인
2. **CSV 업로드**: 
   - "CSV 업로드" 버튼 클릭
   - CSV 파일 선택 (형식: customer_name, phone, email, address, address_detail, memo)
   - 검증 결과 확인 (유효/오류/중복)
   - 유효한 데이터만 업로드
3. **고객 삭제**: 체크박스 선택 후 "선택 삭제" 버튼 클릭

### 3. 사용자 모드
1. **지도 보기**: 고객 위치를 지도에서 확인
2. **고객 상세**: 고객 항목 클릭하여 상세 정보 보기
3. **길찾기**: 상세 패널에서 "길찾기" 버튼으로 네이버 지도 연결

### 4. CSV 파일 형식
```csv
customer_name,phone,email,address,address_detail,memo
김철수,010-1234-5678,kim@example.com,서울특별시 강남구 테헤란로 123,456호,중요 고객
이영희,010-2345-6789,lee@example.com,서울특별시 서초구 서초대로 45,101호,정기 방문
```

## 🚀 배포 상태

- **플랫폼**: Cloudflare Pages
- **상태**: ✅ 로컬 개발 환경 활성
- **마지막 업데이트**: 2025-12-27

## 🛠️ 개발 환경 설정

### 로컬 실행
```bash
# 1. 의존성 설치
npm install

# 2. 데이터베이스 마이그레이션
npm run db:migrate:local

# 3. 테스트 데이터 시드
npm run db:seed

# 4. 빌드
npm run build

# 5. 포트 정리
npm run clean-port

# 6. 개발 서버 시작 (PM2)
pm2 start ecosystem.config.cjs

# 7. 서비스 확인
npm test
```

### 유용한 명령어
```bash
# PM2 관리
pm2 list                    # 서비스 목록
pm2 logs webapp --nostream  # 로그 확인
pm2 restart webapp          # 재시작
pm2 delete webapp           # 중지 및 제거

# 데이터베이스 관리
npm run db:reset            # DB 초기화 및 재시드
npm run db:console:local    # 로컬 DB 콘솔

# Git
git status                  # 변경사항 확인
git add .                   # 모든 변경사항 스테이징
git commit -m "메시지"      # 커밋
```

## 🔧 네이버 맵 API 설정 (필요시)

실제 지도 기능을 사용하려면 네이버 클라우드 플랫폼에서 API 키를 발급받아야 합니다:

### 간단 설정 가이드:

1. **[네이버 클라우드 플랫폼](https://www.ncloud.com/)** 회원가입
2. **Console** → **Services** → **Maps** → **API 인증 정보 생성**
3. **Client ID**와 **Client Secret** 발급
4. **프로젝트 루트**에 `.dev.vars` 파일 수정:

```env
NAVER_MAP_CLIENT_ID=t29b9q2500
NAVER_MAP_CLIENT_SECRET=fksVF6vd13oPBjDsCGVutacgfFjOsy7AIRTtSJsn
```

5. `src/index.tsx` 파일의 네이버 맵 스크립트 URL 수정:
```html
<!-- YOUR_CLIENT_ID를 발급받은 Client ID로 교체 -->
<script type="text/javascript" src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=YOUR_CLIENT_ID"></script>
```

6. 서비스 재시작:
```bash
npm run build
pm2 restart webapp
```

### 📖 상세 설정 가이드

네이버 맵 API 설정에 대한 자세한 내용은 **[NAVER_MAP_SETUP.md](./NAVER_MAP_SETUP.md)** 파일을 참고하세요:
- 단계별 API 키 발급 방법
- 프로젝트 설정 방법
- 테스트 방법
- 지도 렌더링 코드
- 문제 해결 가이드

## 📝 API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인

### 고객 관리
- `GET /api/customers` - 모든 고객 조회
- `GET /api/customers/:id` - 고객 상세 조회
- `POST /api/customers` - 고객 생성
- `PUT /api/customers/:id` - 고객 수정
- `DELETE /api/customers/:id` - 고객 삭제
- `POST /api/customers/batch-delete` - 고객 일괄 삭제
- `POST /api/customers/validate` - CSV 데이터 검증
- `POST /api/customers/batch-upload` - CSV 데이터 일괄 업로드

### 지오코딩
- `POST /api/geocode` - 주소를 좌표로 변환

## 🎯 다음 개발 단계

1. 네이버 맵 API 실제 통합
2. 실시간 지도 마커 렌더링
3. 클러스터링 (많은 고객 핀포인트 그룹화)
4. 고객 필터링 및 검색
5. 방문 일정 관리
6. 모바일 반응형 최적화
7. 비밀번호 암호화 (bcrypt)
8. JWT 토큰 인증

## 📄 라이센스

MIT License

## 👤 작성자

GenSpark AI - Customer Management System

---

**참고**: 현재 네이버 맵 API는 플레이스홀더로 구현되어 있습니다. 실제 지도 기능을 사용하려면 네이버 클라우드 플랫폼에서 API 키를 발급받아 설정해주세요.
