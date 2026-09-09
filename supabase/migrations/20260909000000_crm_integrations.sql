create table public.crm_connections (
  id bigint generated always as identity primary key,
  user_id text not null,
  provider text not null check (provider in ('hubspot', 'salesforce')),
  external_account_id text not null,
  display_name text,
  status text not null default 'connected' check (status in ('connected', 'reauthorization_required', 'disabled')),
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  config jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, external_account_id)
);

create table public.api_keys (
  id bigint generated always as identity primary key,
  user_id text not null,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  last_four text not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (char_length(key_hash) between 40 and 64),
  check (char_length(last_four) = 4)
);

create table public.campaigns (
  id bigint generated always as identity primary key,
  user_id text not null,
  source text not null,
  external_id text not null,
  name text not null,
  campaign_type text,
  spend numeric(18,2),
  impressions bigint,
  clicks bigint,
  registrations bigint,
  leads bigint,
  opportunities bigint,
  average_deal_value numeric(18,2),
  entered_pipeline numeric(18,2),
  sales_cycle_days integer not null default 90 check (sales_cycle_days > 0),
  attribution_window_days integer not null default 90 check (attribution_window_days > 0),
  metrics jsonb not null default '{}'::jsonb,
  methodology_version text not null,
  occurred_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source, external_id),
  check (spend is null or spend >= 0),
  check (impressions is null or impressions >= 0),
  check (clicks is null or clicks >= 0),
  check (registrations is null or registrations >= 0),
  check (leads is null or leads >= 0),
  check (opportunities is null or opportunities >= 0),
  check (average_deal_value is null or average_deal_value >= 0),
  check (entered_pipeline is null or entered_pipeline >= 0)
);

create table public.source_records (
  id bigint generated always as identity primary key,
  user_id text not null,
  connection_id bigint references public.crm_connections(id) on delete cascade,
  provider text not null,
  object_type text not null,
  external_id text not null,
  payload jsonb not null,
  occurred_at timestamptz,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, provider, object_type, external_id)
);

create table public.sync_runs (
  id bigint generated always as identity primary key,
  user_id text not null,
  connection_id bigint not null references public.crm_connections(id) on delete cascade,
  provider text not null,
  status text not null check (status in ('running', 'completed', 'failed')),
  records_seen integer not null default 0 check (records_seen >= 0),
  records_imported integer not null default 0 check (records_imported >= 0),
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.evidence_snapshots (
  id bigint generated always as identity primary key,
  user_id text not null,
  campaign_id bigint not null references public.campaigns(id) on delete cascade,
  source text not null,
  external_id text not null,
  payload jsonb not null,
  metrics jsonb not null,
  methodology_version text not null,
  created_at timestamptz not null default now()
);

create index crm_connections_user_provider_idx on public.crm_connections (user_id, provider);
create index api_keys_user_created_idx on public.api_keys (user_id, created_at desc);
create index campaigns_user_updated_idx on public.campaigns (user_id, updated_at desc);
create index source_records_connection_idx on public.source_records (connection_id);
create index source_records_user_provider_idx on public.source_records (user_id, provider, synced_at desc);
create index sync_runs_connection_idx on public.sync_runs (connection_id);
create index sync_runs_user_started_idx on public.sync_runs (user_id, started_at desc);
create index evidence_snapshots_campaign_idx on public.evidence_snapshots (campaign_id, created_at desc);
create index evidence_snapshots_user_created_idx on public.evidence_snapshots (user_id, created_at desc);

alter table public.crm_connections enable row level security;
alter table public.api_keys enable row level security;
alter table public.campaigns enable row level security;
alter table public.source_records enable row level security;
alter table public.sync_runs enable row level security;
alter table public.evidence_snapshots enable row level security;

revoke all on public.crm_connections, public.api_keys, public.campaigns, public.source_records, public.sync_runs, public.evidence_snapshots from anon, authenticated;
grant select, insert, update, delete on public.crm_connections, public.api_keys, public.campaigns, public.source_records, public.sync_runs, public.evidence_snapshots to service_role;
grant usage, select on all sequences in schema public to service_role;
