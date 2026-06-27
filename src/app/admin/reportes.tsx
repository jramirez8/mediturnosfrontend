import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Share, Text, View } from 'react-native';
import { MtButton, MtCard, MtHeader, MtInput, MtLoading, MtNotice, MtScreen, MtStat } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { secretariaService } from '../../api/staffService';
import { adminService, AdminSummary } from '../../api/adminService';
import { TurnoResponse } from '../../api/appointmentService';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';
import { AdminNotice, AdminTabs, AdminTitle } from '../../components/admin/AdminUi';
import { todayLocalIso } from '../../utils/date';
import { feedbackService, TurnoFeedback } from '../../api/feedbackService';

type Range = 'TODOS' | 'HOY' | 'FUTUROS' | 'HISTORICO';

function dateKey(value?: string | null) {
  return String(value ?? '').slice(0, 10);
}
function todayKey() { return todayLocalIso(); }
function isFuture(value?: string | null) { return dateKey(value) >= todayKey(); }
function isPast(value?: string | null) { return dateKey(value) < todayKey(); }

function countBy(turnos: TurnoResponse[], getter: (t: TurnoResponse) => string | undefined | null) {
  return turnos.reduce<Record<string, number>>((acc, t) => {
    const key = String(getter(t) || 'Sin dato');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function topEntries(map: Record<string, number>, limit = 8) {
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, limit);
}


function csvEscape(value: unknown) {
  const text = String(value ?? '').replace(/"/g, '""');
  return `"${text}"`;
}

function buildCsv(turnos: TurnoResponse[]) {
  const headers = ['ID', 'Fecha', 'Hora', 'Paciente', 'Profesional', 'Especialidad', 'Institución', 'Estado'];
  const rows = turnos.map((t) => [t.id, t.fecha || dateKey(t.fechaHora), t.hora, t.pacienteNombre, t.profesionalNombre, t.especialidad, t.institucionNombre, t.estado]);
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}

export default function AdminReportesScreen() {
  const [turnos, setTurnos] = useState<TurnoResponse[]>([]);
  const [summary, setSummary] = useState<AdminSummary>({});
  const [feedback, setFeedback] = useState<TurnoFeedback[]>([]);
  const [range, setRange] = useState<Range>('TODOS');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const theme = useMtTheme();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [resumen, allTurnos, feedbackData] = await Promise.all([adminService.resumen(), secretariaService.turnos(), feedbackService.latest().catch(() => [])]);
      setSummary(resumen); setTurnos(allTurnos); setFeedback(feedbackData);
    } catch (e: any) { setError(readableError(e, 'No pudimos cargar reportes.')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return turnos.filter((t) => {
      const fecha = t.fecha || t.fechaHora;
      let matchRange = false;
      if (range === 'TODOS') matchRange = true;
      else if (range === 'HOY') matchRange = dateKey(fecha) === todayKey();
      else if (range === 'FUTUROS') matchRange = isFuture(fecha);
      else matchRange = isPast(fecha);
      const text = `${t.pacienteNombre} ${t.profesionalNombre} ${t.especialidad} ${t.institucionNombre} ${t.estado} ${t.fecha} ${t.hora}`.toLowerCase();
      return matchRange && (!q || text.includes(q));
    });
  }, [turnos, range, query]);

  const byStatus = useMemo(() => countBy(filtered, (t) => String(t.estado || 'SIN_ESTADO').toUpperCase()), [filtered]);
  const bySpecialty = useMemo(() => countBy(filtered, (t) => t.especialidad), [filtered]);
  const byProfessional = useMemo(() => countBy(filtered, (t) => t.profesionalNombre), [filtered]);
  const byInstitution = useMemo(() => countBy(filtered, (t) => t.institucionNombre), [filtered]);
  const byDate = useMemo(() => countBy(filtered, (t) => dateKey(t.fecha || t.fechaHora)), [filtered]);
  const cancellationRate = filtered.length ? Math.round(((byStatus.CANCELADO || 0) / filtered.length) * 100) : 0;
  const attendanceRate = filtered.length ? Math.round(((byStatus.ATENDIDO || 0) / filtered.length) * 100) : 0;
  const satisfactionAverage = feedback.length ? (feedback.reduce((sum, item) => sum + item.puntuacion, 0) / feedback.length).toFixed(1) : '—';
  const feedbackByProfessional = useMemo(() => {
    const grouped = feedback.reduce<Record<string, { total: number; count: number }>>((acc, item) => {
      const key = item.profesionalNombre || 'Profesional no informado';
      acc[key] = acc[key] || { total: 0, count: 0 };
      acc[key].total += item.puntuacion;
      acc[key].count += 1;
      return acc;
    }, {});
    return Object.entries(grouped).sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count));
  }, [feedback]);


  const exportCsv = async () => {
    try {
      const csv = buildCsv(filtered);
      const filename = `mediturnos-reportes-${todayLocalIso()}.csv`;
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        setNotice(`CSV descargado: ${filename}`);
        return;
      }
      await Share.share({ title: filename, message: csv });
      setNotice(`CSV generado para ${filtered.length} turnos.`);
    } catch (e: any) {
      setError(readableError(e, 'No pudimos exportar el CSV.'));
    }
  };

  if (loading) return <MtLoading text="Cargando reportes..." />;

  const Bar = ({ label, value, total }: { label: string; value: number; total: number }) => {
    const pct = total ? Math.max(5, Math.round((value / total) * 100)) : 0;
    return (
      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
          <Text style={{ color: theme.colors.ink, fontWeight: '800', flex: 1 }}>{label}</Text>
          <Text style={{ color: theme.colors.muted, fontWeight: '900' }}>{value}</Text>
        </View>
        <View style={{ height: 10, backgroundColor: theme.colors.primaryLight, borderRadius: 999, overflow: 'hidden', marginTop: 7 }}>
          <View style={{ width: `${pct}%`, height: 10, backgroundColor: theme.colors.primary, borderRadius: 999 }} />
        </View>
      </View>
    );
  };

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="ADMIN" title="Reportes" subtitle="Indicadores operativos de turnos y resumen del sistema." />
      {error ? <AdminNotice type="danger" title="No pudimos cargar reportes" message={error} onRetry={load} /> : null}
      {notice ? <MtNotice type="success" title="Exportación lista" message={notice} style={{ marginBottom: 14 }} /> : null}

      <MtCard style={{ marginBottom: 14 }}>
        <AdminTitle title="Filtros" subtitle="No altera datos: solo filtra la información cargada." />
        <AdminTabs value={range} onChange={setRange} options={[{ value: 'TODOS', label: 'Todos' }, { value: 'HOY', label: 'Hoy', tone: 'success' }, { value: 'FUTUROS', label: 'Próximos', tone: 'warning' }, { value: 'HISTORICO', label: 'Histórico', tone: 'muted' }]} />
        <MtInput label="Buscar" value={query} onChangeText={setQuery} placeholder="paciente, médico, especialidad, estado..." />
      </MtCard>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <MtStat label="Turnos filtrados" value={filtered.length} />
        <MtStat label="Confirmados" value={byStatus.CONFIRMADO || 0} tone="success" />
        <MtStat label="Cancelados" value={byStatus.CANCELADO || 0} tone="danger" />
        <MtStat label="Atendidos" value={byStatus.ATENDIDO || 0} tone="success" />
        <MtStat label="Ausentes" value={byStatus.AUSENTE || 0} tone="warning" />
        <MtStat label="Cancelación" value={`${cancellationRate}%`} tone={cancellationRate > 20 ? 'danger' : 'primary'} />
        <MtStat label="Atención" value={`${attendanceRate}%`} tone="success" />
        <MtStat label="Usuarios" value={summary.usuarios ?? 0} />
        <MtStat label="Satisfacción" value={`${satisfactionAverage}/5`} tone="success" />
      </View>

      <MtCard style={{ marginBottom: 14 }}>
        <AdminTitle title="Turnos por estado" />
        {topEntries(byStatus, 12).map(([label, value]) => <Bar key={label} label={label} value={value} total={filtered.length} />)}
        {!Object.keys(byStatus).length ? <Text style={{ color: theme.colors.muted }}>Sin datos para el filtro.</Text> : null}
      </MtCard>

      <MtCard style={{ marginBottom: 14 }}>
        <AdminTitle title="Especialidades más demandadas" />
        {topEntries(bySpecialty).map(([label, value]) => <Bar key={label} label={label} value={value} total={filtered.length} />)}
      </MtCard>

      <MtCard style={{ marginBottom: 14 }}>
        <AdminTitle title="Médicos con más turnos" />
        {topEntries(byProfessional).map(([label, value]) => <Bar key={label} label={label} value={value} total={filtered.length} />)}
      </MtCard>

      <MtCard style={{ marginBottom: 14 }}>
        <AdminTitle title="Instituciones" />
        {topEntries(byInstitution).map(([label, value]) => <Bar key={label} label={label} value={value} total={filtered.length} />)}
      </MtCard>

      <MtCard style={{ marginBottom: 14 }}>
        <AdminTitle title="Satisfacción por profesional" subtitle={`${feedback.length} valoración(es) registradas`} />
        {feedbackByProfessional.slice(0, 8).map(([name, values]) => (
          <View key={name} style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingVertical: 10 }}>
            <Text style={{ color: theme.colors.ink, fontWeight: '900' }}>{name}</Text>
            <Text style={{ color: theme.colors.primary, fontWeight: '900', marginTop: 3 }}>{(values.total / values.count).toFixed(1)}/5 · {values.count} valoración(es)</Text>
          </View>
        ))}
        {!feedback.length ? <Text style={{ color: theme.colors.muted }}>Todavía no hay valoraciones.</Text> : null}
      </MtCard>

      <MtCard style={{ marginBottom: 14 }}>
        <AdminTitle title="Comentarios recientes" />
        {feedback.slice(0, 8).map((item) => (
          <View key={item.id} style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingVertical: 10 }}>
            <Text style={{ color: theme.colors.primary, fontWeight: '900' }}>{item.profesionalNombre || 'Profesional'} · {item.puntuacion}/5</Text>
            <Text style={{ color: theme.colors.ink, fontWeight: '700', marginTop: 4 }}>{item.comentario || 'Sin comentario escrito.'}</Text>
          </View>
        ))}
      </MtCard>

      <MtCard style={{ marginBottom: 14 }}>
        <AdminTitle title="Actividad por fecha" />
        {topEntries(byDate, 10).map(([label, value]) => <Bar key={label} label={label || 'Sin fecha'} value={value} total={filtered.length} />)}
      </MtCard>

      <MtButton title="Exportar CSV filtrado" variant="secondary" onPress={exportCsv} disabled={!filtered.length} />
      <MtButton title="Actualizar reportes" onPress={load} variant="ghost" />
      <RoleBottomNav role="admin" active="reportes" />
    </MtScreen>
  );
}
