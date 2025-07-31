import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/Badge';
import { Slider } from '../ui/slider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Hash, Cloud, TrendingUp, Clock, Settings, Download } from 'lucide-react';
import { WordFrequencyChart, WordFrequencyData } from '../charts/WordFrequencyChart';
import { KeywordNetworkChart, KeywordNetworkData } from '../charts/KeywordNetworkChart';

interface KeywordData {
  word: string;
  frequency: number;
  importance: number;
  tf: number;
}

interface WordCloudItem {
  word: string;
  size: number;
  color: string;
  frequency: number;
  importance: number;
}

interface KeywordResult {
  keywords: KeywordData[];
  word_cloud: WordCloudItem[];
  processing_time: number;
}

interface KeywordExtractionProps {
  className?: string;
}

export const KeywordExtraction: React.FC<KeywordExtractionProps> = ({ className }) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<KeywordResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [maxKeywords, setMaxKeywords] = useState([20]);
  const [minFrequency, setMinFrequency] = useState([2]);
  const [error, setError] = useState<string | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [showAdvancedViz, setShowAdvancedViz] = useState(false);

  // Sample text for demonstration
  const sampleTexts = [
    {
      title: "Technology Sample",
      text: "Machine learning and artificial intelligence are revolutionizing technology. Python programming is essential for data science projects. Deep learning neural networks process complex patterns in big data analytics."
    },
    {
      title: "Social Media Sample", 
      text: "Reddit is a popular social media platform where users share content and engage in discussions. The platform features various subreddits for different communities and interests. Users can upvote and downvote posts."
    },
    {
      title: "Business Sample",
      text: "Digital marketing strategies are crucial for business growth. Social media advertising, content marketing, and search engine optimization drive customer engagement and brand awareness in competitive markets."
    }
  ];

  const extractKeywords = async () => {
    if (!text.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/nlp/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          text: text,
          analysis_types: ['keywords'],
          options: {
            max_keywords: maxKeywords[0],
            min_frequency: minFrequency[0]
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract keywords');
      }

      const data = await response.json();
      setResult(data.keywords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const loadSampleText = (sampleText: string) => {
    setText(sampleText);
    setResult(null);
    setError(null);
  };

  const exportKeywords = () => {
    if (!result) return;

    const csvContent = [
      'Word,Frequency,Importance,TF',
      ...result.keywords.map(kw => 
        `${kw.word},${kw.frequency},${kw.importance},${kw.tf || 0}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keywords.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getKeywordChartData = () => {
    if (!result) return [];
    return result.keywords.slice(0, 10).map(kw => ({
      word: kw.word,
      frequency: kw.frequency,
      importance: kw.importance * 100
    }));
  };

  // Transform data for advanced visualizations
  const getWordFrequencyData = (): WordFrequencyData[] => {
    if (!result) return [];
    return result.keywords.map(kw => ({
      word: kw.word,
      frequency: kw.frequency,
      sentiment: (Math.random() - 0.5) * 2, // Mock sentiment data
      category: ['technology', 'social', 'business'][Math.floor(Math.random() * 3)],
      subreddit: ['programming', 'technology', 'webdev'][Math.floor(Math.random() * 3)],
      importance: kw.importance,
      trend: Math.random() * 2 - 1,
      cooccurrence: result.keywords
        .filter(other => other.word !== kw.word)
        .slice(0, 3)
        .map(other => other.word)
    }));
  };

  const getNetworkData = (): KeywordNetworkData => {
    if (!result) return { nodes: [], edges: [] };
    
    const nodes = result.keywords.slice(0, 15).map(kw => ({
      id: kw.word,
      word: kw.word,
      frequency: kw.frequency,
      sentiment: (Math.random() - 0.5) * 2,
      category: ['technology', 'social', 'business'][Math.floor(Math.random() * 3)],
      subreddit: ['programming', 'technology', 'webdev'][Math.floor(Math.random() * 3)]
    }));

    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.7) { // 30% chance of connection
          edges.push({
            source: nodes[i].id,
            target: nodes[j].id,
            weight: Math.random() * 0.8 + 0.2,
            type: ['cooccurrence', 'semantic', 'temporal'][Math.floor(Math.random() * 3)] as any
          });
        }
      }
    }

    return { nodes, edges };
  };

  const WordCloudVisualization: React.FC<{ items: WordCloudItem[] }> = ({ items }) => {
    return (
      <div className="relative h-64 bg-gray-50 rounded-lg p-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-center h-full gap-2">
          {items.slice(0, 30).map((item, index) => (
            <span
              key={index}
              className={`inline-block px-2 py-1 rounded cursor-pointer transition-all hover:scale-110 ${
                selectedKeyword === item.word ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{
                fontSize: `${Math.max(12, Math.min(32, item.size / 3))}px`,
                color: item.color,
                fontWeight: item.importance > 0.1 ? 'bold' : 'normal'
              }}
              onClick={() => setSelectedKeyword(
                selectedKeyword === item.word ? null : item.word
              )}
              title={`Frequency: ${item.frequency}, Importance: ${item.importance.toFixed(3)}`}
            >
              {item.word}
            </span>
          ))}
        </div>
        {selectedKeyword && (
          <div className="absolute bottom-2 left-2 bg-white p-2 rounded shadow-md text-sm">
            <strong>{selectedKeyword}</strong>
            <br />
            Freq: {result?.keywords.find(k => k.word === selectedKeyword)?.frequency}
            <br />
            Importance: {result?.keywords.find(k => k.word === selectedKeyword)?.importance.toFixed(3)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Keyword Extraction & Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sample Text Buttons */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Quick samples:</span>
            {sampleTexts.map((sample, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => loadSampleText(sample.text)}
                disabled={loading}
              >
                {sample.title}
              </Button>
            ))}
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                <Settings className="h-4 w-4 inline mr-1" />
                Max Keywords: {maxKeywords[0]}
              </label>
              <Slider
                value={maxKeywords}
                onValueChange={setMaxKeywords}
                max={50}
                min={5}
                step={5}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Min Frequency: {minFrequency[0]}
              </label>
              <Slider
                value={minFrequency}
                onValueChange={setMinFrequency}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Text Input */}
          <div>
            <label htmlFor="keyword-text" className="block text-sm font-medium mb-2">
              Text to Analyze
            </label>
            <Textarea
              id="keyword-text"
              placeholder="Enter text to extract keywords from..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="w-full"
            />
          </div>

          <div className="flex space-x-2">
            <Button 
              onClick={extractKeywords} 
              disabled={loading || !text.trim()}
              className="flex-1"
            >
              {loading ? 'Extracting Keywords...' : 'Extract Keywords'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowAdvancedViz(!showAdvancedViz)}
              disabled={!result}
            >
              {showAdvancedViz ? 'Basic View' : 'Advanced View'}
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
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Analysis Summary
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportKeywords}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{result.keywords.length}</p>
                  <p className="text-sm text-gray-600">Keywords Found</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{result.word_cloud.length}</p>
                  <p className="text-sm text-gray-600">Word Cloud Items</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.max(...result.keywords.map(k => k.frequency))}
                  </p>
                  <p className="text-sm text-gray-600">Max Frequency</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {(result.processing_time * 1000).toFixed(0)}ms
                  </p>
                  <p className="text-sm text-gray-600">Processing Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Word Cloud */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Interactive Word Cloud
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WordCloudVisualization items={result.word_cloud} />
              <p className="text-sm text-gray-600 mt-2 text-center">
                Click on words to see details. Size represents importance, color is randomly assigned.
              </p>
            </CardContent>
          </Card>

          {/* Keyword Frequency Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top Keywords by Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getKeywordChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="word" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'frequency' ? value : `${value.toFixed(2)}%`,
                        name === 'frequency' ? 'Frequency' : 'Importance'
                      ]}
                    />
                    <Bar dataKey="frequency" fill="#3b82f6" name="frequency" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Visualizations */}
          {showAdvancedViz && (
            <>
              <WordFrequencyChart
                data={getWordFrequencyData()}
                title="Advanced Word Frequency Analysis"
                height={500}
                showSentimentOverlay={true}
                enableFiltering={true}
                enableNetworkView={true}
                onWordSelect={(word) => setSelectedKeyword(word)}
                onExport={(data) => {
                  console.log('Exporting word frequency data:', data);
                }}
              />
              
              <KeywordNetworkChart
                data={getNetworkData()}
                title="Keyword Semantic Network"
                height={600}
                width={800}
                onNodeClick={(node) => {
                  console.log('Node clicked:', node);
                  setSelectedKeyword(node.word);
                }}
                onEdgeClick={(edge) => {
                  console.log('Edge clicked:', edge);
                }}
                onExport={(data) => {
                  console.log('Exporting network data:', data);
                }}
              />
            </>
          )}

          {/* Detailed Keywords Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Rank</th>
                      <th className="text-left p-2">Keyword</th>
                      <th className="text-left p-2">Frequency</th>
                      <th className="text-left p-2">Importance</th>
                      <th className="text-left p-2">TF Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.keywords.map((keyword, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">
                          <Badge variant="outline">{keyword.word}</Badge>
                        </td>
                        <td className="p-2">{keyword.frequency}</td>
                        <td className="p-2">{keyword.importance.toFixed(4)}</td>
                        <td className="p-2">{(keyword.tf || 0).toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};