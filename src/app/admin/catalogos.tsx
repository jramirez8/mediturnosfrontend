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

const emptyForm: Form = { nombre: '', codigo: '', tipo: 'CLINICA', direccion: '', telefono: '', whatsapp: '', activa: true };
const tipoOptions = [
  { label: 'Clínica', value: 'CLINICA' },
  { label: 'Hospital', value: 'HOSPITAL' },
  { label: 'Consultorio', value: 'CONSULTORIO' },
  { label: 'Centro médico', value: 'CENTRO_MEDICO' },
  { label: 'Otro', value: 'OTRO' },
];

function active(item: AdminCatalogItem) {
  return item.activa !== false && item.activo !== false;
}

export default function AdminCatalogosScreen() {
  const [kind, setKind] = useState<Kind>('ESPECIALIDADES');
  const [especialidades, setEspecialidades] = useState<AdminCatalogItem[]>([]);
  const [obras, setObras] = useState<AdminCatalogItem[]>([]);
  const [instituciones, setInstituciones] = useState<AdminCatalogItem[]>([]);
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
    setLoading(true); setError(null);
    try {
      const [e, o, i] = await Promise.all([adminService.especialidades(), adminService.obrasSociales(), adminService.instituciones()]);
      setEspecialidades(e); setObras(o); setInstituciones(i);
    } catch (e: any) { setError(readableError(e, 'No pudimos cargar catálogos.')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const items = kind === 'ESPECIALIDADES' ? especialidades : kind === 'OBRAS' ? obras : instituciones;
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items.filter((item) => !q || JSON.stringify(item).toLowerCase().includes(q));
  }, [items, query]);

  const closeForm = () => { setFormOpen(false); setForm(emptyForm); };
  const openCreate = () => { setError(null); setMessage(null); setForm(emptyForm); setFormOpen(true); };
  const edit = (item: AdminCatalogItem) => {
    setError(null); setMessage(null); setFormOpen(true);
    setForm({ id: item.id, nombre: item.nombre, codigo: item.codigo ?? '', tipo: item.tipo ?? 'CLINICA', direccion: item.direccion ?? '', telefono: item.telefono ?? '', whatsapp: item.whatsapp ?? '', activa: active(item) });
  };

  const validate = () => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio.';
    if (kind === 'INSTITUCIONES' && !form.direccion.trim()) return 'La dirección de la institución es obligatoria.';
    return null;
  };

  const save = async () => {
    const problem = validate(); if (problem) { setError(problem); return; }
    setSaving(true); setError(null); setMessage(null);
    try {
      if (kind === 'ESPECIALIDADES') {
        const payload = { nombre: form.nombre.trim(), activa: form.activa };
        form.id ? await adminService.actualizarEspecialidad(form.id, payload) : await adminService.crearEspecialidad(payload);
      }
      if (kind === 'OBRAS') {
        const payload = { nombre: form.nombre.trim(), codigo: form.codigo.trim() || undefined, activa: form.activa };
        form.id ? await adminService.actualizarObraSocial(form.id, payload) : await adminService.crearObraSocial(payload);
      }
      if (kind === 'INSTITUCIONES') {
        const payload = { nombre: form.nombre.trim(), tipo: form.tipo, direccion: form.direccion.trim(), telefono: form.telefono.trim() || undefined, whatsapp: form.whatsapp.trim() || undefined, activa: form.activa };
        form.id ? await adminService.actualizarInstitucion(form.id, payload) : await adminService.crearInstitucion(payload);
      }
      setMessage(form.id ? 'Catálogo actualizado correctamente.' : 'Catálogo creado correctamente.');
      closeForm(); await load();
    } catch (e: any) { setError(readableError(e, 'No pudimos guardar el catálogo.')); }
    finally { setSaving(false); }
  };

  const deactivate = async (item: AdminCatalogItem) => {
    setWorkingId(item.id); setError(null); setMessage(null);
    try {
      if (kind === 'ESPECIALIDADES') await adminService.desactivarEspecialidad(item.id);
      if (kind === 'OBRAS') await adminService.desactivarObraSocial(item.id);
      if (kind === 'INSTITUCIONES') await adminService.desactivarInstitucion(item.id);
      setMessage('Elemento desactivado correctamente.');
      await load();
    } catch (e: any) { setError(readableError(e, 'No pudimos desactivar el elemento.')); }
    finally { setWorkingId(null); }
  };

  if (loading) return <MtLoading text="Cargando catálogos..." />;

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="ADMIN" title="Catálogos" subtitle="ABM de especialidades, obras sociales e instituciones." />
      {message ? <AdminNotice type="success" title="Listo" message={message} /> : null}
      {error ? <AdminNotice type="danger" title="Revisá esta operación" message={error} /> : null}

      <MtCard style={{ marginBottom: 14 }}>
        <AdminTabs value={kind} onChange={(value) => { setKind(value); closeForm(); }} options={[{ value: 'ESPECIALIDADES', label: `Especialidades ${especialidades.length}` }, { value: 'OBRAS', label: `Obras sociales ${obras.length}`, tone: 'success' }, { value: 'INSTITUCIONES', label: `Instituciones ${instituciones.length}`, tone: 'warning' }]} />
        <MtInput label="Buscar" value={query} onChangeText={setQuery} placeholder="nombre, código, dirección..." />
        <MtButton title={formOpen ? 'Cerrar formulario' : kind === 'ESPECIALIDADES' ? 'Crear especialidad' : kind === 'OBRAS' ? 'Crear obra social' : 'Crear institución'} onPress={formOpen ? closeForm : openCreate} style={{ marginTop: 12 }} />
      </MtCard>

      {formOpen ? (
        <MtCard style={{ marginBottom: 14, borderColor: theme.colors.primary }}>
          <AdminTitle title={form.id ? 'Editar elemento' : 'Nuevo elemento'} subtitle="Los cambios se guardan y luego se recarga la lista." />
          <View style={{ gap: 12 }}>
            <MtInput label="Nombre" value={form.nombre} onChangeText={(nombre) => setForm((f) => ({ ...f, nombre }))} />
            {kind === 'OBRAS' ? <MtInput label="Código / sigla" value={form.codigo} onChangeText={(codigo) => setForm((f) => ({ ...f, codigo }))} placeholder="OSDE, IOMA, SWISS..." /> : null}
            {kind === 'INSTITUCIONES' ? (
              <>
                <MtSelect label="Tipo" value={form.tipo} placeholder="Tipo de institución" options={tipoOptions} onChange={(tipo) => setForm((f) => ({ ...f, tipo }))} />
                <MtInput label="Dirección" value={form.direccion} onChangeText={(direccion) => setForm((f) => ({ ...f, direccion }))} />
                <MtInput label="Teléfono" value={form.telefono} onChangeText={(telefono) => setForm((f) => ({ ...f, telefono }))} keyboardType="phone-pad" />
                <MtInput label="WhatsApp" value={form.whatsapp} onChangeText={(whatsapp) => setForm((f) => ({ ...f, whatsapp }))} keyboardType="phone-pad" />
              </>
            ) : null}
            <AdminTabs value={form.activa ? 'SI' : 'NO'} onChange={(v) => setForm((f) => ({ ...f, activa: v === 'SI' }))} options={[{ value: 'SI', label: 'Activo', tone: 'success' }, { value: 'NO', label: 'Inactivo', tone: 'danger' }]} />
            <MtButton title={saving ? 'Guardando...' : 'Guardar'} onPress={save} loading={saving} disabled={saving} />
          </View>
        </MtCard>
      ) : null}

      <MtCard style={{ marginBottom: 14 }}>
        <AdminTitle title="Resumen" subtitle="Resumen de registros cargados." />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <MtPill label={`Especialidades ${especialidades.length}`} selected={kind === 'ESPECIALIDADES'} onPress={() => setKind('ESPECIALIDADES')} />
          <MtPill label={`Obras sociales ${obras.length}`} selected={kind === 'OBRAS'} tone="success" onPress={() => setKind('OBRAS')} />
          <MtPill label={`Instituciones ${instituciones.length}`} selected={kind === 'INSTITUCIONES'} tone="warning" onPress={() => setKind('INSTITUCIONES')} />
        </View>
      </MtCard>

      {filtered.length ? filtered.map((item) => (
        <MtCard key={item.id} style={{ marginBottom: 12, opacity: active(item) ? 1 : 0.7 }}>
          <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 16 }}>{item.nombre}</Text>
          {kind === 'OBRAS' ? <AdminKV label="Código" value={item.codigo} /> : null}
          {kind === 'INSTITUCIONES' ? <><AdminKV label="Tipo" value={item.tipo} /><AdminKV label="Dirección" value={item.direccion} /><AdminKV label="Teléfono" value={item.telefono} /><AdminKV label="WhatsApp" value={item.whatsapp} /></> : null}
          <MtPill label={active(item) ? 'ACTIVO' : 'INACTIVO'} tone={active(item) ? 'success' : 'danger'} selected />
          <AdminActionRow>
            <AdminMiniButton label="Editar" onPress={() => edit(item)} />
            <AdminMiniButton label="Desactivar" tone="danger" disabled={!active(item) || workingId === item.id} onPress={() => deactivate(item)} />
          </AdminActionRow>
        </MtCard>
      )) : <MtEmptyState title="Sin datos" subtitle="No hay elementos para el filtro seleccionado." />}

      <RoleBottomNav role="admin" active="home" />
    </MtScreen>
  );
}
