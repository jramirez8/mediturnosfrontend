Mediturnos UI fixes v6

Cambios aplicados sobre el proyecto real:
- Login: TextInput con fondo interno transparente, sin rectángulo blanco dentro del campo; campos lavanda; ojito password; textos de botones igualados.
- Fondo global: eliminado el watermark M+ gigante que se metía detrás del bottom nav.
- Botones globales: texto centrado, fondo transparente y ajuste de tamaño para evitar cajas negras/blancas detrás del texto y cortes horribles.
- Mis turnos: card rearmada para que especialidad, profesional y sede no se aplasten por el estado; botones más cortos y legibles.
- Detalle de turno: hero card rearmada para que Javier Lopez/Cardiología no queden letra por letra; botón calendario pasa a secundario.
- Historia clínica: tabs achicados para que Atenciones/Resumen/Documentos no se partan; empty state con texto menos gigante.

Arranque recomendado:
npm install
npx expo start --lan -c
