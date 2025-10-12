# Hybrid Search Guide

Complete guide to using hybrid search (vector + full-text) with Upstash Vector and Upstash Search.

## What is Hybrid Search?

Hybrid search combines two complementary search techniques:

1. **Semantic Search (Vector)** - Understands meaning and context
   - Uses AI embeddings (OpenAI text-embedding-3-small)
   - Finds conceptually similar content
   - Great for: "What is authentication?" → Finds OAuth, login, SSO docs

2. **Keyword Search (Full-Text)** - Matches exact terms
   - Uses BM25 ranking algorithm
   - Finds exact keyword matches
   - Great for: "stripe API key" → Finds exact config references

**Hybrid search merges both using RRF (Reciprocal Rank Fusion) for best results.**

---

## Architecture

```
User Query
    │
    ├─────────────────────┬─────────────────────┐
    │                     │                     │
    ▼                     ▼                     ▼
Generate Embedding    Full-Text Search    (Parallel)
    │                     │
    ▼                     ▼
Upstash Vector       Upstash Search
(Semantic Results)   (Keyword Results)
    │                     │
    └─────────────────────┴─────────────────────┐
                          │
                          ▼
                  RRF Algorithm
               (Merge & Re-rank)
                          │
                          ▼
                  Top K Results
```

---

## Setup

### 1. Create Upstash Search Index

```bash
# Go to console.upstash.com
# Create a new Search index
# Copy REST URL and Token
```

### 2. Add Environment Variables

```bash
# .env.local
UPSTASH_SEARCH_REST_URL=https://xxxxx-search.upstash.io
UPSTASH_SEARCH_REST_TOKEN=sk_xxxxx
```

### 3. Install Dependencies

```bash
npm install @upstash/search
```

---

## Usage

### Basic Hybrid Search

```typescript
import { hybridSearch } from '@/lib/rag/hybrid-search';

// Search with default settings
const results = await hybridSearch('How to authenticate users?', organizationId);

console.log(results);
// [
//   {
//     id: 'chunk-123',
//     documentId: 'doc-456',
//     chunkIndex: 2,
//     content: 'Authentication with Clerk...',
//     score: 0.85,        // Combined RRF score
//     vectorScore: 0.92,  // Semantic similarity
//     textScore: 0.78,    // BM25 keyword score
//     source: 'both'      // Found in both searches
//   }
// ]
```

### Advanced Options

```typescript
const results = await hybridSearch('authentication guide', organizationId, {
  vectorTopK: 30,       // Fetch top 30 from vector search
  textTopK: 30,         // Fetch top 30 from text search
  minScore: 0.1,        // Filter results below this RRF score
  vectorWeight: 0.7,    // 70% weight for semantic search
  textWeight: 0.3,      // 30% weight for keyword search
});
```

### Get RAG Context

```typescript
import { getHybridRAGContext } from '@/lib/rag/hybrid-search';

// Get formatted context for LLM
const context = await getHybridRAGContext(
  'How to set up Stripe billing?',
  organizationId,
  5 // Top 5 chunks
);

console.log(context);
// [1] (Combined Score: 85.2%) [Vector: 92%, Text: 78%]:
// Stripe integration requires setting STRIPE_SECRET_KEY...
//
// ---
//
// [2] (Combined Score: 78.4%) [Vector: 81%, Text: 75%]:
// Create a checkout session with Stripe.checkout.sessions.create()...
```

---

## API Endpoints

### POST /api/rag/hybrid-search

**Request:**
```json
{
  "query": "user authentication guide",
  "vectorTopK": 20,
  "textTopK": 20,
  "minScore": 0,
  "vectorWeight": 0.7,
  "textWeight": 0.3,
  "returnContext": false
}
```

**Response (returnContext: false):**
```json
{
  "results": [
    {
      "id": "chunk-123",
      "documentId": "doc-456",
      "chunkIndex": 2,
      "content": "Authentication setup...",
      "score": 0.85,
      "vectorScore": 0.92,
      "textScore": 0.78,
      "source": "both"
    }
  ],
  "query": "user authentication guide",
  "organizationId": "org_123",
  "resultCount": 15
}
```

**Response (returnContext: true):**
```json
{
  "context": "[1] (Combined Score: 85.2%)...\n\n---\n\n[2]...",
  "query": "user authentication guide",
  "organizationId": "org_123"
}
```

---

## Indexing Documents

### Index for Hybrid Search

```typescript
import { indexDocumentForHybridSearch } from '@/lib/rag/hybrid-search';

const chunks = [
  {
    id: 'doc-1-chunk-0',
    content: 'Introduction to authentication...',
    chunkIndex: 0,
  },
  {
    id: 'doc-1-chunk-1',
    content: 'Setting up Clerk...',
    chunkIndex: 1,
  },
];

await indexDocumentForHybridSearch('doc-1', chunks, organizationId);
// Indexes in both Upstash Vector AND Upstash Search
```

### Delete from Hybrid Search

```typescript
import { deleteDocumentFromHybridSearch } from '@/lib/rag/hybrid-search';

const chunkIds = ['doc-1-chunk-0', 'doc-1-chunk-1'];

await deleteDocumentFromHybridSearch('doc-1', chunkIds);
// Deletes from both indexes
```

---

## RRF Algorithm Explained

**Formula:**
```
RRF_score = Σ (weight / (k + rank))
```

Where:
- `k` = constant (60 by default)
- `rank` = position in search results (1, 2, 3...)
- `weight` = importance of each search type (0.7 for vector, 0.3 for text)

**Example:**

Document appears at:
- **Vector search**: Rank 2 (second result)
- **Text search**: Rank 5 (fifth result)

