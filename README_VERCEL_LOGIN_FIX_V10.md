# Mediturnos v10 - Fix login en Vercel

## Qué se corrigió

El login en Vercel podía fallar con:

> No pudimos conectarnos con el servicio

En navegador eso suele aparecer como `Network Error` cuando el frontend intenta pegarle directo al backend de Railway y el browser bloquea la respuesta por CORS.

## Cambio aplicado

### `src/api/client.ts`

- Android/iOS y desarrollo local: siguen usando directo:
  `https://mediturnosbackend-production.up.railway.app`
- Vercel Web: usa URLs relativas:
  `/api/auth/login`, `/api/turnos`, etc.

### `vercel.json`

Agrega proxy/rewrite:

- `/api/*` -> Railway `/api/*`
- `/uploads/*` -> Railway `/uploads/*`
- `/files/*` -> Railway `/files/*`
- `/:path*` -> `/` para mantener Expo Router funcionando como SPA.

## Cómo desplegar

1. Pisá estos archivos en el proyecto.
2. Commit y push a GitHub.
3. Vercel redeploy automático.
4. En Vercel, probá login de nuevo.

## Si seguís usando dominio custom

Si tu dominio no termina en `.vercel.app` y querés forzar proxy, agregá en Vercel:

```env
EXPO_PUBLIC_API_MODE=proxy
```

Si querés forzar llamada directa al backend:

```env
EXPO_PUBLIC_API_MODE=direct
```

También podés cambiar el backend con:

```env
EXPO_PUBLIC_API_BASE_URL=https://tu-backend.com
```
