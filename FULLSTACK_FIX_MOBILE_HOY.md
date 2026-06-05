# Mediturnos mobile - fixes de hoy

Cambios aplicados:

- Login manda `{ identificador, email, password }` para calzar con el backend real.
- Login acepta `token`, `accessToken` o `jwt`; si el backend viejo no devolviera token, no rompe la navegación.
- Forgot password manda `{ identificador }`, no `{ emailOrDni }`.
- Si el backend devuelve `resetToken` en modo demo, la app navega directo a `/reset-password`.
- Nueva pantalla `/reset-password` para cargar token y nueva contraseña.
- Error de Network Error ahora avisa posible CORS si se prueba en web.

Flujo probado conceptualmente:

1. Login con `paciente@mediturnos.local / Paciente1234`.
2. Recuperar contraseña con email o DNI.
3. Si Brevo está configurado: llega correo. Si no: modo demo devuelve token y deja continuar.
4. Reset password actualiza contraseña.
