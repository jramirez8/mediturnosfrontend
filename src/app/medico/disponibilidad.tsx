import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MtButton, MtCard, MtHeader, MtLoading, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { agendaService, AgendaBloqueo, HorarioAtencion } from '../../api/agendaService';
import { professionalService, Professional } from '../../api/professionalService';
import { useAuthStore } from '../../auth/authStore';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';

type CalendarCell = {
  key: string;
  iso: string;
  label: string;
  inMonth: boolean;
  weekday: string;
  attends: boolean;
  blocked: boolean;
};

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const JS_DAY_TO_API: Record<number, string> = {
  0: 'DOMINGO',
  1: 'LUNES',
  2: 'MARTES',
  3: 'MIERCOLES',
  4: 'JUEVES',
  5: 'VIERNES',
  6: 'SABADO',
};

function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeApiDay(value?: string) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

function isoFromDateTime(value?: string) {
  return String(value ?? '').slice(0, 10);
}

function buildCalendarCells(monthCursor: Date, horarios: HorarioAtencion[], bloqueos: AgendaBloqueo[]): CalendarCell[] {
  const attendsDays = new Set(horarios.filter((h) => h.activo !== false).map((h) => normalizeApiDay(h.diaSemana)));
  const blockedDates = new Set(bloqueos.map((b) => isoFromDateTime(b.fechaDesde)).filter(Boolean));
  const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = toIsoDate(date);
    const weekday = JS_DAY_TO_API[date.getDay()];
    return {
      key: iso,
      iso,
      label: String(date.getDate()),
      inMonth: date.getMonth() === monthCursor.getMonth(),
      weekday,
      attends: attendsDays.has(weekday),
      blocked: blockedDates.has(iso),
    };
  });
}

function findOwnProfessional(professionals: Professional[], professionalId?: string | null, professionalInstitutionId?: string | null, nombreCompleto?: string | null) {
  const profId = professionalId ? Number(professionalId) : null;
  const profInstId = professionalInstitutionId ? Number(professionalInstitutionId) : null;
  if (profInstId) {
    const found = professionals.find((p) => Number(p.profesionalInstitucionId ?? p.id) === profInstId);
    if (found) return found;
  }
  if (profId) {
    const found = professionals.find((p) => Number(p.id) === profId);
    if (found) return found;
  }
  const normalizedName = String(nombreCompleto ?? '').toLowerCase();
  if (normalizedName) {
    const found = professionals.find((p) => normalizedName.includes(String(p.nombre).toLowerCase()) && normalizedName.includes(String(p.apellido).toLowerCase()));
    if (found) return found;
  }
  return null;
}

