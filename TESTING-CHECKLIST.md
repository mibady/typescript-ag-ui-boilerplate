# ✅ Testing Checklist

Print this checklist and check off items as you complete them.

---

## 📋 Pre-Deployment Checklist

### Phase 1: Environment Setup

```
□ Cloned repository
□ Ran npm install
□ Copied .env.example to .env.local
□ Added Clerk API keys
□ Added Supabase credentials
□ Added Upstash Redis credentials
□ Added at least one LLM API key (OpenAI/Anthropic/Google/Mistral)
□ Ran npm run validate:env (PASSED)
```

---

### Phase 2: Service Validation

```
□ npm run validate:clerk (PASSED)
□ npm run validate:supabase (PASSED)
□ npm run validate:upstash (PASSED)
□ npm run validate:ai (PASSED)
□ npm run validate:security (PASSED - optional)
□ npm run validate:monitoring (PASSED - optional)
```

---

### Phase 3: Manual Feature Testing

#### Authentication
```
□ Can sign up new user
□ Can sign in existing user
□ Can sign out
□ Session persists after refresh
□ No authentication loops
□ Organization switching works (if enabled)
□ Team invitations work (if enabled)
```

#### AI Chat (/dashboard/chat)
```
□ Chat interface loads without errors
□ Can send messages
□ Responses stream in real-time (word-by-word)
□ No console errors in browser (F12)
□ Multi-turn conversations maintain context
□ Error messages display gracefully
□ Network tab shows SSE connection (text/event-stream)
□ AG-UI events fire correctly (check Network tab)
```

#### Knowledge Base (/dashboard/knowledge-base)
```
□ Can upload PDF document
□ Can upload TXT document
□ Document processing completes successfully
□ Document appears in list
□ Can search for content from uploaded document
□ Search returns relevant results
□ Semantic search works
□ Can delete document
```

#### Database (Supabase Dashboard)
```
□ Logged into Supabase dashboard
□ Tables exist: documents, agent_sessions, agent_messages
□ Data appears in tables after using features
□ RLS (Row Level Security) policies enabled
□ Timestamps are recent and correct
```

#### Other Dashboard Pages
```
□ /dashboard loads without errors
□ /dashboard/analytics loads (if implemented)
□ /dashboard/team loads (if implemented)
□ /dashboard/settings loads (if implemented)
□ /dashboard/billing loads (if Stripe configured)
□ No console errors on any page
```

---

### Phase 4: Automated Tests

#### Unit Tests
```
□ npm test (PASSED)
□ npm run test:coverage (>80% coverage)
□ No failing tests
```

#### Integration Tests
```
□ npm run test:integration (PASSED)
□ No failing tests
```

#### Code Quality
```
□ npm run type-check (PASSED - no TypeScript errors)
□ npm run lint (PASSED - no ESLint errors)
□ npm run build (PASSED - build succeeds)
```

---

### Phase 5: E2E Tests (Optional - requires setup)

```
□ Created test users in Clerk Dashboard
□ Configured .env.test with test credentials
□ npm run test:e2e:check (PASSED)
□ npm run test:e2e:auth (PASSED)
□ npm run test:e2e:agui (PASSED)
□ npm run test:e2e:rag (PASSED)
□ npm run test:e2e (PASSED - all tests)
```

---

### Phase 6: Pre-Deployment Test

```
□ npm run test:pre-deploy (PASSED)
□ Phase 1: Environment validation (PASSED)
□ Phase 2: Service connectivity (PASSED)
□ Phase 3: Authentication E2E (PASSED - CRITICAL)
□ Phase 4: AG-UI SDK integration (PASSED - CRITICAL)
□ Phase 5: Unit tests (PASSED)
□ Phase 6: Integration tests (PASSED)
□ Phase 7: E2E suite (PASSED or SKIPPED)
□ Phase 8: Load tests (PASSED or SKIPPED)
□ Phase 9: Security scan (PASSED)
□ Received "🚀 APPROVED FOR DEPLOYMENT" message
```

---

### Phase 7: Security Check

```
□ No API keys hardcoded in source code
□ No secrets committed to git
□ .env.local is in .gitignore
□ No live Stripe keys in test environment
□ No AWS keys exposed
□ CORS configured correctly
□ Rate limiting enabled (Arcjet)
□ RLS policies enabled in Supabase
```

---

### Phase 8: Production Readiness

#### Critical Services (Must Have)
```
□ Clerk authentication working
□ Supabase database connected
□ At least ONE LLM provider configured
□ Upstash Redis configured
□ All environment variables set
```

