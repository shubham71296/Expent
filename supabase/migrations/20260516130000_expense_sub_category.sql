alter table public.expenses
  add column if not exists sub_category text not null default '';
