import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MtButton, MtCard, MtHeader, MtLoading, MtNotice, MtScreen, MtStat } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { agendaService, AgendaBloqueo, HorarioAtencion } from '../../api/agendaService';
import { professionalService, Professional } from '../../api/professionalService';
import { appointmentService, AppointmentSlot } from '../../api/appointmentService';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';
import {
  MONTH_NAMES,
  WEEKDAY_OPTIONS,
  countSlotsInRange,
  dateTimeIsoLocal,
  formatLocalDate,
  formatTime,
  isValidTimeRange,
  isoFromDateTime,
  normalizeApiDay,
  normalizeTimeInput,
  parseIsoDateLocal,
  todayLocalIso,
  toLocalIsoDate,
  weekdayApiFromIso,
} from '../../utils/date';

type CalendarCell = {
  key: string;
  iso: string;
  label: string;
  inMonth: boolean;
  weekdayApi: string;
  past: boolean;
  attends: boolean;
  blocked: boolean;
  slotsCount: number;
  theoreticalCount: number;
  status: 'out' | 'past' | 'blocked' | 'available' | 'scheduledNoSlots' | 'free';
};

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const API_DAY_TO_LABEL = Object.fromEntries(WEEKDAY_OPTIONS.map((d) => [d.api, d.label]));
const API_DAY_TO_SHORT = Object.fromEntries(WEEKDAY_OPTIONS.map((d) => [d.api, d.short]));

function schedulePiId(p?: Professional | null) {
  return Number(p?.profesionalInstitucionId ?? p?.id ?? 0);
}

function isBlockedDate(dateIso: string, bloqueos: AgendaBloqueo[]) {
  return bloqueos.some((b) => {
    const start = isoFromDateTime(b.fechaDesde);
    const end = isoFromDateTime(b.fechaHasta) || start;
    return !!start && dateIso >= start && dateIso <= end;
  });
}

function slotsForDate(slots: AppointmentSlot[], iso: string) {
  return slots.filter((s) => String(s.fecha ?? s.fechaHora ?? '').slice(0, 10) === iso && s.disponible !== false);
}

function schedulesForDate(horarios: HorarioAtencion[], iso: string) {
  const weekday = weekdayApiFromIso(iso);
  return horarios.filter((h) => h.activo !== false && normalizeApiDay(h.diaSemana) === weekday);
}

function expectedSlotsForDate(horarios: HorarioAtencion[], iso: string) {
  return schedulesForDate(horarios, iso).reduce((total, h) => total + countSlotsInRange(h.horaDesde, h.horaHasta, h.duracionTurnoMin), 0);
}

function buildCalendarCells(monthCursor: Date, horarios: HorarioAtencion[], bloqueos: AgendaBloqueo[], slots: AppointmentSlot[]): CalendarCell[] {
  const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);
  const today = todayLocalIso();

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = toLocalIsoDate(date);
    const weekdayApi = weekdayApiFromIso(iso);
    const inMonth = date.getMonth() === monthCursor.getMonth();
    const blocked = isBlockedDate(iso, bloqueos);
    const daySchedules = schedulesForDate(horarios, iso);
    const attends = daySchedules.length > 0;
    const slotsCount = slotsForDate(slots, iso).length;
    const theoreticalCount = expectedSlotsForDate(horarios, iso);
    const past = iso < today;
    let status: CalendarCell['status'] = 'free';
    if (!inMonth) status = 'out';
    else if (past) status = 'past';
    else if (blocked) status = 'blocked';
    else if (slotsCount > 0) status = 'available';
    else if (attends) status = 'scheduledNoSlots';

    return {
      key: `${iso}-${index}`,
      iso,
      label: String(date.getDate()),
      inMonth,
      weekdayApi,
      past,
      attends,
      blocked,
      slotsCount,
      theoreticalCount,
      status,
    };
  });
}

