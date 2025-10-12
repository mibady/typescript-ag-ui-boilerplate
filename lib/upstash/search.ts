/**
 * Upstash Search Client
 *
 * Serverless full-text search with BM25 ranking, typo tolerance, and faceting.
 * Used for keyword-based document search in hybrid search scenarios.
 */

// @ts-ignore - Upstash Search types may not be complete
import Search from '@upstash/search';

if (!process.env.UPSTASH_SEARCH_REST_URL) {
  throw new Error('UPSTASH_SEARCH_REST_URL is not defined');
}

if (!process.env.UPSTASH_SEARCH_REST_TOKEN) {
  throw new Error('UPSTASH_SEARCH_REST_TOKEN is not defined');
}

// Initialize Upstash Search index
export const searchIndex = new Search({
  url: process.env.UPSTASH_SEARCH_REST_URL,
  token: process.env.UPSTASH_SEARCH_REST_TOKEN,
});

/**
 * Index a document for full-text search
 */
export async function indexDocument(
  id: string,
  text: string,
  metadata?: {
    documentId?: string;
    orgId?: string;
    title?: string;
    category?: string;
    [key: string]: any;
  }
) {
  return searchIndex.upsert({
    id,
    data: text,
    metadata: metadata || {},
  });
}

/**
 * Search documents with full-text search
 */
export async function searchDocuments(
  query: string,
  options?: {
    orgId?: string;
    filters?: Record<string, string>;
    limit?: number;
    offset?: number;
  }
) {
  const filters: Record<string, string> = options?.filters || {};

  // Add org filter if provided
  if (options?.orgId) {
    filters.orgId = options.orgId;
  }

  return searchIndex.search(query, {
    filters: Object.keys(filters).length > 0 ? filters : undefined,
    limit: options?.limit || 10,
    offset: options?.offset || 0,
  });
}

/**
 * Delete a document from the search index
 */
export async function deleteDocument(id: string) {
  return searchIndex.delete(id);
}

/**
 * Bulk index multiple documents
 */
export async function bulkIndexDocuments(
  documents: Array<{
    id: string;
    text: string;
    metadata?: Record<string, any>;
  }>
) {
  const promises = documents.map((doc) =>
    indexDocument(doc.id, doc.text, doc.metadata)
  );

  return Promise.all(promises);
}

/**
 * Get index statistics
 */
export async function getSearchIndexInfo() {
  return searchIndex.info();
}
