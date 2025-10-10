/**
 * GET /api/rag/documents/[id]
 * DELETE /api/rag/documents/[id]
 *
 * Get or delete a specific document.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase-server';

export const runtime = 'edge';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

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

    // Fetch document
    const { data, error } = await supabase
      .from('documents')
      .select(`
        id,
        name,
        content,
        content_type,
        size_bytes,
        metadata,
        created_at,
        updated_at,
        users:user_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get chunk count
    const { count: chunkCount } = await supabase
      .from('document_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('document_id', id);

    // Cast the data to proper type since Supabase relations are tricky
    const docData = data as any;

    return NextResponse.json({
      success: true,
      document: {
        id: docData.id,
        name: docData.name,
        content: docData.content,
        contentType: docData.content_type,
        sizeBytes: docData.size_bytes,
        chunkCount: chunkCount || 0,
        metadata: docData.metadata,
        createdAt: docData.created_at,
        updatedAt: docData.updated_at,
        uploadedBy: docData.users
          ? {
              firstName: docData.users.first_name,
              lastName: docData.users.last_name,
              email: docData.users.email,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/rag/documents/[id]:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

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

    // Delete document (cascades to chunks via ON DELETE CASCADE)
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error deleting document:', error);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/rag/documents/[id]:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
