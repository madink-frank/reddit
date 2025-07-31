# 외부 서비스 설정 가이드

## 개요
Reddit Content Platform 프로덕션 배포에 필요한 모든 외부 서비스 설정 가이드입니다.

## 1. 도메인 구매

### 1.1 추천 도메인 등록업체
- **Namecheap** (가성비 좋음): https://www.namecheap.com
- **Google Domains**: https://domains.google.com
- **Cloudflare Registrar**: https://www.cloudflare.com/products/registrar/

### 1.2 도메인 구매 절차
1. **도메인 검색**: `reddit-trends.com` 또는 유사한 이름
2. **가격 비교**: 연간 $10-15 예상
3. **개인정보 보호**: Privacy Protection 추가 권장
4. **자동 갱신**: 설정하여 만료 방지

### 1.3 구매 후 설정
```
도메인: reddit-trends.com
네임서버: Cloudflare로 변경 (권장)
개인정보 보호: 활성화
자동 갱신: 활성화
```

## 2. Cloudflare 설정

### 2.1 Cloudflare 계정 생성
1. **계정 생성**: https://www.cloudflare.com
2. **도메인 추가**: "Add a Site" 클릭
3. **플랜 선택**: Free 플랜으로 시작 가능
4. **네임서버 변경**: 도메인 등록업체에서 네임서버 변경

### 2.2 DNS 설정
```
Type: A
Name: @
Content: [Railway에서 제공하는 IP]
Proxy: Enabled

Type: CNAME
Name: api
Content: [Railway 도메인]
Proxy: Enabled

Type: CNAME
Name: admin
Content: [Vercel 도메인]
Proxy: Enabled

Type: CNAME
Name: blog
Content: [Vercel 도메인]
Proxy: Enabled
```

## 3. Google Analytics 설정

### 3.1 Google Analytics 4 계정 생성
1. **Google Analytics 접속**: https://analytics.google.com
2. **계정 생성**: "Start measuring" 클릭
3. **속성 설정**:
   ```
   Property Name: Reddit Trends Blog
   Reporting Time Zone: Asia/Seoul
   Currency: Korean Won
   ```

### 3.2 데이터 스트림 설정
1. **웹 스트림 추가**
2. **웹사이트 URL**: https://blog.reddit-trends.com
3. **스트림 이름**: Reddit Trends Blog
4. **측정 ID 복사**: G-XXXXXXXXXX 형태

### 3.3 환경변수 설정
```bash
# .env.production에 추가
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

## 4. Sentry 설정 (에러 추적)

### 4.1 Sentry 계정 생성
1. **Sentry 접속**: https://sentry.io
2. **계정 생성**: GitHub 계정으로 로그인 가능
3. **조직 생성**: Reddit Content Platform

### 4.2 프로젝트 생성
1. **새 프로젝트 생성**
2. **플랫폼 선택**: 
   - Python (백엔드용)
   - React (프론트엔드용)
3. **프로젝트 이름**: reddit-content-platform

### 4.3 DSN 설정
```bash
# 백엔드용 DSN
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id

# 프론트엔드용 DSN
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
```

## 5. Railway 설정

### 5.1 Railway 계정 생성
1. **Railway 접속**: https://railway.app
2. **GitHub 계정으로 로그인**
3. **새 프로젝트 생성**: "New Project" 클릭

### 5.2 데이터베이스 추가
1. **PostgreSQL 추가**: "Add PostgreSQL" 클릭
2. **Redis 추가**: "Add Redis" 클릭
3. **연결 정보 확인**: Variables 탭에서 확인

### 5.3 환경변수 설정
```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 환경변수 설정
railway variables set NODE_ENV=production
railway variables set REDDIT_CLIENT_ID=your_client_id
railway variables set REDDIT_CLIENT_SECRET=your_client_secret
```

## 6. Vercel 설정

### 6.1 Vercel 계정 생성
1. **Vercel 접속**: https://vercel.com
2. **GitHub 계정으로 로그인**
3. **팀 생성** (선택사항)

### 6.2 프로젝트 배포
```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 관리자 대시보드 배포
cd admin-dashboard
vercel

# 공개 블로그 배포
cd public-blog
vercel
```

## 7. 이메일 서비스 설정 (선택사항)

### 7.1 Gmail SMTP 설정
1. **Google 계정 설정**
2. **2단계 인증 활성화**
3. **앱 비밀번호 생성**:
   - Google 계정 → 보안 → 앱 비밀번호
   - "메일" 선택하여 비밀번호 생성

### 7.2 환경변수 설정
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@reddit-trends.com
```

## 8. 소셜 미디어 계정 생성

### 8.1 Twitter 계정
1. **계정 생성**: @reddittrends
2. **프로필 설정**: 서비스 소개 및 링크
3. **API 키 발급** (필요시)

### 8.2 기타 소셜 미디어
- **Facebook 페이지**: reddittrends
- **LinkedIn 페이지**: reddit-trends
- **Instagram**: @reddittrends (선택사항)

## 9. 비용 계산

### 9.1 필수 서비스 비용 (월간)
```
도메인: $1-2/월
Cloudflare: $0 (Free 플랜)
Railway: $20-50/월 (사용량에 따라)
Vercel: $0-20/월 (Pro 플랜 시)
Google Analytics: $0 (무료)
Sentry: $0-26/월 (사용량에 따라)

총 예상 비용: $21-98/월
```

### 9.2 선택적 서비스 비용
```
Cloudflare Pro: $20/월
Gmail Workspace: $6/월
소셜 미디어 광고: $50-200/월

추가 비용: $76-226/월
```

## 10. 설정 완료 체크리스트

### 10.1 필수 서비스
- [ ] 도메인 구매 완료
- [ ] Cloudflare 설정 완료
- [ ] Google Analytics 설정 완료
- [ ] Sentry 계정 생성 완료
- [ ] Railway 프로젝트 생성 완료
- [ ] Vercel 계정 생성 완료
- [ ] Reddit API 키 발급 완료

### 10.2 환경변수 설정
- [ ] .env.production 파일 업데이트 완료
- [ ] Railway 환경변수 설정 완료
- [ ] Vercel 환경변수 설정 완료
- [ ] 모든 API 키 및 시크릿 설정 완료

### 10.3 보안 설정
- [ ] 강력한 비밀번호 사용
- [ ] 2단계 인증 활성화
- [ ] API 키 보안 저장
- [ ] 접근 권한 최소화

## 11. 다음 단계

모든 외부 서비스 설정이 완료되면:

1. **환경변수 최종 확인**
2. **연결 테스트 실행**
3. **Phase 2 (인프라 배포) 진행**

## 12. 지원 및 문서

### 서비스별 지원 페이지
- **Cloudflare**: https://support.cloudflare.com
- **Railway**: https://railway.app/help
- **Vercel**: https://vercel.com/support
- **Google Analytics**: https://support.google.com/analytics
- **Sentry**: https://sentry.io/support/

### 긴급 연락처
각 서비스의 지원팀 연락처를 미리 저장해두세요.

이 가이드를 따라 모든 외부 서비스를 설정하면 프로덕션 배포 준비가 완료됩니다.