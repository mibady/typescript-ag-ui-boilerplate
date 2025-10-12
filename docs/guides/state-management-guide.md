# State Management Guide with Zustand

Complete guide to using Zustand for state management in this boilerplate.

## What is Zustand?

Zustand is a **lightweight state management library** for React that provides:

- **Minimal boilerplate** - No providers, actions, or reducers
- **Simple API** - Just hooks and setState
- **Small bundle** - Only 1KB gzipped
- **TypeScript-first** - Excellent type inference
- **DevTools** - Redux DevTools integration
- **Persistence** - LocalStorage/SessionStorage support

**Why Zustand over Redux/Context?**
- 3x less code
- No prop drilling
- No context providers
- Better performance (selective subscriptions)

---

## Architecture

```
Components
    │
    ├─ useChatStore()      → Chat messages, sessions
    ├─ useUserStore()      → User, subscription, usage
    └─ useDocumentStore()  → Documents, search, upload
```

---

## Chat Store

### Overview

Manages:
- Chat sessions and messages
- LLM provider settings (OpenAI, Anthropic, etc.)
- Loading/streaming states
- UI state (errors, loading)

### Usage

```typescript
import { useChatStore, useChatMessages } from '@/lib/stores/chat-store';

function ChatComponent() {
  // Subscribe to all state (avoid this)
  const chatStore = useChatStore();

  // Better: Subscribe only to what you need
  const messages = useChatMessages();
  const isLoading = useChatStore((state) => state.isLoading);
  const addMessage = useChatStore((state) => state.addMessage);

  const handleSend = (content: string) => {
    addMessage({
      role: 'user',
      content,
    });

    // Send to API...
  };

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

### Session Management

```typescript
import { useChatStore } from '@/lib/stores/chat-store';

