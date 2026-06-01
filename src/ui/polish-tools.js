// Obra Fácil Pro — Polimento Pré-Produção

const PolishTools = {
  onboardingSteps() {
    const totals = Calc.totals(false);
    const budget = Calc.budget(false);
    const backup = localStorage.getItem("obra_facil_pro_last_backup");

    return [
      { title: "Criar ou abrir uma obra", done: !!State.meta?.id && !!State.project, target: "obras" },
      { title: "Preencher dados da obra", done: !!State.project?.name, target: "obra" },
      { title: "Cadastrar cômodos", done: State.rooms.length > 0, target: "comodos" },
      { title: "Conferir área e materiais", done: totals.area > 0, target: "calculos" },
      { title: "Configurar orçamento", done: budget.final > 0, target: "orcamento" },
      { title: "Revisar compras", done: Purchases.summary().totalItems > 0, target: "compras" },
      { title: "Gerar relatório", done: !!State.project?.name && budget.final > 0, target: "relatorio" },
      { title: "Fazer backup geral", done: !!backup, target: "obras" }
    ];
  },

  backupStatus() {
    const raw = localStorage.getItem("obra_facil_pro_last_backup");
    if (!raw) return { ok: false, text: "Nenhum backup geral registrado. Faça um backup antes de ações importantes." };

    const date = new Date(raw);
    const ageDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (ageDays > 7) return { ok: false, text: `Último backup há ${ageDays} dias. Recomenda-se fazer um novo backup.` };
    return { ok: true, text: `Último backup em ${date.toLocaleDateString("pt-BR")}.` };
  },

  clientSummary() {
    const totals = Calc.totals(false);
    const budget = Calc.budget(false);
    const schedule = Schedule.stages(false);
    const tracking = Tracking.summary();

    return {
      projectName: State.project?.name || "Obra sem nome",
      client: State.project?.client || "Cliente não informado",
      status: State.meta?.status || "orçamento",
      area: round(totals.area),
      rooms: State.rooms.length,
      finalValue: budget.final,
      pricePerM2: budget.pricePerM2,
      start: schedule.start,
      end: schedule.end,
      totalDays: schedule.totalDays,
      progress: tracking.progress,
      materials: {
        floorBoxes: totals.floorBoxes,
        paintLiters: round(totals.paintLiters, 1),
        blocks: Math.round(totals.blocks)
      }
    };
  }
};

window.PolishTools = PolishTools;
