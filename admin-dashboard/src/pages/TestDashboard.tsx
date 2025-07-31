import React, { useState } from 'react';
import { Plus, Download, Settings, Trash2, Save, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { FormComponentsDemo } from '../components/forms/FormComponentsDemo';

const ButtonShowcase: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleLoadingTest = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">🎨 Improved Button Component Showcase</h3>
      
      {/* Button Variants */}
      <div className="mb-8">
        <h4 className="text-md font-medium text-gray-700 mb-4">Variants</h4>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </div>

      {/* Button Sizes */}
      <div className="mb-8">
        <h4 className="text-md font-medium text-gray-700 mb-4">Sizes</h4>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </div>

      {/* Buttons with Icons */}
      <div className="mb-8">
        <h4 className="text-md font-medium text-gray-700 mb-4">With Icons</h4>
        <div className="flex flex-wrap gap-3">
          <Button icon={Plus} iconPosition="left">Add Item</Button>
          <Button icon={Download} iconPosition="right" variant="secondary">Download</Button>
          <Button icon={Settings} variant="outline">Settings</Button>
          <Button icon={Search} variant="ghost">Search</Button>
          <Button icon={Trash2} variant="destructive">Delete</Button>
        </div>
      </div>

      {/* Loading and Disabled States */}
      <div className="mb-8">
        <h4 className="text-md font-medium text-gray-700 mb-4">States</h4>
        <div className="flex flex-wrap gap-3">
          <Button loading={loading} onClick={handleLoadingTest}>
            {loading ? 'Loading...' : 'Test Loading'}
          </Button>
          <Button disabled>Disabled</Button>
          <Button loading icon={Save}>Saving...</Button>
          <Button disabled variant="destructive">Disabled Destructive</Button>
        </div>
      </div>

      {/* Full Width */}
      <div className="mb-8">
        <h4 className="text-md font-medium text-gray-700 mb-4">Full Width</h4>
        <Button fullWidth icon={Plus} iconPosition="left">
          Full Width Button
        </Button>
      </div>

      {/* Interactive Demo */}
      <div className="mb-4">
        <h4 className="text-md font-medium text-gray-700 mb-4">Interactive Demo</h4>
        <p className="text-sm text-gray-600 mb-4">
          Hover over buttons to see the improved animations and effects. Click the loading test button to see the loading state.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => alert('Primary clicked!')} variant="primary">
            Click Me
          </Button>
          <Button onClick={handleLoadingTest} variant="secondary" icon={Download}>
            Test Loading
          </Button>
          <Button onClick={() => alert('Destructive action!')} variant="destructive" icon={Trash2}>
            Dangerous Action
          </Button>
        </div>
      </div>
    </div>
  );
};

const TestDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'buttons' | 'forms'>('overview');

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🎉 Dashboard Test Page
        </h1>
        
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('buttons')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'buttons'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Button Components
              </button>
              <button
                onClick={() => setActiveTab('forms')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'forms'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Form Components
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Frontend Status</h3>
                <p className="text-green-600">✅ React App Loading</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Backend Connection</h3>
                <p className="text-blue-600">🔗 {import.meta.env.VITE_API_BASE_URL}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Environment</h3>
                <p className="text-purple-600">🔧 {import.meta.env.VITE_NODE_ENV}</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment Variables</h3>
              <div className="space-y-2 text-sm">
                <p><strong>API URL:</strong> {import.meta.env.VITE_API_BASE_URL}</p>
                <p><strong>WS URL:</strong> {import.meta.env.VITE_WS_URL}</p>
                <p><strong>Environment:</strong> {import.meta.env.VITE_NODE_ENV}</p>
                <p><strong>Dev Tools:</strong> {import.meta.env.VITE_ENABLE_DEV_TOOLS ? '✅' : '❌'}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">UI Design Improvements Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Login Page Icon Fix</span>
                  <span className="text-green-600 text-sm">✅ Complete</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Design System Foundation</span>
                  <span className="text-green-600 text-sm">✅ Complete</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Button Component Improvements</span>
                  <span className="text-green-600 text-sm">✅ Complete</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Form Input Field Standardization</span>
                  <span className="text-blue-600 text-sm">🔄 In Progress</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Loading System Improvements</span>
                  <span className="text-green-600 text-sm">✅ Complete</span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'buttons' && <ButtonShowcase />}
        
        {activeTab === 'forms' && <FormComponentsDemo />}
      </div>
    </div>
  );
};

export default TestDashboard;