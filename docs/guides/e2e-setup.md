# E2E Test Setup Guide

⚠️ **IMPORTANT: E2E tests require manual setup and cannot be fully automated.**

This guide walks you through the one-time setup required to run E2E (End-to-End) tests. Unlike unit and integration tests that run automatically, E2E tests require authenticated test users and real service credentials.

## Why Manual Setup is Required

E2E tests simulate real user interactions, which requires:

1. **Real authenticated users** in Clerk (cannot be auto-created without auth)
2. **Active user sessions** (requires password-based login)
3. **Test data** in production-like databases
4. **Real API credentials** for external services

**Bottom line:** Someone needs to create test accounts and configure credentials before E2E tests can run.

## Prerequisites

Before starting, ensure you have:

- ✅ Access to your Clerk Dashboard
- ✅ Access to your Supabase project
- ✅ All service credentials in `.env.local`
- ✅ Node.js and npm installed
- ✅ Project dependencies installed (`npm install`)

## Setup Time Estimate

- **First time:** 15-20 minutes
- **Subsequent updates:** 2-5 minutes

## Step 1: Install Playwright Browsers

```bash
npx playwright install
```

This downloads browser binaries needed for E2E tests (Chrome, Firefox, Safari).

**Expected output:**
```
✔ Browser chromium downloaded
✔ Browser firefox downloaded
✔ Browser webkit downloaded
```

## Step 2: Configure Test Environment

### 2.1 Update .env.test

Edit `.env.test` to configure test-specific settings:

```bash
# E2E Test Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Test User Credentials (YOU MUST UPDATE THESE)
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=YourSecureTestPassword123!

# Optional: Additional test users
TEST_ORG_ADMIN_EMAIL=test-admin@example.com
TEST_ORG_ADMIN_PASSWORD=AdminPassword123!

TEST_ORG_MEMBER_EMAIL=test-member@example.com
TEST_ORG_MEMBER_PASSWORD=MemberPassword123!
```

⚠️ **Important:**
- Use **real email addresses** you control
- Use **strong passwords** (Clerk enforces password policies)
- Don't commit this file with real passwords
- `.env.test` is gitignored by default

### 2.2 Verify .env.local

E2E tests inherit most configuration from `.env.local`. Verify these are set:

```bash
# Required for E2E tests
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://....supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Step 3: Create Test Users in Clerk

This is the **most critical step** and **must be done manually**.

### 3.1 Go to Clerk Dashboard

1. Navigate to https://dashboard.clerk.com
2. Select your project
3. Go to **Users** in the sidebar

### 3.2 Create Primary Test User

Click **"Create user"** and fill in:

**Email address:** (match `TEST_USER_EMAIL` from `.env.test`)
```
your-test-user@example.com
```

**Password:** (match `TEST_USER_PASSWORD` from `.env.test`)
```
YourSecureTestPassword123!
```

**Settings:**
- ✅ Skip email verification (for testing)
- ✅ Create account

**Important:** Save the email and password - you'll need them in `.env.test`

### 3.3 Create Additional Test Users (Optional)

For organization testing, create:

**Test Admin User:**
- Email: `test-admin@example.com`
- Password: `AdminPassword123!`
- Role: Organization admin

**Test Member User:**
- Email: `test-member@example.com`
- Password: `MemberPassword123!`
- Role: Organization member

### 3.4 Create Test Organization

1. In Clerk Dashboard, go to **Organizations**
2. Click **"Create organization"**
3. Fill in:
   - Name: `Test Organization`
   - Slug: `test-org`
4. Add test users as members:
   - Add `test-admin@example.com` as Admin
   - Add `test-member@example.com` as Member

## Step 4: Setup Test Data

Run the test data setup script to populate your database:

```bash
npm run setup:test-data
```

This creates:
- Test organizations in Supabase
- Sample documents for RAG tests
- Test data in Redis
- Seed data for various test scenarios

**Expected output:**
```
🚀 Setting up test data...

🧹 Cleaning up existing test data...
✅ Cleanup complete

🏢 Creating test organizations...
✅ Created organization: Test Organization 1
✅ Created organization: Test Organization 2

