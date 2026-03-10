-- Comprehensive fix for profiles table
-- Run this in your Supabase SQL Editor

-- First, let's see exactly what columns exist and their constraints
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what constraints exist
SELECT 
  constraint_name, 
  constraint_type,
  column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles' AND tc.table_schema = 'public'
ORDER BY constraint_type, constraint_name;

-- Fix the role column properly
-- Step 1: Drop any NOT NULL constraint on role
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;

-- Step 2: Update all NULL values to have a default
UPDATE public.profiles SET role = 'athlete' WHERE role IS NULL;

-- Step 3: Make sure it's nullable
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;

-- Test the complete profile creation process
SELECT 'Testing complete profile creation' as status;

-- Clean up any existing test data
DELETE FROM public.profiles WHERE user_id LIKE '00000000-0000-0000-0000-000000000001%';
DELETE FROM public.users WHERE id LIKE '00000000-0000-0000-0000-000000000001%';

-- Test full flow
INSERT INTO public.users (id, email, role, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'athlete', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (user_id, username, display_name, full_name, city, account_visibility, discoverability_policy, message_policy, verification_status, trusted_status)
VALUES ('00000000-0000-0000-0000-000000000001', 'test_user', 'Test User', 'Test User', 'Test City', 'public', 'everyone', 'requests', 'unverified', 'none')
ON CONFLICT (id) DO NOTHING;

-- Check if it worked
SELECT 'Checking created profile' as status;
SELECT * FROM public.profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Clean up test data
DELETE FROM public.profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM public.users WHERE id = '00000000-0000-0000-0000-000000000001';

SELECT 'Comprehensive fix completed' as status;
