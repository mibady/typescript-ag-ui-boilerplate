/**
 * Stripe Setup Utilities
 * Automated Stripe product and price creation
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export interface StripePlanConfig {
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number; // in cents
  yearlyPrice?: number; // in cents
  features: Record<string, any>;
  limits: {
    messages_per_month: number;
    tokens_per_month: number;
    documents: number;
    team_members: number;
    sessions: number;
    api_calls_per_day: number;
  };
}

export interface CreatedPlan {
  name: string;
  productId: string;
  monthlyPriceId: string;
  yearlyPriceId?: string;
}

const PLAN_CONFIGS: Record<string, StripePlanConfig> = {
  free: {
    name: 'free',
    displayName: 'Free',
    description: 'Perfect for getting started',
    monthlyPrice: 0,
    features: {
      chat: true,
      api_access: false,
      priority_support: false,
    },
    limits: {
      messages_per_month: 100,
      tokens_per_month: 50000,
      documents: 10,
      team_members: 1,
      sessions: 5,
      api_calls_per_day: 100,
    },
  },
  pro: {
    name: 'pro',
    displayName: 'Pro',
    description: 'For professionals and growing teams',
    monthlyPrice: 2000, // $20
    yearlyPrice: 19200, // $192 (20% discount)
    features: {
      chat: true,
      api_access: true,
      priority_support: true,
      custom_models: false,
    },
    limits: {
      messages_per_month: 10000,
      tokens_per_month: 5000000,
      documents: 1000,
      team_members: 10,
      sessions: 100,
      api_calls_per_day: 10000,
    },
  },
  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'For large organizations with custom needs',
    monthlyPrice: 10000, // $100
    yearlyPrice: 96000, // $960 (20% discount)
    features: {
      chat: true,
      api_access: true,
      priority_support: true,
      custom_models: true,
      dedicated_support: true,
      sla: true,
    },
    limits: {
      messages_per_month: -1, // unlimited
      tokens_per_month: -1, // unlimited
      documents: -1, // unlimited
      team_members: -1, // unlimited
      sessions: -1, // unlimited
      api_calls_per_day: -1, // unlimited
    },
  },
};

/**
 * Create Stripe products and prices for all plans
 */
export async function createStripeProducts(
  stripe: Stripe,
  mode: 'test' | 'production' = 'test'
): Promise<CreatedPlan[]> {
  const createdPlans: CreatedPlan[] = [];

  for (const [key, config] of Object.entries(PLAN_CONFIGS)) {
    console.log(`Creating ${config.displayName} plan...`);

    // Create product
    const product = await stripe.products.create({
      name: config.displayName,
      description: config.description,
      metadata: {
        plan_name: config.name,
        environment: mode,
      },
    });

    // Create monthly price
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      currency: 'usd',
      recurring: { interval: 'month' },
      unit_amount: config.monthlyPrice,
      metadata: {
        plan_name: config.name,
        billing_cycle: 'monthly',
      },
    });

    let yearlyPriceId: string | undefined;

    // Create yearly price if configured
    if (config.yearlyPrice !== undefined) {
      const yearlyPrice = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        recurring: { interval: 'year' },
        unit_amount: config.yearlyPrice,
        metadata: {
          plan_name: config.name,
          billing_cycle: 'yearly',
        },
      });
      yearlyPriceId = yearlyPrice.id;
    }

    createdPlans.push({
      name: config.name,
      productId: product.id,
      monthlyPriceId: monthlyPrice.id,
      yearlyPriceId,
    });

    console.log(`✅ Created ${config.displayName}: ${monthlyPrice.id}${yearlyPriceId ? `, ${yearlyPriceId}` : ''}`);
  }

  return createdPlans;
}

/**
 * Sync Stripe prices to Supabase database
 */
export async function syncPricesToDatabase(
  createdPlans: CreatedPlan[],
  supabaseUrl: string,
  supabaseKey: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  for (const plan of createdPlans) {
    const config = PLAN_CONFIGS[plan.name];

    // Upsert subscription plan
    const { error } = await supabase
      .from('subscription_plans')
      .upsert({
        name: config.name,
        display_name: config.displayName,
        description: config.description,
        price_monthly: config.monthlyPrice,
        price_yearly: config.yearlyPrice || null,
        stripe_price_id_monthly: plan.monthlyPriceId,
        stripe_price_id_yearly: plan.yearlyPriceId || null,
        stripe_product_id: plan.productId,
        features: config.features,
        limits: config.limits,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'name',
      });

    if (error) {
      throw new Error(`Failed to sync ${plan.name} to database: ${error.message}`);
    }

    console.log(`✅ Synced ${config.displayName} to database`);
  }
}

/**
 * Validate Stripe setup
 */
export async function validateStripeSetup(
  stripe: Stripe,
  supabaseUrl: string,
  supabaseKey: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check each plan
  for (const [key, config] of Object.entries(PLAN_CONFIGS)) {
    // Check database record
    const { data: dbPlan, error: dbError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', config.name)
      .single();

    if (dbError || !dbPlan) {
      errors.push(`Database: ${config.name} plan not found`);
      continue;
    }

    // Validate monthly price
    if (!dbPlan.stripe_price_id_monthly) {
      errors.push(`${config.name}: Missing monthly price ID`);
    } else {
      try {
        const price = await stripe.prices.retrieve(dbPlan.stripe_price_id_monthly);
        if (price.unit_amount !== config.monthlyPrice) {
          errors.push(`${config.name}: Monthly price mismatch (expected ${config.monthlyPrice}, got ${price.unit_amount})`);
        }
      } catch (err) {
        errors.push(`${config.name}: Invalid monthly price ID in Stripe`);
      }
    }

    // Validate yearly price if configured
    if (config.yearlyPrice && dbPlan.stripe_price_id_yearly) {
      try {
        const price = await stripe.prices.retrieve(dbPlan.stripe_price_id_yearly);
        if (price.unit_amount !== config.yearlyPrice) {
          errors.push(`${config.name}: Yearly price mismatch (expected ${config.yearlyPrice}, got ${price.unit_amount})`);
        }
      } catch (err) {
        errors.push(`${config.name}: Invalid yearly price ID in Stripe`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Delete all Stripe products (for cleanup/reset)
 */
export async function deleteAllStripeProducts(
  stripe: Stripe,
  mode: 'test' | 'production' = 'test'
): Promise<void> {
  const products = await stripe.products.list({ limit: 100 });

  for (const product of products.data) {
    if (product.metadata.environment === mode) {
      await stripe.products.update(product.id, { active: false });
      console.log(`❌ Deactivated product: ${product.name}`);
    }
  }
}
