import React, { useState, useMemo } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  FunnelIcon,
  ArrowsUpDownIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useKeywords, useDeleteKeyword, useBulkDeleteKeywords, useBulkUpdateKeywords, useExportKeywords } from '../hooks/useKeywords';
import { AddKeywordForm } from '../components/forms/AddKeywordForm';
import { KeywordStatsCard } from '../components/keywords/KeywordStatsCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Checkbox } from '../components/ui/Checkbox';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Dropdown } from '../components/ui/Dropdown';
import { formatDate } from '../lib/utils';
import type { Keyword } from '../types';

interface KeywordFilters {
  search: string;
  isActive?: boolean;
  sortBy: 'keyword' | 'created_at' | 'post_count';
  sortOrder: 'asc' | 'desc';
}

type ViewMode = 'table' | 'cards';

const KeywordsPage: React.FC = () => {
  const [filters, setFilters] = useState<KeywordFilters>({
    search: '',
    isActive: undefined,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  
  const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [keywordToDelete, setKeywordToDelete] = useState<Keyword | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Fetch keywords with filters
  const { data: keywordsResponse, isLoading, error } = useKeywords({
    search: filters.search || undefined,
    is_active: filters.isActive,
    sort_by: filters.sortBy,
    sort_order: filters.sortOrder,
    page_size: 50
  });

  const deleteKeywordMutation = useDeleteKeyword();
  const bulkDeleteMutation = useBulkDeleteKeywords();
  const bulkUpdateMutation = useBulkUpdateKeywords();
  const exportMutation = useExportKeywords();

  const keywords = keywordsResponse?.data || [];
  const totalKeywords = keywordsResponse?.total || 0;

  // Handle search input
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof KeywordFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle keyword selection
  const handleKeywordSelect = (keywordId: number, selected: boolean) => {
    if (selected) {
      setSelectedKeywords(prev => [...prev, keywordId]);
    } else {
      setSelectedKeywords(prev => prev.filter(id => id !== keywordId));
    }
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedKeywords(keywords.map(k => k.id));
    } else {
      setSelectedKeywords([]);
    }
  };

  // Handle single keyword delete
  const handleDeleteKeyword = async (keyword: Keyword) => {
    setKeywordToDelete(keyword);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (keywordToDelete) {
      await deleteKeywordMutation.mutateAsync(keywordToDelete.id);
      setShowDeleteConfirm(false);
      setKeywordToDelete(null);
    }
  };

  // Handle bulk actions
  const handleBulkDelete = async () => {
    if (selectedKeywords.length > 0) {
      await bulkDeleteMutation.mutateAsync(selectedKeywords);
      setSelectedKeywords([]);
    }
  };

  const handleBulkToggleActive = async (isActive: boolean) => {
    if (selectedKeywords.length > 0) {
      await bulkUpdateMutation.mutateAsync({
        ids: selectedKeywords,
        updates: { is_active: isActive }
      });
      setSelectedKeywords([]);
    }
  };

  const handleExportSelected = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const blob = await exportMutation.mutateAsync(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `keywords-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Computed values
  const isAllSelected = keywords.length > 0 && selectedKeywords.length === keywords.length;
  const isPartiallySelected = selectedKeywords.length > 0 && selectedKeywords.length < keywords.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading keywords: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Keywords Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage keywords for Reddit content crawling and analysis
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            variant="outline"
            onClick={() => handleExportSelected('csv')}
            disabled={exportMutation.isPending}
          >
            <ArrowDownTrayIcon className="icon-sm mr-2" />
            Export All
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center"
          >
            <PlusIcon className="icon-sm mr-2" />
            Add Keyword
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {/* Search */}
            <div className="sm:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-sm text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search keywords..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={filters.isActive === undefined ? 'all' : filters.isActive ? 'active' : 'inactive'}
                onValueChange={(value) => {
                  const isActive = value === 'all' ? undefined : value === 'active';
                  handleFilterChange('isActive', isActive);
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <Select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-') as [typeof filters.sortBy, typeof filters.sortOrder];
                  setFilters(prev => ({ ...prev, sortBy, sortOrder }));
                }}
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="keyword-asc">Name A-Z</option>
                <option value="keyword-desc">Name Z-A</option>
                <option value="post_count-desc">Most Posts</option>
                <option value="post_count-asc">Least Posts</option>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedKeywords.length > 0 && (
            <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-md">
              <span className="text-sm text-blue-700">
                {selectedKeywords.length} keyword{selectedKeywords.length > 1 ? 's' : ''} selected
              </span>
              <Dropdown
                align="right"
                trigger={
                  <Button size="sm" variant="outline">
                    Bulk Actions
                    <ChevronDownIcon className="icon-sm ml-1" />
                  </Button>
                }
                items={[
                  {
                    label: 'Activate Selected',
                    icon: <EyeIcon className="icon-sm" />,
                    onClick: () => handleBulkToggleActive(true),
                    disabled: bulkUpdateMutation.isPending
                  },
                  {
                    label: 'Deactivate Selected',
                    icon: <EyeSlashIcon className="icon-sm" />,
                    onClick: () => handleBulkToggleActive(false),
                    disabled: bulkUpdateMutation.isPending
                  },
                  {
                    label: 'Export as CSV',
                    icon: <ArrowDownTrayIcon className="icon-sm" />,
                    onClick: () => handleExportSelected('csv'),
                    disabled: exportMutation.isPending
                  },
                  {
                    label: 'Export as JSON',
                    icon: <ArrowDownTrayIcon className="icon-sm" />,
                    onClick: () => handleExportSelected('json'),
                    disabled: exportMutation.isPending
                  },
                  {
                    label: 'Delete Selected',
                    icon: <TrashIcon className="icon-sm" />,
                    onClick: handleBulkDelete,
                    disabled: bulkDeleteMutation.isPending,
                    variant: 'destructive'
                  }
                ]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Keywords Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Keywords ({totalKeywords})
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant={viewMode === 'table' ? 'primary' : 'outline'}
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'cards' ? 'primary' : 'outline'}
                onClick={() => setViewMode('cards')}
              >
                <ChartBarIcon className="icon-sm mr-1" />
                Stats
              </Button>
            </div>
          </div>

          {keywords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No keywords found</p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="mt-4"
              >
                Add Your First Keyword
              </Button>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {keywords.map((keyword) => (
                <div key={keyword.id} className="relative">
                  <div className="absolute top-4 right-4 z-10">
                    <Checkbox
                      checked={selectedKeywords.includes(keyword.id)}
                      onChange={(e) => handleKeywordSelect(keyword.id, e.target.checked)}
                    />
                  </div>
                  <KeywordStatsCard keyword={keyword} showChart={true} />
                  <div className="absolute bottom-4 right-4 flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingKeyword(keyword)}
                      className="bg-white shadow-sm"
                    >
                      <PencilIcon className="icon-sm" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteKeyword(keyword)}
                      className="bg-white shadow-sm text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="icon-sm" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={isPartiallySelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keyword
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {keywords.map((keyword) => (
                    <tr key={keyword.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Checkbox
                          checked={selectedKeywords.includes(keyword.id)}
                          onChange={(e) => handleKeywordSelect(keyword.id, e.target.checked)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {keyword.keyword}
                          </div>
                          {keyword.description && (
                            <div className="text-sm text-gray-500">
                              {keyword.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={keyword.is_active ? 'success' : 'secondary'}
                        >
                          {keyword.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {keyword.post_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(keyword.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingKeyword(keyword)}
                          >
                            <PencilIcon className="icon-sm" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteKeyword(keyword)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="icon-sm" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Keyword Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Keyword"
      >
        <AddKeywordForm
          onSuccess={() => setShowAddModal(false)}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Keyword Modal */}
      <Modal
        isOpen={!!editingKeyword}
        onClose={() => setEditingKeyword(null)}
        title="Edit Keyword"
      >
        {editingKeyword && (
          <AddKeywordForm
            keyword={editingKeyword}
            onSuccess={() => setEditingKeyword(null)}
            onCancel={() => setEditingKeyword(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Keyword"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the keyword "{keywordToDelete?.keyword}"? 
            This action cannot be undone and will also delete all associated posts.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteKeywordMutation.isPending}
            >
              {deleteKeywordMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default KeywordsPage;