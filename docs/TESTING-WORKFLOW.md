# 🔄 Testing Workflow

Visual guide to the testing process for the TypeScript AG-UI Boilerplate.

---

## 📊 Complete Testing Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    START: New Setup                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Environment Setup                                  │
│  ─────────────────────────────────────────────────────────  │
│  $ cp .env.example .env.local                               │
│  $ # Edit .env.local with your API keys                     │
│  $ npm run validate:env                                     │
│                                                              │
│  ✅ PASS: All required variables set                        │
│  ❌ FAIL: Fix missing/invalid keys → Retry                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Individual Service Validation                      │
│  ─────────────────────────────────────────────────────────  │
│  $ npm run validate:clerk      # Authentication             │
│  $ npm run validate:supabase   # Database                   │
│  $ npm run validate:upstash    # Redis/Vector/QStash        │
│  $ npm run validate:ai         # LLM providers              │
│                                                              │
│  ✅ PASS: All services connected                            │
│  ❌ FAIL: Fix service config → Retry                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Manual Feature Testing (15-30 min)                 │
│  ─────────────────────────────────────────────────────────  │
│  1. Authentication                                           │
│     • Sign up/Sign in                                        │
│     • Organization switching                                 │
│     • Team invitations                                       │
│                                                              │
│  2. AI Chat (/dashboard/chat)                               │
│     • Send messages                                          │
│     • Verify streaming                                       │
│     • Check console for errors                              │
│     • Test multi-turn conversations                         │
│                                                              │
│  3. Knowledge Base (/dashboard/knowledge-base)              │
│     • Upload documents                                       │
│     • Verify processing                                      │
│     • Test search                                            │
│                                                              │
│  4. Database (Supabase Dashboard)                           │
│     • Check tables exist                                     │
│     • Verify RLS policies                                    │
│     • Confirm data appears                                   │
│                                                              │
│  ✅ PASS: All features work as expected                     │
│  ❌ FAIL: Debug issues → Fix → Retry                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Automated Test Suites (5-10 min)                   │
│  ─────────────────────────────────────────────────────────  │
│  $ npm test                    # Unit tests                 │
│  $ npm run test:integration    # Integration tests          │
│  $ npm run type-check          # TypeScript validation      │
│  $ npm run lint                # ESLint                      │
│  $ npm run build               # Production build           │
│                                                              │
│  ✅ PASS: All tests pass, build succeeds                    │
│  ❌ FAIL: Fix test failures → Retry                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Pre-Deployment Test (10-15 min)                    │
│  ─────────────────────────────────────────────────────────  │
│  $ npm run test:pre-deploy                                  │
│                                                              │
│  Runs comprehensive test suite:                             │
│  • Phase 1: Environment validation                          │
│  • Phase 2: Service connectivity                            │
│  • Phase 3: Authentication E2E (CRITICAL)                   │
│  • Phase 4: AG-UI SDK integration (CRITICAL)                │
│  • Phase 5: Unit tests                                      │
│  • Phase 6: Integration tests                               │
│  • Phase 7: Full E2E suite (if configured)                  │
│  • Phase 8: Load tests (if K6 installed)                    │
│  • Phase 9: Security scan                                   │
│                                                              │
│  ✅ PASS: "🚀 APPROVED FOR DEPLOYMENT"                      │
│  ❌ FAIL: "❌ DEPLOYMENT BLOCKED" → Fix → Retry             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: Production Deployment                              │
│  ─────────────────────────────────────────────────────────  │
│  $ npm run deploy:staging      # Deploy to staging          │
│  $ # Run smoke tests on staging                             │
│  $ npm run deploy:production   # Deploy to production       │
│                                                              │
│  🎉 SUCCESS: Application is live!                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚦 Decision Points

### After Environment Validation

```
Environment Validation
         │
         ├─ ✅ PASS → Continue to Service Validation
         │
         └─ ❌ FAIL → Check:
                      • .env.local exists?
                      • All required keys set?
                      • No placeholder values (xxxxx)?
                      → Fix → Retry
```

### After Service Validation

