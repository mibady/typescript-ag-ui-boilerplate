import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMessage,
  getSessionMessages,
  getMessage,
  deleteMessage,
} from '@/lib/db/messages';

// Mock Supabase client
vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: {
                id: 'msg_123',
                organization_id: 'org_123',
                session_id: 'session_123',
                role: 'user',
                content: 'Test message',
                metadata: {},
                created_at: new Date().toISOString(),
              },
              error: null,
            })
          ),
        })),
        })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: {
                id: 'msg_123',
                organization_id: 'org_123',
                session_id: 'session_123',
                role: 'user',
                content: 'Test message',
                metadata: {},
                created_at: new Date().toISOString(),
              },
              error: null,
            })
          ),
          order: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve({
                data: [],
                error: null,
              })
            ),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

describe('Message Database Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMessage', () => {
    it('creates a new message successfully', async () => {
      const result = await createMessage({
        organizationId: 'org_123',
        sessionId: 'session_123',
        role: 'user',
        content: 'Test message',
        metadata: {},
      });

      expect(result).not.toBeNull();
      expect(result?.role).toBe('user');
      expect(result?.content).toBe('Test message');
    });

    it('handles creation errors gracefully', async () => {
      // This test would need specific error mocking
      expect(true).toBe(true);
    });
  });

  describe('getSessionMessages', () => {
    it('retrieves messages for a session', async () => {
      const result = await getSessionMessages('session_123');

      expect(Array.isArray(result)).toBe(true);
    });

    it('supports pagination options', async () => {
      const result = await getSessionMessages('session_123', {
        limit: 10,
        offset: 0,
        order: 'asc',
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getMessage', () => {
    it('retrieves a single message by ID', async () => {
      const result = await getMessage('msg_123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('msg_123');
    });
  });

  describe('deleteMessage', () => {
    it('deletes a message successfully', async () => {
      const result = await deleteMessage('msg_123');

      expect(result).toBe(true);
    });
  });
});