👥 Creating test users...
✅ Created user: test-user@example.com
✅ Created user: test-admin@example.com

📄 Creating test documents...
✅ Created document: AI and Machine Learning Overview
✅ Created document: TypeScript Best Practices

✅ Test data setup complete!
```

## Step 5: Validate Setup

Before running tests, validate everything is configured correctly:

```bash
npm run test:e2e:check
```

This pre-flight check validates:
- ✅ Test user credentials are configured
- ✅ Test users can authenticate
- ✅ Application is accessible
- ✅ Required services are reachable

**Expected output (success):**
```
🔍 Checking E2E test readiness...

✅ Environment variables configured
✅ Test user credentials found
✅ Application accessible at http://localhost:3000
✅ Test user can authenticate
✅ Clerk service reachable
✅ Supabase service reachable

🎉 E2E tests are ready to run!

Next steps:
  npm run test:e2e        # Run all E2E tests
  npm run test:e2e:auth   # Run auth tests only
```

**Expected output (missing setup):**
```
🔍 Checking E2E test readiness...

❌ Test user credentials not configured
❌ Test user cannot authenticate

⚠️  E2E tests cannot run. Required setup:

1. Configure test user credentials in .env.test:
   TEST_USER_EMAIL=your-test-user@example.com
   TEST_USER_PASSWORD=YourSecurePassword123!

2. Create test user in Clerk Dashboard:
   https://dashboard.clerk.com → Users → Create user

3. Re-run validation:
   npm run test:e2e:check

📖 Full setup guide:
   docs/guides/e2e-setup.md
```

## Step 6: Run E2E Tests

Once validation passes, run the tests:

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suites
npm run test:e2e:auth      # Authentication tests
npm run test:e2e:api       # API tests
npm run test:e2e:rag       # RAG tests
npm run test:e2e:billing   # Billing tests
npm run test:e2e:agui      # AG-UI SDK tests

# Debug mode (see browser)
npm run test:e2e:headed
npm run test:e2e:debug
```

**First run will be slower** as Playwright starts the dev server.

**Expected output:**
```
Running 150 tests using 4 workers

✓ Authentication E2E Tests (30 tests) - 45s
✓ API E2E Tests (25 tests) - 30s
✓ RAG E2E Tests (30 tests) - 60s
✓ Billing E2E Tests (25 tests) - 40s
✓ AG-UI E2E Tests (40 tests) - 50s

150 passed (3m 45s)

Reports:
  HTML: playwright-report/index.html
  JSON: test-results/e2e-results.json
```

## Troubleshooting

### Issue: "Test user cannot sign in"

**Symptoms:**
```
Error: Locator not found: [name="identifier"]
Authentication tests failing
```

**Solutions:**
1. Verify test user exists in Clerk Dashboard
2. Check password matches `.env.test`
3. Ensure user's email is verified (or verification is skipped)
4. Try signing in manually at `http://localhost:3000/sign-in`

### Issue: "Application not accessible"

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solutions:**
1. Check if port 3000 is already in use: `lsof -ti:3000`
2. Kill existing process: `lsof -ti:3000 | xargs kill -9`
3. Ensure `npm run dev` works manually
4. Check for build errors: `npm run build`

### Issue: "Missing environment variables"

**Symptoms:**
```
❌ Missing required environment variables:
   - TEST_USER_EMAIL
```

**Solutions:**
1. Create `.env.test` file if it doesn't exist
2. Copy from `.env.test.example` (if available)
3. Fill in test user credentials
4. Ensure `.env.local` has service credentials

### Issue: "Test data not found"

**Symptoms:**
```
No documents found for RAG tests
Billing tests skipped
```

**Solutions:**
1. Run test data setup: `npm run setup:test-data`
2. Check Supabase connection: `npm run validate:supabase`
3. Verify database migrations ran: `npm run migrate:db`
4. Check RLS policies allow test user access

### Issue: "Rate limited during tests"

**Symptoms:**
```
429 Too Many Requests
Tests intermittently failing
```

