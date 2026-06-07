Mediturnos UI v9 - Seguridad médico + disponibilidad

Cambios aplicados:

1) Seguridad de atención por médico
- El front ahora guarda profesionalInstitucionId si el login lo devuelve.
- La agenda del médico filtra turnos ajenos al médico logueado.
- La pantalla de consulta bloquea la atención si el turno no pertenece al médico logueado.
- Si el backend trae turnos de otros médicos, se ocultan y se muestra aviso.

Archivos tocados:
- src/auth/authStore.ts
- src/utils/deviceAuth.ts
- src/utils/doctorAccess.ts
- src/app/medico/index.tsx
- src/app/medico/agenda.tsx
- src/app/medico/consulta.tsx

IMPORTANTE:
Esto tapa el agujero desde el frontend, pero el backend también debería validar con JWT que un médico no pueda guardar consulta o cambiar estado de un turno ajeno.

2) Disponibilidad médica
- Nueva pantalla: src/app/medico/disponibilidad.tsx
- Nueva opción en barra inferior del médico: Disponibilidad.
- El médico puede marcar días de atención desde un calendario.
- El médico puede bloquear una fecha puntual.
- Usa la API existente /api/agenda/horarios y /api/agenda/bloqueos.
- Los pacientes ya consumen /api/turnos/disponibilidad en Solicitar turno, así que al configurar horarios deberían ver esos días disponibles.

3) Cache
- Al crear/eliminar horarios o bloqueos se limpia cache local para evitar ver disponibilidad vieja.

Comandos:
npm install
npx expo start --lan -c
