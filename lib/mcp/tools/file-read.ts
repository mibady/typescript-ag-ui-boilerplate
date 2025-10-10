/**
 * File Read Tool
 *
 * Reads files from the organization's storage (Supabase Storage).
 * Enforces organization-based access control.
 */

import { MCPTool, MCPToolResult, MCPToolExecutionContext, FileReadToolArgs } from '../types';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * File Read Tool Implementation
 */
export const fileReadTool: MCPTool = {
  schema: {
    name: 'file-read',
    description: 'Read a file from organization storage',
    parameters: {
      path: {
        type: 'string',
        description: 'Path to the file in storage (relative to organization bucket)',
        required: true,
      },
      encoding: {
        type: 'string',
        description: 'File encoding (utf-8 or base64)',
        default: 'utf-8',
        enum: ['utf-8', 'base64'],
      },
    },
  },

  async execute(
    args: Record<string, unknown>,
    context: MCPToolExecutionContext
  ): Promise<MCPToolResult> {
    const { path, encoding = 'utf-8' } = args as unknown as FileReadToolArgs;

    try {
      // Validate path (prevent directory traversal)
      if (path.includes('..') || path.startsWith('/')) {
        return {
          success: false,
          error: 'Invalid file path',
        };
      }

      // Construct organization-specific path
      const bucketName = `org-${context.organizationId}`;
      const filePath = path;

      // Download file from Supabase Storage
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .download(filePath);

      if (error) {
        return {
          success: false,
          error: `File read failed: ${error.message}`,
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'File not found',
        };
      }

      // Convert blob to text or base64
      let content: string;

      if (encoding === 'base64') {
        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        content = buffer.toString('base64');
      } else {
        content = await data.text();
      }

      return {
        success: true,
        data: {
          path: filePath,
          content,
          encoding,
          size: data.size,
          type: data.type,
        },
        metadata: {
          organizationId: context.organizationId,
          bucket: bucketName,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File read failed',
      };
    }
  },
};
