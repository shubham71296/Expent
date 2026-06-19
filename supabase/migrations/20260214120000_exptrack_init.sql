-- Pennibly: categories + expenses with RLS (apply in Supabase SQL editor or `supabase db push`)

create table if not exists public.categories (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text not null,
  color text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists categories_user_id_idx on public.categories (user_id);

alter table public.categories enable row level security;

drop policy if exists "categories_own" on public.categories;
create policy "categories_own" on public.categories
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.expenses (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null,
  currency text not null,
  original_amount numeric not null,
  category_id text not null,
  sub_category text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_id_idx on public.expenses (user_id);

alter table public.expenses enable row level security;

drop policy if exists "expenses_own" on public.expenses;
create policy "expenses_own" on public.expenses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
