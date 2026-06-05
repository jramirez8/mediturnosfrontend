import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MtButton, MtCard, MtEmptyState, MtHeader, MtInput, MtLoading, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { TurnoCard } from '../../components/TurnoCard';
import { appointmentService, TurnoResponse } from '../../api/appointmentService';
import { medicoService } from '../../api/staffService';
import { useAuthStore } from '../../auth/authStore';
import { useMtTheme } from '../../theme/themeStore';

export default function MedicoConsultaScreen() {
  const { turnoId } = useLocalSearchParams<{ turnoId?: string }>();
  const usuarioId = useAuthStore((s) => s.usuarioId);
  const [turno, setTurno] = useState<TurnoResponse | null>(null);
  const [agenda, setAgenda] = useState<TurnoResponse[]>([]);
  const [loading, setLoading] = useState(Boolean(turnoId));
  const [saving, setSaving] = useState(false);
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
          conducta: detail.conducta || '',
        }));
      } else if (usuarioId) {
        setLoading(true);
        setAgenda(await medicoService.agenda(usuarioId));
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'No pudimos cargar la consulta.');
    } finally {
      setLoading(false);
    }
  }, [turnoId, usuarioId]);

  useEffect(() => { load(); }, [load]);

  const canSave = useMemo(() => !!turno?.id && !!form.motivoConsulta.trim() && !!form.conducta.trim(), [turno, form]);

  const save = async () => {
    if (!turno) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await medicoService.guardarConsulta(turno.id, form);
      setTurno(updated);
      setMessage(`Consulta guardada. El turno #${updated.id} quedó en estado ${updated.estado}.`);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'No pudimos guardar la consulta.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <MtLoading text="Cargando consulta..." />;

  if (!turno && !turnoId) {
    return (
      <MtScreen scroll>
        <MtHeader eyebrow="MÉDICO" title="Registrar consulta" subtitle="Elegí un turno de la agenda para atender." />
        {agenda.length ? agenda.map((item) => (
          <TurnoCard key={item.id} turno={item} primaryAction={{ title: 'Seleccionar para atender', onPress: () => router.replace({ pathname: '/medico/consulta', params: { turnoId: String(item.id) } }) }} />
        )) : <MtEmptyState title="No hay turnos para atender" subtitle="La agenda del día está vacía." />}
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
        <MtInput label="Conducta / tratamiento *" value={form.conducta} onChangeText={(v) => setField('conducta', v)} multiline />
        <MtButton title="Guardar consulta y marcar atendido" onPress={save} loading={saving} disabled={!canSave} />
      </MtCard>
      <RoleBottomNav role="medico" active="consulta" />
    </MtScreen>
  );
}
