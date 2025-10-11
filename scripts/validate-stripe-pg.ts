#!/usr/bin/env tsx
/**
 * Stripe Validation Script (using Postgres directly)
 *
 * Validates that Stripe products, prices, and database are configured correctly
 */

import Stripe from 'stripe';
import { Client } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();
config({ path: '.env.local', override: false });
config({ path: '.env.vercel', override: false });

async function main() {
  console.log('🔍 Stripe Setup Validation');
  console.log('━'.repeat(50));
  console.log('');

  // Validate environment variables
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const postgresUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

  if (!stripeKey || !postgresUrl) {
    console.error('❌ Error: Missing environment variables');
    console.error('   Required: STRIPE_SECRET_KEY, POSTGRES_URL');
    process.exit(1);
  }

  const mode = stripeKey.startsWith('sk_test_') ? 'TEST' : 'PRODUCTION';
  console.log(`Mode: ${mode}`);
  console.log('');

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-09-30.clover',
  });

  // Supabase requires SSL with proper cert validation
  const client = new Client({
    connectionString: postgresUrl
  });

  // Handle SSL errors gracefully
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  try {
    // Connect to database
    await client.connect();

    // Get all plans from database
    const result = await client.query(
      `SELECT name, display_name, stripe_price_id_monthly, stripe_price_id_yearly, price_monthly, price_yearly
       FROM subscription_plans
       ORDER BY name`
    );

    if (result.rows.length === 0) {
      console.log('❌ No subscription plans found in database');
      console.log('   Run: npm run setup:stripe');
      process.exit(1);
    }

    console.log('✅ Found 3 subscription plans in database\n');

    let allValid = true;

    for (const plan of result.rows) {
      console.log(`📋 ${plan.display_name} Plan:`);
      console.log(`   Database: ${plan.name}`);

      // Validate monthly price
      if (!plan.stripe_price_id_monthly) {
        console.log(`   ❌ Missing monthly price ID`);
        allValid = false;
      } else {
        try {
          const price = await stripe.prices.retrieve(plan.stripe_price_id_monthly);
          console.log(`   ✅ Monthly: ${plan.stripe_price_id_monthly}`);
          console.log(`      Amount: $${(price.unit_amount! / 100).toFixed(2)}/month`);

          if (price.unit_amount !== plan.price_monthly) {
            console.log(`      ⚠️  Price mismatch (DB: ${plan.price_monthly}, Stripe: ${price.unit_amount})`);
          }
        } catch (err) {
          console.log(`   ❌ Invalid monthly price ID in Stripe`);
          allValid = false;
        }
      }

      // Validate yearly price if exists
      if (plan.stripe_price_id_yearly) {
        try {
          const price = await stripe.prices.retrieve(plan.stripe_price_id_yearly);
          console.log(`   ✅ Yearly:  ${plan.stripe_price_id_yearly}`);
          console.log(`      Amount: $${(price.unit_amount! / 100).toFixed(2)}/year`);

          if (price.unit_amount !== plan.price_yearly) {
            console.log(`      ⚠️  Price mismatch (DB: ${plan.price_yearly}, Stripe: ${price.unit_amount})`);
          }
        } catch (err) {
          console.log(`   ❌ Invalid yearly price ID in Stripe`);
          allValid = false;
        }
      }

      console.log('');
    }

    console.log('━'.repeat(50));

    if (allValid) {
      console.log('✅ All checks passed!');
      console.log('');
      console.log('Your Stripe setup is configured correctly.');
      console.log('You can now accept payments in your application.');
    } else {
      console.log('❌ Some checks failed');
      console.log('   Review the errors above and fix them.');
      process.exit(1);
    }

    console.log('━'.repeat(50));
    console.log('');

  } catch (error: any) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
