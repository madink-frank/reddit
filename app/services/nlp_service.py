"""
NLP Analysis Service

Provides comprehensive natural language processing capabilities including:
- Morphological analysis with POS tagging
- Sentiment analysis
- Text similarity and duplicate detection
- Keyword extraction and word cloud generation
"""

import re
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from collections import Counter, defaultdict
import asyncio
from datetime import datetime

# We'll use spaCy for morphological analysis and NLTK for additional features
try:
    import spacy
    from spacy.tokens import Doc, Token
    HAS_SPACY = True
except ImportError:
    spacy = None
    Doc = None
    Token = None
    HAS_SPACY = False

try:
    import nltk
    from nltk.sentiment import SentimentIntensityAnalyzer
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize, sent_tokenize
    from nltk.stem import WordNetLemmatizer
except ImportError:
    nltk = None

from difflib import SequenceMatcher
import math

logger = logging.getLogger(__name__)

@dataclass
class MorphemeInfo:
    """Information about a morpheme"""
    text: str
    pos: str  # part of speech
    lemma: str
    features: List[str]
    dependency: str
    head: str

@dataclass
class MorphologicalResult:
    """Result of morphological analysis"""
    morphemes: List[MorphemeInfo]
    structure: Dict[str, Any]
    processing_time: float
    confidence: float

@dataclass
class SentimentResult:
    """Result of sentiment analysis"""
    score: float  # -1 to 1
    confidence: float
    label: str  # positive, negative, neutral
    breakdown: Dict[str, float]
    processing_time: float

@dataclass
class SimilarityResult:
    """Result of text similarity analysis"""
    similarity_score: float  # 0 to 100
    matched_segments: List[Dict[str, Any]]
    processing_time: float

@dataclass
class KeywordResult:
    """Result of keyword extraction"""
    keywords: List[Dict[str, Any]]
    word_cloud: List[Dict[str, Any]]
    processing_time: float

