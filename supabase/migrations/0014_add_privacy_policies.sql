create or replace function public.follow_request_target_status(target_user_id uuid)
returns follow_status
language sql
stable
as $$
  select case
    when p.account_visibility = 'private' then 'pending'::follow_status
    else 'approved'::follow_status
  end
  from public.profiles p
  where p.user_id = target_user_id
$$;
