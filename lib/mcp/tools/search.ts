/**
 * Search Tool
 *
 * Provides web and document search capabilities.
 * Integrates with Brave Search API and RAG system for document search.
 */

import { MCPTool, MCPToolResult, MCPToolExecutionContext, SearchToolArgs } from '../types';
import { searchSimilarChunks } from '@/lib/rag';

/**
 * Search Tool Implementation
 */
export const searchTool: MCPTool = {
  schema: {
    name: 'search',
    description: 'Search the web or internal documents for information',
    parameters: {
      query: {
        type: 'string',
        description: 'The search query',
        required: true,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10)',
        default: 10,
      },
      searchType: {
        type: 'string',
        description: 'Type of search to perform',
        default: 'web',
        enum: ['web', 'documents'],
      },
    },
  },

  async execute(
    args: Record<string, unknown>,
    context: MCPToolExecutionContext
  ): Promise<MCPToolResult> {
    const { query, limit = 10, searchType = 'web' } = args as unknown as SearchToolArgs;

    try {
      if (searchType === 'web') {
        return await performWebSearch(query, limit as number);
      } else {
        return await performDocumentSearch(query, limit as number, context);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  },
};

/**
 * Perform web search (using Brave Search API if available)
 */
async function performWebSearch(query: string, limit: number): Promise<MCPToolResult> {
  const braveApiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!braveApiKey) {
    return {
      success: false,
      error: 'BRAVE_SEARCH_API_KEY not configured. Web search unavailable.',
    };
  }

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${limit}`,
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': braveApiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Brave Search API error: ${response.statusText}`);
    }

    const data = await response.json();

    const results = (data.web?.results || []).slice(0, limit).map((result: any) => ({
      title: result.title,
      url: result.url,
      description: result.description,
      age: result.age,
    }));

    return {
      success: true,
      data: {
        query,
        results,
        count: results.length,
      },
      metadata: {
        searchType: 'web',
        provider: 'brave',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Web search failed',
    };
  }
}

/**
 * Perform document search (semantic search in organization's documents)
 */
async function performDocumentSearch(
  query: string,
  limit: number,
  context: MCPToolExecutionContext
): Promise<MCPToolResult> {
  try {
    // Perform semantic search using RAG system
    const searchResults = await searchSimilarChunks(query, context.organizationId, {
      threshold: 0.7,
      limit: limit,
      includeDocumentMetadata: true,
    });

    // Format results for tool output
    const results = searchResults.map((result) => ({
      documentId: result.documentId,
      documentName: result.documentMetadata?.name || 'Unknown',
      content: result.content,
      chunkIndex: result.chunkIndex,
      similarity: result.similarity,
      relevancePercentage: (result.similarity * 100).toFixed(1) + '%',
    }));

    return {
      success: true,
      data: {
        query,
        results,
        count: results.length,
      },
      metadata: {
        searchType: 'documents',
        organizationId: context.organizationId,
        threshold: 0.7,
        averageSimilarity:
          results.length > 0
            ? (results.reduce((sum, r) => sum + r.similarity, 0) / results.length).toFixed(3)
            : 0,
      },
    };
  } catch (error) {
    console.error('Document search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Document search failed',
    };
  }
}
