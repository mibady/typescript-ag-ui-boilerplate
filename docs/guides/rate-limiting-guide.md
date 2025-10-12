# Rate Limiting Guide with Arcjet

Complete guide to implementing tier-based rate limiting, bot protection, and security with Arcjet.

## What is Arcjet?

Arcjet is a security layer that runs at the edge (Next.js middleware) and provides:

- **Rate Limiting** - Token bucket algorithm, tier-based limits
- **Bot Detection** - Block automated requests, allow search engines
- **Shield** - Protect against SQL injection, XSS, and common attacks
- **Email Validation** - Block disposable emails, invalid domains

**Key Advantage:** Runs in Edge Runtime = ultra-low latency (<5ms overhead)

---

## Architecture

```
User Request
    │
    ▼
Next.js Middleware
    │
    ├─ Arcjet Protection
    │  ├─ Bot Detection (block/allow)
    │  ├─ Shield (SQL injection, XSS)
    │  └─ Rate Limiting (tier-based)
    │
    ├─ Clerk Authentication
    │
    └─ Route Handler (if allowed)
```

---

## Setup

### 1. Get Arcjet API Key

```bash
# Sign up at https://arcjet.com
# Create a new site
# Copy your API key
```

### 2. Add Environment Variable

```bash
# .env.local
ARCJET_KEY=ajkey_xxxxxxxxxxxxx
```

### 3. Install Package

Already included in package.json:
```json
{
  "dependencies": {
    "@arcjet/next": "^1.0.0-alpha.25"
  }
}
```

---

## Tier-Based Rate Limiting

### Rate Limit Tiers

| Plan | Requests/Minute | Burst Capacity | Use Case |
|------|-----------------|----------------|-----------|
| **Free** | 10 | 10 | Casual users, trials |
| **Pro** | 60 | 100 | Regular users, small teams |
| **Enterprise** | 300 | 500 | High-volume, large teams |

### How It Works

**Token Bucket Algorithm:**
1. Each user gets a "bucket" with tokens
2. Every request consumes 1 token
3. Tokens refill at a constant rate (e.g., 10/minute)
4. When bucket is empty, requests are blocked
5. Allows bursts up to capacity

**Example (Free Tier):**
```
Time    Tokens   Action
0:00    10       User makes 5 requests → 5 tokens left
0:10    6        1 token refilled (10/min = 1 every 6s)
0:20    7        1 token refilled
0:30    8        User makes 10 requests → blocked after 8
0:40    1        Tokens refilling...
```

---

## Implementation

### Global Protection (Middleware)

```typescript
// middleware.ts
import { aj } from '@/lib/arcjet';

export default clerkMiddleware(async (auth, req) => {
  // Run Arcjet protection
  const decision = await aj.protect(req, {
    requested: 1,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: decision.reason.resetTime },
        { status: 429 }
      );
    }

    if (decision.reason.isBot()) {
      return NextResponse.json(
        { error: 'Bot detected' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Request blocked' },
      { status: 403 }
    );
  }

  // Continue with auth...
});
```

### Route-Specific Rate Limiting

```typescript
// app/api/agent/execute/route.ts
import { ajApi, getRateLimitForPlan } from '@/lib/arcjet';
import { getSubscriptionWithPlan } from '@/lib/db/subscriptions';

export async function POST(request: NextRequest) {
  const { userId, orgId } = await auth();

  // Get user's subscription plan
  const subscription = await getSubscriptionWithPlan(orgId);
  const planName = subscription?.plan?.name || 'free';

  // Apply tier-based rate limiting
  const rateLimitRule = getRateLimitForPlan(planName);

  const decision = await ajApi
    .withRule(rateLimitRule)
    .protect(request, { userId, requested: 1 });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          plan: planName,
          retryAfter: decision.reason.resetTime,
        },
        { status: 429 }
      );
    }
  }

  // Process request...
}
```

---

## Configuration Examples

### Authentication Routes (Stricter)

