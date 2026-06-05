import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { userService, UserProfile } from '../../api/userService';
import { useAuthStore } from '../../auth/authStore';
import { catalogService, CatalogItem } from '../../api/catalogService';
import { Professional } from '../../api/professionalService';
import { MtBottomNav, MtButton, MtCard, MtHeader, MtInput, MtLoading, MtScreen } from '../../components/mediturnos';
import { MtSelect, MtSelectOption } from '../../components/MtSelect';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { useTranslation } from '../../i18n/languageStore';
import { readableError } from '../../utils/errors';
import { chooseImageSource, PickedMedia } from '../../utils/mediaPicker';

const OTRO = '__OTRO__';

function normalizeText(value?: string | null) {
  return String(value ?? '').trim();
}

function matchCatalogByName(items: CatalogItem[], name?: string | null) {
  const target = normalizeText(name).toLowerCase();
  if (!target) return '';
  const found = items.find((item) => item.nombre.toLowerCase() === target);
  return found ? String(found.id) : '';
}

export default function PerfilScreen() {
  const { usuarioId } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [numeroAfiliado, setNumeroAfiliado] = useState('');
  const [telefono, setTelefono] = useState('');
  const [obraSocialId, setObraSocialId] = useState('');
  const [institucionCabecera, setInstitucionCabecera] = useState('');
  const [medicoCabecera, setMedicoCabecera] = useState('');
  const [observacionesOtro, setObservacionesOtro] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [carnet, setCarnet] = useState<PickedMedia | null>(null);
  const [obrasSociales, setObrasSociales] = useState<CatalogItem[]>([]);
  const [instituciones, setInstituciones] = useState<CatalogItem[]>([]);
  const [profesionales, setProfesionales] = useState<Professional[]>([]);
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const { t, language } = useTranslation();

  useEffect(() => {
    loadAll();
  }, [usuarioId]);

  const fillForm = (data: UserProfile, obras = obrasSociales) => {
    setEmail(data.email ?? '');
    setNumeroAfiliado(data.numeroCarnet ?? data.numeroAfiliado ?? '');
    setInstitucionCabecera(data.hospitalClinicaCabecera ?? data.institucionCabecera ?? '');
    setMedicoCabecera(data.doctorCabecera ?? data.medicoCabecera ?? '');
    setTelefono(data.telefono ?? '');

    const id = data.obraSocialId ? String(data.obraSocialId) : matchCatalogByName(obras, data.obraSocialNombre ?? data.obraSocial);
    setObraSocialId(id || (data.obraSocial || data.obraSocialNombre ? OTRO : ''));
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setCatalogLoading(true);
      const [data, obras, insts, pros] = await Promise.all([
        userService.getProfile(usuarioId),
        catalogService.obrasSociales(),
        catalogService.instituciones(),
        catalogService.profesionales(),
      ]);
      setProfile(data);
      setObrasSociales(obras);
      setInstituciones(insts);
      setProfesionales(pros);
      setPhotoUri(data.fotoPerfilUrl ?? null);
      setCarnet(data.carnetObraSocialUrl ? { uri: data.carnetObraSocialUrl, fileName: 'carnet-obra-social.jpg', mimeType: 'image/jpeg' } : null);
      fillForm(data, obras);
    } catch (error: any) {
      Alert.alert(language === 'en' ? 'We could not load your profile' : 'No se pudo cargar perfil', readableError(error));
    } finally {
      setCatalogLoading(false);
      setLoading(false);
    }
  };

  const obraSocialOptions = useMemo<MtSelectOption[]>(() => [
    ...obrasSociales.map((obra) => ({ label: obra.nombre, value: String(obra.id) })),
    { label: t('common.other'), value: OTRO },
  ], [obrasSociales, t]);

  const institucionOptions = useMemo<MtSelectOption[]>(() => [
    ...instituciones.map((inst) => ({ label: inst.nombre, value: inst.nombre })),
    { label: t('common.other'), value: OTRO },
  ], [instituciones, t]);

  const medicoOptions = useMemo<MtSelectOption[]>(() => {
    const seen = new Set<string>();
    const items = profesionales
      .map((p) => ({ label: `${p.apellido}, ${p.nombre} · ${p.especialidad}`, value: `${p.nombre} ${p.apellido}`.trim() }))
      .filter((item) => {
        const key = item.value.toLowerCase();
        if (!item.value || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    return [...items, { label: t('common.other'), value: OTRO }];
  }, [profesionales, t]);

  const needsOtherDetails = obraSocialId === OTRO || institucionCabecera === OTRO || medicoCabecera === OTRO;

  const pickProfilePhoto = () => {
    chooseImageSource(
      async (media) => {
        const updated = await userService.uploadProfilePhoto(media, usuarioId);
        setProfile(updated);
        setPhotoUri(updated.fotoPerfilUrl ?? media.uri);
      },
      (message) => Alert.alert('No pudimos cargar la foto', message),
    );
  };

  const pickCarnet = () => {
    chooseImageSource(
      async (media) => {
        const updated = await userService.uploadOossCard(media, usuarioId);
        setProfile(updated);
        setCarnet({
          uri: updated.carnetObraSocialUrl ?? media.uri,
          fileName: media.fileName ?? 'carnet-obra-social.jpg',
          mimeType: 'image/jpeg',
        });
      },
      (message) => Alert.alert(language === 'en' ? 'We could not attach the card' : 'No pudimos adjuntar el carnet', message),
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (needsOtherDetails && !observacionesOtro.trim()) {
        Alert.alert(language === 'en' ? 'Missing notes' : 'Faltan observaciones', language === 'en' ? 'When you choose Other, complete the Notes field with the missing information.' : 'Cuando elegís “Otro”, completá el campo Observaciones con los datos faltantes.');
        return;
      }

      const selectedObraSocialId = obraSocialId === OTRO ? profile?.obraSocialId : Number(obraSocialId);
      if (!selectedObraSocialId || Number.isNaN(Number(selectedObraSocialId))) {
        Alert.alert(language === 'en' ? 'Health insurance required' : 'Obra social requerida', language === 'en' ? 'Select a health insurance option from the list. If it is missing, choose Other and add the details in Notes.' : 'Seleccioná una obra social del listado. Si no aparece, elegí “Otro” y completá los datos en Observaciones.');
        return;
      }

      const otherText = observacionesOtro.trim();
      const hospital = institucionCabecera === OTRO ? otherText : institucionCabecera;
      const doctor = medicoCabecera === OTRO ? otherText : medicoCabecera;

      const updated = await userService.updateProfile(usuarioId ?? '', {
        email,
        telefono,
        obraSocialId: Number(selectedObraSocialId),
        numeroAfiliado,
        numeroCarnet: numeroAfiliado,
        institucionCabecera: hospital,
        hospitalClinicaCabecera: hospital,
        medicoCabecera: doctor,
        doctorCabecera: doctor,
      });
      setProfile(updated);
      Alert.alert(t('profile.saved'), t('profile.savedMsg'));
    } catch (error: any) {
      Alert.alert(language === 'en' ? 'Could not save' : 'No se pudo guardar', readableError(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <MtLoading text={t('common.loading')} />;

  return (
    <>
      <MtScreen scroll>
        <MtHeader
          eyebrow={t('profile.eyebrow')}
          title={t('profile.title')}
          subtitle={t('profile.subtitle')}
        />

        <MtCard style={styles.heroCard}>
          <Pressable style={styles.avatarWrap} onPress={pickProfilePhoto}>
            <View style={styles.avatar}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{profile?.nombre?.[0] ?? 'M'}{profile?.apellido?.[0] ?? 'T'}</Text>
              )}
            </View>
            <View style={styles.editBadge}><Text style={styles.editBadgeText}>✎</Text></View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile?.nombre} {profile?.apellido}</Text>
            <Text style={styles.meta}>DNI {profile?.dni || '-'}</Text>
            <Text style={styles.meta}>{language === 'en' ? 'Medical record' : 'Historia clínica'} {profile?.numeroHistoriaClinica ?? `HC-${String(profile?.id ?? 0).padStart(6, '0')}`}</Text>
          </View>
        </MtCard>

        <MtCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.editableInfo')}</Text>
          {catalogLoading ? <Text style={styles.muted}>{t('common.loading')}</Text> : null}
          <View style={styles.form}>
            <MtInput label={t('profile.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <MtInput label={t('profile.phone')} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
            <MtSelect label={t('profile.healthInsurance')} value={obraSocialId} placeholder={language === 'en' ? 'Select health insurance' : 'Seleccioná obra social'} options={obraSocialOptions} onChange={setObraSocialId} />
            <MtInput label={t('profile.memberNumber')} value={numeroAfiliado} onChangeText={setNumeroAfiliado} />
            <MtSelect label={t('profile.mainInstitution')} value={institucionCabecera} placeholder={language === 'en' ? 'Select institution' : 'Seleccioná institución'} options={institucionOptions} onChange={setInstitucionCabecera} />
            <MtSelect label={t('profile.mainDoctor')} value={medicoCabecera} placeholder={language === 'en' ? 'Select doctor' : 'Seleccioná médico'} options={medicoOptions} onChange={setMedicoCabecera} />
            {needsOtherDetails ? (
              <View style={{ gap: 8 }}>
                <Text style={styles.inputLabel}>{t('profile.observations')}</Text>
                <TextInput
                  value={observacionesOtro}
                  onChangeText={setObservacionesOtro}
                  placeholder={t('profile.observationsPlaceholder')}
                  placeholderTextColor={theme.colors.soft}
                  multiline
                  textAlignVertical="top"
                  style={styles.textArea}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.attachBox}>
            <Text style={styles.attachTitle}>{t('profile.cardTitle')}</Text>
            <Text style={styles.attachText}>{t('profile.cardHelp')}</Text>
            <MtButton title={carnet ? t('profile.changeCard') : t('profile.attachCard')} variant="secondary" onPress={pickCarnet} style={{ marginTop: 12 }} />
            {carnet ? <Text style={styles.attachmentName}>{t('profile.selectedFile')} {carnet.fileName ?? 'imagen'}</Text> : null}
          </View>

          <MtButton title={t('common.save')} loading={saving} onPress={handleSave} style={{ marginTop: 18 }} />
        </MtCard>
      </MtScreen>
      <MtBottomNav active="perfil" />
    </>
  );
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    settingsChip: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
    settingsChipText: { color: theme.colors.primary, fontWeight: '900', fontSize: 12 },
    heroCard: { flexDirection: 'row', gap: 15, alignItems: 'center', marginBottom: 16 },
    avatarWrap: { position: 'relative' },
    avatar: { width: 74, height: 74, borderRadius: 27, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarImage: { width: 74, height: 74 },
    avatarText: { color: theme.mode === 'dark' ? '#06201D' : 'white', fontSize: 24, fontWeight: '900' },
    editBadge: { position: 'absolute', right: -3, bottom: -3, width: 26, height: 26, borderRadius: 13, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
    editBadgeText: { color: theme.colors.primary, fontWeight: '900' },
    name: { color: theme.colors.ink, fontSize: 21, fontWeight: '900' },
    meta: { color: theme.colors.muted, marginTop: 3, fontWeight: '700' },
    section: { marginBottom: 16 },
    sectionTitle: { color: theme.colors.ink, fontSize: 18, fontWeight: '900', marginBottom: 14 },
    form: { gap: 14 },
    muted: { color: theme.colors.muted, fontWeight: '700', marginBottom: 10 },
    inputLabel: { color: theme.colors.ink, fontWeight: '900', fontSize: 13 },
    textArea: { minHeight: 96, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, paddingHorizontal: 14, paddingTop: 14, color: theme.colors.ink, backgroundColor: theme.colors.surface },
    attachBox: { marginTop: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted, borderRadius: 18, padding: 14 },
    attachTitle: { color: theme.colors.primaryDark, fontWeight: '900', fontSize: 15 },
    attachText: { color: theme.colors.primaryDark, fontWeight: '700', lineHeight: 20, marginTop: 4 },
    attachmentName: { color: theme.colors.primaryDark, fontWeight: '800', marginTop: 10 },
  });
}
