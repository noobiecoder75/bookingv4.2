import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Commission,
  CommissionRule,
  CommissionStatus,
  PaymentMethod,
  CommissionAnalytics,
} from '@/types/financial';
import { useSettingsStore } from './settings-store';

interface CommissionStore {
  commissions: Commission[];
  commissionRules: CommissionRule[];

  // Commission CRUD operations
  createCommission: (commissionData: Omit<Commission, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateCommission: (id: string, updates: Partial<Commission>) => void;
  deleteCommission: (id: string) => void;
  getCommissionById: (id: string) => Commission | undefined;

  // Commission calculations
  calculateCommission: (
    agentId: string,
    bookingAmount: number,
    bookingType?: 'flight' | 'hotel' | 'activity' | 'transfer',
    quoteCommissionRate?: number // Override with quote-specific rate
  ) => number;

  generateCommissionFromBooking: (
    bookingData: {
      agentId: string;
      agentName: string;
      bookingId: string;
      quoteId: string;
      invoiceId?: string; // Link to invoice
      customerId: string;
      customerName: string;
      bookingAmount: number;
      bookingType?: 'flight' | 'hotel' | 'activity' | 'transfer';
      quoteCommissionRate?: number; // Quote-specific commission rate
    }
  ) => string;

  // Generate commission from booking confirmation (simplified version)
  generateCommissionFromBookingConfirmation: (booking: {
    totalAmount: number;
    items: Array<{ type?: string }>;
    customerDetails: { name: string };
    bookingId: string;
    createdAt: string;
    commissionRate?: number;
  }, invoiceId: string) => string;

  // Commission status management
  updateCommissionStatus: (id: string, status: CommissionStatus) => void;
  approveCommission: (id: string) => void;
  markCommissionAsPaid: (id: string, paymentMethod: PaymentMethod) => void;
  bulkApproveCommissions: (ids: string[]) => void;
  bulkMarkAsPaid: (ids: string[], paymentMethod: PaymentMethod) => void;

  // Commission rules management
  createCommissionRule: (ruleData: Omit<CommissionRule, 'id' | 'createdAt'>) => string;
  updateCommissionRule: (id: string, updates: Partial<CommissionRule>) => void;
  deleteCommissionRule: (id: string) => void;
  getCommissionRuleById: (id: string) => CommissionRule | undefined;
  getActiveCommissionRules: () => CommissionRule[];

  // Filtering and querying
  getCommissionsByAgent: (agentId: string) => Commission[];
  getCommissionsByStatus: (status: CommissionStatus) => Commission[];
  getCommissionsByDateRange: (startDate: string, endDate: string) => Commission[];
  getPendingCommissions: () => Commission[];
  getUnpaidCommissions: () => Commission[];

  // Analytics and reporting
  getCommissionAnalytics: (agentId?: string, startDate?: string, endDate?: string) => CommissionAnalytics[];
  getTotalCommissionsEarned: (agentId?: string, startDate?: string, endDate?: string) => number;
  getTotalCommissionsPaid: (agentId?: string, startDate?: string, endDate?: string) => number;
  getTotalCommissionsPending: (agentId?: string) => number;
  getAgentCommissionSummary: (agentId: string, startDate?: string, endDate?: string) => {
    totalEarned: number;
    totalPaid: number;
    totalPending: number;
    commissionRate: number;
    totalBookings: number;
  };

  // Search functionality
  searchCommissions: (query: string) => Commission[];
}

export const useCommissionStore = create<CommissionStore>()(
  persist(
    (set, get) => ({
      commissions: [],
      commissionRules: [], // Remove hard-coded default rule

      createCommission: (commissionData) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const commission: Commission = {
          ...commissionData,
          id,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          commissions: [...state.commissions, commission],
        }));

        return id;
      },

      updateCommission: (id, updates) => {
        set((state) => ({
          commissions: state.commissions.map((commission) =>
            commission.id === id
              ? { ...commission, ...updates, updatedAt: new Date().toISOString() }
              : commission
          ),
        }));
      },

      deleteCommission: (id) => {
        set((state) => ({
          commissions: state.commissions.filter((commission) => commission.id !== id),
        }));
      },

      getCommissionById: (id) => {
        return get().commissions.find((commission) => commission.id === id);
      },

      calculateCommission: (agentId, bookingAmount, bookingType, quoteCommissionRate) => {
        // If quote has a specific commission rate, use it directly
        if (quoteCommissionRate !== undefined && quoteCommissionRate !== null) {
          return (bookingAmount * quoteCommissionRate) / 100;
        }

        const rules = get().getActiveCommissionRules();

        // Find the most specific rule that applies
        let applicableRule = rules.find(rule =>
          rule.agentId === agentId &&
          (!rule.bookingType || rule.bookingType === bookingType) &&
          (!rule.minBookingAmount || bookingAmount >= rule.minBookingAmount) &&
          (!rule.maxBookingAmount || bookingAmount <= rule.maxBookingAmount)
        );

        // If no agent-specific rule, find a general rule
        if (!applicableRule) {
          applicableRule = rules.find(rule =>
            !rule.agentId &&
            (!rule.bookingType || rule.bookingType === bookingType) &&
            (!rule.minBookingAmount || bookingAmount >= rule.minBookingAmount) &&
            (!rule.maxBookingAmount || bookingAmount <= rule.maxBookingAmount)
          );
        }

        // If no specific rule found, use item-type specific default from settings
        if (!applicableRule) {
          const settingsStore = useSettingsStore.getState();
          const itemRate = bookingType
            ? settingsStore.getCommissionRateForItemType(bookingType)
            : settingsStore.settings.defaultCommissionRate;
          return (bookingAmount * itemRate) / 100;
        }

        let commission = (bookingAmount * applicableRule.commissionRate) / 100;
        if (applicableRule.flatFee) {
          commission += applicableRule.flatFee;
        }

        return commission;
      },

      generateCommissionFromBooking: (bookingData) => {
        const commissionAmount = get().calculateCommission(
          bookingData.agentId,
          bookingData.bookingAmount,
          bookingData.bookingType,
          bookingData.quoteCommissionRate
        );

        const commissionRate = bookingData.quoteCommissionRate ??
          (bookingData.bookingAmount > 0 ? (commissionAmount / bookingData.bookingAmount) * 100 : 0);

        const commissionData = {
          ...bookingData,
          invoiceId: bookingData.invoiceId, // Include invoice link
          commissionRate,
          commissionAmount,
          status: 'pending' as CommissionStatus,
          earnedDate: new Date().toISOString(),
        };

        return get().createCommission(commissionData);
      },

      generateCommissionFromBookingConfirmation: (booking, invoiceId) => {
        // Use default agent ID and name for now - in production this would come from the quote/booking
        const defaultAgentId = 'agent-001';
        const defaultAgentName = 'Travel Agent';

        // Check if booking has quote-specific commission rate
        const quoteCommissionRate = booking.commissionRate;

        // Calculate commission for multi-type bookings by averaging item types
        // In a real system, you'd calculate per-item and sum
        let avgCommissionAmount = 0;

        if (booking.items.length > 0) {
          // Calculate commission for each item and average
          const itemCommissions = booking.items.map((item: any) => {
            const itemAmount = item.details?.totalPrice || (booking.totalAmount / booking.items.length);
            return get().calculateCommission(
              defaultAgentId,
              itemAmount,
              item.type || 'hotel',
              quoteCommissionRate
            );
          });
          avgCommissionAmount = itemCommissions.reduce((sum: number, val: number) => sum + val, 0);
        } else {
          // Fallback to single calculation if no items
          avgCommissionAmount = get().calculateCommission(
            defaultAgentId,
            booking.totalAmount,
            'hotel',
            quoteCommissionRate
          );
        }

        const commissionAmount = avgCommissionAmount;

        const commissionRate = quoteCommissionRate ??
          (booking.totalAmount > 0 ? (commissionAmount / booking.totalAmount) * 100 : 0);

        const commissionData = {
          agentId: defaultAgentId,
          agentName: defaultAgentName,
          bookingId: booking.bookingId,
          quoteId: booking.bookingId, // Use booking ID as quote reference
          customerId: booking.bookingId,
          customerName: booking.customerDetails.name,
          bookingAmount: booking.totalAmount,
          commissionRate,
          commissionAmount,
          status: 'pending' as CommissionStatus,
          earnedDate: booking.createdAt,
        };

        return get().createCommission(commissionData);
      },

      updateCommissionStatus: (id, status) => {
        const updates: Partial<Commission> = { status };

        if (status === 'paid') {
          updates.paidDate = new Date().toISOString();
        }

        get().updateCommission(id, updates);
      },

      approveCommission: (id) => {
        get().updateCommissionStatus(id, 'approved');
      },

      markCommissionAsPaid: (id, paymentMethod) => {
        get().updateCommission(id, {
          status: 'paid',
          paymentMethod,
          paidDate: new Date().toISOString(),
        });
      },

      bulkApproveCommissions: (ids) => {
        ids.forEach(id => get().approveCommission(id));
      },

      bulkMarkAsPaid: (ids, paymentMethod) => {
        ids.forEach(id => get().markCommissionAsPaid(id, paymentMethod));
      },

      createCommissionRule: (ruleData) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const rule: CommissionRule = {
          ...ruleData,
          id,
          createdAt: now,
        };

        set((state) => ({
          commissionRules: [...state.commissionRules, rule],
        }));

        return id;
      },

