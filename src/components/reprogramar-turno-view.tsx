import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppointmentSlot, TurnoResponse } from '../api/appointmentService';
import { MtButton, MtCard, MtHeader, MtLoading, MtNotice, MtScreen } from './mediturnos';
import { MediturnosTheme } from '../constants/mediturnosTheme';
import { useMtTheme } from '../theme/themeStore';
type Notice = {
    type: 'success' | 'error';
    title: string;
    message: string;
};
type Props = {
    eyebrow: string;
    backTitle: string;
    backPath: string;
    navigation: React.ReactNode;
    loading: boolean;
    loadingSlots: boolean;
    rescheduling: boolean;
    turno: TurnoResponse | null;
    availableSlots: AppointmentSlot[];
    availableDates: string[];
    slotsForDate: AppointmentSlot[];
    selectedDate: string;
    selectedSlot: AppointmentSlot | null;
    showDates: boolean;
    showTimes: boolean;
    notice: Notice | null;
    updatedTurno: TurnoResponse | null;
    onSelectDate: (date: string) => void;
    onSelectSlot: (slot: AppointmentSlot) => void;
    onToggleDates: () => void;
    onToggleTimes: () => void;
    onConfirm: () => void;
    onChooseAnother: () => void;
};
function NoticeBox({ notice }: {
    notice: Notice;
}) { return <MtNotice type={notice.type === 'error' ? 'danger' : 'success'} title={notice.title} message={notice.message} style={{ marginBottom: 14 }}/>; }
function DropdownBox({ label, value, open, disabled, onToggle, styles }: {
    label: string;
    value: string;
    open: boolean;
    disabled?: boolean;
    onToggle: () => void;
    styles: ReturnType<typeof createStyles>;
}) { return <Pressable disabled={disabled} style={[styles.dropdownButton, disabled && { opacity: 0.55 }]} onPress={onToggle}><View style={{ flex: 1 }}><Text style={styles.dropdownLabel}>{label}</Text><Text style={styles.dropdownValue}>{value}</Text></View><Text style={styles.dropdownChevron}>{open ? '▲' : '▼'}</Text></Pressable>; }
function SlotDropdowns(props: Props & {
    styles: ReturnType<typeof createStyles>;
}) {
    return <View style={props.styles.dropdownArea}><DropdownBox label="Fecha" value={props.selectedDate || 'Elegir fecha'} open={props.showDates} onToggle={props.onToggleDates} styles={props.styles}/>{props.showDates ? <ScrollView style={props.styles.dropdownList} nestedScrollEnabled>{props.availableDates.map((date) => <Pressable key={date} style={props.styles.optionItem} onPress={() => props.onSelectDate(date)}><Text style={props.styles.optionText}>{date}</Text></Pressable>)}</ScrollView> : null}<DropdownBox label="Horario" value={props.selectedSlot ? `${props.selectedSlot.hora} hs` : 'Elegir horario'} open={props.showTimes} disabled={!props.selectedDate} onToggle={props.onToggleTimes} styles={props.styles}/>{props.showTimes ? <ScrollView style={props.styles.dropdownList} nestedScrollEnabled>{props.slotsForDate.map((slot) => <Pressable key={`${slot.fecha}-${slot.hora}`} style={props.styles.optionItem} onPress={() => props.onSelectSlot(slot)}><Text style={props.styles.optionText}>{slot.hora} hs</Text></Pressable>)}</ScrollView> : null}</View>;
}
function SelectionContent(props: Props & {
    styles: ReturnType<typeof createStyles>;
}) {
    if (props.loadingSlots)
        return <Text style={props.styles.muted}>Buscando horarios disponibles...</Text>;
    if (!props.availableSlots.length)
        return <Text style={props.styles.muted}>No hay otros horarios disponibles.</Text>;
    if (props.updatedTurno)
        return <View style={props.styles.successActions}><MtButton title={props.backTitle} onPress={() => router.replace(props.backPath)}/><MtButton title="Elegir otro horario" variant="ghost" onPress={props.onChooseAnother}/></View>;
    return <SlotDropdowns {...props}/>;
}
function LoadedContent(props: Props & {
    styles: ReturnType<typeof createStyles>;
}) {
    if (!props.turno)
        return <MtCard style={props.styles.section}><Text style={props.styles.muted}>No se encontró el turno.</Text><MtButton title={props.backTitle} onPress={() => router.replace(props.backPath)} style={{ marginTop: 14 }}/></MtCard>;
    return <><MtCard style={props.styles.doctorCard}><Text style={props.styles.doctorName}>{props.turno.profesionalNombre || 'Profesional'}</Text><Text style={props.styles.specialty}>{props.turno.especialidad}</Text><Text style={props.styles.currentDate}>Actual: {props.turno.fecha} · {props.turno.hora} hs</Text></MtCard><Text style={props.styles.sectionTitle}>Nueva fecha y horario</Text><MtCard style={props.styles.section}><SelectionContent {...props}/></MtCard>{!props.updatedTurno ? <View style={props.styles.actionButtons}><MtButton title="Confirmar nueva fecha" loading={props.rescheduling} disabled={!props.selectedSlot || props.rescheduling} onPress={props.onConfirm}/><MtButton title="Cancelar" variant="ghost" onPress={() => router.back()}/></View> : null}</>;
}
export function ReprogramarTurnoView(props: Props) {
    const theme = useMtTheme();
    const styles = React.useMemo(() => createStyles(theme), [theme.mode]);
    if (props.loading)
        return <MtLoading text="Cargando turno..."/>;
    return <><MtScreen scroll><MtHeader eyebrow={props.eyebrow} title="Reprogramar turno" subtitle="Elegí una nueva fecha y horario disponible."/>{props.notice ? <NoticeBox notice={props.notice}/> : null}<LoadedContent {...props} styles={styles}/></MtScreen>{props.navigation}</>;
}
function createStyles(theme: MediturnosTheme) { return StyleSheet.create({ doctorCard: { marginBottom: 18, backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }, doctorName: { fontSize: 20, fontWeight: '900', color: theme.mode === 'dark' ? '#06201D' : '#FFFFFF' }, specialty: { fontSize: 14, color: theme.mode === 'dark' ? '#06201D' : theme.colors.primaryLight, marginTop: 4, fontWeight: '800' }, currentDate: { fontSize: 13, color: theme.mode === 'dark' ? '#06201D' : theme.colors.primaryLight, marginTop: 10, fontWeight: '700' }, sectionTitle: { fontSize: 18, fontWeight: '900', color: theme.colors.ink, marginBottom: 10 }, section: { marginBottom: 18 }, muted: { color: theme.colors.muted, fontWeight: '700', lineHeight: 20 }, dropdownArea: { gap: 10 }, dropdownButton: { minHeight: 58, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.bg, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }, dropdownLabel: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', marginBottom: 2 }, dropdownValue: { color: theme.colors.ink, fontSize: 15, fontWeight: '800' }, dropdownChevron: { color: theme.colors.primary, fontWeight: '900' }, dropdownList: { maxHeight: 210, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, overflow: 'hidden' }, optionItem: { paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border }, optionText: { color: theme.colors.ink, fontWeight: '800' }, actionButtons: { gap: 12, marginTop: 4 }, successActions: { gap: 10 } }); }

