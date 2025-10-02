import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  BookingConfirmation,
  EnhancedFlightDetails,
  EnhancedHotelDetails,
  APISearchRequest,
  APISearchResponse
} from '@/types/booking';
import { flightService } from '@/services/flight-api';
import { hotelService } from '@/services/hotel-api';

interface SearchHistory {
  id: string;
  type: 'flight' | 'hotel' | 'activity' | 'transfer';
  searchParams: APISearchRequest;
  results: number;
  timestamp: Date;
}

interface BookingStore {
  // Search & Results
  searchHistory: SearchHistory[];
  cachedSearchResults: Record<string, APISearchResponse<unknown>>;
  currentSearchId: string | null;
  
  // Bookings
  bookingConfirmations: BookingConfirmation[];
  pendingBookings: Array<{
    id: string;
    items: Array<EnhancedFlightDetails | EnhancedHotelDetails>;
    status: 'pending' | 'processing' | 'confirmed' | 'failed';
  }>;
  
  // Actions - Search
  searchFlights: (request: APISearchRequest) => Promise<APISearchResponse<EnhancedFlightDetails>>;
  searchHotels: (request: APISearchRequest) => Promise<APISearchResponse<EnhancedHotelDetails>>;
  addToSearchHistory: (search: Omit<SearchHistory, 'id' | 'timestamp'>) => void;
  getCachedResults: (searchId: string) => APISearchResponse<unknown> | undefined;
  
  // Actions - Booking
  createBooking: (items: Array<EnhancedFlightDetails | EnhancedHotelDetails>) => Promise<string>;
  confirmBooking: (bookingId: string, paymentDetails: unknown) => Promise<BookingConfirmation>;
  getBookingConfirmation: (bookingId: string) => BookingConfirmation | undefined;
  cancelBooking: (bookingId: string) => Promise<boolean>;
  
