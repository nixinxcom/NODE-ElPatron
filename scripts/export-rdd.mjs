// scripts/export-rdd.mjs
// Usage:
//   node scripts/export-rdd.mjs --base http://localhost:3000 --locales es,en,fr --out ./public/out/rdd
//
// Notes:
// - This script calls your running Next.js dev/server endpoints and writes JSON files.
// - It does NOT import TS modules, so it works without ts-node.
// - Start your server first:  `npm run dev`

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { base: "http://localhost:3000", locales: ["es","en","fr"], outDir: "./public/out/rdd" };
  for (let i=0;i<args.length;i++) {
    const a = args[i];
    if (a === "--base") out.base = args[++i];
    else if (a === "--locales") out.locales = args[++i].split(",").map(s=>s.trim()).filter(Boolean);
    else if (a === "--out") out.outDir = args[++i];
  }
  return out;
}

async function fetchJson(url) {
  const r = await fetch(url, { headers: { "cache-control":"no-cache" } });
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return await r.json();
}

async function main() {
  const { base, locales, outDir } = parseArgs();
  const abs = path.resolve(outDir);
  fs.mkdirSync(abs, { recursive: true });

  // settings (single)
  const settingsUrl = `${base}/api/out/rdd/settings`;
  const settings = await fetchJson(settingsUrl);
  fs.writeFileSync(path.join(abs, `settings.json`), JSON.stringify(settings?.settings ?? settings, null, 2));

  for (const loc of locales) {
    const dir = path.join(abs, loc);
    fs.mkdirSync(dir, { recursive: true });

    // branding
    const bUrl = `${base}/api/out/rdd/branding/${loc}`;
    const b = await fetchJson(bUrl);
    fs.writeFileSync(path.join(dir, `branding.json`), JSON.stringify(b?.branding ?? b, null, 2));

    // i18n
    const iUrl = `${base}/api/out/rdd/i18n/${loc}`;
    const i = await fetchJson(iUrl);
    fs.writeFileSync(path.join(dir, `i18n.json`), JSON.stringify(i?.dict ?? i, null, 2));
  }

  console.log(`✔ RDD exported → ${abs}`);
}

main().catch(e => {
  console.error("✖ export-rdd error:", e?.message || e);
  process.exit(1);
});
