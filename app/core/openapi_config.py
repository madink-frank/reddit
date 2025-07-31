"""
OpenAPI Configuration

Centralized configuration for FastAPI OpenAPI documentation including
schemas, examples, and documentation metadata.
"""

from typing import Dict, Any, List
from app.core.config import settings

# OpenAPI Tags Configuration
OPENAPI_TAGS = [
    {
        "name": "authentication",
        "description": "Reddit OAuth2 authentication and JWT token management",
        "externalDocs": {
            "description": "Reddit OAuth2 Documentation",
            "url": "https://github.com/reddit-archive/reddit/wiki/OAuth2"
        }
    },
    {
        "name": "keywords",
        "description": "Keyword management for tracking specific topics on Reddit",
        "externalDocs": {
            "description": "Keyword Management Guide",
            "url": "https://your-domain.com/docs/keywords"
        }
    },
    {
        "name": "crawling",
        "description": "Reddit content crawling operations and status monitoring",
        "externalDocs": {
            "description": "Crawling Operations Guide",
            "url": "https://your-domain.com/docs/crawling"
        }
    },
    {
        "name": "posts",
        "description": "Search and retrieve crawled Reddit posts with filtering options",
        "externalDocs": {
            "description": "Post Search Guide",
            "url": "https://your-domain.com/docs/posts"
        }
    },
    {
        "name": "analytics",
        "description": "Trend analysis and statistics from collected Reddit data",
        "externalDocs": {
            "description": "Analytics Guide",
            "url": "https://your-domain.com/docs/analytics"
        }
    },
    {
        "name": "content",
        "description": "AI-powered content generation based on analyzed data",
        "externalDocs": {
            "description": "Content Generation Guide",
            "url": "https://your-domain.com/docs/content-generation"
        }
    },
    {
        "name": "monitoring",
        "description": "System health monitoring and metrics",
        "externalDocs": {
            "description": "Monitoring Guide",
            "url": "https://your-domain.com/docs/monitoring"
        }
    }
]

# Security Schemes
SECURITY_SCHEMES = {
    "BearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "JWT token obtained from Reddit OAuth2 authentication. Include as: `Authorization: Bearer <token>`"
    },
    "RedditOAuth2": {
        "type": "oauth2",
        "flows": {
            "authorizationCode": {
                "authorizationUrl": "https://www.reddit.com/api/v1/authorize",
                "tokenUrl": "/api/v1/auth/callback",
                "scopes": {
                    "identity": "Access to Reddit user identity information",
                    "read": "Read access to Reddit content and posts"
                }
            }
        },
        "description": "Reddit OAuth2 authentication flow for secure API access"
    }
}

# Server Configuration
SERVERS = [
    {
        "url": "https://your-production-domain.com",
        "description": "Production server - Live environment"
    },
    {
        "url": "https://your-staging-domain.com", 
        "description": "Staging server - Testing environment"
    },
    {
        "url": "http://localhost:8000",
        "description": "Local development server"
    }
]

# Contact and License Information
CONTACT_INFO = {
    "name": "Reddit Content Platform Support",
    "email": "support@your-domain.com",
    "url": "https://your-domain.com/support"
}

LICENSE_INFO = {
    "name": "MIT License",
    "url": "https://opensource.org/licenses/MIT"
}

# External Documentation
EXTERNAL_DOCS = {
    "description": "Reddit Content Platform Documentation",
    "url": "https://your-domain.com/docs"
}

# Common Response Examples
COMMON_RESPONSES = {
    "400": {
        "description": "Bad Request - Invalid input parameters",
        "content": {
            "application/json": {
                "example": {
                    "error": "validation_error",
                    "detail": "Invalid input parameters",
                    "timestamp": "2024-01-01T00:00:00Z",
                    "path": "/api/v1/endpoint",
                    "request_id": "550e8400-e29b-41d4-a716-446655440000"
                }
            }
        }
    },
    "401": {
        "description": "Unauthorized - Authentication required",
        "content": {
            "application/json": {
                "example": {
                    "error": "authentication_required",
                    "detail": "Valid authentication token required",
                    "timestamp": "2024-01-01T00:00:00Z",
                    "path": "/api/v1/endpoint",
                    "request_id": "550e8400-e29b-41d4-a716-446655440000"
                }
            }
        }
    },
    "403": {
        "description": "Forbidden - Insufficient permissions",
        "content": {
            "application/json": {
                "example": {
                    "error": "insufficient_permissions",
                    "detail": "You don't have permission to access this resource",
                    "timestamp": "2024-01-01T00:00:00Z",
                    "path": "/api/v1/endpoint",
                    "request_id": "550e8400-e29b-41d4-a716-446655440000"
                }
            }
        }
    },
    "404": {
        "description": "Not Found - Resource not found",
        "content": {
            "application/json": {
                "example": {
                    "error": "resource_not_found",
                    "detail": "The requested resource was not found",
                    "timestamp": "2024-01-01T00:00:00Z",
                    "path": "/api/v1/endpoint",
                    "request_id": "550e8400-e29b-41d4-a716-446655440000"
                }
            }
        }
    },
    "422": {
        "description": "Unprocessable Entity - Validation error",
        "content": {
            "application/json": {
                "example": {
                    "error": "validation_error",
                    "detail": "Request validation failed",
                    "timestamp": "2024-01-01T00:00:00Z",
                    "path": "/api/v1/endpoint",
                    "request_id": "550e8400-e29b-41d4-a716-446655440000",
                    "validation_errors": [
                        {
                            "field": "keyword",
                            "message": "Field is required",
                            "type": "missing"
                        }
                    ]
                }
            }
        }
    },
    "429": {
        "description": "Too Many Requests - Rate limit exceeded",
        "content": {
            "application/json": {
                "example": {
                    "error": "rate_limit_exceeded",
                    "detail": "Rate limit exceeded. Try again later.",
                    "timestamp": "2024-01-01T00:00:00Z",
                    "path": "/api/v1/endpoint",
                    "request_id": "550e8400-e29b-41d4-a716-446655440000",
                    "retry_after": 60
                }
            }
        }
    },
    "500": {
        "description": "Internal Server Error - Server error",
        "content": {
            "application/json": {
                "example": {
                    "error": "internal_server_error",
                    "detail": "An unexpected error occurred",
                    "timestamp": "2024-01-01T00:00:00Z",
                    "path": "/api/v1/endpoint",
                    "request_id": "550e8400-e29b-41d4-a716-446655440000"
                }
            }
        }
    },
    "503": {
        "description": "Service Unavailable - Service temporarily unavailable",
        "content": {
            "application/json": {
                "example": {
                    "error": "service_unavailable",
                    "detail": "Service is temporarily unavailable",
                    "timestamp": "2024-01-01T00:00:00Z",
                    "path": "/api/v1/endpoint",
                    "request_id": "550e8400-e29b-41d4-a716-446655440000"
                }
            }
        }
    }
}

