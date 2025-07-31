import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Image, 
  BarChart3, 
  TrendingUp,
  Eye,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  MoreHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AnalysisResult {
  id: string;
  type: 'nlp' | 'image' | 'sentiment' | 'keyword';
  title: string;
  preview: string;
  result: any;
  timestamp: Date;
  status: 'completed' | 'processing' | 'failed';
  processingTime?: number;
}

interface AnalysisToolShortcutProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  recentCount: number;
  isActive?: boolean;
  onQuickAction?: () => void;
}

const AnalysisToolShortcut: React.FC<AnalysisToolShortcutProps> = ({
  title,
  description,
  icon: Icon,
  path,
  color,
  recentCount,
  isActive = false,
  onQuickAction
}) => {
  const navigate = useNavigate();

  return (
    <div className={`dashboard-card interactive hover:scale-105 transition-all duration-200 ${isActive ? 'glow' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}/20`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        
        <div className="flex items-center gap-2">
          {isActive && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-xs text-success">Active</span>
            </div>
          )}
          
          <button
            onClick={onQuickAction}
            className="btn-ghost p-1"
            title="Quick action"
          >
            <Play className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-primary mb-1">
          {title}
        </h3>
        <p className="text-sm text-secondary">
          {description}
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <div className="text-xl font-bold text-primary">
            {recentCount}
          </div>
          <div className="text-xs text-tertiary">Recent</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-success">
            98%
          </div>
          <div className="text-xs text-tertiary">Success</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-info">
            2.3s
          </div>
          <div className="text-xs text-tertiary">Avg Time</div>
        </div>
      </div>

      <button
        onClick={() => navigate(path)}
        className="btn-primary w-full text-sm"
      >
        Open Tool
        <ArrowRight className="w-4 h-4 ml-2" />
      </button>
    </div>
  );
};

interface AnalysisPreviewWidgetProps {
  className?: string;
}

