/**
 * Subscription Status API Tests
 * Phase 7: Testing & QA
 *
 * Real tests for /api/billing/subscription GET endpoint
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { GET } from '@/app/api/billing/subscription/route';
import { NextRequest } from 'next/server';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock database functions
vi.mock('@/lib/db/subscriptions', () => ({
  getSubscriptionWithPlan: vi.fn(),
  getOrganizationUsage: vi.fn(),
  getPaymentHistory: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import {
  getSubscriptionWithPlan,
  getOrganizationUsage,
  getPaymentHistory,
} from '@/lib/db/subscriptions';

describe('Subscription Status API - GET /api/billing/subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // AUTHENTICATION TESTS
  // ============================================================================

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      (auth as unknown as Mock).mockResolvedValue({ userId: null, orgId: null });

      const request = new NextRequest(
        'http://localhost:3000/api/billing/subscription',
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when userId is missing', async () => {
      (auth as unknown as Mock).mockResolvedValue({ userId: null, orgId: 'org_123' });

      const request = new NextRequest(
        'http://localhost:3000/api/billing/subscription',
        { method: 'GET' }
      );

      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it('should return 401 when orgId is missing', async () => {
      (auth as unknown as Mock).mockResolvedValue({ userId: 'user_123', orgId: null });

      const request = new NextRequest(
        'http://localhost:3000/api/billing/subscription',
        { method: 'GET' }
      );

      const response = await GET(request);
      expect(response.status).toBe(401);
    });
  });

  // ============================================================================
  // SUBSCRIPTION WITH PLAN TESTS
  // ============================================================================

  describe('Subscription Data Retrieval', () => {
    beforeEach(() => {
      (auth as unknown as Mock).mockResolvedValue({ userId: 'user_123', orgId: 'org_123' });
    });

    it('should return subscription with plan, usage, and payments', async () => {
      const mockSubscription = {
        id: 'sub_123',
        organization_id: 'org_123',
        plan_id: 'plan_pro',
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_stripe_123',
        stripe_price_id: 'price_123',
        status: 'active' as const,
        billing_cycle: 'monthly' as const,
        current_period_start: '2025-01-01T00:00:00.000Z',
        current_period_end: '2025-02-01T00:00:00.000Z',
        trial_end: null,
        cancel_at: null,
        canceled_at: null,
        metadata: {},
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
        plan: {
          id: 'plan_pro',
          name: 'pro',
          display_name: 'Pro Plan',
          description: 'For professionals',
          price_monthly: 2000,
          price_yearly: 19200,
          stripe_price_id_monthly: 'price_monthly_123',
          stripe_price_id_yearly: 'price_yearly_123',
          features: {
            chat: true,
            api_access: true,
            priority_support: true,
          },
          limits: {
            messages_per_month: 10000,
            tokens_per_month: 5000000,
            documents: 1000,
            team_members: 10,
            sessions: 100,
            api_calls_per_day: 10000,
          },
          is_active: true,
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-01T00:00:00.000Z',
        },
      };

      const mockUsage = {
        messages_per_month: 250,
        tokens_per_month: 125000,
        documents: 5,
      };

      const mockPayments = [
        {
          id: 'pay_1',
          amount: 2000,
          currency: 'usd',
          status: 'succeeded',
          paid_at: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 'pay_2',
          amount: 2000,
          currency: 'usd',
          status: 'succeeded',
          paid_at: '2024-12-01T00:00:00.000Z',
        },
      ];

      (getSubscriptionWithPlan as Mock).mockResolvedValue(mockSubscription);
      (getOrganizationUsage as Mock).mockResolvedValue(mockUsage);
      (getPaymentHistory as Mock).mockResolvedValue(mockPayments);

      const request = new NextRequest(
        'http://localhost:3000/api/billing/subscription',
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('subscription');
      expect(data).toHaveProperty('plan');
      expect(data).toHaveProperty('usage');
      expect(data).toHaveProperty('payments');

      expect(data.subscription).toEqual({
        id: 'sub_123',
        status: 'active',
        billing_cycle: 'monthly',
        current_period_start: '2025-01-01T00:00:00.000Z',
        current_period_end: '2025-02-01T00:00:00.000Z',
        trial_end: null,
        cancel_at: null,
      });

      expect(data.plan).toEqual({
        id: 'plan_pro',
        name: 'pro',
        display_name: 'Pro Plan',
        description: 'For professionals',
        price_monthly: 2000,
        price_yearly: 19200,
        features: {
          chat: true,
          api_access: true,
          priority_support: true,
        },
        limits: {
          messages_per_month: 10000,
          tokens_per_month: 5000000,
          documents: 1000,
          team_members: 10,
          sessions: 100,
          api_calls_per_day: 10000,
        },
      });

      expect(data.usage).toEqual(mockUsage);
      expect(data.payments).toEqual(mockPayments);
    });

    it('should call database functions with correct parameters', async () => {
      (getSubscriptionWithPlan as Mock).mockResolvedValue({
        plan: {
          id: 'plan_pro',
          name: 'pro',
          limits: {},
          features: {},
        },
      });
      (getOrganizationUsage as Mock).mockResolvedValue({});
      (getPaymentHistory as Mock).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/billing/subscription',
        { method: 'GET' }
      );

      await GET(request);

      expect(getSubscriptionWithPlan).toHaveBeenCalledWith('org_123');
      expect(getOrganizationUsage).toHaveBeenCalledWith('org_123');
      expect(getPaymentHistory).toHaveBeenCalledWith('org_123', { limit: 10 });
    });
  });

  // ============================================================================
  // FREE PLAN DEFAULT TESTS
  // ============================================================================

  describe('Free Plan Default', () => {
    beforeEach(() => {
      (auth as unknown as Mock).mockResolvedValue({ userId: 'user_free', orgId: 'org_free' });
    });

    it('should return free plan when no subscription exists', async () => {
      (getSubscriptionWithPlan as Mock).mockResolvedValue(null);
      (getOrganizationUsage as Mock).mockResolvedValue({});
      (getPaymentHistory as Mock).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/billing/subscription',
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subscription.status).toBe('active');
      expect(data.plan.name).toBe('free');
      expect(data.plan.display_name).toBe('Free Plan');
      expect(data.plan.price_monthly).toBe(0);
      expect(data.plan.price_yearly).toBe(0);
    });

    it('should include free plan limits when no subscription', async () => {
      (getSubscriptionWithPlan as Mock).mockResolvedValue(null);
      (getOrganizationUsage as Mock).mockResolvedValue({});
      (getPaymentHistory as Mock).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/billing/subscription',
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.plan.limits).toEqual({
        messages_per_month: 100,
        tokens_per_month: 50000,
        documents: 10,
        team_members: 1,
        sessions: 5,
        api_calls_per_day: 100,
      });
    });

    it('should include free plan features when no subscription', async () => {
      (getSubscriptionWithPlan as Mock).mockResolvedValue(null);
      (getOrganizationUsage as Mock).mockResolvedValue({});
      (getPaymentHistory as Mock).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/billing/subscription',
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.plan.features).toEqual({
        chat: true,
        basic_agents: true,
        email_support: false,
        priority_support: false,
        custom_integrations: false,
      });
    });
  });

  // ============================================================================
  // TRIAL SUBSCRIPTION TESTS
  // ============================================================================

  describe('Trial Subscriptions', () => {
    beforeEach(() => {
      (auth as unknown as Mock).mockResolvedValue({ userId: 'user_trial', orgId: 'org_trial' });
    });

    it('should return trial subscription with trial_end date', async () => {
      const mockSubscription = {
        id: 'sub_trial',
        organization_id: 'org_trial',
        status: 'trialing' as const,
        billing_cycle: 'monthly' as const,
        current_period_start: '2025-01-01T00:00:00.000Z',
        current_period_end: '2025-02-01T00:00:00.000Z',
        trial_end: '2025-01-15T00:00:00.000Z',
        cancel_at: null,
        canceled_at: null,
        plan: {
          id: 'plan_pro',
          name: 'pro',
          display_name: 'Pro Plan',
          description: 'Trial active',
          price_monthly: 2000,
          price_yearly: 19200,
          features: {},
          limits: {},
          is_active: true,
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-01T00:00:00.000Z',
        },
      };

      (getSubscriptionWithPlan as Mock).mockResolvedValue(mockSubscription);
      (getOrganizationUsage as Mock).mockResolvedValue({});
      (getPaymentHistory as Mock).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/billing/subscription',
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subscription.status).toBe('trialing');
      expect(data.subscription.trial_end).toBe('2025-01-15T00:00:00.000Z');
    });
  });

  // ============================================================================
  // CANCELED SUBSCRIPTION TESTS
  // ============================================================================

  describe('Canceled Subscriptions', () => {
    beforeEach(() => {
      (auth as unknown as Mock).mockResolvedValue({
        userId: 'user_canceled',
        orgId: 'org_canceled',
      });
    });

    it('should return canceled subscription with cancel_at date', async () => {
      const mockSubscription = {
        id: 'sub_canceled',
        organization_id: 'org_canceled',
        status: 'active' as const, // Still active until cancel_at
        billing_cycle: 'monthly' as const,
        current_period_start: '2025-01-01T00:00:00.000Z',
        current_period_end: '2025-02-01T00:00:00.000Z',
        trial_end: null,
        cancel_at: '2025-02-01T00:00:00.000Z',
        canceled_at: null,
        plan: {
          id: 'plan_pro',
          name: 'pro',
          display_name: 'Pro Plan',
          description: 'Canceled at end of period',
          price_monthly: 2000,
          price_yearly: 19200,
          features: {},
          limits: {},
          is_active: true,
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-01T00:00:00.000Z',
        },
      };

      (getSubscriptionWithPlan as Mock).mockResolvedValue(mockSubscription);
      (getOrganizationUsage as Mock).mockResolvedValue({});
      (getPaymentHistory as Mock).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/billing/subscription',
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subscription.status).toBe('active');
      expect(data.subscription.cancel_at).toBe('2025-02-01T00:00:00.000Z');
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    beforeEach(() => {
      (auth as unknown as Mock).mockResolvedValue({ userId: 'user_error', orgId: 'org_error' });
    });

    it('should return 500 when database query fails', async () => {
      (getSubscriptionWithPlan as Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/billing/subscription',
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch subscription');
    });

    it('should return 500 when usage query fails', async () => {
      (getSubscriptionWithPlan as Mock).mockResolvedValue(null);
      (getOrganizationUsage as Mock).mockRejectedValue(new Error('Usage error'));

      const request = new NextRequest(
        'http://localhost:3000/api/billing/subscription',
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch subscription');
    });

    it('should return 500 when payment history query fails', async () => {
      (getSubscriptionWithPlan as Mock).mockResolvedValue(null);
      (getOrganizationUsage as Mock).mockResolvedValue({});
      (getPaymentHistory as Mock).mockRejectedValue(new Error('Payment error'));

      const request = new NextRequest(
        'http://localhost:3000/api/billing/subscription',
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch subscription');
    });
  });
});
