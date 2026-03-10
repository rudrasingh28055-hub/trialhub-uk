-- Proper fix for profiles table structure
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the primary key constraint on 'id'
ALTER TABLE public.profiles DROP CONSTRAINT profiles_pkey;

-- Step 2: Make 'id' nullable  
ALTER TABLE public.profiles ALTER COLUMN id DROP NOT NULL;

-- Step 3: Update existing records to have matching id and user_id
UPDATE public.profiles SET id = user_id WHERE id IS NULL AND user_id IS NOT NULL;

-- Step 4: Create new primary key on user_id (this is what we want for Sprint 1)
ALTER TABLE public.profiles ADD PRIMARY KEY (user_id);

-- Step 5: Create unique constraint on username if not exists
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);

-- Test the fix
SELECT 'Testing profiles table structure' as status;
INSERT INTO public.profiles (user_id, username, display_name, full_name, city, account_visibility, discoverability_policy, message_policy, verification_status, trusted_status)
VALUES ('00000000-0000-0000-0000-000000000001', 'test_user', 'Test User', 'Test User', 'Test City', 'public', 'everyone', 'requests', 'unverified', 'none')
ON CONFLICT (user_id) DO NOTHING;

-- Clean up test
DELETE FROM public.profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';

SELECT 'Fix completed successfully' as status;

-- Show the new structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;
