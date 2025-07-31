# Reddit API 설정 가이드

## 개요
Reddit Content Platform에서 Reddit API를 사용하기 위한 설정 가이드입니다.

## 1. Reddit 개발자 계정 생성

### 1.1 Reddit 계정 준비
1. **Reddit 계정 생성** (없는 경우)
   - https://www.reddit.com 방문
   - "Sign Up" 클릭하여 계정 생성
   - 이메일 인증 완료

2. **계정 검증**
   - 이메일 주소 인증 필수
   - 계정 생성 후 최소 24시간 경과 권장

### 1.2 Reddit App 생성
1. **Reddit Apps 페이지 접속**
   - https://www.reddit.com/prefs/apps 방문
   - Reddit 계정으로 로그인

2. **새 앱 생성**
   - "Create App" 또는 "Create Another App" 클릭
   - 다음 정보 입력:

```
App Name: Reddit Content Platform
App Type: web app
Description: Content crawling and trend analysis platform
About URL: https://blog.reddit-trends.com/about
Redirect URI: https://admin.reddit-trends.com/auth/callback
```

3. **앱 생성 완료**
   - "Create app" 버튼 클릭
   - 생성된 앱 정보 확인

## 2. API 키 정보 수집

### 2.1 Client ID 및 Secret 확인
생성된 앱에서 다음 정보를 확인하세요:

```
Client ID: [앱 이름 아래 표시되는 문자열]
Client Secret: [secret 항목의 값]
```

### 2.2 User Agent 설정
Reddit API 사용 시 필수인 User Agent 문자열:
```
User-Agent: RedditContentPlatform/1.0 by YourUsername
```

## 3. API 권한 및 제한사항

### 3.1 API 사용 제한
- **요청 제한**: 60 requests per minute
- **OAuth 제한**: 600 requests per 10 minutes
- **User Agent 필수**: 모든 요청에 포함 필요

### 3.2 필요한 권한 (Scopes)
```
read: 포스트 및 댓글 읽기
identity: 사용자 정보 접근
```

### 3.3 준수사항
- Reddit API Terms of Service 준수
- 과도한 요청 방지
- 사용자 데이터 보호
- 적절한 에러 처리

## 4. 환경변수 설정

### 4.1 .env.production 파일 업데이트
```bash
# Reddit API Configuration
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USER_AGENT=RedditContentPlatform/1.0 by YourUsername
```

### 4.2 Railway 환경변수 설정
```bash
# Railway CLI로 환경변수 설정
railway variables set REDDIT_CLIENT_ID=your_client_id_here
railway variables set REDDIT_CLIENT_SECRET=your_client_secret_here
railway variables set REDDIT_USER_AGENT="RedditContentPlatform/1.0 by YourUsername"
```

### 4.3 Vercel 환경변수 설정
```bash
# 관리자 대시보드
cd admin-dashboard
vercel env add VITE_REDDIT_CLIENT_ID
# 값 입력: your_client_id_here

# 공개 블로그 (필요한 경우)
cd public-blog
vercel env add VITE_REDDIT_CLIENT_ID
# 값 입력: your_client_id_here
```

## 5. API 테스트

### 5.1 기본 연결 테스트
```python
import requests

# 기본 API 테스트
headers = {
    'User-Agent': 'RedditContentPlatform/1.0 by YourUsername'
}

response = requests.get(
    'https://www.reddit.com/r/python/hot.json?limit=5',
    headers=headers
)

if response.status_code == 200:
    print("Reddit API 연결 성공!")
    data = response.json()
    print(f"포스트 수: {len(data['data']['children'])}")
else:
    print(f"API 연결 실패: {response.status_code}")
```

