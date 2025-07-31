import React, { useState } from 'react';
import { Copy, Download, Search, Type, Clock, Globe, Eye, EyeOff } from 'lucide-react';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OCRTextBlock {
  text: string;
  confidence: number;
  bounding_box: BoundingBox;
}

interface OCRResultsProps {
  imageUrl?: string;
  extractedText: string;
  textBlocks: OCRTextBlock[];
  metadata: {
    language: string;
    processing_time: number;
    provider: string;
    text_blocks_count: number;
  };
  className?: string;
}

export const OCRResults: React.FC<OCRResultsProps> = ({
  imageUrl,
  extractedText,
  textBlocks,
  metadata,
  className = ''
}) => {
  const [showTextBlocks, setShowTextBlocks] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<OCRTextBlock | null>(null);
  const [confidenceFilter, setConfidenceFilter] = useState(0);

  const filteredBlocks = textBlocks.filter(block => 
    block.confidence >= confidenceFilter / 100 &&
    (searchTerm === '' || block.text.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const highlightedText = searchTerm 
    ? extractedText.replace(
        new RegExp(`(${searchTerm})`, 'gi'),
        '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
      )
    : extractedText;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      // You might want to show a toast notification here
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const downloadText = () => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const averageConfidence = textBlocks.length > 0 
    ? textBlocks.reduce((sum, block) => sum + block.confidence, 0) / textBlocks.length 
    : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Type className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Characters</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {extractedText.length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Text Blocks</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {metadata.text_blocks_count}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Language</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {metadata.language.toUpperCase()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Processing Time</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {metadata.processing_time.toFixed(2)}s
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search in extracted text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <button
          onClick={() => setShowTextBlocks(!showTextBlocks)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            showTextBlocks
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {showTextBlocks ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span>Text Blocks</span>
        </button>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Min Confidence:
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem]">
            {confidenceFilter}%
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </button>

          <button
            onClick={downloadText}
            className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Provider: <span className="font-medium">{metadata.provider}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image with Text Block Overlays */}
        {imageUrl && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Text Detection Visualization
            </h3>
            
            <div className="relative inline-block">
              <img
                src={imageUrl}
                alt="OCR source"
                className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
              />
              
              {/* Text Block Overlays */}
              {showTextBlocks && (
                <div className="absolute inset-0">
                  {filteredBlocks.map((block, index) => (
                    <div
                      key={index}
                      className={`absolute border-2 cursor-pointer transition-all ${
                        selectedBlock === block
                          ? 'border-red-500 bg-red-500 bg-opacity-20'
                          : 'border-green-500 hover:bg-green-500 hover:bg-opacity-20'
                      }`}
                      style={{
                        left: `${block.bounding_box.x * 100}%`,
                        top: `${block.bounding_box.y * 100}%`,
                        width: `${block.bounding_box.width * 100}%`,
                        height: `${block.bounding_box.height * 100}%`,
                      }}
                      onClick={() => setSelectedBlock(block)}
                    >
                      <div className="absolute -top-6 left-0 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap max-w-48 truncate">
                        {block.text} ({Math.round(block.confidence * 100)}%)
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Average Confidence */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Average Confidence: 
              <span className={`ml-1 font-medium ${getConfidenceColor(averageConfidence)}`}>
                {Math.round(averageConfidence * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Extracted Text */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Extracted Text
          </h3>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
            {extractedText ? (
              <div 
                className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-mono leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlightedText }}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No text detected in the image
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Text Blocks List */}
      {textBlocks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Text Blocks ({filteredBlocks.length})
          </h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredBlocks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No text blocks found with current filters
              </p>
            ) : (
              filteredBlocks.map((block, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedBlock === block
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } bg-white dark:bg-gray-800`}
                  onClick={() => setSelectedBlock(block)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                        "{block.text}"
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className={`font-medium ${getConfidenceColor(block.confidence)}`}>
                          {Math.round(block.confidence * 100)}% confidence
                        </span>
                        <span>
                          Position: ({Math.round(block.bounding_box.x * 100)}%, {Math.round(block.bounding_box.y * 100)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};