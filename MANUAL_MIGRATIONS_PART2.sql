-- Manual Migration Script Part 2
-- Run these after Part 1 completes successfully

-- 3. Create users table
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  role app_role not null default 'athlete',
  status account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.users (id, email, role, status)
select
  au.id,
  au.email::citext,
  coalesce(
    case
      when p.role in ('athlete', 'club', 'admin') then p.role::app_role
      else 'athlete'::app_role
    end,
    'athlete'::app_role
  ),
  'active'::account_status
from auth.users au
left join public.profiles p on p.id = au.id
on conflict (id) do update
set email = excluded.email;

-- 4. Expand profiles table
alter table public.profiles
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists username citext,
  add column if not exists display_name text,
  add column if not exists account_visibility account_visibility not null default 'public',
  add column if not exists discoverability_policy discoverability_policy not null default 'everyone',
  add column if not exists message_policy message_policy not null default 'requests',
  add column if not exists verification_status verification_status not null default 'unverified',
  add column if not exists trusted_status trusted_status not null default 'none',
  add column if not exists country_code text references public.countries(code),
  add column if not exists region_code text,
  add column if not exists updated_at timestamptz not null default now();

update public.profiles
set user_id = id
where user_id is null;

update public.profiles
set display_name = coalesce(display_name, full_name, 'User')
where display_name is null;

update public.profiles
set username = lower(regexp_replace(coalesce(full_name, 'user'), '[^a-zA-Z0-9_]+', '', 'g')) || '_' || left(id::text, 6)
where username is null or btrim(username::text) = '';
