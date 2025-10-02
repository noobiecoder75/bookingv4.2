import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  QuotePayment,
  PaymentSchedule,
  FundAllocation,
  SupplierPayment,
  PriceChange,
  EscrowStatus,
  PaymentSource,
} from '@/types/payment';

interface PaymentStore {
  // State
  payments: QuotePayment[];
  paymentSchedules: PaymentSchedule[];
  fundAllocations: FundAllocation[];
  supplierPayments: SupplierPayment[];
  priceChanges: PriceChange[];

  // Payment CRUD
  createPayment: (payment: Omit<QuotePayment, 'id'>) => string;
  updatePayment: (id: string, updates: Partial<QuotePayment>) => void;
  getPaymentById: (id: string) => QuotePayment | undefined;
  getPaymentsByQuote: (quoteId: string) => QuotePayment[];
  getTotalPaidForQuote: (quoteId: string) => number;

  // Payment Schedule
  createSchedule: (schedule: Omit<PaymentSchedule, 'id'>) => string;
  updateSchedule: (id: string, updates: Partial<PaymentSchedule>) => void;
  getScheduleById: (id: string) => PaymentSchedule | undefined;
  getSchedulesByQuote: (quoteId: string) => PaymentSchedule[];
  getOverdueSchedules: () => PaymentSchedule[];
  markScheduleAsPaid: (scheduleId: string, paymentId: string) => void;
  incrementReminderCount: (scheduleId: string) => void;

  // Fund Allocation
  createFundAllocation: (allocation: Omit<FundAllocation, 'id'>) => string;
  updateAllocation: (id: string, updates: Partial<FundAllocation>) => void;
  getAllocationByPayment: (paymentId: string) => FundAllocation | undefined;
  updateAllocationStatus: (allocationId: string, itemId: string, status: EscrowStatus) => void;
  releaseEscrowFunds: (allocationId: string, itemId: string) => void;

  // Supplier Payments
  createSupplierPayment: (payment: Omit<SupplierPayment, 'id'>) => string;
  updateSupplierPayment: (id: string, updates: Partial<SupplierPayment>) => void;
  getSupplierPaymentsDue: () => SupplierPayment[];
  markSupplierPaymentPaid: (id: string, stripeTransferId: string) => void;

  // Price Changes
  recordPriceChange: (change: Omit<PriceChange, 'id'>) => string;
  acceptPriceChange: (changeId: string) => void;
  getPriceChangesByQuote: (quoteId: string) => PriceChange[];
  getUnacceptedPriceChanges: (quoteId: string) => PriceChange[];
}

