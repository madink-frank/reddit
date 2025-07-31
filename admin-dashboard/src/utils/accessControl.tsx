/**
 * Access Control and User Permission Management
 * 
 * Provides role-based access control and permission management for dashboard features
 */

// Permission types
export type Permission = 
  | 'dashboard.view'
  | 'dashboard.admin'
  | 'nlp.analyze'
  | 'nlp.batch'
  | 'image.analyze'
  | 'image.batch'
  | 'analytics.view'
  | 'analytics.advanced'
  | 'monitoring.view'
  | 'monitoring.realtime'
  | 'billing.view'
  | 'billing.manage'
  | 'export.basic'
  | 'export.advanced'
  | 'keywords.view'
  | 'keywords.manage'
  | 'posts.view'
  | 'posts.manage'
  | 'content.view'
  | 'content.generate'
  | 'system.admin'
  | 'users.manage';

// User roles
export type UserRole = 
  | 'viewer'
  | 'analyst'
  | 'manager'
  | 'admin'
  | 'super_admin';

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  metadata?: {
    department?: string;
    team?: string;
    pointsLimit?: number;
    features?: string[];
  };
}

// Permission check result
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
}

// Role definitions with permissions
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  viewer: [
    'dashboard.view',
    'analytics.view',
    'monitoring.view',
    'billing.view',
    'keywords.view',
    'posts.view',
    'content.view'
  ],
  
  analyst: [
    'dashboard.view',
    'nlp.analyze',
    'image.analyze',
    'analytics.view',
    'analytics.advanced',
    'monitoring.view',
    'billing.view',
    'export.basic',
    'keywords.view',
    'posts.view',
    'content.view'
  ],
  
  manager: [
    'dashboard.view',
    'nlp.analyze',
    'nlp.batch',
    'image.analyze',
    'image.batch',
    'analytics.view',
    'analytics.advanced',
    'monitoring.view',
    'monitoring.realtime',
    'billing.view',
    'billing.manage',
    'export.basic',
    'export.advanced',
    'keywords.view',
    'keywords.manage',
    'posts.view',
    'posts.manage',
    'content.view',
    'content.generate'
  ],
  
  admin: [
    'dashboard.view',
    'dashboard.admin',
    'nlp.analyze',
    'nlp.batch',
    'image.analyze',
    'image.batch',
    'analytics.view',
    'analytics.advanced',
    'monitoring.view',
    'monitoring.realtime',
    'billing.view',
    'billing.manage',
    'export.basic',
    'export.advanced',
    'keywords.view',
    'keywords.manage',
    'posts.view',
    'posts.manage',
    'content.view',
    'content.generate',
    'system.admin'
  ],
  
  super_admin: [
    'dashboard.view',
    'dashboard.admin',
    'nlp.analyze',
    'nlp.batch',
    'image.analyze',
    'image.batch',
    'analytics.view',
    'analytics.advanced',
    'monitoring.view',
    'monitoring.realtime',
    'billing.view',
    'billing.manage',
    'export.basic',
    'export.advanced',
    'keywords.view',
    'keywords.manage',
    'posts.view',
    'posts.manage',
    'content.view',
    'content.generate',
    'system.admin',
    'users.manage'
  ]
};

// Feature requirements
const FEATURE_REQUIREMENTS: Record<string, { permissions: Permission[]; minRole?: UserRole }> = {
  '/admin/dashboard': {
    permissions: ['dashboard.view']
  },
  '/admin/nlp-analysis': {
    permissions: ['nlp.analyze']
  },
  '/admin/image-analysis': {
    permissions: ['image.analyze']
  },
  '/admin/advanced-analytics': {
    permissions: ['analytics.advanced'],
    minRole: 'analyst'
  },
  '/admin/business-intelligence': {
    permissions: ['analytics.advanced'],
    minRole: 'manager'
  },
  '/admin/real-time-monitoring': {
    permissions: ['monitoring.realtime'],
    minRole: 'manager'
  },
  '/admin/billing': {
    permissions: ['billing.view']
  },
  '/admin/reports': {
    permissions: ['export.basic']
  },
  '/admin/export': {
    permissions: ['export.advanced'],
    minRole: 'manager'
  },
  '/admin/keywords': {
    permissions: ['keywords.view']
  },
  '/admin/posts': {
    permissions: ['posts.view']
  },
  '/admin/content': {
    permissions: ['content.view']
  }
};

