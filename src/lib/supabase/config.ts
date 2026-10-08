/**
 * Supabase configuration constants and environment validation
 */

export const STORAGE_BUCKET_GAME_SNAPS = 'game-snaps';

export interface SupabaseEnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConfigured: boolean;
  statusMessage: string;
}

export function getSupabaseConfig(): SupabaseEnvConfig {
  const env: Record<string, string | undefined> =
    typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      ? (import.meta as unknown as { env: Record<string, string | undefined> }).env
      : typeof process !== 'undefined'
      ? process.env
      : {};

  const supabaseUrl = (env.VITE_SUPABASE_URL || '').trim();
  const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY || '').trim();

  const isPlaceholderUrl =
    !supabaseUrl ||
    supabaseUrl.includes('your-project') ||
    supabaseUrl.includes('example.com') ||
    !supabaseUrl.startsWith('http');

  const isPlaceholderKey =
    !supabaseAnonKey ||
    supabaseAnonKey.includes('your-anon-public-key') ||
    supabaseAnonKey.length < 20;

  if (isPlaceholderUrl || isPlaceholderKey) {
    return {
      supabaseUrl,
      supabaseAnonKey,
      isConfigured: false,
      statusMessage: isPlaceholderUrl
        ? 'VITE_SUPABASE_URL is missing or using placeholder URL'
        : 'VITE_SUPABASE_ANON_KEY is missing or using placeholder key'
    };
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    isConfigured: true,
    statusMessage: 'Supabase credentials detected'
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}
