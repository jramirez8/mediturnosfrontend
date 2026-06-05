import React, { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { MtCard, MtEmptyState, MtHeader, MtLoading, MtPill, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { adminService } from '../../api/adminService';
import { useMtTheme } from '../../theme/themeStore';

export default function AdminCatalogosScreen() {
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [obras, setObras] = useState<any[]>([]);
  const [instituciones, setInstituciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useMtTheme();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [e, o, i] = await Promise.all([adminService.especialidades(), adminService.obrasSociales(), adminService.instituciones()]);
      setEspecialidades(e); setObras(o); setInstituciones(i);
    } catch (e: any) { setError(e?.response?.data?.message || e?.message || 'No pudimos cargar catálogos.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  if (loading) return <MtLoading text="Cargando catálogos..." />;

  const Section = ({ title, items }: { title: string; items: any[] }) => (
    <MtCard style={{ marginBottom: 14 }}>
      <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18, marginBottom: 12 }}>{title} ({items.length})</Text>
      {items.length ? items.slice(0, 20).map((item, index) => (
        <Text key={item.id ?? index} style={{ color: theme.colors.muted, marginBottom: 8 }}>• {item.nombre || item.razonSocial || item.descripcion || JSON.stringify(item)}</Text>
      )) : <MtEmptyState title="Sin datos" />}
    </MtCard>
  );

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="ADMIN" title="Catálogos" subtitle="Especialidades, obras sociales e instituciones desde backend." />
      {error ? <MtCard style={{ borderColor: theme.colors.danger, marginBottom: 14 }}><Text style={{ color: theme.colors.danger, fontWeight: '900' }}>{error}</Text></MtCard> : null}
      <MtCard style={{ marginBottom: 14 }}>
        <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18 }}>Resumen</Text>
        <MtPill label={`Especialidades ${especialidades.length}`} selected />
        <MtPill label={`Obras sociales ${obras.length}`} selected tone="success" />
        <MtPill label={`Instituciones ${instituciones.length}`} selected tone="warning" />
      </MtCard>
      <Section title="Especialidades" items={especialidades} />
      <Section title="Obras sociales" items={obras} />
      <Section title="Instituciones" items={instituciones} />
      <RoleBottomNav role="admin" active="catalogos" />
    </MtScreen>
  );
}
