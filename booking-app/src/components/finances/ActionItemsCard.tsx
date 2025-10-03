'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, DollarSign, FileText } from 'lucide-react';
import Link from 'next/link';

interface ActionItemsCardProps {
  invoices: any[];
  expenses: any[];
  commissions: any[];
}

export function ActionItemsCard({ invoices, expenses, commissions }: ActionItemsCardProps) {
  const actionItems = useMemo(() => {
    const now = new Date();

    // Count overdue invoices
    const overdueInvoices = invoices.filter((inv) => {
      const dueDate = new Date(inv.dueDate);
      return dueDate < now && inv.status !== 'paid' && inv.status !== 'cancelled';
    });

    // Count pending expenses (not approved)
    const pendingExpenses = expenses.filter((exp) => !exp.approvedBy);

    // Count unpaid commissions
    const unpaidCommissions = commissions.filter(
      (comm) => comm.status === 'pending' || comm.status === 'approved'
    );

    // Calculate total unpaid commission amount
    const unpaidCommissionAmount = unpaidCommissions.reduce(
      (sum, comm) => sum + comm.commissionAmount,
      0
    );

    return {
      overdueCount: overdueInvoices.length,
      overdueAmount: overdueInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0),
      pendingExpensesCount: pendingExpenses.length,
      unpaidCommissionsCount: unpaidCommissions.length,
      unpaidCommissionAmount,
    };
  }, [invoices, expenses, commissions]);

  const hasActionItems =
    actionItems.overdueCount > 0 ||
    actionItems.pendingExpensesCount > 0 ||
    actionItems.unpaidCommissionsCount > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Action Items</CardTitle>
        <CardDescription>Items requiring your attention</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasActionItems ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-3">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground">No pending action items</p>
          </div>
        ) : (
          <div className="space-y-4">
            {actionItems.overdueCount > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50">
                <div className="p-2 rounded-lg bg-red-100">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-red-900">
                    {actionItems.overdueCount} Overdue Invoice{actionItems.overdueCount !== 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-red-700">
                    Total: ${actionItems.overdueAmount.toFixed(2)} outstanding
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-red-300 hover:bg-red-100" asChild>
                  <Link href="/admin/finances?tab=invoices">View</Link>
                </Button>
              </div>
            )}

            {actionItems.pendingExpensesCount > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg border border-yellow-200 bg-yellow-50">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-yellow-900">
                    {actionItems.pendingExpensesCount} Pending Approval{actionItems.pendingExpensesCount !== 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-yellow-700">
                    Expense{actionItems.pendingExpensesCount !== 1 ? 's' : ''} awaiting review
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-yellow-300 hover:bg-yellow-100" asChild>
                  <Link href="/admin/finances?tab=expenses">Review</Link>
                </Button>
              </div>
            )}

            {actionItems.unpaidCommissionsCount > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg border border-purple-200 bg-purple-50">
                <div className="p-2 rounded-lg bg-purple-100">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-purple-900">
                    ${actionItems.unpaidCommissionAmount.toFixed(2)} in Unpaid Commissions
                  </div>
                  <div className="text-sm text-purple-700">
                    {actionItems.unpaidCommissionsCount} commission{actionItems.unpaidCommissionsCount !== 1 ? 's' : ''} pending payment
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-purple-300 hover:bg-purple-100" asChild>
                  <Link href="/admin/finances?tab=commissions">Process</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
