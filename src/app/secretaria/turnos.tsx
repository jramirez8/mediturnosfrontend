import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MtButton, MtCard, MtEmptyState, MtHeader, MtInput, MtLoading, MtPill, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { TurnoCard } from '../../components/TurnoCard';
import { secretariaService } from '../../api/staffService';
import { TurnoResponse } from '../../api/appointmentService';
import { useMtTheme } from '../../theme/themeStore';

const estados = ['TODOS', 'CONFIRMADO', 'REPROGRAMADO', 'PENDIENTE', 'CANCELADO', 'ATENDIDO', 'AUSENTE'];

export default function SecretariaTurnosScreen() {
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollToTop = () => setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 80);
  const [turnos, setTurnos] = useState<TurnoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [estado, setEstado] = useState('TODOS');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const theme = useMtTheme();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setTurnos(await secretariaService.turnos()); }
    catch (e: any) { setError(e?.response?.data?.message || e?.message || 'No pudimos cargar los turnos.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return turnos.filter((t) => {
      const matchEstado = estado === 'TODOS' || String(t.estado).toUpperCase() === estado;
      const text = `${t.pacienteNombre} ${t.pacienteDni} ${t.profesionalNombre} ${t.especialidad} ${t.institucionNombre}`.toLowerCase();
      return matchEstado && (!q || text.includes(q));
    });
  }, [turnos, query, estado]);

  const changeState = async (turno: TurnoResponse, action: 'confirmar' | 'cancelar' | 'ausente') => {
    setWorkingId(turno.id); setError(null); setMessage(null);
    try {
      const updated = action === 'confirmar' ? await secretariaService.confirmar(turno.id) : action === 'cancelar' ? await secretariaService.cancelar(turno.id) : await secretariaService.ausente(turno.id);
      setMessage(`Turno #${updated.id} actualizado a ${updated.estado}.`);
      scrollToTop();
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'No pudimos actualizar el turno.');
      scrollToTop();
    } finally { setWorkingId(null); }
  };

  if (loading) return <MtLoading text="Cargando turnos..." />;

  return (
    <MtScreen scroll scrollRef={scrollRef}>
      <MtHeader eyebrow="SECRETARÍA" title="Gestión de turnos" subtitle="Confirmar, cancelar, marcar ausente o reprogramar sin borrar historial." />
      {message ? <MtCard style={{ borderColor: theme.colors.success, marginBottom: 14 }}><Text style={{ color: theme.colors.success, fontWeight: '900' }}>{message}</Text></MtCard> : null}
      {error ? <MtCard style={{ borderColor: theme.colors.danger, marginBottom: 14 }}><Text style={{ color: theme.colors.danger, fontWeight: '900' }}>{error}</Text></MtCard> : null}
      <MtCard style={{ marginBottom: 14, gap: 12 }}>
        <MtInput label="Buscar" value={query} onChangeText={setQuery} placeholder="DNI, paciente, médico, especialidad..." />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {estados.map((e) => <MtPill key={e} label={e} selected={estado === e} tone={e === 'CANCELADO' || e === 'AUSENTE' ? 'danger' : e === 'ATENDIDO' || e === 'CONFIRMADO' ? 'success' : 'warning'} onPress={() => setEstado(e)} />)}
        </View>
      </MtCard>
      {filtered.length ? filtered.map((turno) => (
        <TurnoCard
          key={turno.id}
          turno={turno}
          primaryAction={{ title: workingId === turno.id ? 'Actualizando...' : 'Confirmar', onPress: () => changeState(turno, 'confirmar') }}
          secondaryAction={{ title: 'Reprogramar', onPress: () => router.push({ pathname: '/secretaria/reprogramar', params: { id: String(turno.id) } }) }}
          dangerAction={{ title: 'Cancelar / Ausente', onPress: () => changeState(turno, String(turno.estado).toUpperCase() === 'CANCELADO' ? 'ausente' : 'cancelar') }}
        />
      )) : <MtEmptyState title="Sin resultados" subtitle="No hay turnos con esos filtros." actionTitle="Actualizar" onAction={load} />}
      <RoleBottomNav role="secretaria" active="turnos" />
    </MtScreen>
  );
}
