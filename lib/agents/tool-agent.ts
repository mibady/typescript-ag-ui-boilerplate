/**
 * Tool Agent
 *
 * Example agent that demonstrates MCP tool usage.
 * Shows how to use tools like search, database queries, file operations, etc.
 */

import { BaseAgent, type AgentConfig, type AgentExecutionContext } from './base-agent';

/**
 * ToolAgent - Demonstrates MCP tool integration
 */
export class ToolAgent extends BaseAgent {
  constructor(config: AgentConfig = {}) {
    super('tool-agent', {
      ...config,
      systemPrompt:
        config.systemPrompt ||
        `You are an AI assistant with access to powerful tools. You can:

1. **Search** - Search the web or documents for information
2. **Database Query** - Query the database for data (read-only, SELECT queries only)
3. **File Read** - Read files from organization storage
4. **File Write** - Write files to organization storage
5. **Send Email** - Send emails to users

When you need to perform an action, YOU MUST use the available tools.
Always explain what tool you're using and why before using it.
After using a tool, explain the results to the user.

Available tools can be accessed via this.executeTool(toolName, args).`,
    });
  }

  /**
   * Example: Search for information
   */
  async searchWeb(query: string, sessionId: string): Promise<any> {
    return await this.executeTool(
      'search',
      {
        query,
        searchType: 'web',
        limit: 5,
      },
      sessionId
    );
  }

  /**
   * Example: Query database
   */
  async queryDatabase(query: string, sessionId: string): Promise<any> {
    return await this.executeTool(
      'database-query',
      {
        query,
      },
      sessionId
    );
  }

  /**
   * Example: Read a file
   */
  async readFile(path: string, sessionId: string): Promise<any> {
    return await this.executeTool(
      'file-read',
      {
        path,
        encoding: 'utf-8',
      },
      sessionId
    );
  }

  /**
   * Example: Write a file
   */
  async writeFile(
    path: string,
    content: string,
    sessionId: string
  ): Promise<any> {
    return await this.executeTool(
      'file-write',
      {
        path,
        content,
        encoding: 'utf-8',
      },
      sessionId
    );
  }

  /**
   * Example: Send an email
   */
  async sendEmail(
    to: string,
    subject: string,
    content: string,
    sessionId: string
  ): Promise<any> {
    return await this.executeTool(
      'email-send',
      {
        to,
        subject,
        html: content,
      },
      sessionId
    );
  }

  /**
   * Get list of available tools
   */
  getTools(): string[] {
    return this.getAvailableTools();
  }
}
