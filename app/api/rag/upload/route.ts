/**
 * POST /api/rag/upload
 *
 * Upload and process a document for RAG retrieval.
 * Chunks the document, generates embeddings, and stores in vector database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase-server';
import { queueDocumentProcessing } from '@/lib/upstash/qstash';

export const runtime = 'edge';

interface UploadRequest {
  name: string;
  content: string;
  contentType?: string;
  metadata?: Record<string, unknown>;
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
    const body: UploadRequest = await req.json();
    const { name, content, contentType, metadata } = body;

    // Validate inputs
    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }

    if (content.length === 0) {
      return NextResponse.json(
        { error: 'Content cannot be empty' },
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

    // Get user ID from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userDbId = userData.id;

    // Insert document record
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        organization_id: organizationId,
        user_id: userDbId,
        name,
        content,
        content_type: contentType || 'text/plain',
        size_bytes: content.length,
        metadata: metadata || {},
      })
      .select('id')
      .single();

    if (documentError || !documentData) {
      console.error('Error creating document:', documentError);
      return NextResponse.json(
        { error: 'Failed to create document' },
        { status: 500 }
      );
    }

    const documentId = documentData.id;

    // Queue document processing job (async via QStash)
    // This will chunk, embed, and store in Upstash Vector in the background
    try {
      await queueDocumentProcessing(documentId, organizationId);
      
      console.log(`Queued processing for document ${documentId}`);
    } catch (queueError) {
      console.error('Error queuing document processing:', queueError);
      // Don't fail the request - document is saved, processing can be retried
    }

    // Return success response immediately
    // Processing will happen in the background
    return NextResponse.json({
      success: true,
      documentId,
      status: 'queued',
      message: 'Document uploaded successfully. Processing in background.',
    });
  } catch (error) {
    console.error('Error in /api/rag/upload:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
