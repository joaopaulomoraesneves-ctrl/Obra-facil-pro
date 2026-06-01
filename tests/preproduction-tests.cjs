const assert = require('node:assert');

function budgetFinal(materials, labor, extra, safetyPercent, profitPercent, discount) {
  const base = materials + labor + extra;
  const safety = base * safetyPercent / 100;
  const minimum = base + safety;
  const profit = minimum * profitPercent / 100;
  return Math.max(0, minimum + profit - discount);
}

function progressWeighted(stages) {
  const total = stages.reduce((a, s) => a + s.days, 0) || 1;
  const weighted = stages.reduce((a, s) => a + s.days * s.percent, 0);
  return Math.round((weighted / total) * 10) / 10;
}

function purchaseBalance(bought, used) {
  return bought - used;
}

function needsBackup(lastBackupISO, maxDays = 7) {
  if (!lastBackupISO) return true;
  const age = Math.floor((Date.now() - new Date(lastBackupISO).getTime()) / (1000 * 60 * 60 * 24));
  return age > maxDays;
}

assert.strictEqual(budgetFinal(1000, 500, 100, 10, 20, 50), 2062);
assert.strictEqual(progressWeighted([{days: 5, percent: 100}, {days: 5, percent: 0}]), 50);
assert.strictEqual(purchaseBalance(20, 7), 13);
assert.strictEqual(needsBackup(""), true);

console.log('OK: testes estendidos pré-produção passaram.');
