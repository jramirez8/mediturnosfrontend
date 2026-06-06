# Mediturnos — Splash, logo adaptable y fix visual de botones

Este ZIP parte del paquete anterior y suma la corrección visual para que el logo `M+` no quede como un cuadrado blanco pegado en fondos oscuros, loaders o estados vacíos.

## Qué trae

- `assets/images/splash-mediturnos.png`: splash vertical listo para Expo.
- `assets/images/icon.png`: ícono cuadrado de la app.
- `assets/images/adaptive-icon.png`: ícono adaptive Android.
- `assets/images/mediturnos-logo.png`: logo transparente para componentes propios.
- `components/BrandLogoBadge.tsx`: badge adaptable para usar el logo en headers, splash y pantallas principales.
- `components/EmptyStateMark.tsx`: marca minimalista `M+` para estados vacíos como “Todavía no hay atenciones”.
- `components/ActionButton.styles.ts`: estilos globales para botones primarios, secundarios, danger y disabled.
- `components/SplashGate.tsx`: splash animado corregido, sin el logo cuadrado blanco duro.
- `snippets/logo-and-buttons-usage.tsx`: ejemplos rápidos de implementación.
- `snippets/app-json-splash-config.json`: configuración para pegar en `app.json` o `app.config.js`.
- `app/_layout.tsx`: ejemplo para Expo Router usando `expo-splash-screen`.

## Regla visual

- Header, splash y pantallas principales: `BrandLogoBadge`.
- Cards vacías, loaders internos y mensajes tipo “Todavía no hay atenciones”: `EmptyStateMark`.
- Botones secundarios claros como `Detalle` y `Agregar al calendario`: fondo lavanda `#F3ECFF`, borde violeta suave y texto violeta fuerte.

## Instalación recomendada

```bash
npx expo install expo-splash-screen expo-linear-gradient
```

Copiá las imágenes a:

```text
assets/images/
```

Copiá los componentes a:

```text
components/
```

## Ejemplo para empty state

```tsx
import EmptyStateMark from "../components/EmptyStateMark";

<EmptyStateMark dark={isDark} size={72} />
<Text>Todavía no hay atenciones</Text>
```

## Ejemplo para logo de header

```tsx
import BrandLogoBadge from "../components/BrandLogoBadge";

<BrandLogoBadge dark={isDark} size={58} />
```

## Ejemplo para botones secundarios

```tsx
import { baseActionButtonStyle, getButtonStyle, getButtonTextStyle } from "../components/ActionButton.styles";

<TouchableOpacity style={[baseActionButtonStyle, getButtonStyle("secondary", isDark)]}>
  <Text style={getButtonTextStyle("secondary", isDark)}>Agregar al calendario</Text>
</TouchableOpacity>
```
