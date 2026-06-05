# Login visible errors + hard logout fix

Este parche corrige dos recortes peligrosos:

1. El login dependía de `Alert.alert()` para avisar errores. En Expo Web eso puede no verse o quedar tapado por el overlay, así que ahora el error queda renderizado en pantalla.
2. Logout ahora usa limpieza fuerte de storage/memoria/sessionStorage y navegación dura a `/login` en Web.

También se agregó `debugErrorPayload()` para mostrar método, endpoint y status HTTP en pantalla y consola.

Resultado: si el backend no loguea, la app ya no queda muda. Muestra el error real.