#### Core Features (Must Work)
```
□ User can sign up/sign in
□ Dashboard loads without errors
□ Chat interface streams responses
□ Documents can be uploaded
□ No console errors in browser
□ Build succeeds (npm run build)
□ No TypeScript errors (npm run type-check)
```

#### Optional (Nice to Have)
```
□ Stripe billing configured (for monetization)
□ Sentry monitoring configured (for production)
□ Email functionality configured (Resend)
□ All 4 Upstash services configured (Redis, Vector, QStash, Search)
□ E2E tests passing
□ Load tests passing
```

---

## 🚨 Red Flags (Stop and Fix)

If ANY of these are true, DO NOT deploy:

```
□ Authentication fails or loops
□ Database connection errors
□ No LLM provider configured
□ Chat doesn't stream responses
□ npm run build fails
□ npm run type-check shows errors
□ Console shows errors in browser
□ npm run test:pre-deploy fails
□ Critical phases (3 or 4) fail in pre-deployment test
```

---

## 🚀 Deployment Checklist

### Staging Deployment
```
□ Pushed code to GitHub
□ Created staging environment in Vercel
□ Added all environment variables to Vercel
□ Deployed to staging
□ Staging URL accessible
□ Ran smoke tests on staging
□ Tested authentication on staging
□ Tested chat on staging
□ Tested document upload on staging
□ No errors in Vercel logs
□ No errors in Sentry (if configured)
```

### Production Deployment
```
□ All staging tests passed
□ Updated environment variables for production
□ Changed API keys to production keys (if applicable)
□ Deployed to production
□ Production URL accessible
□ Ran smoke tests on production
□ Tested authentication on production
□ Tested chat on production
□ Tested document upload on production
□ No errors in Vercel logs
□ No errors in Sentry (if configured)
□ Monitoring configured and working
□ Alerts configured
```

---

## 📊 Post-Deployment Checklist

### Immediate (First 24 Hours)
```
□ Monitor error rates (Sentry)
□ Check API response times
□ Verify user signups working
□ Verify chat working
□ Verify document uploads working
□ Check database for data
□ Monitor Vercel logs
□ Check for any alerts
```

### First Week
```
□ Review error logs daily
□ Check performance metrics
□ Monitor user feedback
□ Review usage analytics
□ Check billing (if Stripe configured)
□ Verify background jobs running (QStash)
□ Check vector database health (Upstash Vector)
```

### Ongoing
```
□ Weekly error log review
□ Monthly performance review
□ Quarterly security audit
□ Update dependencies regularly
□ Run npm run test:pre-deploy before each deployment
□ Monitor costs (Vercel, Supabase, Upstash, LLM APIs)
```

---

## 🎯 Success Criteria

Your deployment is successful when:

```
□ Users can sign up and sign in
□ Chat streams responses correctly
□ Documents upload and process successfully
□ No critical errors in logs
□ Response times < 500ms (p95)
□ Error rate < 1%
□ Uptime > 99.9%
□ All monitoring alerts configured
□ Team knows how to respond to alerts
```

---

## 📝 Notes Section

Use this space to track issues, decisions, or important information:

```
Date: _______________

Issues Found:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

Issues Fixed:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

Deployment Notes:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

Team Sign-off:
Developer: ________________  Date: _______________
QA: ________________  Date: _______________
DevOps: ________________  Date: _______________
```

---

## 🆘 Emergency Contacts

Fill in your team's contact information:

```
On-Call Developer: _______________________________
DevOps Lead: _____________________________________
Database Admin: __________________________________
Security Contact: ________________________________
```

---

## 📚 Quick Reference

### Essential Commands
```bash
npm run validate:env        # Validate environment
npm run test:pre-deploy     # Pre-deployment test
npm run build               # Production build
npm run type-check          # TypeScript check
```

### Documentation
- **Full Testing Guide:** TESTING-GUIDE.md
- **Quick Reference:** docs/TESTING-QUICK-REFERENCE.md
- **Workflow Diagrams:** docs/TESTING-WORKFLOW.md
- **Setup Guide:** SETUP.md

### Support
- **Issues:** https://github.com/mibady/typescript-ag-ui-boilerplate/issues
- **Discussions:** https://github.com/mibady/typescript-ag-ui-boilerplate/discussions

---

**Checklist Version:** 1.0.0  
**Last Updated:** 2024-01-15  
**Project:** TypeScript AG-UI Boilerplate

---

**Remember:** This checklist is your safety net. Don't skip steps! 🛡️
