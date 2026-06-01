// Obra Fácil Pro — Migrações Locais
// Prepara dados antigos para o formato esperado antes do backend.

const LocalMigrations = {
  currentSchema: "2.6.0",

  list() {
    return [
      { id: "ensure-meta", label: "Garantir meta/id/schema", safe: true },
      { id: "normalize-rooms", label: "Normalizar cômodos e medidas", safe: true },
      { id: "ensure-purchases", label: "Garantir estrutura de compras", safe: true },
      { id: "ensure-tracking", label: "Garantir execução e diário", safe: true },
      { id: "ensure-backend", label: "Garantir preparação backend", safe: true }
    ];
  },

  runAll() {
    const before = JSON.stringify(State).length;
    AppState.normalize();

    if (!State.backend) {
      State.backend = {
        tenantName: "Minha Empresa",
        ownerName: "",
        ownerEmail: "",
        plan: "local",
        cloudReady: false
      };
    }

    if (!State.floorplan) State.floorplan = { grid: 0.5, showGrid: true, scale: 40 };
    if (!State.compositions && typeof Compositions !== "undefined") State.compositions = Compositions.defaults();
    if (!State.installations) {
      State.installations = {
        rooms: {},
        settings: {
          wireMultiplier: 2.8,
          conduitFactor: 1.25,
          pipeFactor: 1.15,
          defaultOutletWireM: 8,
          defaultLightWireM: 10,
          defaultSwitchWireM: 6,
          hydraulicPointPipeM: 4,
          sewerPointPipeM: 3
        }
      };
    }

    State.meta.schemaVersion = this.currentSchema;
    const after = JSON.stringify(State).length;

    return {
      schemaVersion: this.currentSchema,
      changedBytes: after - before,
      migrations: this.list()
    };
  },

  status() {
    const schema = State?.meta?.schemaVersion || "legado/local";
    return {
      currentSchema: this.currentSchema,
      stateSchema: schema,
      needsMigration: schema !== this.currentSchema,
      available: this.list()
    };
  }
};

window.LocalMigrations = LocalMigrations;
