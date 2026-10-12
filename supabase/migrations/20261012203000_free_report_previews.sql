create table if not exists public.report_previews (
  user_id text primary key,
  name text not null default 'Campaign analysis',
  report_data jsonb not null default '{}'::jsonb,
  methodology_version text not null default 'cp-2026.09',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.report_previews enable row level security;
revoke all on public.report_previews from anon, authenticated;
grant select, insert, update, delete on public.report_previews to service_role;
