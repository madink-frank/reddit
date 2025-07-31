"""
Image Analysis Service for object detection, OCR, and image classification.
Supports multiple computer vision APIs and local processing.
"""

import asyncio
import base64
import io
import logging
import os
from typing import Dict, List, Optional, Tuple, Union
from dataclasses import dataclass
from enum import Enum

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("OpenCV not available. Image analysis will be limited.")

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    print("NumPy not available. Image analysis will be limited.")

try:
    from PIL import Image, ImageStat
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("PIL not available. Image analysis will be limited.")

try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False
    print("Pytesseract not available. OCR will be limited.")

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    print("EasyOCR not available. OCR will be limited.")

# Optional cloud vision imports (graceful fallback if not configured)
try:
    from google.cloud import vision as google_vision
    GOOGLE_VISION_AVAILABLE = True
except ImportError:
    GOOGLE_VISION_AVAILABLE = False

try:
    from azure.cognitiveservices.vision.computervision import ComputerVisionClient
    from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
    from msrest.authentication import CognitiveServicesCredentials
    AZURE_VISION_AVAILABLE = True
except ImportError:
    AZURE_VISION_AVAILABLE = False

try:
    import boto3
    AWS_REKOGNITION_AVAILABLE = True
except ImportError:
    AWS_REKOGNITION_AVAILABLE = False

logger = logging.getLogger(__name__)


class VisionProvider(Enum):
    """Supported computer vision providers."""
    GOOGLE = "google"
    AZURE = "azure"
    AWS = "aws"
    LOCAL = "local"


@dataclass
class BoundingBox:
    """Bounding box coordinates."""
    x: float
    y: float
    width: float
    height: float


@dataclass
class DetectedObject:
    """Detected object with metadata."""
    label: str
    confidence: float
    bounding_box: BoundingBox
    category: str  # 'literal' or 'inferred'


@dataclass
class OCRTextBlock:
    """OCR extracted text block."""
    text: str
    confidence: float
    bounding_box: BoundingBox


@dataclass
class ObjectDetectionResult:
    """Object detection analysis result."""
    objects: List[DetectedObject]
    total_objects: int
    high_confidence_objects: int
    categories: List[str]
    processing_time: float
    provider: str


@dataclass
class OCRResult:
    """OCR analysis result."""
    extracted_text: str
    text_blocks: List[OCRTextBlock]
    language: str
    processing_time: float
    provider: str


@dataclass
class VisualFeatures:
    """Visual features of an image."""
    dominant_colors: List[str]
    brightness: float
    contrast: float
    image_type: str  # 'photo', 'graphic', 'text', 'mixed'


@dataclass
class ImageClassificationResult:
    """Image classification result."""
    primary_category: str
    categories: List[Dict[str, float]]  # [{"name": str, "confidence": float}]
    image_type: str
    visual_features: VisualFeatures
    processing_time: float


