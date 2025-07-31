import React, { useState, useEffect } from 'react';
import { FileText, Wand2, Layout } from 'lucide-react';
import { contentService } from '../../services/contentService';
import type { ContentTemplate } from '../../services/contentService';

interface ContentGenerationFormProps {
  onSubmit: (data: {
    contentType: string;
    keywordIds: number[];
    templateId?: number;
    customPrompt?: string;
  }) => void;
  onCancel: () => void;
}

export const ContentGenerationForm: React.FC<ContentGenerationFormProps> = ({
  onSubmit,
  onCancel
}) => {
  const [contentType, setContentType] = useState('blog');
  const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | undefined>();
  const [customPrompt, setCustomPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Load templates when content type changes
  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const allTemplates = await contentService.getTemplates();
        const filteredTemplates = allTemplates.filter(
          template => template.content_type === contentType && template.is_active
        );
        setTemplates(filteredTemplates);
        // Reset selected template when content type changes
        setSelectedTemplate(undefined);
      } catch (error) {
        console.error('Failed to load templates:', error);
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, [contentType]);

  // Mock keywords - in real implementation, this would come from API
  const availableKeywords = [
    { id: 1, keyword: 'AI trends', post_count: 45 },
    { id: 2, keyword: 'machine learning', post_count: 32 },
    { id: 3, keyword: 'web development', post_count: 28 },
    { id: 4, keyword: 'cryptocurrency', post_count: 67 },
    { id: 5, keyword: 'startup', post_count: 23 },
  ];

  const contentTypes = [
    { value: 'blog', label: 'Blog Post', description: 'Comprehensive article format' },
    { value: 'product_intro', label: 'Product Introduction', description: 'Marketing-focused content' },
    { value: 'trend_analysis', label: 'Trend Analysis', description: 'Data-driven insights' },
  ];

  const handleKeywordToggle = (keywordId: number) => {
    setSelectedKeywords(prev =>
      prev.includes(keywordId)
        ? prev.filter(id => id !== keywordId)
        : [...prev, keywordId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedKeywords.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        contentType,
        keywordIds: selectedKeywords,
        templateId: selectedTemplate,
        customPrompt: customPrompt.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Content Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Content Type *
        </label>
        <div className="grid grid-cols-1 gap-3">
          {contentTypes.map((type) => (
            <label
              key={type.value}
              className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                contentType === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="contentType"
                value={type.value}
                checked={contentType === type.value}
                onChange={(e) => setContentType(e.target.value)}
                className="sr-only"
                disabled={isSubmitting}
              />
              <div className="flex flex-1">
                <div className="flex flex-col">
                  <span className="block text-sm font-medium text-gray-900">
                    {type.label}
                  </span>
                  <span className="block text-sm text-gray-500">
                    {type.description}
                  </span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Keyword Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Keywords * ({selectedKeywords.length} selected)
        </label>
        <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md">
          {availableKeywords.map((keyword) => (
            <label
              key={keyword.id}
              className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                selectedKeywords.includes(keyword.id) ? 'bg-blue-50' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={selectedKeywords.includes(keyword.id)}
                onChange={() => handleKeywordToggle(keyword.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isSubmitting}
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {keyword.keyword}
                  </span>
                  <span className="text-xs text-gray-500">
                    {keyword.post_count} posts
                  </span>
                </div>
              </div>
            </label>
          ))}
        </div>
        {selectedKeywords.length === 0 && (
          <p className="mt-1 text-sm text-red-600">
            Please select at least one keyword
          </p>
        )}
      </div>

      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Layout className="h-4 w-4 inline mr-1" />
          Template Selection (Optional)
        </label>
        {loadingTemplates ? (
          <div className="flex items-center justify-center py-4 border border-gray-300 rounded-md">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="ml-2 text-sm text-gray-600">Loading templates...</span>
          </div>
        ) : templates.length > 0 ? (
          <div className="space-y-2">
            <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="template"
                value=""
                checked={selectedTemplate === undefined}
                onChange={() => setSelectedTemplate(undefined)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                disabled={isSubmitting}
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-900">Default Template</span>
                <p className="text-xs text-gray-500">Use the system default template for this content type</p>
              </div>
            </label>
            {templates.map((template) => (
              <label
                key={template.id}
                className={`flex items-start p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${
                  selectedTemplate === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  value={template.id}
                  checked={selectedTemplate === template.id}
                  onChange={() => setSelectedTemplate(template.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5"
                  disabled={isSubmitting}
                />
                <div className="ml-3 flex-1">
                  <span className="text-sm font-medium text-gray-900">{template.name}</span>
                  {template.description && (
                    <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                  )}
                  {template.variables.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-400">Variables: </span>
                      <span className="text-xs text-blue-600">
                        {template.variables.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 border border-gray-300 rounded-md bg-gray-50">
            <Template className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No templates available for {contentType}</p>
            <p className="text-xs text-gray-500 mt-1">The default template will be used</p>
          </div>
        )}
      </div>

      {/* Custom Prompt */}
      <div>
        <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 mb-2">
          Custom Prompt (Optional)
        </label>
        <textarea
          id="customPrompt"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          rows={4}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add specific instructions for content generation..."
          disabled={isSubmitting}
        />
        <p className="mt-1 text-xs text-gray-500">
          Provide additional context or specific requirements for the generated content
        </p>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || selectedKeywords.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 inline mr-1" />
              Generate Content
            </>
          )}
        </button>
      </div>
    </form>
  );
};