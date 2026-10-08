import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const folder = "apps/web/dist/assets";
const files = await readdir(folder);
const totals = { jsGzip: 0, cssGzip: 0, woff2: 0 };
for (const file of files) {
  const data = await readFile(join(folder, file));
  if (file.endsWith(".js")) totals.jsGzip += gzipSync(data).byteLength;
  if (file.endsWith(".css")) totals.cssGzip += gzipSync(data).byteLength;
  if (file.endsWith(".woff2")) totals.woff2 += data.byteLength;
}
const budgets = { jsGzip: 125_000, cssGzip: 12_000, woff2: 120_000 };
for (const [metric, budget] of Object.entries(budgets)) {
  const actual = totals[metric];
  console.log(
    `${metric}: ${(actual / 1000).toFixed(1)} kB / ${(budget / 1000).toFixed(0)} kB`,
  );
  if (actual > budget) process.exitCode = 1;
}