// Access Control Manager
export class AccessControlManager {
  private currentUser: User | null = null;
  private sessionTimeout: number = 8 * 60 * 60 * 1000; // 8 hours
  private lastActivity: Date = new Date();

  /**
   * Set current user
   */
  setCurrentUser(user: User): void {
    this.currentUser = user;
    this.lastActivity = new Date();
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (!this.currentUser) return false;
    
    // Check session timeout
    const now = new Date();
    const timeSinceActivity = now.getTime() - this.lastActivity.getTime();
    
    if (timeSinceActivity > this.sessionTimeout) {
      this.logout();
      return false;
    }
    
    return this.currentUser.isActive;
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    this.lastActivity = new Date();
  }

  /**
   * Logout current user
   */
  logout(): void {
    this.currentUser = null;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: Permission): PermissionResult {
    if (!this.isAuthenticated()) {
      return {
        allowed: false,
        reason: 'User not authenticated'
      };
    }

    const user = this.currentUser!;
    
    // Check if user has the specific permission
    if (user.permissions.includes(permission)) {
      return { allowed: true };
    }

    // Check if user's role includes the permission
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    if (rolePermissions.includes(permission)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Missing permission: ${permission}`,
      requiredPermissions: [permission]
    };
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: Permission[]): PermissionResult {
    if (!this.isAuthenticated()) {
      return {
        allowed: false,
        reason: 'User not authenticated'
      };
    }

    for (const permission of permissions) {
      const result = this.hasPermission(permission);
      if (result.allowed) {
        return { allowed: true };
      }
    }

    return {
      allowed: false,
      reason: `Missing any of permissions: ${permissions.join(', ')}`,
      requiredPermissions: permissions
    };
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(permissions: Permission[]): PermissionResult {
    if (!this.isAuthenticated()) {
      return {
        allowed: false,
        reason: 'User not authenticated'
      };
    }

    const missingPermissions: Permission[] = [];

    for (const permission of permissions) {
      const result = this.hasPermission(permission);
      if (!result.allowed) {
        missingPermissions.push(permission);
      }
    }

    if (missingPermissions.length > 0) {
      return {
        allowed: false,
        reason: `Missing permissions: ${missingPermissions.join(', ')}`,
        requiredPermissions: missingPermissions
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user has minimum role
   */
  hasMinimumRole(minRole: UserRole): PermissionResult {
    if (!this.isAuthenticated()) {
      return {
        allowed: false,
        reason: 'User not authenticated'
      };
    }

    const user = this.currentUser!;
    const roleHierarchy: UserRole[] = ['viewer', 'analyst', 'manager', 'admin', 'super_admin'];
    
    const userRoleIndex = roleHierarchy.indexOf(user.role);
    const minRoleIndex = roleHierarchy.indexOf(minRole);

    if (userRoleIndex >= minRoleIndex) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Insufficient role. Required: ${minRole}, Current: ${user.role}`,
      requiredRole: minRole
    };
  }

  /**
   * Check access to specific feature/route
   */
  canAccessFeature(featurePath: string): PermissionResult {
    if (!this.isAuthenticated()) {
      return {
        allowed: false,
        reason: 'User not authenticated'
      };
    }

    const requirements = FEATURE_REQUIREMENTS[featurePath];
    if (!requirements) {
      // If no specific requirements, allow access for authenticated users
      return { allowed: true };
    }

    // Check minimum role if specified
    if (requirements.minRole) {
      const roleResult = this.hasMinimumRole(requirements.minRole);
      if (!roleResult.allowed) {
        return roleResult;
      }
    }

    // Check required permissions
    return this.hasAllPermissions(requirements.permissions);
  }

  /**
   * Get user's effective permissions (role + individual permissions)
   */
  getEffectivePermissions(): Permission[] {
    if (!this.currentUser) return [];

    const rolePermissions = ROLE_PERMISSIONS[this.currentUser.role] || [];
    const userPermissions = this.currentUser.permissions || [];

    // Combine and deduplicate
    return Array.from(new Set([...rolePermissions, ...userPermissions]));
  }

