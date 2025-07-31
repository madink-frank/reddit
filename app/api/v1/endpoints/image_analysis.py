"""
Image Analysis API endpoints for object detection, OCR, and image classification.
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
import base64

from app.core.dependencies import get_current_user
from app.services.image_analysis_service import (
    image_analysis_service,
    VisionProvider,
    ObjectDetectionResult,
    OCRResult,
    ImageClassificationResult
)
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/detect-objects", response_model=dict)
async def detect_objects(
    file: UploadFile = File(...),
    provider: str = Form("google"),
    confidence_threshold: float = Form(0.5),
    max_objects: int = Form(50),
    current_user: User = Depends(get_current_user)
):
    """
    Detect objects in an uploaded image.
    
    Args:
        file: Image file to analyze
        provider: Vision provider ('google', 'azure', 'aws', 'local')
        confidence_threshold: Minimum confidence score (0-1)
        max_objects: Maximum number of objects to detect
        current_user: Authenticated user
        
    Returns:
        Object detection results with detected objects and metadata
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await file.read()
        
        # Validate provider
        try:
            vision_provider = VisionProvider(provider.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid provider: {provider}")
        
        # Validate parameters
        if not 0 <= confidence_threshold <= 1:
            raise HTTPException(status_code=400, detail="Confidence threshold must be between 0 and 1")
        
        if max_objects < 1 or max_objects > 100:
            raise HTTPException(status_code=400, detail="Max objects must be between 1 and 100")
        
        # Perform object detection
        result = await image_analysis_service.detect_objects(
            image_data=image_data,
            provider=vision_provider,
            confidence_threshold=confidence_threshold,
            max_objects=max_objects
        )
        
        # Convert result to dict for JSON response
        response_data = {
            "objects": [
                {
                    "label": obj.label,
                    "confidence": obj.confidence,
                    "bounding_box": {
                        "x": obj.bounding_box.x,
                        "y": obj.bounding_box.y,
                        "width": obj.bounding_box.width,
                        "height": obj.bounding_box.height
                    },
                    "category": obj.category
                }
                for obj in result.objects
            ],
            "summary": {
                "total_objects": result.total_objects,
                "high_confidence_objects": result.high_confidence_objects,
                "categories": result.categories,
                "processing_time": result.processing_time,
                "provider": result.provider
            }
        }
        
        logger.info(f"Object detection completed for user {current_user.id}: {result.total_objects} objects found")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Object detection failed: {e}")
        raise HTTPException(status_code=500, detail="Object detection failed")


@router.post("/extract-text", response_model=dict)
async def extract_text_ocr(
    file: UploadFile = File(...),
    provider: str = Form("local"),
    languages: Optional[str] = Form("en"),
    current_user: User = Depends(get_current_user)
):
    """
    Extract text from an image using OCR.
    
    Args:
        file: Image file to analyze
        provider: OCR provider ('google', 'azure', 'aws', 'local')
        languages: Comma-separated language codes (e.g., 'en,es')
        current_user: Authenticated user
        
    Returns:
        OCR results with extracted text and metadata
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await file.read()
        
        # Validate provider
        try:
            vision_provider = VisionProvider(provider.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid provider: {provider}")
        
        # Parse languages
        language_list = [lang.strip() for lang in languages.split(',')] if languages else ['en']
        
        # Perform OCR
        result = await image_analysis_service.extract_text_ocr(
            image_data=image_data,
            provider=vision_provider,
            languages=language_list
        )
        
        # Convert result to dict for JSON response
        response_data = {
            "extracted_text": result.extracted_text,
            "text_blocks": [
                {
                    "text": block.text,
                    "confidence": block.confidence,
                    "bounding_box": {
                        "x": block.bounding_box.x,
                        "y": block.bounding_box.y,
                        "width": block.bounding_box.width,
                        "height": block.bounding_box.height
                    }
                }
                for block in result.text_blocks
            ],
            "metadata": {
                "language": result.language,
                "processing_time": result.processing_time,
                "provider": result.provider,
                "text_blocks_count": len(result.text_blocks)
            }
        }
        
        logger.info(f"OCR completed for user {current_user.id}: {len(result.extracted_text)} characters extracted")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR failed: {e}")
        raise HTTPException(status_code=500, detail="OCR processing failed")


@router.post("/classify-image", response_model=dict)
async def classify_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Classify an image and extract visual features.
    
    Args:
        file: Image file to analyze
        current_user: Authenticated user
        
    Returns:
        Image classification results with categories and visual features
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await file.read()
        
        # Perform image classification
        result = await image_analysis_service.classify_image(image_data=image_data)
        
        # Convert result to dict for JSON response
        response_data = {
            "primary_category": result.primary_category,
            "categories": result.categories,
            "image_type": result.image_type,
            "visual_features": {
                "dominant_colors": result.visual_features.dominant_colors,
                "brightness": result.visual_features.brightness,
                "contrast": result.visual_features.contrast,
                "image_type": result.visual_features.image_type
            },
            "metadata": {
                "processing_time": result.processing_time,
                "categories_count": len(result.categories)
            }
        }
        
        logger.info(f"Image classification completed for user {current_user.id}: {result.primary_category}")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image classification failed: {e}")
        raise HTTPException(status_code=500, detail="Image classification failed")


@router.post("/analyze-batch", response_model=dict)
async def analyze_batch_images(
    files: List[UploadFile] = File(...),
    analysis_types: str = Form("objects,ocr,classification"),
    provider: str = Form("local"),
    confidence_threshold: float = Form(0.5),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze multiple images in batch.
    
    Args:
        files: List of image files to analyze
        analysis_types: Comma-separated analysis types ('objects', 'ocr', 'classification')
        provider: Vision provider for object detection and OCR
        confidence_threshold: Minimum confidence score for object detection
        current_user: Authenticated user
        
    Returns:
        Batch analysis results for all images
    """
    try:
        # Validate file count
        if len(files) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 files allowed per batch")
        
        # Parse analysis types
        analysis_list = [t.strip().lower() for t in analysis_types.split(',')]
        valid_types = {'objects', 'ocr', 'classification'}
        
        if not all(t in valid_types for t in analysis_list):
            raise HTTPException(status_code=400, detail=f"Invalid analysis types. Valid: {valid_types}")
        
        # Validate provider
        try:
            vision_provider = VisionProvider(provider.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid provider: {provider}")
        
        results = []
        
        for i, file in enumerate(files):
            try:
                # Validate file type
                if not file.content_type.startswith('image/'):
                    results.append({
                        "filename": file.filename,
                        "error": "File must be an image",
                        "success": False
                    })
                    continue
                
                # Read image data
                image_data = await file.read()
                
                file_result = {
                    "filename": file.filename,
                    "success": True,
                    "results": {}
                }
                
                # Perform requested analyses
                if 'objects' in analysis_list:
                    try:
                        obj_result = await image_analysis_service.detect_objects(
                            image_data=image_data,
                            provider=vision_provider,
                            confidence_threshold=confidence_threshold,
                            max_objects=20  # Limit for batch processing
                        )
                        file_result["results"]["objects"] = {
                            "total_objects": obj_result.total_objects,
                            "high_confidence_objects": obj_result.high_confidence_objects,
                            "categories": obj_result.categories,
                            "processing_time": obj_result.processing_time
                        }
                    except Exception as e:
                        file_result["results"]["objects"] = {"error": str(e)}
                
                if 'ocr' in analysis_list:
                    try:
                        ocr_result = await image_analysis_service.extract_text_ocr(
                            image_data=image_data,
                            provider=vision_provider,
                            languages=['en']
                        )
                        file_result["results"]["ocr"] = {
                            "text_length": len(ocr_result.extracted_text),
                            "text_blocks_count": len(ocr_result.text_blocks),
                            "language": ocr_result.language,
                            "processing_time": ocr_result.processing_time,
                            "preview": ocr_result.extracted_text[:200] + "..." if len(ocr_result.extracted_text) > 200 else ocr_result.extracted_text
                        }
                    except Exception as e:
                        file_result["results"]["ocr"] = {"error": str(e)}
                
                if 'classification' in analysis_list:
                    try:
                        class_result = await image_analysis_service.classify_image(image_data=image_data)
                        file_result["results"]["classification"] = {
                            "primary_category": class_result.primary_category,
                            "image_type": class_result.image_type,
                            "categories_count": len(class_result.categories),
                            "processing_time": class_result.processing_time
                        }
                    except Exception as e:
                        file_result["results"]["classification"] = {"error": str(e)}
                
                results.append(file_result)
                
            except Exception as e:
                results.append({
                    "filename": file.filename,
                    "error": str(e),
                    "success": False
                })
        
        # Calculate summary statistics
        successful_analyses = [r for r in results if r.get("success", False)]
        total_processing_time = sum(
            sum(
                result.get("processing_time", 0) 
                for result in file_result.get("results", {}).values() 
                if isinstance(result, dict) and "processing_time" in result
            )
            for file_result in successful_analyses
        )
        
        response_data = {
            "results": results,
            "summary": {
                "total_files": len(files),
                "successful_analyses": len(successful_analyses),
                "failed_analyses": len(files) - len(successful_analyses),
                "total_processing_time": total_processing_time,
                "analysis_types": analysis_list,
                "provider": provider
            }
        }
        
        logger.info(f"Batch analysis completed for user {current_user.id}: {len(successful_analyses)}/{len(files)} successful")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch analysis failed: {e}")
        raise HTTPException(status_code=500, detail="Batch analysis failed")


@router.get("/providers", response_model=dict)
async def get_available_providers(current_user: User = Depends(get_current_user)):
    """
    Get list of available vision providers and their capabilities.
    
    Returns:
        Available providers and their status
    """
    try:
        providers_status = {
            "google": {
                "available": image_analysis_service.google_client is not None,
                "capabilities": ["object_detection", "ocr"],
                "description": "Google Cloud Vision API"
            },
            "azure": {
                "available": image_analysis_service.azure_client is not None,
                "capabilities": ["object_detection", "ocr"],
                "description": "Azure Computer Vision API"
            },
            "aws": {
                "available": image_analysis_service.aws_client is not None,
                "capabilities": ["object_detection", "ocr"],
                "description": "AWS Rekognition and Textract"
            },
            "local": {
                "available": True,
                "capabilities": ["object_detection", "ocr", "classification"],
                "description": "Local processing with OpenCV, Tesseract, and EasyOCR"
            }
        }
        
        return {
            "providers": providers_status,
            "default_provider": "local",
            "recommended_provider": "google" if providers_status["google"]["available"] else "local"
        }
        
    except Exception as e:
        logger.error(f"Failed to get providers status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get providers status")