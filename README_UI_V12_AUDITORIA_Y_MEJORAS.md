# Mediturnos Front v12

Cambios aplicados sobre el v11 real:

- Panel médico de disponibilidad rehacerlo más operativo: calendario por estados, cupos visibles, horarios semanales editables, bloqueos por franja y validaciones de hora/duración.
- Navegación inferior unificada con `AppBottomNav`; paciente, médico, secretaría y admin usan la misma lógica visual.
- `settings.tsx` global ahora muestra barra inferior según el rol logueado, así no queda como callejón sin salida.
- Fechas locales centralizadas en `src/utils/date.ts` para evitar bugs por UTC en Argentina.
- Login: inputs con un solo fondo interno para evitar el efecto de doble color.
- Documentos centralizados en `src/utils/mediaPicker.ts`: PDF/JPG/PNG hasta 1 MB para Historia y Solicitud de turno.
- Reportes admin: exportación CSV real del filtro aplicado.
- Auditoría: cuando el backend no informa actor, la UI muestra “actor no informado por backend” en vez de taparlo como “sistema”.
- Limpieza de componentes/parches muertos: se removieron duplicados viejos fuera de `src` y componentes no usados.

Pendientes de backend para seguridad real:

- Validar ownership por JWT en turnos/consultas/documentos.
- Auditar actor desde JWT, no desde headers del front.
- Exponer `/api/profesionales/me` con `profesionalId`, `profesionalInstitucionId`, `especialidadId` e `institucionId`.
- Soportar edición de horarios con `PUT /api/agenda/horarios/:id` si todavía no existe.
