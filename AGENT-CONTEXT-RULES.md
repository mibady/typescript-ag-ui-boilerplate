# 🚨 AGENT CONTEXT RULES - READ FIRST BEFORE EVERY TASK

**CRITICAL: This is your PRIME DIRECTIVE. Read and follow these rules before performing ANY action.**

---

## Context Identification

### YOU ARE WORKING IN: **PROJECT CONTEXT**

- **Directory:** `/mnt/c/dev/typescript-ag-ui-boilerplate`
- **Purpose:** Building a production SaaS application (the application itself)
- **Testing Framework:** `vitest` (from THIS project's package.json)
- **Test Library:** `@testing-library/react` + `@testing-library/jest-dom`
- **Status:** **ACTIVE DEVELOPMENT - Phase 5**

### YOU ARE **NOT** WORKING IN: **TOOL CONTEXT**

- **Directory:** `/mnt/c/dev/ai-coder-agents`
- **Purpose:** The framework/tooling that builds projects (the toolbox)
- **Testing Framework:** `Jest` (41 tests - NOT RELEVANT HERE)
- **Status:** **DO NOT CONFUSE WITH THIS PROJECT**

---

## RULE 1: Always Verify Context Before Acting

Before EVERY action, you MUST:

1. **Confirm working directory:**
   ```bash
   pwd  # Should show: /mnt/c/dev/typescript-ag-ui-boilerplate
   ```

2. **Check THIS project's package.json:**
   ```bash
   cat package.json | grep '"test"'
   # Should show: "test": "vitest"
   ```

3. **Verify existing test infrastructure:**
   ```bash
   ls src/__tests__/
   # Check for vitest.config.ts (EXISTS)
   # Check for existing .test.tsx files
   ```

4. **State your context explicitly:**
   ```
   "I am working in PROJECT context (typescript-ag-ui-boilerplate)."
   "This project uses vitest for testing (verified in package.json)."
   ```

---

## RULE 2: Testing is MANDATORY for Every Component

### The Requirement

For **EVERY** component, page, or function you create:

1. **Write the implementation file** (e.g., `hero.tsx`)
2. **Write the test file** (e.g., `hero.test.tsx`)
3. **Run the tests** (`npm test`)
4. **Commit both together**

### Test File Location

```
Implementation:  components/marketing/hero.tsx
Test File:       src/__tests__/components/marketing/hero.test.tsx
```

### Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '@/components/marketing/hero';

describe('Hero Component', () => {
  it('renders the hero heading', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('displays the call-to-action button', () => {
    render(<Hero />);
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
  });
});
```

---

## RULE 3: No Excuses for Missing Tests

### ❌ NEVER Say These Things:

- ❌ "We haven't gotten to testing yet"
- ❌ "I'll wait until Phase 7 for tests"
- ❌ "Manual testing is sufficient for now"
- ❌ "The test framework isn't set up yet"

### ✅ The Truth:

- ✅ The project HAS vitest configured (vitest.config.ts EXISTS)
- ✅ The project HAS testing libraries installed (@testing-library/react)
- ✅ The project HAS test setup (src/__tests__/setup.ts EXISTS)
- ✅ **You MUST write tests NOW, not later**

### Verification

```bash
# Confirm vitest is ready
npm test -- --version  # Should work

# Confirm config exists
ls vitest.config.ts    # Should exist

# Confirm setup exists
ls src/__tests__/setup.ts  # Should exist
```

---

## RULE 4: The Workflow (One Step at a Time)

For EACH implementation step (5.1, 5.2, etc.):

### Step-by-Step Process:

```
1. Write Code
   ├─ Create component/page files
   ├─ Implement functionality
   └─ Use existing shadcn/ui components

2. Write Tests
   ├─ Create .test.tsx file
   ├─ Write unit tests for component
   └─ Aim for key functionality coverage

3. Run Tests
   ├─ npm test
   ├─ Fix any failures
   └─ Ensure tests pass

4. Type Check
   ├─ npx tsc --noEmit
   └─ Fix TypeScript errors (0 errors required)

5. Review (Automatic)
   ├─ git add [files]
   ├─ git commit -m "message"
   └─ Pre-commit hook runs CodeRabbit, linting

6. Push (Reminder)
   ├─ Post-commit hook shows reminder
   └─ git push origin main
```

### Atomic Commits

- Max 15 files per commit
- One logical change per commit
- Include tests in same commit as code

---

## RULE 5: Pre-Flight Checklist

**Before starting ANY task, check these boxes:**

- [ ] Confirmed working directory (`pwd`)
- [ ] Read THIS project's `package.json`
- [ ] Verified test framework (vitest, not Jest)
- [ ] Planned test file location
- [ ] Will write tests alongside code
- [ ] Will run `npm test` before committing

---

## Common Mistakes to Avoid

### Mistake #1: Using Wrong Test Framework

❌ **Wrong:**
```typescript
// Using Jest syntax from ai-coder-agents
import { describe, test, expect } from '@jest/globals';
```

✅ **Correct:**
```typescript
// Using vitest syntax from THIS project
import { describe, it, expect } from 'vitest';
```

### Mistake #2: Assuming Capabilities

❌ **Wrong:**
"I see ai-coder-agents has Playwright tests, so this project must too."

✅ **Correct:**
"I will check THIS project's package.json for test frameworks.
I see 'vitest' - I will use vitest for component tests."

### Mistake #3: Deferring Tests

❌ **Wrong:**
"I'll implement the component now and add tests in Phase 7."

✅ **Correct:**
"I will create hero.tsx AND hero.test.tsx together.
Both files will be committed in the same step."

---

## Testing Strategy for This Project

### Unit Tests (vitest + @testing-library/react)

**What to test:**
- Component rendering
- Props handling
- User interactions (clicks, form submissions)
- Conditional rendering
- Accessibility (ARIA roles, labels)

**Example:**
```typescript
describe('ContactForm', () => {
  it('validates required fields', () => {
    render(<ContactForm />);
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright - Phase 5.12)

**What to test:**
- Complete user flows
- Navigation between pages
- Form submissions end-to-end
- Authentication flows

**When:**
- After all components are built (Step 5.12)
- Using Playwright Agents for generation

---

## Directory Structure

```
typescript-ag-ui-boilerplate/
├── components/
│   ├── marketing/
│   │   ├── hero.tsx
│   │   └── features.tsx
│   └── ui/
│       └── button.tsx
├── src/
│   └── __tests__/
│       ├── setup.ts (EXISTS)
│       ├── components/
│       │   └── marketing/
│       │       ├── hero.test.tsx (YOU CREATE)
│       │       └── features.test.tsx (YOU CREATE)
│       └── lib/
│           └── sanity-client.test.tsx (IF NEEDED)
├── vitest.config.ts (EXISTS)
├── package.json (test: "vitest")
└── AGENT-CONTEXT-RULES.md (THIS FILE)
```

---

## Verification Commands

### Always Available:

```bash
# 1. Verify context
pwd

# 2. Check test framework
cat package.json | grep '"test"'

# 3. Run tests
npm test

# 4. Type check
npx tsc --noEmit

# 5. Lint
npm run lint

# 6. Build
npm run build
```

---

## Summary: The Golden Rule

**BEFORE you write code, ask yourself:**

1. **"Am I in the PROJECT context?"** → Verify with `pwd`
2. **"What test framework does THIS project use?"** → Check `package.json`
3. **"Will I write a test file alongside this code?"** → YES, ALWAYS
4. **"Will I run tests before committing?"** → YES, MANDATORY

**IF you follow these rules, you will:**
- ✅ Always use the correct tools
- ✅ Write tests for every component
- ✅ Avoid context confusion
- ✅ Produce high-quality, tested code

**IF you ignore these rules, you will:**
- ❌ Use the wrong test framework (Jest instead of vitest)
- ❌ Assume capabilities that don't exist
- ❌ Skip tests "for later"
- ❌ Fail quality gates

---

## Emergency Context Reset

If you ever feel confused about context:

```bash
# 1. Stop
# 2. Read this file again (AGENT-CONTEXT-RULES.md)
# 3. Run these commands:
pwd
cat package.json | head -20
ls -la vitest.config.ts
ls -la src/__tests__/

# 4. State explicitly:
#    "I am in PROJECT context"
#    "This project uses vitest"
#    "I will write tests for this component"
```

---

**Last Updated:** October 10, 2025
**Version:** 1.0.0
**Project Phase:** Phase 5 - UI & Marketing
**Testing Status:** vitest configured, ready for tests
