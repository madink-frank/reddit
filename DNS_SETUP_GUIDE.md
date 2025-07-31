# DNS 및 도메인 설정 가이드

## 개요
Reddit Content Platform의 프로덕션 배포를 위한 도메인 및 DNS 설정 가이드입니다.

## 권장 도메인 구조

```
reddit-trends.com (메인 도메인)
├── api.reddit-trends.com (백엔드 API)
├── admin.reddit-trends.com (관리자 대시보드)
├── blog.reddit-trends.com (공개 블로그)
└── www.reddit-trends.com (메인 사이트 리다이렉트)
```

## 1. 도메인 구매

### 추천 도메인 등록업체
- **Namecheap** (가성비 좋음)
- **Google Domains** (Google 서비스 통합)
- **Cloudflare Registrar** (보안 및 성능)
- **GoDaddy** (널리 사용됨)

### 도메인 선택 기준
- 기억하기 쉬운 이름
- .com 확장자 우선
- 브랜드와 일치하는 이름
- SEO 친화적

## 2. DNS 설정

### 2.1 Cloudflare DNS 설정 (권장)

#### Cloudflare 설정 단계
1. **Cloudflare 계정 생성**
2. **도메인 추가**
3. **네임서버 변경**
4. **DNS 레코드 설정**

#### DNS 레코드 설정
```
# A 레코드 (IPv4)
Type: A
Name: @
Content: [Railway IP 주소]
TTL: Auto
Proxy: Enabled

# CNAME 레코드들
Type: CNAME
Name: api
Content: [Railway 도메인]
TTL: Auto
Proxy: Enabled

Type: CNAME
Name: admin
Content: [Vercel 도메인]
TTL: Auto
Proxy: Enabled

Type: CNAME
Name: blog
Content: [Vercel 도메인]
TTL: Auto
Proxy: Enabled

Type: CNAME
Name: www
Content: reddit-trends.com
TTL: Auto
Proxy: Enabled
```

### 2.2 Railway 도메인 설정

#### Railway에서 커스텀 도메인 추가
1. Railway 대시보드 접속
2. 프로젝트 선택
3. Settings → Domains
4. "Add Domain" 클릭
5. `api.reddit-trends.com` 입력
6. DNS 설정 확인

#### Railway 도메인 설정 명령어
```bash
# Railway CLI로 도메인 추가
railway domain add api.reddit-trends.com

# 도메인 상태 확인
railway domain list
```

### 2.3 Vercel 도메인 설정

#### 관리자 대시보드 도메인 설정
```bash
cd admin-dashboard
vercel domains add admin.reddit-trends.com
vercel domains verify admin.reddit-trends.com
```

#### 공개 블로그 도메인 설정
```bash
cd public-blog
vercel domains add blog.reddit-trends.com
vercel domains verify blog.reddit-trends.com
```

## 3. SSL 인증서 설정

### 3.1 Cloudflare SSL 설정
1. **SSL/TLS 탭 이동**
2. **Encryption Mode**: Full (strict)
3. **Always Use HTTPS**: On
4. **HTTP Strict Transport Security (HSTS)**: Enable
5. **Minimum TLS Version**: 1.2

### 3.2 Railway SSL 설정
- Railway는 자동으로 Let's Encrypt SSL 인증서 제공
- 커스텀 도메인 추가 시 자동 설정

### 3.3 Vercel SSL 설정
- Vercel은 자동으로 SSL 인증서 제공
- 도메인 추가 시 자동 설정

## 4. 보안 설정

### 4.1 Cloudflare 보안 설정
```
Security Level: Medium
Challenge Passage: 30 minutes
Browser Integrity Check: On
Privacy Pass Support: On
```

### 4.2 WAF (Web Application Firewall) 규칙
```
# SQL Injection 방지
(http.request.uri.query contains "union select") or 
(http.request.uri.query contains "drop table")

# XSS 방지
(http.request.uri.query contains "<script>") or 
(http.request.uri.query contains "javascript:")

# 관리자 페이지 보호
(http.host eq "admin.reddit-trends.com" and 
 not ip.src in {[허용된 IP 목록]})
```

### 4.3 Rate Limiting 설정
```
# API 엔드포인트 보호
api.reddit-trends.com/api/*
- 100 requests per minute per IP
- 1000 requests per hour per IP

# 관리자 로그인 보호
admin.reddit-trends.com/auth/*
- 10 requests per minute per IP
```

## 5. 성능 최적화

