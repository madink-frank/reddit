import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import {
  Plus,
  Trash2,
  Move,
  Settings,
  Eye,
  Save,
  FileText,
  BarChart3,
  Table,
  TrendingUp,
  Target
} from 'lucide-react';
// import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useToast } from '../../hooks/use-toast';

interface ReportSection {
  id: string;
  type: string;
  title: string;
  config: Record<string, any>;
}

interface ReportTemplate {
  id?: string;
  name: string;
  description: string;
  template_type: string;
  sections: ReportSection[];
  default_filters: Record<string, any>;
  format_options: Record<string, any>;
  is_public: boolean;
  tags: string[];
}

interface ReportTemplateBuilderProps {
  template?: ReportTemplate;
  onSave: (template: ReportTemplate) => void;
  onCancel: () => void;
}

const SECTION_TYPES = [
  {
    type: 'title_page',
    name: 'Title Page',
    icon: FileText,
    description: 'Report title and metadata'
  },
  {
    type: 'key_metrics',
    name: 'Key Metrics',
    icon: Target,
    description: 'Important KPIs and statistics'
  },
  {
    type: 'trend_analysis',
    name: 'Trend Analysis',
    icon: TrendingUp,
    description: 'Time-based trend charts'
  },
  {
    type: 'sentiment_analysis',
    name: 'Sentiment Analysis',
    icon: BarChart3,
    description: 'Sentiment analysis results'
  },
  {
    type: 'keyword_analysis',
    name: 'Keyword Analysis',
    icon: BarChart3,
    description: 'Keyword frequency analysis'
  },
  {
    type: 'data_tables',
    name: 'Data Tables',
    icon: Table,
    description: 'Detailed data tables'
  }
];

