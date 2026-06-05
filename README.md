# Mediturnos Mobile — Expo / React Native

App mobile para solicitar turnos médicos, consultar profesionales, administrar perfil e historia clínica.

## Qué trae esta versión

- Expo Router con rutas dentro de `src/app`.
- Login contra backend Railway con JWT.
- Token en `expo-secure-store`.
- Cache local con `expo-sqlite` para profesionales, perfil, turnos e historia clínica.
- Fallback demo/cache para que la app no quede en blanco si Railway tarda o no hay internet.
- Pantallas principales pulidas: login, home paciente, profesionales, solicitar turno, mis turnos, perfil e historia clínica.
- Componentes reutilizables en `src/components/mediturnos.tsx`.
- Tema centralizado en `src/constants/mediturnosTheme.ts`.

## Comandos

```bash
npm install
npm run start:lan
```

Si estás en una red complicada:

```bash
npm run start:tunnel
```

## Credenciales seed usadas para demo

```txt
paciente@mediturnos.local
Paciente1234
```

## Backend

La URL está en:

```txt
src/api/client.ts
```

Actualmente apunta a:

```txt
https://mediturnosbackend-production.up.railway.app
```

## Estructura importante

```txt
src/app/                 Pantallas y rutas de Expo Router
src/api/                 Cliente HTTP y servicios
src/auth/                Estado de autenticación
src/components/          Componentes reutilizables
src/db/cache.ts          Cache SQLite key-value
src/constants/           Theme visual
src/data/demoData.ts     Datos fallback para defensa/demo
```
