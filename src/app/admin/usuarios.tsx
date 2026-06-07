import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { MtButton, MtCard, MtEmptyState, MtHeader, MtInput, MtLoading, MtPill, MtScreen } from '../../components/mediturnos';
import { MtSelect } from '../../components/MtSelect';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { adminService, AdminUsuario } from '../../api/adminService';
import { useMtTheme } from '../../theme/themeStore';
import { humanRole, normalizeRole } from '../../auth/roles';
import { readableError } from '../../utils/errors';
import { AdminActionRow, AdminKV, AdminMiniButton, AdminNotice, AdminTabs, AdminTitle } from '../../components/admin/AdminUi';

type Filter = 'TODOS' | 'ADMIN' | 'PROFESSIONAL' | 'SECRETARY' | 'PATIENT' | 'INACTIVOS';

type UsuarioForm = {
  id?: number;
  email: string;
  password: string;
  rol: string;
  activo: boolean;
  emailVerificado: boolean;
};

const emptyForm: UsuarioForm = {
  email: '',
  password: '',
  rol: 'PATIENT',
  activo: true,
  emailVerificado: true,
};

const roleOptions = [
  { label: 'Paciente', value: 'PATIENT' },
  { label: 'Médico', value: 'PROFESSIONAL' },
  { label: 'Secretaría', value: 'SECRETARY' },
  { label: 'Administrador', value: 'ADMIN' },
];

function validate(form: UsuarioForm, editing: boolean) {
  if (!form.email.includes('@')) return 'Ingresá un email válido.';
  if (!editing && form.password.trim().length < 6) return 'La contraseña inicial debe tener al menos 6 caracteres.';
  if (!form.rol) return 'Seleccioná un rol.';
  return null;
}

