import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard,
  Hash,
  FileText,
  BarChart3,
  Wand2,
  Activity,
  CreditCard,
  Image,
  Brain,
  TrendingUp,
  FileBarChart,
  Download,
  Settings,
  HelpCircle,
  Zap,
  Eye,
  Cpu
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/admin/dashboard',
        icon: LayoutDashboard,
        description: 'Main dashboard overview'
      },
      {
        id: 'monitoring',
        label: 'Real-time Monitor',
        path: '/admin/monitoring',
        icon: Activity,
        badge: 'Live',
        description: 'Live crawling and system monitoring'
      }
    ]
  },
  {
    id: 'data-collection',
    title: 'Data Collection',
    items: [
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
        icon: FileText,
        description: 'View collected Reddit posts'
      }
    ]
  },
  {
    id: 'analysis-tools',
    title: 'Analysis Tools',
    items: [
      {
        id: 'nlp-analysis',
        label: 'NLP Analysis',
        path: '/admin/nlp-analysis',
        icon: Brain,
        badge: 'New',
        description: 'Text analysis and sentiment'
      },
      {
        id: 'image-analysis',
        label: 'Image Analysis',
        path: '/admin/image-analysis',
        icon: Image,
        description: 'OCR and object detection'
      },
      {
        id: 'analytics',
        label: 'Analytics',
        path: '/admin/analytics',
        icon: BarChart3,
        description: 'Data visualization and insights'
      }
    ]
  },
  {
    id: 'business-intelligence',
    title: 'Business Intelligence',
    items: [
      {
        id: 'forecasting',
        label: 'Forecasting',
        path: '/admin/forecasting',
        icon: TrendingUp,
        description: 'Trend prediction and forecasting'
      },
      {
        id: 'business-intelligence',
        label: 'BI Dashboard',
        path: '/admin/business-intelligence',
        icon: Cpu,
        description: 'Executive insights and KPIs'
      },
      {
        id: 'advanced-analytics',
        label: 'Advanced Analytics',
        path: '/admin/advanced-analytics',
        icon: Zap,
        description: 'Deep analysis and correlations'
      }
    ]
  },
  {
    id: 'content-tools',
    title: 'Content & Reports',
    items: [
      {
        id: 'content',
        label: 'Content Generation',
        path: '/admin/content',
        icon: Wand2,
        description: 'AI-powered content creation'
      },
      {
        id: 'reports',
        label: 'Reports',
        path: '/admin/reports',
        icon: FileBarChart,
        description: 'Custom report generation'
      },
      {
        id: 'export',
        label: 'Data Export',
        path: '/admin/export',
        icon: Download,
        description: 'Export data in multiple formats'
      }
    ]
  },
  {
    id: 'account',
    title: 'Account',
    items: [
      {
        id: 'billing',
        label: 'Billing & Points',
        path: '/admin/billing',
        icon: CreditCard,
        description: 'Manage billing and point usage'
      }
    ]
  }
];

interface DashboardSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
}) => {
  const location = useLocation();

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <nav className="dashboard-nav">
        {navigationSections.map((section) => (
          <div key={section.id} className="nav-section">
            {!collapsed && (
              <h3 className="nav-section-title">
                {section.title}
              </h3>
            )}
            
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.path);
                
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    title={collapsed ? `${item.label} - ${item.description}` : undefined}
                  >
                    <Icon className="nav-icon" />
                    
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-sm font-medium">
                          {item.label}
                        </span>
                        
                        {item.badge && (
                          <span className="nav-badge">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
        
        {/* Sidebar footer */}
        <div className="mt-auto pt-6 border-t border-primary">
          <div className="nav-section">
            {!collapsed && (
              <h3 className="nav-section-title">Support</h3>
            )}
            
            <div className="space-y-1">
              <button
                className="nav-item w-full text-left"
                title={collapsed ? 'Settings' : undefined}
              >
                <Settings className="nav-icon" />
                {!collapsed && (
                  <span className="flex-1 text-sm font-medium">Settings</span>
                )}
              </button>
              
              <button
                className="nav-item w-full text-left"
                title={collapsed ? 'Help & Support' : undefined}
              >
                <HelpCircle className="nav-icon" />
                {!collapsed && (
                  <span className="flex-1 text-sm font-medium">Help</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
};