'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvoiceStore } from '@/store/invoice-store';
import { useCommissionStore } from '@/store/commission-store';
import { useExpenseStore } from '@/store/expense-store';
import { useAuthStore } from '@/store/auth-store';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  CreditCard,
  PieChart,
  Calendar,
  Download,
  Filter,
  AlertTriangle
} from 'lucide-react';

export default function FinancesPage() {
  const { user } = useAuthStore();
  const { invoices, getTotalRevenue, getTotalOutstanding, getOverdueAmount, getFinancialSummary } = useInvoiceStore();
  const { getTotalCommissionsEarned, getTotalCommissionsPaid, getTotalCommissionsPending } = useCommissionStore();
  const { getTotalExpenses, getExpensesByCategory } = useExpenseStore();

  const [dateRange, setDateRange] = useState('30'); // days
  const [selectedPeriod, setSelectedPeriod] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const days = parseInt(dateRange);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];
    setSelectedPeriod({ startDate, endDate });
  }, [dateRange]);

  // Financial calculations
  const totalRevenue = getTotalRevenue(selectedPeriod.startDate, selectedPeriod.endDate);
  const totalOutstanding = getTotalOutstanding();
  const overdueAmount = getOverdueAmount();
  const totalExpenses = getTotalExpenses(selectedPeriod.startDate, selectedPeriod.endDate);
  const totalCommissionsEarned = getTotalCommissionsEarned(undefined, selectedPeriod.startDate, selectedPeriod.endDate);
  const totalCommissionsPaid = getTotalCommissionsPaid(undefined, selectedPeriod.startDate, selectedPeriod.endDate);
  const totalCommissionsPending = getTotalCommissionsPending();

  const netProfit = totalRevenue - totalExpenses - totalCommissionsPaid;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  const expensesByCategory = getExpensesByCategory(selectedPeriod.startDate, selectedPeriod.endDate);

  const financialSummary = getFinancialSummary(selectedPeriod.startDate, selectedPeriod.endDate);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!user) {
    return <div>Please log in to view finances.</div>;
  }

  return (
    <MainLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Overview of your business financial performance
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalRevenue)}
                </div>
                <p className="text-xs text-gray-500">
                  +12% from last period
                </p>
              </CardContent>
            </Card>

            {/* Outstanding Amount */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                <Receipt className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(totalOutstanding)}
                </div>
                <p className="text-xs text-gray-500">
                  {overdueAmount > 0 && (
                    <span className="text-red-600 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {formatCurrency(overdueAmount)} overdue
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            {/* Total Expenses */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <CreditCard className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalExpenses)}
                </div>
                <p className="text-xs text-gray-500">
                  +5% from last period
                </p>
              </CardContent>
            </Card>

            {/* Net Profit */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netProfit)}
                </div>
                <p className="text-xs text-gray-500">
                  {profitMargin}% margin
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Commission & Expense Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Commission Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Commission Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Earned</span>
                    <span className="font-semibold">{formatCurrency(totalCommissionsEarned)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Paid</span>
                    <span className="font-semibold text-green-600">{formatCurrency(totalCommissionsPaid)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="font-semibold text-orange-600">{formatCurrency(totalCommissionsPending)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Expense Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(expensesByCategory).map(([category, amount]) => {
                    if (amount === 0) return null;
                    const percentage = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : '0';
                    return (
                      <div key={category} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 capitalize">
                            {category.replace('_', ' ')}
                          </span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {percentage}%
                          </Badge>
                        </div>
                        <span className="font-semibold">{formatCurrency(amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity / Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Receipt className="w-4 h-4 mr-2" />
                    Create Invoice
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Record Expense
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pay Commissions
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow Overview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Cash Flow Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(totalRevenue)}
                    </div>
                    <div className="text-sm text-gray-600">Cash Inflow</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(totalExpenses + totalCommissionsPaid)}
                    </div>
                    <div className="text-sm text-gray-600">Cash Outflow</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(netProfit)}
                    </div>
                    <div className="text-sm text-gray-600">Net Cash Flow</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </MainLayout>
  );
}