export default function AdminUsuariosScreen() {
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollToTop = () => setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 80);
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('TODOS');
  const [form, setForm] = useState<UsuarioForm>(emptyForm);
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
      setUsuarios(await adminService.usuarios());
    } catch (e: any) {
      setError(readableError(e, 'No pudimos cargar usuarios.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return usuarios.filter((u) => {
      const role = normalizeRole(u.rol);
      const text = `${u.email} ${u.rol} ${humanRole(u.rol)} ${u.nombreMostrar} ${u.dni}`.toLowerCase();
      const matchQuery = !q || text.includes(q);
      const matchFilter = filter === 'TODOS'
        ? true
        : filter === 'INACTIVOS'
          ? u.activo === false
          : role === filter;
      return matchQuery && matchFilter;
    });
  }, [usuarios, query, filter]);

  const startCreate = () => {
    setForm(emptyForm);
    setFormOpen(true);
    setMessage(null);
    setError(null);
    scrollToTop();
  };

  const startEdit = (user: AdminUsuario) => {
    setForm({
      id: user.id,
      email: user.email,
      password: '',
      rol: normalizeRole(user.rol) ?? user.rol,
      activo: user.activo !== false,
      emailVerificado: user.emailVerificado === true,
    });
    setFormOpen(true);
    setMessage(null);
    setError(null);
    scrollToTop();
  };

  const submit = async () => {
    const editing = !!form.id;
    const problem = validate(form, editing);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (editing) {
        const payload: any = { email: form.email.trim(), rol: form.rol, activo: form.activo, emailVerificado: form.emailVerificado };
        if (form.password.trim()) payload.password = form.password.trim();
        await adminService.actualizarUsuario(form.id!, payload);
        setMessage('Usuario actualizado correctamente.');
        scrollToTop();
      } else {
        await adminService.crearUsuario({ email: form.email.trim(), password: form.password.trim(), rol: form.rol, activo: form.activo, emailVerificado: form.emailVerificado });
        setMessage('Usuario creado correctamente.');
        scrollToTop();
      }
      setForm(emptyForm);
      setFormOpen(false);
      await load();
    } catch (e: any) {
      setError(readableError(e, 'No pudimos guardar el usuario.'));
      scrollToTop();
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (user: AdminUsuario, active: boolean) => {
    setWorkingId(user.id);
    setError(null);
    setMessage(null);
    try {
      if (active) {
        await adminService.activarUsuario(user.id);
        setMessage(`Usuario ${user.email} activado.`);
        scrollToTop();
      } else {
        await adminService.desactivarUsuario(user.id);
        setMessage(`Usuario ${user.email} desactivado.`);
        scrollToTop();
      }
      await load();
    } catch (e: any) {
      setError(readableError(e, active ? 'No pudimos activar el usuario.' : 'No pudimos desactivar el usuario.'));
      scrollToTop();
    } finally {
      setWorkingId(null);
    }
  };

  if (loading) return <MtLoading text="Cargando usuarios..." />;

  return (
    <MtScreen scroll scrollRef={scrollRef}>
      <MtHeader eyebrow="ADMIN" title="Usuarios" subtitle="Alta, edición, cambio de rol, activación y baja lógica de usuarios." />
      {message ? <AdminNotice type="success" title="Operación realizada" message={message} /> : null}
      {error ? <AdminNotice type="danger" title="Revisá esta operación" message={error} /> : null}

      <MtCard style={{ marginBottom: 14 }}>
        <AdminTitle title="Buscar y filtrar" subtitle="Filtrá por email, DNI, nombre o rol." />
        <MtInput label="Buscar" value={query} onChangeText={setQuery} placeholder="email, dni, rol, nombre..." autoCapitalize="none" />
        <AdminTabs value={filter} onChange={setFilter} options={[
          { value: 'TODOS', label: `Todos ${usuarios.length}` },
          { value: 'PATIENT', label: 'Pacientes', tone: 'success' },
          { value: 'PROFESSIONAL', label: 'Médicos' },
          { value: 'SECRETARY', label: 'Secretaría', tone: 'warning' },
          { value: 'ADMIN', label: 'Admin', tone: 'danger' },
          { value: 'INACTIVOS', label: 'Inactivos', tone: 'muted' },
        ]} />
        <MtButton title={formOpen ? 'Cerrar formulario' : 'Crear usuario'} onPress={formOpen ? () => setFormOpen(false) : startCreate} />
      </MtCard>

      {formOpen ? (
        <MtCard style={{ marginBottom: 14, borderColor: theme.colors.primary }}>
          <AdminTitle title={form.id ? 'Editar usuario' : 'Crear usuario'} subtitle="Este formulario escribe directo en /api/admin/usuarios." />
          <View style={{ gap: 12 }}>
            <MtInput label="Email" value={form.email} onChangeText={(email) => setForm((f) => ({ ...f, email }))} placeholder="usuario@dominio.com" autoCapitalize="none" keyboardType="email-address" />
            <MtInput label={form.id ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'} value={form.password} onChangeText={(password) => setForm((f) => ({ ...f, password }))} placeholder={form.id ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'} secureTextEntry />
            <MtSelect label="Rol" value={form.rol} placeholder="Seleccionar rol" options={roleOptions} onChange={(rol) => setForm((f) => ({ ...f, rol }))} />
            <AdminTabs value={form.activo ? 'SI' : 'NO'} onChange={(v) => setForm((f) => ({ ...f, activo: v === 'SI' }))} options={[{ value: 'SI', label: 'Activo', tone: 'success' }, { value: 'NO', label: 'Inactivo', tone: 'danger' }]} />
            <AdminTabs value={form.emailVerificado ? 'SI' : 'NO'} onChange={(v) => setForm((f) => ({ ...f, emailVerificado: v === 'SI' }))} options={[{ value: 'SI', label: 'Email verificado', tone: 'success' }, { value: 'NO', label: 'Email sin verificar', tone: 'warning' }]} />
            <MtButton title={saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Crear usuario'} onPress={submit} disabled={saving} loading={saving} />
          </View>
        </MtCard>
      ) : null}

      {filtered.length ? filtered.map((u) => {
        const role = normalizeRole(u.rol);
        const active = u.activo !== false;
        return (
          <MtCard key={u.id} style={{ marginBottom: 12, opacity: active ? 1 : 0.75 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 16 }}>{u.email}</Text>
                <Text style={{ color: theme.colors.muted, marginTop: 4 }}>{u.nombreMostrar || 'Sin persona asociada'}</Text>
              </View>
              <MtPill label={humanRole(u.rol)} tone={role === 'ADMIN' ? 'danger' : role === 'PROFESSIONAL' ? 'primary' : role === 'SECRETARY' ? 'warning' : 'success'} selected />
            </View>
            <AdminKV label="DNI" value={u.dni} />
            <AdminKV label="Estado" value={active ? 'Activo' : 'Inactivo'} />
            <AdminKV label="Email" value={u.emailVerificado ? 'Verificado' : 'Sin verificar'} />
            <AdminActionRow>
              <AdminMiniButton label="Editar" onPress={() => startEdit(u)} />
              <AdminMiniButton label={active ? 'Desactivar' : 'Activar'} tone={active ? 'danger' : 'success'} disabled={workingId === u.id} onPress={() => setActive(u, !active)} />
            </AdminActionRow>
          </MtCard>
        );
      }) : <MtEmptyState title="Sin usuarios" subtitle="No hay resultados para el filtro." />}

      <RoleBottomNav role="admin" active="usuarios" />
    </MtScreen>
  );
}
