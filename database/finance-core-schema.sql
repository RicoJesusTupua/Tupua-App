-- Tupua Finance Core — PostgreSQL starter schema
-- REVIEW BEFORE APPLYING. This file has NOT been run against a database.
-- The trusted API must verify the user's session/JWT, then set
-- app.user_id with SET LOCAL / set_config(..., true) inside EACH transaction.
-- Never let the browser choose app.user_id. Use a non-owner, non-BYPASSRLS app role.

begin;

create schema if not exists finance;

create table if not exists finance.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  entry_date date not null,
  entry_type text not null check (entry_type in ('revenue','refund','fee','expense')),
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  category text not null check (length(category) between 1 and 60),
  source_label text not null default '' check (length(source_label) <= 100),
  memo text not null default '' check (length(memo) <= 240),
  status text not null default 'posted' check (status in ('posted','voided')),
  idempotency_key text not null check (length(idempotency_key) between 8 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, idempotency_key)
);

create index if not exists ledger_entries_owner_date_idx
  on finance.ledger_entries (owner_user_id, entry_date desc);

create table if not exists finance.audit_events (
  id bigint generated always as identity primary key,
  owner_user_id uuid not null,
  actor_user_id uuid not null,
  entity_type text not null check (entity_type in ('ledger_entry')),
  entity_id uuid not null,
  action text not null check (action in ('created','updated','voided')),
  event_data jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists audit_events_owner_time_idx
  on finance.audit_events (owner_user_id, occurred_at desc);

-- Idempotency receipts protect API retries from creating duplicate entries.
create table if not exists finance.idempotency_receipts (
  owner_user_id uuid not null,
  idempotency_key text not null check (length(idempotency_key) between 8 and 120),
  request_fingerprint text not null check (length(request_fingerprint) = 64),
  response_status integer not null check (response_status between 200 and 299),
  response_body jsonb not null,
  created_at timestamptz not null default now(),
  primary key (owner_user_id, idempotency_key)
);

-- RLS uses a transaction-local identity set only by the trusted API after
-- verifying authentication. Missing identity means no rows are accessible.
create or replace function finance.current_user_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;

alter table finance.ledger_entries enable row level security;
alter table finance.ledger_entries force row level security;
alter table finance.audit_events enable row level security;
alter table finance.audit_events force row level security;
alter table finance.idempotency_receipts enable row level security;
alter table finance.idempotency_receipts force row level security;

drop policy if exists ledger_owner_only on finance.ledger_entries;
create policy ledger_owner_only on finance.ledger_entries
  for all
  using (owner_user_id = finance.current_user_id())
  with check (owner_user_id = finance.current_user_id());

drop policy if exists audit_owner_read on finance.audit_events;
create policy audit_owner_read on finance.audit_events
  for select
  using (owner_user_id = finance.current_user_id());

drop policy if exists audit_owner_insert on finance.audit_events;
create policy audit_owner_insert on finance.audit_events
  for insert
  with check (
    owner_user_id = finance.current_user_id()
    and actor_user_id = finance.current_user_id()
  );

drop policy if exists idempotency_owner_only on finance.idempotency_receipts;
create policy idempotency_owner_only on finance.idempotency_receipts
  for all
  using (owner_user_id = finance.current_user_id())
  with check (owner_user_id = finance.current_user_id());

-- Prevent ordinary app-role changes to audit history. Database owners/superusers
-- remain privileged; restrict those credentials operationally.
create or replace function finance.reject_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_events are append-only';
end;
$$;

drop trigger if exists audit_events_no_update_delete on finance.audit_events;
create trigger audit_events_no_update_delete
  before update or delete on finance.audit_events
  for each row execute function finance.reject_audit_mutation();

commit;

-- REQUIRED deployment work, intentionally not automated here:
-- 1. Create a dedicated application DB role that is NOT table owner and has no BYPASSRLS.
-- 2. Grant only schema usage and the exact table operations required by the API.
-- 3. Do not grant UPDATE/DELETE on audit_events; grant SELECT/INSERT only.
-- 4. Ensure the API verifies auth first and runs SET LOCAL app.user_id = '<verified UUID>'
--    within the same transaction as every query. Never accept this UUID from request JSON.
-- 5. Test cross-user reads/writes with two test identities before any real data is used.
