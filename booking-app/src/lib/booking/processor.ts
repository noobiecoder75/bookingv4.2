import { useTaskStore } from '@/store/task-store';
import { useQuoteStore } from '@/store/quote-store';

/**
 * Booking Processor - Handles hybrid booking logic
 * Splits quote items into API bookings vs manual tasks
 */

export type BookingSource = 'api_hotelbeds' | 'api_amadeus' | 'api_sabre' | 'offline_platform' | 'offline_agent';

export interface QuoteItem {
  id: string;
  type: 'flight' | 'hotel' | 'activity' | 'transfer';
  name: string;
  supplierSource: BookingSource;
  details: any;
  price: number;
}

export interface Quote {
  id: string;
  customerId: string;
  customerName: string;
  items: QuoteItem[];
  totalCost: number;
}

export interface BookingResult {
  success: boolean;
  apiBookings: {
    itemId: string;
    status: 'success' | 'failed';
    confirmationNumber?: string;
    error?: string;
  }[];
  manualTasks: {
    itemId: string;
    taskIds: string[];
  }[];
  summary: {
    totalItems: number;
    apiSuccess: number;
    apiFailed: number;
    manualTasks: number;
  };
}

/**
 * Process booking for a quote - handles both API and offline items
 */
export async function processHybridBooking(
  quote: Quote,
  paymentId: string
): Promise<BookingResult> {
  const result: BookingResult = {
    success: false,
    apiBookings: [],
    manualTasks: [],
    summary: {
      totalItems: quote.items.length,
      apiSuccess: 0,
      apiFailed: 0,
      manualTasks: 0,
    },
  };

  // Split items by source
  const { apiItems, offlineItems } = splitItemsBySource(quote.items);

  // Process API items (auto-booking)
  for (const item of apiItems) {
    try {
      const bookingResult = await bookAPIItem(item, quote);

      if (bookingResult.success) {
        result.apiBookings.push({
          itemId: item.id,
          status: 'success',
          confirmationNumber: bookingResult.confirmationNumber,
        });
        result.summary.apiSuccess++;
      } else {
        result.apiBookings.push({
          itemId: item.id,
          status: 'failed',
          error: bookingResult.error,
        });
        result.summary.apiFailed++;

        // Create manual task as fallback
        const taskIds = createManualBookingTasks(item, quote);
        result.manualTasks.push({ itemId: item.id, taskIds });
        result.summary.manualTasks++;
      }
    } catch (error: any) {
      result.apiBookings.push({
        itemId: item.id,
        status: 'failed',
        error: error.message,
      });
      result.summary.apiFailed++;

      // Create manual task as fallback
      const taskIds = createManualBookingTasks(item, quote);
      result.manualTasks.push({ itemId: item.id, taskIds });
      result.summary.manualTasks++;
    }
  }

  // Process offline items (create tasks)
  for (const item of offlineItems) {
    const taskIds = createManualBookingTasks(item, quote);
    result.manualTasks.push({ itemId: item.id, taskIds });
    result.summary.manualTasks++;
  }

  // Determine overall success (at least some bookings succeeded or tasks created)
  result.success =
    result.summary.apiSuccess > 0 ||
    result.summary.manualTasks > 0;

  return result;
}

/**
 * Split items into API vs offline categories
 */
function splitItemsBySource(items: QuoteItem[]): {
  apiItems: QuoteItem[];
  offlineItems: QuoteItem[];
} {
  const apiSources: BookingSource[] = ['api_hotelbeds', 'api_amadeus', 'api_sabre'];

  const apiItems = items.filter((item) =>
    apiSources.includes(item.supplierSource)
  );

  const offlineItems = items.filter((item) =>
    !apiSources.includes(item.supplierSource)
  );

  return { apiItems, offlineItems };
}

/**
 * Book an API item (calls appropriate API)
 */
async function bookAPIItem(
  item: QuoteItem,
  quote: Quote
): Promise<{ success: boolean; confirmationNumber?: string; error?: string }> {
  // Route to appropriate API based on source
  switch (item.supplierSource) {
    case 'api_hotelbeds':
      return bookHotelBedsItem(item, quote);

    case 'api_amadeus':
      return bookAmadeusItem(item, quote);

    case 'api_sabre':
      return bookSabreItem(item, quote);

    default:
      return { success: false, error: 'Unknown API source' };
  }
}

