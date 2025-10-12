#!/bin/sh

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED_ALL=true

echo "
🔎 Phase 5: Validating Upstash Services..."
echo "-------------------------------------------------"

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
else
  echo "❌ ${RED}CRITICAL: .env.local file not found.${NC}"
  exit 1
fi

# --- Validate Upstash Redis ---
echo "
Validating Upstash Redis..."
if [ -z "$UPSTASH_REDIS_REST_URL" ] || [ -z "$UPSTASH_REDIS_REST_TOKEN" ]; then
  echo "   ${YELLOW}SKIP:${NC} Redis variables not set."
else
  echo "   ${GREEN}PASS:${NC} Redis variables are present."
  API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_URL/info")
  if [ "$API_RESPONSE" -eq 200 ]; then
    echo "   ${GREEN}PASS:${NC} Successfully connected to Upstash Redis."
  else
    echo "   ${RED}FAIL:${NC} Could not connect to Upstash Redis. HTTP status: $API_RESPONSE"
    PASSED_ALL=false
  fi
fi

# --- Validate Upstash Vector ---
echo "
Validating Upstash Vector..."
if [ -z "$UPSTASH_VECTOR_REST_URL" ] || [ -z "$UPSTASH_VECTOR_REST_TOKEN" ]; then
  echo "   ${YELLOW}SKIP:${NC} Vector variables not set."
else
  echo "   ${GREEN}PASS:${NC} Vector variables are present."
  API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $UPSTASH_VECTOR_REST_TOKEN" "$UPSTASH_VECTOR_REST_URL")
  if [ "$API_RESPONSE" -eq 200 ]; then
    echo "   ${GREEN}PASS:${NC} Successfully connected to Upstash Vector."
  else
    echo "   ${RED}FAIL:${NC} Could not connect to Upstash Vector. HTTP status: $API_RESPONSE"
    PASSED_ALL=false
  fi
fi

# --- Validate Upstash Search ---
echo "
Validating Upstash Search..."
if [ -z "$UPSTASH_SEARCH_REST_URL" ] || [ -z "$UPSTASH_SEARCH_REST_TOKEN" ]; then
  echo "   ${YELLOW}SKIP:${NC} Search variables not set."
else
  echo "   ${GREEN}PASS:${NC} Search variables are present."
fi

# --- Validate Upstash QStash ---
echo "
Validating Upstash QStash..."
if [ -z "$QSTASH_TOKEN" ]; then
  echo "   ${YELLOW}SKIP:${NC} QStash variables not set."
else
  echo "   ${GREEN}PASS:${NC} QStash variables are present."
fi

echo "-------------------------------------------------"
if [ "$PASSED_ALL" = true ]; then
  echo "✅ ${GREEN}Upstash validation successful.${NC}"
  exit 0
else
  echo "❌ ${RED}Upstash validation failed. Please fix the issues above.${NC}"
  exit 1
fi
