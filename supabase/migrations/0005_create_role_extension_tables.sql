create table if not exists public.athlete_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  sport_code text references public.sports(code),
  primary_position_id uuid references public.positions(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  sport_code text references public.sports(code),
  club_name text,
  country_code text references public.countries(code),
  region_code text,
  city text,
  verification_status verification_status not null default 'pending',
  trusted_status trusted_status not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_athlete_profiles_set_updated_at on public.athlete_profiles;
create trigger trg_athlete_profiles_set_updated_at
before update on public.athlete_profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_club_profiles_set_updated_at on public.club_profiles;
create trigger trg_club_profiles_set_updated_at
before update on public.club_profiles
for each row execute function public.set_updated_at();
