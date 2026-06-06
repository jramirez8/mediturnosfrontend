import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { medicalHistoryService } from '../../api/medicalHistoryService';
import { TurnoResponse } from '../../api/appointmentService';
import { MtBottomNav, MtButton, MtCard, MtLoading, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';

function initials(name?: string) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) || 'DR').toUpperCase();
}

export default function HistoriaDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const [record, setRecord] = useState<TurnoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const fetchDetail = async () => {
      if (!id) {
        setLoading(false);
        setError('No se recibió el identificador de la atención.');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await medicalHistoryService.getRecordDetail(Number(id));
        if (alive) setRecord(data);
      } catch (e) {
        console.error('Error fetching history detail:', e);
        if (alive) setError('No se pudo cargar el detalle de la atención.');
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchDetail();
    return () => { alive = false; };
  }, [id]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/paciente/historia');
  };

  if (loading) return <MtLoading text="Cargando detalle de atención..." />;

  return (
    <>
      <MtScreen scroll style={styles.screen}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={23} color={theme.colors.ink} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.eyebrow}>HISTORIA CLÍNICA</Text>
            <Text style={styles.title} numberOfLines={1}>Detalle de atención</Text>
          </View>
        </View>

        {error || !record ? (
          <MtCard style={styles.centerCard}>
            <Ionicons name="alert-circle-outline" size={42} color={theme.colors.danger} />
            <Text style={styles.errorTitle}>No se encontró el registro</Text>
            <Text style={styles.errorText}>{error ?? 'No hay datos para mostrar.'}</Text>
            <MtButton title="Volver a Mi historia" variant="ghost" onPress={() => router.replace('/paciente/historia')} />
          </MtCard>
        ) : (
          <>
            <View style={styles.doctorCard}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{initials(record.profesionalNombre)}</Text>
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName} numberOfLines={1} ellipsizeMode="tail">{record.profesionalNombre}</Text>
                <Text style={styles.specialty} numberOfLines={1} ellipsizeMode="tail">{record.especialidad}</Text>
                <Text style={styles.dateTime}>{record.fecha} · {record.hora} hs</Text>
              </View>
            </View>

            <DetailItem label="Motivo de consulta" value={record.motivoConsulta || 'No especificado'} styles={styles} />
            <DetailItem label="Sede de atención" value={record.institucionNombre || 'Sin sede cargada'} styles={styles} />
            <DetailItem label="Diagnóstico" value={record.diagnostico || 'Sin diagnóstico cargado aún.'} styles={styles} />
            <DetailItem label="Observaciones" value={record.observaciones || 'Sin observaciones críticas.'} styles={styles} />
            <DetailItem label="Archivos adjuntos" value="No hay archivos adjuntos para esta consulta." muted styles={styles} />

            <MtButton title="Volver a Mi historia" variant="ghost" onPress={() => router.replace('/paciente/historia')} style={{ marginTop: 8 }} />
          </>
        )}
      </MtScreen>
      <MtBottomNav active="historia" />
    </>
  );
}

function DetailItem({ label, value, muted, styles }: { label: string; value: string; muted?: boolean; styles: ReturnType<typeof createStyles> }) {
  return (
    <MtCard style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, muted && styles.detailMuted]}>{value}</Text>
    </MtCard>
  );
}

function createStyles(theme: MediturnosTheme) {
  const isDark = theme.mode === 'dark';

  return StyleSheet.create({
    screen: { gap: 14 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
    backButton: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, ...theme.shadow },
    eyebrow: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 2.4, marginBottom: 3 },
    title: { color: theme.colors.ink, backgroundColor: 'transparent', fontSize: 29, lineHeight: 34, fontWeight: '900', letterSpacing: -0.4 },
    doctorCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.colors.primary, borderRadius: 26, padding: 18, shadowColor: theme.colors.primary, shadowOpacity: isDark ? 0.18 : 0.24, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 5 },
    avatarContainer: { width: 62, height: 62, backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#FFFFFF', backgroundColor: 'transparent', fontSize: 21, fontWeight: '900' },
    doctorInfo: { flex: 1, flexShrink: 1, minWidth: 0, width: 0 },
    doctorName: { fontSize: 21, lineHeight: 26, fontWeight: '900', color: '#FFFFFF', backgroundColor: 'transparent', includeFontPadding: false },
    specialty: { fontSize: 15, lineHeight: 20, color: 'rgba(255,255,255,0.84)', backgroundColor: 'transparent', marginTop: 2, includeFontPadding: false },
    dateTime: { fontSize: 13, color: 'rgba(255,255,255,0.80)', backgroundColor: 'transparent', fontWeight: '800', marginTop: 4 },
    detailItem: { padding: 16 },
    detailLabel: { fontSize: 13, color: theme.colors.primary, backgroundColor: 'transparent', fontWeight: '900', marginBottom: 5 },
    detailValue: { fontSize: 15, color: theme.colors.ink, backgroundColor: 'transparent', lineHeight: 22, fontWeight: '700' },
    detailMuted: { color: theme.colors.muted, fontStyle: 'italic' },
    centerCard: { minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 10 },
    errorTitle: { color: theme.colors.ink, backgroundColor: 'transparent', fontSize: 18, fontWeight: '900', textAlign: 'center' },
    errorText: { color: theme.colors.muted, backgroundColor: 'transparent', textAlign: 'center', lineHeight: 20, marginBottom: 6 },
  });
}