  /**
   * Check if user can perform bulk operations
   */
  canPerformBulkOperations(): boolean {
    const bulkPermissions: Permission[] = ['nlp.batch', 'image.batch', 'export.advanced'];
    return this.hasAnyPermission(bulkPermissions).allowed;
  }

  /**
   * Get user's points limit
   */
  getPointsLimit(): number | null {
    if (!this.currentUser?.metadata?.pointsLimit) return null;
    return this.currentUser.metadata.pointsLimit;
  }

  /**
   * Check if user can access feature based on points
   */
  canAffordFeature(requiredPoints: number): PermissionResult {
    const limit = this.getPointsLimit();
    if (limit === null) return { allowed: true }; // No limit set

    if (requiredPoints > limit) {
      return {
        allowed: false,
        reason: `Insufficient points limit. Required: ${requiredPoints}, Limit: ${limit}`
      };
    }

    return { allowed: true };
  }
}

// Audit logging
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: Record<string, any>;
}

export class AuditLogger {
  private logs: AuditLog[] = [];
  private maxLogs: number = 10000;

  /**
   * Log user action
   */
  log(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const auditEntry: AuditLog = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.logs.unshift(auditEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // In a real application, this would be sent to a logging service
    console.log('Audit Log:', auditEntry);
  }

  /**
   * Get logs for a specific user
   */
  getUserLogs(userId: string, limit: number = 100): AuditLog[] {
    return this.logs
      .filter(log => log.userId === userId)
      .slice(0, limit);
  }

  /**
   * Get logs for a specific action
   */
  getActionLogs(action: string, limit: number = 100): AuditLog[] {
    return this.logs
      .filter(log => log.action === action)
      .slice(0, limit);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 100): AuditLog[] {
    return this.logs.slice(0, limit);
  }

  /**
   * Clear old logs
   */
  clearOldLogs(olderThanDays: number = 90): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    this.logs = this.logs.filter(log => log.timestamp > cutoffDate);
  }
}

// Privacy protection utilities
export class PrivacyProtection {
  /**
   * Anonymize user data for analytics
   */
  static anonymizeUser(user: User): Partial<User> {
    return {
      id: this.hashString(user.id),
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      metadata: {
        department: user.metadata?.department,
        team: user.metadata?.team
      }
    };
  }

  /**
   * Anonymize IP address
   */
  static anonymizeIpAddress(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      // IPv4: Replace last octet with 0
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
    
    // IPv6: Keep first 64 bits, zero the rest
    const ipv6Parts = ip.split(':');
    if (ipv6Parts.length >= 4) {
      return `${ipv6Parts.slice(0, 4).join(':')}::`;
    }
    
    return 'anonymized';
  }

  /**
   * Hash sensitive data
   */
  static hashString(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Redact sensitive information from text
   */
  static redactSensitiveInfo(text: string): string {
    return text
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]')
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_REDACTED]')
      .replace(/\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/g, '[PHONE_REDACTED]');
  }

  /**
   * Check if data contains PII
   */
  static containsPII(text: string): boolean {
    const piiPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
      /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/ // Phone number
    ];

    return piiPatterns.some(pattern => pattern.test(text));
  }
}

// Default instances
export const accessControl = new AccessControlManager();
export const auditLogger = new AuditLogger();

// Helper functions for React components
export const useAccessControl = () => {
  return {
    user: accessControl.getCurrentUser(),
    isAuthenticated: () => accessControl.isAuthenticated(),
    hasPermission: (permission: Permission) => accessControl.hasPermission(permission),
    canAccessFeature: (feature: string) => accessControl.canAccessFeature(feature),
    getEffectivePermissions: () => accessControl.getEffectivePermissions(),
    updateActivity: () => accessControl.updateActivity()
  };
};

// Route protection HOC helper
export const requiresPermission = (permission: Permission) => {
  return (WrappedComponent: React.ComponentType<any>) => {
    return (props: any) => {
      const result = accessControl.hasPermission(permission);
      
      if (!result.allowed) {
        return (
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-error mb-4">Access Denied</h2>
            <p className="text-secondary">{result.reason}</p>
          </div>
        );
      }
      
      return <WrappedComponent {...props} />;
    };
  };
};