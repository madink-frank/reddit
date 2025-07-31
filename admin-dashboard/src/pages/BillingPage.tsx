import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  CreditCard,
  History,
  BarChart3,
  Settings,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  PointBalanceCard,
  TransactionHistory,
  UsageAnalytics,
  SpendingLimitsDialog,
  AddPointsDialog
} from '../components/billing';
import { useBilling } from '../hooks/useBilling';

export function BillingPage() {
  const [showAddPoints, setShowAddPoints] = useState(false);
  const [showSpendingLimits, setShowSpendingLimits] = useState(false);
  const { isBalanceLow, operationCosts } = useBilling();

  const isLowBalance = isBalanceLow();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Usage</h1>
          <p className="text-muted-foreground">
            Manage your points, view usage analytics, and configure spending limits
          </p>
        </div>
      </div>

      {/* Low Balance Alert */}
      {isLowBalance && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your point balance is running low. Consider adding more points to continue using the platform.
            <Button
              variant="ghost"
              className="p-0 h-auto ml-2 text-destructive underline hover:no-underline"
              onClick={() => setShowAddPoints(true)}
            >
              Add Points
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <PointBalanceCard
          onAddPoints={() => setShowAddPoints(true)}
          onManageLimits={() => setShowSpendingLimits(true)}
        />

        {/* Operation Costs Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operation Costs</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {operationCosts ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {Object.keys(operationCosts.operation_costs).length} operations
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Available operation types
                </p>

                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {Object.entries(operationCosts.operation_costs)
                    .slice(0, 5)
                    .map(([operation, cost]) => (
                      <div key={operation} className="flex justify-between text-xs">
                        <span className="truncate">
                          {operation.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium ml-2">
                          {cost} pts
                        </span>
                      </div>
                    ))}
                  {Object.keys(operationCosts.operation_costs).length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{Object.keys(operationCosts.operation_costs).length - 5} more
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={() => setShowAddPoints(true)}
                className="w-full justify-start"
                variant="outline"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Add Points
              </Button>

              <Button
                onClick={() => setShowSpendingLimits(true)}
                className="w-full justify-start"
                variant="outline"
              >
                <Settings className="h-4 w-4 mr-2" />
                Spending Limits
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Transaction History
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          <TransactionHistory />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <UsageAnalytics />
        </TabsContent>
      </Tabs>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How Points Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <h4 className="font-medium">Point System</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 1 point = $1 USD</li>
                <li>• Points are deducted when you use platform features</li>
                <li>• Different operations have different point costs</li>
                <li>• You can set spending limits to control usage</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Common Operations</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Post crawling: 0.10 points</li>
                <li>• Sentiment analysis: 0.20 points</li>
                <li>• Image OCR: 0.40 points</li>
                <li>• Data export: 0.05-0.15 points</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddPointsDialog
        open={showAddPoints}
        onOpenChange={setShowAddPoints}
      />

      <SpendingLimitsDialog
        open={showSpendingLimits}
        onOpenChange={setShowSpendingLimits}
      />
    </div>
  );
}