/**
 * Arcjet Security & Rate Limiting
 *
 * Provides:
 * - Tier-based rate limiting (Free, Pro, Enterprise)
 * - Bot protection
 * - Email validation
 * - Attack protection (SQL injection, XSS)
 */

import arcjet, {
  tokenBucket,
  detectBot,
  shield,
  validateEmail,
} from '@arcjet/next';

if (!process.env.ARCJET_KEY) {
  throw new Error('ARCJET_KEY is not defined');
}

/**
 * Main Arcjet instance
 * Default configuration for all routes
 */
export const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ['ip'], // Track by IP for all requests (works for both authenticated and unauthenticated)
  rules: [
    // Bot detection
    detectBot({
      mode: 'LIVE', // Block bots in production
      allow: [
        'CATEGORY:SEARCH_ENGINE', // Allow Google, Bing, etc.
      ],
    }),
    // Shield against common attacks
    shield({
      mode: 'LIVE',
    }),
  ],
});

/**
 * Rate limit tiers based on subscription plans
 */

// Free tier: 10 requests/minute
export const freeTierRateLimit = tokenBucket({
  mode: 'LIVE',
  refillRate: 10, // tokens per interval
  interval: '1m', // 1 minute
  capacity: 10, // max burst
});

// Pro tier: 60 requests/minute
export const proTierRateLimit = tokenBucket({
  mode: 'LIVE',
  refillRate: 60,
  interval: '1m',
  capacity: 100, // Allow burst up to 100
});

// Enterprise tier: 300 requests/minute
export const enterpriseTierRateLimit = tokenBucket({
  mode: 'LIVE',
  refillRate: 300,
  interval: '1m',
  capacity: 500, // Large burst capacity
});

/**
 * Get rate limit rule based on subscription plan
 */
export function getRateLimitForPlan(
  plan: 'free' | 'pro' | 'enterprise'
): ReturnType<typeof tokenBucket> {
  switch (plan) {
    case 'free':
      return freeTierRateLimit;
    case 'pro':
      return proTierRateLimit;
    case 'enterprise':
      return enterpriseTierRateLimit;
    default:
      return freeTierRateLimit;
  }
}

/**
 * Arcjet instance for API routes with rate limiting
 */
export const ajApi = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ['ip'], // Track by IP to work with both authenticated and unauthenticated requests
  rules: [
    detectBot({
      mode: 'LIVE',
      allow: [],
    }),
    shield({
      mode: 'LIVE',
    }),
    // Default to free tier, override in route handlers
    freeTierRateLimit,
  ],
});

/**
 * Arcjet for authentication endpoints (stricter)
 */
export const ajAuth = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ['ip'], // Track by IP for unauthenticated requests
  rules: [
    detectBot({
      mode: 'LIVE',
      allow: [],
    }),
    shield({
      mode: 'LIVE',
    }),
    // Strict rate limit: 5 attempts per minute
    tokenBucket({
      mode: 'LIVE',
      refillRate: 5,
      interval: '1m',
      capacity: 5,
    }),
  ],
});

/**
 * Arcjet for webhook endpoints
 */
export const ajWebhook = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ['ip'],
  rules: [
    // Allow webhooks through, but protect against abuse
    tokenBucket({
      mode: 'LIVE',
      refillRate: 100,
      interval: '1m',
      capacity: 200,
    }),
  ],
});

/**
 * Email validation utility
 */
export const emailValidator = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    validateEmail({
      mode: 'LIVE',
      block: ['DISPOSABLE', 'NO_MX_RECORDS'],
    }),
  ],
});

/**
 * Helper to check if request should be blocked
 */
export function isBlocked(decision: any): boolean {
  return decision.isDenied();
}

/**
 * Helper to get error response for blocked requests
 */
export function getBlockedResponse(decision: any) {
  if (decision.reason.isRateLimit()) {
    return {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: decision.reason.resetTime,
    };
  }

  if (decision.reason.isBot()) {
    return {
      error: 'Bot detected',
      message: 'Automated requests are not allowed.',
    };
  }

  if (decision.reason.isShield()) {
    return {
      error: 'Security violation',
      message: 'Request blocked by security shield.',
    };
  }

  return {
    error: 'Request blocked',
    message: 'Your request has been blocked.',
  };
}
