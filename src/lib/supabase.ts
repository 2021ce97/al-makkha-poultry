import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lhnayouvcwvapzbxlolu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJsbGhuYXlvdXZjd3ZhcHpieGxvbHUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4OTkwMTU1OSwiZXhwIjoyMTA1NDc3NTU5fQ.xkeVWRLy6PYxaJIvW1RlKgDsjBS2_EAC5jzRyFdBFxk';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
