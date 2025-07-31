"""
Tests for NLP Service

Tests morphological analysis, sentiment analysis, text similarity, and keyword extraction.
"""

import pytest
import asyncio
from unittest.mock import Mock, patch

from app.services.nlp_service import (
    NLPService,
    MorphologicalAnalyzer,
    SentimentAnalyzer,
    TextSimilarityAnalyzer,
    KeywordExtractor,
    MorphologicalResult,
    SentimentResult,
    SimilarityResult,
    KeywordResult
)

class TestMorphologicalAnalyzer:
    """Test morphological analysis functionality"""
    
    @pytest.fixture
    def analyzer(self):
        return MorphologicalAnalyzer()
    
    @pytest.mark.asyncio
    async def test_basic_morphological_analysis(self, analyzer):
        """Test basic morphological analysis without spaCy"""
        text = "The quick brown fox jumps over the lazy dog."
        
        result = await analyzer.analyze(text)
        
        assert isinstance(result, MorphologicalResult)
        assert len(result.morphemes) > 0
        assert result.processing_time > 0
        assert 0 < result.confidence <= 1
        assert 'root' in result.structure
        assert 'word_count' in result.structure
        assert 'sentence_count' in result.structure
    
    @pytest.mark.asyncio
    async def test_empty_text_analysis(self, analyzer):
        """Test morphological analysis with empty text"""
        text = ""
        
        result = await analyzer.analyze(text)
        
        assert isinstance(result, MorphologicalResult)
        assert len(result.morphemes) == 0
        assert result.processing_time > 0
    
    @pytest.mark.asyncio
    async def test_morpheme_properties(self, analyzer):
        """Test that morphemes have required properties"""
        text = "Running quickly through the forest."
        
        result = await analyzer.analyze(text)
        
        for morpheme in result.morphemes:
            assert hasattr(morpheme, 'text')
            assert hasattr(morpheme, 'pos')
            assert hasattr(morpheme, 'lemma')
            assert hasattr(morpheme, 'features')
            assert hasattr(morpheme, 'dependency')
            assert hasattr(morpheme, 'head')
            assert isinstance(morpheme.features, list)
    
    def test_pos_guessing(self, analyzer):
        """Test POS tag guessing functionality"""
        assert analyzer._guess_pos('the') == 'DET'
        assert analyzer._guess_pos('and') == 'CONJ'
        assert analyzer._guess_pos('quickly') == 'ADV'
        assert analyzer._guess_pos('running') == 'VERB'
        assert analyzer._guess_pos('jumped') == 'VERB'
        assert analyzer._guess_pos('cats') == 'NOUN'
        assert analyzer._guess_pos('John') == 'PROPN'
    
    def test_root_word_finding(self, analyzer):
        """Test root word identification"""
        words = ['the', 'quick', 'brown', 'fox']
        root = analyzer._find_root_word(words)
        assert root in words
        assert root != 'the'  # Should not be a stop word


class TestSentimentAnalyzer:
    """Test sentiment analysis functionality"""
    
    @pytest.fixture
    def analyzer(self):
        return SentimentAnalyzer()
    
    @pytest.mark.asyncio
    async def test_positive_sentiment(self, analyzer):
        """Test positive sentiment detection"""
        text = "I love this amazing product! It's fantastic and wonderful."
        
        result = await analyzer.analyze(text)
        
        assert isinstance(result, SentimentResult)
        assert result.score > 0
        assert result.label == 'positive'
        assert 0 <= result.confidence <= 1
        assert result.processing_time > 0
        assert 'positive' in result.breakdown
        assert 'negative' in result.breakdown
        assert 'neutral' in result.breakdown
    
    @pytest.mark.asyncio
    async def test_negative_sentiment(self, analyzer):
        """Test negative sentiment detection"""
        text = "This is terrible and awful. I hate it completely."
        
        result = await analyzer.analyze(text)
        
        assert isinstance(result, SentimentResult)
        assert result.score < 0
        assert result.label == 'negative'
        assert 0 <= result.confidence <= 1
        assert result.processing_time > 0
    
    @pytest.mark.asyncio
    async def test_neutral_sentiment(self, analyzer):
        """Test neutral sentiment detection"""
        text = "The weather is cloudy today. It might rain later."
        
        result = await analyzer.analyze(text)
        
        assert isinstance(result, SentimentResult)
        assert result.label == 'neutral'
        assert 0 <= result.confidence <= 1
        assert result.processing_time > 0
    
    @pytest.mark.asyncio
    async def test_empty_text_sentiment(self, analyzer):
        """Test sentiment analysis with empty text"""
        text = ""
        
        result = await analyzer.analyze(text)
        
        assert isinstance(result, SentimentResult)
        assert result.score == 0.0
        assert result.label == 'neutral'
    
    @pytest.mark.asyncio
    async def test_sentiment_score_range(self, analyzer):
        """Test that sentiment scores are in valid range"""
        texts = [
            "Absolutely amazing and wonderful!",
            "Completely terrible and horrible!",
            "The sky is blue.",
            "Maybe it will work, maybe not."
        ]
        
        for text in texts:
            result = await analyzer.analyze(text)
            assert -1.0 <= result.score <= 1.0
            assert 0 <= result.confidence <= 1.0


