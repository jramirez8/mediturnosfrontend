import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MtButton, MtCard, MtHeader, MtLoading, MtNotice, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { agendaService, AgendaBloqueo, hasActiveScheduleForDay, HorarioAtencion } from '../../api/agendaService';
import { professionalService, Professional } from '../../api/professionalService';
import { appointmentService, AppointmentSlot } from '../../api/appointmentService';
import { useAuthStore } from '../../auth/authStore';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';

type DayStatus = 'outside' | 'past' | 'blocked' | 'withSlots' | 'weeklyNoSlots' | 'noSchedule';

type CalendarCell = {
  key: string;
  iso: string;
  label: string;
  inMonth: boolean;
  weekdayApi: string;
  weekdayShort: string;
  attends: boolean;
  blocked: boolean;
  past: boolean;
  slotCount: number;
  status: DayStatus;
};

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKDAY_OPTIONS = [
  { api: 'LUNES', short: 'Lun', label: 'Lunes' },
  { api: 'MARTES', short: 'Mar', label: 'Martes' },
  { api: 'MIERCOLES', short: 'Mié', label: 'Miércoles' },
  { api: 'JUEVES', short: 'Jue', label: 'Jueves' },
  { api: 'VIERNES', short: 'Vie', label: 'Viernes' },
  { api: 'SABADO', short: 'Sáb', label: 'Sábado' },
  { api: 'DOMINGO', short: 'Dom', label: 'Domingo' },
];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const JS_DAY_TO_API: Record<number, string> = { 0: 'DOMINGO', 1: 'LUNES', 2: 'MARTES', 3: 'MIERCOLES', 4: 'JUEVES', 5: 'VIERNES', 6: 'SABADO' };
const API_DAY_TO_SHORT = Object.fromEntries(WEEKDAY_OPTIONS.map((d) => [d.api, d.short]));
const API_DAY_TO_LABEL = Object.fromEntries(WEEKDAY_OPTIONS.map((d) => [d.api, d.label]));

function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayIso() { return toIsoDate(new Date()); }

function normalizeApiDay(value?: string) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
}

