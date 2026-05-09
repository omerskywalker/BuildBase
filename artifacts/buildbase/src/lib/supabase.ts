import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createSupabaseClient> | null = null;

function extractValue(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/^["']|["']$/g, "");
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx !== -1 && !trimmed.startsWith("http")) {
    return trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  }
  return trimmed;
}

export function createClient() {
  if (_client) return _client;

  const url = extractValue(import.meta.env.VITE_SUPABASE_URL as string | undefined);
  const key = extractValue(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

  if (!url) {
    throw new Error("VITE_SUPABASE_URL is not configured. Please add it to Secrets.");
  }
  if (!key) {
    throw new Error("VITE_SUPABASE_ANON_KEY is not configured. Please add it to Secrets.");
  }

  try {
    new URL(url);
  } catch {
    throw new Error(`VITE_SUPABASE_URL is not a valid URL: "${url}"`);
  }

  _client = createSupabaseClient(url, key);
  return _client;
}
