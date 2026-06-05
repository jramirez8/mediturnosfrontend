import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { MtCard, MtHeader, MtLoading, MtScreen, MtStat } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { secretariaService } from '../../api/staffService';
import { TurnoResponse } from '../../api/appointmentService';
import { useMtTheme } from '../../theme/themeStore';

export default function AdminReportesScreen() {
  const [turnos, setTurnos] = useState<TurnoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useMtTheme();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setTurnos(await secretariaService.turnos()); }
    catch (e: any) { setError(e?.response?.data?.message || e?.message || 'No pudimos cargar reportes.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const byStatus = useMemo(() => turnos.reduce<Record<string, number>>((acc, t) => {
    const key = String(t.estado || 'SIN_ESTADO').toUpperCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}), [turnos]);

  const bySpecialty = useMemo(() => turnos.reduce<Record<string, number>>((acc, t) => {
    const key = t.especialidad || 'Sin especialidad';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}), [turnos]);

  if (loading) return <MtLoading text="Cargando reportes..." />;

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="ADMIN" title="Reportes" subtitle="Indicadores simples con datos reales de turnos." />
      {error ? <MtCard style={{ borderColor: theme.colors.danger, marginBottom: 14 }}><Text style={{ color: theme.colors.danger, fontWeight: '900' }}>{error}</Text></MtCard> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <MtStat label="Turnos" value={turnos.length} />
        <MtStat label="Confirmados" value={byStatus.CONFIRMADO || 0} tone="success" />
        <MtStat label="Cancelados" value={byStatus.CANCELADO || 0} tone="danger" />
        <MtStat label="Atendidos" value={byStatus.ATENDIDO || 0} tone="success" />
      </View>
      <MtCard style={{ marginBottom: 14 }}>
        <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18, marginBottom: 12 }}>Por estado</Text>
        {Object.entries(byStatus).map(([k, v]) => <Text key={k} style={{ color: theme.colors.muted, marginBottom: 8 }}>• {k}: {v}</Text>)}
      </MtCard>
      <MtCard>
        <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18, marginBottom: 12 }}>Por especialidad</Text>
        {Object.entries(bySpecialty).map(([k, v]) => <Text key={k} style={{ color: theme.colors.muted, marginBottom: 8 }}>• {k}: {v}</Text>)}
      </MtCard>
      <RoleBottomNav role="admin" active="catalogos" />
    </MtScreen>
  );
}
