-- Test the player_profiles table structure and data
-- Run this to verify everything is working

-- Check if player_profiles table exists
SELECT 'Checking player_profiles table existence' as status;
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = 'player_profiles'
) as table_exists;

-- Show table structure if it exists
SELECT 'player_profiles table structure' as status;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'player_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for existing data
SELECT 'Existing player_profiles data' as status;
SELECT COUNT(*) as count FROM public.player_profiles;

-- Show sample data if any exists
SELECT 'Sample player_profiles data' as status;
SELECT * FROM public.player_profiles LIMIT 3;

-- Check profiles table
SELECT 'profiles table sample data' as status;
SELECT id, user_id, full_name, role FROM public.profiles LIMIT 3;

-- Test relationship
SELECT 'Testing profile-player relationship' as status;
SELECT 
  p.id as profile_id,
  p.full_name,
  pp.id as player_profile_id,
  pp.age,
  pp.primary_position
FROM public.profiles p
LEFT JOIN public.player_profiles pp ON p.id = pp.profile_id
WHERE p.role = 'athlete'
LIMIT 3;
