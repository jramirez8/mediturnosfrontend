import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MtButton, MtCard, MtHeader, MtInput, MtNotice, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { secretariaService } from '../../api/staffService';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';
import { chooseDocumentSource } from '../../utils/mediaPicker';
import { documentService, PacienteDocumento } from '../../api/documentService';

type Notice = { type: 'success' | 'danger' | 'warning' | 'info'; title: string; message: string };

export default function SecretariaPacientesScreen() {
  const [dni, setDni] = useState('');
  const [paciente, setPaciente] = useState<any | null>(null);
  const [docs, setDocs] = useState<PacienteDocumento[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const theme = useMtTheme();

  const search = async () => {
    setLoading(true); setNotice(null); setPaciente(null); setDocs([]);
    try {
      const found = await secretariaService.buscarPaciente(dni.trim());
      setPaciente(found);
      const pacienteId = Number(found?.id ?? found?.pacienteId);
      if (pacienteId) setDocs(await documentService.listByPaciente(pacienteId));
    } catch (e: any) {
      setNotice({ type: 'danger', title: 'No encontramos el paciente', message: readableError(e, 'No encontramos paciente con ese DNI.') });
    } finally { setLoading(false); }
  };

  const uploadDoc = () => {
    const pacienteId = Number(paciente?.id ?? paciente?.pacienteId);
    if (!pacienteId) {
      setNotice({ type: 'warning', title: 'Primero buscá un paciente', message: 'Necesitamos asociar el documento a una ficha de paciente.' });
      return;
    }
    chooseDocumentSource(
      async (media) => {
        try {
          setUploading(true);
          await documentService.upload(pacienteId, media, 'Otros');
          setDocs(await documentService.listByPaciente(pacienteId));
          setNotice({ type: 'success', title: 'Documento subido', message: 'Quedó disponible para el paciente y el equipo médico.' });
        } catch (e: any) {
          setNotice({ type: 'danger', title: 'No pudimos subir el documento', message: readableError(e, 'Verificá formato y tamaño máximo de 1 MB.') });
        } finally {
          setUploading(false);
        }
      },
      (message) => setNotice({ type: 'danger', title: 'No pudimos adjuntar', message }),
    );
  };

  const openDoc = async (doc: PacienteDocumento) => {
    if (!doc.url) return;
    try { await Linking.openURL(doc.url); }
    catch { setNotice({ type: 'danger', title: 'No pudimos abrir el documento', message: 'Probá desde otro dispositivo o navegador.' }); }
  };

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="SECRETARÍA" title="Pacientes" subtitle="Búsqueda rápida por DNI para operar turnos y documentos." />
      {notice ? <MtNotice type={notice.type} title={notice.title} message={notice.message} style={{ marginBottom: 14 }} /> : null}
      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <MtInput label="DNI" value={dni} onChangeText={setDni} keyboardType="numeric" />
        <MtButton title="Buscar paciente" onPress={search} loading={loading} disabled={!dni.trim() || loading} />
      </MtCard>
      {paciente ? (
        <MtCard style={{ gap: 10, marginBottom: 14 }}>
          <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18 }}>{paciente.nombre} {paciente.apellido}</Text>
          <Text style={{ color: theme.colors.muted, fontWeight: '700' }}>DNI: {paciente.dni}</Text>
          <Text style={{ color: theme.colors.muted, fontWeight: '700' }}>Teléfono: {paciente.telefono || 'No informado'}</Text>
          <Text style={{ color: theme.colors.muted, fontWeight: '700' }}>Email: {paciente.usuario?.email || paciente.email || 'No informado'}</Text>
          <Text style={{ color: theme.colors.muted, fontWeight: '700' }}>Obra social: {paciente.obraSocial?.nombre || paciente.obraSocialNombre || 'No informada'}</Text>
          <MtButton title="Subir documento administrativo" variant="secondary" onPress={uploadDoc} loading={uploading} disabled={uploading} style={{ marginTop: 8 }} />
        </MtCard>
      ) : null}
      {paciente ? (
        <MtCard style={{ gap: 10 }}>
          <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18 }}>Documentos</Text>
          {docs.length === 0 ? <Text style={{ color: theme.colors.muted, fontWeight: '700' }}>No hay documentos cargados.</Text> : docs.map((doc) => (
            <Pressable key={doc.id} onPress={() => openDoc(doc)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 12 }}>
              <Ionicons name={doc.mimeType?.includes('pdf') ? 'document-text-outline' : 'image-outline'} size={22} color={theme.colors.primary} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: theme.colors.ink, fontWeight: '900' }} numberOfLines={1}>{doc.nombreArchivo}</Text>
                <Text style={{ color: theme.colors.muted, fontWeight: '700', fontSize: 12 }}>{doc.tipoDocumento || 'Documento'} · {doc.subidoPorRol || 'USUARIO'}</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={theme.colors.muted} />
            </Pressable>
          ))}
        </MtCard>
      ) : null}
      <RoleBottomNav role="secretaria" active="pacientes" />
    </MtScreen>
  );
}
