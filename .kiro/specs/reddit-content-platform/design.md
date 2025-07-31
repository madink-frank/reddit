# Design Document

## Overview

Reddit 콘텐츠 크롤링 및 트렌드 분석 플랫폼은 마이크로서비스 아키텍처를 기반으로 한 확장 가능한 시스템입니다. FastAPI를 사용한 RESTful API 서버, Celery를 통한 비동기 작업 처리, PostgreSQL과 Redis를 활용한 데이터 저장 및 캐싱으로 구성됩니다.

## Architecture

### 기술 스택

**Backend**
- FastAPI (v1) + Pydantic + Uvicorn
- Python 3.11+
- SQLAlchemy (ORM)
- Alembic (Database Migration)

**Worker & Queue**
- Celery + RabbitMQ + Redis
- Celery Beat (스케줄링)

**Database**
- PostgreSQL (Primary Database)
- Redis (Cache/Queue/Session)

**Authentication**
- OAuth2 + JWT + Token Refresh
- Reddit API Integration

**Monitoring & Observability**
- Prometheus + Grafana
- Custom metrics collection
- Health check endpoints

**CI/CD & Documentation**
- GitHub Actions (Lint→Test→Build→Deploy)
- Swagger/OpenAPI 자동 생성
- Postman Collection

**Deployment**
- Railway.com (Backend API & Database)
- Vercel/Netlify (Frontend)
- Docker containerization

### 시스템 컴포넌트

```mermaid
graph TB
    subgraph "Client Layer"
        UI[Web UI]
        API_CLIENT[API Client]
    end
    
    subgraph "API Gateway"
        FASTAPI[FastAPI Server]
        AUTH[Authentication Middleware]
        RATE_LIMIT[Rate Limiting]
    end
    
    subgraph "Business Logic"
        USER_SERVICE[User Service]
        KEYWORD_SERVICE[Keyword Service]
        CRAWL_SERVICE[Crawling Service]
        CONTENT_SERVICE[Content Service]
        ANALYTICS_SERVICE[Analytics Service]
    end
    
    subgraph "Background Workers"
        CELERY[Celery Workers]
        SCHEDULER[Celery Beat]
        REDDIT_CRAWLER[Reddit Crawler]
        CONTENT_GENERATOR[Content Generator]
    end
    
    subgraph "Data Layer"
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis)]
        CACHE[Cache Layer]
    end
    
    subgraph "External Services"
        REDDIT_API[Reddit API]
        OAUTH[Reddit OAuth2]
    end
    
    subgraph "Monitoring"
        PROMETHEUS[Prometheus]
        GRAFANA[Grafana]
        LOGS[Logging System]
    end
    
    UI --> FASTAPI
    API_CLIENT --> FASTAPI
    FASTAPI --> AUTH
    AUTH --> USER_SERVICE
    FASTAPI --> KEYWORD_SERVICE
    FASTAPI --> CRAWL_SERVICE
    FASTAPI --> CONTENT_SERVICE
    FASTAPI --> ANALYTICS_SERVICE
    
    CRAWL_SERVICE --> CELERY
    CONTENT_SERVICE --> CELERY
    SCHEDULER --> CELERY
    
    CELERY --> REDDIT_CRAWLER
    CELERY --> CONTENT_GENERATOR
    REDDIT_CRAWLER --> REDDIT_API
    
    USER_SERVICE --> POSTGRES
    KEYWORD_SERVICE --> POSTGRES
    CRAWL_SERVICE --> POSTGRES
    CONTENT_SERVICE --> POSTGRES
    ANALYTICS_SERVICE --> POSTGRES
    
    ANALYTICS_SERVICE --> REDIS
    AUTH --> REDIS
    CACHE --> REDIS
    
    AUTH --> OAUTH
    
    FASTAPI --> PROMETHEUS
    CELERY --> PROMETHEUS
    PROMETHEUS --> GRAFANA
```

## Components and Interfaces

### 1. API Layer

**FastAPI Application**
```python
# main.py 구조
- Authentication middleware (JWT 검증)
- Rate limiting middleware
- CORS middleware
- Request/Response logging
- Error handling middleware
```

