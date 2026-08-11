import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://prnpvgzlrxwhohnyqlth.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ok0AUs-TKtHXpZQFSDKwYg_BIE2zHK9";

// Unified Supabase client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Guarantees Supabase Cloud integration is active
export const isSupabaseConfigured = (): boolean => true;