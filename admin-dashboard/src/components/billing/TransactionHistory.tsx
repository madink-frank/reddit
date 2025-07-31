import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Skeleton } from '../ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useTransactionHistory } from '../../hooks/useBilling';
import { billingService, PointTransaction } from '../../services/billingService';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

interface TransactionHistoryProps {
  className?: string;
  limit?: number;
}

export function TransactionHistory({ className, limit = 20 }: TransactionHistoryProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [transactionType, setTransactionType] = useState<string>('');

  const offset = currentPage * limit;

  const {
    data: history,
    isLoading,
    error,
    refetch
  } = useTransactionHistory(limit, offset, transactionType || undefined);

  const getTransactionIcon = (transaction: PointTransaction) => {
    switch (transaction.transaction_type) {
      case 'purchase':
      case 'bonus':
      case 'refund':
        return <ArrowUpCircle className="h-4 w-4 text-green-600" />;
      case 'deduction':
        return <ArrowDownCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-600" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-3 w-3 text-red-600" />;
      default:
        return <Clock className="h-3 w-3 text-gray-600" />;
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const formatted = billingService.formatPoints(Math.abs(amount));
    const sign = amount >= 0 ? '+' : '-';
    const color = amount >= 0 ? 'text-green-600' : 'text-red-600';

    return (
      <span className={cn("font-medium", color)}>
        {sign}{formatted} pts
      </span>
    );
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (direction === 'next' && history && history.transactions.length === limit) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardHeader>
          <CardTitle className="text-destructive">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Failed to load transaction history
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
                <SelectItem value="deduction">Usage</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="bonus">Bonus</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : !history || history.transactions.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No transactions found</p>
            {transactionType && (
              <Button
                variant="ghost"
                onClick={() => setTransactionType('')}
                className="mt-2"
              >
                Show all transactions
              </Button>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction)}
                        <span className="text-sm">
                          {billingService.getTransactionTypeDisplay(transaction.transaction_type)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {transaction.description || 'No description'}
                        </p>
                        {transaction.operation_type && (
                          <p className="text-xs text-muted-foreground">
                            {billingService.getOperationTypeDisplay(transaction.operation_type)}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {formatAmount(transaction.amount, transaction.transaction_type)}
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {billingService.formatPoints(transaction.balance_after)} pts
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(transaction.status)}
                        <Badge
                          variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(transaction.created_at), 'MMM d, HH:mm')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {offset + 1} to {offset + history.transactions.length} of transactions
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange('prev')}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange('next')}
                  disabled={!history || history.transactions.length < limit}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}