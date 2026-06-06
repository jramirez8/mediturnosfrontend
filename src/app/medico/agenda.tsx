import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { MtButton, MtCard, MtEmptyState, MtHeader, MtLoading, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { TurnoCard } from '../../components/TurnoCard';
import { medicoService } from '../../api/staffService';
import { TurnoResponse } from '../../api/appointmentService';
import { useAuthStore } from '../../auth/authStore';
import { filterTurnosForDoctor } from '../../utils/doctorAccess';
import { useMtTheme } from '../../theme/themeStore';

export default function MedicoAgendaScreen() {
  const usuarioId = useAuthStore((s) => s.usuarioId);
  const profesionalId = useAuthStore((s) => s.profesionalId);
  const profesionalInstitucionId = useAuthStore((s) => s.profesionalInstitucionId);
  const nombreCompleto = useAuthStore((s) => s.nombreCompleto);
  const doctorIdentity = useMemo(() => ({ profesionalId, profesionalInstitucionId, nombreCompleto }), [profesionalId, profesionalInstitucionId, nombreCompleto]);
  const [agenda, setAgenda] = useState<TurnoResponse[]>([]);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useMtTheme();

  const load = useCallback(async () => {
    if (!usuarioId) return;
    setLoading(true);
    setError(null);
    try {
      const rawAgenda = await medicoService.agenda(usuarioId);
      const ownAgenda = filterTurnosForDoctor(rawAgenda, doctorIdentity);
      setAgenda(ownAgenda);
      setHiddenCount(Math.max(0, rawAgenda.length - ownAgenda.length));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'No pudimos cargar la agenda.');
    } finally {
      setLoading(false);
    }
  }, [usuarioId, doctorIdentity]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <MtLoading text="Cargando agenda..." />;

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="MÉDICO" title="Agenda del día" subtitle="Solo se muestran los turnos asignados al médico logueado." />
      {hiddenCount > 0 ? (
        <MtCard style={{ borderColor: theme.colors.warning, marginBottom: 14 }}>
          <Text style={{ color: theme.colors.warning, fontWeight: '900' }}>Se ocultaron {hiddenCount} turno(s) ajenos a este médico.</Text>
          <Text style={{ color: theme.colors.muted, fontWeight: '700', marginTop: 6, lineHeight: 19 }}>El backend todavía debería reforzar esta validación, pero el front ya no permite atenderlos.</Text>
        </MtCard>
      ) : null}
      {error ? <MtCard style={{ borderColor: theme.colors.danger, marginBottom: 14 }}><Text style={{ color: theme.colors.danger, fontWeight: '900' }}>{error}</Text><MtButton title="Reintentar" onPress={load} style={{ marginTop: 12 }} /></MtCard> : null}
      {agenda.length ? agenda.map((turno) => (
        <TurnoCard key={turno.id} turno={turno} primaryAction={{ title: 'Atender', onPress: () => router.push({ pathname: '/medico/consulta', params: { turnoId: String(turno.id) } }) }} secondaryAction={{ title: 'Ver historia del paciente', onPress: () => router.push({ pathname: '/medico/historia-paciente', params: { dni: turno.pacienteDni || '' } }) }} />
      )) : <MtEmptyState title="Agenda vacía" subtitle="No hay turnos propios para hoy." actionTitle="Actualizar" onAction={load} />}
      <RoleBottomNav role="medico" active="agenda" />
    </MtScreen>
  );
}