```typescript
// lib/arcjet.ts
export const ajAuth = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ['ip'], // Track by IP for unauthenticated
  rules: [
    detectBot({
      mode: 'LIVE',
      allow: [],
    }),
    shield({
      mode: 'LIVE',
    }),
    tokenBucket({
      mode: 'LIVE',
      refillRate: 5,  // 5 attempts/minute
      interval: '1m',
      capacity: 5,
    }),
  ],
});
```

Usage:
```typescript
// app/api/auth/sign-up/route.ts
const decision = await ajAuth.protect(request);
```

### Webhook Routes (Higher Limits)

```typescript
export const ajWebhook = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ['ip'],
  rules: [
    tokenBucket({
      mode: 'LIVE',
      refillRate: 100,   // Allow webhook bursts
      interval: '1m',
      capacity: 200,
    }),
  ],
});
```

---

## Bot Detection

### Allow Search Engines

```typescript
detectBot({
  mode: 'LIVE',
  allow: [
    'CATEGORY:SEARCH_ENGINE', // Google, Bing, etc.
  ],
})
```

### Block All Bots

```typescript
detectBot({
  mode: 'LIVE',
  allow: [],
})
```

### Dry Run Mode (Logging Only)

```typescript
detectBot({
  mode: 'DRY_RUN', // Don't block, just log
  allow: [],
})
```

---

## Shield (Attack Protection)

Protects against:
- **SQL Injection** - Detects SQL patterns in inputs
- **Cross-Site Scripting (XSS)** - Blocks <script> tags, dangerous HTML
- **Path Traversal** - Detects ../../../etc/passwd
- **Command Injection** - Blocks shell commands in inputs

```typescript
shield({
  mode: 'LIVE',
})
```

**Automatic Detection:**
```
POST /api/user
{
  "name": "'; DROP TABLE users; --"
}

→ Blocked by Shield (SQL injection detected)
```

---

## Email Validation

```typescript
import { emailValidator } from '@/lib/arcjet';

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  const decision = await emailValidator.protect(request, { email });

  if (decision.isDenied()) {
    if (decision.reason.isEmail()) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
  }

  // Email is valid...
}
```

**Blocks:**
- Disposable email services (mailinator, temp-mail)
- Emails with no MX records
- Invalid email formats

---

## Error Responses

### Rate Limit Exceeded (429)

```json
{
  "error": "Rate limit exceeded",
  "plan": "free",
  "retryAfter": "2025-10-11T10:45:00Z"
}
```

Client handling:
```typescript
const response = await fetch('/api/agent/execute', {
  method: 'POST',
  body: JSON.stringify(data),
});

if (response.status === 429) {
  const { retryAfter } = await response.json();
  const waitTime = new Date(retryAfter) - new Date();

  setTimeout(() => {
    // Retry request
  }, waitTime);
}
```

### Bot Detected (403)

```json
{
  "error": "Bot detected"
}
```

### Security Violation (403)

```json
{
  "error": "Request blocked"
}
```

---

## Monitoring & Analytics

### Arcjet Dashboard

View in real-time:
- Request volume
- Blocked requests
- Rate limit hits
- Bot detections
- Attack patterns

**Access:** https://app.arcjet.com

### Custom Logging

```typescript
const decision = await ajApi.protect(request, { userId, requested: 1 });

if (decision.isDenied()) {
  console.log('Arcjet blocked request:', {
    userId,
    reason: decision.reason,
    ip: decision.ip,
    timestamp: new Date().toISOString(),
  });
}
```

---

## Testing

### Test Rate Limiting

```bash
# Make 15 requests quickly (Free tier: 10/min)
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/agent/execute \
    -H "Content-Type: application/json" \
    -d '{"messages": [], "sessionId": "test"}' &
done

# Expected: First 10 succeed, next 5 get 429
```

### Test Bot Detection

```bash
# Set a bot user agent
curl -X POST http://localhost:3000/api/agent/execute \
  -H "User-Agent: BadBot/1.0" \
  -H "Content-Type: application/json" \
  -d '{"messages": [], "sessionId": "test"}'

# Expected: 403 Bot detected
```

