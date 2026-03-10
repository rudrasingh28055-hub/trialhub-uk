create table if not exists public.sports (
  code text primary key,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.countries (
  code text primary key,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code) on delete cascade,
  region_code text not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (country_code, region_code)
);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  sport_code text not null references public.sports(code) on delete cascade,
  code text not null,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (sport_code, code)
);

create table if not exists public.skills_catalog (
  id uuid primary key default gen_random_uuid(),
  sport_code text not null references public.sports(code) on delete cascade,
  code text not null,
  category text not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (sport_code, code)
);

insert into public.sports (code, name)
values ('football', 'Football')
on conflict (code) do nothing;

insert into public.countries (code, name)
values ('GB', 'United Kingdom')
on conflict (code) do nothing;

insert into public.positions (sport_code, code, name, sort_order)
values
  ('football', 'gk', 'Goalkeeper', 10),
  ('football', 'cb', 'Centre-Back', 20),
  ('football', 'lb', 'Left-Back', 30),
  ('football', 'rb', 'Right-Back', 40),
  ('football', 'dm', 'Defensive Midfielder', 50),
  ('football', 'cm', 'Central Midfielder', 60),
  ('football', 'am', 'Attacking Midfielder', 70),
  ('football', 'lw', 'Left Winger', 80),
  ('football', 'rw', 'Right Winger', 90),
  ('football', 'st', 'Striker', 100)
on conflict (sport_code, code) do nothing;
