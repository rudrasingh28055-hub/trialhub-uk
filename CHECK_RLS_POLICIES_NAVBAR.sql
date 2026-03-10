-- Check if RLS policies are blocking the navbar profile reads
-- Run this in Supabase SQL Editor

-- Check if RLS is enabled and what policies exist for users table
SELECT 
  relname, 
  relrowsecurity, 
  relforcerowsecurity
FROM pg_class 
WHERE relname = 'users' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check RLS policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Check if RLS is enabled for profiles table
SELECT 
  relname, 
  relrowsecurity, 
  relforcerowsecurity
FROM pg_class 
WHERE relname = 'profiles' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Ensure server-side policies allow reads for authenticated users
-- These should already exist from our previous fix, but let's verify
SELECT 'Checking existing policies...' as status;
