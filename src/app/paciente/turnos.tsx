import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { appointmentService, TurnoResponse } from '../../api/appointmentService';
import { useAuthStore } from '../../auth/authStore';
import { MtBottomNav, MtButton, MtCard, MtEmptyState, MtHeader, MtLoading, MtNotice, MtPill, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { languageCopy, useTranslation } from '../../i18n/languageStore';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';
import { addAppointmentToDeviceCalendar } from '../../utils/calendar';

type Tab = 'proximos' | 'historial' | 'todos';
type Notice = { type: 'success' | 'error' | 'warning'; title: string; message: string };

const FINAL_STATES = new Set(['FINALIZADO', 'ATENDIDO', 'CANCELADO', 'AUSENTE']);

export default function MisTurnosScreen() {
  const { pacienteId } = useAuthStore();
  const theme = useMtTheme();
  const { language } = useTranslation();
  const copy = (es: string, en: string, pt: string) => languageCopy(language, es, en, pt);
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const [appointments, setAppointments] = useState<TurnoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>('proximos');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmingCancelId, setConfirmingCancelId] = useState<number | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  useEffect(() => {
    fetchAppointments(true);
  }, [pacienteId]);

  const fetchAppointments = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const data = await appointmentService.getMyAppointments(pacienteId);
      setAppointments(data);
    } catch (error: unknown) {
      setNotice({
        type: 'error',
        title: copy('No se pudieron cargar los turnos', 'Appointments could not be loaded', 'Nao foi possivel carregar as consultas'),
        message: readableError(error, copy('No se pudieron cargar los turnos.', 'Appointments could not be loaded.', 'Nao foi possivel carregar as consultas.')),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filtered = useMemo(() => {
    return appointments
      .filter((turno) => {
        const estado = String(turno.estado).toUpperCase();
        if (tab === 'proximos') return !FINAL_STATES.has(estado);
        if (tab === 'historial') return FINAL_STATES.has(estado);
        return true;
      })
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
  }, [appointments, tab]);

  const handleCancelRequest = (turno: TurnoResponse) => {
    setNotice({
      type: 'warning',
      title: copy('Confirma la cancelacion', 'Confirm cancellation', 'Confirme o cancelamento'),
      message: copy(
        `Vas a cancelar el turno de ${turno.especialidad} del ${turno.fecha} a las ${turno.hora} hs. No se borra: queda en historial como CANCELADO.`,
        `You are about to cancel the ${turno.especialidad} appointment on ${turno.fecha} at ${turno.hora}. It is not deleted: it stays in history as CANCELLED.`,
        `Voce vai cancelar a consulta de ${turno.especialidad} de ${turno.fecha} as ${turno.hora}. Ela nao e apagada: fica no historico como CANCELADA.`,
      ),
    });
    setConfirmingCancelId(turno.id);
  };

  const handleCancelConfirm = async (turno: TurnoResponse) => {
    try {
      setCancelingId(turno.id);
      setNotice(null);
      const updated = await appointmentService.cancelar(turno.id);

      setAppointments((prev) => prev.map((item) => Number(item.id) === Number(updated.id) ? updated : item));
      setConfirmingCancelId(null);
      setTab('historial');
      setNotice({
        type: 'success',
        title: copy('Turno cancelado', 'Appointment cancelled', 'Consulta cancelada'),
        message: copy(
          `El turno de ${updated.especialidad || turno.especialidad} quedo en estado CANCELADO. Lo vas a ver en Historial.`,
          `The ${updated.especialidad || turno.especialidad} appointment is now CANCELLED. You will see it in History.`,
          `A consulta de ${updated.especialidad || turno.especialidad} ficou como CANCELADA. Voce vai ve-la no Historico.`,
        ),
      });

      await fetchAppointments(false);
    } catch (error: unknown) {
      setNotice({
        type: 'error',
        title: copy('No se pudo cancelar', 'Cancellation failed', 'Nao foi possivel cancelar'),
        message: readableError(error, copy('No pudimos confirmar la cancelacion del turno.', 'We could not confirm the appointment cancellation.', 'Nao conseguimos confirmar o cancelamento da consulta.')),
      });
    } finally {
      setCancelingId(null);
    }
  };

  const handleConfirmAttendance = async (turno: TurnoResponse) => {
    try {
      const updated = await appointmentService.confirmarAsistencia(turno.id);
      setAppointments((prev) => prev.map((item) => Number(item.id) === Number(updated.id) ? updated : item));
      setNotice({
        type: 'success',
        title: copy('Asistencia confirmada', 'Attendance confirmed', 'Presenca confirmada'),
        message: copy('Gracias por confirmar. Te esperamos en el horario indicado.', 'Thanks for confirming. We will see you at the scheduled time.', 'Obrigado por confirmar. Esperamos voce no horario indicado.'),
      });
    } catch (error: unknown) {
      setNotice({
        type: 'error',
        title: copy('No se pudo confirmar asistencia', 'Attendance could not be confirmed', 'Nao foi possivel confirmar a presenca'),
        message: readableError(error, copy('Intenta nuevamente en unos segundos.', 'Try again in a few seconds.', 'Tente novamente em alguns segundos.')),
      });
    }
  };

  const handleAddCalendar = async (turno: TurnoResponse) => {
    try {
      await addAppointmentToDeviceCalendar(turno);
      setNotice({
        type: 'success',
        title: copy('Agregado al calendario', 'Added to calendar', 'Adicionado ao calendario'),
        message: copy('El turno se agrego al calendario del dispositivo con recordatorio 3 horas antes.', 'The appointment was added to the device calendar with a reminder 3 hours before.', 'A consulta foi adicionada ao calendario do dispositivo com lembrete 3 horas antes.'),
      });
    } catch (error: unknown) {
      setNotice({
        type: 'error',
        title: copy('No se pudo agregar al calendario', 'Could not add to calendar', 'Nao foi possivel adicionar ao calendario'),
        message: readableError(error, copy('Revisa los permisos del calendario.', 'Check calendar permissions.', 'Revise as permissoes do calendario.')),
      });
    }
  };

  if (loading) return <MtLoading text={copy('Buscando tus turnos...', 'Looking for your appointments...', 'Buscando suas consultas...')} />;

  return (
    <MtScreen scroll={false}>
      <MtHeader
        eyebrow="AGENDA"
        title={copy('Mis turnos', 'My appointments', 'Minhas consultas')}
        subtitle={copy('Consulta proximos turnos, historial y acciones rapidas.', 'Check upcoming appointments, history and quick actions.', 'Consulte proximas consultas, historico e acoes rapidas.')}
      />

      {!!notice && <NoticeBox notice={notice} />}

      <View style={styles.tabs}>
        <MtPill label={copy('Proximos', 'Upcoming', 'Proximas')} selected={tab === 'proximos'} onPress={() => setTab('proximos')} />
        <MtPill label={copy('Historial', 'History', 'Historico')} selected={tab === 'historial'} onPress={() => setTab('historial')} tone="success" />
        <MtPill label={copy('Todos', 'All', 'Todas')} selected={tab === 'todos'} onPress={() => setTab('todos')} tone="muted" />
      </View>

      <FlatList
        style={styles.listSurface}
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchAppointments(false); }}
        ListEmptyComponent={
          <MtEmptyState
            title={copy('No hay turnos para mostrar', 'No appointments to show', 'Nao ha consultas para mostrar')}
            subtitle={copy('Podes solicitar uno nuevo desde la app.', 'You can request a new one from the app.', 'Voce pode solicitar uma nova consulta pelo app.')}
            actionTitle={copy('Solicitar turno', 'Request appointment', 'Solicitar consulta')}
            onAction={() => router.push('/paciente/solicitar')}
          />
        }
        renderItem={({ item }) => (
          <AppointmentCard
            item={item}
            confirmingCancel={confirmingCancelId === item.id}
            canceling={cancelingId === item.id}
            onCancelRequest={() => handleCancelRequest(item)}
            onCancelConfirm={() => handleCancelConfirm(item)}
            onCancelAbort={() => { setConfirmingCancelId(null); setNotice(null); }}
            onConfirmAttendance={() => handleConfirmAttendance(item)}
            onAddCalendar={() => handleAddCalendar(item)}
            onFeedback={() => router.push({ pathname: '/paciente/feedback', params: { id: item.id } })}
            styles={styles}
          />
        )}
      />
      <MtBottomNav active="turnos" />
    </MtScreen>
  );
}

