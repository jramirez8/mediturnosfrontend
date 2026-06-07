import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MtBottomNav, MtButton, MtCard, MtHeader, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { documentTypes } from '../../constants/documentTypes';
import { chooseDocumentSource, PickedMedia } from '../../utils/mediaPicker';

type Tab = 'Atenciones' | 'Resumen' | 'Documentos';
type UploadedDocument = PickedMedia & {
  id: string;
  name: string;
  type: string;
};

const tabs: Tab[] = ['Atenciones', 'Resumen', 'Documentos'];

function readableSize(size?: number) {
  if (!size) return '';
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export default function ClinicalHistoryScreen() {
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const [tab, setTab] = useState<Tab>('Atenciones');
  const [selectedType, setSelectedType] = useState('Receta');
  const [typeOpen, setTypeOpen] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  const helper = useMemo(() => {
    if (tab === 'Atenciones') return 'Cuando un profesional cierre una consulta, aparecerá acá.';
    if (tab === 'Resumen') return 'Resumen médico general pendiente de carga.';
    return 'Adjuntá PDF, JPG o PNG de hasta 1 MB.';
  }, [tab]);

  const addPickedDocument = (media: PickedMedia) => {
    setDocuments(prev => [{
      ...media,
      id: String(Date.now()),
      name: media.fileName ?? 'documento',
      type: selectedType,
    }, ...prev]);
  };

  const pickPdfOrImage = async () => {
    chooseDocumentSource(
      addPickedDocument,
      (message) => Alert.alert('No pudimos adjuntar', message),
    );
  };

  return (
    <>
      <MtScreen scroll>
        <MtHeader
          eyebrow="HISTORIA CLÍNICA"
          title="Mi historia"
          subtitle="Atenciones, diagnósticos y documentos asociados."
        />

        <MtCard style={styles.patientCard}>
          <Text style={styles.patientName}>Juan Ramirez</Text>
          <View style={styles.chips}>
            <Text style={styles.chip}>DNI: 41147663</Text>
            <Text style={styles.chip}>Obra social: Galeno</Text>
            <Text style={styles.chip}>HC-000001</Text>
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

        {tab !== 'Documentos' ? (
          <MtCard style={styles.emptyCard}>
            <View style={styles.emptySymbol}>
              <Ionicons name={tab === 'Atenciones' ? 'medkit-outline' : 'reader-outline'} size={34} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{tab === 'Atenciones' ? 'Todavía no hay atenciones' : 'Resumen próximamente'}</Text>
            <Text style={styles.emptySub}>{helper}</Text>
          </MtCard>
        ) : (
          <MtCard style={styles.documentsCard}>
            <Text style={styles.docTitle}>Documentos</Text>
            <Text style={styles.docSub}>Adjuntá estudios, recetas, carnets o documentación asociada.</Text>

            <Text style={styles.fieldLabel}>Tipo de documento</Text>
            <Pressable style={styles.dropdown} onPress={() => setTypeOpen(true)}>
              <Text style={styles.dropdownText}>{selectedType}</Text>
              <Ionicons name="chevron-down" size={22} color={theme.colors.primary} />
            </Pressable>

            <View style={styles.uploadRow}>
              <MtButton title="Subir PDF/JPG" variant="secondary" onPress={pickPdfOrImage} style={styles.uploadButton} />
              <Pressable style={styles.galleryButton} onPress={pickPdfOrImage}>
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
                  <View key={doc.id} style={styles.docItem}>
                    <View style={styles.docIcon}>
                      <Ionicons name="document-text-outline" size={22} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                      <Text style={styles.docMeta}>{doc.type}{doc.size ? ` · ${readableSize(doc.size)}` : ''}</Text>
                    </View>
                  </View>
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
