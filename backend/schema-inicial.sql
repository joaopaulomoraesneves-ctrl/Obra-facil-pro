-- Obra Fácil Pro — SQL inicial PostgreSQL/Supabase
-- Pacote 13 — Repositório e Documentação

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text,
  owner_email text,
  plan text default 'local',
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  local_id text,
  name text not null,
  client text,
  status text default 'orcamento',
  lot_width numeric default 0,
  lot_length numeric default 0,
  default_height numeric default 2.8,
  loss_profile numeric default 0.10,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  local_id text,
  name text not null,
  type text,
  width numeric default 0,
  length numeric default 0,
  height numeric default 0,
  door_count numeric default 0,
  window_count numeric default 0,
  door_size text,
  window_size text,
  position_x numeric,
  position_y numeric,
  created_at timestamptz default now()
);

create table if not exists purchase_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  source_id text,
  name text not null,
  unit text,
  planned_qty numeric default 0,
  bought_qty numeric default 0,
  used_qty numeric default 0,
  actual_price numeric default 0,
  supplier text,
  status text default 'pendente',
  source text,
  created_at timestamptz default now()
);

create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  log_date date,
  stage text,
  text text,
  extra_cost numeric default 0,
  hours numeric default 0,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  formula text,
  context text,
  steps text,
  result text,
  created_at timestamptz default now()
);

create table if not exists project_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  schema_version text,
  snapshot jsonb not null,
  created_at timestamptz default now()
);