**API Endpoints**
```
Authentication:
- POST /api/v1/auth/login - Reddit OAuth2 로그인
- POST /api/v1/auth/token - JWT 토큰 발급
- POST /api/v1/auth/refresh - 토큰 갱신
- POST /api/v1/auth/logout - 로그아웃

Keywords:
- GET /api/v1/keywords - 키워드 목록 조회
- POST /api/v1/keywords - 키워드 생성
- PUT /api/v1/keywords/{id} - 키워드 수정
- DELETE /api/v1/keywords/{id} - 키워드 삭제

Crawling:
- POST /api/v1/crawl - 크롤링 시작
- GET /api/v1/crawl/status - 크롤링 상태 조회
- GET /api/v1/crawl/history - 크롤링 이력

Posts:
- GET /api/v1/posts - 포스트 목록 조회 (검색, 필터링)
- GET /api/v1/posts/{id} - 포스트 상세 조회
- GET /api/v1/posts/trending - 트렌딩 포스트

Analytics:
- GET /api/v1/analytics/trends - 트렌드 분석
- GET /api/v1/analytics/keywords/{id}/stats - 키워드 통계
- GET /api/v1/analytics/dashboard - 대시보드 데이터

Content Generation:
- POST /api/v1/content/generate - 콘텐츠 생성
- GET /api/v1/content - 생성된 콘텐츠 목록
- GET /api/v1/content/{id} - 콘텐츠 상세 조회

Health & Monitoring:
- GET /health - 헬스체크
- GET /metrics - Prometheus 메트릭
```

### 2. Service Layer

**User Service**
- 사용자 인증 및 권한 관리
- JWT 토큰 생성 및 검증
- Reddit OAuth2 연동

**Keyword Service**
- 키워드 CRUD 작업
- 키워드 유효성 검증
- 사용자별 키워드 관리

**Crawling Service**
- 크롤링 작업 스케줄링
- 크롤링 상태 관리
- Reddit API 호출 관리

**Content Service**
- 콘텐츠 생성 로직
- 템플릿 관리
- 생성된 콘텐츠 저장

**Analytics Service**
- 트렌드 분석 알고리즘
- 통계 데이터 생성
- 캐시 관리

### 3. Background Workers

**Reddit Crawler Worker**
```python
@celery.task(bind=True, max_retries=3)
def crawl_reddit_posts(self, keyword_id: int):
    # Reddit API 호출
    # 데이터 파싱 및 정제
    # 데이터베이스 저장
    # 메트릭 업데이트
```

**Content Generator Worker**
```python
@celery.task
def generate_content(content_type: str, keyword_ids: List[int], template_id: int):
    # 관련 포스트 데이터 수집
    # 템플릿 기반 콘텐츠 생성
    # 생성된 콘텐츠 저장
```

**Scheduler (Celery Beat)**
```python
# 주기적 크롤링 작업
CELERYBEAT_SCHEDULE = {
    'crawl-trending-posts': {
        'task': 'crawl_trending_posts',
        'schedule': crontab(minute=0, hour='*/2'),  # 2시간마다
    },
    'update-analytics': {
        'task': 'update_analytics_cache',
        'schedule': crontab(minute=0, hour='*/6'),  # 6시간마다
    },
}
```

## Data Models

### Database Schema

**Users Table**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    reddit_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

**Keywords Table**
```sql
CREATE TABLE keywords (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, keyword)
);
```

**Posts Table**
```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    keyword_id INTEGER REFERENCES keywords(id) ON DELETE CASCADE,
    reddit_id VARCHAR(50) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    author VARCHAR(100),
    subreddit VARCHAR(100),
    url TEXT,
    score INTEGER DEFAULT 0,
    num_comments INTEGER DEFAULT 0,
    created_utc TIMESTAMP,
    crawled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(keyword_id, created_utc),
    INDEX(subreddit, created_utc)
);
```

**Comments Table**
```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    reddit_id VARCHAR(50) UNIQUE NOT NULL,
    body TEXT,
    author VARCHAR(100),
    score INTEGER DEFAULT 0,
    created_utc TIMESTAMP,
    crawled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Process Logs Table**
```sql
CREATE TABLE process_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    process_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'running', 'completed', 'failed'
    details JSONB,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);
