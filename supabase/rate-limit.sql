-- Shared rate-limit store (used by src/lib/rateLimitStore.ts in production).
-- Each rate-limit key is a single row; the API upserts the window state on
-- every request. The service-role client used server-side bypasses RLS, so no
-- policies are required. Periodically call rate_limit_cleanup() (e.g. via a
-- cron) to drop expired rows.

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 1,
  reset_at timestamp with time zone not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists rate_limits_reset_at_idx
  on public.rate_limits (reset_at);

-- Drop rows whose window has already elapsed. Safe to run frequently.
create or replace function public.rate_limit_cleanup()
returns integer
language sql
as $$
  delete from public.rate_limits where reset_at <= timezone('utc'::text, now());
  select 0;
$$;

-- Enable pg_cron extension and schedule cleanup every hour.
-- Requires: CREATE EXTENSION IF NOT EXISTS pg_cron; (run once in SQL editor)
-- Then uncomment and run the cron schedule lines below.
-- select cron.schedule('rate-limit-cleanup-hourly', '0 * * * *', 'select public.rate_limit_cleanup()');