function NoticeBox({ notice }: Readonly<{ notice: Notice }>) {
  return <MtNotice type={notice.type === 'error' ? 'danger' : notice.type} title={notice.title} message={notice.message} style={{ marginBottom: 14 }} />;
}

function AppointmentCard({
  item,
  confirmingCancel,
  canceling,
  onCancelRequest,
  onCancelConfirm,
  onCancelAbort,
  onConfirmAttendance,
  onAddCalendar,
  onFeedback,
  styles,
}: Readonly<{
  item: TurnoResponse;
  confirmingCancel: boolean;
  canceling: boolean;
  onCancelRequest: () => void;
  onCancelConfirm: () => void;
  onCancelAbort: () => void;
  onConfirmAttendance: () => void;
  onAddCalendar: () => void;
  onFeedback: () => void;
  styles: ReturnType<typeof createStyles>;
}>) {
  const { language } = useTranslation();
  const copy = (es: string, en: string, pt: string) => languageCopy(language, es, en, pt);
  const estado = String(item.estado).toUpperCase();
  const isFinal = FINAL_STATES.has(estado);
  let tone: 'success' | 'warning' | 'danger' | 'muted' = 'muted';
  if (estado === 'CONFIRMADO' || estado === 'REPROGRAMADO') tone = 'success';
  else if (estado === 'PENDIENTE') tone = 'warning';
  else if (estado === 'CANCELADO') tone = 'danger';

  return (
    <MtCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarMini}><Text style={styles.avatarMiniText}>Dr</Text></View>
        <View style={styles.cardTextBlock}>
          <Text style={styles.specialty} numberOfLines={1} ellipsizeMode="tail">{item.especialidad}</Text>
          <Text style={styles.doctor} numberOfLines={1} ellipsizeMode="tail">{item.profesionalNombre}</Text>
          <Text style={styles.place} numberOfLines={1} ellipsizeMode="tail">{item.institucionNombre}</Text>
        </View>
      </View>
      <View style={styles.statusRow}>
        <MtPill label={estado} tone={tone} />
      </View>

      <View style={styles.dateBox}>
        <Text style={styles.dateText}>{copy('Fecha', 'Date', 'Data')}: {item.fecha}</Text>
        <Text style={styles.dateText}>{copy('Hora', 'Time', 'Horario')}: {item.hora} hs</Text>
      </View>

      {!!item.motivoConsulta && <Text style={styles.reason}>{copy('Motivo', 'Reason', 'Motivo')}: {item.motivoConsulta}</Text>}

      <View style={styles.actions}>
        <MtButton title={copy('Detalle', 'Details', 'Detalhe')} variant="ghost" onPress={() => router.push({ pathname: '/paciente/turno-detalle', params: { id: item.id } })} style={{ flex: 1 }} />
        {!isFinal && <MtButton title={copy('Reprogramar', 'Reschedule', 'Reprogramar')} variant="secondary" onPress={() => router.push({ pathname: '/paciente/reprogramar', params: { id: item.id } })} style={{ flex: 1 }} />}
      </View>

      {!isFinal && (
        <View style={styles.actionsColumn}>
          <MtButton title={item.asistenciaConfirmada ? copy('Asistencia OK', 'Attendance OK', 'Presenca OK') : copy('Confirmar asistencia', 'Confirm attendance', 'Confirmar presenca')} variant="secondary" onPress={onConfirmAttendance} disabled={!!item.asistenciaConfirmada} />
          <MtButton title={copy('Agregar al calendario', 'Add to calendar', 'Adicionar ao calendario')} variant="ghost" onPress={onAddCalendar} />
        </View>
      )}

      {estado === 'ATENDIDO' && (
        <MtButton title={copy('Calificar atencion', 'Rate visit', 'Avaliar atendimento')} variant="secondary" onPress={onFeedback} style={{ marginTop: 10 }} />
      )}

      {!isFinal && !confirmingCancel && (
        <MtButton title={copy('Cancelar turno', 'Cancel appointment', 'Cancelar consulta')} variant="danger" onPress={onCancelRequest} style={{ marginTop: 10 }} />
      )}

      {!isFinal && confirmingCancel && (
        <View style={styles.cancelBox}>
          <Text style={styles.cancelTitle}>{copy('Seguro que queres cancelar?', 'Are you sure you want to cancel?', 'Tem certeza que deseja cancelar?')}</Text>
          <Text style={styles.cancelText}>{copy('El turno no se borra. Cambia a estado CANCELADO y queda en el historial.', 'The appointment is not deleted. It changes to CANCELLED and remains in history.', 'A consulta nao e apagada. Ela muda para CANCELADA e fica no historico.')}</Text>
          <View style={styles.cancelActions}>
            <MtButton title={copy('Si, cancelar', 'Yes, cancel', 'Sim, cancelar')} variant="danger" loading={canceling} disabled={canceling} onPress={onCancelConfirm} style={{ flex: 1 }} />
            <MtButton title={copy('No', 'No', 'Nao')} variant="ghost" disabled={canceling} onPress={onCancelAbort} style={{ flex: 1 }} />
          </View>
        </View>
      )}
    </MtCard>
  );
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    tabs: { flexDirection: 'row', marginBottom: 12 },
    listSurface: { flex: 1 },
    list: { gap: 14, paddingBottom: 24 },
    card: { gap: 12 },
    cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    cardTextBlock: { flex: 1, flexShrink: 1, minWidth: 0, width: 0 },
    statusRow: { alignSelf: 'flex-start', marginTop: -2 },
    avatarMini: { width: 46, height: 46, borderRadius: 16, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
    avatarMiniText: { color: theme.colors.primaryDark, fontWeight: '900' },
    specialty: { color: theme.colors.primary, backgroundColor: 'transparent', fontWeight: '900', fontSize: 15, lineHeight: 19, includeFontPadding: false },
    doctor: { color: theme.colors.ink, backgroundColor: 'transparent', fontWeight: '900', fontSize: 18, marginTop: 2, lineHeight: 22, includeFontPadding: false },
    place: { color: theme.colors.muted, backgroundColor: 'transparent', fontSize: 14, marginTop: 2, lineHeight: 18, includeFontPadding: false },
    dateBox: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', backgroundColor: theme.colors.bg, padding: 12, borderRadius: 16 },
    dateText: { color: theme.colors.ink, fontWeight: '800' },
    reason: { color: theme.colors.muted, lineHeight: 20 },
    actions: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
    actionsColumn: { gap: 10 },
    cancelBox: { borderRadius: 18, borderWidth: 1, borderColor: theme.colors.danger, backgroundColor: theme.mode === 'dark' ? '#3F1111' : '#FEF2F2', padding: 14, marginTop: 10, gap: 8 },
    cancelTitle: { color: theme.mode === 'dark' ? '#FEE2E2' : '#991B1B', fontWeight: '900', fontSize: 15 },
    cancelText: { color: theme.mode === 'dark' ? '#FEE2E2' : '#991B1B', fontWeight: '700', lineHeight: 20 },
    cancelActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    noticeBox: { borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 14 },
    noticeSuccess: { backgroundColor: theme.mode === 'dark' ? '#24143E' : '#F3EEFF', borderColor: theme.colors.success },
    noticeWarning: { backgroundColor: theme.mode === 'dark' ? '#422B05' : '#FFFBEB', borderColor: theme.colors.warning },
    noticeError: { backgroundColor: theme.mode === 'dark' ? '#3F1111' : '#FEF2F2', borderColor: theme.colors.danger },
    noticeTitle: { fontWeight: '900', fontSize: 15, marginBottom: 4 },
    noticeMessage: { fontWeight: '700', lineHeight: 20 },
    noticeSuccessText: { color: theme.mode === 'dark' ? '#D1FAE5' : '#065F46' },
    noticeWarningText: { color: theme.mode === 'dark' ? '#FEF3C7' : '#92400E' },
    noticeErrorText: { color: theme.mode === 'dark' ? '#FEE2E2' : '#991B1B' },
  });
}
