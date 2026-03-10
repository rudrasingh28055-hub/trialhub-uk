-- Fix stack depth issue by disabling problematic RLS policies temporarily
-- Run this in your Supabase SQL Editor

-- Drop problematic RLS policies that might cause recursion
DROP POLICY IF EXISTS profiles_select_visible ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;

-- Drop triggers that might cause recursion
DROP TRIGGER IF EXISTS trg_profiles_set_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS trg_users_set_updated_at ON public.users;

-- Test basic query
SELECT 'Testing basic profiles query' as status;
SELECT COUNT(*) as profile_count FROM public.profiles LIMIT 1;

SELECT 'Testing basic users query' as status;
SELECT COUNT(*) as user_count FROM public.users LIMIT 1;

-- Show sample data
SELECT 'Sample profiles:' as status;
SELECT id, username, full_name FROM public.profiles LIMIT 3;

SELECT 'Sample users:' as status;
SELECT id, email, role FROM public.users LIMIT 3;
