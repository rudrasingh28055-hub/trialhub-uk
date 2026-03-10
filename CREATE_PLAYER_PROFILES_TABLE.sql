-- Create player_profiles table with all necessary fields
-- This table extends the basic athlete_profiles with detailed player information

CREATE TABLE IF NOT EXISTS public.player_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  age INTEGER,
  primary_position TEXT,
  secondary_position TEXT,
  dominant_foot TEXT,
  height_cm INTEGER,
  weight_kg INTEGER,
  
  -- Career Info
  previous_club TEXT,
  current_club TEXT,
  contract_expires DATE,
  preferred_foot TEXT,
  
  -- Media
  video_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  avatar_url TEXT,
  bio TEXT,
  
  -- Verification & Stats
  verification_level INTEGER DEFAULT 0 CHECK (verification_level >= 0 AND verification_level <= 4),
  verification_badge TEXT CHECK (verification_badge IN ('basic', 'verified', 'academy', 'pro', 'elite')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  
  -- Social Stats
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(profile_id),
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_profiles_profile_id ON public.player_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id ON public.player_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_player_profiles_verification_level ON public.player_profiles(verification_level);
CREATE INDEX IF NOT EXISTS idx_player_profiles_position ON public.player_profiles(primary_position);
CREATE INDEX IF NOT EXISTS idx_player_profiles_age ON public.player_profiles(age);
CREATE INDEX IF NOT EXISTS idx_player_profiles_active ON public.player_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_player_profiles_created_at ON public.player_profiles(created_at DESC);

-- Enable RLS
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Players can view their own profile" ON public.player_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Players can update their own profile" ON public.player_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Players can insert their own profile" ON public.player_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Verified profiles are public" ON public.player_profiles FOR SELECT USING (is_active = true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_player_profiles_set_updated_at ON public.player_profiles;
CREATE TRIGGER trg_player_profiles_set_updated_at
BEFORE UPDATE ON public.player_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Function to migrate data from athlete_profiles if needed
CREATE OR REPLACE FUNCTION migrate_athlete_to_player_profiles()
RETURNS VOID AS $$
BEGIN
  -- Insert data from athlete_profiles to player_profiles for users who don't have player_profiles yet
  INSERT INTO public.player_profiles (profile_id, user_id, created_at)
  SELECT 
    p.id as profile_id,
    ap.user_id,
    ap.created_at
  FROM public.athlete_profiles ap
  JOIN public.profiles p ON p.user_id = ap.user_id
  LEFT JOIN public.player_profiles pp ON pp.user_id = ap.user_id
  WHERE pp.user_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Run migration (this will be safe to run multiple times)
SELECT migrate_athlete_to_player_profiles();

-- Drop the migration function
DROP FUNCTION IF EXISTS migrate_athlete_to_player_profiles();
