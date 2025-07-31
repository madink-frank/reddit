/**
 * Actionable Insights Component
 * 
 * AI-generated insights and recommendations with action items
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Lightbulb,
  Target,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  DollarSign,
  ArrowRight,
  Clock,
  Star
} from 'lucide-react';

interface ActionableInsightsProps {
  insights: any[];
  marketInsights: any;
  reputationData: any;
  isLoading: boolean;
}

export const ActionableInsights: React.FC<ActionableInsightsProps> = ({
  insights,
  marketInsights,
  reputationData,
  isLoading
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Generate additional insights based on data
  const generateAdditionalInsights = () => {
    const additionalInsights = [];

    // Market opportunity insights
    if (marketInsights?.top_trending?.length > 0) {
      additionalInsights.push({
        type: 'opportunity',
        priority: 'high',
        title: 'Capitalize on Trending Topics',
        description: `${marketInsights.top_trending.length} high-potential topics identified`,
        action: 'Create content strategy around trending keywords',
        impact: 'Potential 25-40% increase in engagement',
        timeframe: '1-2 weeks',
        effort: 'Medium',
        category: 'Growth'
      });
    }

    // Brand reputation insights
    if (reputationData?.overview?.reputation_score?.score < 70) {
      additionalInsights.push({
        type: 'warning',
        priority: 'high',
        title: 'Brand Reputation Enhancement Needed',
        description: 'Brand score below optimal threshold',
        action: 'Implement reputation management campaign',
        impact: 'Improved customer trust and loyalty',
        timeframe: '2-4 weeks',
        effort: 'High',
        category: 'Brand Protection'
      });
    }

    // Engagement optimization
    additionalInsights.push({
      type: 'optimization',
      priority: 'medium',
      title: 'Optimize Content Timing',
      description: 'Analysis shows peak engagement windows',
      action: 'Adjust posting schedule to match audience activity',
      impact: '15-25% engagement improvement',
      timeframe: '1 week',
      effort: 'Low',
      category: 'Optimization'
    });

    // Competitive analysis
    additionalInsights.push({
      type: 'competitive',
      priority: 'medium',
      title: 'Competitive Gap Analysis',
      description: 'Opportunities to differentiate from competitors',
      action: 'Develop unique value propositions',
      impact: 'Market share growth potential',
      timeframe: '3-6 weeks',
      effort: 'High',
      category: 'Strategy'
    });

    return additionalInsights;
  };

  const allInsights = [...insights, ...generateAdditionalInsights()];

  const filteredInsights = selectedCategory === 'all'
    ? allInsights
    : allInsights.filter(insight => insight.priority === selectedCategory);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Target className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'optimization':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'competitive':
        return <Users className="w-5 h-5 text-purple-500" />;
      default:
        return <Lightbulb className="w-5 h-5 text-gray-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'border-green-500 bg-green-500/10';
      case 'warning':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'optimization':
        return 'border-blue-500 bg-blue-500/10';
      case 'competitive':
        return 'border-purple-500 bg-purple-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 text-red-400';
      case 'medium':
        return 'border-yellow-500 text-yellow-400';
      case 'low':
        return 'border-green-500 text-green-400';
      default:
        return 'border-gray-500 text-gray-400';
    }
  };

  const getEffortBadge = (effort: string) => {
    switch (effort) {
      case 'Low':
        return 'bg-green-600';
      case 'Medium':
        return 'bg-yellow-600';
      case 'High':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Insights Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{allInsights.length}</div>
            <div className="text-sm text-gray-400">Total Insights</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">
              {allInsights.filter(i => i.priority === 'high').length}
            </div>
            <div className="text-sm text-gray-400">High Priority</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {allInsights.filter(i => i.type === 'opportunity').length}
            </div>
            <div className="text-sm text-gray-400">Opportunities</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {allInsights.filter(i => i.effort === 'Low').length}
            </div>
            <div className="text-sm text-gray-400">Quick Wins</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Filter Insights</h3>
              <p className="text-sm text-gray-400">View insights by priority level</p>
            </div>
            <div className="flex space-x-2">
              {(['all', 'high', 'medium', 'low'] as const).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? 'bg-blue-600' : ''}
                >
                  {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.length > 0 ? (
          filteredInsights.map((insight, index) => (
            <Card key={index} className={`bg-gray-800 border ${getInsightColor(insight.type)}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-white font-medium">{insight.title}</h4>
                        <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                          {insight.priority.toUpperCase()}
                        </Badge>
                        {insight.category && (
                          <Badge variant="secondary" className="bg-gray-600">
                            {insight.category}
                          </Badge>
                        )}
                      </div>

                      <p className="text-gray-300 text-sm mb-3">{insight.description}</p>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <ArrowRight className="w-4 h-4 text-blue-400 mr-2" />
                          <span className="text-gray-300">
                            <strong>Action:</strong> {insight.action}
                          </span>
                        </div>

                        <div className="flex items-center text-sm">
                          <Star className="w-4 h-4 text-yellow-400 mr-2" />
                          <span className="text-gray-300">
                            <strong>Impact:</strong> {insight.impact}
                          </span>
                        </div>

                        {insight.timeframe && (
                          <div className="flex items-center text-sm">
                            <Clock className="w-4 h-4 text-purple-400 mr-2" />
                            <span className="text-gray-300">
                              <strong>Timeframe:</strong> {insight.timeframe}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    {insight.effort && (
                      <Badge className={getEffortBadge(insight.effort)}>
                        {insight.effort} Effort
                      </Badge>
                    )}
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Take Action
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-500 opacity-50" />
              <h3 className="text-white font-medium mb-2">No Insights Available</h3>
              <p className="text-gray-400 text-sm">
                {selectedCategory === 'all'
                  ? 'No insights generated yet. Check back as data is collected.'
                  : `No ${selectedCategory} priority insights available.`
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Plan Generator */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Generate Action Plan</CardTitle>
          <CardDescription>
            Create a prioritized action plan based on insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-700 rounded-lg">
                <h4 className="text-white font-medium mb-2">Immediate Actions (1-2 weeks)</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  {allInsights
                    .filter(i => i.priority === 'high' && i.effort === 'Low')
                    .slice(0, 3)
                    .map((insight, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                        {insight.title}
                      </li>
                    ))
                  }
                </ul>
              </div>

              <div className="p-4 bg-gray-700 rounded-lg">
                <h4 className="text-white font-medium mb-2">Short-term Goals (1-4 weeks)</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  {allInsights
                    .filter(i => i.priority === 'high' && i.effort !== 'Low')
                    .slice(0, 3)
                    .map((insight, index) => (
                      <li key={index} className="flex items-center">
                        <Target className="w-3 h-3 text-blue-500 mr-2 flex-shrink-0" />
                        {insight.title}
                      </li>
                    ))
                  }
                </ul>
              </div>

              <div className="p-4 bg-gray-700 rounded-lg">
                <h4 className="text-white font-medium mb-2">Long-term Strategy (1-3 months)</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  {allInsights
                    .filter(i => i.priority === 'medium')
                    .slice(0, 3)
                    .map((insight, index) => (
                      <li key={index} className="flex items-center">
                        <TrendingUp className="w-3 h-3 text-purple-500 mr-2 flex-shrink-0" />
                        {insight.title}
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>

            <div className="flex justify-center">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <DollarSign className="w-4 h-4 mr-2" />
                Generate Detailed Action Plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};