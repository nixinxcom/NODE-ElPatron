#!/usr/bin/env node
import { rm } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { spawn, execFile } from 'node:child_process';
import path from 'node:path';

const isWin = process.platform === 'win32';
const BIN = { npm: isWin ? 'npm.cmd' : 'npm', git: 'git' };

function clearScreen() { try { process.stdout.write('\x1b[2J\x1b[3J\x1b[H'); } catch {} }

// --- wrappers ---
function runGit(args = []) {
  return new Promise((resolve, reject) => {
    const p = spawn(BIN.git, args, { stdio: 'inherit', shell: false });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`git ${args.join(' ')} exited ${code}`))));
  });
}
function runNpm(args = []) {
  // En Windows usamos shell:true para evitar EINVAL con npm
  const opts = isWin ? { stdio: 'inherit', shell: true } : { stdio: 'inherit', shell: false };
  return new Promise((resolve, reject) => {
    const p = spawn(BIN.npm, args, opts);
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`npm ${args.join(' ')} exited ${code}`))));
  });
}
function out(cmd, args = []) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { shell: false }, (err, stdout) => err ? reject(err) : resolve(String(stdout || '')));
  });
}
// ---------------

async function safeRm(p) {
  try { if (existsSync(p)) { console.log(`🧹 Removing ${p} ...`); await rm(p, { recursive: true, force: true }); } }
  catch (e) { console.warn(`No se pudo borrar ${p}:`, e?.message || e); }
}
function readPkg() {
  try { return JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'),'utf8')); }
  catch { return { scripts: {} }; }
}
function hasScript(name){ return Boolean(readPkg().scripts?.[name]); }
function hasTsConfig(){ return existsSync(path.join(process.cwd(),'tsconfig.json')); }

async function main(){
  clearScreen();
  const commitMsg = process.argv[2] || process.env.COMMIT_MSG || 'Ajustes';

  console.log('🔧 NIXIN: limpieza + auditoría + lint + typecheck + build + commit/push + dev\n');

  // limpieza
  await safeRm('.next');
  await safeRm('node_modules');

  // install
  const hasLock = existsSync('package-lock.json');
  console.log(`📦 npm ${hasLock ? 'ci' : 'install'} ...`);
  await runNpm([hasLock ? 'ci' : 'install']);

  // audit
  console.log('🩺 npm audit fix ...');
  await runNpm(['audit', 'fix']);

  // lint
  if (hasScript('lint')) { console.log('🧹 npm run lint ...'); await runNpm(['run', 'lint']); }
  else { console.log('🧹 next lint ...'); await runNpm(['exec','next','lint']); }

  // typecheck (si hay TS)
  if (hasTsConfig()) { console.log('🧠 tsc --noEmit ...'); await runNpm(['exec','tsc','--','--noEmit']); }

  // build
  console.log('🏗️  npm run build ...');
  await runNpm(['run','build']);

  // git
  console.log('🔍 git status ...');
  await runGit(['status']);

  const porcelain = (await out('git',['status','--porcelain'])).trim();
  if (porcelain) {
    console.log('➕ git add .'); await runGit(['add','.']);
    const staged = (await out('git',['diff','--cached','--name-only'])).trim();
    if (staged) {
      console.log(`📝 git commit -m "${commitMsg}"`); await runGit(['commit','-m',commitMsg]);
      console.log('🚀 git push -u origin main'); await runGit(['push','-u','origin','main']);
    }
  } else {
    console.log('✅ No hay cambios que commitear.');
  }

  console.log('\n🟢 Iniciando dev server... (Ctrl+C para salir)');
  await runNpm(['run','dev']);
}

main().catch(err => { console.error('\n❌ NIXIN falló:', err?.message || err); process.exit(1); });

/* ─────────────────────────────────────────────────────────
DOC: Script de commits Nixin — scripts/nixin.mjs
QUÉ HACE:
  Script ESM que toma un mensaje de commit y ejecuta la rutina de proyecto:
  instalar deps, lint/build, y hacer commit/push. Soporta:
  `npm run nixin -- "<mensaje>"`  o  `COMMIT_MSG="<mensaje>" npm run nixin`.

API / EXPORTS / RUTA:
  — Entrada: argumentos CLI (process.argv) o env COMMIT_MSG
  — Pasos (típicos):
      1) npm install
      2) npm audit fix (opcional)
      3) next lint
      4) next build
      5) git status && git add .
      6) git commit -m "<mensaje>"
      7) git push -u origin main
      8) (opcional) cls && next dev
  — Mensajería: imprime progreso y errores legibles.

USO (ejemplo completo):
  # Tipo | opcional | valores permitidos | default
  npm run nixin -- "feat: habilitar geolocalización y Stripe"  # string | requerido | — | —
  # Alternativa por env:
  COMMIT_MSG="chore: ajustes SEO" npm run nixin

NOTAS CLAVE:
  — Seguridad: sanitizar el mensaje (comillas); evitar inyección de shell.
  — Idempotencia: si no hay cambios, git commit fallará; manejar caso sin error fatal.
  — Entorno: requiere git remoto configurado; rama principal “main”.

DEPENDENCIAS:
  Node.js (child_process / execa) · git · Next.js CLI
────────────────────────────────────────────────────────── */
