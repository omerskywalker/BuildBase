import { createClient } from "./supabase";

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const providedHeaders = init?.headers;
  if (providedHeaders) {
    const entries = providedHeaders instanceof Headers
      ? Array.from(providedHeaders.entries())
      : Object.entries(providedHeaders as Record<string, string>);
    for (const [k, v] of entries) headers[k] = v;
  }

  return fetch(path, { ...init, headers });
}
