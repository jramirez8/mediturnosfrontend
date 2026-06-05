import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { appointmentService, AppointmentSlot, TurnoResponse } from '../../api/appointmentService';
import { professionalService, Professional } from '../../api/professionalService';
import { useAuthStore } from '../../auth/authStore';
import { MtBottomNav, MtButton, MtCard, MtEmptyState, MtHeader, MtLoading, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';
import { chooseImageSource, PickedMedia } from '../../utils/mediaPicker';

type Notice = {
  type: 'success' | 'error';
  title: string;
  message: string;
};

type CalendarCell = {
  key: string;
  dayLabel: string;
  iso: string;
  inMonth: boolean;
  available: boolean;
};

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildCalendarCells(monthCursor: Date, availableDates: Set<string>): CalendarCell[] {
  const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = toIsoDate(date);
    return {
      key: iso,
      dayLabel: String(date.getDate()),
      iso,
      inMonth: date.getMonth() === monthCursor.getMonth(),
      available: availableDates.has(iso),
    };
  });
}

function makeParamProfessional(params: Record<string, any>): Professional | null {
  const rawId = params.profesionalInstitucionId ?? params.professionalId;
  const parsed = Number(rawId);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  const fullName = String(params.professionalName ?? 'Profesional seleccionado');
  const [apellidoPart, nombrePart] = fullName.includes(',') ? fullName.split(',') : ['', fullName];

  return {
    id: Number(params.professionalId ?? parsed),
    profesionalInstitucionId: Number(params.profesionalInstitucionId ?? parsed),
    nombre: String(nombrePart ?? '').trim() || 'Profesional',
    apellido: String(apellidoPart ?? '').trim() || 'seleccionado',
    especialidad: String(params.specialty ?? params.especialidad ?? 'Especialidad'),
    institucion: String(params.institution ?? params.institucion ?? 'Institución'),
  };
}

