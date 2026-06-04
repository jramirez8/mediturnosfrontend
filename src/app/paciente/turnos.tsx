import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { appointmentService, TurnoResponse } from '../../api/appointmentService';
import { useAuthStore } from '../../auth/authStore';
import { MtBottomNav, MtButton, MtCard, MtEmptyState, MtHeader, MtLoading, MtPill, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';

type Tab = 'proximos' | 'historial' | 'todos';
const FINAL_STATES = ['FINALIZADO', 'ATENDIDO', 'CANCELADO', 'AUSENTE'];

export default function MisTurnosScreen() {
  const { pacienteId } = useAuthStore();
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const [appointments, setAppointments] = useState<TurnoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>('proximos');

  useEffect(() => {
    fetchAppointments();
  }, [pacienteId]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getMyAppointments(pacienteId);
      setAppointments(data);
    } catch (error: any) {
      Alert.alert('Error', readableError(error, 'No se pudieron cargar los turnos.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filtered = useMemo(() => {
    return appointments
      .filter((turno) => {
        const estado = String(turno.estado).toUpperCase();
        if (tab === 'proximos') return !FINAL_STATES.includes(estado);
        if (tab === 'historial') return FINAL_STATES.includes(estado);
        return true;
      })
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
  }, [appointments, tab]);

  const handleCancel = (turno: TurnoResponse) => {
    Alert.alert('Cancelar turno', `¿Querés cancelar el turno de ${turno.especialidad}?`, [
      { text: 'No' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            await appointmentService.cancelar(turno.id);
            await fetchAppointments();
          } catch (error: any) {
            Alert.alert('No se pudo cancelar', readableError(error));
          }
        },
      },
    ]);
  };

  if (loading) return <MtLoading text="Buscando tus turnos..." />;

  return (
    <>
      <MtScreen scroll={false}>
        <MtHeader eyebrow="AGENDA" title="Mis turnos" subtitle="Consultá próximos turnos, historial y acciones rápidas." />

        <View style={styles.tabs}>
          <MtPill label="Próximos" selected={tab === 'proximos'} onPress={() => setTab('proximos')} />
          <MtPill label="Historial" selected={tab === 'historial'} onPress={() => setTab('historial')} tone="success" />
          <MtPill label="Todos" selected={tab === 'todos'} onPress={() => setTab('todos')} tone="muted" />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchAppointments(); }}
          ListEmptyComponent={
            <MtEmptyState
              title="No hay turnos para mostrar"
              subtitle="Podés solicitar uno nuevo desde la app."
              actionTitle="Solicitar turno"
              onAction={() => router.push('/paciente/solicitar')}
            />
          }
          renderItem={({ item }) => <AppointmentCard item={item} onCancel={() => handleCancel(item)} theme={theme} styles={styles} />}
        />
      </MtScreen>
      <MtBottomNav active="turnos" />
    </>
  );
}

function AppointmentCard({ item, onCancel, styles }: { item: TurnoResponse; onCancel: () => void; theme: MediturnosTheme; styles: ReturnType<typeof createStyles> }) {
  const estado = String(item.estado).toUpperCase();
  const isFinal = FINAL_STATES.includes(estado);
  const tone = estado === 'CONFIRMADO' ? 'success' : estado === 'PENDIENTE' ? 'warning' : estado === 'CANCELADO' ? 'danger' : 'muted';

  return (
    <MtCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarMini}><Text style={styles.avatarMiniText}>Dr</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.specialty}>{item.especialidad}</Text>
          <Text style={styles.doctor}>{item.profesionalNombre}</Text>
          <Text style={styles.place}>{item.institucionNombre}</Text>
        </View>
        <MtPill label={estado} tone={tone as any} />
      </View>

      <View style={styles.dateBox}>
        <Text style={styles.dateText}>📆 {item.fecha}</Text>
        <Text style={styles.dateText}>⏰ {item.hora} hs</Text>
      </View>

      {!!item.motivoConsulta && <Text style={styles.reason}>Motivo: {item.motivoConsulta}</Text>}

      <View style={styles.actions}>
        <MtButton title="Detalle" variant="ghost" onPress={() => router.push({ pathname: '/paciente/turno-detalle', params: { id: item.id } })} style={{ flex: 1 }} />
        {!isFinal && <MtButton title="Reprogramar" variant="secondary" onPress={() => router.push({ pathname: '/paciente/reprogramar', params: { id: item.id } })} style={{ flex: 1 }} />}
      </View>
      {!isFinal && <MtButton title="Cancelar turno" variant="danger" onPress={onCancel} style={{ marginTop: 10 }} />}
    </MtCard>
  );
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    tabs: { flexDirection: 'row', marginBottom: 12 },
    list: { gap: 14, paddingBottom: 120 },
    card: { gap: 12 },
    cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    avatarMini: { width: 46, height: 46, borderRadius: 16, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
    avatarMiniText: { color: theme.colors.primaryDark, fontWeight: '900' },
    specialty: { color: theme.colors.primary, fontWeight: '900', fontSize: 13 },
    doctor: { color: theme.colors.ink, fontWeight: '900', fontSize: 16, marginTop: 2 },
    place: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
    dateBox: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', backgroundColor: theme.colors.bg, padding: 12, borderRadius: 16 },
    dateText: { color: theme.colors.ink, fontWeight: '800' },
    reason: { color: theme.colors.muted, lineHeight: 20 },
    actions: { flexDirection: 'row', gap: 10 },
  });
}
