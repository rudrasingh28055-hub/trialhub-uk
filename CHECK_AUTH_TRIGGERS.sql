-- Check for triggers that run on auth.users (these could be causing the signup failure)
-- Run this in your Supabase SQL Editor

-- Check all triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_condition,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Specifically check for triggers on auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table = 'users'
  AND event_object_table LIKE 'auth.%';

-- Check for any functions that might be called by triggers
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE proname LIKE '%user%' 
  OR proname LIKE '%auth%' 
  OR proname LIKE '%signup%'
ORDER BY proname
LIMIT 10;
