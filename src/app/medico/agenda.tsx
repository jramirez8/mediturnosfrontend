import React, { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { MtButton, MtCard, MtEmptyState, MtHeader, MtLoading, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { TurnoCard } from '../../components/TurnoCard';
import { medicoService } from '../../api/staffService';
import { TurnoResponse } from '../../api/appointmentService';
import { useAuthStore } from '../../auth/authStore';
import { useMtTheme } from '../../theme/themeStore';

export default function MedicoAgendaScreen() {
  const usuarioId = useAuthStore((s) => s.usuarioId);
  const [agenda, setAgenda] = useState<TurnoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useMtTheme();

  const load = useCallback(async () => {
    if (!usuarioId) return;
    setLoading(true);
    setError(null);
    try {
      setAgenda(await medicoService.agenda(usuarioId));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'No pudimos cargar la agenda.');
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <MtLoading text="Cargando agenda..." />;

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="MÉDICO" title="Agenda del día" subtitle="Turnos asignados al profesional logueado." />
      {error ? <MtCard style={{ borderColor: theme.colors.danger, marginBottom: 14 }}><Text style={{ color: theme.colors.danger, fontWeight: '900' }}>{error}</Text><MtButton title="Reintentar" onPress={load} style={{ marginTop: 12 }} /></MtCard> : null}
      {agenda.length ? agenda.map((turno) => (
        <TurnoCard key={turno.id} turno={turno} primaryAction={{ title: 'Atender', onPress: () => router.push({ pathname: '/medico/consulta', params: { turnoId: String(turno.id) } }) }} secondaryAction={{ title: 'Ver historia del paciente', onPress: () => router.push({ pathname: '/medico/historia-paciente', params: { dni: turno.pacienteDni || '' } }) }} />
      )) : <MtEmptyState title="Agenda vacía" subtitle="No hay turnos para hoy." actionTitle="Actualizar" onAction={load} />}
      <RoleBottomNav role="medico" active="agenda" />
    </MtScreen>
  );
}
