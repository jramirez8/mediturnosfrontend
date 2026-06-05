import { RoleGuard } from '../../auth/RoleGuard';

export default function MedicoLayout() {
  return <RoleGuard allowed={['PROFESSIONAL']} />;
}