### 5.2 OAuth 인증 테스트
```python
import requests
import base64

# OAuth 토큰 획득
client_id = "your_client_id"
client_secret = "your_client_secret"

# Basic Auth 헤더 생성
auth_string = f"{client_id}:{client_secret}"
auth_bytes = auth_string.encode('ascii')
auth_b64 = base64.b64encode(auth_bytes).decode('ascii')

headers = {
    'Authorization': f'Basic {auth_b64}',
    'User-Agent': 'RedditContentPlatform/1.0 by YourUsername'
}

data = {
    'grant_type': 'client_credentials'
}

response = requests.post(
    'https://www.reddit.com/api/v1/access_token',
    headers=headers,
    data=data
)

if response.status_code == 200:
    token_data = response.json()
    print("OAuth 인증 성공!")
    print(f"Access Token: {token_data['access_token'][:20]}...")
else:
    print(f"OAuth 인증 실패: {response.status_code}")
```

## 6. 보안 고려사항

### 6.1 API 키 보안
- **절대 공개하지 말 것**: GitHub, 문서 등에 노출 금지
- **환경변수 사용**: 코드에 하드코딩 금지
- **정기적 갱신**: 보안을 위해 주기적으로 키 재생성
- **접근 제한**: 필요한 권한만 요청

### 6.2 Rate Limiting 준수
```python
import time
from datetime import datetime, timedelta

class RedditRateLimiter:
    def __init__(self):
        self.requests = []
        self.max_requests = 60
        self.time_window = 60  # seconds
    
    def can_make_request(self):
        now = datetime.now()
        # 1분 이전 요청들 제거
        self.requests = [req_time for req_time in self.requests 
                        if now - req_time < timedelta(seconds=self.time_window)]
        
        return len(self.requests) < self.max_requests
    
    def record_request(self):
        self.requests.append(datetime.now())
```

## 7. 문제 해결

### 7.1 일반적인 오류들

#### 401 Unauthorized
- **원인**: 잘못된 Client ID/Secret
- **해결**: API 키 재확인, 환경변수 설정 확인

#### 403 Forbidden
- **원인**: User-Agent 누락 또는 잘못된 형식
- **해결**: User-Agent 헤더 추가 및 형식 확인

#### 429 Too Many Requests
- **원인**: Rate limit 초과
- **해결**: 요청 간격 조정, Rate limiter 구현

#### 404 Not Found
- **원인**: 잘못된 엔드포인트 또는 존재하지 않는 리소스
- **해결**: API 엔드포인트 확인, 리소스 존재 여부 확인

### 7.2 디버깅 팁
```python
import logging

# 로깅 설정
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# API 요청 로깅
def make_reddit_request(url, headers):
    logger.debug(f"Making request to: {url}")
    logger.debug(f"Headers: {headers}")
    
    response = requests.get(url, headers=headers)
    
    logger.debug(f"Response status: {response.status_code}")
    logger.debug(f"Response headers: {dict(response.headers)}")
    
    return response
```

## 8. 프로덕션 배포 체크리스트

### 배포 전 확인사항
- [ ] Reddit 개발자 계정 생성 완료
- [ ] Reddit App 생성 및 설정 완료
- [ ] Client ID 및 Secret 확보
- [ ] User-Agent 문자열 설정
- [ ] API 연결 테스트 성공
- [ ] OAuth 인증 테스트 성공
- [ ] Rate Limiting 구현 완료
- [ ] 환경변수 설정 완료
- [ ] 보안 검토 완료

### 배포 후 확인사항
- [ ] 프로덕션 환경에서 API 연결 확인
- [ ] 크롤링 기능 정상 작동 확인
- [ ] Rate Limiting 정상 작동 확인
- [ ] 에러 로깅 및 모니터링 설정 확인

## 9. 지원 및 문서

### Reddit API 문서
- **공식 문서**: https://www.reddit.com/dev/api/
- **OAuth 가이드**: https://github.com/reddit-archive/reddit/wiki/OAuth2
- **API 규칙**: https://www.reddit.com/wiki/api

### 커뮤니티 지원
- **r/redditdev**: Reddit API 개발자 커뮤니티
- **GitHub Issues**: 관련 라이브러리 이슈 트래킹

이 가이드를 따라 설정하면 Reddit API를 안전하고 효율적으로 사용할 수 있습니다.