  // Actions - State Management
  clearSearchCache: () => void;
  clearSearchHistory: () => void;
}

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      // Initial State
      searchHistory: [],
      cachedSearchResults: {},
      currentSearchId: null,
      bookingConfirmations: [],
      pendingBookings: [],
      
      // Search Actions
      searchFlights: async (request) => {
        const response = await flightService.searchFlights(request);

        if (response.success && response.metadata) {
          const { searchId } = response.metadata;

          // Cache results
          set((state) => ({
            cachedSearchResults: { ...state.cachedSearchResults, [searchId]: response },
            currentSearchId: searchId,
          }));

          // Add to history
          get().addToSearchHistory({
            type: 'flight',
            searchParams: request,
            results: response.data?.length || 0,
          });
        }

        return response;
      },
      
      searchHotels: async (request) => {
        const response = await hotelService.searchHotels(request);

        if (response.success && response.metadata) {
          const { searchId } = response.metadata;

          // Cache results
          set((state) => ({
            cachedSearchResults: { ...state.cachedSearchResults, [searchId]: response },
            currentSearchId: searchId,
          }));

          // Add to history
          get().addToSearchHistory({
            type: 'hotel',
            searchParams: request,
            results: response.data?.length || 0,
          });
        }

        return response;
      },
      
      addToSearchHistory: (search) => {
        const newSearch: SearchHistory = {
          ...search,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };
        
        set((state) => ({
          searchHistory: [newSearch, ...state.searchHistory].slice(0, 20), // Keep last 20 searches
        }));
      },
      
      getCachedResults: (searchId) => {
        return get().cachedSearchResults[searchId];
      },
      
      // Booking Actions
      createBooking: async (items) => {
        const bookingId = crypto.randomUUID();

        const pendingBooking = {
          id: bookingId,
          items,
          status: 'pending' as const,
        };

        set((state) => ({
          pendingBookings: [...state.pendingBookings, pendingBooking],
        }));

        // In production, this would call actual booking APIs
        // For now, simulate processing with cleanup capability
        const timeoutId = setTimeout(() => {
          // Check if booking still exists before updating
          const currentBookings = get().pendingBookings;
          if (currentBookings.find(b => b.id === bookingId)) {
            set((state) => ({
              pendingBookings: state.pendingBookings.map((booking) =>
                booking.id === bookingId
                  ? { ...booking, status: 'processing' as const }
                  : booking
              ),
            }));
          }
        }, 1000);

        // Store timeout ID for potential cleanup (could be enhanced with a timeouts map)
        return bookingId;
      },
      
      confirmBooking: async (bookingId, _paymentDetails) => {
        // Simulate booking confirmation
        const pendingBooking = get().pendingBookings.find((b) => b.id === bookingId);

        if (!pendingBooking) {
          throw new Error('Booking not found');
        }

        const confirmation: BookingConfirmation = {
          bookingId,
          bookingReference: `REF-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          items: pendingBooking.items.map((item) => ({
            type: 'flightType' in item ? 'flight' : 'hotel',
            confirmationNumber: `CNF-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
            details: item,
          })),
          totalAmount: pendingBooking.items.reduce((sum, item) => {
            if ('totalPrice' in item) {
              return sum + item.totalPrice;
            }
            return sum;
          }, 0),
          paymentStatus: 'paid',
          customerDetails: {
            name: 'John Doe', // In production, get from user profile
            email: 'john@example.com',
            phone: '+1234567890',
          },
        };

        set((state) => ({
          bookingConfirmations: [...state.bookingConfirmations, confirmation],
          pendingBookings: state.pendingBookings.filter((b) => b.id !== bookingId),
        }));

        // Auto-generate invoice from booking confirmation with transaction-like behavior
        let invoiceId: string | null = null;
        let commissionId: string | null = null;

        try {
          const { useInvoiceStore } = await import('./invoice-store');
          const { useCommissionStore } = await import('./commission-store');

          const invoiceStore = useInvoiceStore.getState();
          const commissionStore = useCommissionStore.getState();

          // Generate invoice from booking
          invoiceId = invoiceStore.generateInvoiceFromBooking(confirmation);
          if (!invoiceId) {
            throw new Error('Invoice generation failed - no invoice ID returned');
          }

          // Generate commission record if invoice was created
          commissionId = commissionStore.generateCommissionFromBookingConfirmation(confirmation, invoiceId);
          if (!commissionId) {
            throw new Error('Commission generation failed - no commission ID returned');
          }

          console.log('✅ Successfully generated invoice and commission for booking:', {
            bookingId: confirmation.bookingId,
            invoiceId,
            commissionId
          });

        } catch (error) {
          console.error('❌ Failed to auto-generate invoice/commission:', error);

          // Rollback: Delete invoice if it was created but commission failed
          if (invoiceId && !commissionId) {
            try {
              const { useInvoiceStore } = await import('./invoice-store');
              useInvoiceStore.getState().deleteInvoice(invoiceId);
              console.log('⚠️ Rolled back invoice due to commission generation failure');
            } catch (rollbackError) {
              console.error('❌ Rollback failed:', rollbackError);
            }
          }

          // Don't throw - log error but allow booking confirmation to proceed
          // In production, you might want to queue this for retry or alert admin
          console.warn('⚠️ Booking confirmed but financial records may be incomplete. Manual reconciliation may be required.');
        }

        return confirmation;
      },
      
      getBookingConfirmation: (bookingId) => {
        return get().bookingConfirmations.find((b) => b.bookingId === bookingId);
      },
      
      cancelBooking: async (bookingId) => {
        // In production, call cancellation API
        set((state) => ({
          bookingConfirmations: state.bookingConfirmations.map((booking) =>
            booking.bookingId === bookingId
              ? { ...booking, status: 'cancelled' as const, paymentStatus: 'refunded' as const }
              : booking
          ),
        }));
        
        return true;
      },
      
      // State Management
      clearSearchCache: () => {
        set({
          cachedSearchResults: {},
          currentSearchId: null,
        });
      },
      
      clearSearchHistory: () => {
        set({ searchHistory: [] });
      },
    }),
    {
      name: 'booking-store',
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        bookingConfirmations: state.bookingConfirmations,
      }),
    }
  )
);