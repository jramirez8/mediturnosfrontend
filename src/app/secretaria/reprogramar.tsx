import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { appointmentService, AppointmentSlot, TurnoResponse } from '../../api/appointmentService';
import { MtButton, MtCard, MtHeader, MtLoading, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';

type Notice = {
  type: 'success' | 'error';
  title: string;
  message: string;
};

export default function ReprogramarScreen() {
  const params = useLocalSearchParams<{ id?: string; turnoId?: string }>();
  const id = params.id || params.turnoId;
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
  const [notice, setNotice] = useState<Notice | null>(null);
  const [updatedTurno, setUpdatedTurno] = useState<TurnoResponse | null>(null);

  useEffect(() => {
    if (id) fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setNotice(null);
      const turnoData = await appointmentService.getAppointmentDetail(Number(id));
      setTurno(turnoData);

      const piId = turnoData.profesionalInstitucionId;
      if (!piId) {
        setNotice({
          type: 'error',
          title: 'No se puede reprogramar',
          message: 'No encontramos la información necesaria para consultar disponibilidad de este turno.',
        });
        return;
      }

      setLoadingSlots(true);
      const slots = (await appointmentService.getDisponibilidad(piId)).filter((slot) => slot.disponible !== false);
      setAvailableSlots(slots);
      const first = slots[0] ?? null;
      setSelectedSlot(first);
      setSelectedDate(first?.fecha ?? '');
    } catch (error: any) {
      setNotice({ type: 'error', title: 'No se pudo cargar el turno', message: readableError(error, 'No se pudo cargar la información del turno.') });
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
    setNotice(null);
  };

  const handleConfirm = async () => {
    setNotice(null);
    setUpdatedTurno(null);

    if (!turno) return;
    if (!selectedSlot) {
      setNotice({ type: 'error', title: 'Falta horario', message: 'Seleccioná una nueva fecha y hora.' });
      return;
    }
    if (!turno.profesionalId) {
      setNotice({ type: 'error', title: 'No se puede reprogramar', message: 'No encontramos la información necesaria para reprogramar este turno.' });
      return;
    }

    try {
      setRescheduling(true);
      const updated = await appointmentService.reprogramar(Number(id), {
        profesionalId: turno.profesionalId,
        profesionalInstitucionId: turno.profesionalInstitucionId,
        especialidadId: turno.especialidadId,
        fecha: selectedSlot.fecha,
        hora: selectedSlot.hora,
        fechaHora: selectedSlot.fechaHora,
      });

      setTurno(updated);
      setUpdatedTurno(updated);
      setNotice({
        type: 'success',
        title: 'Turno reprogramado',
        message: `Tu turno quedó reprogramado para el ${updated.fecha || selectedSlot.fecha} a las ${updated.hora || selectedSlot.hora} hs.`,
      });
    } catch (error: any) {
      setNotice({ type: 'error', title: 'No se pudo reprogramar', message: readableError(error, 'El horario no está disponible o faltan datos del turno.') });
    } finally {
      setRescheduling(false);
    }
  };

  if (loading) return <MtLoading text="Cargando turno..." />;

  return (
    <>
      <MtScreen scroll>
        <MtHeader eyebrow="SECRETARÍA" title="Reprogramar turno" subtitle="Elegí una nueva fecha y horario disponible." />

        {!!notice && <NoticeBox notice={notice} styles={styles} />}

        {!turno ? (
          <MtCard style={styles.section}>
            <Text style={styles.muted}>No se encontró el turno.</Text>
            <MtButton title="Volver a turnos" onPress={() => router.replace('/secretaria/turnos')} style={{ marginTop: 14 }} />
          </MtCard>
        ) : (
          <>
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
              ) : updatedTurno ? (
                <View style={styles.successActions}>
                  <MtButton title="Ver turnos" onPress={() => router.replace('/secretaria/turnos')} />
                  <MtButton title="Elegir otro horario" variant="ghost" onPress={() => { setUpdatedTurno(null); setNotice(null); }} />
                </View>
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

            {!updatedTurno && (
              <View style={styles.actionButtons}>
                <MtButton title="Confirmar nueva fecha" loading={rescheduling} disabled={!selectedSlot || rescheduling} onPress={handleConfirm} />
                <MtButton title="Cancelar" variant="ghost" onPress={() => router.back()} />
              </View>
            )}
          </>
        )}
      </MtScreen>
      <RoleBottomNav role="secretaria" active="turnos" />
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
    successActions: { gap: 10 },
    noticeBox: { borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 14 },
    noticeSuccess: { backgroundColor: theme.mode === 'dark' ? '#063D35' : '#ECFDF5', borderColor: theme.colors.success },
    noticeError: { backgroundColor: theme.mode === 'dark' ? '#3F1111' : '#FEF2F2', borderColor: theme.colors.danger },
    noticeTitle: { fontWeight: '900', fontSize: 15, marginBottom: 4 },
    noticeMessage: { fontWeight: '700', lineHeight: 20 },
    noticeSuccessText: { color: theme.mode === 'dark' ? '#D1FAE5' : '#065F46' },
    noticeErrorText: { color: theme.mode === 'dark' ? '#FEE2E2' : '#991B1B' },
  });
}
