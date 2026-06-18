import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MtButton, MtCard, MtEmptyState, MtHeader, MtInput, MtLoading, MtScreen } from '../../components/mediturnos';
import { MtSelect } from '../../components/MtSelect';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { TurnoCard } from '../../components/TurnoCard';
import { appointmentService, TurnoResponse } from '../../api/appointmentService';
import { documentService } from '../../api/documentService';
import { medicoService } from '../../api/staffService';
import { useAuthStore } from '../../auth/authStore';
import { doctorAccessMessage, filterTurnosForDoctor, turnoBelongsToDoctor } from '../../utils/doctorAccess';
import { useMtTheme } from '../../theme/themeStore';
import { chooseDocumentSource } from '../../utils/mediaPicker';
import { readableError } from '../../utils/errors';
import { documentTypes } from '../../constants/documentTypes';

export default function MedicoConsultaScreen() {
  const { turnoId } = useLocalSearchParams<{ turnoId?: string }>();
  const usuarioId = useAuthStore((s) => s.usuarioId);
  const profesionalId = useAuthStore((s) => s.profesionalId);
  const profesionalInstitucionId = useAuthStore((s) => s.profesionalInstitucionId);
  const nombreCompleto = useAuthStore((s) => s.nombreCompleto);
  const doctorIdentity = useMemo(() => ({ profesionalId, profesionalInstitucionId, nombreCompleto }), [profesionalId, profesionalInstitucionId, nombreCompleto]);
  const [turno, setTurno] = useState<TurnoResponse | null>(null);
  const [agenda, setAgenda] = useState<TurnoResponse[]>([]);
  const [loading, setLoading] = useState(Boolean(turnoId));
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [documentType, setDocumentType] = useState('Estudio');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const theme = useMtTheme();

  const [form, setForm] = useState({
    motivoConsulta: '',
    enfermedadActual: '',
    antecedentesPersonales: '',
    antecedentesFamiliares: '',
    medicacionActual: '',
    alergias: '',
    habitos: '',
    hallazgosExamenFisico: '',
    diagnostico: '',
    conducta: '',
  });

  const setField = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const load = useCallback(async () => {
    setError(null);
    setMessage(null);
    try {
      if (turnoId) {
        setLoading(true);
        const detail = await appointmentService.getAppointmentDetail(Number(turnoId));
        if (!turnoBelongsToDoctor(detail, doctorIdentity)) {
          setTurno(null);
          setError(doctorAccessMessage());
          return;
        }
        setTurno(detail);
        setForm((prev) => ({
          ...prev,
          motivoConsulta: detail.motivoConsulta || detail.observaciones || '',
          enfermedadActual: detail.enfermedadActual || '',
          antecedentesPersonales: detail.antecedentesPersonales || '',
          antecedentesFamiliares: detail.antecedentesFamiliares || '',
          medicacionActual: detail.medicacionActual || '',
          alergias: detail.alergias || '',
          habitos: detail.habitos || '',
          hallazgosExamenFisico: detail.hallazgosExamenFisico || '',
          diagnostico: detail.diagnostico || '',
          conducta: detail.conducta || '',
        }));
      } else if (usuarioId) {
        setLoading(true);
        const rawAgenda = await medicoService.agenda(usuarioId);
        setAgenda(filterTurnosForDoctor(rawAgenda, doctorIdentity));
      }
    } catch (e: any) {
      setError(readableError(e, 'No pudimos cargar la consulta.'));
    } finally {
      setLoading(false);
    }
  }, [turnoId, usuarioId, doctorIdentity]);

  useEffect(() => { load(); }, [load]);

  const canSave = useMemo(() => !!turno?.id && !!form.motivoConsulta.trim() && !!form.diagnostico.trim() && !!form.conducta.trim() && turnoBelongsToDoctor(turno, doctorIdentity), [turno, form, doctorIdentity]);

  const save = async () => {
    if (!turno) return;
    if (!turnoBelongsToDoctor(turno, doctorIdentity)) {
      setError(doctorAccessMessage());
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await medicoService.guardarConsulta(turno.id, form);
      if (!turnoBelongsToDoctor(updated, doctorIdentity)) {
        setError(doctorAccessMessage());
        return;
      }
      setTurno(updated);
      setMessage('Consulta guardada correctamente y turno marcado como atendido.');
    } catch (e: any) {
      setError(readableError(e, 'No pudimos guardar la consulta.'));
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = () => {
    if (!turno?.pacienteId) {
      setError('No pudimos asociar el documento porque el turno no tiene paciente.');
      return;
    }
    chooseDocumentSource(
      async (media) => {
        try {
          setUploadingDoc(true);
          setError(null);
          await documentService.upload(Number(turno.pacienteId), media, documentType, turno.id);
          setMessage('Documento adjuntado a la atención.');
        } catch (e: any) {
          setError(readableError(e, 'No pudimos adjuntar el documento.'));
        } finally {
          setUploadingDoc(false);
        }
      },
      (message) => setError(message),
    );
  };

  if (loading) return <MtLoading text="Cargando consulta..." />;

  if (error && !turno) {
    return (
      <MtScreen scroll>
        <MtHeader eyebrow="MÉDICO" title="Atención bloqueada" subtitle="No se puede atender un turno asignado a otro profesional." />
        <MtCard style={{ borderColor: theme.colors.danger, marginBottom: 14 }}>
          <Text style={{ color: theme.colors.danger, fontWeight: '900', lineHeight: 20 }}>{error}</Text>
          <MtButton title="Volver a mi agenda" onPress={() => router.replace('/medico/agenda')} style={{ marginTop: 12 }} />
        </MtCard>
        <RoleBottomNav role="medico" active="consulta" />
      </MtScreen>
    );
  }

  if (!turno && !turnoId) {
    return (
      <MtScreen scroll>
        <MtHeader eyebrow="MÉDICO" title="Registrar consulta" subtitle="Elegí un turno propio de la agenda para atender." />
        {agenda.length ? agenda.map((item) => (
          <TurnoCard key={item.id} turno={item} primaryAction={{ title: 'Seleccionar para atender', onPress: () => router.replace({ pathname: '/medico/consulta', params: { turnoId: String(item.id) } }) }} />
        )) : <MtEmptyState title="No hay turnos para atender" subtitle="La agenda propia del día está vacía." />}
        <RoleBottomNav role="medico" active="consulta" />
      </MtScreen>
    );
  }

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="MÉDICO" title="Atención de consulta" subtitle="La consulta alimenta la historia clínica y marca el turno como atendido." />
      {error ? <MtCard style={{ borderColor: theme.colors.danger, marginBottom: 14 }}><Text style={{ color: theme.colors.danger, fontWeight: '900' }}>{error}</Text></MtCard> : null}
      {message ? <MtCard style={{ borderColor: theme.colors.success, marginBottom: 14 }}><Text style={{ color: theme.colors.success, fontWeight: '900' }}>{message}</Text><MtButton title="Volver a agenda" onPress={() => router.replace('/medico/agenda')} style={{ marginTop: 12 }} /></MtCard> : null}
      {turno ? <TurnoCard turno={turno} /> : null}

      <MtCard style={{ gap: 12 }}>
        <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18 }}>Detalle clínico</Text>
        <MtInput label="Motivo de consulta *" value={form.motivoConsulta} onChangeText={(v) => setField('motivoConsulta', v)} multiline />
        <MtInput label="Enfermedad actual" value={form.enfermedadActual} onChangeText={(v) => setField('enfermedadActual', v)} multiline />
        <MtInput label="Antecedentes personales" value={form.antecedentesPersonales} onChangeText={(v) => setField('antecedentesPersonales', v)} multiline />
        <MtInput label="Antecedentes familiares" value={form.antecedentesFamiliares} onChangeText={(v) => setField('antecedentesFamiliares', v)} multiline />
        <MtInput label="Medicación actual" value={form.medicacionActual} onChangeText={(v) => setField('medicacionActual', v)} multiline />
        <MtInput label="Alergias" value={form.alergias} onChangeText={(v) => setField('alergias', v)} multiline />
        <MtInput label="Hábitos" value={form.habitos} onChangeText={(v) => setField('habitos', v)} multiline />
        <MtInput label="Hallazgos del examen físico" value={form.hallazgosExamenFisico} onChangeText={(v) => setField('hallazgosExamenFisico', v)} multiline />
        <MtInput label="Diagnóstico *" value={form.diagnostico} onChangeText={(v) => setField('diagnostico', v)} multiline />
        <MtInput label="Conducta / tratamiento *" value={form.conducta} onChangeText={(v) => setField('conducta', v)} multiline />
        <MtSelect label="Tipo de documento adjunto" value={documentType} placeholder="Seleccionar tipo" options={documentTypes.map((type) => ({ label: type, value: type }))} onChange={setDocumentType} disabled={uploadingDoc || saving} />
        <MtButton title="Adjuntar documento a la atención" variant="secondary" onPress={uploadDocument} loading={uploadingDoc} disabled={!turno?.pacienteId || uploadingDoc || saving} />
        <MtButton title="Guardar consulta y marcar atendido" onPress={save} loading={saving} disabled={!canSave || uploadingDoc} />
      </MtCard>
      <RoleBottomNav role="medico" active="consulta" />
    </MtScreen>
  );
}
