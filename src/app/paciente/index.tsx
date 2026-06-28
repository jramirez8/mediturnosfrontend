import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../auth/authStore';
import { appointmentService, TurnoResponse } from '../../api/appointmentService';
import { userService, UserProfile } from '../../api/userService';
import { MtBottomNav, MtButton, MtCard, MtHeader, MtLoading, MtScreen, MtStat } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';
import { clearAppCache, purgeLegacyCache } from '../../db/cache';
import { logoutAndGoToLogin } from '../../utils/session';
import { useTranslation } from '../../i18n/languageStore';

type DashboardError = {
  profile?: string;
  appointments?: string;
};

function QuickCard({ title, subtitle, icon, color, onPress, featured, styles }: Readonly<{ title: string; subtitle: string; icon: string; color: string; onPress: () => void; featured?: boolean; styles: ReturnType<typeof createStyles> }>) {
  return (
    <Pressable style={[styles.quickCard, featured && styles.quickCardFeatured]} onPress={onPress}>
      <View style={[styles.quickIcon, { backgroundColor: `${color}1A` }]}>
        <Text style={[styles.quickIconText, { color }]}>{icon}</Text>
      </View>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

export default function PacienteHomeScreen() {
  const { usuarioId, pacienteId, logout } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [appointments, setAppointments] = useState<TurnoResponse[]>([]);
  const [errors, setErrors] = useState<DashboardError>({});
  const [loading, setLoading] = useState(true);
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const { t } = useTranslation();

  useEffect(() => {
    let alive = true;
    loadDashboard(alive).catch((error) => {
      if (!alive) return;
      setProfile(null);
      setAppointments([]);
      setErrors({ profile: readableError(error, 'Error inesperado al cargar el dashboard.') });
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [usuarioId, pacienteId]);

  const loadDashboard = async (alive = true) => {
    setLoading(true);
    setErrors({});

    try {
      await purgeLegacyCache();

      const nextErrors: DashboardError = {};

      // Perfil primero: sin perfil real no mostramos dashboard.
      try {
        const profileData = await userService.getProfile(usuarioId);
        if (!alive) return;
        setProfile(profileData);
      } catch (error: unknown) {
        if (!alive) return;
        setProfile(null);
        setAppointments([]);
        nextErrors.profile = readableError(error, 'No pudimos cargar tu perfil.');
        setErrors(nextErrors);
        return;
      }

      // Turnos después: si falla, NO debe romper la pantalla ni tapar logout.
      try {
        const appointmentsData = await appointmentService.getMyAppointments(pacienteId);
        if (!alive) return;
        setAppointments(appointmentsData);
      } catch (error: unknown) {
        if (!alive) return;
        setAppointments([]);
        nextErrors.appointments = readableError(error, 'No pudimos cargar tus turnos.');
      }

      if (!alive) return;
      setErrors(nextErrors);
    } finally {
      if (alive) setLoading(false);
    }
  };

  const hasBlockingError = !!errors.profile;

  const nextAppointment = useMemo(() => {
    return appointments
      .filter((turno) => !['CANCELADO', 'FINALIZADO'].includes(String(turno.estado).toUpperCase()))
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))[0];
  }, [appointments]);

  const upcomingCount = appointments.filter((turno) => !['CANCELADO', 'FINALIZADO'].includes(String(turno.estado).toUpperCase())).length;
  const doneCount = appointments.filter((turno) => String(turno.estado).toUpperCase() === 'FINALIZADO').length;

  const handleLogout = async () => {
    setLoading(false);
    setProfile(null);
    setAppointments([]);
    setErrors({});
    await logoutAndGoToLogin(logout);
  };

  const hardReset = async () => {
    await clearAppCache();
    await handleLogout();
  };

  if (loading) return <MtLoading text={t('common.loading')} />;

  if (hasBlockingError) {
    return (
      <MtScreen scroll>
        <MtHeader
          eyebrow={t('patient.eyebrow')}
          title={t('patient.profileErrorTitle')}
          subtitle={t('patient.profileErrorSub')}
        />
        <MtCard style={styles.errorCard}>
          <Text style={styles.errorTitle}>{t('common.errorTitle')}</Text>
          <Text style={styles.errorText}>{errors.profile}</Text>
          {errors.appointments ? <Text style={styles.errorText}>Turnos: {errors.appointments}</Text> : null}
          <View style={{ height: 14 }} />
          <MtButton title={t('common.retry')} onPress={loadDashboard} />
          <MtButton title={t('common.logout')} variant="danger" onPress={hardReset} style={{ marginTop: 10 }} />
        </MtCard>
      </MtScreen>
    );
  }

  const fullName = `${profile?.nombre ?? ''} ${profile?.apellido ?? ''}`.trim();
  const initials = `${profile?.nombre?.[0] ?? 'M'}${profile?.apellido?.[0] ?? 'T'}`;

  return (
    <>
      <MtScreen scroll>
        <MtHeader
          eyebrow={t('patient.eyebrow')}
          title={`${t('patient.hello')}, ${fullName} 👋`}
          subtitle={t('patient.subtitle')}
          right={
            <Pressable style={styles.avatar} onPress={() => router.push('/paciente/perfil')}>
              <Text style={styles.avatarText}>{initials}</Text>
            </Pressable>
          }
        />

        {errors.appointments ? (
          <MtCard style={styles.warningCard}>
            <Text style={styles.warningTitle}>{t('nav.appointments')}</Text>
            <Text style={styles.warningText}>{errors.appointments}</Text>
            <MtButton title={t('common.retry')} variant="secondary" onPress={loadDashboard} style={{ marginTop: 10 }} />
          </MtCard>
        ) : null}

        <View style={styles.statsRow}>
          <MtStat label={t('patient.nextAppointment')} value={upcomingCount} />
          <MtStat label="Atenciones" value={doneCount} tone="success" />
          <MtStat label="HC" value={profile?.numeroHistoriaClinica ?? `#${profile?.pacienteId ?? profile?.id}`} tone="warning" />
        </View>

        <MtCard style={styles.nextCard}>
          <View style={styles.cardTop}>
            <View>
              <Text style={styles.cardLabel}>{t('patient.nextAppointment')}</Text>
              <Text style={styles.nextTitle}>{nextAppointment ? nextAppointment.especialidad : t('patient.noNext')}</Text>
            </View>
            <Text style={styles.cardIcon}>📅</Text>
          </View>
          {nextAppointment ? (
            <>
              <Text style={styles.nextLine}>{nextAppointment.profesionalNombre}</Text>
              <Text style={styles.nextLine}>{nextAppointment.fecha} · {nextAppointment.hora} hs</Text>
              <Text style={styles.nextLine}>{nextAppointment.institucionNombre}</Text>
              <MtButton title="Ver detalle" onPress={() => router.push({ pathname: '/paciente/turno-detalle', params: { id: nextAppointment.id } })} style={{ marginTop: 16 }} />
            </>
          ) : (
            <>
              <Text style={styles.nextLine}>{t('patient.noNextHelp')}</Text>
              <MtButton title={t('patient.requestAppointment')} onPress={() => router.push('/paciente/solicitar')} style={{ marginTop: 16 }} />
            </>
          )}
        </MtCard>

        <Text style={styles.sectionTitle}>{t('patient.quick')}</Text>
        <View style={styles.grid}>
          <QuickCard title={t('patient.quickRequest')} subtitle={t('patient.quickRequestSub')} icon="＋" color={theme.colors.primary} onPress={() => router.push('/paciente/solicitar')} featured styles={styles} />
          <QuickCard title={t('patient.quickAppointments')} subtitle={t('patient.quickAppointmentsSub')} icon="📆" color={theme.colors.secondary} onPress={() => router.push('/paciente/turnos')} styles={styles} />
          <QuickCard title={t('patient.quickProfessionals')} subtitle={t('patient.quickProfessionalsSub')} icon="🩺" color={theme.colors.warning} onPress={() => router.push('/paciente/profesionales')} styles={styles} />
          <QuickCard title={t('patient.quickHistory')} subtitle={t('patient.quickHistorySub')} icon="📋" color={theme.colors.success} onPress={() => router.push('/paciente/historia')} styles={styles} />
          <QuickCard title={t('common.settings')} subtitle={t('patient.quickSettingsSub')} icon="⚙️" color={theme.colors.purple} onPress={() => router.push('/paciente/settings')} styles={styles} />
        </View>
      </MtScreen>
      <MtBottomNav active="home" />
    </>
  );

}


export function ErrorBoundary({ error, retry }: Readonly<{ error: Error; retry: () => void }>) {
  const logout = useAuthStore((state) => state.logout);
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const { t } = useTranslation();

  const leave = async () => {
    await logoutAndGoToLogin(logout);
  };

  return (
    <MtScreen scroll>
      <MtHeader
        eyebrow={t('patient.eyebrow')}
        title={t('patient.profileErrorTitle')}
        subtitle={t('patient.profileErrorSub')}
      />
      <MtCard style={styles.errorCard}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error.message}</Text>
        <View style={{ height: 14 }} />
        <MtButton title={t('common.retry')} onPress={retry} />
        <MtButton title={t('common.logout')} variant="danger" onPress={leave} style={{ marginTop: 10 }} />
      </MtCard>
    </MtScreen>
  );
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    avatar: { width: 52, height: 52, borderRadius: 19, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: theme.mode === 'dark' ? '#06201D' : 'white', fontSize: 18, fontWeight: '900' },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    nextCard: { marginBottom: 18 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    cardLabel: { color: theme.colors.muted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
    cardIcon: { fontSize: 28 },
    nextTitle: { color: theme.colors.ink, fontWeight: '900', fontSize: 21, marginTop: 3 },
    nextLine: { color: theme.colors.muted, lineHeight: 22, fontWeight: '600' },
    sectionTitle: { color: theme.colors.ink, fontWeight: '900', fontSize: 18, marginBottom: 12 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 },
    quickCard: { width: '48%', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 22, padding: 15, minHeight: 150, ...theme.shadow },
    quickCardFeatured: { borderColor: theme.colors.primary, backgroundColor: theme.mode === 'dark' ? '#24143E' : '#F8F5FF' },
    quickIcon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    quickIconText: { fontSize: 25, fontWeight: '900' },
    quickTitle: { color: theme.colors.ink, fontWeight: '900', fontSize: 15 },
    quickSubtitle: { color: theme.colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
    healthCard: { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border, marginTop: 12 },
    healthTitle: { color: theme.colors.primaryDark, fontWeight: '900', fontSize: 16 },
    healthText: { color: theme.colors.primaryDark, lineHeight: 20, marginTop: 6 },
    errorCard: { borderColor: theme.colors.danger, backgroundColor: theme.mode === 'dark' ? '#2B1113' : '#FFF1F2' },
    errorTitle: { color: theme.colors.danger, fontWeight: '900', fontSize: 18, marginBottom: 8 },
    errorText: { color: theme.colors.ink, lineHeight: 21, fontWeight: '700', marginTop: 4 },
    warningCard: { borderColor: theme.colors.warning, backgroundColor: theme.mode === 'dark' ? '#261A06' : '#FFFBEB', marginBottom: 14 },
    warningTitle: { color: theme.colors.warning, fontWeight: '900', fontSize: 16 },
    warningText: { color: theme.colors.ink, lineHeight: 20, marginTop: 4 },
  });
}
