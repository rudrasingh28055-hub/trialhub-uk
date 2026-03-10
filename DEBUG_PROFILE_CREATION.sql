-- Debug profile creation issues
-- Run this in your Supabase SQL Editor

-- Check if all required tables exist and their structure
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'profiles', 'athlete_profiles', 'club_profiles')
ORDER BY table_name;

-- Check profiles table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any constraints that might block inserts
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' AND table_schema = 'public';

-- Try a simple manual insert to see what fails
INSERT INTO public.users (id, email, role, status)
VALUES ('test-id-123', 'test@example.com', 'athlete', 'active')
ON CONFLICT (id) DO NOTHING;

-- Check if the insert worked
SELECT * FROM public.users WHERE id = 'test-id-123';

-- Clean up test data
DELETE FROM public.users WHERE id = 'test-id-123';
