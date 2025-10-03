/**
 * Currency Conversion Utility
 *
 * Handles currency normalization for profit calculations.
 * Ensures all amounts are converted to a base currency before comparison.
 */

// Exchange rates (in production, fetch from API like exchangerate-api.com)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.53,
  JPY: 149.50,
  CHF: 0.88,
  CNY: 7.24,
  INR: 83.12,
  MXN: 17.05,
};

export const BASE_CURRENCY = 'USD';

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string = BASE_CURRENCY
): number {
  // Normalize currency codes
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  // Same currency - no conversion needed
  if (from === to) {
    return amount;
  }

  // Get exchange rates
  const fromRate = EXCHANGE_RATES[from];
  const toRate = EXCHANGE_RATES[to];

  if (!fromRate || !toRate) {
    console.warn(
      `⚠️ [Currency] Unknown currency: ${from} or ${to}. Using amount as-is.`
    );
    return amount;
  }

  // Convert: amount in fromCurrency → USD → toCurrency
  const amountInUSD = amount / fromRate;
  const convertedAmount = amountInUSD * toRate;

  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimals
}

/**
 * Convert amount to base currency (USD)
 */
export function toBaseCurrency(amount: number, fromCurrency: string): number {
  return convertCurrency(amount, fromCurrency, BASE_CURRENCY);
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(amount: number, currency: string = BASE_CURRENCY): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥',
    CHF: 'CHF',
    CNY: '¥',
    INR: '₹',
    MXN: 'MX$',
  };

  const symbol = symbols[currency.toUpperCase()] || currency;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${symbol}${formatted}`;
}

/**
 * Calculate profit with currency normalization
 */
export function calculateNormalizedProfit(
  revenue: number,
  revenueCurrency: string,
  cost: number,
  costCurrency: string
): {
  profit: number;
  profitCurrency: string;
  revenueInBase: number;
  costInBase: number;
} {
  const revenueInBase = toBaseCurrency(revenue, revenueCurrency);
  const costInBase = toBaseCurrency(cost, costCurrency);
  const profit = revenueInBase - costInBase;

  return {
    profit,
    profitCurrency: BASE_CURRENCY,
    revenueInBase,
    costInBase,
  };
}

/**
 * Update exchange rates (call this periodically in production)
 */
export async function updateExchangeRates(): Promise<void> {
  // TODO: Fetch from API like exchangerate-api.com
  // For now, this is a placeholder
  console.log('📊 [Currency] Exchange rates update not implemented yet');
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(EXCHANGE_RATES);
}

/**
 * Check if currency is supported
 */
export function isCurrencySupported(currency: string): boolean {
  return currency.toUpperCase() in EXCHANGE_RATES;
}
