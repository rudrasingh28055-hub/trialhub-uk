-- SQL introspection to find the exact failing trigger/function
-- Run this in Supabase SQL Editor

-- Step 1: Check all triggers that might run on auth.users insertion
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Step 2: Check for any functions that might be called during signup
SELECT 
  proname,
  prosrc,
  prolang
FROM pg_proc 
WHERE proname ILIKE '%auth%' 
   OR proname ILIKE '%user%' 
   OR proname ILIKE '%signup%'
   OR proname ILIKE '%profile%'
ORDER BY proname;

-- Step 3: Check for any functions that reference auth.users
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE prosrc ILIKE '%auth.users%'
ORDER BY proname;

-- Step 4: Check if there are any triggers that specifically target auth.users
-- (This might require checking the auth schema directly)
SELECT 
  n.nspname AS schema_name,
  c.relname AS table_name,
  t.tgname AS trigger_name,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth'
  AND c.relname = 'users';

-- Step 5: Check table constraints that might cause issues
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name IN ('users', 'profiles')
  AND tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;
