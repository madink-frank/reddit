import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  BarChart3,
  Upload,
  Settings,
  History,
  Star,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

import { ExportHub } from '../components/export/ExportHub';
import { ExportRequestForm } from '../components/export/ExportRequestForm';
import { ExportTemplates } from '../components/export/ExportTemplates';
import { ExportHistory } from '../components/export/ExportHistory';
import { exportService } from '../services/exportService';
import { useToast } from '../hooks/use-toast';
import { ExportRequest, ExportResult } from '../types/advanced-dashboard';

const ExportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [exportStats, setExportStats] = useState<any>(null);
  const [recentExports, setRecentExports] = useState<ExportResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadExportData();
  }, []);

  const loadExportData = async () => {
    try {
      setLoading(true);
      
      // Load export statistics and recent exports
      const [stats, history] = await Promise.all([
        exportService.getExportStats(),
        exportService.getExportHistory(10, 0)
      ]);
      
      setExportStats(stats);
      setRecentExports(history);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load export data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickExport = async (type: 'posts' | 'analysis' | 'billing', format: 'excel' | 'csv' | 'pdf') => {
    try {
      const request: Omit<ExportRequest, 'id'> = {
        dataType: type,
        format: format,
        options: {
          includeAnalysis: true,
          includeMetadata: true,
          maxRecords: type === 'posts' ? 10000 : 5000,
        },
      };

      const result = await exportService.createExport(request);
      
      toast({
        title: "Export Started",
        description: `Your ${type} ${format.toUpperCase()} export has been queued`,
      });

      // Refresh recent exports
      loadExportData();
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to start export",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading export data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Data Export & Reporting
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Export your data in multiple formats with advanced formatting and visualizations
          </p>
        </div>
        <Button onClick={loadExportData} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="create">Create Export</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
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
                      Total Exports
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {exportStats?.totalExports || 0}
                    </p>
                  </div>
                  <Download className="h-8 w-8 text-blue-600" />
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
                      {exportStats?.successRate?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Avg Size
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {exportStats?.averageSize ? 
                        `${(exportStats.averageSize / 1024 / 1024).toFixed(1)} MB` : 
                        '0 MB'
                      }
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
                      Avg Time
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {exportStats?.averageTime ? 
                        `${exportStats.averageTime.toFixed(1)}s` : 
                        '0s'
                      }
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Export Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Quick Export
              </CardTitle>
              <CardDescription>
                Start common exports with one click
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Posts Export */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium">Posts Data</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Export Reddit posts with analysis data
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleQuickExport('posts', 'excel')}
                      className="flex-1"
                    >
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      Excel
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleQuickExport('posts', 'csv')}
                      className="flex-1"
                    >
                      CSV
                    </Button>
                  </div>
                </div>

                {/* Analysis Export */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium">Analysis Results</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Export NLP and image analysis results
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleQuickExport('analysis', 'excel')}
                      className="flex-1"
                    >
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      Excel
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleQuickExport('analysis', 'pdf')}
                      className="flex-1"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>

                {/* Billing Export */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <h3 className="font-medium">Billing Report</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Export usage and billing data
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleQuickExport('billing', 'excel')}
                      className="flex-1"
                    >
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      Excel
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleQuickExport('billing', 'pdf')}
                      className="flex-1"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Exports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Exports
              </CardTitle>
              <CardDescription>
                Your latest export activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentExports.length === 0 ? (
                <div className="text-center py-8">
                  <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No recent exports found
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentExports.slice(0, 5).map((exportResult) => (
                    <div
                      key={exportResult.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(exportResult.status)}
                        <div>
                          <div className="font-medium">
                            {exportResult.requestId}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {exportResult.recordCount && (
                              <span>{exportResult.recordCount.toLocaleString()} records</span>
                            )}
                            {exportResult.fileSize && (
                              <span className="ml-2">
                                • {(exportResult.fileSize / 1024 / 1024).toFixed(1)} MB
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {exportResult.pointsConsumed} points
                        </Badge>
                        
                        {exportResult.status === 'processing' && exportResult.progress && (
                          <div className="w-20">
                            <Progress value={exportResult.progress} />
                          </div>
                        )}
                        
                        {exportResult.status === 'completed' && (
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Formats */}
          {exportStats?.popularFormats && exportStats.popularFormats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Popular Export Formats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {exportStats.popularFormats.map((format: any) => (
                    <div key={format.format} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {format.count}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 uppercase">
                        {format.format}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Create Export Tab */}
        <TabsContent value="create">
          <ExportRequestForm 
            onSubmit={async (request) => {
              await exportService.createExport(request);
              loadExportData();
            }}
          />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <ExportTemplates 
            onUseTemplate={async (request) => {
              await exportService.createExport(request);
              loadExportData();
              setActiveTab('create');
            }}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <ExportHistory
            exports={recentExports}
            onDownload={async (exportResult) => {
              try {
                const blob = await exportService.downloadExport(exportResult.id);
                const filename = exportService.generateFilename(
                  exportResult.requestId || 'export',
                  exportResult.metadata?.format || 'unknown'
                );
                exportService.downloadBlob(blob, filename);
              } catch (error: any) {
                toast({
                  title: "Download Failed",
                  description: error.message || "Failed to download export",
                  variant: "destructive",
                });
              }
            }}
            onRefresh={loadExportData}
            loading={loading}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Export Settings
              </CardTitle>
              <CardDescription>
                Configure your export preferences and defaults
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Default Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Default Format
                      </label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="excel">Excel (.xlsx)</option>
                        <option value="csv">CSV (.csv)</option>
                        <option value="pdf">PDF (.pdf)</option>
                        <option value="json">JSON (.json)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Default Max Records
                      </label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="1000">1,000</option>
                        <option value="5000">5,000</option>
                        <option value="10000">10,000</option>
                        <option value="25000">25,000</option>
                        <option value="50000">50,000</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Export Options</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span>Include analysis results by default</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span>Include metadata in exports</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Auto-download completed exports</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span>Send email notifications for completed exports</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button>Save Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExportPage;