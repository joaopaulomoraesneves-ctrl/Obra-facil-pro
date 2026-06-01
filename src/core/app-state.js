// Obra Fácil Pro — AppState
// Camada intermediária entre interface, storage local e futuro backend.

const AppState = {
  schemaVersion: "2.6.0",

  read() {
    return State;
  },

  write(mutator) {
    if (typeof mutator !== "function") return State;
    mutator(State);
    this.touch();
    return State;
  },

  touch() {
    if (!State.meta) State.meta = {};
    if (!State.meta.id) State.meta.id = cryptoRandom();
    if (!State.meta.createdAt) State.meta.createdAt = new Date().toISOString();
    State.meta.updatedAt = new Date().toISOString();
    State.meta.schemaVersion = this.schemaVersion;
  },

  normalize() {
    this.touch();

    if (!State.project) State.project = {};
    State.project.name = State.project.name || "";
    State.project.client = State.project.client || "";
    State.project.lotWidth = Number(State.project.lotWidth) || 0;
    State.project.lotLength = Number(State.project.lotLength) || 0;
    State.project.defaultHeight = Number(State.project.defaultHeight) || 2.8;
    State.project.lossProfile = Number(State.project.lossProfile) || 0.10;

    if (!Array.isArray(State.rooms)) State.rooms = [];
    State.rooms.forEach((room, index) => {
      room.id = room.id || cryptoRandom();
      room.name = room.name || `Cômodo ${index + 1}`;
      room.width = Math.max(0, Number(room.width) || 0);
      room.length = Math.max(0, Number(room.length) || 0);
      room.height = Math.max(0, Number(room.height) || State.project.defaultHeight || 2.8);
      room.doorCount = Math.max(0, Number(room.doorCount) || 0);
      room.windowCount = Math.max(0, Number(room.windowCount) || 0);
      room.type = room.type || "social";
    });

    if (!State.purchases) State.purchases = { items: {}, manual: [] };
    if (!State.purchases.items) State.purchases.items = {};
    if (!Array.isArray(State.purchases.manual)) State.purchases.manual = [];

    if (!State.tracking) State.tracking = { stages: {}, logs: [] };
    if (!State.tracking.stages) State.tracking.stages = {};
    if (!Array.isArray(State.tracking.logs)) State.tracking.logs = [];

    if (!State.audit || !Array.isArray(State.audit)) State.audit = [];

    if (!State.finance) State.finance = { incomes: [], expenses: [], installments: [] };
    if (!Array.isArray(State.finance.incomes)) State.finance.incomes = [];
    if (!Array.isArray(State.finance.expenses)) State.finance.expenses = [];
    if (!Array.isArray(State.finance.installments)) State.finance.installments = [];

    if (!State.field) State.field = { documents: [], measurements: [], changes: [], quality: {} };
    if (!Array.isArray(State.field.documents)) State.field.documents = [];
    if (!Array.isArray(State.field.measurements)) State.field.measurements = [];
    if (!Array.isArray(State.field.changes)) State.field.changes = [];
    if (!State.field.quality) State.field.quality = {};

    return State;
  },

  toCloudPayload() {
    this.normalize();
    return {
      schemaVersion: this.schemaVersion,
      exportedAt: new Date().toISOString(),
      projectId: State.meta.id,
      state: JSON.parse(JSON.stringify(State))
    };
  },

  summary() {
    this.normalize();
    const totals = Calc.totals(false);
    const budget = Calc.budget(false);
    return {
      schemaVersion: this.schemaVersion,
      projectId: State.meta.id,
      projectName: State.project.name || "Obra sem nome",
      rooms: State.rooms.length,
      area: round(totals.area),
      budget: round(budget.final, 2),
      auditEntries: State.audit.length
    };
  }
};

window.AppState = AppState;
