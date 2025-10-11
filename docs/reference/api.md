# API Reference

## Authentication

All API routes require authentication via Clerk.

```typescript
import { auth } from '@clerk/nextjs/server';

const { userId, orgId } = await auth();
```

## Billing APIs

### POST /api/billing/checkout

Create Stripe checkout session.

**Request:**
```json
{
  "planId": "uuid",
  "billingCycle": "monthly" | "yearly"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### POST /api/billing/portal

Access Stripe customer portal.

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

### GET /api/billing/subscription

Get current subscription status.

**Response:**
```json
{
  "plan": { "name": "pro", "displayName": "Pro Plan", ... },
  "subscription": { "status": "active", ... },
  "usage": { "messages": 150, "tokens": 75000, ... },
  "payments": [...]
}
```

## Webhook APIs

### POST /api/webhooks/stripe

Handle Stripe webhook events.

**Headers:**
- `stripe-signature`: Webhook signature

**Events handled:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

## AG-UI APIs

### POST /api/agui/stream

Stream AI agent responses.

**Request:**
```json
{
  "messages": [{ "role": "user", "content": "..." }],
  "sessionId": "uuid"
}
```

**Response:** Server-Sent Events (SSE)

## RAG APIs

### POST /api/rag/ingest

Ingest document for RAG.

**Request:**
```json
{
  "content": "...",
  "metadata": { ... }
}
```

### POST /api/rag/search

Semantic search.

**Request:**
```json
{
  "query": "search query",
  "limit": 10
}
```

**Response:**
```json
{
  "results": [
    { "content": "...", "similarity": 0.95, ... }
  ]
}
```
