/**
 * Integrated Navigation Component
 * 
 * Provides consistent navigation across all dashboard features
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Brain,
  Image,
  BarChart3,
  TrendingUp,
  Activity,
  DollarSign,
  FileText,
  Hash,
  MessageSquare,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Target,
  Eye,
  Download,
  Bell,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAdvancedDashboard, useNLPDashboard, useImageDashboard } from '../../hooks/useAdvancedDashboard';
import { useBilling } from '../../hooks/useBilling';

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
  children?: NavigationItem[];
  isNew?: boolean;
  requiresAuth?: boolean;
  minPoints?: number;
}

interface IntegratedNavigationProps {
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export const IntegratedNavigation: React.FC<IntegratedNavigationProps> = ({
  className = '',
  collapsed = false,
  onToggle
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isInitialized } = useAdvancedDashboard();
  const { stats: nlpStats } = useNLPDashboard();
  const { stats: imageStats } = useImageDashboard();
  const { balance } = useBilling();

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['analytics']));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation structure
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: Home,
      description: 'Main dashboard overview'
    },
    {
      id: 'data-management',
      label: 'Data Management',
      path: '/admin/keywords',
      icon: Hash,
      children: [
        {
          id: 'keywords',
          label: 'Keywords',
          path: '/admin/keywords',
          icon: Hash,
          description: 'Manage tracked keywords'
        },
        {
          id: 'posts',
          label: 'Posts',
          path: '/admin/posts',
          icon: MessageSquare,
          description: 'View collected posts'
        },
        {
          id: 'content',
          label: 'Content',
          path: '/admin/content',
          icon: FileText,
          description: 'Generated content'
        }
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics & Analysis',
      path: '/admin/analytics',
      icon: BarChart3,
      children: [
        {
          id: 'basic-analytics',
          label: 'Basic Analytics',
          path: '/admin/analytics',
          icon: BarChart3,
          description: 'Standard analytics dashboard'
        },
        {
          id: 'advanced-analytics',
          label: 'Advanced Analytics',
          path: '/admin/advanced-analytics',
          icon: Zap,
          description: 'Comparative analysis and trends',
          isNew: true
        },
        {
          id: 'nlp-analysis',
          label: 'NLP Analysis',
          path: '/admin/nlp-analysis',
          icon: Brain,
          description: 'Text analysis and sentiment',
          badge: nlpStats?.totalAnalyses?.toString()
        },
        {
          id: 'image-analysis',
          label: 'Image Analysis',
          path: '/admin/image-analysis',
          icon: Image,
          description: 'OCR and object detection',
          badge: imageStats?.totalAnalyses?.toString()
        }
      ]
    },
    {
      id: 'business-intelligence',
      label: 'Business Intelligence',
      path: '/admin/business-intelligence',
      icon: Target,
      children: [
        {
          id: 'business-dashboard',
          label: 'BI Dashboard',
          path: '/admin/business-intelligence',
          icon: Target,
          description: 'Executive insights and KPIs'
        },
        {
          id: 'forecasting',
          label: 'Forecasting',
          path: '/admin/forecasting',
          icon: TrendingUp,
          description: 'Predictive analytics'
        }
      ]
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      path: '/admin/monitoring',
      icon: Activity,
      children: [
        {
          id: 'system-monitoring',
          label: 'System Monitoring',
          path: '/admin/monitoring',
          icon: Activity,
          description: 'Basic system health'
        },
        {
          id: 'real-time-monitoring',
          label: 'Real-time Monitoring',
          path: '/admin/real-time-monitoring',
          icon: Eye,
          description: 'Live metrics and alerts',
          isNew: true
        }
      ]
    },
    {
      id: 'reports-export',
      label: 'Reports & Export',
      path: '/admin/reports',
      icon: Download,
      children: [
        {
          id: 'reports',
          label: 'Reports',
          path: '/admin/reports',
          icon: FileText,
          description: 'Generated reports'
        },
        {
          id: 'export',
          label: 'Data Export',
          path: '/admin/export',
          icon: Download,
          description: 'Export data in various formats'
        }
      ]
    },
    {
      id: 'billing',
      label: 'Billing',
      path: '/admin/billing',
      icon: DollarSign,
      description: 'Usage and billing management',
      badge: balance ? `${balance.current_points} pts` : undefined
    }
  ];

  // Handle item click
  const handleItemClick = (item: NavigationItem) => {
    if (item.children && item.children.length > 0) {
      // Toggle expansion for parent items
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    } else {
      // Navigate to the item
      navigate(item.path);
      setIsMobileMenuOpen(false);
    }
  };

  // Check if item is active
  const isItemActive = (item: NavigationItem): boolean => {
    if (item.path === location.pathname) return true;
    if (item.children) {
      return item.children.some(child => child.path === location.pathname);
    }
    return false;
  };

  // Auto-expand active parent items
  useEffect(() => {
    navigationItems.forEach(item => {
      if (item.children && item.children.some(child => child.path === location.pathname)) {
        setExpandedItems(prev => new Set([...prev, item.id]));
      }
    });
  }, [location.pathname]);

  // Render navigation item
  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isActive = isItemActive(item);
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className={`${level > 0 ? 'ml-4' : ''}`}>
        <button
          onClick={() => handleItemClick(item)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${isActive
            ? 'bg-primary text-white'
            : 'text-secondary hover:bg-surface-secondary hover:text-primary'
            } ${collapsed && level === 0 ? 'justify-center px-2' : ''}`}
          title={collapsed ? item.label : undefined}
        >
          <div className="flex items-center gap-3 min-w-0">
            <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{item.label}</span>

                  {item.isNew && (
                    <Badge variant="success" className="text-xs">
                      New
                    </Badge>
                  )}

                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </div>

                {item.description && level === 0 && (
                  <p className="text-xs text-tertiary truncate mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {!collapsed && hasChildren && (
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          )}
        </button>

        {/* Child items */}
        {!collapsed && hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation Sidebar */}
      <div className={`
        ${className}
        ${collapsed ? 'w-16' : 'w-64'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed lg:static top-0 left-0 h-full bg-surface-primary border-r border-primary
        transition-all duration-300 ease-in-out z-40
        flex flex-col
      `}>
        {/* Header */}
        <div className={`p-4 border-b border-primary ${collapsed ? 'px-2' : ''}`}>
          {!collapsed ? (
            <div>
              <h1 className="text-lg font-bold text-primary">Advanced Dashboard</h1>
              <p className="text-xs text-secondary mt-1">Reddit Content Platform</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* System Status */}
        {!collapsed && (
          <div className="p-4 border-b border-primary">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-success' : 'bg-warning'
                }`} />
              <span className="text-sm font-medium text-primary">
                {isInitialized ? 'All Systems Ready' : 'Initializing...'}
              </span>
            </div>

            {balance !== undefined && (
              <div className="text-xs text-secondary">
                Balance: {balance.current_points} points
              </div>
            )}
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {navigationItems.map(item => renderNavigationItem(item))}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t border-primary ${collapsed ? 'px-2' : ''}`}>
          {!collapsed ? (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => navigate('/admin/settings')}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  // TODO: Implement help system
                  console.log('Open help');
                }}
              >
                <HelpCircle className="w-4 h-4" />
                Help & Support
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={() => navigate('/admin/settings')}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                title="Help & Support"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        {onToggle && (
          <div className="absolute -right-3 top-20 hidden lg:block">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggle}
              className="w-6 h-6 p-0 rounded-full bg-surface-primary border-primary"
            >
              {collapsed ? (
                <ChevronRight className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3 rotate-90" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};