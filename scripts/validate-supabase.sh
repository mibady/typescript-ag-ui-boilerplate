#!/bin/sh

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED_ALL=true

echo "
🔎 Phase 3: Validating Supabase (Database)..."
echo "-------------------------------------------------"

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
else
  echo "❌ ${RED}CRITICAL: .env.local file not found.${NC}"
  exit 1
fi

# Check for required variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "   ${RED}FAIL:${NC} One or more Supabase environment variables are not set."
  PASSED_ALL=false
else
  echo "   ${GREEN}PASS:${NC} Supabase environment variables are present."
fi

# Validate URL format
if ! echo "$NEXT_PUBLIC_SUPABASE_URL" | grep -q 'https://.*\.supabase\.co'; then
  echo "   ${RED}FAIL:${NC} NEXT_PUBLIC_SUPABASE_URL format is incorrect. Should be 'https://<project-ref>.supabase.co'."
  PASSED_ALL=false
else
  echo "   ${GREEN}PASS:${NC} Supabase URL format is correct."
fi

# Test API connectivity
if [ "$PASSED_ALL" = true ]; then
  echo "   Testing API connectivity..."
  API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/")

  if [ "$API_RESPONSE" -eq 200 ]; then
    echo "   ${GREEN}PASS:${NC} Successfully connected to Supabase API."
  else
    echo "   ${RED}FAIL:${NC} Could not connect to Supabase. HTTP status: $API_RESPONSE"
    echo "         Please verify your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correct."
    PASSED_ALL=false
  fi
fi

echo "-------------------------------------------------"
if [ "$PASSED_ALL" = true ]; then
  echo "✅ ${GREEN}Supabase validation successful.${NC}"
  exit 0
else
  echo "❌ ${RED}Supabase validation failed. Please fix the issues above.${NC}"
  exit 1
fi
