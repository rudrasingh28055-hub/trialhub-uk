-- Manual Migration Script Part 3
-- Run these after Part 2 completes successfully

-- 5. Create role extension tables
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

-- 6. Create social graph tables
create table if not exists public.follow_edges (
  follower_user_id uuid not null references public.users(id) on delete cascade,
  followed_user_id uuid not null references public.users(id) on delete cascade,
  status follow_status not null default 'pending',
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  primary key (follower_user_id, followed_user_id),
  constraint follow_edges_not_self check (follower_user_id <> followed_user_id)
);

create table if not exists public.blocks (
  blocker_user_id uuid not null references public.users(id) on delete cascade,
  blocked_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_user_id, blocked_user_id),
  constraint blocks_not_self check (blocker_user_id <> blocked_user_id)
);

create table if not exists public.profile_counters (
  user_id uuid primary key references public.users(id) on delete cascade,
  follower_count int not null default 0,
  following_count int not null default 0,
  posts_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.profile_counters (user_id)
select id from public.users
on conflict (user_id) do nothing;
