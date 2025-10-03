/**
 * Markup Configuration
 *
 * Centralized configuration for pricing markups on supplier costs.
 * Supports default markup and agent-specific overrides.
 */

export interface MarkupConfig {
  defaultMarkupPercentage: number;
  agentMarkups?: Record<string, number>; // agentId -> markup percentage
  minMarkupPercentage?: number;
  maxMarkupPercentage?: number;
}

// Global markup configuration
const globalMarkupConfig: MarkupConfig = {
  defaultMarkupPercentage: 25, // 25% default markup
  minMarkupPercentage: 5,      // Minimum 5% markup
  maxMarkupPercentage: 100,    // Maximum 100% markup
  agentMarkups: {
    // Example agent-specific markups
    // 'agent_123': 30,  // This agent gets 30% markup
    // 'agent_456': 20,  // This agent gets 20% markup
  },
};

/**
 * Get markup percentage for a specific agent or default
 */
export function getMarkupPercentage(agentId?: string): number {
  // If agent-specific markup exists, use it
  if (agentId && globalMarkupConfig.agentMarkups?.[agentId]) {
    return globalMarkupConfig.agentMarkups[agentId];
  }

  // Otherwise use default
  return globalMarkupConfig.defaultMarkupPercentage;
}

/**
 * Calculate client price from supplier cost with markup
 */
export function calculateClientPrice(
  supplierCost: number,
  markupPercentage?: number,
  agentId?: string
): number {
  const markup = markupPercentage ?? getMarkupPercentage(agentId);

  // Validate markup within bounds
  const validatedMarkup = Math.max(
    globalMarkupConfig.minMarkupPercentage || 0,
    Math.min(markup, globalMarkupConfig.maxMarkupPercentage || 100)
  );

  return Math.round(supplierCost * (1 + validatedMarkup / 100) * 100) / 100;
}

/**
 * Calculate supplier cost from client price (reverse calculation)
 * Useful for manual entries where we only know client price
 */
export function calculateSupplierCost(
  clientPrice: number,
  markupPercentage?: number,
  agentId?: string
): number {
  const markup = markupPercentage ?? getMarkupPercentage(agentId);

  const validatedMarkup = Math.max(
    globalMarkupConfig.minMarkupPercentage || 0,
    Math.min(markup, globalMarkupConfig.maxMarkupPercentage || 100)
  );

  return Math.round(clientPrice / (1 + validatedMarkup / 100) * 100) / 100;
}

/**
 * Calculate profit from supplier cost and client price
 */
export function calculateProfit(supplierCost: number, clientPrice: number): number {
  return Math.round((clientPrice - supplierCost) * 100) / 100;
}

/**
 * Update global markup configuration
 */
export function updateMarkupConfig(config: Partial<MarkupConfig>): void {
  Object.assign(globalMarkupConfig, config);
}

/**
 * Get current markup configuration
 */
export function getMarkupConfig(): Readonly<MarkupConfig> {
  return { ...globalMarkupConfig };
}

/**
 * Set agent-specific markup
 */
export function setAgentMarkup(agentId: string, markupPercentage: number): void {
  if (!globalMarkupConfig.agentMarkups) {
    globalMarkupConfig.agentMarkups = {};
  }
  globalMarkupConfig.agentMarkups[agentId] = markupPercentage;
}

/**
 * Remove agent-specific markup (revert to default)
 */
export function removeAgentMarkup(agentId: string): void {
  if (globalMarkupConfig.agentMarkups) {
    delete globalMarkupConfig.agentMarkups[agentId];
  }
}
