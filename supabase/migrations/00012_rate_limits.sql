-- ============================================================
-- Persistent rate limiting for serverless environments
-- ============================================================

create table if not exists rate_limits (
  key text primary key,
  count int not null default 1,
  reset_at timestamptz not null
);

create index if not exists idx_rate_limits_reset on rate_limits(reset_at);

alter table rate_limits enable row level security;

-- Atomic rate limit check + increment
create or replace function rate_limit_check(
  p_key text,
  p_max_requests int,
  p_window_ms int
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_reset_at timestamptz;
  v_now timestamptz := now();
  v_interval interval := (p_window_ms || ' milliseconds')::interval;
begin
  select count, reset_at into v_count, v_reset_at
  from rate_limits
  where key = p_key;

  if not found then
    insert into rate_limits (key, count, reset_at)
    values (p_key, 1, v_now + v_interval);
    return jsonb_build_object('allowed', true, 'remaining', p_max_requests - 1);
  end if;

  if v_reset_at <= v_now then
    update rate_limits set count = 1, reset_at = v_now + v_interval
    where key = p_key;
    return jsonb_build_object('allowed', true, 'remaining', p_max_requests - 1);
  end if;

  if v_count >= p_max_requests then
    return jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'retryAfter', extract(epoch from (v_reset_at - v_now))::int
    );
  end if;

  update rate_limits set count = count + 1 where key = p_key;
  return jsonb_build_object('allowed', true, 'remaining', p_max_requests - v_count - 1);
end;
$$;

grant execute on function rate_limit_check(text, int, int) to anon, authenticated;

-- Cleanup expired entries periodically (called by cron or manually)
create or replace function rate_limit_cleanup()
returns void
language sql
security definer
as $$
  delete from rate_limits where reset_at <= now() - interval '1 hour';
$$;

grant execute on function rate_limit_cleanup() to authenticated;
