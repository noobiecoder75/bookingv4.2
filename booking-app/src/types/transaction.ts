/**
 * Financial Transaction Audit Trail
 * Tracks all money movements and state changes in the system
 */

export type TransactionType =
  | 'payment_received'
  | 'invoice_created'
  | 'invoice_updated'
  | 'invoice_paid'
  | 'commission_created'
  | 'commission_paid'
  | 'expense_recorded'
  | 'refund_issued'
  | 'fund_allocated'
  | 'supplier_payment';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;

  // Monetary details
  amount: number;
  currency: string;

  // Related entities
  quoteId?: string;
  invoiceId?: string;
  paymentId?: string;
  commissionId?: string;
  expenseId?: string;
  agentId?: string;
  customerId?: string;

  // Transaction metadata
  description: string;
  timestamp: string;
  performedBy?: string; // User/agent who triggered this

  // Audit trail
  metadata?: Record<string, any>;
  relatedTransactions?: string[]; // IDs of related transactions

  // State tracking
  previousState?: any;
  newState?: any;

  notes?: string;
}

export interface TransactionSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  totalTransactions: number;
  transactionsByType: Record<TransactionType, number>;
  totalMoneyIn: number;
  totalMoneyOut: number;
  netCashFlow: number;
}
