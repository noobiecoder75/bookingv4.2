import { getStripeInstance } from './config';

/**
 * Stripe Connect - Agent Payout Integration (Future Enhancement)
 *
 * This module handles Stripe Connect for paying agent commissions
 * via automated transfers. Agents set up their Stripe Express accounts
 * and receive commission payouts automatically.
 */

/**
 * Create a Stripe Connect Express account for an agent
 */
export async function createConnectedAccount(
  agentEmail: string,
  agentName: string
): Promise<string> {
  const stripe = getStripeInstance();

  const account = await stripe.accounts.create({
    type: 'express',
    email: agentEmail,
    business_type: 'individual',
    capabilities: {
      transfers: { requested: true },
    },
    metadata: {
      role: 'travel_agent',
      agentName,
    },
  });

  return account.id;
}

/**
 * Create onboarding link for agent to complete Stripe Connect setup
 */
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<string> {
  const stripe = getStripeInstance();

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return accountLink.url;
}

/**
 * Transfer commission to agent's connected account
 */
export async function transferCommissionToAgent(
  agentStripeAccountId: string,
  commissionAmount: number,
  quoteId: string,
  commissionId: string
): Promise<string> {
  const stripe = getStripeInstance();

  const transfer = await stripe.transfers.create({
    amount: Math.round(commissionAmount * 100), // Convert to cents
    currency: 'usd',
    destination: agentStripeAccountId,
    metadata: {
      quoteId,
      commissionId,
      type: 'agent_commission',
    },
    description: `Commission for quote ${quoteId}`,
  });

  return transfer.id;
}

/**
 * Retrieve agent's connected account details
 */
export async function getConnectedAccountDetails(accountId: string) {
  const stripe = getStripeInstance();

  const account = await stripe.accounts.retrieve(accountId);

  return {
    id: account.id,
    email: account.email,
    payoutsEnabled: account.payouts_enabled,
    chargesEnabled: account.charges_enabled,
    detailsSubmitted: account.details_submitted,
  };
}

/**
 * Check if agent's account is ready to receive payouts
 */
export async function isAccountReadyForPayouts(accountId: string): Promise<boolean> {
  const details = await getConnectedAccountDetails(accountId);
  return details.payoutsEnabled && details.detailsSubmitted;
}
