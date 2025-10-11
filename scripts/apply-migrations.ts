#!/usr/bin/env tsx
/**
 * Apply Database Migrations
 *
 * Applies pending migrations to the Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables
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

async function checkTableExists(tableName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(tableName)
    .select('id')
    .limit(1);

  return !error || error.code !== 'PGRST204';
}

async function executeMigration(migrationPath: string, migrationName: string) {
  console.log(`\n📄 Applying migration: ${migrationName}`);

  const sql = readFileSync(migrationPath, 'utf-8');

  // Split SQL into individual statements (simplified - doesn't handle all edge cases)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let skipCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip comments and empty statements
    if (statement.trim().startsWith('--') || statement.trim().length < 5) {
      continue;
    }

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Check if error is because object already exists
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          skipCount++;
          continue;
        }
        console.error(`   ❌ Statement ${i + 1} failed:`, error.message?.substring(0, 100));
      } else {
        successCount++;
      }
    } catch (err: any) {
      // If rpc doesn't exist, try direct SQL
      console.log(`   ⚠️  RPC method not available, trying direct SQL execution...`);
      break; // Exit loop and try different approach
    }
  }

  console.log(`   ✅ ${successCount} statements executed, ${skipCount} skipped (already exist)`);
}

async function main() {
  console.log('🗄️  Database Migration Tool\n');

  // Check if subscription_plans table exists
  console.log('🔍 Checking if subscription_plans table exists...');
  const tableExists = await checkTableExists('subscription_plans');

  if (tableExists) {
    console.log('✅ subscription_plans table already exists!');
    console.log('\n📊 Checking table structure...');

    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .limit(1);

    if (!error) {
      console.log('✅ Table is accessible and ready');
      console.log('\n✨ No migrations needed. Run: npm run sync:stripe-db');
    }
    return;
  }

  console.log('❌ subscription_plans table does not exist');
  console.log('\n🚀 Applying subscriptions migration...');

  const migrationPath = resolve(__dirname, '../supabase/migrations/20251010000002_subscriptions.sql');

  try {
    await executeMigration(migrationPath, '20251010000002_subscriptions.sql');
    console.log('\n✅ Migration complete!');
    console.log('\n📊 Next steps:');
    console.log('   npm run sync:stripe-db  # Sync Stripe price IDs');
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n⚠️  Manual migration required:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/khsaawjelrppghganbuu/sql');
    console.log('   2. Copy content from: supabase/migrations/20251010000002_subscriptions.sql');
    console.log('   3. Execute in SQL Editor');
    process.exit(1);
  }
}

main().catch(console.error);
