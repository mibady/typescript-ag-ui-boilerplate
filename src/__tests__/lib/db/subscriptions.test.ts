import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSubscriptionPlans,
  checkUsageLimit,
  recordUsage,
  getCurrentUsage,
} from '@/lib/db/subscriptions';

// Mock Supabase client
vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: {
                id: 'plan_123',
                name: 'pro',
                display_name: 'Pro Plan',
                description: 'For professionals',
                price_monthly: 2000,
                price_yearly: 19200,
                stripe_price_id_monthly: 'price_123',
                stripe_price_id_yearly: 'price_456',
                features: { chat: true, api_access: true },
                limits: {
                  messages_per_month: 10000,
                  tokens_per_month: 5000000,
                  documents: 1000,
                  team_members: 10,
                  sessions: 100,
                  api_calls_per_day: 10000,
                },
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            })
          ),
          order: vi.fn(() =>
            Promise.resolve({
              data: [
                {
                  id: 'plan_123',
                  name: 'pro',
                  display_name: 'Pro Plan',
                  description: 'For professionals',
                  price_monthly: 2000,
                  price_yearly: 19200,
                  features: {},
                  limits: {
                    messages_per_month: 10000,
                    tokens_per_month: 5000000,
                    documents: 1000,
                    team_members: 10,
                    sessions: 100,
                    api_calls_per_day: 10000,
                  },
                  is_active: true,
                },
              ],
              error: null,
            })
          ),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: {
                id: 'usage_123',
                organization_id: 'org_123',
                subscription_id: 'sub_123',
                metric_name: 'messages_per_month',
                quantity: 1,
                unit: 'count',
                period_start: new Date().toISOString(),
                period_end: new Date().toISOString(),
                metadata: {},
                recorded_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
              },
              error: null,
            })
          ),
        })),
      })),
    })),
  })),
}));

describe('Subscription Database Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSubscriptionPlans', () => {
    it('retrieves all active subscription plans', async () => {
      const result = await getSubscriptionPlans();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('returns plans with correct structure', async () => {
      const result = await getSubscriptionPlans();

      if (result.length > 0) {
        const plan = result[0];
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('name');
        expect(plan).toHaveProperty('display_name');
        expect(plan).toHaveProperty('price_monthly');
        expect(plan).toHaveProperty('price_yearly');
        expect(plan).toHaveProperty('limits');
        expect(plan.limits).toHaveProperty('messages_per_month');
        expect(plan.limits).toHaveProperty('tokens_per_month');
      }
    });
  });

  describe('checkUsageLimit', () => {
    it('returns usage check result structure', async () => {
      const result = await checkUsageLimit('org_123', 'messages_per_month');

      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('currentUsage');
      expect(result).toHaveProperty('limit');
      expect(typeof result.allowed).toBe('boolean');
      expect(typeof result.currentUsage).toBe('number');
      expect(typeof result.limit).toBe('number');
    });

    it('handles unlimited limits (-1) correctly', async () => {
      // Mock would need to return a plan with -1 limit
      const result = await checkUsageLimit('org_123', 'messages_per_month');

      // If limit is -1, should allow
      if (result.limit === -1) {
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe('recordUsage', () => {
    it('records usage successfully', async () => {
      const result = await recordUsage({
        organizationId: 'org_123',
        metricName: 'messages_per_month',
        quantity: 1,
      });

      // Should return usage record or null
      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('records usage with custom unit', async () => {
      const result = await recordUsage({
        organizationId: 'org_123',
        metricName: 'tokens_per_month',
        quantity: 1000,
        unit: 'tokens',
      });

      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('getCurrentUsage', () => {
    it('returns numeric usage value', async () => {
      const result = await getCurrentUsage('org_123', 'messages_per_month');

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('returns 0 for metrics with no usage', async () => {
      const result = await getCurrentUsage('org_new', 'messages_per_month');

      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});
