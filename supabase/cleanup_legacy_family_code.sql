do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'baby_profiles'
      and column_name = 'family_code'
  ) and exists (
    select 1
    from public.baby_profiles
    where household_id is null
      and family_code is not null
      and length(btrim(family_code)) > 0
  ) then
    raise exception 'baby_profiles still contains legacy family_code rows without household_id';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'baby_events'
      and column_name = 'family_code'
  ) and exists (
    select 1
    from public.baby_events
    where household_id is null
      and family_code is not null
      and length(btrim(family_code)) > 0
  ) then
    raise exception 'baby_events still contains legacy family_code rows without household_id';
  end if;
end $$;

alter table public.baby_profiles drop column if exists family_code;
alter table public.baby_events drop column if exists family_code;
alter table public.baby_households drop column if exists legacy_family_code;