class MorphologicalAnalyzer:
    """Morphological analysis engine with POS tagging"""
    
    def __init__(self):
        self.nlp = None
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize spaCy model for morphological analysis"""
        if spacy is None:
            logger.warning("spaCy not available. Morphological analysis will be limited.")
            return
        
        try:
            # Try to load English model
            self.nlp = spacy.load("en_core_web_sm")
            logger.info("spaCy English model loaded successfully")
        except OSError:
            logger.warning("spaCy English model not found. Please install with: python -m spacy download en_core_web_sm")
            self.nlp = None
    
    async def analyze(self, text: str, options: Optional[Dict] = None) -> MorphologicalResult:
        """
        Perform morphological analysis on text
        
        Args:
            text: Input text to analyze
            options: Analysis options (language, etc.)
        
        Returns:
            MorphologicalResult with morphemes and structure
        """
        start_time = datetime.now()
        
        if not self.nlp:
            # Fallback to basic analysis without spaCy
            return await self._basic_morphological_analysis(text, start_time)
        
        try:
            # Process text with spaCy
            doc = self.nlp(text)
            
            morphemes = []
            for token in doc:
                morpheme = MorphemeInfo(
                    text=token.text,
                    pos=token.pos_,
                    lemma=token.lemma_,
                    features=[
                        f"tag={token.tag_}",
                        f"shape={token.shape_}",
                        f"is_alpha={token.is_alpha}",
                        f"is_stop={token.is_stop}",
                        f"is_punct={token.is_punct}"
                    ],
                    dependency=token.dep_,
                    head=token.head.text if token.head != token else "ROOT"
                )
                morphemes.append(morpheme)
            
            # Extract linguistic structure
            structure = self._extract_structure(doc)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return MorphologicalResult(
                morphemes=morphemes,
                structure=structure,
                processing_time=processing_time,
                confidence=0.9  # High confidence with spaCy
            )
            
        except Exception as e:
            logger.error(f"Error in morphological analysis: {e}")
            return await self._basic_morphological_analysis(text, start_time)
    
    async def _basic_morphological_analysis(self, text: str, start_time: datetime) -> MorphologicalResult:
        """Basic morphological analysis without spaCy"""
        words = text.split()
        morphemes = []
        
        for word in words:
            # Basic POS tagging based on patterns
            pos = self._guess_pos(word)
            lemma = word.lower().rstrip('s').rstrip('ed').rstrip('ing')  # Basic lemmatization
            
            morpheme = MorphemeInfo(
                text=word,
                pos=pos,
                lemma=lemma,
                features=[f"length={len(word)}", f"is_capitalized={word[0].isupper()}"],
                dependency="unknown",
                head="unknown"
            )
            morphemes.append(morpheme)
        
        structure = {
            "root": self._find_root_word(words),
            "prefixes": [],
            "suffixes": [],
            "word_count": len(words),
            "sentence_count": len([s for s in text.split('.') if s.strip()])
        }
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return MorphologicalResult(
            morphemes=morphemes,
            structure=structure,
            processing_time=processing_time,
            confidence=0.6  # Lower confidence without spaCy
        )
    
    def _guess_pos(self, word: str) -> str:
        """Basic POS guessing based on patterns"""
        word_lower = word.lower()
        
        # Common patterns
        if word_lower in ['the', 'a', 'an']:
            return 'DET'
        elif word_lower in ['and', 'or', 'but']:
            return 'CONJ'
        elif word_lower in ['in', 'on', 'at', 'by', 'for', 'with']:
            return 'ADP'
        elif word.endswith('ly'):
            return 'ADV'
        elif word.endswith('ing'):
            return 'VERB'
        elif word.endswith('ed'):
            return 'VERB'
        elif word.endswith('s') and len(word) > 2:
            return 'NOUN'
        elif word[0].isupper():
            return 'PROPN'
        else:
            return 'NOUN'  # Default to noun
    
    def _extract_structure(self, doc) -> Dict[str, Any]:
        """Extract linguistic structure from spaCy doc"""
        # Find root word (usually the main verb)
        root_tokens = [token for token in doc if token.dep_ == "ROOT"]
        root = root_tokens[0].lemma_ if root_tokens else ""
        
        # Extract prefixes and suffixes (simplified)
        prefixes = []
        suffixes = []
        
        for token in doc:
            if token.prefix_:
                prefixes.append(token.prefix_)
            if token.suffix_:
                suffixes.append(token.suffix_)
        
        return {
            "root": root,
            "prefixes": list(set(prefixes)),
            "suffixes": list(set(suffixes)),
            "word_count": len([t for t in doc if not t.is_punct]),
            "sentence_count": len(list(doc.sents)),
            "entities": [(ent.text, ent.label_) for ent in doc.ents],
            "noun_phrases": [chunk.text for chunk in doc.noun_chunks]
        }
    
    def _find_root_word(self, words: List[str]) -> str:
        """Find the most likely root word (simplified)"""
        # Remove common stop words and find longest word as approximation
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'by', 'for', 'with'}
        content_words = [w for w in words if w.lower() not in stop_words]
        
        if content_words:
            return max(content_words, key=len)
        return words[0] if words else ""


class SentimentAnalyzer:
    """Sentiment analysis engine with -1 to +1 scoring"""
    
    def __init__(self):
        self.analyzer = None
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize NLTK sentiment analyzer"""
        if nltk is None:
            logger.warning("NLTK not available. Sentiment analysis will be limited.")
            return
        
        try:
            # Download required NLTK data
            nltk.download('vader_lexicon', quiet=True)
            nltk.download('punkt', quiet=True)
            
            self.analyzer = SentimentIntensityAnalyzer()
            logger.info("NLTK sentiment analyzer initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize NLTK sentiment analyzer: {e}")
            self.analyzer = None
    
    async def analyze(self, text: str, options: Optional[Dict] = None) -> SentimentResult:
        """
        Perform sentiment analysis on text
        
        Args:
            text: Input text to analyze
            options: Analysis options
        
        Returns:
            SentimentResult with score and breakdown
        """
        start_time = datetime.now()
        
        if not self.analyzer:
            return await self._basic_sentiment_analysis(text, start_time)
        
        try:
            # Use NLTK VADER sentiment analyzer
            scores = self.analyzer.polarity_scores(text)
            
            # Convert compound score to -1 to 1 range (it's already in this range)
            sentiment_score = scores['compound']
            
            # Determine label
            if sentiment_score >= 0.05:
                label = 'positive'
            elif sentiment_score <= -0.05:
                label = 'negative'
            else:
                label = 'neutral'
            
            # Calculate confidence based on the strength of the sentiment
            confidence = abs(sentiment_score)
            
            breakdown = {
                'positive': scores['pos'],
                'negative': scores['neg'],
                'neutral': scores['neu']
            }
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return SentimentResult(
                score=sentiment_score,
                confidence=confidence,
                label=label,
                breakdown=breakdown,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            return await self._basic_sentiment_analysis(text, start_time)
    
    async def _basic_sentiment_analysis(self, text: str, start_time: datetime) -> SentimentResult:
        """Basic sentiment analysis using word lists"""
        positive_words = {
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
            'love', 'like', 'enjoy', 'happy', 'pleased', 'satisfied', 'perfect',
            'best', 'better', 'nice', 'beautiful', 'brilliant', 'outstanding'
        }
        
        negative_words = {
            'bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate', 'dislike',
            'angry', 'sad', 'disappointed', 'frustrated', 'annoyed', 'upset',
            'worst', 'worse', 'ugly', 'stupid', 'boring', 'useless'
        }
        
        words = text.lower().split()
        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)
        total_words = len(words)
        
        if total_words == 0:
            sentiment_score = 0.0
        else:
            sentiment_score = (positive_count - negative_count) / total_words
            # Normalize to -1 to 1 range
            sentiment_score = max(-1.0, min(1.0, sentiment_score * 10))
        
        # Determine label
        if sentiment_score > 0.1:
            label = 'positive'
        elif sentiment_score < -0.1:
            label = 'negative'
        else:
            label = 'neutral'
        
        confidence = abs(sentiment_score)
        
        breakdown = {
            'positive': positive_count / total_words if total_words > 0 else 0,
            'negative': negative_count / total_words if total_words > 0 else 0,
            'neutral': 1 - (positive_count + negative_count) / total_words if total_words > 0 else 1
        }
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return SentimentResult(
            score=sentiment_score,
            confidence=confidence,
            label=label,
            breakdown=breakdown,
            processing_time=processing_time
        )


