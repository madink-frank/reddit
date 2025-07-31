import React, { useState, useEffect } from 'react';
import { Hash, Plus, Save } from 'lucide-react';
import { useCreateKeyword, useUpdateKeyword } from '../../hooks/useKeywords';
import type { Keyword } from '../../types';

interface AddKeywordFormProps {
  keyword?: Keyword;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddKeywordForm: React.FC<AddKeywordFormProps> = ({
  keyword,
  onSuccess,
  onCancel
}) => {
  const [keywordText, setKeywordText] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const createMutation = useCreateKeyword();
  const updateMutation = useUpdateKeyword();

  const isEditing = !!keyword;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Initialize form with existing keyword data
  useEffect(() => {
    if (keyword) {
      setKeywordText(keyword.keyword);
      setDescription(keyword.description || '');
      setIsActive(keyword.is_active);
    }
  }, [keyword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywordText.trim()) return;

    try {
      if (isEditing && keyword) {
        await updateMutation.mutateAsync({
          id: keyword.id,
          data: {
            keyword: keywordText.trim(),
            description: description.trim() || undefined,
            is_active: isActive
          }
        });
      } else {
        await createMutation.mutateAsync({
          keyword: keywordText.trim(),
          description: description.trim() || undefined
        });
      }
      onSuccess();
    } catch (error) {
      // Error handling is done by the mutation hooks
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
          Keyword *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Hash className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            id="keyword"
            value={keywordText}
            onChange={(e) => setKeywordText(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter keyword to track"
            required
            disabled={isSubmitting}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Enter a keyword or phrase to track on Reddit
        </p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add a description for this keyword..."
          disabled={isSubmitting}
        />
      </div>

      {isEditing && (
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <span className="ml-2 text-sm text-gray-700">Active</span>
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Inactive keywords will not be crawled for new posts
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
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
          disabled={isSubmitting || !keywordText.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block" />
              {isEditing ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            <>
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 inline mr-1" />
                  Update Keyword
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 inline mr-1" />
                  Add Keyword
                </>
              )}
            </>
          )}
        </button>
      </div>
    </form>
  );
};