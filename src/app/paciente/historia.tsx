import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MtBottomNav, MtButton, MtCard, MtHeader, MtLoading, MtNotice, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { documentTypes } from '../../constants/documentTypes';
import { chooseDocumentSource, PickedMedia } from '../../utils/mediaPicker';
import { readableError } from '../../utils/errors';
import { userService, UserProfile } from '../../api/userService';
import { medicalHistoryService } from '../../api/medicalHistoryService';
import { TurnoResponse } from '../../api/appointmentService';
import { documentService, PacienteDocumento } from '../../api/documentService';

type Tab = 'Atenciones' | 'Resumen' | 'Documentos';
type Notice = { type: 'success' | 'danger' | 'warning' | 'info'; title: string; message: string };

const tabs: Tab[] = ['Atenciones', 'Resumen', 'Documentos'];

function readableSize(size?: number | null) {
  if (!size) return '';
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function formatDate(value?: string) {
  if (!value) return 'Sin fecha';
  const [date] = String(value).split('T');
  const [y, m, d] = date.split('-');
  return y && m && d ? `${d}/${m}/${y}` : value;
}

function fullName(profile?: UserProfile | null) {
  return `${profile?.nombre ?? ''} ${profile?.apellido ?? ''}`.trim() || 'Paciente';
}

export default function ClinicalHistoryScreen() {
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const scrollRef = useRef<ScrollView | null>(null);
  const [tab, setTab] = useState<Tab>('Atenciones');
  const [selectedType, setSelectedType] = useState('Estudio');
  const [typeOpen, setTypeOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<TurnoResponse[]>([]);
  const [documents, setDocuments] = useState<PacienteDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const scrollTop = () => requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
  const showNotice = (next: Notice) => { setNotice(next); scrollTop(); };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [perfil, atenciones, docs] = await Promise.all([
        userService.getProfile(),
        medicalHistoryService.getHistory(),
        documentService.listMine(),
      ]);
      setProfile(perfil);
      setHistory(Array.isArray(atenciones) ? atenciones : []);
      setDocuments(docs);
    } catch (error: any) {
      showNotice({ type: 'danger', title: 'No pudimos cargar tu historia', message: readableError(error, 'Reintentá en unos segundos.') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const helper = useMemo(() => {
    if (tab === 'Atenciones') return 'Cuando un profesional cierre una consulta, aparecerá acá.';
    if (tab === 'Resumen') return 'Resumen armado con tus datos cargados y últimas atenciones.';
    return 'Adjuntá PDF, JPG o PNG de hasta 1 MB. Podés abrirlos cuando los necesites.';
  }, [tab]);

  const uploadPickedDocument = async (media: PickedMedia) => {
    if (!profile?.pacienteId && !profile?.id) {
      showNotice({ type: 'danger', title: 'Falta tu ficha de paciente', message: 'No pudimos asociar el documento a tu historia clínica.' });
      return;
    }
    try {
      setUploading(true);
      const pacienteId = Number(profile.pacienteId ?? profile.id);
      await documentService.upload(pacienteId, media, selectedType);
      const docs = await documentService.listMine();
      setDocuments(docs);
      setTab('Documentos');
      showNotice({ type: 'success', title: 'Documento subido', message: 'Quedó guardado en tu historia clínica.' });
    } catch (error: any) {
      showNotice({ type: 'danger', title: 'No pudimos subir el documento', message: readableError(error, 'Verificá formato y tamaño máximo de 1 MB.') });
    } finally {
      setUploading(false);
    }
  };

  const pickPdfOrImage = async () => {
    chooseDocumentSource(
      uploadPickedDocument,
      (message) => showNotice({ type: 'danger', title: 'No pudimos adjuntar', message }),
    );
  };

  const openDocument = async (doc: PacienteDocumento) => {
    if (!doc.url) {
      showNotice({ type: 'warning', title: 'Documento sin archivo', message: 'El archivo no tiene una URL disponible.' });
      return;
    }
    try {
      await Linking.openURL(doc.url);
    } catch (error: any) {
      showNotice({ type: 'danger', title: 'No pudimos abrir el documento', message: readableError(error, 'Intentá desde otro dispositivo o navegador.') });
    }
  };

  if (loading) return <MtLoading text="Cargando historia clínica..." />;

  return (
    <>
      <MtScreen scroll scrollRef={scrollRef}>
        <MtHeader
          eyebrow="HISTORIA CLÍNICA"
          title="Mi historia"
          subtitle="Atenciones, diagnósticos y documentos asociados."
        />

        {!!notice && <MtNotice type={notice.type} title={notice.title} message={notice.message} style={{ marginBottom: 14 }} />}

        <MtCard style={styles.patientCard}>
          <Text style={styles.patientName}>{fullName(profile)}</Text>
          <View style={styles.chips}>
            <Text style={styles.chip}>DNI: {profile?.dni || 'Sin cargar'}</Text>
            <Text style={styles.chip}>Obra social: {profile?.obraSocialNombre || profile?.obraSocial || 'Sin cargar'}</Text>
            <Text style={styles.chip}>HC: {profile?.numeroHistoriaClinica || 'Sin cargar'}</Text>
          </View>
        </MtCard>

        <View style={styles.tabs}>
          {tabs.map(item => {
            const selected = tab === item;
            const isDocs = item === 'Documentos';
            return (
              <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, selected && styles.tabActive, selected && isDocs && styles.tabDocsActive]}>
                <Text style={[styles.tabText, isDocs && styles.tabDocsText, selected && styles.tabTextActive]} numberOfLines={1} adjustsFontSizeToFit>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 'Atenciones' && (
          history.length === 0 ? (
            <EmptyCard icon="medkit-outline" title="Todavía no hay atenciones" subtitle={helper} styles={styles} />
          ) : (
            <View style={{ gap: 12 }}>
              {history.map((item) => (
                <MtCard key={item.id} style={styles.attentionCard}>
                  <Text style={styles.attentionTitle}>{item.especialidad || 'Consulta médica'}</Text>
                  <Text style={styles.attentionMeta}>{formatDate(item.fechaHora ?? item.fecha)} · {item.profesionalNombre || 'Profesional'}</Text>
                  {!!item.motivoConsulta && <Text style={styles.attentionText}>Motivo: {item.motivoConsulta}</Text>}
                  {!!(item.diagnostico || item.conducta || item.enfermedadActual) && (
                    <Text style={styles.attentionText}>{item.diagnostico || item.conducta || item.enfermedadActual}</Text>
                  )}
                </MtCard>
              ))}
            </View>
          )
        )}

        {tab === 'Resumen' && (
          <MtCard style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumen médico</Text>
            <Text style={styles.summaryLine}>Atenciones registradas: {history.length}</Text>
            <Text style={styles.summaryLine}>Documentos cargados: {documents.length}</Text>
            <Text style={styles.summaryLine}>Obra social: {profile?.obraSocialNombre || profile?.obraSocial || 'Sin cargar'}</Text>
            <Text style={styles.summaryLine}>Teléfono: {profile?.telefono || 'Sin cargar'}</Text>
            <Text style={styles.summaryHint}>La información clínica aparece cuando un profesional cierra una atención.</Text>
          </MtCard>
        )}

        {tab === 'Documentos' && (
          <MtCard style={styles.documentsCard}>
            <Text style={styles.docTitle}>Documentos</Text>
            <Text style={styles.docSub}>Adjuntá estudios, recetas, carnets o documentación asociada.</Text>

            <Text style={styles.fieldLabel}>Tipo de documento</Text>
            <Pressable style={styles.dropdown} onPress={() => setTypeOpen(true)} disabled={uploading}>
              <Text style={styles.dropdownText}>{selectedType}</Text>
              <Ionicons name="chevron-down" size={22} color={theme.colors.primary} />
            </Pressable>

            <View style={styles.uploadRow}>
              <MtButton title="Subir PDF/JPG/PNG" variant="secondary" onPress={pickPdfOrImage} loading={uploading} disabled={uploading} style={styles.uploadButton} />
              <Pressable style={[styles.galleryButton, uploading && { opacity: 0.6 }]} onPress={pickPdfOrImage} disabled={uploading}>
                <Ionicons name="image-outline" size={26} color="#FFFFFF" />
              </Pressable>
            </View>

            <Text style={styles.limitText}>Formatos permitidos: PDF, JPG o PNG. Tamaño máximo: 1 MB.</Text>

            {documents.length === 0 ? (
              <View style={styles.docEmpty}>
                <Ionicons name="document-attach-outline" size={40} color={theme.colors.primary} />
                <Text style={styles.docEmptyText}>Todavía no cargaste documentos.</Text>
              </View>
            ) : (
              <View style={styles.docList}>
                {documents.map(doc => (
                  <Pressable key={doc.id} style={styles.docItem} onPress={() => openDocument(doc)}>
                    <View style={styles.docIcon}>
                      <Ionicons name={doc.mimeType?.includes('pdf') ? 'document-text-outline' : 'image-outline'} size={22} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.docName} numberOfLines={1}>{doc.nombreArchivo}</Text>
                      <Text style={styles.docMeta}>{doc.tipoDocumento || 'Documento'}{doc.storedSizeBytes || doc.originalSizeBytes ? ` · ${readableSize(doc.storedSizeBytes ?? doc.originalSizeBytes)}` : ''}</Text>
                      <Text style={styles.docMeta}>{formatDate(doc.creadoEn)} · {doc.subidoPorRol || 'PACIENTE'}</Text>
                    </View>
                    <Ionicons name="open-outline" size={20} color={theme.colors.muted} />
                  </Pressable>
                ))}
              </View>
            )}
          </MtCard>
        )}

        <Modal visible={typeOpen} transparent animationType="fade" onRequestClose={() => setTypeOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setTypeOpen(false)}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Tipo de documento</Text>
              {documentTypes.map(item => (
                <Pressable
                  key={item}
                  style={[styles.typeOption, selectedType === item && styles.typeOptionActive]}
                  onPress={() => {
                    setSelectedType(item);
                    setTypeOpen(false);
                  }}
                >
                  <Text style={[styles.typeOptionText, selectedType === item && styles.typeOptionTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      </MtScreen>
      <MtBottomNav active="historia" />
    </>
  );
}

function EmptyCard({ icon, title, subtitle, styles }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; styles: ReturnType<typeof createStyles> }) {
  return (
    <MtCard style={styles.emptyCard}>
      <View style={styles.emptySymbol}>
        <Ionicons name={icon} size={34} color="#7C3AED" />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{subtitle}</Text>
    </MtCard>
  );
}

function createStyles(theme: MediturnosTheme) {
  const isDark = theme.mode === 'dark';

  return StyleSheet.create({
    patientCard: { marginBottom: 16 },
    patientName: { color: theme.colors.ink, fontSize: 24, fontWeight: '900', marginBottom: 14 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
      color: isDark ? theme.colors.primary : theme.colors.primaryDark,
      backgroundColor: isDark ? 'rgba(0,0,0,0.22)' : '#F3ECFF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(216,200,255,0.14)' : 'rgba(124,58,237,0.16)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
      fontSize: 13,
      fontWeight: '900',
    },
    tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    tab: {
      flex: 1,
      minHeight: 48,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F7F2FF',
      paddingHorizontal: 8,
    },
    tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOpacity: 0.18, shadowRadius: 14, elevation: 3 },
    tabDocsActive: { backgroundColor: theme.colors.warning, borderColor: theme.colors.warning },
    tabText: { color: isDark ? theme.colors.primary : theme.colors.primaryDark, fontSize: 13, fontWeight: '900', backgroundColor: 'transparent' },
    tabDocsText: { color: theme.colors.warning },
    tabTextActive: { color: '#FFFFFF' },
    emptyCard: { alignItems: 'center', justifyContent: 'center', minHeight: 238, paddingVertical: 30 },
    emptySymbol: {
      width: 68,
      height: 68,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(216,200,255,0.12)' : '#F3ECFF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(216,200,255,0.18)' : 'rgba(124,58,237,0.16)',
      marginBottom: 18,
    },
    emptyTitle: { color: theme.colors.ink, backgroundColor: 'transparent', fontSize: 22, lineHeight: 28, fontWeight: '900', textAlign: 'center' },
    emptySub: { color: theme.colors.muted, backgroundColor: 'transparent', fontSize: 16, lineHeight: 24, fontWeight: '700', textAlign: 'center', marginTop: 10 },
    attentionCard: { gap: 7 },
    attentionTitle: { color: theme.colors.ink, fontSize: 19, fontWeight: '900' },
    attentionMeta: { color: theme.colors.primary, fontSize: 14, fontWeight: '900' },
    attentionText: { color: theme.colors.muted, fontSize: 15, lineHeight: 22, fontWeight: '700' },
    summaryCard: { gap: 9 },
    summaryTitle: { color: theme.colors.ink, fontSize: 22, fontWeight: '900', marginBottom: 4 },
    summaryLine: { color: theme.colors.ink, fontSize: 16, lineHeight: 23, fontWeight: '800' },
    summaryHint: { color: theme.colors.muted, fontSize: 14, lineHeight: 21, fontWeight: '700', marginTop: 4 },
    documentsCard: { marginBottom: 16 },
    docTitle: { color: theme.colors.ink, backgroundColor: 'transparent', fontSize: 24, fontWeight: '900', marginBottom: 8 },
    docSub: { color: theme.colors.muted, backgroundColor: 'transparent', fontSize: 15, lineHeight: 23, fontWeight: '700', marginBottom: 18 },
    fieldLabel: { color: theme.colors.primary, fontSize: 14, fontWeight: '900', marginBottom: 8 },
    dropdown: {
      minHeight: 54,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: isDark ? 'rgba(255,255,255,0.045)' : '#F3ECFF',
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    dropdownText: { color: theme.colors.ink, fontSize: 17, fontWeight: '900', backgroundColor: 'transparent' },
    uploadRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    uploadButton: { flex: 1 },
    galleryButton: { width: 60, borderRadius: 20, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: theme.colors.primary, shadowOpacity: 0.22, shadowRadius: 14, elevation: 3 },
    limitText: { color: theme.colors.muted, fontSize: 13, lineHeight: 20, fontWeight: '700', marginBottom: 14 },
    docEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28, gap: 9 },
    docEmptyText: { color: theme.colors.muted, fontSize: 16, fontWeight: '800' },
    docList: { gap: 10 },
    docItem: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8F4FF',
      padding: 13,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    docIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(216,200,255,0.12)' : '#EDE7FF' },
    docName: { color: theme.colors.ink, backgroundColor: 'transparent', fontSize: 16, fontWeight: '900' },
    docMeta: { color: theme.colors.muted, backgroundColor: 'transparent', fontSize: 13, fontWeight: '700', marginTop: 3 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.58)', justifyContent: 'flex-end', padding: 18 },
    modalCard: { borderRadius: 26, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, padding: 18, marginBottom: 18 },
    modalTitle: { color: theme.colors.ink, backgroundColor: 'transparent', fontSize: 21, fontWeight: '900', marginBottom: 12 },
    typeOption: { minHeight: 48, borderRadius: 16, justifyContent: 'center', paddingHorizontal: 14 },
    typeOptionActive: { backgroundColor: theme.colors.primaryLight },
    typeOptionText: { color: theme.colors.muted, backgroundColor: 'transparent', fontSize: 17, fontWeight: '800' },
    typeOptionTextActive: { color: theme.colors.primaryDark },
  });
}
