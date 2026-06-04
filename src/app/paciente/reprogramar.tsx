import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { appointmentService, AppointmentSlot, TurnoResponse } from '../../api/appointmentService';
import { MtBottomNav, MtButton, MtCard, MtHeader, MtLoading, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';

export default function ReprogramarTurnoScreen() {
  const { id } = useLocalSearchParams();
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const [turno, setTurno] = useState<TurnoResponse | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [showDates, setShowDates] = useState(false);
  const [showTimes, setShowTimes] = useState(false);

  useEffect(() => {
    if (id) fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const turnoData = await appointmentService.getAppointmentDetail(Number(id));
      setTurno(turnoData);

      const piId = turnoData.profesionalInstitucionId;
      if (!piId) {
        Alert.alert('Falta dato del turno', 'El backend no devolvió profesionalInstitucionId. No puedo pedir disponibilidad real para reprogramar.');
        return;
      }

      setLoadingSlots(true);
      const slots = (await appointmentService.getDisponibilidad(piId)).filter((slot) => slot.disponible !== false);
      setAvailableSlots(slots);
      const first = slots[0] ?? null;
      setSelectedSlot(first);
      setSelectedDate(first?.fecha ?? '');
    } catch (error: any) {
      Alert.alert('Error', readableError(error, 'No se pudo cargar la información del turno.'));
    } finally {
      setLoading(false);
      setLoadingSlots(false);
    }
  };

  const availableDates = useMemo(() => Array.from(new Set(availableSlots.map((slot) => slot.fecha))).filter(Boolean), [availableSlots]);
  const slotsForDate = useMemo(() => availableSlots.filter((slot) => slot.fecha === selectedDate), [availableSlots, selectedDate]);

  const handleSelectDate = (date: string) => {
    const firstSlot = availableSlots.find((slot) => slot.fecha === date) ?? null;
    setSelectedDate(date);
    setSelectedSlot(firstSlot);
    setShowDates(false);
    setShowTimes(true);
  };

  const handleConfirm = async () => {
    if (!turno) return;
    if (!selectedSlot) {
      Alert.alert('Aviso', 'Por favor seleccioná una nueva fecha y hora.');
      return;
    }
    if (!turno.profesionalId) {
      Alert.alert('Falta dato del turno', 'El backend no devolvió profesionalId. No puedo reprogramar este turno.');
      return;
    }

    try {
      setRescheduling(true);
      await appointmentService.reprogramar(Number(id), {
        profesionalId: turno.profesionalId,
        profesionalInstitucionId: turno.profesionalInstitucionId,
        especialidadId: turno.especialidadId,
        fecha: selectedSlot.fecha,
        hora: selectedSlot.hora,
        fechaHora: selectedSlot.fechaHora,
      });

      Alert.alert(
        'Turno reprogramado',
        `Tu turno fue reprogramado para el ${selectedSlot.fecha} a las ${selectedSlot.hora}.`,
        [{ text: 'Entendido', onPress: () => router.replace('/paciente/turnos') }]
      );
    } catch (error: any) {
      Alert.alert('No se pudo reprogramar', readableError(error, 'El backend rechazó el horario o faltan datos del turno.'));
    } finally {
      setRescheduling(false);
    }
  };

  if (loading) return <MtLoading text="Cargando turno..." />;
  if (!turno) return <MtLoading text="No se encontró el turno." />;

  return (
    <>
      <MtScreen scroll>
        <MtHeader eyebrow="AGENDA" title="Reprogramar turno" subtitle="Elegí una nueva fecha y horario disponible." />

        <MtCard style={styles.doctorCard}>
          <Text style={styles.doctorName}>{turno.profesionalNombre || 'Profesional'}</Text>
          <Text style={styles.specialty}>{turno.especialidad}</Text>
          <Text style={styles.currentDate}>Actual: {turno.fecha} · {turno.hora} hs</Text>
        </MtCard>

        <Text style={styles.sectionTitle}>Nueva fecha y horario</Text>
        <MtCard style={styles.section}>
          {loadingSlots ? (
            <Text style={styles.muted}>Buscando horarios disponibles...</Text>
          ) : availableSlots.length === 0 ? (
            <Text style={styles.muted}>No hay otros horarios disponibles.</Text>
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

        <View style={styles.actionButtons}>
          <MtButton title="Confirmar nueva fecha" loading={rescheduling} disabled={!selectedSlot || rescheduling} onPress={handleConfirm} />
          <MtButton title="Cancelar" variant="ghost" onPress={() => router.back()} />
        </View>
      </MtScreen>
      <MtBottomNav active="turnos" />
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
    doctorCard: { marginBottom: 18, backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    doctorName: { fontSize: 20, fontWeight: '900', color: theme.mode === 'dark' ? '#06201D' : '#FFFFFF' },
    specialty: { fontSize: 14, color: theme.mode === 'dark' ? '#06201D' : theme.colors.primaryLight, marginTop: 4, fontWeight: '800' },
    currentDate: { fontSize: 13, color: theme.mode === 'dark' ? '#06201D' : theme.colors.primaryLight, marginTop: 10, fontWeight: '700' },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: theme.colors.ink, marginBottom: 10 },
    section: { marginBottom: 18 },
    muted: { color: theme.colors.muted, fontWeight: '700', lineHeight: 20 },
    dropdownArea: { gap: 10 },
    dropdownButton: { minHeight: 58, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.bg, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
    dropdownLabel: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', marginBottom: 2 },
    dropdownValue: { color: theme.colors.ink, fontSize: 15, fontWeight: '800' },
    dropdownChevron: { color: theme.colors.primary, fontWeight: '900' },
    dropdownList: { maxHeight: 210, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, overflow: 'hidden' },
    optionItem: { paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    optionText: { color: theme.colors.ink, fontWeight: '800' },
    actionButtons: { gap: 12, marginTop: 4 },
  });
}