```
Service Validation
         │
         ├─ ✅ PASS → Continue to Manual Testing
         │
         └─ ❌ FAIL → Check:
                      • Clerk: Valid API keys?
                      • Supabase: Correct URL/keys?
                      • Upstash: Services created?
                      • AI: At least one LLM key?
                      → Fix → Retry
```

### After Manual Testing

```
Manual Feature Testing
         │
         ├─ ✅ PASS → Continue to Automated Tests
         │
         └─ ❌ FAIL → Common Issues:
                      • Auth loops → Check Clerk config
                      • Chat doesn't stream → Check AG-UI setup
                      • Upload fails → Check Supabase/Upstash
                      • Console errors → Debug in DevTools
                      → Fix → Retry
```

### After Automated Tests

```
Automated Tests
         │
         ├─ ✅ PASS → Continue to Pre-Deployment
         │
         └─ ❌ FAIL → Check:
                      • Unit tests → Fix logic errors
                      • Type errors → Run npm run type-check
                      • Build fails → Check TypeScript errors
                      • Lint errors → Run npm run lint
                      → Fix → Retry
```

### After Pre-Deployment Test

```
Pre-Deployment Test
         │
         ├─ ✅ PASS → "🚀 APPROVED FOR DEPLOYMENT"
         │            → Deploy to staging
         │            → Run smoke tests
         │            → Deploy to production
         │
         └─ ❌ FAIL → "❌ DEPLOYMENT BLOCKED"
                      Critical failures:
                      • Phase 3 (Auth) → Must fix before deploy
                      • Phase 4 (AG-UI) → Must fix before deploy
                      
                      Non-critical:
                      • Phase 7 (E2E) → Can skip if not configured
                      • Phase 8 (Load) → Can skip if K6 not installed
                      
                      → Fix critical issues → Retry
```

---

## ⏱️ Time Estimates

| Step | Time | Can Skip? |
|------|------|-----------|
| **1. Environment Setup** | 2-5 min | ❌ Required |
| **2. Service Validation** | 2-5 min | ❌ Required |
| **3. Manual Feature Testing** | 15-30 min | ⚠️ Recommended |
| **4. Automated Tests** | 5-10 min | ❌ Required |
| **5. Pre-Deployment Test** | 10-15 min | ❌ Required |
| **6. Deployment** | 5-10 min | ❌ Required |
| **TOTAL** | **~40-75 min** | |

---

## 🎯 Quick Paths

### Minimal Testing (Not Recommended)

```bash
# Only run critical tests (10-15 min)
npm run validate:env
npm run type-check
npm run build
npm run test:pre-deploy
```

**Risk:** May miss issues that only appear during manual testing.

---

### Standard Testing (Recommended)

```bash
# Complete validation (30-60 min)
npm run validate:env
npm run validate:clerk
npm run validate:supabase
npm run validate:upstash
npm run validate:ai

# Manual testing (15-30 min)
# Test auth, chat, knowledge base, database

# Automated tests
npm test
npm run type-check
npm run build
npm run test:pre-deploy
```

**Recommended for:** First deployment, major changes

---

### Comprehensive Testing (Paranoid Mode)

```bash
# Everything + E2E + Load tests (60-90 min)
npm run validate:env
npm run validate:clerk
npm run validate:supabase
npm run validate:upstash
npm run validate:ai
npm run validate:security
npm run validate:monitoring

# Manual testing (30 min)
# Test all features thoroughly

# Automated tests
npm test
npm run test:coverage
npm run test:integration
npm run type-check
npm run lint
npm run build

# E2E tests (requires setup)
npm run test:e2e

# Load tests (requires K6)
npm run test:load

# Pre-deployment
npm run test:pre-deploy
```

**Recommended for:** Production deployments, critical releases

---

## 🔄 Continuous Testing

### During Development

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Watch tests
npm run test:watch

