import { NextRequest, NextResponse } from 'next/server';
import { getStripeInstance, calculateStripeFee, calculateBalanceDueDate } from '@/lib/stripe/config';
import { usePaymentStore } from '@/store/payment-store';
import { useQuoteStore } from '@/store/quote-store';
import { PaymentType } from '@/types/payment';

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, quoteId, quote } = await request.json();

    console.log('🔵 [Confirm Payment] Request received:', { paymentIntentId, quoteId });

    if (!paymentIntentId || !quoteId || !quote) {
      console.error('❌ [Confirm Payment] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: paymentIntentId, quoteId, quote' },
        { status: 400 }
      );
    }

    const stripe = getStripeInstance();

    // Retrieve payment intent from Stripe with charges expanded
    console.log('🔍 [Confirm Payment] Retrieving payment intent from Stripe...');
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['charges']
    });

    console.log('✅ [Confirm Payment] Payment intent retrieved:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      hasCharges: !!paymentIntent.charges,
      chargesCount: paymentIntent.charges?.data?.length || 0
    });

    if (paymentIntent.status !== 'succeeded') {
      console.error('❌ [Confirm Payment] Payment not completed:', paymentIntent.status);
      return NextResponse.json(
        {
          error: 'Payment not completed',
          status: paymentIntent.status,
          message: 'Payment must be successful before confirmation',
        },
        { status: 400 }
      );
    }

    console.log('✅ [Confirm Payment] Payment succeeded, processing...');

    const paymentType = paymentIntent.metadata.paymentType as PaymentType;
    const paymentAmount = paymentIntent.amount / 100; // Convert from cents

    console.log('💰 [Confirm Payment] Payment details:', {
      type: paymentType,
      amount: paymentAmount,
      currency: paymentIntent.currency
    });

    // Record payment (skip Zustand for now - TODO: save to database)
    const paymentId = `payment_${Date.now()}`;
    console.log('💾 [Confirm Payment] Payment ID generated:', paymentId);

    // Calculate payment status
    const totalPaid = paymentAmount; // Simplified for now
    let newPaymentStatus: 'unpaid' | 'deposit_paid' | 'partially_paid' | 'paid_in_full' = 'unpaid';

    if (paymentType === 'deposit') {
      newPaymentStatus = 'deposit_paid';
    } else if (paymentType === 'full' || totalPaid >= quote.totalCost) {
      newPaymentStatus = 'paid_in_full';
    } else if (totalPaid > 0) {
      newPaymentStatus = 'partially_paid';
    }

    console.log('📊 [Confirm Payment] Payment status:', {
      newStatus: newPaymentStatus,
      totalPaid,
      quoteCost: quote.totalCost,
      remaining: quote.totalCost - totalPaid
    });

    // If full payment, trigger booking confirmation
    if (newPaymentStatus === 'paid_in_full') {
      console.log('🎯 [Confirm Payment] Full payment - triggering booking confirmation');
      await triggerBookingConfirmation(quoteId, paymentId, quote);
    } else {
      console.log('📅 [Confirm Payment] Deposit payment - balance payment required');
    }

    console.log('✅ [Confirm Payment] Payment confirmed successfully');

    // Safely extract receipt URL
    const receiptUrl = paymentIntent.charges?.data?.[0]?.receipt_url || null;
    console.log('📧 [Confirm Payment] Receipt URL:', receiptUrl || 'Not available');

    return NextResponse.json({
      success: true,
      paymentId,
      status: 'completed',
      paymentStatus: newPaymentStatus,
      totalPaid,
      remainingBalance: quote.totalCost - totalPaid,
      receiptUrl,
    });
  } catch (error: any) {
    console.error('Payment confirmation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Trigger booking confirmation process
 * This will:
 * 1. Auto-book API items
 * 2. Create tasks for agent to manually book offline items
 * 3. Create fund allocation
 * 4. Release agent commission
 * 5. Schedule supplier payments
 */
async function triggerBookingConfirmation(quoteId: string, paymentId: string, quote: any) {
  console.log(`🎯 [Booking] Triggering booking confirmation for quote: ${quoteId}, payment: ${paymentId}`);

  // Create fund allocation
  await createFundAllocation(quote, paymentId);

  // TODO: Implement booking logic
  // - For API items: Call booking APIs
  // - For offline items: Create agent tasks
  // - Release commission to agent
  // - Schedule supplier payments

  console.log('✅ [Booking] Booking confirmation triggered successfully');
}

/**
 * Create fund allocation to track money split
 */
async function createFundAllocation(quote: any, paymentId: string) {
  console.log(`💵 [Fund Allocation] Creating allocation for payment: ${paymentId}`);

  // Calculate allocations for each item
  const allocations = quote.items.map((item: any) => {
    const supplierSource = item.supplierSource || 'offline_agent';
    const supplierCost = item.supplierCost || item.price * 0.85; // Default 85% to supplier
    const platformFeePercentage = getPlatformFeePercentage(supplierSource);
    const platformFee = (item.price * platformFeePercentage) / 100;
    const agentCommission = item.price - supplierCost - platformFee;

    return {
      quoteItemId: item.id,
      itemType: item.type,
      source: supplierSource,
      clientPaid: item.price,
      supplierCost,
      platformFee,
      agentCommission,
      escrowStatus: 'held' as const,
    };
  });

  console.log('✅ [Fund Allocation] Allocation calculated:', {
    totalItems: allocations.length,
    totalAmount: quote.totalCost
  });

  // TODO: Save to database instead of Zustand
  console.log('⚠️ [Fund Allocation] Note: Not persisting to database yet');
}

/**
 * Get platform fee percentage based on source
 */
function getPlatformFeePercentage(source: string): number {
  const fees: Record<string, number> = {
    api_hotelbeds: 5,
    api_amadeus: 5,
    api_sabre: 5,
    offline_platform: 8,
    offline_agent: 0,
  };
  return fees[source] || 0;
}
