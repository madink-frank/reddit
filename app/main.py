from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.metrics import PrometheusMiddleware, get_metrics_response
from app.core.openapi_config import get_openapi_config

def custom_openapi():
    """Custom OpenAPI schema with enhanced documentation."""
    if app.openapi_schema:
        return app.openapi_schema
    
    # Get configuration from centralized config
    config = get_openapi_config()
    
    openapi_schema = get_openapi(
        title=config["title"],
        version=config["version"],
        description=config["description"],
        routes=app.routes,
        tags=config["tags"]
    )
    
    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = config["security_schemes"]
    
    # Add servers information
    openapi_schema["servers"] = config["servers"]
    
    # Add contact and license information
    openapi_schema["info"]["contact"] = config["contact"]
    openapi_schema["info"]["license"] = config["license"]
    
    # Add external documentation
    openapi_schema["externalDocs"] = config["external_docs"]
    
    # Add common response schemas
    if "components" not in openapi_schema:
        openapi_schema["components"] = {}
    if "responses" not in openapi_schema["components"]:
        openapi_schema["components"]["responses"] = {}
    
    openapi_schema["components"]["responses"].update(config["common_responses"])
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app = FastAPI(
    title="Reddit Content Platform API",
    version=settings.VERSION,
    description="Reddit Content Crawling and Trend Analysis Platform",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {
            "name": "authentication",
            "description": "Reddit OAuth2 authentication and JWT token management"
        },
        {
            "name": "keywords", 
            "description": "Keyword management for tracking specific topics on Reddit"
        },
        {
            "name": "crawling",
            "description": "Reddit content crawling operations and status monitoring"
        },
        {
            "name": "posts",
            "description": "Search and retrieve crawled Reddit posts with filtering options"
        },
        {
            "name": "analytics",
            "description": "Trend analysis and statistics from collected Reddit data"
        },
        {
            "name": "content",
            "description": "AI-powered content generation based on analyzed data"
        },
        {
            "name": "monitoring",
            "description": "System health monitoring and metrics"
        }
    ]
)

# Set custom OpenAPI schema
app.openapi = custom_openapi

# Add Prometheus metrics middleware
app.middleware("http")(PrometheusMiddleware())

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Metrics endpoint
@app.get(
    "/metrics",
    tags=["monitoring"],
    summary="Get Prometheus metrics",
    description="Retrieve Prometheus-formatted metrics for monitoring system performance and health.",
    responses={
        200: {
            "description": "Prometheus metrics in text format",
            "content": {"text/plain": {"example": "# HELP api_requests_total Total API requests\n# TYPE api_requests_total counter\napi_requests_total{method=\"GET\",endpoint=\"/health\"} 42"}}
        }
    }
)
async def metrics():
    """Prometheus metrics endpoint for system monitoring."""
    return get_metrics_response()

@app.get(
    "/health",
    tags=["monitoring"],
    summary="Basic health check",
    description="Simple health check endpoint that returns the basic status of the service.",
    responses={
        200: {
            "description": "Service is healthy",
            "content": {
                "application/json": {
                    "example": {"status": "healthy", "service": "reddit-content-platform"}
                }
            }
        }
    }
)
async def health_check():
    """Basic health check endpoint."""
    return {"status": "healthy", "service": "reddit-content-platform"}

@app.get(
    "/health/detailed",
    tags=["monitoring"],
    summary="Detailed health check",
    description="Comprehensive health check that verifies the status of all system components including database, Redis, and Celery workers.",
    responses={
        200: {
            "description": "Detailed health status of all components",
            "content": {
                "application/json": {
                    "example": {
                        "status": "healthy",
                        "timestamp": "2024-01-01T00:00:00Z",
                        "services": {
                            "database": {"status": "healthy", "response_time_ms": 5},
                            "redis": {"status": "healthy", "response_time_ms": 2},
                            "celery": {"status": "healthy", "active_workers": 3}
                        }
                    }
                }
            }
        },
        503: {
            "description": "One or more services are unhealthy",
            "content": {
                "application/json": {
                    "example": {
                        "status": "unhealthy",
                        "timestamp": "2024-01-01T00:00:00Z",
                        "services": {
                            "database": {"status": "unhealthy", "error": "Connection timeout"}
                        }
                    }
                }
            }
        }
    }
)
async def detailed_health_check():
    """Detailed health check endpoint with all system components."""
    from app.services.health_check_service import health_service
    return await health_service.get_health_status(include_details=True)

