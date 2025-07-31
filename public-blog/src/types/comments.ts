// Comment system types

export interface Comment {
  id: string;
  postId: string;
  parentId?: string;
  author: {
    name: string;
    email: string;
    website?: string | undefined;
    avatar?: string | undefined;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  replies?: Comment[];
  isEdited: boolean;
  likeCount: number;
  isLiked?: boolean;
}

export interface CommentFormData {
  name: string;
  email: string;
  website?: string | undefined;
  content: string;
  parentId?: string | undefined;
}

export interface CommentSubmissionResponse {
  success: boolean;
  comment?: Comment;
  message: string;
  requiresModeration?: boolean;
}

export interface CommentModerationAction {
  commentId: string;
  action: 'approve' | 'reject' | 'spam';
  reason?: string;
}

export interface CommentStats {
  total: number;
  approved: number;
  pending: number;
  spam: number;
}

export interface CommentFilters {
  status?: Comment['status'];
  postId?: string;
  authorEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'likeCount';
  sortOrder?: 'asc' | 'desc';
}

export interface CommentValidationError {
  field: keyof CommentFormData;
  message: string;
}

export interface CommentSettings {
  enabled: boolean;
  requireModeration: boolean;
  allowAnonymous: boolean;
  maxLength: number;
  allowReplies: boolean;
  maxNestingLevel: number;
  spamProtection: {
    enabled: boolean;
    honeypot: boolean;
    rateLimit: {
      maxCommentsPerHour: number;
      maxCommentsPerDay: number;
    };
    blockedWords: string[];
    blockedEmails: string[];
    blockedIPs: string[];
  };
  notifications: {
    adminOnNewComment: boolean;
    authorOnReply: boolean;
    emailTemplate: string;
  };
}