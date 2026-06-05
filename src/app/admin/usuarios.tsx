import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { MtButton, MtCard, MtEmptyState, MtHeader, MtInput, MtLoading, MtPill, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { adminService, AdminUsuario } from '../../api/adminService';
import { useMtTheme } from '../../theme/themeStore';
import { humanRole, normalizeRole } from '../../auth/roles';

export default function AdminUsuariosScreen() {
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const theme = useMtTheme();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setUsuarios(await adminService.usuarios()); }
    catch (e: any) { setError(e?.response?.data?.message || e?.message || 'No pudimos cargar usuarios.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return usuarios.filter((u) => !q || `${u.email} ${u.rol} ${humanRole(u.rol)} ${u.nombreCompleto}`.toLowerCase().includes(q));
  }, [usuarios, query]);

  const disable = async (user: AdminUsuario) => {
    setWorkingId(user.id); setError(null); setMessage(null);
    try {
      await adminService.desactivarUsuario(user.id);
      setMessage(`Usuario ${user.email} desactivado.`);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'No pudimos desactivar el usuario.');
    } finally { setWorkingId(null); }
  };

  if (loading) return <MtLoading text="Cargando usuarios..." />;

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="ADMIN" title="Usuarios" subtitle="Listado real desde /api/admin/usuarios." />
      {message ? <MtCard style={{ borderColor: theme.colors.success, marginBottom: 14 }}><Text style={{ color: theme.colors.success, fontWeight: '900' }}>{message}</Text></MtCard> : null}
      {error ? <MtCard style={{ borderColor: theme.colors.danger, marginBottom: 14 }}><Text style={{ color: theme.colors.danger, fontWeight: '900' }}>{error}</Text></MtCard> : null}
      <MtCard style={{ marginBottom: 14 }}><MtInput label="Buscar" value={query} onChangeText={setQuery} placeholder="email, rol, nombre..." /></MtCard>
      {filtered.length ? filtered.map((u) => (
        <MtCard key={u.id} style={{ marginBottom: 12 }}>
          <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 16 }}>{u.email}</Text>
          <Text style={{ color: theme.colors.muted, marginTop: 4 }}>{u.nombreCompleto || 'Sin persona asociada'}</Text>
          <MtPill label={humanRole(u.rol)} tone={normalizeRole(u.rol) === 'ADMIN' ? 'danger' : normalizeRole(u.rol) === 'PROFESSIONAL' ? 'primary' : normalizeRole(u.rol) === 'SECRETARY' ? 'warning' : 'success'} selected />
          <Text style={{ color: u.activo === false ? theme.colors.danger : theme.colors.success, marginTop: 8, fontWeight: '900' }}>{u.activo === false ? 'Inactivo' : 'Activo'}</Text>
          <MtButton title={workingId === u.id ? 'Desactivando...' : 'Desactivar'} variant="danger" onPress={() => disable(u)} disabled={workingId === u.id || u.activo === false} style={{ marginTop: 12 }} />
        </MtCard>
      )) : <MtEmptyState title="Sin usuarios" subtitle="No hay resultados para el filtro." />}
      <RoleBottomNav role="admin" active="usuarios" />
    </MtScreen>
  );
}