**Solutions:**
1. Run tests sequentially: `npx playwright test --workers=1`
2. Add delays between requests
3. Increase rate limits in development
4. Disable Arcjet during tests (set `PLAYWRIGHT_TEST=true`)

### Issue: "Browser not found"

**Symptoms:**
```
Error: browserType.launch: Executable doesn't exist
```

**Solutions:**
1. Reinstall browsers: `npx playwright install`
2. Install system dependencies: `npx playwright install-deps`
3. Check disk space (browsers need ~1GB)

## Maintenance

### Updating Test Users

If you need to change test user credentials:

1. Update `.env.test` with new credentials
2. Update user password in Clerk Dashboard
3. Re-run validation: `npm run test:e2e:check`
4. Run tests to verify: `npm run test:e2e:auth`

### Resetting Test Data

To clean up and recreate test data:

```bash
# Clean up old data
npm run setup:test-data

# Or manually delete from database
# Then re-run setup
```

### Updating Test Organizations

1. Go to Clerk Dashboard → Organizations
2. Update organization details
3. Update member assignments
4. Update organization IDs in test data script if needed

## CI/CD Setup

For GitHub Actions or other CI systems:

### 1. Create Separate Test Environment

- Separate Clerk application (test mode)
- Separate Supabase project (test database)
- Separate Stripe account (test mode)

### 2. Store Credentials as Secrets

```yaml
# .github/workflows/test.yml
env:
  TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
  TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.TEST_CLERK_KEY }}
  # ... etc
```

### 3. Pre-Create Test Users

- Create test users in test Clerk application
- Store credentials in CI secrets
- Do NOT auto-create users in CI (auth required)

### 4. Run Tests

```yaml
- name: Run E2E Tests
  run: |
    npx playwright install --with-deps
    npm run test:e2e
```

## Security Best Practices

1. **Never commit credentials:**
   - `.env.test` is gitignored
   - Use dummy values in `.env.test.example`

2. **Use test-only accounts:**
   - Don't use production credentials
   - Create separate test Clerk/Supabase projects

3. **Rotate passwords regularly:**
   - Change test passwords monthly
   - Update in both Clerk and `.env.test`

4. **Limit test user permissions:**
   - Test users should only access test data
   - Separate from production environment

5. **Don't expose test credentials:**
   - Don't log passwords
   - Don't include in error messages
   - Don't share `.env.test` file

## FAQ

**Q: Can E2E tests run without manual setup?**
A: No. Test users must be manually created in Clerk. After initial setup, tests run automatically.

**Q: Why can't we auto-create test users?**
A: Clerk requires authentication to programmatically create users. This creates a chicken-and-egg problem.

**Q: Can I skip E2E tests?**
A: Yes. The pre-deployment script will gracefully skip E2E tests if setup is incomplete, with clear warnings.

**Q: How often do I need to update test users?**
A: Only when credentials change or expire. Test users persist indefinitely.

**Q: Can I use the same test users for local and CI?**
A: Not recommended. Use separate Clerk applications for local development and CI.

**Q: What happens if test users are deleted?**
A: Tests will fail. Recreate users following this guide and update credentials.

**Q: Do test users need to verify email?**
A: No. Disable email verification for test users in Clerk Dashboard.

## Next Steps

After setup is complete:

1. ✅ Run validation: `npm run test:e2e:check`
2. ✅ Run E2E tests: `npm run test:e2e`
3. ✅ Run full suite: `npm run test:pre-deploy`
4. ✅ Review test reports: `playwright-report/index.html`

## Support

If you encounter issues not covered in this guide:

1. Check test output for specific error messages
2. Review [Testing Guide](./testing.md) for general testing info
3. Check [AG-UI Testing Guide](./ag-ui-testing.md) for AG-UI specific issues
4. Open an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version)

## Summary

✅ **One-time setup required** (15-20 minutes)
✅ **Manual Clerk user creation** (cannot be automated)
✅ **Graceful skip** if setup incomplete (no silent failures)
✅ **Clear validation** before running tests
✅ **Comprehensive troubleshooting** guide

After initial setup, E2E tests run automatically and provide critical validation of real user workflows before deployment.
