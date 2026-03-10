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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();
