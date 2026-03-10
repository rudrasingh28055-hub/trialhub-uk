-- Check for any triggers that might be failing on auth.users insertion
-- This is likely the root cause of the signup failure

-- Look for any functions that reference auth.users
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE prosrc ILIKE '%auth.users%'
   OR prosrc ILIKE '%insert%'
   OR prosrc ILIKE '%sign%'
ORDER BY proname;

-- Check for any triggers that might run on auth.users (even though they're in a different schema)
SELECT 
  event_object_table,
  trigger_name,
  action_timing,
  action_condition,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND (action_statement ILIKE '%auth.users%' OR action_statement ILIKE '%insert%');

-- The most likely issue: there might be a trigger trying to insert into public.users 
-- when a new auth.users is created, but the profiles table constraints are failing

-- Let's check if there are any triggers that reference both auth.users and public.profiles
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND action_statement ILIKE '%profiles%';
