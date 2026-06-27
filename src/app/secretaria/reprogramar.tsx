import { RoleBottomNav } from '../../components/RoleBottomNav';
import { ReprogramarTurnoScreen } from '../../components/reprogramar-turno-screen';

export default function ReprogramarScreen() {
  return (
    <ReprogramarTurnoScreen
      eyebrow="SECRETARIA"
      backTitle="Ver turnos"
      backPath="/secretaria/turnos"
      navigation={<RoleBottomNav role="secretaria" active="turnos" />}
    />
  );
}
