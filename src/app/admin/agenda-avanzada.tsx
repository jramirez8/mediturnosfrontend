import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MtButton, MtCard, MtHeader, MtLoading, MtNotice, MtScreen } from '../../components/mediturnos';
import { MtSelect } from '../../components/MtSelect';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { professionalService, Professional } from '../../api/professionalService';
import { agendaService, AgendaBloqueo, hasActiveScheduleForDay, HorarioAtencion } from '../../api/agendaService';
import { useMtTheme } from '../../theme/themeStore';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { readableError } from '../../utils/errors';

const DAYS = [
  ['LUNES', 'Lun'], ['MARTES', 'Mar'], ['MIERCOLES', 'Mié'], ['JUEVES', 'Jue'],
  ['VIERNES', 'Vie'], ['SABADO', 'Sáb'], ['DOMINGO', 'Dom'],
] as const;
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function displayDate(value?: string) {
  if (!value) return 'Fecha no informada';
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

function displayTime(value?: string) { return String(value ?? '').slice(0, 5); }

function calendarDays(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { iso: isoDate(date), day: date.getDate(), inMonth: date.getMonth() === cursor.getMonth() };
  });
}

export default function AgendaAvanzadaAdmin() {
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [horarios, setHorarios] = useState<HorarioAtencion[]>([]);
  const [bloqueos, setBloqueos] = useState<AgendaBloqueo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'danger' | 'warning'; title: string; message: string } | null>(null);
  const [dia, setDia] = useState('LUNES');
  const [desde, setDesde] = useState('09:00');
  const [hasta, setHasta] = useState('13:00');
  const [duracion, setDuracion] = useState('30');
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => isoDate(new Date()));
  const [bloqueoDesdeHora, setBloqueoDesdeHora] = useState('00:00');
  const [bloqueoHastaHora, setBloqueoHastaHora] = useState('23:59');
  const [bloqueoMotivo, setBloqueoMotivo] = useState('No atiende este día');

  const selected = useMemo(() => professionals.find((p) => String(p.profesionalInstitucionId) === selectedId) ?? null, [professionals, selectedId]);
  const cells = useMemo(() => calendarDays(cursor), [cursor]);
  const blockedDates = useMemo(() => new Set(bloqueos.map((b) => String(b.fechaDesde).slice(0, 10))), [bloqueos]);

  const loadAgenda = async (professional: Professional) => {
    if (!professional.profesionalInstitucionId) {
      setHorarios([]); setBloqueos([]);
      setNotice({ type: 'warning', title: 'Sede pendiente', message: 'El profesional todavía no tiene una sede vinculada. Completá la asignación desde Personal.' });
      return;
    }
    try {
      const [h, b] = await Promise.all([
        agendaService.getHorarios(professional.profesionalInstitucionId),
        agendaService.getBloqueos(professional.profesionalInstitucionId),
      ]);
      setHorarios(h); setBloqueos(b);
    } catch (e: any) {
      setNotice({ type: 'danger', title: 'No pudimos cargar la agenda', message: readableError(e, 'Reintentá en unos segundos.') });
    }
  };

  useEffect(() => {
    professionalService.getAll().then((data) => {
      const firstValid = data.find((p) => p.profesionalInstitucionId);
      setProfessionals(data);
      setSelectedId(firstValid?.profesionalInstitucionId ? String(firstValid.profesionalInstitucionId) : '');
    }).catch((e) => {
      setNotice({ type: 'danger', title: 'No pudimos cargar profesionales', message: readableError(e, 'Reintentá en unos segundos.') });
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (selected) loadAgenda(selected); }, [selectedId]);

  const validateTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

  const addHorario = async () => {
    if (!selected?.profesionalInstitucionId || !selected.especialidadId) {
      setNotice({ type: 'warning', title: 'Asignación incompleta', message: 'El profesional necesita una sede y una especialidad vinculadas antes de configurar horarios.' });
      return;
    }
    if (hasActiveScheduleForDay(horarios, dia)) {
      setNotice({ type: 'warning', title: 'Día ya configurado', message: 'Ya existe un horario para este día. Eliminá el actual antes de cargar uno nuevo.' });
      return;
    }
    if (!validateTime(desde) || !validateTime(hasta) || desde >= hasta) {
      setNotice({ type: 'warning', title: 'Revisá el horario', message: 'Usá formato HH:MM y asegurate de que la hora de inicio sea anterior a la de fin.' });
      return;
    }
    try {
      setSaving(true); setNotice(null);
      await agendaService.createHorario({
        profesionalInstitucionId: selected.profesionalInstitucionId,
        especialidadId: selected.especialidadId,
        diaSemana: dia,
        horaDesde: desde,
        horaHasta: hasta,
        duracionTurnoMin: Number(duracion) || 30,
        activo: true,
      });
      await loadAgenda(selected);
      setNotice({ type: 'success', title: 'Horario agregado', message: 'La disponibilidad semanal quedó actualizada.' });
    } catch (e: any) {
      setNotice({ type: 'danger', title: 'No pudimos guardar el horario', message: readableError(e, 'Revisá los datos e intentá nuevamente.') });
    } finally { setSaving(false); }
  };

  const addBloqueo = async () => {
    if (!selected?.profesionalInstitucionId) return;
    if (!validateTime(bloqueoDesdeHora) || !validateTime(bloqueoHastaHora) || bloqueoDesdeHora >= bloqueoHastaHora) {
      setNotice({ type: 'warning', title: 'Revisá el bloqueo', message: 'La hora de inicio debe ser anterior a la hora de fin.' });
      return;
    }
    try {
      setSaving(true); setNotice(null);
      await agendaService.createBloqueo({
        profesionalInstitucionId: selected.profesionalInstitucionId,
        fechaDesde: `${selectedDate}T${bloqueoDesdeHora}`,
        fechaHasta: `${selectedDate}T${bloqueoHastaHora}`,
        motivo: bloqueoMotivo.trim() || 'No atiende este día',
      });
      await loadAgenda(selected);
      setNotice({ type: 'success', title: 'Fecha bloqueada', message: `Se bloqueó el ${displayDate(selectedDate)}.` });
    } catch (e: any) {
      setNotice({ type: 'danger', title: 'No pudimos crear el bloqueo', message: readableError(e, 'Revisá los datos e intentá nuevamente.') });
    } finally { setSaving(false); }
  };

  const removeHorario = async (id: number) => {
    if (!selected) return;
    try { setSaving(true); await agendaService.deleteHorario(id); await loadAgenda(selected); }
    catch (e: any) { setNotice({ type: 'danger', title: 'No pudimos eliminar el horario', message: readableError(e, 'Reintentá.') }); }
    finally { setSaving(false); }
  };

  const removeBloqueo = async (id: number) => {
    if (!selected) return;
    try { setSaving(true); await agendaService.deleteBloqueo(id); await loadAgenda(selected); }
    catch (e: any) { setNotice({ type: 'danger', title: 'No pudimos eliminar el bloqueo', message: readableError(e, 'Reintentá.') }); }
    finally { setSaving(false); }
  };

  if (loading) return <MtLoading text="Cargando disponibilidad..." />;

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="ADMIN" title="Disponibilidad médica" subtitle="Configurá días, horarios, duración de turnos y fechas bloqueadas." />
      {notice ? <MtNotice type={notice.type} title={notice.title} message={notice.message} style={{ marginBottom: 14 }} /> : null}

      <MtCard style={styles.card}>
        <MtSelect
          label="Profesional y sede"
          value={selectedId}
          placeholder="Seleccionar profesional"
          options={professionals.filter((p) => p.profesionalInstitucionId).map((p) => ({ label: `${p.apellido}, ${p.nombre} · ${p.institucion}`, value: String(p.profesionalInstitucionId) }))}
          onChange={setSelectedId}
        />
        {selected ? <Text style={styles.muted}>{selected.especialidad} · {selected.institucion}</Text> : null}
      </MtCard>

      <MtCard style={styles.card}>
        <Text style={styles.title}>Nuevo horario semanal</Text>
        <View style={styles.dayGrid}>{DAYS.map(([value, label]) => (
          <Pressable key={value} onPress={() => setDia(value)} style={[styles.dayChip, dia === value && styles.dayChipActive]}>
            <Text style={[styles.dayChipText, dia === value && styles.dayChipTextActive]}>{label}</Text>
          </Pressable>
        ))}</View>
        <View style={styles.row}>
          <Field label="Desde" value={desde} setValue={setDesde} styles={styles} placeholder="09:00" />
          <Field label="Hasta" value={hasta} setValue={setHasta} styles={styles} placeholder="13:00" />
          <Field label="Minutos" value={duracion} setValue={setDuracion} styles={styles} placeholder="30" numeric />
        </View>
        <MtButton title="Agregar horario" onPress={addHorario} loading={saving} disabled={!selected || saving} />
      </MtCard>

      <MtCard style={styles.card}>
        <Text style={styles.title}>Horarios vigentes</Text>
        {horarios.length ? horarios.map((h) => (
          <View key={h.id} style={styles.listRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.item}>{DAYS.find(([value]) => value === h.diaSemana)?.[1] ?? h.diaSemana}</Text>
              <Text style={styles.muted}>{displayTime(h.horaDesde)} a {displayTime(h.horaHasta)} · cada {h.duracionTurnoMin} min · {h.especialidad || selected?.especialidad}</Text>
            </View>
            <Pressable onPress={() => removeHorario(h.id)} disabled={saving}><Text style={styles.delete}>Eliminar</Text></Pressable>
          </View>
        )) : <Text style={styles.muted}>Todavía no hay horarios configurados para esta sede.</Text>}
      </MtCard>

      <MtCard style={styles.card}>
        <View style={styles.calendarHeader}>
          <Pressable style={styles.monthButton} onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><Text style={styles.monthButtonText}>‹</Text></Pressable>
          <View><Text style={styles.monthTitle}>{MONTHS[cursor.getMonth()]}</Text><Text style={styles.monthYear}>{cursor.getFullYear()}</Text></View>
          <Pressable style={styles.monthButton} onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><Text style={styles.monthButtonText}>›</Text></Pressable>
        </View>
        <View style={styles.weekRow}>{DAYS.map(([, label]) => <Text key={label} style={styles.weekLabel}>{label}</Text>)}</View>
        <View style={styles.calendarGrid}>{cells.map((cell) => {
          const active = cell.iso === selectedDate;
          const blocked = blockedDates.has(cell.iso);
          return (
            <Pressable key={cell.iso} onPress={() => cell.inMonth && setSelectedDate(cell.iso)} style={[styles.calendarCell, !cell.inMonth && styles.calendarOutside, blocked && styles.calendarBlocked, active && styles.calendarSelected]}>
              <Text style={[styles.calendarText, blocked && styles.calendarBlockedText, active && styles.calendarSelectedText]}>{cell.day}</Text>
              {blocked ? <Text style={styles.blockMark}>×</Text> : null}
            </Pressable>
          );
        })}</View>
      </MtCard>

      <MtCard style={styles.card}>
        <Text style={styles.title}>Bloquear {displayDate(selectedDate)}</Text>
        <Text style={styles.muted}>Elegí el día en el calendario. Para bloquear la jornada completa, dejá 00:00 a 23:59.</Text>
        <View style={styles.row}>
          <Field label="Desde" value={bloqueoDesdeHora} setValue={setBloqueoDesdeHora} styles={styles} placeholder="00:00" />
          <Field label="Hasta" value={bloqueoHastaHora} setValue={setBloqueoHastaHora} styles={styles} placeholder="23:59" />
        </View>
        <Field label="Motivo" value={bloqueoMotivo} setValue={setBloqueoMotivo} styles={styles} placeholder="Feriado, licencia, congreso..." />
        <MtButton title="Bloquear fecha" onPress={addBloqueo} loading={saving} disabled={!selected || saving} variant="secondary" />
      </MtCard>

      <MtCard style={styles.card}>
        <Text style={styles.title}>Bloqueos cargados</Text>
        {bloqueos.length ? bloqueos.map((b) => (
          <View key={b.id} style={styles.listRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.item}>{displayDate(b.fechaDesde)}</Text>
              <Text style={styles.muted}>{displayTime(String(b.fechaDesde).split('T')[1])} a {displayTime(String(b.fechaHasta).split('T')[1])} · {b.motivo || 'Sin motivo'}</Text>
            </View>
            <Pressable onPress={() => removeBloqueo(b.id)} disabled={saving}><Text style={styles.delete}>Eliminar</Text></Pressable>
          </View>
        )) : <Text style={styles.muted}>No hay fechas bloqueadas.</Text>}
      </MtCard>

      <RoleBottomNav role="admin" active="profesionales" />
    </MtScreen>
  );
}

