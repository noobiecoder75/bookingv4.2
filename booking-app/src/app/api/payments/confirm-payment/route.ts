import { NextRequest, NextResponse } from 'next/server';
import { getStripeInstance, calculateStripeFee } from '@/lib/stripe/config';
import { useQuoteStore } from '@/store/quote-store';
import { PaymentType } from '@/types/payment';
import { processHybridBooking } from '@/lib/booking/processor';
import { TravelQuote } from '@/types';

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

    // Record payment in payment store
    const { usePaymentStore } = await import('@/store/payment-store');
    const stripeFee = calculateStripeFee(paymentAmount);

    const paymentId = usePaymentStore.getState().createPayment({
      quoteId,
      type: paymentType,
      amount: paymentAmount,
      currency: paymentIntent.currency,
      status: 'completed',
      stripePaymentIntentId: paymentIntentId,
      stripeCustomerId: paymentIntent.customer as string | undefined,
      paymentMethod: 'credit_card',
      processingFee: stripeFee,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      receiptUrl: paymentIntent.charges?.data?.[0]?.receipt_url || undefined,
    });

    console.log('💾 [Confirm Payment] Payment record created:', paymentId);

    // Record payment received transaction
    const { useTransactionStore } = await import('@/store/transaction-store');
    const paymentTransactionId = useTransactionStore.getState().createTransaction({
      type: 'payment_received',
      status: 'completed',
      amount: paymentAmount,
      currency: paymentIntent.currency,
      quoteId,
      paymentId,
      customerId: quote.contactId,
      description: `Payment received: ${paymentType === 'full' ? 'Full payment' : 'Deposit (30%)'} for quote ${quoteId}`,
      metadata: {
        paymentType,
        stripePaymentIntentId: paymentIntentId,
        processingFee: stripeFee,
      },
    });

    console.log('📝 [Confirm Payment] Payment transaction recorded:', paymentTransactionId);

    // Record Stripe processing fee as expense
    const { useExpenseStore } = await import('@/store/expense-store');
    const expenseId = useExpenseStore.getState().createExpense({
      category: 'technology',
      subcategory: 'payment_processing',
      description: `Stripe processing fee for payment ${paymentId}`,
      amount: stripeFee,
      vendor: 'Stripe',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'auto_deducted',
      receiptUrl: paymentIntent.charges?.data?.[0]?.receipt_url,
    });

    console.log('💸 [Confirm Payment] Stripe fee recorded as expense:', expenseId);

    // Record expense transaction
    const expenseTransactionId = useTransactionStore.getState().createTransaction({
      type: 'expense_recorded',
      status: 'completed',
      amount: stripeFee,
      currency: paymentIntent.currency,
      quoteId,
      paymentId,
      expenseId,
      description: `Stripe processing fee for payment ${paymentId}`,
      relatedTransactions: [paymentTransactionId],
      metadata: {
        vendor: 'Stripe',
        category: 'technology',
      },
    });

    console.log('📝 [Confirm Payment] Expense transaction recorded:', expenseTransactionId);

    // Generate invoice from quote
    const invoiceId = await generateInvoiceForPayment(quote, quoteId, paymentId, paymentType, paymentTransactionId);

    console.log('📄 [Confirm Payment] Invoice generated:', invoiceId);

    // Generate commission for agent (linked to invoice)
    const commissionId = await generateCommissionForBooking(quote, quoteId, paymentId, invoiceId, paymentTransactionId);

    console.log('💼 [Confirm Payment] Commission generated:', commissionId);

    // Auto-create supplier expenses for items with supplier costs
    if (paymentType === 'full') {
      console.log('💸 [Confirm Payment] Creating supplier expenses for paid booking...');
      await createSupplierExpenses(quote, quoteId, paymentId, paymentTransactionId);
    }

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
      invoiceId,
      commissionId,
      status: 'completed',
      paymentStatus: newPaymentStatus,
      totalPaid,
      remainingBalance: quote.totalCost - totalPaid,
      receiptUrl,
    });
  } catch (error) {
    console.error('Payment confirmation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
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
async function triggerBookingConfirmation(quoteId: string, paymentId: string, quote: TravelQuote) {
  console.log(`🎯 [Booking] Triggering booking confirmation for quote: ${quoteId}, payment: ${paymentId}`);

  // Create fund allocation
  await createFundAllocation(quote, paymentId);

  // Process hybrid booking (API auto-booking + manual task creation)
  try {
    const bookingResult = await processHybridBooking(quote, paymentId);

    console.log('📊 [Booking] Hybrid booking processed:', {
      success: bookingResult.success,
      apiSuccess: bookingResult.summary.apiSuccess,
      apiFailed: bookingResult.summary.apiFailed,
      manualTasks: bookingResult.summary.manualTasks,
    });

    // Update quote status based on booking results
    if (bookingResult.summary.apiSuccess > 0 || bookingResult.summary.manualTasks > 0) {
      const quoteStore = useQuoteStore.getState();
      quoteStore.updateQuote(quoteId, {
        status: bookingResult.summary.manualTasks > 0 ? 'accepted' : 'confirmed',
        paymentStatus: 'paid_in_full',
      });
    }

    // TODO: Release commission to agent
    // TODO: Schedule supplier payments

  } catch (error) {
    console.error('❌ [Booking] Hybrid booking failed:', error);
    // Don't throw - payment already succeeded
  }

  console.log('✅ [Booking] Booking confirmation triggered successfully');
}

/**
 * Create fund allocation to track money split
 */
async function createFundAllocation(quote: TravelQuote, paymentId: string) {
  console.log(`💵 [Fund Allocation] Creating allocation for payment: ${paymentId}`);

  // Calculate allocations for each item
  const allocations = quote.items.map((item) => {
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

/**
 * Generate invoice for payment
 */
async function generateInvoiceForPayment(
  quote: TravelQuote,
  quoteId: string,
  paymentId: string,
  paymentType: PaymentType,
  paymentTransactionId: string
): Promise<string | null> {
  try {
    const { useInvoiceStore } = await import('@/store/invoice-store');
    const { useContactStore } = await import('@/store/contact-store');

    // Get customer details from contact
    const contact = useContactStore.getState().getContactById(quote.contactId);

    const customerData = {
      customerId: quote.contactId,
      customerName: contact?.name || 'Unknown Customer',
      customerEmail: contact?.email || '',
      customerAddress: contact?.address,
    };

    // Generate invoice from quote
    const invoiceId = useInvoiceStore.getState().generateInvoiceFromQuote(
      quoteId,
      customerData,
      'Payment due upon booking',
      0 // Due immediately since payment already made
    );

    if (!invoiceId) {
      console.error('❌ [Invoice] Failed to generate invoice');
      return null;
    }

    // Update invoice with actual quote items
    const invoice = useInvoiceStore.getState().getInvoiceById(invoiceId);
    if (invoice) {
      const invoiceItems = quote.items.map((item) => ({
        id: crypto.randomUUID(),
        description: `${item.type.toUpperCase()}: ${item.name || item.details?.hotelName || item.details?.activityName || 'Travel Service'}`,
        quantity: 1,
        unitPrice: item.price,
        total: item.price,
        taxRate: 0,
        taxAmount: 0,
      }));

      const subtotal = quote.totalCost;
      const taxRate = 0; // Tax can be configured later
      const taxAmount = 0;
      const total = subtotal;
      const paidAmount = paymentType === 'full' ? total : total * 0.3;
      const remainingAmount = total - paidAmount;

      useInvoiceStore.getState().updateInvoice(invoiceId, {
        items: invoiceItems,
        subtotal,
        taxRate,
        taxAmount,
        total,
        paidAmount,
        remainingAmount,
        status: paymentType === 'full' ? 'paid' : 'partial',
      });

      // Link payment to invoice
      useInvoiceStore.getState().addPayment(invoiceId, {
        amount: paidAmount,
        method: 'credit_card',
        status: 'completed',
        processedDate: new Date().toISOString(),
        transactionId: paymentId,
      });
    }

    // Update payment record with invoiceId
    const { usePaymentStore } = await import('@/store/payment-store');
    usePaymentStore.getState().updatePayment(paymentId, { invoiceId });

    // Record invoice creation transaction
    const { useTransactionStore } = await import('@/store/transaction-store');
    const invoiceTransactionId = useTransactionStore.getState().createTransaction({
      type: 'invoice_created',
      status: 'completed',
      amount: invoice.total,
      currency: 'usd',
      quoteId,
      invoiceId,
      paymentId,
      customerId: quote.contactId,
      description: `Invoice ${invoice.invoiceNumber} created for quote ${quoteId}`,
      relatedTransactions: [paymentTransactionId],
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        paymentType,
        status: invoice.status,
      },
    });

    console.log('📝 [Invoice] Invoice transaction recorded:', invoiceTransactionId);

    // Record invoice paid/partial payment transaction
    const invoicePaidTransactionId = useTransactionStore.getState().createTransaction({
      type: 'invoice_paid',
      status: 'completed',
      amount: paymentType === 'full' ? invoice.total : invoice.total * 0.3,
      currency: 'usd',
      quoteId,
      invoiceId,
      paymentId,
      customerId: quote.contactId,
      description: `Invoice ${invoice.invoiceNumber} ${paymentType === 'full' ? 'paid in full' : 'partially paid (30% deposit)'}`,
      relatedTransactions: [paymentTransactionId, invoiceTransactionId],
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        paymentType,
        paidAmount: invoice.paidAmount,
        remainingAmount: invoice.remainingAmount,
      },
    });

    console.log('📝 [Invoice] Invoice payment transaction recorded:', invoicePaidTransactionId);

    return invoiceId;
  } catch (error) {
    console.error('❌ [Invoice] Generation failed:', error);
    return null;
  }
}

/**
 * Generate commission for booking
 */
async function generateCommissionForBooking(
  quote: TravelQuote,
  quoteId: string,
  paymentId: string,
  invoiceId: string | null,
  paymentTransactionId: string
): Promise<string | null> {
  try {
    const { useCommissionStore } = await import('@/store/commission-store');
    const { useContactStore } = await import('@/store/contact-store');

    // Get customer details
    const contact = useContactStore.getState().getContactById(quote.contactId);

    // Generate commission (uses default agent for now)
    const commissionId = useCommissionStore.getState().generateCommissionFromBooking({
      agentId: 'agent-001', // TODO: Get from quote or user session
      agentName: 'Default Agent', // TODO: Get from agent data
      bookingId: paymentId, // Use paymentId as booking reference
      quoteId,
      invoiceId: invoiceId || undefined, // Link to invoice
      customerId: quote.contactId,
      customerName: contact?.name || 'Unknown Customer',
      bookingAmount: quote.totalCost,
      bookingType: quote.items[0]?.type || 'hotel', // Use first item type
      quoteCommissionRate: quote.commissionRate, // If quote has custom rate
    });

    console.log('✅ [Commission] Generated commission:', commissionId);

    // Record commission creation transaction
    const commission = useCommissionStore.getState().getCommissionById(commissionId);
    if (commission) {
      const { useTransactionStore } = await import('@/store/transaction-store');
      const commissionTransactionId = useTransactionStore.getState().createTransaction({
        type: 'commission_created',
        status: 'completed',
        amount: commission.commissionAmount,
        currency: 'usd',
        quoteId,
        invoiceId: invoiceId || undefined,
        paymentId,
        commissionId,
        agentId: commission.agentId,
        customerId: quote.contactId,
        description: `Commission created for ${commission.agentName}: ${commission.commissionRate}% on $${commission.bookingAmount}`,
        relatedTransactions: [paymentTransactionId],
        metadata: {
          agentName: commission.agentName,
          commissionRate: commission.commissionRate,
          bookingAmount: commission.bookingAmount,
          status: commission.status,
        },
      });

      console.log('📝 [Commission] Commission transaction recorded:', commissionTransactionId);
    }

    return commissionId;
  } catch (error) {
    console.error('❌ [Commission] Generation failed:', error);
    return null;
  }
}

/**
 * Create supplier expenses for quote items
 * Auto-creates expense records for supplier payments when booking is confirmed
 */
async function createSupplierExpenses(
  quote: TravelQuote,
  quoteId: string,
  paymentId: string,
  paymentTransactionId: string
) {
  try {
    const { useExpenseStore } = await import('@/store/expense-store');
    const { useContactStore } = await import('@/store/contact-store');
    const { useTransactionStore } = await import('@/store/transaction-store');

    let expensesCreated = 0;

    for (const item of quote.items) {
      // Skip items without supplier cost
      if (!item.supplierCost || item.supplierCost <= 0) {
        console.log(`⚠️ [Supplier Expense] Skipping ${item.name} - no supplier cost`);
        continue;
      }

      const supplier = item.supplier || 'Unknown Supplier';
      const supplierSource = item.supplierSource || 'offline_agent';

      // Find or create supplier contact
      const contactStore = useContactStore.getState();
      let supplierContact = contactStore.findSupplierByName(supplier);

      if (!supplierContact) {
        console.log(`📝 [Supplier Expense] Creating new supplier: ${supplier}`);
        const supplierId = contactStore.createSupplierFromRate(supplier, supplierSource);
        supplierContact = contactStore.getContactById(supplierId);
      }

      // Create expense record
      const expenseId = useExpenseStore.getState().createExpense({
        category: 'supplier_payment',
        subcategory: item.type, // hotel, activity, transfer, etc.
        description: `Supplier cost for ${item.type}: ${item.name}`,
        amount: item.supplierCost,
        currency: 'usd',
        vendor: supplier,
        supplierId: supplierContact?.id,
        date: item.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        status: 'pending', // Awaiting actual payment to supplier
        bookingId: quoteId,
        notes: `Auto-generated from booking ${paymentId}. Source: ${supplierSource}`,
      });

      console.log(`✅ [Supplier Expense] Created expense ${expenseId} for ${supplier}: $${item.supplierCost}`);

      // Create transaction record
      const transactionId = useTransactionStore.getState().createTransaction({
        type: 'supplier_payment',
        status: 'pending',
        amount: item.supplierCost,
        currency: 'usd',
        quoteId,
        paymentId,
        expenseId,
        supplierId: supplierContact?.id,
        description: `Supplier payment due for ${item.name}`,
        relatedTransactions: [paymentTransactionId],
        metadata: {
          itemType: item.type,
          itemName: item.name,
          supplier,
          source: supplierSource,
          dueDate: item.startDate,
        },
      });

      console.log(`📝 [Supplier Expense] Transaction recorded: ${transactionId}`);
      expensesCreated++;
    }

    console.log(`✅ [Supplier Expense] Created ${expensesCreated} supplier expense records`);
  } catch (error) {
    console.error('❌ [Supplier Expense] Failed to create expenses:', error);
    // Don't throw - payment already succeeded
  }
}
