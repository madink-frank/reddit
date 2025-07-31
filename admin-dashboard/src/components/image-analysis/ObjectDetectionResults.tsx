import React, { useState } from 'react';
import { Eye, EyeOff, Target, Zap, Tag, Clock } from 'lucide-react';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectedObject {
  label: string;
  confidence: number;
  bounding_box: BoundingBox;
  category: 'literal' | 'inferred';
}

interface ObjectDetectionResultsProps {
  imageUrl?: string;
  objects: DetectedObject[];
  summary: {
    total_objects: number;
    high_confidence_objects: number;
    categories: string[];
    processing_time: number;
    provider: string;
  };
  className?: string;
}

export const ObjectDetectionResults: React.FC<ObjectDetectionResultsProps> = ({
  imageUrl,
  objects,
  summary,
  className = ''
}) => {
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);
  const [confidenceFilter, setConfidenceFilter] = useState(0);

  const filteredObjects = objects.filter(obj => obj.confidence >= confidenceFilter / 100);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const getCategoryBadgeColor = (category: string) => {
    return category === 'literal' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Objects</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {summary.total_objects}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">High Confidence</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {summary.high_confidence_objects}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Categories</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {summary.categories.length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Processing Time</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {summary.processing_time.toFixed(2)}s
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <button
          onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            showBoundingBoxes
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {showBoundingBoxes ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span>Bounding Boxes</span>
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

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Provider: <span className="font-medium">{summary.provider}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image with Bounding Boxes */}
        {imageUrl && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Detection Visualization
            </h3>
            
            <div className="relative inline-block">
              <img
                src={imageUrl}
                alt="Analysis target"
                className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
              />
              
              {/* Bounding Boxes Overlay */}
              {showBoundingBoxes && (
                <div className="absolute inset-0">
                  {filteredObjects.map((obj, index) => (
                    <div
                      key={index}
                      className={`absolute border-2 cursor-pointer transition-all ${
                        selectedObject === obj
                          ? 'border-red-500 bg-red-500 bg-opacity-20'
                          : obj.category === 'literal'
                          ? 'border-blue-500 hover:bg-blue-500 hover:bg-opacity-20'
                          : 'border-purple-500 hover:bg-purple-500 hover:bg-opacity-20'
                      }`}
                      style={{
                        left: `${obj.bounding_box.x * 100}%`,
                        top: `${obj.bounding_box.y * 100}%`,
                        width: `${obj.bounding_box.width * 100}%`,
                        height: `${obj.bounding_box.height * 100}%`,
                      }}
                      onClick={() => setSelectedObject(obj)}
                    >
                      <div className="absolute -top-6 left-0 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {obj.label} ({Math.round(obj.confidence * 100)}%)
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Objects List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Detected Objects ({filteredObjects.length})
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredObjects.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No objects found with current confidence threshold
              </p>
            ) : (
              filteredObjects.map((obj, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedObject === obj
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } bg-white dark:bg-gray-800`}
                  onClick={() => setSelectedObject(obj)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Target className="w-5 h-5 text-gray-400" />
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {obj.label}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-sm font-medium ${getConfidenceColor(obj.confidence)}`}>
                            {Math.round(obj.confidence * 100)}% confidence
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadgeColor(obj.category)}`}>
                            {obj.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                      <div>x: {Math.round(obj.bounding_box.x * 100)}%</div>
                      <div>y: {Math.round(obj.bounding_box.y * 100)}%</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Categories Summary */}
      {summary.categories.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Detected Categories
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {summary.categories.map((category, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};