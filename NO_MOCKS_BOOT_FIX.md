# Fix: arranque sin mocks y dashboard honesto

Problema detectado:

- La home mostraba `Hola, Paciente` aunque el perfil real fallara.
- Si `/api/pacientes/perfil/...` devolvía 500, el `finally` apagaba el loading y la pantalla seguía con datos nulos.
- Versiones viejas podían dejar cache demo en `localStorage`.
- El endpoint backend `/api/pacientes/usuario/{usuarioId}` devolvía la entidad `Paciente`, peligroso por serialización JPA; el mobile solo necesitaba IDs.

Cambios:

- Home paciente ahora usa `Promise.allSettled` y guarda errores por endpoint.
- Si falla perfil, no renderiza dashboard ni saludo inventado.
- Muestra una pantalla de error honesta con Reintentar / Limpiar sesión.
- Cache cambió a prefijo `mediturnos-real-cache-v3:` y borra caches legacy.
- Backend `/api/pacientes/usuario/{usuarioId}` ahora devuelve `{ id, pacienteId, usuarioId }` en lugar de entidad JPA.

Para limpiar el navegador si venís de builds anteriores:

```js
localStorage.clear()
```

Luego reiniciar Expo con cache limpia:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
npx expo start --lan -c
```
