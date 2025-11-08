// scripts/dev-tenant.js
const fs = require("fs");
const { spawn } = require("child_process");

const tenant = process.argv[2];
const port = process.argv[3] || "3000";
const mode = process.argv[4] === "start" ? "start" : "dev";

if (!tenant) {
  console.error('Falta argumento tenant. Ej: node scripts/dev-tenant.js NIXINX 3001');
  process.exit(1);
}

const envFile = `.env.${tenant}.local`;

if (!fs.existsSync(envFile)) {
  console.error(`No existe ${envFile}`);
  process.exit(1);
}

// Cargar variables desde .env.<tenant>.local en process.env (sin tocar .env.local)
const lines = fs.readFileSync(envFile, "utf8").split("\n");
for (const raw of lines) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  const idx = line.indexOf("=");
  if (idx === -1) continue;

  const key = line.slice(0, idx).trim();
  let value = line.slice(idx + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  if (key) process.env[key] = value;
}

console.log(`Using ${envFile} for tenant ${tenant} on port ${port} (${mode})`);

// Ruta absoluta al CLI de Next dentro de node_modules
let nextCli;
try {
  nextCli = require.resolve("next/dist/bin/next");
} catch (e) {
  console.error(
    'No se encontró "next". Asegúrate de haber corrido "npm install".'
  );
  process.exit(1);
}

// Ejecutar: node node_modules/next/dist/bin/next dev -p <port>
const child = spawn(process.execPath, [nextCli, mode, "-p", port], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