export default function MedicoDisponibilidadScreen() {
  const profesionalId = useAuthStore((s) => s.profesionalId);
  const profesionalInstitucionId = useAuthStore((s) => s.profesionalInstitucionId);
  const nombreCompleto = useAuthStore((s) => s.nombreCompleto);
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [horarios, setHorarios] = useState<HorarioAtencion[]>([]);
  const [bloqueos, setBloqueos] = useState<AgendaBloqueo[]>([]);
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [desde, setDesde] = useState('09:00');
  const [hasta, setHasta] = useState('13:00');
  const [duracion, setDuracion] = useState('30');
  const [bloqueoMotivo, setBloqueoMotivo] = useState('No atiende este día');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const piId = Number(professional?.profesionalInstitucionId ?? professional?.id);

  const loadAgenda = useCallback(async (p: Professional) => {
    const currentPiId = Number(p.profesionalInstitucionId ?? p.id);
    const [h, b] = await Promise.all([agendaService.getHorarios(currentPiId), agendaService.getBloqueos(currentPiId)]);
    setHorarios(h);
    setBloqueos(b);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const professionals = await professionalService.getAll();
      const own = findOwnProfessional(professionals, profesionalId, profesionalInstitucionId, nombreCompleto);
      if (!own) {
        setProfessional(null);
        setHorarios([]);
        setBloqueos([]);
        setError('No pudimos vincular este usuario médico con un profesional/sede. Revisá que el login devuelva profesionalId o profesionalInstitucionId.');
        return;
      }
      setProfessional(own);
      await loadAgenda(own);
    } catch (e: any) {
      setError(readableError(e, 'No pudimos cargar la disponibilidad.'));
    } finally {
      setLoading(false);
    }
  }, [profesionalId, profesionalInstitucionId, nombreCompleto, loadAgenda]);

  useEffect(() => { load(); }, [load]);

  const calendarCells = useMemo(() => buildCalendarCells(monthCursor, horarios, bloqueos), [monthCursor, horarios, bloqueos]);
  const selectedCell = useMemo(() => calendarCells.find((c) => c.iso === selectedDate), [calendarCells, selectedDate]);
  const selectedWeekday = selectedCell?.weekday ?? JS_DAY_TO_API[new Date(`${selectedDate}T00:00:00`).getDay()];
  const selectedDaySchedules = useMemo(() => horarios.filter((h) => normalizeApiDay(h.diaSemana) === selectedWeekday), [horarios, selectedWeekday]);
  const selectedDayBlocked = useMemo(() => bloqueos.some((b) => isoFromDateTime(b.fechaDesde) === selectedDate), [bloqueos, selectedDate]);

  const moveMonth = (delta: number) => setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  const addHorarioForSelectedDay = async () => {
    if (!professional || !selectedWeekday) return;
    try {
      setSaving(true);
      setNotice(null);
      setError(null);
      await agendaService.createHorario({
        profesionalInstitucionId: piId,
        especialidadId: Number(professional.especialidadId ?? 1),
        diaSemana: selectedWeekday,
        horaDesde: desde,
        horaHasta: hasta,
        duracionTurnoMin: Number(duracion) || 30,
        activo: true,
      });
      setNotice(`Listo: ${selectedWeekday.toLowerCase()} agregado como día de atención.`);
      await loadAgenda(professional);
    } catch (e: any) {
      setError(readableError(e, 'No pudimos guardar el día de atención.'));
    } finally {
      setSaving(false);
    }
  };

  const blockSelectedDate = async () => {
    if (!professional || !selectedDate) return;
    try {
      setSaving(true);
      setNotice(null);
      setError(null);
      await agendaService.createBloqueo({
        profesionalInstitucionId: piId,
        fechaDesde: `${selectedDate}T00:00`,
        fechaHasta: `${selectedDate}T23:59`,
        motivo: bloqueoMotivo || 'No atiende este día',
      });
      setNotice(`Listo: ${selectedDate} quedó bloqueado.`);
      await loadAgenda(professional);
    } catch (e: any) {
      setError(readableError(e, 'No pudimos bloquear la fecha.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteHorario = async (id: number) => {
    if (!professional) return;
    try {
      setSaving(true);
      setNotice(null);
      setError(null);
      await agendaService.deleteHorario(id);
      setNotice('Horario eliminado.');
      await loadAgenda(professional);
    } catch (e: any) {
      setError(readableError(e, 'No pudimos eliminar el horario.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteBloqueo = async (id: number) => {
    if (!professional) return;
    try {
      setSaving(true);
      setNotice(null);
      setError(null);
      await agendaService.deleteBloqueo(id);
      setNotice('Bloqueo eliminado.');
      await loadAgenda(professional);
    } catch (e: any) {
      setError(readableError(e, 'No pudimos eliminar el bloqueo.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <MtLoading text="Cargando disponibilidad..." />;

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="MÉDICO" title="Mi disponibilidad" subtitle="Marcá los días que atendés. Los pacientes verán estos días al pedir turno." />
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!!notice && <Text style={styles.success}>{notice}</Text>}

      <MtCard style={{ gap: 10, marginBottom: 14 }}>
        <Text style={styles.title}>Profesional logueado</Text>
        <Text style={styles.item}>{professional ? `${professional.apellido}, ${professional.nombre} · ${professional.especialidad}` : 'Sin profesional vinculado'}</Text>
        <Text style={styles.muted}>El calendario usa la disponibilidad real de agenda: horarios por día de semana y bloqueos por fecha puntual.</Text>
      </MtCard>

      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <View style={styles.calendarTop}>
          <Pressable onPress={() => moveMonth(-1)} style={styles.monthButton}><Text style={styles.monthButtonText}>‹</Text></Pressable>
          <Text style={styles.monthTitle}>{MONTHS[monthCursor.getMonth()]} {monthCursor.getFullYear()}</Text>
          <Pressable onPress={() => moveMonth(1)} style={styles.monthButton}><Text style={styles.monthButtonText}>›</Text></Pressable>
        </View>
        <View style={styles.weekRow}>{WEEKDAYS.map((d) => <Text key={d} style={styles.weekDay}>{d}</Text>)}</View>
        <View style={styles.calendarGrid}>
          {calendarCells.map((cell) => {
            const selected = cell.iso === selectedDate;
            const available = cell.attends && !cell.blocked;
            return (
              <Pressable key={cell.key} onPress={() => setSelectedDate(cell.iso)} style={[styles.dayCell, !cell.inMonth && styles.dayOut, available && styles.dayAvailable, cell.blocked && styles.dayBlocked, selected && styles.daySelected]}>
                <Text style={[styles.dayText, available && styles.dayAvailableText, cell.blocked && styles.dayBlockedText, selected && styles.daySelectedText]}>{cell.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.legendRow}>
          <Text style={styles.legend}>● Atiende</Text>
          <Text style={styles.legendBlocked}>● Bloqueado</Text>
        </View>
      </MtCard>

      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <Text style={styles.title}>Fecha seleccionada: {selectedDate}</Text>
        <Text style={styles.muted}>{selectedWeekday} · {selectedDayBlocked ? 'Bloqueada' : selectedDaySchedules.length ? 'Con atención configurada' : 'Sin atención configurada'}</Text>
        <View style={styles.row}>
          <Field label="Desde" value={desde} setValue={setDesde} styles={styles} />
          <Field label="Hasta" value={hasta} setValue={setHasta} styles={styles} />
          <Field label="Min" value={duracion} setValue={setDuracion} styles={styles} />
        </View>
        <MtButton title="Marcar este día como día de atención" onPress={addHorarioForSelectedDay} loading={saving} disabled={!professional || saving} />
        <Field label="Motivo bloqueo" value={bloqueoMotivo} setValue={setBloqueoMotivo} styles={styles} />
        <MtButton title="Bloquear solamente esta fecha" variant="secondary" onPress={blockSelectedDate} loading={saving} disabled={!professional || saving} />
      </MtCard>

      <MtCard style={{ gap: 10, marginBottom: 14 }}>
        <Text style={styles.title}>Horarios vigentes</Text>
        {horarios.map((h) => (
          <View key={h.id} style={styles.listRow}>
            <Text style={styles.item}>• {h.diaSemana}: {h.horaDesde} a {h.horaHasta} · {h.duracionTurnoMin} min</Text>
            <Pressable onPress={() => deleteHorario(h.id)} disabled={saving}><Text style={styles.deleteText}>Eliminar</Text></Pressable>
          </View>
        ))}
        {!horarios.length && <Text style={styles.muted}>Todavía no tenés horarios cargados.</Text>}
      </MtCard>

      <MtCard style={{ gap: 10, marginBottom: 90 }}>
        <Text style={styles.title}>Bloqueos cargados</Text>
        {bloqueos.map((b) => (
          <View key={b.id} style={styles.listRow}>
            <Text style={styles.item}>• {b.fechaDesde} → {b.fechaHasta} · {b.motivo || 'Sin motivo'}</Text>
            <Pressable onPress={() => deleteBloqueo(b.id)} disabled={saving}><Text style={styles.deleteText}>Eliminar</Text></Pressable>
          </View>
        ))}
        {!bloqueos.length && <Text style={styles.muted}>No hay bloqueos.</Text>}
      </MtCard>
      <RoleBottomNav role="medico" active="disponibilidad" />
    </MtScreen>
  );
}

function Field({ label, value, setValue, styles }: { label: string; value: string; setValue: (v: string) => void; styles: ReturnType<typeof createStyles> }) {
  return <View style={{ flex: 1 }}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={setValue} style={styles.input} placeholderTextColor="#8B7AA8" /></View>;
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    title: { color: theme.colors.ink, fontWeight: '900', fontSize: 17 },
    muted: { color: theme.colors.muted, fontWeight: '700', lineHeight: 20 },
    item: { color: theme.colors.ink, fontWeight: '700', lineHeight: 22, flex: 1 },
    row: { flexDirection: 'row', gap: 10 },
    calendarTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    monthButton: { width: 42, height: 42, borderRadius: 15, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface },
    monthButtonText: { color: theme.colors.primary, fontSize: 24, fontWeight: '900' },
    monthTitle: { color: theme.colors.ink, fontWeight: '900', fontSize: 17 },
    weekRow: { flexDirection: 'row', marginBottom: 2 },
    weekDay: { flex: 1, textAlign: 'center', color: theme.colors.muted, fontWeight: '900', fontSize: 11 },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    dayCell: { width: '13.05%', aspectRatio: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceMuted, borderWidth: 1, borderColor: theme.colors.border },
    dayOut: { opacity: 0.45 },
    dayAvailable: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
    dayBlocked: { backgroundColor: theme.mode === 'dark' ? '#3F1111' : '#FEF2F2', borderColor: theme.colors.danger },
    daySelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primaryDark },
    dayText: { color: theme.colors.soft, fontWeight: '900' },
    dayAvailableText: { color: theme.colors.primaryDark },
    dayBlockedText: { color: theme.colors.danger },
    daySelectedText: { color: theme.mode === 'dark' ? '#06201D' : '#FFFFFF' },
    legendRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
    legend: { color: theme.colors.primary, fontWeight: '900', fontSize: 12 },
    legendBlocked: { color: theme.colors.danger, fontWeight: '900', fontSize: 12 },
    fieldLabel: { color: theme.colors.muted, fontWeight: '900', marginBottom: 6 },
    input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingHorizontal: 12, minHeight: 46, color: theme.colors.ink, backgroundColor: theme.colors.bg },
    listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 9 },
    deleteText: { color: theme.colors.danger, fontWeight: '900' },
    error: { color: theme.colors.danger, fontWeight: '900', marginBottom: 12, lineHeight: 20 },
    success: { color: theme.colors.success, fontWeight: '900', marginBottom: 12, lineHeight: 20 },
  });
}
