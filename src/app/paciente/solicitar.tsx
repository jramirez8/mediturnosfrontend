import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { appointmentService, AppointmentSlot, TurnoResponse } from '../../api/appointmentService';
import { professionalService, Professional } from '../../api/professionalService';
import { useAuthStore } from '../../auth/authStore';
import { MtBottomNav, MtButton, MtCard, MtEmptyState, MtHeader, MtLoading, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { useTranslation } from '../../i18n/languageStore';
import { readableError } from '../../utils/errors';
import { waitlistService } from '../../api/waitlistService';
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

const WEEKDAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
  const { t, language } = useTranslation();
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
      setNotice({ type: 'error', title: language === 'en' ? 'Professionals could not be loaded' : 'No se pudieron cargar profesionales', message: readableError(error) });
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
      setNotice({ type: 'error', title: language === 'en' ? 'Availability could not be loaded' : 'No se pudo cargar disponibilidad', message: readableError(error) });
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
      (message) => setNotice({ type: 'error', title: language === 'en' ? 'We could not attach the document' : 'No pudimos adjuntar documentación', message }),
    );
  };

  const handleConfirm = async () => {
    setNotice(null);
    setCreatedTurno(null);

    if (!pacienteId) {
      setNotice({ type: 'error', title: language === 'en' ? 'We could not identify you' : 'No pudimos identificarte', message: language === 'en' ? 'Sign out and sign in again with a patient account.' : 'Cerrá sesión y volvé a iniciar sesión con una cuenta de paciente.' });
      return;
    }
    if (!selectedProfessional) {
      setNotice({ type: 'error', title: language === 'en' ? 'Professional required' : 'Falta profesional', message: language === 'en' ? 'Choose a professional to continue.' : 'Elegí un profesional para continuar.' });
      return;
    }
    if (!selectedSlot) {
      setNotice({ type: 'error', title: language === 'en' ? 'Time required' : 'Falta horario', message: language === 'en' ? 'Choose an available date and time.' : 'Elegí una fecha y un horario disponible.' });
      return;
    }
    if (!motivo.trim() || !observaciones.trim()) {
      setNotice({ type: 'error', title: language === 'en' ? 'Reason required' : 'Falta motivo', message: language === 'en' ? 'Reason for visit and notes are required to confirm the appointment.' : 'Motivo de consulta y observaciones son obligatorios para confirmar el turno.' });
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
        documentacion: documentation,
      });

      setCreatedTurno(created);
      setNotice({
        type: 'success',
        title: language === 'en' ? 'Appointment confirmed' : 'Turno confirmado',
        message: language === 'en'
          ? `Your appointment was registered for ${created.fecha || selectedSlot.fecha} at ${created.hora || selectedSlot.hora}. #${created.id}.`
          : `Tu turno quedó registrado para el ${created.fecha || selectedSlot.fecha} a las ${created.hora || selectedSlot.hora} hs. N° ${created.id}.`,
      });
    } catch (error: any) {
      setNotice({ type: 'error', title: language === 'en' ? 'Appointment could not be requested' : 'No se pudo solicitar el turno', message: readableError(error, language === 'en' ? 'The time may no longer be available. Try another one.' : 'El horario pudo haber sido tomado. Probá otro.') });
    } finally {
      setSending(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!pacienteId || !selectedProfessional) {
      setNotice({ type: 'error', title: language === 'en' ? 'Missing information' : 'Faltan datos', message: language === 'en' ? 'Choose a professional before joining the waitlist.' : 'Elegí un profesional antes de anotarte en lista de espera.' });
      return;
    }
    try {
      setSending(true);
      await waitlistService.join({
        pacienteId,
        profesionalInstitucionId: selectedProfessional.profesionalInstitucionId ?? selectedProfessional.id,
        especialidadId: selectedProfessional.especialidadId ?? 1,
        observaciones: query || undefined,
      });
      setNotice({ type: 'success', title: language === 'en' ? 'Added to waitlist' : 'Te anotamos en lista de espera', message: language === 'en' ? 'We will notify you by email when a compatible slot opens.' : 'Te vamos a avisar por email cuando se libere un horario compatible.' });
    } catch (error: any) {
      setNotice({ type: 'error', title: language === 'en' ? 'Waitlist failed' : 'No pudimos anotarte', message: readableError(error, language === 'en' ? 'Try again later.' : 'Intentá nuevamente más tarde.') });
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

  const weekdays = language === 'en' ? WEEKDAYS_EN : WEEKDAYS_ES;
  const months = language === 'en' ? MONTHS_EN : MONTHS_ES;

  if (loading) return <MtLoading text={t('common.loading')} />;

  return (
    <>
      <MtScreen scroll>
        <MtHeader eyebrow={language === 'en' ? 'NEW APPOINTMENT' : 'NUEVO TURNO'} title={t('appointment.requestTitle')} subtitle={t('appointment.requestSubtitle')} />

        {!!notice && <NoticeBox notice={notice} styles={styles} />}

        <Text style={styles.step}>{t('appointment.professionalStep')}</Text>
        <MtCard style={styles.block}>
          {!!selectedProfessional && (
            <View style={styles.selectedBox}>
              <Text style={styles.selectedEyebrow}>{language === 'en' ? 'SELECTED PROFESSIONAL' : 'PROFESIONAL SELECCIONADO'}</Text>
              <Text style={styles.selectedName}>{selectedProfessional.apellido}, {selectedProfessional.nombre}</Text>
              <Text style={styles.selectedMeta}>{selectedProfessional.especialidad} · {selectedProfessional.institucion}</Text>
              <Text style={styles.selectedHint}>{language === 'en' ? 'This professional was selected from the directory. You can keep it or choose another one.' : 'Este profesional vino seleccionado desde cartilla. Podés mantenerlo o cambiarlo.'}</Text>
            </View>
          )}

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('professionals.searchPlaceholder')}
            placeholderTextColor={theme.colors.soft}
            style={styles.search}
          />
          <FlatList
            data={filteredProfessionals}
            keyExtractor={(item) => String(item.profesionalInstitucionId ?? item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.proList}
            ListEmptyComponent={<Text style={styles.muted}>{language === 'en' ? 'No professionals match this filter.' : 'No hay profesionales para ese filtro.'}</Text>}
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
                  {selected && <Text style={styles.selectedTag}>{language === 'en' ? 'Selected' : 'Seleccionado'}</Text>}
                </Pressable>
              );
            }}
          />
        </MtCard>

        <Text style={styles.step}>{t('appointment.dateStep')}</Text>
        <MtCard style={styles.block}>
          {!selectedProfessional ? (
            <Text style={styles.muted}>{language === 'en' ? 'Select a professional first.' : 'Primero seleccioná un profesional.'}</Text>
          ) : slotsLoading ? (
            <Text style={styles.muted}>{t('common.loading')}</Text>
          ) : slots.length === 0 ? (
            <View style={{ gap: 12 }}>
              <MtEmptyState title={language === 'en' ? 'No availability' : 'Sin disponibilidad'} subtitle={language === 'en' ? 'No time slots were found for this professional.' : 'No encontramos horarios para este profesional.'} />
              <MtButton title={language === 'en' ? 'Join waitlist' : 'Anotarme en lista de espera'} variant="secondary" loading={sending} onPress={handleJoinWaitlist} />
            </View>
          ) : (
            <View>
              <View style={styles.calendarTop}>
                <Pressable onPress={() => moveMonth(-1)} style={styles.monthButton}><Text style={styles.monthButtonText}>‹</Text></Pressable>
                <Text style={styles.monthTitle}>{months[monthCursor.getMonth()]} {monthCursor.getFullYear()}</Text>
                <Pressable onPress={() => moveMonth(1)} style={styles.monthButton}><Text style={styles.monthButtonText}>›</Text></Pressable>
              </View>
              <View style={styles.weekRow}>{weekdays.map((day) => <Text key={day} style={styles.weekDay}>{day}</Text>)}</View>
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
                  <Text style={styles.dropdownLabel}>{t('appointment.timeStep')}</Text>
                  <Text style={styles.dropdownValue}>{selectedSlot ? `${selectedSlot.hora} hs` : (language === 'en' ? 'Choose an available time' : 'Elegí un horario disponible')}</Text>
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

        <Text style={styles.step}>{t('appointment.reasonStep')}</Text>
        <MtCard style={styles.block}>
          <Text style={styles.label}>{t('appointment.reason')} *</Text>
          <TextInput value={motivo} onChangeText={setMotivo} placeholder={language === 'en' ? 'Example: checkup, pain, test...' : 'Ej: control general, dolor, estudio...'} placeholderTextColor={theme.colors.soft} style={styles.input} />
          <Text style={[styles.label, { marginTop: 14 }]}>{t('appointment.observations')} *</Text>
          <TextInput
            value={observaciones}
            onChangeText={setObservaciones}
            placeholder={language === 'en' ? 'Additional information for the professional' : 'Información adicional para el profesional'}
            placeholderTextColor={theme.colors.soft}
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.textArea]}
          />
        </MtCard>

        <Text style={styles.step}>{t('appointment.attachStep')}</Text>
        <MtCard style={styles.block}>
          <Text style={styles.attachIntro}>📎 {t('appointment.attachOptional')}</Text>
          <MtButton title={documentation ? (language === 'en' ? 'Change document' : 'Cambiar documentación') : (language === 'en' ? '📎 Attach document' : '📎 Adjuntar documentación')} variant="secondary" onPress={pickDocumentation} style={{ marginTop: 12 }} />
          {documentation ? <Text style={styles.attachmentName}>{language === 'en' ? 'Selected file:' : 'Archivo seleccionado:'} {documentation.fileName ?? 'imagen'}</Text> : null}
        </MtCard>

        <MtCard style={styles.summary}>
          <Text style={styles.summaryTitle}>{language === 'en' ? 'Summary' : 'Resumen'}</Text>
          <Text style={styles.summaryLine}>{language === 'en' ? 'Professional:' : 'Profesional:'} {selectedProfessional ? `${selectedProfessional.apellido}, ${selectedProfessional.nombre}` : (language === 'en' ? 'Not selected' : 'Sin seleccionar')}</Text>
          <Text style={styles.summaryLine}>{language === 'en' ? 'Specialty:' : 'Especialidad:'} {selectedProfessional?.especialidad ?? '-'}</Text>
          <Text style={styles.summaryLine}>{language === 'en' ? 'Time:' : 'Horario:'} {selectedSlot ? `${selectedSlot.fecha} ${selectedSlot.hora}` : '-'}</Text>
          <Text style={styles.summaryLine}>{language === 'en' ? 'Documentation:' : 'Documentación:'} {documentation?.fileName ?? (language === 'en' ? 'Not attached' : 'Sin adjuntar')}</Text>

          {createdTurno ? (
            <View style={styles.successActions}>
              <MtButton title={language === 'en' ? 'View my appointments' : 'Ver mis turnos'} onPress={() => router.replace('/paciente/turnos')} />
              <MtButton title={language === 'en' ? 'Request another' : 'Solicitar otro'} variant="ghost" onPress={resetForm} />
            </View>
          ) : (
            <MtButton title={t('appointment.confirm')} loading={sending} disabled={sending} onPress={handleConfirm} style={{ marginTop: 16 }} />
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
    noticeSuccess: { backgroundColor: theme.mode === 'dark' ? '#24143E' : '#F3EEFF', borderColor: theme.colors.success },
    noticeError: { backgroundColor: theme.mode === 'dark' ? '#3F1111' : '#FEF2F2', borderColor: theme.colors.danger },
    noticeTitle: { fontWeight: '900', fontSize: 15, marginBottom: 4 },
    noticeMessage: { fontWeight: '700', lineHeight: 20 },
    noticeSuccessText: { color: theme.mode === 'dark' ? '#D1FAE5' : '#065F46' },
    noticeErrorText: { color: theme.mode === 'dark' ? '#FEE2E2' : '#991B1B' },
  });
}
