# Entrega rápida — Mediturnos Mobile elevado

## Cambios grandes aplicados

1. Branding visual más sobrio y médico: teal/verde, cards blancas, bordes suaves y sombras.
2. Login rediseñado y listo para demo con credenciales seed precargadas.
3. Home paciente convertido en dashboard real con estadísticas, próximo turno y accesos rápidos.
4. Servicio HTTP con interceptor JWT y errores más claros.
5. AuthStore más robusto: token, usuarioId, pacienteId, role y limpieza de cache en logout.
6. Cache local SQLite key-value en `src/db/cache.ts`.
7. Fallback demo/cache para que la app no quede en blanco si falla Railway.
8. `professionalService` normaliza respuestas del backend y cachea cartilla/especialidades.
9. `appointmentService` cachea turnos y disponibilidad, y mantiene alias `requestAppointment`.
10. `userService` acepta `usuarioId` opcional y mantiene compatibilidad con pantallas viejas.
11. Pantalla de profesionales completamente mejorada con búsqueda, chips y cards.
12. Pantalla de solicitar turno rehacida por pasos: profesional, horario, motivo y resumen.
13. Pantalla de mis turnos rehacida con tabs: próximos, historial y todos.
14. Pantalla de perfil rehacida con formulario editable y datos de historia clínica.
15. Pantalla de historia clínica rehacida con tabs de atenciones, resumen y documentos.
16. Componentes reutilizables en `src/components/mediturnos.tsx`.
17. Theme centralizado en `src/constants/mediturnosTheme.ts`.
18. Datos demo en `src/data/demoData.ts` para defensa sin depender 100% de internet.
19. Scripts útiles: `start:lan`, `start:tunnel`, `typecheck`, `android:lan`.
20. README reemplazado con instrucciones reales del proyecto.

## Cómo correr

```bash
npm install
npm run start:lan
```

Si no conecta por LAN:

```bash
npm run start:tunnel
```

## Credenciales demo

```txt
admin@mediturnos.local
Admin1234
```

## Archivos principales tocados

```txt
src/app/login.tsx
src/app/paciente/index.tsx
src/app/paciente/home.tsx
src/app/paciente/profesionales.tsx
src/app/paciente/solicitar.tsx
src/app/paciente/turnos.tsx
src/app/paciente/perfil.tsx
src/app/paciente/historia.tsx
src/api/client.ts
src/api/appointmentService.ts
src/api/professionalService.ts
src/api/userService.ts
src/api/medicalHistoryService.ts
src/auth/authStore.ts
src/db/cache.ts
src/components/mediturnos.tsx
src/constants/mediturnosTheme.ts
src/data/demoData.ts
```
