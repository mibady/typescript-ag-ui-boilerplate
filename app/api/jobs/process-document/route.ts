/**
 * POST /api/jobs/process-document
 * 
 * Background job handler for document processing.
 * Called by Upstash QStash to process uploaded documents:
 * 1. Chunk the document
 * 2. Generate embeddings
 * 3. Store in Upstash Vector
 * 4. Store chunks in Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySignature } from '@/lib/upstash/qstash';
import { createClient } from '@/lib/supabase-server';
import { chunkDocument } from '@/lib/rag/chunking';
import { ingestDocumentChunks } from '@/lib/rag/vector-search';

export const runtime = 'edge';
export const maxDuration = 300; // 5 minutes for long documents

export async function POST(req: NextRequest) {
  try {
    // Verify QStash signature
    const signature = req.headers.get('upstash-signature');
    const body = await req.text();

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing QStash signature' },
        { status: 401 }
      );
    }

    const isValid = await verifySignature(signature, body);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid QStash signature' },
        { status: 401 }
      );
    }

    // Parse request body
    const { documentId, organizationId } = JSON.parse(body);

    if (!documentId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing documentId or organizationId' },
        { status: 400 }
      );
    }

    console.log(`Processing document ${documentId} for org ${organizationId}`);

    // Get document from Supabase
    const supabase = await createClient();
    
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, content, name, organization_id')
      .eq('id', documentId)
      .eq('organization_id', organizationId)
      .single();

    if (docError || !doc) {
      console.error('Document not found:', docError);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Validate content
    const content = (doc.content || '').toString().trim();
    if (content.length === 0) {
      return NextResponse.json(
        { error: 'Document has no content' },
        { status: 400 }
      );
    }

    // Step 1: Chunk the document
    console.log(`Chunking document ${documentId}...`);
    const chunks = chunkDocument(content);
    console.log(`Created ${chunks.length} chunks`);

    // Step 2: Store chunks in Supabase
    console.log('Storing chunks in Supabase...');
    const chunkRecords = chunks.map((chunk, index) => ({
      id: `${documentId}-${index}`,
      document_id: documentId,
      chunk_index: index,
      content: chunk.content,
      organization_id: organizationId,
      metadata: chunk.metadata,
    }));

    const { error: chunksError } = await supabase
      .from('document_chunks')
      .upsert(chunkRecords);

    if (chunksError) {
      console.error('Error storing chunks:', chunksError);
      throw new Error('Failed to store chunks in database');
    }

    // Step 3: Generate embeddings and store in Upstash Vector
    console.log('Generating embeddings and storing in Upstash Vector...');
    await ingestDocumentChunks(
      documentId,
      chunks.map((chunk, index) => ({
        content: chunk.content,
        chunkIndex: index,
      })),
      organizationId
    );

    // Step 4: Update document status
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        chunk_count: chunks.length,
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document status:', updateError);
    }

    console.log(`Successfully processed document ${documentId}`);

    return NextResponse.json({
      success: true,
      documentId,
      chunksCreated: chunks.length,
      message: 'Document processed successfully',
    });
  } catch (error) {
    console.error('Error in process-document job:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
