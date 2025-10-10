/**
 * POST /api/rag/search
 *
 * Search for similar document chunks using semantic similarity.
 * Returns relevant context for a given query.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase-server';
import { searchSimilarChunks, getContextForQuery } from '@/lib/rag';

export const runtime = 'edge';

interface SearchRequest {
  query: string;
  threshold?: number;
  limit?: number;
  documentIds?: string[];
  format?: 'results' | 'context';
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: SearchRequest = await req.json();
    const {
      query,
      threshold = 0.7,
      limit = 10,
      documentIds,
      format = 'results',
    } = body;

    // Validate inputs
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    if (threshold < 0 || threshold > 1) {
      return NextResponse.json(
        { error: 'Threshold must be between 0 and 1' },
        { status: 400 }
      );
    }

    if (limit <= 0 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = await createClient();

    // Get organization ID from database
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('clerk_org_id', orgId)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const organizationId = orgData.id;

    // Perform search based on requested format
    if (format === 'context') {
      const context = await getContextForQuery(query, organizationId, {
        threshold,
        limit,
        documentIds,
      });

      return NextResponse.json({
        success: true,
        context,
        query,
      });
    }

    // Default: return structured results
    const results = await searchSimilarChunks(query, organizationId, {
      threshold,
      limit,
      documentIds,
      includeDocumentMetadata: true,
    });

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
      query,
      threshold,
    });
  } catch (error) {
    console.error('Error in /api/rag/search:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
