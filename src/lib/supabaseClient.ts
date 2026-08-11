import { createClient } from "@supabase/supabase-js";

// Uses environment variables set by the Dyad Integration manager
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder-url-to-prevent-crashing.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key-to-prevent-crashing";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check if credentials have been populated correctly
export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!url && !!key && url !== "" && key !== "";
};