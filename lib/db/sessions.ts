/**
 * Database helper functions for agent sessions
 */

import { createClient } from '@/lib/supabase-server';

export interface AgentSession {
  id: string;
  organization_id: string;
  user_id: string;
  agent_type: string;
  status: 'active' | 'archived' | 'completed';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionParams {
  organizationId: string;
  userId: string;
  agentType: string;
  metadata?: Record<string, any>;
}

export interface UpdateSessionParams {
  status?: 'active' | 'archived' | 'completed';
  metadata?: Record<string, any>;
}

/**
 * Create a new agent session
 */
export async function createSession(
  params: CreateSessionParams
): Promise<AgentSession | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('agent_sessions')
      .insert({
        organization_id: params.organizationId,
        user_id: params.userId,
        agent_type: params.agentType,
        status: 'active',
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
}

/**
 * Get a session by ID
 */
export async function getSession(sessionId: string): Promise<AgentSession | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('agent_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(
  userId: string,
  options?: {
    status?: 'active' | 'archived' | 'completed';
    limit?: number;
    offset?: number;
  }
): Promise<AgentSession[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('agent_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return [];
  }
}

/**
 * Update a session
 */
export async function updateSession(
  sessionId: string,
  params: UpdateSessionParams
): Promise<AgentSession | null> {
  try {
    const supabase = await createClient();

    const updateData: Partial<AgentSession> = {};

    if (params.status) {
      updateData.status = params.status;
    }

    if (params.metadata) {
      updateData.metadata = params.metadata;
    }

    const { data, error } = await supabase
      .from('agent_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating session:', error);
    return null;
  }
}

/**
 * Delete a session (and all associated messages via cascade)
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('agent_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Error deleting session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
}

/**
 * Archive a session (soft delete)
 */
export async function archiveSession(sessionId: string): Promise<boolean> {
  const result = await updateSession(sessionId, { status: 'archived' });
  return result !== null;
}
