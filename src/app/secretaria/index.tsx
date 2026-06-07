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
import { useTranslation } from '../../i18n/languageStore';
import { todayLocalIso } from '../../utils/date';

export default function SecretariaDashboard() {
  const nombre = useAuthStore((s) => s.nombreCompleto);
  const [turnos, setTurnos] = useState<TurnoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useMtTheme();
  const { t, language } = useTranslation();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setTurnos(await secretariaService.turnos()); }
    catch (e: any) { setError(e?.response?.data?.message || e?.message || language === 'en' ? 'We could not load appointments.' : 'No pudimos cargar turnos.'); }
    finally { setLoading(false); }
  }, [language]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const today = todayLocalIso();
    const todayItems = turnos.filter((t) => (t.fechaHora || t.fecha || '').startsWith(today));
    const count = (estado: string) => turnos.filter((t) => String(t.estado).toUpperCase() === estado).length;
    return { today: todayItems.length, confirmed: count('CONFIRMADO'), cancelled: count('CANCELADO'), pending: count('PENDIENTE') + count('REPROGRAMADO') };
  }, [turnos]);

  if (loading) return <MtLoading text={t('common.loading')} />;

  return (
    <MtScreen scroll>
      <MtHeader eyebrow={t('secretary.panel')} title={`${t('patient.hello')}, ${nombre || t('role.secretary')}`} subtitle={t('secretary.subtitle')} />
      {error ? <MtCard style={{ borderColor: theme.colors.danger, marginBottom: 14 }}><Text style={{ color: theme.colors.danger, fontWeight: '900' }}>{error}</Text><MtButton title="Reintentar" onPress={load} style={{ marginTop: 12 }} /></MtCard> : null}
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <MtStat label={language === 'en' ? 'Today' : 'Hoy'} value={stats.today} />
        <MtStat label={language === 'en' ? 'Confirmed' : 'Confirmados'} value={stats.confirmed} tone="success" />
        <MtStat label={language === 'en' ? 'Pending' : 'Pend/Reprog'} value={stats.pending} tone="warning" />
        <MtStat label={language === 'en' ? 'Cancelled' : 'Cancelados'} value={stats.cancelled} tone="danger" />
      </View>
      <MtCard style={{ marginBottom: 14 }}>
        <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18 }}>{t('secretary.quickActions')}</Text>
        <View style={{ gap: 10, marginTop: 14 }}>
          <MtButton title={t('secretary.createAppointment')} onPress={() => router.push('/secretaria/nuevo-turno')} />
          <MtButton title={t('secretary.manageAppointments')} variant="ghost" onPress={() => router.push('/secretaria/turnos')} />
          <MtButton title={t('secretary.searchPatient')} variant="ghost" onPress={() => router.push('/secretaria/pacientes')} />
        </View>
      </MtCard>
      <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18, marginBottom: 10 }}>{t('secretary.latestAppointments')}</Text>
      {turnos.slice(0, 5).map((turno) => <TurnoCard key={turno.id} turno={turno} />)}
      <RoleBottomNav role="secretaria" active="home" />
    </MtScreen>
  );
}
