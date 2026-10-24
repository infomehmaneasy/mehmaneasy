alter table public.properties
  drop constraint if exists properties_category_check,
  drop constraint if exists "properties_stayTier_check";

update public.properties
set category = 'Classic'
where category = 'Gold';

update public.properties
set "stayTier" = 'Classic'
where "stayTier" = 'Gold';

alter table public.properties
  add constraint properties_category_check
    check (category in ('Residential', 'Commercial', 'Land', 'Rental', 'Royal', 'Classic', 'Easy')),
  add constraint "properties_stayTier_check"
    check ("stayTier" in ('Royal', 'Classic', 'Easy'));
