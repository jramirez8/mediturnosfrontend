# Fix aplicado: pantalla negra / expo-sqlite wasm

El proyecto crasheaba en el bundling con:

`Unable to resolve module ./wa-sqlite/wa-sqlite.wasm from expo-sqlite/web/worker.ts`

Causa: `src/db/cache.ts` importaba `expo-sqlite` de forma estática. Expo Router/Web intenta empaquetar también la versión web de `expo-sqlite`, que en esta instalación no trae/resuelve bien el `.wasm`.

Solución de emergencia para la entrega:

- Se removió el import estático de `expo-sqlite`.
- La cache ahora usa memoria y `localStorage` en web.
- La app arranca sin depender de SQLite.

Después de la entrega, si queremos SQLite real, conviene hacerlo con Development Build/EAS o con archivos `cache.native.ts` / `cache.web.ts`.