function sortHorarios(horarios: HorarioAtencion[]) {
  return [...horarios].sort((a, b) => {
    const dayA = WEEKDAY_OPTIONS.findIndex((d) => d.api === normalizeApiDay(a.diaSemana));
    const dayB = WEEKDAY_OPTIONS.findIndex((d) => d.api === normalizeApiDay(b.diaSemana));
    if (dayA !== dayB) return dayA - dayB;
    return String(a.horaDesde).localeCompare(String(b.horaDesde));
  });
}

function summarizeDate(cell?: CalendarCell) {
  if (!cell) return 'Seleccioná una fecha.';
  if (cell.blocked) return 'Fecha bloqueada: los pacientes no deberían ver cupos.';
  if (cell.slotsCount > 0) return `${cell.slotsCount} cupo${cell.slotsCount === 1 ? '' : 's'} visible${cell.slotsCount === 1 ? '' : 's'} para pacientes.`;
  if (cell.attends) return 'Tiene horario semanal, pero no hay cupos visibles. Puede estar completo o fuera del rango de búsqueda del backend.';
  return 'Sin atención configurada para este día.';
}

function validateHorario(desde: string, hasta: string, duracion: string) {
  const cleanDesde = normalizeTimeInput(desde);
  const cleanHasta = normalizeTimeInput(hasta);
  const minutes = Number(duracion);
  if (!cleanDesde || !cleanHasta) return 'Usá horarios válidos en formato HH:mm. Ejemplo: 09:00.';
  if (!isValidTimeRange(cleanDesde, cleanHasta)) return 'La hora “Hasta” tiene que ser posterior a “Desde”.';
  if (!Number.isFinite(minutes) || minutes < 10 || minutes > 180) return 'La duración tiene que estar entre 10 y 180 minutos.';
  return null;
}

