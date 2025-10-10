/**
 * MCP (Model Context Protocol) Module
 *
 * Entry point for MCP functionality.
 */

export * from './types';
export * from './tools';
export * from './client';
export * from './server';
export * from './middleware';

// Re-export commonly used functions
export {
  createMCPClient,
  MCPClient,
} from './client';

export {
  initializeMCPServer,
  shutdownMCPServer,
  getMCPServerStatus,
} from './server';

export {
  registerTool,
  unregisterTool,
  getTool,
  getAllTools,
  getEnabledTools,
  isToolAvailable,
  getToolSchemas,
  setToolEnabled,
} from './tools';
