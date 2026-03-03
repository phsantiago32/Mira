/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('As variáveis de ambiente do Supabase estão incompletas. Verifique o arquivo .env.local.');
}

// Module-level singleton: ensures only ONE client instance exists.
// This prevents NavigatorLock timeout errors when Vite HMR reloads modules 
// and multiple instances compete for the same 'mira-token-v4' lock.
let _client: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'mira-token-v4',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        // Bypass Navigator Locks entirely to prevent "lock acquire timeout" errors
        // from multiple tabs or HMR-triggered client re-creations.
        lock: ((_name: string, _acquireTimeout: number, fn: () => Promise<unknown>) => fn()) as Parameters<typeof createClient>[2]['auth']['lock'] & {}
      }
    });
  }
  return _client;
}

export const supabase = getSupabaseClient();
