# Fix bootloop SecureStore

Error visto:

```txt
ExpoSecureStore.default.getValueWithKeyAsync is not a function
```

Causa probable: Expo Go / paquete `expo-secure-store` / versión de SDK desincronizados. El JS llama a una función nativa que no existe en la app Expo Go instalada.

Cambio aplicado:

- `src/api/storage.ts` ahora es defensivo.
- Intenta usar `expo-secure-store`.
- Si SecureStore falla, usa fallback en memoria y evita el bootloop.

Limitación del fallback:

- Si SecureStore está roto, el token dura mientras la app esté abierta.
- Si cerrás/reiniciás la app, hay que loguearse de nuevo.

Solución definitiva recomendada luego de la demo:

```bash
npx expo install expo-secure-store
npx expo start -c
```

Y actualizar Expo Go en el celular. Si sigue igual, crear un development build con EAS.