@app.get(
    "/health/{service_name}",
    tags=["monitoring"],
    summary="Service-specific health check",
    description="Check the health status of a specific service component (database, redis, celery).",
    responses={
        200: {
            "description": "Service health status",
            "content": {
                "application/json": {
                    "example": {
                        "service": "database",
                        "status": "healthy",
                        "response_time_ms": 5,
                        "details": {"connection_pool": "active", "queries_per_second": 150}
                    }
                }
            }
        },
        404: {
            "description": "Service not found",
            "content": {
                "application/json": {
                    "example": {"error": "service_not_found", "detail": "Service 'unknown' not found"}
                }
            }
        }
    }
)
async def service_health_check(service_name: str):
    """Health check for a specific service."""
    from app.services.health_check_service import health_service
    return await health_service.get_service_health(service_name)

@app.get(
    "/monitoring/redis/performance",
    tags=["monitoring"],
    summary="Redis performance monitoring",
    description="Get comprehensive Redis performance metrics including connection pool stats, operation timings, and optimization recommendations.",
    responses={
        200: {
            "description": "Redis performance report",
            "content": {
                "application/json": {
                    "example": {
                        "timestamp": "2024-01-01T00:00:00Z",
                        "performance_stats": {
                            "average_response_time_ms": 2.5,
                            "operations_per_second": 150.0,
                            "error_rate_percent": 0.1,
                            "total_operations": 10000
                        },
                        "connection_pool_stats": {
                            "max_connections": 50,
                            "in_use_connections": 15,
                            "available_connections": 35
                        },
                        "overall_health_score": 95,
                        "recommendations": []
                    }
                }
            }
        },
        503: {
            "description": "Redis performance monitoring unavailable",
            "content": {
                "application/json": {
                    "example": {"error": "Redis connection unavailable"}
                }
            }
        }
    }
)
async def redis_performance_monitoring():
    """Get comprehensive Redis performance monitoring data."""
    from app.services.redis_performance_service import get_redis_performance_service
    performance_service = get_redis_performance_service()
    return await performance_service.get_comprehensive_performance_report()

@app.get(
    "/monitoring/redis/connection-pool",
    tags=["monitoring"],
    summary="Redis connection pool optimization",
    description="Analyze Redis connection pool usage and get optimization recommendations.",
    responses={
        200: {
            "description": "Connection pool analysis and recommendations",
            "content": {
                "application/json": {
                    "example": {
                        "current_stats": {
                            "pool_max_connections": 50,
                            "pool_in_use_connections": 15,
                            "pool_available_connections": 35
                        },
                        "utilization_percent": 30.0,
                        "recommendations": [
                            {
                                "type": "optimize_pool_size",
                                "description": "Consider adjusting pool size based on usage patterns"
                            }
                        ]
                    }
                }
            }
        }
    }
)
async def redis_connection_pool_analysis():
    """Analyze Redis connection pool and provide optimization recommendations."""
    from app.services.redis_performance_service import get_redis_performance_service
    performance_service = get_redis_performance_service()
    return await performance_service.optimize_connection_pool()

@app.get(
    "/monitoring/redis/cache-patterns",
    tags=["monitoring"],
    summary="Redis cache pattern analysis",
    description="Analyze Redis cache usage patterns and provide optimization suggestions.",
    responses={
        200: {
            "description": "Cache pattern analysis and optimization suggestions",
            "content": {
                "application/json": {
                    "example": {
                        "analysis_period_hours": 24,
                        "operation_patterns": {
                            "get": {"count": 5000, "percentage": 70.0},
                            "set": {"count": 2000, "percentage": 28.0},
                            "delete": {"count": 143, "percentage": 2.0}
                        },
                        "optimization_suggestions": []
                    }
                }
            }
        }
    }
)
async def redis_cache_pattern_analysis():
    """Analyze Redis cache usage patterns for optimization."""
    from app.services.redis_performance_service import get_redis_performance_service
    performance_service = get_redis_performance_service()
    return await performance_service.analyze_cache_patterns()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)