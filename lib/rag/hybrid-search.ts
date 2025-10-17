/**
 * Hybrid Search with RRF (Reciprocal Rank Fusion)
 *
 * Combines semantic search (Upstash Vector) with keyword search (Upstash Search)
 * using the RRF algorithm to produce superior search results.
 *
 * Algorithm:
 * - Vector search: Finds semantically similar content
 * - Full-text search: Finds exact keyword matches with BM25 ranking
 * - RRF: Merges both rankings for optimal results
 */

import { searchVectorSimilarity, type VectorSearchResult } from './vector-search';
import { searchDocuments } from '@/lib/upstash/search';
import { createClient } from '@/lib/supabase-server';

export interface HybridSearchResult {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  score: number; // RRF combined score
  vectorScore?: number;
  textScore?: number;
  source: 'vector' | 'text' | 'both';
}

/**
 * Reciprocal Rank Fusion (RRF) scoring
 *
 * Formula: RRF_score = sum(1 / (k + rank_i))
 * where k is a constant (typically 60) and rank_i is the rank in each list
 */
function calculateRRFScore(
  ranks: Array<{ rank: number; weight: number }>,
  k: number = 60
): number {
  return ranks.reduce((sum, { rank, weight }) => {
    return sum + weight / (k + rank);
  }, 0);
}

/**
 * Perform hybrid search combining vector and full-text search
 */
export async function hybridSearch(
  query: string,
  organizationId: string,
  options: {
    vectorTopK?: number;
    textTopK?: number;
    minScore?: number;
    vectorWeight?: number; // Weight for vector search (0-1)
    textWeight?: number; // Weight for text search (0-1)
  } = {}
): Promise<HybridSearchResult[]> {
  const {
    vectorTopK = 20,
    textTopK = 20,
    minScore = 0,
    vectorWeight = 0.7, // Semantic search slightly favored
    textWeight = 0.3, // Keyword search as supplement
  } = options;

  try {
    // Run both searches in parallel
    const [vectorResults, textResults] = await Promise.all([
      // 1. Vector search (semantic similarity)
      searchVectorSimilarity(query, organizationId, vectorTopK).catch((err) => {
        console.error('Vector search failed:', err);
        return [];
      }),

      // 2. Full-text search (keyword matching)
      searchDocuments(query, {
        orgId: organizationId,
        limit: textTopK,
      }).catch((err) => {
        console.error('Text search failed:', err);
        return [];
      }),
    ]);

    // Create ranking maps
    const vectorRanks = new Map<string, number>();
    vectorResults.forEach((result: VectorSearchResult, index: number) => {
      vectorRanks.set(result.id, index + 1);
    });

    const textRanks = new Map<string, number>();
    (textResults as any[]).forEach((result: any, index: number) => {
      textRanks.set(result.id, index + 1);
    });

    // Get all unique document IDs
    const allIds = new Set([
      ...vectorResults.map((r: VectorSearchResult) => r.id),
      ...(textResults as any[]).map((r: any) => r.id),
    ]);

    // Calculate RRF scores
    const rrfScores = new Map<string, number>();
    const sources = new Map<string, 'vector' | 'text' | 'both'>();

    for (const id of allIds) {
      const ranks = [];

      const vectorRank = vectorRanks.get(id);
      const textRank = textRanks.get(id);

      if (vectorRank !== undefined) {
        ranks.push({ rank: vectorRank, weight: vectorWeight });
      }

      if (textRank !== undefined) {
        ranks.push({ rank: textRank, weight: textWeight });
      }

      const score = calculateRRFScore(ranks);
      rrfScores.set(id, score);

      // Determine source
      if (vectorRank !== undefined && textRank !== undefined) {
        sources.set(id, 'both');
      } else if (vectorRank !== undefined) {
        sources.set(id, 'vector');
      } else {
        sources.set(id, 'text');
      }
    }

    // Filter by minimum score
    const filteredIds = Array.from(allIds).filter(
      (id) => rrfScores.get(id)! >= minScore
    );

    if (filteredIds.length === 0) {
      return [];
    }

    // Fetch full content from Supabase
    const supabase = await createClient();

    const { data: chunks, error } = await supabase
      .from('document_chunks')
      .select('id, document_id, chunk_index, content')
      .in('id', filteredIds)
      .eq('organization_id', organizationId);

    if (error || !chunks) {
      console.error('Error fetching chunks:', error);
      return [];
    }

    // Build final results
    const results: HybridSearchResult[] = chunks.map((chunk) => {
      const vectorResult = vectorResults.find((v: VectorSearchResult) => v.id === chunk.id);
      const textResult = (textResults as any[]).find((t: any) => t.id === chunk.id);

      return {
        id: chunk.id,
        documentId: chunk.document_id,
        chunkIndex: chunk.chunk_index,
        content: chunk.content,
        score: rrfScores.get(chunk.id)!,
        vectorScore: vectorResult?.score,
        textScore: textResult?.score,
        source: sources.get(chunk.id)!,
      };
    });

    // Sort by RRF score descending
    results.sort((a, b) => b.score - a.score);

    return results;
  } catch (error) {
    console.error('Error in hybrid search:', error);
    throw new Error('Hybrid search failed');
  }
}

