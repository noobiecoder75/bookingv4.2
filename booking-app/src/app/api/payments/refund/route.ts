import { NextRequest, NextResponse } from 'next/server';
import { getStripeInstance, formatAmountForStripe, calculateRefundAmount } from '@/lib/stripe/config';
import { usePaymentStore } from '@/store/payment-store';
import { useQuoteStore } from '@/store/quote-store';
import { useCommissionStore } from '@/store/commission-store';
import { RefundCalculation } from '@/types/payment';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, quoteId, reason } = await request.json();

    if (!paymentId || !quoteId) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentId, quoteId' },
        { status: 400 }
      );
    }

    const paymentStore = usePaymentStore.getState();
    const quoteStore = useQuoteStore.getState();

    const payment = paymentStore.getPaymentById(paymentId);
    const quote = quoteStore.quotes.find((q) => q.id === quoteId);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Calculate refund amount based on cancellation policy
    const refundCalculation = calculateRefundForQuote(quote);

    if (refundCalculation.refundAmount <= 0) {
      return NextResponse.json(
        {
          error: 'No refund available',
          message: 'Cancellation policy does not allow refunds at this time',
          refundPercentage: refundCalculation.refundPercentage,
        },
        { status: 400 }
      );
    }

    const stripe = getStripeInstance();

    // Process refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: formatAmountForStripe(refundCalculation.refundAmount),
      reason: 'requested_by_customer',
      metadata: {
        quoteId,
        originalAmount: payment.amount.toString(),
        refundPercentage: refundCalculation.refundPercentage.toString(),
        serviceFee: refundCalculation.serviceFee.toString(),
        reason: reason || 'Customer cancellation',
      },
    });

    // Update payment record
    paymentStore.updatePayment(paymentId, {
      status: 'refunded',
      refundedAt: new Date().toISOString(),
      notes: `Refunded: ${refundCalculation.refundPercentage}% (Service fee: $${refundCalculation.serviceFee.toFixed(2)}) - ${reason || 'Customer cancellation'}`,
    });

    // Update quote status
    quoteStore.updateQuote(quoteId, {
      status: 'rejected',
      paymentStatus: 'refunded',
    });

    // Clawback agent commission if applicable
    if (refundCalculation.shouldClawbackCommission) {
      await clawbackAgentCommission(quoteId, refundCalculation.commissionClawback);
    }

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      refundAmount: refundCalculation.refundAmount,
      refundPercentage: refundCalculation.refundPercentage,
      serviceFee: refundCalculation.serviceFee,
      clientReceives: refundCalculation.refundAmount - refundCalculation.serviceFee,
      breakdown: refundCalculation.breakdown,
    });
  } catch (error: any) {
    console.error('Refund processing failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate refund based on cancellation policies
 */
function calculateRefundForQuote(quote: any): RefundCalculation {
  const now = new Date();
  let maxRefundPercentage = 0;
  const breakdown: RefundCalculation['breakdown'] = [];

  // Check each item's cancellation policy
  for (const item of quote.items) {
    let itemRefundPercentage = 0;

    if (item.cancellationPolicy) {
      const { freeCancellationUntil, refundRules, nonRefundable } = item.cancellationPolicy;

      // If non-refundable, no refund
      if (nonRefundable) {
        itemRefundPercentage = 0;
      }
      // If within free cancellation window, 100% refund
      else if (freeCancellationUntil && now < new Date(freeCancellationUntil)) {
        itemRefundPercentage = 100;
      }
      // Otherwise, check refund rules based on days until travel
      else if (refundRules && refundRules.length > 0) {
        const travelDate = new Date(item.startDate);
        const daysUntilTravel = Math.floor(
          (travelDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Find applicable refund rule
        // Sort rules by days before travel (descending) and find first match
        const sortedRules = [...refundRules].sort((a, b) => b.daysBeforeTravel - a.daysBeforeTravel);

        for (const rule of sortedRules) {
          if (daysUntilTravel >= rule.daysBeforeTravel) {
            itemRefundPercentage = rule.refundPercentage;
            break;
          }
        }
      }
    } else {
      // No cancellation policy specified - use default (e.g., 50% refund)
      const travelDate = new Date(item.startDate);
      const daysUntilTravel = Math.floor(
        (travelDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilTravel >= 30) {
        itemRefundPercentage = 100;
      } else if (daysUntilTravel >= 14) {
        itemRefundPercentage = 50;
      } else if (daysUntilTravel >= 7) {
        itemRefundPercentage = 25;
      } else {
        itemRefundPercentage = 0;
      }
    }

    // Track maximum refund percentage (use most restrictive policy)
    maxRefundPercentage = Math.max(maxRefundPercentage, itemRefundPercentage);

    // Calculate refund for this item
    const itemPaidAmount = item.clientPrice || item.price;
    const itemRefundAmount = (itemPaidAmount * itemRefundPercentage) / 100;

    breakdown.push({
      itemId: item.id,
      itemName: item.name,
      paidAmount: itemPaidAmount,
      refundAmount: itemRefundAmount,
      refundPercentage: itemRefundPercentage,
    });
  }

  // Calculate total refund
  const totalPaid = quote.totalPaid || quote.totalCost;
  const grossRefundCalc = calculateRefundAmount(totalPaid, maxRefundPercentage);

  // Determine commission clawback
  const shouldClawbackCommission = maxRefundPercentage > 0;
  const commissionClawback = shouldClawbackCommission
    ? totalPaid * 0.10 // Assume 10% average commission
    : 0;

  return {
    refundAmount: grossRefundCalc.clientReceives, // After service fee
    refundPercentage: maxRefundPercentage,
    serviceFee: grossRefundCalc.serviceFee,
    shouldClawbackCommission,
    commissionClawback,
    breakdown,
  };
}

/**
 * Clawback agent commission on refund
 */
async function clawbackAgentCommission(quoteId: string, clawbackAmount: number) {
  const commissionStore = useCommissionStore.getState();
  const commissions = commissionStore.commissions.filter((c) => c.quoteId === quoteId);

  for (const commission of commissions) {
    if (commission.status === 'paid') {
      // Create negative commission entry for clawback
      commissionStore.createCommission({
        agentId: commission.agentId,
        agentName: commission.agentName,
        bookingId: commission.bookingId,
        quoteId: commission.quoteId,
        customerId: commission.customerId,
        customerName: commission.customerName,
        bookingAmount: commission.bookingAmount,
        commissionRate: commission.commissionRate,
        commissionAmount: -commission.commissionAmount, // Negative amount
        status: 'pending',
        earnedDate: new Date().toISOString(),
        notes: `Clawback due to refund on quote ${quoteId}`,
      });
    } else if (commission.status === 'pending' || commission.status === 'approved') {
      // If not yet paid, mark as disputed/cancelled
      commissionStore.updateCommissionStatus(commission.id, 'disputed');
    }
  }

  console.log(`✅ Commission clawback processed for quote: ${quoteId}, amount: $${clawbackAmount}`);
}
