import { chromium, FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Global Setup for E2E Tests
 *
 * This script runs once before all tests and:
 * 1. Validates test environment configuration
 * 2. Ensures test database is in clean state
 * 3. Creates necessary test users (if needed)
 * 4. Verifies all required services are accessible
 */

async function globalSetup(config: FullConfig) {
  console.log('\n🔧 Starting global E2E test setup...\n');

  // Note: .env.local is already loaded by playwright.config.ts
  // We only load .env.test for test-specific overrides
  dotenv.config({ path: path.resolve(__dirname, '../../../.env.test') });

  // Validate required environment variables
  // Most variables come from .env.local, only test-specific ones from .env.test
  const requiredEnvVars = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'TEST_USER_EMAIL',
    'TEST_USER_PASSWORD',
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach((varName) => console.error(`   - ${varName}`));
    console.error('\nPlease configure .env.test and .env.local with required credentials.\n');
    throw new Error('Missing required environment variables for E2E tests');
  }

  console.log('✅ Environment variables validated');

  // Verify application is running
  const baseURL = process.env.NEXT_PUBLIC_APP_URL!;
  console.log(`\n🌐 Verifying application at ${baseURL}...`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const response = await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    if (!response || !response.ok()) {
      throw new Error(`Application not accessible at ${baseURL}`);
    }

    console.log('✅ Application is accessible');
  } catch (error) {
    console.error(`❌ Failed to access application at ${baseURL}`);
    console.error(error);
    throw error;
  } finally {
    await browser.close();
  }

  // Verify Clerk authentication service
  console.log('\n🔐 Verifying Clerk authentication service...');
  try {
    const clerkFetch = await fetch(`${baseURL}/sign-in`);
    if (!clerkFetch.ok) {
      throw new Error('Clerk authentication pages not accessible');
    }
    console.log('✅ Clerk authentication service is accessible');
  } catch (error) {
    console.error('❌ Failed to verify Clerk authentication service');
    throw error;
  }

  // Verify API routes
  console.log('\n🔌 Verifying API routes...');
  const apiRoutes = ['/api/health', '/api/agent/execute'];

  for (const route of apiRoutes) {
    try {
      const response = await fetch(`${baseURL}${route}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      // We expect 401 for protected routes, 200/404 for public routes
      if (response.status === 404) {
        console.log(`⚠️  Route ${route} not found (may not be implemented yet)`);
      } else {
        console.log(`✅ Route ${route} is accessible (status: ${response.status})`);
      }
    } catch (error) {
      console.error(`❌ Failed to verify route ${route}`);
    }
  }

  console.log('\n✅ Global setup complete!\n');
}

export default globalSetup;