export const AnalysisPreviewWidget: React.FC<AnalysisPreviewWidgetProps> = ({ 
  className = '' 
}) => {
  const [recentResults, setRecentResults] = useState<AnalysisResult[]>([
    {
      id: '1',
      type: 'sentiment',
      title: 'Sentiment Analysis',
      preview: 'Great product, highly recommend to everyone!',
      result: { score: 0.85, label: 'positive', confidence: 0.92 },
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: 'completed',
      processingTime: 1.2
    },
    {
      id: '2',
      type: 'nlp',
      title: 'NLP Analysis',
      preview: 'The new update has some performance issues...',
      result: { 
        sentiment: -0.3, 
        keywords: ['update', 'performance', 'issues'],
        entities: ['update', 'performance']
      },
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      status: 'completed',
      processingTime: 2.8
    },
    {
      id: '3',
      type: 'image',
      title: 'Image Analysis',
      preview: 'Product screenshot with UI elements',
      result: { 
        objects: [
          { label: 'button', confidence: 0.95 },
          { label: 'text', confidence: 0.88 },
          { label: 'interface', confidence: 0.92 }
        ],
        ocr: 'Login Submit Cancel'
      },
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      status: 'completed',
      processingTime: 4.1
    },
    {
      id: '4',
      type: 'keyword',
      title: 'Keyword Extraction',
      preview: 'Analyzing trending topics in technology posts',
      result: {
        keywords: [
          { word: 'AI', frequency: 45, importance: 0.9 },
          { word: 'machine learning', frequency: 32, importance: 0.8 },
          { word: 'blockchain', frequency: 28, importance: 0.7 }
        ]
      },
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      status: 'processing'
    }
  ]);

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'processing': return Clock;
      case 'failed': return AlertCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success';
      case 'processing': return 'text-warning';
      case 'failed': return 'text-error';
      default: return 'text-secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'nlp': return Brain;
      case 'image': return Image;
      case 'sentiment': return TrendingUp;
      case 'keyword': return Zap;
      default: return BarChart3;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'nlp': return 'text-primary';
      case 'image': return 'text-accent';
      case 'sentiment': return 'text-success';
      case 'keyword': return 'text-warning';
      default: return 'text-secondary';
    }
  };

  return (
    <div className={`dashboard-card glass ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Eye className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary">Analysis Results</h3>
            <p className="text-sm text-secondary">Recent analysis previews</p>
          </div>
        </div>
        
        <button className="btn-ghost text-sm">
          View All
        </button>
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto">
        {recentResults.map((result) => {
          const StatusIcon = getStatusIcon(result.status);
          const TypeIcon = getTypeIcon(result.type);
          
          return (
            <div key={result.id} className="border border-primary rounded-lg p-4 hover:bg-surface-secondary transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-surface-secondary rounded-lg">
                    <TypeIcon className={`w-4 h-4 ${getTypeColor(result.type)}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-primary">
                      {result.title}
                    </div>
                    <div className="text-xs text-secondary">
                      {formatTimeAgo(result.timestamp)}
                      {result.processingTime && ` • ${result.processingTime}s`}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-4 h-4 ${getStatusColor(result.status)}`} />
                  <button className="btn-ghost p-1">
                    <MoreHorizontal className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="text-sm text-secondary mb-3 line-clamp-2">
                {result.preview}
              </div>

              {result.status === 'completed' && (
                <div className="text-xs text-tertiary">
                  {result.type === 'sentiment' && (
                    <div className="flex items-center gap-2">
                      <span>Sentiment: {result.result.label}</span>
                      <div className="sentiment-bar h-1 w-16 rounded-full">
                        <div 
                          className="sentiment-positive h-full rounded-full"
                          style={{ width: `${(result.result.score + 1) * 50}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {result.type === 'nlp' && (
                    <div>
                      Keywords: {result.result.keywords.join(', ')}
                    </div>
                  )}
                  
                  {result.type === 'image' && (
                    <div>
                      Objects detected: {result.result.objects.length}
                    </div>
                  )}
                  
                  {result.type === 'keyword' && (
                    <div>
                      Top keywords: {result.result.keywords.slice(0, 3).map((k: any) => k.word).join(', ')}
                    </div>
                  )}
                </div>
              )}

              {result.status === 'processing' && (
                <div className="flex items-center gap-2 text-xs text-warning">
                  <div className="loading-spinner w-3 h-3" />
                  <span>Processing...</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface AnalysisToolShortcutsProps {
  className?: string;
}

export const AnalysisToolShortcuts: React.FC<AnalysisToolShortcutsProps> = ({ 
  className = '' 
}) => {
  const navigate = useNavigate();

  const tools = [
    {
      title: 'NLP Analysis',
      description: 'Text analysis and sentiment',
      icon: Brain,
      path: '/admin/nlp-analysis',
      color: 'text-primary',
      recentCount: 24,
      isActive: true
    },
    {
      title: 'Image Analysis',
      description: 'OCR and object detection',
      icon: Image,
      path: '/admin/image-analysis',
      color: 'text-accent',
      recentCount: 12,
      isActive: false
    },
    {
      title: 'Analytics',
      description: 'Data visualization',
      icon: BarChart3,
      path: '/admin/analytics',
      color: 'text-success',
      recentCount: 18,
      isActive: false
    },
    {
      title: 'Advanced Analytics',
      description: 'Deep insights',
      icon: Zap,
      path: '/admin/advanced-analytics',
      color: 'text-warning',
      recentCount: 8,
      isActive: false
    }
  ];

  const handleQuickAction = (toolPath: string) => {
    // For demo purposes, just navigate to the tool
    navigate(toolPath);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-primary">Analysis Tools</h2>
          <p className="text-sm text-secondary">Quick access to analysis features</p>
        </div>
        
        <button 
          onClick={() => navigate('/admin/analytics')}
          className="btn-secondary text-sm"
        >
          View All Tools
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tools.map((tool) => (
          <AnalysisToolShortcut
            key={tool.path}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            path={tool.path}
            color={tool.color}
            recentCount={tool.recentCount}
            isActive={tool.isActive}
            onQuickAction={() => handleQuickAction(tool.path)}
          />
        ))}
      </div>
    </div>
  );
};

interface WorkflowShortcutsProps {
  className?: string;
}

export const WorkflowShortcuts: React.FC<WorkflowShortcutsProps> = ({ 
  className = '' 
}) => {
  const navigate = useNavigate();

  const workflows = [
    {
      id: 'content-analysis',
      title: 'Content Analysis Workflow',
      description: 'Analyze posts → Extract sentiment → Generate insights',
      steps: ['Collect Posts', 'NLP Analysis', 'Generate Report'],
      estimatedTime: '5-10 min',
      icon: Brain,
      color: 'text-primary'
    },
    {
      id: 'image-processing',
      title: 'Image Processing Pipeline',
      description: 'Upload images → OCR extraction → Object detection',
      steps: ['Upload Images', 'OCR Processing', 'Object Detection'],
      estimatedTime: '3-7 min',
      icon: Image,
      color: 'text-accent'
    },
    {
      id: 'trend-analysis',
      title: 'Trend Analysis Suite',
      description: 'Keyword tracking → Sentiment trends → Forecasting',
      steps: ['Track Keywords', 'Analyze Trends', 'Generate Forecast'],
      estimatedTime: '10-15 min',
      icon: TrendingUp,
      color: 'text-success'
    }
  ];

  const startWorkflow = (workflowId: string) => {
    // For demo purposes, navigate to the first step
    switch (workflowId) {
      case 'content-analysis':
        navigate('/admin/posts');
        break;
      case 'image-processing':
        navigate('/admin/image-analysis');
        break;
      case 'trend-analysis':
        navigate('/admin/keywords');
        break;
      default:
        navigate('/admin/analytics');
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-primary">Workflow Shortcuts</h2>
          <p className="text-sm text-secondary">Common analysis workflows</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => {
          const Icon = workflow.icon;
          
          return (
            <div key={workflow.id} className="dashboard-card interactive">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${workflow.color.replace('text-', 'bg-')}/20`}>
                  <Icon className={`w-6 h-6 ${workflow.color}`} />
                </div>
                
                <div className="text-xs text-tertiary">
                  {workflow.estimatedTime}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-primary mb-2">
                  {workflow.title}
                </h3>
                <p className="text-sm text-secondary mb-4">
                  {workflow.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="text-xs text-tertiary mb-2">Workflow Steps:</div>
                <div className="space-y-2">
                  {workflow.steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">
                        {index + 1}
                      </div>
                      <span className="text-xs text-secondary">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => startWorkflow(workflow.id)}
                className="btn-primary w-full text-sm"
              >
                Start Workflow
                <Play className="w-4 h-4 ml-2" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};