export default function SolicitarTurnoScreen() {
  const params = useLocalSearchParams();
  const { pacienteId } = useAuthStore();
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [showTimes, setShowTimes] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [documentation, setDocumentation] = useState<PickedMedia | null>(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [createdTurno, setCreatedTurno] = useState<TurnoResponse | null>(null);

  useEffect(() => {
    loadProfessionals();
  }, []);

  useEffect(() => {
    if (selectedProfessional) loadSlots(selectedProfessional.profesionalInstitucionId ?? selectedProfessional.id);
  }, [selectedProfessional?.id, selectedProfessional?.profesionalInstitucionId]);

  const loadProfessionals = async () => {
    try {
      setLoading(true);
      const data = await professionalService.getAll();
      const paramId = String(params.profesionalInstitucionId ?? params.professionalId ?? '');
      let nextData = data;

      if (paramId) {
        const found = data.find((p) => String(p.profesionalInstitucionId ?? p.id) === paramId || String(p.id) === paramId);
        const selected = found ?? makeParamProfessional(params as Record<string, any>);
        if (selected) {
          setSelectedProfessional(selected);
          nextData = [selected, ...data.filter((p) => (p.profesionalInstitucionId ?? p.id) !== (selected.profesionalInstitucionId ?? selected.id))];
        }
      }

      setProfessionals(nextData);
    } catch (error: any) {
      setNotice({ type: 'error', title: 'No se pudieron cargar profesionales', message: readableError(error) });
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (profesionalInstitucionId: number) => {
    try {
      setSlotsLoading(true);
      setNotice(null);
      const data = await appointmentService.getDisponibilidad(profesionalInstitucionId);
      const available = data.filter((slot) => slot.disponible !== false);
      setSlots(available);
      const first = available[0] ?? null;
      setSelectedSlot(first);
      setSelectedDate(first?.fecha ?? '');
      if (first?.fecha) {
        const [y, m] = first.fecha.split('-').map(Number);
        if (y && m) setMonthCursor(new Date(y, m - 1, 1));
      }
      setShowTimes(false);
    } catch (error: any) {
      setSlots([]);
      setSelectedSlot(null);
      setSelectedDate('');
      setNotice({ type: 'error', title: 'No se pudo cargar disponibilidad', message: readableError(error) });
    } finally {
      setSlotsLoading(false);
    }
  };

  const filteredProfessionals = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return professionals;
    return professionals.filter((p) => `${p.nombre} ${p.apellido} ${p.especialidad} ${p.institucion}`.toLowerCase().includes(text));
  }, [professionals, query]);

  const availableDateSet = useMemo(() => new Set(slots.map((slot) => slot.fecha).filter(Boolean)), [slots]);
  const calendarCells = useMemo(() => buildCalendarCells(monthCursor, availableDateSet), [monthCursor, availableDateSet]);
  const slotsForDate = useMemo(() => slots.filter((slot) => slot.fecha === selectedDate), [slots, selectedDate]);

  const handleSelectProfessional = (item: Professional) => {
    setNotice(null);
    setCreatedTurno(null);
    setSelectedProfessional(item);
    setSelectedSlot(null);
    setSelectedDate('');
    setSlots([]);
    setShowTimes(false);
  };

  const handleSelectDate = (date: string) => {
    const firstSlot = slots.find((slot) => slot.fecha === date) ?? null;
    setSelectedDate(date);
    setSelectedSlot(firstSlot);
    setShowTimes(true);
    setNotice(null);
  };

  const pickDocumentation = () => {
    chooseImageSource(
      (media) => {
        setDocumentation(media);
        setNotice(null);
      },
      (message) => setNotice({ type: 'error', title: 'No pudimos adjuntar documentación', message }),
    );
  };

  const handleConfirm = async () => {
    setNotice(null);
    setCreatedTurno(null);

    if (!pacienteId) {
      setNotice({ type: 'error', title: 'No pudimos identificarte', message: 'Cerrá sesión y volvé a iniciar sesión con una cuenta de paciente.' });
      return;
    }
    if (!selectedProfessional) {
      setNotice({ type: 'error', title: 'Falta profesional', message: 'Elegí un profesional para continuar.' });
      return;
    }
    if (!selectedSlot) {
      setNotice({ type: 'error', title: 'Falta horario', message: 'Elegí una fecha y un horario disponible.' });
      return;
    }
    if (!motivo.trim() || !observaciones.trim()) {
      setNotice({ type: 'error', title: 'Falta motivo', message: 'Motivo de consulta y observaciones son obligatorios para confirmar el turno.' });
      return;
    }

    try {
      setSending(true);
      const obsFinal = [observaciones.trim(), documentation?.fileName ? `Documentación seleccionada por el paciente: ${documentation.fileName}` : null]
        .filter(Boolean)
        .join(' | ');

      const created = await appointmentService.requestAppointment({
        pacienteId,
        profesionalId: selectedProfessional.id,
        profesionalInstitucionId: selectedProfessional.profesionalInstitucionId ?? selectedProfessional.id,
        especialidadId: selectedProfessional.especialidadId,
        fecha: selectedSlot.fecha,
        hora: selectedSlot.hora,
        fechaHora: selectedSlot.fechaHora,
        motivoConsulta: motivo.trim(),
        observaciones: obsFinal,
      });

      setCreatedTurno(created);
      setNotice({
        type: 'success',
        title: 'Turno confirmado',
        message: `Tu turno quedó registrado para el ${created.fecha || selectedSlot.fecha} a las ${created.hora || selectedSlot.hora} hs. N° ${created.id}.`,
      });
    } catch (error: any) {
      setNotice({ type: 'error', title: 'No se pudo solicitar el turno', message: readableError(error, 'El horario pudo haber sido tomado. Probá otro.') });
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setCreatedTurno(null);
    setNotice(null);
    setMotivo('');
    setObservaciones('');
    setDocumentation(null);
  };

  const moveMonth = (delta: number) => {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  if (loading) return <MtLoading text="Preparando solicitud..." />;

  return (
    <>
      <MtScreen scroll>
        <MtHeader eyebrow="NUEVO TURNO" title="Solicitar turno" subtitle="Elegí profesional, fecha, horario y motivo de consulta." />

        {!!notice && <NoticeBox notice={notice} styles={styles} />}

        <Text style={styles.step}>1. Profesional</Text>
        <MtCard style={styles.block}>
          {!!selectedProfessional && (
            <View style={styles.selectedBox}>
              <Text style={styles.selectedEyebrow}>Profesional seleccionado</Text>
              <Text style={styles.selectedName}>{selectedProfessional.apellido}, {selectedProfessional.nombre}</Text>
              <Text style={styles.selectedMeta}>{selectedProfessional.especialidad} · {selectedProfessional.institucion}</Text>
              <Text style={styles.selectedHint}>Este profesional vino seleccionado desde cartilla. Podés mantenerlo o cambiarlo.</Text>
            </View>
          )}

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por médico, especialidad o institución"
            placeholderTextColor={theme.colors.soft}
            style={styles.search}
          />
          <FlatList
            data={filteredProfessionals}
            keyExtractor={(item) => String(item.profesionalInstitucionId ?? item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.proList}
            ListEmptyComponent={<Text style={styles.muted}>No hay profesionales para ese filtro.</Text>}
            renderItem={({ item }) => {
              const selected = (selectedProfessional?.profesionalInstitucionId ?? selectedProfessional?.id) === (item.profesionalInstitucionId ?? item.id);
              return (
                <Pressable
                  style={[styles.profCard, selected && styles.profCardSelected]}
                  onPress={() => handleSelectProfessional(item)}
                >
                  <Text style={styles.profName}>{item.apellido}, {item.nombre}</Text>
                  <Text style={styles.profSpecialty}>{item.especialidad}</Text>
                  <Text style={styles.profInstitution}>{item.institucion}</Text>
                  {selected && <Text style={styles.selectedTag}>Seleccionado</Text>}
                </Pressable>
              );
            }}
          />
        </MtCard>

        <Text style={styles.step}>2. Fecha y horario</Text>
        <MtCard style={styles.block}>
          {!selectedProfessional ? (
            <Text style={styles.muted}>Primero seleccioná un profesional.</Text>
          ) : slotsLoading ? (
            <Text style={styles.muted}>Buscando disponibilidad...</Text>
          ) : slots.length === 0 ? (
            <MtEmptyState title="Sin disponibilidad" subtitle="No encontramos horarios para este profesional." />
          ) : (
            <View>
              <View style={styles.calendarTop}>
                <Pressable onPress={() => moveMonth(-1)} style={styles.monthButton}><Text style={styles.monthButtonText}>‹</Text></Pressable>
                <Text style={styles.monthTitle}>{MONTHS[monthCursor.getMonth()]} {monthCursor.getFullYear()}</Text>
                <Pressable onPress={() => moveMonth(1)} style={styles.monthButton}><Text style={styles.monthButtonText}>›</Text></Pressable>
              </View>
              <View style={styles.weekRow}>{WEEKDAYS.map((day) => <Text key={day} style={styles.weekDay}>{day}</Text>)}</View>
              <View style={styles.calendarGrid}>
                {calendarCells.map((cell) => {
                  const selected = cell.iso === selectedDate;
                  return (
                    <Pressable
                      key={cell.key}
                      disabled={!cell.available}
                      onPress={() => handleSelectDate(cell.iso)}
                      style={[
                        styles.dayCell,
                        !cell.inMonth && styles.dayCellOut,
                        !cell.available && styles.dayCellDisabled,
                        selected && styles.dayCellSelected,
                      ]}
                    >
                      <Text style={[styles.dayText, !cell.available && styles.dayTextDisabled, selected && styles.dayTextSelected]}>{cell.dayLabel}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable style={[styles.timeSelector, !selectedDate && { opacity: 0.55 }]} disabled={!selectedDate} onPress={() => setShowTimes((current) => !current)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dropdownLabel}>Horario</Text>
                  <Text style={styles.dropdownValue}>{selectedSlot ? `${selectedSlot.hora} hs` : 'Elegí un horario disponible'}</Text>
                </View>
                <Text style={styles.dropdownChevron}>{showTimes ? '▲' : '▼'}</Text>
              </Pressable>

              {showTimes && (
                <View style={styles.timeGrid}>
                  {slotsForDate.map((slot) => {
                    const selected = selectedSlot?.fecha === slot.fecha && selectedSlot?.hora === slot.hora;
                    return (
                      <Pressable
                        key={`${slot.fecha}-${slot.hora}`}
                        style={[styles.timeChip, selected && styles.timeChipSelected]}
                        onPress={() => {
                          setSelectedSlot(slot);
                          setShowTimes(false);
                          setNotice(null);
                        }}
                      >
                        <Text style={[styles.timeChipText, selected && styles.timeChipTextSelected]}>{slot.hora} hs</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </MtCard>

        <Text style={styles.step}>3. Motivo</Text>
        <MtCard style={styles.block}>
          <Text style={styles.label}>Motivo de consulta *</Text>
          <TextInput value={motivo} onChangeText={setMotivo} placeholder="Ej: control general, dolor, estudio..." placeholderTextColor={theme.colors.soft} style={styles.input} />
          <Text style={[styles.label, { marginTop: 14 }]}>Observaciones *</Text>
          <TextInput
            value={observaciones}
            onChangeText={setObservaciones}
            placeholder="Información adicional para el profesional"
            placeholderTextColor={theme.colors.soft}
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.textArea]}
          />
        </MtCard>

        <Text style={styles.step}>4. Adjuntar documentación</Text>
        <MtCard style={styles.block}>
          <Text style={styles.attachIntro}>📎 Opcional. Podés adjuntar una foto desde cámara o galería.</Text>
          <MtButton title={documentation ? 'Cambiar documentación' : '📎 Adjuntar documentación'} variant="secondary" onPress={pickDocumentation} style={{ marginTop: 12 }} />
          {documentation ? <Text style={styles.attachmentName}>Archivo seleccionado: {documentation.fileName ?? 'imagen'}</Text> : null}
        </MtCard>

        <MtCard style={styles.summary}>
          <Text style={styles.summaryTitle}>Resumen</Text>
          <Text style={styles.summaryLine}>Profesional: {selectedProfessional ? `${selectedProfessional.apellido}, ${selectedProfessional.nombre}` : 'Sin seleccionar'}</Text>
          <Text style={styles.summaryLine}>Especialidad: {selectedProfessional?.especialidad ?? '-'}</Text>
          <Text style={styles.summaryLine}>Horario: {selectedSlot ? `${selectedSlot.fecha} ${selectedSlot.hora}` : '-'}</Text>
          <Text style={styles.summaryLine}>Documentación: {documentation?.fileName ?? 'Sin adjuntar'}</Text>

          {createdTurno ? (
            <View style={styles.successActions}>
              <MtButton title="Ver mis turnos" onPress={() => router.replace('/paciente/turnos')} />
              <MtButton title="Solicitar otro" variant="ghost" onPress={resetForm} />
            </View>
          ) : (
            <MtButton title="Confirmar solicitud" loading={sending} disabled={sending} onPress={handleConfirm} style={{ marginTop: 16 }} />
          )}
        </MtCard>
      </MtScreen>
      <MtBottomNav active="solicitar" />
    </>
  );
}

function NoticeBox({ notice, styles }: { notice: Notice; styles: ReturnType<typeof createStyles> }) {
  const success = notice.type === 'success';
  return (
    <View style={[styles.noticeBox, success ? styles.noticeSuccess : styles.noticeError]}>
      <Text style={[styles.noticeTitle, success ? styles.noticeSuccessText : styles.noticeErrorText]}>{notice.title}</Text>
      <Text style={[styles.noticeMessage, success ? styles.noticeSuccessText : styles.noticeErrorText]}>{notice.message}</Text>
    </View>
  );
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    step: { color: theme.colors.ink, fontWeight: '900', fontSize: 18, marginBottom: 10, marginTop: 8 },
    block: { marginBottom: 14 },
    search: { minHeight: 48, borderRadius: 15, backgroundColor: theme.colors.bg, paddingHorizontal: 14, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.ink, marginBottom: 12 },
    proList: { gap: 10, paddingRight: 20 },
    profCard: { width: 230, backgroundColor: theme.colors.bg, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: theme.colors.border },
    profCardSelected: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary, borderWidth: 2 },
    profName: { color: theme.colors.ink, fontWeight: '900', fontSize: 15 },
    profSpecialty: { color: theme.colors.primary, fontWeight: '800', marginTop: 4 },
    profInstitution: { color: theme.colors.muted, marginTop: 4, fontSize: 12, lineHeight: 17 },
    selectedTag: { marginTop: 10, alignSelf: 'flex-start', color: theme.colors.primaryDark, backgroundColor: theme.colors.surface, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: '900', overflow: 'hidden' },
    selectedBox: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary, borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12 },
    selectedEyebrow: { color: theme.colors.primaryDark, fontSize: 12, fontWeight: '900', letterSpacing: 0.8, marginBottom: 4 },
    selectedName: { color: theme.colors.primaryDark, fontSize: 18, fontWeight: '900' },
    selectedMeta: { color: theme.colors.primaryDark, fontWeight: '800', marginTop: 4 },
    selectedHint: { color: theme.colors.primaryDark, opacity: 0.85, fontWeight: '700', marginTop: 8, lineHeight: 18 },
    muted: { color: theme.colors.muted, fontWeight: '700', lineHeight: 20 },
    calendarTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    monthButton: { width: 42, height: 42, borderRadius: 15, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface },
    monthButtonText: { color: theme.colors.primary, fontSize: 24, fontWeight: '900' },
    monthTitle: { color: theme.colors.ink, fontWeight: '900', fontSize: 17 },
    weekRow: { flexDirection: 'row', marginBottom: 7 },
    weekDay: { flex: 1, textAlign: 'center', color: theme.colors.muted, fontWeight: '900', fontSize: 11 },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
    dayCell: { width: '13.05%', aspectRatio: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primaryLight, borderWidth: 1, borderColor: theme.colors.primary },
    dayCellOut: { opacity: 0.45 },
    dayCellDisabled: { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border, opacity: 0.55 },
    dayCellSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primaryDark },
    dayText: { color: theme.colors.primaryDark, fontWeight: '900' },
    dayTextDisabled: { color: theme.colors.soft },
    dayTextSelected: { color: theme.mode === 'dark' ? '#06201D' : '#FFFFFF' },
    timeSelector: { minHeight: 58, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.bg, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
    dropdownLabel: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', marginBottom: 2 },
    dropdownValue: { color: theme.colors.ink, fontSize: 15, fontWeight: '800' },
    dropdownChevron: { color: theme.colors.primary, fontWeight: '900' },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    timeChip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: theme.colors.surface },
    timeChipSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    timeChipText: { color: theme.colors.ink, fontWeight: '900' },
    timeChipTextSelected: { color: theme.mode === 'dark' ? '#06201D' : '#FFFFFF' },
    label: { color: theme.colors.ink, fontWeight: '900', marginBottom: 8 },
    input: { minHeight: 50, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, paddingHorizontal: 14, color: theme.colors.ink, backgroundColor: theme.colors.bg },
    textArea: { minHeight: 96, paddingTop: 14 },
    attachIntro: { color: theme.colors.muted, fontWeight: '700', lineHeight: 20 },
    attachmentName: { color: theme.colors.primaryDark, fontWeight: '800', marginTop: 10 },
    summary: { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
    summaryTitle: { color: theme.colors.primaryDark, fontWeight: '900', fontSize: 17, marginBottom: 8 },
    summaryLine: { color: theme.colors.primaryDark, lineHeight: 22, fontWeight: '700' },
    successActions: { gap: 10, marginTop: 16 },
    noticeBox: { borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 14 },
    noticeSuccess: { backgroundColor: theme.mode === 'dark' ? '#063D35' : '#ECFDF5', borderColor: theme.colors.success },
    noticeError: { backgroundColor: theme.mode === 'dark' ? '#3F1111' : '#FEF2F2', borderColor: theme.colors.danger },
    noticeTitle: { fontWeight: '900', fontSize: 15, marginBottom: 4 },
    noticeMessage: { fontWeight: '700', lineHeight: 20 },
    noticeSuccessText: { color: theme.mode === 'dark' ? '#D1FAE5' : '#065F46' },
    noticeErrorText: { color: theme.mode === 'dark' ? '#FEE2E2' : '#991B1B' },
  });
}
