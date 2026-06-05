import { RoleGuard } from '../../auth/RoleGuard';

export default function AdminLayout() {
  return <RoleGuard allowed={['ADMIN']} />;
}