function Field({ label, value, setValue, styles, placeholder, numeric }: { label: string; value: string; setValue: (v: string) => void; styles: ReturnType<typeof createStyles>; placeholder?: string; numeric?: boolean }) {
  return <View style={{ flex: 1 }}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={setValue} placeholder={placeholder} placeholderTextColor="#8B7AA8" keyboardType={numeric ? 'numeric' : 'default'} style={styles.input} /></View>;
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    card: { gap: 12, marginBottom: 14 },
    title: { color: theme.colors.ink, fontWeight: '900', fontSize: 18 },
    muted: { color: theme.colors.muted, fontWeight: '700', lineHeight: 20 },
    item: { color: theme.colors.ink, fontWeight: '900', fontSize: 15 },
    row: { flexDirection: 'row', gap: 10 },
    dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    dayChip: { minWidth: 48, flexGrow: 1, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 15, paddingVertical: 10, backgroundColor: theme.colors.surfaceMuted },
    dayChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    dayChipText: { color: theme.colors.muted, fontWeight: '900' },
    dayChipTextActive: { color: '#FFFFFF' },
    fieldLabel: { color: theme.colors.muted, fontWeight: '900', marginBottom: 6 },
    input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingHorizontal: 12, minHeight: 46, color: theme.colors.ink, backgroundColor: theme.colors.surfaceMuted },
    listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 12 },
    delete: { color: theme.colors.danger, fontWeight: '900' },
    calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    monthButton: { width: 42, height: 42, borderRadius: 15, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
    monthButtonText: { color: theme.colors.primary, fontSize: 27, fontWeight: '900' },
    monthTitle: { color: theme.colors.ink, fontSize: 19, fontWeight: '900', textAlign: 'center' },
    monthYear: { color: theme.colors.muted, fontWeight: '800', textAlign: 'center' },
    weekRow: { flexDirection: 'row', gap: 5 },
    weekLabel: { flex: 1, textAlign: 'center', color: theme.colors.muted, fontWeight: '900', fontSize: 11 },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    calendarCell: { width: '12.7%', aspectRatio: 1, borderRadius: 13, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
    calendarOutside: { opacity: 0.18 },
    calendarBlocked: { borderColor: theme.colors.danger, backgroundColor: theme.mode === 'dark' ? 'rgba(248,113,113,0.12)' : '#FFF1F2' },
    calendarSelected: { borderWidth: 3, borderColor: theme.colors.primary },
    calendarText: { color: theme.colors.ink, fontWeight: '900' },
    calendarBlockedText: { color: theme.colors.danger },
    calendarSelectedText: { color: theme.colors.primary },
    blockMark: { position: 'absolute', right: 4, bottom: 1, color: theme.colors.danger, fontWeight: '900', fontSize: 10 },
  });
}
