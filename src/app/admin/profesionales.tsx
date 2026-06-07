import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { MtButton, MtCard, MtEmptyState, MtHeader, MtInput, MtLoading, MtPill, MtScreen } from '../../components/mediturnos';
import { MtSelect } from '../../components/MtSelect';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { adminService, AdminCatalogItem, AdminPaciente, AdminProfesional, AdminSecretaria } from '../../api/adminService';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';
import { AdminActionRow, AdminKV, AdminMiniButton, AdminNotice, AdminTabs, AdminTitle } from '../../components/admin/AdminUi';

type Tab = 'MEDICOS' | 'SECRETARIAS' | 'PACIENTES'; // PACIENTES queda soportado por compatibilidad, pero el alta principal está en Admin > Usuarios.

const sangreOptions = ['A_POSITIVO', 'A_NEGATIVO', 'B_POSITIVO', 'B_NEGATIVO', 'AB_POSITIVO', 'AB_NEGATIVO', 'O_POSITIVO', 'O_NEGATIVO'].map((value) => ({ value, label: value.replace('_', ' ') }));

const profesionalEmpty = {
  id: undefined as number | undefined,
  email: '', password: '', nombre: '', apellido: '', dni: '', matricula: '', telefono: '', activo: true, emailVerificado: true,
  especialidadIds: [] as number[], institucionIds: [] as number[],
};
const secretariaEmpty = { id: undefined as number | undefined, email: '', password: '', nombre: '', apellido: '', dni: '', telefono: '', institucionId: '', activa: true, emailVerificado: true };
const pacienteEmpty = {
  id: undefined as number | undefined,
  email: '', password: '', nombre: '', apellido: '', dni: '', fechaNacimiento: '', telefono: '', tipoSangre: 'O_POSITIVO', obraSocialId: '', numeroCarnet: '', institucionCabeceraId: '', medicoCabeceraProfesionalId: '', activo: true, emailVerificado: true,
};

function includesText(value: any, q: string) {
  return !q || JSON.stringify(value).toLowerCase().includes(q);
}

function selectedNames(ids: number[], items: AdminCatalogItem[]) {
  return ids.map((id) => items.find((item) => item.id === id)?.nombre).filter(Boolean).join(', ') || 'Sin seleccionar';
}

