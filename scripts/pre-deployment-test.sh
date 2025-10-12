#!/bin/sh

# ============================================================================
# PRE-DEPLOYMENT TEST SUITE
# ============================================================================
# Comprehensive testing workflow before production deployment
# Includes: Environment validation, E2E tests, integration tests, load tests
#
# Usage: npm run test:pre-deploy
# ============================================================================

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Track overall status
OVERALL_STATUS=0
START_TIME=$(date +%s)

# Test results
PHASE_RESULTS=""

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

log_phase() {
  echo ""
  echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo "${BLUE}Phase $1: $2${NC}"
  echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_success() {
  echo "${GREEN}✅ $1${NC}"
}

log_error() {
  echo "${RED}❌ $1${NC}"
}

log_warning() {
  echo "${YELLOW}⚠️  $1${NC}"
}

log_info() {
  echo "${CYAN}ℹ️  $1${NC}"
}

run_phase() {
  local phase_num=$1
  local phase_name=$2
  local script_name=$3
  local phase_start=$(date +%s)

  log_phase "$phase_num" "$phase_name"

  # Run the phase script
  if [ -f "$script_name" ]; then
    sh "$script_name"
    local phase_status=$?

    local phase_end=$(date +%s)
    local phase_duration=$((phase_end - phase_start))

    if [ $phase_status -eq 0 ]; then
      log_success "$phase_name completed (${phase_duration}s)"
      PHASE_RESULTS="$PHASE_RESULTS\n${GREEN}✅ Phase $phase_num: $phase_name (${phase_duration}s)${NC}"
    else
      log_error "$phase_name failed (${phase_duration}s)"
      PHASE_RESULTS="$PHASE_RESULTS\n${RED}❌ Phase $phase_num: $phase_name (${phase_duration}s)${NC}"
      OVERALL_STATUS=1
    fi

    return $phase_status
  else
    log_warning "Script not found: $script_name (skipping)"
    PHASE_RESULTS="$PHASE_RESULTS\n${YELLOW}⚠️  Phase $phase_num: $phase_name (skipped)${NC}"
    return 0
  fi
}

run_test_suite() {
  local suite_name=$1
  local command=$2
  local suite_start=$(date +%s)

  log_info "Running $suite_name..."

  eval "$command"
  local status=$?

  local suite_end=$(date +%s)
  local suite_duration=$((suite_end - suite_start))

  if [ $status -eq 0 ]; then
    log_success "$suite_name passed (${suite_duration}s)"
  else
    log_error "$suite_name failed (${suite_duration}s)"
    OVERALL_STATUS=1
  fi

  return $status
}

# ============================================================================
# BANNER
# ============================================================================

clear
echo ""
echo "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo "${CYAN}║${NC}           ${YELLOW}PRE-DEPLOYMENT TEST SUITE${NC}                       ${CYAN}║${NC}"
echo "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "${BLUE}Starting comprehensive pre-deployment validation...${NC}"
echo "${BLUE}Date: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# ============================================================================
# PHASE 1: ENVIRONMENT VALIDATION
# ============================================================================

run_phase "1" "Environment Validation" "scripts/validate-env.sh"

# ============================================================================
# PHASE 2: SERVICE CONNECTIVITY
# ============================================================================

log_phase "2" "Service Connectivity Tests"

# Run all service validation scripts
run_phase "2.1" "Clerk (Auth)" "scripts/validate-clerk.sh"
run_phase "2.2" "Supabase (Database)" "scripts/validate-supabase.sh"
run_phase "2.3" "Upstash (Redis/Vector/QStash)" "scripts/validate-upstash.sh"
run_phase "2.4" "AI Services (LLM)" "scripts/validate-ai.sh"
run_phase "2.5" "Stripe (Payments)" "scripts/validate-stripe.sh"
run_phase "2.6" "Security (Arcjet)" "scripts/validate-security.sh"
run_phase "2.7" "Monitoring (Sentry)" "scripts/validate-monitoring.sh"

# ============================================================================
# PHASE 3: AUTHENTICATION E2E TESTS (PRIORITY #1)
# ============================================================================

log_phase "3" "Authentication E2E Tests (CRITICAL)"
log_warning "Authentication is Priority #1 - Failures here block deployment!"

run_test_suite "Authentication E2E Tests" "npm run test:e2e:auth -- --reporter=list"

# Check if auth tests passed - CRITICAL
if [ $? -ne 0 ]; then
  log_error "CRITICAL: Authentication tests failed!"
  log_error "Deployment BLOCKED until authentication issues are resolved."

  # Generate failure report immediately
  echo ""
  echo "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo "${RED}║${NC}                ${RED}DEPLOYMENT BLOCKED${NC}                         ${RED}║${NC}"
  echo "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "${RED}Authentication tests must pass before proceeding to deployment.${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Review test failures above"
  echo "2. Fix authentication issues"
  echo "3. Re-run: npm run test:pre-deploy"
  echo ""

  exit 1
fi

log_success "Authentication tests passed - proceeding with deployment validation"

# ============================================================================
# PHASE 4: AG-UI SDK INTEGRATION TESTS (CRITICAL)
# ============================================================================

log_phase "4" "AG-UI SDK Integration Tests (CRITICAL)"
log_warning "AG-UI is the foundation - Validating 3-layer architecture!"

# 4.1: AG-UI Event System (Unit Tests)
run_test_suite "AG-UI Event System" "npm run test:unit:agui -- --run --reporter=verbose"

# 4.2: BaseAgent Implementation (Integration Tests)
run_test_suite "AG-UI BaseAgent" "npm run test:integration:agui -- --run --reporter=verbose"

# 4.3: AG-UI Protocol E2E (HttpAgent, Streaming, Event Lifecycle)
run_test_suite "AG-UI E2E Tests" "npm run test:e2e:agui -- --reporter=list"

# Check if AG-UI tests passed - CRITICAL
if [ $? -ne 0 ]; then
  log_error "CRITICAL: AG-UI integration tests failed!"
  log_error "AG-UI is the foundation of the agent system."

  echo ""
  echo "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo "${RED}║${NC}                ${RED}DEPLOYMENT BLOCKED${NC}                         ${RED}║${NC}"
  echo "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "${RED}AG-UI SDK integration must work before deployment.${NC}"
  echo ""
  echo "AG-UI 3-Layer Architecture:"
  echo "  Layer 1: Frontend ↔ Backend (HttpAgent, SSE Events)"
  echo "  Layer 2: Backend ↔ LLM (Vercel AI SDK)"
  echo "  Layer 3: Data & Services (Redis, Supabase)"
  echo ""
  echo "Next steps:"
  echo "1. Review AG-UI test failures above"
  echo "2. Check lib/agui-events.ts for event creation"
  echo "3. Check lib/agents/base-agent.ts for event lifecycle"
  echo "4. Check app/api/agent/stream/route.ts for HttpAgent endpoint"
  echo "5. Re-run: npm run test:pre-deploy"
  echo ""

  exit 1
fi

log_success "AG-UI SDK integration validated - 3-layer architecture working!"

# ============================================================================
# PHASE 5: UNIT TESTS
# ============================================================================

log_phase "5" "Unit Tests"

run_test_suite "Unit Tests" "npm test -- --run --reporter=verbose"

# ============================================================================
# PHASE 6: INTEGRATION TESTS
# ============================================================================

log_phase "6" "Integration Tests"

run_test_suite "Integration Tests" "npm run test:integration -- --run --reporter=verbose"

# ============================================================================
# PHASE 7: E2E TEST SUITE (FULL)
# ============================================================================

log_phase "7" "Full E2E Test Suite"

# Check if E2E tests are ready to run
log_info "Checking E2E test readiness..."

if [ -f "scripts/check-e2e-ready.sh" ]; then
  sh scripts/check-e2e-ready.sh > /dev/null 2>&1
  E2E_READY=$?
else
  E2E_READY=1
fi

if [ $E2E_READY -eq 0 ]; then
  log_success "E2E environment is ready"

  # Run all E2E tests (including auth and AG-UI which already passed)
  run_test_suite "All E2E Tests" "npm run test:e2e -- --reporter=list"
else
  log_warning "E2E tests SKIPPED - manual setup required"
  PHASE_RESULTS="$PHASE_RESULTS\n${YELLOW}⚠️  Phase 7: E2E Tests (skipped - see below)${NC}"

  echo ""
  echo "${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo "${YELLOW}║${NC}       ${YELLOW}⚠️  E2E TESTS SKIPPED - HUMAN INTERVENTION NEEDED${NC}    ${YELLOW}║${NC}"
  echo "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "${YELLOW}E2E tests require manual setup that cannot be automated:${NC}"
  echo ""
  echo "  1. ${CYAN}Create test users in Clerk Dashboard${NC}"
  echo "     • Go to: https://dashboard.clerk.com → Users"
  echo "     • Create test account with credentials from .env.test"
  echo "     • Enable 'Skip email verification' for testing"
  echo ""
  echo "  2. ${CYAN}Configure test credentials in .env.test${NC}"
  echo "     • TEST_USER_EMAIL=your-test-user@example.com"
  echo "     • TEST_USER_PASSWORD=YourSecurePassword123!"
  echo ""
  echo "  3. ${CYAN}Setup test data${NC}"
  echo "     • Run: npm run setup:test-data"
  echo ""
  echo "  4. ${CYAN}Verify setup${NC}"
  echo "     • Run: npm run test:e2e:check"
  echo ""
  echo "${BLUE}📖 Full setup guide:${NC} ${CYAN}docs/guides/e2e-setup.md${NC}"
  echo ""
  echo "${YELLOW}Note: E2E tests are NOT required for deployment approval.${NC}"
  echo "${YELLOW}      However, they provide valuable end-to-end validation.${NC}"
  echo ""
fi

# ============================================================================
# PHASE 8: LOAD TESTS
# ============================================================================

log_phase "8" "Load & Performance Tests"

if command -v k6 &> /dev/null; then
  run_test_suite "Agent Execution Load Test" "npm run test:load"
else
  log_warning "K6 not installed - skipping load tests"
  log_info "Install K6: https://k6.io/docs/get-started/installation/"
fi

# ============================================================================
# PHASE 9: SECURITY SCAN
# ============================================================================

log_phase "9" "Security Scan"

# Check for secrets in code
log_info "Scanning for exposed secrets..."

if grep -r "sk_live_" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git 2>/dev/null; then
  log_error "Found live Stripe keys in code!"
  OVERALL_STATUS=1
else
  log_success "No live Stripe keys found"
fi

if grep -r "pk_live_" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git 2>/dev/null; then
  log_error "Found live publishable keys in code!"
  OVERALL_STATUS=1
else
  log_success "No live publishable keys found"
fi

if grep -r "AKIA" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git 2>/dev/null; then
  log_error "Found AWS keys in code!"
  OVERALL_STATUS=1
else
  log_success "No AWS keys found"
fi

# ============================================================================
# FINAL REPORT
# ============================================================================

END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))

