create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  phone text not null default '',
  place text not null default '',
  pincode text not null default '',
  verified boolean not null default false,
  role text not null default 'guest' check (role in ('guest', 'host', 'admin')),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null default 'Rental'
    check (category in ('Residential', 'Commercial', 'Land', 'Rental', 'Royal', 'Gold', 'Easy')),
  "propertyType" text not null default 'Apartment',
  "stayTier" text check ("stayTier" in ('Royal', 'Gold', 'Easy')),
  price numeric(12, 2) not null check (price > 0),
  "priceBasis" text not null default 'night' check ("priceBasis" in ('night', 'month', 'listing')),
  area numeric(12, 2) not null default 0 check (area >= 0),
  bedrooms integer not null default 0 check (bedrooms >= 0),
  bathrooms integer not null default 0 check (bathrooms >= 0),
  capacity integer not null default 2 check (capacity >= 1),
  amenities text[] not null default '{}',
  "petFriendly" boolean not null default false,
  "instantBook" boolean not null default false,
  rating numeric(2, 1) check (rating between 0 and 5),
  "reviewsCount" integer not null default 0 check ("reviewsCount" >= 0),
  "cleaningFee" numeric(12, 2) not null default 0 check ("cleaningFee" >= 0),
  images text[] not null default '{}',
  city text not null,
  status text not null default 'pending_review'
    check (status in ('active', 'inactive', 'pending_review', 'rejected')),
  "verificationStatus" text not null default 'pending'
    check ("verificationStatus" in ('pending', 'approved', 'rejected')),
  "verificationNotes" text not null default '',
  "reviewedAt" timestamptz,
  "reviewedBy" text not null default '',
  "isFeatured" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.property_private (
  "propertyId" uuid primary key references public.properties(id) on delete cascade,
  "ownerUid" uuid not null references public.profiles(id) on delete cascade,
  "ownerEmail" text not null,
  address text not null,
  pincode text not null,
  latitude double precision,
  longitude double precision
);

create index if not exists properties_public_search_idx
  on public.properties(status, "verificationStatus", "isFeatured", "createdAt" desc);
create index if not exists properties_owner_idx on public.property_private("ownerUid");
create index if not exists properties_city_idx on public.properties(city);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  "propertyId" uuid not null references public.properties(id) on delete cascade,
  "recipientEmail" text not null,
  "buyerName" text not null,
  "buyerEmail" text not null,
  "buyerPhone" text not null,
  message text not null default '',
  "propertyLink" text not null default '',
  "propertyTitle" text not null default '',
  status text not null default 'new' check (status in ('new', 'reviewed')),
  "createdAt" timestamptz not null default now()
);
create index if not exists enquiries_queue_idx on public.enquiries(status, "createdAt" desc);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, phone, place, pincode, verified, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'place', ''),
    coalesce(new.raw_user_meta_data ->> 'pincode', ''),
    new.email_confirmed_at is not null,
    case when new.raw_user_meta_data ->> 'role' = 'host' then 'host' else 'guest' end
  )
  on conflict (id) do update set
    email = excluded.email,
    verified = excluded.verified,
    "updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email, email_confirmed_at on auth.users
  for each row execute procedure public.handle_new_auth_user();

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_profile_role() = 'admin', false)
$$;

create or replace function public.is_host()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.current_profile_role() = 'admin'
    or exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'host' and verified
    ),
    false
  )
$$;

create or replace function public.is_property_owner(property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.property_private
    where "propertyId" = property_id and "ownerUid" = (select auth.uid())
  )
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
    set role = new_role, "updatedAt" = now()
    where id = (select auth.uid())
    returning * into result;
  if result.id is null then
    raise exception 'User profile not found.';
  end if;
  return result;
end;
$$;

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
    "cleaningFee", images, city, status, "verificationStatus"
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
    'pending'
  ) returning * into created;

  insert into public.property_private (
    "propertyId", "ownerUid", "ownerEmail", address, pincode, latitude, longitude
  ) values (
    created.id,
    (select auth.uid()),
    coalesce(auth.jwt() ->> 'email', ''),
    private_data ->> 'address',
    private_data ->> 'pincode',
    nullif(private_data ->> 'latitude', '')::double precision,
    nullif(private_data ->> 'longitude', '')::double precision
  );
  return created;
end;
$$;

create or replace function public.protect_property_review_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare content_changed boolean;
begin
  if public.is_admin() then
    new."updatedAt" = now();
    return new;
  end if;

  if not public.is_property_owner(old.id) then
    raise exception 'Only the listing owner or an admin can update this stay.';
  end if;

  if new."verificationStatus" is distinct from old."verificationStatus"
    or new."verificationNotes" is distinct from old."verificationNotes"
    or new."reviewedAt" is distinct from old."reviewedAt"
    or new."reviewedBy" is distinct from old."reviewedBy"
    or new."isFeatured" is distinct from old."isFeatured" then
    raise exception 'Only admins may change listing review fields.';
  end if;
  if new.status not in ('active', 'inactive', 'pending_review') then
    raise exception 'Invalid host listing status.';
  end if;
  if old."verificationStatus" <> 'approved' and new.status = 'active' then
    raise exception 'Only an approved stay can be activated.';
  end if;

  content_changed :=
    (to_jsonb(new) - array['status', 'verificationStatus', 'verificationNotes', 'reviewedAt', 'reviewedBy', 'isFeatured', 'updatedAt'])
    is distinct from
    (to_jsonb(old) - array['status', 'verificationStatus', 'verificationNotes', 'reviewedAt', 'reviewedBy', 'isFeatured', 'updatedAt']);

  if content_changed then
    new."verificationStatus" = 'pending';
    new."verificationNotes" = '';
    new."reviewedAt" = null;
    new."reviewedBy" = '';
    new.status = 'pending_review';
  elsif new.status = 'pending_review' and old.status is distinct from new.status then
    new."verificationStatus" = 'pending';
    new."verificationNotes" = '';
    new."reviewedAt" = null;
    new."reviewedBy" = '';
  end if;
  new."updatedAt" = now();
  return new;
