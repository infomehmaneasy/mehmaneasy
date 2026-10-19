create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete restrict,
  host_id uuid not null references public.profiles(id) on delete restrict,
  guest_id uuid not null references public.profiles(id) on delete restrict,
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  check_in date not null,
  check_out date not null,
  guests integer not null check (guests > 0),
  nights integer not null check (nights > 0),
  nightly_rate numeric(12, 2) not null check (nightly_rate > 0),
  cleaning_fee numeric(12, 2) not null default 0 check (cleaning_fee >= 0),
  subtotal numeric(12, 2) not null check (subtotal > 0),
  online_intended numeric(12, 2) not null check (online_intended >= 0),
  offline_due numeric(12, 2) not null check (offline_due >= 0),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'requested'
    check (status in ('requested', 'confirmed', 'declined', 'cancelled', 'completed')),
  payment_status text not null default 'not_collected'
    check (payment_status = 'not_collected'),
  guest_note text not null default '',
  host_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in),
  check (subtotal = round(nightly_rate * nights + cleaning_fee, 2)),
  check (online_intended = round(subtotal * 0.70, 2)),
  check (offline_due = subtotal - online_intended)
);

create index if not exists bookings_guest_created_idx
  on public.bookings(guest_id, created_at desc);
create index if not exists bookings_host_created_idx
  on public.bookings(host_id, created_at desc);
create index if not exists bookings_property_dates_idx
  on public.bookings(property_id, check_in, check_out)
  where status = 'confirmed';

alter table public.bookings enable row level security;

drop policy if exists "Booking participants and admins read bookings" on public.bookings;
create policy "Booking participants and admins read bookings" on public.bookings
  for select to authenticated using (
    guest_id = (select auth.uid())
    or host_id = (select auth.uid())
    or public.is_admin()
  );

drop policy if exists "Booking participants read each others profiles" on public.profiles;
create policy "Booking participants read each others profiles" on public.profiles
  for select to authenticated using (
    exists (
      select 1 from public.bookings b
      where b.status in ('confirmed', 'completed')
        and (
          (b.guest_id = (select auth.uid()) and b.host_id = profiles.id)
          or (b.host_id = (select auth.uid()) and b.guest_id = profiles.id)
        )
    )
  );

drop policy if exists "Confirmed guests read stay address" on public.property_private;
create policy "Confirmed guests read stay address" on public.property_private
  for select to authenticated using (
    exists (
      select 1 from public.bookings b
      where b.property_id = "property_private"."propertyId"
        and b.guest_id = (select auth.uid())
        and b.status in ('confirmed', 'completed')
    )
  );

create or replace function public.create_booking_request(
  p_property_id uuid,
  p_check_in date,
  p_check_out date,
  p_guests integer,
  p_guest_phone text,
  p_guest_note text default ''
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
  if v_profile.id is null or not v_profile.verified then
    raise exception 'Verify your email before requesting a booking.';
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
  if length(coalesce(p_guest_note, '')) > 1000 then
    raise exception 'Guest notes must be 1000 characters or fewer.';
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
    property_id, host_id, guest_id, guest_name, guest_email, guest_phone,
    check_in, check_out, guests, nights, nightly_rate, cleaning_fee, subtotal,
    online_intended, offline_due, guest_note
  ) values (
    p_property_id, v_host_id, v_guest_id, v_profile.name, v_profile.email,
    trim(p_guest_phone), p_check_in, p_check_out, p_guests, v_nights,
    v_property.price, v_cleaning_fee, v_subtotal,
    round(v_subtotal * 0.70, 2), v_subtotal - round(v_subtotal * 0.70, 2),
    trim(coalesce(p_guest_note, ''))
  ) returning * into v_result;
  return v_result;
end;
$$;

create or replace function public.transition_booking(
  p_booking_id uuid,
  p_action text,
  p_host_note text default ''
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_booking public.bookings;
  v_is_admin boolean;
begin
  if v_user_id is null then
    raise exception 'Sign in to manage this booking.';
  end if;
  if p_action not in ('confirm', 'decline', 'cancel', 'complete') then
    raise exception 'Choose a valid booking action.';
  end if;
  if length(coalesce(p_host_note, '')) > 1000 then
    raise exception 'Booking notes must be 1000 characters or fewer.';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if v_booking.id is null then
    raise exception 'Booking not found.';
  end if;
  v_is_admin := public.is_admin();

  if p_action in ('confirm', 'decline') then
    if v_booking.host_id <> v_user_id and not v_is_admin then
      raise exception 'Only the host or an admin can respond to this request.';
    end if;
    if v_booking.status <> 'requested' then
      raise exception 'This request has already been handled.';
    end if;
    if p_action = 'confirm' then
      perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(v_booking.property_id::text, 0)
      );
      if not exists (
        select 1 from public.properties p
        where p.id = v_booking.property_id
          and p.status = 'active'
          and p."verificationStatus" = 'approved'
      ) then
        raise exception 'This stay is no longer active and cannot be confirmed.';
      end if;
      if exists (
        select 1 from public.bookings b
        where b.property_id = v_booking.property_id
          and b.status = 'confirmed'
          and b.id <> v_booking.id
          and b.check_in < v_booking.check_out
          and b.check_out > v_booking.check_in
      ) then
        raise exception 'These dates overlap another confirmed stay. Decline this request and ask the guest to choose different dates.';
      end if;
      update public.bookings set status = 'confirmed',
        host_note = trim(coalesce(p_host_note, '')), updated_at = now()
        where id = v_booking.id returning * into v_booking;
    else
      update public.bookings set status = 'declined',
        host_note = trim(coalesce(p_host_note, '')), updated_at = now()
        where id = v_booking.id returning * into v_booking;
    end if;
  elsif p_action = 'cancel' then
    if v_booking.guest_id <> v_user_id and v_booking.host_id <> v_user_id and not v_is_admin then
      raise exception 'Only a booking participant or an admin can cancel this booking.';
    end if;
    if v_booking.status not in ('requested', 'confirmed') then
      raise exception 'This booking can no longer be cancelled.';
    end if;
    if v_booking.guest_id = v_user_id and v_booking.check_in <= current_date then
      raise exception 'Guests can cancel only before the check-in date. Contact support for help.';
    end if;
    update public.bookings set status = 'cancelled', updated_at = now()
      where id = v_booking.id returning * into v_booking;
  else
    if v_booking.host_id <> v_user_id and not v_is_admin then
      raise exception 'Only the host or an admin can complete this stay.';
    end if;
    if v_booking.status <> 'confirmed' or v_booking.check_out > current_date then
      raise exception 'A confirmed stay can be completed after its check-out date.';
    end if;
    update public.bookings set status = 'completed', updated_at = now()
      where id = v_booking.id returning * into v_booking;
  end if;
  return v_booking;
end;
$$;

revoke all on function public.create_booking_request(uuid, date, date, integer, text, text) from public;
revoke all on function public.transition_booking(uuid, text, text) from public;
grant execute on function public.create_booking_request(uuid, date, date, integer, text, text) to authenticated;
grant execute on function public.transition_booking(uuid, text, text) to authenticated;
grant select on public.bookings to authenticated;
