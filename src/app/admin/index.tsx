import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { MtButton, MtCard, MtHeader, MtLoading, MtScreen, MtStat } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { adminService, AdminSummary } from '../../api/adminService';
import { useAuthStore } from '../../auth/authStore';
import { useMtTheme } from '../../theme/themeStore';

export default function AdminDashboard() {
  const nombre = useAuthStore((s) => s.nombreCompleto);
  const [summary, setSummary] = useState<AdminSummary>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useMtTheme();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSummary(await adminService.resumen()); }
    catch (e: any) { setError(e?.response?.data?.message || e?.message || 'No pudimos cargar el resumen admin.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => [
    ['Usuarios', summary.usuarios ?? 0],
    ['Pacientes', summary.pacientes ?? 0],
    ['Médicos', summary.profesionales ?? 0],
    ['Secretarías', summary.secretarias ?? 0],
    ['Turnos', summary.turnos ?? 0],
    ['Instituciones', summary.instituciones ?? 0],
    ['Especialidades', summary.especialidades ?? 0],
    ['Obras sociales', summary.obrasSociales ?? 0],
  ] as const, [summary]);

  if (loading) return <MtLoading text="Cargando panel admin..." />;

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="PANEL ADMIN" title={`Hola, ${nombre || 'admin'}`} subtitle="Configuración general, catálogos y usuarios." />
      {error ? <MtCard style={{ borderColor: theme.colors.danger, marginBottom: 14 }}><Text style={{ color: theme.colors.danger, fontWeight: '900' }}>{error}</Text><MtButton title="Reintentar" onPress={load} style={{ marginTop: 12 }} /></MtCard> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        {stats.map(([label, value]) => <MtStat key={label} label={label} value={value} />)}
      </View>
      <MtCard>
        <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18 }}>Gestión</Text>
        <View style={{ gap: 10, marginTop: 14 }}>
          <MtButton title="Usuarios" onPress={() => router.push('/admin/usuarios')} />
          <MtButton title="Profesionales" variant="ghost" onPress={() => router.push('/admin/profesionales')} />
          <MtButton title="Catálogos" variant="ghost" onPress={() => router.push('/admin/catalogos')} />
          <MtButton title="Reportes" variant="ghost" onPress={() => router.push('/admin/reportes')} />
        </View>
      </MtCard>
      <RoleBottomNav role="admin" active="home" />
    </MtScreen>
  );
}