export const usePaymentStore = create<PaymentStore>()(
  persist(
    (set, get) => ({
      // Initial State
      payments: [],
      paymentSchedules: [],
      fundAllocations: [],
      supplierPayments: [],
      priceChanges: [],

      // Payment CRUD
      createPayment: (paymentData) => {
        const id = crypto.randomUUID();
        const payment: QuotePayment = { ...paymentData, id };

        set((state) => ({
          payments: [...state.payments, payment],
        }));

        return id;
      },

      updatePayment: (id, updates) => {
        set((state) => ({
          payments: state.payments.map((payment) =>
            payment.id === id ? { ...payment, ...updates } : payment
          ),
        }));
      },

      getPaymentById: (id) => {
        return get().payments.find((payment) => payment.id === id);
      },

      getPaymentsByQuote: (quoteId) => {
        return get().payments.filter((payment) => payment.quoteId === quoteId);
      },

      getTotalPaidForQuote: (quoteId) => {
        const payments = get().getPaymentsByQuote(quoteId);
        return payments
          .filter((p) => p.status === 'completed')
          .reduce((sum, p) => sum + p.amount, 0);
      },

      // Payment Schedule
      createSchedule: (scheduleData) => {
        const id = crypto.randomUUID();
        const schedule: PaymentSchedule = { ...scheduleData, id };

        set((state) => ({
          paymentSchedules: [...state.paymentSchedules, schedule],
        }));

        return id;
      },

      updateSchedule: (id, updates) => {
        set((state) => ({
          paymentSchedules: state.paymentSchedules.map((schedule) =>
            schedule.id === id
              ? { ...schedule, ...updates, updatedAt: new Date().toISOString() }
              : schedule
          ),
        }));
      },

      getScheduleById: (id) => {
        return get().paymentSchedules.find((schedule) => schedule.id === id);
      },

      getSchedulesByQuote: (quoteId) => {
        return get().paymentSchedules.filter((schedule) => schedule.quoteId === quoteId);
      },

      getOverdueSchedules: () => {
        const now = new Date();
        return get().paymentSchedules.filter((schedule) => {
          if (schedule.status !== 'pending') return false;
          const dueDate = new Date(schedule.dueDate);
          return dueDate < now;
        });
      },

      markScheduleAsPaid: (scheduleId, paymentId) => {
        get().updateSchedule(scheduleId, {
          status: 'paid',
          paymentId,
        });
      },

      incrementReminderCount: (scheduleId) => {
        const schedule = get().getScheduleById(scheduleId);
        if (schedule) {
          get().updateSchedule(scheduleId, {
            reminderCount: schedule.reminderCount + 1,
            lastReminderSent: new Date().toISOString(),
          });
        }
      },

      // Fund Allocation
      createFundAllocation: (allocationData) => {
        const id = crypto.randomUUID();
        const allocation: FundAllocation = { ...allocationData, id };

        set((state) => ({
          fundAllocations: [...state.fundAllocations, allocation],
        }));

        return id;
      },

      updateAllocation: (id, updates) => {
        set((state) => ({
          fundAllocations: state.fundAllocations.map((allocation) =>
            allocation.id === id
              ? { ...allocation, ...updates, updatedAt: new Date().toISOString() }
              : allocation
          ),
        }));
      },

      getAllocationByPayment: (paymentId) => {
        return get().fundAllocations.find((allocation) => allocation.paymentId === paymentId);
      },

      updateAllocationStatus: (allocationId, itemId, status) => {
        const allocation = get().fundAllocations.find((a) => a.id === allocationId);
        if (!allocation) return;

        const updatedAllocations = allocation.allocations.map((item) =>
          item.quoteItemId === itemId ? { ...item, escrowStatus: status } : item
        );

        get().updateAllocation(allocationId, {
          allocations: updatedAllocations,
        });
      },

      releaseEscrowFunds: (allocationId, itemId) => {
        const allocation = get().fundAllocations.find((a) => a.id === allocationId);
        if (!allocation) return;

        const updatedAllocations = allocation.allocations.map((item) =>
          item.quoteItemId === itemId
            ? {
                ...item,
                escrowStatus: 'released' as EscrowStatus,
                escrowReleaseDate: new Date().toISOString(),
              }
            : item
        );

        get().updateAllocation(allocationId, {
          allocations: updatedAllocations,
        });
      },

      // Supplier Payments
      createSupplierPayment: (paymentData) => {
        const id = crypto.randomUUID();
        const payment: SupplierPayment = { ...paymentData, id };

        set((state) => ({
          supplierPayments: [...state.supplierPayments, payment],
        }));

        return id;
      },

      updateSupplierPayment: (id, updates) => {
        set((state) => ({
          supplierPayments: state.supplierPayments.map((payment) =>
            payment.id === id
              ? { ...payment, ...updates, updatedAt: new Date().toISOString() }
              : payment
          ),
        }));
      },

      getSupplierPaymentsDue: () => {
        const now = new Date();
        return get().supplierPayments.filter((payment) => {
          if (payment.status !== 'scheduled') return false;
          if (!payment.scheduledPaymentDate) return false;
          const scheduledDate = new Date(payment.scheduledPaymentDate);
          return scheduledDate <= now;
        });
      },

      markSupplierPaymentPaid: (id, stripeTransferId) => {
        get().updateSupplierPayment(id, {
          status: 'paid',
          stripeTransferId,
          paidDate: new Date().toISOString(),
        });
      },

      // Price Changes
      recordPriceChange: (changeData) => {
        const id = crypto.randomUUID();
        const change: PriceChange = { ...changeData, id };

        set((state) => ({
          priceChanges: [...state.priceChanges, change],
        }));

        return id;
      },

      acceptPriceChange: (changeId) => {
        set((state) => ({
          priceChanges: state.priceChanges.map((change) =>
            change.id === changeId
              ? {
                  ...change,
                  clientAccepted: true,
                  clientAcceptedAt: new Date().toISOString(),
                }
              : change
          ),
        }));
      },

      getPriceChangesByQuote: (quoteId) => {
        return get().priceChanges.filter((change) => change.quoteId === quoteId);
      },

      getUnacceptedPriceChanges: (quoteId) => {
        return get().priceChanges.filter(
          (change) => change.quoteId === quoteId && !change.clientAccepted
        );
      },
    }),
    {
      name: 'payment-store',
      version: 1,
    }
  )
);