# Calculate duration in minutes and seconds
MINUTES=$((TOTAL_DURATION / 60))
SECONDS=$((TOTAL_DURATION % 60))

echo ""
echo "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo "${CYAN}║${NC}                  ${YELLOW}TEST REPORT${NC}                              ${CYAN}║${NC}"
echo "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "${BLUE}Duration:${NC} ${MINUTES}m ${SECONDS}s"
echo ""
echo "${BLUE}Phase Results:${NC}"
echo "$PHASE_RESULTS"
echo ""

if [ $OVERALL_STATUS -eq 0 ]; then
  echo "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo "${GREEN}║${NC}               ${GREEN}🚀 APPROVED FOR DEPLOYMENT${NC}                 ${GREEN}║${NC}"
  echo "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "${GREEN}All validation phases passed. System is production-ready.${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Review test report above"
  echo "2. Deploy to staging: ${CYAN}npm run deploy:staging${NC}"
  echo "3. Run smoke tests"
  echo "4. Deploy to production: ${CYAN}npm run deploy:production${NC}"
  echo ""
else
  echo "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo "${RED}║${NC}                ${RED}❌ DEPLOYMENT BLOCKED${NC}                       ${RED}║${NC}"
  echo "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "${RED}One or more validation phases failed.${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Review failures above"
  echo "2. Fix issues"
  echo "3. Re-run: ${CYAN}npm run test:pre-deploy${NC}"
  echo ""
fi

# Generate detailed test report
if command -v tsx &> /dev/null && [ -f "scripts/generate-test-report.ts" ]; then
  log_info "Generating detailed test report..."
  npm run test:report
fi

echo ""
exit $OVERALL_STATUS
