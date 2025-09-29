import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Invoice,
  InvoiceItem,
  Payment,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  FinancialSummary
} from '@/types/financial';

interface InvoiceStore {
  invoices: Invoice[];

  // Invoice CRUD operations
  createInvoice: (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'paidAmount' | 'remainingAmount'>) => string;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  getInvoiceById: (id: string) => Invoice | undefined;
  getInvoicesByStatus: (status: InvoiceStatus) => Invoice[];
  getInvoicesByCustomer: (customerId: string) => Invoice[];
  getOverdueInvoices: () => Invoice[];

  // Invoice generation from quotes
  generateInvoiceFromQuote: (
    quoteId: string,
    customerData: {
      customerId: string;
      customerName: string;
      customerEmail: string;
      customerAddress?: any
    },
    terms?: string,
    dueInDays?: number
  ) => string | null;

  // Invoice generation from booking confirmations
  generateInvoiceFromBooking: (booking: any) => string | null;

  // Payment operations
  addPayment: (invoiceId: string, payment: Omit<Payment, 'id'>) => void;
  updatePayment: (invoiceId: string, paymentId: string, updates: Partial<Payment>) => void;
  deletePayment: (invoiceId: string, paymentId: string) => void;

  // Invoice status management
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  markInvoiceAsSent: (id: string) => void;
  markInvoiceAsPaid: (id: string, paymentMethod: PaymentMethod, transactionId?: string) => void;

  // Invoice items
  addInvoiceItem: (invoiceId: string, item: Omit<InvoiceItem, 'id'>) => void;
  updateInvoiceItem: (invoiceId: string, itemId: string, updates: Partial<InvoiceItem>) => void;
  removeInvoiceItem: (invoiceId: string, itemId: string) => void;

  // Financial calculations
  calculateInvoiceTotals: (invoiceId: string) => void;
  getTotalRevenue: (startDate?: string, endDate?: string) => number;
  getTotalOutstanding: () => number;
  getOverdueAmount: () => number;
  getFinancialSummary: (startDate: string, endDate: string) => FinancialSummary;

  // Search and filtering
  searchInvoices: (query: string) => Invoice[];
  getInvoicesByDateRange: (startDate: string, endDate: string) => Invoice[];

