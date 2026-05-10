import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (_client) return _client;

  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

  if (!url) {
    throw new Error("VITE_SUPABASE_URL is not configured. Please add it to Secrets.");
  }
  if (!key) {
    throw new Error("VITE_SUPABASE_ANON_KEY is not configured. Please add it to Secrets.");
  }

  _client = createSupabaseClient(url, key);
  return _client;
}
