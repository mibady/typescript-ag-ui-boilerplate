# CodeRabbit Integration Setup

This project uses CodeRabbit for automated code review and quality gates.

## Installation

### 1. Install CodeRabbit CLI

```bash
curl -fsSL https://cli.coderabbit.ai/install.sh | sh
```

Verify installation:
```bash
coderabbit --version
```

### 2. Install Husky (Git Hooks)

```bash
npm install --save-dev husky
npx husky install
```

### 3. Make Hooks Executable

```bash
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
chmod +x .husky/_/husky.sh
```

## Usage

### Automatic (via Git Hooks)

Once installed, quality gates run automatically:

**Pre-Commit Hook:**
- Runs CodeRabbit review on staged changes
- Blocks commit if blockers found
- Warns if >15 files staged

**Pre-Push Hook:**
- Runs tests
- Runs build
- Runs CodeRabbit branch review
- Blocks push if any fail

### Manual Review

```bash
# Review uncommitted changes
coderabbit review --uncommitted

# Review staged changes
coderabbit review --staged

# Review entire branch
coderabbit review --branch

# Auto-fix issues
coderabbit fix
```

### Using the Review Script

```bash
# Run full quality gates + commit
./scripts/review.sh "feat: Add new feature"
```

This runs:
1. CodeRabbit review
2. Tests
3. Build
4. Lint
5. Auto-commit with quality badge

## Quality Gates

### What Gets Checked

**CodeRabbit:**
- Security vulnerabilities
- Performance issues
- Code quality
- Best practices
- Style issues

**Tests:**
- Unit tests
- Integration tests
- Coverage thresholds

**Build:**
- TypeScript compilation
- Next.js build
- Asset optimization

**Lint:**
- ESLint rules
- TypeScript strict mode
- Import organization

### Severity Levels

- **Blocker**: Must fix before commit
- **Major**: Should fix before commit
- **Minor**: Can fix later
- **Suggestion**: Optional improvement

## Bypassing Hooks (Emergency Only)

```bash
# Skip pre-commit hook
git commit --no-verify -m "emergency fix"

# Skip pre-push hook
git push --no-verify
```

⚠️ **Warning:** Only use `--no-verify` in emergencies. Quality gates exist for a reason!

## Integration with AI Coder Agents

If using the AI Coder Agents system:

```bash
# Run quality gates via CLI
ai-coder review

# This runs:
# 1. CodeRabbit review
# 2. Tests
# 3. Build
# 4. Tracks results in session
```

## Troubleshooting

### CodeRabbit Not Found

```bash
# Check if installed
which coderabbit

# Reinstall
curl -fsSL https://cli.coderabbit.ai/install.sh | sh
```

### Hooks Not Running

```bash
# Reinstall hooks
npx husky install

# Make executable
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

### False Positives

If CodeRabbit reports false positives:

1. Review the issue carefully
2. If truly false, add to `.coderabbitignore`
3. Or use inline comments: `// coderabbit-ignore`

## Configuration

### .coderabbitrc (Optional)

Create `.coderabbitrc` in project root:

```json
{
  "rules": {
    "security": "error",
    "performance": "warning",
    "style": "suggestion"
  },
  "ignore": [
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

## Benefits

✅ **Catch issues early** - Before code review
✅ **Consistent quality** - Automated enforcement
✅ **Security** - Detect vulnerabilities
✅ **Performance** - Identify bottlenecks
✅ **Best practices** - Learn from suggestions
✅ **Time savings** - Auto-fix common issues

## Next Steps

1. Install CodeRabbit CLI
2. Install Husky
3. Make hooks executable
4. Try a commit - hooks will run automatically!
5. Review the quality report
6. Fix any blockers
7. Commit successfully with quality badge 🎉
