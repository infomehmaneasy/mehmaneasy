create table if not exists public.site_media (
  id text primary key,
  media jsonb not null,
  updated_at timestamptz not null default now(),
  constraint site_media_discovery_id_check check (id = 'discovery')
);

alter table public.site_media enable row level security;

drop policy if exists "Discovery images are public" on public.site_media;
create policy "Discovery images are public" on public.site_media
  for select to anon, authenticated using (id = 'discovery');

drop policy if exists "Admins manage discovery images" on public.site_media;
create policy "Admins manage discovery images" on public.site_media
  for all to authenticated using (public.is_admin())
  with check (public.is_admin());

grant select on public.site_media to anon, authenticated;
grant insert, update on public.site_media to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public reads site media" on storage.objects;
create policy "Public reads site media" on storage.objects
  for select to anon, authenticated using (bucket_id = 'site-media');

drop policy if exists "Admins upload site media" on storage.objects;
create policy "Admins upload site media" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'site-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_admin()
  );

insert into public.site_media (id, media)
values (
  'discovery',
  '{
    "collections": {
      "Classic": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1100&q=85",
      "Easy": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=85",
      "Royal": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1100&q=85"
    },
    "destinations": {
      "North Goa": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=85",
      "South Goa": "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=85",
      "Candolim": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=85",
      "Arambol": "https://images.unsplash.com/photo-1473116763249-2fee01ff3a91?auto=format&fit=crop&w=900&q=85",
      "Assagao": "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85",
      "Mumbai": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=900&q=85"
    }
  }'::jsonb
)
on conflict (id) do nothing;

alter table public.properties disable trigger protect_property_review_fields;

update public.properties as property
set "shareExactLocation" = true,
    "mapLatitude" = private.latitude,
    "mapLongitude" = private.longitude
from public.property_private as private
where private."propertyId" = property.id
  and private.latitude between -90 and 90
  and private.longitude between -180 and 180;

update public.properties
set status = 'pending_review',
    "verificationStatus" = 'pending',
    "verificationNotes" = 'Add an exact map pin before republishing this stay.',
    "reviewedAt" = null,
    "reviewedBy" = null
where status = 'active'
  and "verificationStatus" = 'approved'
  and ("mapLatitude" is null or "mapLongitude" is null);

alter table public.properties enable trigger protect_property_review_fields;
