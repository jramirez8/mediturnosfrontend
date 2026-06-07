# Exportar APK de Mediturnos

Este proyecto ya quedó preparado para compilar una APK instalable con EAS Build.

## Una sola vez

```bash
npm install
npm install -g eas-cli
eas login
eas build:configure
```

Cuando EAS pregunte por el proyecto, aceptá crear/vincular el proyecto de Expo.
Cuando pregunte por credenciales Android/keystore, elegí que Expo las administre automáticamente.

## Generar APK instalable

```bash
npm run build:android:apk
```

Es equivalente a:

```bash
eas build --platform android --profile preview
```

Cuando termine, EAS te da un link para descargar el `.apk`.

## Generar AAB para Play Store

```bash
npm run build:android:aab
```

## Datos configurados

- Android package: `com.mediturnos.app`
- Perfil APK: `preview`
- Perfil Play Store/AAB: `production`
- Archivo de configuración: `eas.json`
