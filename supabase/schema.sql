-- ExcelFlow: profiles + templates with RLS
-- Run in Supabase → SQL Editor (once per project).

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  subscription_status text default 'free',
  lemon_squeezy_customer_id text,
  created_at timestamptz default now()
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  config jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists templates_user_id_idx on public.templates (user_id);

alter table public.profiles enable row level security;
alter table public.templates enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "templates_select_own" on public.templates;
create policy "templates_select_own" on public.templates
  for select using (auth.uid() = user_id);

drop policy if exists "templates_update_own" on public.templates;
create policy "templates_update_own" on public.templates
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "templates_delete_own" on public.templates;
create policy "templates_delete_own" on public.templates
  for delete using (auth.uid() = user_id);

alter table public.profiles
  drop constraint if exists profiles_subscription_status_check;
alter table public.profiles
  add constraint profiles_subscription_status_check
  check (subscription_status in ('free', 'pro'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, subscription_status)
  values (
    new.id,
    coalesce(new.email, new.id::text || '@users.local'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'free'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        avatar_url = excluded.avatar_url;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Clients may update name/avatar, never billing fields. Webhooks use service_role.
create or replace function public.protect_profile_billing()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if auth.role() is distinct from 'service_role' then
      new.subscription_status := 'free';
    elsif new.subscription_status is null then
      new.subscription_status := 'free';
    end if;
    return new;
  end if;

  if auth.role() is distinct from 'service_role' then
    new.subscription_status := old.subscription_status;
    new.lemon_squeezy_customer_id := old.lemon_squeezy_customer_id;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_billing on public.profiles;
create trigger profiles_protect_billing
  before insert or update on public.profiles
  for each row execute function public.protect_profile_billing();

drop policy if exists "templates_insert_own" on public.templates;
drop policy if exists "templates_insert_pro" on public.templates;
create policy "templates_insert_pro" on public.templates
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.subscription_status = 'pro'
    )
  );

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception
  when duplicate_object then null;
end $$;

-- Guest feedback (widget). Writes go through the Next.js API with service_role.
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) between 1 and 200),
  path text,
  tool text,
  locale text,
  user_id uuid references auth.users on delete set null,
  created_at timestamptz default now()
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;
