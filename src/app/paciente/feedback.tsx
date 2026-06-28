import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { feedbackService } from '../../api/feedbackService';
import { MtBottomNav, MtButton, MtCard, MtHeader, MtNotice, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';

export default function FeedbackScreen() {
  const { id } = useLocalSearchParams();
  const turnoId = Number(id);
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    try {
      setSaving(true);
      setError(null);
      await feedbackService.save(turnoId, rating, comment);
      setMessage('Gracias por tu opinión. Tu calificación fue registrada.');
    } catch (e: unknown) {
      setError(readableError(e, 'No pudimos guardar la calificación.'));
    } finally {
      setSaving(false);
    }
  };

  return (
      <MtScreen scroll>
      <MtHeader eyebrow="EXPERIENCIA" title="Calificar atención" subtitle="Tu opinión ayuda a mejorar la atención del centro médico." />
      <MtCard style={{ gap: 16 }}>
        <Text style={styles.label}>Puntuación</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Text key={value} onPress={() => setRating(value)} style={[styles.star, value <= rating && styles.starActive]}>★</Text>
          ))}
        </View>
        <Text style={styles.label}>Comentario opcional</Text>
        <TextInput value={comment} onChangeText={setComment} placeholder="Contanos cómo fue la atención" placeholderTextColor={theme.colors.muted} multiline style={styles.textarea} />
        {!!error && <MtNotice type="danger" title="No pudimos guardar la calificación" message={error} />}
        {!!message && <MtNotice type="success" title="Calificación registrada" message={message} />}
        <MtButton title="Guardar calificación" onPress={save} loading={saving} disabled={saving || !!message} />
        <MtButton title="Volver a mis turnos" variant="ghost" onPress={() => router.replace('/paciente/turnos')} />
      </MtCard>
        <MtBottomNav active="turnos" />
      </MtScreen>
  );
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    label: { color: theme.colors.ink, fontWeight: '900' },
    stars: { flexDirection: 'row', gap: 8 },
    star: { fontSize: 34, color: theme.colors.border },
    starActive: { color: theme.colors.warning },
    textarea: { minHeight: 120, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 14, color: theme.colors.ink, textAlignVertical: 'top', backgroundColor: theme.colors.surface },
    error: { color: theme.colors.danger, fontWeight: '800' },
    success: { color: theme.colors.success, fontWeight: '800' },
  });
}
