#!/bin/sh

# ============================================================================
# E2E TEST READINESS CHECK
# ============================================================================
# Validates that E2E tests can run by checking:
# - Test user credentials configured
# - Test users can authenticate
# - Application is accessible
# - Required services are reachable
#
# Usage: npm run test:e2e:check
# ============================================================================

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Track overall readiness
READY=true
WARNINGS=0

echo ""
echo "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo "${CYAN}║${NC}         ${YELLOW}E2E TEST READINESS CHECK${NC}                        ${CYAN}║${NC}"
echo "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "${BLUE}🔍 Checking E2E test environment...${NC}"
echo ""

# ============================================================================
# CHECK 1: Environment Variables
# ============================================================================

echo "${CYAN}━━━ Check 1: Environment Variables ━━━${NC}"

# Load environment variables
if [ -f ".env.local" ]; then
  export $(grep -v '^#' .env.local | xargs) 2>/dev/null
fi

if [ -f ".env.test" ]; then
  export $(grep -v '^#' .env.test | xargs) 2>/dev/null
fi

# Check test user credentials
if [ -z "$TEST_USER_EMAIL" ] || [ -z "$TEST_USER_PASSWORD" ]; then
  echo "${RED}❌ Test user credentials not configured${NC}"
  echo "   Missing: TEST_USER_EMAIL and/or TEST_USER_PASSWORD"
  READY=false
else
  echo "${GREEN}✅ Test user credentials configured${NC}"
  echo "   Email: ${TEST_USER_EMAIL}"
fi

# Check Clerk credentials
if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ] || [ -z "$CLERK_SECRET_KEY" ]; then
  echo "${RED}❌ Clerk credentials not configured${NC}"
  READY=false
else
  echo "${GREEN}✅ Clerk credentials configured${NC}"
fi

# Check Supabase credentials
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "${RED}❌ Supabase credentials not configured${NC}"
  READY=false
else
  echo "${GREEN}✅ Supabase credentials configured${NC}"
fi

echo ""

# ============================================================================
# CHECK 2: Playwright Installation
# ============================================================================

echo "${CYAN}━━━ Check 2: Playwright Installation ━━━${NC}"

if command -v npx &> /dev/null; then
  # Check if playwright is installed
  if npx playwright --version &> /dev/null; then
    echo "${GREEN}✅ Playwright installed${NC}"
  else
    echo "${YELLOW}⚠️  Playwright not installed${NC}"
    echo "   Run: npx playwright install"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo "${RED}❌ npx not found${NC}"
  READY=false
fi

echo ""

# ============================================================================
# CHECK 3: Application Accessibility
# ============================================================================

echo "${CYAN}━━━ Check 3: Application Accessibility ━━━${NC}"

APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"

# Check if app is running
if curl -s -o /dev/null -w "%{http_code}" "$APP_URL" > /dev/null 2>&1; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL")
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "308" ]; then
    echo "${GREEN}✅ Application accessible${NC}"
    echo "   URL: ${APP_URL}"
  else
    echo "${YELLOW}⚠️  Application returned HTTP ${HTTP_CODE}${NC}"
    echo "   URL: ${APP_URL}"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo "${YELLOW}⚠️  Application not running${NC}"
  echo "   URL: ${APP_URL}"
  echo "   Playwright will start it automatically during tests"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# CHECK 4: Service Connectivity
# ============================================================================

echo "${CYAN}━━━ Check 4: Service Connectivity ━━━${NC}"