function SessionList() {
  const sessions = useChatStore((state) => state.sessions);
  const createSession = useChatStore((state) => state.createSession);
  const deleteSession = useChatStore((state) => state.deleteSession);
  const setCurrentSession = useChatStore((state) => state.setCurrentSession);

  return (
    <div>
      <button onClick={() => createSession('New Chat')}>
        New Chat
      </button>

      {sessions.map((session) => (
        <div key={session.id}>
          <button onClick={() => setCurrentSession(session.id)}>
            {session.title}
          </button>
          <button onClick={() => deleteSession(session.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Provider Settings

```typescript
import { useChatStore, useChatProvider } from '@/lib/stores/chat-store';

function ProviderSettings() {
  const { provider, model, temperature } = useChatProvider();
  const setProvider = useChatStore((state) => state.setProvider);
  const setTemperature = useChatStore((state) => state.setTemperature);

  return (
    <div>
      <select
        value={provider}
        onChange={(e) => setProvider(e.target.value as any)}
      >
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
        <option value="google">Google</option>
        <option value="mistral">Mistral</option>
      </select>

      <input
        type="range"
        min="0"
        max="2"
        step="0.1"
        value={temperature}
        onChange={(e) => setTemperature(parseFloat(e.target.value))}
      />
    </div>
  );
}
```

---

## User Store

### Overview

Manages:
- User profile (Clerk data)
- Current organization
- Subscription plan and limits
- Usage metrics

### Usage

```typescript
import {
  useUserStore,
  useSubscription,
  useSubscriptionStatus,
} from '@/lib/stores/user-store';

function SubscriptionBanner() {
  const subscription = useSubscription();
  const { isPro, isEnterprise, hasFeature, isWithinLimit } =
    useSubscriptionStatus();

  if (!subscription) {
    return <div>Loading subscription...</div>;
  }

  return (
    <div>
      <h2>{subscription.planDisplayName}</h2>
      <p>Status: {subscription.status}</p>

      {hasFeature('priority_support') && (
        <div>✨ You have priority support!</div>
      )}

      {!isWithinLimit('messages_per_month') && (
        <div className="warning">
          You've reached your message limit. Upgrade to continue.
        </div>
      )}
    </div>
  );
}
```

### Fetching Subscription

```typescript
import { useUserStore } from '@/lib/stores/user-store';
import { useEffect } from 'react';

function SubscriptionLoader() {
  const fetchSubscription = useUserStore((state) => state.fetchSubscription);
  const isLoading = useUserStore((state) => state.isLoading);
  const error = useUserStore((state) => state.error);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <SubscriptionBanner />;
}
```

### Usage Limits

```typescript
import { useUserStore, useUsage } from '@/lib/stores/user-store';

function UsageDisplay() {
  const usage = useUsage();
  const subscription = useUserStore((state) => state.subscription);

  if (!usage || !subscription) return null;

  const limits = subscription.limits;

  return (
    <div>
      <div>
        Messages: {usage.messages_per_month} / {limits.messages_per_month}
      </div>
      <div>
        Tokens: {usage.tokens_per_month} / {limits.tokens_per_month}
      </div>
      <div>
        Documents: {usage.documents} / {limits.documents}
      </div>
    </div>
  );
}
```

---

## Document Store

### Overview

Manages:
- RAG document list
- Document upload state
- Hybrid search results
- Selected document

### Document List

```typescript
import { useDocuments, useDocumentStore } from '@/lib/stores/document-store';
import { useEffect } from 'react';

function DocumentList() {
  const documents = useDocuments();
  const fetchDocuments = useDocumentStore((state) => state.fetchDocuments);
  const setSelectedDocument = useDocumentStore(
    (state) => state.setSelectedDocument
  );

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div>
      {documents.map((doc) => (
        <div
          key={doc.id}
          onClick={() => setSelectedDocument(doc)}
          className="cursor-pointer"
        >
          <h3>{doc.title}</h3>
          <p>{doc.status}</p>
          <span>{doc.chunkCount} chunks</span>
        </div>
      ))}
    </div>
  );
}
```

### Document Upload

```typescript
import { useDocumentUpload } from '@/lib/stores/document-store';

function UploadButton() {
  const { isUploading, progress, upload } = useDocumentUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await upload(file);
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {isUploading && (
        <div>
          <progress value={progress} max={100} />
          <span>{progress}%</span>
        </div>
      )}
    </div>
  );
}
```

### Hybrid Search

```typescript
import { useDocumentSearch } from '@/lib/stores/document-store';
import { useState } from 'react';

function DocumentSearch() {
  const { query, results, isSearching, search, clearSearch } =
    useDocumentSearch();
  const [input, setInput] = useState('');

  const handleSearch = async () => {
    await search(input, true); // true = hybrid search
  };

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Search documents..."
      />
      <button onClick={handleSearch} disabled={isSearching}>
        {isSearching ? 'Searching...' : 'Search'}
      </button>

      {results.length > 0 && (
        <div>
          <button onClick={clearSearch}>Clear</button>

          {results.map((result) => (
            <div key={result.id}>
              <p>{result.content}</p>
              <span>Score: {(result.score * 100).toFixed(1)}%</span>
              <span>Source: {result.source}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Persistence

### Chat Store Persistence

Chat store persists to localStorage:
- Sessions list
- Provider settings (OpenAI, Anthropic, etc.)
- Temperature setting

**NOT persisted:**
- Messages (too large, load from API)
- Loading states

```typescript
// Automatically restored on page load
const sessions = useChatStore((state) => state.sessions);
// Will include sessions from previous session
```

### Clear Persisted Data

```typescript
// Clear chat store
useChatStore.persist.clearStorage();

// Reset to initial state
useChatStore.getState().reset();
```

---

## Performance Optimization

### Selective Subscriptions

❌ **Bad** - Re-renders on ANY state change:
```typescript
function Component() {
  const store = useChatStore(); // Subscribes to everything
  return <div>{store.messages.length}</div>;
}
```

✅ **Good** - Re-renders only when messages change:
```typescript
function Component() {
  const messageCount = useChatStore((state) => state.messages.length);
  return <div>{messageCount}</div>;
}
```

✅ **Best** - Custom selector hook:
```typescript
// In chat-store.ts
export const useChatMessages = () =>
  useChatStore((state) => state.messages);

// In component
function Component() {
  const messages = useChatMessages();
  return <div>{messages.length}</div>;
}
```

### Avoiding Re-renders

Use `shallow` for object equality:
```typescript
import { shallow } from 'zustand/shallow';

const { provider, model } = useChatStore(
  (state) => ({ provider: state.provider, model: state.model }),
  shallow // Compares by value, not reference
);
```

---

## DevTools Integration

### Enable Redux DevTools

Already enabled in stores:
```typescript
export const useChatStore = create<ChatState>()(
  devtools(
    // ... store implementation
    { name: 'ChatStore' } // Appears in DevTools
  )
);
```

### Using DevTools

1. Install Redux DevTools browser extension
2. Open DevTools
3. Go to "Redux" tab
4. Select store (ChatStore, UserStore, DocumentStore)
5. View state changes in real-time

**Features:**
- Time-travel debugging
- Action replay
- State diff viewer
- Export/import state

---

## Testing

### Testing Components with Zustand

```typescript
import { renderHook, act } from '@testing-library/react';
import { useChatStore } from '@/lib/stores/chat-store';

describe('ChatStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useChatStore.getState().reset();
  });

  it('adds a message', () => {
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.addMessage({
        role: 'user',
        content: 'Hello!',
      });
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Hello!');
  });

  it('creates a session', () => {
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.createSession('Test Chat');
    });

    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].title).toBe('Test Chat');
  });
});
```

---

## Best Practices

### 1. Use Selectors

Create custom selector hooks for common patterns:
```typescript
// In store file
export const useActiveSessions = () =>
  useChatStore((state) =>
    state.sessions.filter((s) => s.messageCount > 0)
  );
