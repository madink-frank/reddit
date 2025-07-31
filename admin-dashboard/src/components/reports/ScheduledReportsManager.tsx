import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Mail,
  Calendar,
  FileText,
  Users,
  Settings,
  Activity
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '../../hooks/use-toast';

interface ScheduledReport {
  id: string;
  template_id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  filters: Record<string, any>;
  format: string;
  next_run: string;
  last_run?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  template_type: string;
}

interface ScheduledReportsManagerProps {
  className?: string;
}

export const ScheduledReportsManager: React.FC<ScheduledReportsManagerProps> = ({ className }) => {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const { toast } = useToast();

  // Form state for creating/editing scheduled reports
  const [formData, setFormData] = useState<{
    template_id: string;
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    recipients: string[];
    format: string;
    filters: Record<string, any>;
  }>({
    template_id: '',
    name: '',
    frequency: 'weekly',
    recipients: [''],
    format: 'pdf',
    filters: {}
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Mock data - in real implementation, fetch from API
      const mockTemplates: ReportTemplate[] = [
        {
          id: 'executive_summary',
          name: 'Executive Summary Report',
          description: 'High-level overview with key metrics',
          template_type: 'executive'
        },
        {
          id: 'detailed_analytics',
          name: 'Detailed Analytics Report',
          description: 'Comprehensive analysis with detailed statistics',
          template_type: 'detailed'
        },
        {
          id: 'performance_summary',
          name: 'Performance Summary',
          description: 'System performance and operational metrics',
          template_type: 'summary'
        }
      ];

      const mockScheduledReports: ScheduledReport[] = [
        {
          id: '1',
          template_id: 'executive_summary',
          name: 'Weekly Executive Report',
          frequency: 'weekly',
          recipients: ['exec@company.com', 'manager@company.com'],
          filters: { dateRange: { days: 7 } },
          format: 'pdf',
          next_run: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          last_run: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          created_by: 'user1',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          template_id: 'detailed_analytics',
          name: 'Monthly Analytics Deep Dive',
          frequency: 'monthly',
          recipients: ['analytics@company.com'],
          filters: { dateRange: { days: 30 } },
          format: 'excel',
          next_run: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          created_by: 'user1',
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      setTemplates(mockTemplates);
      setScheduledReports(mockScheduledReports);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load scheduled reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      if (!formData.name.trim() || !formData.template_id) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const validRecipients = formData.recipients.filter(email => email.trim() && email.includes('@'));
      if (validRecipients.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please provide at least one valid email recipient",
          variant: "destructive",
        });
        return;
      }

      // Mock API call
      const newReport: ScheduledReport = {
        id: Date.now().toString(),
        template_id: formData.template_id,
        name: formData.name,
        frequency: formData.frequency,
        recipients: validRecipients,
        filters: formData.filters,
        format: formData.format,
        next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_by: 'current_user',
        created_at: new Date().toISOString()
      };

      setScheduledReports(prev => [...prev, newReport]);
      setShowCreateDialog(false);
      resetForm();

      toast({
        title: "Success",
        description: "Scheduled report created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create scheduled report",
        variant: "destructive",
      });
    }
  };

  const handleUpdateReport = async (reportId: string, updates: Partial<ScheduledReport>) => {
    try {
      setScheduledReports(prev =>
        prev.map(report =>
          report.id === reportId ? { ...report, ...updates } : report
        )
      );

      toast({
        title: "Success",
        description: "Scheduled report updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update scheduled report",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      setScheduledReports(prev => prev.filter(report => report.id !== reportId));

      toast({
        title: "Success",
        description: "Scheduled report deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete scheduled report",
        variant: "destructive",
      });
    }
  };

  const handleExecuteNow = async (reportId: string) => {
    try {
      toast({
        title: "Report Execution Started",
        description: "The report is being generated and will be sent to recipients",
      });

      // Update last run time
      handleUpdateReport(reportId, {
        last_run: new Date().toISOString()
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute report",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      template_id: '',
      name: '',
      frequency: 'weekly',
      recipients: [''],
      format: 'pdf',
      filters: {}
    });
    setEditingReport(null);
  };

  const addRecipient = () => {
    setFormData(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };

  const updateRecipient = (index: number, email: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.map((recipient, i) => i === index ? email : recipient)
    }));
  };

  const removeRecipient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const getFrequencyBadgeColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-blue-100 text-blue-800';
      case 'weekly': return 'bg-green-100 text-green-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      case 'quarterly': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTemplateName = (templateId: string) => {
    return templates.find(t => t.id === templateId)?.name || 'Unknown Template';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading scheduled reports...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Scheduled Reports
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage automated report generation and delivery
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule New Report</DialogTitle>
              <DialogDescription>
                Create a recurring report that will be automatically generated and sent to recipients
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template">Report Template</Label>
                  <Select
                    value={formData.template_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, template_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="name">Report Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter report name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="format">Format</Label>
                  <Select
                    value={formData.format}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Recipients</Label>
                <div className="space-y-2">
                  {formData.recipients.map((recipient, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={recipient}
                        onChange={(e) => updateRecipient(index, e.target.value)}
                        placeholder="Enter email address"
                        type="email"
                      />
                      {formData.recipients.length > 1 && (
                        <Button
                          onClick={() => removeRecipient(index)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button onClick={addRecipient} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipient
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button onClick={() => setShowCreateDialog(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleCreateReport}>
                  Schedule Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scheduled Reports List */}
      {scheduledReports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Scheduled Reports
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first scheduled report to automate report generation and delivery
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Your First Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {scheduledReports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {report.name}
                      </h3>
                      <Badge className={getFrequencyBadgeColor(report.frequency)}>
                        {report.frequency}
                      </Badge>
                      {!report.is_active && (
                        <Badge variant="secondary">Paused</Badge>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Template: {getTemplateName(report.template_id)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{report.recipients.length} recipient(s)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Next run: {formatDistanceToNow(new Date(report.next_run), { addSuffix: true })}
                        </span>
                      </div>
                      {report.last_run && (
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          <span>
                            Last run: {formatDistanceToNow(new Date(report.last_run), { addSuffix: true })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={report.is_active}
                      onCheckedChange={(checked) => handleUpdateReport(report.id, { is_active: checked })}
                    />

                    <Button
                      onClick={() => handleExecuteNow(report.id)}
                      variant="outline"
                      size="sm"
                      disabled={!report.is_active}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Run Now
                    </Button>

                    <Button
                      onClick={() => {
                        setEditingReport(report);
                        setFormData({
                          template_id: report.template_id,
                          name: report.name,
                          frequency: report.frequency,
                          recipients: report.recipients,
                          format: report.format,
                          filters: report.filters
                        });
                        setShowCreateDialog(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      onClick={() => handleDeleteReport(report.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Recipients */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Recipients:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {report.recipients.map((recipient, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {recipient}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduledReportsManager;