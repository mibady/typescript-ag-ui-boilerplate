#!/bin/sh

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED_ALL=true
PROVIDER_SET=false

echo "
🔎 Phase 4: Validating AI Providers (LLM)..."
echo "-------------------------------------------------"

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
else
  echo "❌ ${RED}CRITICAL: .env.local file not found.${NC}"
  exit 1
fi

# Check if at least one provider is set
if [ -n "$OPENAI_API_KEY" ]; then PROVIDER_SET=true; fi
if [ -n "$ANTHROPIC_API_KEY" ]; then PROVIDER_SET=true; fi
if [ -n "$GOOGLE_AI_API_KEY" ]; then PROVIDER_SET=true; fi
if [ -n "$MISTRAL_API_KEY" ]; then PROVIDER_SET=true; fi

if [ "$PROVIDER_SET" = false ]; then
  echo "   ${RED}FAIL:${NC} No AI provider API key is set. At least one is required."
  PASSED_ALL=false
else
  echo "   ${GREEN}PASS:${NC} At least one AI provider key is present."
fi

# If OpenAI key is present, validate it
if [ -n "$OPENAI_API_KEY" ]; then
  echo "   Validating OpenAI API Key..."
  if ! echo "$OPENAI_API_KEY" | grep -q '^sk-'; then
    echo "   ${RED}FAIL:${NC} OPENAI_API_KEY format is incorrect. Should start with 'sk-'."
    PASSED_ALL=false
  else
    echo "   ${GREEN}PASS:${NC} OpenAI key format is correct."
    echo "   Testing API connectivity..."
    API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models)

    if [ "$API_RESPONSE" -eq 200 ]; then
      echo "   ${GREEN}PASS:${NC} Successfully connected to OpenAI API."
    else
      echo "   ${RED}FAIL:${NC} Could not connect to OpenAI API. HTTP status: $API_RESPONSE"
      echo "         Please verify your OPENAI_API_KEY."
      PASSED_ALL=false
    fi
  fi
fi

echo "-------------------------------------------------"
if [ "$PASSED_ALL" = true ]; then
  echo "✅ ${GREEN}AI Provider validation successful.${NC}"
  exit 0
else
  echo "❌ ${RED}AI Provider validation failed. Please fix the issues above.${NC}"
  exit 1
fi
