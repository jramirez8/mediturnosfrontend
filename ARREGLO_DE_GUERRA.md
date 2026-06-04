# Mediturnos Mobile - Arreglo de guerra

Esta versión prioriza que la app arranque en Expo Go sin bootloops.

## Qué se apagó temporalmente

- `expo-secure-store`: daba `getValueWithKeyAsync is not a function` en Expo Go desincronizado.
- `expo-sqlite`: estaba rompiendo el bundle web/Metro intentando resolver `wa-sqlite.wasm`.
- rutas/components del template que importaban `expo-image` / `expo-symbols`.

## Qué sigue andando

- Login contra Railway.
- Navegación Expo Router.
- Home paciente.
- Profesionales.
- Solicitar turno.
- Mis turnos.
- Perfil.
- Historia clínica.
- Fallback demo/cache en memoria si Railway cae.

## Cómo correr

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
npm install
npx expo start --lan -c
```

Si estás en red rara, usá hotspot del celular y conectá la PC a ese WiFi.

## Importante

En esta versión el token persiste durante la sesión. Si cerrás completamente Expo Go, hay que loguear de nuevo. Para demo y defensa es preferible eso antes que bootloop.
