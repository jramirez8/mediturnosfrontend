# Mediturnos — demo interactiva

Versión demostrativa del sistema de gestión de turnos médicos. Funciona íntegramente en el navegador, con datos ficticios y sin depender del backend histórico de Railway.

## Acceso rápido

En la pantalla inicial se puede elegir cualquiera de los cuatro perfiles. Todos usan la contraseña `Demo1234`.

| Perfil | Usuario |
| --- | --- |
| Administrador | `admin@demo.mediturnos.net.ar` |
| Secretaría | `secretaria@demo.mediturnos.net.ar` |
| Profesional | `profesional@demo.mediturnos.net.ar` |
| Paciente | `paciente@demo.mediturnos.net.ar` |

La aplicación muestra una banda permanente que identifica el entorno como demo. Ningún dato ingresado es real ni se conserva al recargar la página.

## Qué se puede recorrer

- Inicio de sesión y navegación diferenciada por rol.
- Tableros de administrador, secretaría, profesional y paciente.
- Agenda, disponibilidad, alta y reprogramación de turnos.
- Pacientes, profesionales, especialidades, obras sociales e instituciones.
- Bloqueos de agenda, historial, atención, feedback y documentos.
- Indicadores administrativos y diagnóstico del sistema.

Las operaciones de alta, edición y cambio de estado se resuelven sobre una API simulada en memoria para que los flujos sean clickeables durante una presentación.

## Desarrollo

```bash
npm ci
npm run web
```

Para generar el sitio estático:

```bash
npx expo export -p web
```

Vercel publica el contenido de `dist` y mantiene el enrutamiento de la SPA.

## Volver a conectar un backend

El modo demo está activo salvo que se indique expresamente lo contrario. Para utilizar una API real:

```bash
EXPO_PUBLIC_DEMO_MODE=false
EXPO_PUBLIC_API_URL=https://api.ejemplo.com
```

Antes de pasar a producción también deberán incorporarse persistencia, autenticación real, recuperación de contraseña, correo/transacciones, controles de permisos, auditoría, backups y tratamiento de datos sensibles acorde a la normativa aplicable.
