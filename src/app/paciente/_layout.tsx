import { RoleGuard } from '../../auth/RoleGuard';

export default function PacienteLayout() {
  return <RoleGuard allowed={['PATIENT']} />;
}
