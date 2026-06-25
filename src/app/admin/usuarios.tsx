import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { MtButton, MtCard, MtEmptyState, MtHeader, MtInput, MtLoading, MtPill, MtScreen } from '../../components/mediturnos';
import { MtSelect } from '../../components/MtSelect';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { adminService, AdminCatalogItem, AdminUsuario } from '../../api/adminService';
import { useMtTheme } from '../../theme/themeStore';
import { humanRole, normalizeRole } from '../../auth/roles';
import { readableError } from '../../utils/errors';
import { AdminActionRow, AdminKV, AdminMiniButton, AdminNotice, AdminTabs, AdminTitle } from '../../components/admin/AdminUi';
type Filter = 'TODOS' | 'ADMIN' | 'PATIENT' | 'PROFESSIONAL' | 'SECRETARY' | 'INACTIVOS' | 'SIN_VERIFICAR';
type CreateKind = 'ADMIN' | 'PATIENT';
type UsuarioForm = {
    id?: number;
    email: string;
    password: string;
    rol: string;
    activo: boolean;
    emailVerificado: boolean;
};
type PacienteForm = {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    dni: string;
    telefono: string;
    fechaNacimiento: string;
    tipoSangre: string;
    obraSocialId: string;
    numeroCarnet: string;
    emailVerificado: boolean;
    activo: boolean;
};
const emptyAdmin: UsuarioForm = { email: '', password: '', rol: 'ADMIN', activo: true, emailVerificado: true };
const emptyPaciente: PacienteForm = {
    email: '', password: '', nombre: '', apellido: '', dni: '', telefono: '', fechaNacimiento: '1990-01-01', tipoSangre: 'O_POSITIVO', obraSocialId: '', numeroCarnet: '', emailVerificado: true, activo: true,
};
const sangreOptions = ['A_POSITIVO', 'A_NEGATIVO', 'B_POSITIVO', 'B_NEGATIVO', 'AB_POSITIVO', 'AB_NEGATIVO', 'O_POSITIVO', 'O_NEGATIVO']
    .map((value) => ({ value, label: value.replace('_', ' ') }));
