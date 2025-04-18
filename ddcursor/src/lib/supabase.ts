import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Types for our database schema
export type UserRole = 'consultant' | 'client' | 'company';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  created_at: string;
  last_login: string;
}

export interface Workspace {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  workspace_id: string;
  name: string;
  path: string;
  size: number;
  mime_type: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface Question {
  id: string;
  workspace_id: string;
  category: string;
  text: string;
  status: 'pending' | 'answered' | 'reviewed';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  question_id: string;
  text: string;
  created_by: string;
  created_at: string;
  updated_at: string;
} 