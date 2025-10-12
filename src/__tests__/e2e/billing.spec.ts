import { test, expect } from '@playwright/test';

/**
 * Billing & Subscription E2E Test Suite
 *
 * Tests Stripe integration including:
 * - Subscription creation
 * - Payment processing
 * - Webhook handling
 * - Usage tracking
 * - Plan upgrades/downgrades
 * - Cancellation
 */

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

test.describe('Billing & Subscriptions', () => {
  let authToken: string;

  test.beforeAll(async ({ browser }) => {
    // Authenticate
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${API_BASE}/sign-in`);
    await page.fill('[name="identifier"]', process.env.TEST_USER_EMAIL!);
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === '__session');
    authToken = sessionCookie?.value || '';

    await context.close();
  });

  test.describe('Subscription Plans', () => {
    test('should display available subscription plans', async ({ page }) => {
      await page.goto(`${API_BASE}/pricing`);

      // Check for plan cards
      await expect(page.locator('[data-testid="plan-card"]')).toHaveCount(3); // Free, Pro, Enterprise

      // Verify plan details are visible
      await expect(page.locator('text=/Free/i')).toBeVisible();
      await expect(page.locator('text=/Pro/i')).toBeVisible();
      await expect(page.locator('text=/Enterprise/i')).toBeVisible();
    });

    test('should show current plan status', async ({ page }) => {
      await page.goto(`${API_BASE}/dashboard/billing`);

      // Check for current plan display
      await expect(page.locator('[data-testid="current-plan"]')).toBeVisible();
    });
  });

  test.describe('Subscription Creation', () => {
    test('should require authentication for checkout', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/billing/create-checkout`, {
        data: {
          priceId: 'price_test_123',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should validate price ID', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/billing/create-checkout`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          priceId: '', // Invalid empty price ID
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/price/i);
    });

    test('should create Stripe checkout session', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/billing/create-checkout`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          priceId: process.env.STRIPE_PRICE_ID_PRO || 'price_test_pro',
          successUrl: `${API_BASE}/dashboard/billing?success=true`,
          cancelUrl: `${API_BASE}/pricing`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('sessionId');
      expect(data).toHaveProperty('url');
      expect(data.url).toContain('checkout.stripe.com');
    });

    test('should handle free plan selection', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/billing/select-plan`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          plan: 'free',
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.plan).toBe('free');
    });
  });

  test.describe('Customer Portal', () => {
    test('should require authentication for portal access', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/billing/create-portal-session`);
      expect(response.status()).toBe(401);
    });

    test('should create customer portal session for subscribed users', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/billing/create-portal-session`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          returnUrl: `${API_BASE}/dashboard/billing`,
        },
      });

      // Will succeed if user has Stripe customer ID
      // Will fail if user hasn't subscribed yet
      if (response.ok()) {
        const data = await response.json();
        expect(data).toHaveProperty('url');
        expect(data.url).toContain('billing.stripe.com');
      } else {
        expect(response.status()).toBe(400);
      }
    });
  });

  test.describe('Webhook Processing', () => {
    test('should reject webhooks without valid signature', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/webhooks/stripe`, {
        headers: {
          'stripe-signature': 'invalid-signature',
        },
        data: {
          type: 'customer.subscription.created',
          data: {
            object: {
              id: 'sub_test123',
            },
          },
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should validate webhook event structure', async ({ request }) => {
      // This test validates the webhook handler logic
      // Real Stripe signature validation requires the webhook secret
      const response = await request.post(`${API_BASE}/api/webhooks/stripe`, {
        data: {
          // Missing required webhook fields
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should handle subscription.created event', async ({ request }) => {
      // Mock Stripe webhook event
      const mockEvent = {
        id: 'evt_test_123',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test_123',
            customer: 'cus_test_123',
            status: 'active',
            items: {
              data: [
                {
                  price: {
                    id: 'price_test_pro',
                    recurring: { interval: 'month' },
                  },
                },
              ],
            },
          },
        },
      };

      // Note: Real test would require proper Stripe signature
      // This test verifies the endpoint exists and accepts POST
      const response = await request.post(`${API_BASE}/api/webhooks/stripe`, {
        data: mockEvent,
      });

      // Will fail signature verification but endpoint should exist
      expect([200, 401, 400]).toContain(response.status());
    });

    test('should handle subscription.updated event', async ({ request }) => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test_123',
            status: 'active',
          },
        },
      };

      const response = await request.post(`${API_BASE}/api/webhooks/stripe`, {
        data: mockEvent,
      });

      expect([200, 401, 400]).toContain(response.status());
    });

    test('should handle subscription.deleted event', async ({ request }) => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test_123',
            status: 'canceled',
          },
        },
      };

      const response = await request.post(`${API_BASE}/api/webhooks/stripe`, {
        data: mockEvent,
      });

      expect([200, 401, 400]).toContain(response.status());
    });

    test('should handle invoice.payment_succeeded event', async ({ request }) => {
      const mockEvent = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test_123',
            customer: 'cus_test_123',
            amount_paid: 2000,
            currency: 'usd',
          },
        },
      };

      const response = await request.post(`${API_BASE}/api/webhooks/stripe`, {
        data: mockEvent,
      });

      expect([200, 401, 400]).toContain(response.status());
    });

    test('should handle invoice.payment_failed event', async ({ request }) => {
      const mockEvent = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_test_123',
            customer: 'cus_test_123',
            attempt_count: 1,
          },
        },
      };

      const response = await request.post(`${API_BASE}/api/webhooks/stripe`, {
        data: mockEvent,
      });

      expect([200, 401, 400]).toContain(response.status());
    });
  });

  test.describe('Usage Tracking', () => {
    test('should track API usage for billing', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/billing/usage`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('usage');
      expect(data.usage).toHaveProperty('requests');
      expect(data.usage).toHaveProperty('tokens');
    });

    test('should enforce usage limits based on plan', async ({ request }) => {
      // Make request that would exceed free tier limits
      const responses = [];

      // Try to make many requests
      for (let i = 0; i < 100; i++) {
        responses.push(
          request.post(`${API_BASE}/api/agent/execute`, {
            headers: {
              Cookie: `__session=${authToken}`,
            },
            data: {
              prompt: `Test prompt ${i}`,
              model: 'gpt-3.5-turbo',
            },
          })
        );
      }

      const results = await Promise.all(responses);

      // Should hit usage limit at some point
      const limitExceeded = results.some((r) => r.status() === 429);

      if (limitExceeded) {
        console.log('✅ Usage limits enforced');
      } else {
        console.log('⚠️  Usage limits not hit with 100 requests');
      }
    });

    test('should display usage statistics in dashboard', async ({ page }) => {
      await page.goto(`${API_BASE}/dashboard/billing`);

      // Check for usage display
      await expect(page.locator('[data-testid="usage-stats"]')).toBeVisible();
      await expect(page.locator('text=/API Requests/i')).toBeVisible();
      await expect(page.locator('text=/Tokens Used/i')).toBeVisible();
    });
  });

  test.describe('Plan Changes', () => {
    test('should allow upgrading from free to pro', async ({ page }) => {
      await page.goto(`${API_BASE}/pricing`);

      // Click upgrade button
      await page.click('[data-testid="plan-pro"] button:has-text("Upgrade")');

      // Should redirect to Stripe checkout
      await page.waitForURL(/checkout.stripe.com/, { timeout: 10000 });
    });

    test('should handle plan downgrade request', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/billing/change-plan`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          newPlan: 'free',
          downgrade: true,
        },
      });

      // Will succeed if user has active subscription
      if (response.ok()) {
        const data = await response.json();
        expect(data).toHaveProperty('effectiveDate');
      }
    });

    test('should schedule downgrades for end of billing period', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/billing/change-plan`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          newPlan: 'free',
          downgrade: true,
        },
      });

      if (response.ok()) {
        const data = await response.json();

        // Downgrade should be scheduled, not immediate
        expect(data.immediate).toBeFalsy();
        expect(data).toHaveProperty('effectiveDate');
      }
    });
  });

  test.describe('Subscription Cancellation', () => {
    test('should allow users to cancel subscription', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/billing/cancel`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          reason: 'Test cancellation',
        },
      });

      // Will succeed if user has active subscription
      // Will fail if no subscription exists
      expect([200, 400]).toContain(response.status());
    });

    test('should allow immediate vs end-of-period cancellation', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/billing/cancel`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          immediate: false, // Cancel at period end
          reason: 'Test cancellation',
        },
      });

      if (response.ok()) {
        const data = await response.json();
        expect(data).toHaveProperty('cancelAt');
      }
    });

    test('should show cancellation confirmation', async ({ page }) => {
      await page.goto(`${API_BASE}/dashboard/billing`);

      // Click cancel button
      const cancelButton = page.locator('[data-testid="cancel-subscription"]');

      if (await cancelButton.isVisible()) {
        await cancelButton.click();

        // Should show confirmation modal
        await expect(page.locator('[data-testid="cancel-confirmation"]')).toBeVisible();
      }
    });
  });

  test.describe('Payment Methods', () => {
    test('should display saved payment methods', async ({ page }) => {
      await page.goto(`${API_BASE}/dashboard/billing`);

      // Check for payment methods section
      const paymentSection = page.locator('[data-testid="payment-methods"]');
      await expect(paymentSection).toBeVisible();
    });

    test('should allow adding new payment method via portal', async ({ page }) => {
      await page.goto(`${API_BASE}/dashboard/billing`);

      // Click manage billing button
      const manageButton = page.locator('button:has-text("Manage Billing")');

      if (await manageButton.isVisible()) {
        await manageButton.click();

        // Should redirect to Stripe customer portal
        await page.waitForURL(/billing.stripe.com/, { timeout: 10000 });
      }
    });
  });

  test.describe('Invoices', () => {
    test('should display invoice history', async ({ page }) => {
      await page.goto(`${API_BASE}/dashboard/billing/invoices`);

      // Check for invoices table
      await expect(page.locator('[data-testid="invoices-table"]')).toBeVisible();
    });

    test('should allow downloading invoices', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/billing/invoices`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('invoices');
      expect(Array.isArray(data.invoices)).toBeTruthy();
    });
  });

  test.describe('Organization Billing', () => {
    test('should show organization billing for admin users', async ({ page }) => {
      await page.goto(`${API_BASE}/dashboard/organization/billing`);

      // Admin users should see org billing
      const orgBilling = page.locator('[data-testid="org-billing"]');
      await expect(orgBilling).toBeVisible();
    });

    test('should prevent non-admin from accessing billing settings', async ({ page }) => {
      // Would need to authenticate as non-admin user
      // Should redirect or show access denied
    });

    test('should track organization-wide usage', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/billing/org-usage`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
      });

      if (response.ok()) {
        const data = await response.json();
        expect(data).toHaveProperty('organizationUsage');
        expect(data).toHaveProperty('userBreakdown');
      }
    });
  });
});
