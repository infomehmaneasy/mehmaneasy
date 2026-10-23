alter table public.properties
  add column if not exists "shareExactLocation" boolean not null default false,
  add column if not exists "mapLatitude" double precision,
  add column if not exists "mapLongitude" double precision;

alter table public.properties
  drop constraint if exists properties_map_coordinates_pair_check,
  add constraint properties_map_coordinates_pair_check check (
    ("mapLatitude" is null) = ("mapLongitude" is null)
  ),
  drop constraint if exists properties_map_coordinates_range_check,
  add constraint properties_map_coordinates_range_check check (
    ("mapLatitude" is null or "mapLatitude" between -90 and 90)
    and ("mapLongitude" is null or "mapLongitude" between -180 and 180)
  ),
  drop constraint if exists properties_exact_map_location_check,
  add constraint properties_exact_map_location_check check (
    not "shareExactLocation"
    or ("mapLatitude" is not null and "mapLongitude" is not null)
  );

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
