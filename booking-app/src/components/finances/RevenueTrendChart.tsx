'use client';

import { useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RevenueTrendChartProps {
  invoices: any[];
  expenses: any[];
}

export function RevenueTrendChart({ invoices, expenses }: RevenueTrendChartProps) {
  const chartData = useMemo(() => {
    // Get last 6 months
    const months: string[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7)); // YYYY-MM format
    }

    return months.map((month) => {
      const monthStart = `${month}-01`;
      const monthEnd = new Date(
        parseInt(month.split('-')[0]),
        parseInt(month.split('-')[1]),
        0
      ).toISOString().split('T')[0];

      // Calculate revenue (paid invoices)
      const monthRevenue = invoices
        .filter(inv =>
          inv.status === 'paid' &&
          inv.createdAt >= monthStart &&
          inv.createdAt <= monthEnd
        )
        .reduce((sum, inv) => sum + inv.total, 0);

      // Calculate expenses
      const monthExpenses = expenses
        .filter(exp => exp.date >= monthStart && exp.date <= monthEnd)
        .reduce((sum, exp) => sum + exp.amount, 0);

      const monthName = new Date(monthStart).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      });

      return {
        month: monthName,
        revenue: Math.round(monthRevenue * 100) / 100,
        expenses: Math.round(monthExpenses * 100) / 100,
        profit: Math.round((monthRevenue - monthExpenses) * 100) / 100,
      };
    });
  }, [invoices, expenses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue vs Expenses Trend</CardTitle>
        <CardDescription>Last 6 months performance</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
              name="Revenue"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stackId="2"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.6}
              name="Expenses"
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              name="Profit"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
