import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { appointmentService, TurnoResponse } from '../../api/appointmentService';
import { useAuthStore } from '../../auth/authStore';
import { MtBottomNav, MtButton, MtCard, MtEmptyState, MtHeader, MtLoading, MtPill, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';

type Tab = 'proximos' | 'historial' | 'todos';
type Notice = { type: 'success' | 'error' | 'warning'; title: string; message: string };

const FINAL_STATES = ['FINALIZADO', 'ATENDIDO', 'CANCELADO', 'AUSENTE'];

export default function MisTurnosScreen() {
  const { pacienteId } = useAuthStore();
  const theme = useMtTheme();
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
    } catch (error: any) {
      setNotice({ type: 'error', title: 'No se pudieron cargar los turnos', message: readableError(error, 'No se pudieron cargar los turnos.') });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filtered = useMemo(() => {
    return appointments
      .filter((turno) => {
        const estado = String(turno.estado).toUpperCase();
        if (tab === 'proximos') return !FINAL_STATES.includes(estado);
        if (tab === 'historial') return FINAL_STATES.includes(estado);
        return true;
      })
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
  }, [appointments, tab]);

  const handleCancelRequest = (turno: TurnoResponse) => {
    setNotice({
      type: 'warning',
      title: 'Confirmá la cancelación',
      message: `Vas a cancelar el turno de ${turno.especialidad} del ${turno.fecha} a las ${turno.hora} hs. No se borra: queda en historial como CANCELADO.`,
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
        title: 'Turno cancelado',
        message: `El turno de ${updated.especialidad || turno.especialidad} quedó en estado CANCELADO. Lo vas a ver en Historial.`,
      });

      // Refresco real para que la pantalla quede alineada con MySQL, no con estado local.
      await fetchAppointments(false);
    } catch (error: any) {
      setNotice({ type: 'error', title: 'No se pudo cancelar', message: readableError(error, 'El backend no confirmó la cancelación del turno.') });
    } finally {
      setCancelingId(null);
    }
  };

  if (loading) return <MtLoading text="Buscando tus turnos..." />;

  return (
    <>
      <MtScreen scroll={false}>
        <MtHeader eyebrow="AGENDA" title="Mis turnos" subtitle="Consultá próximos turnos, historial y acciones rápidas." />

        {!!notice && <NoticeBox notice={notice} styles={styles} />}

        <View style={styles.tabs}>
          <MtPill label="Próximos" selected={tab === 'proximos'} onPress={() => setTab('proximos')} />
          <MtPill label="Historial" selected={tab === 'historial'} onPress={() => setTab('historial')} tone="success" />
          <MtPill label="Todos" selected={tab === 'todos'} onPress={() => setTab('todos')} tone="muted" />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchAppointments(false); }}
          ListEmptyComponent={
            <MtEmptyState
              title="No hay turnos para mostrar"
              subtitle="Podés solicitar uno nuevo desde la app."
              actionTitle="Solicitar turno"
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
              styles={styles}
            />
          )}
        />
      </MtScreen>
      <MtBottomNav active="turnos" />
    </>
  );
}

function NoticeBox({ notice, styles }: { notice: Notice; styles: ReturnType<typeof createStyles> }) {
  const success = notice.type === 'success';
  const warning = notice.type === 'warning';
  return (
    <View style={[styles.noticeBox, success ? styles.noticeSuccess : warning ? styles.noticeWarning : styles.noticeError]}>
      <Text style={[styles.noticeTitle, success ? styles.noticeSuccessText : warning ? styles.noticeWarningText : styles.noticeErrorText]}>{notice.title}</Text>
      <Text style={[styles.noticeMessage, success ? styles.noticeSuccessText : warning ? styles.noticeWarningText : styles.noticeErrorText]}>{notice.message}</Text>
    </View>
  );
}

