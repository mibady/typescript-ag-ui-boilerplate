import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';
import type { LanguageModel } from 'ai';

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'mistral';

export type LLMModel = {
  provider: LLMProvider;
  model: string;
  displayName: string;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
};

/**
 * Available LLM models across all providers
 */
export const AVAILABLE_MODELS: Record<string, LLMModel> = {
  // OpenAI Models
  'openai-gpt-4': {
    provider: 'openai',
    model: 'gpt-4',
    displayName: 'GPT-4',
    maxTokens: 8192,
    supportsStreaming: true,
    supportsTools: true,
  },
  'openai-gpt-4-turbo': {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    displayName: 'GPT-4 Turbo',
    maxTokens: 128000,
    supportsStreaming: true,
    supportsTools: true,
  },
  'openai-gpt-3.5-turbo': {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5 Turbo',
    maxTokens: 16385,
    supportsStreaming: true,
    supportsTools: true,
  },

  // Anthropic Models
  'anthropic-claude-3-opus': {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    displayName: 'Claude 3 Opus',
    maxTokens: 200000,
    supportsStreaming: true,
    supportsTools: true,
  },
  'anthropic-claude-3-sonnet': {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    displayName: 'Claude 3 Sonnet',
    maxTokens: 200000,
    supportsStreaming: true,
    supportsTools: true,
  },
  'anthropic-claude-3-haiku': {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    displayName: 'Claude 3 Haiku',
    maxTokens: 200000,
    supportsStreaming: true,
    supportsTools: true,
  },

  // Google Models
  'google-gemini-pro': {
    provider: 'google',
    model: 'gemini-pro',
    displayName: 'Gemini Pro',
    maxTokens: 32768,
    supportsStreaming: true,
    supportsTools: true,
  },
  'google-gemini-1.5-pro': {
    provider: 'google',
    model: 'gemini-1.5-pro-latest',
    displayName: 'Gemini 1.5 Pro',
    maxTokens: 1048576,
    supportsStreaming: true,
    supportsTools: true,
  },

  // Mistral Models
  'mistral-large': {
    provider: 'mistral',
    model: 'mistral-large-latest',
    displayName: 'Mistral Large',
    maxTokens: 32000,
    supportsStreaming: true,
    supportsTools: true,
  },
  'mistral-medium': {
    provider: 'mistral',
    model: 'mistral-medium-latest',
    displayName: 'Mistral Medium',
    maxTokens: 32000,
    supportsStreaming: true,
    supportsTools: true,
  },
};

/**
 * Get language model instance from provider and model name
 */
export function getLanguageModel(
  provider: LLMProvider,
  modelName: string
): LanguageModel {
  switch (provider) {
    case 'openai':
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured');
      }
      return openai(modelName);

    case 'anthropic':
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
      }
      return anthropic(modelName);

    case 'google':
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not configured');
      }
      return google(modelName);

    case 'mistral':
      if (!process.env.MISTRAL_API_KEY) {
        throw new Error('MISTRAL_API_KEY is not configured');
      }
      return mistral(modelName);

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Get available providers based on configured API keys
 */
export function getAvailableProviders(): LLMProvider[] {
  const providers: LLMProvider[] = [];

  if (process.env.OPENAI_API_KEY) providers.push('openai');
  if (process.env.ANTHROPIC_API_KEY) providers.push('anthropic');
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) providers.push('google');
  if (process.env.MISTRAL_API_KEY) providers.push('mistral');

  return providers;
}

/**
 * Get available models for a specific provider
 */
export function getModelsForProvider(provider: LLMProvider): LLMModel[] {
  return Object.values(AVAILABLE_MODELS).filter(
    (model) => model.provider === provider
  );
}

/**
 * Get all available models across all configured providers
 */
export function getAllAvailableModels(): LLMModel[] {
  const availableProviders = getAvailableProviders();
  return Object.values(AVAILABLE_MODELS).filter((model) =>
    availableProviders.includes(model.provider)
  );
}

/**
 * Get default model for a provider
 */
export function getDefaultModel(provider: LLMProvider): string {
  const defaults: Record<LLMProvider, string> = {
    openai: 'gpt-4-turbo-preview',
    anthropic: 'claude-3-sonnet-20240229',
    google: 'gemini-1.5-pro-latest',
    mistral: 'mistral-large-latest',
  };

  return defaults[provider];
}

/**
 * Get the first available provider and its default model
 */
export function getDefaultProviderAndModel(): {
  provider: LLMProvider;
  model: string;
} {
  const availableProviders = getAvailableProviders();

  if (availableProviders.length === 0) {
    throw new Error(
      'No LLM providers configured. Please set at least one API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or MISTRAL_API_KEY).'
    );
  }

  const provider = availableProviders[0];
  const model = getDefaultModel(provider);

  return { provider, model };
}

/**
 * Create a language model with the specified configuration
 * Falls back to default provider if not specified
 */
export function createLanguageModel(
  provider?: LLMProvider,
  modelName?: string
): LanguageModel {
  const { provider: defaultProvider, model: defaultModel } =
    getDefaultProviderAndModel();

  const finalProvider = provider || defaultProvider;
  const finalModel = modelName || defaultModel;

  return getLanguageModel(finalProvider, finalModel);
}