# API Description Template
API_DESCRIPTION = """
## Reddit Content Crawling and Trend Analysis Platform

A comprehensive platform for collecting Reddit content, analyzing trends, and generating AI-powered content based on user-defined keywords.

### Key Features

- **🔐 Reddit OAuth2 Authentication**: Secure login using Reddit credentials with JWT token management
- **🏷️ Keyword Management**: Register and manage keywords to track specific topics
- **🤖 Automated Crawling**: Background workers crawl Reddit for content related to registered keywords
- **📊 Trend Analysis**: Real-time analysis of collected data to identify trending topics and patterns
- **✍️ Content Generation**: AI-powered generation of blog posts, product introductions, and trend reports
- **📈 Real-time Monitoring**: Live status tracking of crawling operations and system health

### Authentication

This API uses Reddit OAuth2 for authentication and JWT tokens for authorization.

#### Authentication Flow

1. **Initiate Login**: Call `GET /api/v1/auth/login` to start Reddit OAuth2 flow
2. **User Authorization**: User is redirected to Reddit for authorization
3. **Callback Handling**: Reddit redirects back with authorization code
4. **Token Exchange**: System exchanges code for JWT access and refresh tokens
5. **API Access**: Include `Authorization: Bearer <access_token>` header in requests
6. **Token Refresh**: Use `POST /api/v1/auth/refresh` to get new access tokens

#### Security Headers

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Rate Limiting

- **General API**: 100 requests per minute per user
- **Reddit API**: Respects Reddit's rate limits (60 requests per minute)
- **Crawling Operations**: Throttled to prevent API abuse
- **Content Generation**: 10 requests per hour per user

### Pagination

List endpoints support pagination with the following parameters:

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

### Error Handling

All endpoints return consistent error responses with the following structure:

```json
{
  "error": "error_type",
  "detail": "Human readable error message",
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/api/v1/endpoint",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Common Error Types

- `authentication_required`: Missing or invalid authentication token
- `insufficient_permissions`: User lacks required permissions
- `validation_error`: Request validation failed
- `resource_not_found`: Requested resource doesn't exist
- `rate_limit_exceeded`: Too many requests
- `external_service_error`: Reddit API or other external service error

### Webhooks

The platform supports webhooks for real-time notifications:

- **Crawling Completed**: Notifies when crawling job finishes
- **Content Generated**: Notifies when content generation completes
- **System Alerts**: Notifies about system health issues

### Data Formats

#### Timestamps
All timestamps are in ISO 8601 format with UTC timezone:
```
2024-01-01T00:00:00Z
```

#### Reddit IDs
Reddit post and comment IDs are prefixed strings:
- Posts: `t3_abc123`
- Comments: `t1_def456`

### Support

- **Documentation**: [API Documentation](https://your-domain.com/docs)
- **GitHub**: [Repository](https://github.com/your-org/reddit-content-platform)
- **Support Email**: support@your-domain.com
- **Status Page**: [System Status](https://status.your-domain.com)

### SDKs and Libraries

Official SDKs are available for:
- **Python**: `pip install reddit-content-platform-sdk`
- **JavaScript/Node.js**: `npm install reddit-content-platform-sdk`
- **Go**: `go get github.com/your-org/reddit-content-platform-go`

### Changelog

- **v1.0.0**: Initial release with core functionality
- **v1.1.0**: Added content generation features
- **v1.2.0**: Enhanced analytics and monitoring
"""

def get_openapi_config() -> Dict[str, Any]:
    """Get complete OpenAPI configuration."""
    return {
        "title": "Reddit Content Platform API",
        "version": settings.VERSION,
        "description": API_DESCRIPTION,
        "tags": OPENAPI_TAGS,
        "servers": SERVERS,
        "contact": CONTACT_INFO,
        "license": LICENSE_INFO,
        "external_docs": EXTERNAL_DOCS,
        "security_schemes": SECURITY_SCHEMES,
        "common_responses": COMMON_RESPONSES
    }