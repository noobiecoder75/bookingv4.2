import { NextRequest, NextResponse } from 'next/server';
import { getStripeInstance, formatAmountForStripe, calculateDepositAmount } from '@/lib/stripe/config';
import { useQuoteStore } from '@/store/quote-store';
import { usePaymentStore } from '@/store/payment-store';
import { TravelQuote, TravelItem } from '@/types';
import { PriceChange } from '@/types/payment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      quoteId,
      paymentType, // 'full' | 'deposit'
      customerId,
      customerEmail,
      quote, // Pass full quote object from client
    } = body;

    console.log('🔵 [Payment Intent] Request received:', { quoteId, paymentType, customerEmail });

    // Validate required fields
    if (!quoteId || !paymentType || !customerEmail || !quote) {
      console.error('❌ [Payment Intent] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: quoteId, paymentType, customerEmail, quote' },
        { status: 400 }
      );
    }

    console.log('✅ [Payment Intent] Quote data received:', {
      quoteId: quote.id,
      totalCost: quote.totalCost,
      itemCount: quote.items?.length
    });

    // **CRITICAL: Reprice API items before creating payment intent**
    console.log('🔄 [Payment Intent] Repricing quote...');
    const repriceResult = await repriceQuote(quote);

    if (repriceResult.priceChanged) {
      console.log('⚠️ [Payment Intent] Price changed detected:', {
        original: quote.totalCost,
        new: repriceResult.newTotalCost,
        difference: repriceResult.newTotalCost - quote.totalCost
      });
      // Price has changed - return 409 Conflict with details
      return NextResponse.json(
        {
          error: 'PRICE_CHANGED',
          message: 'Quote price has changed. Please review and confirm.',
          originalPrice: quote.totalCost,
          newPrice: repriceResult.newTotalCost,
          priceDifference: repriceResult.newTotalCost - quote.totalCost,
          percentageChange: ((repriceResult.newTotalCost - quote.totalCost) / quote.totalCost) * 100,
          changes: repriceResult.changes,
        },
        { status: 409 } // 409 Conflict
      );
    }

    console.log('✅ [Payment Intent] No price changes detected');

    // Calculate payment amount
    let paymentAmount = quote.totalCost;
    if (paymentType === 'deposit') {
      paymentAmount = calculateDepositAmount(quote.totalCost);
    }

    console.log('💰 [Payment Intent] Payment amount:', {
      type: paymentType,
      totalCost: quote.totalCost,
      paymentAmount,
      formatted: formatAmountForStripe(paymentAmount)
    });

    const stripe = getStripeInstance();

    // Create or retrieve Stripe Customer
    let customer = null;
    try {
      console.log('👤 [Payment Intent] Creating Stripe customer...');
      // In production, check if customer exists in DB and retrieve their Stripe ID
      // For now, create new customer each time
      customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          quoteId,
          customerId: customerId || 'guest',
        },
      });
      console.log('✅ [Payment Intent] Stripe customer created:', customer.id);
    } catch (error: any) {
      console.error('❌ [Payment Intent] Failed to create Stripe customer:', error);
      return NextResponse.json(
        { error: 'Failed to create customer account' },
        { status: 500 }
      );
    }

    // Create Payment Intent
    try {
      console.log('💳 [Payment Intent] Creating payment intent...');
      const paymentIntent = await stripe.paymentIntents.create({
        amount: formatAmountForStripe(paymentAmount),
        currency: 'usd',
        customer: customer.id,
        metadata: {
          quoteId,
          paymentType,
          customerId: customerId || 'guest',
          quoteTitle: quote.title,
        },
        description: `${paymentType === 'deposit' ? 'Deposit' : 'Full payment'} for ${quote.title}`,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log('✅ [Payment Intent] Created successfully:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status
      });

      return NextResponse.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentAmount,
        paymentType,
      });
    } catch (error: any) {
      console.error('❌ [Payment Intent] Failed to create payment intent:', error);
      return NextResponse.json(
        { error: 'Failed to create payment intent: ' + error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Payment intent creation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Reprice quote by checking current API rates
 * Returns price changes if any API items have different pricing
 */
async function repriceQuote(quote: TravelQuote): Promise<{
  priceChanged: boolean;
  newTotalCost: number;
  changes: PriceChange[];
}> {
  const changes: PriceChange[] = [];
  let newTotalCost = 0;
  let priceChanged = false;

  for (const item of quote.items) {
    if (item.source === 'api' && item.apiProvider) {
      // Query API for current price
      const currentPrice = await getAPICurrentPrice(item);

      if (currentPrice !== item.price) {
        priceChanged = true;

        // Record price change (skip Zustand store for now - TODO: save to database)
        const changeId = `price_change_${Date.now()}`;

        changes.push({
          id: changeId,
          quoteId: quote.id,
          quoteItemId: item.id,
          originalPrice: item.price,
          newPrice: currentPrice,
          priceDifference: currentPrice - item.price,
          percentageChange: ((currentPrice - item.price) / item.price) * 100,
          reason: 'repricing_before_payment',
          apiProvider: item.apiProvider,
          clientNotified: true,
          clientNotifiedAt: new Date().toISOString(),
          clientAccepted: false,
          createdAt: new Date().toISOString(),
        });

        newTotalCost += currentPrice;
      } else {
        newTotalCost += item.price;
      }
    } else {
      // Offline rates don't change
      newTotalCost += item.price;
    }
  }

  return {
    priceChanged,
    newTotalCost,
    changes,
  };
}

/**
 * Get current price from API provider
 * In production, this would call the actual API (HotelBeds, Amadeus, etc.)
 * For now, simulates with random variation for testing
 */
async function getAPICurrentPrice(item: TravelItem): Promise<number> {
  // TODO: Implement actual API calls based on item.apiProvider
  // For testing, simulate price variation (±10%)
  const variation = (Math.random() - 0.5) * 0.2; // Random ±10%
  return item.price * (1 + variation);
}