class TextSimilarityAnalyzer:
    """Text similarity and duplicate detection engine"""
    
    def __init__(self):
        self.lemmatizer = None
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize models for text similarity"""
        if nltk:
            try:
                nltk.download('wordnet', quiet=True)
                nltk.download('stopwords', quiet=True)
                self.lemmatizer = WordNetLemmatizer()
                logger.info("Text similarity analyzer initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize text similarity analyzer: {e}")
    
    async def analyze(self, text1: str, text2: str, options: Optional[Dict] = None) -> SimilarityResult:
        """
        Analyze similarity between two texts
        
        Args:
            text1: First text
            text2: Second text
            options: Analysis options (threshold, etc.)
        
        Returns:
            SimilarityResult with similarity score and matched segments
        """
        start_time = datetime.now()
        
        try:
            # Calculate different similarity metrics
            sequence_similarity = self._sequence_similarity(text1, text2)
            word_similarity = self._word_similarity(text1, text2)
            semantic_similarity = self._semantic_similarity(text1, text2)
            
            # Combine similarities with weights
            similarity_score = (
                sequence_similarity * 0.4 +
                word_similarity * 0.4 +
                semantic_similarity * 0.2
            ) * 100  # Convert to percentage
            
            # Find matched segments
            matched_segments = self._find_matched_segments(text1, text2)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return SimilarityResult(
                similarity_score=similarity_score,
                matched_segments=matched_segments,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Error in similarity analysis: {e}")
            # Fallback to basic similarity
            similarity_score = SequenceMatcher(None, text1, text2).ratio() * 100
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return SimilarityResult(
                similarity_score=similarity_score,
                matched_segments=[],
                processing_time=processing_time
            )
    
    def _sequence_similarity(self, text1: str, text2: str) -> float:
        """Calculate sequence similarity using difflib"""
        return SequenceMatcher(None, text1, text2).ratio()
    
    def _word_similarity(self, text1: str, text2: str) -> float:
        """Calculate word-level similarity"""
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 and not words2:
            return 1.0
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union)
    
    def _semantic_similarity(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity (simplified)"""
        if not self.lemmatizer:
            return 0.0
        
        # Lemmatize words and compare
        words1 = [self.lemmatizer.lemmatize(word.lower()) for word in text1.split()]
        words2 = [self.lemmatizer.lemmatize(word.lower()) for word in text2.split()]
        
        set1 = set(words1)
        set2 = set(words2)
        
        if not set1 and not set2:
            return 1.0
        if not set1 or not set2:
            return 0.0
        
        intersection = set1.intersection(set2)
        union = set1.union(set2)
        
        return len(intersection) / len(union)
    
    def _find_matched_segments(self, text1: str, text2: str) -> List[Dict[str, Any]]:
        """Find matching segments between texts"""
        matcher = SequenceMatcher(None, text1, text2)
        matched_segments = []
        
        for match in matcher.get_matching_blocks():
            if match.size > 5:  # Only consider matches longer than 5 characters
                segment1 = text1[match.a:match.a + match.size]
                segment2 = text2[match.b:match.b + match.size]
                
                matched_segments.append({
                    'text1': segment1,
                    'text2': segment2,
                    'similarity': 100.0,  # Exact match
                    'position1': match.a,
                    'position2': match.b,
                    'length': match.size
                })
        
        return matched_segments


