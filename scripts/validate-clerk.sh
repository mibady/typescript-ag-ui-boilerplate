#!/bin/sh

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED_ALL=true

echo "
🔎 Phase 2: Validating Clerk (Authentication)..."
echo "-------------------------------------------------"

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
else
  echo "❌ ${RED}CRITICAL: .env.local file not found.${NC}"
  exit 1
fi

# Check for required variables
if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ] || [ -z "$CLERK_SECRET_KEY" ]; then
  echo "   ${RED}FAIL:${NC} NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY or CLERK_SECRET_KEY is not set."
  PASSED_ALL=false
else
  echo "   ${GREEN}PASS:${NC} Clerk environment variables are present."
fi

# Validate key formats
if ! echo "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" | grep -q '^pk_test_'; then
  echo "   ${RED}FAIL:${NC} NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY format is incorrect. Should start with 'pk_test_'."
  PASSED_ALL=false
else
  echo "   ${GREEN}PASS:${NC} Publishable key format is correct."
fi

if ! echo "$CLERK_SECRET_KEY" | grep -q '^sk_test_'; then
  echo "   ${RED}FAIL:${NC} CLERK_SECRET_KEY format is incorrect. Should start with 'sk_test_'."
  PASSED_ALL=false
else
  echo "   ${GREEN}PASS:${NC} Secret key format is correct."
fi

# Test API connectivity
if [ "$PASSED_ALL" = true ]; then
  echo "   Testing API connectivity..."
  API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $CLERK_SECRET_KEY" https://api.clerk.com/v1/users)

  if [ "$API_RESPONSE" -eq 200 ]; then
    echo "   ${GREEN}PASS:${NC} Successfully connected to Clerk API."
  else
    echo "   ${RED}FAIL:${NC} Could not connect to Clerk API. HTTP status: $API_RESPONSE"
    echo "         Please verify your CLERK_SECRET_KEY is correct and has API access."
    PASSED_ALL=false
  fi
fi

echo "-------------------------------------------------"
if [ "$PASSED_ALL" = true ]; then
  echo "✅ ${GREEN}Clerk validation successful.${NC}"
  exit 0
else
  echo "❌ ${RED}Clerk validation failed. Please fix the issues above.${NC}"
  exit 1
fi
