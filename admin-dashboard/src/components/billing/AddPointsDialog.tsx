import React, { useState } from 'react';
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
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, CreditCard, Plus, Info } from 'lucide-react';
import { useBilling } from '../../hooks/useBilling';
import { AddPointsRequest } from '../../services/billingService';

interface AddPointsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

export function AddPointsDialog({ open, onOpenChange }: AddPointsDialogProps) {
  const { balance, addPoints, isAddingPoints, formatPoints, formatCurrency } = useBilling();

  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const pointAmount = parseFloat(amount);
    if (isNaN(pointAmount) || pointAmount <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    } else if (pointAmount > 10000) {
      newErrors.amount = 'Amount cannot exceed 10,000 points';
    }

    if (description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
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
      const request: AddPointsRequest = {
        amount: parseFloat(amount),
        description: description.trim() || undefined,
      };

      await addPoints(request);

      // Reset form
      setAmount('');
      setDescription('');
      setErrors({});

      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handlePresetAmount = (presetAmount: number) => {
    setAmount(presetAmount.toString());
  };

  const handleReset = () => {
    setAmount('');
    setDescription('');
    setErrors({});
  };

  const pointAmount = parseFloat(amount) || 0;
  const estimatedCost = pointAmount; // 1 point = 1 unit of currency

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Points
          </DialogTitle>
          <DialogDescription>
            Purchase points to use for data collection, analysis, and other operations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Balance */}
          {balance && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Current balance: {formatPoints(balance.current_points)} points
              </AlertDescription>
            </Alert>
          )}

          {/* Preset Amounts */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Select</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((presetAmount) => (
                <Button
                  key={presetAmount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetAmount(presetAmount)}
                  className="h-8"
                >
                  {presetAmount} pts
                </Button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className={errors.amount ? 'border-destructive' : ''}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                points
              </span>
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a note about this purchase..."
              className={errors.description ? 'border-destructive' : ''}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>

          {/* Cost Summary */}
          {pointAmount > 0 && (
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Purchase Summary
              </h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Points to add:</span>
                  <span className="font-medium">{formatPoints(pointAmount)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Cost per point:</span>
                  <span className="font-medium">{formatCurrency(1)}</span>
                </div>

                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Total cost:</span>
                  <span>{formatCurrency(estimatedCost)}</span>
                </div>
              </div>

              {balance && (
                <div className="pt-2 border-t text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Balance after purchase:</span>
                    <span className="font-medium text-foreground">
                      {formatPoints(balance.current_points + pointAmount)} points
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Method Info */}
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              This is a demo environment. No actual payment will be processed.
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isAddingPoints || pointAmount <= 0}
              className="min-w-24"
            >
              {isAddingPoints ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Points
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}