/**
 * Get RAG context using hybrid search
 */
export async function getHybridRAGContext(
  query: string,
  organizationId: string,
  maxChunks: number = 5
): Promise<string> {
  const results = await hybridSearch(query, organizationId, {
    vectorTopK: 20,
    textTopK: 20,
    vectorWeight: 0.7,
    textWeight: 0.3,
  });

  if (results.length === 0) {
    return 'No relevant context found.';
  }

  // Take top N chunks
  const topResults = results.slice(0, maxChunks);

  // Format context with scores
  const contextParts = topResults.map((result, index) => {
    const score = (result.score * 100).toFixed(1);
    const sources = [];

    if (result.vectorScore !== undefined) {
      sources.push(`Vector: ${(result.vectorScore * 100).toFixed(0)}%`);
    }

    if (result.textScore !== undefined) {
      sources.push(`Text: ${(result.textScore * 100).toFixed(0)}%`);
    }

    const sourceInfo = sources.length > 0 ? ` [${sources.join(', ')}]` : '';

    return `[${index + 1}] (Combined Score: ${score}%)${sourceInfo}:\n${result.content}`;
  });

  return contextParts.join('\n\n---\n\n');
}

/**
 * Index document for both vector and full-text search
 */
export async function indexDocumentForHybridSearch(
  documentId: string,
  chunks: Array<{ id: string; content: string; chunkIndex: number }>,
  organizationId: string
): Promise<void> {
  const { indexDocument: indexTextDocument } = await import('../upstash/search');
  const { ingestDocumentChunks } = await import('./vector-search');

  try {
    // Index in both systems in parallel
    await Promise.all([
      // 1. Index in Upstash Vector (for semantic search)
      ingestDocumentChunks(
        documentId,
        chunks.map((c) => ({ content: c.content, chunkIndex: c.chunkIndex })),
        organizationId
      ),

      // 2. Index in Upstash Search (for full-text search)
      Promise.all(
        chunks.map((chunk) =>
          indexTextDocument(chunk.id, chunk.content, {
            documentId,
            orgId: organizationId,
            chunkIndex: chunk.chunkIndex.toString(),
          })
        )
      ),
    ]);

    console.log(
      `Indexed ${chunks.length} chunks for hybrid search (document ${documentId})`
    );
  } catch (error) {
    console.error('Error indexing document for hybrid search:', error);
    throw new Error('Failed to index document for hybrid search');
  }
}

/**
 * Delete document from both vector and full-text indexes
 */
export async function deleteDocumentFromHybridSearch(
  documentId: string,
  chunkIds: string[]
): Promise<void> {
  const { deleteDocument: deleteTextDocument } = await import(
    '../upstash/search'
  );
  const { deleteDocumentVectors } = await import('./vector-search');

  try {
    await Promise.all([
      // 1. Delete from Upstash Vector
      deleteDocumentVectors(documentId, chunkIds.length),

      // 2. Delete from Upstash Search
      Promise.all(chunkIds.map((id) => deleteTextDocument(id))),
    ]);

    console.log(`Deleted document ${documentId} from hybrid search indexes`);
  } catch (error) {
    console.error('Error deleting document from hybrid search:', error);
    throw new Error('Failed to delete document from hybrid search');
  }
}
