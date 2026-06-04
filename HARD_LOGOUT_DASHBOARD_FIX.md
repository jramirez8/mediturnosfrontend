# Fix final: dashboard sin crash + logout duro

Este parche corrige dos problemas que aparecieron al probar sin mocks:

1. **Error 500 en turnos rompía toda la Home**
   - La Home ahora carga primero el perfil real.
   - Si falla el perfil, muestra pantalla honesta y no inventa paciente.
   - Si fallan los turnos, NO crashea ni bloquea el logout. Muestra aviso y deja navegar/cerrar sesión.

2. **Cerrar sesión no era suficientemente agresivo**
   - El logout limpia estado Zustand primero.
   - Borra tokens y datos de sesión conocidos.
   - En Web también barre claves sospechosas de `localStorage` relacionadas con Mediturnos/auth/token/usuario/paciente.
   - Settings ya no usa Alert de confirmación: el botón sale directo para evitar que parezca que no hace nada.

Importante: si `/api/turnos/paciente/me` o `/api/turnos/paciente/{id}` devuelve 500, eso sigue siendo backend. Este parche evita que el front se caiga y permite cerrar sesión/ver el error sin humo.