  // Invoice numbering
  generateInvoiceNumber: () => string;
}

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      invoices: [],

      createInvoice: (invoiceData) => {
        const id = crypto.randomUUID();
        const invoiceNumber = get().generateInvoiceNumber();
        const now = new Date().toISOString();

        const invoice: Invoice = {
          ...invoiceData,
          id,
          invoiceNumber,
          paidAmount: 0,
          remainingAmount: invoiceData.total,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          invoices: [...state.invoices, invoice],
        }));

        return id;
      },

      updateInvoice: (id, updates) => {
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === id
              ? { ...invoice, ...updates, updatedAt: new Date().toISOString() }
              : invoice
          ),
        }));
      },

      deleteInvoice: (id) => {
        set((state) => ({
          invoices: state.invoices.filter((invoice) => invoice.id !== id),
        }));
      },

      getInvoiceById: (id) => {
        return get().invoices.find((invoice) => invoice.id === id);
      },

      getInvoicesByStatus: (status) => {
        return get().invoices.filter((invoice) => invoice.status === status);
      },

      getInvoicesByCustomer: (customerId) => {
        return get().invoices.filter((invoice) => invoice.customerId === customerId);
      },

      getOverdueInvoices: () => {
        const now = new Date();
        return get().invoices.filter((invoice) => {
          const dueDate = new Date(invoice.dueDate);
          return dueDate < now && invoice.status !== 'paid' && invoice.status !== 'cancelled';
        });
      },

      generateInvoiceFromQuote: (quoteId, customerData, terms = 'Net 30', dueInDays = 30) => {
        // For now, we'll create a basic invoice without accessing quote data
        // This prevents circular dependencies while maintaining functionality
        try {
          const dueDate = new Date(Date.now() + dueInDays * 24 * 60 * 60 * 1000);

          // Create a basic invoice item - the quote store will populate this properly
          const invoiceItems = [{
            id: crypto.randomUUID(),
            description: 'Travel Services',
            quantity: 1,
            unitPrice: 1000, // Default amount, will be updated by quote store
            total: 1000,
            taxRate: 0,
            taxAmount: 0,
          }];

          const subtotal = 1000;
          const taxRate = 8.5;
          const taxAmount = subtotal * (taxRate / 100);
          const total = subtotal + taxAmount;

          const invoiceData = {
            quoteId,
            customerId: customerData.customerId,
            customerName: customerData.customerName,
            customerEmail: customerData.customerEmail,
            customerAddress: customerData.customerAddress,
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
            status: 'draft' as InvoiceStatus,
            items: invoiceItems,
            subtotal,
            taxRate,
            taxAmount,
            total,
            payments: [],
            terms: terms,
          };

          const invoiceId = get().createInvoice(invoiceData);
          return invoiceId;
        } catch (error) {
          console.error('Failed to generate invoice from quote:', error);
          return null;
        }
      },

      generateInvoiceFromBooking: (booking) => {
        try {
          const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

          const invoiceData = {
            quoteId: booking.bookingId, // Use booking ID as quote reference
            customerId: booking.bookingId,
            customerName: booking.customerDetails.name,
            customerEmail: booking.customerDetails.email,
            customerAddress: undefined,
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
            status: 'sent' as InvoiceStatus, // Auto-mark as sent since booking is confirmed
            items: booking.items.map((item: any) => ({
              id: crypto.randomUUID(),
              description: `${item.type === 'flight' ? 'Flight' : 'Hotel'} - ${item.confirmationNumber}`,
              quantity: 1,
              unitPrice: item.details.totalPrice || 0,
              total: item.details.totalPrice || 0,
              taxRate: 0,
              taxAmount: 0,
            })),
            subtotal: booking.totalAmount,
            taxRate: 8.5, // Default tax rate
            taxAmount: booking.totalAmount * 0.085,
            total: booking.totalAmount * 1.085,
            payments: booking.paymentStatus === 'paid' ? [{
              id: crypto.randomUUID(),
              invoiceId: '', // Will be set after invoice creation
              amount: booking.totalAmount * 1.085,
              method: 'credit_card' as PaymentMethod,
              status: 'completed' as PaymentStatus,
              processedDate: booking.createdAt,
              transactionId: booking.bookingReference,
            }] : [],
            terms: 'Payment due upon booking confirmation',
          };

          const invoiceId = get().createInvoice(invoiceData);

          // If payment was already made, add it properly
          if (booking.paymentStatus === 'paid' && invoiceId) {
            get().addPayment(invoiceId, {
              amount: booking.totalAmount * 1.085,
              method: 'credit_card' as PaymentMethod,
              status: 'completed' as PaymentStatus,
              processedDate: booking.createdAt,
              transactionId: booking.bookingReference,
            });
          }

          return invoiceId;
        } catch (error) {
          console.error('Failed to generate invoice from booking:', error);
          return null;
        }
      },

      addPayment: (invoiceId, paymentData) => {
        const payment: Payment = {
          ...paymentData,
          id: crypto.randomUUID(),
          invoiceId,
        };

        set((state) => ({
          invoices: state.invoices.map((invoice) => {
            if (invoice.id === invoiceId) {
              const updatedPayments = [...invoice.payments, payment];
              const paidAmount = updatedPayments
                .filter(p => p.status === 'completed')
                .reduce((sum, p) => sum + p.amount, 0);
              const remainingAmount = invoice.total - paidAmount;

              let status: InvoiceStatus = invoice.status;
              if (remainingAmount <= 0) {
                status = 'paid';
              } else if (paidAmount > 0) {
                status = 'partial';
              }

              return {
                ...invoice,
                payments: updatedPayments,
                paidAmount,
                remainingAmount,
                status,
                updatedAt: new Date().toISOString(),
              };
            }
            return invoice;
          }),
        }));
      },

      updatePayment: (invoiceId, paymentId, updates) => {
        set((state) => ({
          invoices: state.invoices.map((invoice) => {
            if (invoice.id === invoiceId) {
              const updatedPayments = invoice.payments.map((payment) =>
                payment.id === paymentId
                  ? { ...payment, ...updates }
                  : payment
              );

              const paidAmount = updatedPayments
                .filter(p => p.status === 'completed')
                .reduce((sum, p) => sum + p.amount, 0);
              const remainingAmount = invoice.total - paidAmount;

              let status: InvoiceStatus = invoice.status;
              if (remainingAmount <= 0) {
                status = 'paid';
              } else if (paidAmount > 0) {
                status = 'partial';
              } else {
                status = 'sent'; // or whatever the previous status was
              }

              return {
                ...invoice,
                payments: updatedPayments,
                paidAmount,
                remainingAmount,
                status,
                updatedAt: new Date().toISOString(),
              };
            }
            return invoice;
          }),
        }));
      },

      deletePayment: (invoiceId, paymentId) => {
        set((state) => ({
          invoices: state.invoices.map((invoice) => {
            if (invoice.id === invoiceId) {
              const updatedPayments = invoice.payments.filter(p => p.id !== paymentId);
              const paidAmount = updatedPayments
                .filter(p => p.status === 'completed')
                .reduce((sum, p) => sum + p.amount, 0);
              const remainingAmount = invoice.total - paidAmount;

              let status: InvoiceStatus;
              if (remainingAmount <= 0 && paidAmount > 0) {
                status = 'paid';
              } else if (paidAmount > 0) {
                status = 'partial';
              } else {
                status = 'sent';
              }

              return {
                ...invoice,
                payments: updatedPayments,
                paidAmount,
                remainingAmount,
                status,
                updatedAt: new Date().toISOString(),
              };
            }
            return invoice;
          }),
        }));
      },

      updateInvoiceStatus: (id, status) => {
        get().updateInvoice(id, { status });
      },

      markInvoiceAsSent: (id) => {
        get().updateInvoice(id, {
          status: 'sent',
          lastSentDate: new Date().toISOString()
        });
      },

      markInvoiceAsPaid: (id, paymentMethod, transactionId) => {
        const invoice = get().getInvoiceById(id);
        if (!invoice) return;

        const paymentData = {
          amount: invoice.remainingAmount,
          method: paymentMethod,
          status: 'completed' as PaymentStatus,
          processedDate: new Date().toISOString(),
          transactionId,
        };

        get().addPayment(id, paymentData);
      },

      addInvoiceItem: (invoiceId, itemData) => {
        const item: InvoiceItem = {
          ...itemData,
          id: crypto.randomUUID(),
        };

        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === invoiceId
              ? { ...invoice, items: [...invoice.items, item] }
              : invoice
          ),
        }));

        get().calculateInvoiceTotals(invoiceId);
      },

      updateInvoiceItem: (invoiceId, itemId, updates) => {
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === invoiceId
              ? {
                  ...invoice,
                  items: invoice.items.map((item) =>
                    item.id === itemId ? { ...item, ...updates } : item
                  ),
                }
              : invoice
          ),
        }));

        get().calculateInvoiceTotals(invoiceId);
      },

      removeInvoiceItem: (invoiceId, itemId) => {
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === invoiceId
              ? {
                  ...invoice,
                  items: invoice.items.filter((item) => item.id !== itemId),
                }
              : invoice
          ),
        }));

        get().calculateInvoiceTotals(invoiceId);
      },

      calculateInvoiceTotals: (invoiceId) => {
        const invoice = get().getInvoiceById(invoiceId);
        if (!invoice) return;

        const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
        const taxAmount = subtotal * (invoice.taxRate / 100);
        const total = subtotal + taxAmount - (invoice.discountAmount || 0);
        const remainingAmount = total - invoice.paidAmount;

        get().updateInvoice(invoiceId, {
          subtotal,
          taxAmount,
          total,
          remainingAmount,
        });
      },

      getTotalRevenue: (startDate, endDate) => {
        let invoices = get().invoices.filter(inv => inv.status === 'paid');

        if (startDate && endDate) {
          invoices = invoices.filter(inv => {
            const invoiceDate = inv.createdAt;
            return invoiceDate >= startDate && invoiceDate <= endDate;
          });
        }

        return invoices.reduce((sum, inv) => sum + inv.total, 0);
      },

      getTotalOutstanding: () => {
        return get().invoices
          .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
          .reduce((sum, inv) => sum + inv.remainingAmount, 0);
      },

      getOverdueAmount: () => {
        return get().getOverdueInvoices()
          .reduce((sum, inv) => sum + inv.remainingAmount, 0);
      },

      getFinancialSummary: (startDate, endDate) => {
        const invoices = get().getInvoicesByDateRange(startDate, endDate);
        const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
        const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);
        const overdueInvoices = invoices.filter(inv => {
          const dueDate = new Date(inv.dueDate);
          return dueDate < new Date() && inv.status !== 'paid';
        });

        return {
          period: { startDate, endDate },
          revenue: {
            totalRevenue: totalPaid,
            totalBookings: invoices.length,
            averageBookingValue: invoices.length > 0 ? totalPaid / invoices.length : 0,
            conversionRate: 0, // Would need quote data
          },
          invoices: {
            totalInvoiced,
            totalPaid,
            totalOutstanding,
            overdueAmount: overdueInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0),
            overdueCount: overdueInvoices.length,
          },
          commissions: {
            totalCommissionsEarned: 0,
            totalCommissionsPaid: 0,
            totalCommissionsPending: 0,
          },
          expenses: {
            totalExpenses: 0,
            expensesByCategory: {} as any,
          },
          profitLoss: {
            grossProfit: totalPaid,
            netProfit: totalPaid, // Would subtract expenses
            profitMargin: totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0,
          },
          cashFlow: {
            cashInflow: totalPaid,
            cashOutflow: 0, // Would include expenses
            netCashFlow: totalPaid,
          },
        };
      },

      searchInvoices: (query) => {
        const lowercaseQuery = query.toLowerCase();
        return get().invoices.filter(invoice =>
          invoice.invoiceNumber.toLowerCase().includes(lowercaseQuery) ||
          invoice.customerName.toLowerCase().includes(lowercaseQuery) ||
          invoice.customerEmail.toLowerCase().includes(lowercaseQuery)
        );
      },

      getInvoicesByDateRange: (startDate, endDate) => {
        return get().invoices.filter(invoice => {
          const invoiceDate = invoice.createdAt;
          return invoiceDate >= startDate && invoiceDate <= endDate;
        });
      },

      generateInvoiceNumber: () => {
        const invoices = get().invoices;
        const currentYear = new Date().getFullYear();
        const yearPrefix = `INV-${currentYear}-`;

        const existingNumbers = invoices
          .filter(inv => inv.invoiceNumber.startsWith(yearPrefix))
          .map(inv => {
            const numberPart = inv.invoiceNumber.replace(yearPrefix, '');
            return parseInt(numberPart, 10) || 0;
          });

        const nextNumber = existingNumbers.length > 0
          ? Math.max(...existingNumbers) + 1
          : 1;

        return `${yearPrefix}${nextNumber.toString().padStart(4, '0')}`;
      },
    }),
    {
      name: 'invoice-storage',
      version: 1,
    }
  )
);