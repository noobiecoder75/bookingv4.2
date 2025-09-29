import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TravelQuote, TravelItem, CalendarEvent } from '@/types';
import { generateClientQuoteLink, generatePreviewLink } from '@/lib/client-links';

interface QuoteStats {
  totalQuotes: number;
  draftQuotes: number;
  sentQuotes: number;
  acceptedQuotes: number;
  rejectedQuotes: number;
  totalRevenue: number;
  averageQuoteValue: number;
}

interface QuoteStore {
  quotes: TravelQuote[];
  currentQuote: TravelQuote | null;
  addQuote: (quote: Omit<TravelQuote, 'id' | 'createdAt'>) => string;
  updateQuote: (id: string, updates: Partial<TravelQuote>) => void;
  deleteQuote: (id: string) => void;
  getQuoteById: (id: string) => TravelQuote | undefined;
  getQuotesByContact: (contactId: string) => TravelQuote[];
  setCurrentQuote: (quote: TravelQuote | null) => void;
  addItemToQuote: (quoteId: string, item: Omit<TravelItem, 'id'>) => void;
  updateItemInQuote: (quoteId: string, itemId: string, updates: Partial<TravelItem>) => void;
  removeItemFromQuote: (quoteId: string, itemId: string) => void;
  calculateQuoteTotal: (quoteId: string) => number;
  getCalendarEvents: (contactId?: string) => CalendarEvent[];
  // Dashboard methods
  getQuotesByStatus: (status: TravelQuote['status']) => TravelQuote[];
  getQuotesByDateRange: (startDate: Date, endDate: Date) => TravelQuote[];
  getQuotesStats: () => QuoteStats;
  duplicateQuote: (quoteId: string) => string | null;
  updateQuoteStatus: (quoteId: string, status: TravelQuote['status']) => void;
  searchQuotes: (query: string) => TravelQuote[];
  // Client link methods
  generateClientLink: (quoteId: string) => string | null;
  generatePreviewLink: (quoteId: string) => string | null;
  sendQuoteToClient: (quoteId: string) => Promise<boolean>;

  // Invoice generation
  generateInvoiceFromAcceptedQuote: (quoteId: string) => string | null;
}

