/**
 * File Write Tool
 *
 * Writes files to the organization's storage (Supabase Storage).
 * Enforces organization-based access control and file size limits.
 */

import { MCPTool, MCPToolResult, MCPToolExecutionContext, FileWriteToolArgs } from '../types';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * File Write Tool Implementation
 */
export const fileWriteTool: MCPTool = {
  schema: {
    name: 'file-write',
    description: 'Write a file to organization storage',
    parameters: {
      path: {
        type: 'string',
        description: 'Path where the file will be saved (relative to organization bucket)',
        required: true,
      },
      content: {
        type: 'string',
        description: 'File content to write',
        required: true,
      },
      encoding: {
        type: 'string',
        description: 'Content encoding (utf-8 or base64)',
        default: 'utf-8',
        enum: ['utf-8', 'base64'],
      },
    },
  },

  async execute(
    args: Record<string, unknown>,
    context: MCPToolExecutionContext
  ): Promise<MCPToolResult> {
    const { path, content, encoding = 'utf-8' } = args as unknown as FileWriteToolArgs;

    try {
      // Validate path (prevent directory traversal)
      if (path.includes('..') || path.startsWith('/')) {
        return {
          success: false,
          error: 'Invalid file path',
        };
      }

      // Validate file size
      const contentSize = Buffer.byteLength(content, encoding === 'base64' ? 'base64' : 'utf-8');
      if (contentSize > MAX_FILE_SIZE) {
        return {
          success: false,
          error: `File size (${contentSize} bytes) exceeds maximum allowed size (${MAX_FILE_SIZE} bytes)`,
        };
      }

      // Construct organization-specific path
      const bucketName = `org-${context.organizationId}`;
      const filePath = path;

      // Convert content to buffer
      const buffer = encoding === 'base64'
        ? Buffer.from(content, 'base64')
        : Buffer.from(content, 'utf-8');

      // Upload file to Supabase Storage
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: detectContentType(path),
          upsert: true, // Overwrite if exists
        });

      if (error) {
        return {
          success: false,
          error: `File write failed: ${error.message}`,
        };
      }

      return {
        success: true,
        data: {
          path: data.path,
          size: contentSize,
          bucket: bucketName,
        },
        metadata: {
          organizationId: context.organizationId,
          encoding,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File write failed',
      };
    }
  },
};

/**
 * Detect content type from file extension
 */
function detectContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();

  const contentTypes: Record<string, string> = {
    'txt': 'text/plain',
    'md': 'text/markdown',
    'json': 'application/json',
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'csv': 'text/csv',
    'xml': 'application/xml',
    'html': 'text/html',
  };

  return contentTypes[ext || ''] || 'application/octet-stream';
}
