#!/bin/sh

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED_ALL=true

echo "
🔎 Phase 1: Validating Environment Variables..."
echo "-------------------------------------------------"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo "❌ ${RED}CRITICAL: .env.local file not found.${NC}"
  echo "   Please copy .env.example to .env.local and fill in your keys."
  echo "   cp .env.example .env.local"
  exit 1
fi

# Function to check if a variable is set and not a placeholder
check_var() {
  VAR_NAME=$1
  if ! grep -q "^${VAR_NAME}=" .env.local || grep -q "^${VAR_NAME}=pk_test_xxxxx" .env.local || grep -q "^${VAR_NAME}=sk_test_xxxxx" .env.local || grep -q "^${VAR_NAME}=eyJxxxxx" .env.local || grep -q "^${VAR_NAME}=xxxxx" .env.local || grep -q "^${VAR_NAME}=$" .env.local; then
    echo "   ${RED}FAIL:${NC} ${VAR_NAME} is not set or is using a placeholder value."
    PASSED_ALL=false
  else
    echo "   ${GREEN}PASS:${NC} ${VAR_NAME} is set."
  fi
}

# --- Check Required Variables ---
echo "
Checking Required Services:"
check_var "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
check_var "CLERK_SECRET_KEY"
check_var "NEXT_PUBLIC_SUPABASE_URL"
check_var "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_var "SUPABASE_SERVICE_ROLE_KEY"
check_var "UPSTASH_REDIS_REST_URL"
check_var "UPSTASH_REDIS_REST_TOKEN"
check_var "OPENAI_API_KEY" # Assuming at least one AI provider is required

# --- Check Optional but Important Variables ---
echo "
Checking Optional Services (if you intend to use them):"
check_var "STRIPE_SECRET_KEY"
check_var "RESEND_API_KEY"
check_var "ARCJET_KEY"
check_var "SENTRY_DSN"


echo "-------------------------------------------------"
if [ "$PASSED_ALL" = true ]; then
  echo "✅ ${GREEN}Environment validation successful.${NC}"
  exit 0
else
  echo "❌ ${RED}Environment validation failed. Please fix the variables listed above.${NC}"
  exit 1
fi
