/**
 * GET /api/rag/documents
 *
 * List all documents for the current organization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase-server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get Supabase client
    const supabase = await createClient();

    // Get organization ID
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

    // Fetch documents with chunk count
    const { data, error } = await supabase
      .from('documents')
      .select(`
        id,
        name,
        content_type,
        size_bytes,
        metadata,
        created_at,
        users:user_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    // Get chunk counts for each document
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const documentIds = data.map((d: any) => d.id);

    const { data: chunkCounts, error: chunkError } = await supabase
      .from('document_chunks')
      .select('document_id')
      .in('document_id', documentIds);

    if (chunkError) {
      console.error('Error fetching chunk counts:', chunkError);
    }

    // Count chunks per document
    const chunkCountMap = new Map<string, number>();
    if (chunkCounts) {
      for (const chunk of chunkCounts) {
        const count = chunkCountMap.get(chunk.document_id) || 0;
        chunkCountMap.set(chunk.document_id, count + 1);
      }
    }

    // Format response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const documents = data.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      contentType: doc.content_type,
      sizeBytes: doc.size_bytes,
      chunkCount: chunkCountMap.get(doc.id) || 0,
      metadata: doc.metadata,
      createdAt: doc.created_at,
      uploadedBy: doc.users
        ? {
            firstName: doc.users.first_name,
            lastName: doc.users.last_name,
            email: doc.users.email,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      documents,
      count: documents.length,
      offset,
      limit,
    });
  } catch (error) {
    console.error('Error in /api/rag/documents:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
