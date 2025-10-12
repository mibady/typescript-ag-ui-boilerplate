#!/bin/sh

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED_ALL=true

echo "
🔎 Phase 7: Validating Security Configuration..."
echo "-------------------------------------------------"

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
else
  echo "❌ ${RED}CRITICAL: .env.local file not found.${NC}"
  exit 1
fi

# --- Validate Arcjet ---
echo "
Validating Arcjet (Bot Protection, Rate Limiting)..."
if [ -z "$ARCJET_KEY" ]; then
  echo "   ${YELLOW}SKIP:${NC} ARCJET_KEY is not set. Protection will be disabled."
else
  if ! echo "$ARCJET_KEY" | grep -q '^ajkey_'; then
    echo "   ${RED}FAIL:${NC} ARCJET_KEY format is incorrect. Should start with 'ajkey_'."
    PASSED_ALL=false
  else
    echo "   ${GREEN}PASS:${NC} ARCJET_KEY is present and has the correct format."
  fi
fi

echo "-------------------------------------------------"
if [ "$PASSED_ALL" = true ]; then
  echo "✅ ${GREEN}Security validation successful.${NC}"
  exit 0
else
  echo "❌ ${RED}Security validation failed. Please fix the issues above.${NC}"
  exit 1
fi