      updateCommissionRule: (id, updates) => {
        set((state) => ({
          commissionRules: state.commissionRules.map((rule) =>
            rule.id === id ? { ...rule, ...updates } : rule
          ),
        }));
      },

      deleteCommissionRule: (id) => {
        set((state) => ({
          commissionRules: state.commissionRules.filter((rule) => rule.id !== id),
        }));
      },

      getCommissionRuleById: (id) => {
        return get().commissionRules.find((rule) => rule.id === id);
      },

      getActiveCommissionRules: () => {
        return get().commissionRules.filter((rule) => rule.isActive);
      },

      getCommissionsByAgent: (agentId) => {
        return get().commissions.filter((commission) => commission.agentId === agentId);
      },

      getCommissionsByStatus: (status) => {
        return get().commissions.filter((commission) => commission.status === status);
      },

      getCommissionsByDateRange: (startDate, endDate) => {
        return get().commissions.filter((commission) => {
          const earnedDate = commission.earnedDate;
          return earnedDate >= startDate && earnedDate <= endDate;
        });
      },

      getPendingCommissions: () => {
        return get().getCommissionsByStatus('pending');
      },

      getUnpaidCommissions: () => {
        return get().commissions.filter((commission) =>
          commission.status === 'pending' || commission.status === 'approved'
        );
      },

