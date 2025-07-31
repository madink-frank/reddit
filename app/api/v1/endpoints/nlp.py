"""
NLP Analysis API Endpoints

Provides REST API endpoints for natural language processing capabilities:
- Morphological analysis
- Sentiment analysis  
- Text similarity
- Keyword extraction
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
import logging

from app.services.nlp_service import nlp_service
from app.core.dependencies import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()

# Request/Response Models

class NLPAnalysisRequest(BaseModel):
    """Request model for NLP analysis"""
    text: str = Field(..., description="Text to analyze", min_length=1, max_length=10000)
    analysis_types: List[str] = Field(
        ..., 
        description="Types of analysis to perform",
        example=["morphological", "sentiment", "keywords"]
    )
    options: Optional[Dict[str, Any]] = Field(
        None,
        description="Analysis options",
        example={
            "language": "en",
            "max_keywords": 20,
            "min_frequency": 2
        }
    )

class TextSimilarityRequest(BaseModel):
    """Request model for text similarity analysis"""
    text1: str = Field(..., description="First text", min_length=1, max_length=10000)
    text2: str = Field(..., description="Second text", min_length=1, max_length=10000)
    options: Optional[Dict[str, Any]] = Field(
        None,
        description="Similarity analysis options",
        example={"threshold": 0.8}
    )

class BatchAnalysisRequest(BaseModel):
    """Request model for batch text analysis"""
    texts: List[str] = Field(
        ..., 
        description="List of texts to analyze",
        min_items=1,
        max_items=100
    )
    analysis_types: List[str] = Field(
        ...,
        description="Types of analysis to perform",
        example=["sentiment", "keywords"]
    )
    options: Optional[Dict[str, Any]] = Field(None, description="Analysis options")

class MorphemeResponse(BaseModel):
    """Response model for morpheme information"""
    text: str
    pos: str
    lemma: str
    features: List[str]
    dependency: str
    head: str

class MorphologicalResponse(BaseModel):
    """Response model for morphological analysis"""
    morphemes: List[MorphemeResponse]
    structure: Dict[str, Any]
    processing_time: float
    confidence: float

class SentimentResponse(BaseModel):
    """Response model for sentiment analysis"""
    score: float
    confidence: float
    label: str
    breakdown: Dict[str, float]
    processing_time: float

class KeywordResponse(BaseModel):
    """Response model for keyword extraction"""
    keywords: List[Dict[str, Any]]
    word_cloud: List[Dict[str, Any]]
    processing_time: float

class SimilarityResponse(BaseModel):
    """Response model for text similarity"""
    similarity_score: float
    matched_segments: List[Dict[str, Any]]
    processing_time: float

class NLPAnalysisResponse(BaseModel):
    """Response model for comprehensive NLP analysis"""
    morphological: Optional[MorphologicalResponse] = None
    sentiment: Optional[SentimentResponse] = None
    keywords: Optional[KeywordResponse] = None
    success: bool = True
    message: str = "Analysis completed successfully"

# API Endpoints

@router.post("/analyze", response_model=NLPAnalysisResponse)
async def analyze_text(
    request: NLPAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Perform comprehensive NLP analysis on text
    
    Supports multiple analysis types:
    - morphological: POS tagging, morpheme extraction, linguistic structure
    - sentiment: Emotion scoring from -1 to +1
    - keywords: Frequency analysis and word cloud generation
    """
    try:
        logger.info(f"NLP analysis requested by user {current_user.id} for {len(request.analysis_types)} analysis types")
        
        # Validate analysis types
        valid_types = {'morphological', 'sentiment', 'keywords'}
        invalid_types = set(request.analysis_types) - valid_types
        if invalid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid analysis types: {invalid_types}. Valid types: {valid_types}"
            )
        
        # Perform analysis
        results = await nlp_service.analyze_text(
            text=request.text,
            analysis_types=request.analysis_types,
            options=request.options
        )
        
        # Convert results to response format
        response_data = {}
        
        if 'morphological' in results:
            morph_result = results['morphological']
            response_data['morphological'] = MorphologicalResponse(
                morphemes=[
                    MorphemeResponse(
                        text=m.text,
                        pos=m.pos,
                        lemma=m.lemma,
                        features=m.features,
                        dependency=m.dependency,
                        head=m.head
                    ) for m in morph_result.morphemes
                ],
                structure=morph_result.structure,
                processing_time=morph_result.processing_time,
                confidence=morph_result.confidence
            )
        
        if 'sentiment' in results:
            sent_result = results['sentiment']
            response_data['sentiment'] = SentimentResponse(
                score=sent_result.score,
                confidence=sent_result.confidence,
                label=sent_result.label,
                breakdown=sent_result.breakdown,
                processing_time=sent_result.processing_time
            )
        
        if 'keywords' in results:
            kw_result = results['keywords']
            response_data['keywords'] = KeywordResponse(
                keywords=kw_result.keywords,
                word_cloud=kw_result.word_cloud,
                processing_time=kw_result.processing_time
            )
        
        logger.info(f"NLP analysis completed successfully for user {current_user.id}")
        
        return NLPAnalysisResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Error in NLP analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

