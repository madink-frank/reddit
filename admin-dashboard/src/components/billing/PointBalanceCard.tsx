import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  RefreshCw,
  Plus,
  Settings
} from 'lucide-react';
import { useBilling } from '../../hooks/useBilling';
import { cn } from '../../lib/utils';

interface PointBalanceCardProps {
  onAddPoints?: () => void;
  onManageLimits?: () => void;
  className?: string;
}

export function PointBalanceCard({ 
  onAddPoints, 
  onManageLimits, 
  className 
}: PointBalanceCardProps) {
  const {
    balance,
    isLoadingBalance,
    formatPoints,
    formatCurrency,
    isBalanceLow,
    getBalanceStatus,
    refetchBalance
  } = useBilling();

  if (isLoadingBalance) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Point Balance</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardContent>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Point Balance</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load balance</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchBalance()}
            className="mt-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const balanceStatus = getBalanceStatus();
  const isLow = isBalanceLow();

  const getBalanceColor = () => {
    switch (balanceStatus) {
      case 'low': return 'text-destructive';
      case 'normal': return 'text-yellow-600';
      case 'good': return 'text-green-600';
      default: return 'text-foreground';
    }
  };

  const getBalanceBadgeVariant = () => {
    switch (balanceStatus) {
      case 'low': return 'destructive';
      case 'normal': return 'secondary';
      case 'good': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      isLow && "border-destructive/50 bg-destructive/5",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Point Balance
          {isLow && (
            <Tooltip content={`Balance is below threshold (${formatPoints(balance.low_balance_threshold)} points)`}>
              <AlertTriangle className="h-3 w-3 text-destructive" />
            </Tooltip>
          )}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Badge variant={getBalanceBadgeVariant()}>
            {balanceStatus}
          </Badge>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Current Balance */}
          <div>
            <div className={cn("text-2xl font-bold", getBalanceColor())}>
              {formatPoints(balance.current_points)} pts
            </div>
            <p className="text-xs text-muted-foreground">
              Available balance
            </p>
          </div>

          {/* Balance Statistics */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Total Purchased
              </div>
              <div className="font-medium">
                {formatPoints(balance.total_purchased)} pts
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingDown className="h-3 w-3" />
                Total Spent
              </div>
              <div className="font-medium">
                {formatPoints(balance.total_spent)} pts
              </div>
            </div>
          </div>

          {/* Spending Limits */}
          {(balance.daily_limit || balance.monthly_limit) && (
            <div className="pt-2 border-t space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Spending Limits</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {balance.daily_limit && (
                  <div>
                    <span className="text-muted-foreground">Daily:</span>
                    <span className="ml-1 font-medium">
                      {formatPoints(balance.daily_limit)} pts
                    </span>
                  </div>
                )}
                {balance.monthly_limit && (
                  <div>
                    <span className="text-muted-foreground">Monthly:</span>
                    <span className="ml-1 font-medium">
                      {formatPoints(balance.monthly_limit)} pts
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {onAddPoints && (
              <Button 
                size="sm" 
                onClick={onAddPoints}
                className="flex-1"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Points
              </Button>
            )}
            
            {onManageLimits && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onManageLimits}
                className="flex-1"
              >
                <Settings className="h-3 w-3 mr-1" />
                Limits
              </Button>
            )}
            
            <Tooltip content="Refresh balance">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => refetchBalance()}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}