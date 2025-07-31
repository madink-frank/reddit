import React, { useState } from 'react';
import { Plus, FileText, Layout } from 'lucide-react';
import { ContentGenerationForm } from '../components/forms/ContentGenerationForm';
import { ContentManager } from '../components/content/ContentManager';
import { TemplateManager } from '../components/content/TemplateManager';
import { ContentPreview } from '../components/content/ContentPreview';
import { useContentGeneration } from '../hooks/useContent';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import type { GeneratedContent } from '../types';

type TabType = 'generate' | 'manage' | 'templates';

const ContentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('generate');
  const [showGenerationForm, setShowGenerationForm] = useState(false);
  const [editingContent, setEditingContent] = useState<GeneratedContent | null>(null);

  const {
    currentJobId,
    generatedContent,
    startGeneration,
    useGenerationStatus  } = useContentGeneration();

  useGenerationStatus(currentJobId);

  const handleGenerateContent = async (data: {
    contentType: string;
    keywordIds: number[];
    templateId?: number;
    customPrompt?: string;
  }) => {
    try {
      await startGeneration({
        content_type: data.contentType as any,
        keyword_ids: data.keywordIds,
        template_id: data.templateId,
        custom_prompt: data.customPrompt
      });
      setShowGenerationForm(false);
    } catch (error) {
      console.error('Failed to start content generation:', error);
    }
  };

  const handleEditContent = (content: GeneratedContent) => {
    setEditingContent(content);
    setActiveTab('generate');
  };

  const tabs = [
    {
      id: 'generate' as const,
      label: 'Generate',
      icon: Plus,
      description: 'Create new content'
    },
    {
      id: 'manage' as const,
      label: 'Manage',
      icon: FileText,
      description: 'View and edit content'
    },
    {
      id: 'templates' as const,
      label: 'Templates',
      icon: Layout,
      description: 'Manage templates'
    }
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
        <p className="mt-2 text-gray-600">
          Generate, manage, and organize your AI-powered content
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className={`-ml-0.5 mr-2 h-5 w-5 ${
                  activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'generate' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Content Generation</h2>
                  <p className="text-sm text-gray-600">
                    Create new content using AI and your crawled data
                  </p>
                </div>
                <Button onClick={() => setShowGenerationForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Content
                </Button>
              </div>

              {/* Current Generation Status */}
              {currentJobId && (
                <div className="border-t border-gray-200 pt-4">
                  <ContentPreview
                    jobId={currentJobId}
                    content={generatedContent}
                    isEditable={true}
                    showPreview={false}
                  />
                </div>
              )}

              {/* Editing Content */}
              {editingContent && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Editing: {editingContent.title}
                    </h3>
                    <Button
                      variant="outline"
                      onClick={() => setEditingContent(null)}
                    >
                      Close Editor
                    </Button>
                  </div>
                  <ContentPreview
                    content={editingContent.content}
                    isEditable={true}
                    showPreview={false}
                  />
                </div>
              )}

              {/* Empty State */}
              {!currentJobId && !editingContent && (
                <div className="text-center py-12 border-t border-gray-200">
                  <Plus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ready to generate content
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Click the button above to start creating AI-powered content
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <ContentManager onEdit={handleEditContent} />
        )}

        {activeTab === 'templates' && (
          <TemplateManager />
        )}
      </div>

      {/* Generation Form Modal */}
      {showGenerationForm && (
        <Modal
          isOpen={true}
          onClose={() => setShowGenerationForm(false)}
          title="Generate New Content"
          size="lg"
        >
          <ContentGenerationForm
            onSubmit={handleGenerateContent}
            onCancel={() => setShowGenerationForm(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default ContentPage;