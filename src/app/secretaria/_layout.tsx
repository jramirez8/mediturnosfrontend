import { RoleGuard } from '../../auth/RoleGuard';

export default function SecretariaLayout() {
  return <RoleGuard allowed={['SECRETARY']} />;
}
