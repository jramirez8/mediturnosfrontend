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
function personnelFormButtonTitle(open: boolean, tab: Tab) {
    if (open)
        return 'Cerrar formulario';
    if (tab === 'MEDICOS')
        return 'Crear médico';
    return 'Crear secretaría';
}
type ProfessionalForm = typeof profesionalEmpty;
type SecretaryForm = typeof secretariaEmpty;
type PatientForm = typeof pacienteEmpty;
function ProfessionalFormCard({ form, setForm, especialidades, instituciones, saving, save, theme }: {
    form: ProfessionalForm;
    setForm: React.Dispatch<React.SetStateAction<ProfessionalForm>>;
    especialidades: AdminCatalogItem[];
    instituciones: AdminCatalogItem[];
    saving: boolean;
    save: () => void;
    theme: ReturnType<typeof useMtTheme>;
}) {
    return <MtCard style={{ marginBottom: 14, borderColor: theme.colors.primary }}><AdminTitle title={form.id ? 'Editar médico' : 'Crear médico'} subtitle="Crea el usuario médico y sus datos profesionales."/><View style={{ gap: 12 }}>
    <MtInput label="Email" value={form.email} onChangeText={(email) => setForm((current) => ({ ...current, email }))} autoCapitalize="none" keyboardType="email-address"/>
    <MtInput label={form.id ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'} value={form.password} onChangeText={(password) => setForm((current) => ({ ...current, password }))} secureTextEntry placeholder={form.id ? 'No cambiar' : quickPassword('Medico')}/>
    <MtInput label="Nombre" value={form.nombre} onChangeText={(nombre) => setForm((current) => ({ ...current, nombre }))}/><MtInput label="Apellido" value={form.apellido} onChangeText={(apellido) => setForm((current) => ({ ...current, apellido }))}/>
    <MtInput label="DNI" value={form.dni} onChangeText={(dni) => setForm((current) => ({ ...current, dni }))} keyboardType="numeric"/><MtInput label="Matrícula" value={form.matricula} onChangeText={(matricula) => setForm((current) => ({ ...current, matricula }))}/>
    <MtInput label="Teléfono" value={form.telefono} onChangeText={(telefono) => setForm((current) => ({ ...current, telefono }))} keyboardType="phone-pad"/>
    <Text style={{ color: theme.colors.ink, fontWeight: '900' }}>Especialidades: {selectedNames(form.especialidadIds, especialidades)}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{especialidades.map((item) => <MtPill key={item.id} label={item.nombre} selected={form.especialidadIds.includes(item.id)} onPress={() => setForm((current) => ({ ...current, especialidadIds: toggleId(current.especialidadIds, item.id) }))}/>)}</View>
    <Text style={{ color: theme.colors.ink, fontWeight: '900' }}>Instituciones: {selectedNames(form.institucionIds, instituciones)}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{instituciones.map((item) => <MtPill key={item.id} label={item.nombre} selected={form.institucionIds.includes(item.id)} tone="warning" onPress={() => setForm((current) => ({ ...current, institucionIds: toggleId(current.institucionIds, item.id) }))}/>)}</View>
    <AdminTabs value={form.activo ? 'SI' : 'NO'} onChange={(value) => setForm((current) => ({ ...current, activo: value === 'SI' }))} options={[{ value: 'SI', label: 'Activo', tone: 'success' }, { value: 'NO', label: 'Inactivo', tone: 'danger' }]}/>
    <MtButton title={saving ? 'Guardando...' : 'Guardar médico'} onPress={save} loading={saving} disabled={saving}/>
  </View></MtCard>;
}
function SecretaryFormCard({ form, setForm, instituciones, saving, save, theme }: {
    form: SecretaryForm;
    setForm: React.Dispatch<React.SetStateAction<SecretaryForm>>;
    instituciones: AdminCatalogItem[];
    saving: boolean;
    save: () => void;
    theme: ReturnType<typeof useMtTheme>;
}) {
    return <MtCard style={{ marginBottom: 14, borderColor: theme.colors.warning }}><AdminTitle title={form.id ? 'Editar secretaría' : 'Crear secretaría'} subtitle="Crea usuario SECRETARY y lo vincula con una institución."/><View style={{ gap: 12 }}>
    <MtInput label="Email" value={form.email} onChangeText={(email) => setForm((current) => ({ ...current, email }))} autoCapitalize="none" keyboardType="email-address"/>
    <MtInput label={form.id ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'} value={form.password} onChangeText={(password) => setForm((current) => ({ ...current, password }))} secureTextEntry placeholder={form.id ? 'No cambiar' : quickPassword('Secretaria')}/>
    <MtInput label="Nombre" value={form.nombre} onChangeText={(nombre) => setForm((current) => ({ ...current, nombre }))}/><MtInput label="Apellido" value={form.apellido} onChangeText={(apellido) => setForm((current) => ({ ...current, apellido }))}/>
    <MtInput label="DNI" value={form.dni} onChangeText={(dni) => setForm((current) => ({ ...current, dni }))} keyboardType="numeric"/><MtInput label="Teléfono" value={form.telefono} onChangeText={(telefono) => setForm((current) => ({ ...current, telefono }))} keyboardType="phone-pad"/>
    <MtSelect label="Institución" value={form.institucionId} placeholder="Seleccionar institución" options={instituciones.map((item) => ({ label: item.nombre, value: String(item.id) }))} onChange={(institucionId) => setForm((current) => ({ ...current, institucionId }))}/>
    <AdminTabs value={form.activa ? 'SI' : 'NO'} onChange={(value) => setForm((current) => ({ ...current, activa: value === 'SI' }))} options={[{ value: 'SI', label: 'Activa', tone: 'success' }, { value: 'NO', label: 'Inactiva', tone: 'danger' }]}/>
    <MtButton title={saving ? 'Guardando...' : 'Guardar secretaría'} onPress={save} loading={saving} disabled={saving}/>
  </View></MtCard>;
}
function PatientFormCard({ form, setForm, obras, instituciones, profesionales, saving, save, theme }: {
    form: PatientForm;
    setForm: React.Dispatch<React.SetStateAction<PatientForm>>;
    obras: AdminCatalogItem[];
    instituciones: AdminCatalogItem[];
    profesionales: AdminProfesional[];
    saving: boolean;
    save: () => void;
    theme: ReturnType<typeof useMtTheme>;
}) {
    return <MtCard style={{ marginBottom: 14, borderColor: theme.colors.success }}><AdminTitle title={form.id ? 'Editar paciente' : 'Crear paciente'} subtitle="Alta administrativa de paciente con usuario PATIENT asociado."/><View style={{ gap: 12 }}>
    <MtInput label="Email" value={form.email} onChangeText={(email) => setForm((current) => ({ ...current, email }))} autoCapitalize="none" keyboardType="email-address"/>
    <MtInput label={form.id ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'} value={form.password} onChangeText={(password) => setForm((current) => ({ ...current, password }))} secureTextEntry placeholder={form.id ? 'No cambiar' : quickPassword('Paciente')}/>
    <MtInput label="Nombre" value={form.nombre} onChangeText={(nombre) => setForm((current) => ({ ...current, nombre }))}/><MtInput label="Apellido" value={form.apellido} onChangeText={(apellido) => setForm((current) => ({ ...current, apellido }))}/>
    <MtInput label="DNI" value={form.dni} onChangeText={(dni) => setForm((current) => ({ ...current, dni }))} keyboardType="numeric"/><MtInput label="Fecha nacimiento (AAAA-MM-DD)" value={form.fechaNacimiento} onChangeText={(fechaNacimiento) => setForm((current) => ({ ...current, fechaNacimiento }))} placeholder="1990-05-23"/>
    <MtInput label="Teléfono" value={form.telefono} onChangeText={(telefono) => setForm((current) => ({ ...current, telefono }))} keyboardType="phone-pad"/>
    <MtSelect label="Grupo sanguíneo" value={form.tipoSangre} placeholder="Seleccionar" options={sangreOptions} onChange={(tipoSangre) => setForm((current) => ({ ...current, tipoSangre }))}/>
    <MtSelect label="Obra social" value={form.obraSocialId} placeholder="Seleccionar obra social" options={obras.map((item) => ({ label: item.nombre, value: String(item.id) }))} onChange={(obraSocialId) => setForm((current) => ({ ...current, obraSocialId }))}/>
    <MtInput label="N° carnet" value={form.numeroCarnet} onChangeText={(numeroCarnet) => setForm((current) => ({ ...current, numeroCarnet }))}/>
    <Text style={{ color: theme.colors.muted, fontWeight: '700', lineHeight: 20 }}>N° historia clínica: se genera automáticamente al guardar el paciente.</Text>
    <MtSelect label="Institución cabecera" value={form.institucionCabeceraId} placeholder="Opcional" options={[{ label: 'Sin institución', value: '' }, ...instituciones.map((item) => ({ label: item.nombre, value: String(item.id) }))]} onChange={(institucionCabeceraId) => setForm((current) => ({ ...current, institucionCabeceraId }))}/>
    <MtSelect label="Médico cabecera" value={form.medicoCabeceraProfesionalId} placeholder="Opcional" options={[{ label: 'Sin médico', value: '' }, ...profesionales.map((item) => ({ label: `${item.apellido}, ${item.nombre}`, value: String(item.id) }))]} onChange={(medicoCabeceraProfesionalId) => setForm((current) => ({ ...current, medicoCabeceraProfesionalId }))}/>
    <AdminTabs value={form.activo ? 'SI' : 'NO'} onChange={(value) => setForm((current) => ({ ...current, activo: value === 'SI' }))} options={[{ value: 'SI', label: 'Activo', tone: 'success' }, { value: 'NO', label: 'Inactivo', tone: 'danger' }]}/>
    <MtButton title={saving ? 'Guardando...' : 'Guardar paciente'} onPress={save} loading={saving} disabled={saving}/>
  </View></MtCard>;
}
function ProfessionalCard({ item, working, edit, changeActive, theme }: {
    item: AdminProfesional;
    working: boolean;
    edit: () => void;
    changeActive: () => void;
    theme: ReturnType<typeof useMtTheme>;
}) {
    const inactive = item.activo === false;
    return <MtCard style={{ marginBottom: 12, opacity: inactive ? 0.7 : 1 }}><Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 16 }}>{item.apellido}, {item.nombre}</Text>
    <AdminKV label="Email" value={item.email}/><AdminKV label="DNI" value={item.dni}/><AdminKV label="Matrícula" value={item.matricula}/><AdminKV label="Teléfono" value={item.telefono}/><AdminKV label="Especialidades" value={item.especialidades?.join(', ')}/><AdminKV label="Instituciones" value={item.instituciones?.join(', ')}/>
    <MtPill label={inactive ? 'INACTIVO' : 'ACTIVO'} tone={inactive ? 'danger' : 'success'} selected/><AdminActionRow><AdminMiniButton label="Editar" onPress={edit}/><AdminMiniButton label={inactive ? 'Activar' : 'Desactivar'} tone={inactive ? 'success' : 'danger'} disabled={working} onPress={changeActive}/></AdminActionRow>
  </MtCard>;
}
function SecretaryCard({ item, working, edit, changeActive, theme }: {
    item: AdminSecretaria;
    working: boolean;
    edit: () => void;
    changeActive: () => void;
    theme: ReturnType<typeof useMtTheme>;
}) {
    const inactive = item.activa === false;
    return <MtCard style={{ marginBottom: 12, opacity: inactive ? 0.7 : 1 }}><Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 16 }}>{item.apellido}, {item.nombre}</Text>
    <AdminKV label="Email" value={item.email}/><AdminKV label="DNI" value={item.dni}/><AdminKV label="Teléfono" value={item.telefono}/><AdminKV label="Institución" value={item.institucion}/>
    <MtPill label={inactive ? 'INACTIVA' : 'ACTIVA'} tone={inactive ? 'danger' : 'success'} selected/><AdminActionRow><AdminMiniButton label="Editar" onPress={edit}/><AdminMiniButton label={inactive ? 'Activar' : 'Desactivar'} tone={inactive ? 'success' : 'danger'} disabled={working} onPress={changeActive}/></AdminActionRow>
  </MtCard>;
}
function PatientCard({ item, working, edit, changeActive, theme }: {
    item: AdminPaciente;
    working: boolean;
    edit: () => void;
    changeActive: () => void;
    theme: ReturnType<typeof useMtTheme>;
}) {
    const inactive = item.activo === false;
    return <MtCard style={{ marginBottom: 12, opacity: inactive ? 0.7 : 1 }}><Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 16 }}>{item.apellido}, {item.nombre}</Text>
    <AdminKV label="Email" value={item.email}/><AdminKV label="DNI" value={item.dni}/><AdminKV label="Teléfono" value={item.telefono}/><AdminKV label="Obra social" value={item.obraSocial}/><AdminKV label="Historia clínica" value={item.numeroHistoriaClinica}/>
    <MtPill label={inactive ? 'INACTIVO' : 'ACTIVO'} tone={inactive ? 'danger' : 'success'} selected/><AdminActionRow><AdminMiniButton label="Editar" onPress={edit}/><AdminMiniButton label={inactive ? 'Activar' : 'Desactivar'} tone={inactive ? 'success' : 'danger'} disabled={working} onPress={changeActive}/></AdminActionRow>
  </MtCard>;
}
function PersonnelFormArea(props: {
    open: boolean;
    tab: Tab;
    profForm: ProfessionalForm;
    setProfForm: React.Dispatch<React.SetStateAction<ProfessionalForm>>;
    secForm: SecretaryForm;
    setSecForm: React.Dispatch<React.SetStateAction<SecretaryForm>>;
    pacForm: PatientForm;
    setPacForm: React.Dispatch<React.SetStateAction<PatientForm>>;
    especialidades: AdminCatalogItem[];
    instituciones: AdminCatalogItem[];
    obras: AdminCatalogItem[];
    profesionales: AdminProfesional[];
    saving: boolean;
    saveProfessional: () => void;
    saveSecretary: () => void;
    savePatient: () => void;
    theme: ReturnType<typeof useMtTheme>;
}) {
    if (!props.open)
        return null;
    if (props.tab === 'MEDICOS')
        return <ProfessionalFormCard form={props.profForm} setForm={props.setProfForm} especialidades={props.especialidades} instituciones={props.instituciones} saving={props.saving} save={props.saveProfessional} theme={props.theme}/>;
    if (props.tab === 'SECRETARIAS')
        return <SecretaryFormCard form={props.secForm} setForm={props.setSecForm} instituciones={props.instituciones} saving={props.saving} save={props.saveSecretary} theme={props.theme}/>;
    return <PatientFormCard form={props.pacForm} setForm={props.setPacForm} obras={props.obras} instituciones={props.instituciones} profesionales={props.profesionales} saving={props.saving} save={props.savePatient} theme={props.theme}/>;
}
function PersonnelListArea(props: {
    tab: Tab;
    professionals: AdminProfesional[];
    secretaries: AdminSecretaria[];
    patients: AdminPaciente[];
    working: string | null;
    editProfessional: (item: AdminProfesional) => void;
    editSecretary: (item: AdminSecretaria) => void;
    editPatient: (item: AdminPaciente) => void;
    changeActive: (kind: Tab, id: number, active: boolean) => void;
    theme: ReturnType<typeof useMtTheme>;
}) {
    if (props.tab === 'MEDICOS')
        return props.professionals.length ? <>{props.professionals.map((item) => <ProfessionalCard key={item.id} item={item} working={props.working === `MEDICOS-${item.id}`} edit={() => props.editProfessional(item)} changeActive={() => props.changeActive('MEDICOS', item.id, item.activo === false)} theme={props.theme}/>)}</> : <MtEmptyState title="Sin médicos" subtitle="No hay profesionales para mostrar."/>;
    if (props.tab === 'SECRETARIAS')
        return props.secretaries.length ? <>{props.secretaries.map((item) => <SecretaryCard key={item.id} item={item} working={props.working === `SECRETARIAS-${item.id}`} edit={() => props.editSecretary(item)} changeActive={() => props.changeActive('SECRETARIAS', item.id, item.activa === false)} theme={props.theme}/>)}</> : <MtEmptyState title="Sin secretarías" subtitle="No hay secretarías para mostrar."/>;
    return props.patients.length ? <>{props.patients.map((item) => <PatientCard key={item.id} item={item} working={props.working === `PACIENTES-${item.id}`} edit={() => props.editPatient(item)} changeActive={() => props.changeActive('PACIENTES', item.id, item.activo === false)} theme={props.theme}/>)}</> : <MtEmptyState title="Sin pacientes" subtitle="No hay pacientes para mostrar."/>;
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
        setLoading(true);
        setError(null);
        try {
            const [p, s, pa, e, i, o] = await Promise.all([
                adminService.profesionales(), adminService.secretarias(), adminService.pacientes(),
                adminService.especialidades(), adminService.instituciones(), adminService.obrasSociales(),
            ]);
            setProfesionales(p);
            setSecretarias(s);
            setPacientes(pa);
            setEspecialidades(e);
            setInstituciones(i);
            setObras(o);
        }
        catch (e: unknown) {
            setError(readableError(e, 'No pudimos cargar personal y pacientes.'));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    const filteredProfessionals = useMemo(() => profesionales.filter((p) => includesText(p, query.toLowerCase().trim())), [profesionales, query]);
    const filteredSecretaries = useMemo(() => secretarias.filter((s) => includesText(s, query.toLowerCase().trim())), [secretarias, query]);
    const filteredPatients = useMemo(() => pacientes.filter((p) => includesText(p, query.toLowerCase().trim())), [pacientes, query]);
    const closeForm = () => {
        setFormOpen(false);
        setProfForm(profesionalEmpty);
        setSecForm(secretariaEmpty);
        setPacForm(pacienteEmpty);
    };
    const openCreate = () => {
        setMessage(null);
        setError(null);
        setFormOpen(true);

        if (tab === 'MEDICOS') {
            setProfForm(profesionalEmpty);
        }

        if (tab === 'SECRETARIAS') {
            setSecForm(secretariaEmpty);
        }

        if (tab === 'PACIENTES') {
            setPacForm(pacienteEmpty);
        }
    };
    const editProfesional = (p: AdminProfesional) => {
        setTab('MEDICOS');
        setFormOpen(true);
        setMessage(null);
        setError(null);
        setProfForm({
            id: p.id, email: p.email || '', password: '', nombre: p.nombre, apellido: p.apellido, dni: p.dni || '', matricula: p.matricula || '', telefono: p.telefono || '', activo: p.activo !== false, emailVerificado: true,
            especialidadIds: especialidades.filter((e) => p.especialidades?.includes(e.nombre)).map((e) => e.id),
            institucionIds: instituciones.filter((i) => p.instituciones?.includes(i.nombre)).map((i) => i.id),
        });
    };
    const editSecretaria = (s: AdminSecretaria) => {
        setTab('SECRETARIAS');
        setFormOpen(true);
        setMessage(null);
        setError(null);
        setSecForm({ id: s.id, email: s.email || '', password: '', nombre: s.nombre, apellido: s.apellido, dni: s.dni || '', telefono: s.telefono || '', institucionId: String(instituciones.find((i) => i.nombre === s.institucion)?.id ?? ''), activa: s.activa !== false, emailVerificado: true });
    };
    const editPaciente = (p: AdminPaciente) => {
        setTab('PACIENTES');
        setFormOpen(true);
        setMessage(null);
        setError(null);
        setPacForm({
            id: p.id, email: p.email || '', password: '', nombre: p.nombre, apellido: p.apellido, dni: p.dni || '', fechaNacimiento: p.fechaNacimiento || '', telefono: p.telefono || '', tipoSangre: p.tipoSangre || 'O_POSITIVO',
            obraSocialId: String(obras.find((o) => o.nombre === p.obraSocial)?.id ?? ''), numeroCarnet: p.numeroCarnet || '',
            institucionCabeceraId: String(instituciones.find((i) => i.nombre === p.institucionCabecera)?.id ?? ''),
            medicoCabeceraProfesionalId: String(profesionales.find((m) => `${m.nombre} ${m.apellido}`.trim() === p.medicoCabecera || `${m.apellido}, ${m.nombre}`.trim() === p.medicoCabecera)?.id ?? ''),
            activo: p.activo !== false, emailVerificado: true,
        });
    };
    const validateProfesional = () => {
        if (!profForm.email.includes('@'))
            return 'Ingresá email válido del médico.';
        if (!profForm.id && profForm.password.trim().length < 8)
            return 'La contraseña inicial del médico debe tener al menos 8 caracteres.';
        if (!profForm.nombre.trim() || !profForm.apellido.trim())
            return 'Nombre y apellido son obligatorios.';
        if (!profForm.matricula.trim())
            return 'La matrícula es obligatoria.';
        if (!profForm.especialidadIds.length)
            return 'Seleccioná al menos una especialidad.';
        if (!profForm.institucionIds.length)
            return 'Seleccioná al menos una institución.';
        return null;
    };
    const validateSecretaria = () => {
        if (!secForm.email.includes('@'))
            return 'Ingresá email válido de secretaría.';
        if (!secForm.id && secForm.password.trim().length < 8)
            return 'La contraseña inicial de secretaría debe tener al menos 8 caracteres.';
        if (!secForm.nombre.trim() || !secForm.apellido.trim() || !secForm.dni.trim())
            return 'Nombre, apellido y DNI son obligatorios.';
        if (!secForm.institucionId)
            return 'Seleccioná institución de secretaría.';
        return null;
    };
    const validatePaciente = () => {
        if (!pacForm.email.includes('@'))
            return 'Ingresá email válido del paciente.';
        if (!pacForm.id && pacForm.password.trim().length < 8)
            return 'La contraseña inicial del paciente debe tener al menos 8 caracteres.';
        if (!pacForm.nombre.trim() || !pacForm.apellido.trim() || !pacForm.dni.trim())
            return 'Nombre, apellido y DNI son obligatorios.';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(pacForm.fechaNacimiento))
            return 'La fecha de nacimiento debe tener formato AAAA-MM-DD.';
        if (!pacForm.telefono.trim())
            return 'El teléfono es obligatorio.';
        if (!pacForm.obraSocialId)
            return 'Seleccioná obra social.';
        return null;
    };
    const saveProfesional = async () => {
        const problem = validateProfesional();
        if (problem) {
            setError(problem);
            scrollTop();
            return;
        }
        setSaving(true);
        setError(null);
        setMessage(null);
        const payload: any = {
            email: profForm.email.trim(), nombre: profForm.nombre.trim(), apellido: profForm.apellido.trim(), dni: profForm.dni.trim() || undefined, matricula: profForm.matricula.trim(), telefono: profForm.telefono.trim() || undefined,
            activo: profForm.activo, emailVerificado: profForm.emailVerificado, especialidadIds: profForm.especialidadIds, institucionIds: profForm.institucionIds,
        };
        if (profForm.password.trim())
            payload.password = profForm.password.trim();
        try {
            if (profForm.id) {
                await adminService.actualizarProfesional(profForm.id, payload);
                setMessage('Médico actualizado correctamente.');
                scrollTop();
            }
            else {
                await adminService.crearProfesional({ ...payload, password: profForm.password.trim() });
                setMessage('Médico creado correctamente.');
                scrollTop();
            }
            closeForm();
            await load();
        }
        catch (e: unknown) {
            setError(readableError(e, 'No pudimos guardar el médico.'));
            scrollTop();
        }
        finally {
            setSaving(false);
        }
    };
    const saveSecretaria = async () => {
        const problem = validateSecretaria();
        if (problem) {
            setError(problem);
            scrollTop();
            return;
        }
        setSaving(true);
        setError(null);
        setMessage(null);
        const payload: any = { email: secForm.email.trim(), nombre: secForm.nombre.trim(), apellido: secForm.apellido.trim(), dni: secForm.dni.trim(), telefono: secForm.telefono.trim() || undefined, institucionId: Number(secForm.institucionId), activa: secForm.activa, emailVerificado: secForm.emailVerificado };
        if (secForm.password.trim())
            payload.password = secForm.password.trim();
        try {
            if (secForm.id) {
                await adminService.actualizarSecretaria(secForm.id, payload);
                setMessage('Secretaría actualizada correctamente.');
                scrollTop();
            }
            else {
                await adminService.crearSecretaria({ ...payload, password: secForm.password.trim() });
                setMessage('Secretaría creada correctamente.');
                scrollTop();
            }
            closeForm();
            await load();
        }
        catch (e: unknown) {
            setError(readableError(e, 'No pudimos guardar secretaría.'));
        }
        finally {
            setSaving(false);
        }
    };
    const savePaciente = async () => {
        const problem = validatePaciente();
        if (problem) {
            setError(problem);
            scrollTop();
            return;
        }
        setSaving(true);
        setError(null);
        setMessage(null);
        const payload: any = {
            email: pacForm.email.trim(), nombre: pacForm.nombre.trim(), apellido: pacForm.apellido.trim(), dni: pacForm.dni.trim(), fechaNacimiento: pacForm.fechaNacimiento, telefono: pacForm.telefono.trim(), tipoSangre: pacForm.tipoSangre,
            obraSocialId: Number(pacForm.obraSocialId), numeroCarnet: pacForm.numeroCarnet.trim() || undefined,
            institucionCabeceraId: pacForm.institucionCabeceraId ? Number(pacForm.institucionCabeceraId) : undefined,
            medicoCabeceraProfesionalId: pacForm.medicoCabeceraProfesionalId ? Number(pacForm.medicoCabeceraProfesionalId) : undefined,
            activo: pacForm.activo, emailVerificado: pacForm.emailVerificado,
        };
        if (pacForm.password.trim())
            payload.password = pacForm.password.trim();
        try {
            if (pacForm.id) {
                await adminService.actualizarPaciente(pacForm.id, payload);
                setMessage('Paciente actualizado correctamente.');
                scrollTop();
            }
            else {
                await adminService.crearPaciente({ ...payload, password: pacForm.password.trim() });
                setMessage('Paciente creado correctamente.');
                scrollTop();
            }
            closeForm();
            await load();
        }
        catch (e: unknown) {
            setError(readableError(e, 'No pudimos guardar el paciente.'));
            scrollTop();
        }
        finally {
            setSaving(false);
        }
    };
    const setEntityActive = async (kind: Tab, id: number, active: boolean) => {
        setWorking(`${kind}-${id}`);
        setError(null);
        setMessage(null);
        try {
            if (kind === 'MEDICOS')
                active ? await adminService.activarProfesional(id) : await adminService.desactivarProfesional(id);
            if (kind === 'SECRETARIAS')
                active ? await adminService.activarSecretaria(id) : await adminService.desactivarSecretaria(id);
            if (kind === 'PACIENTES')
                active ? await adminService.activarPaciente(id) : await adminService.desactivarPaciente(id);
            setMessage(active ? 'Registro activado.' : 'Registro desactivado.');
            await load();
        }
        catch (e: unknown) {
            setError(readableError(e, 'No pudimos cambiar el estado.'));
        }
        finally {
            setWorking(null);
        }
    };
    if (loading)
        return <MtLoading text="Cargando gestión de personas..."/>;
    const changeTab = (value: Tab) => { setTab(value); closeForm(); };
    return <MtScreen scroll scrollRef={scrollRef}>
    <MtHeader eyebrow="ADMIN" title="Personal" subtitle="Médicos y secretarías. Los pacientes se crean desde Admin > Usuarios."/>
    {message ? <AdminNotice type="success" title="Listo" message={message}/> : null}
    {error ? <AdminNotice type="danger" title="Revisá esta operación" message={error}/> : null}
    <MtCard style={{ marginBottom: 14 }}>
      <AdminTabs value={tab} onChange={changeTab} options={[{ value: 'MEDICOS', label: `Médicos ${profesionales.length}` }, { value: 'SECRETARIAS', label: `Secretaría ${secretarias.length}`, tone: 'warning' }]}/>
      <MtInput label="Buscar" value={query} onChangeText={setQuery} placeholder="nombre, dni, email, matrícula..." autoCapitalize="none"/>
      <MtButton title={personnelFormButtonTitle(formOpen, tab)} onPress={formOpen ? closeForm : openCreate} style={{ marginTop: 12 }}/>
    </MtCard>
    <PersonnelFormArea open={formOpen} tab={tab} profForm={profForm} setProfForm={setProfForm} secForm={secForm} setSecForm={setSecForm} pacForm={pacForm} setPacForm={setPacForm} especialidades={especialidades} instituciones={instituciones} obras={obras} profesionales={profesionales} saving={saving} saveProfessional={saveProfesional} saveSecretary={saveSecretaria} savePatient={savePaciente} theme={theme}/>
    <PersonnelListArea tab={tab} professionals={filteredProfessionals} secretaries={filteredSecretaries} patients={filteredPatients} working={working} editProfessional={editProfesional} editSecretary={editSecretaria} editPatient={editPaciente} changeActive={setEntityActive} theme={theme}/>
    <RoleBottomNav role="admin" active="profesionales"/>
  </MtScreen>;
}

