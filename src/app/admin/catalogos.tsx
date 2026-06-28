import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { MtButton, MtCard, MtEmptyState, MtHeader, MtInput, MtLoading, MtPill, MtScreen } from '../../components/mediturnos';
import { MtSelect } from '../../components/MtSelect';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { adminService, AdminCatalogItem } from '../../api/adminService';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';
import { AdminActionRow, AdminKV, AdminMiniButton, AdminNotice, AdminTabs, AdminTitle } from '../../components/admin/AdminUi';
type Kind = 'ESPECIALIDADES' | 'OBRAS' | 'INSTITUCIONES';
type Form = {
    id?: number;
    nombre: string;
    codigo: string;
    tipo: string;
    direccion: string;
    telefono: string;
    whatsapp: string;
    activa: boolean;
};
type CatalogCollections = Record<Kind, AdminCatalogItem[]>;
const emptyForm: Form = { nombre: '', codigo: '', tipo: 'CLINICA', direccion: '', telefono: '', whatsapp: '', activa: true };
const tipoOptions = [
    { label: 'Clínica', value: 'CLINICA' }, { label: 'Hospital', value: 'HOSPITAL' },
    { label: 'Consultorio', value: 'CONSULTORIO' }, { label: 'Centro médico', value: 'CENTRO_MEDICO' }, { label: 'Otro', value: 'OTRO' },
];
function active(item: AdminCatalogItem) { return item.activa !== false && item.activo !== false; }
function formFromItem(item: AdminCatalogItem): Form {
    return { id: item.id, nombre: item.nombre, codigo: item.codigo ?? '', tipo: item.tipo ?? 'CLINICA', direccion: item.direccion ?? '', telefono: item.telefono ?? '', whatsapp: item.whatsapp ?? '', activa: active(item) };
}
function catalogTitle(kind: Kind) { return ({ ESPECIALIDADES: 'Crear especialidad', OBRAS: 'Crear obra social', INSTITUCIONES: 'Crear institución' } as const)[kind]; }
function validateCatalog(kind: Kind, form: Form) {
    if (!form.nombre.trim())
        return 'El nombre es obligatorio.';
    return kind === 'INSTITUCIONES' && !form.direccion.trim() ? 'La dirección de la institución es obligatoria.' : null;
}
async function persistCatalog(kind: Kind, form: Form) {
    if (kind === 'ESPECIALIDADES') {
        const payload = { nombre: form.nombre.trim(), activa: form.activa };
        return form.id ? adminService.actualizarEspecialidad(form.id, payload) : adminService.crearEspecialidad(payload);
    }
    if (kind === 'OBRAS') {
        const payload = { nombre: form.nombre.trim(), codigo: form.codigo.trim() || undefined, activa: form.activa };
        return form.id ? adminService.actualizarObraSocial(form.id, payload) : adminService.crearObraSocial(payload);
    }
    const payload = { nombre: form.nombre.trim(), tipo: form.tipo, direccion: form.direccion.trim(), telefono: form.telefono.trim() || undefined, whatsapp: form.whatsapp.trim() || undefined, activa: form.activa };
    return form.id ? adminService.actualizarInstitucion(form.id, payload) : adminService.crearInstitucion(payload);
}
function deactivateCatalog(kind: Kind, id: number) {
    const actions = { ESPECIALIDADES: adminService.desactivarEspecialidad, OBRAS: adminService.desactivarObraSocial, INSTITUCIONES: adminService.desactivarInstitucion };
    return actions[kind](id);
}
function CatalogForm({ kind, form, setForm, saving, save, theme }: Readonly<{
    kind: Kind;
    form: Form;
    setForm: React.Dispatch<React.SetStateAction<Form>>;
    saving: boolean;
    save: () => void;
    theme: ReturnType<typeof useMtTheme>;
}>) {
    return (<MtCard style={{ marginBottom: 14, borderColor: theme.colors.primary }}>
      <AdminTitle title={form.id ? 'Editar elemento' : 'Nuevo elemento'} subtitle="Los cambios se guardan y luego se recarga la lista."/>
      <View style={{ gap: 12 }}>
        <MtInput label="Nombre" value={form.nombre} onChangeText={(nombre) => setForm((current) => ({ ...current, nombre }))}/>
        {kind === 'OBRAS' ? <MtInput label="Código / sigla" value={form.codigo} onChangeText={(codigo) => setForm((current) => ({ ...current, codigo }))} placeholder="OSDE, IOMA, SWISS..."/> : null}
        {kind === 'INSTITUCIONES' ? <InstitutionFields form={form} setForm={setForm}/> : null}
        <AdminTabs value={form.activa ? 'SI' : 'NO'} onChange={(value) => setForm((current) => ({ ...current, activa: value === 'SI' }))} options={[{ value: 'SI', label: 'Activo', tone: 'success' }, { value: 'NO', label: 'Inactivo', tone: 'danger' }]}/>
        <MtButton title={saving ? 'Guardando...' : 'Guardar'} onPress={save} loading={saving} disabled={saving}/>
      </View>
    </MtCard>);
}
function InstitutionFields({ form, setForm }: Readonly<{
    form: Form;
    setForm: React.Dispatch<React.SetStateAction<Form>>;
}>) {
    return <>
    <MtSelect label="Tipo" value={form.tipo} placeholder="Tipo de institución" options={tipoOptions} onChange={(tipo) => setForm((current) => ({ ...current, tipo }))}/>
    <MtInput label="Dirección" value={form.direccion} onChangeText={(direccion) => setForm((current) => ({ ...current, direccion }))}/>
    <MtInput label="Teléfono" value={form.telefono} onChangeText={(telefono) => setForm((current) => ({ ...current, telefono }))} keyboardType="phone-pad"/>
    <MtInput label="WhatsApp" value={form.whatsapp} onChangeText={(whatsapp) => setForm((current) => ({ ...current, whatsapp }))} keyboardType="phone-pad"/>
  </>;
}
function CatalogItemCard({ item, kind, working, edit, deactivate, theme }: Readonly<{
    item: AdminCatalogItem;
    kind: Kind;
    working: boolean;
    edit: () => void;
    deactivate: () => void;
    theme: ReturnType<typeof useMtTheme>;
}>) {
    const enabled = active(item);
    return <MtCard style={{ marginBottom: 12, opacity: enabled ? 1 : 0.7 }}>
    <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 16 }}>{item.nombre}</Text>
    {kind === 'OBRAS' ? <AdminKV label="Código" value={item.codigo}/> : null}
    {kind === 'INSTITUCIONES' ? <><AdminKV label="Tipo" value={item.tipo}/><AdminKV label="Dirección" value={item.direccion}/><AdminKV label="Teléfono" value={item.telefono}/><AdminKV label="WhatsApp" value={item.whatsapp}/></> : null}
    <MtPill label={enabled ? 'ACTIVO' : 'INACTIVO'} tone={enabled ? 'success' : 'danger'} selected/>
    <AdminActionRow><AdminMiniButton label="Editar" onPress={edit}/><AdminMiniButton label="Desactivar" tone="danger" disabled={!enabled || working} onPress={deactivate}/></AdminActionRow>
  </MtCard>;
}
export default function AdminCatalogosScreen() {
    const [kind, setKind] = useState<Kind>('ESPECIALIDADES');
    const [collections, setCollections] = useState<CatalogCollections>({ ESPECIALIDADES: [], OBRAS: [], INSTITUCIONES: [] });
    const [query, setQuery] = useState('');
    const [form, setForm] = useState<Form>(emptyForm);
    const [formOpen, setFormOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [workingId, setWorkingId] = useState<number | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const theme = useMtTheme();
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [especialidades, obras, instituciones] = await Promise.all([adminService.especialidades(), adminService.obrasSociales(), adminService.instituciones()]);
            setCollections({ ESPECIALIDADES: especialidades, OBRAS: obras, INSTITUCIONES: instituciones });
        }
        catch (error_: unknown) {
            setError(readableError(error_, 'No pudimos cargar catálogos.'));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    const items = collections[kind];
    const filtered = useMemo(() => { const text = query.toLowerCase().trim(); return items.filter((item) => !text || JSON.stringify(item).toLowerCase().includes(text)); }, [items, query]);
    const closeForm = () => { setFormOpen(false); setForm(emptyForm); };
    const openCreate = () => { setError(null); setMessage(null); setForm(emptyForm); setFormOpen(true); };
    const edit = (item: AdminCatalogItem) => { setError(null); setMessage(null); setFormOpen(true); setForm(formFromItem(item)); };
    const changeKind = (value: Kind) => { setKind(value); closeForm(); };
    const save = async () => {
        const problem = validateCatalog(kind, form);
        if (problem) {
            setError(problem);
            return;
        }
        setSaving(true);
        setError(null);
        setMessage(null);
        try {
            await persistCatalog(kind, form);
            setMessage(form.id ? 'Catálogo actualizado correctamente.' : 'Catálogo creado correctamente.');
            closeForm();
            await load();
        }
        catch (error_: unknown) {
            setError(readableError(error_, 'No pudimos guardar el catálogo.'));
        }
        finally {
            setSaving(false);
        }
    };
    const deactivate = async (item: AdminCatalogItem) => {
        setWorkingId(item.id);
        setError(null);
        setMessage(null);
        try {
            await deactivateCatalog(kind, item.id);
            setMessage('Elemento desactivado correctamente.');
            await load();
        }
        catch (error_: unknown) {
            setError(readableError(error_, 'No pudimos desactivar el elemento.'));
        }
        finally {
            setWorkingId(null);
        }
    };
    if (loading)
        return <MtLoading text="Cargando catálogos..."/>;
    return <MtScreen scroll>
    <MtHeader eyebrow="ADMIN" title="Catálogos" subtitle="ABM de especialidades, obras sociales e instituciones."/>
    {message ? <AdminNotice type="success" title="Listo" message={message}/> : null}
    {error ? <AdminNotice type="danger" title="Revisá esta operación" message={error}/> : null}
    <MtCard style={{ marginBottom: 14 }}>
      <AdminTabs value={kind} onChange={changeKind} options={[{ value: 'ESPECIALIDADES', label: `Especialidades ${collections.ESPECIALIDADES.length}` }, { value: 'OBRAS', label: `Obras sociales ${collections.OBRAS.length}`, tone: 'success' }, { value: 'INSTITUCIONES', label: `Instituciones ${collections.INSTITUCIONES.length}`, tone: 'warning' }]}/>
      <MtInput label="Buscar" value={query} onChangeText={setQuery} placeholder="nombre, código, dirección..."/>
      <MtButton title={formOpen ? 'Cerrar formulario' : catalogTitle(kind)} onPress={formOpen ? closeForm : openCreate} style={{ marginTop: 12 }}/>
    </MtCard>
    {formOpen ? <CatalogForm kind={kind} form={form} setForm={setForm} saving={saving} save={save} theme={theme}/> : null}
    <MtCard style={{ marginBottom: 14 }}><AdminTitle title="Resumen" subtitle="Resumen de registros cargados."/><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <MtPill label={`Especialidades ${collections.ESPECIALIDADES.length}`} selected={kind === 'ESPECIALIDADES'} onPress={() => changeKind('ESPECIALIDADES')}/>
      <MtPill label={`Obras sociales ${collections.OBRAS.length}`} selected={kind === 'OBRAS'} tone="success" onPress={() => changeKind('OBRAS')}/>
      <MtPill label={`Instituciones ${collections.INSTITUCIONES.length}`} selected={kind === 'INSTITUCIONES'} tone="warning" onPress={() => changeKind('INSTITUCIONES')}/>
    </View></MtCard>
    {filtered.length ? filtered.map((item) => <CatalogItemCard key={item.id} item={item} kind={kind} working={workingId === item.id} edit={() => edit(item)} deactivate={() => deactivate(item)} theme={theme}/>) : <MtEmptyState title="Sin datos" subtitle="No hay elementos para el filtro seleccionado."/>}
    <RoleBottomNav role="admin" active="home"/>
  </MtScreen>;
}

