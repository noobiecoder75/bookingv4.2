import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';
import {
  BookingConfirmation,
  EnhancedFlightDetails,
  EnhancedHotelDetails,
  APISearchRequest,
  APISearchResponse
} from '@/types/booking';

type Tables = Database['public']['Tables'];

interface BookingStoreSupabase {
  // Local cache for offline support
  localBookings: Tables['bookings']['Row'][];
  localQuotes: Tables['quotes']['Row'][];

  // Sync status
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncTime: Date | null;

  // Actions - Bookings
  createBooking: (bookingData: Omit<Tables['bookings']['Insert'], 'id'>) => Promise<string>;
  updateBooking: (id: string, updates: Tables['bookings']['Update']) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  syncBookings: () => Promise<void>;

  // Actions - Quotes
  createQuote: (quoteData: Omit<Tables['quotes']['Insert'], 'id'>) => Promise<string>;
  updateQuote: (id: string, updates: Tables['quotes']['Update']) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  syncQuotes: () => Promise<void>;

  // Actions - General
  syncAll: () => Promise<void>;
  clearLocalCache: () => void;
}

export const useBookingStoreSupabase = create<BookingStoreSupabase>()(
  persist(
    (set, get) => ({
      localBookings: [],
      localQuotes: [],
      syncStatus: 'idle',
      lastSyncTime: null,

      createBooking: async (bookingData) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { data, error } = await supabase
            .from('bookings')
            .insert(bookingData)
            .select()
            .single();

          if (error) throw error;

          // Update local cache
          set((state) => ({
            localBookings: [...state.localBookings, data],
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));

          return data.id;
        } catch (error) {
          console.error('Failed to create booking:', error);
          set({ syncStatus: 'error' });

          // Fallback to local storage
          const localBooking = {
            ...bookingData,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Tables['bookings']['Row'];

          set((state) => ({
            localBookings: [...state.localBookings, localBooking],
          }));

          return localBooking.id;
        }
      },

      updateBooking: async (id, updates) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { data, error } = await supabase
            .from('bookings')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          // Update local cache
          set((state) => ({
            localBookings: state.localBookings.map((booking) =>
              booking.id === id ? data : booking
            ),
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));
        } catch (error) {
          console.error('Failed to update booking:', error);
          set({ syncStatus: 'error' });

          // Update local cache only
          set((state) => ({
            localBookings: state.localBookings.map((booking) =>
              booking.id === id ? { ...booking, ...updates } : booking
            ),
          }));
        }
      },

      deleteBooking: async (id) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', id);

          if (error) throw error;

          // Update local cache
          set((state) => ({
            localBookings: state.localBookings.filter((booking) => booking.id !== id),
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));
        } catch (error) {
          console.error('Failed to delete booking:', error);
          set({ syncStatus: 'error' });

          // Update local cache only
          set((state) => ({
            localBookings: state.localBookings.filter((booking) => booking.id !== id),
          }));
        }
      },

      syncBookings: async () => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          set({
            localBookings: data || [],
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          });
        } catch (error) {
          console.error('Failed to sync bookings:', error);
          set({ syncStatus: 'error' });
        }
      },

      createQuote: async (quoteData) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { data, error } = await supabase
            .from('quotes')
            .insert(quoteData)
            .select()
            .single();

          if (error) throw error;

          // Update local cache
          set((state) => ({
            localQuotes: [...state.localQuotes, data],
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));

          return data.id;
        } catch (error) {
          console.error('Failed to create quote:', error);
          set({ syncStatus: 'error' });

          // Fallback to local storage
          const localQuote = {
            ...quoteData,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Tables['quotes']['Row'];

          set((state) => ({
            localQuotes: [...state.localQuotes, localQuote],
          }));

          return localQuote.id;
        }
      },

      updateQuote: async (id, updates) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { data, error } = await supabase
            .from('quotes')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          // Update local cache
          set((state) => ({
            localQuotes: state.localQuotes.map((quote) =>
              quote.id === id ? data : quote
            ),
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));
        } catch (error) {
          console.error('Failed to update quote:', error);
          set({ syncStatus: 'error' });

          // Update local cache only
          set((state) => ({
            localQuotes: state.localQuotes.map((quote) =>
              quote.id === id ? { ...quote, ...updates } : quote
            ),
          }));
        }
      },

      deleteQuote: async (id) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { error } = await supabase
            .from('quotes')
            .delete()
            .eq('id', id);

          if (error) throw error;

          // Update local cache
          set((state) => ({
            localQuotes: state.localQuotes.filter((quote) => quote.id !== id),
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));
        } catch (error) {
          console.error('Failed to delete quote:', error);
          set({ syncStatus: 'error' });

          // Update local cache only
          set((state) => ({
            localQuotes: state.localQuotes.filter((quote) => quote.id !== id),
          }));
        }
      },

      syncQuotes: async () => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data, error } = await supabase
            .from('quotes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          set({
            localQuotes: data || [],
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          });
        } catch (error) {
          console.error('Failed to sync quotes:', error);
          set({ syncStatus: 'error' });
        }
      },

      syncAll: async () => {
        await Promise.all([
          get().syncBookings(),
          get().syncQuotes(),
        ]);
      },

      clearLocalCache: () => {
        set({
          localBookings: [],
          localQuotes: [],
          syncStatus: 'idle',
          lastSyncTime: null,
        });
      },
    }),
    {
      name: 'booking-store-supabase',
      partialize: (state) => ({
        localBookings: state.localBookings,
        localQuotes: state.localQuotes,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);