# Fix: login paciente real + dashboard sin crash + logout duro

Problema encontrado:

- El front estaba precargando `admin@mediturnos.local`, pero esa cuenta es ADMIN, no PACIENTE.
- La app mobile es módulo paciente. Si entrás con admin, no hay `pacienteId` real.
- Entonces los endpoints de paciente/turnos pueden fallar porque el token no representa a un paciente.

Cambios:

- Backend seed nuevo:
  - `paciente@mediturnos.local`
  - `Paciente1234`
  - Rol `PATIENT`, activo y verificado.
  - Tiene paciente asociado real, obra social, historia clínica e institución cabecera.

- Front:
  - Login precarga el usuario paciente real, no el admin.
  - La Home no crashea si turnos devuelve 500: muestra aviso y deja cerrar sesión.
  - Si falla perfil, no muestra dashboard ni "Hola Paciente".
  - Logout limpia estado, tokens, caches y claves viejas de localStorage relacionadas con Mediturnos/auth/token.
  - Settings cierra sesión directo, sin Alert que pueda parecer que no hace nada.

Credenciales correctas para probar el módulo paciente:

```txt
paciente@mediturnos.local
Paciente1234
```

La cuenta admin sigue existiendo, pero no debe usarse para probar pantallas de paciente.
