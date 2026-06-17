# Calidad y coverage — Mediturnos Frontend

Proyecto SonarQube Cloud:

- Organización: `jramirez8`
- Project key: `jramirez8_mediturnosfrontend`
- Repositorio: `github.com/jramirez8/mediturnosfrontend`

## Primera instalación local

```powershell
npm install
npm run quality:setup
```

`quality:setup` usa Expo para instalar versiones compatibles de Jest, `jest-expo` y sus tipos.

## Ejecutar calidad local

```powershell
npm run quality
```

O por separado:

```powershell
npm run typecheck
npm run test:coverage
```

Reporte HTML:

```text
coverage/lcov-report/index.html
```

Reporte para Sonar:

```text
coverage/lcov.info
```

## Configuración única en GitHub

1. Entrar al repositorio `mediturnosfrontend`.
2. Ir a **Settings → Secrets and variables → Actions**.
3. Crear un secreto llamado `SONAR_TOKEN` con el token generado en SonarQube Cloud.
4. En SonarQube Cloud, desactivar **Automatic Analysis**. Coverage LCOV necesita análisis por CI.
5. Hacer push a `main` o `master`.

El workflow `.github/workflows/quality.yml`:

1. Instala Node 22 y dependencias.
2. Instala Jest compatible con el SDK de Expo.
3. Ejecuta TypeScript.
4. Ejecuta tests y genera LCOV/HTML.
5. Ejecuta SonarQube Cloud.
6. Falla si quedan alertas abiertas de impacto **High** o **Medium**.
7. Publica el reporte como artifact de GitHub Actions.

## Alcance del coverage

Sonar analiza todo el frontend. El porcentaje de coverage se concentra en lógica pura y reglas que pueden romper flujos: fechas/horarios, permisos del médico, errores del backend, estados de turnos y validación de documentos. Pantallas, navegación, wrappers HTTP y adaptadores nativos se excluyen solo del porcentaje de coverage y continúan bajo análisis estático y typecheck.
