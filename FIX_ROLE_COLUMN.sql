-- Check the current profiles table structure to see what columns are required
-- Run this in your Supabase SQL Editor

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- The error shows there's a 'role' column that's NOT NULL
-- Let's see what's in there and fix it

-- Make the role column nullable since we moved it to the users table
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;

-- Or better yet, update existing records to have a default role
UPDATE public.profiles SET role = 'athlete' WHERE role IS NULL;

-- Then make it nullable
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;

-- Test the fix
SELECT 'Testing profiles table structure' as status;
INSERT INTO public.profiles (user_id, username, display_name, full_name, city, account_visibility, discoverability_policy, message_policy, verification_status, trusted_status)
VALUES ('00000000-0000-0000-0000-000000000001', 'test_user', 'Test User', 'Test User', 'Test City', 'public', 'everyone', 'requests', 'unverified', 'none')
ON CONFLICT (id) DO NOTHING;

-- Check if the test record was created
SELECT * FROM public.profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Clean up test
DELETE FROM public.profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';

SELECT 'Role column fix completed' as status;
