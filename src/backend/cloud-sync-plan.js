// Obra Fácil Pro — plano de sincronização futura
// Ainda não sincroniza com Supabase. Serve como contrato técnico para o próximo pacote.

export const cloudSyncPlan = {
  version: '2.5.0',
  mode: 'planned',
  entities: [
    'tenants',
    'projects',
    'rooms',
    'purchase_items',
    'daily_logs',
    'audit_logs',
    'project_snapshots'
  ],
  nextSteps: [
    'Criar autenticação',
    'Criar tabelas no Supabase',
    'Ativar RLS',
    'Mapear ProjectManager para projects',
    'Mapear Storage local para project_snapshots',
    'Criar botão de sincronizar'
  ]
};
