#!/bin/sh

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Get the directory of the script
SCRIPT_DIR=$(dirname "$0")

# Overall status
FINAL_STATUS=0

echo "🚀 Starting Pre-Deployment Validation Workflow..."
echo "=========================================================="


# --- Run Validation Phases ---

run_phase() {
  local script_name=$1
  local phase_status=0
  sh "$SCRIPT_DIR/$script_name" || phase_status=$?
  if [ $phase_status -ne 0 ]; then
    FINAL_STATUS=1
  fi
}

run_phase "validate-env.sh"
run_phase "validate-clerk.sh"
run_phase "validate-supabase.sh"
run_phase "validate-ai.sh"
run_phase "validate-upstash.sh"
run_phase "validate-stripe.sh"
run_phase "validate-security.sh"
run_phase "validate-monitoring.sh"

echo "=========================================================="
if [ $FINAL_STATUS -eq 0 ]; then
  echo "✅ ${GREEN}All pre-deployment checks passed successfully!${NC}"
else
  echo "❌ ${RED}One or more pre-deployment checks failed. Please review the logs above.${NC}"
fi
echo "=========================================================="

exit $FINAL_STATUS
