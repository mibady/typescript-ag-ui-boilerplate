/**
 * Embedding Generation Service
 *
 * Generates vector embeddings for text using OpenAI's text-embedding-3-small model.
 * Supports batching for efficient processing of multiple texts.
 */

import { openai } from '@ai-sdk/openai';
import { embed, embedMany } from 'ai';

/**
 * Configuration for embedding generation
 */
export const EMBEDDING_CONFIG = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  maxBatchSize: 100,
} as const;

/**
 * Generate embedding for a single text
 *
 * @param text - Text to embed
 * @returns Vector embedding (1536 dimensions)
 *
 * @example
 * ```typescript
 * const embedding = await generateEmbedding("Hello world");
 * console.log(embedding.length); // 1536
 * ```
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Clean and prepare text
    const cleanedText = cleanText(text);

    if (!cleanedText || cleanedText.trim().length === 0) {
      throw new Error('Cannot generate embedding for empty text');
    }

    // Generate embedding using Vercel AI SDK
    const { embedding } = await embed({
      model: openai.embedding(EMBEDDING_CONFIG.model),
      value: cleanedText,
    });

    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate embeddings for multiple texts in batch
 *
 * @param texts - Array of texts to embed
 * @returns Array of vector embeddings
 *
 * @example
 * ```typescript
 * const texts = ["Hello", "World", "AI"];
 * const embeddings = await generateEmbeddings(texts);
 * console.log(embeddings.length); // 3
 * console.log(embeddings[0].length); // 1536
 * ```
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    if (texts.length === 0) {
      return [];
    }

    // Clean all texts
    const cleanedTexts = texts.map(cleanText).filter(t => t.trim().length > 0);

    if (cleanedTexts.length === 0) {
      throw new Error('All texts are empty after cleaning');
    }

    // Handle single text case
    if (cleanedTexts.length === 1) {
      const embedding = await generateEmbedding(cleanedTexts[0]);
      return [embedding];
    }

    // Generate embeddings in batches
    const batches = chunkArray(cleanedTexts, EMBEDDING_CONFIG.maxBatchSize);
    const allEmbeddings: number[][] = [];

    for (const batch of batches) {
      const { embeddings } = await embedMany({
        model: openai.embedding(EMBEDDING_CONFIG.model),
        values: batch,
      });

      allEmbeddings.push(...embeddings);
    }

    return allEmbeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clean text before embedding generation
 *
 * @param text - Raw text
 * @returns Cleaned text
 */
function cleanText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove special control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Trim
    .trim();
}

/**
 * Split array into chunks of specified size
 *
 * @param array - Array to chunk
 * @param size - Chunk size
 * @returns Array of chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Calculate cosine similarity between two embeddings
 *
 * @param a - First embedding
 * @param b - Second embedding
 * @returns Similarity score (0-1, higher is more similar)
 *
 * @example
 * ```typescript
 * const embedding1 = await generateEmbedding("cat");
 * const embedding2 = await generateEmbedding("dog");
 * const similarity = cosineSimilarity(embedding1, embedding2);
 * console.log(similarity); // ~0.85 (similar concepts)
 * ```
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