# Terminal 3: Type checking (optional)
npm run type-check -- --watch
```

### Before Each Commit

```bash
# Husky pre-commit hook runs automatically:
npm run lint
npm run type-check
npm test
```

### Before Each Push

```bash
# Run quick validation
npm run validate:env
npm run build
npm test
```

### Before Deployment

```bash
# Run full pre-deployment suite
npm run test:pre-deploy
```

---

## 🚨 Critical Checkpoints

### Checkpoint 1: Environment ✅

**Must pass before continuing:**
- `.env.local` exists
- All required variables set
- No placeholder values

**Command:** `npm run validate:env`

---

### Checkpoint 2: Services ✅

**Must pass before continuing:**
- Clerk authentication works
- Supabase database connected
- Upstash Redis accessible
- At least one LLM provider configured

**Commands:**
```bash
npm run validate:clerk
npm run validate:supabase
npm run validate:upstash
npm run validate:ai
```

---

### Checkpoint 3: Core Features ✅

**Must pass before continuing:**
- Users can sign up/sign in
- Chat streams responses
- Documents can be uploaded
- No console errors

**Method:** Manual testing in browser

---

### Checkpoint 4: Build & Tests ✅

**Must pass before continuing:**
- TypeScript compiles without errors
- All unit tests pass
- Production build succeeds

**Commands:**
```bash
npm run type-check
npm test
npm run build
```

---

### Checkpoint 5: Pre-Deployment ✅

**Must pass before deployment:**
- All validation phases pass
- Authentication E2E tests pass (CRITICAL)
- AG-UI integration tests pass (CRITICAL)
- No security issues found

**Command:** `npm run test:pre-deploy`

---

## 📋 Testing Checklist

Use this checklist to track your testing progress:

```
Setup Phase:
□ Cloned repository
□ Installed dependencies (npm install)
□ Copied .env.example to .env.local
□ Filled in all API keys

Environment Validation:
□ npm run validate:env passed
□ npm run validate:clerk passed
□ npm run validate:supabase passed
□ npm run validate:upstash passed
□ npm run validate:ai passed

Manual Testing:
□ Sign up/sign in works
□ Organization switching works (if enabled)
□ Chat interface streams responses
□ Documents upload and process
□ Search returns relevant results
□ No console errors in browser
□ Database tables exist in Supabase
□ RLS policies enabled

Automated Testing:
□ npm test passed
□ npm run test:integration passed
□ npm run type-check passed
□ npm run lint passed
□ npm run build passed

Pre-Deployment:
□ npm run test:pre-deploy passed
□ All critical phases passed
□ No security issues found

Deployment:
□ Deployed to staging
□ Smoke tests on staging passed
□ Deployed to production
□ Smoke tests on production passed

Post-Deployment:
□ Monitoring configured (Sentry)
□ Error alerts working
□ Performance metrics tracked
```

---

## 🆘 Troubleshooting Workflow

```
Issue Detected
      │
      ├─ Environment Issue?
      │  └─ Run: npm run validate:env
      │     Fix: Update .env.local
      │
      ├─ Service Connection Issue?
      │  └─ Run: npm run validate:clerk/supabase/upstash/ai
      │     Fix: Check API keys, verify service status
      │
      ├─ TypeScript Error?
      │  └─ Run: npm run type-check
      │     Fix: Resolve type errors
      │
      ├─ Build Error?
      │  └─ Run: npm run build
      │     Fix: Check console output, fix errors
      │
      ├─ Test Failure?
      │  └─ Run: npm test -- --reporter=verbose
      │     Fix: Debug failing test, fix logic
      │
      └─ Feature Not Working?
         └─ Check browser console (F12)
            Check Network tab for API errors
            Check Supabase logs
            Fix: Debug and fix issue
```

---

## 📚 Related Documentation

- **[TESTING-GUIDE.md](../TESTING-GUIDE.md)** - Complete testing guide
- **[TESTING-QUICK-REFERENCE.md](./TESTING-QUICK-REFERENCE.md)** - Quick command reference
- **[E2E Testing Setup](./guides/e2e-testing.md)** - E2E test configuration
- **[SETUP.md](../SETUP.md)** - Initial setup guide

---

**Remember:** Testing is not optional. It's your safety net before deployment! 🛡️
