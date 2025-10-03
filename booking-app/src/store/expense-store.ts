import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Expense, ExpenseCategory } from '@/types/financial';

interface ExpenseStore {
  expenses: Expense[];

  // Expense CRUD operations
  createExpense: (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  getExpenseById: (id: string) => Expense | undefined;

  // Expense categorization and filtering
  getExpensesByCategory: (category: ExpenseCategory) => Expense[];
  getExpensesByDateRange: (startDate: string, endDate: string) => Expense[];
  getExpensesByAgent: (agentId: string) => Expense[];
  getExpensesBySupplier: (supplierId: string) => Expense[];
  getExpensesByBooking: (bookingId: string) => Expense[];

  // Expense approval workflow
  approveExpense: (id: string, approvedBy: string) => void;
  bulkApproveExpenses: (ids: string[], approvedBy: string) => void;

  // Financial calculations
  getTotalExpenses: (startDate?: string, endDate?: string) => number;
  getExpensesByCategoryTotals: (startDate?: string, endDate?: string) => Record<ExpenseCategory, number>;
  getMonthlyExpenses: (year: number) => Array<{ month: string; total: number; byCategory: Record<ExpenseCategory, number> }>;

  // Recurring expenses
  createRecurringExpense: (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => string;
  processRecurringExpenses: () => void;

  // Search and reporting
  searchExpenses: (query: string) => Expense[];
  getExpenseReport: (startDate: string, endDate: string) => {
    totalExpenses: number;
    expensesByCategory: Record<ExpenseCategory, number>;
    topVendors: Array<{ vendor: string; total: number }>;
    monthlyTrend: Array<{ month: string; total: number }>;
  };

  // Supplier payments tracking
  getSupplierPayments: (supplierId?: string) => Expense[];
  getTotalSupplierPayments: (supplierId?: string, startDate?: string, endDate?: string) => number;
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      expenses: [],

      createExpense: (expenseData) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const expense: Expense = {
          ...expenseData,
          id,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          expenses: [...state.expenses, expense],
        }));

