/**
 * LLM Cost Calculator
 *
 * Calculates costs for LLM API usage across different providers.
 * Pricing as of January 2025.
 */

// Pricing per 1M tokens (in USD)
export const PRICING = {
  // OpenAI
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-4': { input: 30.0, output: 60.0 },
  'gpt-4-32k': { input: 60.0, output: 120.0 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  'gpt-3.5-turbo-16k': { input: 3.0, output: 4.0 },

  // Anthropic Claude
  'claude-3-opus': { input: 15.0, output: 75.0 },
  'claude-3-sonnet': { input: 3.0, output: 15.0 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  'claude-2.1': { input: 8.0, output: 24.0 },
  'claude-2.0': { input: 8.0, output: 24.0 },

  // Google
  'gemini-pro': { input: 0.50, output: 1.50 },
  'gemini-pro-vision': { input: 0.50, output: 1.50 },

  // Mistral
  'mistral-large': { input: 4.0, output: 12.0 },
  'mistral-medium': { input: 2.7, output: 8.1 },
  'mistral-small': { input: 1.0, output: 3.0 },
  'mistral-tiny': { input: 0.25, output: 0.75 },
};

/**
 * Calculate cost for LLM usage
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Normalize model name (remove provider prefix if present)
  const normalizedModel = model.toLowerCase().replace(/^(openai|anthropic|google|mistral)-/, '');

  // Get pricing for model (fallback to gpt-3.5-turbo if not found)
  const pricing = PRICING[normalizedModel as keyof typeof PRICING] || PRICING['gpt-3.5-turbo'];

  // Calculate cost (pricing is per 1M tokens)
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Format cost as USD string
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 1000).toFixed(4)}`;
  }
  return `$${cost.toFixed(4)}`;
}

/**
 * Estimate cost for a request before making it
 */
export function estimateCost(
  model: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): {
  cost: number;
  costFormatted: string;
  breakdown: {
    input: number;
    output: number;
  };
} {
  const cost = calculateCost(model, estimatedInputTokens, estimatedOutputTokens);

  const normalizedModel = model.toLowerCase().replace(/^(openai|anthropic|google|mistral)-/, '');
  const pricing = PRICING[normalizedModel as keyof typeof PRICING] || PRICING['gpt-3.5-turbo'];

  const inputCost = (estimatedInputTokens / 1_000_000) * pricing.input;
  const outputCost = (estimatedOutputTokens / 1_000_000) * pricing.output;

  return {
    cost,
    costFormatted: formatCost(cost),
    breakdown: {
      input: inputCost,
      output: outputCost,
    },
  };
}

/**
 * Get pricing information for a model
 */
export function getPricing(model: string): {
  input: number;
  output: number;
  inputPer1k: string;
  outputPer1k: string;
} | null {
  const normalizedModel = model.toLowerCase().replace(/^(openai|anthropic|google|mistral)-/, '');
  const pricing = PRICING[normalizedModel as keyof typeof PRICING];

  if (!pricing) {
    return null;
  }

  return {
    ...pricing,
    inputPer1k: `$${(pricing.input / 1000).toFixed(4)}`,
    outputPer1k: `$${(pricing.output / 1000).toFixed(4)}`,
  };
}

/**
 * Calculate total cost for multiple LLM calls
 */
export function calculateTotalCost(
  calls: Array<{
    model: string;
    inputTokens: number;
    outputTokens: number;
  }>
): {
  total: number;
  totalFormatted: string;
  byModel: Record<string, { cost: number; calls: number }>;
} {
  let total = 0;
  const byModel: Record<string, { cost: number; calls: number }> = {};

  for (const call of calls) {
    const cost = calculateCost(call.model, call.inputTokens, call.outputTokens);
    total += cost;

    if (!byModel[call.model]) {
      byModel[call.model] = { cost: 0, calls: 0 };
    }

    byModel[call.model].cost += cost;
    byModel[call.model].calls += 1;
  }

  return {
    total,
    totalFormatted: formatCost(total),
    byModel,
  };
}

/**
 * Example usage:
 *
 * ```typescript
 * import { calculateCost, formatCost, estimateCost } from '@/lib/llm/cost-calculator';
 *
 * // Calculate cost for actual usage
 * const cost = calculateCost('gpt-4', 1000, 500);
 * console.log(formatCost(cost)); // "$0.0450"
 *
 * // Estimate cost before making request
 * const estimate = estimateCost('claude-3-sonnet', 2000, 1000);
 * console.log(estimate.costFormatted); // "$0.0210"
 * console.log(estimate.breakdown); // { input: 0.006, output: 0.015 }
 *
 * // Get pricing info
 * const pricing = getPricing('gpt-3.5-turbo');
 * console.log(pricing); // { input: 0.5, output: 1.5, ... }
 * ```
 */
