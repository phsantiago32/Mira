/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO CRÍTICO: Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas.');
  if (typeof window !== 'undefined') {
    // Only alert once to avoid infinite loops if this module is re-imported
    if (!(window as any)._mira_env_alerted) {
      (window as any)._mira_env_alerted = true;
      alert('⚠️ Atenção: As chaves do MIRA não foram encontradas no Vercel (falta o prefixo VITE_). O site poderá ficar branco ou não funcionar corretamente até que sejam corrigidas nas definições do projeto.');
    }
  }
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
