-- Safer fix for profiles table - keep existing structure but make it work
-- Run this in your Supabase SQL Editor

-- Instead of changing the primary key, let's make the setup work with the existing structure
-- We'll populate the 'id' column with the same value as 'user_id' for new records

-- Step 1: Create a trigger to automatically set id = user_id for new records
CREATE OR REPLACE FUNCTION public.set_profile_id_from_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Step 2: Create trigger that runs before insert
DROP TRIGGER IF EXISTS trg_set_profile_id_from_user_id ON public.profiles;
CREATE TRIGGER trg_set_profile_id_from_user_id
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_profile_id_from_user_id();

-- Step 3: Update existing records where id is different from user_id
UPDATE public.profiles SET id = user_id WHERE id IS NULL OR id != user_id;

-- Step 4: Test the fix
SELECT 'Testing profiles table structure' as status;
INSERT INTO public.profiles (user_id, username, display_name, full_name, city, account_visibility, discoverability_policy, message_policy, verification_status, trusted_status)
VALUES ('00000000-0000-0000-0000-000000000001', 'test_user', 'Test User', 'Test User', 'Test City', 'public', 'everyone', 'requests', 'unverified', 'none')
ON CONFLICT (id) DO NOTHING;

-- Check if the test record was created correctly
SELECT * FROM public.profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Clean up test
DELETE FROM public.profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';

SELECT 'Fix completed successfully' as status;
