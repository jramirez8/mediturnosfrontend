# Fixes refactor final - Mediturnos Mobile

Cambios aplicados:

1. Reprogramación de turnos
   - El frontend ya no manda solamente `{ fecha, hora }`.
   - Ahora manda el payload que espera el backend Spring Boot:
     - `profesionalId`
     - `profesionalInstitucionId`
     - `especialidadId`
     - `fechaHora` en formato `YYYY-MM-DDTHH:mm`
   - La pantalla usa `turno.profesionalInstitucionId` para buscar disponibilidad real.

2. Solicitud de turnos
   - La lista kilométrica de horarios fue reemplazada por dos desplegables:
     - Fecha
     - Horario
   - También se manda `pacienteId`, `profesionalId`, `profesionalInstitucionId`, `especialidadId` y `fechaHora`.

3. Cierre de sesión
   - `logout()` ahora limpia primero el estado global y después intenta limpiar storage/cache.
   - Esto evita que una falla de storage deje al usuario adentro.

4. Settings visible
   - Nueva pantalla: `/paciente/settings`.
   - Incluye:
     - Modo oscuro
     - Seguir sistema
     - Idioma Español/Inglés
     - Cerrar sesión
   - Se agregó acceso desde Home y desde Perfil.

5. Modo oscuro más real
   - Se adaptaron Solicitar, Reprogramar y Turnos para usar `useMtTheme()` en vez de colores fijos.

6. Normalización de turnos
   - `appointmentService` ahora entiende respuestas del backend con `fechaHora`.
   - También guarda IDs críticos del turno para reprogramar.
