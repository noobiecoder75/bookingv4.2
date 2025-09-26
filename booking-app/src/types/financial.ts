export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'partial';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cash' | 'check' | 'paypal' | 'stripe';
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'disputed';
export type ExpenseCategory =
  | 'supplier_payment'
  | 'marketing'
  | 'operational'
  | 'commission'
  | 'office'
  | 'travel'
  | 'technology'
  | 'other';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate?: number;
  taxAmount?: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  processedDate: string;
  notes?: string;
  processingFee?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quoteId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;

  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount?: number;
  total: number;

  payments: Payment[];
  paidAmount: number;
  remainingAmount: number;

  terms?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // PDF generation
  pdfUrl?: string;
  lastSentDate?: string;
}

export interface Commission {
  id: string;
  agentId: string;
  agentName: string;
  bookingId: string;
  quoteId: string;
  customerId: string;
  customerName: string;

  bookingAmount: number;
  commissionRate: number; // percentage
  commissionAmount: number;

  status: CommissionStatus;
  earnedDate: string;
  paidDate?: string;
  paymentMethod?: PaymentMethod;

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionRule {
  id: string;
  agentId?: string; // if null, applies to all agents
  bookingType?: 'flight' | 'hotel' | 'activity' | 'transfer'; // if null, applies to all types
  minBookingAmount?: number;
  maxBookingAmount?: number;
  commissionRate: number; // percentage
  flatFee?: number;
  isActive: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  subcategory?: string;
  amount: number;
  currency: string;

  description: string;
  date: string;
  vendor?: string;
  supplierId?: string;

  receiptUrl?: string;
  approvedBy?: string;
  approvedDate?: string;

  isRecurring?: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'yearly';

  bookingId?: string; // if expense is related to a specific booking
  agentId?: string; // if expense is agent-specific

  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    totalRevenue: number;
    totalBookings: number;
    averageBookingValue: number;
    conversionRate: number;
  };
  invoices: {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    overdueAmount: number;
    overdueCount: number;
  };
  commissions: {
    totalCommissionsEarned: number;
    totalCommissionsPaid: number;
    totalCommissionsPending: number;
  };
  expenses: {
    totalExpenses: number;
    expensesByCategory: Record<ExpenseCategory, number>;
  };
  profitLoss: {
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
  };
  cashFlow: {
    cashInflow: number;
    cashOutflow: number;
    netCashFlow: number;
  };
}

export interface CustomerFinancialProfile {
  customerId: string;
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  totalInvoiced: number;
  totalPaid: number;
  outstandingAmount: number;
  paymentHistory: Payment[];
  lastPaymentDate?: string;
  creditLimit?: number;
  paymentTerms: number; // days
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RevenueAnalytics {
  period: string;
  revenue: number;
  bookings: number;
  averageValue: number;
  growthRate?: number;
}

export interface CommissionAnalytics {
  agentId: string;
  agentName: string;
  totalCommissions: number;
  totalBookings: number;
  averageCommission: number;
  commissionRate: number;
  period: string;
}