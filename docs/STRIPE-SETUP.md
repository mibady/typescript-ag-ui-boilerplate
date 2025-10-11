# Automated Stripe Setup Guide

**Zero-Configuration Stripe Integration**

This guide explains how to automatically set up Stripe products, prices, and database configuration without any manual Dashboard work.

## Quick Start

```bash
# 1. Ensure environment variables are set
cp .env.example .env
# Add your Stripe test keys to .env

# 2. Run automated setup
npm run setup:stripe

# 3. Validate setup
npm run validate:stripe

# 4. Start accepting payments!
npm run dev
```

That's it! Your Stripe integration is ready.

## What Gets Created

### Stripe Products & Prices

The setup script automatically creates:

#### **Free Plan** ($0/month)
- Product: "Free"
- Monthly price: $0
- Features: Basic chat, limited API access
- Limits: 100 messages/month, 50K tokens, 10 documents

#### **Pro Plan** ($20/month or $192/year)
- Product: "Pro"
- Monthly price: $20.00
- Yearly price: $192.00 (20% discount)
- Features: Full chat, API access, priority support
- Limits: 10K messages/month, 5M tokens, 1000 documents
- **Includes 14-day free trial**

#### **Enterprise Plan** ($100/month or $960/year)
- Product: "Enterprise"
- Monthly price: $100.00
- Yearly price: $960.00 (20% discount)
- Features: Everything + custom models, dedicated support, SLA
- Limits: Unlimited everything

### Database Configuration

The script also updates your Supabase `subscription_plans` table with:
- Stripe price IDs (monthly & yearly)
- Stripe product IDs
- Plan features and limits
- Pricing information

## Commands

### Setup

```bash
# Test mode (default)
npm run setup:stripe

# Production mode
npm run setup:stripe -- --prod

# Reset and recreate everything
npm run setup:stripe -- --reset
```

### Validation

```bash
# Validate current setup
npm run validate:stripe
```

This checks:
- ✅ All products exist in Stripe
- ✅ All prices are correctly configured
- ✅ Database records match Stripe
- ✅ Price amounts are correct

## Environment Variables

Required in `.env`:

```bash
# Stripe (automatically detects test vs production)
STRIPE_SECRET_KEY=sk_test_...  # or sk_live_...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # or SUPABASE_ANON_KEY
```

## How It Works

### 1. **Idempotent Design**
- Safe to run multiple times
- Won't create duplicates
- Updates existing records

### 2. **Environment-Aware**
- Automatically detects test vs production keys
- Prevents mixing environments
- Tags all products with environment metadata

### 3. **Database Sync**
- Creates products in Stripe
- Stores price IDs in Supabase
- Links everything together
- Enables immediate billing

### 4. **Validation**
- Verifies Stripe products exist
- Checks price amounts match
- Ensures database consistency
- Reports any issues

## Customization

### Modify Plan Configuration

Edit `lib/stripe/setup.ts` to customize:

```typescript
const PLAN_CONFIGS = {
  free: {
    name: 'free',
    displayName: 'Free',
    monthlyPrice: 0, // in cents
    limits: {
      messages_per_month: 100,
      // ... other limits
    },
  },
  // ... other plans
};
```

### Add New Plans

1. Add plan config to `PLAN_CONFIGS` in `lib/stripe/setup.ts`
2. Run `npm run setup:stripe -- --reset`
3. New plan is automatically created!

## Production Deployment

### Initial Setup

```bash
# 1. Set production Stripe key in .env
STRIPE_SECRET_KEY=sk_live_...

# 2. Run production setup
npm run setup:stripe -- --prod

# 3. Validate
npm run validate:stripe
```

### CI/CD Integration

Add to your deployment pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Setup Stripe
  run: npm run setup:stripe -- --prod
  env:
    STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## Troubleshooting

### "STRIPE_SECRET_KEY not found"
- Ensure `.env` file exists
- Check `STRIPE_SECRET_KEY` is set
- Verify no typos in variable name

### "Stripe key mode doesn't match"
- You're using `--prod` flag with test key (or vice versa)
- Use `sk_test_` for test mode
- Use `sk_live_` for production mode

### "Failed to sync to database"
- Check Supabase credentials
- Verify `subscription_plans` table exists
- Run database migration if needed

### "Validation failed"
- Run `npm run setup:stripe -- --reset` to recreate
- Check Stripe Dashboard for conflicts
- Verify environment variables

## Migration from Manual Setup

If you already created products manually:

```bash
# 1. Backup existing setup (optional)
# Export from Stripe Dashboard

# 2. Reset and use automated setup
npm run setup:stripe -- --reset

# 3. Update any existing subscriptions (if needed)
# Point to new price IDs in database
```

## Testing

### Test the Setup

```typescript
// Test checkout flow
const response = await fetch('/api/billing/checkout', {
  method: 'POST',
  body: JSON.stringify({
    planId: 'plan_pro_id', // From database
    billingCycle: 'monthly',
  }),
});

const { url } = await response.json();
// Redirect to Stripe Checkout
window.location.href = url;
```

### Test Cards (Test Mode Only)

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3DS Required: 4000 0025 0000 3155
```

## Files Reference

- `lib/stripe/setup.ts` - Core setup functions
- `scripts/setup-stripe.ts` - Setup CLI script
- `scripts/validate-stripe.ts` - Validation CLI script
- `app/api/billing/checkout/route.ts` - Checkout API
- `app/api/billing/webhooks/route.ts` - Webhook handler

## Support

### Common Issues

**Q: Can I change prices after setup?**
A: Yes! Update `PLAN_CONFIGS` and run `--reset`

**Q: How do I add a new plan?**
A: Add to `PLAN_CONFIGS`, run setup script

**Q: Does this work with existing customers?**
A: Yes! Existing subscriptions continue working

**Q: Can I use custom price IDs?**
A: Not directly - use the auto-generated IDs or modify the script

## Best Practices

1. **Always validate after setup**: `npm run validate:stripe`
2. **Test in test mode first**: Never skip testing
3. **Use version control**: Track `PLAN_CONFIGS` changes
4. **Document custom changes**: If you modify plans
5. **Keep environments separate**: Never mix test/prod keys

---

**🎉 You're Ready!**

Your Stripe integration is fully automated and ready for production. No manual configuration needed!

For more help, see:
- [Stripe API Docs](https://stripe.com/docs/api)
- [Phase 6 Documentation](./PHASE-6-COMPLETE.md)
- [Testing Guide](./PHASE-7-TESTING-PLAN.md)
