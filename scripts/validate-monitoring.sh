#!/bin/sh

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED_ALL=true

echo "
🔎 Phase 8: Validating Monitoring Setup..."
echo "-------------------------------------------------"

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
else
  echo "❌ ${RED}CRITICAL: .env.local file not found.${NC}"
  exit 1
fi

# --- Validate Sentry ---
echo "
Validating Sentry (Error Monitoring)..."
if [ -z "$SENTRY_DSN" ] && [ -z "$NEXT_PUBLIC_SENTRY_DSN" ]; then
  echo "   ${YELLOW}SKIP:${NC} Sentry DSNs are not set. Monitoring will be disabled."
else
  if [ -z "$SENTRY_DSN" ]; then
    echo "   ${RED}FAIL:${NC} SENTRY_DSN is not set."
    PASSED_ALL=false
  else
    echo "   ${GREEN}PASS:${NC} SENTRY_DSN is present."
  fi
  if [ -z "$NEXT_PUBLIC_SENTRY_DSN" ]; then
    echo "   ${RED}FAIL:${NC} NEXT_PUBLIC_SENTRY_DSN is not set."
    PASSED_ALL=false
  else
    echo "   ${GREEN}PASS:${NC} NEXT_PUBLIC_SENTRY_DSN is present."
  fi
fi

echo "-------------------------------------------------"
if [ "$PASSED_ALL" = true ]; then
  echo "✅ ${GREEN}Monitoring validation successful.${NC}"
  exit 0
else
  echo "❌ ${RED}Monitoring validation failed. Please fix the issues above.${NC}"
  exit 1
fi
