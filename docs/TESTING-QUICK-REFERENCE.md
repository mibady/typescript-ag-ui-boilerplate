# 🚀 Testing Quick Reference Card

Quick commands for testing your TypeScript AG-UI Boilerplate.

---

## ⚡ Quick Start (Run These First)

```bash
# 1. Validate all environment variables
npm run validate:env

# 2. Run pre-deployment test (comprehensive)
npm run test:pre-deploy

# 3. Build for production (catches many issues)
npm run build
```

---

## 🔍 Environment Validation

```bash
# Check all services at once
npm run validate:env

# Check individual services
npm run validate:clerk      # Authentication
npm run validate:supabase   # Database
npm run validate:upstash    # Redis, Vector, QStash, Search
npm run validate:ai         # LLM providers
npm run validate:security   # Arcjet
npm run validate:monitoring # Sentry
```

---

## 🧪 Test Suites

### Unit Tests
```bash
npm test                    # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e:check      # Check if ready
npm run test:e2e            # Run all E2E tests
npm run test:e2e:auth       # Auth tests only
npm run test:e2e:agui       # AG-UI tests only
npm run test:e2e:rag        # RAG tests only
npm run test:e2e:debug      # Debug mode (opens browser)
```

### Load Tests (requires K6)
```bash
npm run test:load           # Agent execution
npm run test:load:rag       # RAG operations
npm run test:load:stress    # Stress test
npm run test:load:spike     # Spike test
```

---

## 🏗️ Build & Type Check

```bash
npm run type-check          # TypeScript validation
npm run lint                # ESLint
npm run build               # Production build
```

---

## 📊 Pre-Deployment

```bash
# Comprehensive test suite (recommended before deployment)
npm run test:pre-deploy

# Generate detailed test report
npm run test:report
```

---

## 🎯 Manual Testing Checklist

### Authentication
- [ ] Sign up new user
- [ ] Sign in existing user
- [ ] Sign out
- [ ] Switch organizations
- [ ] Invite team member

### AI Chat (`/dashboard/chat`)
- [ ] Send message
- [ ] Verify streaming response
- [ ] Check browser console (no errors)
- [ ] Test multi-turn conversation
- [ ] Verify AG-UI events in Network tab

### Knowledge Base (`/dashboard/knowledge-base`)
- [ ] Upload document (PDF, TXT, MD)
- [ ] Verify processing completes
- [ ] Search for content
- [ ] Test semantic search
- [ ] Delete document

### Database (Supabase Dashboard)
- [ ] Check tables exist
- [ ] Verify data appears
- [ ] Check RLS policies enabled

---

## ❌ Red Flags (Deal Breakers)

Stop and fix if you see:

- ❌ Authentication fails or loops
- ❌ Database connection errors
- ❌ No LLM provider configured
- ❌ Chat doesn't stream responses
- ❌ `npm run build` fails
- ❌ `npm run type-check` shows errors
- ❌ Console errors in browser

---

## 🔧 Quick Fixes

### Environment Issues
```bash
# Copy example and fill in your keys
cp .env.example .env.local
# Edit .env.local with your API keys
npm run validate:env
```

### Build Issues
```bash
# Check TypeScript errors
npm run type-check
# Fix errors, then rebuild
npm run build
```

### Test Issues
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

---

## 📈 Testing Workflow

```
1. npm run validate:env          (2 min)
   ↓
2. Manual feature testing        (15 min)
   ↓
3. npm test                      (2 min)
   ↓
4. npm run type-check            (1 min)
   ↓
5. npm run build                 (2 min)
   ↓
6. npm run test:pre-deploy       (10 min)
   ↓
7. Deploy! 🚀
```

**Total Time: ~30 minutes**

---

## 🎯 Production Readiness

### Must Have ✅
- Clerk authentication working
- Supabase database connected
- At least ONE LLM provider (OpenAI, Anthropic, Google, or Mistral)
- Upstash Redis configured
- Chat streams responses
- No build errors
- No TypeScript errors

### Nice to Have 🎯
- Stripe billing
- Sentry monitoring
- Email (Resend)
- All 4 Upstash services
- E2E tests passing
- Load tests passing

---

## 📚 Full Documentation

See `TESTING-GUIDE.md` for detailed testing instructions.

---

## 🆘 Troubleshooting

### Issue: Environment validation fails
```bash
npm run validate:env
# Fix missing/invalid keys in .env.local
```

### Issue: Clerk validation fails
```bash
# Get keys from: https://dashboard.clerk.com
# Verify keys start with pk_test_ and sk_test_
npm run validate:clerk
```

### Issue: Supabase validation fails
```bash
# Get keys from: https://supabase.com/dashboard
# Settings → API
npm run validate:supabase
```

### Issue: Chat doesn't work
```bash
# Add at least one LLM API key to .env.local
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...
npm run validate:ai
```

### Issue: Build fails
```bash
npm run type-check
# Fix TypeScript errors
npm run build
```

---

## 🚀 Deploy Commands

```bash
# After all tests pass
npm run test:pre-deploy

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

---

**Quick Help:** Run `npm run test:pre-deploy` for comprehensive validation!
