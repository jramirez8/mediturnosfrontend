import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { MtButton, MtCard, MtEmptyState, MtHeader, MtLoading, MtScreen, MtStat } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { TurnoCard } from '../../components/TurnoCard';
import { medicoService } from '../../api/staffService';
import { TurnoResponse } from '../../api/appointmentService';
import { useAuthStore } from '../../auth/authStore';
import { filterTurnosForDoctor, turnoBelongsToDoctor } from '../../utils/doctorAccess';
import { useMtTheme } from '../../theme/themeStore';
import { useTranslation } from '../../i18n/languageStore';
import { feedbackService, TurnoFeedback } from '../../api/feedbackService';
import { readableError } from '../../utils/errors';

export default function MedicoDashboard() {
  const usuarioId = useAuthStore((s) => s.usuarioId);
  const profesionalId = useAuthStore((s) => s.profesionalId);
  const profesionalInstitucionId = useAuthStore((s) => s.profesionalInstitucionId);
  const nombre = useAuthStore((s) => s.nombreCompleto);
  const doctorIdentity = useMemo(() => ({ profesionalId, profesionalInstitucionId, nombreCompleto: nombre }), [profesionalId, profesionalInstitucionId, nombre]);
  const [agenda, setAgenda] = useState<TurnoResponse[]>([]);
  const [next, setNext] = useState<TurnoResponse | null>(null);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [feedback, setFeedback] = useState<TurnoFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useMtTheme();
  const { t, language } = useTranslation();

  const load = useCallback(async () => {
    if (!usuarioId) return;
    setLoading(true);
    setError(null);
    try {
      const [agendaData, nextData, feedbackData] = await Promise.all([
        medicoService.agenda(usuarioId),
        medicoService.proximoTurno(usuarioId).catch(() => null),
        feedbackService.latest().catch(() => []),
      ]);
      const ownAgenda = filterTurnosForDoctor(agendaData, doctorIdentity);
      setAgenda(ownAgenda);
      setHiddenCount(Math.max(0, agendaData.length - ownAgenda.length));
      setNext(nextData && turnoBelongsToDoctor(nextData, doctorIdentity) ? nextData : ownAgenda[0] ?? null);
      setFeedback(feedbackData);
    } catch (e: any) {
      setError(readableError(e, language === 'en' ? 'We could not load the medical schedule.' : 'No pudimos cargar la agenda médica.'));
    } finally {
      setLoading(false);
    }
  }, [usuarioId, language, doctorIdentity]);

  useEffect(() => { load(); }, [load]);

  const satisfaction = useMemo(() => feedback.length ? (feedback.reduce((sum, item) => sum + item.puntuacion, 0) / feedback.length).toFixed(1) : null, [feedback]);

  const stats = useMemo(() => {
    const pendientes = agenda.filter((t) => ['PENDIENTE', 'CONFIRMADO', 'REPROGRAMADO'].includes(String(t.estado).toUpperCase())).length;
    const atendidos = agenda.filter((t) => String(t.estado).toUpperCase() === 'ATENDIDO').length;
    return { total: agenda.length, pendientes, atendidos };
  }, [agenda]);

  if (loading) return <MtLoading text={t('common.loading')} />;

  return (
    <MtScreen scroll>
      <MtHeader eyebrow={t('doctor.panel')} title={`${t('patient.hello')}, ${nombre || t('role.professional')}`} subtitle={t('doctor.subtitle')} />
      {error ? (
        <MtCard style={{ borderColor: theme.colors.danger, marginBottom: 14 }}>
          <Text style={{ color: theme.colors.danger, fontWeight: '900' }}>{error}</Text>
          <MtButton title="Reintentar" onPress={load} style={{ marginTop: 12 }} />
        </MtCard>
      ) : null}
      {hiddenCount > 0 ? (
        <MtCard style={{ borderColor: theme.colors.warning, marginBottom: 14 }}>
          <Text style={{ color: theme.colors.warning, fontWeight: '900' }}>Se ocultaron {hiddenCount} turno(s) ajenos a este médico.</Text>
        </MtCard>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <MtStat label={language === 'en' ? 'Today' : 'Turnos hoy'} value={stats.total} />
        <MtStat label={language === 'en' ? 'Pending' : 'Pendientes'} value={stats.pendientes} tone="warning" />
        <MtStat label={language === 'en' ? 'Completed' : 'Atendidos'} value={stats.atendidos} tone="success" />
        <MtStat label={language === 'en' ? 'Rating' : 'Valoración'} value={satisfaction ? `${satisfaction}/5` : '—'} tone="success" />
      </View>

      <MtCard style={{ marginBottom: 14 }}>
        <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18 }}>{t('doctor.quickActions')}</Text>
        <View style={{ gap: 10, marginTop: 14 }}>
          <MtButton title={t('doctor.todayAgenda')} onPress={() => router.push('/medico/agenda')} />
          <MtButton title={t('doctor.registerConsultation')} variant="ghost" onPress={() => router.push('/medico/consulta')} />
          <MtButton title="Mi disponibilidad" variant="ghost" onPress={() => router.push('/medico/disponibilidad')} />
          <MtButton title={t('doctor.searchHistory')} variant="ghost" onPress={() => router.push('/medico/historia-paciente')} />
        </View>
      </MtCard>

      {feedback.length ? (
        <MtCard style={{ marginBottom: 14 }}>
          <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18 }}>Valoraciones recientes</Text>
          <Text style={{ color: theme.colors.muted, fontWeight: '700', marginTop: 5 }}>Promedio de {feedback.length} atención(es): {satisfaction}/5</Text>
          {feedback.slice(0, 3).map((item) => (
            <View key={item.id} style={{ borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 10, marginTop: 10 }}>
              <Text style={{ color: theme.colors.primary, fontWeight: '900' }}>{'★'.repeat(item.puntuacion)}{'☆'.repeat(5 - item.puntuacion)}</Text>
              {item.comentario ? <Text style={{ color: theme.colors.ink, fontWeight: '700', marginTop: 4 }}>{item.comentario}</Text> : null}
            </View>
          ))}
        </MtCard>
      ) : null}

      <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18, marginBottom: 10 }}>{t('doctor.next')}</Text>
      {next ? (
        <TurnoCard turno={next} primaryAction={{ title: 'Atender consulta', onPress: () => router.push({ pathname: '/medico/consulta', params: { turnoId: String(next.id) } }) }} />
      ) : (
        <MtEmptyState title={language === 'en' ? 'No upcoming appointments' : 'Sin próximos turnos'} subtitle={language === 'en' ? 'There are no upcoming consultations assigned to this doctor.' : 'No hay consultas próximas asignadas para este profesional.'} />
      )}
      <RoleBottomNav role="medico" active="home" />
    </MtScreen>
  );
}
