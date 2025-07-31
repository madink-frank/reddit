import React, { useState } from 'react';
import { ImageOptimizationDemo } from '../components/demo/ImageOptimizationDemo';
import { EnhancedThemeDemo } from '../components/demo/EnhancedThemeDemo';

const TestPage: React.FC = () => {
  const [showImageDemo, setShowImageDemo] = useState(false);
  const [showThemeDemo, setShowThemeDemo] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Frontend Test Page
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">React Status</h3>
            <p className="text-green-600">✅ React App Loading</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Environment</h3>
            <p className="text-blue-600">🔧 {import.meta.env.VITE_NODE_ENV || 'development'}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">API URL</h3>
            <p className="text-purple-600 text-sm break-all">
              🔗 {import.meta.env.VITE_API_BASE_URL || 'Not set'}
            </p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment Variables</h3>
          <div className="space-y-2 text-sm">
            <p><strong>API URL:</strong> {import.meta.env.VITE_API_BASE_URL}</p>
            <p><strong>API Timeout:</strong> {import.meta.env.VITE_API_TIMEOUT}</p>
            <p><strong>Reddit Client ID:</strong> {import.meta.env.VITE_REDDIT_CLIENT_ID}</p>
            <p><strong>Environment:</strong> {import.meta.env.VITE_NODE_ENV}</p>
            <p><strong>Debug Mode:</strong> {import.meta.env.VITE_DEBUG_MODE}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Demos</h3>
          <div className="space-x-4 mb-4">
            <button
              onClick={() => setShowImageDemo(!showImageDemo)}
              className={`px-4 py-2 rounded transition-colors ${
                showImageDemo 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {showImageDemo ? 'Hide' : 'Show'} Image Optimization Demo
            </button>
            
            <button
              onClick={() => setShowThemeDemo(!showThemeDemo)}
              className={`px-4 py-2 rounded transition-colors ${
                showThemeDemo 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {showThemeDemo ? 'Hide' : 'Show'} Enhanced Theme Demo
            </button>
          </div>
          
          {showImageDemo && (
            <div className="mt-6 border-t pt-6">
              <ImageOptimizationDemo />
            </div>
          )}
          
          {showThemeDemo && (
            <div className="mt-6 border-t pt-6">
              <EnhancedThemeDemo />
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Navigation Test</h3>
          <div className="space-x-4">
            <a 
              href="/admin/dashboard" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Dashboard
            </a>
            <a 
              href="/auth/login" 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;