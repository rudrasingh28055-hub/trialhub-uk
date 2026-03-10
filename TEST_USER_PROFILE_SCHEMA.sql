-- Test the user/profile schema relationships
-- Run this to verify the schema is working correctly

-- Check current auth user
SELECT 'Current auth users' as status;
SELECT id, email, created_at FROM auth.users LIMIT 3;

-- Check users table
SELECT 'users table' as status;
SELECT id, email, role, status FROM public.users LIMIT 3;

-- Check profiles table  
SELECT 'profiles table' as status;
SELECT id, user_id, full_name, city FROM public.profiles LIMIT 3;

-- Test the relationship
SELECT 'user-profile relationship' as status;
SELECT 
  u.id as user_id,
  u.email,
  u.role as user_role,
  p.id as profile_id,
  p.full_name,
  p.city
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LIMIT 3;

-- Check if there are any athletes
SELECT 'athlete profiles' as status;
SELECT COUNT(*) as count FROM public.users WHERE role = 'athlete';

-- Test what the component query should return
SELECT 'component query simulation' as status;
SELECT 
  u.id,
  u.email,
  u.role,
  p.id as profile_id,
  p.full_name,
  p.city,
  p.avatar_url
FROM public.users u
JOIN public.profiles p ON u.id = p.user_id
WHERE u.id = (SELECT id FROM public.users WHERE role = 'athlete' LIMIT 1);
