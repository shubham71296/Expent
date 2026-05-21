-- OTP-based password reset (used only via Edge Functions + service role).

create table if not exists public.password_reset_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp_hash text not null,
  reset_token uuid unique,
  expires_at timestamptz not null,
  verified_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_otps_email_idx on public.password_reset_otps (email);
create index if not exists password_reset_otps_reset_token_idx on public.password_reset_otps (reset_token);

alter table public.password_reset_otps enable row level security;

-- No policies: clients cannot read/write; Edge Functions use service role.
