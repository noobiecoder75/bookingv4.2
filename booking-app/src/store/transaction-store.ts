import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  FinancialTransaction,
  TransactionType,
  TransactionStatus,
  TransactionSummary,
} from '@/types/transaction';

interface TransactionStore {
  transactions: FinancialTransaction[];

  // Create transaction
  createTransaction: (
    transactionData: Omit<FinancialTransaction, 'id' | 'timestamp'>
  ) => string;

  // Get transactions
  getTransactionById: (id: string) => FinancialTransaction | undefined;
  getTransactionsByType: (type: TransactionType) => FinancialTransaction[];
  getTransactionsByQuote: (quoteId: string) => FinancialTransaction[];
  getTransactionsByInvoice: (invoiceId: string) => FinancialTransaction[];
  getTransactionsByPayment: (paymentId: string) => FinancialTransaction[];
  getTransactionsByCommission: (commissionId: string) => FinancialTransaction[];
  getTransactionsByDateRange: (
    startDate: string,
    endDate: string
  ) => FinancialTransaction[];

  // Audit trail helpers
  getRelatedTransactions: (transactionId: string) => FinancialTransaction[];
  getTransactionChain: (entityType: 'quote' | 'invoice' | 'payment', entityId: string) => FinancialTransaction[];

  // Analytics
  getTransactionSummary: (startDate: string, endDate: string) => TransactionSummary;
  getCashFlow: (startDate: string, endDate: string) => {
    inflow: number;
    outflow: number;
    net: number;
  };

  // Search
  searchTransactions: (query: string) => FinancialTransaction[];
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set, get) => ({
      transactions: [],

      createTransaction: (transactionData) => {
        const id = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        const transaction: FinancialTransaction = {
          ...transactionData,
          id,
          timestamp,
        };

        set((state) => ({
          transactions: [...state.transactions, transaction],
        }));

        return id;
      },

      getTransactionById: (id) => {
        return get().transactions.find((t) => t.id === id);
      },

      getTransactionsByType: (type) => {
        return get().transactions.filter((t) => t.type === type);
      },

      getTransactionsByQuote: (quoteId) => {
        return get().transactions.filter((t) => t.quoteId === quoteId);
      },

      getTransactionsByInvoice: (invoiceId) => {
        return get().transactions.filter((t) => t.invoiceId === invoiceId);
      },

      getTransactionsByPayment: (paymentId) => {
        return get().transactions.filter((t) => t.paymentId === paymentId);
      },

      getTransactionsByCommission: (commissionId) => {
        return get().transactions.filter((t) => t.commissionId === commissionId);
      },

      getTransactionsByDateRange: (startDate, endDate) => {
        return get().transactions.filter((t) => {
          return t.timestamp >= startDate && t.timestamp <= endDate;
        });
      },

      getRelatedTransactions: (transactionId) => {
        const transaction = get().getTransactionById(transactionId);
        if (!transaction?.relatedTransactions) return [];

        return transaction.relatedTransactions
          .map((id) => get().getTransactionById(id))
          .filter((t): t is FinancialTransaction => t !== undefined);
      },

      getTransactionChain: (entityType, entityId) => {
        let transactions: FinancialTransaction[] = [];

        switch (entityType) {
          case 'quote':
            transactions = get().getTransactionsByQuote(entityId);
            break;
          case 'invoice':
            transactions = get().getTransactionsByInvoice(entityId);
            break;
          case 'payment':
            transactions = get().getTransactionsByPayment(entityId);
            break;
        }

        // Sort by timestamp
        return transactions.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      },

      getTransactionSummary: (startDate, endDate) => {
        const transactions = get().getTransactionsByDateRange(startDate, endDate);

        const transactionsByType = transactions.reduce(
          (acc, t) => {
            acc[t.type] = (acc[t.type] || 0) + 1;
            return acc;
          },
          {} as Record<TransactionType, number>
        );

        const inflowTypes: TransactionType[] = ['payment_received'];
        const outflowTypes: TransactionType[] = [
          'expense_recorded',
          'commission_paid',
          'refund_issued',
          'supplier_payment',
        ];

        const totalMoneyIn = transactions
          .filter((t) => inflowTypes.includes(t.type) && t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);

        const totalMoneyOut = transactions
          .filter((t) => outflowTypes.includes(t.type) && t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          period: { startDate, endDate },
          totalTransactions: transactions.length,
          transactionsByType,
          totalMoneyIn,
          totalMoneyOut,
          netCashFlow: totalMoneyIn - totalMoneyOut,
        };
      },

      getCashFlow: (startDate, endDate) => {
        const summary = get().getTransactionSummary(startDate, endDate);
        return {
          inflow: summary.totalMoneyIn,
          outflow: summary.totalMoneyOut,
          net: summary.netCashFlow,
        };
      },

      searchTransactions: (query) => {
        const lowercaseQuery = query.toLowerCase();
        return get().transactions.filter(
          (t) =>
            t.description.toLowerCase().includes(lowercaseQuery) ||
            t.quoteId?.toLowerCase().includes(lowercaseQuery) ||
            t.invoiceId?.toLowerCase().includes(lowercaseQuery) ||
            t.paymentId?.toLowerCase().includes(lowercaseQuery) ||
            t.customerId?.toLowerCase().includes(lowercaseQuery)
        );
      },
    }),
    {
      name: 'transaction-storage',
      version: 1,
    }
  )
);
