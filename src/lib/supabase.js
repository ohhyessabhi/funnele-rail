import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * `isSupabaseConfigured` lets the UI show a helpful setup message instead of
 * crashing when the env vars are missing (e.g. first `npm run dev` before
 * `.env.local` is filled in).
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null;
