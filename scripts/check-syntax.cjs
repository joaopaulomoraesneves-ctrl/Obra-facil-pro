const { execFileSync } = require('node:child_process');
const { readdirSync, statSync } = require('node:fs');
const { join } = require('node:path');

function listJs(dir) {
  const out = [];
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...listJs(full));
    else if (full.endsWith('.js')) out.push(full);
  }
  return out;
}

const files = listJs('src');
for (const file of files) {
  execFileSync('node', ['--check', file], { stdio: 'inherit' });
}
console.log(`OK: ${files.length} arquivos JavaScript verificados.`);