function isoFromDateTime(value?: string) { return String(value ?? '').slice(0, 10); }
function formatTime(value?: string) { return String(value ?? '').slice(0, 5); }
function formatDate(value?: string) {
  if (!value) return '';
  const [y, m, d] = value.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function slotsByDate(slots: AppointmentSlot[]) {
  return slots.reduce<Record<string, AppointmentSlot[]>>((acc, slot) => {
    if (!slot.fecha || slot.disponible === false) return acc;
    acc[slot.fecha] = acc[slot.fecha] ?? [];
    acc[slot.fecha].push(slot);
    return acc;
  }, {});
}

function chunkRows<T>(items: T[], size: number) {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

function calendarStatus(inMonth: boolean, past: boolean, blocked: boolean, slotCount: number, attends: boolean): DayStatus {
  if (!inMonth) return 'outside';
  if (past) return 'past';
  if (blocked) return 'blocked';
  if (slotCount > 0) return 'withSlots';
  if (attends) return 'weeklyNoSlots';
  return 'noSchedule';
}

function buildCalendarCells(monthCursor: Date, horarios: HorarioAtencion[], bloqueos: AgendaBloqueo[], slots: AppointmentSlot[]): CalendarCell[] {
  const attendsDays = new Set(horarios.filter((h) => h.activo !== false).map((h) => normalizeApiDay(h.diaSemana)));
  const blockedDates = new Set(bloqueos.map((b) => isoFromDateTime(b.fechaDesde)).filter(Boolean));
  const slotMap = slotsByDate(slots);
  const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const daysInMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate();
  const mondayOffset = (first.getDay() + 6) % 7;
  const cellsNeeded = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);
  const today = todayIso();

  return Array.from({ length: cellsNeeded }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = toIsoDate(date);
    const weekdayApi = JS_DAY_TO_API[date.getDay()];
    const inMonth = date.getMonth() === monthCursor.getMonth();
    const attends = attendsDays.has(weekdayApi);
    const blocked = blockedDates.has(iso);
    const past = iso < today;
    const slotCount = slotMap[iso]?.length ?? 0;
    const status = calendarStatus(inMonth, past, blocked, slotCount, attends);

    return {
      key: `${iso}-${index}`,
      iso,
      label: String(date.getDate()),
      inMonth,
      weekdayApi,
      weekdayShort: API_DAY_TO_SHORT[weekdayApi] ?? '',
      attends,
      blocked,
      past,
      slotCount,
      status,
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
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollToTop = () => setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 70);
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [horarios, setHorarios] = useState<HorarioAtencion[]>([]);
  const [bloqueos, setBloqueos] = useState<AgendaBloqueo[]>([]);
  const [slotsVisibles, setSlotsVisibles] = useState<AppointmentSlot[]>([]);
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => todayIso());
  const [selectedWeekday, setSelectedWeekday] = useState('LUNES');
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
    const [h, b, slots] = await Promise.all([
      agendaService.getHorarios(currentPiId),
      agendaService.getBloqueos(currentPiId),
      appointmentService.getDisponibilidad(currentPiId).catch(() => []),
    ]);
    setHorarios(h);
    setBloqueos(b);
    setSlotsVisibles(slots.filter((slot) => slot.disponible !== false));
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const professionals = await professionalService.getAll();
      const own = findOwnProfessional(professionals, profesionalId, profesionalInstitucionId, nombreCompleto);
      if (!own) {
        setProfessional(null); setHorarios([]); setBloqueos([]); setSlotsVisibles([]);
        setError('Tu cuenta médica todavía no está vinculada a una sede. Solicitá al administrador que complete la asignación.');
        return;
      }
      setProfessional(own);
      await loadAgenda(own);
    } catch (e: unknown) {
      setError(readableError(e, 'No pudimos cargar la disponibilidad.'));
    } finally { setLoading(false); }
  }, [profesionalId, profesionalInstitucionId, nombreCompleto, loadAgenda]);

  useEffect(() => { load(); }, [load]);

  const calendarCells = useMemo(() => buildCalendarCells(monthCursor, horarios, bloqueos, slotsVisibles), [monthCursor, horarios, bloqueos, slotsVisibles]);
  const calendarRows = useMemo(() => chunkRows(calendarCells, 7), [calendarCells]);
  const selectedCell = useMemo(() => calendarCells.find((c) => c.iso === selectedDate), [calendarCells, selectedDate]);
  const selectedDateWeekday = selectedCell?.weekdayApi ?? JS_DAY_TO_API[new Date(`${selectedDate}T00:00:00`).getDay()];
  const selectedDaySchedules = useMemo(() => horarios.filter((h) => normalizeApiDay(h.diaSemana) === selectedDateWeekday && h.activo !== false), [horarios, selectedDateWeekday]);
  const selectedDayBlocked = useMemo(() => bloqueos.some((b) => isoFromDateTime(b.fechaDesde) === selectedDate), [bloqueos, selectedDate]);
  const selectedDaySlots = useMemo(() => slotsVisibles.filter((s) => s.fecha === selectedDate && s.disponible !== false), [slotsVisibles, selectedDate]);
  const selectedDayMessage = selectedDayBlocked
    ? 'Bloqueado'
    : selectedDaySlots.length
      ? `${selectedDaySlots.length} cupos libres`
      : selectedDaySchedules.length
        ? 'Atiende, pero sin cupos libres'
        : 'Sin atención semanal';
  const horariosOrdenados = useMemo(() => [...horarios].sort((a, b) => WEEKDAY_OPTIONS.findIndex((d) => d.api === normalizeApiDay(a.diaSemana)) - WEEKDAY_OPTIONS.findIndex((d) => d.api === normalizeApiDay(b.diaSemana))), [horarios]);
  const availableDaysCount = useMemo(() => new Set(slotsVisibles.map((slot) => slot.fecha)).size, [slotsVisibles]);

  const moveMonth = (delta: number) => setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  const addHorario = async () => {
    if (!professional || !selectedWeekday) return;
    if (hasActiveScheduleForDay(horarios, selectedWeekday)) {
      setError('Ya existe un horario para este día. Eliminá el actual antes de cargar uno nuevo.');
      setNotice(null);
      scrollToTop();
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(desde) || !/^\d{2}:\d{2}$/.test(hasta)) {
      setError('Usá formato HH:mm. Ejemplo: 09:00 a 13:00.');
      setNotice(null);
      scrollToTop();
      return;
    }
    if (!Number.isFinite(Number(duracion)) || Number(duracion) < 10) {
      setError('La duración debe ser de al menos 10 minutos. Para turnos normales usá 30.');
      setNotice(null);
      scrollToTop();
      return;
    }
    try {
      setSaving(true); setNotice(null); setError(null);
      await agendaService.createHorario({
        profesionalInstitucionId: piId,
        especialidadId: Number(professional.especialidadId ?? 1),
        diaSemana: selectedWeekday,
        horaDesde: desde,
        horaHasta: hasta,
        duracionTurnoMin: Number(duracion) || 30,
        activo: true,
      });
      setNotice(`Listo: ${API_DAY_TO_LABEL[selectedWeekday]} queda disponible de ${desde} a ${hasta}.`);
      scrollToTop();
      await loadAgenda(professional);
    } catch (e: unknown) { setError(readableError(e, 'No pudimos guardar el horario semanal.')); scrollToTop(); }
    finally { setSaving(false); }
  };

  const blockSelectedDate = async () => {
    if (!professional || !selectedDate) return;
    try {
      setSaving(true); setNotice(null); setError(null);
      await agendaService.createBloqueo({ profesionalInstitucionId: piId, fechaDesde: `${selectedDate}T00:00`, fechaHasta: `${selectedDate}T23:59`, motivo: bloqueoMotivo || 'No atiende este día' });
      setNotice(`Listo: ${formatDate(selectedDate)} quedó bloqueado.`);
      scrollToTop();
      await loadAgenda(professional);
    } catch (e: unknown) { setError(readableError(e, 'No pudimos bloquear la fecha.')); scrollToTop(); }
    finally { setSaving(false); }
  };

  const deleteHorario = async (id: number) => {
    if (!professional) return;
    try { setSaving(true); setNotice(null); setError(null); await agendaService.deleteHorario(id); setNotice('Horario eliminado.'); scrollToTop(); await loadAgenda(professional); }
    catch (e: unknown) { setError(readableError(e, 'No pudimos eliminar el horario.')); scrollToTop(); }
    finally { setSaving(false); }
  };

  const deleteBloqueo = async (id: number) => {
    if (!professional) return;
    try { setSaving(true); setNotice(null); setError(null); await agendaService.deleteBloqueo(id); setNotice('Bloqueo eliminado.'); scrollToTop(); await loadAgenda(professional); }
    catch (e: unknown) { setError(readableError(e, 'No pudimos eliminar el bloqueo.')); scrollToTop(); }
    finally { setSaving(false); }
  };

  if (loading) return <MtLoading text="Cargando disponibilidad..." />;

  return (
    <MtScreen scroll scrollRef={scrollRef}>
      <MtHeader eyebrow="MÉDICO" title="Mi disponibilidad" subtitle="Definí días de atención, bloqueos y revisá exactamente qué fechas ve el paciente." />
      {!!error && <MtNotice type="danger" title="Revisá la disponibilidad" message={error} style={{ marginBottom: 14 }} />}
      {!!notice && <MtNotice type="success" title="Disponibilidad actualizada" message={notice} />}

      <MtCard style={{ gap: 10, marginBottom: 14 }}>
        <Text style={styles.title}>Profesional logueado</Text>
        <Text style={styles.item}>{professional ? `${professional.apellido}, ${professional.nombre} · ${professional.especialidad}` : 'Sin profesional vinculado'}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statPill}><Text style={styles.statNumber}>{horarios.length}</Text><Text style={styles.statLabel}>horarios</Text></View>
          <View style={styles.statPill}><Text style={styles.statNumber}>{availableDaysCount}</Text><Text style={styles.statLabel}>días con cupos</Text></View>
          <View style={styles.statPill}><Text style={styles.statNumber}>{bloqueos.length}</Text><Text style={styles.statLabel}>bloqueos</Text></View>
        </View>
        <Text style={styles.muted}>El calendario no pinta “a ojo”: combina plan semanal, bloqueos y cupos libres reales de /api/turnos/disponibilidad.</Text>
      </MtCard>

      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <Text style={styles.title}>1. Plan semanal de atención</Text>
        <Text style={styles.muted}>Marcá el horario habitual de cada día. Solo puede existir un registro por día; para cambiarlo, eliminá el actual y cargá el nuevo.</Text>
        <View style={styles.weekPicker}>{WEEKDAY_OPTIONS.map((d) => (
          <Pressable key={d.api} onPress={() => setSelectedWeekday(d.api)} style={[styles.weekChip, selectedWeekday === d.api && styles.weekChipActive]}>
            <Text style={[styles.weekChipText, selectedWeekday === d.api && styles.weekChipTextActive]}>{d.short}</Text>
          </Pressable>
        ))}</View>
        <View style={styles.row}>
          <Field label="Desde" value={desde} setValue={setDesde} styles={styles} />
          <Field label="Hasta" value={hasta} setValue={setHasta} styles={styles} />
          <Field label="Min" value={duracion} setValue={setDuracion} styles={styles} />
        </View>
        <MtButton title="Guardar horario semanal" onPress={addHorario} loading={saving} disabled={!professional || saving} />
      </MtCard>

      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <View style={styles.calendarTop}>
          <Pressable onPress={() => moveMonth(-1)} style={styles.monthButton}><Text style={styles.monthButtonText}>‹</Text></Pressable>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={styles.monthTitle}>{MONTHS[monthCursor.getMonth()]} {monthCursor.getFullYear()}</Text>
            <Text style={styles.monthSubtitle}>Tocá un día para ver detalle o bloquearlo</Text>
          </View>
          <Pressable onPress={() => moveMonth(1)} style={styles.monthButton}><Text style={styles.monthButtonText}>›</Text></Pressable>
        </View>

        <View style={styles.weekRow}>{WEEKDAYS.map((d) => <Text key={d} style={styles.weekDay}>{d}</Text>)}</View>
        <View style={styles.calendarGrid}>{calendarRows.map((row) => (
          <View key={row.map((cell) => cell.key).join('|')} style={styles.calendarRow}>{row.map((cell) => {
            const selected = cell.iso === selectedDate;
            return (
              <CalendarDay key={cell.key} cell={cell} selected={selected} styles={styles} onPress={() => cell.inMonth && setSelectedDate(cell.iso)} />
            );
          })}</View>
        ))}</View>

        <View style={styles.legendGrid}>
          <LegendDot color={theme.colors.success} text="Con cupos" styles={styles} />
          <LegendDot color={theme.colors.warning} text="Horario sin cupos" styles={styles} />
          <LegendDot color={theme.colors.danger} text="Bloqueado" styles={styles} />
          <LegendDot color={theme.colors.soft} text="Sin atención / pasado" styles={styles} />
        </View>
      </MtCard>

      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <Text style={styles.title}>Día seleccionado: {formatDate(selectedDate)}</Text>
        <Text style={styles.muted}>{API_DAY_TO_LABEL[selectedDateWeekday]} · {selectedDayMessage}</Text>
        {!!selectedDaySchedules.length && <View style={styles.detailBox}>{selectedDaySchedules.map((h) => <Text key={h.id} style={styles.detailText}>• {formatTime(h.horaDesde)} a {formatTime(h.horaHasta)} · cada {h.duracionTurnoMin} min</Text>)}</View>}
        {!!selectedDaySlots.length && <View style={styles.detailBox}><Text style={styles.detailTitle}>Primeros cupos visibles</Text>{selectedDaySlots.slice(0, 6).map((slot) => <Text key={`${slot.fecha}-${slot.hora}`} style={styles.detailText}>• {formatTime(slot.hora)}</Text>)}</View>}
        <Field label="Motivo bloqueo" value={bloqueoMotivo} setValue={setBloqueoMotivo} styles={styles} />
        <MtButton title="Bloquear solamente esta fecha" variant="secondary" onPress={blockSelectedDate} loading={saving} disabled={!professional || saving || selectedDayBlocked} />
      </MtCard>

      <MtCard style={{ gap: 10, marginBottom: 14 }}>
        <Text style={styles.title}>Horarios vigentes</Text>
        {horariosOrdenados.map((h) => (
          <View key={h.id} style={styles.listRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.item}>{API_DAY_TO_LABEL[normalizeApiDay(h.diaSemana)] ?? h.diaSemana}</Text>
              <Text style={styles.muted}>{formatTime(h.horaDesde)} a {formatTime(h.horaHasta)} · cada {h.duracionTurnoMin} min</Text>
            </View>
            <Pressable onPress={() => deleteHorario(h.id)} disabled={saving}><Text style={styles.deleteText}>Eliminar</Text></Pressable>
          </View>
        ))}
        {!horarios.length && <Text style={styles.muted}>Todavía no tenés horarios cargados.</Text>}
      </MtCard>

      <MtCard style={{ gap: 10, marginBottom: 14 }}>
        <Text style={styles.title}>Bloqueos cargados</Text>
        {bloqueos.map((b) => (
          <View key={b.id} style={styles.listRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.item}>{formatDate(isoFromDateTime(b.fechaDesde))}</Text>
              <Text style={styles.muted}>{b.motivo || 'Sin motivo'}</Text>
            </View>
            <Pressable onPress={() => deleteBloqueo(b.id)} disabled={saving}><Text style={styles.deleteText}>Eliminar</Text></Pressable>
          </View>
        ))}
        {!bloqueos.length && <Text style={styles.muted}>No hay bloqueos.</Text>}
      </MtCard>

      <MtCard style={{ gap: 10, marginBottom: 90 }}>
        <Text style={styles.title}>Cupos que verá el paciente</Text>
        {slotsVisibles.slice(0, 8).map((s) => <Text key={`${s.fecha}-${s.hora}`} style={styles.muted}>• {formatDate(s.fecha)} a las {formatTime(s.hora)}</Text>)}
        {!slotsVisibles.length && <Text style={styles.muted}>No hay cupos visibles todavía. Cargá horarios semanales o revisá bloqueos.</Text>}
      </MtCard>

      <RoleBottomNav role="medico" active="disponibilidad" />
    </MtScreen>
  );
}