```

**Generated Content Table**
```sql
CREATE TABLE generated_content (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'blog', 'product_intro', 'trend_analysis'
    content TEXT NOT NULL,
    template_used VARCHAR(100),
    source_keywords INTEGER[] NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Metrics Cache Table**
```sql
CREATE TABLE metrics_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    data JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Pydantic Models

**Request/Response Models**
```python
# Authentication
class LoginRequest(BaseModel):
    code: str
    state: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

# Keywords
class KeywordCreate(BaseModel):
    keyword: str
    description: Optional[str] = None

class KeywordResponse(BaseModel):
    id: int
    keyword: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    post_count: int

# Posts
class PostResponse(BaseModel):
    id: int
    title: str
    content: Optional[str]
    author: str
    subreddit: str
    score: int
    num_comments: int
    created_utc: datetime
    url: str

class PostSearchRequest(BaseModel):
    query: Optional[str] = None
    keyword_ids: Optional[List[int]] = None
    subreddits: Optional[List[str]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    min_score: Optional[int] = None
    page: int = 1
    page_size: int = 20

# Content Generation
class ContentGenerateRequest(BaseModel):
    content_type: str  # 'blog', 'product_intro', 'trend_analysis'
    keyword_ids: List[int]
    template_id: Optional[int] = None
    custom_prompt: Optional[str] = None

class ContentResponse(BaseModel):
    id: int
    title: str
    content_type: str
    content: str
    created_at: datetime
    metadata: Dict[str, Any]
```

## Error Handling

### Exception Hierarchy
```python
class APIException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail

class AuthenticationError(APIException):
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(401, detail)

class AuthorizationError(APIException):
    def __init__(self, detail: str = "Access denied"):
        super().__init__(403, detail)

class ValidationError(APIException):
    def __init__(self, detail: str = "Validation failed"):
        super().__init__(422, detail)

class ExternalServiceError(APIException):
    def __init__(self, detail: str = "External service unavailable"):
        super().__init__(503, detail)
```

### Error Response Format
```python
class ErrorResponse(BaseModel):
    error: str
    detail: str
    timestamp: datetime
    path: str
    request_id: str
```

### Retry Logic
```python
# Reddit API 호출 재시도
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type(requests.RequestException)
)
def call_reddit_api(url: str, params: dict):
    # Reddit API 호출 로직
    pass
```

## Testing Strategy

### Unit Tests
- Service layer 로직 테스트
- Pydantic 모델 검증 테스트
- 유틸리티 함수 테스트
- 데이터베이스 모델 테스트

### Integration Tests
- API 엔드포인트 테스트
- 데이터베이스 연동 테스트
- Redis 캐시 테스트
- Celery 작업 테스트

### End-to-End Tests
- 전체 크롤링 플로우 테스트
- 인증 플로우 테스트
- 콘텐츠 생성 플로우 테스트

### Test Configuration
```python
# pytest 설정
@pytest.fixture
def test_db():
    # 테스트용 데이터베이스 설정
    pass

@pytest.fixture
def test_redis():
    # 테스트용 Redis 설정
    pass

@pytest.fixture
def authenticated_client():
    # 인증된 테스트 클라이언트
    pass
```

### Performance Tests
- API 응답 시간 테스트
- 대용량 데이터 처리 테스트
- 동시 사용자 부하 테스트
- 메모리 사용량 모니터링

## Security Considerations

### Authentication & Authorization
- JWT 토큰 만료 시간 관리 (액세스: 15분, 리프레시: 7일)
- 토큰 블랙리스트 관리
- Rate limiting (사용자당 분당 100회 요청)
- CORS 정책 설정

### Data Protection
- 민감한 정보 암호화 저장
- SQL Injection 방지 (SQLAlchemy ORM 사용)
- XSS 방지 (입력 데이터 검증)
- API 키 환경변수 관리

### Reddit API Compliance
- Reddit API 이용약관 준수
- Rate limiting 준수 (분당 60회 요청)
- 사용자 데이터 보호
- 크롤링 윤리 가이드라인 준수

## Monitoring and Observability

### Metrics Collection
```python
# Prometheus 메트릭
api_requests_total = Counter('api_requests_total', 'Total API requests', ['method', 'endpoint', 'status'])
api_request_duration = Histogram('api_request_duration_seconds', 'API request duration')
crawling_jobs_total = Counter('crawling_jobs_total', 'Total crawling jobs', ['status'])
active_users = Gauge('active_users_total', 'Number of active users')
```

### Health Checks
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "services": {
            "database": await check_database_health(),
            "redis": await check_redis_health(),
            "celery": await check_celery_health()
        }
    }
```

### Logging Strategy
- 구조화된 JSON 로깅
- 로그 레벨별 분류 (DEBUG, INFO, WARNING, ERROR)
- 요청 추적을 위한 correlation ID
- 민감한 정보 마스킹

## Deployment Architecture

### Docker Configuration
```dockerfile
# FastAPI 서버
FROM python:3.11-slim
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Railway.com Configuration
```yaml
# railway.toml
[build]
builder = "DOCKERFILE"
buildCommand = "pip install -r requirements.txt"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"

[environments.production]
variables = { }
```

### Environment Variables (Railway.com)
```bash
# Railway 환경변수 설정
DATABASE_URL=postgresql://username:password@host:port/database  # Railway PostgreSQL
REDIS_URL=redis://username:password@host:port  # Railway Redis
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
JWT_SECRET_KEY=your_jwt_secret_key
CELERY_BROKER_URL=$REDIS_URL
CELERY_RESULT_BACKEND=$REDIS_URL
```

### Local Development Configuration
```yaml
# docker-compose.yml (로컬 개발용)
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@localhost:5432/reddit_platform_dev
      - REDIS_URL=redis://localhost:6379
    depends_on:
      - db
      - redis
      
  worker:
    build: .
    command: celery -A app.celery worker --loglevel=info
    depends_on:
      - db
      - redis
      - rabbitmq
      
  scheduler:
    build: .
    command: celery -A app.celery beat --loglevel=info
    depends_on:
      - db
      - redis
      - rabbitmq
      
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: reddit_platform_dev
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    ports:
      - "5432:5432"
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
      
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          pip install -r requirements.txt
          pytest
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # 배포 스크립트 실행
```