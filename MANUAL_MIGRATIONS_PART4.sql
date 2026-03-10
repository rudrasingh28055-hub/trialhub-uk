-- Manual Migration Script Part 4
-- Run these after Part 3 completes successfully

-- 7. Add helper functions
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.auth_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
      and u.status = 'active'
  )
$$;

create or replace function public.is_blocked(a uuid, b uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.blocks bl
    where (bl.blocker_user_id = a and bl.blocked_user_id = b)
       or (bl.blocker_user_id = b and bl.blocked_user_id = a)
  )
$$;

create or replace function public.is_approved_follower(follower_id uuid, followed_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.follow_edges fe
    where fe.follower_user_id = follower_id
      and fe.followed_user_id = followed_id
      and fe.status = 'approved'
  )
$$;

create or replace function public.can_view_profile(viewer_id uuid, target_user_id uuid)
returns boolean
language plpgsql
stable
as $$
declare
  v_visibility account_visibility;
  v_discoverability discoverability_policy;
begin
  if viewer_id = target_user_id then
    return true;
  end if;

  if viewer_id is not null and public.is_blocked(viewer_id, target_user_id) then
    return false;
  end if;

  select p.account_visibility, p.discoverability_policy
  into v_visibility, v_discoverability
  from public.profiles p
  where p.user_id = target_user_id;

  if v_visibility = 'private' then
    return coalesce(public.is_approved_follower(viewer_id, target_user_id), false);
  end if;

  if v_discoverability = 'everyone' then
    return true;
  elsif v_discoverability = 'logged_in_only' then
    return viewer_id is not null;
  elsif v_discoverability = 'limited' then
    return coalesce(public.is_approved_follower(viewer_id, target_user_id), false);
  end if;

  return false;
end;
$$;
