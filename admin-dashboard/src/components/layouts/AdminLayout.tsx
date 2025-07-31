import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
import { 
  preloadDashboard, 
  preloadKeywords, 
  preloadPosts, 
  preloadAnalytics, 
  preloadContent,
  createPreloadHandler 
} from '@/utils/preload';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', preload: createPreloadHandler(preloadDashboard) },
  { name: 'Keywords', href: '/admin/keywords', preload: createPreloadHandler(preloadKeywords) },
  { name: 'Posts', href: '/admin/posts', preload: createPreloadHandler(preloadPosts) },
  { name: 'Analytics', href: '/admin/analytics', preload: createPreloadHandler(preloadAnalytics) },
  { name: 'Content', href: '/admin/content', preload: createPreloadHandler(preloadContent) },
  { name: 'Monitoring', href: '/admin/monitoring', preload: createPreloadHandler(() => import('../../pages/MonitoringPage')) },
];

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Reddit Content Platform
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onMouseEnter={item.preload}
                    onFocus={item.preload}
                    className={({ isActive }) =>
                      `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-primary-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-sm text-gray-700 mr-4">
                  Welcome, {user?.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main 
        id="main-content" 
        className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8"
        role="main"
        aria-label="Main content"
      >
        <Outlet />
      </main>
    </div>
  );
};