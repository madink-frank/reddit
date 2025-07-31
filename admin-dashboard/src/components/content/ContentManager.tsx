import React, { useState } from 'react';
import { TimedLoading } from '../ui/LoadingSystem';
import { 
  FileText, 
  Edit3, 
  Trash2, 
  Download, 
  Eye, 
  EyeOff, 
  Copy,
  MoreHorizontal,
  Search,
  Filter,
  Calendar,
  Tag
} from 'lucide-react';
import { useContent } from '@/hooks/useContent';
import { ContentPreview } from './ContentPreview';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { Checkbox } from '@/components/ui/Checkbox';
import type { GeneratedContent } from '@/types';

interface ContentManagerProps {
  onEdit?: (content: GeneratedContent) => void;
}

export const ContentManager: React.FC<ContentManagerProps> = ({ onEdit }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('');
  const [selectedContent, setSelectedContent] = useState<number[]>([]);
  const [previewContent, setPreviewContent] = useState<GeneratedContent | null>(null);
  const [editingContent, setEditingContent] = useState<GeneratedContent | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const {
    useContentList,
    updateContent,
    deleteContent,
    bulkDelete,
    exportContent,
    duplicateContent,
    isUpdating,
    isDeleting,
    isBulkDeleting,
    isExporting,
    isDuplicating
  } = useContent();

  const { data: contentData, isLoading, error } = useContentList({
    page: currentPage,
    page_size: pageSize,
    search: searchQuery || undefined,
    content_type: contentTypeFilter || undefined,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  const contentTypes = [
    { value: '', label: 'All Types' },
    { value: 'blog', label: 'Blog Post' },
    { value: 'product_intro', label: 'Product Introduction' },
    { value: 'trend_analysis', label: 'Trend Analysis' },
  ];

  const exportFormats = [
    { value: 'markdown', label: 'Markdown (.md)' },
    { value: 'html', label: 'HTML (.html)' },
    { value: 'pdf', label: 'PDF (.pdf)' },
    { value: 'json', label: 'JSON (.json)' },
  ];

  const handleSelectAll = (checked: boolean) => {
    if (checked && contentData?.data) {
      setSelectedContent(contentData.data.map(item => item.id));
    } else {
      setSelectedContent([]);
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedContent(prev => [...prev, id]);
    } else {
      setSelectedContent(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const handleEdit = (content: GeneratedContent) => {
    setEditingContent(content);
    onEdit?.(content);
  };

  const handleSaveEdit = async (updatedContent: string) => {
    if (!editingContent) return;

    try {
      await updateContent({
        id: editingContent.id,
        data: { content: updatedContent }
      });
      setEditingContent(null);
    } catch (error) {
      console.error('Failed to update content:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteContent(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete content:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContent.length === 0) return;

    try {
      await bulkDelete(selectedContent);
      setSelectedContent([]);
    } catch (error) {
      console.error('Failed to bulk delete content:', error);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const blob = await exportContent({
        ids: selectedContent.length > 0 ? selectedContent : undefined,
        format: format as any
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `content-export.${format === 'json' ? 'json' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export content:', error);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await duplicateContent(id);
    } catch (error) {
      console.error('Failed to duplicate content:', error);
    }
  };

  const togglePublished = async (content: GeneratedContent) => {
    try {
      const isPublished = content.metadata?.published === true;
      await updateContent({
        id: content.id,
        data: {
          metadata: {
            ...content.metadata,
            published: !isPublished
          }
        }
      });
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getContentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      blog: 'Blog',
      product_intro: 'Product',
      trend_analysis: 'Trend'
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

  if (isLoading) {
    return (
      <TimedLoading 
        isLoading={true}
        showSpinner
        className="py-12"
      />
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">Failed to load content</div>
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
          <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
          <p className="text-gray-600">Manage your generated content</p>
        </div>
        
        {selectedContent.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {selectedContent.length} selected
            </span>
            <Select
              value=""
              onChange={(value) => handleExport(value)}
              placeholder="Export as..."
              disabled={isExporting}
            >
              {exportFormats.map(format => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search content..."
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

      {/* Content List */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Checkbox
              checked={selectedContent.length === contentData?.data?.length && contentData?.data?.length > 0}
              onChange={handleSelectAll}
              className="mr-4"
            />
            <span className="text-sm font-medium text-gray-900">
              {contentData?.total || 0} content items
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {contentData?.data?.map((content) => (
            <div key={content.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start space-x-4">
                <Checkbox
                  checked={selectedContent.includes(content.id)}
                  onChange={(checked) => handleSelectItem(content.id, checked)}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {content.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getContentTypeColor(content.content_type)}`}>
                      {getContentTypeLabel(content.content_type)}
                    </span>
                    {content.metadata?.published && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Published
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {content.content.substring(0, 200)}...
                  </p>
                  
                  <div className="flex items-center text-xs text-gray-500 space-x-4">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(content.created_at)}
                    </span>
                    <span className="flex items-center">
                      <Tag className="h-3 w-3 mr-1" />
                      {content.source_keywords.length} keywords
                    </span>
                    <span>
                      {content.content.split(' ').length} words
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewContent(content)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(content)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePublished(content)}
                    disabled={isUpdating}
                  >
                    {content.metadata?.published ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicate(content.id)}
                    disabled={isDuplicating}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(content.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {contentData?.data?.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
            <p className="text-gray-600">
              {searchQuery || contentTypeFilter 
                ? 'Try adjusting your filters' 
                : 'Start by generating some content'
              }
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {contentData && contentData.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={contentData.totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Preview Modal */}
      {previewContent && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewContent(null)}
          title={previewContent.title}
          size="xl"
        >
          <ContentPreview
            content={previewContent.content}
            showPreview={true}
            isEditable={false}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editingContent && (
        <Modal
          isOpen={true}
          onClose={() => setEditingContent(null)}
          title={`Edit: ${editingContent.title}`}
          size="xl"
        >
          <ContentPreview
            content={editingContent.content}
            onContentChange={handleSaveEdit}
            isEditable={true}
            showPreview={false}
          />
          <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setEditingContent(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSaveEdit(editingContent.content)}
              disabled={isUpdating}
            >
              Save Changes
            </Button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <Modal
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          title="Delete Content"
        >
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this content? This action cannot be undone.
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
              onClick={() => handleDelete(showDeleteConfirm)}
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