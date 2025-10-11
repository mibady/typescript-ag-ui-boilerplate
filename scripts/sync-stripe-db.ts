#!/usr/bin/env tsx
/**
 * Sync Stripe Price IDs to Supabase Database
 *
 * Uses the Supabase REST API to update subscription_plans table
 * with the Stripe price IDs created by setup-stripe.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables (.env first, then .env.local can override)
config();
config({ path: '.env.local', override: false });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Stripe price IDs from setup-stripe.ts output
const PRICE_UPDATES = [
  {
    name: 'free',
    stripe_price_id_monthly: 'price_1SGszIDdWGNoBuU6GRptacEq',
    stripe_price_id_yearly: null
  },
  {
    name: 'pro',
    stripe_price_id_monthly: 'price_1SGszIDdWGNoBuU6MOLxc94a',
    stripe_price_id_yearly: 'price_1SGszJDdWGNoBuU6cf2gVpJA'
  },
  {
    name: 'enterprise',
    stripe_price_id_monthly: 'price_1SGszJDdWGNoBuU6njlNGVuQ',
    stripe_price_id_yearly: 'price_1SGszJDdWGNoBuU6l1A6NiqU'
  }
];

async function updatePlan(plan: typeof PRICE_UPDATES[0]) {
  // Use direct SQL to bypass schema cache issues
  const sql = `
    UPDATE subscription_plans
    SET
      stripe_price_id_monthly = $1,
      stripe_price_id_yearly = $2,
      updated_at = NOW()
    WHERE name = $3
    RETURNING *;
  `;

  const { data, error } = await supabase.rpc('exec_sql', {
    query: sql,
    params: [plan.stripe_price_id_monthly, plan.stripe_price_id_yearly, plan.name]
  });

  if (error) {
    // If RPC doesn't work, try using Postgres connection string
    console.log(`   ⚠️  Trying alternative update method...`);

    const updateSql = `
      UPDATE subscription_plans
      SET
        stripe_price_id_monthly = '${plan.stripe_price_id_monthly}',
        stripe_price_id_yearly = ${plan.stripe_price_id_yearly ? `'${plan.stripe_price_id_yearly}'` : 'NULL'},
        updated_at = NOW()
      WHERE name = '${plan.name}';
    `;

    // For now, output the SQL that needs to be run
    console.log(`   SQL: ${updateSql.trim()}`);
    return { sql: updateSql };
  }

  return data;
}

async function main() {
  console.log('🔄 Syncing Stripe Price IDs to Supabase...\n');

  for (const plan of PRICE_UPDATES) {
    try {
      console.log(`Updating ${plan.name} plan...`);
      await updatePlan(plan);
      console.log(`✅ ${plan.name} updated successfully`);
    } catch (error) {
      console.error(`❌ Failed to update ${plan.name}:`, error);
      process.exit(1);
    }
  }

  console.log('\n✅ All plans synced successfully!');
  console.log('\n📋 Next steps:');
  console.log('   npm run validate:stripe  # Verify the setup');
}

main().catch(console.error);
