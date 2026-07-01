import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { MtCard, MtEmptyState, MtHeader, MtInput, MtLoading, MtNotice, MtPill, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { TurnoCard } from '../../components/TurnoCard';
import { secretariaService } from '../../api/staffService';
import { TurnoResponse } from '../../api/appointmentService';
import { languageCopy, useTranslation } from '../../i18n/languageStore';
import { readableError } from '../../utils/errors';

const estados = ['TODOS', 'CONFIRMADO', 'REPROGRAMADO', 'PENDIENTE', 'CANCELADO', 'ATENDIDO', 'AUSENTE'];

function toneForStatusFilter(estado: string) {
  if (estado === 'CANCELADO' || estado === 'AUSENTE') return 'danger';
  if (estado === 'ATENDIDO' || estado === 'CONFIRMADO') return 'success';
  return 'warning';
}

export default function SecretariaTurnosScreen() {
  const { language } = useTranslation();
  const copy = (es: string, en: string, pt: string) => languageCopy(language, es, en, pt);
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollToTop = () => setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 80);
  const [turnos, setTurnos] = useState<TurnoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [estado, setEstado] = useState('TODOS');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTurnos(await secretariaService.turnos());
    } catch (e: unknown) {
      setError(readableError(e, copy('No pudimos cargar los turnos.', 'We could not load appointments.', 'Nao foi possivel carregar as consultas.')));
    } finally {
      setLoading(false);
    }
  }, [language]);

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
    setWorkingId(turno.id);
    setError(null);
    setMessage(null);
    try {
      let updated: TurnoResponse;
      if (action === 'confirmar') updated = await secretariaService.confirmar(turno.id);
      else if (action === 'cancelar') updated = await secretariaService.cancelar(turno.id);
      else updated = await secretariaService.ausente(turno.id);
      setMessage(copy(`Turno #${updated.id} actualizado a ${updated.estado}.`, `Appointment #${updated.id} updated to ${updated.estado}.`, `Consulta #${updated.id} atualizada para ${updated.estado}.`));
      scrollToTop();
      await load();
    } catch (e: unknown) {
      setError(readableError(e, copy('No pudimos actualizar el turno.', 'We could not update the appointment.', 'Nao foi possivel atualizar a consulta.')));
      scrollToTop();
    } finally {
      setWorkingId(null);
    }
  };

  if (loading) return <MtLoading text={copy('Cargando turnos...', 'Loading appointments...', 'Carregando consultas...')} />;

  return (
    <MtScreen scroll scrollRef={scrollRef}>
      <MtHeader
        eyebrow={copy('SECRETARIA', 'SECRETARY', 'SECRETARIA')}
        title={copy('Gestion de turnos', 'Appointment management', 'Gestao de consultas')}
        subtitle={copy('Confirmar, cancelar, marcar ausente o reprogramar sin borrar historial.', 'Confirm, cancel, mark absent or reschedule without deleting history.', 'Confirmar, cancelar, marcar ausente ou reprogramar sem apagar o historico.')}
      />
      {message ? <MtNotice type="success" title={copy('Turno actualizado', 'Appointment updated', 'Consulta atualizada')} message={message} /> : null}
      {error ? <MtNotice type="danger" title={copy('No pudimos actualizar el turno', 'We could not update the appointment', 'Nao foi possivel atualizar a consulta')} message={error} style={{ marginBottom: 14 }} /> : null}
      <MtCard style={{ marginBottom: 14, gap: 12 }}>
        <MtInput label={copy('Buscar', 'Search', 'Buscar')} value={query} onChangeText={setQuery} placeholder={copy('DNI, paciente, medico, especialidad...', 'ID, patient, doctor, specialty...', 'DNI, paciente, medico, especialidade...')} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {estados.map((e) => {
            const tone = toneForStatusFilter(e);
            return <MtPill key={e} label={e} selected={estado === e} tone={tone} onPress={() => setEstado(e)} />;
          })}
        </View>
      </MtCard>
      {filtered.length ? filtered.map((turno) => (
        <TurnoCard
          key={turno.id}
          turno={turno}
          primaryAction={{ title: workingId === turno.id ? copy('Actualizando...', 'Updating...', 'Atualizando...') : copy('Confirmar', 'Confirm', 'Confirmar'), onPress: () => changeState(turno, 'confirmar') }}
          secondaryAction={{ title: copy('Reprogramar', 'Reschedule', 'Reprogramar'), onPress: () => router.push({ pathname: '/secretaria/reprogramar', params: { id: String(turno.id) } }) }}
          dangerAction={{ title: copy('Cancelar / Ausente', 'Cancel / Absent', 'Cancelar / Ausente'), onPress: () => changeState(turno, String(turno.estado).toUpperCase() === 'CANCELADO' ? 'ausente' : 'cancelar') }}
        />
      )) : <MtEmptyState title={copy('Sin resultados', 'No results', 'Sem resultados')} subtitle={copy('No hay turnos con esos filtros.', 'There are no appointments with those filters.', 'Nao ha consultas com esses filtros.')} actionTitle={copy('Actualizar', 'Refresh', 'Atualizar')} onAction={load} />}
      <RoleBottomNav role="secretaria" active="turnos" />
    </MtScreen>
  );
}
