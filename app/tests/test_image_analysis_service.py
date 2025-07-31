"""
Tests for Image Analysis Service.
"""

import pytest
import asyncio
import base64
import io
from PIL import Image, ImageDraw
import numpy as np

from app.services.image_analysis_service import (
    ImageAnalysisService,
    VisionProvider,
    BoundingBox,
    DetectedObject,
    OCRTextBlock,
    ObjectDetectionResult,
    OCRResult,
    ImageClassificationResult,
    VisualFeatures
)


class TestImageAnalysisService:
    """Test cases for ImageAnalysisService."""
    
    @pytest.fixture
    def service(self):
        """Create ImageAnalysisService instance."""
        return ImageAnalysisService()
    
    @pytest.fixture
    def sample_image_bytes(self):
        """Create a sample image as bytes."""
        # Create a simple test image
        image = Image.new('RGB', (100, 100), color='red')
        draw = ImageDraw.Draw(image)
        draw.rectangle([20, 20, 80, 80], fill='blue')
        draw.text((30, 30), "TEST", fill='white')
        
        # Convert to bytes
        img_buffer = io.BytesIO()
        image.save(img_buffer, format='PNG')
        return img_buffer.getvalue()
    
    @pytest.fixture
    def sample_text_image_bytes(self):
        """Create a sample image with text."""
        image = Image.new('RGB', (200, 100), color='white')
        draw = ImageDraw.Draw(image)
        draw.text((10, 30), "Hello World!", fill='black')
        draw.text((10, 50), "This is a test", fill='black')
        
        # Convert to bytes
        img_buffer = io.BytesIO()
        image.save(img_buffer, format='PNG')
        return img_buffer.getvalue()
    
    @pytest.mark.asyncio
    async def test_local_object_detection(self, service, sample_image_bytes):
        """Test local object detection."""
        result = await service.detect_objects(
            image_data=sample_image_bytes,
            provider=VisionProvider.LOCAL,
            confidence_threshold=0.1,
            max_objects=10
        )
        
        assert isinstance(result, ObjectDetectionResult)
        assert result.provider == "local"
        assert result.total_objects >= 0
        assert result.processing_time > 0
        assert isinstance(result.objects, list)
        assert isinstance(result.categories, list)
        
        # Check object structure if any objects detected
        if result.objects:
            obj = result.objects[0]
            assert isinstance(obj, DetectedObject)
            assert isinstance(obj.label, str)
            assert 0 <= obj.confidence <= 1
            assert isinstance(obj.bounding_box, BoundingBox)
            assert obj.category in ['literal', 'inferred']
    
    @pytest.mark.asyncio
    async def test_local_ocr(self, service, sample_text_image_bytes):
        """Test local OCR text extraction."""
        result = await service.extract_text_ocr(
            image_data=sample_text_image_bytes,
            provider=VisionProvider.LOCAL,
            languages=['en']
        )
        
        assert isinstance(result, OCRResult)
        assert result.provider == "local"
        assert result.processing_time > 0
        assert isinstance(result.extracted_text, str)
        assert isinstance(result.text_blocks, list)
        assert result.language == "en"
        
        # Should extract some text from our test image
        assert len(result.extracted_text.strip()) > 0
        
        # Check text block structure if any blocks detected
        if result.text_blocks:
            block = result.text_blocks[0]
            assert isinstance(block, OCRTextBlock)
            assert isinstance(block.text, str)
            assert 0 <= block.confidence <= 1
            assert isinstance(block.bounding_box, BoundingBox)
    
    @pytest.mark.asyncio
    async def test_image_classification(self, service, sample_image_bytes):
        """Test image classification."""
        result = await service.classify_image(image_data=sample_image_bytes)
        
        assert isinstance(result, ImageClassificationResult)
        assert result.processing_time > 0
        assert isinstance(result.primary_category, str)
        assert isinstance(result.categories, list)
        assert result.image_type in ['photo', 'graphic', 'text', 'mixed']
        assert isinstance(result.visual_features, VisualFeatures)
        
        # Check visual features
        features = result.visual_features
        assert isinstance(features.dominant_colors, list)
        assert len(features.dominant_colors) > 0
        assert 0 <= features.brightness <= 1
        assert features.contrast >= 0
        assert features.image_type in ['photo', 'graphic', 'text']
        
        # Check categories structure
        if result.categories:
            category = result.categories[0]
            assert isinstance(category, dict)
            assert "name" in category
            assert "confidence" in category
            assert 0 <= category["confidence"] <= 1
    
    def test_visual_features_extraction(self, service):
        """Test visual features extraction."""
        # Create test image with known properties
        image = Image.new('RGB', (100, 100), color=(255, 0, 0))  # Red image
        
        features = service._extract_visual_features(image)
        
        assert isinstance(features, VisualFeatures)
        assert isinstance(features.dominant_colors, list)
        assert len(features.dominant_colors) > 0
        assert features.dominant_colors[0] == "#ff0000"  # Should detect red
        assert 0 <= features.brightness <= 1
        assert features.contrast >= 0
        assert features.image_type in ['photo', 'graphic', 'text']
    
    def test_image_type_classification(self, service):
        """Test image type classification."""
        # Test with different image types
        
        # High contrast image (likely text)
        text_image = Image.new('RGB', (100, 100), color='white')
        draw = ImageDraw.Draw(text_image)
        draw.text((10, 10), "TEXT", fill='black')
        
        text_type = service._classify_image_type(text_image)
        # Should classify as text or graphic due to high contrast
        assert text_type in ['text', 'graphic']
        
        # Low contrast image (likely graphic)
        graphic_image = Image.new('RGB', (100, 100), color=(128, 128, 128))
        graphic_type = service._classify_image_type(graphic_image)
        assert graphic_type in ['graphic', 'photo']
    
    def test_image_categories_classification(self, service):
        """Test image categories classification."""
        # Create image with known visual features
        image = Image.new('RGB', (100, 100), color=(0, 255, 0))  # Green image
        features = VisualFeatures(
            dominant_colors=["#00ff00"],
            brightness=0.5,
            contrast=0.3,
            image_type="photo"
        )
        
        categories = service._classify_image_categories(image, features)
        
        assert isinstance(categories, list)
        assert len(categories) > 0
        
        # Should detect nature category due to green color
        category_names = [cat["name"] for cat in categories]
        assert "nature" in category_names
        
        # Check category structure
        for category in categories:
            assert isinstance(category, dict)
            assert "name" in category
            assert "confidence" in category
            assert 0 <= category["confidence"] <= 1
    
    @pytest.mark.asyncio
    async def test_base64_input(self, service, sample_image_bytes):
        """Test handling of base64 encoded image input."""
        # Convert bytes to base64
        base64_data = base64.b64encode(sample_image_bytes).decode('utf-8')
        
        result = await service.detect_objects(
            image_data=base64_data,
            provider=VisionProvider.LOCAL,
            confidence_threshold=0.1
        )
        
        assert isinstance(result, ObjectDetectionResult)
        assert result.provider == "local"
    
    @pytest.mark.asyncio
    async def test_invalid_image_data(self, service):
        """Test handling of invalid image data."""
        invalid_data = b"not an image"
        
        with pytest.raises(Exception):
            await service.detect_objects(
                image_data=invalid_data,
                provider=VisionProvider.LOCAL
            )
    
    @pytest.mark.asyncio
    async def test_confidence_threshold_filtering(self, service, sample_image_bytes):
        """Test that confidence threshold properly filters results."""
        # Test with very high threshold
        high_threshold_result = await service.detect_objects(
            image_data=sample_image_bytes,
            provider=VisionProvider.LOCAL,
            confidence_threshold=0.9
        )
        
        # Test with low threshold
        low_threshold_result = await service.detect_objects(
            image_data=sample_image_bytes,
            provider=VisionProvider.LOCAL,
            confidence_threshold=0.1
        )
        
        # Low threshold should return same or more objects
        assert low_threshold_result.total_objects >= high_threshold_result.total_objects
        
        # All returned objects should meet confidence threshold
        for obj in high_threshold_result.objects:
            assert obj.confidence >= 0.9
        
        for obj in low_threshold_result.objects:
            assert obj.confidence >= 0.1
    
    @pytest.mark.asyncio
    async def test_max_objects_limit(self, service, sample_image_bytes):
        """Test that max_objects parameter limits results."""
        result = await service.detect_objects(
            image_data=sample_image_bytes,
            provider=VisionProvider.LOCAL,
            confidence_threshold=0.1,
            max_objects=3
        )
        
        assert len(result.objects) <= 3
        assert result.total_objects <= 3
    
    def test_bounding_box_structure(self):
        """Test BoundingBox data structure."""
        bbox = BoundingBox(x=0.1, y=0.2, width=0.3, height=0.4)
        
        assert bbox.x == 0.1
        assert bbox.y == 0.2
        assert bbox.width == 0.3
        assert bbox.height == 0.4
    
    def test_detected_object_structure(self):
        """Test DetectedObject data structure."""
        bbox = BoundingBox(x=0.1, y=0.2, width=0.3, height=0.4)
        obj = DetectedObject(
            label="test_object",
            confidence=0.85,
            bounding_box=bbox,
            category="literal"
        )
        
        assert obj.label == "test_object"
        assert obj.confidence == 0.85
        assert obj.bounding_box == bbox
        assert obj.category == "literal"
    
    def test_ocr_text_block_structure(self):
        """Test OCRTextBlock data structure."""
        bbox = BoundingBox(x=0.1, y=0.2, width=0.3, height=0.4)
        block = OCRTextBlock(
            text="sample text",
            confidence=0.9,
            bounding_box=bbox
        )
        
        assert block.text == "sample text"
        assert block.confidence == 0.9
        assert block.bounding_box == bbox


@pytest.mark.integration
class TestImageAnalysisIntegration:
    """Integration tests for image analysis with external services."""
    
    @pytest.fixture
    def service(self):
        """Create ImageAnalysisService instance."""
        return ImageAnalysisService()
    
    @pytest.mark.asyncio
    async def test_provider_fallback(self, service, sample_image_bytes):
        """Test fallback to local processing when cloud providers fail."""
        # This test assumes cloud providers are not configured
        result = await service.detect_objects(
            image_data=sample_image_bytes,
            provider=VisionProvider.GOOGLE,  # Will fallback to local
            confidence_threshold=0.1
        )
        
        # Should fallback to local processing
        assert result.provider == "local"
        assert isinstance(result, ObjectDetectionResult)
    
    def test_provider_initialization(self, service):
        """Test that service initializes available providers correctly."""
        # Service should always have local processing available
        assert hasattr(service, 'easyocr_reader')
        
        # Cloud providers depend on configuration
        # These will be None if not configured, which is expected
        assert hasattr(service, 'google_client')
        assert hasattr(service, 'azure_client')
        assert hasattr(service, 'aws_client')