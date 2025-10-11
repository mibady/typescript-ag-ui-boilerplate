/**
 * Database helper functions for messages
 */

import { createClient } from '@/lib/supabase-server';

export interface Message {
  id: string;
  organization_id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateMessageParams {
  organizationId: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Create a new message
 */
export async function createMessage(
  params: CreateMessageParams
): Promise<Message | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('messages')
      .insert({
        organization_id: params.organizationId,
        session_id: params.sessionId,
        role: params.role,
        content: params.content,
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating message:', error);
    return null;
  }
}

/**
 * Create multiple messages in a batch
 */
export async function createMessages(
  params: CreateMessageParams[]
): Promise<Message[]> {
  try {
    const supabase = await createClient();

    const messagesToInsert = params.map((p) => ({
      organization_id: p.organizationId,
      session_id: p.sessionId,
      role: p.role,
      content: p.content,
      metadata: p.metadata || {},
    }));

    const { data, error } = await supabase
      .from('messages')
      .insert(messagesToInsert)
      .select();

    if (error) {
      console.error('Error creating messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error creating messages:', error);
    return [];
  }
}

/**
 * Get all messages for a session
 */
export async function getSessionMessages(
  sessionId: string,
  options?: {
    limit?: number;
    offset?: number;
    order?: 'asc' | 'desc';
  }
): Promise<Message[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: options?.order === 'asc' });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 50) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching session messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching session messages:', error);
    return [];
  }
}

/**
 * Get a single message by ID
 */
export async function getMessage(messageId: string): Promise<Message | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error) {
      console.error('Error fetching message:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching message:', error);
    return null;
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
}

/**
 * Delete all messages for a session
 */
export async function deleteSessionMessages(sessionId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error deleting session messages:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting session messages:', error);
    return false;
  }
}

/**
 * Get message count for a session
 */
export async function getSessionMessageCount(sessionId: string): Promise<number> {
  try {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error counting session messages:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error counting session messages:', error);
    return 0;
  }
}

/**
 * Get the last N messages for a session (useful for context window)
 */
export async function getRecentSessionMessages(
  sessionId: string,
  limit: number = 10
): Promise<Message[]> {
  return getSessionMessages(sessionId, { limit, order: 'desc' });
}
