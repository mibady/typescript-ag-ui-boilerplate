/**
 * MCP Tool Registry
 *
 * Central registry for all MCP tools available in the application.
 * Tools are registered here and can be discovered/executed by agents.
 */

import { MCPToolRegistry, MCPToolRegistration } from './types';

// Tool registry instance
const toolRegistry: MCPToolRegistry = new Map();

/**
 * Register a new MCP tool
 */
export function registerTool(
  name: string,
  registration: MCPToolRegistration
): void {
  if (toolRegistry.has(name)) {
    console.warn(`[MCP] Tool "${name}" is already registered. Overwriting...`);
  }

  toolRegistry.set(name, registration);
  console.log(`[MCP] Tool registered: ${name}`);
}

/**
 * Unregister an MCP tool
 */
export function unregisterTool(name: string): boolean {
  const result = toolRegistry.delete(name);
  if (result) {
    console.log(`[MCP] Tool unregistered: ${name}`);
  }
  return result;
}

/**
 * Get a specific tool by name
 */
export function getTool(name: string): MCPToolRegistration | undefined {
  return toolRegistry.get(name);
}

/**
 * Get all registered tools
 */
export function getAllTools(): MCPToolRegistry {
  return new Map(toolRegistry);
}

/**
 * Get all enabled tools
 */
export function getEnabledTools(): Map<string, MCPToolRegistration> {
  const enabled = new Map<string, MCPToolRegistration>();

  toolRegistry.forEach((registration, name) => {
    if (registration.enabled) {
      enabled.set(name, registration);
    }
  });

  return enabled;
}

/**
 * Check if a tool exists and is enabled
 */
export function isToolAvailable(name: string): boolean {
  const tool = toolRegistry.get(name);
  return tool !== undefined && tool.enabled;
}

/**
 * Get tool schemas for all enabled tools
 */
export function getToolSchemas() {
  const schemas: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }> = [];

  toolRegistry.forEach((registration, name) => {
    if (registration.enabled) {
      schemas.push({
        name: registration.tool.schema.name,
        description: registration.tool.schema.description,
        parameters: registration.tool.schema.parameters,
      });
    }
  });

  return schemas;
}

/**
 * Enable/disable a tool
 */
export function setToolEnabled(name: string, enabled: boolean): boolean {
  const tool = toolRegistry.get(name);
  if (!tool) {
    return false;
  }

  tool.enabled = enabled;
  console.log(`[MCP] Tool "${name}" ${enabled ? 'enabled' : 'disabled'}`);
  return true;
}

/**
 * Clear all registered tools
 */
export function clearRegistry(): void {
  toolRegistry.clear();
  console.log('[MCP] Tool registry cleared');
}

/**
 * Get registry stats
 */
export function getRegistryStats() {
  const total = toolRegistry.size;
  let enabled = 0;
  let disabled = 0;

  toolRegistry.forEach((registration) => {
    if (registration.enabled) {
      enabled++;
    } else {
      disabled++;
    }
  });

  return {
    total,
    enabled,
    disabled,
  };
}
