import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

// Ensure WebSocket constructor exists in Node.js runtime for Supabase client
if (typeof globalThis.WebSocket === 'undefined') {
  try {
    // @ts-ignore untyped dev dependency
    const ws = await import('ws');
    // @ts-ignore polyfill
    globalThis.WebSocket = ws.default || ws;
  } catch {
    // ws module not present
  }
}

import { getSupabaseConfig, isSupabaseConfigured } from '../lib/supabase/config';
import { getSupabaseClient } from '../lib/supabase/client';

async function checkSupabaseConnection() {
  console.log('--- SUPABASE CONNECTIVITY DIAGNOSTIC ---');
  const config = getSupabaseConfig();

  console.log('Config status:', config.statusMessage);
  console.log('URL:', config.supabaseUrl ? config.supabaseUrl.replace(/:[^@]+@/, ':***@') : '(none)');
  console.log('Anon Key Present:', !!config.supabaseAnonKey);
  console.log('Is Configured:', config.isConfigured);

  if (!config.isConfigured) {
    console.log('\n[RESULT] Supabase is NOT connected because environment variables contain placeholders.');
    console.log('To connect a live Supabase project:');
    console.log('1. Create a Supabase project at https://supabase.com');
    console.log('2. Apply migrations in supabase/migrations/ to your project');
    console.log('3. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
    return;
  }

  const client = getSupabaseClient();
  if (!client) {
    console.log('\n[RESULT] Client initialization failed.');
    return;
  }

  console.log('\nAttempting real read/write ping to Supabase...');
  try {
    const { data, error } = await client.from('players').select('id, name, user_id').limit(1);
    if (error) {
      console.error('[PING FAILED]', error.message);
      return;
    }
    console.log('[PING SUCCESSFUL] Connected to Supabase! Players query returned:', data);
  } catch (err) {
    console.error('[PING EXCEPTION]', err);
  }
}

checkSupabaseConnection().catch(console.error);