class TestTextSimilarityAnalyzer:
    """Test text similarity analysis functionality"""
    
    @pytest.fixture
    def analyzer(self):
        return TextSimilarityAnalyzer()
    
    @pytest.mark.asyncio
    async def test_identical_texts(self, analyzer):
        """Test similarity of identical texts"""
        text = "The quick brown fox jumps over the lazy dog."
        
        result = await analyzer.analyze(text, text)
        
        assert isinstance(result, SimilarityResult)
        assert result.similarity_score == 100.0
        assert result.processing_time > 0
    
    @pytest.mark.asyncio
    async def test_completely_different_texts(self, analyzer):
        """Test similarity of completely different texts"""
        text1 = "The weather is sunny today."
        text2 = "Programming languages are fascinating tools."
        
        result = await analyzer.analyze(text1, text2)
        
        assert isinstance(result, SimilarityResult)
        assert result.similarity_score < 50.0
        assert result.processing_time > 0
    
    @pytest.mark.asyncio
    async def test_similar_texts(self, analyzer):
        """Test similarity of similar texts"""
        text1 = "The quick brown fox jumps over the lazy dog."
        text2 = "A quick brown fox jumped over a lazy dog."
        
        result = await analyzer.analyze(text1, text2)
        
        assert isinstance(result, SimilarityResult)
        assert 50.0 < result.similarity_score < 100.0
        assert result.processing_time > 0
    
    @pytest.mark.asyncio
    async def test_empty_texts(self, analyzer):
        """Test similarity with empty texts"""
        result1 = await analyzer.analyze("", "")
        assert result1.similarity_score == 100.0
        
        result2 = await analyzer.analyze("Hello", "")
        assert result2.similarity_score == 0.0
    
    @pytest.mark.asyncio
    async def test_matched_segments(self, analyzer):
        """Test matched segments identification"""
        text1 = "The quick brown fox jumps over the lazy dog."
        text2 = "The quick brown cat jumps over the lazy mouse."
        
        result = await analyzer.analyze(text1, text2)
        
        assert isinstance(result.matched_segments, list)
        # Should find some matching segments
        if result.matched_segments:
            for segment in result.matched_segments:
                assert 'text1' in segment
                assert 'text2' in segment
                assert 'similarity' in segment
    
    def test_sequence_similarity(self, analyzer):
        """Test sequence similarity calculation"""
        similarity = analyzer._sequence_similarity("hello", "hello")
        assert similarity == 1.0
        
        similarity = analyzer._sequence_similarity("hello", "world")
        assert 0 <= similarity <= 1.0
    
    def test_word_similarity(self, analyzer):
        """Test word-level similarity calculation"""
        similarity = analyzer._word_similarity("hello world", "hello world")
        assert similarity == 1.0
        
        similarity = analyzer._word_similarity("hello world", "goodbye universe")
        assert similarity == 0.0
        
        similarity = analyzer._word_similarity("hello world", "hello universe")
        assert 0 < similarity < 1.0


class TestKeywordExtractor:
    """Test keyword extraction functionality"""
    
    @pytest.fixture
    def extractor(self):
        return KeywordExtractor()
    
    @pytest.mark.asyncio
    async def test_keyword_extraction(self, extractor):
        """Test basic keyword extraction"""
        text = """
        Machine learning is a fascinating field of artificial intelligence.
        Machine learning algorithms can learn from data and make predictions.
        Data science and machine learning are closely related fields.
        """
        
        result = await extractor.analyze(text)
        
        assert isinstance(result, KeywordResult)
        assert len(result.keywords) > 0
        assert len(result.word_cloud) > 0
        assert result.processing_time > 0
        
        # Check that 'machine' and 'learning' are top keywords
        keyword_words = [kw['word'] for kw in result.keywords]
        assert 'machine' in keyword_words or 'learning' in keyword_words
    
    @pytest.mark.asyncio
    async def test_keyword_properties(self, extractor):
        """Test that keywords have required properties"""
        text = "Python programming is fun and educational. Python is powerful."
        
        result = await extractor.analyze(text)
        
        for keyword in result.keywords:
            assert 'word' in keyword
            assert 'frequency' in keyword
            assert 'importance' in keyword
            assert keyword['frequency'] > 0
            assert keyword['importance'] > 0
    
    @pytest.mark.asyncio
    async def test_word_cloud_properties(self, extractor):
        """Test word cloud data properties"""
        text = "Data analysis and data visualization are important data skills."
        
        result = await extractor.analyze(text)
        
        for word_item in result.word_cloud:
            assert 'word' in word_item
            assert 'size' in word_item
            assert 'color' in word_item
            assert 'frequency' in word_item
            assert 20 <= word_item['size'] <= 100  # Size range
            assert word_item['color'].startswith('#')  # Hex color
    
    @pytest.mark.asyncio
    async def test_options_handling(self, extractor):
        """Test keyword extraction with options"""
        text = "Python programming is fun. Python is powerful. Programming is creative."
        
        # Test with max_keywords limit
        result = await extractor.analyze(text, {'max_keywords': 2})
        assert len(result.keywords) <= 2
        
        # Test with min_frequency filter
        result = await extractor.analyze(text, {'min_frequency': 2})
        for keyword in result.keywords:
            assert keyword['frequency'] >= 2
    
    @pytest.mark.asyncio
    async def test_empty_text(self, extractor):
        """Test keyword extraction with empty text"""
        text = ""
        
        result = await extractor.analyze(text)
        
        assert isinstance(result, KeywordResult)
        assert len(result.keywords) == 0
        assert len(result.word_cloud) == 0
    
    def test_tokenize_and_clean(self, extractor):
        """Test text tokenization and cleaning"""
        text = "The quick brown fox jumps over the lazy dog!"
        
        words = extractor._tokenize_and_clean(text)
        
        # Should remove stop words and punctuation
        assert 'the' not in words
        assert 'over' not in words
        assert 'quick' in words
        assert 'brown' in words
        assert 'fox' in words
        assert '!' not in words