# Check Clerk
if [ -n "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ]; then
  echo "${GREEN}✅ Clerk configured${NC}"
else
  echo "${RED}❌ Clerk not configured${NC}"
  READY=false
fi

# Check Supabase
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  if curl -s -o /dev/null -w "%{http_code}" "$NEXT_PUBLIC_SUPABASE_URL" > /dev/null 2>&1; then
    echo "${GREEN}✅ Supabase reachable${NC}"
  else
    echo "${YELLOW}⚠️  Supabase connectivity issue${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo "${RED}❌ Supabase not configured${NC}"
  READY=false
fi

echo ""

# ============================================================================
# CHECK 5: Test User Validation
# ============================================================================

echo "${CYAN}━━━ Check 5: Test User Validation ━━━${NC}"

if [ -n "$TEST_USER_EMAIL" ] && [ -n "$TEST_USER_PASSWORD" ]; then
  echo "${BLUE}ℹ️  Test user credentials found${NC}"
  echo "   Email: ${TEST_USER_EMAIL}"
  echo ""
  echo "${YELLOW}⚠️  Cannot automatically verify test user authentication${NC}"
  echo "   Reason: Requires browser session and Clerk interaction"
  echo "   Manual verification required:"
  echo "   1. Go to ${APP_URL}/sign-in"
  echo "   2. Sign in with test user credentials"
  echo "   3. Verify sign in works"
  echo ""
  echo "   Or run auth E2E test: npm run test:e2e:auth"
  WARNINGS=$((WARNINGS + 1))
else
  echo "${RED}❌ Test user credentials not configured${NC}"
  READY=false
fi

echo ""

# ============================================================================
# CHECK 6: Test Data
# ============================================================================

echo "${CYAN}━━━ Check 6: Test Data Setup ━━━${NC}"

echo "${BLUE}ℹ️  Test data should be initialized for best results${NC}"
echo "   Run: npm run setup:test-data"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo "${CYAN}║${NC}                    ${YELLOW}SUMMARY${NC}                                 ${CYAN}║${NC}"
echo "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

if $READY; then
  echo "${GREEN}🎉 E2E tests are READY to run!${NC}"
  echo ""

  if [ $WARNINGS -gt 0 ]; then
    echo "${YELLOW}⚠️  ${WARNINGS} warning(s) found (tests may still work)${NC}"
    echo ""
  fi

  echo "${BLUE}Next steps:${NC}"
  echo "  ${CYAN}npm run test:e2e${NC}          Run all E2E tests"
  echo "  ${CYAN}npm run test:e2e:auth${NC}     Run authentication tests"
  echo "  ${CYAN}npm run test:e2e:headed${NC}   Run with visible browser"
  echo ""

  exit 0
else
  echo "${RED}❌ E2E tests CANNOT run - setup required${NC}"
  echo ""
  echo "${YELLOW}Required actions:${NC}"
  echo ""

  if [ -z "$TEST_USER_EMAIL" ] || [ -z "$TEST_USER_PASSWORD" ]; then
    echo "${YELLOW}1. Configure test user credentials:${NC}"
    echo "   Edit .env.test:"
    echo "   ${CYAN}TEST_USER_EMAIL=your-test-user@example.com${NC}"
    echo "   ${CYAN}TEST_USER_PASSWORD=YourSecurePassword123!${NC}"
    echo ""
  fi

  if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ] || [ -z "$CLERK_SECRET_KEY" ]; then
    echo "${YELLOW}2. Configure Clerk credentials:${NC}"
    echo "   Add to .env.local:"
    echo "   ${CYAN}NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...${NC}"
    echo "   ${CYAN}CLERK_SECRET_KEY=sk_test_...${NC}"
    echo ""
  fi

  echo "${YELLOW}3. Create test user in Clerk Dashboard:${NC}"
  echo "   • Go to: ${CYAN}https://dashboard.clerk.com${NC}"
  echo "   • Navigate to: Users → Create user"
  echo "   • Use email/password from .env.test"
  echo "   • Enable 'Skip email verification' for testing"
  echo ""

  echo "${YELLOW}4. Setup test data:${NC}"
  echo "   ${CYAN}npm run setup:test-data${NC}"
  echo ""

  echo "${YELLOW}5. Re-run this check:${NC}"
  echo "   ${CYAN}npm run test:e2e:check${NC}"
  echo ""

  echo "${BLUE}📖 Full setup guide:${NC}"
  echo "   ${CYAN}docs/guides/e2e-setup.md${NC}"
  echo ""

  exit 1
fi