export const ReportTemplateBuilder: React.FC<ReportTemplateBuilderProps> = ({
  template,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<ReportTemplate>({
    name: '',
    description: '',
    template_type: 'custom',
    sections: [],
    default_filters: {},
    format_options: { format: 'pdf' },
    is_public: false,
    tags: [],
    ...template
  });

  const [newTag, setNewTag] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  const addSection = (sectionType: string) => {
    const newSection: ReportSection = {
      id: `section_${Date.now()}`,
      type: sectionType,
      title: SECTION_TYPES.find(t => t.type === sectionType)?.name || 'New Section',
      config: {}
    };

    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const updateSection = (sectionId: string, updates: Partial<ReportSection>) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  };

  const removeSection = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
  };

  // const onDragEnd = (result: any) => {
  //   if (!result.destination) return;

  //   const sections = Array.from(formData.sections);
  //   const [reorderedSection] = sections.splice(result.source.index, 1);
  //   sections.splice(result.destination.index, 0, reorderedSection);

  //   setFormData(prev => ({ ...prev, sections }));
  // };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.sections.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one section is required",
        variant: "destructive",
      });
      return;
    }

    onSave(formData);
  };

  const getSectionIcon = (type: string) => {
    const sectionType = SECTION_TYPES.find(t => t.type === type);
    const IconComponent = sectionType?.icon || FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  const renderSectionConfig = (section: ReportSection) => {
    switch (section.type) {
      case 'title_page':
        return (
          <div className="space-y-3">
            <div>
              <Label>Subtitle</Label>
              <Input
                value={section.config.subtitle || ''}
                onChange={(e) => updateSection(section.id, {
                  config: { ...section.config, subtitle: e.target.value }
                })}
                placeholder="Report subtitle"
              />
            </div>
          </div>
        );

      case 'key_metrics':
        return (
          <div className="space-y-3">
            <div>
              <Label>Metrics to Include</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['total_posts', 'engagement_rate', 'sentiment_score', 'growth_rate'].map(metric => (
                  <label key={metric} className="flex items-center space-x-2">
                    <Checkbox
                      checked={section.config.metrics?.includes(metric) || false}
                      onCheckedChange={(checked) => {
                        const currentMetrics = section.config.metrics || [];
                        const newMetrics = checked
                          ? [...currentMetrics, metric]
                          : currentMetrics.filter((m: string) => m !== metric);
                        updateSection(section.id, {
                          config: { ...section.config, metrics: newMetrics }
                        });
                      }}
                    />
                    <span className="text-sm">{metric.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'trend_analysis':
        return (
          <div className="space-y-3">
            <div>
              <Label>Charts to Include</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['sentiment_timeline', 'engagement_trends', 'keyword_trends'].map(chart => (
                  <label key={chart} className="flex items-center space-x-2">
                    <Checkbox
                      checked={section.config.charts?.includes(chart) || false}
                      onCheckedChange={(checked) => {
                        const currentCharts = section.config.charts || [];
                        const newCharts = checked
                          ? [...currentCharts, chart]
                          : currentCharts.filter((c: string) => c !== chart);
                        updateSection(section.id, {
                          config: { ...section.config, charts: newCharts }
                        });
                      }}
                    />
                    <span className="text-sm">{chart.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'data_tables':
        return (
          <div className="space-y-3">
            <div>
              <Label>Max Rows</Label>
              <Input
                type="number"
                value={section.config.max_rows || 100}
                onChange={(e) => updateSection(section.id, {
                  config: { ...section.config, max_rows: parseInt(e.target.value) || 100 }
                })}
              />
            </div>
            <label className="flex items-center space-x-2">
              <Checkbox
                checked={section.config.include_totals || false}
                onCheckedChange={(checked) => updateSection(section.id, {
                  config: { ...section.config, include_totals: checked }
                })}
              />
              <span className="text-sm">Include totals row</span>
            </label>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            No configuration options for this section type.
          </div>
        );
    }
  };

  if (previewMode) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Template Preview</CardTitle>
              <CardDescription>{formData.name}</CardDescription>
            </div>
            <Button onClick={() => setPreviewMode(false)} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Template Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {formData.name}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {formData.template_type}
                </div>
                <div>
                  <span className="font-medium">Format:</span> {formData.format_options.format}
                </div>
                <div>
                  <span className="font-medium">Public:</span> {formData.is_public ? 'Yes' : 'No'}
                </div>
              </div>
              <div className="mt-2">
                <span className="font-medium">Description:</span> {formData.description}
              </div>
              {formData.tags.length > 0 && (
                <div className="mt-2">
                  <span className="font-medium">Tags:</span>
                  <div className="flex gap-1 mt-1">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Report Sections</h3>
              <div className="space-y-3">
                {formData.sections.map((section, index) => (
                  <div key={section.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{index + 1}.</span>
                      {getSectionIcon(section.type)}
                    </div>
                    <div>
                      <div className="font-medium">{section.title}</div>
                      <div className="text-sm text-gray-600">
                        {SECTION_TYPES.find(t => t.type === section.type)?.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
          <CardDescription>
            Basic information about your report template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name"
              />
            </div>

            <div>
              <Label htmlFor="type">Template Type</Label>
              <Select
                value={formData.template_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, template_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive">Executive Summary</SelectItem>
                  <SelectItem value="detailed">Detailed Analytics</SelectItem>
                  <SelectItem value="summary">Performance Summary</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this template is for"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="format">Default Format</Label>
              <Select
                value={formData.format_options.format}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  format_options: { ...prev.format_options, format: value }
                }))}
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

            <div className="flex items-center space-x-2 mt-6">
              <Checkbox
                id="public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: !!checked }))}
              />
              <Label htmlFor="public">Make template public</Label>
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex gap-1 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Sections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Report Sections</CardTitle>
              <CardDescription>
                Configure the sections that will appear in your report
              </CardDescription>
            </div>
            <Button onClick={() => setPreviewMode(true)} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Section Buttons */}
          <div className="mb-6">
            <Label className="mb-3 block">Add Section</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SECTION_TYPES.map(sectionType => {
                const IconComponent = sectionType.icon;
                return (
                  <Button
                    key={sectionType.type}
                    variant="outline"
                    onClick={() => addSection(sectionType.type)}
                    className="justify-start"
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {sectionType.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Sections List */}
          {formData.sections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sections added yet. Add sections using the buttons above.
            </div>
          ) : (
            <div className="space-y-4">
              {formData.sections.map((section) => (
                <div key={section.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="cursor-move">
                        <Move className="h-4 w-4 text-gray-400" />
                      </div>
                      {getSectionIcon(section.type)}
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        className="font-medium"
                      />
                    </div>
                    <Button
                      onClick={() => removeSection(section.id)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="ml-10">
                    {renderSectionConfig(section)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </Button>
      </div>
    </div>
  );
};

export default ReportTemplateBuilder;