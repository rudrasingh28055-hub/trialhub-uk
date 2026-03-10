-- Create player_profiles table with all necessary fields
-- This table extends the basic profiles with detailed player information

CREATE TABLE IF NOT EXISTS public.player_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
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
  UNIQUE(profile_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_profiles_profile_id ON public.player_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_player_profiles_verification_level ON public.player_profiles(verification_level);
CREATE INDEX IF NOT EXISTS idx_player_profiles_position ON public.player_profiles(primary_position);
CREATE INDEX IF NOT EXISTS idx_player_profiles_age ON public.player_profiles(age);
CREATE INDEX IF NOT EXISTS idx_player_profiles_active ON public.player_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_player_profiles_created_at ON public.player_profiles(created_at DESC);

-- Enable RLS
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Players can view their own profile" ON public.player_profiles FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.id = player_profiles.profile_id AND p.user_id = auth.uid()
));

CREATE POLICY "Players can update their own profile" ON public.player_profiles FOR UPDATE USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.id = player_profiles.profile_id AND p.user_id = auth.uid()
));

CREATE POLICY "Players can insert their own profile" ON public.player_profiles FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.id = player_profiles.profile_id AND p.user_id = auth.uid()
));

CREATE POLICY "Verified profiles are public" ON public.player_profiles FOR SELECT USING (is_active = true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_player_profiles_set_updated_at ON public.player_profiles;
CREATE TRIGGER trg_player_profiles_set_updated_at
BEFORE UPDATE ON public.player_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Create any missing columns if table already exists
DO $$
BEGIN
    -- Check if table exists and add missing columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_profiles' AND table_schema = 'public') THEN
        -- Add verification columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'player_profiles' AND column_name = 'verification_level') THEN
            ALTER TABLE public.player_profiles ADD COLUMN verification_level INTEGER DEFAULT 0 CHECK (verification_level >= 0 AND verification_level <= 4);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'player_profiles' AND column_name = 'verification_badge') THEN
            ALTER TABLE public.player_profiles ADD COLUMN verification_badge TEXT CHECK (verification_badge IN ('basic', 'verified', 'academy', 'pro', 'elite'));
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'player_profiles' AND column_name = 'follower_count') THEN
            ALTER TABLE public.player_profiles ADD COLUMN follower_count INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'player_profiles' AND column_name = 'following_count') THEN
            ALTER TABLE public.player_profiles ADD COLUMN following_count INTEGER DEFAULT 0;
        END IF;
    END IF;
END $$;
