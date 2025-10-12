import { streamText, generateText, type CoreMessage } from 'ai';
import { createLanguageModel, type LLMProvider } from '../llm-provider';
import {
  emitRunStarted,
  emitRunFinished,
  emitRunError,
  emitMessageStart,
  emitMessageDelta,
  emitMessageEnd,
  emitToolCallStart,
  emitToolCallEnd,
  emitToolCallResult,
} from '../agui-events';
import { createMCPClient, type MCPClient, type MCPToolResult } from '../mcp';
import { nanoid } from 'nanoid';

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
    sessionId: string,
    parentMessageId?: string
  ): Promise<MCPToolResult> {
    if (!this.mcpClient) {
      return {
        success: false,
        error: 'MCP client not initialized',
      };
    }

    const toolCallId = `tool_${nanoid()}`;

    try {
      // Emit tool call start event (AG-UI compliant)
      await emitToolCallStart(sessionId, toolCallId, toolName, parentMessageId);

      // Execute tool
      const result = await this.mcpClient.executeTool(toolName, args);

      // Emit tool call end event
      await emitToolCallEnd(sessionId, toolCallId);

      // Emit tool call result
      const messageId = `msg_${nanoid()}`;
      await emitToolCallResult(
        sessionId,
        messageId,
        toolCallId,
        JSON.stringify(result)
      );

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorResult: MCPToolResult = {
        success: false,
        error: errorMessage,
      };

      // Emit tool call end even on error
      await emitToolCallEnd(sessionId, toolCallId);

      // Emit error result
      const messageId = `msg_${nanoid()}`;
      await emitToolCallResult(
        sessionId,
        messageId,
        toolCallId,
        JSON.stringify(errorResult)
      );

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

    // Generate AG-UI IDs
    const threadId = sessionId; // Use sessionId as threadId
    const runId = `run_${nanoid()}`;
    const messageId = `msg_${nanoid()}`;

    console.log('[BaseAgent] executeStream started:', { sessionId, threadId, runId, messageId });

    try {
      // Initialize MCP client for tool execution
      this.initializeMCPClient(context);

      // Get language model
      const model = createLanguageModel(
        this.config.provider,
        this.config.model
      );
      console.log('[BaseAgent] Language model created:', { provider: this.config.provider, model: this.config.model });

      // Emit RUN_STARTED event (AG-UI protocol)
      console.log('[BaseAgent] Emitting RUN_STARTED');
      await emitRunStarted(sessionId, threadId, runId);

      // Emit TEXT_MESSAGE_START event
      console.log('[BaseAgent] Emitting TEXT_MESSAGE_START');
      await emitMessageStart(sessionId, messageId, 'assistant');

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
      let chunkCount = 0;

      console.log('[BaseAgent] Starting to process text stream');
      // Process stream
      for await (const chunk of result.textStream) {
        console.log('[BaseAgent] Received chunk from AI:', { chunkLength: chunk.length, chunkPreview: chunk.substring(0, 50) });
        fullContent += chunk;
        chunkCount++;
        // Emit TEXT_MESSAGE_CONTENT with messageId (AG-UI protocol)
        await emitMessageDelta(sessionId, messageId, chunk);
        // The onChunk callback is no longer needed as it causes duplication.
        // if (onChunk) {
        //   onChunk(chunk);
        // }
      }
      console.log('[BaseAgent] Finished processing stream:', { chunkCount, contentLength: fullContent.length, fullContentPreview: fullContent.substring(0, 100) });

      // Get usage info
      const usage = await result.usage;
      tokensUsed = usage?.totalTokens ?? 0;

      // Calculate cost (rough estimate)
      const cost = this.estimateCost(tokensUsed, this.config.provider);

      // Emit TEXT_MESSAGE_END event
      console.log('[BaseAgent] Emitting TEXT_MESSAGE_END');
      await emitMessageEnd(sessionId, messageId);

      const duration = Date.now() - startTime;

      // Emit RUN_FINISHED event (AG-UI protocol)
      console.log('[BaseAgent] Emitting RUN_FINISHED:', { tokensUsed, cost, duration });
      await emitRunFinished(sessionId, threadId, runId, {
        content: fullContent,
        tokensUsed,
        cost,
        duration,
      });

      console.log('[BaseAgent] executeStream completed successfully');
      return {
        content: fullContent,
        tokensUsed,
        cost,
        finishReason: (await result.finishReason) ?? 'stop',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      // Emit RUN_ERROR event (AG-UI protocol)
      await emitRunError(sessionId, errorMessage);
      throw error;
    }
  }

  /**
   * Execute agent without streaming (for batch processing)
   */
  async execute(context: AgentExecutionContext): Promise<AgentResponse> {
    const { sessionId, messages } = context;
    const startTime = Date.now();

    // Generate AG-UI IDs
    const threadId = sessionId; // Use sessionId as threadId
    const runId = `run_${nanoid()}`;
    const messageId = `msg_${nanoid()}`;

    try {
      // Initialize MCP client for tool execution
      this.initializeMCPClient(context);

      // Get language model
      const model = createLanguageModel(
        this.config.provider,
        this.config.model
      );

      // Emit RUN_STARTED event (AG-UI protocol)
      await emitRunStarted(sessionId, threadId, runId);

      // Emit TEXT_MESSAGE_START event
      await emitMessageStart(sessionId, messageId, 'assistant');

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

      // Emit TEXT_MESSAGE_CONTENT with full text
      await emitMessageDelta(sessionId, messageId, result.text);

      // Emit TEXT_MESSAGE_END event
      await emitMessageEnd(sessionId, messageId);

      const duration = Date.now() - startTime;

      // Emit RUN_FINISHED event (AG-UI protocol)
      await emitRunFinished(sessionId, threadId, runId, {
        content: result.text,
        tokensUsed,
        cost,
        duration,
      });

      return {
        content: result.text,
        tokensUsed,
        cost,
        finishReason: result.finishReason,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      // Emit RUN_ERROR event (AG-UI protocol)
      await emitRunError(sessionId, errorMessage);
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
