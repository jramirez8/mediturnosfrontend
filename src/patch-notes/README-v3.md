# Mediturnos UI fixes v3

Este ZIP parte del anterior y agrega parches para los puntos marcados en las capturas.

## Login
Archivo: `screens/LoginScreen.fixed.tsx`

Cambios:
- Banner/logo integrado con pill glass, sin cartulina blanca.
- Removidos los íconos raros de los inputs.
- Inputs lavanda/glass en vez de full blanco.
- Password con botón de ojito abierto/cerrado.
- Página recortada: termina debajo de `Crear cuenta`.
- Misma familia/tamaño visual para `Ingresar`, `Ingresar con biometría / PIN` y `Crear cuenta`.

## Ajustes
Cambio solicitado: sacar logo.

En tu pantalla de Ajustes buscá el header/top right y borrá el componente del logo:

```tsx
// borrar algo de este estilo:
<BrandLogoBadge />
<Image source={require("../assets/images/mediturnos-logo.png")} />
```

El header de Ajustes queda solo con kicker + título + subtítulo.

## Logo blanco en empty states
Usar `components/BrandMark.tsx` en lugar del PNG blanco.

Reemplazar:

```tsx
<Image source={require("../assets/images/mediturnos-logo.png")} />
```

por:

```tsx
<BrandMark dark size={56} compact />
```

Esto aplica a Atenciones, Documentos, Cargando y cualquier empty state.

## Detalle de turno
Archivo: `screens/AppointmentDetailScreen.fixed.tsx`

Actualiza la pantalla vieja al look actual: header violeta redondeado, card del profesional, cards glass y botones con la estética nueva.

## Documentos
Archivo: `screens/DocumentsScreen.fixed.tsx`

Implementa carga local de documentos:
- PDF/JPG/JPEG/PNG.
- Máximo 1 MB.
- Desplegable con: Receta, Carnet, DNI, Poder, Estudio, Orden médica, Otros.
- Lista local de adjuntos.

Instalar dependencias:

```bash
npx expo install expo-document-picker expo-image-picker
```

Después se puede conectar esta pantalla al backend cuando tengas endpoint de subida.
