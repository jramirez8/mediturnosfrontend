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

type Notice = {
  type: 'success' | 'error';
  title: string;
  message: string;
};

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
  const [showDates, setShowDates] = useState(false);
  const [showTimes, setShowTimes] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');
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
        if (found) {
          setSelectedProfessional(found);
          // Lo pongo primero para que también se vea en la lista horizontal.
          nextData = [found, ...data.filter((p) => (p.profesionalInstitucionId ?? p.id) !== (found.profesionalInstitucionId ?? found.id))];
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
      setShowDates(false);
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

  const availableDates = useMemo(() => Array.from(new Set(slots.map((slot) => slot.fecha))).filter(Boolean), [slots]);
  const slotsForDate = useMemo(() => slots.filter((slot) => slot.fecha === selectedDate), [slots, selectedDate]);

  const handleSelectProfessional = (item: Professional) => {
    setNotice(null);
    setCreatedTurno(null);
    setSelectedProfessional(item);
    setSelectedSlot(null);
    setSelectedDate('');
    setSlots([]);
    setShowDates(false);
    setShowTimes(false);
  };

  const handleSelectDate = (date: string) => {
    const firstSlot = slots.find((slot) => slot.fecha === date) ?? null;
    setSelectedDate(date);
    setSelectedSlot(firstSlot);
    setShowDates(false);
    setShowTimes(true);
    setNotice(null);
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

    try {
      setSending(true);
      const created = await appointmentService.requestAppointment({
        pacienteId,
        profesionalId: selectedProfessional.id,
        profesionalInstitucionId: selectedProfessional.profesionalInstitucionId ?? selectedProfessional.id,
        especialidadId: selectedProfessional.especialidadId,
        fecha: selectedSlot.fecha,
        hora: selectedSlot.hora,
        fechaHora: selectedSlot.fechaHora,
        motivoConsulta: motivo,
        observaciones: [motivo, observaciones].filter(Boolean).join(' - '),
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
              <Text style={styles.selectedHint}>Podés confirmar este profesional o elegir otro de la lista.</Text>
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
            <View style={styles.dropdownArea}>
              <DropdownBox
                label="Fecha"
                value={selectedDate || 'Elegir fecha'}
                open={showDates}
                onToggle={() => {
                  setShowDates((current) => !current);
                  setShowTimes(false);
                }}
                styles={styles}
              />
              {showDates && (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                  {availableDates.map((date) => (
                    <Pressable key={date} style={styles.optionItem} onPress={() => handleSelectDate(date)}>
                      <Text style={styles.optionText}>{date}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              <DropdownBox
                label="Horario"
                value={selectedSlot ? `${selectedSlot.hora} hs` : 'Elegir horario'}
                open={showTimes}
                disabled={!selectedDate}
                onToggle={() => {
                  setShowTimes((current) => !current);
                  setShowDates(false);
                }}
                styles={styles}
              />
              {showTimes && (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                  {slotsForDate.map((slot) => (
                    <Pressable
                      key={`${slot.fecha}-${slot.hora}`}
                      style={styles.optionItem}
                      onPress={() => {
                        setSelectedSlot(slot);
                        setShowTimes(false);
                        setNotice(null);
                      }}
                    >
                      <Text style={styles.optionText}>{slot.hora} hs</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </MtCard>

        <Text style={styles.step}>3. Motivo</Text>
        <MtCard style={styles.block}>
          <Text style={styles.label}>Motivo de consulta</Text>
          <TextInput value={motivo} onChangeText={setMotivo} placeholder="Ej: control general, dolor, estudio..." placeholderTextColor={theme.colors.soft} style={styles.input} />
          <Text style={[styles.label, { marginTop: 14 }]}>Observaciones</Text>
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

        <MtCard style={styles.summary}>
          <Text style={styles.summaryTitle}>Resumen</Text>
          <Text style={styles.summaryLine}>Profesional: {selectedProfessional ? `${selectedProfessional.apellido}, ${selectedProfessional.nombre}` : 'Sin seleccionar'}</Text>
          <Text style={styles.summaryLine}>Especialidad: {selectedProfessional?.especialidad ?? '-'}</Text>
          <Text style={styles.summaryLine}>Horario: {selectedSlot ? `${selectedSlot.fecha} ${selectedSlot.hora}` : '-'}</Text>

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

function DropdownBox({
  label,
  value,
  open,
  disabled,
  onToggle,
  styles,
}: {
  label: string;
  value: string;
  open: boolean;
  disabled?: boolean;
  onToggle: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable disabled={disabled} style={[styles.dropdownButton, disabled && { opacity: 0.55 }]} onPress={onToggle}>
      <View style={{ flex: 1 }}>
        <Text style={styles.dropdownLabel}>{label}</Text>
        <Text style={styles.dropdownValue}>{value}</Text>
      </View>
      <Text style={styles.dropdownChevron}>{open ? '▲' : '▼'}</Text>
    </Pressable>
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
    dropdownArea: { gap: 10 },
    dropdownButton: { minHeight: 58, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.bg, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
    dropdownLabel: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', marginBottom: 2 },
    dropdownValue: { color: theme.colors.ink, fontSize: 15, fontWeight: '800' },
    dropdownChevron: { color: theme.colors.primary, fontWeight: '900' },
    dropdownList: { maxHeight: 210, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, overflow: 'hidden' },
    optionItem: { paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    optionText: { color: theme.colors.ink, fontWeight: '800' },
    label: { color: theme.colors.ink, fontWeight: '900', marginBottom: 8 },
    input: { minHeight: 50, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, paddingHorizontal: 14, color: theme.colors.ink, backgroundColor: theme.colors.bg },
    textArea: { minHeight: 96, paddingTop: 14 },
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
