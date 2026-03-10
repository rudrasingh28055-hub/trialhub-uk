-- Manual Migration Script Part 5 (Final)
-- Run these after Part 4 completes successfully

-- 8. Enable RLS and create base policies
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.follow_edges enable row level security;
alter table public.blocks enable row level security;
alter table public.profile_counters enable row level security;

drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users
for select using (id = public.auth_user_id() or public.is_admin());

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
for update using (id = public.auth_user_id());

drop policy if exists profiles_select_visible on public.profiles;
create policy profiles_select_visible on public.profiles
for select using (public.can_view_profile(public.auth_user_id(), user_id) or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update using (user_id = public.auth_user_id());

drop policy if exists follow_edges_select_related on public.follow_edges;
create policy follow_edges_select_related on public.follow_edges
for select using (
  follower_user_id = public.auth_user_id()
  or followed_user_id = public.auth_user_id()
  or (status = 'approved' and public.can_view_profile(public.auth_user_id(), followed_user_id))
  or public.is_admin()
);

drop policy if exists follow_edges_insert_self on public.follow_edges;
create policy follow_edges_insert_self on public.follow_edges
for insert with check (
  follower_user_id = public.auth_user_id()
  and not public.is_blocked(follower_user_id, followed_user_id)
);

-- 9. Add triggers and constraints
drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- 10. Final constraints and cleanup
delete from public.profiles p
where p.user_id is null;

alter table public.profiles
  alter column user_id set not null;

create unique index if not exists uq_profiles_user_id on public.profiles(user_id);
create unique index if not exists uq_profiles_username on public.profiles(username);

create index if not exists idx_users_role_status on public.users(role, status);
create index if not exists idx_blocks_blocker on public.blocks(blocker_user_id);
create index if not exists idx_blocks_blocked on public.blocks(blocked_user_id);

-- 11. Follow counter sync function
create or replace function public.sync_follow_counters()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' and new.status = 'approved' then
    update public.profile_counters set follower_count = follower_count + 1, updated_at = now()
    where user_id = new.followed_user_id;

    update public.profile_counters set following_count = following_count + 1, updated_at = now()
    where user_id = new.follower_user_id;
  elsif tg_op = 'UPDATE' then
    if old.status <> 'approved' and new.status = 'approved' then
      update public.profile_counters set follower_count = follower_count + 1, updated_at = now()
      where user_id = new.followed_user_id;

      update public.profile_counters set following_count = following_count + 1, updated_at = now()
      where user_id = new.follower_user_id;
    elsif old.status = 'approved' and new.status <> 'approved' then
      update public.profile_counters set follower_count = greatest(0, follower_count - 1), updated_at = now()
      where user_id = new.followed_user_id;

      update public.profile_counters set following_count = greatest(0, following_count - 1), updated_at = now()
      where user_id = new.follower_user_id;
    end if;
  elsif tg_op = 'DELETE' and old.status = 'approved' then
    update public.profile_counters set follower_count = greatest(0, follower_count - 1), updated_at = now()
    where user_id = old.followed_user_id;

    update public.profile_counters set following_count = greatest(0, following_count - 1), updated_at = now()
    where user_id = old.follower_user_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_sync_follow_counters on public.follow_edges;
create trigger trg_sync_follow_counters
after insert or update or delete on public.follow_edges
for each row execute function public.sync_follow_counters();
