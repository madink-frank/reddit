import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/separator';
import { Slider } from '../ui/slider';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { 
  Filter, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon,
  Search,
  Settings,
  Eye,
  Save,
  RotateCcw,
  Download,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import { useToast } from '../../hooks/use-toast';

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: any;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
}

interface DataTransformation {
  id: string;
  type: 'aggregate' | 'sort' | 'group' | 'calculate' | 'format';
  field?: string;
  operation?: string;
  parameters?: Record<string, any>;
}

interface FilterPreset {
  id: string;
  name: string;
  description: string;
  conditions: FilterCondition[];
  transformations: DataTransformation[];
}

interface AdvancedDataFiltersProps {
  onFiltersChange: (filters: FilterCondition[], transformations: DataTransformation[]) => void;
  onPreview: (filters: FilterCondition[], transformations: DataTransformation[]) => void;
  availableFields: { field: string; label: string; type: string }[];
  className?: string;
}

const OPERATORS = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'regex', label: 'Matches regex' }
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'greater_equal', label: 'Greater than or equal' },
    { value: 'less_equal', label: 'Less than or equal' },
    { value: 'between', label: 'Between' }
  ],
  date: [
    { value: 'equals', label: 'On date' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'between', label: 'Between' },
    { value: 'last_days', label: 'Last N days' },
    { value: 'last_weeks', label: 'Last N weeks' },
    { value: 'last_months', label: 'Last N months' }
  ],
  boolean: [
    { value: 'is_true', label: 'Is true' },
    { value: 'is_false', label: 'Is false' }
  ]
};

const TRANSFORMATION_TYPES = [
  { value: 'aggregate', label: 'Aggregate Data', description: 'Sum, count, average, etc.' },
  { value: 'sort', label: 'Sort Data', description: 'Order by field values' },
  { value: 'group', label: 'Group Data', description: 'Group by field values' },
  { value: 'calculate', label: 'Calculate Field', description: 'Create calculated fields' },
  { value: 'format', label: 'Format Data', description: 'Format field values' }
];

const PRESET_FILTERS: FilterPreset[] = [
  {
    id: 'recent_high_engagement',
    name: 'Recent High Engagement',
    description: 'Posts from last 7 days with high scores',
    conditions: [
      {
        id: '1',
        field: 'created_at',
        operator: 'last_days',
        value: 7,
        type: 'date'
      },
      {
        id: '2',
        field: 'score',
        operator: 'greater_than',
        value: 100,
        type: 'number'
      }
    ],
    transformations: [
      {
        id: '1',
        type: 'sort',
        field: 'score',
        operation: 'desc'
      }
    ]
  },
  {
    id: 'positive_sentiment',
    name: 'Positive Sentiment Content',
    description: 'Content with positive sentiment analysis',
    conditions: [
      {
        id: '1',
        field: 'sentiment_score',
        operator: 'greater_than',
        value: 0.5,
        type: 'number'
      }
    ],
    transformations: []
  },
  {
    id: 'popular_subreddits',
    name: 'Popular Subreddits',
    description: 'Content from top performing subreddits',
    conditions: [
      {
        id: '1',
        field: 'subreddit',
        operator: 'contains',
        value: 'technology|programming|datascience',
        type: 'text'
      }
    ],
    transformations: [
      {
        id: '1',
        type: 'group',
        field: 'subreddit',
        operation: 'count'
      }
    ]
  }
];

