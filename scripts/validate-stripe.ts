#!/usr/bin/env tsx
/**
 * Stripe Validation Script
 *
 * Validates that Stripe products, prices, and database are configured correctly
 *
 * Usage:
 *   npm run validate:stripe
 */

import Stripe from 'stripe';
import { config } from 'dotenv';
import { validateStripeSetup } from '../lib/stripe/setup';

// Load environment variables (try .env.local first, then .env)
config({ path: '.env.local' });
config();

async function main() {
  console.log('🔍 Stripe Setup Validation');
  console.log('━'.repeat(50));
  console.log('');

  // Validate environment variables
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!stripeKey || !supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing environment variables');
    process.exit(1);
  }

  const mode = stripeKey.startsWith('sk_test_') ? 'test' : 'production';
  console.log(`Mode: ${mode.toUpperCase()}`);
  console.log('');

  // Initialize Stripe
  const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-09-30.clover',
  });

  try {
    console.log('Validating setup...');
    const result = await validateStripeSetup(stripe, supabaseUrl, supabaseKey);

    console.log('');
    console.log('━'.repeat(50));

    if (result.valid) {
      console.log('✅ All checks passed!');
      console.log('');
      console.log('Your Stripe setup is configured correctly.');
      console.log('You can now accept payments in your application.');
    } else {
      console.log('❌ Validation failed with errors:');
      console.log('');
      result.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
      console.log('');
      console.log('To fix these issues, run: npm run setup:stripe -- --reset');
      process.exit(1);
    }

    console.log('━'.repeat(50));
    console.log('');

  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

main();
