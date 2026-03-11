create extension if not exists pgcrypto;

create table if not exists public.baby_households (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (length(btrim(display_name)) between 1 and 48),
  invite_code text not null unique default lower(encode(gen_random_bytes(6), 'hex')) check (invite_code ~ '^[a-f0-9]{12}$'),
  created_by_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.baby_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  household_id uuid not null references public.baby_households (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.baby_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.baby_households (id) on delete cascade,
  kind text not null check (kind in ('feeding', 'poop', 'probiotic')),
  event_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  amount integer check (amount is null or amount >= 0),
  unit text check (unit in ('ml', 'dose') or unit is null),
  note text,
  created_by_device_id text not null
);

alter table public.baby_profiles add column if not exists household_id uuid references public.baby_households (id) on delete cascade;
alter table public.baby_events add column if not exists household_id uuid references public.baby_households (id) on delete cascade;
alter table public.baby_households add column if not exists created_by_user_id uuid references auth.users (id) on delete set null;
alter table public.baby_households add column if not exists created_at timestamptz not null default now();
alter table public.baby_households add column if not exists updated_at timestamptz not null default now();
alter table public.baby_profiles add column if not exists created_at timestamptz not null default now();
alter table public.baby_profiles add column if not exists updated_at timestamptz not null default now();

create index if not exists baby_events_household_event_at_idx
  on public.baby_events (household_id, event_at desc);

do $$
begin
  if not exists (
    select 1 from public.baby_profiles where household_id is null
  ) then
    alter table public.baby_profiles alter column household_id set not null;
  end if;

  if not exists (
    select 1 from public.baby_events where household_id is null
  ) then
    alter table public.baby_events alter column household_id set not null;
  end if;
end $$;

alter table public.baby_households enable row level security;
alter table public.baby_profiles enable row level security;
alter table public.baby_events enable row level security;

drop policy if exists baby_profiles_select_own on public.baby_profiles;
drop policy if exists baby_profiles_insert_own on public.baby_profiles;
drop policy if exists baby_profiles_update_own on public.baby_profiles;
drop policy if exists baby_events_select_same_family on public.baby_events;
drop policy if exists baby_events_insert_same_family on public.baby_events;
drop policy if exists baby_events_update_same_family on public.baby_events;
drop policy if exists baby_events_delete_same_family on public.baby_events;
drop policy if exists baby_events_select_same_household on public.baby_events;
drop policy if exists baby_events_insert_same_household on public.baby_events;
drop policy if exists baby_events_update_same_household on public.baby_events;
drop policy if exists baby_events_delete_same_household on public.baby_events;

create policy baby_profiles_select_own
  on public.baby_profiles
  for select
  using (auth.uid() = user_id);

create policy baby_profiles_insert_own
  on public.baby_profiles
  for insert
  with check (auth.uid() = user_id);

create policy baby_profiles_update_own
  on public.baby_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy baby_events_select_same_household
  on public.baby_events
  for select
  using (
    household_id in (
      select household_id
      from public.baby_profiles
      where user_id = auth.uid()
    )
  );

create policy baby_events_insert_same_household
  on public.baby_events
  for insert
  with check (
    household_id in (
      select household_id
      from public.baby_profiles
      where user_id = auth.uid()
    )
  );

create policy baby_events_update_same_household
  on public.baby_events
  for update
  using (
    household_id in (
      select household_id
      from public.baby_profiles
      where user_id = auth.uid()
    )
  )
  with check (
    household_id in (
      select household_id
      from public.baby_profiles
      where user_id = auth.uid()
    )
  );

create policy baby_events_delete_same_household
  on public.baby_events
  for delete
  using (
    household_id in (
      select household_id
      from public.baby_profiles
      where user_id = auth.uid()
    )
  );

create or replace function public.get_my_household()
returns table (household_id uuid, display_name text, invite_code text)
language sql
security definer
set search_path = public
as $$
  select household.id, household.display_name, household.invite_code
  from public.baby_profiles as profile
  join public.baby_households as household on household.id = profile.household_id
  where profile.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.create_household_with_profile(p_display_name text)
returns table (household_id uuid, display_name text, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  cleaned_name text := left(btrim(coalesce(p_display_name, '')), 48);
  created_household public.baby_households;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if length(cleaned_name) = 0 then
    raise exception 'Household name is required';
  end if;

  insert into public.baby_households (display_name, created_by_user_id, updated_at)
  values (cleaned_name, auth.uid(), now())
  returning * into created_household;

  insert into public.baby_profiles (user_id, household_id, updated_at)
  values (auth.uid(), created_household.id, now())
  on conflict (user_id) do update
    set household_id = excluded.household_id,
        updated_at = excluded.updated_at;

  return query
    select created_household.id, created_household.display_name, created_household.invite_code;
end;
$$;

create or replace function public.join_household_with_invite(p_invite_code text)
returns table (household_id uuid, display_name text, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  cleaned_invite_code text := lower(regexp_replace(coalesce(p_invite_code, ''), '[^a-f0-9]', '', 'g'));
  target_household public.baby_households;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into target_household
  from public.baby_households as household
  where household.invite_code = cleaned_invite_code
  limit 1;

  if target_household.id is null then
    raise exception 'Invite code not found';
  end if;

  insert into public.baby_profiles (user_id, household_id, updated_at)
  values (auth.uid(), target_household.id, now())
  on conflict (user_id) do update
    set household_id = excluded.household_id,
        updated_at = excluded.updated_at;

  return query
    select target_household.id, target_household.display_name, target_household.invite_code;
end;
$$;

grant execute on function public.get_my_household() to authenticated;
grant execute on function public.create_household_with_profile(text) to authenticated;
grant execute on function public.join_household_with_invite(text) to authenticated;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'baby_events'
  ) then
    alter publication supabase_realtime add table public.baby_events;
  end if;
end $$;
