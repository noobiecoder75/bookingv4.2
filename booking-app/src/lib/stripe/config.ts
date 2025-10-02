import Stripe from 'stripe';
import { PaymentSource } from '@/types/payment';

// Stripe client initialization (server-side only)
let stripeInstance: Stripe | null = null;

export function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY must be set in environment variables');
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    });
  }

  return stripeInstance;
}

/**
 * Stripe Configuration Constants
 */
export const STRIPE_CONFIG = {
  currency: 'usd',
  paymentMethodTypes: ['card'] as Stripe.PaymentIntentCreateParams.PaymentMethodType[],

  // Platform fees (% of booking amount)
  platformFeePercentages: {
    api_hotelbeds: 5, // 5% on Hotel Beds API bookings
    api_amadeus: 5, // 5% on Amadeus flight bookings
    api_sabre: 5, // 5% on Sabre bookings
    offline_platform: 8, // 8% on our negotiated offline rates
    offline_agent: 0, // 0% on agent's own rates (subscription revenue only)
  } as Record<PaymentSource, number>,

  // Stripe processing fees
  stripeFeePercentage: 2.9, // 2.9% per transaction
  stripeFeeFixed: 0.30, // $0.30 per transaction

  // Deposit settings
  defaultDepositPercentage: 30, // 30% deposit
  minDepositAmount: 50, // Minimum $50 deposit

  // Payment terms
  balancePaymentDueDays: 30, // Balance due 30 days after deposit

  // Service fee on refunds
  refundServiceFeePercentage: 5, // 5% service fee on refunds
} as const;

/**
 * Calculate Stripe processing fee for a transaction
 */
export function calculateStripeFee(amount: number): number {
  return (amount * STRIPE_CONFIG.stripeFeePercentage / 100) + STRIPE_CONFIG.stripeFeeFixed;
}

/**
 * Calculate platform commission based on payment source
 */
export function calculatePlatformFee(amount: number, source: PaymentSource): number {
  const feePercentage = STRIPE_CONFIG.platformFeePercentages[source] || 0;
  return (amount * feePercentage) / 100;
}

/**
 * Calculate deposit amount (30% of total by default)
 */
export function calculateDepositAmount(totalAmount: number): number {
  const depositAmount = (totalAmount * STRIPE_CONFIG.defaultDepositPercentage) / 100;
  return Math.max(depositAmount, STRIPE_CONFIG.minDepositAmount);
}

/**
 * Calculate balance amount after deposit
 */
export function calculateBalanceAmount(totalAmount: number, depositPaid: number): number {
  return totalAmount - depositPaid;
}

/**
 * Calculate balance payment due date
 */
export function calculateBalanceDueDate(depositDate: Date = new Date()): Date {
  const dueDate = new Date(depositDate);
  dueDate.setDate(dueDate.getDate() + STRIPE_CONFIG.balancePaymentDueDays);
  return dueDate;
}

/**
 * Format amount for Stripe (convert dollars to cents)
 */
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Format amount from Stripe (convert cents to dollars)
 */
export function formatAmountFromStripe(amount: number): number {
  return amount / 100;
}

/**
 * Calculate refund amount after service fee
 */
export function calculateRefundAmount(
  paidAmount: number,
  refundPercentage: number
): { refundAmount: number; serviceFee: number; clientReceives: number } {
  const grossRefund = (paidAmount * refundPercentage) / 100;
  const serviceFee = (grossRefund * STRIPE_CONFIG.refundServiceFeePercentage) / 100;
  const clientReceives = grossRefund - serviceFee;

  return {
    refundAmount: grossRefund,
    serviceFee,
    clientReceives,
  };
}
