import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { appointmentService, TurnoResponse } from '../../api/appointmentService';

export default function TurnoDetalleScreen() {
  const { id } = useLocalSearchParams();
  const [turno, setTurno] = useState<TurnoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (id) fetchTurno();
  }, [id]);

  const fetchTurno = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAppointmentDetail(Number(id));
      setTurno(data);
    } catch (error) {
      console.error("Error fetching turno:", error);
      Alert.alert("Error", "No se pudo cargar el detalle del turno.");
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = () => {
    router.push({
        pathname: '/paciente/reprogramar',
        params: { id: turno?.id }
    });
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancelar turno",
      "¿Estás seguro de que deseás cancelar este turno?",
      [
        { text: "No, mantener", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              setCanceling(true);
              await appointmentService.cancelar(Number(id));
              Alert.alert("Turno cancelado", "El turno ha sido cancelado con éxito.");
              router.replace('/paciente/turnos');
            } catch (error) {
              Alert.alert("Error", "No se pudo cancelar el turno.");
            } finally {
              setCanceling(false);
            }
          }
        }
      ]
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0F766E" /></View>;
  if (!turno) return <View style={styles.center}><Text>No se encontró el turno.</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
           <Text style={{color: 'white', fontSize: 20}}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de turno</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.doctorCard}>
          <View style={styles.doctorHeader}>
            <View style={styles.avatarContainer}>
               <Text style={{color: 'white', fontSize: 24}}>DR</Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{turno.profesionalNombre}</Text>
              <Text style={styles.specialty}>{turno.especialidad}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsList}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Fecha y hora</Text>
            <Text style={styles.detailValue}>📅 {turno.fecha} a las {turno.hora}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Sede</Text>
            <Text style={styles.detailValue}>📍 {turno.institucionNombre}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Estado</Text>
            <Text style={[styles.detailValue, { fontWeight: 'bold' }]}>{turno.estado}</Text>
          </View>

          {turno.observaciones && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Observaciones</Text>
              <Text style={[styles.detailValue, styles.italicText]}>{turno.observaciones}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.rescheduleButton} onPress={handleReschedule}>
            <Text style={styles.rescheduleButtonText}>Reprogramar turno</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cancelButton, canceling && { opacity: 0.5 }]}
            onPress={handleCancel}
            disabled={canceling}
          >
            {canceling ? <ActivityIndicator color="#ef4444" /> : <Text style={styles.cancelButtonText}>Cancelar turno</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Barra de Navegación Inferior */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/paciente')}>
          <Text style={styles.navText}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/paciente/perfil')}>
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
        <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.fab} onPress={() => router.push('/paciente/solicitar')}>
            <Text style={{color: 'white', fontSize: 24}}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/paciente/turnos')}>
          <Text style={[styles.navText, { color: '#0F766E' }]}>Turnos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/paciente/historia')}>
          <Text style={styles.navText}>Historia</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#0F766E',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  doctorCard: {
    backgroundColor: '#0F766E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    elevation: 4,
  },
  doctorHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 2 },
  specialty: { fontSize: 14, color: '#CCFBF1' },
  detailsList: { gap: 16 },
  detailItem: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  detailLabel: { fontSize: 12, color: '#0F766E', fontWeight: '600', marginBottom: 4 },
  detailValue: { fontSize: 15, color: '#1f2937', lineHeight: 20 },
  italicText: { fontStyle: 'italic', color: '#9ca3af' },
  actionButtons: { marginTop: 32, gap: 12 },
  rescheduleButton: {
    backgroundColor: '#0F766E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rescheduleButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fee2e2',
  },
  cancelButtonText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  navItem: { flex: 1, alignItems: 'center' },
  navText: { fontSize: 11, color: '#9ca3af' },
  fabContainer: { width: 60, alignItems: 'center', marginTop: -30 },
  fab: {
    width: 50,
    height: 50,
    backgroundColor: '#0F766E',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
