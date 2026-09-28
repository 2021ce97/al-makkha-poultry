import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function isValidHttpUrl(urlString?: string): boolean {
  if (!urlString || typeof urlString !== 'string') return false;
  const trimmed = urlString.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null' || trimmed.startsWith('YOUR_')) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function initSupabase(): SupabaseClient | null {
  const url = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  const anonKey = typeof rawAnonKey === 'string' ? rawAnonKey.trim() : '';

  if (!url || !anonKey) {
    return null;
  }

  if (!isValidHttpUrl(url)) {
    console.warn(`[Supabase] Invalid or placeholder URL provided: "${url}". Running in offline mode.`);
    return null;
  }

  try {
    return createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  } catch (err) {
    console.warn('[Supabase] Failed to initialize Supabase client:', err);
    return null;
  }
}

export const supabase = initSupabase();

