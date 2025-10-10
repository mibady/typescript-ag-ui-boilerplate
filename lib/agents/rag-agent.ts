/**
 * RAG Agent
 *
 * AI agent with Retrieval-Augmented Generation capabilities.
 * Automatically retrieves relevant context from the knowledge base
 * before generating responses.
 */

import { BaseAgent, type AgentConfig, type AgentExecutionContext, type AgentResponse } from './base-agent';
import { getContextForQuery, searchSimilarChunks, type SearchOptions } from '@/lib/rag';
import type { CoreMessage } from 'ai';

/**
 * RAG Agent configuration
 */
export interface RAGAgentConfig extends AgentConfig {
  /** Search threshold for relevance (0-1) */
  searchThreshold?: number;
  /** Maximum number of context chunks */
  maxContextChunks?: number;
  /** Whether to include document metadata in responses */
  includeSourceMetadata?: boolean;
}

/**
 * RAG Agent with context retrieval
 */
export class RAGAgent extends BaseAgent {
  private searchThreshold: number;
  private maxContextChunks: number;
  private includeSourceMetadata: boolean;

  constructor(config: RAGAgentConfig = {}) {
    super('rag-agent', {
      ...config,
      systemPrompt:
        config.systemPrompt ||
        `You are an AI assistant with access to a knowledge base.
When answering questions, use the provided context from the knowledge base.
Always cite your sources when using information from the context.
If the context doesn't contain relevant information, say so clearly.`,
    });

    this.searchThreshold = config.searchThreshold ?? 0.7;
    this.maxContextChunks = config.maxContextChunks ?? 5;
    this.includeSourceMetadata = config.includeSourceMetadata ?? true;
  }

  /**
   * Execute agent with RAG context retrieval
   */
  async execute(context: AgentExecutionContext): Promise<AgentResponse> {
    // Retrieve context before execution
    const enhancedContext = await this.enhanceWithContext(context);

    // Execute with enhanced context
    return super.execute(enhancedContext);
  }

  /**
   * Execute agent with streaming and RAG context retrieval
   */
  async executeStream(
    context: AgentExecutionContext,
    onChunk?: (chunk: string) => void
  ): Promise<AgentResponse> {
    // Retrieve context before streaming
    const enhancedContext = await this.enhanceWithContext(context);

    // Stream with enhanced context
    return super.executeStream(enhancedContext, onChunk);
  }

  /**
   * Enhance context with knowledge base retrieval
   */
  private async enhanceWithContext(
    context: AgentExecutionContext
  ): Promise<AgentExecutionContext> {
    try {
      // Get the last user message as query
      const lastMessage = context.messages[context.messages.length - 1];
      if (lastMessage.role !== 'user') {
        return context;
      }

      // Extract text content from the message
      let query: string;
      if (typeof lastMessage.content === 'string') {
        query = lastMessage.content;
      } else if (Array.isArray(lastMessage.content)) {
        // Handle multi-part content (text + images)
        query = lastMessage.content
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join(' ');
      } else {
        return context;
      }

      if (!query || query.trim().length === 0) {
        return context;
      }

      // Search knowledge base
      const searchOptions: SearchOptions = {
        threshold: this.searchThreshold,
        limit: this.maxContextChunks,
        includeDocumentMetadata: this.includeSourceMetadata,
      };

      const results = await searchSimilarChunks(
        query,
        context.organizationId,
        searchOptions
      );

      if (results.length === 0) {
        // No relevant context found
        return context;
      }

      // Format context for LLM
      const contextParts: string[] = [];

      contextParts.push('=== KNOWLEDGE BASE CONTEXT ===\n');
      contextParts.push(
        `Found ${results.length} relevant document${results.length !== 1 ? 's' : ''}:\n`
      );

      for (const [index, result] of results.entries()) {
        const docName = result.documentMetadata?.name || 'Unknown Document';
        const similarity = (result.similarity * 100).toFixed(1);

        contextParts.push(`\n[Source ${index + 1}] ${docName} (${similarity}% relevant)`);
        contextParts.push(result.content);
        contextParts.push('');
      }

      contextParts.push('\n=== END CONTEXT ===\n');
      contextParts.push(
        'Use the above context to answer the following question. Cite sources when possible.\n'
      );
      contextParts.push(`Question: ${query}`);

      const contextMessage = contextParts.join('\n');

      // Note: AG-UI event emission would go here if needed
      // Can be implemented with emitToolCallStart/Complete from base-agent

      // Replace last message with enhanced version
      const enhancedMessages = [...context.messages];
      enhancedMessages[enhancedMessages.length - 1] = {
        ...lastMessage,
        content: contextMessage,
      };

      return {
        ...context,
        messages: enhancedMessages,
      };
    } catch (error) {
      console.error('Error enhancing context with RAG:', error);
      // Return original context if RAG fails
      return context;
    }
  }

  /**
   * Search knowledge base directly
   *
   * @param query - Search query
   * @param organizationId - Organization ID
   * @param options - Search options
   * @returns Search results
   */
  async search(
    query: string,
    organizationId: string,
    options?: SearchOptions
  ) {
    return searchSimilarChunks(query, organizationId, {
      threshold: this.searchThreshold,
      limit: this.maxContextChunks,
      includeDocumentMetadata: this.includeSourceMetadata,
      ...options,
    });
  }

  /**
   * Get formatted context string for a query
   *
   * @param query - Search query
   * @param organizationId - Organization ID
   * @returns Formatted context string
   */
  async getContext(query: string, organizationId: string): Promise<string> {
    return getContextForQuery(query, organizationId, {
      threshold: this.searchThreshold,
      limit: this.maxContextChunks,
    });
  }
}
