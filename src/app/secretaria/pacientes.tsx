import React, { useState } from 'react';
import { Text } from 'react-native';
import { MtButton, MtCard, MtHeader, MtInput, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { secretariaService } from '../../api/staffService';
import { useMtTheme } from '../../theme/themeStore';

export default function SecretariaPacientesScreen() {
  const [dni, setDni] = useState('');
  const [paciente, setPaciente] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useMtTheme();

  const search = async () => {
    setLoading(true); setError(null); setPaciente(null);
    try { setPaciente(await secretariaService.buscarPaciente(dni.trim())); }
    catch (e: any) { setError(e?.response?.data?.message || e?.message || 'No encontramos paciente con ese DNI.'); }
    finally { setLoading(false); }
  };

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="SECRETARÍA" title="Pacientes" subtitle="Búsqueda rápida por DNI para operar turnos." />
      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <MtInput label="DNI" value={dni} onChangeText={setDni} keyboardType="numeric" />
        <MtButton title="Buscar paciente" onPress={search} loading={loading} disabled={!dni.trim()} />
      </MtCard>
      {error ? <MtCard style={{ borderColor: theme.colors.danger }}><Text style={{ color: theme.colors.danger, fontWeight: '900' }}>{error}</Text></MtCard> : null}
      {paciente ? (
        <MtCard>
          <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18 }}>{paciente.nombre} {paciente.apellido}</Text>
          <Text style={{ color: theme.colors.muted, marginTop: 6 }}>DNI: {paciente.dni}</Text>
          <Text style={{ color: theme.colors.muted }}>Teléfono: {paciente.telefono || 'No informado'}</Text>
          <Text style={{ color: theme.colors.muted }}>Email: {paciente.usuario?.email || paciente.email || 'No informado'}</Text>
          <Text style={{ color: theme.colors.muted }}>Obra social: {paciente.obraSocial?.nombre || paciente.obraSocialNombre || 'No informada'}</Text>
        </MtCard>
      ) : null}
      <RoleBottomNav role="secretaria" active="pacientes" />
    </MtScreen>
  );
}
