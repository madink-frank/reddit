import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Skeleton } from '../ui/Skeleton';
import { Progress } from '../ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  Calendar, 
  Zap,
  RefreshCw
} from 'lucide-react';
import { useUsageAnalytics } from '../../hooks/useBilling';
import { billingService } from '../../services/billingService';
import { cn } from '../../lib/utils';
import { format, parseISO } from 'date-fns';

interface UsageAnalyticsProps {
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function UsageAnalytics({ className }: UsageAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  
  const {
    data: analytics,
    isLoading,
    error,
    refetch
  } = useUsageAnalytics(parseInt(selectedPeriod));

  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardHeader>
          <CardTitle className="text-destructive">Usage Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Failed to load usage analytics
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Usage Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  // Prepare data for charts
  const operationBreakdownData = Object.entries(analytics.operation_breakdown).map(([key, value]) => ({
    name: billingService.getOperationTypeDisplay(key),
    operations: value.operations,
    points: value.points,
    key
  })).filter(item => item.operations > 0);

  const dailyUsageData = analytics.daily_usage.map(day => ({
    date: format(parseISO(day.date), 'MMM d'),
    operations: day.operations,
    points: day.points
  }));

  const totalOperations = analytics.total_operations;
  const totalPoints = analytics.total_points_used;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Usage Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Zap className="h-3 w-3" />
                Total Operations
              </div>
              <div className="text-2xl font-bold">{totalOperations.toLocaleString()}</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Points Used
              </div>
              <div className="text-2xl font-bold">{billingService.formatPoints(totalPoints)}</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Daily Avg Ops
              </div>
              <div className="text-2xl font-bold">
                {analytics.avg_daily_operations.toFixed(1)}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Activity className="h-3 w-3" />
                Daily Avg Points
              </div>
              <div className="text-2xl font-bold">
                {billingService.formatPoints(analytics.avg_daily_points)}
              </div>
            </div>
          </div>

          {/* Operation Breakdown */}
          {operationBreakdownData.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Operation Breakdown</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Operations Chart */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Operations by Type</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={operationBreakdownData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="operations"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {operationBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Points Chart */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Points by Type</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={operationBreakdownData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'points' ? billingService.formatPoints(value as number) : value,
                          name === 'points' ? 'Points' : 'Operations'
                        ]}
                      />
                      <Bar dataKey="points" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Detailed Breakdown</h4>
                {operationBreakdownData.map((item, index) => {
                  const operationPercentage = (item.operations / totalOperations) * 100;
                  const pointsPercentage = (item.points / totalPoints) * 100;
                  
                  return (
                    <div key={item.key} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground">
                          {item.operations} ops • {billingService.formatPoints(item.points)} pts
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Operations</span>
                            <span>{operationPercentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={operationPercentage} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Points</span>
                            <span>{pointsPercentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={pointsPercentage} className="h-2" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily Usage Trend */}
          {dailyUsageData.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Daily Usage Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'points' ? billingService.formatPoints(value as number) : value,
                      name === 'points' ? 'Points' : 'Operations'
                    ]}
                  />
                  <Bar yAxisId="left" dataKey="operations" fill="#8884d8" name="operations" />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="points" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="points"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {totalOperations === 0 && (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No usage data for the selected period</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}