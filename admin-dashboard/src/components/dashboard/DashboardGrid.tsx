import React from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 ${className}`}
    >
      {children}
    </div>
  );
};

interface DashboardSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'glass' | 'elevated';
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  children,
  className = '',
  action,
  variant = 'default',
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'glass':
        return 'dashboard-card glass';
      case 'elevated':
        return 'dashboard-card elevated';
      default:
        return 'dashboard-card';
    }
  };

  return (
    <div className={`${getVariantClasses()} ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-primary">
          {title}
        </h3>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  showSidebar = true,
}) => {
  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-background-primary">
        <DashboardHeader />
        <main className="dashboard-main">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
};