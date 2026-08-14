-- ========================================================
-- ACCOUNTS TABLE SCHEMA & SECURITY POLICIES
-- ========================================================

-- 1. Create accounts table in public schema
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_name TEXT NOT NULL UNIQUE,
  operator_name TEXT NOT NULL,
  email TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Explicit Data API Grants (Required for Supabase REST API)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.accounts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.accounts TO anon;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for Accounts Table
DROP POLICY IF EXISTS "accounts_select_policy" ON public.accounts;
CREATE POLICY "accounts_select_policy" ON public.accounts
FOR SELECT USING (true);

DROP POLICY IF EXISTS "accounts_insert_policy" ON public.accounts;
CREATE POLICY "accounts_insert_policy" ON public.accounts
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "accounts_update_policy" ON public.accounts;
CREATE POLICY "accounts_update_policy" ON public.accounts
FOR UPDATE USING (true);

DROP POLICY IF EXISTS "accounts_delete_policy" ON public.accounts;
CREATE POLICY "accounts_delete_policy" ON public.accounts
FOR DELETE USING (true);