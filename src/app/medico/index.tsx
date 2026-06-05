import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { MtButton, MtCard, MtEmptyState, MtHeader, MtLoading, MtScreen, MtStat } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { TurnoCard } from '../../components/TurnoCard';
import { medicoService } from '../../api/staffService';
import { TurnoResponse } from '../../api/appointmentService';
import { useAuthStore } from '../../auth/authStore';
import { useMtTheme } from '../../theme/themeStore';

export default function MedicoDashboard() {
  const usuarioId = useAuthStore((s) => s.usuarioId);
  const nombre = useAuthStore((s) => s.nombreCompleto);
  const [agenda, setAgenda] = useState<TurnoResponse[]>([]);
  const [next, setNext] = useState<TurnoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useMtTheme();

  const load = useCallback(async () => {
    if (!usuarioId) return;
    setLoading(true);
    setError(null);
    try {
      const [agendaData, nextData] = await Promise.all([
        medicoService.agenda(usuarioId),
        medicoService.proximoTurno(usuarioId).catch(() => null),
      ]);
      setAgenda(agendaData);
      setNext(nextData);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'No pudimos cargar la agenda médica.');
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const pendientes = agenda.filter((t) => ['PENDIENTE', 'CONFIRMADO', 'REPROGRAMADO'].includes(String(t.estado).toUpperCase())).length;
    const atendidos = agenda.filter((t) => String(t.estado).toUpperCase() === 'ATENDIDO').length;
    return { total: agenda.length, pendientes, atendidos };
  }, [agenda]);

  if (loading) return <MtLoading text="Cargando panel médico..." />;

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="PANEL MÉDICO" title={`Hola, ${nombre || 'doctor/a'}`} subtitle="Agenda, atención de consultas e historia clínica." />
      {error ? (
        <MtCard style={{ borderColor: theme.colors.danger, marginBottom: 14 }}>
          <Text style={{ color: theme.colors.danger, fontWeight: '900' }}>{error}</Text>
          <MtButton title="Reintentar" onPress={load} style={{ marginTop: 12 }} />
        </MtCard>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <MtStat label="Turnos hoy" value={stats.total} />
        <MtStat label="Pendientes" value={stats.pendientes} tone="warning" />
        <MtStat label="Atendidos" value={stats.atendidos} tone="success" />
      </View>

      <MtCard style={{ marginBottom: 14 }}>
        <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18 }}>Acciones rápidas</Text>
        <View style={{ gap: 10, marginTop: 14 }}>
          <MtButton title="Ver agenda del día" onPress={() => router.push('/medico/agenda')} />
          <MtButton title="Registrar consulta" variant="ghost" onPress={() => router.push('/medico/consulta')} />
          <MtButton title="Buscar historia por DNI" variant="ghost" onPress={() => router.push('/medico/historia-paciente')} />
        </View>
      </MtCard>

      <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18, marginBottom: 10 }}>Próximo turno</Text>
      {next ? (
        <TurnoCard turno={next} primaryAction={{ title: 'Atender consulta', onPress: () => router.push({ pathname: '/medico/consulta', params: { turnoId: String(next.id) } }) }} />
      ) : (
        <MtEmptyState title="Sin próximos turnos" subtitle="No hay consultas próximas asignadas para este usuario médico." />
      )}
      <RoleBottomNav role="medico" active="home" />
    </MtScreen>
  );
}
