alter table public.property_private
  add column if not exists "tourismLicenseId" text not null default '';

create or replace function public.create_host_property(property_data jsonb, private_data jsonb)
returns public.properties
language plpgsql
security definer
set search_path = ''
as $$
declare created public.properties;
begin
  if (select auth.uid()) is null or not public.is_host() then
    raise exception 'A host account is required to list a stay.';
  end if;

  insert into public.properties (
    title, description, category, "propertyType", "stayTier", price, "priceBasis",
    area, bedrooms, bathrooms, capacity, amenities, "petFriendly", "instantBook",
    "cleaningFee", images, city, status, "verificationStatus",
    "shareExactLocation", "mapLatitude", "mapLongitude"
  ) values (
    property_data ->> 'title',
    property_data ->> 'description',
    coalesce(property_data ->> 'category', 'Rental'),
    property_data ->> 'propertyType',
    property_data ->> 'stayTier',
    (property_data ->> 'price')::numeric,
    property_data ->> 'priceBasis',
    coalesce((property_data ->> 'area')::numeric, 0),
    coalesce((property_data ->> 'bedrooms')::integer, 0),
    coalesce((property_data ->> 'bathrooms')::integer, 0),
    coalesce((property_data ->> 'capacity')::integer, 2),
    coalesce(array(select jsonb_array_elements_text(property_data -> 'amenities')), '{}'),
    coalesce((property_data ->> 'petFriendly')::boolean, false),
    coalesce((property_data ->> 'instantBook')::boolean, false),
    coalesce((property_data ->> 'cleaningFee')::numeric, 0),
    coalesce(array(select jsonb_array_elements_text(property_data -> 'images')), '{}'),
    property_data ->> 'city',
    'pending_review',
    'pending',
    coalesce((property_data ->> 'shareExactLocation')::boolean, false),
    nullif(property_data ->> 'mapLatitude', '')::double precision,
    nullif(property_data ->> 'mapLongitude', '')::double precision
  ) returning * into created;

  insert into public.property_private (
    "propertyId", "ownerUid", "ownerEmail", address, pincode, latitude, longitude,
    "tourismLicenseId"
  ) values (
    created.id,
    (select auth.uid()),
    coalesce(auth.jwt() ->> 'email', ''),
    private_data ->> 'address',
    private_data ->> 'pincode',
    nullif(private_data ->> 'latitude', '')::double precision,
    nullif(private_data ->> 'longitude', '')::double precision,
    coalesce(private_data ->> 'tourismLicenseId', '')
  );
  return created;
end;
$$;

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  description text not null,
  category text not null check (category in (
    'Water Adventures',
    'Land Adventures',
    'Nature & Wildlife',
    'Cultural Experiences',
    'Wellness & Relaxation'
  )),
  city text not null,
  location text not null,
  duration_hours numeric(5, 2) not null check (duration_hours > 0),
  price_per_person numeric(12, 2) not null check (price_per_person > 0),
  capacity integer not null check (capacity > 0),
  images text[] not null default '{}',
  highlights text[] not null default '{}',
  inclusions text[] not null default '{}',
  requirements text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists experiences_public_listing_idx
  on public.experiences(status, is_featured desc, created_at desc);
create index if not exists experiences_category_idx
  on public.experiences(category, status);

alter table public.experiences enable row level security;

drop policy if exists "Published experiences are public" on public.experiences;
create policy "Published experiences are public" on public.experiences
  for select to anon, authenticated using (
    status = 'published' or public.is_admin()
  );

drop policy if exists "Admins manage experiences" on public.experiences;
create policy "Admins manage experiences" on public.experiences
  for all to authenticated using (public.is_admin())
  with check (public.is_admin());

grant select on public.experiences to anon, authenticated;
grant insert, update, delete on public.experiences to authenticated;

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

  if p_action in ('confirm', 'decline') then
    if v_booking.host_id <> v_user_id then
      raise exception 'Only the host can respond to this request.';
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
    if v_booking.guest_id <> v_user_id and v_booking.host_id <> v_user_id then
      raise exception 'Only a booking participant can cancel this booking.';
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
    if v_booking.host_id <> v_user_id then
      raise exception 'Only the host can complete this stay.';
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

revoke all on function public.transition_booking(uuid, text, text) from public;
grant execute on function public.transition_booking(uuid, text, text) to authenticated;
