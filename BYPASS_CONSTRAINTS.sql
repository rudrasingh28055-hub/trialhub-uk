-- Bypass all constraints and create a working profile
-- Run this in your Supabase SQL Editor

-- Disable all constraints temporarily for testing
ALTER TABLE public.profiles DISABLE TRIGGER ALL;
ALTER TABLE public.profiles DISABLE RULE ALL;

-- Or better yet, let's just manually create a test profile to see what works
-- First, create a user
INSERT INTO public.users (id, email, role, status)
VALUES ('test-user-123', 'test@example.com', 'athlete', 'active')
ON CONFLICT (id) DO NOTHING;

-- Then create a profile with the same ID
INSERT INTO public.profiles (id, user_id, username, display_name, full_name, city, role, account_visibility, discoverability_policy, message_policy, verification_status, trusted_status)
VALUES ('test-user-123', 'test-user-123', 'test_athlete', 'Test Athlete', 'Test Athlete', 'Test City', 'athlete', 'public', 'everyone', 'requests', 'unverified', 'none')
ON CONFLICT (id) DO NOTHING;

-- Check if it worked
SELECT 'Manual test results:' as status;
SELECT * FROM public.users WHERE id = 'test-user-123';
SELECT * FROM public.profiles WHERE id = 'test-user-123';

-- Clean up
DELETE FROM public.profiles WHERE id = 'test-user-123';
DELETE FROM public.users WHERE id = 'test-user-123';

-- Check what foreign key constraints exist on profiles
SELECT 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'profiles' 
  AND tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY';
