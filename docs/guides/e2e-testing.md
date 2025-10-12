# E2E Testing: Human-in-the-Loop Documentation

## ⚠️ Critical Information

**E2E tests require manual setup and cannot be fully automated.**

Unlike unit and integration tests that run automatically, E2E tests require:
1. Real authenticated users (cannot be auto-created)
2. Manual configuration
3. Human intervention for initial setup

**This is by design and cannot be changed** due to authentication requirements.

## What This Means for You

### When Running Tests Locally

```bash
npm run test:pre-deploy
```

**What happens:**
- ✅ Unit tests run automatically
- ✅ Integration tests run automatically
- ✅ AG-UI tests run automatically
- ⚠️  **E2E tests gracefully skip with clear instructions**

**Output when E2E not configured:**
```
╔════════════════════════════════════════════════════════════════╗
║       ⚠️  E2E TESTS SKIPPED - HUMAN INTERVENTION NEEDED     ║
╚════════════════════════════════════════════════════════════════╝

E2E tests require manual setup that cannot be automated:

  1. Create test users in Clerk Dashboard
     • Go to: https://dashboard.clerk.com → Users
     • Create test account with credentials from .env.test
     • Enable 'Skip email verification' for testing

  2. Configure test credentials in .env.test
     • TEST_USER_EMAIL=your-test-user@example.com
     • TEST_USER_PASSWORD=YourSecurePassword123!

  3. Setup test data
     • Run: npm run setup:test-data

  4. Verify setup
     • Run: npm run test:e2e:check

📖 Full setup guide: docs/guides/e2e-setup.md

Note: E2E tests are NOT required for deployment approval.
      However, they provide valuable end-to-end validation.
```

### When Running in CI/CD

E2E tests will:
- ✅ Skip gracefully if not configured
- ✅ Provide clear logging about why they're skipped
- ✅ **NOT fail the build**
- ✅ **NOT block deployment**

## Quick Setup (15 minutes one-time)

### Step 1: Check Current Status

```bash
npm run test:e2e:check
```

This validates what's configured and what's missing.

### Step 2: Create Test User in Clerk

**Why manual?** Clerk API requires authentication to create users programmatically. Chicken-and-egg problem.

1. Go to https://dashboard.clerk.com
2. Select your project
3. Navigate to: **Users** → **Create user**
4. Fill in:
   - Email: `your-test-user@example.com`
   - Password: `YourSecurePassword123!`
5. Settings:
   - ✅ Skip email verification
   - ✅ Create account

### Step 3: Configure `.env.test`

```bash
# Edit .env.test
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=YourSecurePassword123!
```

### Step 4: Setup Test Data

```bash
npm run setup:test-data
```

### Step 5: Verify Setup

```bash
npm run test:e2e:check
```

**Expected output:**
```
🎉 E2E tests are READY to run!

Next steps:
  npm run test:e2e          Run all E2E tests
  npm run test:e2e:auth     Run authentication tests
```

### Step 6: Run E2E Tests

```bash
npm run test:e2e
```

## Available Commands

```bash
# Check if E2E tests are ready
npm run test:e2e:check

# View setup instructions
npm run test:e2e:setup-help

# Run E2E tests (after setup)
npm run test:e2e              # All E2E tests
npm run test:e2e:auth         # Auth tests only
npm run test:e2e:api          # API tests only
npm run test:e2e:rag          # RAG tests only
npm run test:e2e:billing      # Billing tests only
npm run test:e2e:agui         # AG-UI tests only

# Debug modes
npm run test:e2e:headed       # Show browser
npm run test:e2e:debug        # Debug mode

# Full pre-deployment suite (includes E2E if configured)
npm run test:pre-deploy
```

## File Structure

```
├── docs/guides/
│   └── e2e-setup.md              # Comprehensive setup guide (40+ pages)
├── scripts/
│   ├── check-e2e-ready.sh        # Pre-flight validation script
│   ├── setup-test-data.ts        # Test data initialization
│   └── pre-deployment-test.sh    # Main test suite (with E2E skip logic)
├── src/__tests__/e2e/
│   ├── auth.spec.ts              # Authentication E2E tests
│   ├── api.spec.ts               # API E2E tests
│   ├── rag.spec.ts               # RAG E2E tests
│   ├── billing.spec.ts           # Billing E2E tests
│   ├── ag-ui.spec.ts             # AG-UI SDK E2E tests
│   ├── global-setup.ts           # Global test setup
│   └── global-teardown.ts        # Global test cleanup
├── .env.test                     # Test configuration (with instructions)
├── playwright.config.ts          # Playwright configuration
└── E2E-TESTING-README.md         # This file
```

