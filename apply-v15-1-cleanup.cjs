const fs = require('fs');
const path = require('path');

const obsolete = [
  'src/components/animated-icon.tsx',
  'src/components/animated-icon.web.tsx',
  'src/components/animated-icon.module.css',
  'src/components/app-tabs.tsx',
  'src/components/app-tabs.web.tsx',
  'src/components/external-link.tsx',
  'src/components/hint-row.tsx',
  'src/components/themed-text.tsx',
  'src/components/themed-view.tsx',
  'src/components/ui/collapsible.tsx',
  'src/components/web-badge.tsx',
  'src/constants/theme.ts',
  'src/hooks/use-theme.ts',
  'src/global.css',
];

for (const relative of obsolete) {
  const absolute = path.join(process.cwd(), relative);
  if (fs.existsSync(absolute)) {
    fs.rmSync(absolute, { force: true });
    console.log(`Eliminado: ${relative}`);
  }
}

console.log('Limpieza v15.1 terminada. Ejecutá npm install y luego npm run quality.');
