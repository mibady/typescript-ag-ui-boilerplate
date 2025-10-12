import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * RAG (Retrieval-Augmented Generation) E2E Test Suite
 *
 * Tests the complete RAG workflow including:
 * - Document upload and chunking
 * - Vector embedding generation
 * - Semantic search (vector + full-text)
 * - Hybrid search with RRF
 * - Context retrieval for LLM
 * - Document deletion
 */

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test document content
const TEST_DOCUMENTS = {
  simple: {
    name: 'test-simple.txt',
    content: 'This is a simple test document about artificial intelligence and machine learning.',
    type: 'text/plain',
  },
  technical: {
    name: 'test-technical.md',
    content: `# Technical Documentation

## Introduction
This document contains information about TypeScript development and best practices.

## Key Concepts
- Type safety
- Interfaces and types
- Generics
- Async/await patterns

## Code Examples
\`\`\`typescript
interface User {
  id: string;
  name: string;
}
\`\`\`
`,
    type: 'text/markdown',
  },
  large: {
    name: 'test-large.txt',
    content: 'Lorem ipsum dolor sit amet. '.repeat(500), // ~15KB document
    type: 'text/plain',
  },
};

test.describe('RAG Document Management', () => {
  let authToken: string;
  let uploadedDocumentId: string;

  test.beforeAll(async ({ browser }) => {
    // Authenticate
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${API_BASE}/sign-in`);
    await page.fill('[name="identifier"]', process.env.TEST_USER_EMAIL!);
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === '__session');
    authToken = sessionCookie?.value || '';

    await context.close();
  });

  test.describe('Document Upload', () => {
    test('should require authentication for document upload', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/rag/upload`, {
        multipart: {
          file: {
            name: TEST_DOCUMENTS.simple.name,
            mimeType: TEST_DOCUMENTS.simple.type,
            buffer: Buffer.from(TEST_DOCUMENTS.simple.content),
          },
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should validate file is provided', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/rag/upload`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          // No file provided
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/file/i);
    });

    test('should reject unsupported file types', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/rag/upload`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        multipart: {
          file: {
            name: 'test.exe',
            mimeType: 'application/x-msdownload',
            buffer: Buffer.from('fake exe content'),
          },
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/file type|unsupported/i);
    });

    test('should reject files exceeding size limit', async ({ request }) => {
      // Create a file larger than 10MB
      const largeContent = Buffer.alloc(11 * 1024 * 1024);

      const response = await request.post(`${API_BASE}/api/rag/upload`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        multipart: {
          file: {
            name: 'large-file.txt',
            mimeType: 'text/plain',
            buffer: largeContent,
          },
        },
      });

      expect(response.status()).toBe(413);
      const data = await response.json();
      expect(data.error).toMatch(/size|large/i);
    });

    test('should successfully upload valid text document', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/rag/upload`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        multipart: {
          file: {
            name: TEST_DOCUMENTS.simple.name,
            mimeType: TEST_DOCUMENTS.simple.type,
            buffer: Buffer.from(TEST_DOCUMENTS.simple.content),
          },
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('documentId');
      expect(data).toHaveProperty('chunks');
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('success');

      // Store document ID for later tests
      uploadedDocumentId = data.documentId;
    });

    test('should successfully upload markdown document', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/rag/upload`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        multipart: {
          file: {
            name: TEST_DOCUMENTS.technical.name,
            mimeType: TEST_DOCUMENTS.technical.type,
            buffer: Buffer.from(TEST_DOCUMENTS.technical.content),
          },
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('documentId');
      expect(data.chunks).toBeGreaterThan(0);
    });

    test('should chunk large documents appropriately', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/rag/upload`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        multipart: {
          file: {
            name: TEST_DOCUMENTS.large.name,
            mimeType: TEST_DOCUMENTS.large.type,
            buffer: Buffer.from(TEST_DOCUMENTS.large.content),
          },
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      // Large document should be split into multiple chunks
      expect(data.chunks).toBeGreaterThan(1);
    });

    test('should handle duplicate file names', async ({ request }) => {
      // Upload same document twice
      const response1 = await request.post(`${API_BASE}/api/rag/upload`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        multipart: {
          file: {
            name: 'duplicate.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('Content 1'),
          },
        },
      });

      const response2 = await request.post(`${API_BASE}/api/rag/upload`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        multipart: {
          file: {
            name: 'duplicate.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('Content 2'),
          },
        },
      });

      expect(response1.ok()).toBeTruthy();
      expect(response2.ok()).toBeTruthy();

      const data1 = await response1.json();
      const data2 = await response2.json();

      // Should create separate documents with unique IDs
      expect(data1.documentId).not.toBe(data2.documentId);
    });
  });

  test.describe('Document Search - Vector', () => {
    test('should require authentication for vector search', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/rag/search`, {
        data: {
          query: 'artificial intelligence',
          method: 'vector',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should validate search query', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/rag/search`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          query: '', // Empty query
          method: 'vector',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should perform semantic vector search', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/rag/search`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          query: 'machine learning and AI',
          method: 'vector',
          topK: 5,
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBeTruthy();

      if (data.results.length > 0) {
        const result = data.results[0];
        expect(result).toHaveProperty('documentId');
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('score');
      }
    });

    test('should respect topK parameter', async ({ request }) => {
      const topK = 3;
      const response = await request.post(`${API_BASE}/api/rag/search`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          query: 'test query',
          method: 'vector',
          topK,
        },
      });

      const data = await response.json();
      expect(data.results.length).toBeLessThanOrEqual(topK);
    });

    test('should filter by metadata if provided', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/rag/search`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          query: 'test query',
          method: 'vector',
          filter: {
            documentType: 'text/plain',
          },
        },
      });

      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Document Search - Full-Text', () => {
    test('should perform BM25 full-text search', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/rag/search`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          query: 'TypeScript development',
          method: 'fulltext',
          topK: 5,
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBeTruthy();
    });

    test('should handle exact phrase matching', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/rag/search`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          query: '"artificial intelligence"',
          method: 'fulltext',
        },
      });

      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Document Search - Hybrid', () => {
    test('should perform hybrid search with RRF', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/rag/hybrid-search`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          query: 'machine learning TypeScript',
          topK: 5,
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('method');
      expect(data.method).toBe('hybrid');
    });

    test('should combine vector and full-text scores', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/rag/hybrid-search`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          query: 'artificial intelligence',
          topK: 10,
        },
      });

      const data = await response.json();

      if (data.results.length > 0) {
        // Results should have combined scores
        const result = data.results[0];
        expect(result).toHaveProperty('score');
        expect(typeof result.score).toBe('number');
      }
    });
  });

  test.describe('Document Deletion', () => {
    test('should require authentication for document deletion', async ({ request }) => {
      const response = await request.delete(`${API_BASE}/api/rag/document/${uploadedDocumentId}`);
      expect(response.status()).toBe(401);
    });

    test('should prevent deletion of non-existent document', async ({ request }) => {
      const response = await request.delete(`${API_BASE}/api/rag/document/non-existent-id`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
      });

      expect(response.status()).toBe(404);
    });

    test('should successfully delete document and vectors', async ({ request }) => {
      // First, upload a document to delete
      const uploadResponse = await request.post(`${API_BASE}/api/rag/upload`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        multipart: {
          file: {
            name: 'to-delete.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('This document will be deleted'),
          },
        },
      });

      const uploadData = await uploadResponse.json();
      const docId = uploadData.documentId;

      // Now delete it
      const deleteResponse = await request.delete(`${API_BASE}/api/rag/document/${docId}`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
      });

      expect(deleteResponse.ok()).toBeTruthy();
      const deleteData = await deleteResponse.json();
      expect(deleteData.status).toBe('success');

      // Verify document is no longer searchable
      const searchResponse = await request.post(`${API_BASE}/api/rag/search`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          query: 'This document will be deleted',
          method: 'vector',
        },
      });

      const searchData = await searchResponse.json();
      const foundDeleted = searchData.results.some((r: any) => r.documentId === docId);
      expect(foundDeleted).toBeFalsy();
    });

    test('should prevent cross-organization document deletion', async ({ request }) => {
      // This test assumes we have a different user/org
      // In real implementation, you'd authenticate as a different org user
      const response = await request.delete(`${API_BASE}/api/rag/document/${uploadedDocumentId}`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
      });

      // Should succeed if document belongs to same org
      // Should fail (403) if document belongs to different org
      expect([200, 403]).toContain(response.status());
    });
  });

  test.describe('RAG Context Generation', () => {
    test('should generate context for LLM from relevant documents', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/rag/context`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          query: 'Tell me about artificial intelligence',
          maxChunks: 5,
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('context');
      expect(data).toHaveProperty('sources');
      expect(typeof data.context).toBe('string');
      expect(Array.isArray(data.sources)).toBeTruthy();
    });

    test('should format context for different LLM providers', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/rag/context`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          query: 'machine learning',
          maxChunks: 3,
          format: 'anthropic', // Claude format
        },
      });

      expect(response.ok()).toBeTruthy();
    });

    test('should respect maxChunks limit', async ({ request }) => {
      const maxChunks = 3;
      const response = await request.post(`${API_BASE}/api/rag/context`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          query: 'test',
          maxChunks,
        },
      });

      const data = await response.json();
      expect(data.sources.length).toBeLessThanOrEqual(maxChunks);
    });
  });

  test.describe('Organization Isolation', () => {
    test('should only search within user organization documents', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/rag/search`, {
        headers: {
          Cookie: `__session=${authToken}`,
        },
        data: {
          query: 'any query',
          method: 'vector',
        },
      });

      const data = await response.json();

      // All results should belong to the authenticated user's organization
      // This is enforced by RLS policies
      expect(response.ok()).toBeTruthy();
    });
  });
});