export default function MedicoDisponibilidadScreen() {
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const scrollRef = useRef<ScrollView | null>(null);

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [horarios, setHorarios] = useState<HorarioAtencion[]>([]);
  const [bloqueos, setBloqueos] = useState<AgendaBloqueo[]>([]);
  const [slotsVisibles, setSlotsVisibles] = useState<AppointmentSlot[]>([]);
  const [monthCursor, setMonthCursor] = useState(() => parseIsoDateLocal(todayLocalIso()));
  const [selectedDate, setSelectedDate] = useState(() => todayLocalIso());
  const [selectedWeekday, setSelectedWeekday] = useState(() => weekdayApiFromIso(todayLocalIso()));
  const [desde, setDesde] = useState('09:00');
  const [hasta, setHasta] = useState('13:00');
  const [duracion, setDuracion] = useState('30');
  const [editingHorarioId, setEditingHorarioId] = useState<number | null>(null);
  const [bloqueoDesde, setBloqueoDesde] = useState('00:00');
  const [bloqueoHasta, setBloqueoHasta] = useState('23:59');
  const [bloqueoMotivo, setBloqueoMotivo] = useState('No atiende este día');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'info' | 'warning'; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const piId = schedulePiId(professional);

  const scrollTop = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
  }, []);

  const loadAgenda = useCallback(async (p: Professional) => {
    const currentPiId = schedulePiId(p);
    const [h, b, slots] = await Promise.all([
      agendaService.getHorarios(currentPiId),
      agendaService.getBloqueos(currentPiId),
      appointmentService.getDisponibilidad(currentPiId).catch(() => []),
    ]);
    setHorarios(h);
    setBloqueos(b);
    setSlotsVisibles(slots);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const own = await professionalService.getMe();
      setProfessional(own);
      await loadAgenda(own);
    } catch (e: any) {
      setError(readableError(e, 'No pudimos vincular este usuario médico con un profesional/sede. Revisá que el login devuelva profesionalId o profesionalInstitucionId.'));
      setProfessional(null);
      setHorarios([]);
      setBloqueos([]);
      setSlotsVisibles([]);
    } finally {
      setLoading(false);
    }
  }, [loadAgenda]);

  useEffect(() => { load(); }, [load]);

  const calendarCells = useMemo(() => buildCalendarCells(monthCursor, horarios, bloqueos, slotsVisibles), [monthCursor, horarios, bloqueos, slotsVisibles]);
  const selectedCell = useMemo(() => calendarCells.find((c) => c.iso === selectedDate), [calendarCells, selectedDate]);
  const selectedDateWeekday = selectedCell?.weekdayApi ?? weekdayApiFromIso(selectedDate);
  const selectedDaySchedules = useMemo(() => schedulesForDate(horarios, selectedDate), [horarios, selectedDate]);
  const selectedDaySlots = useMemo(() => slotsForDate(slotsVisibles, selectedDate), [slotsVisibles, selectedDate]);
  const horariosOrdenados = useMemo(() => sortHorarios(horarios), [horarios]);
  const bloqueosOrdenados = useMemo(() => [...bloqueos].sort((a, b) => String(a.fechaDesde).localeCompare(String(b.fechaDesde))), [bloqueos]);
  const stats = useMemo(() => {
    const availableDays = calendarCells.filter((c) => c.inMonth && c.status === 'available').length;
    const blockedDays = calendarCells.filter((c) => c.inMonth && c.status === 'blocked').length;
    const configuredDays = new Set(horarios.filter((h) => h.activo !== false).map((h) => normalizeApiDay(h.diaSemana))).size;
    return { availableDays, blockedDays, configuredDays, slots: slotsVisibles.length };
  }, [calendarCells, horarios, slotsVisibles.length]);

  const moveMonth = (delta: number) => setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  const startEditHorario = (h: HorarioAtencion) => {
    setEditingHorarioId(h.id);
    setSelectedWeekday(normalizeApiDay(h.diaSemana));
    setDesde(formatTime(h.horaDesde) || '09:00');
    setHasta(formatTime(h.horaHasta) || '13:00');
    setDuracion(String(h.duracionTurnoMin || 30));
    setNotice({ type: 'info', text: 'Editando horario semanal. Guardá los cambios o cancelá la edición.' });
    scrollTop();
  };

  const resetHorarioForm = () => {
    setEditingHorarioId(null);
    setDesde('09:00');
    setHasta('13:00');
    setDuracion('30');
  };

  const saveHorario = async () => {
    if (!professional || !selectedWeekday) return;
    const validation = validateHorario(desde, hasta, duracion);
    if (validation) {
      setError(validation);
      setNotice(null);
      scrollTop();
      return;
    }

    const payload = {
      profesionalInstitucionId: piId,
      especialidadId: Number(professional.especialidadId ?? 1),
      diaSemana: selectedWeekday,
      horaDesde: normalizeTimeInput(desde),
      horaHasta: normalizeTimeInput(hasta),
      duracionTurnoMin: Number(duracion),
      activo: true,
    };

    try {
      setSaving(true);
      setNotice(null);
      setError(null);
      if (editingHorarioId) {
        await agendaService.updateHorario(editingHorarioId, payload);
        setNotice({ type: 'success', text: `Horario actualizado: ${API_DAY_TO_LABEL[selectedWeekday]} de ${payload.horaDesde} a ${payload.horaHasta}.` });
      } else {
        await agendaService.createHorario(payload);
        setNotice({ type: 'success', text: `Horario creado: ${API_DAY_TO_LABEL[selectedWeekday]} de ${payload.horaDesde} a ${payload.horaHasta}.` });
      }
      resetHorarioForm();
      await loadAgenda(professional);
    } catch (e: any) {
      setError(readableError(e, 'No pudimos guardar el horario semanal.'));
    } finally {
      setSaving(false);
      scrollTop();
    }
  };

  const blockSelectedDate = async () => {
    if (!professional || !selectedDate) return;
    const cleanDesde = normalizeTimeInput(bloqueoDesde) || '00:00';
    const cleanHasta = normalizeTimeInput(bloqueoHasta) || '23:59';
    if (!isValidTimeRange(cleanDesde, cleanHasta) && !(cleanDesde === '00:00' && cleanHasta === '23:59')) {
      setError('El bloqueo necesita un rango horario válido. Para día completo usá 00:00 a 23:59.');
      setNotice(null);
      scrollTop();
      return;
    }

    try {
      setSaving(true);
      setNotice(null);
      setError(null);
      await agendaService.createBloqueo({
        profesionalInstitucionId: piId,
        fechaDesde: dateTimeIsoLocal(selectedDate, cleanDesde),
        fechaHasta: dateTimeIsoLocal(selectedDate, cleanHasta),
        motivo: bloqueoMotivo || 'No atiende este día',
      });
      setNotice({ type: 'success', text: `${formatLocalDate(selectedDate)} quedó bloqueado de ${cleanDesde} a ${cleanHasta}.` });
      await loadAgenda(professional);
    } catch (e: any) {
      setError(readableError(e, 'No pudimos bloquear la fecha.'));
    } finally {
      setSaving(false);
      scrollTop();
    }
  };

  const deleteHorario = async (id: number) => {
    if (!professional) return;
    try {
      setSaving(true);
      setNotice(null);
      setError(null);
      await agendaService.deleteHorario(id);
      setNotice({ type: 'success', text: 'Horario eliminado.' });
      await loadAgenda(professional);
    } catch (e: any) {
      setError(readableError(e, 'No pudimos eliminar el horario.'));
    } finally {
      setSaving(false);
      scrollTop();
    }
  };

  const deleteBloqueo = async (id: number) => {
    if (!professional) return;
    try {
      setSaving(true);
      setNotice(null);
      setError(null);
      await agendaService.deleteBloqueo(id);
      setNotice({ type: 'success', text: 'Bloqueo eliminado.' });
      await loadAgenda(professional);
    } catch (e: any) {
      setError(readableError(e, 'No pudimos eliminar el bloqueo.'));
    } finally {
      setSaving(false);
      scrollTop();
    }
  };

  if (loading) return <MtLoading text="Cargando disponibilidad..." />;

  return (
    <MtScreen scroll scrollRef={scrollRef}>
      <MtHeader eyebrow="MÉDICO" title="Mi disponibilidad" subtitle="Configurá días de atención reales, bloqueos y cupos visibles para pacientes." />

      {!!error && <MtNotice type="danger" title="Atención" message={error} style={{ marginBottom: 14 }} />}
      {!!notice && <MtNotice type={notice.type} title="Listo" message={notice.text} style={{ marginBottom: 14 }} />}

      <MtCard style={{ gap: 10, marginBottom: 14 }}>
        <Text style={styles.title}>Profesional logueado</Text>
        <Text style={styles.item}>{professional ? `${professional.apellido}, ${professional.nombre} · ${professional.especialidad}` : 'Sin profesional vinculado'}</Text>
        <Text style={styles.muted}>{professional?.institucion || 'Institución no informada'}</Text>
        <Text style={styles.help}>El calendario se calcula con horarios semanales, bloqueos y cupos reales devueltos por disponibilidad. Si una fecha tiene horario pero no cupos, queda marcada como “sin cupos visibles”.</Text>
      </MtCard>

      <View style={styles.statsRow}>
        <MtStat label="Días con cupos" value={stats.availableDays} tone="success" />
        <MtStat label="Bloqueos" value={stats.blockedDays} tone="danger" />
        <MtStat label="Días semana" value={stats.configuredDays} />
        <MtStat label="Cupos visibles" value={stats.slots} tone="warning" />
      </View>

      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <Text style={styles.title}>{editingHorarioId ? 'Editar horario semanal' : '1. Plan semanal de atención'}</Text>
        <Text style={styles.help}>Cargá rangos semanales. El paciente solo debería poder reservar en fechas derivadas de estos horarios, salvo bloqueos o agenda llena.</Text>
        <View style={styles.weekPicker}>{WEEKDAY_OPTIONS.map((d) => (
          <Pressable key={d.api} onPress={() => setSelectedWeekday(d.api)} style={[styles.weekChip, selectedWeekday === d.api && styles.weekChipActive]}>
            <Text style={[styles.weekChipText, selectedWeekday === d.api && styles.weekChipTextActive]}>{d.short}</Text>
          </Pressable>
        ))}</View>
        <View style={styles.row}>
          <Field label="Desde" value={desde} setValue={setDesde} styles={styles} placeholder="09:00" />
          <Field label="Hasta" value={hasta} setValue={setHasta} styles={styles} placeholder="13:00" />
          <Field label="Min" value={duracion} setValue={setDuracion} styles={styles} placeholder="30" keyboardType="number-pad" />
        </View>
        <View style={styles.inlineButtons}>
          <MtButton title={editingHorarioId ? 'Guardar cambios' : 'Guardar horario semanal'} onPress={saveHorario} loading={saving} disabled={!professional || saving} style={{ flex: 1 }} />
          {!!editingHorarioId && <MtButton title="Cancelar edición" variant="ghost" onPress={resetHorarioForm} disabled={saving} style={{ flex: 1 }} />}
        </View>
      </MtCard>

      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <View style={styles.calendarTop}>
          <Pressable onPress={() => moveMonth(-1)} style={styles.monthButton}><Text style={styles.monthButtonText}>‹</Text></Pressable>
          <Text style={styles.monthTitle}>{MONTH_NAMES[monthCursor.getMonth()]} {monthCursor.getFullYear()}</Text>
          <Pressable onPress={() => moveMonth(1)} style={styles.monthButton}><Text style={styles.monthButtonText}>›</Text></Pressable>
        </View>
        <View style={styles.weekRow}>{WEEKDAYS.map((d) => <Text key={d} style={styles.weekDay}>{d}</Text>)}</View>
        <View style={styles.calendarGrid}>{calendarCells.map((cell) => {
          const selected = cell.iso === selectedDate;
          return (
            <Pressable
              key={cell.key}
              onPress={() => cell.inMonth && setSelectedDate(cell.iso)}
              disabled={!cell.inMonth}
              style={[
                styles.dayCell,
                cell.status === 'out' && styles.dayOut,
                cell.status === 'past' && styles.dayPast,
                cell.status === 'blocked' && styles.dayBlocked,
                cell.status === 'available' && styles.dayAvailable,
                cell.status === 'scheduledNoSlots' && styles.dayScheduledNoSlots,
                selected && styles.daySelected,
              ]}
            >
              <Text style={[styles.dayText, selected && styles.daySelectedText, cell.status === 'blocked' && !selected && styles.dayBlockedText, cell.status === 'available' && !selected && styles.dayAvailableText]}>{cell.label}</Text>
              {cell.inMonth && cell.slotsCount > 0 ? <Text style={[styles.dayBadge, selected && styles.daySelectedText]}>{cell.slotsCount}</Text> : null}
            </Pressable>
          );
        })}</View>
        <View style={styles.legendRow}>
          <Text style={styles.legendAvailable}>● Con cupos</Text>
          <Text style={styles.legendScheduled}>● Horario sin cupos</Text>
          <Text style={styles.legendBlocked}>● Bloqueado</Text>
          <Text style={styles.legendMuted}>● Sin atención/pasado</Text>
        </View>
      </MtCard>

      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <Text style={styles.title}>2. Fecha seleccionada: {formatLocalDate(selectedDate)}</Text>
        <Text style={styles.muted}>{API_DAY_TO_LABEL[selectedDateWeekday]} · {summarizeDate(selectedCell)}</Text>
        {selectedDaySchedules.length ? selectedDaySchedules.map((h) => (
          <View key={`selected-${h.id}`} style={styles.smallInfoRow}>
            <Text style={styles.smallInfoMain}>{formatTime(h.horaDesde)} a {formatTime(h.horaHasta)}</Text>
            <Text style={styles.smallInfoMuted}>cada {h.duracionTurnoMin} min · {countSlotsInRange(h.horaDesde, h.horaHasta, h.duracionTurnoMin)} cupos teóricos</Text>
          </View>
        )) : <Text style={styles.help}>No hay horario semanal cargado para {API_DAY_TO_LABEL[selectedDateWeekday]?.toLowerCase()}.</Text>}
        {selectedDaySlots.length ? (
          <View style={styles.slotWrap}>{selectedDaySlots.slice(0, 14).map((slot) => <Text key={`${slot.fecha}-${slot.hora}`} style={styles.slotChip}>{formatTime(slot.hora || slot.fechaHora)}</Text>)}</View>
        ) : null}
      </MtCard>

      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <Text style={styles.title}>3. Bloquear fecha o franja</Text>
        <Text style={styles.help}>Sirve para feriados, vacaciones, trámites o medio día. Para día completo dejá 00:00 a 23:59.</Text>
        <View style={styles.row}>
          <Field label="Desde" value={bloqueoDesde} setValue={setBloqueoDesde} styles={styles} placeholder="00:00" />
          <Field label="Hasta" value={bloqueoHasta} setValue={setBloqueoHasta} styles={styles} placeholder="23:59" />
        </View>
        <Field label="Motivo" value={bloqueoMotivo} setValue={setBloqueoMotivo} styles={styles} placeholder="No atiende este día" />
        <MtButton title="Bloquear fecha/franja" variant="secondary" onPress={blockSelectedDate} loading={saving} disabled={!professional || saving} />
      </MtCard>

      <MtCard style={{ gap: 10, marginBottom: 14 }}>
        <Text style={styles.title}>Horarios vigentes</Text>
        {horariosOrdenados.map((h) => (
          <View key={h.id} style={styles.listRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.item}>{API_DAY_TO_LABEL[normalizeApiDay(h.diaSemana)] ?? h.diaSemana}</Text>
              <Text style={styles.muted}>{formatTime(h.horaDesde)} a {formatTime(h.horaHasta)} · cada {h.duracionTurnoMin} min</Text>
            </View>
            <Pressable onPress={() => startEditHorario(h)} disabled={saving} style={styles.rowAction}><Text style={styles.editText}>Editar</Text></Pressable>
            <Pressable onPress={() => deleteHorario(h.id)} disabled={saving} style={styles.rowAction}><Text style={styles.deleteText}>Eliminar</Text></Pressable>
          </View>
        ))}
        {!horarios.length && <Text style={styles.muted}>Todavía no tenés horarios cargados.</Text>}
      </MtCard>

      <MtCard style={{ gap: 10, marginBottom: 14 }}>
        <Text style={styles.title}>Bloqueos cargados</Text>
        {bloqueosOrdenados.map((b) => (
          <View key={b.id} style={styles.listRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.item}>{formatLocalDate(b.fechaDesde)} · {formatTime(b.fechaDesde)} a {formatTime(b.fechaHasta)}</Text>
              <Text style={styles.muted}>{b.motivo || 'Sin motivo'}</Text>
            </View>
            <Pressable onPress={() => deleteBloqueo(b.id)} disabled={saving} style={styles.rowAction}><Text style={styles.deleteText}>Eliminar</Text></Pressable>
          </View>
        ))}
        {!bloqueos.length && <Text style={styles.muted}>No hay bloqueos.</Text>}
      </MtCard>

      <MtCard style={{ gap: 10, marginBottom: 92 }}>
        <Text style={styles.title}>Cupos próximos visibles para pacientes</Text>
        {slotsVisibles.slice(0, 16).map((s) => <Text key={`${s.fecha}-${s.hora}-${s.fechaHora}`} style={styles.muted}>• {formatLocalDate(s.fecha || s.fechaHora)} a las {formatTime(s.hora || s.fechaHora)}</Text>)}
        {!slotsVisibles.length && <Text style={styles.muted}>No hay cupos visibles todavía. Cargá horarios semanales o revisá si todos los próximos días están bloqueados/ocupados.</Text>}
      </MtCard>

      <RoleBottomNav role="medico" active="disponibilidad" />
    </MtScreen>
  );
}