### Test Shield

```bash
# Try SQL injection
curl -X POST http://localhost:3000/api/agent/execute \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "'; DROP TABLE users; --"}], "sessionId": "test"}'

# Expected: 403 Request blocked
```

---

## Performance

### Latency Impact

Arcjet runs at the edge:
- **Average overhead:** <5ms
- **99th percentile:** <15ms
- **Global edge network:** <10ms from any user

### Caching

Decisions are cached automatically:
- **Allowed requests:** Cached for 60 seconds
- **Blocked requests:** Cached for 300 seconds
- **No extra database calls**

---

## Upgrading Plans

When a user upgrades from Free → Pro:

```typescript
// Subscription updated via Stripe webhook
// lib/db/subscriptions.ts updates plan in database

// Next request automatically gets Pro tier limits:
const subscription = await getSubscriptionWithPlan(orgId);
const planName = subscription?.plan?.name; // 'pro'

const rateLimitRule = getRateLimitForPlan(planName);
// Returns: 60 requests/min instead of 10
```

**No code changes needed** - tier-based limiting is automatic.

---

## Best Practices

### 1. Use Characteristics Wisely

**Authenticated routes:**
```typescript
{ userId } // Track per user
```

**Public routes:**
```typescript
{ ip } // Track per IP address
```

**API keys:**
```typescript
{ apiKey } // Track per API key
```

### 2. Set Appropriate Limits

**High-cost operations (AI, DB):**
```typescript
refillRate: 5,  // Low limit
interval: '1m',
```

**Low-cost operations (read-only):**
```typescript
refillRate: 100, // High limit
interval: '1m',
```

### 3. Provide Clear Error Messages

```typescript
if (decision.reason.isRateLimit()) {
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: `Your ${planName} plan allows ${limit} requests/minute. Upgrade for higher limits.`,
      upgradeUrl: '/pricing',
      retryAfter: decision.reason.resetTime,
    },
    { status: 429 }
  );
}
```

### 4. Test in DRY_RUN First

```typescript
// Initial deployment
detectBot({ mode: 'DRY_RUN' })

// Review logs for false positives
// Then switch to LIVE
detectBot({ mode: 'LIVE' })
```

---

## Troubleshooting

### Users getting rate limited too quickly

**Check:**
1. Is `refillRate` too low?
2. Are multiple devices sharing same IP?
3. Is characteristic correct (`userId` vs `ip`)?

**Solution:**
```typescript
// Increase refill rate or capacity
tokenBucket({
  refillRate: 20, // Was 10
  capacity: 30,   // Was 10
})
```

### Legitimate users marked as bots

**Check:**
1. User-Agent string
2. Request patterns (too fast?)

**Solution:**
```typescript
// Whitelist specific bots
detectBot({
  allow: [
    'CATEGORY:SEARCH_ENGINE',
    'CATEGORY:MONITORING',
  ],
})
```

### Shield blocking valid requests

**Check:**
1. Request contains SQL-like syntax?
2. Special characters in user input?

**Solution:**
```typescript
// Use DRY_RUN mode for specific routes
shield({ mode: 'DRY_RUN' })
```

---

## Cost

**Arcjet Pricing:**
- **Free tier:** 10,000 requests/month
- **Pro tier:** $20/month for 1M requests
- **Enterprise:** Custom pricing

**This boilerplate includes Arcjet Pro in pricing:**
- Free plan: Uses Arcjet free tier (10k/month)
- Pro plan: Uses Arcjet paid tier (1M/month)
- Enterprise: Unlimited Arcjet usage

---

## Resources

- [Arcjet Docs](https://docs.arcjet.com)
- [Next.js Integration Guide](https://docs.arcjet.com/get-started/nextjs)
- [Rate Limiting Best Practices](https://docs.arcjet.com/rate-limiting/concepts)
- [Bot Detection Guide](https://docs.arcjet.com/bot-protection/concepts)

---

**Last Updated:** 2025-10-11
**Version:** 1.0.0
