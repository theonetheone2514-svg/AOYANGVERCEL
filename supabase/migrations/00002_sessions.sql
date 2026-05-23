-- Sessions table for custom LINE OTP auth
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  token text not null unique,
  user_type text not null check (user_type in ('customer', 'merchant', 'rider', 'admin')),
  user_id text,
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

create index if not exists idx_sessions_token on sessions(token);
create index if not exists idx_sessions_phone on sessions(phone);
create index if not exists idx_sessions_expires on sessions(expires_at);
