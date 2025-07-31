import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentService } from '../services/contentService';
import type { ContentListParams } from '../services/contentService';
import type { ContentGenerateRequest } from '../types';

export const useContent = () => {
  const queryClient = useQueryClient();

  // Get content list
  const useContentList = (params?: ContentListParams) => {
    return useQuery({
      queryKey: ['content', params],
      queryFn: () => contentService.getContent(params),
    });
  };

  // Get single content
  const useContentById = (id: number) => {
    return useQuery({
      queryKey: ['content', id],
      queryFn: () => contentService.getContentById(id),
      enabled: !!id,
    });
  };

  // Generate content mutation
  const generateContentMutation = useMutation({
    mutationFn: (request: ContentGenerateRequest) =>
      contentService.generateContent(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });

  // Update content mutation
  const updateContentMutation = useMutation({
    mutationFn: ({ id, data }: {
      id: number;
      data: { title?: string; content?: string; metadata?: Record<string, unknown> }
    }) => contentService.updateContent(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['content', id] });
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: (id: number) => contentService.deleteContent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => contentService.bulkDeleteContent(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });

  // Export content
  const exportContentMutation = useMutation({
    mutationFn: ({ ids, format }: {
      ids?: number[];
      format: 'markdown' | 'html' | 'pdf' | 'json'
    }) => contentService.exportContent(ids, format),
  });

  // Duplicate content
  const duplicateContentMutation = useMutation({
    mutationFn: (id: number) => contentService.duplicateContent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });

  return {
    useContentList,
    useContentById,
    generateContent: generateContentMutation.mutateAsync,
    updateContent: updateContentMutation.mutateAsync,
    deleteContent: deleteContentMutation.mutateAsync,
    bulkDelete: bulkDeleteMutation.mutateAsync,
    exportContent: exportContentMutation.mutateAsync,
    duplicateContent: duplicateContentMutation.mutateAsync,
    isGenerating: generateContentMutation.isPending,
    isUpdating: updateContentMutation.isPending,
    isDeleting: deleteContentMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
    isExporting: exportContentMutation.isPending,
    isDuplicating: duplicateContentMutation.isPending,
  };
};

export const useContentTemplates = () => {
  const queryClient = useQueryClient();

  // Get templates
  const useTemplates = () => {
    return useQuery({
      queryKey: ['content-templates'],
      queryFn: () => contentService.getTemplates(),
    });
  };

  // Get single template
  const useTemplate = (id: number) => {
    return useQuery({
      queryKey: ['content-templates', id],
      queryFn: () => contentService.getTemplate(id),
      enabled: !!id,
    });
  };

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data: {
      name: string;
      content_type: 'blog' | 'product_intro' | 'trend_analysis';
      template: string;
      description?: string;
    }) => contentService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-templates'] });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: {
      id: number;
      data: Partial<any>
    }) => contentService.updateTemplate(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['content-templates', id] });
      queryClient.invalidateQueries({ queryKey: ['content-templates'] });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => contentService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-templates'] });
    },
  });

  return {
    useTemplates,
    useTemplate,
    createTemplate: createTemplateMutation.mutateAsync,
    updateTemplate: updateTemplateMutation.mutateAsync,
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    isCreating: createTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
  };
};

export const useContentGeneration = () => {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string>('');

  // Start content generation
  const startGeneration = useCallback(async (request: ContentGenerateRequest) => {
    try {
      const response = await contentService.generateContent(request);
      setCurrentJobId(response.job_id);
      return response;
    } catch (error) {
      console.error('Failed to start content generation:', error);
      throw error;
    }
  }, []);

  // Get generation status
  const useGenerationStatus = (jobId: string | null) => {
    return useQuery({
      queryKey: ['content-generation-status', jobId],
      queryFn: () => contentService.getGenerationStatus(jobId!),
      enabled: !!jobId,
      refetchInterval: (query) => {
        // Stop polling if completed or failed
        const data = query.state.data;
        if (data?.status === 'completed' || data?.status === 'failed') {
          return false;
        }
        return 2000; // Poll every 2 seconds
      },
    });
  };

  // Preview content
  const previewContentMutation = useMutation({
    mutationFn: (request: ContentGenerateRequest) =>
      contentService.previewContent(request),
  });

  const clearGeneration = useCallback(() => {
    setCurrentJobId(null);
    setGeneratedContent('');
  }, []);

  return {
    currentJobId,
    generatedContent,
    setGeneratedContent,
    startGeneration,
    useGenerationStatus,
    previewContent: previewContentMutation.mutateAsync,
    clearGeneration,
    isPreviewing: previewContentMutation.isPending,
  };
};