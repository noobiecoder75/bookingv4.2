import { PaymentStatus, PaymentMethod } from './financial';

export type PaymentType = 'full' | 'deposit' | 'balance';
export type PaymentSource = 'api_hotelbeds' | 'api_amadeus' | 'api_sabre' | 'offline_platform' | 'offline_agent';
export type EscrowStatus = 'held' | 'released' | 'refunded';

/**
 * Quote Payment - Tracks Stripe payments for quotes
 */
export interface QuotePayment {
  id: string;
  quoteId: string;
  invoiceId?: string;

  // Payment details
  type: PaymentType; // full, deposit, or balance
  amount: number;
  currency: string;
  status: PaymentStatus; // pending | processing | completed | failed | refunded

  // Stripe integration
  stripePaymentIntentId: string;
  stripeCustomerId?: string;
  paymentMethod: PaymentMethod;
  processingFee: number; // Stripe fees (2.9% + $0.30)

  // Timestamps
  createdAt: string;
  paidAt?: string;
  failedAt?: string;
  refundedAt?: string;

  // Metadata
  failureReason?: string;
  receiptUrl?: string; // Stripe receipt
  notes?: string;
}

/**
 * Payment Schedule - Manages deposit/balance payment timelines
 */
export interface PaymentSchedule {
  id: string;
  quoteId: string;
  paymentId?: string; // Links to QuotePayment when paid

  // Schedule details
  type: PaymentType; // deposit or balance
  amountDue: number;
  dueDate: string;
  status: 'pending' | 'overdue' | 'paid' | 'cancelled';

  // Reminders
  lastReminderSent?: string;
  reminderCount: number;

  createdAt: string;
  updatedAt: string;
}

/**
 * Fund Allocation - Tracks money split and escrow for each payment
 */
export interface FundAllocation {
  id: string;
  paymentId: string;
  quoteId: string;

  // Breakdown
  totalAmount: number;

  // Per quote item allocations
  allocations: Array<{
    quoteItemId: string;
    itemType: 'flight' | 'hotel' | 'activity' | 'transfer';
    source: PaymentSource;

    // Money split
    clientPaid: number; // What client paid for this item
    supplierCost: number; // What we pay supplier
    platformFee: number; // Our commission (5-8%)
    agentCommission: number; // Agent's cut

    // Escrow tracking
    escrowStatus: EscrowStatus;
    escrowReleaseDate?: string;
    escrowReleaseTrigger?: 'booking_confirmed' | 'cancellation_window_closed' | 'travel_completed' | 'manual';
  }>;

  createdAt: string;
  updatedAt: string;
}

/**
 * Supplier Payment - Tracks payments we make to suppliers (hotels, airlines, etc.)
 */
export interface SupplierPayment {
  id: string;
  quoteId: string;
  paymentId: string; // Links to QuotePayment
  allocationId: string; // Links to FundAllocation

  // Supplier details
  supplierName: string;
  supplierId?: string; // If we have supplier database
  source: PaymentSource;

  // Payment details
  amount: number;
  currency: string;
  status: 'pending' | 'scheduled' | 'paid' | 'failed';

  // Payment policy (supplier-specific)
  paymentPolicy: {
    trigger: 'booking_confirmed' | 'X_days_after_booking' | 'before_cancellation_window';
    daysAfterBooking?: number;
    cancellationWindowDate?: string;
  };

  scheduledPaymentDate?: string;
  paidDate?: string;

  // Stripe/Bank transfer details
  stripeTransferId?: string; // If paying via Stripe Connect
  bankTransferRef?: string; // If manual bank transfer

  createdAt: string;
  updatedAt: string;
}

/**
 * Price Change - Tracks repricing events for API items
 */
export interface PriceChange {
  id: string;
  quoteId: string;
  quoteItemId: string;

  // Price tracking
  originalPrice: number;
  newPrice: number;
  priceDifference: number;
  percentageChange: number;

  // Context
  reason: 'repricing_before_payment' | 'scheduled_repricing' | 'supplier_rate_change';
  apiProvider?: string; // HotelBeds, Amadeus, etc.

  // User action
  clientNotified: boolean;
  clientNotifiedAt?: string;
  clientAccepted: boolean;
  clientAcceptedAt?: string;

  createdAt: string;
}

/**
 * Cancellation Policy - Defines refund rules for travel items
 */
export interface CancellationPolicy {
  freeCancellationUntil?: string; // ISO date - free cancellation before this date
  cancellationDeadline?: string; // ISO date - last date cancellation is allowed
  refundRules: Array<{
    daysBeforeTravel: number; // e.g., 30 days before travel
    refundPercentage: number; // 0-100 (e.g., 50 = 50% refund)
  }>;
  nonRefundable?: boolean; // If true, no refunds allowed
}

/**
 * Refund Calculation Result
 */
export interface RefundCalculation {
  refundAmount: number;
  refundPercentage: number;
  serviceFee: number;
  shouldClawbackCommission: boolean;
  commissionClawback: number;
  breakdown: Array<{
    itemId: string;
    itemName: string;
    paidAmount: number;
    refundAmount: number;
    refundPercentage: number;
  }>;
}