end;
$$;

create or replace function public.protect_private_property_data()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new."propertyId" is distinct from old."propertyId"
    or new."ownerUid" is distinct from old."ownerUid"
    or new."ownerEmail" is distinct from old."ownerEmail" then
    raise exception 'Property ownership fields cannot be changed.';
  end if;

  if not public.is_admin()
    and (new.address is distinct from old.address
      or new.pincode is distinct from old.pincode
      or new.latitude is distinct from old.latitude
      or new.longitude is distinct from old.longitude) then
    update public.properties
      set status = 'pending_review'
      where id = old."propertyId" and status <> 'pending_review';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_private_property_data on public.property_private;
create trigger protect_private_property_data
  before update on public.property_private
  for each row execute procedure public.protect_private_property_data();

drop trigger if exists protect_property_review_fields on public.properties;
create trigger protect_property_review_fields
  before update on public.properties
  for each row execute procedure public.protect_property_review_fields();

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_private enable row level security;
alter table public.enquiries enable row level security;

drop policy if exists "Profiles readable by self or admin" on public.profiles;
create policy "Profiles readable by self or admin" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_admin());

drop policy if exists "Public and owner property reads" on public.properties;
create policy "Public and owner property reads" on public.properties
  for select to anon, authenticated using (
    (status = 'active' and "verificationStatus" = 'approved')
    or public.is_property_owner(id)
    or public.is_admin()
  );

drop policy if exists "Verified hosts create own properties" on public.properties;
create policy "Verified hosts create own properties" on public.properties
  for insert to authenticated with check (
    public.is_host()
    and "verificationStatus" = 'pending'
    and status = 'pending_review'
    and not "isFeatured"
  );

drop policy if exists "Owners and admins update properties" on public.properties;
create policy "Owners and admins update properties" on public.properties
  for update to authenticated using (
    public.is_property_owner(id) or public.is_admin()
  ) with check (
    public.is_property_owner(id) or public.is_admin()
  );

drop policy if exists "Owners and admins delete properties" on public.properties;
create policy "Owners and admins delete properties" on public.properties
  for delete to authenticated using (
    public.is_property_owner(id) or public.is_admin()
  );

drop policy if exists "Owners and admins read private property data" on public.property_private;
create policy "Owners and admins read private property data" on public.property_private
  for select to authenticated using ("ownerUid" = (select auth.uid()) or public.is_admin());

drop policy if exists "Verified hosts create private property data" on public.property_private;
create policy "Verified hosts create private property data" on public.property_private
  for insert to authenticated with check (
    "ownerUid" = (select auth.uid())
    and public.is_host()
    and exists (
      select 1 from public.properties p
      where p.id = "propertyId" and p.status = 'pending_review'
    )
  );

drop policy if exists "Owners and admins update private property data" on public.property_private;
create policy "Owners and admins update private property data" on public.property_private
  for update to authenticated using ("ownerUid" = (select auth.uid()) or public.is_admin())
  with check ("ownerUid" = (select auth.uid()) or public.is_admin());

drop policy if exists "Admins delete private property data" on public.property_private;
create policy "Admins delete private property data" on public.property_private
  for delete to authenticated using (public.is_admin());

drop policy if exists "Guests submit enquiries for approved stays" on public.enquiries;
create policy "Guests submit enquiries for approved stays" on public.enquiries
  for insert to anon, authenticated with check (
    status = 'new'
    and exists (
      select 1 from public.properties p
      where p.id = "propertyId"
        and p.status = 'active'
        and p."verificationStatus" = 'approved'
    )
  );

drop policy if exists "Admins read enquiries" on public.enquiries;
create policy "Admins read enquiries" on public.enquiries
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins update enquiries" on public.enquiries;
create policy "Admins update enquiries" on public.enquiries
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on function public.set_my_role(text) from public;
grant execute on function public.set_my_role(text) to authenticated;
grant execute on function public.create_host_property(jsonb, jsonb) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_host() to authenticated;
grant execute on function public.is_property_owner(uuid) to anon, authenticated;

grant select on public.properties to anon, authenticated;
grant update, delete on public.properties to authenticated;
grant select, update, delete on public.property_private to authenticated;
grant insert on public.enquiries to anon, authenticated;
grant select, update on public.enquiries to authenticated;
grant select on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public reads stay photos" on storage.objects;
create policy "Public reads stay photos" on storage.objects
  for select to anon, authenticated using (bucket_id = 'property-images');

drop policy if exists "Hosts upload to own stay folder" on storage.objects;
create policy "Hosts upload to own stay folder" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_host()
  );

drop policy if exists "Hosts delete own stay photos" on storage.objects;
create policy "Hosts delete own stay photos" on storage.objects
  for delete to authenticated using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
