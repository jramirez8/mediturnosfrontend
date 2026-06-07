MEDITURNOS UI V7 - cambios reales aplicados

Aplicado sobre el proyecto corregido v6.

Cambios:
1) Navegación completa:
   - Mi historia ahora tiene la barra inferior con los 5 accesos: Inicio, Perfil, +, Turnos, Historia.
   - Detalle de historia y Feedback también quedan con barra inferior.
   - Detalle de turno usa vuelta segura: si no hay stack para volver, vuelve a Mis turnos en lugar de cerrar la app.

2) Mi historia:
   - Rehecha usando el tema global de Mediturnos.
   - Ya no queda clavada en modo oscuro.
   - Mantiene Documentos funcional: PDF/JPG/PNG hasta 1 MB y selector de tipo.
   - Se eliminó definitivamente el logo blanco cuadrado de estados vacíos.

3) Login:
   - Campos DNI/email y contraseña con un solo fondo lavanda integrado.
   - Se elimina el efecto de “dos colores” dentro de los inputs.
   - Mantiene ojo abierto/cerrado para contraseña.

4) Detalle de turno:
   - Evita cortes feos como Ja-vie-r o Car-dio-logía.
   - Nombre y especialidad usan una línea con ellipsis en vez de partir palabras.
   - Agregar al calendario usa botón sólido integrado.

5) Mis turnos:
   - Evita Cardiolog-ía y cortes por columna estrecha.
   - Estado separado del nombre/profesional.
   - Botones Detalle y Agregar al calendario con fondo integrado.
   - Agregar al calendario queda en botón ancho para que no se rompa.

Instalación rápida:
- Opción parche: copiar el contenido del ZIP de parche dentro de mediturnosfrontend pisando archivos.
- Opción proyecto completo: abrir el ZIP completo y correr:

npm install
npm run start:lan

Si Expo muestra pantallas viejas:
npx expo start --lan -c
