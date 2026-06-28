import React, { useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { MtButton, MtCard, MtHeader, MtInput, MtLoading, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { auditService, AuditLog } from '../../api/auditService';
import { readableError } from '../../utils/errors';
import { useMtTheme } from '../../theme/themeStore';
import { AdminNotice } from '../../components/admin/AdminUi';
type AuditTitleRule = {
    matches: (action: string) => boolean;
    title: (actor: string) => string;
};
const AUDIT_TITLE_RULES: AuditTitleRule[] = [
    { matches: (a) => a.includes('LOGIN_OK'), title: (actor) => `${actor} inició sesión` },
    { matches: (a) => a.includes('LOGIN_ERROR'), title: () => 'Intento de inicio rechazado' },
    { matches: (a) => a.includes('REGISTRO') || a.includes('PACIENTE_ALTA'), title: () => 'Paciente creado' },
    { matches: (a) => a.includes('PASSWORD_RECOVERY'), title: () => 'Solicitud de recuperación de contraseña' },
    { matches: (a) => a.includes('PASSWORD_RESET'), title: () => 'Contraseña restablecida' },
    { matches: (a) => a.includes('TURNO') && a.includes('ALTA'), title: () => 'Turno creado' },
    { matches: (a) => a.includes('TURNO') && a.includes('CANCEL'), title: () => 'Turno cancelado' },
    { matches: (a) => a.includes('TURNO') && a.includes('REPROGRAM'), title: () => 'Turno reprogramado' },
    { matches: (a) => a.includes('TURNO') && a.includes('ATEND'), title: () => 'Turno atendido' },
    { matches: (a) => a.includes('HORARIO_ALTA') || a.includes('AGENDA_HORARIO_ALTA'), title: () => 'Horario de atención cargado' },
    { matches: (a) => a.includes('HORARIO_BAJA') || a.includes('AGENDA_HORARIO_BAJA'), title: () => 'Horario de atención eliminado' },
    { matches: (a) => a.includes('BLOQUEO_ALTA'), title: () => 'Bloqueo de agenda creado' },
    { matches: (a) => a.includes('BLOQUEO_BAJA'), title: () => 'Bloqueo de agenda eliminado' },
    { matches: (a) => a.includes('USUARIO_ALTA'), title: () => 'Usuario creado' },
    { matches: (a) => a.includes('USUARIO_EDICION') || a.includes('USUARIO_MOD'), title: () => 'Usuario modificado' },
    { matches: (a) => a.includes('VERIFICACION'), title: () => 'Código de verificación enviado' },
];
function tituloHumano(item: AuditLog) {
    const action = String(item.accion || '').toUpperCase();
    const rule = AUDIT_TITLE_RULES.find((candidate) => candidate.matches(action));
    return rule?.title(item.actor || 'Sistema') ?? item.detalle ?? item.accion ?? 'Evento de auditoría';
}
export default function AuditoriaAdmin() {
    const [items, setItems] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const theme = useMtTheme();
    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            setItems(await auditService.latest());
        }
        catch (e: unknown) {
            setError(readableError(e, 'No pudimos cargar auditoría.'));
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q)
            return items;
        return items.filter((item) => `${item.accion} ${item.actor} ${item.detalle} ${item.entidad} ${item.entidadId} ${tituloHumano(item)}`.toLowerCase().includes(q));
    }, [items, query]);
    if (loading)
        return <MtLoading text="Cargando auditoría..."/>;
    return <MtScreen scroll>
    <MtHeader eyebrow="ADMIN" title="Auditoría" subtitle="Lectura humana de acciones críticas: usuarios, turnos, agenda, accesos y seguridad."/>
    {!!error && <AdminNotice type="danger" title="No pudimos cargar auditoría" message={error} onRetry={load}/>}
    <MtCard style={{ marginBottom: 12 }}>
      <MtInput label="Buscar" value={query} onChangeText={setQuery} placeholder="acción, usuario, entidad..." autoCapitalize="none"/>
      <Text style={{ color: theme.colors.muted, fontWeight: '700', marginTop: 8 }}>{filtered.length} eventos visibles</Text>
    </MtCard>
    {!filtered.length && <MtCard><Text style={{ color: theme.colors.muted, fontWeight: '800' }}>Todavía no hay eventos para este filtro.</Text></MtCard>}
    {filtered.map((item) => <MtCard key={item.id} style={{ marginBottom: 10 }}>
      <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 17 }}>{tituloHumano(item)}</Text>
      <Text style={{ color: theme.colors.muted, marginTop: 6, fontWeight: '700' }}>{item.detalle || 'Sin detalle adicional'}</Text>
      <Text style={{ color: theme.colors.soft, marginTop: 8, fontSize: 12 }}>{item.creadoEn} · {item.actor || 'Sistema'}</Text>
    </MtCard>)}
    <MtButton title="Actualizar" onPress={load} variant="ghost"/>
    <RoleBottomNav role="admin" active="reportes"/>
  </MtScreen>;
}

