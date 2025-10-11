/**
 * Checkout API Tests
 * Phase 7: Testing & QA
 *
 * Real tests for /api/billing/checkout POST endpoint
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { POST } from '@/app/api/billing/checkout/route';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock database functions
vi.mock('@/lib/db/subscriptions', () => ({
  getSubscriptionPlan: vi.fn(),
}));

// Mock Stripe
vi.mock('stripe', () => {
  const mockStripe = {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
    customers: {
      list: vi.fn(),
      create: vi.fn(),
    },
  };
  return {
    default: vi.fn(() => mockStripe),
  };
});

import { auth } from '@clerk/nextjs/server';
import { getSubscriptionPlan } from '@/lib/db/subscriptions';

describe('Checkout API - POST /api/billing/checkout', () => {
  let mockRequest: NextRequest;
  let mockStripe: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Stripe instance
    mockStripe = new Stripe('sk_test_123', { apiVersion: '2025-09-30.clover' as any });

    // Setup environment
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  describe('Authentication Tests', () => {
    it('should return 401 for unauthenticated users', async () => {
      (auth as Mock).mockResolvedValue({ userId: null, orgId: null });

      mockRequest = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: 'plan_123' }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when userId is missing', async () => {
      (auth as Mock).mockResolvedValue({ userId: null, orgId: 'org_123' });

      mockRequest = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: 'plan_123' }),
      });

      const response = await POST(mockRequest);
      expect(response.status).toBe(401);
    });

    it('should return 401 when orgId is missing', async () => {
      (auth as Mock).mockResolvedValue({ userId: 'user_123', orgId: null });

      mockRequest = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: 'plan_123' }),
      });

      const response = await POST(mockRequest);
      expect(response.status).toBe(401);
    });
  });

  describe('Input Validation Tests', () => {
    beforeEach(() => {
      (auth as Mock).mockResolvedValue({ userId: 'user_123', orgId: 'org_123' });
    });

    it('should return 400 when planId is missing', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Plan ID is required');
    });

    it('should return 404 when plan does not exist', async () => {
      (getSubscriptionPlan as Mock).mockResolvedValue(null);

      mockRequest = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: 'invalid_plan' }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Plan not found');
    });

    it('should return 400 when price is not configured for billing cycle', async () => {
      (getSubscriptionPlan as Mock).mockResolvedValue({
        id: 'plan_123',
        name: 'pro',
        stripe_price_id_monthly: 'price_123',
        stripe_price_id_yearly: null, // No yearly price
      });

      mockRequest = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: 'plan_123', billingCycle: 'yearly' }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Price not configured for this plan');
    });
  });

  describe('Checkout Session Creation Tests', () => {
    beforeEach(() => {
      (auth as Mock).mockResolvedValue({ userId: 'user_123', orgId: 'org_123' });

      // Mock customer lookup/creation
      mockStripe.customers.list.mockResolvedValue({
        data: [{ id: 'cus_123', email: 'org-org_123@placeholder.com' }],
      });
    });

    it('should create checkout session with correct parameters for monthly billing', async () => {
      const mockPlan = {
        id: 'plan_pro',
        name: 'pro',
        stripe_price_id_monthly: 'price_monthly_123',
        stripe_price_id_yearly: 'price_yearly_123',
      };

      (getSubscriptionPlan as Mock).mockResolvedValue(mockPlan);

      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      });

      mockRequest = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: 'plan_pro', billingCycle: 'monthly' }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessionId).toBe('cs_test_123');
      expect(data.url).toBe('https://checkout.stripe.com/pay/cs_test_123');

      // Verify Stripe session was created with correct params
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_123',
          mode: 'subscription',
          line_items: [{ price: 'price_monthly_123', quantity: 1 }],
        })
      );
    });

    it('should use yearly price when billingCycle is yearly', async () => {
      const mockPlan = {
        id: 'plan_pro',
        name: 'pro',
        stripe_price_id_monthly: 'price_monthly_123',
        stripe_price_id_yearly: 'price_yearly_123',
      };

      (getSubscriptionPlan as Mock).mockResolvedValue(mockPlan);

      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_456',
        url: 'https://checkout.stripe.com/pay/cs_test_456',
      });

      mockRequest = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: 'plan_pro', billingCycle: 'yearly' }),
      });

      await POST(mockRequest);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [{ price: 'price_yearly_123', quantity: 1 }],
        })
      );
    });

    it('should include 14-day trial for Pro plan', async () => {
      const mockPlan = {
        id: 'plan_pro',
        name: 'pro',
        stripe_price_id_monthly: 'price_123',
      };

      (getSubscriptionPlan as Mock).mockResolvedValue(mockPlan);

      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_789',
        url: 'https://checkout.stripe.com/pay/cs_test_789',
      });

      mockRequest = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: 'plan_pro' }),
      });

      await POST(mockRequest);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_data: expect.objectContaining({
            trial_period_days: 14,
          }),
        })
      );
    });

    it('should not include trial for Free plan', async () => {
      const mockPlan = {
        id: 'plan_free',
        name: 'free',
        stripe_price_id_monthly: 'price_free_123',
      };

      (getSubscriptionPlan as Mock).mockResolvedValue(mockPlan);

      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_free',
        url: 'https://checkout.stripe.com/pay/cs_test_free',
      });

      mockRequest = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: 'plan_free' }),
      });

      await POST(mockRequest);

      const callArgs = mockStripe.checkout.sessions.create.mock.calls[0][0];
      expect(callArgs.subscription_data.trial_period_days).toBeUndefined();
    });

    it('should set correct metadata for subscription', async () => {
      const mockPlan = {
        id: 'plan_pro',
        name: 'pro',
        stripe_price_id_monthly: 'price_123',
      };

      (getSubscriptionPlan as Mock).mockResolvedValue(mockPlan);

      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_meta',
        url: 'https://checkout.stripe.com/pay/cs_test_meta',
      });

      mockRequest = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: 'plan_pro' }),
      });

      await POST(mockRequest);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            organization_id: 'org_123',
            user_id: 'user_123',
            plan_id: 'plan_pro',
          },
          subscription_data: expect.objectContaining({
            metadata: {
              organization_id: 'org_123',
              user_id: 'user_123',
              plan_id: 'plan_pro',
            },
          }),
        })
      );
    });
  });

  describe('Customer Management Tests', () => {
    beforeEach(() => {
      (auth as Mock).mockResolvedValue({ userId: 'user_123', orgId: 'org_123' });

      const mockPlan = {
        id: 'plan_pro',
        name: 'pro',
        stripe_price_id_monthly: 'price_123',
      };
      (getSubscriptionPlan as Mock).mockResolvedValue(mockPlan);

      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/pay/cs_test',
      });
    });

    it('should reuse existing Stripe customer', async () => {
      mockStripe.customers.list.mockResolvedValue({
        data: [{ id: 'existing_cus_123' }],
      });

      mockRequest = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: 'plan_pro' }),
      });

      await POST(mockRequest);

      expect(mockStripe.customers.create).not.toHaveBeenCalled();
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'existing_cus_123',
        })
      );
    });

    it('should create new Stripe customer if none exists', async () => {
      mockStripe.customers.list.mockResolvedValue({ data: [] });
      mockStripe.customers.create.mockResolvedValue({ id: 'new_cus_456' });

      mockRequest = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: 'plan_pro' }),
      });

      await POST(mockRequest);

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'org-org_123@placeholder.com',
        metadata: {
          organization_id: 'org_123',
          user_id: 'user_123',
        },
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'new_cus_456',
        })
      );
    });
  });

  describe('Error Handling Tests', () => {
    beforeEach(() => {
      (auth as Mock).mockResolvedValue({ userId: 'user_123', orgId: 'org_123' });
    });

    it('should return 500 when Stripe API fails', async () => {
      const mockPlan = {
        id: 'plan_pro',
        name: 'pro',
        stripe_price_id_monthly: 'price_123',
      };
      (getSubscriptionPlan as Mock).mockResolvedValue(mockPlan);

      mockStripe.customers.list.mockResolvedValue({ data: [{ id: 'cus_123' }] });
      mockStripe.checkout.sessions.create.mockRejectedValue(
        new Error('Stripe API error')
      );

      mockRequest = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: 'plan_pro' }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create checkout session');
    });

    it('should return 500 when database query fails', async () => {
      (getSubscriptionPlan as Mock).mockRejectedValue(new Error('Database error'));

      mockRequest = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: 'plan_pro' }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create checkout session');
    });
  });

  describe('Response Format Tests', () => {
    beforeEach(() => {
      (auth as Mock).mockResolvedValue({ userId: 'user_123', orgId: 'org_123' });

      const mockPlan = {
        id: 'plan_pro',
        name: 'pro',
        stripe_price_id_monthly: 'price_123',
      };
      (getSubscriptionPlan as Mock).mockResolvedValue(mockPlan);

      mockStripe.customers.list.mockResolvedValue({
        data: [{ id: 'cus_123' }],
      });
    });

    it('should return correct response structure on success', async () => {
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_success_123',
        url: 'https://checkout.stripe.com/pay/cs_success_123',
      });

      mockRequest = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: 'plan_pro' }),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data).toEqual({
        sessionId: 'cs_success_123',
        url: 'https://checkout.stripe.com/pay/cs_success_123',
      });
    });

    it('should return error object with message on failure', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({}), // Missing planId
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    });
  });
});
