import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Rate, RateType, HotelRate, ActivityRate, TransferRate } from '@/types/rate';

interface RateStore {
  rates: Rate[];

  // CRUD operations
  addRate: (rateData: Omit<Rate, 'id' | 'createdAt' | 'updatedAt'>) => string;
  addRates: (ratesData: Omit<Rate, 'id' | 'createdAt' | 'updatedAt'>[]) => string[];
  updateRate: (id: string, updates: Partial<Rate>) => void;
  deleteRate: (id: string) => void;
  deleteRates: (ids: string[]) => void;
  getRateById: (id: string) => Rate | undefined;

  // Querying
  getRatesByType: (type: RateType) => Rate[];
  getRatesBySupplier: (supplier: string) => Rate[];
  getRatesByProperty: (propertyName: string) => HotelRate[];
  getRatesByLocation: (location: string) => (ActivityRate | TransferRate)[];
  getRatesByDateRange: (startDate: string, endDate: string) => Rate[];
  searchRates: (query: string) => Rate[];

  // Utility
  clearAllRates: () => void;
  getTotalRates: () => number;
  getRateCountByType: () => { hotel: number; activity: number; transfer: number };
}

export const useRateStore = create<RateStore>()(
  persist(
    (set, get) => ({
      rates: [],

      addRate: (rateData) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const rate: Rate = {
          ...rateData,
          id,
          createdAt: now,
          updatedAt: now,
        } as Rate;

        set((state) => ({
          rates: [...state.rates, rate],
        }));

        return id;
      },

      addRates: (ratesData) => {
        const now = new Date().toISOString();
        const newRates: Rate[] = ratesData.map((rateData) => ({
          ...rateData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        } as Rate));

        set((state) => ({
          rates: [...state.rates, ...newRates],
        }));

        return newRates.map((r) => r.id);
      },

      updateRate: (id, updates) => {
        set((state) => ({
          rates: state.rates.map((rate) =>
            rate.id === id
              ? { ...rate, ...updates, updatedAt: new Date().toISOString() }
              : rate
          ),
        }));
      },

      deleteRate: (id) => {
        set((state) => ({
          rates: state.rates.filter((rate) => rate.id !== id),
        }));
      },

      deleteRates: (ids) => {
        const idsSet = new Set(ids);
        set((state) => ({
          rates: state.rates.filter((rate) => !idsSet.has(rate.id)),
        }));
      },

      getRateById: (id) => {
        return get().rates.find((rate) => rate.id === id);
      },

      getRatesByType: (type) => {
        return get().rates.filter((rate) => rate.type === type);
      },

      getRatesBySupplier: (supplier) => {
        const query = supplier.toLowerCase();
        return get().rates.filter((rate) =>
          rate.supplier.toLowerCase().includes(query)
        );
      },

      getRatesByProperty: (propertyName) => {
        const query = propertyName.toLowerCase();
        return get().rates.filter((rate) => {
          if (rate.type === 'hotel') {
            return rate.propertyName.toLowerCase().includes(query);
          }
          return false;
        }) as HotelRate[];
      },

      getRatesByLocation: (location) => {
        const query = location.toLowerCase();
        return get().rates.filter((rate) => {
          if (rate.type === 'activity') {
            return rate.location.toLowerCase().includes(query);
          } else if (rate.type === 'transfer') {
            return (
              rate.from.toLowerCase().includes(query) ||
              rate.to.toLowerCase().includes(query)
            );
          }
          return false;
        }) as (ActivityRate | TransferRate)[];
      },

      getRatesByDateRange: (startDate, endDate) => {
        return get().rates.filter((rate) => {
          const rateStart = new Date(rate.startDate);
          const rateEnd = new Date(rate.endDate);
          const searchStart = new Date(startDate);
          const searchEnd = new Date(endDate);

          // Check if date ranges overlap
          return rateStart <= searchEnd && rateEnd >= searchStart;
        });
      },

      searchRates: (query) => {
        const searchQuery = query.toLowerCase();
        return get().rates.filter((rate) => {
          // Common searchable fields
          const commonMatch = rate.supplier.toLowerCase().includes(searchQuery);

          // Type-specific searchable fields
          if (rate.type === 'hotel') {
            return (
              commonMatch ||
              rate.propertyName.toLowerCase().includes(searchQuery) ||
              rate.propertyCode?.toLowerCase().includes(searchQuery) ||
              rate.roomType.toLowerCase().includes(searchQuery)
            );
          } else if (rate.type === 'activity') {
            return (
              commonMatch ||
              rate.activityName.toLowerCase().includes(searchQuery) ||
              rate.location.toLowerCase().includes(searchQuery) ||
              rate.category?.toLowerCase().includes(searchQuery)
            );
          } else if (rate.type === 'transfer') {
            return (
              commonMatch ||
              rate.from.toLowerCase().includes(searchQuery) ||
              rate.to.toLowerCase().includes(searchQuery) ||
              rate.vehicleType.toLowerCase().includes(searchQuery)
            );
          }

          return false;
        });
      },

      clearAllRates: () => {
        set({ rates: [] });
      },

      getTotalRates: () => {
        return get().rates.length;
      },

      getRateCountByType: () => {
        const rates = get().rates;
        return {
          hotel: rates.filter((r) => r.type === 'hotel').length,
          activity: rates.filter((r) => r.type === 'activity').length,
          transfer: rates.filter((r) => r.type === 'transfer').length,
        };
      },
    }),
    {
      name: 'rate-storage',
      version: 1,
    }
  )
);
