import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MtButton, MtCard, MtHeader, MtLoading, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { professionalService, Professional } from '../../api/professionalService';
import { agendaService, AgendaBloqueo, HorarioAtencion } from '../../api/agendaService';
import { useMtTheme } from '../../theme/themeStore';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { readableError } from '../../utils/errors';

const DAYS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];

export default function AgendaAvanzadaAdmin() {
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selected, setSelected] = useState<Professional | null>(null);
  const [horarios, setHorarios] = useState<HorarioAtencion[]>([]);
  const [bloqueos, setBloqueos] = useState<AgendaBloqueo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dia, setDia] = useState('LUNES');
  const [desde, setDesde] = useState('09:00');
  const [hasta, setHasta] = useState('13:00');
  const [duracion, setDuracion] = useState('30');
  const [bloqueoDesde, setBloqueoDesde] = useState('');
  const [bloqueoHasta, setBloqueoHasta] = useState('');
  const [bloqueoMotivo, setBloqueoMotivo] = useState('');

  useEffect(() => { loadProfessionals(); }, []);
  useEffect(() => { if (selected) loadAgenda(selected); }, [selected?.profesionalInstitucionId]);

  const loadProfessionals = async () => {
    try {
      setLoading(true);
      const data = await professionalService.getAll();
      setProfessionals(data);
      setSelected(data[0] ?? null);
    } catch (e: any) { setError(readableError(e, 'No pudimos cargar profesionales.')); }
    finally { setLoading(false); }
  };

  const loadAgenda = async (p: Professional) => {
    const piId = Number(p.profesionalInstitucionId ?? p.id);
    try {
      const [h, b] = await Promise.all([agendaService.getHorarios(piId), agendaService.getBloqueos(piId)]);
      setHorarios(h); setBloqueos(b); setError(null);
    } catch (e: any) { setError(readableError(e, 'No pudimos cargar agenda.')); }
  };

  const addHorario = async () => {
    if (!selected) return;
    try {
      setSaving(true); setNotice(null); setError(null);
      await agendaService.createHorario({
        profesionalInstitucionId: Number(selected.profesionalInstitucionId ?? selected.id),
        especialidadId: Number(selected.especialidadId ?? 1),
        diaSemana: dia,
        horaDesde: desde,
        horaHasta: hasta,
        duracionTurnoMin: Number(duracion) || 30,
        activo: true,
      });
      setNotice('Horario de atención agregado.');
      await loadAgenda(selected);
    } catch (e: any) { setError(readableError(e, 'No pudimos guardar el horario.')); }
    finally { setSaving(false); }
  };

  const addBloqueo = async () => {
    if (!selected) return;
    try {
      setSaving(true); setNotice(null); setError(null);
      await agendaService.createBloqueo({
        profesionalInstitucionId: Number(selected.profesionalInstitucionId ?? selected.id),
        fechaDesde: bloqueoDesde,
        fechaHasta: bloqueoHasta,
        motivo: bloqueoMotivo,
      });
      setBloqueoDesde(''); setBloqueoHasta(''); setBloqueoMotivo('');
      setNotice('Bloqueo de agenda agregado.');
      await loadAgenda(selected);
    } catch (e: any) { setError(readableError(e, 'No pudimos guardar el bloqueo.')); }
    finally { setSaving(false); }
  };

  if (loading) return <MtLoading text="Cargando disponibilidad..." />;

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="ADMIN" title="Disponibilidad médica" subtitle="Configurá horarios de atención, duración de turnos, licencias, feriados y bloqueos." />
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!!notice && <Text style={styles.success}>{notice}</Text>}

      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <Text style={styles.title}>Profesional</Text>
        <View style={styles.chipGrid}>
          {professionals.map((p) => {
            const active = (selected?.profesionalInstitucionId ?? selected?.id) === (p.profesionalInstitucionId ?? p.id);
            return <Pressable key={`${p.id}-${p.profesionalInstitucionId}`} onPress={() => setSelected(p)} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{p.apellido}, {p.nombre}</Text></Pressable>;
          })}
        </View>
      </MtCard>

      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <Text style={styles.title}>Nuevo horario de atención</Text>
        <View style={styles.chipGrid}>{DAYS.map((d) => <Pressable key={d} onPress={() => setDia(d)} style={[styles.day, dia === d && styles.chipActive]}><Text style={[styles.chipText, dia === d && styles.chipTextActive]}>{d}</Text></Pressable>)}</View>
        <View style={styles.row}><Field label="Desde" value={desde} setValue={setDesde} styles={styles} /><Field label="Hasta" value={hasta} setValue={setHasta} styles={styles} /><Field label="Min" value={duracion} setValue={setDuracion} styles={styles} /></View>
        <MtButton title="Agregar horario" onPress={addHorario} loading={saving} />
      </MtCard>

      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <Text style={styles.title}>Horarios vigentes</Text>
        {horarios.map((h) => <Text key={h.id} style={styles.item}>• {h.diaSemana}: {h.horaDesde} a {h.horaHasta} · {h.duracionTurnoMin} min · {h.especialidad}</Text>)}
        {!horarios.length && <Text style={styles.muted}>Sin horarios configurados. Si no cargás disponibilidad, no se ofrecerán turnos para ese médico.</Text>}
      </MtCard>

      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <Text style={styles.title}>Bloquear fecha/hora</Text>
        <Field label="Desde" value={bloqueoDesde} setValue={setBloqueoDesde} styles={styles} placeholder="2026-06-10T09:00" />
        <Field label="Hasta" value={bloqueoHasta} setValue={setBloqueoHasta} styles={styles} placeholder="2026-06-10T13:00" />
        <Field label="Motivo" value={bloqueoMotivo} setValue={setBloqueoMotivo} styles={styles} placeholder="Feriado, licencia, congreso..." />
        <MtButton title="Agregar bloqueo" onPress={addBloqueo} loading={saving} variant="secondary" />
      </MtCard>

      <MtCard style={{ gap: 10, marginBottom: 90 }}>
        <Text style={styles.title}>Bloqueos cargados</Text>
        {bloqueos.map((b) => <Text key={b.id} style={styles.item}>• {b.fechaDesde} → {b.fechaHasta} · {b.motivo || 'Sin motivo'}</Text>)}
        {!bloqueos.length && <Text style={styles.muted}>No hay bloqueos.</Text>}
      </MtCard>
      <RoleBottomNav role="admin" active="profesionales" />
    </MtScreen>
  );
}

function Field({ label, value, setValue, styles, placeholder }: { label: string; value: string; setValue: (v: string) => void; styles: ReturnType<typeof createStyles>; placeholder?: string }) {
  return <View style={{ flex: 1 }}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={setValue} placeholder={placeholder} style={styles.input} /></View>;
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    title: { color: theme.colors.ink, fontWeight: '900', fontSize: 17 },
    muted: { color: theme.colors.muted, fontWeight: '700', lineHeight: 20 },
    item: { color: theme.colors.ink, fontWeight: '700', lineHeight: 22 },
    row: { flexDirection: 'row', gap: 10 },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: theme.colors.surface },
    day: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
    chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    chipText: { color: theme.colors.ink, fontWeight: '800', fontSize: 12 },
    chipTextActive: { color: theme.mode === 'dark' ? '#06201D' : '#FFFFFF' },
    fieldLabel: { color: theme.colors.muted, fontWeight: '900', marginBottom: 6 },
    input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingHorizontal: 12, minHeight: 46, color: theme.colors.ink, backgroundColor: theme.colors.bg },
    error: { color: theme.colors.danger, fontWeight: '900', marginBottom: 12 },
    success: { color: theme.colors.success, fontWeight: '900', marginBottom: 12 },
  });
}