RRF Score calculation:
```
RRF = (0.7 / (60 + 2)) + (0.3 / (60 + 5))
    = (0.7 / 62) + (0.3 / 65)
    = 0.0113 + 0.0046
    = 0.0159
```

Documents found in **both** searches get higher scores than documents in only one.

---

## When to Use Hybrid vs Pure Vector

### Use Hybrid Search When:
- ✅ Users search with specific keywords ("Stripe API key", "error 404")
- ✅ You need both semantic and exact matching
- ✅ Documents have important technical terms
- ✅ You want best-in-class search quality

### Use Pure Vector Search When:
- ✅ Queries are conceptual ("How do I secure my app?")
- ✅ Semantic understanding is most important
- ✅ You want simplicity (only one index)
- ✅ Budget constraints (fewer API calls)

### Use Pure Text Search When:
- ✅ Exact keyword matching is critical
- ✅ You don't need semantic understanding
- ✅ Documents are highly structured
- ✅ Fast, lightweight search needed

---

## Tuning Weights

### Adjust Based on Use Case:

**Code Documentation (favor keywords):**
```typescript
{
  vectorWeight: 0.4,  // Less semantic
  textWeight: 0.6     // More keywords
}
```

**General Knowledge Base (favor semantics):**
```typescript
{
  vectorWeight: 0.8,  // More semantic
  textWeight: 0.2     // Less keywords
}
```

**Balanced (default):**
```typescript
{
  vectorWeight: 0.7,  // Slightly favor semantics
  textWeight: 0.3     // Supplement with keywords
}
```

---

## Performance Considerations

### Parallel Execution

Both searches run **in parallel** (not sequential):
```typescript
const [vectorResults, textResults] = await Promise.all([
  searchVectorSimilarity(...),
  searchDocuments(...),
]);
// Total time = max(vector_time, text_time)
```

### Cost Optimization

**Upstash Vector:**
- Pay per query (~$0.0001 per query)
- 1,536-dimension embeddings

**Upstash Search:**
- Pay per query (~$0.00005 per query)
- Free tier: 10,000 queries/month

**OpenAI Embeddings:**
- text-embedding-3-small: $0.02 / 1M tokens
- Average query: ~10 tokens = $0.0000002

**Total per query:** ~$0.00015 (very affordable)

### Caching Strategy

Cache frequent queries in Redis:
```typescript
import { redis } from '@/lib/redis';

const cacheKey = `hybrid:${organizationId}:${query}`;

// Check cache
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Perform search
const results = await hybridSearch(...);

// Cache for 1 hour
await redis.set(cacheKey, JSON.stringify(results), { ex: 3600 });
```

---

## Testing

```typescript
// Test vector search only
const vectorResults = await searchVectorSimilarity(query, orgId);

// Test text search only
const textResults = await searchDocuments(query, { orgId });

// Test hybrid
const hybridResults = await hybridSearch(query, orgId);

// Compare result counts
console.log({
  vector: vectorResults.length,
  text: textResults.length,
  hybrid: hybridResults.length,
});
```

---

## Troubleshooting

### No results found

**Check:**
1. Documents are indexed in both Vector and Search
2. organizationId matches
3. Minimum score threshold isn't too high
4. Index has data (use `getSearchIndexInfo()`)

### Poor result quality

**Try:**
1. Adjust weights (vectorWeight, textWeight)
2. Increase topK to fetch more candidates
3. Lower minScore threshold
4. Check document chunking quality

### Slow performance

**Optimize:**
1. Reduce topK values (default 20 is good)
2. Add Redis caching for common queries
3. Use background indexing (QStash)
4. Batch embed multiple documents

---

## Complete Example

```typescript
import {
  indexDocumentForHybridSearch,
  hybridSearch,
  getHybridRAGContext,
} from '@/lib/rag/hybrid-search';

// 1. Index a document
const chunks = [
  { id: 'doc-1-0', content: 'Stripe setup guide...', chunkIndex: 0 },
  { id: 'doc-1-1', content: 'API keys configuration...', chunkIndex: 1 },
];

await indexDocumentForHybridSearch('doc-1', chunks, 'org_123');

// 2. Search
const results = await hybridSearch('stripe API key setup', 'org_123', {
  vectorWeight: 0.6,
  textWeight: 0.4,
});

console.log(results[0]);
// {
//   id: 'doc-1-1',
//   content: 'API keys configuration...',
//   score: 0.89,
//   source: 'both'
// }

// 3. Get RAG context for LLM
const context = await getHybridRAGContext(
  'How to configure Stripe API keys?',
  'org_123',
  3
);

// 4. Send to LLM
const systemPrompt = `Use this context to answer:\n\n${context}`;
```

---

## Migration from Pure Vector

If you're currently using only vector search:

```typescript
// Before (pure vector)
import { searchVectorSimilarity } from '@/lib/rag/vector-search';
const results = await searchVectorSimilarity(query, orgId);

// After (hybrid)
import { hybridSearch } from '@/lib/rag/hybrid-search';
const results = await hybridSearch(query, orgId);

// Results have same structure + extra fields (vectorScore, textScore, source)
```

**Backward compatible** - just add text indexing when you create documents.

---

## Resources

- [Upstash Vector Docs](https://upstash.com/docs/vector/overall/getstarted)
- [Upstash Search Docs](https://upstash.com/docs/search/overall/getstarted)
- [RRF Algorithm Paper](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)
- [BM25 Ranking](https://en.wikipedia.org/wiki/Okapi_BM25)

---

**Last Updated:** 2025-10-11
**Version:** 1.0.0