export const AdvancedDataFilters: React.FC<AdvancedDataFiltersProps> = ({
  onFiltersChange,
  onPreview,
  availableFields,
  className
}) => {
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [transformations, setTransformations] = useState<DataTransformation[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    onFiltersChange(conditions, transformations);
  }, [conditions, transformations, onFiltersChange]);

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: Date.now().toString(),
      field: availableFields[0]?.field || '',
      operator: 'contains',
      value: '',
      type: availableFields[0]?.type as any || 'text'
    };
    setConditions(prev => [...prev, newCondition]);
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setConditions(prev =>
      prev.map(condition =>
        condition.id === id ? { ...condition, ...updates } : condition
      )
    );
  };

  const removeCondition = (id: string) => {
    setConditions(prev => prev.filter(condition => condition.id !== id));
  };

  const addTransformation = () => {
    const newTransformation: DataTransformation = {
      id: Date.now().toString(),
      type: 'sort',
      field: availableFields[0]?.field || '',
      operation: 'asc'
    };
    setTransformations(prev => [...prev, newTransformation]);
  };

  const updateTransformation = (id: string, updates: Partial<DataTransformation>) => {
    setTransformations(prev =>
      prev.map(transformation =>
        transformation.id === id ? { ...transformation, ...updates } : transformation
      )
    );
  };

  const removeTransformation = (id: string) => {
    setTransformations(prev => prev.filter(transformation => transformation.id !== id));
  };

  const applyPreset = (presetId: string) => {
    const preset = PRESET_FILTERS.find(p => p.id === presetId);
    if (preset) {
      setConditions(preset.conditions);
      setTransformations(preset.transformations);
      setSelectedPreset(presetId);
      toast({
        title: "Preset Applied",
        description: `Applied "${preset.name}" filter preset`,
      });
    }
  };

  const clearFilters = () => {
    setConditions([]);
    setTransformations([]);
    setSelectedPreset('');
    setShowPreview(false);
    setPreviewData([]);
  };

  const handlePreview = async () => {
    try {
      setPreviewLoading(true);
      
      // Mock preview data
      const mockData = [
        { id: 1, title: 'Sample Post 1', score: 150, subreddit: 'technology', created_at: '2024-01-15' },
        { id: 2, title: 'Sample Post 2', score: 89, subreddit: 'programming', created_at: '2024-01-14' },
        { id: 3, title: 'Sample Post 3', score: 234, subreddit: 'datascience', created_at: '2024-01-13' }
      ];
      
      setPreviewData(mockData);
      setShowPreview(true);
      
      onPreview(conditions, transformations);
      
      toast({
        title: "Preview Generated",
        description: `Preview shows ${mockData.length} records after filtering`,
      });
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: "Failed to generate data preview",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const getFieldType = (fieldName: string): string => {
    return availableFields.find(f => f.field === fieldName)?.type || 'text';
  };

  const renderConditionValue = (condition: FilterCondition) => {
    const fieldType = getFieldType(condition.field);
    
    switch (fieldType) {
      case 'number':
        if (condition.operator === 'between') {
          return (
            <div className="flex gap-2">
              <Input
                type="number"
                value={condition.value?.min || ''}
                onChange={(e) => updateCondition(condition.id, {
                  value: { ...condition.value, min: parseFloat(e.target.value) || 0 }
                })}
                placeholder="Min"
              />
              <Input
                type="number"
                value={condition.value?.max || ''}
                onChange={(e) => updateCondition(condition.id, {
                  value: { ...condition.value, max: parseFloat(e.target.value) || 0 }
                })}
                placeholder="Max"
              />
            </div>
          );
        }
        return (
          <Input
            type="number"
            value={condition.value || ''}
            onChange={(e) => updateCondition(condition.id, { value: parseFloat(e.target.value) || 0 })}
            placeholder="Enter number"
          />
        );

      case 'date':
        if (condition.operator === 'between') {
          return (
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {condition.value?.start ? format(new Date(condition.value.start), "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={condition.value?.start ? new Date(condition.value.start) : undefined}
                    onSelect={(date) => updateCondition(condition.id, {
                      value: { ...condition.value, start: date?.toISOString() }
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {condition.value?.end ? format(new Date(condition.value.end), "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={condition.value?.end ? new Date(condition.value.end) : undefined}
                    onSelect={(date) => updateCondition(condition.id, {
                      value: { ...condition.value, end: date?.toISOString() }
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          );
        }
        if (condition.operator.startsWith('last_')) {
          return (
            <Input
              type="number"
              value={condition.value || ''}
              onChange={(e) => updateCondition(condition.id, { value: parseInt(e.target.value) || 1 })}
              placeholder="Number of days/weeks/months"
            />
          );
        }
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {condition.value ? format(new Date(condition.value), "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={condition.value ? new Date(condition.value) : undefined}
                onSelect={(date) => updateCondition(condition.id, { value: date?.toISOString() })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'boolean':
        return null; // Boolean operators don't need values

      default:
        return (
          <Input
            value={condition.value || ''}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            placeholder="Enter value"
          />
        );
    }
  };

  const renderTransformationConfig = (transformation: DataTransformation) => {
    switch (transformation.type) {
      case 'sort':
        return (
          <div className="flex gap-2">
            <Select
              value={transformation.field}
              onValueChange={(value) => updateTransformation(transformation.id, { field: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Field" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.map(field => (
                  <SelectItem key={field.field} value={field.field}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={transformation.operation}
              onValueChange={(value) => updateTransformation(transformation.id, { operation: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'aggregate':
        return (
          <div className="flex gap-2">
            <Select
              value={transformation.field}
              onValueChange={(value) => updateTransformation(transformation.id, { field: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Field" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.filter(f => f.type === 'number').map(field => (
                  <SelectItem key={field.field} value={field.field}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={transformation.operation}
              onValueChange={(value) => updateTransformation(transformation.id, { operation: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sum">Sum</SelectItem>
                <SelectItem value="avg">Average</SelectItem>
                <SelectItem value="count">Count</SelectItem>
                <SelectItem value="min">Minimum</SelectItem>
                <SelectItem value="max">Maximum</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'group':
        return (
          <Select
            value={transformation.field}
            onValueChange={(value) => updateTransformation(transformation.id, { field: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Group by field" />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map(field => (
                <SelectItem key={field.field} value={field.field}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            Configuration for {transformation.type}
          </div>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Advanced Data Filters
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Configure filters and transformations for your data export
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={clearFilters} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Button onClick={handlePreview} variant="outline" size="sm" disabled={previewLoading}>
            <Eye className="h-4 w-4 mr-2" />
            {previewLoading ? 'Loading...' : 'Preview'}
          </Button>
        </div>
      </div>

      {/* Filter Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter Presets</CardTitle>
          <CardDescription>
            Quick start with common filter configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRESET_FILTERS.map(preset => (
              <div
                key={preset.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedPreset === preset.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => applyPreset(preset.id)}
              >
                <div className="font-medium text-sm">{preset.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {preset.description}
                </div>
                <div className="flex gap-1 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {preset.conditions.length} filters
                  </Badge>
                  {preset.transformations.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {preset.transformations.length} transforms
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter Conditions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Filter Conditions</CardTitle>
              <CardDescription>
                Define conditions to filter your data
              </CardDescription>
            </div>
            <Button onClick={addCondition} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {conditions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No filter conditions defined. Add conditions to filter your data.
            </div>
          ) : (
            <div className="space-y-4">
              {conditions.map((condition, index) => (
                <div key={condition.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {index > 0 && (
                    <Badge variant="outline" className="text-xs">
                      AND
                    </Badge>
                  )}
                  
                  <Select
                    value={condition.field}
                    onValueChange={(value) => {
                      const fieldType = getFieldType(value);
                      updateCondition(condition.id, { 
                        field: value, 
                        type: fieldType as any,
                        operator: OPERATORS[fieldType as keyof typeof OPERATORS]?.[0]?.value || 'contains',
                        value: ''
                      });
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map(field => (
                        <SelectItem key={field.field} value={field.field}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(condition.id, { operator: value, value: '' })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS[condition.type]?.map(op => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex-1">
                    {renderConditionValue(condition)}
                  </div>

                  <Button
                    onClick={() => removeCondition(condition.id)}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Transformations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Data Transformations</CardTitle>
              <CardDescription>
                Apply transformations to process your filtered data
              </CardDescription>
            </div>
            <Button onClick={addTransformation} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Transformation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transformations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transformations defined. Add transformations to process your data.
            </div>
          ) : (
            <div className="space-y-4">
              {transformations.map((transformation) => (
                <div key={transformation.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Select
                    value={transformation.type}
                    onValueChange={(value: any) => updateTransformation(transformation.id, { 
                      type: value,
                      field: '',
                      operation: ''
                    })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSFORMATION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex-1">
                    {renderTransformationConfig(transformation)}
                  </div>

                  <Button
                    onClick={() => removeTransformation(transformation.id)}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Results */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Data Preview
            </CardTitle>
            <CardDescription>
              Preview of filtered and transformed data ({previewData.length} records)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {previewData.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">
                  No data matches your current filters
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {Object.keys(previewData[0]).map(key => (
                        <th key={key} className="text-left p-2 font-medium">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="border-b">
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="p-2">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 10 && (
                  <div className="text-center py-2 text-sm text-gray-600 dark:text-gray-400">
                    Showing first 10 of {previewData.length} records
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filter Summary */}
      {(conditions.length > 0 || transformations.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filter Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conditions.length > 0 && (
                <div>
                  <span className="font-medium">Conditions:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {conditions.map(condition => (
                      <Badge key={condition.id} variant="outline" className="text-xs">
                        {availableFields.find(f => f.field === condition.field)?.label} {condition.operator} {String(condition.value)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {transformations.length > 0 && (
                <div>
                  <span className="font-medium">Transformations:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {transformations.map(transformation => (
                      <Badge key={transformation.id} variant="secondary" className="text-xs">
                        {transformation.type} {transformation.field} {transformation.operation}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedDataFilters;