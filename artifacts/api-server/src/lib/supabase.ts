import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Request, Response } from "express";

export function createClient() {
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const key = process.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    throw new Error("Supabase credentials not configured");
  }

  return createSupabaseClient(url, key);
}

export function createServiceClient() {
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getAuthUser(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const token = authHeader.slice(7);
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return { user, supabase: createSupabaseClient(
    process.env.VITE_SUPABASE_URL!.trim(),
    process.env.VITE_SUPABASE_ANON_KEY!.trim(),
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )};
}
