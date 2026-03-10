create table if not exists public.follow_edges (
  follower_user_id uuid not null references public.users(id) on delete cascade,
  followed_user_id uuid not null references public.users(id) on delete cascade,
  status follow_status not null default 'pending',
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  primary key (follower_user_id, followed_user_id),
  constraint follow_edges_not_self check (follower_user_id <> followed_user_id)
);

create index if not exists idx_follow_edges_followed_status
  on public.follow_edges (followed_user_id, status, created_at desc);

create index if not exists idx_follow_edges_follower_status
  on public.follow_edges (follower_user_id, status, created_at desc);

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
