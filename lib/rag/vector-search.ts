/**
 * Vector Search with Upstash Vector
 * 
 * Semantic search using Upstash Vector database.
 * Provides fast similarity search for RAG system.
 */

import { vectorIndex, querySimilarVectors, upsertVector } from '../upstash/vector';
import { generateEmbedding, generateEmbeddings } from './embeddings';
import { createClient } from '../supabase-server';

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: {
    documentId: string;
    chunkIndex: number;
    orgId: string;
    content?: string;
    [key: string]: any;
  };
}

/**
 * Ingest document chunks into Upstash Vector
 */
export async function ingestDocumentChunks(
  documentId: string,
  chunks: Array<{ content: string; chunkIndex: number }>,
  organizationId: string
): Promise<void> {
  try {
    // Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(chunks.map(c => c.content));

    // Upsert vectors in parallel
    const upsertPromises = chunks.map((chunk, index) => {
      const vectorId = `${documentId}-${chunk.chunkIndex}`;
      
      return upsertVector(vectorId, embeddings[index], {
        documentId,
        chunkIndex: chunk.chunkIndex,
        orgId: organizationId,
        content: chunk.content.substring(0, 200), // Store preview
      });
    });

    await Promise.all(upsertPromises);
    
    console.log(`Ingested ${chunks.length} chunks for document ${documentId}`);
  } catch (error) {
    console.error('Error ingesting document chunks:', error);
    throw new Error('Failed to ingest document chunks into vector database');
  }
}

/**
 * Search for similar chunks using vector similarity
 */
export async function searchVectorSimilarity(
  query: string,
  organizationId: string,
  topK: number = 10
): Promise<VectorSearchResult[]> {
  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Query Upstash Vector
    const results = await querySimilarVectors(
      queryEmbedding,
      organizationId,
      topK,
      true
    );

    return results.map(result => ({
      id: String(result.id),
      score: result.score,
      metadata: result.metadata as any,
    }));
  } catch (error) {
    console.error('Error in vector search:', error);
    throw new Error('Vector search failed');
  }
}

/**
 * Hybrid search: Combine vector search with full-text search
 */
export async function hybridSearch(
  query: string,
  organizationId: string,
  options: {
    vectorTopK?: number;
    textLimit?: number;
    minScore?: number;
  } = {}
): Promise<Array<{
  documentId: string;
  chunkIndex: number;
  content: string;
  score: number;
  source: 'vector' | 'text' | 'both';
}>> {
  const {
    vectorTopK = 10,
    textLimit = 10,
    minScore = 0.7,
  } = options;

  try {
    // 1. Vector search (semantic)
    const vectorResults = await searchVectorSimilarity(query, organizationId, vectorTopK);

    // 2. Get full content from Supabase for vector results
    const vectorChunkIds = vectorResults
      .filter(r => r.score >= minScore)
      .map(r => r.id);

    if (vectorChunkIds.length === 0) {
      return [];
    }

    const supabase = await createClient();
    
    const { data: chunks, error } = await supabase
      .from('document_chunks')
      .select('id, document_id, chunk_index, content')
      .in('id', vectorChunkIds)
      .eq('organization_id', organizationId);

    if (error || !chunks) {
      console.error('Error fetching chunks:', error);
      return [];
    }

    // 3. Merge results
    const results = chunks.map(chunk => {
      const vectorResult = vectorResults.find(v => v.id === chunk.id);
      
      return {
        documentId: chunk.document_id,
        chunkIndex: chunk.chunk_index,
        content: chunk.content,
        score: vectorResult?.score || 0,
        source: 'vector' as const,
      };
    });

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results;
  } catch (error) {
    console.error('Error in hybrid search:', error);
    throw new Error('Hybrid search failed');
  }
}

/**
 * Get context for RAG from search results
 */
export async function getRAGContext(
  query: string,
  organizationId: string,
  maxChunks: number = 5
): Promise<string> {
  const results = await hybridSearch(query, organizationId, {
    vectorTopK: maxChunks,
    minScore: 0.6,
  });

  if (results.length === 0) {
    return 'No relevant context found.';
  }

  // Format context
  const contextParts = results.map((result, index) => {
    const score = (result.score * 100).toFixed(1);
    return `[${index + 1}] (${score}% relevant):\n${result.content}`;
  });

  return contextParts.join('\n\n---\n\n');
}

/**
 * Delete document vectors from Upstash Vector
 */
export async function deleteDocumentVectors(
  documentId: string,
  chunkCount: number
): Promise<void> {
  try {
    // Delete all chunk vectors for this document
    const deletePromises = [];
    for (let i = 0; i < chunkCount; i++) {
      const vectorId = `${documentId}-${i}`;
      deletePromises.push(
        vectorIndex.delete(vectorId).catch(err => {
          console.warn(`Failed to delete vector ${vectorId}:`, err);
        })
      );
    }

    await Promise.all(deletePromises);
    console.log(`Deleted ${chunkCount} vectors for document ${documentId}`);
  } catch (error) {
    console.error('Error deleting document vectors:', error);
    throw new Error('Failed to delete document vectors');
  }
}
