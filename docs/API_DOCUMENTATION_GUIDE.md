# Reddit Content Platform API Documentation Guide

## Overview

This guide provides comprehensive documentation for the Reddit Content Platform API, including setup instructions, authentication flows, and detailed endpoint descriptions.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Postman Collection Setup](#postman-collection-setup)
7. [Examples](#examples)

## Getting Started

### Base URLs

- **Production**: `https://your-production-domain.com`
- **Staging**: `https://your-staging-domain.com`
- **Local Development**: `http://localhost:8000`

### API Documentation

- **Swagger UI**: `{base_url}/docs`
- **ReDoc**: `{base_url}/redoc`
- **OpenAPI JSON**: `{base_url}/api/v1/openapi.json`

## Authentication

The API uses Reddit OAuth2 for authentication and JWT tokens for authorization.

### Authentication Flow

1. **Initiate Login**: `GET /api/v1/auth/login`
   - Redirects to Reddit authorization page
   - User authorizes the application

2. **Handle Callback**: `GET /api/v1/auth/callback`
   - Reddit redirects back with authorization code
   - System exchanges code for JWT tokens

3. **Use Tokens**: Include in API requests
   ```http
   Authorization: Bearer {access_token}
   ```

4. **Refresh Tokens**: `POST /api/v1/auth/refresh`
   - Get new access token when expired
   - Use refresh token for authentication

### Token Management

- **Access Token**: Expires in 15 minutes
- **Refresh Token**: Expires in 7 days
- **Token Blacklisting**: Logout invalidates tokens

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/auth/login` | Initiate Reddit OAuth2 login |
| GET | `/api/v1/auth/callback` | Handle OAuth2 callback |
| POST | `/api/v1/auth/login` | Login with authorization code |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout and blacklist token |
| GET | `/api/v1/auth/me` | Get current user info |
| GET | `/api/v1/auth/status` | Get authentication status |
| POST | `/api/v1/auth/validate` | Validate JWT token |

### Keyword Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/keywords` | Create new keyword |
| GET | `/api/v1/keywords` | Get user keywords (paginated) |
| GET | `/api/v1/keywords/{id}` | Get keyword by ID |
| PUT | `/api/v1/keywords/{id}` | Update keyword |
| DELETE | `/api/v1/keywords/{id}` | Delete keyword |
| POST | `/api/v1/keywords/validate` | Validate keyword |
| POST | `/api/v1/keywords/bulk` | Bulk create keywords |
| GET | `/api/v1/keywords/{id}/stats` | Get keyword statistics |
| GET | `/api/v1/keywords/me/count` | Get user keyword count |
| GET | `/api/v1/keywords/me/active` | Get active keywords |

### Crawling Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/crawl` | Start crawling job |
| GET | `/api/v1/crawl/status` | Get crawling status |
| GET | `/api/v1/crawl/history` | Get crawling history |

### Posts Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/posts` | Search and filter posts |
| GET | `/api/v1/posts/{id}` | Get post by ID |
| GET | `/api/v1/posts/trending` | Get trending posts |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/trends` | Get trend analysis |
| GET | `/api/v1/analytics/keywords/{id}/stats` | Get keyword statistics |
| GET | `/api/v1/analytics/dashboard` | Get dashboard data |

### Content Generation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/content/generate` | Generate content |
| POST | `/api/v1/content/generate/batch` | Batch generate content |
| GET | `/api/v1/content/tasks/{id}/status` | Get task status |
| DELETE | `/api/v1/content/tasks/{id}` | Cancel task |
| GET | `/api/v1/content/tasks` | Get active tasks |
| GET | `/api/v1/content` | Get generated content |
| GET | `/api/v1/content/{id}` | Get content by ID |
| DELETE | `/api/v1/content/{id}` | Delete content |
| GET | `/api/v1/content/stats/overview` | Get content statistics |
| GET | `/api/v1/content/templates` | Get available templates |
| GET | `/api/v1/content/worker/stats` | Get worker statistics |
| POST | `/api/v1/content/schedule` | Schedule content generation |

### Monitoring Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/detailed` | Detailed health check |
| GET | `/health/{service}` | Service-specific health check |
| GET | `/metrics` | Prometheus metrics |

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "error_type",
  "detail": "Human readable error message",
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/api/v1/endpoint",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Common Error Types

- `authentication_required`: Missing or invalid authentication token
- `insufficient_permissions`: User lacks required permissions
- `validation_error`: Request validation failed
- `resource_not_found`: Requested resource doesn't exist
- `rate_limit_exceeded`: Too many requests
- `external_service_error`: Reddit API or other external service error

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `204`: No Content
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Unprocessable Entity
- `429`: Too Many Requests
- `500`: Internal Server Error
- `503`: Service Unavailable

## Rate Limiting

- **General API**: 100 requests per minute per user
- **Reddit API**: 60 requests per minute (Reddit's limit)
- **Content Generation**: 10 requests per hour per user
- **Crawling Operations**: Throttled to prevent API abuse

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Postman Collection Setup

### 1. Import Collection

1. Download the Postman collection: `postman/Reddit_Content_Platform_API.postman_collection.json`
2. Open Postman
3. Click "Import" and select the collection file

### 2. Set Environment Variables

Create a new environment with these variables:

```json
{
  "base_url": "http://localhost:8000",
  "access_token": "",
  "refresh_token": ""
}
```

### 3. Authentication Setup

1. Use "Initiate Login" to start OAuth2 flow
2. Complete Reddit authorization in browser
3. Use "Login with Code" with the authorization code
4. Tokens will be automatically set in environment variables

### 4. Automatic Token Management

The collection includes scripts that:
- Automatically set tokens after login
- Check token expiration before requests
- Refresh tokens when needed
- Handle authentication errors

## Examples

### 1. Complete Authentication Flow

```bash
# 1. Initiate login (redirects to Reddit)
curl -X GET "http://localhost:8000/api/v1/auth/login"

# 2. After Reddit authorization, use the code
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "your_authorization_code",
    "state": "your_state_parameter"
  }'

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 900
}
```

### 2. Create and Manage Keywords

```bash
# Create a keyword
curl -X POST "http://localhost:8000/api/v1/keywords" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "artificial intelligence",
    "description": "Track AI-related discussions",
    "is_active": true
  }'

# Get keywords with pagination
curl -X GET "http://localhost:8000/api/v1/keywords?page=1&page_size=20" \
  -H "Authorization: Bearer {access_token}"

# Bulk create keywords
curl -X POST "http://localhost:8000/api/v1/keywords/bulk" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": [
      {
        "keyword": "blockchain",
        "description": "Cryptocurrency discussions"
      },
      {
        "keyword": "web3",
        "description": "Web3 technologies"
      }
    ]
  }'
```

### 3. Start Crawling and Monitor Status

```bash
# Start crawling
curl -X POST "http://localhost:8000/api/v1/crawl" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword_ids": [1, 2, 3],
    "subreddits": ["MachineLearning", "artificial"],
    "limit": 100,
    "time_filter": "week"
  }'

# Check crawling status
curl -X GET "http://localhost:8000/api/v1/crawl/status" \
  -H "Authorization: Bearer {access_token}"
```

### 4. Search Posts and Get Analytics

```bash
# Search posts with filters
curl -X GET "http://localhost:8000/api/v1/posts?query=AI&keyword_ids=1,2&min_score=10&page=1&page_size=20" \
  -H "Authorization: Bearer {access_token}"

# Get trending posts
curl -X GET "http://localhost:8000/api/v1/posts/trending?limit=50&time_period=24h" \
  -H "Authorization: Bearer {access_token}"

# Get trend analysis
curl -X GET "http://localhost:8000/api/v1/analytics/trends?time_period=7d&keyword_ids=1,2,3" \
  -H "Authorization: Bearer {access_token}"
```

### 5. Generate Content

```bash
# Generate content
curl -X POST "http://localhost:8000/api/v1/content/generate" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "content_type": "blog_post",
    "keyword_ids": [1, 2],
    "template_id": 1,
    "custom_prompt": "Write about recent AI trends",
    "async_mode": false
  }'

# Check task status (for async operations)
curl -X GET "http://localhost:8000/api/v1/content/tasks/{task_id}/status" \
  -H "Authorization: Bearer {access_token}"

# Get generated content
curl -X GET "http://localhost:8000/api/v1/content?limit=20&offset=0" \
  -H "Authorization: Bearer {access_token}"
```

### 6. Health Monitoring

```bash
# Basic health check
curl -X GET "http://localhost:8000/health"

# Detailed health check
curl -X GET "http://localhost:8000/health/detailed" \
  -H "Authorization: Bearer {access_token}"

# Get Prometheus metrics
curl -X GET "http://localhost:8000/metrics"
```

## Pagination

List endpoints support pagination with these parameters:

- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

Response includes pagination metadata:

```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 150,
    "total_pages": 8,
    "has_next": true,
    "has_previous": false
  }
}
```

## Filtering and Search

### Posts Search Parameters

- `query`: Search in title and content
- `keyword_ids`: Filter by keyword IDs (comma-separated)
- `subreddits`: Filter by subreddit names (comma-separated)
- `date_from`: Start date (ISO format)
- `date_to`: End date (ISO format)
- `min_score`: Minimum post score

### Keywords Search Parameters

- `query`: Search in keyword text and description
- `is_active`: Filter by active status (true/false)

## Content Types

Available content generation types:

- `blog_post`: Blog articles and posts
- `product_intro`: Product introduction content
- `trend_analysis`: Trend analysis reports
- `social_media`: Social media posts
- `newsletter`: Newsletter content

## Webhooks (Future Feature)

The platform will support webhooks for real-time notifications:

- **Crawling Completed**: Notifies when crawling job finishes
- **Content Generated**: Notifies when content generation completes
- **System Alerts**: Notifies about system health issues

## Support

- **API Documentation**: [Swagger UI](http://localhost:8000/docs)
- **GitHub Repository**: [Reddit Content Platform](https://github.com/your-org/reddit-content-platform)
- **Support Email**: support@your-domain.com
- **Status Page**: [System Status](https://status.your-domain.com)

## Changelog

- **v1.0.0**: Initial release with core functionality
- **v1.1.0**: Added content generation features
- **v1.2.0**: Enhanced analytics and monitoring
- **v1.3.0**: Improved API documentation and Postman collection