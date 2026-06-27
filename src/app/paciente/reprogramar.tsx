import { MtBottomNav } from '../../components/mediturnos';
import { ReprogramarTurnoScreen } from '../../components/reprogramar-turno-screen';

export default function ReprogramarScreen() {
  return (
    <ReprogramarTurnoScreen
      eyebrow="AGENDA"
      backTitle="Ver mis turnos"
      backPath="/paciente/turnos"
      navigation={<MtBottomNav active="turnos" />}
    />
  );
}
