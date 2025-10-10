/**
 * MCP (Model Context Protocol) Type Definitions
 *
 * Defines the protocol for tool execution within the application.
 * This is a simplified MCP implementation for internal tool usage.
 */

export interface MCPToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  default?: unknown;
  enum?: unknown[];
}

export interface MCPToolSchema {
  name: string;
  description: string;
  parameters: {
    [key: string]: MCPToolParameter;
  };
}

export interface MCPToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: {
    executionTime?: number;
    tokensUsed?: number;
    cost?: number;
    [key: string]: unknown;
  };
}

export interface MCPToolExecutionContext {
  userId: string;
  organizationId: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface MCPTool {
  schema: MCPToolSchema;
  execute: (
    args: Record<string, unknown>,
    context: MCPToolExecutionContext
  ) => Promise<MCPToolResult>;
}

export interface MCPToolRegistration {
  tool: MCPTool;
  enabled: boolean;
  rateLimit?: {
    maxCalls: number;
    windowMs: number;
  };
}

export type MCPToolRegistry = Map<string, MCPToolRegistration>;

// Tool-specific types

export interface SearchToolArgs {
  query: string;
  limit?: number;
  searchType?: 'web' | 'documents';
}

export interface DatabaseQueryToolArgs {
  query: string;
  params?: unknown[];
}

export interface FileReadToolArgs {
  path: string;
  encoding?: 'utf-8' | 'base64';
}

export interface FileWriteToolArgs {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
}

export interface EmailSendToolArgs {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}
