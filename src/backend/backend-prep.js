const BackendPrep={
  tables(){
    return [
      ["tenants","Empresa/cliente dono das obras"],
      ["profiles","Usuários e permissões futuras"],
      ["projects","Obras principais"],
      ["rooms","Cômodos e medidas"],
      ["floorplan_rooms","Posição X/Y dos cômodos na planta"],
      ["material_settings","Configurações de rendimento"],
      ["budget_settings","Preços, mão de obra, lucro e descontos"],
      ["composition_settings","Índices de argamassa, reboco e contrapiso"],
      ["installation_points","Pontos hidráulicos e elétricos por cômodo"],
      ["purchase_items","Lista de compras e controle de materiais"],
      ["schedule_settings","Equipe, data de início e produtividade"],
      ["tracking_stages","Execução por etapa"],
      ["daily_logs","Diário de obra"],
      ["reports","Relatórios gerados no futuro"],
      ["audit_logs","Auditoria de cálculo"]
    ];
  },
  normalized(){
    ProjectManager.saveCurrent();
    const manager=ProjectManager.data;
    const current=this.normalizeState(State);
    const projects=(manager.projects||[]).map(p=>this.normalizeState(p.state));
    return {
      schemaVersion:"2.1.0",
      exportedAt:new Date().toISOString(),
      app:App,
      tenant:{
        id:"local_tenant",
        name:State.backend?.tenantName||"Minha Empresa",
        ownerName:State.backend?.ownerName||"",
        ownerEmail:State.backend?.ownerEmail||"",
        plan:State.backend?.plan||"local"
      },
      currentProjectId:State.meta.id,
      current,
      projects
    };
  },
  normalizeState(state){
    return {
      meta:state.meta,
      project:state.project,
      rooms:state.rooms||[],
      settings:state.settings,
      budget:state.budget,
      schedule:state.schedule,
      tracking:state.tracking,
      floorplan:state.floorplan,
      purchases:state.purchases,
      compositions:state.compositions,
      installations:state.installations,
      audit:state.audit||[]
    };
  },
  readiness(){
    const h=SystemHealth.collect();
    const checks=[
      ["Obras com ID",ProjectManager.data.projects.every(p=>p.id&&p.state?.meta?.id),"Alguma obra está sem ID interno."],
      ["Obra atual salva",!!State.meta.id,"Salve a obra atual."],
      ["Nome da empresa",!!(State.backend?.tenantName),"Informe nome da empresa/tenant."],
      ["Backup geral",!!localStorage.getItem("obra_facil_pro_last_backup"),"Faça backup geral antes da migração."],
      ["Dados consistentes",h.bad===0,"Resolva alertas graves na aba Sistema."],
      ["Múltiplas obras prontas",ProjectManager.data.projects.length>=1,"Crie ou importe obras."],
      ["Exportação estruturada",true,"Disponível neste pacote."],
      ["SQL inicial",true,"Disponível neste pacote."]
    ];
    return checks;
  },
  warnings(){
    const checks=this.readiness();
    const w=[];
    checks.forEach(c=>{if(!c[1])w.push(["warn",c[2]])});
    if(SystemHealth.collect().bad>0)w.push(["bad","Existem alertas graves no sistema. Corrija antes de migrar para backend."]);
    if(!w.length)w.push(["ok","Base pronta para uma primeira migração técnica."]);
    return w;
  },
  sql(){
    return `-- Obra Fácil Pro — SQL inicial PostgreSQL/Supabase
-- Versão de modelo: 2.1.0
-- Observação: antes de produção, adicionar RLS, autenticação e políticas de acesso.

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

-- Próximas tabelas recomendadas:
-- budget_settings, schedule_settings, tracking_stages, installation_points,
-- composition_settings, material_settings, reports, profiles.
`;
  },
  exportNormalized(){
    const data=this.normalized();
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="obra-facil-pro-dados-estruturados-backend.json";
    a.click();
    URL.revokeObjectURL(a.href);
    UI.toast("Dados estruturados exportados.");
  },
  exportSQL(){
    const blob=new Blob([this.sql()],{type:"text/sql"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="obra-facil-pro-schema-inicial.sql";
    a.click();
    URL.revokeObjectURL(a.href);
    UI.toast("SQL inicial exportado.");
  }
};
