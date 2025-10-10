/**
 * MCP Server
 *
 * Initializes and manages the MCP tool infrastructure.
 * Registers all available tools and provides server-side management.
 */

import { registerTool } from './tools';
import { MCPTool } from './types';

// Import tools (will be created next)
import { searchTool } from './tools/search';
import { databaseQueryTool } from './tools/database-query';
import { fileReadTool } from './tools/file-read';
import { fileWriteTool } from './tools/file-write';
import { emailSendTool } from './tools/email-send';

/**
 * Initialize MCP server and register all tools
 */
export function initializeMCPServer(): void {
  console.log('[MCP Server] Initializing...');

  // Register core tools
  const tools: Array<{ name: string; tool: MCPTool; rateLimit?: { maxCalls: number; windowMs: number } }> = [
    {
      name: 'search',
      tool: searchTool,
      rateLimit: { maxCalls: 20, windowMs: 60000 }, // 20 calls per minute
    },
    {
      name: 'database-query',
      tool: databaseQueryTool,
      rateLimit: { maxCalls: 50, windowMs: 60000 }, // 50 calls per minute
    },
    {
      name: 'file-read',
      tool: fileReadTool,
      rateLimit: { maxCalls: 100, windowMs: 60000 }, // 100 calls per minute
    },
    {
      name: 'file-write',
      tool: fileWriteTool,
      rateLimit: { maxCalls: 30, windowMs: 60000 }, // 30 calls per minute
    },
    {
      name: 'email-send',
      tool: emailSendTool,
      rateLimit: { maxCalls: 10, windowMs: 60000 }, // 10 calls per minute
    },
  ];

  tools.forEach(({ name, tool, rateLimit }) => {
    registerTool(name, {
      tool,
      enabled: true,
      rateLimit,
    });
  });

  console.log(`[MCP Server] Registered ${tools.length} tools`);
}

/**
 * Shutdown MCP server
 */
export function shutdownMCPServer(): void {
  console.log('[MCP Server] Shutting down...');
  // Cleanup tasks if needed
}

/**
 * Get server status
 */
export function getMCPServerStatus() {
  return {
    status: 'running',
    toolsRegistered: 5,
    timestamp: new Date().toISOString(),
  };
}
