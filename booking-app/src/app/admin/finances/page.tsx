'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FinancialOverview } from '@/components/finances/FinancialOverview';
import { InvoiceList } from '@/components/finances/InvoiceList';
import { ExpenseList } from '@/components/finances/ExpenseList';
import { CommissionDashboard } from '@/components/finances/CommissionDashboard';
import { SupplierPaymentsDue } from '@/components/finances/SupplierPaymentsDue';

export default function FinancesPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
          <p className="text-muted-foreground">
            Manage invoices, expenses, commissions, and financial reporting
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <FinancialOverview />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>
                View and manage all invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          {/* Supplier Payments Due Widget */}
          <SupplierPaymentsDue />

          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>
                Track and manage business expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commissions</CardTitle>
              <CardDescription>
                Monitor agent commissions and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommissionDashboard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
