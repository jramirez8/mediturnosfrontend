import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MtButton, MtCard, MtHeader, MtLoading, MtScreen, MtStat } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { adminService, AdminSummary } from '../../api/adminService';
import { systemService } from '../../api/systemService';
import { secretariaService } from '../../api/staffService';
import { TurnoResponse } from '../../api/appointmentService';
import { useAuthStore } from '../../auth/authStore';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';
import { AdminNotice, AdminTitle } from '../../components/admin/AdminUi';
import { useTranslation } from '../../i18n/languageStore';
import { todayLocalIso } from '../../utils/date';

function todayKey() {
  return todayLocalIso();
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
  const [diagnosticoOpen, setDiagnosticoOpen] = useState(false);
  const [diagnostico, setDiagnostico] = useState<Record<string, string> | null>(null);
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

  const checklist = [
    { label: 'Sedes cargadas', ok: (summary.instituciones ?? 0) > 0, path: '/admin/catalogos' },
    { label: 'Especialidades cargadas', ok: (summary.especialidades ?? 0) > 0, path: '/admin/catalogos' },
    { label: 'Médicos cargados', ok: (summary.profesionales ?? 0) > 0, path: '/admin/profesionales' },
    { label: 'Médicos con disponibilidad', ok: (summary.horariosAtencion ?? 0) > 0, path: '/admin/agenda-avanzada' },
    { label: 'Secretarías cargadas', ok: (summary.secretarias ?? 0) > 0, path: '/admin/profesionales' },
    { label: 'Pacientes cargados', ok: (summary.pacientes ?? 0) > 0, path: '/admin/usuarios' },
  ];

  const runDiagnostico = async () => {
    setDiagnostico({ sistema: 'PROBANDO' });
    try {
      const r = await systemService.diagnostico();
      setDiagnostico(r);
    } catch (e: any) {
      setDiagnostico({ error: readableError(e, 'No respondió el diagnóstico. Revisá Railway o el proxy de Vercel.') });
    }
  };

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

      <MtCard style={{ marginBottom: 14 }}>
        <AdminTitle title="Configuración inicial" subtitle="Checklist rápido para dejar la app lista después de limpiar la base." />
        {checklist.map((item) => (
          <Pressable key={item.label} onPress={() => router.push(item.path as any)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ color: theme.colors.ink, fontWeight: '900' }}>{item.ok ? '✅' : '❌'} {item.label}</Text>
            <Text style={{ color: theme.colors.primary, fontWeight: '900' }}>Ir</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => setDiagnosticoOpen((v) => !v)} style={{ alignSelf: 'flex-end', marginTop: 8, opacity: 0.55 }}>
          <Text style={{ color: theme.colors.muted, fontWeight: '800', fontSize: 12 }}>Diagnóstico discreto</Text>
        </Pressable>
        {diagnosticoOpen ? <View style={{ marginTop: 10 }}>
          <MtButton title="Probar sistema" onPress={runDiagnostico} variant="ghost" />
          {diagnostico ? <View style={{ marginTop: 8, gap: 6 }}>
            {Object.entries(diagnostico).map(([key, value]) => (
              <Text key={key} style={{ color: String(value).includes('OK') ? theme.colors.success : String(value).includes('ERROR') || key === 'error' ? theme.colors.danger : theme.colors.muted, fontWeight: '800', fontSize: 12 }}>
                {key}: {String(value)}
              </Text>
            ))}
          </View> : null}
        </View> : null}
      </MtCard>

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
          {['CONFIRMADO', 'CANCELADO', 'ATENDIDO', 'AUSENTE', 'REPROGRAMADO'].filter((key) => key !== 'REPROGRAMADO' || (estado[key] ?? 0) > 0).map((key) => (
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