## Why E2E Tests Can't Be Fully Automated

### The Problem

E2E tests simulate real user interactions, which requires:
1. **Real authenticated users** - Need to sign in via Clerk
2. **Active user sessions** - Require password-based authentication
3. **Real API credentials** - Live external services

### The Chicken-and-Egg

To auto-create test users, we'd need:
- Clerk API access → Requires authentication
- Authentication → Requires a user account
- User account → Requires manual creation

There's no way around this without compromising security.

### What Can Be Automated

✅ **Application startup** - Playwright handles this
✅ **Browser launches** - Playwright handles this
✅ **Test execution** - Fully automated
✅ **Test data setup** - `npm run setup:test-data`
✅ **Service validation** - Scripts validate connectivity

❌ **User creation** - MUST be manual (security requirement)
❌ **Initial credentials** - MUST be configured manually

## Deployment Impact

### E2E Tests DO NOT Block Deployment

The pre-deployment suite will:
- ✅ Pass without E2E tests configured
- ✅ Show clear warning about what's skipped
- ✅ Provide setup instructions
- ✅ Approve deployment based on other tests

### Critical Tests That Block Deployment

Only these tests block deployment:
1. **Authentication E2E** (Phase 3) - If configured
2. **AG-UI SDK Tests** (Phase 4) - Always run
3. **Unit Tests** (Phase 5) - Always run
4. **Integration Tests** (Phase 6) - Always run

### Recommended Flow

**For initial deployment (without E2E):**
```bash
npm run test:pre-deploy  # Passes, E2E skipped
# Deploy to production
```

**For subsequent deployments (with E2E):**
```bash
# One-time setup (15 min)
npm run test:e2e:check
# Follow instructions to configure

# Then all future deployments:
npm run test:pre-deploy  # Passes, E2E runs
# Deploy to production
```

## CI/CD Configuration

### GitHub Actions Example

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:pre-deploy
        env:
          # E2E tests will skip gracefully if these aren't set
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.TEST_CLERK_KEY }}
          # ... other test credentials

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            test-results/
            playwright-report/
```

### Setup CI/CD E2E Tests (Optional)

If you want E2E tests in CI:

1. Create separate test environment (Clerk, Supabase)
2. Manually create test users in test environment
3. Store credentials as GitHub secrets
4. Tests will run automatically in CI

## Troubleshooting

### "E2E tests always skip"

**Check:**
```bash
npm run test:e2e:check
```

This tells you exactly what's missing.

### "Test user can't sign in"

**Verify:**
1. User exists in Clerk Dashboard
2. Password matches `.env.test`
3. Email verification is skipped (for test users)
4. Can sign in manually at `http://localhost:3000/sign-in`

### "Application not accessible"

**Check:**
1. Is port 3000 available? `lsof -ti:3000`
2. Does `npm run dev` work?
3. Any build errors? `npm run build`

### "Missing environment variables"

**Ensure:**
1. `.env.local` has all service credentials
2. `.env.test` has test user credentials
3. Files are in project root

## FAQ

**Q: Can E2E tests ever be fully automated?**
A: No, due to authentication requirements. Initial user creation must be manual.

**Q: Will this cause issues in CI/CD?**
A: No. Tests gracefully skip with clear logging. Build won't fail.

**Q: Should I set up E2E tests?**
A: Recommended but not required. They provide valuable end-to-end validation.

**Q: How long does setup take?**
A: 15-20 minutes one time. After that, tests run automatically.

**Q: Can I use same test users for local and CI?**
A: Not recommended. Use separate Clerk applications for local/CI.

**Q: What if test user is deleted?**
A: Tests will skip with instructions to recreate user.

**Q: Do E2E tests cost money?**
A: Only if using paid Clerk/Supabase tiers. Test instances usually on free tier.

## Summary

✅ **E2E tests require manual setup** (15 min one-time)
✅ **Tests gracefully skip** if not configured
✅ **Clear instructions provided** when skipped
✅ **Does NOT block deployment** if skipped
✅ **Full automation** after initial setup
✅ **CI/CD friendly** - won't break builds

**Documentation:**
- Full setup: `docs/guides/e2e-setup.md`
- Testing guide: `docs/guides/testing.md`
- AG-UI testing: `docs/guides/ag-ui-testing.md`

**Commands:**
- Check status: `npm run test:e2e:check`
- View help: `npm run test:e2e:setup-help`
- Run tests: `npm run test:e2e` (after setup)
- Full suite: `npm run test:pre-deploy`
