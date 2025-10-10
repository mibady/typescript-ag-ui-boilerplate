export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          clerk_org_id: string;
          name: string;
          industry: string | null;
          team_size: string | null;
          use_case: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_org_id: string;
          name: string;
          industry?: string | null;
          team_size?: string | null;
          use_case?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_org_id?: string;
          name?: string;
          industry?: string | null;
          team_size?: string | null;
          use_case?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          clerk_user_id: string;
          organization_id: string | null;
          email: string;
          first_name: string | null;
          last_name: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          organization_id?: string | null;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          organization_id?: string | null;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      agent_sessions: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          agent_type: string;
          status: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          agent_type: string;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          agent_type?: string;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          organization_id: string;
          session_id: string;
          role: 'user' | 'assistant' | 'system' | 'tool';
          content: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          session_id: string;
          role: 'user' | 'assistant' | 'system' | 'tool';
          content: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          session_id?: string;
          role?: 'user' | 'assistant' | 'system' | 'tool';
          content?: string;
          metadata?: Json;
          created_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          name: string;
          content: string;
          content_type: string | null;
          size_bytes: number | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          name: string;
          content: string;
          content_type?: string | null;
          size_bytes?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          name?: string;
          content?: string;
          content_type?: string | null;
          size_bytes?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_chunks: {
        Row: {
          id: string;
          organization_id: string;
          document_id: string;
          content: string;
          chunk_index: number;
          embedding: number[] | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          document_id: string;
          content: string;
          chunk_index: number;
          embedding?: number[] | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          document_id?: string;
          content?: string;
          chunk_index?: number;
          embedding?: number[] | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          expires_at: string | null;
          is_active: boolean;
          scopes: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          scopes?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          name?: string;
          key_hash?: string;
          key_prefix?: string;
          last_used_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          scopes?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      usage_tracking: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          resource_type: string;
          resource_id: string | null;
          action: string;
          tokens_used: number;
          cost_usd: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          resource_type: string;
          resource_id?: string | null;
          action: string;
          tokens_used?: number;
          cost_usd?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          resource_type?: string;
          resource_id?: string | null;
          action?: string;
          tokens_used?: number;
          cost_usd?: number;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_document_chunks: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
          filter_org_id: string;
        };
        Returns: {
          id: string;
          document_id: string;
          content: string;
          chunk_index: number;
          similarity: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
