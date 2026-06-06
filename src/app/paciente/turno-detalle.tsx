import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { appointmentService, TurnoResponse } from '../../api/appointmentService';
import { MtBottomNav, MtButton, MtCard, MtLoading, MtPill, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { addAppointmentToDeviceCalendar } from '../../utils/calendar';
import { readableError } from '../../utils/errors';

type Notice = { type: 'success' | 'error' | 'warning'; title: string; message: string };

const FINAL_STATES = ['FINALIZADO', 'ATENDIDO', 'CANCELADO', 'AUSENTE'];

function fallbackTurno(params: ReturnType<typeof useLocalSearchParams>): TurnoResponse {
  return {
    id: Number(params.id ?? 0),
    fecha: String(params.date ?? params.fecha ?? '2026-04-16'),
    hora: String(params.time ?? params.hora ?? '13:00'),
    fechaHora: String(params.fechaHora ?? ''),
    pacienteNombre: String(params.pacienteNombre ?? 'Paciente'),
    profesionalNombre: String(params.professional ?? params.doctor ?? params.profesionalNombre ?? 'Javier Lopez'),
    especialidad: String(params.specialty ?? params.especialidad ?? 'Cardiología'),
    institucionNombre: String(params.location ?? params.institucionNombre ?? 'María Auxiliadora'),
    estado: String(params.status ?? params.estado ?? 'CONFIRMADO'),
  } as TurnoResponse;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) || 'DR').toUpperCase();
}

