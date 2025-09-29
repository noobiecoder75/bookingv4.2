import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppSettings {
  // Commission settings
  defaultCommissionRate: number; // Global fallback percentage
  flightCommissionRate: number; // Default for flights
  hotelCommissionRate: number; // Default for hotels
  activityCommissionRate: number; // Default for activities
  transferCommissionRate: number; // Default for transfers
  minCommissionRate: number; // minimum allowed commission
  maxCommissionRate: number; // maximum allowed commission

  // Company settings
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;

  // Booking & Business settings
  defaultPaymentTerms: number; // days (e.g., 30)
  autoQuoteExpiry: number; // days quotes remain valid
  requireApprovalAbove: number; // amount requiring manager approval
  maxDiscountPercent: number; // maximum discount agents can apply

  // Travel-specific settings
  defaultTravelInsurance: boolean;
  emergencyContactRequired: boolean;
  passportExpiryWarning: number; // months before expiry to warn
  visaReminderDays: number; // days before travel to remind about visa

  // Notification settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  customerAutoEmails: boolean;
  agentDailyDigest: boolean;

  // System settings
  currency: string;
  timezone: string;
  dateFormat: string;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  dataRetentionMonths: number;
  auditLogLevel: 'basic' | 'detailed' | 'verbose';
}

interface SettingsStore {
  settings: AppSettings;

  // Settings management
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetToDefaults: () => void;

  // Commission specific helpers
  updateCommissionSettings: (updates: {
    defaultCommissionRate?: number;
    flightCommissionRate?: number;
    hotelCommissionRate?: number;
    activityCommissionRate?: number;
    transferCommissionRate?: number;
    minCommissionRate?: number;
    maxCommissionRate?: number;
  }) => void;

  // Validation helpers
  isValidCommissionRate: (rate: number) => boolean;
  getCommissionBounds: () => { min: number; max: number };
  getCommissionRateForItemType: (itemType: 'flight' | 'hotel' | 'activity' | 'transfer') => number;
}

const defaultSettings: AppSettings = {
  // Commission defaults
  defaultCommissionRate: 10,
  flightCommissionRate: 8, // Airlines typically offer lower commissions
  hotelCommissionRate: 12, // Hotels offer higher commissions
  activityCommissionRate: 15, // Tour operators offer highest commissions
  transferCommissionRate: 10, // Transport services standard rate
  minCommissionRate: 0,
  maxCommissionRate: 50,

  // Company defaults
  companyName: 'Travel Agency',
  companyEmail: 'info@travelagency.com',
  companyPhone: '+1 (555) 123-4567',
  companyAddress: '123 Business St, City, State 12345',

  // Booking & Business defaults
  defaultPaymentTerms: 30, // 30 days payment terms
  autoQuoteExpiry: 14, // 2 weeks quote validity
  requireApprovalAbove: 10000, // $10,000 approval threshold
  maxDiscountPercent: 15, // 15% maximum discount

  // Travel-specific defaults
  defaultTravelInsurance: true,
  emergencyContactRequired: true,
  passportExpiryWarning: 6, // 6 months warning
  visaReminderDays: 30, // 30 days before travel

  // Notification defaults
  emailNotifications: true,
  smsNotifications: false,
  customerAutoEmails: true,
  agentDailyDigest: true,

  // System defaults
  currency: 'USD',
  timezone: 'America/New_York',
  dateFormat: 'MM/DD/YYYY',
  backupFrequency: 'daily',
  dataRetentionMonths: 24,
  auditLogLevel: 'detailed',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      resetToDefaults: () => {
        set({ settings: defaultSettings });
      },

      updateCommissionSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      isValidCommissionRate: (rate) => {
        const { settings } = get();
        return rate >= settings.minCommissionRate && rate <= settings.maxCommissionRate;
      },

      getCommissionBounds: () => {
        const { settings } = get();
        return {
          min: settings.minCommissionRate,
          max: settings.maxCommissionRate,
        };
      },

      getCommissionRateForItemType: (itemType) => {
        const { settings } = get();
        switch (itemType) {
          case 'flight':
            return settings.flightCommissionRate;
          case 'hotel':
            return settings.hotelCommissionRate;
          case 'activity':
            return settings.activityCommissionRate;
          case 'transfer':
            return settings.transferCommissionRate;
          default:
            return settings.defaultCommissionRate;
        }
      },
    }),
    {
      name: 'app-settings',
      version: 1,
    }
  )
);