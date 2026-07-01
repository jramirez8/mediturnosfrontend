import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { feedbackService } from '../../api/feedbackService';
import { MtBottomNav, MtButton, MtCard, MtHeader, MtNotice, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { languageCopy, useTranslation } from '../../i18n/languageStore';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';

export default function FeedbackScreen() {
  const { id } = useLocalSearchParams();
  const turnoId = Number(id);
  const theme = useMtTheme();
  const { language } = useTranslation();
  const copy = (es: string, en: string, pt: string) => languageCopy(language, es, en, pt);
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
      setMessage(copy('Gracias por tu opinion. Tu calificacion fue registrada.', 'Thanks for your feedback. Your rating was saved.', 'Obrigado pela sua opiniao. Sua avaliacao foi registrada.'));
    } catch (e: unknown) {
      setError(readableError(e, copy('No pudimos guardar la calificacion.', 'We could not save the rating.', 'Nao foi possivel salvar a avaliacao.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <MtScreen scroll>
      <MtHeader
        eyebrow={copy('EXPERIENCIA', 'EXPERIENCE', 'EXPERIENCIA')}
        title={copy('Calificar atencion', 'Rate visit', 'Avaliar atendimento')}
        subtitle={copy('Tu opinion ayuda a mejorar la atencion del centro medico.', 'Your opinion helps improve care at the medical center.', 'Sua opiniao ajuda a melhorar o atendimento do centro medico.')}
      />
      <MtCard style={{ gap: 16 }}>
        <Text style={styles.label}>{copy('Puntuacion', 'Rating', 'Pontuacao')}</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Text key={value} onPress={() => setRating(value)} style={[styles.star, value <= rating && styles.starActive]}>*</Text>
          ))}
        </View>
        <Text style={styles.label}>{copy('Comentario opcional', 'Optional comment', 'Comentario opcional')}</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder={copy('Contanos como fue la atencion', 'Tell us how the visit went', 'Conte como foi o atendimento')}
          placeholderTextColor={theme.colors.muted}
          multiline
          style={styles.textarea}
        />
        {!!error && <MtNotice type="danger" title={copy('No pudimos guardar la calificacion', 'We could not save the rating', 'Nao foi possivel salvar a avaliacao')} message={error} />}
        {!!message && <MtNotice type="success" title={copy('Calificacion registrada', 'Rating saved', 'Avaliacao registrada')} message={message} />}
        <MtButton title={copy('Guardar calificacion', 'Save rating', 'Salvar avaliacao')} onPress={save} loading={saving} disabled={saving || !!message} />
        <MtButton title={copy('Volver a mis turnos', 'Back to my appointments', 'Voltar as minhas consultas')} variant="ghost" onPress={() => router.replace('/paciente/turnos')} />
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
