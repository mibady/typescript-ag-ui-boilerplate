/**
 * Similarity Search Functions
 *
 * Provides semantic search over document chunks using vector embeddings.
 * Uses Supabase pgvector for efficient similarity search.
 */

import { createClient } from '@/lib/supabase-server';
import { generateEmbedding } from './embeddings';

/**
 * Search result with similarity score
 */
export interface SearchResult {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  similarity: number;
  metadata?: Record<string, unknown>;
  documentMetadata?: {
    name?: string;
    contentType?: string;
    createdAt?: string;
  };
}

/**
 * Search options
 */
export interface SearchOptions {
  /** Minimum similarity threshold (0-1) */
  threshold?: number;
  /** Maximum number of results */
  limit?: number;
  /** Filter by document IDs */
  documentIds?: string[];
  /** Include document metadata */
  includeDocumentMetadata?: boolean;
}

/**
 * Default search configuration
 */
const DEFAULT_SEARCH_OPTIONS: Required<Omit<SearchOptions, 'documentIds'>> = {
  threshold: 0.7,
  limit: 10,
  includeDocumentMetadata: true,
};

/**
 * Search for similar document chunks using semantic similarity
 *
 * @param query - Search query text
 * @param organizationId - Organization ID for RLS
 * @param options - Search options
 * @returns Array of matching chunks with similarity scores
 *
 * @example
 * ```typescript
 * const results = await searchSimilarChunks(
 *   "How do I authenticate users?",
 *   "org_123",
 *   { threshold: 0.75, limit: 5 }
 * );
 *
 * for (const result of results) {
 *   console.log(`[${result.similarity.toFixed(2)}] ${result.content}`);
 * }
 * ```
 */
export async function searchSimilarChunks(
  query: string,
  organizationId: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  try {
    const {
      threshold = DEFAULT_SEARCH_OPTIONS.threshold,
      limit = DEFAULT_SEARCH_OPTIONS.limit,
      documentIds,
      includeDocumentMetadata = DEFAULT_SEARCH_OPTIONS.includeDocumentMetadata,
    } = options;

    // Validate inputs
    if (!query || query.trim().length === 0) {
      throw new Error('Query cannot be empty');
    }

    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Get Supabase client
    const supabase = await createClient();

    // Build the RPC call to the similarity search function
    let rpcCall = supabase.rpc('match_document_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      filter_org_id: organizationId,
    });

    // Execute the search
    const { data, error } = await rpcCall;

    if (error) {
      console.error('Similarity search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Format results
    let results: SearchResult[] = data.map((row: any) => ({
      id: row.id,
      documentId: row.document_id,
      content: row.content,
      chunkIndex: row.chunk_index,
      similarity: row.similarity,
    }));

    // Filter by document IDs if specified
    if (documentIds && documentIds.length > 0) {
      results = results.filter(r => documentIds.includes(r.documentId));
    }

    // Fetch document metadata if requested
    if (includeDocumentMetadata && results.length > 0) {
      const docIds = [...new Set(results.map(r => r.documentId))];

      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('id, name, content_type, created_at')
        .in('id', docIds);

      if (!docsError && docsData) {
        const docsMap = new Map<string, { name?: string; contentType?: string; createdAt?: string }>(
          docsData.map((doc: any) => [
            doc.id,
            {
              name: doc.name,
              contentType: doc.content_type,
              createdAt: doc.created_at,
            },
          ])
        );

        results = results.map(result => ({
          ...result,
          documentMetadata: docsMap.get(result.documentId) || undefined,
        }));
      }
    }

    return results;
  } catch (error) {
    console.error('Error in searchSimilarChunks:', error);
    throw error;
  }
}

/**
 * Search for similar chunks and group by document
 *
 * @param query - Search query text
 * @param organizationId - Organization ID for RLS
 * @param options - Search options
 * @returns Map of document ID to search results
 *
 * @example
 * ```typescript
 * const resultsByDoc = await searchByDocument(
 *   "authentication",
 *   "org_123"
 * );
 *
 * for (const [docId, results] of resultsByDoc.entries()) {
 *   console.log(`Document: ${results[0].documentMetadata?.name}`);
 *   console.log(`Matches: ${results.length}`);
 * }
 * ```
 */
export async function searchByDocument(
  query: string,
  organizationId: string,
  options: SearchOptions = {}
): Promise<Map<string, SearchResult[]>> {
  const results = await searchSimilarChunks(query, organizationId, options);

  const grouped = new Map<string, SearchResult[]>();

  for (const result of results) {
    const existing = grouped.get(result.documentId) || [];
    existing.push(result);
    grouped.set(result.documentId, existing);
  }

  // Sort results within each document by similarity
  for (const [docId, docResults] of grouped.entries()) {
    grouped.set(
      docId,
      docResults.sort((a, b) => b.similarity - a.similarity)
    );
  }

  return grouped;
}

/**
 * Get context for a query by retrieving and formatting similar chunks
 *
 * @param query - Search query text
 * @param organizationId - Organization ID for RLS
 * @param options - Search options
 * @returns Formatted context string for LLM
 *
 * @example
 * ```typescript
 * const context = await getContextForQuery(
 *   "How do I set up authentication?",
 *   "org_123",
 *   { limit: 5 }
 * );
 *
 * // Use context in LLM prompt
 * const prompt = `Context:\n${context}\n\nQuestion: ${query}`;
 * ```
 */
export async function getContextForQuery(
  query: string,
  organizationId: string,
  options: SearchOptions = {}
): Promise<string> {
  const results = await searchSimilarChunks(query, organizationId, {
    ...options,
    includeDocumentMetadata: true,
  });

  if (results.length === 0) {
    return 'No relevant context found.';
  }

  // Format results as context
  const contextParts = results.map((result, index) => {
    const docName = result.documentMetadata?.name || 'Unknown Document';
    const similarity = (result.similarity * 100).toFixed(1);

    return `[${index + 1}] ${docName} (${similarity}% relevant):\n${result.content}`;
  });

  return contextParts.join('\n\n---\n\n');
}

/**
 * Find documents similar to a given document
 *
 * @param documentId - Source document ID
 * @param organizationId - Organization ID for RLS
 * @param options - Search options
 * @returns Array of similar documents
 *
 * @example
 * ```typescript
 * const similar = await findSimilarDocuments(
 *   "doc_123",
 *   "org_123",
 *   { limit: 5 }
 * );
 * ```
 */
export async function findSimilarDocuments(
  documentId: string,
  organizationId: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const supabase = await createClient();

  // Get the document content
  const { data: docData, error: docError } = await supabase
    .from('documents')
    .select('content')
    .eq('id', documentId)
    .eq('organization_id', organizationId)
    .single();

  if (docError || !docData) {
    throw new Error('Document not found');
  }

  // Validate document content
  const content = (docData.content || '').toString().trim();
  if (content.length === 0) {
    throw new Error('Document has no content for similarity search');
  }

  // Search using the document's content
  const results = await searchSimilarChunks(
    content,
    organizationId,
    options
  );

  // Exclude chunks from the source document
  return results.filter(r => r.documentId !== documentId);
}
