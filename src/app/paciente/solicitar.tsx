import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { appointmentService, AppointmentSlot, TurnoResponse } from '../../api/appointmentService';
import { professionalService, Professional } from '../../api/professionalService';
import { useAuthStore } from '../../auth/authStore';
import { MtBottomNav, MtButton, MtCard, MtEmptyState, MtHeader, MtLoading, MtNotice, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { useTranslation } from '../../i18n/languageStore';
import { readableError } from '../../utils/errors';
import { waitlistService } from '../../api/waitlistService';
import { chooseDocumentSource, PickedMedia } from '../../utils/mediaPicker';
import { MONTH_NAMES, toLocalIsoDate, parseIsoDateLocal, todayLocalIso } from '../../utils/date';
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
const MONTHS_ES = MONTH_NAMES;
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function buildCalendarCells(monthCursor: Date, availableDates: Set<string>): CalendarCell[] {
    const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - mondayOffset);
    return Array.from({ length: 35 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        const iso = toLocalIsoDate(date);
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
    if (!Number.isFinite(parsed) || parsed <= 0)
        return null;
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
type RequestContext = {
    pacienteId: string;
    professional: Professional;
    slot: AppointmentSlot;
};
type RequestValidation = {
    context: RequestContext;
    notice?: never;
} | {
    notice: Notice;
    context?: never;
};
function requestCopy(language: string) {
    if (language === 'en')
        return {
            identifyTitle: 'We could not identify you', identifyMessage: 'Sign out and sign in again with a patient account.', professionalTitle: 'Professional required', professionalMessage: 'Choose a professional to continue.', timeTitle: 'Time required', timeMessage: 'Choose an available date and time.', reasonTitle: 'Reason required', reasonMessage: 'Reason for visit and notes are required to confirm the appointment.', missingTitle: 'Missing information', waitlistMissing: 'Choose a professional before joining the waitlist.', waitlistSuccessTitle: 'Added to waitlist', waitlistSuccess: 'We will notify you by email when a compatible slot opens.', waitlistErrorTitle: 'Waitlist failed', retry: 'Try again later.'
        };
    return {
        identifyTitle: 'No pudimos identificarte', identifyMessage: 'Cerrá sesión y volvé a iniciar sesión con una cuenta de paciente.', professionalTitle: 'Falta profesional', professionalMessage: 'Elegí un profesional para continuar.', timeTitle: 'Falta horario', timeMessage: 'Elegí una fecha y un horario disponible.', reasonTitle: 'Falta motivo', reasonMessage: 'Motivo de consulta y observaciones son obligatorios para confirmar el turno.', missingTitle: 'Faltan datos', waitlistMissing: 'Elegí un profesional antes de anotarte en lista de espera.', waitlistSuccessTitle: 'Te anotamos en lista de espera', waitlistSuccess: 'Te vamos a avisar por email cuando se libere un horario compatible.', waitlistErrorTitle: 'No pudimos anotarte', retry: 'Intentá nuevamente más tarde.'
    };
}
function requestValidation(values: {
    pacienteId?: string | null;
    professional: Professional | null;
    slot: AppointmentSlot | null;
    motivo: string;
    observaciones: string;
    language: string;
}): RequestValidation {
    const copy = requestCopy(values.language);
    const rules = [
        { invalid: !values.pacienteId, notice: { type: 'error' as const, title: copy.identifyTitle, message: copy.identifyMessage } },
        { invalid: !values.professional, notice: { type: 'error' as const, title: copy.professionalTitle, message: copy.professionalMessage } },
        { invalid: !values.slot, notice: { type: 'error' as const, title: copy.timeTitle, message: copy.timeMessage } },
        { invalid: !values.motivo.trim() || !values.observaciones.trim(), notice: { type: 'error' as const, title: copy.reasonTitle, message: copy.reasonMessage } },
    ];
    const failed = rules.find((rule) => rule.invalid);
    if (failed)
        return { notice: failed.notice };
    return { context: { pacienteId: values.pacienteId!, professional: values.professional!, slot: values.slot! } };
}
function ProfessionalSection({ selected, query, setQuery, professionals, onSelect, styles, theme, language }: Readonly<{
    selected: Professional | null;
    query: string;
    setQuery: (value: string) => void;
    professionals: Professional[];
    onSelect: (item: Professional) => void;
    styles: ReturnType<typeof createStyles>;
    theme: MediturnosTheme;
    language: string;
}>) {
    const { t } = useTranslation();
    return <><Text style={styles.step}>{t('appointment.professionalStep')}</Text><MtCard style={styles.block}>
    {selected ? <View style={styles.selectedBox}><Text style={styles.selectedEyebrow}>{language === 'en' ? 'SELECTED PROFESSIONAL' : 'PROFESIONAL SELECCIONADO'}</Text><Text style={styles.selectedName}>{selected.apellido}, {selected.nombre}</Text><Text style={styles.selectedMeta}>{selected.especialidad} · {selected.institucion}</Text><Text style={styles.selectedHint}>{language === 'en' ? 'This professional was selected from the directory. You can keep it or choose another one.' : 'Este profesional vino seleccionado desde cartilla. Podés mantenerlo o cambiarlo.'}</Text></View> : null}
    <TextInput value={query} onChangeText={setQuery} placeholder={t('professionals.searchPlaceholder')} placeholderTextColor={theme.colors.soft} style={styles.search}/>
    <FlatList data={professionals} keyExtractor={(item) => String(item.profesionalInstitucionId ?? item.id)} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.proList} ListEmptyComponent={<Text style={styles.muted}>{language === 'en' ? 'No professionals match this filter.' : 'No hay profesionales para ese filtro.'}</Text>} renderItem={({ item }) => <ProfessionalOption item={item} selected={selected} onSelect={onSelect} styles={styles} language={language}/>}/>
  </MtCard></>;
}
function ProfessionalOption({ item, selected, onSelect, styles, language }: Readonly<{
    item: Professional;
    selected: Professional | null;
    onSelect: (item: Professional) => void;
    styles: ReturnType<typeof createStyles>;
    language: string;
}>) {
    const active = (selected?.profesionalInstitucionId ?? selected?.id) === (item.profesionalInstitucionId ?? item.id);
    return <Pressable style={[styles.profCard, active && styles.profCardSelected]} onPress={() => onSelect(item)}><Text style={styles.profName}>{item.apellido}, {item.nombre}</Text><Text style={styles.profSpecialty}>{item.especialidad}</Text><Text style={styles.profInstitution}>{item.institucion}</Text>{active ? <Text style={styles.selectedTag}>{language === 'en' ? 'Selected' : 'Seleccionado'}</Text> : null}</Pressable>;
}
function selectedTimeLabel(slot: AppointmentSlot | null, language: string) {
    if (slot)
        return `${slot.hora} hs`;
    if (language === 'en')
        return 'Choose an available time';
    return 'Eleg� un horario disponible';
}
function CalendarAvailability({ monthCursor, months, weekdays, cells, selectedDate, selectDate, moveMonth, selectedSlot, showTimes, toggleTimes, slotsForDate, selectSlot, styles }: Readonly<{
    monthCursor: Date;
    months: string[];
    weekdays: string[];
    cells: CalendarCell[];
    selectedDate: string;
    selectDate: (date: string) => void;
    moveMonth: (delta: number) => void;
    selectedSlot: AppointmentSlot | null;
    showTimes: boolean;
    toggleTimes: () => void;
    slotsForDate: AppointmentSlot[];
    selectSlot: (slot: AppointmentSlot) => void;
    styles: ReturnType<typeof createStyles>;
}>) {
    const { t, language } = useTranslation();
    const selectedTimeText = selectedTimeLabel(selectedSlot, language);
    return <View><View style={styles.calendarTop}><Pressable onPress={() => moveMonth(-1)} style={styles.monthButton}><Text style={styles.monthButtonText}>‹</Text></Pressable><Text style={styles.monthTitle}>{months[monthCursor.getMonth()]} {monthCursor.getFullYear()}</Text><Pressable onPress={() => moveMonth(1)} style={styles.monthButton}><Text style={styles.monthButtonText}>›</Text></Pressable></View>
    <View style={styles.weekRow}>{weekdays.map((day) => <Text key={day} style={styles.weekDay}>{day}</Text>)}</View><View style={styles.calendarGrid}>{cells.map((cell) => <CalendarDay key={cell.key} cell={cell} selected={cell.iso === selectedDate} onSelect={selectDate} styles={styles}/>)}</View>
    <Pressable style={[styles.timeSelector, !selectedDate && { opacity: 0.55 }]} disabled={!selectedDate} onPress={toggleTimes}><View style={{ flex: 1 }}><Text style={styles.dropdownLabel}>{t('appointment.timeStep')}</Text><Text style={styles.dropdownValue}>{selectedTimeText}</Text></View><Text style={styles.dropdownChevron}>{showTimes ? '▲' : '▼'}</Text></Pressable>
    {showTimes ? <View style={styles.timeGrid}>{slotsForDate.map((slot) => <TimeOption key={`${slot.fecha}-${slot.hora}`} slot={slot} selected={selectedSlot} onSelect={selectSlot} styles={styles}/>)}</View> : null}
  </View>;
}
function CalendarDay({ cell, selected, onSelect, styles }: Readonly<{
    cell: CalendarCell;
    selected: boolean;
    onSelect: (date: string) => void;
    styles: ReturnType<typeof createStyles>;
}>) {
    return <Pressable disabled={!cell.available} onPress={() => onSelect(cell.iso)} style={[styles.dayCell, !cell.inMonth && styles.dayCellOut, !cell.available && styles.dayCellDisabled, selected && styles.dayCellSelected]}><Text style={[styles.dayText, !cell.available && styles.dayTextDisabled, selected && styles.dayTextSelected]}>{cell.dayLabel}</Text></Pressable>;
}
function TimeOption({ slot, selected, onSelect, styles }: Readonly<{
    slot: AppointmentSlot;
    selected: AppointmentSlot | null;
    onSelect: (slot: AppointmentSlot) => void;
    styles: ReturnType<typeof createStyles>;
}>) {
    const active = selected?.fecha === slot.fecha && selected?.hora === slot.hora;
    return <Pressable style={[styles.timeChip, active && styles.timeChipSelected]} onPress={() => onSelect(slot)}><Text style={[styles.timeChipText, active && styles.timeChipTextSelected]}>{slot.hora} hs</Text></Pressable>;
}
function AvailabilityContent(props: Readonly<{
    selected: Professional | null;
    loading: boolean;
    slots: AppointmentSlot[];
    sending: boolean;
    joinWaitlist: () => void;
    calendar: React.ReactNode;
    styles: ReturnType<typeof createStyles>;
    language: string;
}>) {
    const { t } = useTranslation();
    if (!props.selected)
        return <Text style={props.styles.muted}>{props.language === 'en' ? 'Select a professional first.' : 'Primero seleccioná un profesional.'}</Text>;
    if (props.loading)
        return <Text style={props.styles.muted}>{t('common.loading')}</Text>;
    if (props.slots.length)
        return props.calendar;
    return <View style={{ gap: 12 }}><MtEmptyState title={props.language === 'en' ? 'No availability' : 'Sin disponibilidad'} subtitle={props.language === 'en' ? 'No time slots were found for this professional.' : 'No encontramos horarios para este profesional.'}/><MtButton title={props.language === 'en' ? 'Join waitlist' : 'Anotarme en lista de espera'} variant="secondary" loading={props.sending} onPress={props.joinWaitlist}/></View>;
}
function AvailabilitySection(props: Readonly<{
    selected: Professional | null;
    loading: boolean;
    slots: AppointmentSlot[];
    sending: boolean;
    joinWaitlist: () => void;
    calendar: React.ReactNode;
    styles: ReturnType<typeof createStyles>;
    language: string;
}>) {
    const { t } = useTranslation();
    return <><Text style={props.styles.step}>{t('appointment.dateStep')}</Text><MtCard style={props.styles.block}><AvailabilityContent {...props}/></MtCard></>;
}
function ReasonSection({ motivo, setMotivo, observaciones, setObservaciones, styles, theme, language }: Readonly<{
    motivo: string;
    setMotivo: (value: string) => void;
    observaciones: string;
    setObservaciones: (value: string) => void;
    styles: ReturnType<typeof createStyles>;
    theme: MediturnosTheme;
    language: string;
}>) {
    const { t } = useTranslation();
    return <><Text style={styles.step}>{t('appointment.reasonStep')}</Text><MtCard style={styles.block}><Text style={styles.label}>{t('appointment.reason')} *</Text><TextInput value={motivo} onChangeText={setMotivo} placeholder={language === 'en' ? 'Example: checkup, pain, test...' : 'Ej: control general, dolor, estudio...'} placeholderTextColor={theme.colors.soft} style={styles.input}/><Text style={[styles.label, { marginTop: 14 }]}>{t('appointment.observations')} *</Text><TextInput value={observaciones} onChangeText={setObservaciones} placeholder={language === 'en' ? 'Additional information for the professional' : 'Información adicional para el profesional'} placeholderTextColor={theme.colors.soft} multiline textAlignVertical="top" style={[styles.input, styles.textArea]}/></MtCard></>;
}
function getAttachButtonTitle(documentation: PickedMedia | null, language: string) {
    if (documentation) {
        return language === 'en' ? 'Change document' : 'Cambiar documentación';
    }
    return language === 'en' ? '📎 Attach document' : '📎 Adjuntar documentación';
}

function AttachmentSection({ documentation, pick, styles, language }: Readonly<{
    documentation: PickedMedia | null;
    pick: () => void;
    styles: ReturnType<typeof createStyles>;
    language: string;
}>) {
    const { t } = useTranslation();
    const buttonTitle = getAttachButtonTitle(documentation, language);
    return <><Text style={styles.step}>{t('appointment.attachStep')}</Text><MtCard style={styles.block}><Text style={styles.attachIntro}>📎 {t('appointment.attachOptional')}</Text><MtButton title={buttonTitle} variant="secondary" onPress={pick} style={{ marginTop: 12 }}/>{documentation ? <Text style={styles.attachmentName}>{language === 'en' ? 'Selected file:' : 'Archivo seleccionado:'} {documentation.fileName ?? 'imagen'}</Text> : null}</MtCard></>;
}
function SummaryActions({ created, sending, confirm, reset, language, styles }: Readonly<{
    created: TurnoResponse | null;
    sending: boolean;
    confirm: () => void;
    reset: () => void;
    language: string;
    styles: ReturnType<typeof createStyles>;
}>) {
    const { t } = useTranslation();
    if (!created)
        return <MtButton title={t('appointment.confirm')} loading={sending} disabled={sending} onPress={confirm} style={{ marginTop: 16 }}/>;
    return <View style={styles.successActions}><MtButton title={language === 'en' ? 'View my appointments' : 'Ver mis turnos'} onPress={() => router.replace('/paciente/turnos')}/><MtButton title={language === 'en' ? 'Request another' : 'Solicitar otro'} variant="ghost" onPress={reset}/></View>;
}
function summaryProfessionalText(professional: Professional | null, english: boolean) {
    if (professional)
        return `${professional.apellido}, ${professional.nombre}`;
    if (english)
        return 'Not selected';
    return 'Sin seleccionar';
}

function summaryDocumentationText(documentation: PickedMedia | null, english: boolean) {
    if (documentation?.fileName)
        return documentation.fileName;
    if (english)
        return 'Not attached';
    return 'Sin adjuntar';
}
function SummarySection({ professional, slot, documentation, created, sending, confirm, reset, styles, language }: Readonly<{
    professional: Professional | null;
    slot: AppointmentSlot | null;
    documentation: PickedMedia | null;
    created: TurnoResponse | null;
    sending: boolean;
    confirm: () => void;
    reset: () => void;
    styles: ReturnType<typeof createStyles>;
    language: string;
}>) {
    const english = language === 'en';
    const professionalText = summaryProfessionalText(professional, english);
    const documentationText = summaryDocumentationText(documentation, english);
    return <MtCard style={styles.summary}><Text style={styles.summaryTitle}>{english ? 'Summary' : 'Resumen'}</Text><Text style={styles.summaryLine}>{english ? 'Professional:' : 'Profesional:'} {professionalText}</Text><Text style={styles.summaryLine}>{english ? 'Specialty:' : 'Especialidad:'} {professional?.especialidad ?? '-'}</Text><Text style={styles.summaryLine}>{english ? 'Time:' : 'Horario:'} {slot ? `${slot.fecha} ${slot.hora}` : '-'}</Text><Text style={styles.summaryLine}>{english ? 'Documentation:' : 'Documentación:'} {documentationText}</Text><SummaryActions created={created} sending={sending} confirm={confirm} reset={reset} language={language} styles={styles}/></MtCard>;
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
    const [monthCursor, setMonthCursor] = useState(() => parseIsoDateLocal(todayLocalIso()));
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
        if (selectedProfessional)
            loadSlots(selectedProfessional.profesionalInstitucionId ?? selectedProfessional.id);
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
        }
        catch (error: unknown) {
            setNotice({ type: 'error', title: language === 'en' ? 'Professionals could not be loaded' : 'No se pudieron cargar profesionales', message: readableError(error) });
        }
        finally {
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
                if (y && m)
                    setMonthCursor(new Date(y, m - 1, 1));
            }
            setShowTimes(false);
        }
        catch (error: unknown) {
            setSlots([]);
            setSelectedSlot(null);
            setSelectedDate('');
            setNotice({ type: 'error', title: language === 'en' ? 'Availability could not be loaded' : 'No se pudo cargar disponibilidad', message: readableError(error) });
        }
        finally {
            setSlotsLoading(false);
        }
    };
    const filteredProfessionals = useMemo(() => {
        const text = query.trim().toLowerCase();
        if (!text)
            return professionals;
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
        chooseDocumentSource((media) => {
            setDocumentation(media);
            setNotice(null);
        }, (message) => setNotice({ type: 'error', title: language === 'en' ? 'We could not attach the document' : 'No pudimos adjuntar documentación', message }));
    };
    const handleConfirm = async () => {
        setNotice(null);
        setCreatedTurno(null);
        const validation = requestValidation({ pacienteId, professional: selectedProfessional, slot: selectedSlot, motivo, observaciones, language });
        if (validation.notice) {
            setNotice(validation.notice);
            return;
        }
        const { professional, slot, pacienteId: validPatientId } = validation.context;
        try {
            setSending(true);
            const obsFinal = [observaciones.trim(), documentation?.fileName ? `Documentación seleccionada por el paciente: ${documentation.fileName}` : null].filter(Boolean).join(' | ');
            const created = await appointmentService.requestAppointment({ pacienteId: validPatientId, profesionalId: professional.id, profesionalInstitucionId: professional.profesionalInstitucionId ?? professional.id, especialidadId: professional.especialidadId, fecha: slot.fecha, hora: slot.hora, fechaHora: slot.fechaHora, motivoConsulta: motivo.trim(), observaciones: obsFinal, documentacion: documentation });
            setCreatedTurno(created);
            setNotice({ type: 'success', title: language === 'en' ? 'Appointment confirmed' : 'Turno confirmado', message: language === 'en' ? `Your appointment was registered for ${created.fecha || slot.fecha} at ${created.hora || slot.hora}. #${created.id}.` : `Tu turno quedó registrado para el ${created.fecha || slot.fecha} a las ${created.hora || slot.hora} hs. N° ${created.id}.` });
        }
        catch (error: unknown) {
            setNotice({ type: 'error', title: language === 'en' ? 'Appointment could not be requested' : 'No se pudo solicitar el turno', message: readableError(error, language === 'en' ? 'The time may no longer be available. Try another one.' : 'El horario pudo haber sido tomado. Probá otro.') });
        }
        finally {
            setSending(false);
        }
    };
    const handleJoinWaitlist = async () => {
        const copy = requestCopy(language);
        if (!pacienteId || !selectedProfessional) {
            setNotice({ type: 'error', title: copy.missingTitle, message: copy.waitlistMissing });
            return;
        }
        try {
            setSending(true);
            await waitlistService.join({ pacienteId, profesionalInstitucionId: selectedProfessional.profesionalInstitucionId ?? selectedProfessional.id, especialidadId: selectedProfessional.especialidadId ?? 1, observaciones: query || undefined });
            setNotice({ type: 'success', title: copy.waitlistSuccessTitle, message: copy.waitlistSuccess });
        }
        catch (error: unknown) {
            setNotice({ type: 'error', title: copy.waitlistErrorTitle, message: readableError(error, copy.retry) });
        }
        finally {
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
    if (loading)
        return <MtLoading text={t('common.loading')}/>;
    const selectSlot = (slot: AppointmentSlot) => { setSelectedSlot(slot); setShowTimes(false); setNotice(null); };
    const calendar = <CalendarAvailability monthCursor={monthCursor} months={months} weekdays={weekdays} cells={calendarCells} selectedDate={selectedDate} selectDate={handleSelectDate} moveMonth={moveMonth} selectedSlot={selectedSlot} showTimes={showTimes} toggleTimes={() => setShowTimes((current) => !current)} slotsForDate={slotsForDate} selectSlot={selectSlot} styles={styles}/>;
    return <><MtScreen scroll><MtHeader eyebrow={language === 'en' ? 'NEW APPOINTMENT' : 'NUEVO TURNO'} title={t('appointment.requestTitle')} subtitle={t('appointment.requestSubtitle')}/>
    {notice ? <NoticeBox notice={notice}/> : null}
    <ProfessionalSection selected={selectedProfessional} query={query} setQuery={setQuery} professionals={filteredProfessionals} onSelect={handleSelectProfessional} styles={styles} theme={theme} language={language}/>
    <AvailabilitySection selected={selectedProfessional} loading={slotsLoading} slots={slots} sending={sending} joinWaitlist={handleJoinWaitlist} calendar={calendar} styles={styles} language={language}/>
    <ReasonSection motivo={motivo} setMotivo={setMotivo} observaciones={observaciones} setObservaciones={setObservaciones} styles={styles} theme={theme} language={language}/>
    <AttachmentSection documentation={documentation} pick={pickDocumentation} styles={styles} language={language}/>
    <SummarySection professional={selectedProfessional} slot={selectedSlot} documentation={documentation} created={createdTurno} sending={sending} confirm={handleConfirm} reset={resetForm} styles={styles} language={language}/>
  </MtScreen><MtBottomNav active="solicitar"/></>;
}
function NoticeBox({ notice }: Readonly<{
    notice: Notice;
}>) {
    return <MtNotice type={notice.type === 'error' ? 'danger' : 'success'} title={notice.title} message={notice.message} style={{ marginBottom: 14 }}/>;
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

