// Obra Fácil Pro — Ferramentas Pré-Backend

const AlertSeverity = {
  CRITICAL: "critical",
  WARNING: "warning",
  SUGGESTION: "suggestion",
  INFO: "info"
};

const DataValidator = {
  validate() {
    AppState.normalize();

    const alerts = [];
    const add = (severity, area, message) => alerts.push({ severity, area, message });

    if (!State.meta?.id) add(AlertSeverity.CRITICAL, "Identificação", "A obra atual está sem ID.");
    if (!State.project?.name) add(AlertSeverity.WARNING, "Projeto", "A obra atual está sem nome.");
    if (!State.rooms.length) add(AlertSeverity.WARNING, "Cômodos", "Nenhum cômodo cadastrado.");

    State.rooms.forEach((room) => {
      if (!room.id) add(AlertSeverity.CRITICAL, "Cômodos", `${room.name || "Cômodo"} está sem ID.`);
      if (room.width <= 0 || room.length <= 0 || room.height <= 0) {
        add(AlertSeverity.WARNING, "Cômodos", `${room.name || "Cômodo"} tem medidas inválidas ou zeradas.`);
      }
    });

    const floorAlerts = Floorplan.validation().filter(x => x[0] === "bad");
    floorAlerts.forEach(x => add(AlertSeverity.WARNING, "Planta", x[1]));

    const health = SystemHealth.collect();
    if (health.bad > 0) add(AlertSeverity.CRITICAL, "Sistema", `Existem ${health.bad} alerta(s) grave(s) no painel de saúde.`);
    if (!localStorage.getItem("obra_facil_pro_last_backup")) {
      add(AlertSeverity.SUGGESTION, "Backup", "Faça um backup geral antes do backend.");
    }

    add(AlertSeverity.INFO, "Backend", "Sistema pronto para validação pré-Supabase em modo local.");

    return alerts;
  },

  score() {
    const alerts = this.validate();
    const penalty = alerts.reduce((acc, a) => {
      if (a.severity === AlertSeverity.CRITICAL) return acc + 25;
      if (a.severity === AlertSeverity.WARNING) return acc + 10;
      if (a.severity === AlertSeverity.SUGGESTION) return acc + 4;
      return acc;
    }, 0);
    return Math.max(0, Math.min(100, 100 - penalty));
  }
};

const PreBackendTools = {
  summary() {
    const alerts = DataValidator.validate();
    const migrations = LocalMigrations.status();
    const app = AppState.summary();

    return {
      score: DataValidator.score(),
      critical: alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
      warnings: alerts.filter(a => a.severity === AlertSeverity.WARNING).length,
      suggestions: alerts.filter(a => a.severity === AlertSeverity.SUGGESTION).length,
      info: alerts.filter(a => a.severity === AlertSeverity.INFO).length,
      migrations,
      app
    };
  },

  runSafeFixes() {
    const migration = LocalMigrations.runAll();
    if (typeof Floorplan !== "undefined") Floorplan.autoLayout();
    if (typeof Tracking !== "undefined") Tracking.ensure();
    if (typeof Installations !== "undefined") Installations.ensure();
    Storage.save();
    UI.fill();
    UI.renderAll();
    UI.toast("Refinamento pré-backend aplicado.");
    return migration;
  },

  exportValidationReport() {
    const payload = {
      app: App,
      exportedAt: new Date().toISOString(),
      summary: this.summary(),
      alerts: DataValidator.validate(),
      normalizedState: AppState.toCloudPayload()
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "obra-facil-pro-validacao-pre-backend.json";
    a.click();
    URL.revokeObjectURL(a.href);
    UI.toast("Relatório de validação exportado.");
  }
};

window.AlertSeverity = AlertSeverity;
window.DataValidator = DataValidator;
window.PreBackendTools = PreBackendTools;
