import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
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
  RefreshCw,
  Search,
  Filter,
  Calendar,
  FileX
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ExportResult } from '../../types/advanced-dashboard';

interface ExportHistoryProps {
  exports: ExportResult[];
  onDownload: (exportResult: ExportResult) => void;
  onRefresh: () => void;
  loading?: boolean;
  className?: string;
}

export const ExportHistory: React.FC<ExportHistoryProps> = ({
  exports,
  onDownload,
  onRefresh,
  loading = false,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');

  // Filter exports based on search and filters
  const filteredExports = exports.filter(exp => {
    const matchesSearch = !searchTerm || 
      exp.requestId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || exp.status === statusFilter;
    
    const matchesFormat = formatFilter === 'all' || 
      exp.metadata?.format === formatFilter;

    return matchesSearch && matchesStatus && matchesFormat;
  });

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
        return <FileX className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'secondary';
      case 'queued':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Export History
            </CardTitle>
            <CardDescription>
              View and download your previous exports
            </CardDescription>
          </div>
          <Button
            onClick={onRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search exports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredExports.length === 0 ? (
          <div className="text-center py-8">
            <FileX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No exports found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {exports.length === 0 
                ? "You haven't created any exports yet."
                : "No exports match your current filters."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExports.map((exportResult) => (
              <div
                key={exportResult.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(exportResult.status)}
                    {getFormatIcon(exportResult.metadata?.format || 'unknown')}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">
                        {exportResult.requestId}
                      </h4>
                      <Badge variant={getStatusBadgeVariant(exportResult.status)}>
                        {exportResult.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(exportResult.expiresAt), { addSuffix: true })}
                      </span>
                      
                      {exportResult.recordCount && (
                        <span>
                          {exportResult.recordCount.toLocaleString()} records
                        </span>
                      )}
                      
                      {exportResult.fileSize && (
                        <span>
                          {formatFileSize(exportResult.fileSize)}
                        </span>
                      )}
                      
                      {exportResult.processingTime && (
                        <span>
                          {formatDuration(exportResult.processingTime)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    {exportResult.pointsConsumed} points
                  </Badge>
                  
                  {exportResult.status === 'completed' && exportResult.downloadUrl && (
                    <Button
                      onClick={() => onDownload(exportResult)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                  
                  {exportResult.status === 'failed' && exportResult.error && (
                    <div className="text-sm text-red-600 dark:text-red-400 max-w-48 truncate">
                      {exportResult.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {exports.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {exports.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Exports
                </div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {exports.filter(e => e.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Completed
                </div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {exports.filter(e => e.status === 'processing' || e.status === 'queued').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Active
                </div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {exports.reduce((sum, e) => sum + e.pointsConsumed, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Points Used
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExportHistory;