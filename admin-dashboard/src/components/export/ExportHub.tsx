import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Download, 
  FileText, 
  Table, 
  BarChart3, 
  FileSpreadsheet,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { ExportRequest, ExportResult } from '../../types/advanced-dashboard';
import { exportService } from '../../services/exportService';
import { useToast } from '../../hooks/use-toast';
import { ExportRequestForm } from './ExportRequestForm';
import { ExportHistory } from './ExportHistory';
import { ExportTemplates } from './ExportTemplates';

interface ExportHubProps {
  className?: string;
}

export const ExportHub: React.FC<ExportHubProps> = ({ className }) => {
  const [activeExports, setActiveExports] = useState<ExportResult[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Load export history on mount
  useEffect(() => {
    loadExportHistory();
    
    // Set up polling for active exports
    const interval = setInterval(() => {
      refreshActiveExports();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadExportHistory = async () => {
    try {
      setLoading(true);
      const history = await exportService.getExportHistory(20, 0);
      setExportHistory(history);
      
      // Filter active exports
      const active = history.filter(exp => 
        exp.status === 'queued' || exp.status === 'processing'
      );
      setActiveExports(active);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load export history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshActiveExports = async () => {
    if (activeExports.length === 0) return;

    try {
      setRefreshing(true);
      const updatedExports = await Promise.all(
        activeExports.map(exp => exportService.getExportStatus(exp.id))
      );

      setActiveExports(updatedExports.filter(exp => 
        exp.status === 'queued' || exp.status === 'processing'
      ));

      // Update history with completed exports
      const completedExports = updatedExports.filter(exp => 
        exp.status === 'completed' || exp.status === 'failed'
      );

      if (completedExports.length > 0) {
        setExportHistory(prev => {
          const updated = [...prev];
          completedExports.forEach(completed => {
            const index = updated.findIndex(exp => exp.id === completed.id);
            if (index >= 0) {
              updated[index] = completed;
            }
          });
          return updated;
        });

        // Show notifications for completed exports
        completedExports.forEach(exp => {
          if (exp.status === 'completed') {
            toast({
              title: "Export Completed",
              description: `Your ${exp.requestId} export is ready for download`,
            });
          } else if (exp.status === 'failed') {
            toast({
              title: "Export Failed",
              description: exp.error || "Export processing failed",
              variant: "destructive",
            });
          }
        });
      }
    } catch (error) {
      console.error('Failed to refresh active exports:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportRequest = async (request: Omit<ExportRequest, 'id'>) => {
    try {
      const result = await exportService.createExport(request);
      
      setActiveExports(prev => [...prev, result]);
      setExportHistory(prev => [result, ...prev]);

      toast({
        title: "Export Started",
        description: `Your ${request.dataType} export has been queued`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to start export",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (exportResult: ExportResult) => {
    try {
      const blob = await exportService.downloadExport(exportResult.id);
      const filename = exportService.generateFilename(
        exportResult.requestId || 'export',
        exportResult.metadata?.format || 'unknown'
      );
      exportService.downloadBlob(blob, filename);

      toast({
        title: "Download Started",
        description: `Downloading ${filename}`,
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download export",
        variant: "destructive",
      });
    }
  };

  const handleCancelExport = async (exportId: string) => {
    try {
      await exportService.cancelExport(exportId);
      
      setActiveExports(prev => prev.filter(exp => exp.id !== exportId));
      
      toast({
        title: "Export Cancelled",
        description: "Export has been cancelled successfully",
      });
    } catch (error: any) {
      toast({
        title: "Cancel Failed",
        description: error.message || "Failed to cancel export",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
      case 'csv':
        return <Table className="h-4 w-4 text-blue-600" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'json':
        return <BarChart3 className="h-4 w-4 text-purple-600" />;
      default:
        return <Download className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Data Export & Reporting
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Export your data in multiple formats with customizable options
          </p>
        </div>
        <Button
          onClick={loadExportHistory}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Active Exports */}
      {activeExports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Active Exports
            </CardTitle>
            <CardDescription>
              Currently processing exports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeExports.map((exportResult) => (
                <div
                  key={exportResult.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(exportResult.status)}
                    <div>
                      <div className="font-medium">
                        {exportResult.requestId}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Status: {exportResult.status}
                        {exportResult.recordCount && (
                          <span className="ml-2">
                            • {exportResult.recordCount.toLocaleString()} records
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {exportResult.status === 'processing' && (
                      <div className="w-32">
                        <Progress value={exportResult.progress || 0} />
                        <div className="text-xs text-center mt-1">
                          {exportResult.progress || 0}%
                        </div>
                      </div>
                    )}
                    
                    <Badge variant="outline">
                      {exportResult.pointsConsumed} points
                    </Badge>
                    
                    {(exportResult.status === 'queued' || exportResult.status === 'processing') && (
                      <Button
                        onClick={() => handleCancelExport(exportResult.id)}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Export Interface */}
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Export</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <ExportRequestForm onSubmit={handleExportRequest} />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <ExportTemplates onUseTemplate={handleExportRequest} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ExportHistory
            exports={exportHistory}
            onDownload={handleDownload}
            onRefresh={loadExportHistory}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExportHub;