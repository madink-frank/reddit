/**
 * Comprehensive User Documentation System
 * 
 * Provides contextual help, tutorials, and documentation for all features
 */

import React, { useState, useEffect } from 'react';
import {
  Book,
  Play,
  CheckCircle,
  ArrowRight,
  Search,
  Filter,
  ExternalLink,
  Download,
  Star,
  Clock,
  Users,
  Lightbulb,
  MessageCircle,
  Video,
  FileText,
  Zap,
  Target,
  Settings,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Modal } from '../ui/Modal';

interface DocumentationSection {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'features' | 'advanced' | 'troubleshooting' | 'api';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  content: string;
  steps?: DocumentationStep[];
  relatedSections?: string[];
  tags: string[];
  lastUpdated: Date;
  popularity: number;
}

interface DocumentationStep {
  id: string;
  title: string;
  description: string;
  action?: string;
  screenshot?: string;
  code?: string;
  tips?: string[];
  warnings?: string[];
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  steps: TutorialStep[];
  prerequisites?: string[];
  learningObjectives: string[];
  completionRate: number;
}

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  action?: {
    type: 'click' | 'input' | 'navigate' | 'wait';
    target?: string;
    value?: string;
  };
  validation?: {
    type: 'element' | 'url' | 'value';
    target: string;
    expected: string;
  };
  hints?: string[];
}

interface UserDocumentationProps {
  currentFeature?: string;
  showTutorials?: boolean;
  onStartTutorial?: (tutorialId: string) => void;
}

export const UserDocumentation: React.FC<UserDocumentationProps> = ({
  currentFeature,
  showTutorials = true,
  onStartTutorial
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<DocumentationSection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Mock documentation data
  const [documentationSections] = useState<DocumentationSection[]>([
    {
      id: 'dashboard-overview',
      title: 'Dashboard Overview',
      description: 'Learn about the main dashboard interface and navigation',
      category: 'getting-started',
      difficulty: 'beginner',
      estimatedTime: 5,
      content: `
# Dashboard Overview

The Advanced Dashboard provides a centralized interface for all Reddit content analysis features.

## Key Components

### Navigation
- **Main Menu**: Access all features from the sidebar
- **Quick Actions**: Common tasks available from the dashboard
- **Status Indicators**: Real-time system health and feature status

### Dashboard Cards
- **Statistics**: Key metrics and performance indicators
- **System Health**: Monitor service status and uptime
- **Recent Activity**: Latest actions and updates

### Feature Integration
All advanced features are seamlessly integrated:
- NLP Analysis tools
- Image processing capabilities
- Real-time monitoring
- Business intelligence
- Export and reporting
      `,
      steps: [
        {
          id: 'step-1',
          title: 'Navigate to Dashboard',
          description: 'Open the main dashboard page',
          action: 'Click on "Dashboard" in the main navigation'
        },
        {
          id: 'step-2',
          title: 'Explore Quick Actions',
          description: 'Review available quick action buttons',
          tips: ['Each button provides direct access to key features']
        },
        {
          id: 'step-3',
          title: 'Check System Status',
          description: 'Review the system health indicators',
          warnings: ['Red indicators require immediate attention']
        }
      ],
      relatedSections: ['nlp-analysis-guide', 'image-analysis-guide'],
      tags: ['dashboard', 'navigation', 'overview'],
      lastUpdated: new Date('2024-01-15'),
      popularity: 95
    },
    {
      id: 'nlp-analysis-guide',
      title: 'NLP Analysis Guide',
      description: 'Complete guide to natural language processing features',
      category: 'features',
      difficulty: 'intermediate',
      estimatedTime: 15,
      content: `
# NLP Analysis Guide

Natural Language Processing (NLP) analysis provides comprehensive text analysis capabilities.

## Available Analysis Types

### Morphological Analysis
- **Part-of-Speech Tagging**: Identify grammatical components
- **Morpheme Extraction**: Break down words into meaningful units
- **Linguistic Structure**: Analyze sentence structure and relationships

### Sentiment Analysis
- **Emotion Detection**: Identify positive, negative, and neutral sentiment
- **Confidence Scoring**: Measure analysis reliability
- **Temporal Trends**: Track sentiment changes over time

### Text Similarity
- **Fuzzy Matching**: Find similar content with configurable thresholds
- **Duplicate Detection**: Identify exact and near-duplicate content
- **Similarity Scoring**: Quantify content relationships

### Keyword Extraction
- **Frequency Analysis**: Identify most common terms
- **Importance Scoring**: Weight keywords by relevance
- **Word Clouds**: Visual representation of keyword frequency
      `,
      steps: [
        {
          id: 'nlp-step-1',
          title: 'Access NLP Tools',
          description: 'Navigate to the NLP Analysis page',
          action: 'Click "NLP Analysis" in the main menu'
        },
        {
          id: 'nlp-step-2',
          title: 'Select Analysis Type',
          description: 'Choose the type of analysis to perform',
          tips: ['Start with sentiment analysis for quick insights']
        },
        {
          id: 'nlp-step-3',
          title: 'Input Text',
          description: 'Provide text content for analysis',
          code: 'Paste text directly or select from existing posts'
        },
        {
          id: 'nlp-step-4',
          title: 'Review Results',
          description: 'Examine the analysis output and insights',
          tips: ['Use the export feature to save results']
        }
      ],
      relatedSections: ['image-analysis-guide', 'export-guide'],
      tags: ['nlp', 'analysis', 'sentiment', 'text'],
      lastUpdated: new Date('2024-01-20'),
      popularity: 88
    },
    {
      id: 'image-analysis-guide',
      title: 'Image Analysis Guide',
      description: 'Learn how to use computer vision and OCR features',
      category: 'features',
      difficulty: 'intermediate',
      estimatedTime: 12,
      content: `
# Image Analysis Guide

Image analysis provides powerful computer vision capabilities for visual content.

## Core Features

### Object Detection
- **Visual Recognition**: Identify objects, people, and scenes
- **Confidence Scoring**: Measure detection accuracy
- **Bounding Boxes**: Precise object location information

### OCR (Optical Character Recognition)
- **Text Extraction**: Extract text from images and documents
- **Multi-language Support**: Process content in various languages
- **Format Support**: Handle images, PDFs, and scanned documents

### Image Classification
- **Content Categorization**: Classify image types and themes
- **Visual Features**: Analyze colors, brightness, and composition
- **Trend Analysis**: Track visual content patterns
      `,
      steps: [
        {
          id: 'img-step-1',
          title: 'Upload Images',
          description: 'Select images for analysis',
          action: 'Use drag-and-drop or file browser'
        },
        {
          id: 'img-step-2',
          title: 'Choose Analysis Type',
          description: 'Select object detection, OCR, or classification',
          tips: ['OCR works best with clear, high-contrast text']
        },
        {
          id: 'img-step-3',
          title: 'Process Images',
          description: 'Start the analysis process',
          warnings: ['Large images may take longer to process']
        },
        {
          id: 'img-step-4',
          title: 'Review Results',
          description: 'Examine detected objects and extracted text',
          tips: ['Click on detected objects for detailed information']
        }
      ],
      relatedSections: ['nlp-analysis-guide', 'export-guide'],
      tags: ['image', 'ocr', 'detection', 'vision'],
      lastUpdated: new Date('2024-01-18'),
      popularity: 82
    },
    {
      id: 'billing-system-guide',
      title: 'Billing System Guide',
      description: 'Understand the point-based billing system and usage tracking',
      category: 'features',
      difficulty: 'beginner',
      estimatedTime: 8,
      content: `
# Billing System Guide

The point-based billing system provides transparent, usage-based pricing.

## How It Works

### Point System
- **1 Point = 1 Currency Unit**: Simple, transparent pricing
- **Usage-Based**: Pay only for what you use
- **Real-time Tracking**: Monitor spending as you go

### Point Consumption
- **Data Collection**: Points per item collected
- **Analysis Operations**: Points per analysis performed
- **Export Operations**: Points per export generated

### Management Features
- **Balance Monitoring**: Real-time point balance display
- **Usage History**: Detailed transaction records
- **Spending Limits**: Set daily/monthly limits
- **Low Balance Alerts**: Automatic notifications
      `,
      relatedSections: ['dashboard-overview'],
      tags: ['billing', 'points', 'usage', 'pricing'],
      lastUpdated: new Date('2024-01-22'),
      popularity: 76
    },
    {
      id: 'troubleshooting-guide',
      title: 'Troubleshooting Guide',
      description: 'Common issues and solutions',
      category: 'troubleshooting',
      difficulty: 'beginner',
      estimatedTime: 10,
      content: `
# Troubleshooting Guide

Common issues and their solutions.

## Connection Issues

### WebSocket Connection Failed
**Symptoms**: Real-time features not updating
**Solutions**:
1. Check internet connection
2. Disable browser extensions
3. Try a different browser
4. Contact support if persistent

### API Rate Limiting
**Symptoms**: "Too many requests" errors
**Solutions**:
1. Wait for rate limit reset
2. Reduce request frequency
3. Upgrade to higher tier if needed

## Feature-Specific Issues

### NLP Analysis Not Working
**Common Causes**:
- Insufficient points balance
- Text too long or too short
- Unsupported language

### Image Analysis Failing
**Common Causes**:
- Unsupported file format
- File too large (>10MB)
- Poor image quality for OCR
      `,
      tags: ['troubleshooting', 'issues', 'solutions', 'support'],
      lastUpdated: new Date('2024-01-25'),
      popularity: 71
    }
  ]);

  // Mock tutorials data
  const [tutorials] = useState<Tutorial[]>([
    {
      id: 'getting-started-tutorial',
      title: 'Getting Started with Advanced Dashboard',
      description: 'A comprehensive walkthrough of the dashboard features',
      category: 'Getting Started',
      difficulty: 'beginner',
      duration: 15,
      steps: [
        {
          id: 'tutorial-step-1',
          title: 'Welcome to the Dashboard',
          content: 'This tutorial will guide you through the main features of the Advanced Dashboard.',
          hints: ['Take your time to explore each section']
        },
        {
          id: 'tutorial-step-2',
          title: 'Navigation Overview',
          content: 'Learn how to navigate between different features using the main menu.',
          action: {
            type: 'click',
            target: '#main-navigation'
          }
        },
        {
          id: 'tutorial-step-3',
          title: 'Quick Actions',
          content: 'Discover the quick action buttons for common tasks.',
          action: {
            type: 'click',
            target: '.quick-actions'
          }
        }
      ],
      learningObjectives: [
        'Understand dashboard layout',
        'Navigate between features',
        'Use quick actions effectively'
      ],
      completionRate: 87
    },
    {
      id: 'nlp-analysis-tutorial',
      title: 'NLP Analysis Walkthrough',
      description: 'Learn how to perform text analysis using NLP tools',
      category: 'Features',
      difficulty: 'intermediate',
      duration: 20,
      steps: [
        {
          id: 'nlp-tutorial-step-1',
          title: 'Access NLP Tools',
          content: 'Navigate to the NLP Analysis section.',
          action: {
            type: 'navigate',
            target: '/admin/nlp-analysis'
          }
        },
        {
          id: 'nlp-tutorial-step-2',
          title: 'Select Analysis Type',
          content: 'Choose sentiment analysis for your first analysis.',
          action: {
            type: 'click',
            target: '#sentiment-analysis-tab'
          }
        }
      ],
      prerequisites: ['getting-started-tutorial'],
      learningObjectives: [
        'Perform sentiment analysis',
        'Interpret analysis results',
        'Export analysis data'
      ],
      completionRate: 73
    }
  ]);

  // Filter documentation sections
  const filteredSections = documentationSections.filter(section => {
    const matchesSearch = searchQuery === '' ||
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || section.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || section.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Handle step completion
  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-success';
      case 'intermediate':
        return 'text-warning';
      case 'advanced':
        return 'text-error';
      default:
        return 'text-tertiary';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'getting-started':
        return <Play className="w-4 h-4" />;
      case 'features':
        return <Zap className="w-4 h-4" />;
      case 'advanced':
        return <Target className="w-4 h-4" />;
      case 'troubleshooting':
        return <Settings className="w-4 h-4" />;
      case 'api':
        return <FileText className="w-4 h-4" />;
      default:
        return <Book className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Documentation & Help</h2>
          <p className="text-secondary mt-1">
            Comprehensive guides, tutorials, and troubleshooting resources
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>

          <Button variant="outline" size="sm">
            <MessageCircle className="w-4 h-4" />
            Contact Support
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-tertiary" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-primary rounded-lg bg-surface-primary text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-primary rounded-lg bg-surface-primary text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Categories</option>
                <option value="getting-started">Getting Started</option>
                <option value="features">Features</option>
                <option value="advanced">Advanced</option>
                <option value="troubleshooting">Troubleshooting</option>
                <option value="api">API</option>
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border border-primary rounded-lg bg-surface-primary text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Documentation</TabsTrigger>
          <TabsTrigger value="tutorials">Interactive Tutorials</TabsTrigger>
          <TabsTrigger value="faq">FAQ & Support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Documentation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSections.map(section => (
              <Card
                key={section.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedSection(section);
                  setIsModalOpen(true);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    {getCategoryIcon(section.category)}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {section.category.replace('-', ' ')}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getDifficultyColor(section.difficulty)}`}
                      >
                        {section.difficulty}
                      </Badge>
                    </div>
                  </div>

                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-secondary mb-4">
                    {section.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-tertiary">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{section.estimatedTime} min</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      <span>{section.popularity}%</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {section.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tutorials" className="space-y-6">
          {showTutorials && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tutorials.map(tutorial => (
                <Card key={tutorial.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{tutorial.category}</Badge>
                      <Badge
                        variant="secondary"
                        className={getDifficultyColor(tutorial.difficulty)}
                      >
                        {tutorial.difficulty}
                      </Badge>
                    </div>

                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-5 h-5" />
                      {tutorial.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-secondary mb-4">
                      {tutorial.description}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-tertiary">Duration: {tutorial.duration} minutes</span>
                        <span className="text-tertiary">Completion: {tutorial.completionRate}%</span>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-primary mb-2">Learning Objectives:</h4>
                        <ul className="text-xs text-secondary space-y-1">
                          {tutorial.learningObjectives.map((objective, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-success" />
                              {objective}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => onStartTutorial?.(tutorial.id)}
                      >
                        <Play className="w-4 h-4" />
                        Start Tutorial
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border border-primary rounded-lg p-4">
                  <h4 className="font-medium text-primary mb-2">
                    How do I get started with the dashboard?
                  </h4>
                  <p className="text-sm text-secondary">
                    Start with the "Getting Started" tutorial to learn the basics, then explore
                    individual features based on your needs.
                  </p>
                </div>

                <div className="border border-primary rounded-lg p-4">
                  <h4 className="font-medium text-primary mb-2">
                    What if a feature isn't working?
                  </h4>
                  <p className="text-sm text-secondary">
                    Check the troubleshooting guide first, then contact support if the issue persists.
                  </p>
                </div>

                <div className="border border-primary rounded-lg p-4">
                  <h4 className="font-medium text-primary mb-2">
                    How does the billing system work?
                  </h4>
                  <p className="text-sm text-secondary">
                    The system uses a point-based model where 1 point equals 1 currency unit.
                    You only pay for what you use.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Documentation Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSection?.title || ''}
        size="xl"
      >
        {selectedSection && (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getCategoryIcon(selectedSection.category)}
                <div>
                  <h3 className="text-lg font-semibold text-primary">
                    {selectedSection.title}
                  </h3>
                  <p className="text-sm text-secondary">
                    {selectedSection.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedSection.category}</Badge>
                <Badge
                  variant="secondary"
                  className={getDifficultyColor(selectedSection.difficulty)}
                >
                  {selectedSection.difficulty}
                </Badge>
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-sm max-w-none">
              <div
                className="text-primary"
                dangerouslySetInnerHTML={{
                  __html: selectedSection.content.replace(/\n/g, '<br>')
                }}
              />
            </div>

            {/* Steps */}
            {selectedSection.steps && selectedSection.steps.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-primary mb-4">Step-by-Step Guide</h4>
                <div className="space-y-4">
                  {selectedSection.steps.map((step, index) => (
                    <div key={step.id} className="border border-primary rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${completedSteps.has(step.id)
                              ? 'bg-success text-white'
                              : 'bg-surface-secondary text-primary'
                            }`}>
                            {completedSteps.has(step.id) ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              index + 1
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <h5 className="font-medium text-primary mb-1">{step.title}</h5>
                          <p className="text-sm text-secondary mb-2">{step.description}</p>

                          {step.action && (
                            <div className="bg-info/10 border border-info rounded p-2 mb-2">
                              <p className="text-sm text-info">
                                <strong>Action:</strong> {step.action}
                              </p>
                            </div>
                          )}

                          {step.code && (
                            <pre className="bg-surface-secondary p-2 rounded text-xs overflow-auto mb-2">
                              {step.code}
                            </pre>
                          )}

                          {step.tips && step.tips.length > 0 && (
                            <div className="bg-success/10 border border-success rounded p-2 mb-2">
                              <p className="text-sm text-success font-medium mb-1">Tips:</p>
                              <ul className="text-xs text-success space-y-1">
                                {step.tips.map((tip, tipIndex) => (
                                  <li key={tipIndex} className="flex items-start gap-1">
                                    <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {step.warnings && step.warnings.length > 0 && (
                            <div className="bg-warning/10 border border-warning rounded p-2 mb-2">
                              <p className="text-sm text-warning font-medium mb-1">Warnings:</p>
                              <ul className="text-xs text-warning space-y-1">
                                {step.warnings.map((warning, warningIndex) => (
                                  <li key={warningIndex} className="flex items-start gap-1">
                                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    {warning}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStepComplete(step.id)}
                            disabled={completedSteps.has(step.id)}
                          >
                            {completedSteps.has(step.id) ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Completed
                              </>
                            ) : (
                              'Mark as Complete'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Sections */}
            {selectedSection.relatedSections && selectedSection.relatedSections.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-primary mb-4">Related Documentation</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSection.relatedSections.map(relatedId => {
                    const relatedSection = documentationSections.find(s => s.id === relatedId);
                    return relatedSection ? (
                      <Button
                        key={relatedId}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSection(relatedSection);
                        }}
                      >
                        {relatedSection.title}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};