function Field({
  label,
  value,
  setValue,
  styles,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  styles: ReturnType<typeof createStyles>;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput value={value} onChangeText={setValue} style={styles.input} placeholder={placeholder} keyboardType={keyboardType} placeholderTextColor="#8B7AA8" />
    </View>
  );
}

function createStyles(theme: MediturnosTheme) {
  const isDark = theme.mode === 'dark';
  return StyleSheet.create({
    title: { color: theme.colors.ink, fontWeight: '900', fontSize: 18, lineHeight: 23 },
    muted: { color: theme.colors.muted, fontWeight: '700', lineHeight: 21 },
    help: { color: theme.colors.muted, fontWeight: '700', lineHeight: 20 },
    item: { color: theme.colors.ink, fontWeight: '900', lineHeight: 22, flexShrink: 1, fontSize: 15 },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
    row: { flexDirection: 'row', gap: 10 },
    inlineButtons: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    weekPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    weekChip: { minWidth: 54, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted, alignItems: 'center' },
    weekChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primaryDark, shadowColor: theme.colors.primary, shadowOpacity: 0.18, shadowRadius: 10, elevation: 2 },
    weekChipText: { color: theme.colors.muted, fontWeight: '900' },
    weekChipTextActive: { color: '#FFFFFF' },
    calendarTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    monthButton: { width: 42, height: 42, borderRadius: 15, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface },
    monthButtonText: { color: theme.colors.primary, fontSize: 24, fontWeight: '900' },
    monthTitle: { color: theme.colors.ink, fontWeight: '900', fontSize: 18 },
    weekRow: { flexDirection: 'row', marginBottom: 2 },
    weekDay: { flex: 1, textAlign: 'center', color: theme.colors.muted, fontWeight: '900', fontSize: 11 },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    dayCell: { width: '13.25%', aspectRatio: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceMuted, borderWidth: 1, borderColor: theme.colors.border },
    dayOut: { opacity: 0.18 },
    dayPast: { opacity: 0.38 },
    dayAvailable: { backgroundColor: isDark ? 'rgba(34,197,94,0.16)' : '#F0FDF4', borderColor: theme.colors.success },
    dayScheduledNoSlots: { backgroundColor: isDark ? 'rgba(251,191,36,0.12)' : '#FFFBEB', borderColor: `${theme.colors.warning}88` },
    dayBlocked: { backgroundColor: isDark ? 'rgba(248,113,113,0.14)' : '#FEF2F2', borderColor: theme.colors.danger },
    daySelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primaryDark },
    dayText: { color: theme.colors.soft, fontWeight: '900', fontSize: 13 },
    dayBadge: { marginTop: -2, color: theme.colors.success, fontSize: 9, fontWeight: '900' },
    dayAvailableText: { color: theme.colors.success },
    dayBlockedText: { color: theme.colors.danger },
    daySelectedText: { color: '#FFFFFF' },
    legendRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    legendAvailable: { color: theme.colors.success, fontWeight: '900', fontSize: 12 },
    legendScheduled: { color: theme.colors.warning, fontWeight: '900', fontSize: 12 },
    legendMuted: { color: theme.colors.muted, fontWeight: '900', fontSize: 12 },
    legendBlocked: { color: theme.colors.danger, fontWeight: '900', fontSize: 12 },
    fieldLabel: { color: theme.colors.muted, fontWeight: '900', marginBottom: 6 },
    input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingHorizontal: 12, minHeight: 46, color: theme.colors.ink, backgroundColor: theme.colors.surfaceMuted, fontWeight: '800' },
    smallInfoRow: { borderRadius: 16, backgroundColor: theme.colors.surfaceMuted, padding: 12, borderWidth: 1, borderColor: theme.colors.border },
    smallInfoMain: { color: theme.colors.ink, fontWeight: '900' },
    smallInfoMuted: { color: theme.colors.muted, fontWeight: '700', marginTop: 2 },
    slotWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    slotChip: { color: theme.colors.primary, fontWeight: '900', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: theme.colors.surfaceMuted },
    listRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 11, paddingTop: 5 },
    rowAction: { paddingVertical: 7, paddingHorizontal: 4 },
    editText: { color: theme.colors.primary, fontWeight: '900', fontSize: 12 },
    deleteText: { color: theme.colors.danger, fontWeight: '900', fontSize: 12 },
  });
}
