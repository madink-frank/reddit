import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { SentimentAnalysis } from './SentimentAnalysis';
import { TextSimilarity } from './TextSimilarity';
import { KeywordExtraction } from './KeywordExtraction';
import { 
  Brain, 
  Zap, 
  FileText, 
  Upload, 
  Download, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3
} from 'lucide-react';

interface AnalysisResult {
  id: string;
  text: string;
  morphological?: any;
  sentiment?: any;
  keywords?: any;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  processingTime?: number;
}

interface BatchAnalysisProps {
  className?: string;
}

export const NLPAnalysisHub: React.FC<BatchAnalysisProps> = ({ className }) => {
  const [texts, setTexts] = useState<string[]>(['']);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>(['sentiment']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessing, setCurrentProcessing] = useState(0);
  const [activeTab, setActiveTab] = useState('batch');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analysisTypes = [
    { id: 'morphological', label: 'Morphological Analysis', icon: Brain, description: 'POS tagging, morphemes, structure' },
    { id: 'sentiment', label: 'Sentiment Analysis', icon: BarChart3, description: 'Emotion scoring, sentiment breakdown' },
    { id: 'keywords', label: 'Keyword Extraction', icon: FileText, description: 'Keywords, word cloud, frequency' }
  ];

  const addTextInput = () => {
    setTexts([...texts, '']);
  };

  const removeTextInput = (index: number) => {
    if (texts.length > 1) {
      const newTexts = texts.filter((_, i) => i !== index);
      setTexts(newTexts);
    }
  };

  const updateText = (index: number, value: string) => {
    const newTexts = [...texts];
    newTexts[index] = value;
    setTexts(newTexts);
  };

  const toggleAnalysisType = (type: string) => {
    if (selectedAnalyses.includes(type)) {
      setSelectedAnalyses(selectedAnalyses.filter(t => t !== type));
    } else {
      setSelectedAnalyses([...selectedAnalyses, type]);
    }
  };

  const processBatchAnalysis = async () => {
    const validTexts = texts.filter(text => text.trim());
    if (validTexts.length === 0 || selectedAnalyses.length === 0) return;

    setIsProcessing(true);
    setCurrentProcessing(0);
    
    const initialResults: AnalysisResult[] = validTexts.map((text, index) => ({
      id: `analysis-${index}`,
      text,
      status: 'pending'
    }));
    
    setResults(initialResults);

    try {
      for (let i = 0; i < validTexts.length; i++) {
        setCurrentProcessing(i + 1);
        
        // Update status to processing
        setResults(prev => prev.map((result, idx) => 
          idx === i ? { ...result, status: 'processing' } : result
        ));

        const startTime = Date.now();

        try {
          const response = await fetch('/api/v1/nlp/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              text: validTexts[i],
              analysis_types: selectedAnalyses,
              options: {}
            }),
          });

          if (!response.ok) {
            throw new Error('Analysis failed');
          }

          const data = await response.json();
          const processingTime = Date.now() - startTime;

          // Update with results
          setResults(prev => prev.map((result, idx) => 
            idx === i ? { 
              ...result, 
              ...data,
              status: 'completed',
              processingTime
            } : result
          ));

        } catch (error) {
          // Update with error
          setResults(prev => prev.map((result, idx) => 
            idx === i ? { 
              ...result, 
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error'
            } : result
          ));
        }

        // Small delay between requests
        if (i < validTexts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } finally {
      setIsProcessing(false);
      setCurrentProcessing(0);
    }
  };

  const exportResults = () => {
    const csvData = results.map((result, index) => {
      const row: any = {
        'Index': index + 1,
        'Text': result.text.substring(0, 100) + (result.text.length > 100 ? '...' : ''),
        'Status': result.status,
        'Processing Time (ms)': result.processingTime || 0
      };

      if (result.sentiment) {
        row['Sentiment Score'] = result.sentiment.score;
        row['Sentiment Label'] = result.sentiment.label;
        row['Sentiment Confidence'] = result.sentiment.confidence;
      }

      if (result.keywords) {
        row['Top Keywords'] = result.keywords.keywords.slice(0, 5).map((k: any) => k.word).join(', ');
        row['Keyword Count'] = result.keywords.keywords.length;
      }

      if (result.morphological) {
        row['Morpheme Count'] = result.morphological.morphemes.length;
        row['Root Word'] = result.morphological.structure.root;
      }

      return row;
    });

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nlp-analysis-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n').filter(line => line.trim());
      setTexts(lines.length > 0 ? lines : ['']);
    };
    reader.readAsText(file);
  };

  const resetAnalysis = () => {
    setTexts(['']);
    setResults([]);
    setCurrentProcessing(0);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const completedCount = results.filter(r => r.status === 'completed').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const progressPercentage = results.length > 0 ? (completedCount / results.length) * 100 : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            NLP Analysis Hub
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="batch">Batch Analysis</TabsTrigger>
              <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
              <TabsTrigger value="similarity">Similarity</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
            </TabsList>

            <TabsContent value="batch" className="space-y-6">
              {/* Analysis Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Analysis Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analysisTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = selectedAnalyses.includes(type.id);
                      
                      return (
                        <div
                          key={type.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => toggleAnalysisType(type.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                            <div>
                              <h3 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                {type.label}
                              </h3>
                              <p className="text-sm text-gray-600">{type.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Text Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Text Inputs</span>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={loadFromFile}
                        accept=".txt,.csv"
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Load File
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addTextInput}
                        disabled={isProcessing}
                      >
                        Add Text
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {texts.map((text, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1">
                        <Textarea
                          placeholder={`Text ${index + 1}...`}
                          value={text}
                          onChange={(e) => updateText(index, e.target.value)}
                          rows={3}
                          disabled={isProcessing}
                        />
                      </div>
                      {texts.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeTextInput(index)}
                          disabled={isProcessing}
                          className="self-start mt-1"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Control Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={processBatchAnalysis}
                  disabled={isProcessing || texts.every(t => !t.trim()) || selectedAnalyses.length === 0}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Processing... ({currentProcessing}/{texts.filter(t => t.trim()).length})
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Batch Analysis
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={resetAnalysis}
                  disabled={isProcessing}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>

                {results.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={exportResults}
                    disabled={isProcessing}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>
                )}
              </div>

              {/* Progress */}
              {isProcessing && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing Progress</span>
                        <span>{currentProcessing}/{texts.filter(t => t.trim()).length}</span>
                      </div>
                      <Progress value={(currentProcessing / texts.filter(t => t.trim()).length) * 100} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Results */}
              {results.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Analysis Results</span>
                      <div className="flex gap-4 text-sm">
                        <Badge variant="outline" className="text-green-600">
                          ✓ {completedCount} Completed
                        </Badge>
                        {errorCount > 0 && (
                          <Badge variant="outline" className="text-red-600">
                            ✗ {errorCount} Errors
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {results.map((result, index) => (
                        <div key={result.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(result.status)}
                              <span className="font-medium">Text {index + 1}</span>
                              {result.processingTime && (
                                <Badge variant="outline" className="text-xs">
                                  {result.processingTime}ms
                                </Badge>
                              )}
                            </div>
                            <Badge variant={result.status === 'completed' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
                              {result.status}
                            </Badge>
                          </div>

                          <div className="text-sm text-gray-600 mb-3 p-2 bg-gray-50 rounded">
                            {result.text.substring(0, 200)}
                            {result.text.length > 200 && '...'}
                          </div>

                          {result.status === 'error' && result.error && (
                            <div className="text-red-600 text-sm">
                              Error: {result.error}
                            </div>
                          )}

                          {result.status === 'completed' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              {result.sentiment && (
                                <div>
                                  <h4 className="font-medium mb-1">Sentiment</h4>
                                  <p>Score: {(result.sentiment.score * 100).toFixed(1)}%</p>
                                  <p>Label: {result.sentiment.label}</p>
                                  <p>Confidence: {(result.sentiment.confidence * 100).toFixed(1)}%</p>
                                </div>
                              )}

                              {result.keywords && (
                                <div>
                                  <h4 className="font-medium mb-1">Keywords</h4>
                                  <p>Count: {result.keywords.keywords.length}</p>
                                  <p>Top: {result.keywords.keywords.slice(0, 3).map((k: any) => k.word).join(', ')}</p>
                                </div>
                              )}

                              {result.morphological && (
                                <div>
                                  <h4 className="font-medium mb-1">Morphological</h4>
                                  <p>Morphemes: {result.morphological.morphemes.length}</p>
                                  <p>Root: {result.morphological.structure.root}</p>
                                  <p>Words: {result.morphological.structure.word_count}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sentiment">
              <SentimentAnalysis />
            </TabsContent>

            <TabsContent value="similarity">
              <TextSimilarity />
            </TabsContent>

            <TabsContent value="keywords">
              <KeywordExtraction />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};