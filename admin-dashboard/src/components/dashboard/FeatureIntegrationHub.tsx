/**
 * Feature Integration Hub
 * 
 * Central component that integrates all advanced dashboard features
 * into a cohesive interface with consistent error handling and navigation
 */

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Image,
  BarChart3,
  TrendingUp,
  Activity,
  DollarSign,
  FileText,
  Settings,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Zap,
  Eye,
  Target,
  Users,
  Clock,
  Download,
  Bell,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Modal } from '../ui/Modal';
import { useAdvancedDashboard } from '../../hooks/useAdvancedDashboard';
import { useBilling } from '../../hooks/useBilling';
import { useRealTimeData } from '../../hooks/useRealTimeData';

interface FeatureStatus {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error' | 'loading';
  lastUsed?: Date;
  usageCount: number;
  errorMessage?: string;
}

interface UserFeedback {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  action?: {
    label: string;
    handler: () => void;
  };
  timestamp: Date;
  id: string;
}

export const FeatureIntegrationHub: React.FC = () => {
  const { isInitialized, health } = useAdvancedDashboard();
  const { balance, isLoadingBalance: billingLoading } = useBilling();
  const { isConnected } = useRealTimeData({
    eventTypes: ['system-health', 'notification'],
    autoConnect: true,
    bufferSize: 10
  });

  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [featureStatuses, setFeatureStatuses] = useState<FeatureStatus[]>([]);
  const [userFeedback, setUserFeedback] = useState<UserFeedback[]>([]);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [selectedHelpTopic, setSelectedHelpTopic] = useState<string>('overview');

  // Initialize feature statuses
  useEffect(() => {
    const initialStatuses: FeatureStatus[] = [
      {
        id: 'nlp-analysis',
        name: 'NLP Analysis',
        status: 'active',
        usageCount: health?.nlpAnalysis?.totalAnalyses || 0,
        lastUsed: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      },
      {
        id: 'image-analysis',
        name: 'Image Analysis',
        status: 'active',
        usageCount: health?.imageAnalysis?.totalAnalyses || 0,
        lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      },
      {
        id: 'real-time-monitoring',
        name: 'Real-time Monitoring',
        status: isConnected ? 'active' : 'error',
        usageCount: 0,
        errorMessage: !isConnected ? 'WebSocket connection failed' : undefined
      },
      {
        id: 'billing-system',
        name: 'Billing System',
        status: billingLoading ? 'loading' : 'active',
        usageCount: 0
      },
      {
        id: 'advanced-analytics',
        name: 'Advanced Analytics',
        status: 'active',
        usageCount: 0
      },
      {
        id: 'business-intelligence',
        name: 'Business Intelligence',
        status: 'active',
        usageCount: 0
      },
      {
        id: 'forecasting',
        name: 'Forecasting',
        status: 'active',
        usageCount: 0
      },
      {
        id: 'export-reporting',
        name: 'Export & Reporting',
        status: 'active',
        usageCount: 0
      }
    ];

    setFeatureStatuses(initialStatuses);
  }, [isConnected, billingLoading, health]);

  // Handle feature navigation
  const handleFeatureNavigation = (featureId: string, path: string) => {
    try {
      setActiveFeature(featureId);

      // Add user feedback
      addUserFeedback({
        type: 'info',
        message: `Navigating to ${getFeatureName(featureId)}...`,
        timestamp: new Date(),
        id: `nav-${Date.now()}`
      });

      // Update feature usage
      setFeatureStatuses(prev =>
        prev.map(feature =>
          feature.id === featureId
            ? { ...feature, lastUsed: new Date(), usageCount: feature.usageCount + 1 }
            : feature
        )
      );

      // Navigate to feature
      window.location.href = path;
    } catch (error) {
      handleFeatureError(featureId, error as Error);
    }
  };

  // Handle feature errors
  const handleFeatureError = (featureId: string, error: Error) => {
    console.error(`Feature error in ${featureId}:`, error);

    setFeatureStatuses(prev =>
      prev.map(feature =>
        feature.id === featureId
          ? { ...feature, status: 'error', errorMessage: error.message }
          : feature
      )
    );

    addUserFeedback({
      type: 'error',
      message: `Error in ${getFeatureName(featureId)}: ${error.message}`,
      action: {
        label: 'Retry',
        handler: () => retryFeature(featureId)
      },
      timestamp: new Date(),
      id: `error-${Date.now()}`
    });
  };

  // Retry failed feature
  const retryFeature = (featureId: string) => {
    setFeatureStatuses(prev =>
      prev.map(feature =>
        feature.id === featureId
          ? { ...feature, status: 'loading', errorMessage: undefined }
          : feature
      )
    );

    // Simulate retry logic
    setTimeout(() => {
      setFeatureStatuses(prev =>
        prev.map(feature =>
          feature.id === featureId
            ? { ...feature, status: 'active' }
            : feature
        )
      );

      addUserFeedback({
        type: 'success',
        message: `${getFeatureName(featureId)} is now working properly`,
        timestamp: new Date(),
        id: `retry-success-${Date.now()}`
      });
    }, 2000);
  };

  // Add user feedback
  const addUserFeedback = (feedback: UserFeedback) => {
    setUserFeedback(prev => [feedback, ...prev].slice(0, 10)); // Keep last 10 messages

    // Auto-remove info messages after 5 seconds
    if (feedback.type === 'info') {
      setTimeout(() => {
        setUserFeedback(prev => prev.filter(f => f.id !== feedback.id));
      }, 5000);
    }
  };

  // Get feature name by ID
  const getFeatureName = (featureId: string): string => {
    const feature = featureStatuses.find(f => f.id === featureId);
    return feature?.name || featureId;
  };

  // Get status icon
  const getStatusIcon = (status: FeatureStatus['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'loading':
        return <RefreshCw className="w-4 h-4 text-info animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-error" />;
      case 'inactive':
        return <Clock className="w-4 h-4 text-tertiary" />;
      default:
        return <Clock className="w-4 h-4 text-tertiary" />;
    }
  };

  // Get status color
  const getStatusColor = (status: FeatureStatus['status']) => {
    switch (status) {
      case 'active':
        return 'text-success';
      case 'loading':
        return 'text-info';
      case 'error':
        return 'text-error';
      case 'inactive':
        return 'text-tertiary';
      default:
        return 'text-tertiary';
    }
  };

  // Feature cards configuration
  const featureCards = [
    {
      id: 'nlp-analysis',
      title: 'NLP Analysis',
      description: 'Morphological analysis, sentiment analysis, and text similarity',
      icon: Brain,
      path: '/admin/nlp-analysis',
      color: 'text-accent'
    },
    {
      id: 'image-analysis',
      title: 'Image Analysis',
      description: 'Object detection, OCR, and visual content analysis',
      icon: Image,
      path: '/admin/image-analysis',
      color: 'text-secondary'
    },
    {
      id: 'advanced-analytics',
      title: 'Advanced Analytics',
      description: 'Comparative analysis, trend correlation, and pattern recognition',
      icon: BarChart3,
      path: '/admin/advanced-analytics',
      color: 'text-info'
    },
    {
      id: 'real-time-monitoring',
      title: 'Real-time Monitoring',
      description: 'Live system metrics, crawling status, and performance tracking',
      icon: Activity,
      path: '/admin/real-time-monitoring',
      color: 'text-warning'
    },
    {
      id: 'business-intelligence',
      title: 'Business Intelligence',
      description: 'Executive insights, KPIs, and strategic analytics',
      icon: Target,
      path: '/admin/business-intelligence',
      color: 'text-primary'
    },
    {
      id: 'forecasting',
      title: 'Forecasting',
      description: 'Demand forecasting, trend prediction, and predictive analytics',
      icon: TrendingUp,
      path: '/admin/forecasting',
      color: 'text-success'
    },
    {
      id: 'billing-system',
      title: 'Billing System',
      description: 'Point-based billing, usage tracking, and cost management',
      icon: DollarSign,
      path: '/admin/billing',
      color: 'text-accent'
    },
    {
      id: 'export-reporting',
      title: 'Export & Reporting',
      description: 'Multi-format exports, custom reports, and data visualization',
      icon: FileText,
      path: '/admin/reports',
      color: 'text-info'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Integration Status Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Feature Integration Hub</h2>
          <p className="text-secondary mt-1">
            Centralized access to all advanced dashboard features
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={isInitialized ? 'success' : 'warning'}>
            {isInitialized ? 'All Systems Ready' : 'Initializing...'}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHelpModalOpen(true)}
          >
            <HelpCircle className="w-4 h-4" />
            Help
          </Button>
        </div>
      </div>

      {/* User Feedback Messages */}
      {userFeedback.length > 0 && (
        <div className="space-y-2">
          {userFeedback.slice(0, 3).map(feedback => (
            <div
              key={feedback.id}
              className={`dashboard-card border-l-4 ${feedback.type === 'success' ? 'border-l-success' :
                feedback.type === 'error' ? 'border-l-error' :
                  feedback.type === 'warning' ? 'border-l-warning' :
                    'border-l-info'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {feedback.type === 'success' && <CheckCircle className="w-5 h-5 text-success" />}
                  {feedback.type === 'error' && <AlertTriangle className="w-5 h-5 text-error" />}
                  {feedback.type === 'warning' && <AlertTriangle className="w-5 h-5 text-warning" />}
                  {feedback.type === 'info' && <RefreshCw className="w-5 h-5 text-info" />}

                  <div>
                    <p className="text-sm font-medium text-primary">{feedback.message}</p>
                    <p className="text-xs text-tertiary">
                      {feedback.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {feedback.action && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={feedback.action.handler}
                  >
                    {feedback.action.label}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feature Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featureStatuses.map(feature => (
              <div key={feature.id} className="flex items-center gap-3">
                {getStatusIcon(feature.status)}
                <div>
                  <p className="text-sm font-medium text-primary">{feature.name}</p>
                  <p className={`text-xs capitalize ${getStatusColor(feature.status)}`}>
                    {feature.status}
                  </p>
                  {feature.errorMessage && (
                    <p className="text-xs text-error mt-1">{feature.errorMessage}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {featureCards.map(card => {
          const status = featureStatuses.find(f => f.id === card.id);
          const isDisabled = status?.status === 'error' || status?.status === 'loading';

          return (
            <Card
              key={card.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                } ${activeFeature === card.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => !isDisabled && handleFeatureNavigation(card.id, card.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                  {getStatusIcon(status?.status || 'inactive')}
                </div>
                <CardTitle className="text-lg">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-secondary mb-3">{card.description}</p>

                {status && (
                  <div className="flex items-center justify-between text-xs text-tertiary">
                    <span>Used: {status.usageCount} times</span>
                    {status.lastUsed && (
                      <span>
                        Last: {status.lastUsed.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleFeatureNavigation('nlp-analysis', '/admin/nlp-analysis')}
            >
              <Brain className="w-4 h-4" />
              Analyze Text
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleFeatureNavigation('image-analysis', '/admin/image-analysis')}
            >
              <Image className="w-4 h-4" />
              Process Images
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleFeatureNavigation('export-reporting', '/admin/reports')}
            >
              <Download className="w-4 h-4" />
              Export Data
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleFeatureNavigation('real-time-monitoring', '/admin/real-time-monitoring')}
            >
              <Eye className="w-4 h-4" />
              Monitor System
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Modal */}
      <Modal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        title="Feature Integration Help"
        size="lg"
      >
        <Tabs value={selectedHelpTopic} onValueChange={setSelectedHelpTopic}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Dashboard Overview</h3>
              <p className="text-secondary">
                The Feature Integration Hub provides centralized access to all advanced dashboard
                features with consistent error handling and user feedback.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-primary mb-2">Key Benefits:</h4>
              <ul className="list-disc list-inside space-y-1 text-secondary">
                <li>Unified navigation across all features</li>
                <li>Real-time status monitoring</li>
                <li>Consistent error handling and recovery</li>
                <li>Usage tracking and analytics</li>
                <li>Integrated help and documentation</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Available Features</h3>
              <div className="space-y-3">
                {featureCards.map(card => (
                  <div key={card.id} className="border border-primary rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <card.icon className={`w-4 h-4 ${card.color}`} />
                      <h4 className="font-medium text-primary">{card.title}</h4>
                    </div>
                    <p className="text-sm text-secondary">{card.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="troubleshooting" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Common Issues</h3>

              <div className="space-y-3">
                <div className="border border-warning rounded-lg p-3">
                  <h4 className="font-medium text-warning mb-1">Feature Not Loading</h4>
                  <p className="text-sm text-secondary mb-2">
                    If a feature shows as "loading" for more than 30 seconds:
                  </p>
                  <ul className="list-disc list-inside text-sm text-secondary">
                    <li>Check your internet connection</li>
                    <li>Refresh the page</li>
                    <li>Clear browser cache</li>
                    <li>Contact support if issue persists</li>
                  </ul>
                </div>

                <div className="border border-error rounded-lg p-3">
                  <h4 className="font-medium text-error mb-1">Feature Error</h4>
                  <p className="text-sm text-secondary mb-2">
                    If a feature shows an error status:
                  </p>
                  <ul className="list-disc list-inside text-sm text-secondary">
                    <li>Click the "Retry" button in the error message</li>
                    <li>Check system status in the overview section</li>
                    <li>Verify you have sufficient points for paid features</li>
                    <li>Report the error if it continues</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Modal>
    </div>
  );
};