function validateAdmin(form: UsuarioForm, editing: boolean) {
    if (!form.email.trim() || !form.email.includes('@'))
        return 'Ingresá un email válido.';
    if (!editing && form.password.trim().length < 8)
        return 'La contraseña inicial debe tener al menos 8 caracteres.';
    return null;
}
function validatePaciente(form: PacienteForm) {
    if (!form.email.trim() || !form.email.includes('@'))
        return 'Ingresá un email válido.';
    if (form.password.trim().length < 8)
        return 'La contraseña inicial debe tener al menos 8 caracteres.';
    if (!form.nombre.trim())
        return 'El nombre del paciente es obligatorio.';
    if (!form.apellido.trim())
        return 'El apellido del paciente es obligatorio.';
    if (!form.dni.trim())
        return 'El DNI del paciente es obligatorio.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.fechaNacimiento))
        return 'La fecha de nacimiento debe tener formato AAAA-MM-DD.';
    if (!form.telefono.trim())
        return 'El teléfono del paciente es obligatorio.';
    if (!form.obraSocialId)
        return 'Seleccioná una obra social.';
    return null;
}
function hcFromDni(dni: string) { return `HC-${String(dni || Date.now()).replace(/\D/g, '').slice(-8).padStart(6, '0')}`; }
function userMatchesFilter(user: AdminUsuario, filter: Filter, query: string) {
    const role = normalizeRole(user.rol);
    const text = `${user.email} ${user.rol} ${humanRole(user.rol)} ${user.nombreMostrar} ${user.dni}`.toLowerCase();
    if (query && !text.includes(query))
        return false;
    if (filter === 'TODOS')
        return true;
    if (filter === 'INACTIVOS')
        return user.activo === false;
    if (filter === 'SIN_VERIFICAR')
        return user.emailVerificado !== true;
    return role === filter;
}
function AdminAccessFields({ form, setForm }: {
    form: UsuarioForm;
    setForm: React.Dispatch<React.SetStateAction<UsuarioForm>>;
}) {
    return <View style={{ gap: 12 }}>
    <MtInput label="Email" value={form.email} onChangeText={(email) => setForm((current) => ({ ...current, email }))} autoCapitalize="none" keyboardType="email-address"/>
    <MtInput label={form.id ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'} value={form.password} onChangeText={(password) => setForm((current) => ({ ...current, password }))} placeholder={form.id ? 'Dejar vacío para no cambiar' : 'Mínimo 8 caracteres'} secureTextEntry/>
    <AdminTabs value={form.activo ? 'SI' : 'NO'} onChange={(value) => setForm((current) => ({ ...current, activo: value === 'SI' }))} options={[{ value: 'SI', label: 'Activo', tone: 'success' }, { value: 'NO', label: 'Inactivo', tone: 'danger' }]}/>
    <AdminTabs value={form.emailVerificado ? 'SI' : 'NO'} onChange={(value) => setForm((current) => ({ ...current, emailVerificado: value === 'SI' }))} options={[{ value: 'SI', label: 'Email verificado', tone: 'success' }, { value: 'NO', label: 'Email sin verificar', tone: 'warning' }]}/>
  </View>;
}
function PatientCreateFields({ form, setForm, obras }: {
    form: PacienteForm;
    setForm: React.Dispatch<React.SetStateAction<PacienteForm>>;
    obras: AdminCatalogItem[];
}) {
    return <View style={{ gap: 12 }}>
    <MtInput label="Email" value={form.email} onChangeText={(email) => setForm((current) => ({ ...current, email }))} autoCapitalize="none" keyboardType="email-address"/>
    <MtInput label="Contraseña inicial" value={form.password} onChangeText={(password) => setForm((current) => ({ ...current, password }))} secureTextEntry placeholder="Mínimo 8 caracteres"/>
    <MtInput label="Nombre" value={form.nombre} onChangeText={(nombre) => setForm((current) => ({ ...current, nombre }))}/>
    <MtInput label="Apellido" value={form.apellido} onChangeText={(apellido) => setForm((current) => ({ ...current, apellido }))}/>
    <MtInput label="DNI" value={form.dni} onChangeText={(dni) => setForm((current) => ({ ...current, dni }))} keyboardType="numeric"/>
    <MtInput label="Teléfono" value={form.telefono} onChangeText={(telefono) => setForm((current) => ({ ...current, telefono }))} keyboardType="phone-pad"/>
    <MtInput label="Fecha nacimiento (AAAA-MM-DD)" value={form.fechaNacimiento} onChangeText={(fechaNacimiento) => setForm((current) => ({ ...current, fechaNacimiento }))}/>
    <MtSelect label="Grupo sanguíneo" value={form.tipoSangre} placeholder="Seleccionar" options={sangreOptions} onChange={(tipoSangre) => setForm((current) => ({ ...current, tipoSangre }))}/>
    <MtSelect label="Obra social" value={form.obraSocialId} placeholder="Seleccionar" options={obras.map((item) => ({ label: item.nombre, value: String(item.id) }))} onChange={(obraSocialId) => setForm((current) => ({ ...current, obraSocialId }))}/>
    <MtInput label="N° carnet" value={form.numeroCarnet} onChangeText={(numeroCarnet) => setForm((current) => ({ ...current, numeroCarnet }))}/>
    <AdminTabs value={form.emailVerificado ? 'SI' : 'NO'} onChange={(value) => setForm((current) => ({ ...current, emailVerificado: value === 'SI' }))} options={[{ value: 'SI', label: 'Email verificado', tone: 'success' }, { value: 'NO', label: 'Debe verificar', tone: 'warning' }]}/>
  </View>;
}
function UserFormCard({ adminForm, setAdminForm, pacienteForm, setPacienteForm, kind, setKind, obras, saving, submit, theme }: {
    adminForm: UsuarioForm;
    setAdminForm: React.Dispatch<React.SetStateAction<UsuarioForm>>;
    pacienteForm: PacienteForm;
    setPacienteForm: React.Dispatch<React.SetStateAction<PacienteForm>>;
    kind: CreateKind;
    setKind: (kind: CreateKind) => void;
    obras: AdminCatalogItem[];
    saving: boolean;
    submit: () => void;
    theme: ReturnType<typeof useMtTheme>;
}) {
    const editing = Boolean(adminForm.id);
    const showAdminFields = editing || kind === 'ADMIN';
    return <MtCard style={{ marginBottom: 14, borderColor: theme.colors.primary }}>
    <AdminTitle title={editing ? 'Editar usuario' : 'Crear usuario'} subtitle={editing ? 'Editá acceso, estado y verificación.' : 'Elegí si querés crear administrador o paciente.'}/>
    {!editing ? <AdminTabs value={kind} onChange={setKind} options={[{ value: 'ADMIN', label: 'Administrador', tone: 'danger' }, { value: 'PATIENT', label: 'Paciente', tone: 'success' }]}/> : null}
    {showAdminFields ? <AdminAccessFields form={adminForm} setForm={setAdminForm}/> : <PatientCreateFields form={pacienteForm} setForm={setPacienteForm} obras={obras}/>}
    <MtButton title={saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear usuario'} onPress={submit} disabled={saving} loading={saving} style={{ marginTop: 12 }}/>
    {!editing ? <Text style={{ color: theme.colors.muted, fontWeight: '700', marginTop: 10 }}>Médicos y secretarías se crean desde Admin → Personal para no generar usuarios huérfanos.</Text> : null}
  </MtCard>;
}
function roleTone(role: ReturnType<typeof normalizeRole>) {
    if (role === 'ADMIN')
        return 'danger';
    if (role === 'PROFESSIONAL')
        return 'primary';
    if (role === 'SECRETARY')
        return 'warning';
    return 'success';
}
function UserCard({ user, working, edit, resend, setActive, theme }: {
    user: AdminUsuario;
    working: boolean;
    edit: () => void;
    resend: () => void;
    setActive: (active: boolean) => void;
    theme: ReturnType<typeof useMtTheme>;
}) {
    const role = normalizeRole(user.rol);
    const enabled = user.activo !== false;
    return <MtCard style={{ marginBottom: 12, opacity: enabled ? 1 : 0.75 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <View style={{ flex: 1 }}><Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 16 }}>{user.email}</Text><Text style={{ color: theme.colors.muted, marginTop: 4 }}>{user.nombreMostrar || 'Sin persona asociada'}</Text></View>
      <MtPill label={humanRole(user.rol)} tone={roleTone(role)} selected/>
    </View>
    <AdminKV label="DNI" value={user.dni}/><AdminKV label="Estado" value={enabled ? 'Activo' : 'Inactivo'}/><AdminKV label="Email" value={user.emailVerificado ? 'Verificado' : 'Sin verificar'}/>
    <AdminActionRow>
      <AdminMiniButton label="Editar acceso" onPress={edit}/>
      {role === 'PATIENT' && !user.emailVerificado ? <AdminMiniButton label="Reenviar código" tone="warning" disabled={working} onPress={resend}/> : null}
      <AdminMiniButton label={enabled ? 'Desactivar' : 'Activar'} tone={enabled ? 'danger' : 'success'} disabled={working} onPress={() => setActive(!enabled)}/>
    </AdminActionRow>
  </MtCard>;
}
export default function AdminUsuariosScreen() {
    const scrollRef = useRef<ScrollView | null>(null);
    const scrollToTop = () => setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 80);
    const [usuarios, setUsuarios] = useState<AdminUsuario[]>([]);
    const [obrasSociales, setObrasSociales] = useState<AdminCatalogItem[]>([]);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('TODOS');
    const [kind, setKind] = useState<CreateKind>('ADMIN');
    const [adminForm, setAdminForm] = useState<UsuarioForm>(emptyAdmin);
    const [pacienteForm, setPacienteForm] = useState<PacienteForm>(emptyPaciente);
    const [formOpen, setFormOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [workingId, setWorkingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const theme = useMtTheme();
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [users, os] = await Promise.all([adminService.usuarios(), adminService.obrasSociales().catch(() => [])]);
            setUsuarios(users);
            setObrasSociales(os);
            if (!pacienteForm.obraSocialId && os[0]?.id)
                setPacienteForm((f) => ({ ...f, obraSocialId: String(os[0].id) }));
        }
        catch (e: any) {
            setError(readableError(e, 'No pudimos cargar usuarios.'));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = useMemo(() => {
        const normalizedQuery = query.toLowerCase().trim();
        return usuarios.filter((user) => userMatchesFilter(user, filter, normalizedQuery));
    }, [usuarios, query, filter]);
    const startCreate = () => { setAdminForm(emptyAdmin); setPacienteForm((f) => ({ ...emptyPaciente, obraSocialId: f.obraSocialId || (obrasSociales[0]?.id ? String(obrasSociales[0].id) : '') })); setFormOpen(true); setMessage(null); setError(null); scrollToTop(); };
    const startEdit = (user: AdminUsuario) => {
        setKind('ADMIN');
        setAdminForm({ id: user.id, email: user.email, password: '', rol: normalizeRole(user.rol) ?? user.rol, activo: user.activo !== false, emailVerificado: user.emailVerificado === true });
        setFormOpen(true);
        setMessage(null);
        setError(null);
        scrollToTop();
    };
    const submit = async () => {
        setError(null);
        setMessage(null);
        if (adminForm.id) {
            const problem = validateAdmin(adminForm, true);
            if (problem) {
                setError(problem);
                scrollToTop();
                return;
            }
            setSaving(true);
            try {
                const payload: any = { email: adminForm.email.trim(), activo: adminForm.activo, emailVerificado: adminForm.emailVerificado };
                if (adminForm.password.trim())
                    payload.password = adminForm.password.trim();
                await adminService.actualizarUsuario(adminForm.id, payload);
                setMessage('Usuario actualizado correctamente.');
                setFormOpen(false);
                await load();
                scrollToTop();
            }
            catch (e: any) {
                setError(readableError(e, 'No pudimos actualizar el usuario.'));
                scrollToTop();
            }
            finally {
                setSaving(false);
            }
            return;
        }
        setSaving(true);
        try {
            if (kind === 'ADMIN') {
                const problem = validateAdmin(adminForm, false);
                if (problem)
                    throw new Error(problem);
                await adminService.crearUsuario({ email: adminForm.email.trim(), password: adminForm.password.trim(), rol: 'ADMIN', activo: adminForm.activo, emailVerificado: adminForm.emailVerificado });
                setMessage('Administrador creado correctamente.');
            }
            else {
                const problem = validatePaciente(pacienteForm);
                if (problem)
                    throw new Error(problem);
                await adminService.crearPaciente({
                    email: pacienteForm.email.trim(), password: pacienteForm.password.trim(), nombre: pacienteForm.nombre.trim(), apellido: pacienteForm.apellido.trim(), dni: pacienteForm.dni.trim(), telefono: pacienteForm.telefono.trim(),
                    fechaNacimiento: pacienteForm.fechaNacimiento, tipoSangre: pacienteForm.tipoSangre, obraSocialId: Number(pacienteForm.obraSocialId), numeroCarnet: pacienteForm.numeroCarnet.trim() || undefined,
                    numeroHistoriaClinica: hcFromDni(pacienteForm.dni), activo: pacienteForm.activo, emailVerificado: pacienteForm.emailVerificado,
                });
                setMessage('Paciente creado correctamente. Ya puede iniciar sesión si el email está verificado.');
            }
            setFormOpen(false);
            setAdminForm(emptyAdmin);
            setPacienteForm(emptyPaciente);
            await load();
            scrollToTop();
        }
        catch (e: any) {
            setError(readableError(e, 'No pudimos guardar el usuario.'));
            scrollToTop();
        }
        finally {
            setSaving(false);
        }
    };
    const setActive = async (user: AdminUsuario, active: boolean) => {
        setWorkingId(user.id);
        setError(null);
        setMessage(null);
        try {
            active ? await adminService.activarUsuario(user.id) : await adminService.desactivarUsuario(user.id);
            setMessage(`Usuario ${user.email} ${active ? 'activado' : 'desactivado'}.`);
            await load();
            scrollToTop();
        }
        catch (e: any) {
            setError(readableError(e, active ? 'No pudimos activar el usuario.' : 'No pudimos desactivar el usuario.'));
            scrollToTop();
        }
        finally {
            setWorkingId(null);
        }
    };
    const resend = async (user: AdminUsuario) => {
        setWorkingId(user.id);
        setError(null);
        setMessage(null);
        try {
            const r = await adminService.reenviarVerificacionUsuario(user.id);
            setMessage(r?.message || 'Código de verificación reenviado.');
            scrollToTop();
        }
        catch (e: any) {
            setError(readableError(e, 'No pudimos reenviar el código.'));
            scrollToTop();
        }
        finally {
            setWorkingId(null);
        }
    };
    if (loading)
        return <MtLoading text="Cargando usuarios..."/>;
    return <MtScreen scroll scrollRef={scrollRef}>
    <MtHeader eyebrow="ADMIN" title="Usuarios" subtitle="Alta rápida de administradores y pacientes. Médicos y secretarías van por Personal para quedar bien vinculados."/>
    {message ? <AdminNotice type="success" title="Listo" message={message}/> : null}
    {error ? <AdminNotice type="danger" title="Revisá esta operación" message={error}/> : null}
    <MtCard style={{ marginBottom: 14 }}>
      <AdminTitle title="Buscar y filtrar" subtitle="Filtrá por email, DNI, nombre, rol o estado."/>
      <MtInput label="Buscar" value={query} onChangeText={setQuery} placeholder="email, dni, rol, nombre..." autoCapitalize="none"/>
      <AdminTabs value={filter} onChange={setFilter} options={[{ value: 'TODOS', label: `Todos ${usuarios.length}` }, { value: 'PATIENT', label: 'Pacientes', tone: 'success' }, { value: 'ADMIN', label: 'Admin', tone: 'danger' }, { value: 'PROFESSIONAL', label: 'Médicos' }, { value: 'SECRETARY', label: 'Secretaría', tone: 'warning' }, { value: 'SIN_VERIFICAR', label: 'Sin verificar', tone: 'warning' }, { value: 'INACTIVOS', label: 'Inactivos', tone: 'muted' }]}/>
      <MtButton title={formOpen ? 'Cerrar formulario' : 'Crear usuario'} onPress={formOpen ? () => setFormOpen(false) : startCreate}/>
    </MtCard>
    {formOpen ? <UserFormCard adminForm={adminForm} setAdminForm={setAdminForm} pacienteForm={pacienteForm} setPacienteForm={setPacienteForm} kind={kind} setKind={setKind} obras={obrasSociales} saving={saving} submit={submit} theme={theme}/> : null}
    {filtered.length ? filtered.map((user) => <UserCard key={user.id} user={user} working={workingId === user.id} edit={() => startEdit(user)} resend={() => resend(user)} setActive={(active) => setActive(user, active)} theme={theme}/>) : <MtEmptyState title="Sin usuarios" subtitle="No hay resultados para el filtro."/>}
    <RoleBottomNav role="admin" active="usuarios"/>
  </MtScreen>;
}

