import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { MtButton, MtCard, MtHeader, MtLoading, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { auditService, AuditLog } from '../../api/auditService';
import { readableError } from '../../utils/errors';
import { useMtTheme } from '../../theme/themeStore';

export default function AuditoriaAdmin() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useMtTheme();

  const load = async () => {
    try { setLoading(true); setError(null); setItems(await auditService.latest()); }
    catch (e: any) { setError(readableError(e, 'No pudimos cargar auditoría.')); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const empty = useMemo(() => !loading && !items.length, [loading, items]);
  if (loading) return <MtLoading text="Cargando auditoría..." />;
  return <MtScreen scroll>
    <MtHeader eyebrow="ADMIN" title="Auditoría" subtitle="Últimas acciones importantes registradas por el sistema." />
    {!!error && <Text style={{ color: theme.colors.danger, fontWeight: '900', marginBottom: 12 }}>{error}</Text>}
    {empty && <MtCard><Text style={{ color: theme.colors.muted, fontWeight: '800' }}>Todavía no hay eventos de auditoría.</Text></MtCard>}
    {items.map((item) => <MtCard key={item.id} style={{ marginBottom: 10 }}>
      <Text style={{ color: theme.colors.primary, fontWeight: '900' }}>{item.accion}</Text>
      <Text style={{ color: theme.colors.ink, fontWeight: '800', marginTop: 4 }}>{item.entidad || '-'} #{item.entidadId || '-'}</Text>
      <Text style={{ color: theme.colors.muted, marginTop: 4 }}>{item.detalle || 'Sin detalle'}</Text>
      <Text style={{ color: theme.colors.soft, marginTop: 6, fontSize: 12 }}>{item.creadoEn} · {item.actor || 'actor no informado por backend'}</Text>
    </MtCard>)}
    <MtButton title="Actualizar" onPress={load} variant="ghost" />
    <RoleBottomNav role="admin" active="reportes" />
  </MtScreen>;
}
