create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles as current_profile
    (id, email, name, phone, place, pincode, verified, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      ''
    ),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'place', ''),
    coalesce(new.raw_user_meta_data ->> 'pincode', ''),
    new.email_confirmed_at is not null,
    case
      when lower(coalesce(new.email, '')) = 'info.mehmaneasy@gmail.com'
        and new.email_confirmed_at is not null then 'admin'
      when new.raw_user_meta_data ->> 'role' = 'host' then 'host'
      else 'guest'
    end
  )
  on conflict (id) do update set
    email = excluded.email,
    verified = excluded.verified,
    role = case
      when lower(excluded.email) = 'info.mehmaneasy@gmail.com' and excluded.verified
        then 'admin'
      when lower(current_profile.email) = 'info.mehmaneasy@gmail.com'
        and (lower(excluded.email) <> 'info.mehmaneasy@gmail.com' or not excluded.verified)
        then 'guest'
      else current_profile.role
    end,
    "updatedAt" = now();
  return new;
end;
$$;

create or replace function public.set_my_role(new_role text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare result public.profiles;
begin
  if new_role not in ('guest', 'host') then
    raise exception 'Choose a valid account role.';
  end if;
  update public.profiles
    set role = case
      when lower(email) = 'info.mehmaneasy@gmail.com' and verified then 'admin'
      else new_role
    end,
    "updatedAt" = now()
    where id = (select auth.uid())
    returning * into result;
  if result.id is null then
    raise exception 'User profile not found.';
  end if;
  return result;
end;
$$;

update public.profiles p
set role = 'admin',
    "updatedAt" = now()
from auth.users u
where p.id = u.id
  and lower(u.email) = 'info.mehmaneasy@gmail.com'
  and u.email_confirmed_at is not null;
