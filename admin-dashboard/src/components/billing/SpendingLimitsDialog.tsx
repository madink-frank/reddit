import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Shield, AlertTriangle, Info } from 'lucide-react';
import { useBilling } from '../../hooks/useBilling';
import { SpendingLimitsRequest } from '../../services/billingService';

interface SpendingLimitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpendingLimitsDialog({ open, onOpenChange }: SpendingLimitsDialogProps) {
  const { balance, updateSpendingLimits, isUpdatingLimits, formatPoints } = useBilling();

  const [dailyLimit, setDailyLimit] = useState<string>('');
  const [monthlyLimit, setMonthlyLimit] = useState<string>('');
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState<string>('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [enableDailyLimit, setEnableDailyLimit] = useState(false);
  const [enableMonthlyLimit, setEnableMonthlyLimit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with current values
  useEffect(() => {
    if (balance && open) {
      setDailyLimit(balance.daily_limit?.toString() || '');
      setMonthlyLimit(balance.monthly_limit?.toString() || '');
      setLowBalanceThreshold(balance.low_balance_threshold.toString());
      setNotificationsEnabled(balance.notifications_enabled);
      setEnableDailyLimit(!!balance.daily_limit);
      setEnableMonthlyLimit(!!balance.monthly_limit);
      setErrors({});
    }
  }, [balance, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (enableDailyLimit) {
      const daily = parseFloat(dailyLimit);
      if (isNaN(daily) || daily <= 0) {
        newErrors.dailyLimit = 'Daily limit must be a positive number';
      }
    }

    if (enableMonthlyLimit) {
      const monthly = parseFloat(monthlyLimit);
      if (isNaN(monthly) || monthly <= 0) {
        newErrors.monthlyLimit = 'Monthly limit must be a positive number';
      }
    }

    if (enableDailyLimit && enableMonthlyLimit) {
      const daily = parseFloat(dailyLimit);
      const monthly = parseFloat(monthlyLimit);
      if (!isNaN(daily) && !isNaN(monthly) && daily > monthly) {
        newErrors.dailyLimit = 'Daily limit cannot exceed monthly limit';
      }
    }

    const threshold = parseFloat(lowBalanceThreshold);
    if (isNaN(threshold) || threshold < 0) {
      newErrors.lowBalanceThreshold = 'Low balance threshold must be a non-negative number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const request: SpendingLimitsRequest = {
        daily_limit: enableDailyLimit ? parseFloat(dailyLimit) : undefined,
        monthly_limit: enableMonthlyLimit ? parseFloat(monthlyLimit) : undefined,
      };

      await updateSpendingLimits(request);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleReset = () => {
    if (balance) {
      setDailyLimit(balance.daily_limit?.toString() || '');
      setMonthlyLimit(balance.monthly_limit?.toString() || '');
      setLowBalanceThreshold(balance.low_balance_threshold.toString());
      setNotificationsEnabled(balance.notifications_enabled);
      setEnableDailyLimit(!!balance.daily_limit);
      setEnableMonthlyLimit(!!balance.monthly_limit);
      setErrors({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Spending Limits
          </DialogTitle>
          <DialogDescription>
            Configure spending limits to control your point usage and prevent unexpected charges.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Daily Limit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="daily-limit" className="text-sm font-medium">
                Daily Spending Limit
              </Label>
              <Switch
                checked={enableDailyLimit}
                onCheckedChange={setEnableDailyLimit}
              />
            </div>

            {enableDailyLimit && (
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="daily-limit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                    placeholder="Enter daily limit"
                    className={errors.dailyLimit ? 'border-destructive' : ''}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    points
                  </span>
                </div>
                {errors.dailyLimit && (
                  <p className="text-sm text-destructive">{errors.dailyLimit}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Maximum points you can spend per day
                </p>
              </div>
            )}
          </div>

          {/* Monthly Limit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="monthly-limit" className="text-sm font-medium">
                Monthly Spending Limit
              </Label>
              <Switch
                checked={enableMonthlyLimit}
                onCheckedChange={setEnableMonthlyLimit}
              />
            </div>

            {enableMonthlyLimit && (
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="monthly-limit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(e.target.value)}
                    placeholder="Enter monthly limit"
                    className={errors.monthlyLimit ? 'border-destructive' : ''}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    points
                  </span>
                </div>
                {errors.monthlyLimit && (
                  <p className="text-sm text-destructive">{errors.monthlyLimit}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Maximum points you can spend per month
                </p>
              </div>
            )}
          </div>

          {/* Low Balance Threshold */}
          <div className="space-y-3">
            <Label htmlFor="threshold" className="text-sm font-medium">
              Low Balance Threshold
            </Label>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="threshold"
                  type="number"
                  step="0.01"
                  min="0"
                  value={lowBalanceThreshold}
                  onChange={(e) => setLowBalanceThreshold(e.target.value)}
                  placeholder="Enter threshold"
                  className={errors.lowBalanceThreshold ? 'border-destructive' : ''}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  points
                </span>
              </div>
              {errors.lowBalanceThreshold && (
                <p className="text-sm text-destructive">{errors.lowBalanceThreshold}</p>
              )}
              <p className="text-xs text-muted-foreground">
                You'll be warned when your balance falls below this amount
              </p>
            </div>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">
                Enable Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive alerts for low balance and limit warnings
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>

          {/* Current Balance Info */}
          {balance && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Current balance: {formatPoints(balance.current_points)} points
              </AlertDescription>
            </Alert>
          )}

          {/* Warning for limits */}
          {(enableDailyLimit || enableMonthlyLimit) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Operations will be blocked if they would exceed your spending limits.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isUpdatingLimits}
              className="min-w-20"
            >
              {isUpdatingLimits ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}