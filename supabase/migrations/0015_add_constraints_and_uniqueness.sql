delete from public.profiles p
where p.user_id is null;

alter table public.profiles
  alter column user_id set not null;

create unique index if not exists uq_profiles_user_id on public.profiles(user_id);
create unique index if not exists uq_profiles_username on public.profiles(username);

create index if not exists idx_users_role_status on public.users(role, status);
create index if not exists idx_blocks_blocker on public.blocks(blocker_user_id);
create index if not exists idx_blocks_blocked on public.blocks(blocked_user_id);
