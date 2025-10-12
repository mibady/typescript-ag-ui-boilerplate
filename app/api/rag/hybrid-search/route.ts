/**
 * Hybrid Search API
 *
 * Combines semantic (vector) and keyword (full-text) search
 * using Reciprocal Rank Fusion (RRF) algorithm.
 *
 * POST /api/rag/hybrid-search
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { hybridSearch, getHybridRAGContext } from '@/lib/rag/hybrid-search';

/**
 * POST /api/rag/hybrid-search
 * Perform hybrid search across documents
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      query,
      vectorTopK = 20,
      textTopK = 20,
      minScore = 0,
      vectorWeight = 0.7,
      textWeight = 0.3,
      returnContext = false,
      maxChunks = 5,
    } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Perform hybrid search
    if (returnContext) {
      // Return formatted context for RAG
      const context = await getHybridRAGContext(query, orgId, maxChunks);

      return NextResponse.json({
        context,
        query,
        organizationId: orgId,
      });
    } else {
      // Return detailed search results
      const results = await hybridSearch(query, orgId, {
        vectorTopK,
        textTopK,
        minScore,
        vectorWeight,
        textWeight,
      });

      return NextResponse.json({
        results,
        query,
        organizationId: orgId,
        resultCount: results.length,
      });
    }
  } catch (error) {
    console.error('Error in hybrid search API:', error);
    return NextResponse.json(
      {
        error: 'Hybrid search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
