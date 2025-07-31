import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  FileText,
  Plus,
  Clock,
  BarChart3,
  TrendingUp,
  Activity,
  Star,
  Layout
} from 'lucide-react';

import { ReportTemplateBuilder } from '../components/reports/ReportTemplateBuilder';
import { ScheduledReportsManager } from '../components/reports/ScheduledReportsManager';
import { useToast } from '../hooks/use-toast';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  template_type: string;
  sections: any[];
  default_filters: Record<string, any>;
  format_options: Record<string, any>;
  is_public: boolean;
  tags: string[];
  created_by: string;
  created_at: string;
}

// Template data without system-generated fields (for the builder component)
interface ReportTemplateData {
  id?: string;
  name: string;
  description: string;
  template_type: string;
  sections: any[];
  default_filters: Record<string, any>;
  format_options: Record<string, any>;
  is_public: boolean;
  tags: string[];
}

interface ReportAnalytics {
  total_templates: number;
  total_scheduled_reports: number;
  active_scheduled_reports: number;
  reports_generated_this_month: number;
  success_rate: number;
  popular_templates: { name: string; usage_count: number }[];
  recent_activity: any[];
}

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [analytics, setAnalytics] = useState<ReportAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);

      // Mock data - in real implementation, fetch from API
      const mockTemplates: ReportTemplate[] = [
        {
          id: 'executive_summary',
          name: 'Executive Summary Report',
          description: 'High-level overview with key metrics and trends for executives',
          template_type: 'executive',
          sections: [
            { id: '1', type: 'title_page', title: 'Title Page', config: {} },
            { id: '2', type: 'key_metrics', title: 'Key Metrics', config: { metrics: ['total_posts', 'engagement_rate'] } },
            { id: '3', type: 'trend_analysis', title: 'Trend Analysis', config: { charts: ['sentiment_timeline'] } }
          ],
          default_filters: { dateRange: { days: 30 } },
          format_options: { format: 'pdf' },
          is_public: true,
          tags: ['executive', 'summary', 'kpi'],
          created_by: 'system',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'detailed_analytics',
          name: 'Detailed Analytics Report',
          description: 'Comprehensive analysis with detailed statistics and visualizations',
          template_type: 'detailed',
          sections: [
            { id: '1', type: 'title_page', title: 'Title Page', config: {} },
            { id: '2', type: 'data_overview', title: 'Data Overview', config: {} },
            { id: '3', type: 'sentiment_analysis', title: 'Sentiment Analysis', config: {} },
            { id: '4', type: 'keyword_analysis', title: 'Keyword Analysis', config: {} }
          ],
          default_filters: { dateRange: { days: 7 } },
          format_options: { format: 'pdf' },
          is_public: true,
          tags: ['detailed', 'analytics', 'comprehensive'],
          created_by: 'system',
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      const mockAnalytics: ReportAnalytics = {
        total_templates: 5,
        total_scheduled_reports: 3,
        active_scheduled_reports: 2,
        reports_generated_this_month: 12,
        success_rate: 95.5,
        popular_templates: [
          { name: 'Executive Summary Report', usage_count: 8 },
          { name: 'Detailed Analytics Report', usage_count: 5 },
          { name: 'Performance Summary', usage_count: 3 }
        ],
        recent_activity: [
          { type: 'report_generated', template: 'Executive Summary', time: '2 hours ago' },
          { type: 'template_created', template: 'Custom Analytics', time: '1 day ago' },
          { type: 'scheduled_report', template: 'Weekly Summary', time: '3 days ago' }
        ]
      };

      setTemplates(mockTemplates);
      setAnalytics(mockAnalytics);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (templateData: ReportTemplateData) => {
    try {
      if (editingTemplate) {
        // Update existing template
        const updatedTemplate: ReportTemplate = {
          ...templateData,
          id: editingTemplate.id,
          created_by: editingTemplate.created_by,
          created_at: editingTemplate.created_at
        };
        setTemplates(prev =>
          prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t)
        );
        toast({
          title: "Success",
          description: "Template updated successfully",
        });
      } else {
        // Create new template
        const newTemplate: ReportTemplate = {
          ...templateData,
          id: Date.now().toString(),
          created_by: 'current_user',
          created_at: new Date().toISOString()
        };
        setTemplates(prev => [...prev, newTemplate]);
        toast({
          title: "Success",
          description: "Template created successfully",
        });
      }

      setShowTemplateBuilder(false);
      setEditingTemplate(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReport = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      const templateName = template ? template.name : 'Unknown Template';

      toast({
        title: "Report Generation Started",
        description: `Your ${templateName} report is being generated and will be available for download shortly`,
      });

      // Mock report generation
      setTimeout(() => {
        toast({
          title: "Report Ready",
          description: `Your ${templateName} report has been generated successfully`,
        });
      }, 3000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (showTemplateBuilder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            onClick={() => {
              setShowTemplateBuilder(false);
              setEditingTemplate(null);
            }}
            variant="outline"
          >
            ← Back to Reports
          </Button>
        </div>
        <ReportTemplateBuilder
          template={editingTemplate ? {
            id: editingTemplate.id,
            name: editingTemplate.name,
            description: editingTemplate.description,
            template_type: editingTemplate.template_type,
            sections: editingTemplate.sections,
            default_filters: editingTemplate.default_filters,
            format_options: editingTemplate.format_options,
            is_public: editingTemplate.is_public,
            tags: editingTemplate.tags
          } : undefined}
          onSave={handleSaveTemplate}
          onCancel={() => {
            setShowTemplateBuilder(false);
            setEditingTemplate(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create custom reports, schedule automated delivery, and analyze your data
          </p>
        </div>
        <Button onClick={() => setShowTemplateBuilder(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Templates
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics?.total_templates || 0}
                    </p>
                  </div>
                  <Layout className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Scheduled Reports
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics?.active_scheduled_reports || 0}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      This Month
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics?.reports_generated_this_month || 0}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Success Rate
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {analytics?.success_rate?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common report generation tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  className="h-20 flex-col"
                  onClick={() => handleGenerateReport('executive_summary')}
                >
                  <FileText className="h-6 w-6 mb-2" />
                  Generate Executive Report
                </Button>

                <Button
                  className="h-20 flex-col"
                  variant="outline"
                  onClick={() => handleGenerateReport('detailed_analytics')}
                >
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Generate Analytics Report
                </Button>

                <Button
                  className="h-20 flex-col"
                  variant="outline"
                  onClick={() => setActiveTab('templates')}
                >
                  <Plus className="h-6 w-6 mb-2" />
                  Create Custom Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Popular Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Popular Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.popular_templates.map((template, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Used {template.usage_count} times
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleGenerateReport('template_id')}>
                      Generate
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.recent_activity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm">
                        {activity.type === 'report_generated' && 'Report generated: '}
                        {activity.type === 'template_created' && 'Template created: '}
                        {activity.type === 'scheduled_report' && 'Scheduled report: '}
                        <span className="font-medium">{activity.template}</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {activity.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Report Templates</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your report templates and create new ones
              </p>
            </div>
            <Button onClick={() => setShowTemplateBuilder(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>

          {templates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Templates Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first report template to get started
                </p>
                <Button onClick={() => setShowTemplateBuilder(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        {template.template_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>Sections: {template.sections.length}</div>
                        <div>Format: {template.format_options.format}</div>
                        <div>Public: {template.is_public ? 'Yes' : 'No'}</div>
                      </div>

                      {template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleGenerateReport(template.id)}
                        >
                          Generate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTemplate(template);
                            setShowTemplateBuilder(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Scheduled Reports Tab */}
        <TabsContent value="scheduled">
          <ScheduledReportsManager />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.popular_templates.map((template, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{template.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(template.usage_count / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{template.usage_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Report Generation Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Chart visualization would go here
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {analytics?.success_rate?.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Success Rate
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    2.3s
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Avg Generation Time
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {analytics?.reports_generated_this_month}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Reports This Month
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;