@router.post("/similarity", response_model=SimilarityResponse)
async def analyze_similarity(
    request: TextSimilarityRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Analyze similarity between two texts
    
    Returns similarity score (0-100) and matched segments for duplicate detection.
    """
    try:
        logger.info(f"Text similarity analysis requested by user {current_user.id}")
        
        result = await nlp_service.compare_texts(
            text1=request.text1,
            text2=request.text2,
            options=request.options
        )
        
        response = SimilarityResponse(
            similarity_score=result.similarity_score,
            matched_segments=result.matched_segments,
            processing_time=result.processing_time
        )
        
        logger.info(f"Similarity analysis completed: {result.similarity_score:.2f}% similarity")
        
        return response
        
    except Exception as e:
        logger.error(f"Error in similarity analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Similarity analysis failed: {str(e)}"
        )

@router.post("/batch-analyze")
async def batch_analyze_texts(
    request: BatchAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Perform batch analysis on multiple texts
    
    Processes multiple texts in parallel for efficiency.
    """
    try:
        logger.info(f"Batch analysis requested by user {current_user.id} for {len(request.texts)} texts")
        
        # Validate analysis types
        valid_types = {'morphological', 'sentiment', 'keywords'}
        invalid_types = set(request.analysis_types) - valid_types
        if invalid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid analysis types: {invalid_types}. Valid types: {valid_types}"
            )
        
        # Perform batch analysis
        results = await nlp_service.batch_analyze(
            texts=request.texts,
            analysis_types=request.analysis_types,
            options=request.options
        )
        
        logger.info(f"Batch analysis completed for {len(results)} texts")
        
        return {
            "success": True,
            "message": f"Batch analysis completed for {len(results)} texts",
            "results": results,
            "total_processed": len(results)
        }
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Batch analysis failed: {str(e)}"
        )

@router.get("/supported-analyses")
async def get_supported_analyses():
    """
    Get list of supported analysis types and their descriptions
    """
    return {
        "supported_analyses": {
            "morphological": {
                "description": "Part-of-speech tagging, morpheme extraction, and linguistic structure analysis",
                "features": [
                    "POS tagging",
                    "Lemmatization", 
                    "Dependency parsing",
                    "Named entity recognition",
                    "Linguistic structure extraction"
                ]
            },
            "sentiment": {
                "description": "Emotion scoring and sentiment classification",
                "features": [
                    "Sentiment score (-1 to +1)",
                    "Confidence scoring",
                    "Positive/negative/neutral classification",
                    "Sentiment breakdown"
                ]
            },
            "keywords": {
                "description": "Keyword extraction and word cloud generation",
                "features": [
                    "Frequency analysis",
                    "Importance scoring",
                    "Word cloud data",
                    "Stop word filtering"
                ]
            },
            "similarity": {
                "description": "Text similarity and duplicate detection",
                "features": [
                    "Similarity percentage",
                    "Matched segments identification",
                    "Fuzzy string matching",
                    "Duplicate detection"
                ]
            }
        }
    }

@router.get("/health")
async def health_check():
    """
    Check NLP service health and model availability
    """
    try:
        # Test basic functionality
        test_result = await nlp_service.analyze_text(
            text="This is a test.",
            analysis_types=["sentiment"],
            options={}
        )
        
        return {
            "status": "healthy",
            "message": "NLP service is operational",
            "models_loaded": {
                "morphological_analyzer": nlp_service.morphological_analyzer.nlp is not None,
                "sentiment_analyzer": nlp_service.sentiment_analyzer.analyzer is not None,
                "similarity_analyzer": nlp_service.similarity_analyzer.lemmatizer is not None,
                "keyword_extractor": len(nlp_service.keyword_extractor.stop_words) > 0
            },
            "test_successful": test_result is not None
        }
        
    except Exception as e:
        logger.error(f"NLP service health check failed: {e}")
        return {
            "status": "unhealthy",
            "message": f"NLP service error: {str(e)}",
            "models_loaded": {
                "morphological_analyzer": False,
                "sentiment_analyzer": False,
                "similarity_analyzer": False,
                "keyword_extractor": False
            },
            "test_successful": False
        }