import React from 'react';
import { Image as ImageIcon, Palette, Sun, Contrast, Tag, Clock } from 'lucide-react';

interface VisualFeatures {
  dominant_colors: string[];
  brightness: number;
  contrast: number;
  image_type: string;
}

interface Category {
  name: string;
  confidence: number;
}

interface ImageClassificationResultsProps {
  imageUrl?: string;
  primaryCategory: string;
  categories: Category[];
  imageType: string;
  visualFeatures: VisualFeatures;
  metadata: {
    processing_time: number;
    categories_count: number;
  };
  className?: string;
}

export const ImageClassificationResults: React.FC<ImageClassificationResultsProps> = ({
  imageUrl,
  primaryCategory,
  categories,
  imageType,
  visualFeatures,
  metadata,
  className = ''
}) => {
  const getImageTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return '📷';
      case 'graphic': return '🎨';
      case 'text': return '📄';
      case 'mixed': return '🖼️';
      default: return '🖼️';
    }
  };

  const getImageTypeColor = (type: string) => {
    switch (type) {
      case 'photo': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'graphic': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'text': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'mixed': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBrightnessLabel = (brightness: number) => {
    if (brightness >= 0.8) return 'Very Bright';
    if (brightness >= 0.6) return 'Bright';
    if (brightness >= 0.4) return 'Medium';
    if (brightness >= 0.2) return 'Dark';
    return 'Very Dark';
  };

  const getContrastLabel = (contrast: number) => {
    if (contrast >= 0.6) return 'High';
    if (contrast >= 0.3) return 'Medium';
    return 'Low';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Image Type</span>
          </div>
          <div className="mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImageTypeColor(imageType)}`}>
              {getImageTypeIcon(imageType)} {imageType}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Categories</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {metadata.categories_count}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Sun className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Brightness</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
            {getBrightnessLabel(visualFeatures.brightness)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(visualFeatures.brightness * 100)}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Contrast className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Contrast</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
            {getContrastLabel(visualFeatures.contrast)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(visualFeatures.contrast * 100)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Display */}
        {imageUrl && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Original Image
            </h3>
            
            <div className="relative">
              <img
                src={imageUrl}
                alt="Classification target"
                className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
              />
              
              {/* Primary Category Overlay */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-md text-sm font-medium">
                {primaryCategory}
              </div>
            </div>

            {/* Processing Info */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Processed in {metadata.processing_time.toFixed(2)}s</span>
              </div>
            </div>
          </div>
        )}

        {/* Classification Results */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Classification Results
          </h3>
          
          {/* Primary Category */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Primary Category</h4>
            <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
              {primaryCategory}
            </p>
          </div>

          {/* All Categories */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">All Categories</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No categories detected
                </p>
              ) : (
                categories.map((category, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {category.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${getConfidenceColor(category.confidence)}`}>
                        {Math.round(category.confidence * 100)}%
                      </span>
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${category.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Features */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Visual Features Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dominant Colors */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Dominant Colors</span>
            </h4>
            
            <div className="flex flex-wrap gap-2">
              {visualFeatures.dominant_colors.map((color, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Image Properties */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Image Properties
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-sm text-gray-600 dark:text-gray-300">Brightness</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {getBrightnessLabel(visualFeatures.brightness)}
                  </span>
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all"
                      style={{ width: `${visualFeatures.brightness * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-sm text-gray-600 dark:text-gray-300">Contrast</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {getContrastLabel(visualFeatures.contrast)}
                  </span>
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(visualFeatures.contrast * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-sm text-gray-600 dark:text-gray-300">Visual Type</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImageTypeColor(visualFeatures.image_type)}`}>
                  {getImageTypeIcon(visualFeatures.image_type)} {visualFeatures.image_type}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};