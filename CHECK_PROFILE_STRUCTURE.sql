-- Fix profile creation by updating the setup process
-- Run this in your Supabase SQL Editor to see what's happening

-- Check current profiles table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what's in the profiles table
SELECT * FROM public.profiles LIMIT 3;

-- Check what's in the users table
SELECT * FROM public.users LIMIT 3;
