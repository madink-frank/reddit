import React, { useState, useCallback } from 'react';
import { 
  Camera, 
  FileText, 
  Tag, 
  Zap, 
  Settings, 
  Play, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { ImageUploadZone } from './ImageUploadZone';
import { ObjectDetectionResults } from './ObjectDetectionResults';
import { OCRResults } from './OCRResults';
import { ImageClassificationResults } from './ImageClassificationResults';

interface AnalysisSettings {
  provider: string;
  analysisTypes: string[];
  confidenceThreshold: number;
  maxObjects: number;
  languages: string[];
}

interface AnalysisResult {
  type: 'objects' | 'ocr' | 'classification';
  data: any;
  success: boolean;
  error?: string;
}

interface BatchResult {
  filename: string;
  success: boolean;
  results: Record<string, any>;
  error?: string;
}

export const ImageAnalysisHub: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [showSettings, setShowSettings] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  
  const [settings, setSettings] = useState<AnalysisSettings>({
    provider: 'local',
    analysisTypes: ['objects', 'ocr', 'classification'],
    confidenceThreshold: 0.5,
    maxObjects: 50,
    languages: ['en']
  });

  const handleFilesSelected = useCallback((files: File[]) => {
    setSelectedFiles(files);
    
    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(urls);
    
    // Clear previous results
    setAnalysisResults([]);
    setBatchResults([]);
  }, []);

  const analyzeImages = async () => {
    if (selectedFiles.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisResults([]);
    setBatchResults([]);

    try {
      if (activeTab === 'single' && selectedFiles.length === 1) {
        await analyzeSingleImage(selectedFiles[0]);
      } else {
        await analyzeBatchImages(selectedFiles);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeSingleImage = async (file: File) => {
    const results: AnalysisResult[] = [];

    // Object Detection
    if (settings.analysisTypes.includes('objects')) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('provider', settings.provider);
        formData.append('confidence_threshold', settings.confidenceThreshold.toString());
        formData.append('max_objects', settings.maxObjects.toString());

        const response = await fetch('/api/v1/image-analysis/detect-objects', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          results.push({
            type: 'objects',
            data,
            success: true
          });
        } else {
          throw new Error('Object detection failed');
        }
      } catch (error) {
        results.push({
          type: 'objects',
          data: null,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // OCR
    if (settings.analysisTypes.includes('ocr')) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('provider', settings.provider);
        formData.append('languages', settings.languages.join(','));

        const response = await fetch('/api/v1/image-analysis/extract-text', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          results.push({
            type: 'ocr',
            data,
            success: true
          });
        } else {
          throw new Error('OCR failed');
        }
      } catch (error) {
        results.push({
          type: 'ocr',
          data: null,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Image Classification
    if (settings.analysisTypes.includes('classification')) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/v1/image-analysis/classify-image', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          results.push({
            type: 'classification',
            data,
            success: true
          });
        } else {
          throw new Error('Image classification failed');
        }
      } catch (error) {
        results.push({
          type: 'classification',
          data: null,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setAnalysisResults(results);
  };

  const analyzeBatchImages = async (files: File[]) => {
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('analysis_types', settings.analysisTypes.join(','));
      formData.append('provider', settings.provider);
      formData.append('confidence_threshold', settings.confidenceThreshold.toString());

      const response = await fetch('/api/v1/image-analysis/analyze-batch', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBatchResults(data.results);
      } else {
        throw new Error('Batch analysis failed');
      }
    } catch (error) {
      console.error('Batch analysis error:', error);
    }
  };

  const getAnalysisTypeIcon = (type: string) => {
    switch (type) {
      case 'objects': return <Camera className="w-4 h-4" />;
      case 'ocr': return <FileText className="w-4 h-4" />;
      case 'classification': return <Tag className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const renderSingleResults = () => {
    if (analysisResults.length === 0) return null;

    return (
      <div className="space-y-6">
        {analysisResults.map((result, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-4">
              {getAnalysisTypeIcon(result.type)}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {result.type === 'ocr' ? 'OCR Results' : `${result.type} Detection`}
              </h3>
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
            </div>

            {result.success ? (
              <>
                {result.type === 'objects' && (
                  <ObjectDetectionResults
                    imageUrl={imagePreviewUrls[0]}
                    objects={result.data.objects}
                    summary={result.data.summary}
                  />
                )}
                {result.type === 'ocr' && (
                  <OCRResults
                    imageUrl={imagePreviewUrls[0]}
                    extractedText={result.data.extracted_text}
                    textBlocks={result.data.text_blocks}
                    metadata={result.data.metadata}
                  />
                )}
                {result.type === 'classification' && (
                  <ImageClassificationResults
                    imageUrl={imagePreviewUrls[0]}
                    primaryCategory={result.data.primary_category}
                    categories={result.data.categories}
                    imageType={result.data.image_type}
                    visualFeatures={result.data.visual_features}
                    metadata={result.data.metadata}
                  />
                )}
              </>
            ) : (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span>Analysis failed: {result.error}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderBatchResults = () => {
    if (batchResults.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-blue-900 dark:text-blue-100">
              Batch Analysis Summary
            </h3>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700 dark:text-blue-300">Total Files:</span>
              <span className="ml-1 font-medium">{batchResults.length}</span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300">Successful:</span>
              <span className="ml-1 font-medium text-green-600">
                {batchResults.filter(r => r.success).length}
              </span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300">Failed:</span>
              <span className="ml-1 font-medium text-red-600">
                {batchResults.filter(r => !r.success).length}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {batchResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.success
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                  : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {result.filename}
                  </span>
                </div>
              </div>

              {result.success && result.results && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {Object.entries(result.results).map(([type, data]: [string, any]) => (
                    <div key={type} className="bg-white dark:bg-gray-800 p-3 rounded border">
                      <div className="flex items-center space-x-2 mb-2">
                        {getAnalysisTypeIcon(type)}
                        <span className="font-medium capitalize">{type}</span>
                      </div>
                      
                      {data.error ? (
                        <span className="text-red-600 dark:text-red-400">Error: {data.error}</span>
                      ) : (
                        <div className="space-y-1 text-gray-600 dark:text-gray-300">
                          {type === 'objects' && (
                            <>
                              <div>Objects: {data.total_objects}</div>
                              <div>High Confidence: {data.high_confidence_objects}</div>
                            </>
                          )}
                          {type === 'ocr' && (
                            <>
                              <div>Text Length: {data.text_length}</div>
                              <div>Blocks: {data.text_blocks_count}</div>
                            </>
                          )}
                          {type === 'classification' && (
                            <>
                              <div>Type: {data.image_type}</div>
                              <div>Category: {data.primary_category}</div>
                            </>
                          )}
                          <div className="text-xs text-gray-500">
                            {data.processing_time?.toFixed(2)}s
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!result.success && result.error && (
                <div className="mt-2 text-red-600 dark:text-red-400 text-sm">
                  Error: {result.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Image Analysis Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analyze images with object detection, OCR, and classification
          </p>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Analysis Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Provider
              </label>
              <select
                value={settings.provider}
                onChange={(e) => setSettings({...settings, provider: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="local">Local</option>
                <option value="google">Google Vision</option>
                <option value="azure">Azure Vision</option>
                <option value="aws">AWS Rekognition</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Analysis Types
              </label>
              <div className="space-y-2">
                {['objects', 'ocr', 'classification'].map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.analysisTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSettings({
                            ...settings,
                            analysisTypes: [...settings.analysisTypes, type]
                          });
                        } else {
                          setSettings({
                            ...settings,
                            analysisTypes: settings.analysisTypes.filter(t => t !== type)
                          });
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confidence Threshold
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.confidenceThreshold}
                onChange={(e) => setSettings({...settings, confidenceThreshold: Number(e.target.value)})}
                className="w-full"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(settings.confidenceThreshold * 100)}%
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Objects
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.maxObjects}
                onChange={(e) => setSettings({...settings, maxObjects: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('single')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'single'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          Single Image Analysis
        </button>
        <button
          onClick={() => setActiveTab('batch')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'batch'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          Batch Processing
        </button>
      </div>

      {/* Upload Zone */}
      <ImageUploadZone
        onFilesSelected={handleFilesSelected}
        maxFiles={activeTab === 'single' ? 1 : 10}
        disabled={isAnalyzing}
      />

      {/* Analysis Button */}
      {selectedFiles.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={analyzeImages}
            disabled={isAnalyzing || settings.analysisTypes.length === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {isAnalyzing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            <span>
              {isAnalyzing 
                ? 'Analyzing...' 
                : `Analyze ${selectedFiles.length} ${selectedFiles.length === 1 ? 'Image' : 'Images'}`
              }
            </span>
          </button>
        </div>
      )}

      {/* Results */}
      {activeTab === 'single' ? renderSingleResults() : renderBatchResults()}
    </div>
  );
};