import React, { useState } from 'react';
import { Button, Input } from '@/components/ui';
import type { CommentFormData, CommentSubmissionResponse } from '@/types/comments';

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSubmit: (data: CommentFormData) => Promise<CommentSubmissionResponse>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  placeholder?: string;
}

const CommentForm: React.FC<CommentFormProps> = ({
  parentId,
  onSubmit,
  onCancel,
  isSubmitting = false,
  placeholder = "Share your thoughts..."
}) => {
  const [formData, setFormData] = useState<CommentFormData>({
    name: '',
    email: '',
    website: '',
    content: '',
    parentId: parentId || undefined
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (field: keyof CommentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.website && formData.website.trim()) {
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(formData.website)) {
        newErrors.website = 'Please enter a valid URL (including http:// or https://)';
      }
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Comment is required';
    } else if (formData.content.length < 10) {
      newErrors.content = 'Comment must be at least 10 characters';
    } else if (formData.content.length > 2000) {
      newErrors.content = 'Comment must be less than 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const response = await onSubmit(formData);
      
      if (response.success) {
        setShowSuccess(true);
        setFormData({
          name: '',
          email: '',
          website: '',
          content: '',
          parentId: parentId || undefined
        });
        
        // Hide success message after 3 seconds
        setTimeout(() => setShowSuccess(false), 3000);
        
        if (response.requiresModeration) {
          // Show moderation message
        }
      } else {
        setErrors({ submit: response.message });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to submit comment. Please try again.' });
    }
  };

  const characterCount = formData.content.length;
  const maxCharacters = 2000;
  const isNearLimit = characterCount > maxCharacters * 0.8;

  return (
    <div className="bg-white rounded-lg border p-6">
      {showSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            Comment submitted successfully! {parentId ? 'Your reply' : 'Your comment'} will appear shortly.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Your name"
              className={errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your@email.com"
              className={errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Your email will not be published
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
            Website (optional)
          </label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            placeholder="https://yourwebsite.com"
            className={errors.website ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
            disabled={isSubmitting}
          />
          {errors.website && (
            <p className="mt-1 text-sm text-red-600">{errors.website}</p>
          )}
        </div>

        {/* Comment Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            {parentId ? 'Reply' : 'Comment'} *
          </label>
          <textarea
            id="content"
            rows={4}
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical ${
              errors.content ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.content ? (
              <p className="text-sm text-red-600">{errors.content}</p>
            ) : (
              <div />
            )}
            <p className={`text-xs ${isNearLimit ? 'text-orange-600' : 'text-gray-500'}`}>
              {characterCount}/{maxCharacters}
            </p>
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{errors.submit}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-xs text-gray-500">
            Comments are moderated and may take some time to appear.
          </div>
          <div className="flex items-center gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.email || !formData.content}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Posting...
                </div>
              ) : (
                parentId ? 'Post Reply' : 'Post Comment'
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Honeypot field for spam protection */}
      <input
        type="text"
        name="website_url"
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
};

export default CommentForm;