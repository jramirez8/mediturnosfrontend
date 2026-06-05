import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MtButton, MtCard, MtHeader, MtLoading, MtScreen, MtStat } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { adminService, AdminSummary } from '../../api/adminService';
import { secretariaService } from '../../api/staffService';
import { TurnoResponse } from '../../api/appointmentService';
import { useAuthStore } from '../../auth/authStore';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';
import { AdminNotice, AdminTitle } from '../../components/admin/AdminUi';
import { useTranslation } from '../../i18n/languageStore';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isToday(date?: string | null) {
  return String(date ?? '').slice(0, 10) === todayKey();
}

export default function AdminDashboard() {
  const nombre = useAuthStore((s) => s.nombreCompleto);
  const [summary, setSummary] = useState<AdminSummary>({});
  const [turnos, setTurnos] = useState<TurnoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useMtTheme();
  const { t, language } = useTranslation();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resumen, allTurnos] = await Promise.all([adminService.resumen(), secretariaService.turnos().catch(() => [])]);
      setSummary(resumen);
      setTurnos(allTurnos);
    } catch (e: any) {
      setError(readableError(e, language === 'en' ? 'We could not load the administration panel.' : 'No pudimos cargar el panel de administración.'));
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => { load(); }, [load]);

  const estado = useMemo(() => turnos.reduce<Record<string, number>>((acc, t) => {
    const key = String(t.estado || 'SIN_ESTADO').toUpperCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}), [turnos]);

  const turnosHoy = useMemo(() => turnos.filter((t) => isToday(t.fecha || t.fechaHora)).length, [turnos]);

  const stats = useMemo(() => [
    { label: t('nav.users'), value: summary.usuarios ?? 0 },
    { label: t('nav.patients'), value: summary.pacientes ?? 0, tone: 'success' as const },
    { label: t('nav.doctors'), value: summary.profesionales ?? 0 },
    { label: language === 'en' ? 'Secretaries' : 'Secretarías', value: summary.secretarias ?? 0, tone: 'warning' as const },
    { label: language === 'en' ? 'Today' : 'Turnos hoy', value: turnosHoy, tone: 'success' as const },
    { label: language === 'en' ? 'Cancelled' : 'Cancelados', value: estado.CANCELADO ?? 0, tone: 'danger' as const },
    { label: t('nav.catalogs'), value: (summary.instituciones ?? 0) + (summary.especialidades ?? 0) + (summary.obrasSociales ?? 0), tone: 'warning' as const },
    { label: language === 'en' ? 'Completed' : 'Atendidos', value: estado.ATENDIDO ?? 0, tone: 'success' as const },
  ], [summary, estado, turnosHoy, t, language]);

  if (loading) return <MtLoading text={t('common.loading')} />;

  const ActionCard = ({ title, subtitle, icon, path, danger }: { title: string; subtitle: string; icon: string; path: string; danger?: boolean }) => (
    <Pressable onPress={() => router.push(path as any)} style={{ width: '48%' }}>
      <MtCard style={{ minHeight: 138, borderColor: danger ? theme.colors.danger : theme.colors.border }}>
        <Text style={{ fontSize: 28 }}>{icon}</Text>
        <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 16, marginTop: 10 }}>{title}</Text>
        <Text style={{ color: theme.colors.muted, marginTop: 5, lineHeight: 18, fontSize: 12 }}>{subtitle}</Text>
      </MtCard>
    </Pressable>
  );

  return (
    <MtScreen scroll>
      <MtHeader eyebrow={t('admin.panel')} title={`${t('patient.hello')}, ${nombre || t('role.admin')}`} subtitle={t('admin.subtitle')} />

      {error ? <AdminNotice type="danger" title={language === 'en' ? 'Administration could not be loaded' : 'Error cargando administración'} message={error} onRetry={load} /> : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        {stats.map((stat) => <MtStat key={stat.label} label={stat.label} value={stat.value} tone={stat.tone} />)}
      </View>

      <MtCard style={{ marginBottom: 14 }}>
        <AdminTitle title={t('admin.actions')} subtitle={t('admin.actionsSub')} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <ActionCard icon="👥" title={t('nav.users')} subtitle={language === 'en' ? 'Create, edit, activate/deactivate and change roles.' : 'Crear, editar, activar/desactivar y cambiar rol.'} path="/admin/usuarios" />
          <ActionCard icon="🩺" title={language === 'en' ? 'Staff' : 'Personal'} subtitle={language === 'en' ? 'Doctors, secretaries and patients from one operational view.' : 'Médicos, secretarías y pacientes desde una vista operativa.'} path="/admin/profesionales" />
          <ActionCard icon="▤" title={t('nav.catalogs')} subtitle={language === 'en' ? 'Specialties, health insurance and institutions.' : 'Especialidades, obras sociales e instituciones.'} path="/admin/catalogos" />
          <ActionCard icon="📊" title={t('nav.reports')} subtitle={language === 'en' ? 'Indicators by status, specialty and professional.' : 'Indicadores por estado, especialidad y profesional.'} path="/admin/reportes" />
          <ActionCard icon="🗓️" title={language === 'en' ? 'Availability' : 'Disponibilidad'} subtitle={language === 'en' ? 'Working hours, slot duration and blocked dates.' : 'Horarios de atención, duración y bloqueos.'} path="/admin/agenda-avanzada" />
          <ActionCard icon="🧾" title={language === 'en' ? 'Audit' : 'Auditoría'} subtitle={language === 'en' ? 'Track relevant system actions.' : 'Seguimiento de acciones importantes.'} path="/admin/auditoria" />
        </View>
      </MtCard>

      <MtCard style={{ marginBottom: 14 }}>
        <AdminTitle title={t('admin.appointmentStatus')} subtitle={t('admin.appointmentStatusSub')} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['PENDIENTE', 'CONFIRMADO', 'REPROGRAMADO', 'CANCELADO', 'ATENDIDO', 'AUSENTE'].map((key) => (
            <View key={key} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 }}>
              <Text style={{ color: theme.colors.ink, fontWeight: '900' }}>{estado[key] ?? 0}</Text>
              <Text style={{ color: theme.colors.muted, fontWeight: '700', fontSize: 11 }}>{key}</Text>
            </View>
          ))}
        </View>
      </MtCard>

      <MtButton title={t('admin.refresh')} onPress={load} variant="ghost" />
      <RoleBottomNav role="admin" active="home" />
    </MtScreen>
  );
}
