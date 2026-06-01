const assert = require('node:assert');

function measurementPercent(planned, done) {
  if (!planned) return 0;
  return Math.max(0, Math.min(100, Math.round((done / planned) * 1000) / 10));
}

function executedValue(plannedQty, doneQty, plannedValue) {
  if (!plannedQty) return 0;
  return Math.round(((doneQty / plannedQty) * plannedValue) * 100) / 100;
}

function changeTotals(changes) {
  return changes.filter(c => c.status === 'aprovado').reduce((acc, c) => {
    acc.cost += c.costImpact || 0;
    acc.days += c.daysImpact || 0;
    return acc;
  }, { cost: 0, days: 0 });
}

assert.strictEqual(measurementPercent(100, 25), 25);
assert.strictEqual(measurementPercent(100, 150), 100);
assert.strictEqual(executedValue(100, 40, 2000), 800);
assert.deepStrictEqual(changeTotals([{status:'aprovado',costImpact:500,daysImpact:2},{status:'pendente',costImpact:300,daysImpact:1}]), {cost:500,days:2});

console.log('OK: testes de campo, medições e alterações passaram.');
