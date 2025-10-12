#!/bin/sh

# Database Migration Rollback Script
#
# IMPORTANT: This is a destructive operation. Use with caution!

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================================="
echo "${YELLOW}⚠️  DATABASE MIGRATION ROLLBACK${NC}"
echo "=========================================================="
echo ""
echo "This will RESET your database to the last known good state."
echo "ALL DATA will be lost!"
echo ""
read -p "Are you sure you want to rollback? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
  echo "${RED}✗ Rollback cancelled${NC}"
  exit 1
fi

echo ""
echo "${YELLOW}Starting rollback...${NC}"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo "${RED}✗ .env.local not found. Cannot proceed.${NC}"
  exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.local | xargs)

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "${YELLOW}Supabase CLI not found. Installing...${NC}"
  npm install -g supabase
fi

# Option 1: Reset to clean state
echo "Resetting database to clean state..."
supabase db reset

if [ $? -eq 0 ]; then
  echo "${GREEN}✓ Database reset successfully${NC}"
else
  echo "${RED}✗ Database reset failed${NC}"
  exit 1
fi

echo ""
echo "=========================================================="
echo "${GREEN}✓ Rollback complete${NC}"
echo "=========================================================="
echo ""
echo "Next steps:"
echo "1. Run migration script: npm run migrate:db"
echo "2. Verify data integrity"
echo "3. Test application"
echo ""
