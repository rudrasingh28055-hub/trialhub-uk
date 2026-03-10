-- Check RLS policies that might be blocking signup
-- Run this in your Supabase SQL Editor

-- Check if RLS is enabled on users table
SELECT relname, relrowsecurity, relforcerowsecurity
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

-- Check if RLS is enabled on profiles table
SELECT relname, relrowsecurity, relforcerowsecurity
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
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check if there are any foreign key constraints that might fail during signup
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
WHERE tc.table_name IN ('users', 'profiles')
  AND tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY';