class KeywordExtractor:
    """Keyword extraction and word cloud generation engine"""
    
    def __init__(self):
        self.stop_words = set()
        self.lemmatizer = None
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize models for keyword extraction"""
        if nltk:
            try:
                nltk.download('stopwords', quiet=True)
                nltk.download('wordnet', quiet=True)
                nltk.download('punkt', quiet=True)
                
                self.stop_words = set(stopwords.words('english'))
                self.lemmatizer = WordNetLemmatizer()
                logger.info("Keyword extractor initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize keyword extractor: {e}")
        
        # Fallback stop words
        if not self.stop_words:
            self.stop_words = {
                'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
                'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
                'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
                'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
                'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
                'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
            }
    
    async def analyze(self, text: str, options: Optional[Dict] = None) -> KeywordResult:
        """
        Extract keywords and generate word cloud data
        
        Args:
            text: Input text to analyze
            options: Analysis options (max_keywords, min_frequency, etc.)
        
        Returns:
            KeywordResult with keywords and word cloud data
        """
        start_time = datetime.now()
        
        try:
            # Parse options
            max_keywords = options.get('max_keywords', 50) if options else 50
            min_frequency = options.get('min_frequency', 2) if options else 2
            
            # Tokenize and clean text
            words = self._tokenize_and_clean(text)
            
            # Calculate word frequencies
            word_freq = Counter(words)
            
            # Calculate TF-IDF-like importance scores
            keywords = self._calculate_keyword_importance(word_freq, len(words))
            
            # Filter by minimum frequency and limit results
            keywords = [kw for kw in keywords if kw['frequency'] >= min_frequency]
            keywords = keywords[:max_keywords]
            
            # Generate word cloud data
            word_cloud = self._generate_word_cloud_data(keywords)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return KeywordResult(
                keywords=keywords,
                word_cloud=word_cloud,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Error in keyword extraction: {e}")
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return KeywordResult(
                keywords=[],
                word_cloud=[],
                processing_time=processing_time
            )
    
    def _tokenize_and_clean(self, text: str) -> List[str]:
        """Tokenize text and remove stop words, punctuation"""
        # Basic tokenization
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        
        # Remove stop words and short words
        words = [word for word in words if word not in self.stop_words and len(word) > 2]
        
        # Lemmatize if available
        if self.lemmatizer:
            words = [self.lemmatizer.lemmatize(word) for word in words]
        
        return words
    
    def _calculate_keyword_importance(self, word_freq: Counter, total_words: int) -> List[Dict[str, Any]]:
        """Calculate importance scores for keywords"""
        keywords = []
        
        for word, frequency in word_freq.items():
            # Calculate term frequency
            tf = frequency / total_words
            
            # Simple importance score (can be enhanced with IDF)
            importance = tf * math.log(frequency + 1)
            
            keywords.append({
                'word': word,
                'frequency': frequency,
                'importance': importance,
                'tf': tf
            })
        
        # Sort by importance
        keywords.sort(key=lambda x: x['importance'], reverse=True)
        
        return keywords
    
    def _generate_word_cloud_data(self, keywords: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate word cloud visualization data"""
        if not keywords:
            return []
        
        max_importance = keywords[0]['importance']
        word_cloud = []
        
        # Color palette for word cloud
        colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ]
        
        for i, keyword in enumerate(keywords):
            # Calculate size based on importance (20-100 range)
            size = 20 + (keyword['importance'] / max_importance) * 80
            
            # Assign color
            color = colors[i % len(colors)]
            
            word_cloud.append({
                'word': keyword['word'],
                'size': size,
                'color': color,
                'frequency': keyword['frequency'],
                'importance': keyword['importance']
            })
        
        return word_cloud


class NLPService:
    """Main NLP service coordinating all analysis engines"""
    
    def __init__(self):
        self.morphological_analyzer = MorphologicalAnalyzer()
        self.sentiment_analyzer = SentimentAnalyzer()
        self.similarity_analyzer = TextSimilarityAnalyzer()
        self.keyword_extractor = KeywordExtractor()
        
        logger.info("NLP Service initialized")
    
    async def analyze_text(
        self,
        text: str,
        analysis_types: List[str],
        options: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Perform comprehensive NLP analysis
        
        Args:
            text: Input text to analyze
            analysis_types: List of analysis types to perform
            options: Analysis options
        
        Returns:
            Dictionary with analysis results
        """
        results = {}
        
        if 'morphological' in analysis_types:
            results['morphological'] = await self.morphological_analyzer.analyze(text, options)
        
        if 'sentiment' in analysis_types:
            results['sentiment'] = await self.sentiment_analyzer.analyze(text, options)
        
        if 'keywords' in analysis_types:
            results['keywords'] = await self.keyword_extractor.analyze(text, options)
        
        return results
    
    async def compare_texts(
        self,
        text1: str,
        text2: str,
        options: Optional[Dict] = None
    ) -> SimilarityResult:
        """Compare two texts for similarity"""
        return await self.similarity_analyzer.analyze(text1, text2, options)
    
    async def batch_analyze(
        self,
        texts: List[str],
        analysis_types: List[str],
        options: Optional[Dict] = None
    ) -> List[Dict[str, Any]]:
        """Perform batch analysis on multiple texts"""
        tasks = [
            self.analyze_text(text, analysis_types, options)
            for text in texts
        ]
        
        return await asyncio.gather(*tasks)


# Global NLP service instance
nlp_service = NLPService()