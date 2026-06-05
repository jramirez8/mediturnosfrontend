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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resumen, allTurnos] = await Promise.all([adminService.resumen(), secretariaService.turnos().catch(() => [])]);
      setSummary(resumen);
      setTurnos(allTurnos);
    } catch (e: any) {
      setError(readableError(e, 'No pudimos cargar el panel de administración.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const estado = useMemo(() => turnos.reduce<Record<string, number>>((acc, t) => {
    const key = String(t.estado || 'SIN_ESTADO').toUpperCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}), [turnos]);

  const turnosHoy = useMemo(() => turnos.filter((t) => isToday(t.fecha || t.fechaHora)).length, [turnos]);

  const stats = useMemo(() => [
    { label: 'Usuarios', value: summary.usuarios ?? 0 },
    { label: 'Pacientes', value: summary.pacientes ?? 0, tone: 'success' as const },
    { label: 'Médicos', value: summary.profesionales ?? 0 },
    { label: 'Secretarías', value: summary.secretarias ?? 0, tone: 'warning' as const },
    { label: 'Turnos hoy', value: turnosHoy, tone: 'success' as const },
    { label: 'Cancelados', value: estado.CANCELADO ?? 0, tone: 'danger' as const },
    { label: 'Catálogos', value: (summary.instituciones ?? 0) + (summary.especialidades ?? 0) + (summary.obrasSociales ?? 0), tone: 'warning' as const },
    { label: 'Atendidos', value: estado.ATENDIDO ?? 0, tone: 'success' as const },
  ], [summary, estado, turnosHoy]);

  if (loading) return <MtLoading text="Cargando panel admin real..." />;

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
      <MtHeader eyebrow="PANEL ADMIN" title={`Hola, ${nombre || 'Administrador'}`} subtitle="Centro de control real: altas, ediciones, bajas lógicas, catálogos y reportes del sistema." />

      {error ? <AdminNotice type="danger" title="Error cargando administración" message={error} onRetry={load} /> : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        {stats.map((stat) => <MtStat key={stat.label} label={stat.label} value={stat.value} tone={stat.tone} />)}
      </View>

      <MtCard style={{ marginBottom: 14 }}>
        <AdminTitle title="Acciones administrativas" subtitle="Todo lo que ves acá pega contra endpoints reales del backend. No hay panel de cartón." />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <ActionCard icon="👥" title="Usuarios" subtitle="Crear, editar, activar/desactivar y cambiar rol." path="/admin/usuarios" />
          <ActionCard icon="🩺" title="Personal" subtitle="Médicos, secretarías y pacientes desde una vista operativa." path="/admin/profesionales" />
          <ActionCard icon="▤" title="Catálogos" subtitle="Especialidades, obras sociales e instituciones." path="/admin/catalogos" />
          <ActionCard icon="📊" title="Reportes" subtitle="Indicadores por estado, especialidad y profesional." path="/admin/reportes" />
        </View>
      </MtCard>

      <MtCard style={{ marginBottom: 14 }}>
        <AdminTitle title="Estado de turnos" subtitle="Lectura operativa para detectar desvíos rápido." />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['PENDIENTE', 'CONFIRMADO', 'REPROGRAMADO', 'CANCELADO', 'ATENDIDO', 'AUSENTE'].map((key) => (
            <View key={key} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 }}>
              <Text style={{ color: theme.colors.ink, fontWeight: '900' }}>{estado[key] ?? 0}</Text>
              <Text style={{ color: theme.colors.muted, fontWeight: '700', fontSize: 11 }}>{key}</Text>
            </View>
          ))}
        </View>
      </MtCard>

      <MtButton title="Actualizar panel" onPress={load} variant="ghost" />
      <RoleBottomNav role="admin" active="home" />
    </MtScreen>
  );
}