function AppointmentCard({
  item,
  confirmingCancel,
  canceling,
  onCancelRequest,
  onCancelConfirm,
  onCancelAbort,
  styles,
}: {
  item: TurnoResponse;
  confirmingCancel: boolean;
  canceling: boolean;
  onCancelRequest: () => void;
  onCancelConfirm: () => void;
  onCancelAbort: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const estado = String(item.estado).toUpperCase();
  const isFinal = FINAL_STATES.includes(estado);
  const tone = estado === 'CONFIRMADO' || estado === 'REPROGRAMADO' ? 'success' : estado === 'PENDIENTE' ? 'warning' : estado === 'CANCELADO' ? 'danger' : 'muted';

  return (
    <MtCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarMini}><Text style={styles.avatarMiniText}>Dr</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.specialty}>{item.especialidad}</Text>
          <Text style={styles.doctor}>{item.profesionalNombre}</Text>
          <Text style={styles.place}>{item.institucionNombre}</Text>
        </View>
        <MtPill label={estado} tone={tone as any} />
      </View>

      <View style={styles.dateBox}>
        <Text style={styles.dateText}>📆 {item.fecha}</Text>
        <Text style={styles.dateText}>⏰ {item.hora} hs</Text>
      </View>

      {!!item.motivoConsulta && <Text style={styles.reason}>Motivo: {item.motivoConsulta}</Text>}

      <View style={styles.actions}>
        <MtButton title="Detalle" variant="ghost" onPress={() => router.push({ pathname: '/paciente/turno-detalle', params: { id: item.id } })} style={{ flex: 1 }} />
        {!isFinal && <MtButton title="Reprogramar" variant="secondary" onPress={() => router.push({ pathname: '/paciente/reprogramar', params: { id: item.id } })} style={{ flex: 1 }} />}
      </View>

      {!isFinal && !confirmingCancel && (
        <MtButton title="Cancelar turno" variant="danger" onPress={onCancelRequest} style={{ marginTop: 10 }} />
      )}

      {!isFinal && confirmingCancel && (
        <View style={styles.cancelBox}>
          <Text style={styles.cancelTitle}>¿Seguro que querés cancelar?</Text>
          <Text style={styles.cancelText}>El turno no se borra. Cambia a estado CANCELADO y queda en el historial.</Text>
          <View style={styles.cancelActions}>
            <MtButton title="Sí, cancelar" variant="danger" loading={canceling} disabled={canceling} onPress={onCancelConfirm} style={{ flex: 1 }} />
            <MtButton title="No" variant="ghost" disabled={canceling} onPress={onCancelAbort} style={{ flex: 1 }} />
          </View>
        </View>
      )}
    </MtCard>
  );
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    tabs: { flexDirection: 'row', marginBottom: 12 },
    list: { gap: 14, paddingBottom: 120 },
    card: { gap: 12 },
    cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    avatarMini: { width: 46, height: 46, borderRadius: 16, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
    avatarMiniText: { color: theme.colors.primaryDark, fontWeight: '900' },
    specialty: { color: theme.colors.primary, fontWeight: '900', fontSize: 13 },
    doctor: { color: theme.colors.ink, fontWeight: '900', fontSize: 16, marginTop: 2 },
    place: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
    dateBox: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', backgroundColor: theme.colors.bg, padding: 12, borderRadius: 16 },
    dateText: { color: theme.colors.ink, fontWeight: '800' },
    reason: { color: theme.colors.muted, lineHeight: 20 },
    actions: { flexDirection: 'row', gap: 10 },
    cancelBox: { borderRadius: 18, borderWidth: 1, borderColor: theme.colors.danger, backgroundColor: theme.mode === 'dark' ? '#3F1111' : '#FEF2F2', padding: 14, marginTop: 10, gap: 8 },
    cancelTitle: { color: theme.mode === 'dark' ? '#FEE2E2' : '#991B1B', fontWeight: '900', fontSize: 15 },
    cancelText: { color: theme.mode === 'dark' ? '#FEE2E2' : '#991B1B', fontWeight: '700', lineHeight: 20 },
    cancelActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    noticeBox: { borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 14 },
    noticeSuccess: { backgroundColor: theme.mode === 'dark' ? '#063D35' : '#ECFDF5', borderColor: theme.colors.success },
    noticeWarning: { backgroundColor: theme.mode === 'dark' ? '#422B05' : '#FFFBEB', borderColor: theme.colors.warning },
    noticeError: { backgroundColor: theme.mode === 'dark' ? '#3F1111' : '#FEF2F2', borderColor: theme.colors.danger },
    noticeTitle: { fontWeight: '900', fontSize: 15, marginBottom: 4 },
    noticeMessage: { fontWeight: '700', lineHeight: 20 },
    noticeSuccessText: { color: theme.mode === 'dark' ? '#D1FAE5' : '#065F46' },
    noticeWarningText: { color: theme.mode === 'dark' ? '#FEF3C7' : '#92400E' },
    noticeErrorText: { color: theme.mode === 'dark' ? '#FEE2E2' : '#991B1B' },
  });
}