      getCommissionAnalytics: (agentId, startDate, endDate) => {
        let commissions = get().commissions;

        if (agentId) {
          commissions = commissions.filter(c => c.agentId === agentId);
        }

        if (startDate && endDate) {
          commissions = get().getCommissionsByDateRange(startDate, endDate);
          if (agentId) {
            commissions = commissions.filter(c => c.agentId === agentId);
          }
        }

        // Group by agent
        const agentGroups = commissions.reduce((groups, commission) => {
          const agentId = commission.agentId;
          if (!groups[agentId]) {
            groups[agentId] = [];
          }
          groups[agentId].push(commission);
          return groups;
        }, {} as Record<string, Commission[]>);

        return Object.entries(agentGroups).map(([agentId, commissions]) => {
          const totalCommissions = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
          const totalBookings = commissions.length;
          const averageCommission = totalBookings > 0 ? totalCommissions / totalBookings : 0;
          const averageRate = totalBookings > 0
            ? commissions.reduce((sum, c) => sum + c.commissionRate, 0) / totalBookings
            : 0;

          return {
            agentId,
            agentName: commissions[0]?.agentName || 'Unknown',
            totalCommissions,
            totalBookings,
            averageCommission,
            commissionRate: averageRate,
            period: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
          };
        });
      },

      getTotalCommissionsEarned: (agentId, startDate, endDate) => {
        let commissions = get().commissions;

        if (agentId) {
          commissions = commissions.filter(c => c.agentId === agentId);
        }

        if (startDate && endDate) {
          commissions = commissions.filter(c => {
            const earnedDate = c.earnedDate;
            return earnedDate >= startDate && earnedDate <= endDate;
          });
        }

        return commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
      },

      getTotalCommissionsPaid: (agentId, startDate, endDate) => {
        let commissions = get().commissions.filter(c => c.status === 'paid');

        if (agentId) {
          commissions = commissions.filter(c => c.agentId === agentId);
        }

        if (startDate && endDate) {
          commissions = commissions.filter(c => {
            const paidDate = c.paidDate || c.earnedDate;
            return paidDate >= startDate && paidDate <= endDate;
          });
        }

        return commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
      },

      getTotalCommissionsPending: (agentId) => {
        let commissions = get().getUnpaidCommissions();

        if (agentId) {
          commissions = commissions.filter(c => c.agentId === agentId);
        }

        return commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
      },

      getAgentCommissionSummary: (agentId, startDate, endDate) => {
        const agentCommissions = get().getCommissionsByAgent(agentId);

        let filteredCommissions = agentCommissions;
        if (startDate && endDate) {
          filteredCommissions = agentCommissions.filter(c => {
            const earnedDate = c.earnedDate;
            return earnedDate >= startDate && earnedDate <= endDate;
          });
        }

        const totalEarned = filteredCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
        const totalPaid = filteredCommissions
          .filter(c => c.status === 'paid')
          .reduce((sum, c) => sum + c.commissionAmount, 0);
        const totalPending = filteredCommissions
          .filter(c => c.status === 'pending' || c.status === 'approved')
          .reduce((sum, c) => sum + c.commissionAmount, 0);

        const totalBookings = filteredCommissions.length;
        const averageRate = totalBookings > 0
          ? filteredCommissions.reduce((sum, c) => sum + c.commissionRate, 0) / totalBookings
          : 0;

        return {
          totalEarned,
          totalPaid,
          totalPending,
          commissionRate: averageRate,
          totalBookings,
        };
      },

      searchCommissions: (query) => {
        const lowercaseQuery = query.toLowerCase();
        return get().commissions.filter(commission =>
          commission.agentName.toLowerCase().includes(lowercaseQuery) ||
          commission.customerName.toLowerCase().includes(lowercaseQuery) ||
          commission.bookingId.toLowerCase().includes(lowercaseQuery)
        );
      },
    }),
    {
      name: 'commission-storage',
      version: 1,
    }
  )
);