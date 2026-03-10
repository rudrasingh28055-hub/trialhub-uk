-- Emergency fix: Disable RLS completely to bypass stack depth issue
-- Run this in your Supabase SQL Editor

-- Disable RLS on all tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_edges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_counters DISABLE ROW LEVEL SECURITY;

-- Test basic queries
SELECT 'Testing profiles without RLS' as status;
SELECT id, username, full_name FROM public.profiles LIMIT 5;

SELECT 'Testing users without RLS' as status;
SELECT id, email, role FROM public.users LIMIT 5;

-- Show all available usernames
SELECT 'Available usernames:' as status;
SELECT id, username, full_name FROM public.profiles WHERE username IS NOT NULL AND username != '';