class TestNLPService:
    """Test main NLP service coordination"""
    
    @pytest.fixture
    def service(self):
        return NLPService()
    
    @pytest.mark.asyncio
    async def test_comprehensive_analysis(self, service):
        """Test comprehensive NLP analysis"""
        text = "I love this amazing product! It works perfectly."
        analysis_types = ['morphological', 'sentiment', 'keywords']
        
        results = await service.analyze_text(text, analysis_types)
        
        assert 'morphological' in results
        assert 'sentiment' in results
        assert 'keywords' in results
        
        assert isinstance(results['morphological'], MorphologicalResult)
        assert isinstance(results['sentiment'], SentimentResult)
        assert isinstance(results['keywords'], KeywordResult)
    
    @pytest.mark.asyncio
    async def test_selective_analysis(self, service):
        """Test selective analysis types"""
        text = "This is a test sentence."
        
        # Test only sentiment
        results = await service.analyze_text(text, ['sentiment'])
        assert 'sentiment' in results
        assert 'morphological' not in results
        assert 'keywords' not in results
        
        # Test only keywords
        results = await service.analyze_text(text, ['keywords'])
        assert 'keywords' in results
        assert 'sentiment' not in results
        assert 'morphological' not in results
    
    @pytest.mark.asyncio
    async def test_text_comparison(self, service):
        """Test text comparison functionality"""
        text1 = "The quick brown fox"
        text2 = "The quick brown cat"
        
        result = await service.compare_texts(text1, text2)
        
        assert isinstance(result, SimilarityResult)
        assert 0 <= result.similarity_score <= 100
        assert result.processing_time > 0
    
    @pytest.mark.asyncio
    async def test_batch_analysis(self, service):
        """Test batch analysis functionality"""
        texts = [
            "This is great!",
            "This is terrible.",
            "This is okay."
        ]
        analysis_types = ['sentiment']
        
        results = await service.batch_analysis(texts, analysis_types)
        
        assert len(results) == len(texts)
        for result in results:
            assert 'sentiment' in result
            assert isinstance(result['sentiment'], SentimentResult)
    
    @pytest.mark.asyncio
    async def test_analysis_with_options(self, service):
        """Test analysis with custom options"""
        text = "Python programming is fun and educational."
        options = {
            'max_keywords': 3,
            'min_frequency': 1
        }
        
        results = await service.analyze_text(text, ['keywords'], options)
        
        assert 'keywords' in results
        assert len(results['keywords'].keywords) <= 3


# Integration tests

@pytest.mark.asyncio
async def test_nlp_service_initialization():
    """Test that NLP service initializes correctly"""
    service = NLPService()
    
    assert service.morphological_analyzer is not None
    assert service.sentiment_analyzer is not None
    assert service.similarity_analyzer is not None
    assert service.keyword_extractor is not None

@pytest.mark.asyncio
async def test_error_handling():
    """Test error handling in NLP service"""
    service = NLPService()
    
    # Test with very long text (should handle gracefully)
    long_text = "word " * 10000
    
    try:
        results = await service.analyze_text(long_text, ['sentiment'])
        assert 'sentiment' in results
    except Exception as e:
        # Should not raise unhandled exceptions
        assert False, f"Unexpected exception: {e}"

@pytest.mark.asyncio 
async def test_concurrent_analysis():
    """Test concurrent analysis requests"""
    service = NLPService()
    
    texts = [f"Test sentence number {i}" for i in range(10)]
    
    # Run multiple analyses concurrently
    tasks = [
        service.analyze_text(text, ['sentiment'])
        for text in texts
    ]
    
    results = await asyncio.gather(*tasks)
    
    assert len(results) == len(texts)
    for result in results:
        assert 'sentiment' in result