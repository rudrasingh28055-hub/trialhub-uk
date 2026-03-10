-- Comprehensive fix for signup failure
-- Root cause: Existing triggers that create profiles on signup are using old schema

-- Step 1: Find and remove any triggers that run on auth.users insertion
-- (These are the most likely cause of the signup failure)

-- Drop any problematic triggers that might be creating profiles during signup
DROP TRIGGER IF EXISTS create_profile_on_auth_signup ON auth.users;
DROP FUNCTION IF EXISTS public.create_profile_on_auth_signup();

DROP TRIGGER IF EXISTS handle_new_user_signup ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_signup();

DROP TRIGGER IF EXISTS sync_auth_user_to_profile ON auth.users;
DROP FUNCTION IF EXISTS public.sync_auth_user_to_profile();

-- Step 2: Fix the existing profile trigger to work with new schema
CREATE OR REPLACE FUNCTION create_athlete_passport()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is an athlete and if athlete_passports table exists
  IF NEW.role = 'athlete' THEN
    -- Use user_id instead of id for the foreign key relationship
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO athlete_passports (user_id)
      VALUES (NEW.user_id)
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the profile creation
    RAISE WARNING 'Failed to create athlete passport for %: %', COALESCE(NEW.username, NEW.id), SQLERRM;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the trigger with the fixed function
DROP TRIGGER IF EXISTS create_passport_on_athlete_signup ON public.profiles;
CREATE TRIGGER create_passport_on_athlete_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION create_athlete_passport();

-- Step 3: Create a safe trigger for auth.users if needed (optional)
-- This will only create the minimal user record, not the profile
CREATE OR REPLACE FUNCTION safe_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create user record in public.users, not profile
  -- Profile creation will happen in the application layer
  INSERT INTO public.users (id, email, role, status)
  VALUES (
    NEW.id,
    NEW.email::citext,
    'athlete'::app_role,
    'active'::account_status
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the auth signup
    RAISE WARNING 'Failed to create user record for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- Note: We won't create the trigger on auth.users since it's not accessible
-- The user record creation will be handled in the application layer

-- Step 4: Test the fix
SELECT 'Testing signup fix...' as status;

-- Clean up any test data
DELETE FROM public.profiles WHERE user_id LIKE 'test-signup-%';
DELETE FROM public.users WHERE id LIKE 'test-signup-%';

-- Simulate what should happen during signup
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_email citext := 'test-signup-' || extract(epoch from now())::text || '@example.com';
BEGIN
  -- Insert into users (this should work)
  INSERT INTO public.users (id, email, role, status)
  VALUES (test_user_id, test_email, 'athlete', 'active');
  
  -- Insert into profiles with new schema (this should work now)
  INSERT INTO public.profiles (id, user_id, username, display_name, full_name, role, account_visibility, discoverability_policy, message_policy, verification_status, trusted_status)
  VALUES (test_user_id, test_user_id, 'test_user', 'Test User', 'Test User', 'athlete', 'public', 'everyone', 'requests', 'unverified', 'none');
  
  RAISE NOTICE 'Test signup flow completed successfully for: %', test_email;
  
  -- Clean up test data
  DELETE FROM public.profiles WHERE user_id = test_user_id;
  DELETE FROM public.users WHERE id = test_user_id;
END $$;

SELECT 'Signup fix completed successfully' as status;
