-- Lets the app check if an email is registered before sending an Auth OTP (no Edge Function needed).

create or replace function public.auth_email_exists(p_email text)
returns boolean
language sql
security definer
stable
set search_path = auth, public
as $$
  select exists (
    select 1
    from auth.users
    where lower(trim(email)) = lower(trim(p_email))
  );
$$;

revoke all on function public.auth_email_exists(text) from public;
grant execute on function public.auth_email_exists(text) to anon, authenticated;
