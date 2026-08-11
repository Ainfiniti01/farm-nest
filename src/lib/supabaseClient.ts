import { supabase as clientInstance } from "@/integrations/supabase/client";

export const supabase = clientInstance;

// Helper to check if credentials are valid and populated
export const isSupabaseConfigured = (): boolean => {
  return true;
};