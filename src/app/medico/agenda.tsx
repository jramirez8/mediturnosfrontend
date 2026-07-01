import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MtButton, MtCard, MtEmptyState, MtHeader, MtLoading, MtNotice, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { TurnoCard } from '../../components/TurnoCard';
import { medicoService } from '../../api/staffService';
import { TurnoResponse } from '../../api/appointmentService';
import { useAuthStore } from '../../auth/authStore';
import { filterTurnosForDoctor } from '../../utils/doctorAccess';
import { languageCopy, useTranslation } from '../../i18n/languageStore';
import { useMtTheme } from '../../theme/themeStore';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { readableError } from '../../utils/errors';

const WEEKDAYS_ES = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function toIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function monthRange(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  return { desde: toIso(first), hasta: toIso(last) };
}

function calendarCells(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { iso: toIso(date), day: date.getDate(), inMonth: date.getMonth() === cursor.getMonth() };
  });
}

function displayDate(iso: string) {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

export default function MedicoAgendaScreen() {
  const usuarioId = useAuthStore((s) => s.usuarioId);
  const profesionalId = useAuthStore((s) => s.profesionalId);
  const profesionalInstitucionId = useAuthStore((s) => s.profesionalInstitucionId);
  const nombreCompleto = useAuthStore((s) => s.nombreCompleto);
  const doctorIdentity = useMemo(() => ({ profesionalId, profesionalInstitucionId, nombreCompleto }), [profesionalId, profesionalInstitucionId, nombreCompleto]);
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toIso(new Date()));
  const [agenda, setAgenda] = useState<TurnoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useTranslation();
  const copy = useCallback((es: string, en: string, pt: string) => languageCopy(language, es, en, pt), [language]);
  const weekdays = language === 'en' ? WEEKDAYS_EN : language === 'pt' ? WEEKDAYS_PT : WEEKDAYS_ES;
  const months = language === 'en' ? MONTHS_EN : language === 'pt' ? MONTHS_PT : MONTHS_ES;
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);

  const load = useCallback(async () => {
    if (!usuarioId) return;
    setLoading(true);
    setError(null);
    try {
      const { desde, hasta } = monthRange(cursor);
      const rawAgenda = await medicoService.agendaRango(usuarioId, desde, hasta);
      const ownAgenda = filterTurnosForDoctor(rawAgenda, doctorIdentity);
      setAgenda(ownAgenda);
      const hasSelected = ownAgenda.some((turno) => turno.fecha === selectedDate);
      if (!hasSelected) {
        const today = toIso(new Date());
        const firstAvailable = ownAgenda.find((turno) => turno.fecha >= today) ?? ownAgenda[0];
        setSelectedDate(firstAvailable?.fecha ?? desde);
      }
    } catch (e: unknown) {
      setError(readableError(e, copy('No pudimos cargar la agenda mensual.', 'We could not load the monthly schedule.', 'Nao foi possivel carregar a agenda mensal.')));
    } finally {
      setLoading(false);
    }
  }, [usuarioId, cursor, doctorIdentity, copy]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => agenda.reduce<Record<string, number>>((acc, turno) => {
    acc[turno.fecha] = (acc[turno.fecha] || 0) + 1;
    return acc;
  }, {}), [agenda]);
  const selectedAppointments = useMemo(() => agenda.filter((turno) => turno.fecha === selectedDate), [agenda, selectedDate]);
  const cells = useMemo(() => calendarCells(cursor), [cursor]);

  const moveMonth = (delta: number) => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
    setCursor(next);
    setSelectedDate(toIso(next));
  };

  const goToday = () => {
    const today = new Date();
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(toIso(today));
  };

  if (loading) return <MtLoading text={copy('Cargando agenda mensual...', 'Loading monthly schedule...', 'Carregando agenda mensal...')} />;

  return (
    <MtScreen scroll>
      <MtHeader
        eyebrow={copy('MEDICO', 'DOCTOR', 'MEDICO')}
        title={copy('Agenda', 'Schedule', 'Agenda')}
        subtitle={copy('Selecciona un dia con turnos para ver el detalle de las consultas asignadas.', 'Select a day with appointments to see assigned visit details.', 'Selecione um dia com consultas para ver o detalhe dos atendimentos atribuidos.')}
      />
      {error ? <MtNotice type="danger" title={copy('No pudimos cargar la agenda', 'We could not load the schedule', 'Nao foi possivel carregar a agenda')} message={error} actionTitle={copy('Reintentar', 'Try again', 'Tentar novamente')} onAction={load} style={{ marginBottom: 14 }} /> : null}

      <MtCard style={styles.calendarCard}>
        <View style={styles.monthHeader}>
          <Pressable style={styles.monthButton} onPress={() => moveMonth(-1)}><Text style={styles.monthButtonText}>{'<'}</Text></Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.monthTitle}>{months[cursor.getMonth()]}</Text>
            <Text style={styles.monthYear}>{cursor.getFullYear()} - {agenda.length} {copy('turno(s)', 'appointment(s)', 'consulta(s)')}</Text>
          </View>
          <Pressable style={styles.monthButton} onPress={() => moveMonth(1)}><Text style={styles.monthButtonText}>{'>'}</Text></Pressable>
        </View>
        <MtButton title={copy('Volver a hoy', 'Back to today', 'Voltar para hoje')} variant="ghost" onPress={goToday} style={{ minHeight: 42 }} />
        <View style={styles.weekRow}>{weekdays.map((day) => <Text key={day} style={styles.weekDay}>{day}</Text>)}</View>
        <View style={styles.grid}>{cells.map((cell) => {
          const count = counts[cell.iso] || 0;
          const selectable = cell.inMonth && count > 0;
          const selected = cell.iso === selectedDate;
          return (
            <Pressable
              key={cell.iso}
              disabled={!selectable}
              onPress={() => setSelectedDate(cell.iso)}
              style={[styles.dayCell, !cell.inMonth && styles.outside, cell.inMonth && !count && styles.emptyDay, count > 0 && styles.withAppointments, selected && styles.selectedDay]}
            >
              <Text style={[styles.dayText, count > 0 && styles.dayTextActive, selected && styles.selectedText]}>{cell.day}</Text>
              {count > 0 ? <Text style={[styles.count, selected && styles.selectedText]}>{count}</Text> : null}
            </Pressable>
          );
        })}</View>
        <Text style={styles.help}>{copy('Los dias resaltados tienen turnos. El numero indica cuantos hay asignados.', 'Highlighted days have appointments. The number shows how many are assigned.', 'Os dias destacados tem consultas. O numero indica quantas foram atribuidas.')}</Text>
      </MtCard>

      <Text style={styles.sectionTitle}>{copy('Turnos del', 'Appointments for', 'Consultas de')} {displayDate(selectedDate)}</Text>
      {selectedAppointments.length ? selectedAppointments.map((turno) => (
        <TurnoCard
          key={turno.id}
          turno={turno}
          primaryAction={{ title: String(turno.estado).toUpperCase() === 'ATENDIDO' ? copy('Modificar', 'Edit', 'Modificar') : copy('Atender', 'Attend', 'Atender'), onPress: () => router.push({ pathname: '/medico/consulta', params: { turnoId: String(turno.id) } }) }}
          secondaryAction={{ title: copy('Ver historia del paciente', 'View patient history', 'Ver historico do paciente'), onPress: () => router.push({ pathname: '/medico/historia-paciente', params: { dni: turno.pacienteDni || '' } }) }}
        />
      )) : <MtEmptyState title={copy('Sin turnos en esta fecha', 'No appointments on this date', 'Sem consultas nesta data')} subtitle={copy('Elegi uno de los dias resaltados en el calendario.', 'Choose one of the highlighted days in the calendar.', 'Escolha um dos dias destacados no calendario.')} />}

      <RoleBottomNav role="medico" active="agenda" />
    </MtScreen>
  );
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    calendarCard: { gap: 12, marginBottom: 16 },
    monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    monthButton: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
    monthButtonText: { color: theme.colors.primary, fontSize: 28, fontWeight: '900' },
    monthTitle: { color: theme.colors.ink, fontSize: 21, fontWeight: '900' },
    monthYear: { color: theme.colors.muted, fontWeight: '800', marginTop: 2, fontSize: 12 },
    weekRow: { flexDirection: 'row', marginBottom: 7 },
    weekDay: { flex: 1, textAlign: 'center', color: theme.colors.muted, fontWeight: '900', fontSize: 11 },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: '14.2857%', aspectRatio: 1, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', transform: [{ scale: 0.92 }] },
    outside: { opacity: 0.45 },
    emptyDay: { opacity: 0.55 },
    withAppointments: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
    selectedDay: { borderWidth: 3, borderColor: theme.colors.primaryDark, backgroundColor: theme.colors.primary },
    dayText: { color: theme.colors.muted, fontWeight: '900', fontSize: 14 },
    dayTextActive: { color: theme.colors.primaryDark },
    selectedText: { color: '#FFFFFF' },
    count: { position: 'absolute', right: 4, bottom: 2, color: theme.colors.primary, fontSize: 9, fontWeight: '900' },
    help: { color: theme.colors.muted, fontWeight: '700', fontSize: 12, lineHeight: 18 },
    sectionTitle: { color: theme.colors.ink, fontWeight: '900', fontSize: 19, marginBottom: 10 },
  });
}
