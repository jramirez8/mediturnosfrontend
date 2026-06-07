# Mediturnos Front

Fuente real de componentes UI: `src/components/mediturnos.tsx` y `src/components/AppBottomNav.tsx`.

En v12 se limpió la etapa de parches viejos:

- No usar más `BrandLogoBadge`, `EmptyStateMark`, `MedButton`, `MedInput` ni `ActionButton.styles` sueltos.
- Los estados vacíos y loaders salen de `MtEmptyState` y `MtLoading`.
- Los mensajes inline salen de `MtNotice`.
- La navegación inferior por rol sale de `AppBottomNav`; `MtBottomNav` y `RoleBottomNav` quedan como wrappers para no romper pantallas existentes.
- Fechas y horas locales salen de `src/utils/date.ts`.
- Adjuntos/documentos salen de `src/utils/mediaPicker.ts`.
