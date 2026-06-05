import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { MtButton, MtCard, MtHeader, MtLoading, MtScreen, MtStat } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { TurnoCard } from '../../components/TurnoCard';
import { secretariaService } from '../../api/staffService';
import { TurnoResponse } from '../../api/appointmentService';
import { useAuthStore } from '../../auth/authStore';
import { useMtTheme } from '../../theme/themeStore';

export default function SecretariaDashboard() {
  const nombre = useAuthStore((s) => s.nombreCompleto);
  const [turnos, setTurnos] = useState<TurnoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useMtTheme();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setTurnos(await secretariaService.turnos()); }
    catch (e: any) { setError(e?.response?.data?.message || e?.message || 'No pudimos cargar turnos.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayItems = turnos.filter((t) => (t.fechaHora || t.fecha || '').startsWith(today));
    const count = (estado: string) => turnos.filter((t) => String(t.estado).toUpperCase() === estado).length;
    return { today: todayItems.length, confirmed: count('CONFIRMADO'), cancelled: count('CANCELADO'), pending: count('PENDIENTE') + count('REPROGRAMADO') };
  }, [turnos]);

  if (loading) return <MtLoading text="Cargando panel de secretaría..." />;

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="PANEL SECRETARÍA" title={`Hola, ${nombre || 'secretaría'}`} subtitle="Operación diaria de turnos y pacientes." />
      {error ? <MtCard style={{ borderColor: theme.colors.danger, marginBottom: 14 }}><Text style={{ color: theme.colors.danger, fontWeight: '900' }}>{error}</Text><MtButton title="Reintentar" onPress={load} style={{ marginTop: 12 }} /></MtCard> : null}
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <MtStat label="Hoy" value={stats.today} />
        <MtStat label="Confirmados" value={stats.confirmed} tone="success" />
        <MtStat label="Pend/Reprog" value={stats.pending} tone="warning" />
        <MtStat label="Cancelados" value={stats.cancelled} tone="danger" />
      </View>
      <MtCard style={{ marginBottom: 14 }}>
        <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18 }}>Acciones rápidas</Text>
        <View style={{ gap: 10, marginTop: 14 }}>
          <MtButton title="Crear turno" onPress={() => router.push('/secretaria/nuevo-turno')} />
          <MtButton title="Gestionar turnos" variant="ghost" onPress={() => router.push('/secretaria/turnos')} />
          <MtButton title="Buscar paciente" variant="ghost" onPress={() => router.push('/secretaria/pacientes')} />
        </View>
      </MtCard>
      <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18, marginBottom: 10 }}>Últimos turnos</Text>
      {turnos.slice(0, 5).map((turno) => <TurnoCard key={turno.id} turno={turno} />)}
      <RoleBottomNav role="secretaria" active="home" />
    </MtScreen>
  );
}
