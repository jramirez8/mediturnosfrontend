import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { appointmentService, AppointmentSlot } from '../../api/appointmentService';
import { professionalService, Professional } from '../../api/professionalService';
import { useAuthStore } from '../../auth/authStore';
import { MtBottomNav, MtButton, MtCard, MtEmptyState, MtHeader, MtLoading, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';

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
      setProfessionals(data);

      const paramId = String(params.profesionalInstitucionId ?? params.professionalId ?? '');
      if (paramId) {
        const found = data.find((p) => String(p.profesionalInstitucionId ?? p.id) === paramId || String(p.id) === paramId);
        if (found) setSelectedProfessional(found);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (profesionalInstitucionId: number) => {
    try {
      setSlotsLoading(true);
      const data = await appointmentService.getDisponibilidad(profesionalInstitucionId);
      const available = data.filter((slot) => slot.disponible !== false);
      setSlots(available);
      const first = available[0] ?? null;
      setSelectedSlot(first);
      setSelectedDate(first?.fecha ?? '');
      setShowDates(false);
      setShowTimes(false);
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
  };

  const handleConfirm = async () => {
    if (!pacienteId) {
      Alert.alert('Falta paciente', 'No pude resolver el paciente logueado. Cerrá sesión y volvé a entrar.');
      return;
    }
    if (!selectedProfessional) {
      Alert.alert('Falta profesional', 'Elegí un profesional para continuar.');
      return;
    }
    if (!selectedSlot) {
      Alert.alert('Falta horario', 'Elegí fecha y hora disponibles.');
      return;
    }

    try {
      setSending(true);
      await appointmentService.requestAppointment({
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
      Alert.alert('Turno solicitado', 'La solicitud fue enviada correctamente.', [
        { text: 'Ver mis turnos', onPress: () => router.replace('/paciente/turnos') },
      ]);
    } catch (error: any) {
      Alert.alert('No se pudo solicitar', readableError(error, 'El horario pudo haber sido tomado. Probá otro.'));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <MtLoading text="Preparando solicitud..." />;

  return (
    <>
      <MtScreen scroll>
        <MtHeader eyebrow="NUEVO TURNO" title="Solicitar turno" subtitle="Elegí profesional, fecha, horario y motivo de consulta." />

        <Text style={styles.step}>1. Profesional</Text>
        <MtCard style={styles.block}>
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
                theme={theme}
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
                theme={theme}
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
          <MtButton title="Confirmar solicitud" loading={sending} onPress={handleConfirm} style={{ marginTop: 16 }} />
        </MtCard>
      </MtScreen>
      <MtBottomNav active="solicitar" />
    </>
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
  theme: MediturnosTheme;
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
    profCardSelected: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
    profName: { color: theme.colors.ink, fontWeight: '900', fontSize: 15 },
    profSpecialty: { color: theme.colors.primary, fontWeight: '800', marginTop: 4 },
    profInstitution: { color: theme.colors.muted, marginTop: 4, fontSize: 12, lineHeight: 17 },
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
  });
}
