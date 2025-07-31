/**
 * Audit Log Viewer Component
 * 
 * Provides interface for viewing and managing audit logs
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Eye, 
  Filter, 
  Download, 
  Search,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { auditLogger, AuditLog } from '../../utils/accessControl';

interface AuditLogViewerProps {
  userId?: string;
  maxLogs?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface LogFilter {
  userId?: string;
  action?: string;
  resource?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  userId,
  maxLogs = 100,
  autoRefresh = false,
  refreshInterval = 30000
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter state
  const [filter, setFilter] = useState<LogFilter>({
    userId: userId
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Load logs
  const loadLogs = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let allLogs: AuditLog[];
      
      if (userId) {
        allLogs = auditLogger.getUserLogs(userId, maxLogs);
      } else {
        allLogs = auditLogger.getRecentLogs(maxLogs);
      }
      
      setLogs(allLogs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = [...logs];

    if (filter.userId) {
      filtered = filtered.filter(log => 
        log.userId.toLowerCase().includes(filter.userId!.toLowerCase())
      );
    }

    if (filter.action) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(filter.action!.toLowerCase())
      );
    }

    if (filter.resource) {
      filtered = filtered.filter(log => 
        log.resource.toLowerCase().includes(filter.resource!.toLowerCase())
      );
    }

    if (filter.success !== undefined) {
      filtered = filtered.filter(log => log.success === filter.success);
    }

    if (filter.startDate) {
      filtered = filtered.filter(log => log.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      filtered = filtered.filter(log => log.timestamp <= filter.endDate!);
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(query) ||
        log.resource.toLowerCase().includes(query) ||
        log.userId.toLowerCase().includes(query) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(query))
      );
    }

    setFilteredLogs(filtered);
  };

  // Export logs
  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  // Get action icon
  const getActionIcon = (action: string) => {
    if (action.includes('login') || action.includes('auth')) {
      return <User className="w-4 h-4" />;
    }
    if (action.includes('view') || action.includes('read')) {
      return <Eye className="w-4 h-4" />;
    }
    if (action.includes('create') || action.includes('add')) {
      return <CheckCircle className="w-4 h-4" />;
    }
    if (action.includes('delete') || action.includes('remove')) {
      return <AlertTriangle className="w-4 h-4" />;
    }
    return <Activity className="w-4 h-4" />;
  };

  // Get success badge
  const getSuccessBadge = (success: boolean) => {
    return (
      <Badge variant={success ? 'success' : 'destructive'} className="text-xs">
        {success ? 'Success' : 'Failed'}
      </Badge>
    );
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(timestamp);
  };

  // Initialize
  useEffect(() => {
    loadLogs();
  }, [userId, maxLogs]);

  // Apply filters when logs or filter changes
  useEffect(() => {
    applyFilters();
  }, [logs, filter]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadLogs, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-primary">Audit Logs</h2>
            <p className="text-sm text-secondary">
              {filteredLogs.length} of {logs.length} logs
              {userId && ` for user ${userId}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {filteredLogs.length}
              </div>
              <div className="text-sm text-secondary">Total Logs</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {filteredLogs.filter(log => log.success).length}
              </div>
              <div className="text-sm text-secondary">Successful</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-error">
                {filteredLogs.filter(log => !log.success).length}
              </div>
              <div className="text-sm text-secondary">Failed</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-info">
                {new Set(filteredLogs.map(log => log.userId)).size}
              </div>
              <div className="text-sm text-secondary">Unique Users</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-secondary">Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 mx-auto mb-4 text-tertiary" />
              <p className="text-secondary">No audit logs found</p>
              <p className="text-xs text-tertiary mt-1">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary">
                    <th className="text-left py-3 px-4 font-medium text-secondary">Timestamp</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">User</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">Action</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">Resource</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-secondary">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr 
                      key={log.id}
                      className="border-b border-primary hover:bg-surface-secondary cursor-pointer"
                      onClick={() => {
                        setSelectedLog(log);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-tertiary" />
                          <span className="text-sm text-primary">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <span className="text-sm text-primary font-mono">
                          {log.userId.substring(0, 8)}...
                        </span>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className="text-sm text-primary">{log.action}</span>
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <span className="text-sm text-secondary">{log.resource}</span>
                      </td>
                      
                      <td className="py-3 px-4">
                        {getSuccessBadge(log.success)}
                      </td>
                      
                      <td className="py-3 px-4">
                        {log.details && (
                          <Badge variant="outline" className="text-xs">
                            {Object.keys(log.details).length} fields
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter Modal */}
      <Modal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter Audit Logs"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Search Query
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-tertiary" />
              <input
                type="text"
                placeholder="Search actions, resources, users..."
                value={filter.searchQuery || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-primary rounded-lg bg-surface-primary text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                User ID
              </label>
              <input
                type="text"
                placeholder="Filter by user ID"
                value={filter.userId || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, userId: e.target.value }))}
                className="w-full px-3 py-2 border border-primary rounded-lg bg-surface-primary text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Action
              </label>
              <input
                type="text"
                placeholder="Filter by action"
                value={filter.action || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, action: e.target.value }))}
                className="w-full px-3 py-2 border border-primary rounded-lg bg-surface-primary text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Resource
            </label>
            <input
              type="text"
              placeholder="Filter by resource"
              value={filter.resource || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, resource: e.target.value }))}
              className="w-full px-3 py-2 border border-primary rounded-lg bg-surface-primary text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Status
            </label>
            <select
              value={filter.success === undefined ? '' : filter.success.toString()}
              onChange={(e) => setFilter(prev => ({ 
                ...prev, 
                success: e.target.value === '' ? undefined : e.target.value === 'true'
              }))}
              className="w-full px-3 py-2 border border-primary rounded-lg bg-surface-primary text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={filter.startDate ? filter.startDate.toISOString().slice(0, 16) : ''}
                onChange={(e) => setFilter(prev => ({ 
                  ...prev, 
                  startDate: e.target.value ? new Date(e.target.value) : undefined
                }))}
                className="w-full px-3 py-2 border border-primary rounded-lg bg-surface-primary text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                End Date
              </label>
              <input
                type="datetime-local"
                value={filter.endDate ? filter.endDate.toISOString().slice(0, 16) : ''}
                onChange={(e) => setFilter(prev => ({ 
                  ...prev, 
                  endDate: e.target.value ? new Date(e.target.value) : undefined
                }))}
                className="w-full px-3 py-2 border border-primary rounded-lg bg-surface-primary text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setFilter({ userId: userId });
              }}
            >
              Clear Filters
            </Button>
            
            <Button
              onClick={() => setIsFilterOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>

      {/* Log Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Audit Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-secondary">Timestamp</label>
                <p className="text-primary">{formatTimestamp(selectedLog.timestamp)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary">Status</label>
                <div className="mt-1">
                  {getSuccessBadge(selectedLog.success)}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary">User ID</label>
                <p className="text-primary font-mono">{selectedLog.userId}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary">Action</label>
                <p className="text-primary">{selectedLog.action}</p>
              </div>
              
              <div className="col-span-2">
                <label className="text-sm font-medium text-secondary">Resource</label>
                <p className="text-primary">{selectedLog.resource}</p>
              </div>
            </div>
            
            {selectedLog.ipAddress && (
              <div>
                <label className="text-sm font-medium text-secondary">IP Address</label>
                <p className="text-primary font-mono">{selectedLog.ipAddress}</p>
              </div>
            )}
            
            {selectedLog.userAgent && (
              <div>
                <label className="text-sm font-medium text-secondary">User Agent</label>
                <p className="text-primary text-sm break-all">{selectedLog.userAgent}</p>
              </div>
            )}
            
            {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
              <div>
                <label className="text-sm font-medium text-secondary">Additional Details</label>
                <pre className="mt-2 p-3 bg-surface-secondary rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};