function toneForStatus(status: string) {
  const estado = status.toUpperCase();
  if (estado === 'CONFIRMADO' || estado === 'REPROGRAMADO') return 'success';
  if (estado === 'PENDIENTE') return 'warning';
  if (estado === 'CANCELADO' || estado === 'AUSENTE') return 'danger';
  return 'muted';
}

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const id = Number(params.id ?? 0);

  const [turno, setTurno] = useState<TurnoResponse>(() => fallbackTurno(params));
  const [loading, setLoading] = useState(!!id);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const detail = await appointmentService.getAppointmentDetail(id);
        if (alive) setTurno(detail);
      } catch (error: any) {
        if (alive) {
          setNotice({ type: 'error', title: 'No se pudo cargar el detalle', message: readableError(error, 'Mostramos los datos básicos del turno.') });
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => { alive = false; };
  }, [id]);

  const estado = String(turno.estado ?? '').toUpperCase();
  const isFinal = FINAL_STATES.includes(estado);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/paciente/turnos');
  };

  const handleAddCalendar = async () => {
    try {
      setActionLoading(true);
      await addAppointmentToDeviceCalendar(turno);
      setNotice({ type: 'success', title: 'Agregado al calendario', message: 'El turno se guardó con recordatorio 3 horas antes.' });
    } catch (error: any) {
      setNotice({ type: 'error', title: 'No se pudo agregar', message: readableError(error, 'Revisá los permisos del calendario.') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    if (!turno.id) return;
    Alert.alert(
      'Cancelar turno',
      'El turno no se borra: queda en historial como CANCELADO. ¿Confirmás?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const updated = await appointmentService.cancelar(turno.id);
              setTurno(updated);
              setNotice({ type: 'success', title: 'Turno cancelado', message: 'Quedó guardado en tu historial.' });
            } catch (error: any) {
              setNotice({ type: 'error', title: 'No se pudo cancelar', message: readableError(error, 'Intentá nuevamente en unos segundos.') });
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  if (loading) return <MtLoading text="Cargando detalle del turno..." />;

  return (
    <>
      <MtScreen scroll style={styles.screen}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>AGENDA</Text>
            <Text style={styles.title}>Detalle de turno</Text>
          </View>
        </View>

        {!!notice && <NoticeBox notice={notice} styles={styles} />}

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(turno.profesionalNombre || 'Doctor')}</Text>
            </View>
            <View style={styles.heroTextBlock}>
              <Text style={styles.doctorName} numberOfLines={1} ellipsizeMode="tail">{turno.profesionalNombre || 'Profesional'}</Text>
              <Text style={styles.specialty} numberOfLines={1} ellipsizeMode="tail">{turno.especialidad || 'Consulta médica'}</Text>
            </View>
          </View>
          <View style={styles.heroStatusRow}>
            <MtPill label={estado || 'SIN ESTADO'} tone={toneForStatus(estado) as any} />
          </View>
        </View>

        <View style={styles.grid}>
          <InfoCard icon="calendar-outline" label="Fecha" value={turno.fecha || 'Sin fecha'} styles={styles} />
          <InfoCard icon="time-outline" label="Hora" value={`${turno.hora || 'Sin hora'} hs`} styles={styles} />
        </View>

        <InfoCard icon="location-outline" label="Sede" value={turno.institucionNombre || 'Institución'} styles={styles} />
        <InfoCard icon="checkmark-circle-outline" label="Estado" value={estado || 'SIN ESTADO'} styles={styles} />

        {!!turno.motivoConsulta && <InfoCard icon="chatbox-ellipses-outline" label="Motivo" value={turno.motivoConsulta} styles={styles} />}
        {!!turno.observaciones && <InfoCard icon="reader-outline" label="Observaciones" value={turno.observaciones} styles={styles} />}

        <View style={styles.actionsCard}>
          {!isFinal && (
            <MtButton title="Reprogramar turno" onPress={() => router.push({ pathname: '/paciente/reprogramar', params: { id: turno.id } })} />
          )}
          <MtButton title="Agregar al calendario" variant="secondary" loading={actionLoading} disabled={actionLoading} onPress={handleAddCalendar} />
          {!isFinal && <MtButton title="Cancelar turno" variant="danger" loading={actionLoading} disabled={actionLoading} onPress={handleCancel} />}
        </View>
      </MtScreen>
      <MtBottomNav active="turnos" />
    </>
  );
}

function InfoCard({ icon, label, value, styles }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; styles: ReturnType<typeof createStyles> }) {
  return (
    <MtCard style={styles.infoCard}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={22} color="#7C3AED" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </MtCard>
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

function createStyles(theme: MediturnosTheme) {
  const isDark = theme.mode === 'dark';
  return StyleSheet.create({
    screen: { gap: 14 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
    backButton: {
      width: 46,
      height: 46,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadow,
    },
    eyebrow: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 2.6, marginBottom: 3 },
    title: { color: theme.colors.ink, fontSize: 33, fontWeight: '900', letterSpacing: -0.6 },
    heroCard: {
      borderRadius: 28,
      padding: 20,
      backgroundColor: theme.colors.primary,
      gap: 14,
      shadowColor: theme.colors.primary,
      shadowOpacity: isDark ? 0.18 : 0.24,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6,
    },
    heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    heroTextBlock: { flex: 1, flexShrink: 1, minWidth: 0, width: 0 },
    heroStatusRow: { alignSelf: 'flex-start' },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 23,
      backgroundColor: 'rgba(255,255,255,0.20)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', letterSpacing: 0.4 },
    doctorName: { color: '#FFFFFF', backgroundColor: 'transparent', fontSize: 24, fontWeight: '900', letterSpacing: -0.3, lineHeight: 29, includeFontPadding: false },
    specialty: { color: 'rgba(255,255,255,0.82)', backgroundColor: 'transparent', fontSize: 17, fontWeight: '700', marginTop: 4, lineHeight: 21, includeFontPadding: false },
    grid: { flexDirection: 'row', gap: 12 },
    infoCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16, minHeight: 88 },
    infoIcon: {
      width: 44,
      height: 44,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(216,200,255,0.12)' : '#F3ECFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoLabel: { color: theme.colors.primary, fontSize: 13, fontWeight: '900', marginBottom: 4 },
    infoValue: { color: theme.colors.ink, backgroundColor: 'transparent', fontSize: 17, fontWeight: '800', lineHeight: 22, includeFontPadding: false },
    actionsCard: { gap: 10, marginTop: 4, paddingBottom: 6 },
    noticeBox: { borderRadius: 18, borderWidth: 1, padding: 14 },
    noticeSuccess: { backgroundColor: isDark ? '#14351F' : '#F0FDF4', borderColor: theme.colors.success },
    noticeWarning: { backgroundColor: isDark ? '#422B05' : '#FFFBEB', borderColor: theme.colors.warning },
    noticeError: { backgroundColor: isDark ? '#3F1111' : '#FEF2F2', borderColor: theme.colors.danger },
    noticeTitle: { fontWeight: '900', fontSize: 15, marginBottom: 4 },
    noticeMessage: { fontWeight: '700', lineHeight: 20 },
    noticeSuccessText: { color: isDark ? '#D1FAE5' : '#065F46' },
    noticeWarningText: { color: isDark ? '#FEF3C7' : '#92400E' },
    noticeErrorText: { color: isDark ? '#FEE2E2' : '#991B1B' },
  });
}
