// Obra Fácil Pro — Campo, Medições, Alterações e Qualidade

const FieldManagement = {
  ensure() {
    if (!State.field) {
      State.field = {
        documents: [],
        measurements: [],
        changes: [],
        quality: {}
      };
    }
    if (!Array.isArray(State.field.documents)) State.field.documents = [];
    if (!Array.isArray(State.field.measurements)) State.field.measurements = [];
    if (!Array.isArray(State.field.changes)) State.field.changes = [];
    if (!State.field.quality) State.field.quality = {};
  },

  qualityDefaults() {
    return [
      "Fundação conferida",
      "Alvenaria conferida",
      "Instalação elétrica revisada",
      "Instalação hidráulica revisada",
      "Chapisco/reboco conferido",
      "Contrapiso conferido",
      "Piso/revestimento conferido",
      "Pintura conferida",
      "Acabamento final conferido",
      "Limpeza e entrega conferidas"
    ];
  },

  summary() {
    this.ensure();
    const measuredValue = State.field.measurements.reduce((acc, item) => acc + this.executedValue(item), 0);
    const approvedChanges = State.field.changes.filter(c => c.status === "aprovado");
    const approvedCost = approvedChanges.reduce((acc, item) => acc + (Number(item.costImpact) || 0), 0);
    const approvedDays = approvedChanges.reduce((acc, item) => acc + (Number(item.daysImpact) || 0), 0);
    const qualityItems = this.qualityDefaults();
    const qualityDone = qualityItems.filter(item => !!State.field.quality[item]).length;

    return {
      documents: State.field.documents.length,
      measurements: State.field.measurements.length,
      changes: State.field.changes.length,
      pendingChanges: State.field.changes.filter(c => c.status === "pendente").length,
      approvedCost,
      approvedDays,
      measuredValue,
      qualityDone,
      qualityTotal: qualityItems.length,
      qualityPercent: qualityItems.length ? round((qualityDone / qualityItems.length) * 100, 1) : 0
    };
  },

  measurementPercent(item) {
    const planned = Number(item.plannedQty) || 0;
    const done = Number(item.doneQty) || 0;
    if (!planned) return 0;
    return Math.max(0, Math.min(100, round((done / planned) * 100, 1)));
  },

  executedValue(item) {
    const planned = Number(item.plannedQty) || 0;
    const done = Number(item.doneQty) || 0;
    const value = Number(item.plannedValue) || 0;
    if (!planned) return 0;
    return round((done / planned) * value, 2);
  },

  addDocument(data) {
    this.ensure();
    State.field.documents.unshift({
      id: cryptoRandom(),
      date: todayISO(),
      type: data.type || "Observação geral",
      title: data.title || "Documento sem título",
      ref: data.ref || "",
      note: data.note || ""
    });
  },

  addMeasurement(data) {
    this.ensure();
    State.field.measurements.unshift({
      id: cryptoRandom(),
      date: todayISO(),
      service: data.service || "Serviço",
      plannedQty: Number(data.plannedQty) || 0,
      doneQty: Number(data.doneQty) || 0,
      unit: data.unit || "un.",
      plannedValue: Number(data.plannedValue) || 0,
      note: data.note || ""
    });
  },

  addChange(data) {
    this.ensure();
    State.field.changes.unshift({
      id: cryptoRandom(),
      date: todayISO(),
      title: data.title || "Alteração",
      reason: data.reason || "",
      costImpact: Number(data.costImpact) || 0,
      daysImpact: Number(data.daysImpact) || 0,
      status: data.status || "pendente"
    });
  },

  remove(kind, id) {
    this.ensure();
    if (kind === "document") State.field.documents = State.field.documents.filter(x => x.id !== id);
    if (kind === "measurement") State.field.measurements = State.field.measurements.filter(x => x.id !== id);
    if (kind === "change") State.field.changes = State.field.changes.filter(x => x.id !== id);
  },

  toggleQuality(label) {
    this.ensure();
    State.field.quality[label] = !State.field.quality[label];
  }
};

window.FieldManagement = FieldManagement;