        return id;
      },

      updateExpense: (id, updates) => {
        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id
              ? { ...expense, ...updates, updatedAt: new Date().toISOString() }
              : expense
          ),
        }));
      },

      deleteExpense: (id) => {
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        }));
      },

      getExpenseById: (id) => {
        return get().expenses.find((expense) => expense.id === id);
      },

      getExpensesByCategory: (category) => {
        return get().expenses.filter((expense) => expense.category === category);
      },

      getExpensesByDateRange: (startDate, endDate) => {
        return get().expenses.filter((expense) => {
          const expenseDate = expense.date;
          return expenseDate >= startDate && expenseDate <= endDate;
        });
      },

      getExpensesByAgent: (agentId) => {
        return get().expenses.filter((expense) => expense.agentId === agentId);
      },

      getExpensesBySupplier: (supplierId) => {
        return get().expenses.filter((expense) => expense.supplierId === supplierId);
      },

      getExpensesByBooking: (bookingId) => {
        return get().expenses.filter((expense) => expense.bookingId === bookingId);
      },

      approveExpense: (id, approvedBy) => {
        get().updateExpense(id, {
          approvedBy,
          approvedDate: new Date().toISOString(),
        });
      },

      bulkApproveExpenses: (ids, approvedBy) => {
        const approvedDate = new Date().toISOString();
        ids.forEach(id => {
          get().updateExpense(id, { approvedBy, approvedDate });
        });
      },

      getTotalExpenses: (startDate, endDate) => {
        let expenses = get().expenses;

        if (startDate && endDate) {
          expenses = get().getExpensesByDateRange(startDate, endDate);
        }

        return expenses.reduce((sum, expense) => sum + expense.amount, 0);
      },

      getExpensesByCategoryTotals: (startDate, endDate) => {
        let expenses = get().expenses;

        if (startDate && endDate) {
          expenses = get().getExpensesByDateRange(startDate, endDate);
        }

        const categoryTotals: Record<ExpenseCategory, number> = {
          supplier_payment: 0,
          marketing: 0,
          operational: 0,
          commission: 0,
          office: 0,
          travel: 0,
          technology: 0,
          other: 0,
        };

        expenses.forEach((expense) => {
          categoryTotals[expense.category] += expense.amount;
        });

        return categoryTotals;
      },

      getMonthlyExpenses: (year) => {
        const yearStart = `${year}-01-01`;
        const yearEnd = `${year}-12-31`;
        const expenses = get().getExpensesByDateRange(yearStart, yearEnd);

        const monthlyData: Array<{ month: string; total: number; byCategory: Record<ExpenseCategory, number> }> = [];

        for (let month = 0; month < 12; month++) {
          const monthStart = new Date(year, month, 1).toISOString().split('T')[0];
          const monthEnd = new Date(year, month + 1, 0).toISOString().split('T')[0];
          const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

          const monthExpenses = expenses.filter(expense => {
            return expense.date >= monthStart && expense.date <= monthEnd;
          });

          const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

          const byCategory: Record<ExpenseCategory, number> = {
            supplier_payment: 0,
            marketing: 0,
            operational: 0,
            commission: 0,
            office: 0,
            travel: 0,
            technology: 0,
            other: 0,
          };

          monthExpenses.forEach(expense => {
            byCategory[expense.category] += expense.amount;
          });

          monthlyData.push({
            month: monthName,
            total,
            byCategory,
          });
        }

        return monthlyData;
      },

      createRecurringExpense: (expenseData) => {
        const expense = {
          ...expenseData,
          isRecurring: true,
        };

        return get().createExpense(expense);
      },

      processRecurringExpenses: () => {
        const recurringExpenses = get().expenses.filter(expense => expense.isRecurring);
        const now = new Date();

        recurringExpenses.forEach(expense => {
          const lastDate = new Date(expense.date);
          let nextDate = new Date(lastDate);

          // Calculate next occurrence based on frequency
          switch (expense.recurringFrequency) {
            case 'monthly':
              nextDate.setMonth(nextDate.getMonth() + 1);
              break;
            case 'quarterly':
              nextDate.setMonth(nextDate.getMonth() + 3);
              break;
            case 'yearly':
              nextDate.setFullYear(nextDate.getFullYear() + 1);
              break;
            default:
              return;
          }

          // If it's time for the next occurrence, create a new expense
          if (nextDate <= now) {
            const newExpenseData = {
              ...expense,
              date: nextDate.toISOString().split('T')[0],
            };
            delete (newExpenseData as any).id;
            delete (newExpenseData as any).createdAt;
            delete (newExpenseData as any).updatedAt;

            get().createExpense(newExpenseData);
          }
        });
      },

      searchExpenses: (query) => {
        const lowercaseQuery = query.toLowerCase();
        return get().expenses.filter(expense =>
          expense.description.toLowerCase().includes(lowercaseQuery) ||
          expense.vendor?.toLowerCase().includes(lowercaseQuery) ||
          expense.category.toLowerCase().includes(lowercaseQuery) ||
          expense.subcategory?.toLowerCase().includes(lowercaseQuery)
        );
      },

      getExpenseReport: (startDate, endDate) => {
        const expenses = get().getExpensesByDateRange(startDate, endDate);
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

        // Expenses by category
        const expensesByCategory = get().getExpensesByCategoryTotals(startDate, endDate);

        // Top vendors
        const vendorTotals: Record<string, number> = {};
        expenses.forEach(expense => {
          if (expense.vendor) {
            vendorTotals[expense.vendor] = (vendorTotals[expense.vendor] || 0) + expense.amount;
          }
        });

        const topVendors = Object.entries(vendorTotals)
          .map(([vendor, total]) => ({ vendor, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);

        // Monthly trend
        const monthlyTotals: Record<string, number> = {};
        expenses.forEach(expense => {
          const month = expense.date.substring(0, 7); // YYYY-MM
          monthlyTotals[month] = (monthlyTotals[month] || 0) + expense.amount;
        });

        const monthlyTrend = Object.entries(monthlyTotals)
          .map(([month, total]) => ({ month, total }))
          .sort((a, b) => a.month.localeCompare(b.month));

        return {
          totalExpenses,
          expensesByCategory,
          topVendors,
          monthlyTrend,
        };
      },

      getSupplierPayments: (supplierId) => {
        const supplierPayments = get().expenses.filter(expense =>
          expense.category === 'supplier_payment'
        );

        if (supplierId) {
          return supplierPayments.filter(expense => expense.supplierId === supplierId);
        }

        return supplierPayments;
      },

      getTotalSupplierPayments: (supplierId, startDate, endDate) => {
        let payments = get().getSupplierPayments(supplierId);

        if (startDate && endDate) {
          payments = payments.filter(payment => {
            return payment.date >= startDate && payment.date <= endDate;
          });
        }

        return payments.reduce((sum, payment) => sum + payment.amount, 0);
      },
    }),
    {
      name: 'expense-storage',
      version: 1,
    }
  )
);