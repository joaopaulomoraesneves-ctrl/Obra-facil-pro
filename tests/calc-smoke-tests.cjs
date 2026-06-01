const assert = require('node:assert');

function area(width, length) {
  return width * length;
}

function perimeter(width, length) {
  return 2 * (width + length);
}

function floorBoxes(areaM2, loss, yieldPerBox) {
  return Math.ceil((areaM2 * (1 + loss)) / yieldPerBox);
}

function paintLiters(wallM2, coats, yieldPerLiter, loss) {
  return Math.round(((wallM2 * coats / yieldPerLiter) * (1 + loss)) * 10) / 10;
}

function budgetFinal(materials, labor, extra, safetyPercent, profitPercent, discount) {
  const base = materials + labor + extra;
  const safety = base * safetyPercent / 100;
  const minimum = base + safety;
  const profit = minimum * profitPercent / 100;
  return Math.max(0, minimum + profit - discount);
}

assert.strictEqual(area(3, 4), 12);
assert.strictEqual(perimeter(3, 4), 14);
assert.strictEqual(floorBoxes(20, 0.10, 2.5), 9);
assert.strictEqual(paintLiters(50, 2, 10, 0.10), 11);
assert.strictEqual(budgetFinal(1000, 500, 0, 10, 20, 0), 1980);

console.log('OK: testes básicos de cálculo passaram.');
