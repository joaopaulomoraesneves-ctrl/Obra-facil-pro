const assert = require('node:assert');

function summary(incomes, expenses, installments, forecastProfit) {
  const totalReceived = incomes.reduce((a, x) => a + x.value, 0) + installments.filter(x => x.status === 'pago').reduce((a, x) => a + x.value, 0);
  const paidExpenses = expenses.filter(x => x.status === 'pago').reduce((a, x) => a + x.value, 0);
  const pendingExpenses = expenses.filter(x => x.status !== 'pago').reduce((a, x) => a + x.value, 0);
  const pendingInstallments = installments.filter(x => x.status !== 'pago').reduce((a, x) => a + x.value, 0);
  return { totalReceived, paidExpenses, pendingExpenses, pendingInstallments, realProfit: totalReceived - paidExpenses, forecastProfit };
}

const s = summary(
  [{ value: 1000 }],
  [{ value: 300, status: 'pago' }, { value: 200, status: 'pendente' }],
  [{ value: 500, status: 'pago' }, { value: 500, status: 'pendente' }],
  800
);

assert.strictEqual(s.totalReceived, 1500);
assert.strictEqual(s.paidExpenses, 300);
assert.strictEqual(s.pendingExpenses, 200);
assert.strictEqual(s.pendingInstallments, 500);
assert.strictEqual(s.realProfit, 1200);
assert.strictEqual(s.forecastProfit, 800);

console.log('OK: testes financeiros passaram.');
