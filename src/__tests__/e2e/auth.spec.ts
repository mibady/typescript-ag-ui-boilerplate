/**
 * E2E Authentication Tests
 *
 * Priority #1 for pre-deployment validation
 * Tests the complete authentication flow including:
 * - Sign up
 * - Sign in
 * - Organization management
 * - Protected routes
 * - Sign out
 */

import { test, expect } from '@playwright/test';

// Test user credentials
const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

const EXISTING_USER = {
  email: 'existing-user@example.com',
  password: 'ExistingPass123!',
};

test.describe('Authentication Flow', () => {

  test.describe('Sign Up', () => {
    test('should allow new user to sign up', async ({ page }) => {
      await page.goto('/sign-up');

      // Fill in sign up form
      await page.fill('[name="emailAddress"]', TEST_USER.email);
      await page.fill('[name="password"]', TEST_USER.password);
      await page.fill('[name="firstName"]', TEST_USER.firstName);
      await page.fill('[name="lastName"]', TEST_USER.lastName);

      // Submit form
      await page.click('[type="submit"]');

      // Should redirect to onboarding
      await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });
    });

    test('should reject invalid email format', async ({ page }) => {
      await page.goto('/sign-up');

      await page.fill('[name="emailAddress"]', 'invalid-email');
      await page.fill('[name="password"]', TEST_USER.password);

      await page.click('[type="submit"]');

      // Should show error message
      await expect(page.locator('text=/invalid.*email/i')).toBeVisible({ timeout: 5000 });
    });

    test('should reject weak password', async ({ page }) => {
      await page.goto('/sign-up');

      await page.fill('[name="emailAddress"]', TEST_USER.email);
      await page.fill('[name="password"]', '123'); // Weak password

      await page.click('[type="submit"]');

      // Should show password strength error
      await expect(page.locator('text=/password.*strong/i')).toBeVisible({ timeout: 5000 });
    });

    test('should reject duplicate email', async ({ page }) => {
      await page.goto('/sign-up');

      // Try to sign up with existing email
      await page.fill('[name="emailAddress"]', EXISTING_USER.email);
      await page.fill('[name="password"]', TEST_USER.password);

      await page.click('[type="submit"]');

      // Should show error message
      await expect(page.locator('text=/already.*exists/i')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Sign In', () => {
    test('should allow existing user to sign in', async ({ page }) => {
      await page.goto('/sign-in');

      // Fill in sign in form
      await page.fill('[name="identifier"]', EXISTING_USER.email);
      await page.fill('[name="password"]', EXISTING_USER.password);

      // Submit form
      await page.click('[type="submit"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      // Should see user menu or profile
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 5000 });
    });

    test('should reject invalid credentials', async ({ page }) => {
      await page.goto('/sign-in');

      await page.fill('[name="identifier"]', EXISTING_USER.email);
      await page.fill('[name="password"]', 'WrongPassword123!');

      await page.click('[type="submit"]');

      // Should show error message
      await expect(page.locator('text=/invalid.*credentials/i')).toBeVisible({ timeout: 5000 });
    });

    test('should reject non-existent user', async ({ page }) => {
      await page.goto('/sign-in');

      await page.fill('[name="identifier"]', 'nonexistent@example.com');
      await page.fill('[name="password"]', TEST_USER.password);

      await page.click('[type="submit"]');

      // Should show error message
      await expect(page.locator('text=/user.*not.*found/i')).toBeVisible({ timeout: 5000 });
    });

    test('should remember me on checkbox', async ({ page, context }) => {
      await page.goto('/sign-in');

      await page.fill('[name="identifier"]', EXISTING_USER.email);
      await page.fill('[name="password"]', EXISTING_USER.password);
      await page.check('[name="rememberMe"]');

      await page.click('[type="submit"]');
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      // Check that session cookie has long expiration
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name.includes('session'));

      expect(sessionCookie).toBeDefined();
      if (sessionCookie) {
        // Should expire in > 7 days (604800 seconds)
        const expiresIn = sessionCookie.expires - Date.now() / 1000;
        expect(expiresIn).toBeGreaterThan(604800);
      }
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to sign-in', async ({ page }) => {
      // Try to access protected route
      await page.goto('/dashboard');

      // Should redirect to sign-in
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });
    });

    test('should allow authenticated users to access dashboard', async ({ page }) => {
      // Sign in first
      await page.goto('/sign-in');
      await page.fill('[name="identifier"]', EXISTING_USER.email);
      await page.fill('[name="password"]', EXISTING_USER.password);
      await page.click('[type="submit"]');

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      // Should see dashboard content
      await expect(page.locator('h1, h2').filter({ hasText: /dashboard/i })).toBeVisible();
    });

    test('should allow access to public routes without auth', async ({ page }) => {
      await page.goto('/');

      // Should show landing page
      await expect(page).toHaveURL('/');

      // Should see public content
      await expect(page.locator('text=/sign in|get started/i')).toBeVisible();
    });

    test('should preserve redirect URL after sign-in', async ({ page }) => {
      // Try to access specific dashboard page
      await page.goto('/dashboard/settings');

      // Should redirect to sign-in
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });

      // Sign in
      await page.fill('[name="identifier"]', EXISTING_USER.email);
      await page.fill('[name="password"]', EXISTING_USER.password);
      await page.click('[type="submit"]');

      // Should redirect back to original URL
      await expect(page).toHaveURL(/\/dashboard\/settings/, { timeout: 10000 });
    });
  });

  test.describe('Organization Management', () => {
    test('should create organization during onboarding', async ({ page }) => {
      // Sign up new user
      await page.goto('/sign-up');
      const newUserEmail = `org-test-${Date.now()}@example.com`;

      await page.fill('[name="emailAddress"]', newUserEmail);
      await page.fill('[name="password"]', TEST_USER.password);
      await page.click('[type="submit"]');

      await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });

      // Fill in organization details
      await page.fill('[name="organizationName"]', 'Test Organization');
      await page.selectOption('[name="industry"]', 'technology');
      await page.selectOption('[name="teamSize"]', '1-10');

      await page.click('button:has-text("Create Organization")');

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test('should display organization name in header', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('[name="identifier"]', EXISTING_USER.email);
      await page.fill('[name="password"]', EXISTING_USER.password);
      await page.click('[type="submit"]');

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      // Should see organization name or switcher
      await expect(page.locator('[data-testid="org-name"], [data-testid="org-switcher"]')).toBeVisible();
    });

    test('should allow switching between organizations', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('[name="identifier"]', EXISTING_USER.email);
      await page.fill('[name="password"]', EXISTING_USER.password);
      await page.click('[type="submit"]');

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      // Click organization switcher
      await page.click('[data-testid="org-switcher"]');

      // Should see list of organizations
      await expect(page.locator('[data-testid="org-list"]')).toBeVisible();

      // Select different organization
      const orgOptions = page.locator('[data-testid="org-option"]');
      const count = await orgOptions.count();

      if (count > 1) {
        await orgOptions.nth(1).click();

        // Should reload with new organization context
        await page.waitForLoadState('networkidle');
      }
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page refreshes', async ({ page }) => {
      // Sign in
      await page.goto('/sign-in');
      await page.fill('[name="identifier"]', EXISTING_USER.email);
      await page.fill('[name="password"]', EXISTING_USER.password);
      await page.click('[type="submit"]');

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      // Refresh page
      await page.reload();

      // Should still be on dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should maintain session across navigation', async ({ page }) => {
      // Sign in
      await page.goto('/sign-in');
      await page.fill('[name="identifier"]', EXISTING_USER.email);
      await page.fill('[name="password"]', EXISTING_USER.password);
      await page.click('[type="submit"]');

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      // Navigate to different pages
      await page.goto('/dashboard/settings');
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

      await page.goto('/dashboard/team');
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should expire session after timeout', async ({ page, context }) => {
      // This test would require mocking time or waiting
      // For now, we'll skip the actual timeout wait
      test.skip();
    });
  });

  test.describe('Sign Out', () => {
    test('should sign out user and redirect to home', async ({ page }) => {
      // Sign in first
      await page.goto('/sign-in');
      await page.fill('[name="identifier"]', EXISTING_USER.email);
      await page.fill('[name="password"]', EXISTING_USER.password);
      await page.click('[type="submit"]');

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      // Click user menu
      await page.click('[data-testid="user-menu"]');

      // Click sign out
      await page.click('text=/sign out/i');

      // Should redirect to home
      await expect(page).toHaveURL('/', { timeout: 5000 });

      // Try to access dashboard - should redirect to sign-in
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });
    });

    test('should clear session data on sign out', async ({ page, context }) => {
      // Sign in
      await page.goto('/sign-in');
      await page.fill('[name="identifier"]', EXISTING_USER.email);
      await page.fill('[name="password"]', EXISTING_USER.password);
      await page.click('[type="submit"]');

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      // Sign out
      await page.click('[data-testid="user-menu"]');
      await page.click('text=/sign out/i');

      await expect(page).toHaveURL('/', { timeout: 5000 });

      // Check that session cookies are cleared
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name.includes('session'));

      expect(sessionCookie).toBeUndefined();
    });
  });

  test.describe('Security', () => {
    test('should not expose sensitive data in HTML', async ({ page }) => {
      await page.goto('/sign-in');

      const html = await page.content();

      // Should not contain API keys or secrets
      expect(html).not.toContain('sk_test_');
      expect(html).not.toContain('sk_live_');
      expect(html).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    });

    test('should have HTTPS in production', async ({ page }) => {
      const url = page.url();

      if (process.env.NODE_ENV === 'production') {
        expect(url).toMatch(/^https:\/\//);
      }
    });

    test('should have secure cookies in production', async ({ page, context }) => {
      await page.goto('/sign-in');
      await page.fill('[name="identifier"]', EXISTING_USER.email);
      await page.fill('[name="password"]', EXISTING_USER.password);
      await page.click('[type="submit"]');

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      const cookies = await context.cookies();

      if (process.env.NODE_ENV === 'production') {
        cookies.forEach(cookie => {
          expect(cookie.secure).toBe(true);
          expect(cookie.sameSite).toBe('Lax' as any);
        });
      }
    });
  });
});
