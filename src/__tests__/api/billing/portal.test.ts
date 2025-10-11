/**
 * Stripe Customer Portal API Tests
 * Phase 7: Testing & QA
 *
 * Real tests for /api/billing/portal POST endpoint
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { POST } from '@/app/api/billing/portal/route';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock database functions
vi.mock('@/lib/db/subscriptions', () => ({
  getOrganizationSubscription: vi.fn(),
}));

// Mock Stripe
vi.mock('stripe', () => {
  const mockStripe = {
    billingPortal: {
      sessions: {
        create: vi.fn(),
      },
    },
  };
  return {
    default: vi.fn(() => mockStripe),
  };
});

import { auth } from '@clerk/nextjs/server';
import { getOrganizationSubscription } from '@/lib/db/subscriptions';

describe('Customer Portal API - POST /api/billing/portal', () => {
  let mockStripe: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Stripe instance
    mockStripe = new Stripe('sk_test_123', { apiVersion: '2025-09-30.clover' as any });

    // Setup environment
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  // ============================================================================
  // AUTHENTICATION TESTS
  // ============================================================================

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      (auth as Mock).mockResolvedValue({ userId: null, orgId: null });

      const request = new NextRequest('http://localhost:3000/api/billing/portal', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when userId is missing', async () => {
      (auth as Mock).mockResolvedValue({ userId: null, orgId: 'org_123' });

      const request = new NextRequest('http://localhost:3000/api/billing/portal', {
        method: 'POST',
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should return 401 when orgId is missing', async () => {
      (auth as Mock).mockResolvedValue({ userId: 'user_123', orgId: null });

      const request = new NextRequest('http://localhost:3000/api/billing/portal', {
        method: 'POST',
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });

  // ============================================================================
  // SUBSCRIPTION VALIDATION TESTS
  // ============================================================================

  describe('Subscription Validation', () => {
    beforeEach(() => {
      (auth as Mock).mockResolvedValue({ userId: 'user_123', orgId: 'org_123' });
    });

    it('should return 404 when subscription not found', async () => {
      (getOrganizationSubscription as Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/billing/portal', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No subscription found');
    });

    it('should return 404 when subscription has no Stripe customer ID', async () => {
      (getOrganizationSubscription as Mock).mockResolvedValue({
        id: 'sub_123',
        stripe_customer_id: null, // No customer ID
      });

      const request = new NextRequest('http://localhost:3000/api/billing/portal', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No subscription found');
    });
  });

  // ============================================================================
  // PORTAL SESSION CREATION TESTS
  // ============================================================================

  describe('Portal Session Creation', () => {
    beforeEach(() => {
      (auth as Mock).mockResolvedValue({ userId: 'user_123', orgId: 'org_123' });
    });

    it('should create portal session with correct customer ID', async () => {
      (getOrganizationSubscription as Mock).mockResolvedValue({
        id: 'sub_test_123',
        stripe_customer_id: 'cus_test_123',
      });

      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        id: 'bps_test_123',
        url: 'https://billing.stripe.com/session/test_123',
      });

      const request = new NextRequest('http://localhost:3000/api/billing/portal', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe('https://billing.stripe.com/session/test_123');

      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test_123',
        return_url: 'http://localhost:3000/dashboard/billing',
      });
    });

    it('should use correct return URL from environment', async () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://myapp.vercel.app';

      (getOrganizationSubscription as Mock).mockResolvedValue({
        stripe_customer_id: 'cus_test_456',
      });

      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        id: 'bps_test_456',
        url: 'https://billing.stripe.com/session/test_456',
      });

      const request = new NextRequest('http://localhost:3000/api/billing/portal', {
        method: 'POST',
      });

      await POST(request);

      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          return_url: 'https://myapp.vercel.app/dashboard/billing',
        })
      );
    });

    it('should return portal URL on success', async () => {
      (getOrganizationSubscription as Mock).mockResolvedValue({
        stripe_customer_id: 'cus_success',
      });

      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        id: 'bps_success',
        url: 'https://billing.stripe.com/session/success_123',
      });

      const request = new NextRequest('http://localhost:3000/api/billing/portal', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        url: 'https://billing.stripe.com/session/success_123',
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    beforeEach(() => {
      (auth as Mock).mockResolvedValue({ userId: 'user_123', orgId: 'org_123' });
    });

    it('should return 500 when Stripe API fails', async () => {
      (getOrganizationSubscription as Mock).mockResolvedValue({
        stripe_customer_id: 'cus_fail',
      });

      mockStripe.billingPortal.sessions.create.mockRejectedValue(
        new Error('Stripe API error')
      );

      const request = new NextRequest('http://localhost:3000/api/billing/portal', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create portal session');
    });

    it('should return 500 when database query fails', async () => {
      (getOrganizationSubscription as Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/billing/portal', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create portal session');
    });
  });
});
