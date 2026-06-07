# Mediturnos v11 - ajustes panel médico, scroll y auditoría

Cambios incluidos:

- Panel médico / Mi disponibilidad:
  - Deja de parecer un calendario inventado: ahora separa claramente plan semanal, bloqueos puntuales y cupos visibles para pacientes.
  - Calendario mensual calcula disponibilidad desde horarios semanales + bloqueos reales.
  - Lista de horarios y bloqueos con formato legible, sin fechas ISO larguísimas.
  - Agrega sección "Cupos que verá el paciente" consumiendo `/api/turnos/disponibilidad`.

- Secretaría / Gestión de turnos:
  - Al confirmar, cancelar o marcar ausente, la pantalla sube automáticamente al mensaje de confirmación/error.

- Secretaría / Nuevo turno:
  - Al crear un turno, la pantalla sube automáticamente al mensaje verde.

- Admin / Usuarios:
  - Al tocar editar, crear, guardar, activar o desactivar, sube automáticamente al formulario/mensaje.

- Auditoría:
  - Todas las llamadas HTTP autenticadas agregan headers de actor:
    - `X-Mediturnos-Actor-Id`
    - `X-Mediturnos-Actor-Role`
    - `X-Mediturnos-Actor-Name`
  - El JWT sigue siendo la fuente segura. Si el backend todavía guarda algunas acciones como "sistema", hay que leer estos headers o extraer el usuario desde el JWT del lado backend.

Archivos modificados:
- src/components/mediturnos.tsx
- src/api/client.ts
- src/app/medico/disponibilidad.tsx
- src/app/secretaria/nuevo-turno.tsx
- src/app/secretaria/turnos.tsx
- src/app/admin/usuarios.tsx