/**
 * Book HotelBeds item via API
 */
async function bookHotelBedsItem(
  item: QuoteItem,
  quote: Quote
): Promise<{ success: boolean; confirmationNumber?: string; error?: string }> {
  try {
    // Prepare booking request
    const bookingRequest = {
      quoteItemId: item.id,
      hotelCode: item.details?.hotelCode || 'TEST_HOTEL',
      rateKey: item.details?.rateKey || generateMockRateKey(),
      holder: {
        firstName: quote.customerName.split(' ')[0] || 'Test',
        lastName: quote.customerName.split(' ')[1] || 'Customer',
      },
      clientReference: `${quote.id}-${item.id}`,
      remark: `Booking for quote ${quote.id}`,
    };

    // Call our HotelBeds booking endpoint
    const response = await fetch('/api/bookings/hotel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingRequest),
    });

    const data = await response.json();

    if (data.success) {
      // Auto-create supplier expense after successful booking
      await createSupplierExpense(item, quote);

      return {
        success: true,
        confirmationNumber: data.bookingConfirmation?.confirmationNumber,
      };
    } else {
      return {
        success: false,
        error: data.error,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Book Amadeus item (stub - implement when Amadeus credentials available)
 */
async function bookAmadeusItem(
  item: QuoteItem,
  quote: Quote
): Promise<{ success: boolean; confirmationNumber?: string; error?: string }> {
  return {
    success: false,
    error: 'Amadeus API not yet implemented',
  };
}

/**
 * Book Sabre item (stub - implement when Sabre credentials available)
 */
async function bookSabreItem(
  item: QuoteItem,
  quote: Quote
): Promise<{ success: boolean; confirmationNumber?: string; error?: string }> {
  return {
    success: false,
    error: 'Sabre API not yet implemented',
  };
}

/**
 * Create manual booking tasks for offline items or failed API items
 */
function createManualBookingTasks(item: QuoteItem, quote: Quote): string[] {
  const taskStore = useTaskStore.getState();

  const taskIds = taskStore.generateTasksFromQuoteItem({
    id: item.id,
    quoteId: quote.id,
    type: item.type,
    name: item.name,
    supplierSource: item.supplierSource,
    details: item.details,
    customerId: quote.customerId,
    customerName: quote.customerName,
  });

  return taskIds;
}

/**
 * Generate mock rate key for testing
 */
function generateMockRateKey(): string {
  return `MOCK_RATE_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Create supplier expense after successful booking
 * This tracks what we pay to the supplier (HotelBeds, etc.)
 */
async function createSupplierExpense(item: QuoteItem, quote: Quote): Promise<void> {
  try {
    const { useExpenseStore } = await import('@/store/expense-store');

    // Get supplier cost from item (populated during quote creation)
    const supplierCost = (item as any).supplierCost || item.price * 0.80; // Fallback: 80% of price

    const expense = {
      category: 'supplier_payment' as const,
      subcategory: item.supplierSource,
      amount: supplierCost,
      currency: 'USD', // TODO: Get from item details
      description: `Supplier payment for ${item.name}`,
      date: new Date().toISOString().split('T')[0],
      vendor: getSupplierVendorName(item.supplierSource),
      supplierId: item.supplierSource,
      bookingId: quote.id,
      notes: `Auto-created expense for booking confirmation`,
    };

    const expenseId = useExpenseStore.getState().createExpense(expense);
  } catch (error: any) {
    // Don't throw - expense creation failure shouldn't block booking
  }
}

/**
 * Get human-readable vendor name from supplier source
 */
function getSupplierVendorName(source: BookingSource): string {
  const vendorNames: Record<BookingSource, string> = {
    api_hotelbeds: 'HotelBeds',
    api_amadeus: 'Amadeus',
    api_sabre: 'Sabre',
    offline_platform: 'Offline Platform',
    offline_agent: 'Agent Direct',
  };

  return vendorNames[source] || source;
}
