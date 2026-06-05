import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MtButton, MtCard, MtEmptyState, MtHeader, MtInput, MtLoading, MtScreen } from '../../components/mediturnos';
import { RoleBottomNav } from '../../components/RoleBottomNav';
import { TurnoCard } from '../../components/TurnoCard';
import { medicoService } from '../../api/staffService';
import { TurnoResponse } from '../../api/appointmentService';
import { useMtTheme } from '../../theme/themeStore';

export default function HistoriaPacienteMedicoScreen() {
  const params = useLocalSearchParams<{ dni?: string }>();
  const [dni, setDni] = useState(params.dni || '');
  const [items, setItems] = useState<TurnoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useMtTheme();

  const search = async () => {
    if (!dni.trim()) return;
    setLoading(true); setError(null); setSearched(true);
    try {
      setItems(await medicoService.historialPaciente(dni.trim()));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'No pudimos cargar la historia clínica.');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (params.dni) search(); }, []);

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="MÉDICO" title="Historia del paciente" subtitle="Búsqueda por DNI." />
      <MtCard style={{ gap: 12, marginBottom: 14 }}>
        <MtInput label="DNI del paciente" value={dni} onChangeText={setDni} keyboardType="numeric" />
        <MtButton title="Buscar historia" onPress={search} loading={loading} disabled={!dni.trim()} />
      </MtCard>
      {error ? <MtCard style={{ borderColor: theme.colors.danger, marginBottom: 14 }}><Text style={{ color: theme.colors.danger, fontWeight: '900' }}>{error}</Text></MtCard> : null}
      {loading ? <MtLoading text="Buscando..." /> : items.length ? items.map((turno) => <TurnoCard key={turno.id} turno={turno} />) : searched ? <MtEmptyState title="Sin historia cargada" subtitle="No hay atenciones registradas para ese DNI." /> : null}
      <RoleBottomNav role="medico" active="consulta" />
    </MtScreen>
  );
}
