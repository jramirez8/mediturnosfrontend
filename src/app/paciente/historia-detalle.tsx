import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { medicalHistoryService } from '../../api/medicalHistoryService';
import { TurnoResponse } from '../../api/appointmentService';

export default function HistoriaDetalleScreen() {
  const { id } = useLocalSearchParams();
  const [record, setRecord] = useState<TurnoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await medicalHistoryService.getRecordDetail(Number(id));
      setRecord(data);
    } catch (error) {
      console.error("Error fetching history detail:", error);
      Alert.alert("Error", "No se pudo cargar el detalle de la atención.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  if (!record) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>No se encontró el registro.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{color: '#0F766E', marginTop: 20}}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
           <Text style={{color: 'white', fontSize: 20}}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de atención</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.doctorCard}>
          <View style={styles.doctorHeader}>
            <View style={styles.avatarContainer}>
               <Text style={{color: 'white', fontSize: 24}}>DR</Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{record.profesionalNombre}</Text>
              <Text style={styles.specialty}>{record.especialidad}</Text>
              <Text style={styles.dateTime}>{record.fecha} - {record.hora}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsList}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Motivo de consulta</Text>
            <Text style={styles.detailValue}>{record.motivoConsulta || 'No especificado'}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Sede de atención</Text>
            <Text style={styles.detailValue}>{record.institucionNombre}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Diagnóstico</Text>
            <Text style={styles.detailValue}>
              {record.diagnostico || 'Sin diagnóstico cargado aún.'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Observaciones</Text>
            <Text style={styles.detailValue}>{record.observaciones || 'Sin observaciones críticas'}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Archivos adjuntos</Text>
            <Text style={[styles.detailValue, {fontStyle: 'italic', color: '#6b7280'}]}>
                No hay archivos adjuntos para esta consulta.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.backFooterButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backFooterButtonText}>Volver</Text>
        </TouchableOpacity>
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
          <Text style={styles.navText}>Turnos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navText, { color: '#0F766E' }]}>Historia</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { justifyContent: 'center', alignItems: 'center' },
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
  doctorCard: { backgroundColor: '#0F766E', borderRadius: 20, padding: 20, marginBottom: 24, elevation: 4 },
  doctorHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarContainer: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 17, fontWeight: 'bold', color: '#ffffff', marginBottom: 2 },
  specialty: { fontSize: 13, color: '#CCFBF1', marginBottom: 2 },
  dateTime: { fontSize: 12, color: '#e9d5ff' },
  detailsList: { gap: 16 },
  detailItem: { backgroundColor: '#ECFDF5', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#99F6E4' },
  detailLabel: { fontSize: 12, color: '#0F766E', fontWeight: '600', marginBottom: 4 },
  detailValue: { fontSize: 14, color: '#1f2937', lineHeight: 20 },
  errorText: { color: '#ef4444', fontSize: 16 },
  backFooterButton: { marginTop: 24, backgroundColor: 'white', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#CCFBF1' },
  backFooterButtonText: { color: '#0F766E', fontSize: 16, fontWeight: '600' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  navItem: { flex: 1, alignItems: 'center' },
  navText: { fontSize: 11, color: '#9ca3af' },
  fabContainer: { width: 60, alignItems: 'center', marginTop: -30 },
  fab: { width: 50, height: 50, backgroundColor: '#0F766E', borderRadius: 25, alignItems: 'center', justifyContent: 'center', elevation: 4 },
});
