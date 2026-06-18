import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { MtButton, MtCard, MtHeader, MtInput, MtLoading, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { auditService, AuditLog } from '../../api/auditService';
import { readableError } from '../../utils/errors';
import { useMtTheme } from '../../theme/themeStore';
import { AdminNotice } from '../../components/admin/AdminUi';

function tituloHumano(item: AuditLog) {
  const a = String(item.accion || '').toUpperCase();
  const detalle = item.detalle || '';
  const actor = item.actor || 'Sistema';
  if (a.includes('LOGIN_OK')) return `${actor} inició sesión`;
  if (a.includes('LOGIN_ERROR')) return `Intento de inicio rechazado`;
  if (a.includes('REGISTRO') || a.includes('PACIENTE_ALTA')) return `Paciente creado`;
  if (a.includes('PASSWORD_RECOVERY')) return `Solicitud de recuperación de contraseña`;
  if (a.includes('PASSWORD_RESET')) return `Contraseña restablecida`;
  if (a.includes('TURNO') && a.includes('ALTA')) return `Turno creado`;
  if (a.includes('TURNO') && a.includes('CANCEL')) return `Turno cancelado`;
  if (a.includes('TURNO') && a.includes('REPROGRAM')) return `Turno reprogramado`;
  if (a.includes('TURNO') && a.includes('ATEND')) return `Turno atendido`;
  if (a.includes('HORARIO_ALTA') || a.includes('AGENDA_HORARIO_ALTA')) return `Horario de atención cargado`;
  if (a.includes('HORARIO_BAJA') || a.includes('AGENDA_HORARIO_BAJA')) return `Horario de atención eliminado`;
  if (a.includes('BLOQUEO_ALTA')) return `Bloqueo de agenda creado`;
  if (a.includes('BLOQUEO_BAJA')) return `Bloqueo de agenda eliminado`;
  if (a.includes('USUARIO_ALTA')) return `Usuario creado`;
  if (a.includes('USUARIO_EDICION') || a.includes('USUARIO_MOD')) return `Usuario modificado`;
  if (a.includes('VERIFICACION')) return `Código de verificación enviado`;
  return detalle || item.accion || 'Evento de auditoría';
}

export default function AuditoriaAdmin() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const theme = useMtTheme();

  const load = async () => {
    try { setLoading(true); setError(null); setItems(await auditService.latest()); }
    catch (e: any) { setError(readableError(e, 'No pudimos cargar auditoría.')); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => `${item.accion} ${item.actor} ${item.detalle} ${item.entidad} ${item.entidadId} ${tituloHumano(item)}`.toLowerCase().includes(q));
  }, [items, query]);

  if (loading) return <MtLoading text="Cargando auditoría..." />;
  return <MtScreen scroll>
    <MtHeader eyebrow="ADMIN" title="Auditoría" subtitle="Lectura humana de acciones críticas: usuarios, turnos, agenda, accesos y seguridad." />
    {!!error && <AdminNotice type="danger" title="No pudimos cargar auditoría" message={error} onRetry={load} />}
    <MtCard style={{ marginBottom: 12 }}>
      <MtInput label="Buscar" value={query} onChangeText={setQuery} placeholder="acción, usuario, entidad..." autoCapitalize="none" />
      <Text style={{ color: theme.colors.muted, fontWeight: '700', marginTop: 8 }}>{filtered.length} eventos visibles</Text>
    </MtCard>
    {!filtered.length && <MtCard><Text style={{ color: theme.colors.muted, fontWeight: '800' }}>Todavía no hay eventos para este filtro.</Text></MtCard>}
    {filtered.map((item) => <MtCard key={item.id} style={{ marginBottom: 10 }}>
      <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 17 }}>{tituloHumano(item)}</Text>
      <Text style={{ color: theme.colors.muted, marginTop: 6, fontWeight: '700' }}>{item.detalle || 'Sin detalle adicional'}</Text>
      <Text style={{ color: theme.colors.soft, marginTop: 8, fontSize: 12 }}>{item.creadoEn} · {item.actor || 'Sistema'}</Text>
    </MtCard>)}
    <MtButton title="Actualizar" onPress={load} variant="ghost" />
    <RoleBottomNav role="admin" active="reportes" />
  </MtScreen>;
}
