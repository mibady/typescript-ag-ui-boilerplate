/**
 * Chat Store with Zustand
 *
 * Manages chat session state, messages, and UI state
 * for the agent chat interface.
 *
 * Integrates with AG-UI SDK events for real-time state synchronization.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { CoreMessage } from 'ai';
import type { Message as AGUIMessage, BaseEvent } from '@ag-ui/core';
import { EventType } from '@ag-ui/core';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    tokensUsed?: number;
    cost?: number;
    finishReason?: string;
    provider?: string;
    model?: string;
    // AG-UI specific
    messageId?: string;
    runId?: string;
    threadId?: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface ChatState {
  // Current session
  currentSessionId: string | null;
  sessions: ChatSession[];
  messages: Message[];

  // UI state
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;

  // AG-UI state
  currentRunId: string | null;
  streamingMessageId: string | null;

  // Provider settings
  provider: 'openai' | 'anthropic' | 'google' | 'mistral';
  model: string | null;
  temperature: number;

  // Actions
  setCurrentSession: (sessionId: string) => void;
  createSession: (title?: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;

  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;

  setLoading: (isLoading: boolean) => void;
  setStreaming: (isStreaming: boolean) => void;
  setError: (error: string | null) => void;

  setProvider: (provider: ChatState['provider']) => void;
  setModel: (model: string) => void;
  setTemperature: (temperature: number) => void;

  // AG-UI Integration
  handleAGUIEvent: (event: BaseEvent) => void;
  startStreamingMessage: (messageId: string, role: 'assistant' | 'user' | 'system') => void;
  appendToStreamingMessage: (delta: string) => void;
  completeStreamingMessage: () => void;
  setCurrentRun: (runId: string | null) => void;

  // Conversion helpers
  toAGUIMessages: () => AGUIMessage[];
  fromAGUIMessage: (message: AGUIMessage) => Message;

  reset: () => void;
}

const initialState = {
  currentSessionId: null,
  sessions: [],
  messages: [],
  isLoading: false,
  isStreaming: false,
  error: null,
  currentRunId: null,
  streamingMessageId: null,
  provider: 'openai' as const,
  model: null,
  temperature: 0.7,
};

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setCurrentSession: (sessionId) => {
          set({ currentSessionId: sessionId, messages: [] });
          // In a real app, load messages for this session from API
        },

        createSession: (title = 'New Chat') => {
          const newSession: ChatSession = {
            id: crypto.randomUUID(),
            title,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messageCount: 0,
          };

          set((state) => ({
            sessions: [newSession, ...state.sessions],
            currentSessionId: newSession.id,
            messages: [],
          }));
        },

        deleteSession: (sessionId) => {
          set((state) => ({
            sessions: state.sessions.filter((s) => s.id !== sessionId),
            currentSessionId:
              state.currentSessionId === sessionId
                ? null
                : state.currentSessionId,
            messages:
              state.currentSessionId === sessionId ? [] : state.messages,
          }));
        },

        updateSessionTitle: (sessionId, title) => {
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId
                ? { ...s, title, updatedAt: new Date().toISOString() }
                : s
            ),
          }));
        },

        addMessage: (message) => {
          const newMessage: Message = {
            ...message,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          };

          set((state) => ({
            messages: [...state.messages, newMessage],
            sessions: state.sessions.map((s) =>
              s.id === state.currentSessionId
                ? {
                    ...s,
                    messageCount: s.messageCount + 1,
                    updatedAt: new Date().toISOString(),
                  }
                : s
            ),
          }));
        },

        updateMessage: (id, updates) => {
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === id ? { ...m, ...updates } : m
            ),
          }));
        },

        clearMessages: () => {
          set({ messages: [] });
        },

        setLoading: (isLoading) => set({ isLoading }),
        setStreaming: (isStreaming) => set({ isStreaming }),
        setError: (error) => set({ error }),

        setProvider: (provider) => set({ provider }),
        setModel: (model) => set({ model }),
        setTemperature: (temperature) => set({ temperature }),

        // AG-UI Event Handler
        handleAGUIEvent: (event) => {
          const { type } = event;

          switch (type) {
            case EventType.RUN_STARTED:
              const runStarted = event as any;
              set({
                currentRunId: runStarted.runId,
                isLoading: true,
                error: null
              });
              break;

            case EventType.TEXT_MESSAGE_START:
              const msgStart = event as any;
              get().startStreamingMessage(msgStart.messageId, msgStart.role || 'assistant');
              break;

            case EventType.TEXT_MESSAGE_CONTENT:
              const msgContent = event as any;
              get().appendToStreamingMessage(msgContent.delta);
              break;

            case EventType.TEXT_MESSAGE_END:
              get().completeStreamingMessage();
              break;

            case EventType.RUN_FINISHED:
              set({
                isLoading: false,
                isStreaming: false,
                currentRunId: null
              });
              break;

            case EventType.RUN_ERROR:
              const runError = event as any;
              set({
                error: runError.message,
                isLoading: false,
                isStreaming: false
              });
              break;

            default:
              // Handle other event types as needed
              break;
          }
        },

        // Start a new streaming message
        startStreamingMessage: (messageId, role) => {
          const newMessage: Message = {
            id: messageId,
            role,
            content: '',
            timestamp: new Date().toISOString(),
            metadata: { messageId },
          };

          set((state) => ({
            messages: [...state.messages, newMessage],
            streamingMessageId: messageId,
            isStreaming: true,
          }));
        },

        // Append delta to streaming message
        appendToStreamingMessage: (delta) => {
          const { streamingMessageId } = get();
          if (!streamingMessageId) return;

          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === streamingMessageId
                ? { ...m, content: m.content + delta }
                : m
            ),
          }));
        },

        // Complete the streaming message
        completeStreamingMessage: () => {
          set({
            streamingMessageId: null,
            isStreaming: false
          });
        },

        // Set current run ID
        setCurrentRun: (runId) => {
          set({ currentRunId: runId });
        },

        // Convert store messages to AG-UI format
        toAGUIMessages: () => {
          const { messages } = get();
          return messages.map((msg): AGUIMessage => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
          }));
        },

        // Convert AG-UI message to store format
        fromAGUIMessage: (aguiMessage) => {
          return {
            id: aguiMessage.id,
            role: aguiMessage.role as 'user' | 'assistant' | 'system',
            content: aguiMessage.content || '',
            timestamp: new Date().toISOString(),
            metadata: {
              messageId: aguiMessage.id,
            },
          };
        },

        reset: () => set(initialState),
      }),
      {
        name: 'chat-storage',
        // Only persist sessions and settings, not messages (too large)
        partialize: (state) => ({
          sessions: state.sessions,
          provider: state.provider,
          model: state.model,
          temperature: state.temperature,
        }),
      }
    ),
    { name: 'ChatStore' }
  )
);

// Selectors for performance
export const useChatMessages = () =>
  useChatStore((state) => state.messages);

export const useChatSessions = () =>
  useChatStore((state) => state.sessions);

export const useCurrentSession = () =>
  useChatStore((state) =>
    state.sessions.find((s) => s.id === state.currentSessionId)
  );

export const useChatLoading = () =>
  useChatStore((state) => ({
    isLoading: state.isLoading,
    isStreaming: state.isStreaming,
  }));

export const useChatProvider = () =>
  useChatStore((state) => ({
    provider: state.provider,
    model: state.model,
    temperature: state.temperature,
  }));