class ImageAnalysisService:
    """Service for comprehensive image analysis including object detection, OCR, and classification."""
    
    def __init__(self):
        self.google_client = None
        self.azure_client = None
        self.aws_client = None
        self.easyocr_reader = None
        
        # Initialize available providers
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize available computer vision providers."""
        # Google Cloud Vision
        if GOOGLE_VISION_AVAILABLE and os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
            try:
                self.google_client = google_vision.ImageAnnotatorClient()
                logger.info("Google Cloud Vision initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Google Vision: {e}")
        
        # Azure Computer Vision
        if AZURE_VISION_AVAILABLE and os.getenv('AZURE_VISION_KEY') and os.getenv('AZURE_VISION_ENDPOINT'):
            try:
                self.azure_client = ComputerVisionClient(
                    os.getenv('AZURE_VISION_ENDPOINT'),
                    CognitiveServicesCredentials(os.getenv('AZURE_VISION_KEY'))
                )
                logger.info("Azure Computer Vision initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Azure Vision: {e}")
        
        # AWS Rekognition
        if AWS_REKOGNITION_AVAILABLE and os.getenv('AWS_ACCESS_KEY_ID'):
            try:
                self.aws_client = boto3.client(
                    'rekognition',
                    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                    region_name=os.getenv('AWS_REGION', 'us-east-1')
                )
                logger.info("AWS Rekognition initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize AWS Rekognition: {e}")
        
        # EasyOCR for local processing
        try:
            self.easyocr_reader = easyocr.Reader(['en'])  # Start with English, can be expanded
            logger.info("EasyOCR initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize EasyOCR: {e}")
    
    async def detect_objects(
        self,
        image_data: Union[bytes, str],
        provider: VisionProvider = VisionProvider.LOCAL,
        confidence_threshold: float = 0.5,
        max_objects: int = 50
    ) -> ObjectDetectionResult:
        """
        Detect objects in an image using specified provider.
        
        Args:
            image_data: Image data as bytes or base64 string
            provider: Vision provider to use
            confidence_threshold: Minimum confidence score (0-1)
            max_objects: Maximum number of objects to return
            
        Returns:
            ObjectDetectionResult with detected objects
        """
        import time
        start_time = time.time()
        
        # Convert image data to bytes if needed
        if isinstance(image_data, str):
            image_data = base64.b64decode(image_data)
        
        try:
            # For now, only implement local processing
            result = await self._detect_objects_local(image_data, confidence_threshold, max_objects)
            result.processing_time = time.time() - start_time
            return result
            
        except Exception as e:
            logger.error(f"Object detection failed with {provider.value}: {e}")
            raise
    
    async def _detect_objects_local(self, image_data: bytes, confidence_threshold: float, max_objects: int) -> ObjectDetectionResult:
        """Local object detection using OpenCV and basic image processing."""
        # Convert bytes to OpenCV image
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Invalid image data")
        
        detected_objects = []
        
        # Basic object detection using contours and shapes
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        height, width = img.shape[:2]
        
        for i, contour in enumerate(contours[:max_objects]):
            # Calculate contour properties
            area = cv2.contourArea(contour)
            if area < 100:  # Skip very small contours
                continue
            
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            
            # Normalize coordinates
            bbox = BoundingBox(
                x=x / width,
                y=y / height,
                width=w / width,
                height=h / height
            )
            
            # Simple shape classification
            approx = cv2.approxPolyDP(contour, 0.02 * cv2.arcLength(contour, True), True)
            vertices = len(approx)
            
            if vertices == 3:
                label = "triangle"
            elif vertices == 4:
                label = "rectangle"
            elif vertices > 8:
                label = "circle"
            else:
                label = "polygon"
            
            # Confidence based on contour properties
            confidence = min(0.9, area / (width * height) * 10)  # Simple heuristic
            
            if confidence >= confidence_threshold:
                detected_objects.append(DetectedObject(
                    label=label,
                    confidence=confidence,
                    bounding_box=bbox,
                    category='literal'
                ))
        
        high_confidence = len([obj for obj in detected_objects if obj.confidence >= 0.8])
        categories = list(set([obj.label for obj in detected_objects]))
        
        return ObjectDetectionResult(
            objects=detected_objects,
            total_objects=len(detected_objects),
            high_confidence_objects=high_confidence,
            categories=categories,
            processing_time=0.0,
            provider="local"
        )

    async def extract_text_ocr(
        self,
        image_data: Union[bytes, str],
        provider: VisionProvider = VisionProvider.LOCAL,
        languages: List[str] = None
    ) -> OCRResult:
        """
        Extract text from image using OCR.
        
        Args:
            image_data: Image data as bytes or base64 string
            provider: OCR provider to use
            languages: List of language codes (e.g., ['en', 'es'])
            
        Returns:
            OCRResult with extracted text and metadata
        """
        import time
        start_time = time.time()
        
        if languages is None:
            languages = ['en']
        
        # Convert image data to bytes if needed
        if isinstance(image_data, str):
            image_data = base64.b64decode(image_data)
        
        try:
            result = await self._extract_text_local(image_data, languages)
            result.processing_time = time.time() - start_time
            return result
            
        except Exception as e:
            logger.error(f"OCR failed with {provider.value}: {e}")
            raise
    
    async def _extract_text_local(self, image_data: bytes, languages: List[str]) -> OCRResult:
        """Extract text using local OCR (Tesseract and EasyOCR)."""
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        text_blocks = []
        full_text = ""
        
        try:
            # Try EasyOCR first (better for multi-language)
            if self.easyocr_reader:
                results = self.easyocr_reader.readtext(np.array(image))
                
                full_text_parts = []
                for (bbox_coords, text, confidence) in results:
                    full_text_parts.append(text)
                    
                    # Convert EasyOCR bbox format
                    x_coords = [point[0] for point in bbox_coords]
                    y_coords = [point[1] for point in bbox_coords]
                    
                    bbox = BoundingBox(
                        x=min(x_coords) / image.width,
                        y=min(y_coords) / image.height,
                        width=(max(x_coords) - min(x_coords)) / image.width,
                        height=(max(y_coords) - min(y_coords)) / image.height
                    )
                    
                    text_blocks.append(OCRTextBlock(
                        text=text,
                        confidence=confidence,
                        bounding_box=bbox
                    ))
                
                full_text = " ".join(full_text_parts)
            
            else:
                # Fallback to Tesseract
                full_text = pytesseract.image_to_string(image)
                
                # Get word-level data for bounding boxes
                data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
                
                for i in range(len(data['text'])):
                    if int(data['conf'][i]) > 0:  # Only include confident detections
                        bbox = BoundingBox(
                            x=data['left'][i] / image.width,
                            y=data['top'][i] / image.height,
                            width=data['width'][i] / image.width,
                            height=data['height'][i] / image.height
                        )
                        
                        text_blocks.append(OCRTextBlock(
                            text=data['text'][i],
                            confidence=data['conf'][i] / 100.0,
                            bounding_box=bbox
                        ))
        
        except Exception as e:
            logger.error(f"Local OCR failed: {e}")
            full_text = ""
            text_blocks = []
        
        # Simple language detection
        detected_language = languages[0] if languages else "en"
        
        return OCRResult(
            extracted_text=full_text,
            text_blocks=text_blocks,
            language=detected_language,
            processing_time=0.0,
            provider="local"
        )
    
    async def classify_image(self, image_data: Union[bytes, str]) -> ImageClassificationResult:
        """
        Classify image and extract visual features.
        
        Args:
            image_data: Image data as bytes or base64 string
            
        Returns:
            ImageClassificationResult with classification and features
        """
        import time
        start_time = time.time()
        
        # Convert image data to bytes if needed
        if isinstance(image_data, str):
            image_data = base64.b64decode(image_data)
        
        # Convert to PIL Image for analysis
        image = Image.open(io.BytesIO(image_data))
        
        # Extract visual features
        visual_features = self._extract_visual_features(image)
        
        # Basic image type classification
        image_type = self._classify_image_type(image)
        
        # Simple category classification based on visual features
        categories = self._classify_image_categories(image, visual_features)
        
        primary_category = categories[0]["name"] if categories else "unknown"
        
        processing_time = time.time() - start_time
        
        return ImageClassificationResult(
            primary_category=primary_category,
            categories=categories,
            image_type=image_type,
            visual_features=visual_features,
            processing_time=processing_time
        )
    
    def _extract_visual_features(self, image: Image.Image) -> VisualFeatures:
        """Extract visual features from image."""
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Get dominant colors
        colors = image.getcolors(maxcolors=256*256*256)
        if colors:
            # Sort by frequency and get top colors
            colors.sort(key=lambda x: x[0], reverse=True)
            dominant_colors = []
            for count, color in colors[:5]:
                hex_color = "#{:02x}{:02x}{:02x}".format(*color)
                dominant_colors.append(hex_color)
        else:
            dominant_colors = ["#000000"]
        
        # Calculate brightness and contrast
        stat = ImageStat.Stat(image)
        brightness = sum(stat.mean) / len(stat.mean) / 255.0
        contrast = sum(stat.stddev) / len(stat.stddev) / 255.0
        
        # Determine image type based on characteristics
        if contrast < 0.1:
            image_type = "graphic"
        elif brightness > 0.8:
            image_type = "text"
        else:
            image_type = "photo"
        
        return VisualFeatures(
            dominant_colors=dominant_colors,
            brightness=brightness,
            contrast=contrast,
            image_type=image_type
        )
    
    def _classify_image_type(self, image: Image.Image) -> str:
        """Classify the type of image."""
        # Convert to OpenCV format for analysis
        cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
        
        # Detect edges
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size
        
        # Analyze color distribution
        hist = cv2.calcHist([cv_image], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
        color_diversity = np.count_nonzero(hist) / hist.size
        
        # Classification logic
        if edge_density > 0.1 and color_diversity < 0.1:
            return "text"
        elif color_diversity < 0.05:
            return "graphic"
        elif edge_density < 0.05:
            return "graphic"
        else:
            return "photo"
    
    def _classify_image_categories(self, image: Image.Image, features: VisualFeatures) -> List[Dict[str, float]]:
        """Classify image into categories based on visual features."""
        categories = []
        
        # Color-based classification
        dominant_color = features.dominant_colors[0] if features.dominant_colors else "#000000"
        
        # Convert hex to RGB
        r = int(dominant_color[1:3], 16)
        g = int(dominant_color[3:5], 16)
        b = int(dominant_color[5:7], 16)
        
        # Simple heuristic-based categorization
        if features.brightness > 0.8:
            categories.append({"name": "bright", "confidence": 0.8})
        elif features.brightness < 0.2:
            categories.append({"name": "dark", "confidence": 0.8})
        
        if features.contrast > 0.5:
            categories.append({"name": "high_contrast", "confidence": 0.7})
        
        # Color-based categories
        if g > r and g > b:
            categories.append({"name": "nature", "confidence": 0.6})
        elif b > r and b > g:
            categories.append({"name": "sky_water", "confidence": 0.6})
        elif r > g and r > b:
            categories.append({"name": "warm_tones", "confidence": 0.6})
        
        # Image type categories
        if features.image_type == "text":
            categories.append({"name": "document", "confidence": 0.9})
        elif features.image_type == "graphic":
            categories.append({"name": "illustration", "confidence": 0.8})
        else:
            categories.append({"name": "photograph", "confidence": 0.7})
        
        # Sort by confidence
        categories.sort(key=lambda x: x["confidence"], reverse=True)
        
        return categories[:10]  # Return top 10 categories


# Global service instance
image_analysis_service = ImageAnalysisService()