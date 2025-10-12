#!/bin/sh

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED_ALL=true

echo "
🔎 Phase 6: Validating Stripe (Payments)..."
echo "-------------------------------------------------"

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
else
  echo "❌ ${RED}CRITICAL: .env.local file not found.${NC}"
  exit 1
fi

# Check for required variables
if [ -z "$STRIPE_SECRET_KEY" ] || [ -z "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" ] || [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
  echo "   ${YELLOW}SKIP:${NC} Stripe environment variables are not set. This is optional unless you need payments."
  exit 0
fi

echo "   ${GREEN}PASS:${NC} Stripe environment variables are present."

# Validate key formats
if ! echo "$STRIPE_SECRET_KEY" | grep -q '^sk_test_'; then
  echo "   ${RED}FAIL:${NC} STRIPE_SECRET_KEY format is incorrect. Should start with 'sk_test_'."
  PASSED_ALL=false
fi

if ! echo "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" | grep -q '^pk_test_'; then
  echo "   ${RED}FAIL:${NC} NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY format is incorrect. Should start with 'pk_test_'."
  PASSED_ALL=false
fi

if ! echo "$STRIPE_WEBHOOK_SECRET" | grep -q '^whsec_'; then
  echo "   ${RED}FAIL:${NC} STRIPE_WEBHOOK_SECRET format is incorrect. Should start with 'whsec_'."
  PASSED_ALL=false
fi

# Test API connectivity
if [ "$PASSED_ALL" = true ]; then
  echo "   Testing API connectivity..."
  API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -u "$STRIPE_SECRET_KEY:" https://api.stripe.com/v1/balance)

  if [ "$API_RESPONSE" -eq 200 ]; then
    echo "   ${GREEN}PASS:${NC} Successfully connected to Stripe API."
  else
    echo "   ${RED}FAIL:${NC} Could not connect to Stripe API. HTTP status: $API_RESPONSE"
    echo "         Please verify your STRIPE_SECRET_KEY."
    PASSED_ALL=false
  fi
fi

echo "-------------------------------------------------"
if [ "$PASSED_ALL" = true ]; then
  echo "✅ ${GREEN}Stripe validation successful.${NC}"
  exit 0
else
  echo "❌ ${RED}Stripe validation failed. Please fix the issues above.${NC}"
  exit 1
fi
