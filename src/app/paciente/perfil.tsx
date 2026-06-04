import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { userService, UserProfile } from '../../api/userService';
import { useAuthStore } from '../../auth/authStore';
import { MtBottomNav, MtButton, MtCard, MtHeader, MtInput, MtLoading, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme, useThemeStore } from '../../theme/themeStore';
import { useTranslation } from '../../i18n/languageStore';
import { readableError } from '../../utils/errors';

export default function PerfilScreen() {
  const { usuarioId } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [obraSocial, setObraSocial] = useState('');
  const [numeroAfiliado, setNumeroAfiliado] = useState('');
  const [institucionCabecera, setInstitucionCabecera] = useState('');
  const [medicoCabecera, setMedicoCabecera] = useState('');
  const [telefono, setTelefono] = useState('');
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const { language, setLanguage, t } = useTranslation();

  useEffect(() => {
    loadProfile();
  }, [usuarioId]);

  const fillForm = (data: UserProfile) => {
    setEmail(data.email ?? '');
    setObraSocial(data.obraSocial ?? '');
    setNumeroAfiliado(data.numeroAfiliado ?? '');
    setInstitucionCabecera(data.institucionCabecera ?? '');
    setMedicoCabecera(data.medicoCabecera ?? '');
    setTelefono(data.telefono ?? '');
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await userService.getProfile(usuarioId);
      setProfile(data);
      fillForm(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await userService.updateProfile(usuarioId ?? '', {
        email,
        obraSocial,
        numeroAfiliado,
        institucionCabecera,
        medicoCabecera,
        telefono,
      });
      setProfile(updated);
      Alert.alert('Perfil actualizado', 'Los cambios quedaron guardados.');
    } catch (error: any) {
      Alert.alert('No se pudo guardar', readableError(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <MtLoading text={t('common.loadingProfile')} />;

  return (
    <>
      <MtScreen scroll>
        <MtHeader
          eyebrow={t('profile.eyebrow')}
          title={t('profile.title')}
          subtitle={t('profile.subtitle')}
          right={
            <Pressable style={styles.settingsChip} onPress={() => router.push('/paciente/settings')}>
              <Text style={styles.settingsChipText}>⚙ Ajustes</Text>
            </Pressable>
          }
        />

        <MtCard style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.nombre?.[0] ?? 'M'}{profile?.apellido?.[0] ?? 'T'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile?.nombre} {profile?.apellido}</Text>
            <Text style={styles.meta}>DNI {profile?.dni || '-'}</Text>
            <Text style={styles.meta}>Historia clínica HC-{String(profile?.id ?? 0).padStart(6, '0')}</Text>
          </View>
        </MtCard>

        <MtCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.title')}</Text>
          <Text style={styles.sectionSubtitle}>{t('settings.subtitle')}</Text>

          <View style={styles.preferenceRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.preferenceTitle}>{t('settings.darkMode')}</Text>
              <Text style={styles.preferenceHint}>{t('settings.darkModeHint')}</Text>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={(value) => setMode(value ? 'dark' : 'light')}
              trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
              thumbColor={mode === 'dark' ? theme.colors.primary : theme.colors.soft}
            />
          </View>

          <View style={styles.languageBox}>
            <Text style={styles.preferenceTitle}>{t('settings.language')}</Text>
            <Text style={styles.preferenceHint}>{t('settings.languageHint')}</Text>
            <View style={styles.languageRow}>
              <LanguageButton label={t('settings.spanish')} selected={language === 'es'} onPress={() => setLanguage('es')} styles={styles} />
              <LanguageButton label={t('settings.english')} selected={language === 'en'} onPress={() => setLanguage('en')} styles={styles} />
            </View>
          </View>
        </MtCard>

        <MtCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.editableInfo')}</Text>
          <View style={styles.form}>
            <MtInput label={t('profile.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <MtInput label={t('profile.phone')} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
            <MtInput label={t('profile.healthInsurance')} value={obraSocial} onChangeText={setObraSocial} placeholder="Ej: OSDE, Swiss Medical, IOMA" />
            <MtInput label={t('profile.memberNumber')} value={numeroAfiliado} onChangeText={setNumeroAfiliado} />
            <MtInput label={t('profile.mainInstitution')} value={institucionCabecera} onChangeText={setInstitucionCabecera} />
            <MtInput label={t('profile.mainDoctor')} value={medicoCabecera} onChangeText={setMedicoCabecera} />
          </View>
          <MtButton title={t('common.save')} loading={saving} onPress={handleSave} style={{ marginTop: 18 }} />
        </MtCard>

        <MtCard style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('privacy.title')}</Text>
          <Text style={styles.infoText}>{t('privacy.text')}</Text>
        </MtCard>
      </MtScreen>
      <MtBottomNav active="perfil" />
    </>
  );
}

function LanguageButton({ label, selected, onPress, styles }: { label: string; selected: boolean; onPress: () => void; styles: ReturnType<typeof createStyles> }) {
  return (
    <Pressable onPress={onPress} style={[styles.languageButton, selected && styles.languageButtonSelected]}>
      <Text style={[styles.languageButtonText, selected && styles.languageButtonTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    settingsChip: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
    settingsChipText: { color: theme.colors.primary, fontWeight: '900', fontSize: 12 },
    heroCard: { flexDirection: 'row', gap: 15, alignItems: 'center', marginBottom: 16 },
    avatar: { width: 68, height: 68, borderRadius: 25, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: theme.mode === 'dark' ? '#06201D' : 'white', fontSize: 24, fontWeight: '900' },
    name: { color: theme.colors.ink, fontSize: 21, fontWeight: '900' },
    meta: { color: theme.colors.muted, marginTop: 3, fontWeight: '700' },
    section: { marginBottom: 16 },
    sectionTitle: { color: theme.colors.ink, fontSize: 18, fontWeight: '900', marginBottom: 6 },
    sectionSubtitle: { color: theme.colors.muted, lineHeight: 20, marginBottom: 14 },
    form: { gap: 14 },
    preferenceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 14 },
    preferenceTitle: { color: theme.colors.ink, fontWeight: '900', fontSize: 15 },
    preferenceHint: { color: theme.colors.muted, lineHeight: 19, marginTop: 4, fontSize: 13 },
    languageBox: { borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: 14, paddingTop: 14 },
    languageRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    languageButton: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
    languageButtonSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
    languageButtonText: { color: theme.colors.muted, fontWeight: '900' },
    languageButtonTextSelected: { color: theme.colors.primaryDark },
    infoCard: { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
    infoTitle: { color: theme.colors.primaryDark, fontWeight: '900', fontSize: 16 },
    infoText: { color: theme.colors.primaryDark, marginTop: 6, lineHeight: 20 },
  });
}
