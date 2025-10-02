# Payment System Documentation

## Overview

The BookingGPT payment system provides a comprehensive quote-to-cash workflow with Stripe integration, deposit handling, dynamic repricing, fund allocation, and refund processing.

---

## Features Implemented

### ✅ Phase 1: Core Payment Infrastructure

- **Stripe Integration**: Full Stripe payment processing with Payment Intents API
- **Payment Types**: Support for full payment or 30% deposit
- **Payment Store**: Zustand-based state management for all payment data
- **API Endpoints**:
  - `/api/payments/create-payment-intent` - Initializes Stripe payment
  - `/api/payments/confirm-payment` - Confirms successful payment
  - `/api/payments/refund` - Processes refunds with policy enforcement
- **Payment Modal**: React component with Stripe Elements integration
- **Price Repricing**: Automatic repricing of API items before payment

---

## File Structure

```
src/
├── types/
│   └── payment.ts                 # Payment type definitions
├── lib/
│   └── stripe/
│       ├── config.ts              # Stripe configuration & helpers
│       └── connect.ts             # Stripe Connect for agent payouts
├── store/
│   └── payment-store.ts           # Zustand payment state management
├── app/api/payments/
│   ├── create-payment-intent/
│   │   └── route.ts               # Initialize payment
│   ├── confirm-payment/
│   │   └── route.ts               # Confirm & record payment
│   └── refund/
│       └── route.ts               # Process refunds
└── components/payment/
    └── PaymentModal.tsx           # Payment UI component
```

---

## Setup Instructions

### 1. Install Dependencies

Already installed:
```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and add your Stripe keys:

```bash
# Get from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Get from https://dashboard.stripe.com/webhooks (for future webhook handling)
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Test Mode

The system is configured to use Stripe Test Mode by default. Use test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

---

## Usage

### Client-Side: Payment Modal

```tsx
import { PaymentModal } from '@/components/payment/PaymentModal';

function QuoteView() {
  const [showPayment, setShowPayment] = useState(false);

  return (
    <>
      <button onClick={() => setShowPayment(true)}>
        Accept & Pay
      </button>

      <PaymentModal
        quote={quote}
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={() => {
          console.log('Payment successful!');
          // Update UI, show confirmation, etc.
        }}
      />
    </>
  );
}
```

### Server-Side: Payment Store

```tsx
import { usePaymentStore } from '@/store/payment-store';

// Get all payments for a quote
const payments = paymentStore.getPaymentsByQuote(quoteId);

// Check total paid
const totalPaid = paymentStore.getTotalPaidForQuote(quoteId);

// Get overdue payment schedules
const overdueSchedules = paymentStore.getOverdueSchedules();

// Release escrow funds after booking confirmed
paymentStore.releaseEscrowFunds(allocationId, itemId);
```

---

## Payment Flow

### Full Payment

```
1. Client clicks "Accept & Pay"
2. System reprices API items (checks current rates)
3. If price changed → Show warning modal
4. Client confirms → Creates Stripe Payment Intent
5. Client enters card details → Stripe processes payment
6. Payment confirmed → Creates fund allocation
7. Booking triggered → API items auto-booked
8. Commission released to agent
9. Supplier payment scheduled
```

### Deposit Payment (30%)

```
1. Client selects "Pay Deposit"
2. System calculates 30% of total
3. Payment processed via Stripe
4. Payment schedule created for balance (due in 30 days)
5. Funds held in escrow (booking NOT triggered yet)
6. Reminder emails sent: 45d, 30d, 15d, 7d, 1d before due
7. Client pays balance → Triggers full booking flow
8. If balance not paid → Auto-cancel after 14 days overdue
```

---

## Money Flow & Fund Allocation

### Breakdown per Quote Item

```typescript
{
  clientPaid: 1000,         // What client pays
  supplierCost: 850,        // What we pay supplier
  platformFee: 50,          // Our commission (5% for API)
  agentCommission: 100,     // Agent's markup
  escrowStatus: 'held'      // Held until booking confirmed
}
```

### Platform Fee Structure

| Source | Platform Fee | Notes |
|--------|--------------|-------|
| `api_hotelbeds` | 5% | Hotel Beds API bookings |
| `api_amadeus` | 5% | Amadeus flight bookings |
| `api_sabre` | 5% | Sabre bookings |
| `offline_platform` | 8% | Our negotiated offline rates |
| `offline_agent` | 0% | Agent's own rates (subscription revenue only) |

---

## Refund Processing

### Cancellation Policy Enforcement

```typescript
// Example cancellation policy
{
  freeCancellationUntil: '2025-10-15',  // Free until this date
  refundRules: [
    { daysBeforeTravel: 30, refundPercentage: 100 },
    { daysBeforeTravel: 14, refundPercentage: 50 },
    { daysBeforeTravel: 7, refundPercentage: 25 },
    { daysBeforeTravel: 0, refundPercentage: 0 }
  ]
}
```

### Refund Calculation

1. Check days until travel for each item
2. Apply cancellation policy rules
3. Calculate gross refund amount
4. Deduct 5% service fee
5. Process Stripe refund
6. Clawback agent commission if needed

---

## Next Steps (Future Phases)

### Phase 2: Repricing & Validations (Week 2)
- [ ] Scheduled repricing (weekly cron job)
- [ ] Price change email notifications
- [ ] Destination validation alerts
- [ ] Quote expiry automation

### Phase 3: Deposits & Payment Schedules (Week 3)
- [ ] Payment reminder cron job
- [ ] Email notification system
- [ ] Overdue payment escalation
- [ ] Auto-cancellation for non-payment

### Phase 4: Fund Allocation & Escrow (Week 4)
- [ ] Escrow release automation
- [ ] Supplier payment scheduling
- [ ] Booking confirmation webhooks
- [ ] Commission payout automation

### Phase 5: Stripe Connect (Week 5)
- [ ] Agent onboarding for Stripe Express accounts
- [ ] Automated commission transfers
- [ ] Payout tracking dashboard
- [ ] Multi-currency support

---

## Testing Checklist

- [ ] Full payment flow (test card)
- [ ] Deposit payment flow
- [ ] Balance payment after deposit
- [ ] Price change detection & acceptance
- [ ] Refund processing
- [ ] Commission calculation
- [ ] Fund allocation creation
- [ ] Payment status updates on quote

---

## Troubleshooting

### Payment Intent Creation Fails

**Issue**: `STRIPE_SECRET_KEY must be set in environment variables`

**Solution**: Add Stripe keys to `.env.local` file

### Price Repricing Shows Random Changes

**Issue**: `getAPICurrentPrice()` is using simulated variation

**Solution**: Replace with actual API calls to Hotel Beds, Amadeus, etc.

### Payment Modal Doesn't Open

**Issue**: Missing `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Solution**: Ensure public key has `NEXT_PUBLIC_` prefix in `.env.local`

---

## Security Considerations

1. **Never expose `STRIPE_SECRET_KEY`** - Server-side only
2. **Use HTTPS in production** - Required for Stripe
3. **Validate payment amounts** - Don't trust client-side calculations
4. **Implement webhook signature verification** - For production webhooks
5. **Store sensitive data securely** - Use database in production, not Zustand

---

## Support

For issues or questions:
- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- BookingGPT Issues: GitHub repository

---

**Last Updated**: October 2025
**Version**: 1.0.0 (Phase 1 Complete)
