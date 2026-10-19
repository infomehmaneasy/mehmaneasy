create table if not exists public.booking_private (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null
);

insert into public.booking_private (booking_id, guest_name, guest_email, guest_phone)
select id, guest_name, guest_email, guest_phone from public.bookings
on conflict (booking_id) do nothing;

alter table public.bookings drop column if exists guest_name;
alter table public.bookings drop column if exists guest_email;
alter table public.bookings drop column if exists guest_phone;
alter table public.bookings drop column if exists guest_note;
alter table public.booking_private enable row level security;

drop policy if exists "Booking participants and admins read private booking contacts" on public.booking_private;
create policy "Booking participants and admins read private booking contacts" on public.booking_private
  for select to authenticated using (
    public.is_admin()
    or exists (
      select 1 from public.bookings b
      where b.id = booking_private.booking_id
        and (
          b.guest_id = (select auth.uid())
          or (
            b.host_id = (select auth.uid())
            and b.status in ('confirmed', 'completed')
          )
        )
    )
  );

revoke all on public.booking_private from anon, authenticated;
grant select on public.booking_private to authenticated;

drop function if exists public.create_booking_request(uuid, date, date, integer, text, text);

create function public.create_booking_request(
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

revoke all on function public.create_booking_request(uuid, date, date, integer, text) from public;
grant execute on function public.create_booking_request(uuid, date, date, integer, text) to authenticated;
