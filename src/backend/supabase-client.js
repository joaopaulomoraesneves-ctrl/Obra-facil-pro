// Obra Fácil Pro — Supabase Client futuro
// Este arquivo prepara a conexão, mas o sistema ainda funciona em modo local.
// A integração real deve ser feita no próximo pacote, com autenticação e sincronização.

let supabaseClient = null;

export async function getSupabaseClient() {
  const url = import.meta?.env?.VITE_SUPABASE_URL;
  const anonKey = import.meta?.env?.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (!supabaseClient) {
    const { createClient } = await import('@supabase/supabase-js');
    supabaseClient = createClient(url, anonKey);
  }

  return supabaseClient;
}

export function getStorageMode() {
  return import.meta?.env?.VITE_OBRA_FACIL_STORAGE_MODE || 'local';
}
