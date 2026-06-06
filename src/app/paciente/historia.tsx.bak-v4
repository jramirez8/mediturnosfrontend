import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { medicalHistoryService } from '../../api/medicalHistoryService';
import { TurnoResponse } from '../../api/appointmentService';
import { userService, UserProfile } from '../../api/userService';
import { useAuthStore } from '../../auth/authStore';
import { MtBottomNav, MtCard, MtEmptyState, MtHeader, MtLoading, MtPill, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';

export default function HistoriaClinicaScreen() {
  const { usuarioId } = useAuthStore();
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const [activeTab, setActiveTab] = useState<'atenciones' | 'documentos' | 'resumen'>('atenciones');
  const [historyRecords, setHistoryRecords] = useState<TurnoResponse[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [usuarioId]);

  const loadData = async () => {
    setLoading(true);
    const [historyData, profileData] = await Promise.all([
      medicalHistoryService.getHistory(usuarioId),
      userService.getProfile(usuarioId),
    ]);
    setHistoryRecords(historyData);
    setProfile(profileData);
    setLoading(false);
  };

  const finished = useMemo(() => historyRecords.filter((item) => ['FINALIZADO', 'ATENDIDO'].includes(String(item.estado).toUpperCase())), [historyRecords]);

  if (loading) return <MtLoading text="Cargando historia clínica..." />;

  return (
    <>
      <MtScreen scroll={false}>
        <MtHeader eyebrow="HISTORIA CLÍNICA" title="Mi historia" subtitle="Atenciones, diagnósticos y documentos asociados." />

        <MtCard style={styles.patientCard}>
          <Text style={styles.patientName}>{profile?.nombre} {profile?.apellido}</Text>
          <View style={styles.patientGrid}>
            <Text style={styles.patientText}>DNI: {profile?.dni || '-'}</Text>
            <Text style={styles.patientText}>Obra social: {profile?.obraSocial || '-'}</Text>
            <Text style={styles.patientText}>HC-{String(profile?.id ?? 0).padStart(6, '0')}</Text>
          </View>
        </MtCard>

        <View style={styles.tabs}>
          <MtPill label="Atenciones" selected={activeTab === 'atenciones'} onPress={() => setActiveTab('atenciones')} />
          <MtPill label="Resumen" selected={activeTab === 'resumen'} onPress={() => setActiveTab('resumen')} tone="success" />
          <MtPill label="Documentos" selected={activeTab === 'documentos'} onPress={() => setActiveTab('documentos')} tone="warning" />
        </View>

        {activeTab === 'atenciones' && (
          <FlatList
            data={finished.length ? finished : historyRecords}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<MtEmptyState title="Todavía no hay atenciones" subtitle="Cuando un profesional cierre una consulta, aparecerá acá." />}
            renderItem={({ item }) => <HistoryCard item={item} styles={styles} />}
          />
        )}

        {activeTab === 'resumen' && (
          <View style={styles.summaryWrap}>
            <MtCard><Text style={styles.summaryTitle}>Cobertura</Text><Text style={styles.summaryText}>{profile?.obraSocial || 'No informada'} · Afiliado {profile?.numeroAfiliado || '-'}</Text></MtCard>
            <MtCard><Text style={styles.summaryTitle}>Médico de cabecera</Text><Text style={styles.summaryText}>{profile?.medicoCabecera || 'No informado'}</Text></MtCard>
            <MtCard><Text style={styles.summaryTitle}>Institución de cabecera</Text><Text style={styles.summaryText}>{profile?.institucionCabecera || 'No informada'}</Text></MtCard>
          </View>
        )}

        {activeTab === 'documentos' && (
          <MtEmptyState title="Documentos próximamente" subtitle="La estructura está lista para adjuntar estudios, imágenes o carnets." actionTitle="Volver a atenciones" onAction={() => setActiveTab('atenciones')} />
        )}
      </MtScreen>
      <MtBottomNav active="historia" />
    </>
  );
}

function HistoryCard({ item, styles }: { item: TurnoResponse; styles: ReturnType<typeof createStyles> }) {
  return (
    <MtCard style={styles.recordCard}>
      <Pressable onPress={() => router.push({ pathname: '/paciente/historia-detalle', params: { id: item.id } })}>
        <View style={styles.recordHeader}>
          <View style={styles.recordIcon}><Text>📄</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.recordTitle}>{item.especialidad}</Text>
            <Text style={styles.recordMeta}>{item.fecha} · {item.hora} hs</Text>
            <Text style={styles.recordMeta}>{item.profesionalNombre}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
        {!!item.diagnostico && <Text style={styles.diagnosis}>Diagnóstico: {item.diagnostico}</Text>}
        {!!item.observaciones && <Text style={styles.notes}>{item.observaciones}</Text>}
      </Pressable>
    </MtCard>
  );
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
  patientCard: { marginBottom: 14 },
  patientName: { color: theme.colors.ink, fontWeight: '900', fontSize: 20 },
  patientGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  patientText: { color: theme.colors.muted, backgroundColor: theme.colors.bg, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, fontWeight: '700', fontSize: 12 },
  tabs: { flexDirection: 'row', marginBottom: 12 },
  list: { gap: 14, paddingBottom: 120 },
  recordCard: { gap: 10 },
  recordHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  recordIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  recordTitle: { color: theme.colors.ink, fontWeight: '900', fontSize: 16 },
  recordMeta: { color: theme.colors.muted, marginTop: 2, fontWeight: '700', fontSize: 12 },
  chevron: { fontSize: 30, color: theme.colors.soft },
  diagnosis: { color: theme.colors.ink, marginTop: 12, fontWeight: '800' },
  notes: { color: theme.colors.muted, marginTop: 6, lineHeight: 20 },
  summaryWrap: { gap: 12, paddingBottom: 120 },
  summaryTitle: { color: theme.colors.ink, fontWeight: '900', fontSize: 16, marginBottom: 5 },
  summaryText: { color: theme.colors.muted, lineHeight: 20 },
  });
}
