import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { userService, UserProfile } from '../../api/userService';
import { useAuthStore } from '../../auth/authStore';
import { catalogService, CatalogItem } from '../../api/catalogService';
import { Professional } from '../../api/professionalService';
import { storage } from '../../api/storage';
import { MtBottomNav, MtButton, MtCard, MtHeader, MtInput, MtLoading, MtScreen } from '../../components/mediturnos';
import { MtSelect, MtSelectOption } from '../../components/MtSelect';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
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
      const [data, obras, insts, pros, savedPhoto] = await Promise.all([
        userService.getProfile(usuarioId),
        catalogService.obrasSociales(),
        catalogService.instituciones(),
        catalogService.profesionales(),
        storage.getItem('profile_photo_uri'),
      ]);
      setProfile(data);
      setObrasSociales(obras);
      setInstituciones(insts);
      setProfesionales(pros);
      setPhotoUri(savedPhoto);
      fillForm(data, obras);
    } catch (error: any) {
      Alert.alert('No se pudo cargar perfil', readableError(error));
    } finally {
      setCatalogLoading(false);
      setLoading(false);
    }
  };

  const obraSocialOptions = useMemo<MtSelectOption[]>(() => [
    ...obrasSociales.map((obra) => ({ label: obra.nombre, value: String(obra.id) })),
    { label: 'Otro', value: OTRO },
  ], [obrasSociales]);

  const institucionOptions = useMemo<MtSelectOption[]>(() => [
    ...instituciones.map((inst) => ({ label: inst.nombre, value: inst.nombre })),
    { label: 'Otro', value: OTRO },
  ], [instituciones]);

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
    return [...items, { label: 'Otro', value: OTRO }];
  }, [profesionales]);

  const needsOtherDetails = obraSocialId === OTRO || institucionCabecera === OTRO || medicoCabecera === OTRO;

  const pickProfilePhoto = () => {
    chooseImageSource(
      async (media) => {
        setPhotoUri(media.uri);
        await storage.setItem('profile_photo_uri', media.uri);
      },
      (message) => Alert.alert('No pudimos cargar la foto', message),
    );
  };

  const pickCarnet = () => {
    chooseImageSource(
      (media) => setCarnet(media),
      (message) => Alert.alert('No pudimos adjuntar el carnet', message),
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (needsOtherDetails && !observacionesOtro.trim()) {
        Alert.alert('Faltan observaciones', 'Cuando elegís “Otro”, completá el campo Observaciones con los datos faltantes.');
        return;
      }

      const selectedObraSocialId = obraSocialId === OTRO ? profile?.obraSocialId : Number(obraSocialId);
      if (!selectedObraSocialId || Number.isNaN(Number(selectedObraSocialId))) {
        Alert.alert('Obra social requerida', 'Seleccioná una obra social del listado. Si falta una obra social nueva, cargá “Otro” y pedí su alta en backend.');
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
      Alert.alert('Perfil actualizado', 'Los cambios quedaron guardados.');
    } catch (error: any) {
      Alert.alert('No se pudo guardar', readableError(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <MtLoading text="Cargando perfil..." />;

  return (
    <>
      <MtScreen scroll>
        <MtHeader
          eyebrow="MI PERFIL"
          title="Datos personales"
          subtitle="Mantené actualizada tu información de contacto y cobertura médica."
          right={
            <Pressable style={styles.settingsChip} onPress={() => router.push('/paciente/settings')}>
              <Text style={styles.settingsChipText}>⚙ Ajustes</Text>
            </Pressable>
          }
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
            <Text style={styles.meta}>Historia clínica {profile?.numeroHistoriaClinica ?? `HC-${String(profile?.id ?? 0).padStart(6, '0')}`}</Text>
          </View>
        </MtCard>

        <MtCard style={styles.section}>
          <Text style={styles.sectionTitle}>Información editable</Text>
          {catalogLoading ? <Text style={styles.muted}>Cargando catálogos del backend...</Text> : null}
          <View style={styles.form}>
            <MtInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <MtInput label="Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
            <MtSelect label="Obra social" value={obraSocialId} placeholder="Seleccioná obra social" options={obraSocialOptions} onChange={setObraSocialId} />
            <MtInput label="N° Carnet" value={numeroAfiliado} onChangeText={setNumeroAfiliado} />
            <MtSelect label="Institución de cabecera" value={institucionCabecera} placeholder="Seleccioná institución" options={institucionOptions} onChange={setInstitucionCabecera} />
            <MtSelect label="Médico de cabecera" value={medicoCabecera} placeholder="Seleccioná médico" options={medicoOptions} onChange={setMedicoCabecera} />
            {needsOtherDetails ? (
              <View style={{ gap: 8 }}>
                <Text style={styles.inputLabel}>Observaciones:</Text>
                <TextInput
                  value={observacionesOtro}
                  onChangeText={setObservacionesOtro}
                  placeholder="Completá acá los datos que no figuran en el listado"
                  placeholderTextColor={theme.colors.soft}
                  multiline
                  textAlignVertical="top"
                  style={styles.textArea}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.attachBox}>
            <Text style={styles.attachTitle}>Carnet de obra social</Text>
            <Text style={styles.attachText}>Adjuntá una foto del carnet desde cámara o galería.</Text>
            <MtButton title={carnet ? 'Cambiar carnet adjunto' : '📎 Adjuntar carnet de OOSS'} variant="secondary" onPress={pickCarnet} style={{ marginTop: 12 }} />
            {carnet ? <Text style={styles.attachmentName}>Archivo seleccionado: {carnet.fileName ?? 'imagen'}</Text> : null}
          </View>

          <MtButton title="Guardar" loading={saving} onPress={handleSave} style={{ marginTop: 18 }} />
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
