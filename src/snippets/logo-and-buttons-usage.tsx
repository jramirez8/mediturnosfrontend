// Header / esquina superior: usar el logo integrado, no la imagen cuadrada suelta.

// Estados vacíos / cargando dentro de cards: usar marca minimalista.
<EmptyStateMark dark={isDark} size={72} />

// Botones secundarios como Detalle / Agregar al calendario:
import { baseActionButtonStyle, getButtonStyle, getButtonTextStyle } from "../components/ActionButton.styles";

<TouchableOpacity style={[baseActionButtonStyle, getButtonStyle("secondary", isDark)]}>
  <Text style={getButtonTextStyle("secondary", isDark)}>Detalle</Text>
</TouchableOpacity>
