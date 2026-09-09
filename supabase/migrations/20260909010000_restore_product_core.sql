create table public.subscriptions (
  id bigint generated always as identity primary key,
  user_id text not null,
  stripe_customer_id text,
  stripe_subscription_id text not null unique,
  status text not null check (status in ('trialing','active','past_due','unpaid','canceled','incomplete','incomplete_expired','paused')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_user_status_idx on public.subscriptions (user_id, status);
create table public.reports (
  id bigint generated always as identity primary key,
  user_id text not null,
  name text not null,
  vertical text not null default 'general_b2b',
  organization_name text not null default '',
  primary_color text not null default '#071529',
  accent_color text not null default '#b5ff32',
  narrative text not null default '',
  report_data jsonb not null default '{}'::jsonb,
  methodology_version text not null,
  benchmark_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reports_user_updated_idx on public.reports (user_id, updated_at desc);
alter table public.subscriptions enable row level security;
alter table public.reports enable row level security;
revoke all on public.subscriptions, public.reports from anon, authenticated;
grant select, insert, update, delete on public.subscriptions, public.reports to service_role;
grant usage, select on all sequences in schema public to service_role;
