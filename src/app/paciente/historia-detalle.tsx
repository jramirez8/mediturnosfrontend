import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { medicalHistoryService } from '../../api/medicalHistoryService';
import { TurnoResponse } from '../../api/appointmentService';
import { documentService, PacienteDocumento } from '../../api/documentService';
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
  const [documents, setDocuments] = useState<PacienteDocumento[]>([]);
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
        const recordId = Number(id);
        const [data, allDocuments] = await Promise.all([
          medicalHistoryService.getRecordDetail(recordId),
          documentService.listMine().catch(() => []),
        ]);
        if (alive) {
          setRecord(data);
          setDocuments(allDocuments.filter((doc) => Number(doc.turnoId) === recordId));
        }
      } catch {
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

  const openUrl = async (url?: string) => {
    if (!url) return;
    try { await Linking.openURL(url); }
    catch { setError('No pudimos abrir el documento en este dispositivo.'); }
  };

  if (loading) return <MtLoading text="Cargando detalle de atención..." />;

  const hasLegacyAttachment = Boolean(record?.documentacionUrl);

  return (
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
          <Text style={styles.errorTitle}>{record ? 'No pudimos abrir un archivo' : 'No se encontró el registro'}</Text>
          <Text style={styles.errorText}>{error ?? 'No hay datos para mostrar.'}</Text>
          <MtButton title="Volver a Mi historia" variant="ghost" onPress={() => router.replace('/paciente/historia')} />
        </MtCard>
      ) : (
        <>
          <View style={styles.doctorCard}>
            <View style={styles.avatarContainer}><Text style={styles.avatarText}>{initials(record.profesionalNombre)}</Text></View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName} numberOfLines={1}>{record.profesionalNombre}</Text>
              <Text style={styles.specialty} numberOfLines={1}>{record.especialidad}</Text>
              <Text style={styles.dateTime}>{record.fecha} · {record.hora} hs</Text>
            </View>
          </View>

          <DetailItem label="Motivo de consulta" value={record.motivoConsulta || 'No especificado'} styles={styles} />
          <DetailItem label="Enfermedad actual" value={record.enfermedadActual || 'Sin información registrada.'} styles={styles} />
          <DetailItem label="Diagnóstico" value={record.diagnostico || 'Sin diagnóstico registrado.'} styles={styles} />
          <DetailItem label="Conducta / tratamiento" value={record.conducta || 'Sin tratamiento registrado.'} styles={styles} />
          <DetailItem label="Sede de atención" value={record.institucionNombre || 'Sin sede cargada'} styles={styles} />

          <MtCard style={styles.detailItem}>
            <Text style={styles.detailLabel}>Archivos adjuntos</Text>
            {!documents.length && !hasLegacyAttachment ? <Text style={styles.detailMuted}>No se adjuntaron archivos a esta atención.</Text> : null}
            {hasLegacyAttachment ? (
              <Pressable style={styles.documentRow} onPress={() => openUrl(record.documentacionUrl)}>
                <Ionicons name="document-attach-outline" size={22} color={theme.colors.primary} />
                <Text style={styles.documentName} numberOfLines={1}>{record.documentacionNombreArchivo || 'Documento de la atención'}</Text>
                <Ionicons name="open-outline" size={18} color={theme.colors.muted} />
              </Pressable>
            ) : null}
            {documents.map((doc) => (
              <Pressable key={doc.id} style={styles.documentRow} onPress={() => openUrl(doc.url)}>
                <Ionicons name={doc.mimeType.includes('pdf') ? 'document-text-outline' : 'image-outline'} size={22} color={theme.colors.primary} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.documentName} numberOfLines={1}>{doc.nombreArchivo}</Text>
                  <Text style={styles.documentMeta}>{doc.tipoDocumento || 'Documento'}</Text>
                </View>
                <Ionicons name="open-outline" size={18} color={theme.colors.muted} />
              </Pressable>
            ))}
          </MtCard>

          <MtButton title="Volver a Mi historia" variant="ghost" onPress={() => router.replace('/paciente/historia')} style={{ marginTop: 8 }} />
        </>
      )}
      <MtBottomNav active="historia" />
    </MtScreen>
  );
}

function DetailItem({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) {
  return <MtCard style={styles.detailItem}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></MtCard>;
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    screen: { gap: 14 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
    backButton: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, ...theme.shadow },
    eyebrow: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 2.4, marginBottom: 3 },
    title: { color: theme.colors.ink, backgroundColor: 'transparent', fontSize: 29, lineHeight: 34, fontWeight: '900', letterSpacing: -0.4 },
    doctorCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.colors.primary, borderRadius: 26, padding: 18 },
    avatarContainer: { width: 62, height: 62, backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#FFFFFF', fontSize: 21, fontWeight: '900' },
    doctorInfo: { flex: 1, minWidth: 0 },
    doctorName: { fontSize: 21, lineHeight: 26, fontWeight: '900', color: '#FFFFFF' },
    specialty: { fontSize: 15, lineHeight: 20, color: 'rgba(255,255,255,0.84)', marginTop: 2 },
    dateTime: { fontSize: 13, color: 'rgba(255,255,255,0.80)', fontWeight: '800', marginTop: 4 },
    detailItem: { padding: 16, gap: 8 },
    detailLabel: { fontSize: 13, color: theme.colors.primary, fontWeight: '900' },
    detailValue: { fontSize: 15, color: theme.colors.ink, lineHeight: 22, fontWeight: '700' },
    detailMuted: { color: theme.colors.muted, fontStyle: 'italic', fontWeight: '700' },
    documentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 11 },
    documentName: { flex: 1, color: theme.colors.ink, fontWeight: '900' },
    documentMeta: { color: theme.colors.muted, fontWeight: '700', fontSize: 12, marginTop: 2 },
    centerCard: { minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 10 },
    errorTitle: { color: theme.colors.ink, fontSize: 18, fontWeight: '900', textAlign: 'center' },
    errorText: { color: theme.colors.muted, textAlign: 'center', lineHeight: 20, marginBottom: 6 },
  });
}
