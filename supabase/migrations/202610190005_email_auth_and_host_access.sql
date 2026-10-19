create or replace function public.is_host()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.current_profile_role() in ('host', 'admin'),
    false
  )
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_google_identity boolean := (
    coalesce(new.raw_app_meta_data ->> 'provider', '') = 'google'
    or coalesce(new.raw_app_meta_data -> 'providers', '[]'::jsonb) @> '["google"]'::jsonb
  );
  v_is_allowlisted_admin boolean := (
    lower(coalesce(new.email, '')) = 'info.mehmaneasy@gmail.com'
    and new.email_confirmed_at is not null
    and v_google_identity
  );
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
      when v_is_allowlisted_admin then 'admin'
      when new.raw_user_meta_data ->> 'role' = 'host' then 'host'
      else 'guest'
    end
  )
  on conflict (id) do update set
    email = excluded.email,
    verified = excluded.verified,
    role = case
      when v_is_allowlisted_admin then 'admin'
      when lower(excluded.email) = 'info.mehmaneasy@gmail.com'
        and current_profile.role = 'admin' then 'guest'
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
declare
  result public.profiles;
  v_is_allowlisted_admin boolean;
begin
  if new_role not in ('guest', 'host') then
    raise exception 'Choose a valid account role.';
  end if;

  select exists (
    select 1
    from auth.users u
    where u.id = (select auth.uid())
      and lower(coalesce(u.email, '')) = 'info.mehmaneasy@gmail.com'
      and u.email_confirmed_at is not null
      and (
        coalesce(u.raw_app_meta_data ->> 'provider', '') = 'google'
        or coalesce(u.raw_app_meta_data -> 'providers', '[]'::jsonb) @> '["google"]'::jsonb
      )
  ) into v_is_allowlisted_admin;

  update public.profiles
    set role = case when v_is_allowlisted_admin then 'admin' else new_role end,
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
  and u.email_confirmed_at is not null
  and (
    coalesce(u.raw_app_meta_data ->> 'provider', '') = 'google'
    or coalesce(u.raw_app_meta_data -> 'providers', '[]'::jsonb) @> '["google"]'::jsonb
  );

create or replace function public.create_booking_request(
  p_property_id uuid,
  p_check_in date,
  p_check_out date,
  p_guests integer,
  p_guest_phone text
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest_id uuid := (select auth.uid());
  v_profile public.profiles;
  v_property public.properties;
  v_host_id uuid;
  v_nights integer;
  v_subtotal numeric(12, 2);
  v_cleaning_fee numeric(12, 2);
  v_result public.bookings;
begin
  if v_guest_id is null then
    raise exception 'Sign in to request a booking.';
  end if;
  select * into v_profile from public.profiles where id = v_guest_id;
  if v_profile.id is null then
    raise exception 'Your account profile could not be found.';
  end if;
  if p_check_in is null or p_check_out is null or p_check_in < current_date
    or p_check_out <= p_check_in then
    raise exception 'Choose valid future check-in and check-out dates.';
  end if;
  if p_check_out - p_check_in > 90 then
    raise exception 'Online booking requests can be up to 90 nights.';
  end if;
  if p_guests is null or p_guests < 1 then
    raise exception 'Choose at least one guest.';
  end if;
  if p_guest_phone is null or p_guest_phone !~ '^[+0-9() .-]{7,25}$' then
    raise exception 'Enter a valid contact phone number.';
  end if;

  select * into v_property from public.properties
    where id = p_property_id and status = 'active' and "verificationStatus" = 'approved';
  if v_property.id is null then
    raise exception 'This stay is no longer available for booking requests.';
  end if;
  if v_property."priceBasis" <> 'night' then
    raise exception 'This stay does not have a nightly rate for booking requests yet.';
  end if;
  if p_guests > v_property.capacity then
    raise exception 'The guest count exceeds this stay''s capacity.';
  end if;
  select "ownerUid" into v_host_id from public.property_private where "propertyId" = p_property_id;
  if v_host_id is null or v_host_id = v_guest_id then
    raise exception 'You cannot request your own stay.';
  end if;

  v_nights := p_check_out - p_check_in;
  v_cleaning_fee := coalesce(v_property."cleaningFee", 0);
  v_subtotal := round(v_property.price * v_nights + v_cleaning_fee, 2);
  insert into public.bookings (
    property_id, host_id, guest_id, check_in, check_out, guests, nights,
    nightly_rate, cleaning_fee, subtotal, online_intended, offline_due
  ) values (
    p_property_id, v_host_id, v_guest_id, p_check_in, p_check_out, p_guests,
    v_nights, v_property.price, v_cleaning_fee, v_subtotal,
    round(v_subtotal * 0.70, 2), v_subtotal - round(v_subtotal * 0.70, 2)
  ) returning * into v_result;

  insert into public.booking_private (booking_id, guest_name, guest_email, guest_phone)
  values (v_result.id, v_profile.name, v_profile.email, trim(p_guest_phone));
  return v_result;
end;
$$;
