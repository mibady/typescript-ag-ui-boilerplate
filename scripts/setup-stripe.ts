#!/usr/bin/env tsx
/**
 * Automated Stripe Setup Script
 *
 * Creates Stripe products, prices, and syncs to database
 *
 * Usage:
 *   npm run setup:stripe              # Test mode
 *   npm run setup:stripe -- --prod    # Production mode
 *   npm run setup:stripe -- --reset   # Reset and recreate
 */

import Stripe from 'stripe';
import { config } from 'dotenv';
import {
  createStripeProducts,
  syncPricesToDatabase,
  deleteAllStripeProducts
} from '../lib/stripe/setup';

// Load environment variables (try .env.local first, then .env)
config({ path: '.env.local' });
config();

interface SetupOptions {
  mode: 'test' | 'production';
  reset: boolean;
}

function parseArgs(): SetupOptions {
  const args = process.argv.slice(2);

  return {
    mode: args.includes('--prod') || args.includes('--production') ? 'production' : 'test',
    reset: args.includes('--reset'),
  };
}

async function main() {
  const options = parseArgs();

  console.log('🚀 Stripe Setup Script');
  console.log('━'.repeat(50));
  console.log(`Mode: ${options.mode.toUpperCase()}`);
  console.log(`Reset: ${options.reset ? 'YES' : 'NO'}`);
  console.log('━'.repeat(50));
  console.log('');

  // Validate environment variables
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!stripeKey) {
    console.error('❌ Error: STRIPE_SECRET_KEY not found in environment');
    process.exit(1);
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Supabase credentials not found in environment');
    console.error('   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
    process.exit(1);
  }

  // Validate Stripe key matches mode
  const keyMode = stripeKey.startsWith('sk_test_') ? 'test' : 'production';
  if (keyMode !== options.mode) {
    console.error(`❌ Error: Stripe key mode (${keyMode}) doesn't match requested mode (${options.mode})`);
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
  console.log('');

  // Initialize Stripe
  const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-09-30.clover',
  });

  try {
    // Reset if requested
    if (options.reset) {
      console.log('🗑️  Resetting existing products...');
      await deleteAllStripeProducts(stripe, options.mode);
      console.log('');
    }

    // Create products and prices
    console.log('📦 Creating Stripe products and prices...');
    const createdPlans = await createStripeProducts(stripe, options.mode);
    console.log('');

    // Sync to database
    console.log('💾 Syncing to Supabase database...');
    await syncPricesToDatabase(createdPlans, supabaseUrl, supabaseKey);
    console.log('');

    // Summary
    console.log('━'.repeat(50));
    console.log('✅ Setup Complete!');
    console.log('━'.repeat(50));
    console.log('');
    console.log('Created Plans:');
    createdPlans.forEach(plan => {
      console.log(`  • ${plan.name}:`);
      console.log(`    - Product: ${plan.productId}`);
      console.log(`    - Monthly: ${plan.monthlyPriceId}`);
      if (plan.yearlyPriceId) {
        console.log(`    - Yearly:  ${plan.yearlyPriceId}`);
      }
    });
    console.log('');
    console.log('Next steps:');
    console.log('  1. Run: npm run validate:stripe');
    console.log('  2. Test checkout flow in your app');
    console.log('  3. Set up Stripe webhooks');
    console.log('');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
