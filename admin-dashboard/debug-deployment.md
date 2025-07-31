# 🔧 프론트엔드 배포 문제 해결 가이드

## 현재 상황
- **빌드**: ✅ 성공
- **배포**: ✅ 성공 (Vercel)
- **런타임**: ❌ "Something went wrong" 에러

## 최신 배포 URL
- **관리자 대시보드**: https://admin-dashboard-1cedqpp02-frank-chas-projects.vercel.app
- **테스트 페이지**: https://admin-dashboard-1cedqpp02-frank-chas-projects.vercel.app/test
- **백엔드 API**: https://redis-production-3a49.up.railway.app

## 해결 단계

### 1단계: 테스트 페이지 확인
먼저 `/test` 경로로 접속하여 기본적인 React 앱이 로드되는지 확인:
- URL: https://admin-dashboard-1cedqpp02-frank-chas-projects.vercel.app/test

### 2단계: 브라우저 개발자 도구 확인
1. F12를 눌러 개발자 도구 열기
2. Console 탭에서 에러 메시지 확인
3. Network 탭에서 실패한 요청 확인
4. Sources 탭에서 소스맵 확인

### 3단계: 환경변수 확인
테스트 페이지에서 다음 환경변수들이 올바르게 설정되었는지 확인:
- VITE_API_BASE_URL
- VITE_NODE_ENV
- VITE_REDDIT_CLIENT_ID

### 4단계: API 연결 테스트
백엔드 API가 정상 작동하는지 확인:
```bash
curl https://redis-production-3a49.up.railway.app/health
```

### 5단계: 컴포넌트별 테스트
각 페이지를 개별적으로 테스트:
- `/auth/login` - 로그인 페이지
- `/admin/dashboard` - 대시보드 페이지

## 일반적인 문제들과 해결방안

### 문제 1: 환경변수 누락
**증상**: API 호출 실패, undefined 값들
**해결**: .env.production 파일 확인 및 Vercel 환경변수 설정

### 문제 2: 컴포넌트 import 에러
**증상**: "Module not found" 에러
**해결**: import 경로 확인 및 파일 존재 여부 확인

### 문제 3: React Query 설정 문제
**증상**: "No QueryClient set" 에러
**해결**: QueryProvider 설정 확인

### 문제 4: 라우팅 문제
**증상**: 404 에러 또는 빈 페이지
**해결**: React Router 설정 및 Vercel rewrites 확인

## 디버깅 도구

### 로컬 테스트
```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드 테스트
npm run build
npx serve dist -s -p 3000
```

### 브라우저 테스트
1. 시크릿 모드에서 테스트 (캐시 문제 배제)
2. 다른 브라우저에서 테스트
3. 모바일 브라우저에서 테스트

## 다음 단계

1. **즉시 확인**: 테스트 페이지 접속
2. **에러 분석**: 브라우저 콘솔 확인
3. **단계별 수정**: 발견된 문제들 하나씩 해결
4. **재배포**: 수정 후 다시 배포

## 연락처
문제가 지속되면 구체적인 에러 메시지와 함께 문의해주세요.