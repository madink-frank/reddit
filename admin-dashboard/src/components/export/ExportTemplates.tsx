import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  FileSpreadsheet,
  FileText,
  Table,
  BarChart3,
  Download,
  Star,
  TrendingUp,
  DollarSign,
  Activity
} from 'lucide-react';
import { ExportRequest, ExportTemplate } from '../../types/advanced-dashboard';
import { exportService } from '../../services/exportService';
import { useToast } from '../../hooks/use-toast';

interface ExportTemplatesProps {
  onUseTemplate: (request: Omit<ExportRequest, 'id'>) => void;
  className?: string;
}

export const ExportTemplates: React.FC<ExportTemplatesProps> = ({
  onUseTemplate,
  className
}) => {
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templateData = await exportService.getExportTemplates();
      setTemplates(templateData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load export templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (template: ExportTemplate) => {
    const request: Omit<ExportRequest, 'id'> = {
      dataType: template.dataType,
      format: template.format,
      options: template.defaultOptions || {},
    };

    onUseTemplate(request);

    toast({
      title: "Template Applied",
      description: `${template.name} template has been applied to the export form`,
    });
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'excel':
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      case 'csv':
        return <Table className="h-5 w-5 text-blue-600" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-600" />;
      case 'json':
        return <BarChart3 className="h-5 w-5 text-purple-600" />;
      default:
        return <Download className="h-5 w-5 text-gray-600" />;
    }
  };

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType) {
      case 'posts':
        return <Activity className="h-4 w-4" />;
      case 'analysis':
        return <TrendingUp className="h-4 w-4" />;
      case 'reports':
        return <DollarSign className="h-4 w-4" />;
      case 'metrics':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const getDataTypeColor = (dataType: string) => {
    switch (dataType) {
      case 'posts':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'analysis':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'reports':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'metrics':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Predefined templates if API doesn't return any
  const defaultTemplates: ExportTemplate[] = [
    {
      id: 'posts_excel_comprehensive',
      name: 'Comprehensive Posts Report',
      description: 'Complete posts export with analysis data, sentiment scores, and engagement metrics in Excel format with charts and formatting.',
      format: 'excel',
      dataType: 'posts',
      defaultOptions: {
        includeAnalysis: true,
        includeMetadata: true,
        maxRecords: 10000,
      }
    },
    {
      id: 'sentiment_analysis_pdf',
      name: 'Sentiment Analysis Report',
      description: 'Professional PDF report with sentiment analysis results, trend visualizations, and executive summary.',
      format: 'pdf',
      dataType: 'analysis',
      defaultOptions: {
        includeAnalysis: true,
        includeImages: true,
        includeMetadata: true,
      }
    },
    {
      id: 'posts_csv_basic',
      name: 'Basic Posts CSV',
      description: 'Simple CSV export of posts data with essential fields for data analysis and processing.',
      format: 'csv',
      dataType: 'posts',
      defaultOptions: {
        includeAnalysis: false,
        includeMetadata: true,
        maxRecords: 50000,
      }
    },
    {
      id: 'billing_excel_detailed',
      name: 'Billing & Usage Report',
      description: 'Detailed Excel report with billing data, usage analytics, point consumption, and cost analysis.',
      format: 'excel',
      dataType: 'reports',
      defaultOptions: {
        includeAnalysis: true,
        includeMetadata: true,
        maxRecords: 10000,
      }
    },
    {
      id: 'image_analysis_json',
      name: 'Image Analysis Data',
      description: 'JSON export of image analysis results including object detection, OCR, and classification data.',
      format: 'json',
      dataType: 'images',
      defaultOptions: {
        includeAnalysis: true,
        includeImages: false,
        includeMetadata: true,
      }
    },
    {
      id: 'system_metrics_csv',
      name: 'System Metrics Export',
      description: 'CSV export of system performance metrics, crawling statistics, and operational data.',
      format: 'csv',
      dataType: 'metrics',
      defaultOptions: {
        includeAnalysis: false,
        includeMetadata: true,
        maxRecords: 25000,
      }
    }
  ];

  const displayTemplates = templates.length > 0 ? templates : defaultTemplates;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading templates...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Export Templates
        </CardTitle>
        <CardDescription>
          Pre-configured export templates for common use cases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getFormatIcon(template.format)}
                    <div>
                      <h3 className="font-medium text-sm">{template.name}</h3>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${getDataTypeColor(template.dataType)}`}
                  >
                    <div className="flex items-center gap-1">
                      {getDataTypeIcon(template.dataType)}
                      {template.dataType}
                    </div>
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {template.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Format:</span>
                    <Badge variant="outline" className="text-xs">
                      {template.format.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Max Records:</span>
                    <span className="font-medium">
                      {template.defaultOptions?.maxRecords?.toLocaleString() || 'Unlimited'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Includes Analysis:</span>
                    <Badge
                      variant={template.defaultOptions?.includeAnalysis ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {template.defaultOptions?.includeAnalysis ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>

                <Button
                  onClick={() => handleUseTemplate(template)}
                  className="w-full"
                  size="sm"
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Template Categories */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-medium mb-4">Template Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="font-medium text-sm">Posts</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {displayTemplates.filter(t => t.dataType === 'posts').length} templates
              </div>
            </div>

            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium text-sm">Analysis</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {displayTemplates.filter(t => t.dataType === 'analysis').length} templates
              </div>
            </div>

            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="font-medium text-sm">Reports</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {displayTemplates.filter(t => t.dataType === 'reports').length} templates
              </div>
            </div>

            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <BarChart3 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="font-medium text-sm">Metrics</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {displayTemplates.filter(t => t.dataType === 'metrics').length} templates
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportTemplates;