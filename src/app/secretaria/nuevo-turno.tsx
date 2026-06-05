import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MtButton, MtCard, MtHeader, MtInput, MtPill, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { secretariaService } from '../../api/staffService';
import { professionalService, Professional } from '../../api/professionalService';
import { appointmentService, AppointmentSlot } from '../../api/appointmentService';
import { useMtTheme } from '../../theme/themeStore';

export default function SecretariaNuevoTurnoScreen() {
  const theme = useMtTheme();
  const [dni, setDni] = useState('');
  const [paciente, setPaciente] = useState<any | null>(null);
  const [profesionales, setProfesionales] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingPaciente, setLoadingPaciente] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    professionalService.getAll().then(setProfesionales).catch((e) => setError(e?.message || 'No pudimos cargar profesionales.'));
  }, []);

  const dates = useMemo(() => Array.from(new Set(slots.map((s) => s.fecha))).slice(0, 12), [slots]);
  const hours = useMemo(() => slots.filter((s) => s.fecha === selectedDate).map((s) => s.hora), [slots, selectedDate]);

  const searchPaciente = async () => {
    setLoadingPaciente(true); setError(null); setPaciente(null);
    try { setPaciente(await secretariaService.buscarPaciente(dni.trim())); }
    catch (e: any) { setError(e?.response?.data?.message || e?.message || 'No encontramos paciente con ese DNI.'); }
    finally { setLoadingPaciente(false); }
  };

  const chooseProfessional = async (p: Professional) => {
    setSelectedProfessional(p); setSelectedDate(''); setSelectedHour(''); setSlots([]); setError(null); setMessage(null);
    if (!p.profesionalInstitucionId) {
      setError('Ese profesional no tiene profesionalInstitucionId. Revisá catálogo profesional/sede.');
      return;
    }
    setLoadingSlots(true);
    try { setSlots(await appointmentService.getDisponibilidad(p.profesionalInstitucionId)); }
    catch (e: any) { setError(e?.response?.data?.message || e?.message || 'No pudimos cargar disponibilidad.'); }
    finally { setLoadingSlots(false); }
  };

  const create = async () => {
    if (!paciente?.id || !selectedProfessional || !selectedDate || !selectedHour) return;
    setSaving(true); setError(null); setMessage(null);
    try {
      const created = await secretariaService.crearTurno({
        pacienteId: paciente.id,
        profesionalId: selectedProfessional.id,
        profesionalInstitucionId: selectedProfessional.profesionalInstitucionId,
        especialidadId: selectedProfessional.especialidadId,
        fecha: selectedDate,
        hora: selectedHour,
        observaciones,
      });
      setMessage(`Turno #${created.id} creado y confirmado para ${created.fecha} ${created.hora}.`);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'No pudimos crear el turno.');
    } finally { setSaving(false); }
  };

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="SECRETARÍA" title="Nuevo turno" subtitle="Alta operativa usando paciente existente y disponibilidad real." />
      {message ? <MtCard style={{ borderColor: theme.colors.success, marginBottom: 14 }}><Text style={{ color: theme.colors.success, fontWeight: '900' }}>{message}</Text><MtButton title="Ver turnos" onPress={() => router.replace('/secretaria/turnos')} style={{ marginTop: 12 }} /></MtCard> : null}
      {error ? <MtCard style={{ borderColor: theme.colors.danger, marginBottom: 14 }}><Text style={{ color: theme.colors.danger, fontWeight: '900' }}>{error}</Text></MtCard> : null}

      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18 }}>1. Paciente</Text>
        <MtInput label="DNI" value={dni} onChangeText={setDni} keyboardType="numeric" />
        <MtButton title="Buscar paciente" onPress={searchPaciente} loading={loadingPaciente} disabled={!dni.trim()} />
        {paciente ? <Text style={{ color: theme.colors.success, fontWeight: '900' }}>Seleccionado: {paciente.nombre} {paciente.apellido} · ID {paciente.id}</Text> : null}
      </MtCard>

      <MtCard style={{ marginBottom: 14 }}>
        <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18, marginBottom: 12 }}>2. Profesional</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {profesionales.map((p) => (
            <Pressable key={`${p.id}-${p.profesionalInstitucionId}`} onPress={() => chooseProfessional(p)} style={{ minWidth: 150, flexGrow: 1, borderWidth: 1, borderColor: selectedProfessional?.profesionalInstitucionId === p.profesionalInstitucionId ? theme.colors.primary : theme.colors.border, borderRadius: 18, padding: 14 }}>
              <Text style={{ color: theme.colors.ink, fontWeight: '900' }}>{p.apellido}, {p.nombre}</Text>
              <Text style={{ color: theme.colors.primary, fontWeight: '800', marginTop: 4 }}>{p.especialidad}</Text>
              <Text style={{ color: theme.colors.muted, marginTop: 4 }}>{p.institucion}</Text>
            </Pressable>
          ))}
        </View>
      </MtCard>

      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18 }}>3. Fecha y horario</Text>
        {loadingSlots ? <Text style={{ color: theme.colors.muted }}>Cargando disponibilidad...</Text> : null}
        <Text style={{ color: theme.colors.muted }}>Fecha</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {dates.map((d) => <MtPill key={d} label={d} selected={selectedDate === d} onPress={() => { setSelectedDate(d); setSelectedHour(''); }} />)}
        </View>
        <Text style={{ color: theme.colors.muted }}>Horario</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {hours.map((h) => <MtPill key={h} label={h} selected={selectedHour === h} onPress={() => setSelectedHour(h)} />)}
        </View>
        <MtInput label="Observaciones" value={observaciones} onChangeText={setObservaciones} multiline />
        <MtButton title="Crear turno" onPress={create} loading={saving} disabled={!paciente?.id || !selectedProfessional || !selectedDate || !selectedHour} />
      </MtCard>
      <RoleBottomNav role="secretaria" active="nuevo" />
    </MtScreen>
  );
}
