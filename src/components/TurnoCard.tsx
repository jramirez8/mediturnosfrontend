import React from 'react';
import { Text, View } from 'react-native';
import { MtButton, MtCard, MtPill } from './mediturnos';
import { TurnoResponse } from '../api/appointmentService';
import { useMtTheme } from '../theme/themeStore';
import { formatTurnoDate, statusTone } from '../utils/turnos';

export function TurnoCard({
  turno,
  primaryAction,
  secondaryAction,
  dangerAction,
}: Readonly<{
  turno: TurnoResponse;
  primaryAction?: { title: string; onPress: () => void };
  secondaryAction?: { title: string; onPress: () => void };
  dangerAction?: { title: string; onPress: () => void };
}>) {
  const theme = useMtTheme();
  const paciente = turno.pacienteNombre || 'Paciente sin nombre';
  const profesional = turno.profesionalNombre || 'Profesional sin nombre';
  return (
    <MtCard style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 16 }}>{formatTurnoDate(turno.fecha, turno.hora, turno.fechaHora)}</Text>
          <Text style={{ color: theme.colors.muted, marginTop: 5, fontWeight: '700' }}>{paciente}</Text>
          <Text style={{ color: theme.colors.muted, marginTop: 2 }}>{turno.especialidad} · {profesional}</Text>
          {!!turno.institucionNombre && <Text style={{ color: theme.colors.soft, marginTop: 2 }}>{turno.institucionNombre}</Text>}
        </View>
        <MtPill label={turno.estado || 'SIN ESTADO'} tone={statusTone(turno.estado)} />
      </View>
      {!!turno.motivoConsulta && <Text style={{ color: theme.colors.muted, marginTop: 10 }}>Motivo: {turno.motivoConsulta}</Text>}
      {!!turno.observaciones && <Text style={{ color: theme.colors.muted, marginTop: 6 }}>Obs: {turno.observaciones}</Text>}
      {(primaryAction || secondaryAction || dangerAction) && (
        <View style={{ gap: 8, marginTop: 14 }}>
          {primaryAction && <MtButton title={primaryAction.title} onPress={primaryAction.onPress} />}
          {secondaryAction && <MtButton title={secondaryAction.title} variant="ghost" onPress={secondaryAction.onPress} />}
          {dangerAction && <MtButton title={dangerAction.title} variant="danger" onPress={dangerAction.onPress} />}
        </View>
      )}
    </MtCard>
  );
}
