-- Add stripe_product_id column if it doesn't exist
-- This allows us to store the Stripe Product ID alongside price IDs

ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_product
ON subscription_plans(stripe_product_id);

-- Update seed data with Stripe IDs from automation
-- These will be updated by the setup script
UPDATE subscription_plans
SET
  stripe_price_id_monthly = NULL,
  stripe_price_id_yearly = NULL,
  stripe_product_id = NULL
WHERE stripe_price_id_monthly IS NULL;
