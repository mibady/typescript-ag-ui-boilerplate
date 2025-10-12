/**
 * Upstash Vector Client
 * 
 * Serverless vector database for semantic search and RAG.
 * Used for storing and querying document embeddings.
 */

import { Index } from '@upstash/vector';

if (!process.env.UPSTASH_VECTOR_REST_URL) {
  throw new Error('UPSTASH_VECTOR_REST_URL is not defined');
}

if (!process.env.UPSTASH_VECTOR_REST_TOKEN) {
  throw new Error('UPSTASH_VECTOR_REST_TOKEN is not defined');
}

// Initialize Upstash Vector index
export const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

/**
 * Store a vector embedding with metadata
 */
export async function upsertVector(
  id: string,
  vector: number[],
  metadata: {
    documentId: string;
    chunkIndex: number;
    orgId: string;
    content?: string;
    [key: string]: any;
  }
) {
  return vectorIndex.upsert({
    id,
    vector,
    metadata,
  });
}

/**
 * Query similar vectors
 */
export async function querySimilarVectors(
  queryVector: number[],
  orgId: string,
  topK: number = 5,
  includeMetadata: boolean = true
) {
  return vectorIndex.query({
    vector: queryVector,
    topK,
    filter: `orgId = '${orgId}'`,
    includeMetadata,
  });
}

/**
 * Delete vectors by document ID
 * Uses ID-based deletion with naming convention: `${documentId}-${chunkIndex}`
 */
export async function deleteVectorsByDocument(
  documentId: string,
  chunkCount: number
) {
  try {
    // Generate vector IDs based on naming convention
    const vectorIds = Array.from({ length: chunkCount }, (_, i) =>
      `${documentId}-${i}`
    );

    // Delete vectors individually
    const deletePromises = vectorIds.map(id =>
      vectorIndex.delete(id).catch(err => {
        console.error(`Failed to delete vector ${id}:`, err);
        return null;
      })
    );

    await Promise.all(deletePromises);
    console.log(`Deleted ${chunkCount} vectors for document ${documentId}`);
  } catch (error) {
    console.error(`Error deleting vectors for document ${documentId}:`, error);
    throw error;
  }
}

/**
 * Fetch vector by ID
 */
export async function fetchVector(id: string) {
  return vectorIndex.fetch([id]);
}

/**
 * Get index stats
 */
export async function getIndexStats() {
  return vectorIndex.info();
}
