from fastapi import APIRouter
from app.api.v1.endpoints import auth, keywords, crawling, posts, analytics, content, billing, crawling_jobs, notifications, nlp, image_analysis, export, reports, data_preprocessing, forecasting, brand_monitoring, advertising_effectiveness

api_router = APIRouter()

# Include authentication endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Include keyword endpoints
api_router.include_router(keywords.router, prefix="/keywords", tags=["keywords"])

# Include crawling endpoints
api_router.include_router(crawling.router, prefix="/crawling", tags=["crawling"])

# Include crawling jobs endpoints
api_router.include_router(crawling_jobs.router, prefix="/crawling-jobs", tags=["crawling-jobs"])

# Include notifications endpoints
api_router.include_router(notifications.router, prefix="/crawling-jobs", tags=["notifications"])

# Include posts endpoints
api_router.include_router(posts.router, prefix="/posts", tags=["posts"])

# Include analytics endpoints
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

# Include content endpoints
api_router.include_router(content.router, prefix="/content", tags=["content"])

# Include billing endpoints
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])

# Include NLP endpoints
api_router.include_router(nlp.router, prefix="/nlp", tags=["nlp"])

# Include image analysis endpoints
api_router.include_router(image_analysis.router, prefix="/image-analysis", tags=["image-analysis"])

# Include export endpoints
api_router.include_router(export.router, prefix="/export", tags=["export"])

# Include reports endpoints
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])

# Include data preprocessing endpoints
api_router.include_router(data_preprocessing.router, prefix="/data-preprocessing", tags=["data-preprocessing"])

# Include forecasting endpoints
api_router.include_router(forecasting.router, prefix="/forecasting", tags=["forecasting"])

# Include brand monitoring endpoints
api_router.include_router(brand_monitoring.router, prefix="/brand-monitoring", tags=["brand-monitoring"])

# Include advertising effectiveness endpoints
api_router.include_router(advertising_effectiveness.router, prefix="/advertising-effectiveness", tags=["advertising-effectiveness"])

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Reddit Content Platform API v1"}