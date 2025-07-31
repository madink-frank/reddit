import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/progress';
import { Slider } from '../ui/slider';
import { Copy, Search, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface SimilarityResult {
  similarity_score: number; // 0 to 100
  matched_segments: Array<{
    text1: string;
    text2: string;
    similarity: number;
    position1: number;
    position2: number;
    length: number;
  }>;
  processing_time: number;
}

interface TextSimilarityProps {
  className?: string;
}

export const TextSimilarity: React.FC<TextSimilarityProps> = ({ className }) => {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [result, setResult] = useState<SimilarityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState([80]);
  const [error, setError] = useState<string | null>(null);

  const analyzeSimilarity = async () => {
    if (!text1.trim() || !text2.trim()) {
      setError('Please enter both texts to compare');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/nlp/similarity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          text1: text1,
          text2: text2,
          options: {
            threshold: threshold[0] / 100
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze similarity');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getSimilarityLevel = (score: number) => {
    if (score >= 90) return { level: 'Very High', color: 'bg-red-500', textColor: 'text-red-700' };
    if (score >= 70) return { level: 'High', color: 'bg-orange-500', textColor: 'text-orange-700' };
    if (score >= 50) return { level: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    if (score >= 30) return { level: 'Low', color: 'bg-blue-500', textColor: 'text-blue-700' };
    return { level: 'Very Low', color: 'bg-green-500', textColor: 'text-green-700' };
  };

  const isDuplicate = (score: number) => score >= threshold[0];

  const highlightText = (text: string, segments: typeof result.matched_segments, isFirst: boolean) => {
    if (!segments || segments.length === 0) return text;

    let highlightedText = text;
    const sortedSegments = [...segments].sort((a, b) => 
      (isFirst ? b.position1 : b.position2) - (isFirst ? a.position1 : a.position2)
    );

    sortedSegments.forEach((segment) => {
      const position = isFirst ? segment.position1 : segment.position2;
      const segmentText = isFirst ? segment.text1 : segment.text2;
      
      if (position >= 0 && segmentText) {
        const before = highlightedText.substring(0, position);
        const highlighted = `<mark class="bg-yellow-200 px-1 rounded">${segmentText}</mark>`;
        const after = highlightedText.substring(position + segmentText.length);
        highlightedText = before + highlighted + after;
      }
    });

    return highlightedText;
  };

  const clearTexts = () => {
    setText1('');
    setText2('');
    setResult(null);
    setError(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Text Similarity & Duplicate Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Threshold Setting */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Duplicate Threshold: {threshold[0]}%
            </label>
            <Slider
              value={threshold}
              onValueChange={setThreshold}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-gray-600">
              Texts with similarity above this threshold will be considered duplicates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Text 1 */}
            <div>
              <label htmlFor="text1" className="block text-sm font-medium mb-2">
                Text 1
              </label>
              <Textarea
                id="text1"
                placeholder="Enter first text to compare..."
                value={text1}
                onChange={(e) => setText1(e.target.value)}
                rows={6}
                className="w-full"
              />
            </div>

            {/* Text 2 */}
            <div>
              <label htmlFor="text2" className="block text-sm font-medium mb-2">
                Text 2
              </label>
              <Textarea
                id="text2"
                placeholder="Enter second text to compare..."
                value={text2}
                onChange={(e) => setText2(e.target.value)}
                rows={6}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={analyzeSimilarity} 
              disabled={loading || !text1.trim() || !text2.trim()}
              className="flex-1"
            >
              {loading ? 'Analyzing...' : 'Compare Texts'}
            </Button>
            <Button 
              variant="outline" 
              onClick={clearTexts}
              disabled={loading}
            >
              Clear
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Similarity Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Similarity */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {isDuplicate(result.similarity_score) ? (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                <div>
                  <p className="font-medium">
                    {result.similarity_score.toFixed(1)}% Similar
                  </p>
                  <p className="text-sm text-gray-600">
                    {getSimilarityLevel(result.similarity_score).level} similarity
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge 
                  variant="outline" 
                  className={`${getSimilarityLevel(result.similarity_score).color} text-white`}
                >
                  {isDuplicate(result.similarity_score) ? 'DUPLICATE' : 'UNIQUE'}
                </Badge>
                <p className="text-xs text-gray-600 mt-1">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {(result.processing_time * 1000).toFixed(1)}ms
                </p>
              </div>
            </div>

            {/* Similarity Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Similarity Score</span>
                <span>{result.similarity_score.toFixed(1)}%</span>
              </div>
              <Progress value={result.similarity_score} className="h-3" />
              <div className="flex justify-between text-xs text-gray-600">
                <span>0% (Completely Different)</span>
                <span>100% (Identical)</span>
              </div>
            </div>

            {/* Matched Segments */}
            {result.matched_segments && result.matched_segments.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Matched Segments ({result.matched_segments.length})</h4>
                
                <div className="space-y-3">
                  {result.matched_segments.slice(0, 5).map((segment, index) => (
                    <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Match {index + 1}</span>
                        <Badge variant="outline" className="text-xs">
                          {segment.length} chars
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Text 1:</span>
                          <p className="font-mono bg-white p-2 rounded border">
                            "{segment.text1}"
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Text 2:</span>
                          <p className="font-mono bg-white p-2 rounded border">
                            "{segment.text2}"
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {result.matched_segments.length > 5 && (
                    <p className="text-sm text-gray-600 text-center">
                      ... and {result.matched_segments.length - 5} more matches
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Text Comparison with Highlights */}
            <div className="space-y-4">
              <h4 className="font-medium">Text Comparison</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium mb-2">Text 1 (with highlights)</h5>
                  <div 
                    className="p-3 bg-gray-50 rounded border text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(text1, result.matched_segments, true)
                    }}
                  />
                </div>
                <div>
                  <h5 className="text-sm font-medium mb-2">Text 2 (with highlights)</h5>
                  <div 
                    className="p-3 bg-gray-50 rounded border text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(text2, result.matched_segments, false)
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">Analysis Summary</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Similarity Score: {result.similarity_score.toFixed(1)}%</li>
                <li>• Classification: {isDuplicate(result.similarity_score) ? 'Duplicate Content' : 'Unique Content'}</li>
                <li>• Matched Segments: {result.matched_segments?.length || 0}</li>
                <li>• Processing Time: {(result.processing_time * 1000).toFixed(1)}ms</li>
                <li>• Threshold Used: {threshold[0]}%</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};