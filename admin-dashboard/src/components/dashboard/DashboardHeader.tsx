import React from 'react';
import {
  Bell,
  Search,
  Settings,
  User,
  Menu,
  X
} from 'lucide-react';
import { ThemeToggle } from '@/components/providers/ThemeProvider';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useAdvancedDashboard } from '@/hooks/useAdvancedDashboard';

interface DashboardHeaderProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onToggleSidebar,
  sidebarOpen = true,
}) => {
  const { health } = useAdvancedDashboard();
  const { data: stats } = useDashboardStats();

  const getSystemStatusColor = () => {
    if (!health) return 'text-warning';

    // Check real-time monitoring health
    const isMonitoringHealthy = health.realTimeMonitoring.connected &&
      health.realTimeMonitoring.reconnectAttempts < 3;

    // Check NLP analysis health
    const isNLPHealthy = health.nlpAnalysis.successRate > 0.8 ||
      health.nlpAnalysis.totalAnalyses === 0;

    // Check image analysis health
    const isImageHealthy = health.imageAnalysis.successRate > 0.8 ||
      health.imageAnalysis.totalAnalyses === 0;

    // Determine overall status
    if (!isMonitoringHealthy) return 'text-error';
    if (!isNLPHealthy || !isImageHealthy) return 'text-warning';
    return 'text-success';
  };

  return (
    <header className="dashboard-header">
      <div className="flex items-center gap-4">
        {/* Mobile sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="btn-ghost lg:hidden"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">RC</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-primary">
              Reddit Content Platform
            </h1>
            <p className="text-xs text-tertiary">
              Advanced Analytics Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-tertiary" />
          <input
            type="text"
            placeholder="Search posts, keywords, or analysis..."
            className="form-input pl-10 w-full"
          />
        </div>
      </div>

      {/* Header actions */}
      <div className="flex items-center gap-3">
        {/* System status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-secondary">
          <div className={`w-2 h-2 rounded-full ${getSystemStatusColor()}`} />
          <span className="text-xs text-secondary">
            {!health ? 'Checking...' :
              getSystemStatusColor() === 'text-success' ? 'System Healthy' :
                getSystemStatusColor() === 'text-warning' ? 'System Warning' :
                  'System Error'}
          </span>
        </div>

        {/* Active Keywords Count */}
        {stats?.active_keywords_count !== undefined && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-secondary">
            <span className="text-xs text-secondary">Keywords:</span>
            <span className="text-xs font-semibold text-primary">
              {stats.active_keywords_count.toLocaleString()}
            </span>
          </div>
        )}

        {/* Notifications */}
        <button className="btn-ghost relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full text-xs text-white flex items-center justify-center">
            3
          </span>
        </button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Settings */}
        <button className="btn-ghost">
          <Settings className="w-5 h-5" />
        </button>

        {/* User menu */}
        <button className="btn-ghost">
          <User className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};