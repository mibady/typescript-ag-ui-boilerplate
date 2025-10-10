/**
 * Document Chunking System
 *
 * Splits documents into chunks suitable for embedding and retrieval.
 * Uses token-based chunking with configurable overlap for context preservation.
 */

/**
 * Configuration for document chunking
 */
export const CHUNKING_CONFIG = {
  maxTokens: 512,
  overlapTokens: 50,
  minChunkLength: 50,
} as const;

/**
 * Chunk metadata
 */
export interface ChunkMetadata {
  chunkIndex: number;
  startPosition: number;
  endPosition: number;
  tokenCount: number;
  hasOverlap: boolean;
}

/**
 * Document chunk with metadata
 */
export interface DocumentChunk {
  content: string;
  metadata: ChunkMetadata;
}

/**
 * Split document into chunks
 *
 * @param content - Document content to chunk
 * @param options - Chunking options
 * @returns Array of document chunks with metadata
 *
 * @example
 * ```typescript
 * const chunks = chunkDocument(longText);
 * console.log(chunks.length); // Number of chunks
 * console.log(chunks[0].content); // First chunk content
 * console.log(chunks[0].metadata.chunkIndex); // 0
 * ```
 */
export function chunkDocument(
  content: string,
  options: {
    maxTokens?: number;
    overlapTokens?: number;
    minChunkLength?: number;
  } = {}
): DocumentChunk[] {
  const {
    maxTokens = CHUNKING_CONFIG.maxTokens,
    overlapTokens = CHUNKING_CONFIG.overlapTokens,
    minChunkLength = CHUNKING_CONFIG.minChunkLength,
  } = options;

  // Clean the content
  const cleanedContent = content.trim();

  if (cleanedContent.length === 0) {
    throw new Error('Cannot chunk empty content');
  }

  // If content is short enough, return as single chunk
  const estimatedTokens = estimateTokenCount(cleanedContent);
  if (estimatedTokens <= maxTokens) {
    return [
      {
        content: cleanedContent,
        metadata: {
          chunkIndex: 0,
          startPosition: 0,
          endPosition: cleanedContent.length,
          tokenCount: estimatedTokens,
          hasOverlap: false,
        },
      },
    ];
  }

  // Split into sentences for better chunk boundaries
  const sentences = splitIntoSentences(cleanedContent);
  const chunks: DocumentChunk[] = [];
  let currentChunk: string[] = [];
  let currentTokenCount = 0;
  let chunkStartPosition = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceTokens = estimateTokenCount(sentence);

    // If adding this sentence exceeds max tokens, save current chunk
    if (currentTokenCount + sentenceTokens > maxTokens && currentChunk.length > 0) {
      const chunkContent = currentChunk.join(' ');

      // Only save if chunk meets minimum length
      if (chunkContent.length >= minChunkLength) {
        chunks.push({
          content: chunkContent,
          metadata: {
            chunkIndex: chunks.length,
            startPosition: chunkStartPosition,
            endPosition: chunkStartPosition + chunkContent.length,
            tokenCount: currentTokenCount,
            hasOverlap: chunks.length > 0,
          },
        });
      }

      // Start new chunk with overlap
      const overlapSize = Math.floor(currentChunk.length * (overlapTokens / maxTokens));
      currentChunk = overlapSize > 0 ? currentChunk.slice(-overlapSize) : [];
      currentTokenCount = estimateTokenCount(currentChunk.join(' '));
      chunkStartPosition += chunkContent.length - currentChunk.join(' ').length;
    }

    currentChunk.push(sentence);
    currentTokenCount += sentenceTokens;
  }

  // Add final chunk if it exists
  if (currentChunk.length > 0) {
    const chunkContent = currentChunk.join(' ');
    if (chunkContent.length >= minChunkLength) {
      chunks.push({
        content: chunkContent,
        metadata: {
          chunkIndex: chunks.length,
          startPosition: chunkStartPosition,
          endPosition: chunkStartPosition + chunkContent.length,
          tokenCount: currentTokenCount,
          hasOverlap: chunks.length > 0,
        },
      });
    }
  }

  return chunks;
}

/**
 * Split text into sentences
 *
 * @param text - Text to split
 * @returns Array of sentences
 */
function splitIntoSentences(text: string): string[] {
  // Split on sentence boundaries (., !, ?) followed by whitespace
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return sentences;
}

/**
 * Estimate token count for text
 *
 * Uses a simple heuristic: ~4 characters per token (average for English)
 * This is approximate and should be replaced with proper tokenization
 * (like tiktoken) for production use with exact token limits.
 *
 * @param text - Text to estimate
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
  // Simple heuristic: ~4 characters per token
  // For more accuracy, use tiktoken library
  return Math.ceil(text.length / 4);
}

/**
 * Chunk multiple documents
 *
 * @param documents - Array of documents to chunk
 * @param options - Chunking options
 * @returns Map of document ID to chunks
 *
 * @example
 * ```typescript
 * const docs = [
 *   { id: 'doc1', content: 'Long text 1...' },
 *   { id: 'doc2', content: 'Long text 2...' }
 * ];
 * const chunksMap = chunkDocuments(docs);
 * console.log(chunksMap.get('doc1')); // Chunks for doc1
 * ```
 */
export function chunkDocuments(
  documents: Array<{ id: string; content: string }>,
  options?: {
    maxTokens?: number;
    overlapTokens?: number;
    minChunkLength?: number;
  }
): Map<string, DocumentChunk[]> {
  const chunksMap = new Map<string, DocumentChunk[]>();

  for (const doc of documents) {
    try {
      const chunks = chunkDocument(doc.content, options);
      chunksMap.set(doc.id, chunks);
    } catch (error) {
      console.error(`Error chunking document ${doc.id}:`, error);
      // Continue with other documents
    }
  }

  return chunksMap;
}

/**
 * Validate chunk configuration
 *
 * @param options - Configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateChunkingConfig(options: {
  maxTokens?: number;
  overlapTokens?: number;
  minChunkLength?: number;
}): void {
  const { maxTokens, overlapTokens, minChunkLength } = options;

  if (maxTokens !== undefined && maxTokens <= 0) {
    throw new Error('maxTokens must be greater than 0');
  }

  if (overlapTokens !== undefined && overlapTokens < 0) {
    throw new Error('overlapTokens must be non-negative');
  }

  if (minChunkLength !== undefined && minChunkLength < 0) {
    throw new Error('minChunkLength must be non-negative');
  }

  if (
    maxTokens !== undefined &&
    overlapTokens !== undefined &&
    overlapTokens >= maxTokens
  ) {
    throw new Error('overlapTokens must be less than maxTokens');
  }
}
