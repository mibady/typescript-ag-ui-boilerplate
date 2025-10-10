# Git Workflow & Quality Enforcement

**CRITICAL: This project enforces strict quality gates through Git hooks**

---

## 🚨 MANDATORY Rule: Always Push After Commit

### The Problem
AI coders (and humans) often commit locally but **forget to push** to GitHub, resulting in:
- ❌ Work exists only on local machine (risk of loss)
- ❌ No backup/collaboration possible
- ❌ Breaks continuous integration
- ❌ Manual verification required

### The Solution: Post-Commit Hook

After **EVERY commit**, the `post-commit` hook will:

1. **Count unpushed commits**
2. **Show recent unpushed commits**
3. **Prompt you to push immediately**

```bash
============================================================
📤 REMINDER: Push your commit to GitHub!
============================================================

⚠️  You have 1 unpushed commit(s)

Recent unpushed commits:
74571dc feat(phase-5): Step 5.1 - Sanity CMS Setup

Push to GitHub now? (Y/n):
```

**Default behavior:** Press Enter (or type `Y`) to push immediately.

---

## Git Hooks Overview

### Pre-Commit Hook (`.husky/pre-commit`)

**Purpose:** Prevent bad commits before they happen

**Checks:**
- ✅ **Commit size:** Max 15 files per commit
- ✅ **Secrets detection:** Block .env files, API keys
- ✅ **CodeRabbit review:** Automated code quality (if installed)
  - Blocks on BLOCKER severity issues
  - Warns on MAJOR severity issues
- ✅ **Linting:** ESLint must pass
- ✅ **Markdown organization:** Docs in correct locations

**Exit codes:**
- `0` = Pass, commit allowed
- `1` = Fail, commit blocked

**Bypass (NOT RECOMMENDED):**
```bash
git commit --no-verify
```

---

### Post-Commit Hook (`.husky/post-commit`) ⭐ NEW

**Purpose:** Ensure commits are pushed to remote

**Behavior:**
- Runs **after** successful commit
- Counts unpushed commits
- Shows recent unpushed commits
- **Prompts** for immediate push
- Default: `Y` (push immediately)

**Interactive Prompt:**
```
Push to GitHub now? (Y/n):
```

- Press **Enter** or type **Y** → Push immediately
- Type **n** → Skip push (reminder shown)

**Why this works:**
- ✅ Non-intrusive (can skip if needed)
- ✅ Visual reminder with commit count
- ✅ One-key push (just press Enter)
- ✅ Works for AI coders and humans

---

### Pre-Push Hook (`.husky/pre-push`)

**Purpose:** Final validation before pushing to remote

**Checks:**
- ✅ **Tests:** Run test suite (skipped until Phase 7)
- ✅ **Build:** Full production build must succeed
- ✅ **CodeRabbit branch review:** Comprehensive review vs main
- ✅ **Sensitive data check:** Scan for API keys/secrets

**Timeline:**
- Build: ~2-3 minutes (Next.js optimization)
- CodeRabbit: ~30 seconds
- Total: ~3 minutes

**Exit codes:**
- `0` = Pass, push allowed
- `1` = Fail, push blocked

---

## Recommended Workflow

### For Each Development Step:

```bash
# 1. Write code
# ... edit files ...

# 2. Stage changes
git add [files]

# 3. Commit (triggers pre-commit hook)
git commit -m "feat(phase-5): [description]"

# ✅ Pre-commit hook runs (CodeRabbit, linting, etc.)

# 4. Post-commit hook prompts:
#    "Push to GitHub now? (Y/n):"

# 5. Press Enter to push immediately
# ✅ Pre-push hook runs (build, tests, branch review)

# 6. Verify on GitHub
# https://github.com/mibady/typescript-ag-ui-boilerplate
```

---

## Commit Message Convention

Follow Conventional Commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code restructuring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(phase-5): Step 5.1 - Sanity CMS Setup"
git commit -m "fix(rag): Add content validation in findSimilarDocuments"
git commit -m "docs: Update README with deployment instructions"
git commit -m "chore: Install git hooks for automated code review"
```

---

## Quality Gate Details

### CodeRabbit Integration

**What it does:**
- Automated AI code review
- Detects security vulnerabilities
- Finds race conditions, memory leaks
- Enforces best practices

**Severity Levels:**
- **BLOCKER:** Commit blocked, must fix
- **MAJOR:** Warning, requires confirmation
- **MINOR:** Info only, does not block

**Installation:**
```bash
curl -fsSL https://cli.coderabbit.ai/install.sh | sh
coderabbit auth login
```

**Manual review:**
```bash
# Review uncommitted changes
coderabbit review --type uncommitted --prompt-only

# Review entire branch
coderabbit review --type all --plain
```

---

### Commit Size Enforcement

**Rule:** Maximum 15 files per commit

**Why:**
- Large commits are hard to review
- Increases merge conflict risk
- Difficult to revert if needed
- Makes code review ineffective

**Recommended sizes:**
- **Tiny:** 1-3 files (bug fixes, type updates)
- **Small:** 4-7 files (feature component)
- **Medium:** 8-12 files (template/system)
- **Large:** 13-15 files (major feature - rare)

**If blocked:**
```bash
# 1. Check staged files
git diff --cached --name-only

# 2. Unstage some files
git reset HEAD <file>

# 3. Commit in smaller groups
git commit -m "feat: part 1 of feature"

# 4. Repeat for remaining files
git add <more files>
git commit -m "feat: part 2 of feature"
```

---

## Troubleshooting

### "Push failed" after post-commit prompt

**Cause:** Network issue, authentication failure, or pre-push hook failed

**Solution:**
```bash
# Try pushing manually
git push origin main

# Check pre-push hook output for errors
```

### Pre-commit hook blocks commit

**Cause:** CodeRabbit found blocker issues, or linting failed

**Solution:**
```bash
# 1. Review the error output
# 2. Fix the issues
# 3. Stage fixes and try again
git add [fixed-files]
git commit -m "fix: resolve blocker issues"
```

### Want to bypass hooks (emergencies only)

```bash
# Skip pre-commit hook
git commit --no-verify -m "emergency fix"

# Skip pre-push hook
git push --no-verify origin main
```

**⚠️  NOT RECOMMENDED:** Only use in true emergencies.

---

## Benefits of This Workflow

✅ **Automated Quality:** CodeRabbit catches issues before commit
✅ **Always Backed Up:** Post-commit hook ensures push
✅ **Build Verification:** Pre-push catches build errors
✅ **Small Commits:** 15-file limit forces atomic commits
✅ **No Secrets:** Automatic secret detection
✅ **Team Ready:** Same workflow for AI coders and humans

---

## Summary: The Complete Cycle

```
Write Code
    ↓
Stage Changes (git add)
    ↓
Commit (git commit)
    ↓
[Pre-Commit Hook]
✅ CodeRabbit review
✅ Linting
✅ Secrets check
✅ Size limit
    ↓
[Post-Commit Hook] ⭐
📤 Push reminder
    ↓
User: Press Enter
    ↓
Push (git push)
    ↓
[Pre-Push Hook]
✅ Tests
✅ Build
✅ Branch review
    ↓
✅ Code on GitHub!
```

---

**Last Updated:** October 10, 2025
**Version:** 1.0.0 (Post-Commit Hook Added)
