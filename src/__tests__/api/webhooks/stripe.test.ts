/**
 * Stripe Webhook Handler Tests
 * Phase 7: Testing & QA
 *
 * Real tests for /api/webhooks/stripe POST endpoint
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { POST } from '@/app/api/webhooks/stripe/route';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

// Mock Next.js headers
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

// Mock database functions
vi.mock('@/lib/db/subscriptions', () => ({
  createSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  getOrganizationSubscription: vi.fn(),
  createPaymentRecord: vi.fn(),
  getSubscriptionPlanByName: vi.fn(),
}));

// Mock Stripe
vi.mock('stripe', () => {
  const mockStripe = {
    webhooks: {
      constructEvent: vi.fn(),
    },
  };
  return {
    default: vi.fn(() => mockStripe),
  };
});

import { headers } from 'next/headers';
import {
  createSubscription,
  updateSubscription,
  getOrganizationSubscription,
  createPaymentRecord,
  getSubscriptionPlanByName,
} from '@/lib/db/subscriptions';

describe('Stripe Webhook Handler - POST /api/webhooks/stripe', () => {
  let mockStripe: any;
  let mockHeaders: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Stripe instance
    mockStripe = new Stripe('sk_test_123', { apiVersion: '2025-09-30.clover' as any });

    // Setup mock headers
    mockHeaders = headers as Mock;

    // Setup environment
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  // ============================================================================
  // SIGNATURE VERIFICATION TESTS
  // ============================================================================

  describe('Signature Verification', () => {
    it('should return 400 when stripe-signature header is missing', async () => {
      mockHeaders.mockResolvedValue(new Map());

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'test.event' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No signature');
    });

    it('should return 400 when signature verification fails', async () => {
      const headerMap = new Map();
      headerMap.set('stripe-signature', 'invalid_signature');
      mockHeaders.mockResolvedValue(headerMap);

      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'test.event' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid signature');
    });

    it('should process event when signature is valid', async () => {
      const headerMap = new Map();
      headerMap.set('stripe-signature', 'valid_signature');
      mockHeaders.mockResolvedValue(headerMap);

      const mockEvent = {
        id: 'evt_test_123',
        type: 'customer.created',
        data: {
          object: {
            id: 'cus_test_123',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      // Verify constructEvent was called (body string, signature, and secret)
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalled();
      const callArgs = mockStripe.webhooks.constructEvent.mock.calls[0];
      expect(callArgs[1]).toBe('valid_signature');
    });
  });

  // ============================================================================
  // SUBSCRIPTION CREATED TESTS
  // ============================================================================

  describe('customer.subscription.created Event', () => {
    beforeEach(() => {
      const headerMap = new Map();
      headerMap.set('stripe-signature', 'valid_signature');
      mockHeaders.mockResolvedValue(headerMap);
    });

    it('should create subscription in database with correct data', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        status: 'active',
        metadata: {
          organization_id: 'org_123',
          user_id: 'user_123',
        },
        items: {
          data: [
            {
              id: 'si_test',
              price: {
                id: 'price_monthly_123',
                recurring: { interval: 'month' },
              } as Stripe.Price,
            } as Stripe.SubscriptionItem,
          ],
        } as Stripe.ApiList<Stripe.SubscriptionItem>,
        trial_end: 1735689600, // 2025-01-01
      };

      const mockEvent = {
        id: 'evt_test_123',
        type: 'customer.subscription.created',
        data: { object: mockSubscription },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      (getSubscriptionPlanByName as Mock).mockResolvedValue({
        id: 'plan_pro',
        name: 'pro',
        stripe_price_id_monthly: 'price_monthly_123',
      });

      (createSubscription as Mock).mockResolvedValue({
        id: 'db_sub_123',
        organization_id: 'org_123',
        plan_id: 'plan_pro',
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org_123',
          planId: 'plan_pro',
          stripeCustomerId: 'cus_test_123',
          stripeSubscriptionId: 'sub_test_123',
          stripePriceId: 'price_monthly_123',
          billingCycle: 'monthly',
          status: 'active',
          trialEnd: '2025-01-01T00:00:00.000Z',
        })
      );
    });

    it('should handle yearly billing cycle correctly', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_test_456',
        customer: 'cus_test_456',
        status: 'active',
        metadata: { organization_id: 'org_456' },
        items: {
          data: [
            {
              id: 'si_test',
              price: {
                id: 'price_yearly_456',
                recurring: { interval: 'year' },
              } as Stripe.Price,
            } as Stripe.SubscriptionItem,
          ],
        } as Stripe.ApiList<Stripe.SubscriptionItem>,
      };

      const mockEvent = {
        id: 'evt_test_456',
        type: 'customer.subscription.created',
        data: { object: mockSubscription },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      (getSubscriptionPlanByName as Mock).mockResolvedValue({
        id: 'plan_enterprise',
        stripe_price_id_yearly: 'price_yearly_456',
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      await POST(request);

      expect(createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          billingCycle: 'yearly',
        })
      );
    });

    it('should not create subscription when organization_id is missing', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_no_org',
        customer: 'cus_test',
        status: 'active',
        metadata: {}, // No organization_id
        items: {
          data: [
            {
              id: 'si_test',
              price: { id: 'price_123' } as Stripe.Price,
            } as Stripe.SubscriptionItem,
          ],
        } as Stripe.ApiList<Stripe.SubscriptionItem>,
      };

      const mockEvent = {
        id: 'evt_no_org',
        type: 'customer.subscription.created',
        data: { object: mockSubscription },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);

      expect(response.status).toBe(200); // Webhook returns 200 even if processing fails
      expect(createSubscription).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // SUBSCRIPTION UPDATED TESTS
  // ============================================================================

  describe('customer.subscription.updated Event', () => {
    beforeEach(() => {
      const headerMap = new Map();
      headerMap.set('stripe-signature', 'valid_signature');
      mockHeaders.mockResolvedValue(headerMap);
    });

    it('should update subscription status in database', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_test_789',
        customer: 'cus_test_789',
        status: 'past_due',
        metadata: { organization_id: 'org_789' },
        items: {
          data: [
            {
              id: 'si_test',
              price: {
                id: 'price_monthly_789',
                recurring: { interval: 'month' },
              } as Stripe.Price,
            } as Stripe.SubscriptionItem,
          ],
        } as Stripe.ApiList<Stripe.SubscriptionItem>,
        current_period_start: 1704067200,
        current_period_end: 1706745600,
      };

      const mockEvent = {
        id: 'evt_test_789',
        type: 'customer.subscription.updated',
        data: { object: mockSubscription },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      (getOrganizationSubscription as Mock).mockResolvedValue({
        id: 'db_sub_789',
        organization_id: 'org_789',
      });

      (getSubscriptionPlanByName as Mock).mockResolvedValue({
        id: 'plan_pro',
        stripe_price_id_monthly: 'price_monthly_789',
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(updateSubscription).toHaveBeenCalledWith(
        'db_sub_789',
        expect.objectContaining({
          status: 'past_due',
          stripePriceId: 'price_monthly_789',
        })
      );
    });

    it('should handle subscription plan changes', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_plan_change',
        customer: 'cus_test',
        status: 'active',
        metadata: { organization_id: 'org_plan_change' },
        items: {
          data: [
            {
              id: 'si_test',
              price: {
                id: 'price_enterprise_123',
                recurring: { interval: 'month' },
              } as Stripe.Price,
            } as Stripe.SubscriptionItem,
          ],
        } as Stripe.ApiList<Stripe.SubscriptionItem>,
      };

      const mockEvent = {
        id: 'evt_plan_change',
        type: 'customer.subscription.updated',
        data: { object: mockSubscription },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      (getOrganizationSubscription as Mock).mockResolvedValue({
        id: 'db_sub_old',
        plan_id: 'plan_pro', // Old plan
      });

      (getSubscriptionPlanByName as Mock).mockResolvedValue({
        id: 'plan_enterprise', // New plan
        stripe_price_id_monthly: 'price_enterprise_123',
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      await POST(request);

      expect(updateSubscription).toHaveBeenCalledWith(
        'db_sub_old',
        expect.objectContaining({
          planId: 'plan_enterprise',
        })
      );
    });

    it('should handle subscription cancellation scheduling', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_cancel_scheduled',
        customer: 'cus_test',
        status: 'active',
        metadata: { organization_id: 'org_cancel' },
        items: {
          data: [
            {
              id: 'si_test',
              price: { id: 'price_123' } as Stripe.Price,
            } as Stripe.SubscriptionItem,
          ],
        } as Stripe.ApiList<Stripe.SubscriptionItem>,
        cancel_at: 1740000000, // Future timestamp
        canceled_at: 1735689600,
      };

      const mockEvent = {
        id: 'evt_cancel_scheduled',
        type: 'customer.subscription.updated',
        data: { object: mockSubscription },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      (getOrganizationSubscription as Mock).mockResolvedValue({
        id: 'db_sub_cancel',
      });

      (getSubscriptionPlanByName as Mock).mockResolvedValue({ id: 'plan_pro' });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      await POST(request);

      expect(updateSubscription).toHaveBeenCalledWith(
        'db_sub_cancel',
        expect.objectContaining({
          cancelAt: expect.any(String),
          canceledAt: expect.any(String),
        })
      );
    });
  });

  // ============================================================================
  // SUBSCRIPTION DELETED TESTS
  // ============================================================================

  describe('customer.subscription.deleted Event', () => {
    beforeEach(() => {
      const headerMap = new Map();
      headerMap.set('stripe-signature', 'valid_signature');
      mockHeaders.mockResolvedValue(headerMap);
    });

    it('should mark subscription as canceled in database', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_deleted',
        customer: 'cus_test',
        status: 'canceled',
        metadata: { organization_id: 'org_deleted' },
        items: {
          data: [
            {
              id: 'si_test',
              price: { id: 'price_123' } as Stripe.Price,
            } as Stripe.SubscriptionItem,
          ],
        } as Stripe.ApiList<Stripe.SubscriptionItem>,
      };

      const mockEvent = {
        id: 'evt_deleted',
        type: 'customer.subscription.deleted',
        data: { object: mockSubscription },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      (getOrganizationSubscription as Mock).mockResolvedValue({
        id: 'db_sub_deleted',
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(updateSubscription).toHaveBeenCalledWith(
        'db_sub_deleted',
        expect.objectContaining({
          status: 'canceled',
          canceledAt: expect.any(String),
        })
      );
    });

    it('should not fail when subscription not found in database', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_not_found',
        metadata: { organization_id: 'org_not_found' },
        items: { data: [] } as Stripe.ApiList<Stripe.SubscriptionItem>,
      };

      const mockEvent = {
        id: 'evt_not_found',
        type: 'customer.subscription.deleted',
        data: { object: mockSubscription },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      (getOrganizationSubscription as Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);

      expect(response.status).toBe(200); // Should still return success
      expect(updateSubscription).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // INVOICE PAID TESTS
  // ============================================================================

  describe('invoice.paid Event', () => {
    beforeEach(() => {
      const headerMap = new Map();
      headerMap.set('stripe-signature', 'valid_signature');
      mockHeaders.mockResolvedValue(headerMap);
    });

    it('should create payment record for successful invoice', async () => {
      const mockInvoice: Partial<Stripe.Invoice> = {
        id: 'in_test_123',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        amount_paid: 2000,
        currency: 'usd',
        metadata: { organization_id: 'org_123' },
        payment_intent: 'pi_test_123',
        hosted_invoice_url: 'https://invoice.stripe.com/i/test',
        invoice_pdf: 'https://invoice.stripe.com/i/test/pdf',
        description: 'Pro Plan - Monthly',
        status_transitions: {
          paid_at: 1735689600,
        },
      } as Stripe.Invoice;

      const mockEvent = {
        id: 'evt_invoice_paid',
        type: 'invoice.paid',
        data: { object: mockInvoice },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      (getOrganizationSubscription as Mock).mockResolvedValue({
        id: 'db_sub_123',
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(createPaymentRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org_123',
          subscriptionId: 'db_sub_123',
          stripeInvoiceId: 'in_test_123',
          stripePaymentIntentId: 'pi_test_123',
          amount: 2000,
          currency: 'usd',
          status: 'succeeded',
          invoiceUrl: 'https://invoice.stripe.com/i/test',
          invoicePdf: 'https://invoice.stripe.com/i/test/pdf',
          description: 'Pro Plan - Monthly',
        })
      );
    });
  });

  // ============================================================================
  // INVOICE PAYMENT FAILED TESTS
  // ============================================================================

  describe('invoice.payment_failed Event', () => {
    beforeEach(() => {
      const headerMap = new Map();
      headerMap.set('stripe-signature', 'valid_signature');
      mockHeaders.mockResolvedValue(headerMap);
    });

    it('should create payment record for failed invoice', async () => {
      const mockInvoice: Partial<Stripe.Invoice> = {
        id: 'in_failed_123',
        customer: 'cus_test',
        subscription: 'sub_test',
        amount_due: 2000,
        currency: 'usd',
        metadata: { organization_id: 'org_failed' },
        payment_intent: 'pi_failed_123',
        description: 'Pro Plan - Monthly',
      } as Stripe.Invoice;

      const mockEvent = {
        id: 'evt_invoice_failed',
        type: 'invoice.payment_failed',
        data: { object: mockInvoice },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      (getOrganizationSubscription as Mock).mockResolvedValue({
        id: 'db_sub_failed',
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(createPaymentRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org_failed',
          amount: 2000,
          status: 'failed',
          metadata: expect.objectContaining({
            error: 'Payment failed',
          }),
        })
      );
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should return 400 when webhook signature construction fails', async () => {
      const headerMap = new Map();
      headerMap.set('stripe-signature', 'valid_signature');
      mockHeaders.mockResolvedValue(headerMap);

      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'test.event' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid signature');
    });

    it('should handle database errors gracefully', async () => {
      const headerMap = new Map();
      headerMap.set('stripe-signature', 'valid_signature');
      mockHeaders.mockResolvedValue(headerMap);

      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_db_error',
        metadata: { organization_id: 'org_db_error' },
        items: {
          data: [
            {
              id: 'si_test',
              price: { id: 'price_123' } as Stripe.Price,
            } as Stripe.SubscriptionItem,
          ],
        } as Stripe.ApiList<Stripe.SubscriptionItem>,
      };

      const mockEvent = {
        type: 'customer.subscription.created',
        data: { object: mockSubscription },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      (getSubscriptionPlanByName as Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should return 200 to acknowledge webhook receipt even if processing fails
      expect(response.status).toBe(200);
      expect(data).toEqual({ received: true });
    });
  });

  // ============================================================================
  // UNHANDLED EVENT TESTS
  // ============================================================================

  describe('Unhandled Events', () => {
    it('should return 200 for unhandled event types', async () => {
      const headerMap = new Map();
      headerMap.set('stripe-signature', 'valid_signature');
      mockHeaders.mockResolvedValue(headerMap);

      const mockEvent = {
        id: 'evt_unknown',
        type: 'some.unknown.event',
        data: { object: {} },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });
  });
});
