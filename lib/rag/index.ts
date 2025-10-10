/**
 * RAG (Retrieval-Augmented Generation) System
 *
 * Provides semantic search and context retrieval for AI agents.
 * Exports all RAG functionality including embeddings, chunking, and search.
 */

// Embeddings
export {
  generateEmbedding,
  generateEmbeddings,
  cosineSimilarity,
  EMBEDDING_CONFIG,
} from './embeddings';

// Chunking
export {
  chunkDocument,
  chunkDocuments,
  estimateTokenCount,
  validateChunkingConfig,
  CHUNKING_CONFIG,
  type DocumentChunk,
  type ChunkMetadata,
} from './chunking';

// Search
export {
  searchSimilarChunks,
  searchByDocument,
  getContextForQuery,
  findSimilarDocuments,
  type SearchResult,
  type SearchOptions,
} from './search';
