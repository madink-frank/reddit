import React, { useState } from 'react';
import { 
  Layout, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Copy, 
  Share2,
  Code,
  FileText,
  Search,
  Filter
} from 'lucide-react';
import { useContentTemplates } from '@/hooks/useContent';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { ContentTemplate } from '@/services/contentService';

interface TemplateManagerProps {
  onSelectTemplate?: (template: ContentTemplate) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({ onSelectTemplate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContentTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ContentTemplate | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const {
    useTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    isCreating,
    isUpdating,
    isDeleting
  } = useContentTemplates();

  const { data: templates, isLoading, error } = useTemplates();

  const contentTypes = [
    { value: '', label: 'All Types' },
    { value: 'blog', label: 'Blog Post' },
    { value: 'product_intro', label: 'Product Introduction' },
    { value: 'trend_analysis', label: 'Trend Analysis' },
  ];

  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !contentTypeFilter || template.content_type === contentTypeFilter;
    
    return matchesSearch && matchesType;
  }) || [];

  const handleCreateTemplate = async (templateData: {
    name: string;
    content_type: 'blog' | 'product_intro' | 'trend_analysis';
    template: string;
    description?: string;
  }) => {
    try {
      await createTemplate(templateData);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleUpdateTemplate = async (id: number, data: Partial<ContentTemplate>) => {
    try {
      await updateTemplate({ id, data });
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      await deleteTemplate(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleDuplicateTemplate = async (template: ContentTemplate) => {
    try {
      await createTemplate({
        name: `${template.name} (Copy)`,
        content_type: template.content_type,
        template: template.template,
        description: template.description
      });
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const getContentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      blog: 'Blog Post',
      product_intro: 'Product Introduction',
      trend_analysis: 'Trend Analysis'
    };
    return typeMap[type] || type;
  };

  const getContentTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      blog: 'bg-blue-100 text-blue-800',
      product_intro: 'bg-green-100 text-green-800',
      trend_analysis: 'bg-purple-100 text-purple-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  const extractVariables = (template: string) => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;
    
    while ((match = variableRegex.exec(template)) !== null) {
      variables.add(match[1]);
    }
    
    return Array.from(variables);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-2 text-gray-600">Loading templates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">Failed to load templates</div>
        <button 
          onClick={() => window.location.reload()} 
          className="text-blue-600 hover:text-blue-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template Management</h2>
          <p className="text-gray-600">Create and manage content templates</p>
        </div>
        
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          value={contentTypeFilter}
          onChange={setContentTypeFilter}
          className="w-full sm:w-48"
        >
          {contentTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {template.name}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getContentTypeColor(template.content_type)}`}>
                  {getContentTypeLabel(template.content_type)}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingTemplate(template)}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicateTemplate(template)}
                  disabled={isCreating}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(template.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {template.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {template.description}
              </p>
            )}

            <div className="space-y-3">
              {template.variables.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Variables
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.variables.map((variable) => (
                      <span
                        key={variable}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  Created {new Date(template.created_at).toLocaleDateString()}
                </span>
                <span className={`px-2 py-1 rounded-full ${
                  template.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {onSelectTemplate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectTemplate(template)}
                  className="w-full"
                >
                  Use Template
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Layout className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || contentTypeFilter 
              ? 'Try adjusting your filters' 
              : 'Create your first template to get started'
            }
          </p>
          {!searchQuery && !contentTypeFilter && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          )}
        </div>
      )}

      {/* Create/Edit Template Modal */}
      {(showCreateModal || editingTemplate) && (
        <TemplateFormModal
          template={editingTemplate}
          onSave={editingTemplate 
            ? (data) => handleUpdateTemplate(editingTemplate.id, data)
            : handleCreateTemplate
          }
          onClose={() => {
            setShowCreateModal(false);
            setEditingTemplate(null);
          }}
          isLoading={isCreating || isUpdating}
        />
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <Modal
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          title="Delete Template"
        >
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this template? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleDeleteTemplate(showDeleteConfirm)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Template Form Modal Component
interface TemplateFormModalProps {
  template?: ContentTemplate | null;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

const TemplateFormModal: React.FC<TemplateFormModalProps> = ({
  template,
  onSave,
  onClose,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    content_type: template?.content_type || 'blog' as const,
    template: template?.template || '',
    description: template?.description || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  const extractedVariables = React.useMemo(() => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;
    
    while ((match = variableRegex.exec(formData.template)) !== null) {
      variables.add(match[1]);
    }
    
    return Array.from(variables);
  }, [formData.template]);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={template ? 'Edit Template' : 'Create Template'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter template name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Type *
            </label>
            <Select
              value={formData.content_type}
              onChange={(value) => setFormData(prev => ({ ...prev, content_type: value as any }))}
              required
            >
              <option value="blog">Blog Post</option>
              <option value="product_intro">Product Introduction</option>
              <option value="trend_analysis">Trend Analysis</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <Input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of the template"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Content *
          </label>
          <textarea
            value={formData.template}
            onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value }))}
            placeholder="Enter your template content using {{variable}} syntax for dynamic content"
            className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Use double curly braces for variables: {'{{keyword}}, {{title}}, {{content}}'}
          </p>
        </div>

        {extractedVariables.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detected Variables
            </label>
            <div className="flex flex-wrap gap-2">
              {extractedVariables.map((variable) => (
                <span
                  key={variable}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                >
                  {variable}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formData.name || !formData.template}
          >
            {isLoading ? 'Saving...' : (template ? 'Update' : 'Create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Template Preview Modal Component
interface TemplatePreviewModalProps {
  template: ContentTemplate;
  onClose: () => void;
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  onClose
}) => {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Preview: ${template.name}`}
      size="xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Type:</span>
            <span className="ml-2">{template.content_type}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
              template.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {template.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {template.description && (
          <div>
            <span className="font-medium text-gray-700">Description:</span>
            <p className="mt-1 text-gray-600">{template.description}</p>
          </div>
        )}

        {template.variables.length > 0 && (
          <div>
            <span className="font-medium text-gray-700">Variables:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {template.variables.map((variable) => (
                <span
                  key={variable}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                >
                  {variable}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <span className="font-medium text-gray-700">Template Content:</span>
          <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
              {template.template}
            </pre>
          </div>
        </div>
      </div>
    </Modal>
  );
};