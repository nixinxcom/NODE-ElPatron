import fs from 'fs';
import path from 'path';

function copyModuleCSS(dir, base = dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      copyModuleCSS(fullPath, base); // recursivo
    }

    if (entry.isFile() && entry.name.endsWith('.module.css')) {
      const relative = path.relative(base, fullPath);
      const destPath = path.join('dist', base, relative);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(fullPath, destPath);
      console.log(`✅ Copiado módulo: ${fullPath} → ${destPath}`);
    }
  });
}

function copyGlobalsCSS() {
  const src = 'app/globals.css';
  const dest = 'dist/app/globals.css';

  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`✅ Copiado globals.css: ${src} → ${dest}`);
  } else {
    console.warn(`⚠️  globals.css no encontrado en ${src}`);
  }
}

// Ejecutar ambos
if (fs.existsSync('complements')) {
  copyModuleCSS('complements');
}
copyGlobalsCSS();
