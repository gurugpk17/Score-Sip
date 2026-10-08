import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { getSupabaseConfig } from './config';

let supabaseInstance: SupabaseClient<Database> | null = null;
let hasLoggedConfigWarning = false;

/**
 * Returns the singleton Supabase client, or null if configuration is missing.
 * Prevents obscure crashes in local/offline environments.
 */
export function getSupabaseClient(): SupabaseClient<Database> | null {
  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    const isDev = typeof import.meta !== 'undefined' && Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV);
    if (!hasLoggedConfigWarning && isDev) {
      console.warn(
        `[Supabase Client] Offline / Local fallback active: ${config.statusMessage}.\n` +
        `Set valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local to enable cloud sync.`
      );
      hasLoggedConfigWarning = true;
    }
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      });
    } catch (err) {
      console.error('[Supabase Client] Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
}

/**
 * Convenience accessor for the Supabase client.
 */
export const supabase = getSupabaseClient();