export const useQuoteStore = create<QuoteStore>()(
  persist(
    (set, get) => ({
      quotes: [],
      currentQuote: null,
      
      addQuote: (quoteData) => {
        const newQuote: TravelQuote = {
          ...quoteData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };
        set((state) => ({
          quotes: [...state.quotes, newQuote],
        }));
        return newQuote.id;
      },
      
      updateQuote: (id, updates) => {
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === id ? { ...quote, ...updates } : quote
          ),
          currentQuote: state.currentQuote?.id === id 
            ? { ...state.currentQuote, ...updates } 
            : state.currentQuote,
        }));
      },
      
      deleteQuote: (id) => {
        set((state) => ({
          quotes: state.quotes.filter((quote) => quote.id !== id),
          currentQuote: state.currentQuote?.id === id ? null : state.currentQuote,
        }));
      },
      
      getQuoteById: (id) => {
        return get().quotes.find((quote) => quote.id === id);
      },
      
      getQuotesByContact: (contactId) => {
        return get().quotes.filter((quote) => quote.contactId === contactId);
      },
      
      setCurrentQuote: (quote) => {
        set({ currentQuote: quote });
      },
      
      addItemToQuote: (quoteId, itemData) => {
        const newItem: TravelItem = {
          ...itemData,
          id: crypto.randomUUID(),
        };
        
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === quoteId
              ? { ...quote, items: [...quote.items, newItem] }
              : quote
          ),
        }));
        
        // Recalculate total
        get().calculateQuoteTotal(quoteId);
      },
      
      updateItemInQuote: (quoteId, itemId, updates) => {
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === quoteId
              ? {
                  ...quote,
                  items: quote.items.map((item) =>
                    item.id === itemId ? { ...item, ...updates } : item
                  ),
                }
              : quote
          ),
        }));
        
        // Recalculate total
        get().calculateQuoteTotal(quoteId);
      },
      
      removeItemFromQuote: (quoteId, itemId) => {
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === quoteId
              ? {
                  ...quote,
                  items: quote.items.filter((item) => item.id !== itemId),
                }
              : quote
          ),
        }));
        
        // Recalculate total
        get().calculateQuoteTotal(quoteId);
      },
      
      calculateQuoteTotal: (quoteId) => {
        const quote = get().getQuoteById(quoteId);
        if (!quote) return 0;
        
        const total = quote.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        
        get().updateQuote(quoteId, { totalCost: total });
        return total;
      },
      
      getCalendarEvents: (contactId) => {
        const { quotes } = get();
        const filteredQuotes = contactId 
          ? quotes.filter(quote => quote.contactId === contactId)
          : quotes;
        
        return filteredQuotes.flatMap(quote =>
          quote.items.map(item => ({
            id: item.id,
            title: item.name,
            start: new Date(item.startDate),
            end: new Date(item.endDate || item.startDate),
            resource: {
              type: item.type,
              contactId: quote.contactId,
              quoteId: quote.id,
              details: item.details,
            },
          }))
        );
      },

      // Dashboard methods
      getQuotesByStatus: (status) => {
        return get().quotes.filter(quote => quote.status === status);
      },

      getQuotesByDateRange: (startDate, endDate) => {
        return get().quotes.filter(quote => {
          const quoteDate = new Date(quote.createdAt);
          return quoteDate >= startDate && quoteDate <= endDate;
        });
      },

      getQuotesStats: () => {
        const { quotes } = get();
        const stats = quotes.reduce(
          (acc, quote) => {
            acc.totalQuotes++;
            acc[`${quote.status}Quotes`]++;
            if (quote.status === 'accepted') {
              acc.totalRevenue += quote.totalCost;
            }
            return acc;
          },
          {
            totalQuotes: 0,
            draftQuotes: 0,
            sentQuotes: 0,
            acceptedQuotes: 0,
            rejectedQuotes: 0,
            totalRevenue: 0,
          }
        );
        
        return {
          ...stats,
          averageQuoteValue: stats.totalQuotes > 0 
            ? quotes.reduce((sum, quote) => sum + quote.totalCost, 0) / stats.totalQuotes
            : 0,
        };
      },

      duplicateQuote: (quoteId) => {
        const originalQuote = get().getQuoteById(quoteId);
        if (!originalQuote) return null;

        const duplicatedQuote = {
          ...originalQuote,
          title: `${originalQuote.title} (Copy)`,
          status: 'draft' as const,
        };

        // Remove id and createdAt to let addQuote generate new ones
        const { id, createdAt, ...quoteData } = duplicatedQuote;
        return get().addQuote(quoteData);
      },

      updateQuoteStatus: (quoteId, status) => {
        get().updateQuote(quoteId, { status });
      },

      searchQuotes: (query) => {
        const { quotes } = get();
        if (!query.trim()) return quotes;
        
        const lowercaseQuery = query.toLowerCase();
        return quotes.filter(quote =>
          quote.title.toLowerCase().includes(lowercaseQuery) ||
          quote.items.some(item => item.name.toLowerCase().includes(lowercaseQuery))
        );
      },

      // Client link methods
      generateClientLink: (quoteId) => {
        const quote = get().getQuoteById(quoteId);
        if (!quote) return null;
        return generateClientQuoteLink(quote);
      },

      generatePreviewLink: (quoteId) => {
        const quote = get().getQuoteById(quoteId);
        if (!quote) return null;
        return generatePreviewLink(quote);
      },

      sendQuoteToClient: async (quoteId) => {
        const quote = get().getQuoteById(quoteId);
        if (!quote) return false;

        try {
          // Update status to sent
          get().updateQuoteStatus(quoteId, 'sent');

          // In a real implementation, this would:
          // 1. Generate a secure client link
          // 2. Send an email to the client with the link
          // 3. Log the action for audit purposes

          console.log('Quote sent to client:', {
            quoteId,
            clientLink: generateClientQuoteLink(quote)
          });

          return true;
        } catch (error) {
          console.error('Failed to send quote to client:', error);
          return false;
        }
      },

      generateInvoiceFromAcceptedQuote: (quoteId) => {
        const quote = get().getQuoteById(quoteId);
        if (!quote) return null;

        if (quote.status !== 'accepted') {
          console.warn('Cannot generate invoice for non-accepted quote');
          return null;
        }

        try {
          // For now, just return a placeholder ID to avoid circular dependencies
          // The finances page will handle this differently
          console.log('Invoice generation requested for quote:', quoteId);
          return crypto.randomUUID();
        } catch (error) {
          console.error('Failed to generate invoice from quote:', error);
          return null;
        }
      },
    }),
    {
      name: 'quote-store',
    }
  )
);