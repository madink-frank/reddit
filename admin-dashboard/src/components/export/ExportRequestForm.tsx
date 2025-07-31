import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/separator';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { 
  FileSpreadsheet, 
  Table, 
  FileText, 
  BarChart3,
  Calendar as CalendarIcon,
  Info,
  AlertTriangle,
  Coins,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { ExportRequest, ExportField } from '../../types/advanced-dashboard';
import { exportService } from '../../services/exportService';
import { useToast } from '../../hooks/use-toast';
import { AdvancedDataFilters } from './AdvancedDataFilters';

interface ExportRequestFormProps {
  onSubmit: (request: Omit<ExportRequest, 'id'>) => void;
  className?: string;
}

export const ExportRequestForm: React.FC<ExportRequestFormProps> = ({ 
  onSubmit, 
  className 
}) => {
  const [formData, setFormData] = useState<Omit<ExportRequest, 'id'>>({
    dataType: 'posts',
    format: 'excel',
    filters: {},
    options: {
      includeAnalysis: true,
      includeMetadata: true,
      maxRecords: 10000,
    },
  });

  const [availableFields, setAvailableFields] = useState<ExportField[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [validation, setValidation] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<any[]>([]);
  const [advancedTransformations, setAdvancedTransformations] = useState<any[]>([]);
  const { toast } = useToast();

  // Load available fields when data type changes
  useEffect(() => {
    if (formData.dataType) {
      loadAvailableFields(formData.dataType);
    }
  }, [formData.dataType]);

  // Validate request when form data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      validateRequest();
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, dateRange]);

  const loadAvailableFields = async (dataType: string) => {
    try {
      const fields = await exportService.getAvailableFields(dataType);
      setAvailableFields(fields);
      
      // Select all fields by default
      setSelectedFields(fields.map(f => f.field));
    } catch (error) {
      console.error('Failed to load available fields:', error);
    }
  };

  const validateRequest = async () => {
    try {
      setValidating(true);
      
      const requestToValidate = {
        ...formData,
        filters: {
          ...formData.filters,
          dateRange: dateRange.start && dateRange.end ? {
            start: dateRange.start,
            end: dateRange.end,
          } : undefined,
        },
      };

      const result = await exportService.validateExportRequest(requestToValidate);
      setValidation(result);
    } catch (error) {
      console.error('Validation failed:', error);
      setValidation(null);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validation?.valid) {
      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const request = {
        ...formData,
        filters: {
          ...formData.filters,
          dateRange: dateRange.start && dateRange.end ? {
            start: dateRange.start,
            end: dateRange.end,
          } : undefined,
        },
      };

      await onSubmit(request);
      
      // Reset form
      setFormData({
        dataType: 'posts',
        format: 'excel',
        filters: {},
        options: {
          includeAnalysis: true,
          includeMetadata: true,
          maxRecords: 10000,
        },
      });
      setDateRange({});
      
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setSubmitting(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'csv':
        return <Table className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'json':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Create New Export</CardTitle>
        <CardDescription>
          Configure your data export with custom filters and options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data Type and Format Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataType">Data Type</Label>
              <Select
                value={formData.dataType}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, dataType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="posts">Posts</SelectItem>
                  <SelectItem value="analysis">Analysis Results</SelectItem>
                  <SelectItem value="images">Image Analysis</SelectItem>
                  <SelectItem value="reports">Reports & Billing</SelectItem>
                  <SelectItem value="metrics">System Metrics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Export Format</Label>
              <Select
                value={formData.format}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      Excel (.xlsx)
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4 text-blue-600" />
                      CSV (.csv)
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-600" />
                      PDF (.pdf)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                      JSON (.json)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Filters Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Filters</h3>
            
            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.start ? format(dateRange.start, "PPP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.start}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.end ? format(dateRange.end, "PPP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.end}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Keywords Filter */}
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords (comma-separated)</Label>
              <Input
                id="keywords"
                placeholder="Enter keywords to filter by..."
                value={formData.filters?.keywords?.join(', ') || ''}
                onChange={(e) => {
                  const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
                  setFormData(prev => ({
                    ...prev,
                    filters: { ...prev.filters, keywords: keywords.length > 0 ? keywords : undefined }
                  }));
                }}
              />
            </div>

            {/* Subreddits Filter */}
            <div className="space-y-2">
              <Label htmlFor="subreddits">Subreddits (comma-separated)</Label>
              <Input
                id="subreddits"
                placeholder="Enter subreddits to filter by..."
                value={formData.filters?.subreddits?.join(', ') || ''}
                onChange={(e) => {
                  const subreddits = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                  setFormData(prev => ({
                    ...prev,
                    filters: { ...prev.filters, subreddits: subreddits.length > 0 ? subreddits : undefined }
                  }));
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Advanced Filters Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Advanced Filters</h3>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
              </Button>
            </div>
            
            {showAdvancedFilters && (
              <AdvancedDataFilters
                onFiltersChange={(filters, transformations) => {
                  setAdvancedFilters(filters);
                  setAdvancedTransformations(transformations);
                }}
                onPreview={(filters, transformations) => {
                  // Handle preview
                  console.log('Preview filters:', filters, transformations);
                }}
                availableFields={availableFields}
              />
            )}
          </div>

          <Separator />

          {/* Options Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Export Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxRecords">Maximum Records</Label>
                <Input
                  id="maxRecords"
                  type="number"
                  min="1"
                  max="100000"
                  value={formData.options?.maxRecords || 10000}
                  onChange={(e) => {
                    const maxRecords = parseInt(e.target.value) || 10000;
                    setFormData(prev => ({
                      ...prev,
                      options: { ...prev.options, maxRecords }
                    }));
                  }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAnalysis"
                  checked={formData.options?.includeAnalysis || false}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({
                      ...prev,
                      options: { ...prev.options, includeAnalysis: !!checked }
                    }));
                  }}
                />
                <Label htmlFor="includeAnalysis">Include Analysis Results</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeImages"
                  checked={formData.options?.includeImages || false}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({
                      ...prev,
                      options: { ...prev.options, includeImages: !!checked }
                    }));
                  }}
                />
                <Label htmlFor="includeImages">Include Images</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMetadata"
                  checked={formData.options?.includeMetadata || false}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({
                      ...prev,
                      options: { ...prev.options, includeMetadata: !!checked }
                    }));
                  }}
                />
                <Label htmlFor="includeMetadata">Include Metadata</Label>
              </div>
            </div>
          </div>

          {/* Validation Results */}
          {validation && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {validation.valid ? (
                  <Info className="h-4 w-4 text-blue-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-medium">
                  {validation.valid ? 'Export Ready' : 'Validation Issues'}
                </span>
              </div>

              {validation.valid && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Records</div>
                    <div className="font-medium">
                      {validation.estimatedRecords?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Size</div>
                    <div className="font-medium">
                      {validation.estimatedSize ? 
                        `${(validation.estimatedSize / 1024 / 1024).toFixed(1)} MB` : 
                        'N/A'
                      }
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Time</div>
                    <div className="font-medium">
                      {validation.estimatedTime ? 
                        `${Math.ceil(validation.estimatedTime)} sec` : 
                        'N/A'
                      }
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Cost</div>
                    <div className="font-medium flex items-center justify-center gap-1">
                      <Coins className="h-3 w-3" />
                      {validation.pointsCost || 0}
                    </div>
                  </div>
                </div>
              )}

              {validation.errors && validation.errors.length > 0 && (
                <div className="space-y-1">
                  {validation.errors.map((error: string, index: number) => (
                    <div key={index} className="text-sm text-red-600 dark:text-red-400">
                      • {error}
                    </div>
                  ))}
                </div>
              )}

              {validation.warnings && validation.warnings.length > 0 && (
                <div className="space-y-1">
                  {validation.warnings.map((warning: string, index: number) => (
                    <div key={index} className="text-sm text-yellow-600 dark:text-yellow-400">
                      • {warning}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!validation?.valid || submitting || validating}
              className="min-w-32"
            >
              {submitting ? 'Creating...' : 'Create Export'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ExportRequestForm;