function CalendarDay({ cell, selected, styles, onPress }: { cell: CalendarCell; selected: boolean; styles: ReturnType<typeof createStyles>; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!cell.inMonth}
      style={[
        styles.dayCell,
        cell.status === 'outside' && styles.dayOut,
        cell.status === 'past' && styles.dayPast,
        cell.status === 'withSlots' && styles.dayWithSlots,
        cell.status === 'weeklyNoSlots' && styles.dayWeeklyNoSlots,
        cell.status === 'blocked' && styles.dayBlocked,
        selected && styles.daySelected,
      ]}
    >
      <Text style={[
        styles.dayText,
        cell.status === 'withSlots' && styles.dayWithSlotsText,
        cell.status === 'weeklyNoSlots' && styles.dayWeeklyNoSlotsText,
        cell.status === 'blocked' && styles.dayBlockedText,
        selected && styles.daySelectedText,
      ]}>{cell.label}</Text>
      {cell.status === 'withSlots' && <Text style={styles.dayMeta}>{cell.slotCount}</Text>}
      {cell.status === 'weeklyNoSlots' && <Text style={styles.dayMeta}>0</Text>}
      {cell.status === 'blocked' && <Text style={styles.dayMeta}>×</Text>}
    </Pressable>
  );
}

function LegendDot({ color, text, styles }: { color: string; text: string; styles: ReturnType<typeof createStyles> }) {
  return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendText}>{text}</Text></View>;
}