### 5.1 Cloudflare 성능 설정
```
Caching Level: Standard
Browser Cache TTL: 4 hours
Always Online: On
Development Mode: Off (프로덕션에서)
```

### 5.2 Page Rules 설정
```
# 정적 자산 캐싱
*.reddit-trends.com/assets/*
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 1 month

# API 캐싱 제외
api.reddit-trends.com/api/*
- Cache Level: Bypass
```

## 6. 모니터링 설정

### 6.1 Cloudflare Analytics
- Web Analytics 활성화
- Real User Monitoring (RUM) 설정
- Security Events 모니터링

### 6.2 DNS 모니터링
```bash
# DNS 전파 확인
dig api.reddit-trends.com
dig admin.reddit-trends.com
dig blog.reddit-trends.com

# SSL 인증서 확인
openssl s_client -connect api.reddit-trends.com:443 -servername api.reddit-trends.com
```

## 7. 배포 후 검증

### 7.1 도메인 접근성 테스트
```bash
# 각 서비스 접근 테스트
curl -I https://api.reddit-trends.com/health
curl -I https://admin.reddit-trends.com
curl -I https://blog.reddit-trends.com

# SSL 등급 확인
# https://www.ssllabs.com/ssltest/ 에서 테스트
```

### 7.2 DNS 전파 확인
```bash
# 전 세계 DNS 전파 상태 확인
# https://www.whatsmydns.net/ 사용

# 로컬 DNS 캐시 클리어 (필요시)
# Windows: ipconfig /flushdns
# macOS: sudo dscacheutil -flushcache
# Linux: sudo systemctl restart systemd-resolved
```

## 8. 백업 및 복구

### 8.1 DNS 설정 백업
```json
{
  "domain": "reddit-trends.com",
  "records": [
    {
      "type": "A",
      "name": "@",
      "content": "[Railway IP]",
      "ttl": 300
    },
    {
      "type": "CNAME",
      "name": "api",
      "content": "[Railway domain]",
      "ttl": 300
    },
    {
      "type": "CNAME",
      "name": "admin",
      "content": "[Vercel domain]",
      "ttl": 300
    },
    {
      "type": "CNAME",
      "name": "blog",
      "content": "[Vercel domain]",
      "ttl": 300
    }
  ]
}
```

### 8.2 장애 복구 계획
1. **DNS 장애 시**: 백업 DNS 서버 활용
2. **SSL 인증서 만료**: 자동 갱신 확인
3. **도메인 만료**: 자동 갱신 설정
4. **CDN 장애**: 직접 서버 접근 경로 준비

## 9. 비용 최적화

### 9.1 Cloudflare 요금제
- **Free**: 기본 기능 (소규모 서비스)
- **Pro ($20/월)**: 고급 보안 및 성능
- **Business ($200/월)**: 기업용 기능

### 9.2 도메인 갱신 비용
- .com 도메인: 연간 $10-15
- 프라이버시 보호: 연간 $5-10
- SSL 인증서: 무료 (Let's Encrypt)

## 10. 체크리스트

### 배포 전 확인사항
- [ ] 도메인 구매 완료
- [ ] DNS 설정 완료
- [ ] SSL 인증서 설정 완료
- [ ] 보안 설정 완료
- [ ] 성능 최적화 설정 완료

### 배포 후 확인사항
- [ ] 모든 도메인 접근 가능
- [ ] SSL 인증서 정상 작동
- [ ] DNS 전파 완료
- [ ] 성능 테스트 통과
- [ ] 보안 테스트 통과

## 11. 문제 해결

### 일반적인 문제들

#### DNS 전파 지연
- **증상**: 도메인이 일부 지역에서 접근 불가
- **해결**: 24-48시간 대기, TTL 값 확인

#### SSL 인증서 오류
- **증상**: "Not Secure" 경고, 인증서 오류
- **해결**: 도메인 검증 완료, DNS 설정 확인

#### 리다이렉트 루프
- **증상**: "Too many redirects" 오류
- **해결**: Cloudflare SSL 모드 확인, 서버 설정 점검

## 연락처 및 지원

### 기술 지원
- **Cloudflare 지원**: https://support.cloudflare.com
- **Railway 지원**: https://railway.app/help
- **Vercel 지원**: https://vercel.com/support

### 긴급 연락처
- DNS 관리자: [연락처]
- 시스템 관리자: [연락처]
- 도메인 등록업체: [연락처]

이 가이드를 따라 설정하면 안전하고 성능이 우수한 도메인 환경을 구축할 수 있습니다.