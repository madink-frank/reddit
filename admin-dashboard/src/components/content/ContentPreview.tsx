import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, FileText, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { contentService } from '@/services/contentService';
import type { ContentGenerationStatus } from '@/services/contentService';

interface ContentPreviewProps {
  jobId?: string;
  content?: string;
  onContentChange?: (content: string) => void;
  isEditable?: boolean;
  showPreview?: boolean;
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  jobId,
  content = '',
  onContentChange,
  isEditable = false,
  showPreview = true
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(showPreview);
  const [generationStatus, setGenerationStatus] = useState<ContentGenerationStatus | null>(null);
  const [localContent, setLocalContent] = useState(content);
  const [isPolling, setIsPolling] = useState(false);

  // Poll for generation status if jobId is provided
  useEffect(() => {
    if (!jobId) return;

    const pollStatus = async () => {
      try {
        const status = await contentService.getGenerationStatus(jobId);
        setGenerationStatus(status);
        
        if (status.status === 'completed' || status.status === 'failed') {
          setIsPolling(false);
        }
      } catch (error) {
        console.error('Failed to fetch generation status:', error);
        setIsPolling(false);
      }
    };

    setIsPolling(true);
    pollStatus();

    const interval = setInterval(pollStatus, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [jobId]);

  // Update local content when prop changes
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    onContentChange?.(newContent);
  };

  const renderMarkdown = (markdown: string) => {
    // Simple markdown rendering - in production, use a proper markdown library
    return markdown
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/\n/gim, '<br>');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Queued for generation';
      case 'processing':
        return 'Generating content...';
      case 'completed':
        return 'Generation completed';
      case 'failed':
        return 'Generation failed';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div className="space-y-4">
      {/* Generation Status */}
      {generationStatus && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getStatusIcon(generationStatus.status)}
              <span className="text-sm font-medium text-gray-900">
                {getStatusText(generationStatus.status)}
              </span>
            </div>
            {generationStatus.estimated_completion && (
              <span className="text-xs text-gray-500">
                ETA: {new Date(generationStatus.estimated_completion).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          {generationStatus.status === 'processing' && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{generationStatus.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${generationStatus.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {generationStatus.status === 'failed' && generationStatus.error_message && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {generationStatus.error_message}
            </div>
          )}
        </div>
      )}

      {/* Editor/Preview Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Content</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPreviewMode(false)}
            className={`px-3 py-1 text-sm rounded-md ${
              !isPreviewMode
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-1" />
            Edit
          </button>
          <button
            onClick={() => setIsPreviewMode(true)}
            className={`px-3 py-1 text-sm rounded-md ${
              isPreviewMode
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye className="h-4 w-4 inline mr-1" />
            Preview
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {isPreviewMode ? (
          <div className="p-4 min-h-96 bg-white prose max-w-none">
            {localContent ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(localContent)
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No content to preview</p>
                  <p className="text-sm">Content will appear here once generated</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <textarea
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Content will be generated here, or you can write your own..."
            className="w-full h-96 p-4 border-none resize-none focus:outline-none focus:ring-0"
            disabled={!isEditable || isPolling}
          />
        )}
      </div>

      {/* Content Stats */}
      {localContent && (
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <span>
            Words: {localContent.split(/\s+/).filter(word => word.length > 0).length}
          </span>
          <span>
            Characters: {localContent.length}
          </span>
          <span>
            Reading time: ~{Math.ceil(localContent.split(/\s+/).length / 200)} min
          </span>
        </div>
      )}
    </div>
  );
};