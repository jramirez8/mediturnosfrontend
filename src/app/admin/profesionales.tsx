import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { MtCard, MtEmptyState, MtHeader, MtInput, MtLoading, MtPill, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { adminService, AdminPersona } from '../../api/adminService';
import { useMtTheme } from '../../theme/themeStore';

export default function AdminProfesionalesScreen() {
  const [items, setItems] = useState<AdminPersona[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useMtTheme();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setItems(await adminService.profesionales()); }
    catch (e: any) { setError(e?.response?.data?.message || e?.message || 'No pudimos cargar profesionales.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items.filter((p) => !q || JSON.stringify(p).toLowerCase().includes(q));
  }, [items, query]);

  if (loading) return <MtLoading text="Cargando profesionales..." />;

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="ADMIN" title="Profesionales" subtitle="Catálogo de médicos/profesionales registrados." />
      {error ? <MtCard style={{ borderColor: theme.colors.danger, marginBottom: 14 }}><Text style={{ color: theme.colors.danger, fontWeight: '900' }}>{error}</Text></MtCard> : null}
      <MtCard style={{ marginBottom: 14 }}><MtInput label="Buscar" value={query} onChangeText={setQuery} placeholder="nombre, matrícula, especialidad..." /></MtCard>
      {filtered.length ? filtered.map((p, i) => (
        <MtCard key={p.id ?? i} style={{ marginBottom: 12 }}>
          <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 16 }}>{p.apellido}, {p.nombre}</Text>
          <Text style={{ color: theme.colors.muted, marginTop: 4 }}>Email: {p.email || p.usuarioEmail || 'No informado'}</Text>
          <Text style={{ color: theme.colors.muted }}>DNI: {p.dni || 'No informado'} · Matrícula: {p.matricula || 'No informada'}</Text>
          <Text style={{ color: theme.colors.muted }}>Tel: {p.telefono || 'No informado'}</Text>
          <MtPill label={p.activo === false ? 'INACTIVO' : 'ACTIVO'} tone={p.activo === false ? 'danger' : 'success'} selected />
        </MtCard>
      )) : <MtEmptyState title="Sin profesionales" subtitle="No hay resultados." />}
      <RoleBottomNav role="admin" active="profesionales" />
    </MtScreen>
  );
}
