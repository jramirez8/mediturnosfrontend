# Fix turnos UX + cancelacion real

Este parche ataca los 4 puntos marcados:

## 1. Confirmar turno
- `src/app/paciente/solicitar.tsx`
- Ya no depende de `Alert.alert()`.
- Muestra una confirmación visible en pantalla.
- Después del POST valida el turno con GET `/api/turnos/{id}` desde `appointmentService`.
- Agrega botones visibles: `Ver mis turnos` y `Solicitar otro`.

## 2. Reprogramar turno
- `src/app/paciente/reprogramar.tsx`
- Ya no depende de `Alert.alert()`.
- Muestra éxito/error renderizado en pantalla.
- Después del PUT valida el turno con GET `/api/turnos/{id}` y compara la nueva `fechaHora`.

## 3. Cancelar turno
- `src/api/appointmentService.ts`
- Antes usaba `DELETE /api/turnos/{id}`.
- Ahora usa `PUT /api/turnos/{id}/estado` con `{ estado: "CANCELADO" }`.
- Después verifica con GET `/api/turnos/{id}` que el estado haya quedado `CANCELADO`.

- `src/app/paciente/turnos.tsx`
- No usa popup oculto de navegador/app.
- Muestra confirmación inline dentro de la tarjeta.
- Al cancelar, muestra mensaje visible y mueve al usuario a `Historial`.

## 4. Profesional seleccionado desde Ver profesionales
- `src/app/paciente/solicitar.tsx`
- Si viene `professionalId`/`profesionalInstitucionId` por params, el profesional queda:
  - seleccionado
  - primero en la lista horizontal
  - mostrado en una caja grande como “Profesional seleccionado”

## Backend
No se agregó endpoint nuevo. Se usa el endpoint que ya existía:

```txt
PUT /api/turnos/{id}/estado
```

con body:

```json
{ "estado": "CANCELADO" }
```
