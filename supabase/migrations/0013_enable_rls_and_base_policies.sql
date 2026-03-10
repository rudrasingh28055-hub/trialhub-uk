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

drop policy if exists follow_edges_update_related on public.follow_edges;
create policy follow_edges_update_related on public.follow_edges
for update using (
  follower_user_id = public.auth_user_id()
  or followed_user_id = public.auth_user_id()
  or public.is_admin()
);

drop policy if exists follow_edges_delete_related on public.follow_edges;
create policy follow_edges_delete_related on public.follow_edges
for delete using (
  follower_user_id = public.auth_user_id()
  or followed_user_id = public.auth_user_id()
  or public.is_admin()
);

drop policy if exists blocks_select_self on public.blocks;
create policy blocks_select_self on public.blocks
for select using (blocker_user_id = public.auth_user_id() or public.is_admin());

drop policy if exists blocks_insert_self on public.blocks;
create policy blocks_insert_self on public.blocks
for insert with check (blocker_user_id = public.auth_user_id());

drop policy if exists blocks_delete_self on public.blocks;
create policy blocks_delete_self on public.blocks
for delete using (blocker_user_id = public.auth_user_id() or public.is_admin());

drop policy if exists profile_counters_select_visible on public.profile_counters;
create policy profile_counters_select_visible on public.profile_counters
for select using (public.can_view_profile(public.auth_user_id(), user_id) or public.is_admin());
