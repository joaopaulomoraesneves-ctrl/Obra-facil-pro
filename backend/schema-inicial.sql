-- Obra Fácil Pro — SQL inicial PostgreSQL/Supabase
-- Pacote 14

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
