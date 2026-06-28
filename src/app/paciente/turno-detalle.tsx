import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { appointmentService, TurnoResponse } from '../../api/appointmentService';
import { MtBottomNav, MtButton, MtCard, MtLoading, MtNotice, MtPill, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { addAppointmentToDeviceCalendar } from '../../utils/calendar';
import { readableError } from '../../utils/errors';

type Notice = { type: 'success' | 'danger' | 'warning' | 'info'; title: string; message: string };

const FINAL_STATES = new Set(['FINALIZADO', 'ATENDIDO', 'CANCELADO', 'AUSENTE']);

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
  const scrollRef = useRef<ScrollView | null>(null);
  const id = Number(params.id ?? params.turnoId ?? 0);

  const [turno, setTurno] = useState<TurnoResponse | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const scrollTop = () => requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
  const showNotice = (next: Notice) => { setNotice(next); scrollTop(); };

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (!id) {
        showNotice({ type: 'danger', title: 'Turno inválido', message: 'Abrí el detalle desde Mis turnos para cargar información real.' });
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const detail = await appointmentService.getAppointmentDetail(id);
        if (alive) setTurno(detail);
      } catch (error: unknown) {
        if (alive) showNotice({ type: 'danger', title: 'No se pudo cargar el detalle', message: readableError(error, 'No tenés permiso o el turno ya no existe.') });
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => { alive = false; };
  }, [id]);

  const estado = String(turno?.estado ?? '').toUpperCase();
  const isFinal = FINAL_STATES.has(estado);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/paciente/turnos');
  };

  const handleAddCalendar = async () => {
    if (!turno) return;
    try {
      setActionLoading(true);
      await addAppointmentToDeviceCalendar(turno);
      showNotice({ type: 'success', title: 'Agregado al calendario', message: 'El turno se guardó con recordatorio 3 horas antes.' });
    } catch (error: unknown) {
      showNotice({ type: 'danger', title: 'No se pudo agregar', message: readableError(error, 'Revisá los permisos del calendario.') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    if (!turno?.id) return;
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
              showNotice({ type: 'success', title: 'Turno cancelado', message: 'Quedó guardado en tu historial.' });
            } catch (error: unknown) {
              showNotice({ type: 'danger', title: 'No se pudo cancelar', message: readableError(error, 'Intentá nuevamente en unos segundos.') });
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
      <MtScreen scroll scrollRef={scrollRef} style={styles.screen}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>AGENDA</Text>
            <Text style={styles.title}>Detalle de turno</Text>
          </View>
        </View>

        {!!notice && <MtNotice type={notice.type} title={notice.title} message={notice.message} style={{ marginBottom: 12 }} />}

        {turno === null ? (
          <MtCard style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={42} color={theme.colors.primary} />
            <Text style={styles.emptyTitle}>No pudimos cargar este turno</Text>
            <Text style={styles.emptySub}>Volvé a Mis turnos y abrí el detalle nuevamente.</Text>
            <MtButton title="Ir a Mis turnos" onPress={() => router.replace('/paciente/turnos')} style={{ marginTop: 12 }} />
          </MtCard>
        ) : (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(turno.profesionalNombre || 'Doctor')}</Text>
                </View>
                <View style={styles.heroTextBlock}>
                  <Text style={styles.doctorName} numberOfLines={2}>{turno.profesionalNombre || 'Profesional sin nombre'}</Text>
                  <Text style={styles.specialty} numberOfLines={2}>{turno.especialidad || 'Consulta médica'}</Text>
                </View>
              </View>
              <View style={styles.heroStatusRow}>
                <MtPill label={estado || 'SIN ESTADO'} tone={toneForStatus(estado)} />
              </View>
            </View>

            <View style={styles.grid}>
              <InfoCard icon="calendar-outline" label="Fecha" value={turno.fecha || 'Sin fecha'} styles={styles} />
              <InfoCard icon="time-outline" label="Hora" value={`${turno.hora || 'Sin hora'} hs`} styles={styles} />
            </View>

            <InfoCard icon="location-outline" label="Sede" value={turno.institucionNombre || 'Sin sede cargada'} styles={styles} />
            <InfoCard icon="checkmark-circle-outline" label="Estado" value={estado || 'SIN ESTADO'} styles={styles} />

            {!!turno.motivoConsulta && <InfoCard icon="chatbox-ellipses-outline" label="Motivo" value={turno.motivoConsulta} styles={styles} />}
            {!!turno.observaciones && <InfoCard icon="reader-outline" label="Observaciones" value={turno.observaciones} styles={styles} />}

            <View style={styles.actionsCard}>
              {!isFinal && (
                <MtButton title="Reprogramar turno" disabled={actionLoading} onPress={() => router.push({ pathname: '/paciente/reprogramar', params: { id: turno.id } })} />
              )}
              <MtButton title="Agregar al calendario" variant="secondary" loading={actionLoading} disabled={actionLoading} onPress={handleAddCalendar} />
              {!isFinal && <MtButton title="Cancelar turno" variant="danger" loading={actionLoading} disabled={actionLoading} onPress={handleCancel} />}
            </View>
          </>
        )}
        <MtBottomNav active="turnos" />
      </MtScreen>
  );
}

function InfoCard({ icon, label, value, styles }: Readonly<{ icon: keyof typeof Ionicons.glyphMap; label: string; value: string; styles: ReturnType<typeof createStyles> }>) {
  return (
    <MtCard style={styles.infoCard}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={22} color="#7C3AED" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </MtCard>
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
    heroTextBlock: { flex: 1, flexShrink: 1, minWidth: 0 },
    heroStatusRow: { alignSelf: 'flex-start' },
    avatar: { width: 66, height: 66, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
    avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
    doctorName: { color: '#FFFFFF', fontSize: 26, lineHeight: 31, fontWeight: '900', letterSpacing: -0.4, flexShrink: 1 },
    specialty: { color: 'rgba(255,255,255,0.82)', fontSize: 17, lineHeight: 22, fontWeight: '800', marginTop: 3, flexShrink: 1 },
    grid: { flexDirection: 'row', gap: 12 },
    infoCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 74 },
    infoIcon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(216,200,255,0.12)' : '#F3ECFF' },
    infoLabel: { color: theme.colors.muted, fontSize: 13, fontWeight: '800', marginBottom: 3 },
    infoValue: { color: theme.colors.ink, fontSize: 17, lineHeight: 22, fontWeight: '900', flexShrink: 1 },
    actionsCard: { gap: 12, marginTop: 6 },
    emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 30 },
    emptyTitle: { color: theme.colors.ink, fontSize: 22, fontWeight: '900', textAlign: 'center' },
    emptySub: { color: theme.colors.muted, fontSize: 15, lineHeight: 22, fontWeight: '700', textAlign: 'center' },
  });
}