function Field({ label, value, setValue, styles }: { label: string; value: string; setValue: (v: string) => void; styles: ReturnType<typeof createStyles> }) {
  return <View style={{ flex: 1 }}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={setValue} style={styles.input} placeholderTextColor="#8B7AA8" /></View>;
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    title: { color: theme.colors.ink, fontWeight: '900', fontSize: 18 },
    muted: { color: theme.colors.muted, fontWeight: '700', lineHeight: 21 },
    item: { color: theme.colors.ink, fontWeight: '900', lineHeight: 22, flex: 1, fontSize: 15 },
    row: { flexDirection: 'row', gap: 10 },
    statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    statPill: { minWidth: 90, flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 18, backgroundColor: theme.colors.surfaceMuted, borderWidth: 1, borderColor: theme.colors.border },
    statNumber: { color: theme.colors.primary, fontWeight: '900', fontSize: 20 },
    statLabel: { color: theme.colors.muted, fontWeight: '800', fontSize: 12, marginTop: 2 },
    weekPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    weekChip: { minWidth: 54, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted, alignItems: 'center' },
    weekChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primaryDark },
    weekChipText: { color: theme.colors.muted, fontWeight: '900' },
    weekChipTextActive: { color: '#FFFFFF' },
    calendarTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    monthButton: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface },
    monthButtonText: { color: theme.colors.primary, fontSize: 26, fontWeight: '900', marginTop: -2 },
    monthTitle: { color: theme.colors.ink, fontWeight: '900', fontSize: 20, textAlign: 'center' },
    monthSubtitle: { color: theme.colors.muted, fontWeight: '800', fontSize: 11, marginTop: 2, textAlign: 'center' },
    weekRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
    weekDay: { flex: 1, textAlign: 'center', color: theme.colors.muted, fontWeight: '900', fontSize: 12 },
    calendarGrid: { gap: 6 },
    calendarRow: { flexDirection: 'row', gap: 6 },
    dayCell: { flex: 1, minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceMuted, borderWidth: 1.5, borderColor: theme.colors.border, position: 'relative' },
    dayOut: { opacity: 0.14, backgroundColor: theme.colors.surface, borderColor: 'transparent' },
    dayPast: { opacity: 0.46, backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
    dayWithSlots: { backgroundColor: theme.mode === 'dark' ? 'rgba(74,222,128,0.16)' : '#ECFDF3', borderColor: theme.colors.success },
    dayWeeklyNoSlots: { backgroundColor: theme.mode === 'dark' ? 'rgba(251,191,36,0.14)' : '#FFF7ED', borderColor: theme.colors.warning },
    dayBlocked: { backgroundColor: theme.mode === 'dark' ? 'rgba(248,113,113,0.15)' : '#FEF2F2', borderColor: theme.colors.danger },
    daySelected: { borderWidth: 3, borderColor: theme.colors.primary, transform: [{ scale: 1.02 }] },
    dayText: { color: theme.colors.soft, fontWeight: '900', fontSize: 15 },
    dayWithSlotsText: { color: theme.colors.success },
    dayWeeklyNoSlotsText: { color: theme.colors.warning },
    dayBlockedText: { color: theme.colors.danger },
    daySelectedText: { color: theme.colors.ink },
    dayMeta: { position: 'absolute', right: 6, bottom: 4, color: theme.colors.muted, fontWeight: '900', fontSize: 10 },
    legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: '44%' },
    legendDot: { width: 8, height: 8, borderRadius: 99 },
    legendText: { color: theme.colors.muted, fontWeight: '800', fontSize: 11 },
    detailBox: { borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 12, backgroundColor: theme.colors.surfaceMuted, gap: 4 },
    detailTitle: { color: theme.colors.ink, fontWeight: '900', marginBottom: 2 },
    detailText: { color: theme.colors.muted, fontWeight: '800', lineHeight: 20 },
    fieldLabel: { color: theme.colors.muted, fontWeight: '900', marginBottom: 6 },
    input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingHorizontal: 12, minHeight: 46, color: theme.colors.ink, backgroundColor: theme.colors.surfaceMuted, fontWeight: '800' },
    listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 10, paddingTop: 4 },
    deleteText: { color: theme.colors.danger, fontWeight: '900' },
    error: { color: theme.colors.danger, fontWeight: '900', lineHeight: 20 },
    success: { color: theme.colors.success, fontWeight: '900', lineHeight: 20 },
  });
}