function toggleId(ids: number[], id: number) {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

function quickPassword(prefix: string) {
  return `${prefix}${new Date().getFullYear()}!`;
}

export default function AdminProfesionalesScreen() {
  const [tab, setTab] = useState<Tab>('MEDICOS');
  const [query, setQuery] = useState('');
  const [profesionales, setProfesionales] = useState<AdminProfesional[]>([]);
  const [secretarias, setSecretarias] = useState<AdminSecretaria[]>([]);
  const [pacientes, setPacientes] = useState<AdminPaciente[]>([]);
  const [especialidades, setEspecialidades] = useState<AdminCatalogItem[]>([]);
  const [instituciones, setInstituciones] = useState<AdminCatalogItem[]>([]);
  const [obras, setObras] = useState<AdminCatalogItem[]>([]);
  const [profForm, setProfForm] = useState(profesionalEmpty);
  const [secForm, setSecForm] = useState(secretariaEmpty);
  const [pacForm, setPacForm] = useState(pacienteEmpty);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const theme = useMtTheme();
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollTop = () => setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 80);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [p, s, pa, e, i, o] = await Promise.all([
        adminService.profesionales(), adminService.secretarias(), adminService.pacientes(),
        adminService.especialidades(), adminService.instituciones(), adminService.obrasSociales(),
      ]);
      setProfesionales(p); setSecretarias(s); setPacientes(pa); setEspecialidades(e); setInstituciones(i); setObras(o);
    } catch (e: any) {
      setError(readableError(e, 'No pudimos cargar personal y pacientes.'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredProfessionals = useMemo(() => profesionales.filter((p) => includesText(p, query.toLowerCase().trim())), [profesionales, query]);
  const filteredSecretaries = useMemo(() => secretarias.filter((s) => includesText(s, query.toLowerCase().trim())), [secretarias, query]);
  const filteredPatients = useMemo(() => pacientes.filter((p) => includesText(p, query.toLowerCase().trim())), [pacientes, query]);

  const closeForm = () => { setFormOpen(false); setProfForm(profesionalEmpty); setSecForm(secretariaEmpty); setPacForm(pacienteEmpty); };
  const openCreate = () => { setMessage(null); setError(null); setFormOpen(true); if (tab === 'MEDICOS') setProfForm(profesionalEmpty); if (tab === 'SECRETARIAS') setSecForm(secretariaEmpty); if (tab === 'PACIENTES') setPacForm(pacienteEmpty); };

  const editProfesional = (p: AdminProfesional) => {
    setTab('MEDICOS'); setFormOpen(true); setMessage(null); setError(null);
    setProfForm({
      id: p.id, email: p.email || '', password: '', nombre: p.nombre, apellido: p.apellido, dni: p.dni || '', matricula: p.matricula || '', telefono: p.telefono || '', activo: p.activo !== false, emailVerificado: true,
      especialidadIds: especialidades.filter((e) => p.especialidades?.includes(e.nombre)).map((e) => e.id),
      institucionIds: instituciones.filter((i) => p.instituciones?.includes(i.nombre)).map((i) => i.id),
    });
  };

  const editSecretaria = (s: AdminSecretaria) => {
    setTab('SECRETARIAS'); setFormOpen(true); setMessage(null); setError(null);
    setSecForm({ id: s.id, email: s.email || '', password: '', nombre: s.nombre, apellido: s.apellido, dni: s.dni || '', telefono: s.telefono || '', institucionId: String(instituciones.find((i) => i.nombre === s.institucion)?.id ?? ''), activa: s.activa !== false, emailVerificado: true });
  };

  const editPaciente = (p: AdminPaciente) => {
    setTab('PACIENTES'); setFormOpen(true); setMessage(null); setError(null);
    setPacForm({
      id: p.id, email: p.email || '', password: '', nombre: p.nombre, apellido: p.apellido, dni: p.dni || '', fechaNacimiento: p.fechaNacimiento || '', telefono: p.telefono || '', tipoSangre: p.tipoSangre || 'O_POSITIVO',
      obraSocialId: String(obras.find((o) => o.nombre === p.obraSocial)?.id ?? ''), numeroCarnet: p.numeroCarnet || '',
      institucionCabeceraId: String(instituciones.find((i) => i.nombre === p.institucionCabecera)?.id ?? ''),
      medicoCabeceraProfesionalId: String(profesionales.find((m) => `${m.nombre} ${m.apellido}`.trim() === p.medicoCabecera || `${m.apellido}, ${m.nombre}`.trim() === p.medicoCabecera)?.id ?? ''),
      activo: p.activo !== false, emailVerificado: true,
    });
  };

  const validateProfesional = () => {
    if (!profForm.email.includes('@')) return 'Ingresá email válido del médico.';
    if (!profForm.id && profForm.password.trim().length < 8) return 'La contraseña inicial del médico debe tener al menos 8 caracteres.';
    if (!profForm.nombre.trim() || !profForm.apellido.trim()) return 'Nombre y apellido son obligatorios.';
    if (!profForm.matricula.trim()) return 'La matrícula es obligatoria.';
    if (!profForm.especialidadIds.length) return 'Seleccioná al menos una especialidad.';
    if (!profForm.institucionIds.length) return 'Seleccioná al menos una institución.';
    return null;
  };

  const validateSecretaria = () => {
    if (!secForm.email.includes('@')) return 'Ingresá email válido de secretaría.';
    if (!secForm.id && secForm.password.trim().length < 8) return 'La contraseña inicial de secretaría debe tener al menos 8 caracteres.';
    if (!secForm.nombre.trim() || !secForm.apellido.trim() || !secForm.dni.trim()) return 'Nombre, apellido y DNI son obligatorios.';
    if (!secForm.institucionId) return 'Seleccioná institución de secretaría.';
    return null;
  };

  const validatePaciente = () => {
    if (!pacForm.email.includes('@')) return 'Ingresá email válido del paciente.';
    if (!pacForm.id && pacForm.password.trim().length < 8) return 'La contraseña inicial del paciente debe tener al menos 8 caracteres.';
    if (!pacForm.nombre.trim() || !pacForm.apellido.trim() || !pacForm.dni.trim()) return 'Nombre, apellido y DNI son obligatorios.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pacForm.fechaNacimiento)) return 'La fecha de nacimiento debe tener formato AAAA-MM-DD.';
    if (!pacForm.telefono.trim()) return 'El teléfono es obligatorio.';
    if (!pacForm.obraSocialId) return 'Seleccioná obra social.';
    return null;
  };

  const saveProfesional = async () => {
    const problem = validateProfesional(); if (problem) { setError(problem); scrollTop(); return; }
    setSaving(true); setError(null); setMessage(null);
    const payload: any = {
      email: profForm.email.trim(), nombre: profForm.nombre.trim(), apellido: profForm.apellido.trim(), dni: profForm.dni.trim() || undefined, matricula: profForm.matricula.trim(), telefono: profForm.telefono.trim() || undefined,
      activo: profForm.activo, emailVerificado: profForm.emailVerificado, especialidadIds: profForm.especialidadIds, institucionIds: profForm.institucionIds,
    };
    if (profForm.password.trim()) payload.password = profForm.password.trim();
    try {
      if (profForm.id) { await adminService.actualizarProfesional(profForm.id, payload); setMessage('Médico actualizado correctamente.'); scrollTop(); }
      else { await adminService.crearProfesional({ ...payload, password: profForm.password.trim() }); setMessage('Médico creado correctamente.'); scrollTop(); }
      closeForm(); await load();
    } catch (e: any) { setError(readableError(e, 'No pudimos guardar el médico.')); scrollTop(); }
    finally { setSaving(false); }
  };

  const saveSecretaria = async () => {
    const problem = validateSecretaria(); if (problem) { setError(problem); scrollTop(); return; }
    setSaving(true); setError(null); setMessage(null);
    const payload: any = { email: secForm.email.trim(), nombre: secForm.nombre.trim(), apellido: secForm.apellido.trim(), dni: secForm.dni.trim(), telefono: secForm.telefono.trim() || undefined, institucionId: Number(secForm.institucionId), activa: secForm.activa, emailVerificado: secForm.emailVerificado };
    if (secForm.password.trim()) payload.password = secForm.password.trim();
    try {
      if (secForm.id) { await adminService.actualizarSecretaria(secForm.id, payload); setMessage('Secretaría actualizada correctamente.'); scrollTop(); }
      else { await adminService.crearSecretaria({ ...payload, password: secForm.password.trim() }); setMessage('Secretaría creada correctamente.'); scrollTop(); }
      closeForm(); await load();
    } catch (e: any) { setError(readableError(e, 'No pudimos guardar secretaría.')); }
    finally { setSaving(false); }
  };

  const savePaciente = async () => {
    const problem = validatePaciente(); if (problem) { setError(problem); scrollTop(); return; }
    setSaving(true); setError(null); setMessage(null);
    const payload: any = {
      email: pacForm.email.trim(), nombre: pacForm.nombre.trim(), apellido: pacForm.apellido.trim(), dni: pacForm.dni.trim(), fechaNacimiento: pacForm.fechaNacimiento, telefono: pacForm.telefono.trim(), tipoSangre: pacForm.tipoSangre,
      obraSocialId: Number(pacForm.obraSocialId), numeroCarnet: pacForm.numeroCarnet.trim() || undefined,
      institucionCabeceraId: pacForm.institucionCabeceraId ? Number(pacForm.institucionCabeceraId) : undefined,
      medicoCabeceraProfesionalId: pacForm.medicoCabeceraProfesionalId ? Number(pacForm.medicoCabeceraProfesionalId) : undefined,
      activo: pacForm.activo, emailVerificado: pacForm.emailVerificado,
    };
    if (pacForm.password.trim()) payload.password = pacForm.password.trim();
    try {
      if (pacForm.id) { await adminService.actualizarPaciente(pacForm.id, payload); setMessage('Paciente actualizado correctamente.'); scrollTop(); }
      else { await adminService.crearPaciente({ ...payload, password: pacForm.password.trim() }); setMessage('Paciente creado correctamente.'); scrollTop(); }
      closeForm(); await load();
    } catch (e: any) { setError(readableError(e, 'No pudimos guardar el paciente.')); scrollTop(); }
    finally { setSaving(false); }
  };

  const setEntityActive = async (kind: Tab, id: number, active: boolean) => {
    setWorking(`${kind}-${id}`); setError(null); setMessage(null);
    try {
      if (kind === 'MEDICOS') active ? await adminService.activarProfesional(id) : await adminService.desactivarProfesional(id);
      if (kind === 'SECRETARIAS') active ? await adminService.activarSecretaria(id) : await adminService.desactivarSecretaria(id);
      if (kind === 'PACIENTES') active ? await adminService.activarPaciente(id) : await adminService.desactivarPaciente(id);
      setMessage(active ? 'Registro activado.' : 'Registro desactivado.');
      await load();
    } catch (e: any) { setError(readableError(e, 'No pudimos cambiar el estado.')); }
    finally { setWorking(null); }
  };

  if (loading) return <MtLoading text="Cargando gestión de personas..." />;

  return (
    <MtScreen scroll scrollRef={scrollRef}>
      <MtHeader eyebrow="ADMIN" title="Personal" subtitle="Médicos y secretarías. Los pacientes se crean desde Admin > Usuarios." />
      {message ? <AdminNotice type="success" title="Listo" message={message} /> : null}
      {error ? <AdminNotice type="danger" title="Revisá esta operación" message={error} /> : null}

      <MtCard style={{ marginBottom: 14 }}>
        <AdminTabs value={tab} onChange={(v) => { setTab(v); closeForm(); }} options={[{ value: 'MEDICOS', label: `Médicos ${profesionales.length}` }, { value: 'SECRETARIAS', label: `Secretaría ${secretarias.length}`, tone: 'warning' }]} />
        <MtInput label="Buscar" value={query} onChangeText={setQuery} placeholder="nombre, dni, email, matrícula..." autoCapitalize="none" />
        <MtButton title={formOpen ? 'Cerrar formulario' : tab === 'MEDICOS' ? 'Crear médico' : 'Crear secretaría'} onPress={formOpen ? closeForm : openCreate} style={{ marginTop: 12 }} />
      </MtCard>

      {formOpen && tab === 'MEDICOS' ? (
        <MtCard style={{ marginBottom: 14, borderColor: theme.colors.primary }}>
          <AdminTitle title={profForm.id ? 'Editar médico' : 'Crear médico'} subtitle="Crea el usuario médico y sus datos profesionales." />
          <View style={{ gap: 12 }}>
            <MtInput label="Email" value={profForm.email} onChangeText={(email) => setProfForm((f) => ({ ...f, email }))} autoCapitalize="none" keyboardType="email-address" />
            <MtInput label={profForm.id ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'} value={profForm.password} onChangeText={(password) => setProfForm((f) => ({ ...f, password }))} secureTextEntry placeholder={profForm.id ? 'No cambiar' : quickPassword('Medico')} />
            <MtInput label="Nombre" value={profForm.nombre} onChangeText={(nombre) => setProfForm((f) => ({ ...f, nombre }))} />
            <MtInput label="Apellido" value={profForm.apellido} onChangeText={(apellido) => setProfForm((f) => ({ ...f, apellido }))} />
            <MtInput label="DNI" value={profForm.dni} onChangeText={(dni) => setProfForm((f) => ({ ...f, dni }))} keyboardType="numeric" />
            <MtInput label="Matrícula" value={profForm.matricula} onChangeText={(matricula) => setProfForm((f) => ({ ...f, matricula }))} />
            <MtInput label="Teléfono" value={profForm.telefono} onChangeText={(telefono) => setProfForm((f) => ({ ...f, telefono }))} keyboardType="phone-pad" />
            <Text style={{ color: theme.colors.ink, fontWeight: '900' }}>Especialidades: {selectedNames(profForm.especialidadIds, especialidades)}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{especialidades.map((e) => <MtPill key={e.id} label={e.nombre} selected={profForm.especialidadIds.includes(e.id)} onPress={() => setProfForm((f) => ({ ...f, especialidadIds: toggleId(f.especialidadIds, e.id) }))} />)}</View>
            <Text style={{ color: theme.colors.ink, fontWeight: '900' }}>Instituciones: {selectedNames(profForm.institucionIds, instituciones)}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{instituciones.map((i) => <MtPill key={i.id} label={i.nombre} selected={profForm.institucionIds.includes(i.id)} tone="warning" onPress={() => setProfForm((f) => ({ ...f, institucionIds: toggleId(f.institucionIds, i.id) }))} />)}</View>
            <AdminTabs value={profForm.activo ? 'SI' : 'NO'} onChange={(v) => setProfForm((f) => ({ ...f, activo: v === 'SI' }))} options={[{ value: 'SI', label: 'Activo', tone: 'success' }, { value: 'NO', label: 'Inactivo', tone: 'danger' }]} />
            <MtButton title={saving ? 'Guardando...' : 'Guardar médico'} onPress={saveProfesional} loading={saving} disabled={saving} />
          </View>
        </MtCard>
      ) : null}

      {formOpen && tab === 'SECRETARIAS' ? (
        <MtCard style={{ marginBottom: 14, borderColor: theme.colors.warning }}>
          <AdminTitle title={secForm.id ? 'Editar secretaría' : 'Crear secretaría'} subtitle="Crea usuario SECRETARY y lo vincula con una institución." />
          <View style={{ gap: 12 }}>
            <MtInput label="Email" value={secForm.email} onChangeText={(email) => setSecForm((f) => ({ ...f, email }))} autoCapitalize="none" keyboardType="email-address" />
            <MtInput label={secForm.id ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'} value={secForm.password} onChangeText={(password) => setSecForm((f) => ({ ...f, password }))} secureTextEntry placeholder={secForm.id ? 'No cambiar' : quickPassword('Secretaria')} />
            <MtInput label="Nombre" value={secForm.nombre} onChangeText={(nombre) => setSecForm((f) => ({ ...f, nombre }))} />
            <MtInput label="Apellido" value={secForm.apellido} onChangeText={(apellido) => setSecForm((f) => ({ ...f, apellido }))} />
            <MtInput label="DNI" value={secForm.dni} onChangeText={(dni) => setSecForm((f) => ({ ...f, dni }))} keyboardType="numeric" />
            <MtInput label="Teléfono" value={secForm.telefono} onChangeText={(telefono) => setSecForm((f) => ({ ...f, telefono }))} keyboardType="phone-pad" />
            <MtSelect label="Institución" value={secForm.institucionId} placeholder="Seleccionar institución" options={instituciones.map((i) => ({ label: i.nombre, value: String(i.id) }))} onChange={(institucionId) => setSecForm((f) => ({ ...f, institucionId }))} />
            <AdminTabs value={secForm.activa ? 'SI' : 'NO'} onChange={(v) => setSecForm((f) => ({ ...f, activa: v === 'SI' }))} options={[{ value: 'SI', label: 'Activa', tone: 'success' }, { value: 'NO', label: 'Inactiva', tone: 'danger' }]} />
            <MtButton title={saving ? 'Guardando...' : 'Guardar secretaría'} onPress={saveSecretaria} loading={saving} disabled={saving} />
          </View>
        </MtCard>
      ) : null}

      {formOpen && tab === 'PACIENTES' ? (
        <MtCard style={{ marginBottom: 14, borderColor: theme.colors.success }}>
          <AdminTitle title={pacForm.id ? 'Editar paciente' : 'Crear paciente'} subtitle="Alta administrativa de paciente con usuario PATIENT asociado." />
          <View style={{ gap: 12 }}>
            <MtInput label="Email" value={pacForm.email} onChangeText={(email) => setPacForm((f) => ({ ...f, email }))} autoCapitalize="none" keyboardType="email-address" />
            <MtInput label={pacForm.id ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'} value={pacForm.password} onChangeText={(password) => setPacForm((f) => ({ ...f, password }))} secureTextEntry placeholder={pacForm.id ? 'No cambiar' : quickPassword('Paciente')} />
            <MtInput label="Nombre" value={pacForm.nombre} onChangeText={(nombre) => setPacForm((f) => ({ ...f, nombre }))} />
            <MtInput label="Apellido" value={pacForm.apellido} onChangeText={(apellido) => setPacForm((f) => ({ ...f, apellido }))} />
            <MtInput label="DNI" value={pacForm.dni} onChangeText={(dni) => setPacForm((f) => ({ ...f, dni }))} keyboardType="numeric" />
            <MtInput label="Fecha nacimiento (AAAA-MM-DD)" value={pacForm.fechaNacimiento} onChangeText={(fechaNacimiento) => setPacForm((f) => ({ ...f, fechaNacimiento }))} placeholder="1990-05-23" />
            <MtInput label="Teléfono" value={pacForm.telefono} onChangeText={(telefono) => setPacForm((f) => ({ ...f, telefono }))} keyboardType="phone-pad" />
            <MtSelect label="Grupo sanguíneo" value={pacForm.tipoSangre} placeholder="Seleccionar" options={sangreOptions} onChange={(tipoSangre) => setPacForm((f) => ({ ...f, tipoSangre }))} />
            <MtSelect label="Obra social" value={pacForm.obraSocialId} placeholder="Seleccionar obra social" options={obras.map((o) => ({ label: o.nombre, value: String(o.id) }))} onChange={(obraSocialId) => setPacForm((f) => ({ ...f, obraSocialId }))} />
            <MtInput label="N° carnet" value={pacForm.numeroCarnet} onChangeText={(numeroCarnet) => setPacForm((f) => ({ ...f, numeroCarnet }))} />
            <Text style={{ color: theme.colors.muted, fontWeight: '700', lineHeight: 20 }}>N° historia clínica: se genera automáticamente al guardar el paciente.</Text>
            <MtSelect label="Institución cabecera" value={pacForm.institucionCabeceraId} placeholder="Opcional" options={[{ label: 'Sin institución', value: '' }, ...instituciones.map((i) => ({ label: i.nombre, value: String(i.id) }))]} onChange={(institucionCabeceraId) => setPacForm((f) => ({ ...f, institucionCabeceraId }))} />
            <MtSelect label="Médico cabecera" value={pacForm.medicoCabeceraProfesionalId} placeholder="Opcional" options={[{ label: 'Sin médico', value: '' }, ...profesionales.map((p) => ({ label: `${p.apellido}, ${p.nombre}`, value: String(p.id) }))]} onChange={(medicoCabeceraProfesionalId) => setPacForm((f) => ({ ...f, medicoCabeceraProfesionalId }))} />
            <AdminTabs value={pacForm.activo ? 'SI' : 'NO'} onChange={(v) => setPacForm((f) => ({ ...f, activo: v === 'SI' }))} options={[{ value: 'SI', label: 'Activo', tone: 'success' }, { value: 'NO', label: 'Inactivo', tone: 'danger' }]} />
            <MtButton title={saving ? 'Guardando...' : 'Guardar paciente'} onPress={savePaciente} loading={saving} disabled={saving} />
          </View>
        </MtCard>
      ) : null}

      {tab === 'MEDICOS' && (filteredProfessionals.length ? filteredProfessionals.map((p) => (
        <MtCard key={p.id} style={{ marginBottom: 12, opacity: p.activo === false ? 0.7 : 1 }}>
          <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 16 }}>{p.apellido}, {p.nombre}</Text>
          <AdminKV label="Email" value={p.email} /><AdminKV label="DNI" value={p.dni} /><AdminKV label="Matrícula" value={p.matricula} /><AdminKV label="Teléfono" value={p.telefono} />
          <AdminKV label="Especialidades" value={p.especialidades?.join(', ')} /><AdminKV label="Instituciones" value={p.instituciones?.join(', ')} />
          <MtPill label={p.activo === false ? 'INACTIVO' : 'ACTIVO'} tone={p.activo === false ? 'danger' : 'success'} selected />
          <AdminActionRow><AdminMiniButton label="Editar" onPress={() => editProfesional(p)} /><AdminMiniButton label={p.activo === false ? 'Activar' : 'Desactivar'} tone={p.activo === false ? 'success' : 'danger'} disabled={working === `MEDICOS-${p.id}`} onPress={() => setEntityActive('MEDICOS', p.id, p.activo === false)} /></AdminActionRow>
        </MtCard>
      )) : <MtEmptyState title="Sin médicos" subtitle="No hay profesionales para mostrar." />)}

      {tab === 'SECRETARIAS' && (filteredSecretaries.length ? filteredSecretaries.map((s) => (
        <MtCard key={s.id} style={{ marginBottom: 12, opacity: s.activa === false ? 0.7 : 1 }}>
          <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 16 }}>{s.apellido}, {s.nombre}</Text>
          <AdminKV label="Email" value={s.email} /><AdminKV label="DNI" value={s.dni} /><AdminKV label="Teléfono" value={s.telefono} /><AdminKV label="Institución" value={s.institucion} />
          <MtPill label={s.activa === false ? 'INACTIVA' : 'ACTIVA'} tone={s.activa === false ? 'danger' : 'success'} selected />
          <AdminActionRow><AdminMiniButton label="Editar" onPress={() => editSecretaria(s)} /><AdminMiniButton label={s.activa === false ? 'Activar' : 'Desactivar'} tone={s.activa === false ? 'success' : 'danger'} disabled={working === `SECRETARIAS-${s.id}`} onPress={() => setEntityActive('SECRETARIAS', s.id, s.activa === false)} /></AdminActionRow>
        </MtCard>
      )) : <MtEmptyState title="Sin secretarías" subtitle="No hay secretarías para mostrar." />)}

      {tab === 'PACIENTES' && (filteredPatients.length ? filteredPatients.map((p) => (
        <MtCard key={p.id} style={{ marginBottom: 12, opacity: p.activo === false ? 0.7 : 1 }}>
          <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 16 }}>{p.apellido}, {p.nombre}</Text>
          <AdminKV label="Email" value={p.email} /><AdminKV label="DNI" value={p.dni} /><AdminKV label="Teléfono" value={p.telefono} /><AdminKV label="Obra social" value={p.obraSocial} /><AdminKV label="Historia clínica" value={p.numeroHistoriaClinica} />
          <MtPill label={p.activo === false ? 'INACTIVO' : 'ACTIVO'} tone={p.activo === false ? 'danger' : 'success'} selected />
          <AdminActionRow><AdminMiniButton label="Editar" onPress={() => editPaciente(p)} /><AdminMiniButton label={p.activo === false ? 'Activar' : 'Desactivar'} tone={p.activo === false ? 'success' : 'danger'} disabled={working === `PACIENTES-${p.id}`} onPress={() => setEntityActive('PACIENTES', p.id, p.activo === false)} /></AdminActionRow>
        </MtCard>
      )) : <MtEmptyState title="Sin pacientes" subtitle="No hay pacientes para mostrar." />)}

      <RoleBottomNav role="admin" active="profesionales" />
    </MtScreen>
  );
}
