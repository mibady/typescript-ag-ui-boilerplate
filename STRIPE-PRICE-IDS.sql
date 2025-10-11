-- Manual Stripe Price ID Update
-- Run this in Supabase SQL Editor if automated sync fails
--
-- Created by: npm run setup:stripe
-- Date: 2025-10-10
--
-- These are the Stripe Price IDs created by the automated setup:

-- Free Plan
UPDATE subscription_plans
SET
  stripe_price_id_monthly = 'price_1SGszIDdWGNoBuU6GRptacEq',
  stripe_price_id_yearly = NULL,
  stripe_product_id = NULL -- Will be filled from Stripe
WHERE name = 'free';

-- Pro Plan
UPDATE subscription_plans
SET
  stripe_price_id_monthly = 'price_1SGszIDdWGNoBuU6MOLxc94a',
  stripe_price_id_yearly = 'price_1SGszJDdWGNoBuU6cf2gVpJA',
  stripe_product_id = NULL -- Will be filled from Stripe
WHERE name = 'pro';

-- Enterprise Plan
UPDATE subscription_plans
SET
  stripe_price_id_monthly = 'price_1SGszJDdWGNoBuU6njlNGVuQ',
  stripe_price_id_yearly = 'price_1SGszJDdWGNoBuU6l1A6NiqU',
  stripe_product_id = NULL -- Will be filled from Stripe
WHERE name = 'enterprise';

-- Verify the update
SELECT name, stripe_price_id_monthly, stripe_price_id_yearly
FROM subscription_plans
ORDER BY price_monthly;
