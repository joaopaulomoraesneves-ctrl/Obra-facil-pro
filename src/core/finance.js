// Obra Fácil Pro — Financeiro Real da Obra

const Finance = {
  ensure() {
    if (!State.finance) {
      State.finance = {
        incomes: [],
        expenses: [],
        installments: []
      };
    }
    if (!Array.isArray(State.finance.incomes)) State.finance.incomes = [];
    if (!Array.isArray(State.finance.expenses)) State.finance.expenses = [];
    if (!Array.isArray(State.finance.installments)) State.finance.installments = [];
  },

  addIncome(data) {
    this.ensure();
    State.finance.incomes.unshift({
      id: cryptoRandom(),
      date: data.date || todayISO(),
      desc: data.desc || "Recebimento",
      value: Number(data.value) || 0,
      method: data.method || "Pix",
      note: data.note || ""
    });
  },

  addExpense(data) {
    this.ensure();
    State.finance.expenses.unshift({
      id: cryptoRandom(),
      dueDate: data.dueDate || todayISO(),
      desc: data.desc || "Despesa",
      value: Number(data.value) || 0,
      category: data.category || "Outro",
      supplier: data.supplier || "",
      status: data.status || "pendente"
    });
  },

  generateInstallments(total, count, firstDate, intervalDays) {
    this.ensure();
    total = Number(total) || 0;
    count = Math.max(1, Number(count) || 1);
    intervalDays = Math.max(1, Number(intervalDays) || 30);
    const value = round(total / count, 2);
    const base = new Date((firstDate || todayISO()) + "T12:00:00");

    for (let i = 0; i < count; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + (i * intervalDays));
      State.finance.installments.push({
        id: cryptoRandom(),
        number: i + 1,
        desc: `Parcela ${i + 1}/${count}`,
        value,
        dueDate: d.toISOString().slice(0, 10),
        status: "pendente"
      });
    }
  },

  remove(kind, id) {
    this.ensure();
    if (kind === "income") State.finance.incomes = State.finance.incomes.filter(x => x.id !== id);
    if (kind === "expense") State.finance.expenses = State.finance.expenses.filter(x => x.id !== id);
    if (kind === "installment") State.finance.installments = State.finance.installments.filter(x => x.id !== id);
  },

  setStatus(kind, id, status) {
    this.ensure();
    const list = kind === "expense" ? State.finance.expenses : State.finance.installments;
    const item = list.find(x => x.id === id);
    if (item) item.status = status;
  },

  summary() {
    this.ensure();
    const budget = Calc.budget(false);
    const incomes = State.finance.incomes.reduce((a, x) => a + (Number(x.value) || 0), 0);
    const paidExpenses = State.finance.expenses.filter(x => x.status === "pago").reduce((a, x) => a + (Number(x.value) || 0), 0);
    const pendingExpenses = State.finance.expenses.filter(x => x.status !== "pago").reduce((a, x) => a + (Number(x.value) || 0), 0);
    const paidInstallments = State.finance.installments.filter(x => x.status === "pago").reduce((a, x) => a + (Number(x.value) || 0), 0);
    const pendingInstallments = State.finance.installments.filter(x => x.status !== "pago").reduce((a, x) => a + (Number(x.value) || 0), 0);

    const totalReceived = incomes + paidInstallments;
    const totalSpent = paidExpenses;
    const realProfit = totalReceived - totalSpent;
    const forecastProfit = budget.profit || 0;
    const balance = totalReceived - paidExpenses - pendingExpenses;

    return {
      budgetFinal: budget.final,
      forecastProfit,
      incomes,
      paidInstallments,
      pendingInstallments,
      totalReceived,
      paidExpenses,
      pendingExpenses,
      totalSpent,
      realProfit,
      balance,
      incomeCount: State.finance.incomes.length,
      expenseCount: State.finance.expenses.length,
      installmentCount: State.finance.installments.length
    };
  },

  cashFlow() {
    this.ensure();
    const rows = [];

    State.finance.incomes.forEach(x => rows.push({ type: "in", date: x.date, desc: x.desc, value: Number(x.value) || 0, status: "recebido" }));
    State.finance.installments.forEach(x => rows.push({ type: x.status === "pago" ? "in" : "pending-in", date: x.dueDate, desc: x.desc, value: Number(x.value) || 0, status: x.status }));
    State.finance.expenses.forEach(x => rows.push({ type: x.status === "pago" ? "out" : "pending-out", date: x.dueDate, desc: x.desc, value: Number(x.value) || 0, status: x.status }));

    return rows.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  },

  warnings() {
    const s = this.summary();
    const w = [];
    if (s.pendingExpenses > 0) w.push(["warn", `Existem ${money(s.pendingExpenses)} em despesas pendentes.`]);
    if (s.pendingInstallments > 0) w.push(["warn", `Existem ${money(s.pendingInstallments)} em parcelas a receber.`]);
    if (s.realProfit < 0) w.push(["bad", "O lucro real está negativo no momento."]);
    if (!State.finance.incomes.length && !State.finance.installments.length) w.push(["warn", "Nenhum recebimento ou parcela registrada."]);
    if (!w.length) w.push(["ok", "Financeiro sem alertas importantes."]);
    return w;
  }
};

window.Finance = Finance;