```

### 2. Avoid Nested State

❌ **Bad:**
```typescript
interface State {
  user: {
    profile: {
      settings: {
        theme: string;
      };
    };
  };
}
```

✅ **Good:**
```typescript
interface State {
  userProfile: UserProfile;
  userSettings: UserSettings;
}
```

### 3. Use Actions, Not Direct State

❌ **Bad:**
```typescript
useChatStore.setState({ messages: [...messages, newMessage] });
```

✅ **Good:**
```typescript
const addMessage = useChatStore((state) => state.addMessage);
addMessage(newMessage);
```

### 4. Keep Stores Focused

- One store per domain (chat, user, documents)
- Don't mix unrelated concerns
- Split large stores into smaller ones

---

## Migration from Context/Redux

### From Context

**Before (Context):**
```typescript
const ChatContext = createContext();

function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);

  return (
    <ChatContext.Provider value={{ messages, setMessages }}>
      {children}
    </ChatContext.Provider>
  );
}

function Component() {
  const { messages } = useContext(ChatContext);
  return <div>{messages.length}</div>;
}
```

**After (Zustand):**
```typescript
// No provider needed!

function Component() {
  const messages = useChatMessages();
  return <div>{messages.length}</div>;
}
```

### From Redux

**Before (Redux):**
```typescript
// Action types
const ADD_MESSAGE = 'ADD_MESSAGE';

// Actions
const addMessage = (message) => ({
  type: ADD_MESSAGE,
  payload: message,
});

// Reducer
function chatReducer(state = initialState, action) {
  switch (action.type) {
    case ADD_MESSAGE:
      return { ...state, messages: [...state.messages, action.payload] };
    default:
      return state;
  }
}

// Usage
const dispatch = useDispatch();
dispatch(addMessage(newMessage));
```

**After (Zustand):**
```typescript
const addMessage = useChatStore((state) => state.addMessage);
addMessage(newMessage);
```

**Result:** 70% less code, same functionality!

---

## Common Patterns

### Loading States

```typescript
interface State {
  data: Data | null;
  isLoading: boolean;
  error: string | null;

  fetch: () => Promise<void>;
}

fetch: async () => {
  set({ isLoading: true, error: null });

  try {
    const data = await fetchData();
    set({ data, isLoading: false });
  } catch (error) {
    set({ error: error.message, isLoading: false });
  }
}
```

### Optimistic Updates

```typescript
deleteDocument: async (id) => {
  // Optimistic update
  set((state) => ({
    documents: state.documents.filter((d) => d.id !== id),
  }));

  try {
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
  } catch (error) {
    // Rollback on error
    await get().fetchDocuments();
  }
}
```

---

## Resources

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Zustand Best Practices](https://docs.pmnd.rs/zustand/guides/best-practices)
- [TypeScript Guide](https://docs.pmnd.rs/zustand/guides/typescript)

---

**Last Updated:** 2025-10-11
**Version:** 1.0.0
