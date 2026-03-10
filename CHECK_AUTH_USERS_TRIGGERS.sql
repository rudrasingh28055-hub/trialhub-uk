-- Check if there are any triggers that run on auth.users insertion
-- This is the most likely cause of "Database error saving new user"

-- Check for any functions that might be triggered during auth signup
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE prosrc ILIKE '%auth.users%'
   OR prosrc ILIKE '%signUp%'
   OR prosrc ILIKE '%signup%'
ORDER BY proname;

-- Check for any existing triggers that might reference profiles during signup
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND (action_statement ILIKE '%profiles%' OR action_statement ILIKE '%users%');

-- Check if there's a trigger that creates profiles when auth.users is inserted
-- This would be the root cause of the signup failure
SELECT 
  n.nspname AS schema_name,
  c.relname AS table_name,
  t.tgname AS trigger_name,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth'
  AND c.relname = 'users'
  AND NOT t.tgisinternal;
