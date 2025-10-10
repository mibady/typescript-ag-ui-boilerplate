import { BaseAgent, type AgentConfig } from './base-agent';

/**
 * Assistant Agent
 * General-purpose conversational agent for user interactions
 */
export class AssistantAgent extends BaseAgent {
  constructor(config: AgentConfig = {}) {
    super('assistant', {
      ...config,
      systemPrompt:
        config.systemPrompt ??
        `You are a helpful AI assistant. Your role is to:
- Provide clear, accurate, and helpful responses
- Understand user context and intent
- Offer practical solutions and guidance
- Maintain a friendly and professional tone
- Admit when you don't know something
- Ask clarifying questions when needed

Always prioritize user satisfaction and provide valuable assistance.`,
    });
  }
}

/**
 * Create a new assistant agent instance
 */
export function createAssistantAgent(config?: AgentConfig): AssistantAgent {
  return new AssistantAgent(config);
}
