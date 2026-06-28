import React, { useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { MtButton, MtCard, MtEmptyState, MtHeader, MtInput, MtLoading, MtNotice, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { TurnoCard } from '../../components/TurnoCard';
import { medicoService } from '../../api/staffService';
import { TurnoResponse } from '../../api/appointmentService';
import { documentService, PacienteDocumento } from '../../api/documentService';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';

type Notice = { type: 'success' | 'danger' | 'warning' | 'info'; title: string; message: string };

function HistoryResults({ loading, items, searched }: Readonly<{ loading: boolean; items: TurnoResponse[]; searched: boolean }>) {
  if (loading) return <MtLoading text="Buscando..." />;
  if (items.length) return <>{items.map((turno) => <TurnoCard key={turno.id} turno={turno} />)}</>;
  if (searched) return <MtEmptyState title="Sin historia cargada" subtitle="No hay atenciones registradas para ese DNI bajo tu perfil profesional." />;
  return null;
}

export default function HistoriaPacienteMedicoScreen() {
  const params = useLocalSearchParams<{ dni?: string }>();
  const [dni, setDni] = useState(params.dni || '');
  const [items, setItems] = useState<TurnoResponse[]>([]);
  const [docs, setDocs] = useState<PacienteDocumento[]>([]);
  const [pacienteId, setPacienteId] = useState<number | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const theme = useMtTheme();

  const search = async () => {
    if (!dni.trim()) return;
    setLoading(true); setNotice(null); setSearched(true); setDocs([]); setPacienteId(null);
    try {
      const history = await medicoService.historialPaciente(dni.trim());
      setItems(history);
      const foundId = history.find((t) => t.pacienteId)?.pacienteId;
      if (foundId) {
        setPacienteId(Number(foundId));
        setDocs(await documentService.listByPaciente(Number(foundId), includeArchived));
      }
    } catch (e: unknown) {
      setNotice({ type: 'danger', title: 'No pudimos cargar la historia', message: readableError(e, 'No hay atenciones asociadas a tu perfil profesional o no tenés permiso.') });
    } finally { setLoading(false); }
  };

  useEffect(() => { if (params.dni) search(); }, []);
  useEffect(() => {
    if (!pacienteId) return;
    documentService.listByPaciente(pacienteId, includeArchived).then(setDocs).catch(() => undefined);
  }, [includeArchived, pacienteId]);

  const openDoc = async (doc: PacienteDocumento) => {
    if (!doc.url) return;
    try { await Linking.openURL(doc.url); }
    catch { setNotice({ type: 'danger', title: 'No pudimos abrir el documento', message: 'Probá desde otro dispositivo o navegador.' }); }
  };

  const archiveDoc = async (doc: PacienteDocumento) => {
    try {
      await documentService.archive(doc.id);
      if (pacienteId) setDocs(await documentService.listByPaciente(pacienteId, includeArchived));
      setNotice({ type: 'success', title: 'Documento archivado', message: 'Se retiró de la vista activa de la historia clínica.' });
    } catch (e: unknown) {
      setNotice({ type: 'danger', title: 'No pudimos archivar', message: readableError(e, 'Reintentá en unos segundos.') });
    }
  };

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="MÉDICO" title="Historia del paciente" subtitle="Búsqueda por DNI. Solo muestra pacientes vinculados a tus turnos." />
      {notice ? <MtNotice type={notice.type} title={notice.title} message={notice.message} style={{ marginBottom: 14 }} /> : null}
      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <MtInput label="DNI del paciente" value={dni} onChangeText={setDni} keyboardType="numeric" />
        <MtButton title="Buscar historia" onPress={search} loading={loading} disabled={!dni.trim() || loading} />
      </MtCard>
      <HistoryResults loading={loading} items={items} searched={searched} />
      {pacienteId ? <MtCard style={{ gap: 10, marginTop: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ flex: 1, color: theme.colors.ink, fontWeight: '900', fontSize: 18 }}>Documentos del paciente</Text>
          <Pressable onPress={() => setIncludeArchived((value) => !value)} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 }}>
            <Text style={{ color: theme.colors.primary, fontWeight: '900', fontSize: 12 }}>{includeArchived ? 'Ocultar archivados' : 'Ver archivados'}</Text>
          </Pressable>
        </View>
        {docs.length ? docs.map((doc) => (
          <View key={doc.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 12, opacity: doc.archivado ? 0.62 : 1 }}>
            <Pressable onPress={() => openDoc(doc)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <Ionicons name={doc.mimeType?.includes('pdf') ? 'document-text-outline' : 'image-outline'} size={22} color={theme.colors.primary} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: theme.colors.ink, fontWeight: '900' }} numberOfLines={1}>{doc.nombreArchivo}</Text>
                <Text style={{ color: theme.colors.muted, fontWeight: '700', fontSize: 12 }}>{doc.tipoDocumento || 'Documento'} · {doc.archivado ? 'ARCHIVADO' : (doc.subidoPorRol || 'USUARIO')}</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={theme.colors.muted} />
            </Pressable>
            {doc.archivado ? null : <Pressable onPress={() => archiveDoc(doc)} hitSlop={8}><Ionicons name="archive-outline" size={20} color={theme.colors.danger} /></Pressable>}
          </View>
        )) : <Text style={{ color: theme.colors.muted, fontWeight: '700' }}>No hay documentos cargados.</Text>}
      </MtCard> : null}
      <RoleBottomNav role="medico" active="consulta" />
    </MtScreen>
  );
}
