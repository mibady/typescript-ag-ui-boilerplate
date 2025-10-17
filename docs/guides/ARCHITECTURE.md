# Complete Architecture Overview

This boilerplate implements a sophisticated, multi-layer architecture designed for building production-ready, AI-powered SaaS applications. It combines a robust data and services layer with standardized protocols for agent communication and LLM interaction.

```mermaid
graph TD
    subgraph Frontend
        A[React UI Components]
    end

    subgraph Backend (Next.js API Routes)
        B[Agent Logic]
        C[Vercel AI SDK]
        D[Data Access Layer]
    end

    subgraph LLM Providers
        E[OpenAI]
        F[Anthropic]
        G[Google]
    end

    subgraph Data & Services
        H[Supabase PostgreSQL]
        I[Upstash Redis]
        J[Upstash Vector]
        K[Upstash QStash]
    end

    A -- AG-UI Protocol (@ag-ui/client) --> B
    B -- Uses --> C
    B -- Uses --> D
    C -- Translates to --> E
    C -- Translates to --> F
    C -- Translates to --> G
    D -- Reads/Writes --> H
    D -- Caches/Streams via --> I
    D -- Searches --> J
    D -- Queues Jobs via --> K
```

---

## Layer 1: Frontend-to-Backend Communication (AG-UI SDK)

**Purpose:** To provide a standardized, real-time protocol for communication between the frontend UI and the backend agent logic.

- **Technology:** `@ag-ui/client`
- **Principle:** Instead of manual `fetch` or `EventSource` implementations, all real-time agent communication is handled by the official AG-UI SDK. This provides a robust, maintainable, and standardized "nervous system" for the application.

### Usage in Code (`chat-interface.tsx`)

```typescript
import { HttpAgent } from '@ag-ui/client';
import { EventType, type Message } from '@ag-ui/core';

// 1. Create an agent instance pointing to the API endpoint
const agent = new HttpAgent({ url: '/api/agent/stream' });

// 2. Run the agent with input parameters
const eventObservable = await agent.run({
  threadId: sessionId,
  messages: currentMessages,
  // ... other parameters
});

// 3. Subscribe to the observable to receive real-time events
eventObservable.subscribe({
  next: (event) => {
    if (event.type === EventType.TEXT_MESSAGE_CONTENT) {
      // Update UI with streaming text delta
    }
  },
  complete: () => {
    // Finalize the agent run
  }
});
```

---

## Layer 2: Backend-to-LLM Abstraction (Vercel AI SDK)

**Purpose:** To create an LLM-agnostic system that can use multiple different language model providers without changing the core agent logic.

- **Technology:** `ai` (Vercel AI SDK)
- **Principle:** The backend agent logic is written against the Vercel AI SDK's unified API. This acts as a "translator," allowing the application to seamlessly switch between providers like OpenAI, Anthropic, and Google by simply changing the configuration.

### Usage in Code (`/lib/llm/generate-text.ts`)

```typescript
import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

// The core logic is provider-agnostic
const { text, toolCalls } = await generateText({
  model: openai('gpt-4-turbo'), // or anthropic('claude-3-opus')
  system: 'You are a helpful assistant.',
  prompt: 'What is the weather in San Francisco?',
});
```

---

## Layer 3: Data & Backend Services (Supabase + Upstash)

**Purpose:** The foundational persistence and infrastructure layer for all application data, caching, vector search, and background jobs.

### 1. Supabase (PostgreSQL)

**Purpose:** Relational database with Row Level Security

#### What It Stores

```sql
-- Multi-tenancy
users, organizations, organization_members

-- Documents & RAG
documents, document_chunks

-- AI Agents
agent_sessions, agent_messages, tool_executions

-- Business Logic
api_keys, usage_records, subscriptions
```

- ✅ **Key Feature:** Row Level Security (RLS) provides automatic, ironclad data isolation between different organizations.

### 2. Upstash Redis

**Purpose:** In-memory cache & real-time data store

- ✅ **Key Use Cases:** Session caching, rate limiting, and as a message broker for real-time event streams (though AG-UI abstracts this).

### 3. Upstash Vector

**Purpose:** Serverless vector database for semantic search (RAG).

- ✅ **Key Feature:** Metadata filtering allows for efficient, multi-tenant vector searches, ensuring one organization cannot see another's data.

### 4. Upstash QStash

**Purpose:** Serverless messaging for background jobs and task orchestration.

- ✅ **Key Use Case:** Offloading long-running tasks like document processing and embedding generation from the main request thread, ensuring a responsive UI.

---

## Complete Data Flow: Document Upload & RAG

This process demonstrates how all the services work together.

```
1. User uploads document -> (Next.js API)
2. Store metadata -> (Supabase)
3. Queue processing job -> (QStash)
4. Background job runs -> (QStash Worker)
5. Generate embeddings -> (Vercel AI SDK -> OpenAI)
6. Store vectors -> (Upstash Vector)
7. Store text chunks -> (Supabase)
8. User asks a question -> (AG-UI SDK -> Next.js API)
9. Search for context -> (Upstash Vector)
10. Generate response -> (Vercel AI SDK -> LLM Provider)
11. Stream response to user -> (AG-UI Protocol)
```

---

## Multi-Tenancy Architecture

Multi-tenancy is a core principle, achieved through a combination of Clerk for authentication and Supabase RLS for data isolation.

### How RLS Works

```sql
-- Every query is automatically and securely filtered by the user's current organization.
CREATE POLICY org_isolation ON documents
  FOR ALL
  TO authenticated
  USING (organization_id = get_current_org_id());
```

### Multi-Tenant Filtering in Upstash Vector

```typescript
// A filter is applied to every vector query to ensure data isolation.
const results = await vectorIndex.query({
  vector: queryEmbedding,
  topK: 10,
  filter: `orgId = '${organizationId}'`,
});
```
