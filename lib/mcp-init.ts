/**
 * MCP Server Initialization
 *
 * Initializes the MCP server on application startup.
 * Should be called once at app initialization.
 */

import { initializeMCPServer } from './mcp/server';

let initialized = false;

export function initMCP() {
  if (initialized) {
    console.log('[MCP] Already initialized, skipping...');
    return;
  }

  try {
    initializeMCPServer();
    initialized = true;
    console.log('[MCP] Server initialized successfully');
  } catch (error) {
    console.error('[MCP] Initialization failed:', error);
    throw error;
  }
}

// Initialize on module load (server-side only)
if (typeof window === 'undefined') {
  initMCP();
}
