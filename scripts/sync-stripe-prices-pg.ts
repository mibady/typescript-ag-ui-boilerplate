#!/usr/bin/env tsx
/**
 * Sync Stripe Price IDs to Database (using Postgres directly)
 *
 * Uses direct Postgres connection to bypass Supabase REST API schema cache issues
 */

import { Client } from 'pg';
import { config } from 'dotenv';

// Load environment variables (check all possible files)
config();
config({ path: '.env.local', override: false });
config({ path: '.env.vercel', override: false });

const POSTGRES_URL = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('❌ Missing Postgres connection string');
  console.error('Required: POSTGRES_URL_NON_POOLING or POSTGRES_URL');
  process.exit(1);
}

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

async function main() {
  const client = new Client({
    connectionString: POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to database...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🔄 Syncing Stripe Price IDs...\n');

    for (const plan of PRICE_UPDATES) {
      console.log(`Updating ${plan.name} plan...`);

      const result = await client.query(
        `UPDATE subscription_plans
         SET
           stripe_price_id_monthly = $1,
           stripe_price_id_yearly = $2,
           updated_at = NOW()
         WHERE name = $3
         RETURNING name, stripe_price_id_monthly, stripe_price_id_yearly`,
        [plan.stripe_price_id_monthly, plan.stripe_price_id_yearly, plan.name]
      );

      if (result.rowCount === 0) {
        console.log(`   ⚠️  No rows updated for ${plan.name} (plan might not exist)`);
      } else {
        console.log(`   ✅ Updated ${plan.name}`);
        console.log(`      Monthly: ${result.rows[0].stripe_price_id_monthly}`);
        if (result.rows[0].stripe_price_id_yearly) {
          console.log(`      Yearly: ${result.rows[0].stripe_price_id_yearly}`);
        }
      }
    }

    console.log('\n✅ All plans synced successfully!');
    console.log('\n📋 Next steps:');
    console.log('   npm run validate:stripe  # Verify the setup');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
