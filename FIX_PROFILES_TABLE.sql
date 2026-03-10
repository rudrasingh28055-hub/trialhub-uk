-- Fix profiles table structure for Sprint 1
-- Run this in your Supabase SQL Editor

-- Check current profiles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- The issue: profiles table has both 'id' and 'user_id' columns
-- We need to either drop the 'id' column or populate it
-- Let's make 'id' nullable and use 'user_id' as the main identifier

ALTER TABLE public.profiles ALTER COLUMN id DROP NOT NULL;

-- Or better yet, let's update the id to be the same as user_id for existing records
UPDATE public.profiles SET id = user_id WHERE id IS NULL AND user_id IS NOT NULL;

-- Then make id nullable
ALTER TABLE public.profiles ALTER COLUMN id DROP NOT NULL;

-- Test the fix
SELECT 'Testing profiles table structure' as status;
INSERT INTO public.profiles (user_id, username, display_name, full_name, city, account_visibility, discoverability_policy, message_policy, verification_status, trusted_status)
VALUES ('00000000-0000-0000-0000-000000000001', 'test_user', 'Test User', 'Test User', 'Test City', 'public', 'everyone', 'requests', 'unverified', 'none')
ON CONFLICT (user_id) DO NOTHING;

-- Clean up test
DELETE FROM public.profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';

SELECT 'Fix completed successfully' as status;
