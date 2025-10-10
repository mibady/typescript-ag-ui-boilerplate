import { streamText, generateText, type CoreMessage } from 'ai';
import { createLanguageModel, type LLMProvider } from '../llm-provider';
import {
  emitAgentStart,
  emitMessageStart,
  emitMessageDelta,
  emitMessageComplete,
  emitToolCallStart,
  emitToolCallComplete,
  emitError,
  emitComplete,
} from '../agui-events';
import { createMCPClient, type MCPClient, type MCPToolResult } from '../mcp';

export interface AgentConfig {
  provider?: LLMProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AgentExecutionContext {
  sessionId: string;
  organizationId: string;
  userId: string;
  messages: CoreMessage[];
}

export interface AgentResponse {
  content: string;
  tokensUsed: number;
  cost: number;
  finishReason: string;
}

/**
 * Base Agent class
 * Provides core functionality for AI agent execution with MCP tool support
 */
export class BaseAgent {
  protected config: {
    provider?: LLMProvider;
    model?: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
  };
  protected agentType: string;
  protected mcpClient?: MCPClient;

  constructor(agentType: string, config: AgentConfig = {}) {
    this.agentType = agentType;
    this.config = {
      provider: config.provider,
      model: config.model,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      systemPrompt:
        config.systemPrompt ??
        'You are a helpful AI assistant. Provide clear, accurate, and helpful responses.',
    };
  }

  /**
   * Initialize MCP client for tool execution
   */
  protected initializeMCPClient(context: AgentExecutionContext): void {
    this.mcpClient = createMCPClient({
      userId: context.userId,
      organizationId: context.organizationId,
      sessionId: context.sessionId,
    });
  }

  /**
   * Execute an MCP tool
   */
  protected async executeTool(
    toolName: string,
    args: Record<string, unknown>,
    sessionId: string
  ): Promise<MCPToolResult> {
    if (!this.mcpClient) {
      return {
        success: false,
        error: 'MCP client not initialized',
      };
    }

    try {
      // Emit tool call start event
      await emitToolCallStart(sessionId, toolName, args);

      // Execute tool
      const result = await this.mcpClient.executeTool(toolName, args);

      // Emit tool call complete event
      await emitToolCallComplete(sessionId, toolName, result);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorResult: MCPToolResult = {
        success: false,
        error: errorMessage,
      };

      await emitToolCallComplete(sessionId, toolName, errorResult);
      return errorResult;
    }
  }

  /**
   * Get available tools from MCP
   */
  protected getAvailableTools(): string[] {
    if (!this.mcpClient) {
      return [];
    }

    return this.mcpClient.getAvailableTools().map(tool => tool.name);
  }

  /**
   * Execute agent with streaming response
   */
  async executeStream(
    context: AgentExecutionContext,
    onChunk?: (chunk: string) => void
  ): Promise<AgentResponse> {
    const { sessionId, messages } = context;
    const startTime = Date.now();

    try {
      // Initialize MCP client for tool execution
      this.initializeMCPClient(context);

      // Get language model
      const model = createLanguageModel(
        this.config.provider,
        this.config.model
      );

      // Emit start event
      await emitAgentStart(
        sessionId,
        this.agentType,
        this.config.model || 'default',
        this.config.provider || 'default'
      );

      // Generate message ID
      const messageId = `msg_${Date.now()}`;
      await emitMessageStart(sessionId, messageId);

      // Prepare messages with system prompt
      const fullMessages: CoreMessage[] = [
        { role: 'system', content: this.config.systemPrompt },
        ...messages,
      ];

      // Stream response
      const result = await streamText({
        model,
        messages: fullMessages,
        temperature: this.config.temperature,
      });

      let fullContent = '';
      let tokensUsed = 0;

      // Process stream
      for await (const chunk of result.textStream) {
        fullContent += chunk;
        await emitMessageDelta(sessionId, chunk);
        if (onChunk) {
          onChunk(chunk);
        }
      }

      // Get usage info
      const usage = await result.usage;
      tokensUsed = usage?.totalTokens ?? 0;

      // Calculate cost (rough estimate)
      const cost = this.estimateCost(tokensUsed, this.config.provider);

      // Emit completion
      await emitMessageComplete(
        sessionId,
        messageId,
        fullContent,
        tokensUsed,
        cost
      );

      const duration = Date.now() - startTime;
      await emitComplete(sessionId, tokensUsed, cost, duration);

      return {
        content: fullContent,
        tokensUsed,
        cost,
        finishReason: (await result.finishReason) ?? 'stop',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await emitError(sessionId, errorMessage);
      throw error;
    }
  }

  /**
   * Execute agent without streaming (for batch processing)
   */
  async execute(context: AgentExecutionContext): Promise<AgentResponse> {
    const { sessionId, messages } = context;
    const startTime = Date.now();

    try {
      // Initialize MCP client for tool execution
      this.initializeMCPClient(context);

      // Get language model
      const model = createLanguageModel(
        this.config.provider,
        this.config.model
      );

      // Emit start event
      await emitAgentStart(
        sessionId,
        this.agentType,
        this.config.model || 'default',
        this.config.provider || 'default'
      );

      // Generate message ID
      const messageId = `msg_${Date.now()}`;
      await emitMessageStart(sessionId, messageId);

      // Prepare messages with system prompt
      const fullMessages: CoreMessage[] = [
        { role: 'system', content: this.config.systemPrompt },
        ...messages,
      ];

      // Generate response
      const result = await generateText({
        model,
        messages: fullMessages,
        temperature: this.config.temperature,
      });

      const tokensUsed = result.usage.totalTokens ?? 0;
      const cost = this.estimateCost(tokensUsed, this.config.provider);

      // Emit completion
      await emitMessageComplete(
        sessionId,
        messageId,
        result.text,
        tokensUsed,
        cost
      );

      const duration = Date.now() - startTime;
      await emitComplete(sessionId, tokensUsed, cost, duration);

      return {
        content: result.text,
        tokensUsed,
        cost,
        finishReason: result.finishReason,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await emitError(sessionId, errorMessage);
      throw error;
    }
  }

  /**
   * Estimate cost based on tokens and provider
   * Rough estimates - update with actual pricing
   */
  protected estimateCost(
    tokens: number,
    provider: LLMProvider | undefined
  ): number {
    const rates: Record<string, number> = {
      openai: 0.00003, // $0.03 per 1K tokens (GPT-4 Turbo average)
      anthropic: 0.000015, // $0.015 per 1K tokens (Claude 3 Sonnet)
      google: 0.0000035, // $0.0035 per 1K tokens (Gemini Pro)
      mistral: 0.000008, // $0.008 per 1K tokens (Mistral Large)
    };

    const rate = provider ? rates[provider] ?? 0.00001 : 0.00001;
    return tokens * rate;
  }
}
