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

export default function HistoriaPacienteMedicoScreen() {
  const params = useLocalSearchParams<{ dni?: string }>();
  const [dni, setDni] = useState(params.dni || '');
  const [items, setItems] = useState<TurnoResponse[]>([]);
  const [docs, setDocs] = useState<PacienteDocumento[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const theme = useMtTheme();

  const search = async () => {
    if (!dni.trim()) return;
    setLoading(true); setNotice(null); setSearched(true); setDocs([]);
    try {
      const history = await medicoService.historialPaciente(dni.trim());
      setItems(history);
      const pacienteId = history.find((t) => t.pacienteId)?.pacienteId;
      if (pacienteId) setDocs(await documentService.listByPaciente(Number(pacienteId)));
    } catch (e: any) {
      setNotice({ type: 'danger', title: 'No pudimos cargar la historia', message: readableError(e, 'No hay atenciones asociadas a tu usuario médico o no tenés permiso.') });
    } finally { setLoading(false); }
  };

  useEffect(() => { if (params.dni) search(); }, []);

  const openDoc = async (doc: PacienteDocumento) => {
    if (!doc.url) return;
    try { await Linking.openURL(doc.url); }
    catch { setNotice({ type: 'danger', title: 'No pudimos abrir el documento', message: 'Probá desde otro dispositivo o navegador.' }); }
  };

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="MÉDICO" title="Historia del paciente" subtitle="Búsqueda por DNI. Solo muestra pacientes vinculados a tus turnos." />
      {notice ? <MtNotice type={notice.type} title={notice.title} message={notice.message} style={{ marginBottom: 14 }} /> : null}
      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <MtInput label="DNI del paciente" value={dni} onChangeText={setDni} keyboardType="numeric" />
        <MtButton title="Buscar historia" onPress={search} loading={loading} disabled={!dni.trim() || loading} />
      </MtCard>
      {loading ? <MtLoading text="Buscando..." /> : items.length ? items.map((turno) => <TurnoCard key={turno.id} turno={turno} />) : searched ? <MtEmptyState title="Sin historia cargada" subtitle="No hay atenciones registradas para ese DNI bajo tu usuario médico." /> : null}
      {docs.length ? <MtCard style={{ gap: 10, marginTop: 14 }}>
        <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18 }}>Documentos del paciente</Text>
        {docs.map((doc) => (
          <Pressable key={doc.id} onPress={() => openDoc(doc)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 12 }}>
            <Ionicons name={doc.mimeType?.includes('pdf') ? 'document-text-outline' : 'image-outline'} size={22} color={theme.colors.primary} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: theme.colors.ink, fontWeight: '900' }} numberOfLines={1}>{doc.nombreArchivo}</Text>
              <Text style={{ color: theme.colors.muted, fontWeight: '700', fontSize: 12 }}>{doc.tipoDocumento || 'Documento'} · {doc.subidoPorRol || 'USUARIO'}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={theme.colors.muted} />
          </Pressable>
        ))}
      </MtCard> : null}
      <RoleBottomNav role="medico" active="consulta" />
    </MtScreen>
  );
}
