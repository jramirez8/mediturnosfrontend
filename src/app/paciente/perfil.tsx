import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { userService, UserProfile } from '../../api/userService';
import { useAuthStore } from '../../auth/authStore';
import { catalogService, CatalogItem } from '../../api/catalogService';
import { Professional } from '../../api/professionalService';
import { MtBottomNav, MtButton, MtCard, MtHeader, MtInput, MtLoading, MtNotice, MtScreen } from '../../components/mediturnos';
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
    if (!target)
        return '';
    const found = items.find((item) => item.nombre.toLowerCase() === target);
    return found ? String(found.id) : '';
}
type ProfileSaveValues = {
    needsOtherDetails: boolean;
    observacionesOtro: string;
    obraSocialId: string;
    profile: UserProfile | null;
    institucionCabecera: string;
    medicoCabecera: string;
    email: string;
    telefono: string;
    numeroAfiliado: string;
};
function profileValidationNotice(values: ProfileSaveValues, language: string): Notice | null {
    if (values.needsOtherDetails && !values.observacionesOtro.trim()) {
        return { type: 'warning', title: language === 'en' ? 'Missing notes' : 'Faltan observaciones', message: language === 'en' ? 'When you choose Other, complete the Notes field with the missing information.' : 'Cuando elegís “Otro”, completá el campo Observaciones con los datos faltantes.' };
    }
    const selectedId = values.obraSocialId === OTRO ? values.profile?.obraSocialId : Number(values.obraSocialId);
    if (selectedId && !Number.isNaN(Number(selectedId)))
        return null;
    return { type: 'warning', title: language === 'en' ? 'Health insurance required' : 'Obra social requerida', message: language === 'en' ? 'Select a health insurance option from the list. If it is missing, choose Other and add the details in Notes.' : 'Seleccioná una obra social del listado. Si no aparece, elegí “Otro” y completá los datos en Observaciones.' };
}
function profileUpdatePayload(values: ProfileSaveValues) {
    const selectedId = values.obraSocialId === OTRO ? values.profile?.obraSocialId : Number(values.obraSocialId);
    const otherText = values.observacionesOtro.trim();
    const hospital = values.institucionCabecera === OTRO ? otherText : values.institucionCabecera;
    const doctor = values.medicoCabecera === OTRO ? otherText : values.medicoCabecera;
    return {
        email: values.email,
        telefono: values.telefono,
        obraSocialId: Number(selectedId),
        numeroAfiliado: values.numeroAfiliado,
        numeroCarnet: values.numeroAfiliado,
        institucionCabecera: hospital,
        hospitalClinicaCabecera: hospital,
        medicoCabecera: doctor,
        doctorCabecera: doctor,
    };
}
type Notice = {
    type: 'success' | 'danger' | 'warning' | 'info';
    title: string;
    message: string;
};
function ProfileHero({ profile, photoUri, pickPhoto, styles, language }: Readonly<{
    profile: UserProfile | null;
    photoUri: string | null;
    pickPhoto: () => void;
    styles: ReturnType<typeof createStyles>;
    language: string;
}>) { return <MtCard style={styles.heroCard}><Pressable style={styles.avatarWrap} onPress={pickPhoto}><View style={styles.avatar}>{photoUri ? <Image source={{ uri: photoUri }} style={styles.avatarImage}/> : <Text style={styles.avatarText}>{profile?.nombre?.[0] ?? 'M'}{profile?.apellido?.[0] ?? 'T'}</Text>}</View><View style={styles.editBadge}><Text style={styles.editBadgeText}>✎</Text></View></Pressable><View style={{ flex: 1 }}><Text style={styles.name}>{profile?.nombre} {profile?.apellido}</Text><Text style={styles.meta}>DNI {profile?.dni || '-'}</Text><Text style={styles.meta}>{language === 'en' ? 'Medical record' : 'Historia clínica'} {profile?.numeroHistoriaClinica ?? `HC-${String(profile?.id ?? 0).padStart(6, '0')}`}</Text></View></MtCard>; }
function OtherDetailsField({ value, setValue, styles, theme }: Readonly<{
    value: string;
    setValue: (value: string) => void;
    styles: ReturnType<typeof createStyles>;
    theme: MediturnosTheme;
}>) { const { t } = useTranslation(); return <View style={{ gap: 8 }}><Text style={styles.inputLabel}>{t('profile.observations')}</Text><TextInput value={value} onChangeText={setValue} placeholder={t('profile.observationsPlaceholder')} placeholderTextColor={theme.colors.soft} multiline textAlignVertical="top" style={styles.textArea}/></View>; }
function ProfileFormCard(props: Readonly<{
    catalogLoading: boolean;
    email: string;
    setEmail: (v: string) => void;
    telefono: string;
    setTelefono: (v: string) => void;
    obraSocialId: string;
    setObraSocialId: (v: string) => void;
    numeroAfiliado: string;
    setNumeroAfiliado: (v: string) => void;
    institucionCabecera: string;
    setInstitucionCabecera: (v: string) => void;
    medicoCabecera: string;
    setMedicoCabecera: (v: string) => void;
    obraOptions: MtSelectOption[];
    institutionOptions: MtSelectOption[];
    doctorOptions: MtSelectOption[];
    needsOtherDetails: boolean;
    observacionesOtro: string;
    setObservacionesOtro: (v: string) => void;
    carnet: PickedMedia | null;
    pickCarnet: () => void;
    saving: boolean;
    save: () => void;
    styles: ReturnType<typeof createStyles>;
    theme: MediturnosTheme;
    language: string;
}>) { const { t } = useTranslation(); return <MtCard style={props.styles.section}><Text style={props.styles.sectionTitle}>{t('profile.editableInfo')}</Text>{props.catalogLoading ? <Text style={props.styles.muted}>{t('common.loading')}</Text> : null}<View style={props.styles.form}><MtInput label={t('profile.email')} value={props.email} onChangeText={props.setEmail} keyboardType="email-address" autoCapitalize="none"/><MtInput label={t('profile.phone')} value={props.telefono} onChangeText={props.setTelefono} keyboardType="phone-pad"/><MtSelect label={t('profile.healthInsurance')} value={props.obraSocialId} placeholder={props.language === 'en' ? 'Select health insurance' : 'Seleccioná obra social'} options={props.obraOptions} onChange={props.setObraSocialId}/><MtInput label={t('profile.memberNumber')} value={props.numeroAfiliado} onChangeText={props.setNumeroAfiliado}/><MtSelect label={t('profile.mainInstitution')} value={props.institucionCabecera} placeholder={props.language === 'en' ? 'Select institution' : 'Seleccioná institución'} options={props.institutionOptions} onChange={props.setInstitucionCabecera}/><MtSelect label={t('profile.mainDoctor')} value={props.medicoCabecera} placeholder={props.language === 'en' ? 'Select doctor' : 'Seleccioná médico'} options={props.doctorOptions} onChange={props.setMedicoCabecera}/>{props.needsOtherDetails ? <OtherDetailsField value={props.observacionesOtro} setValue={props.setObservacionesOtro} styles={props.styles} theme={props.theme}/> : null}</View><View style={props.styles.attachBox}><Text style={props.styles.attachTitle}>{t('profile.cardTitle')}</Text><Text style={props.styles.attachText}>{t('profile.cardHelp')}</Text><MtButton title={props.carnet ? t('profile.changeCard') : t('profile.attachCard')} variant="secondary" onPress={props.pickCarnet} style={{ marginTop: 12 }}/>{props.carnet ? <Text style={props.styles.attachmentName}>{t('profile.selectedFile')} {props.carnet.fileName ?? 'imagen'}</Text> : null}</View><MtButton title={t('common.save')} loading={props.saving} onPress={props.save} style={{ marginTop: 18 }}/></MtCard>; }
export default function PerfilScreen() {
    const { usuarioId } = useAuthStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<Notice | null>(null);
    const scrollRef = useRef<ScrollView | null>(null);
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
    const scrollTop = () => requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
    const showNotice = (next: Notice) => { setNotice(next); scrollTop(); };
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
        }
        catch (error: unknown) {
            showNotice({ type: 'danger', title: language === 'en' ? 'We could not load your profile' : 'No se pudo cargar perfil', message: readableError(error) });
        }
        finally {
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
            if (!item.value || seen.has(key))
                return false;
            seen.add(key);
            return true;
        });
        return [...items, { label: t('common.other'), value: OTRO }];
    }, [profesionales, t]);
    const needsOtherDetails = obraSocialId === OTRO || institucionCabecera === OTRO || medicoCabecera === OTRO;
    const pickProfilePhoto = () => {
        chooseImageSource(async (media) => {
            const updated = await userService.uploadProfilePhoto(media, usuarioId);
            setProfile(updated);
            setPhotoUri(updated.fotoPerfilUrl ?? media.uri);
        }, (message) => showNotice({ type: 'danger', title: 'No pudimos cargar la foto', message }));
    };
    const pickCarnet = () => {
        chooseImageSource(async (media) => {
            const updated = await userService.uploadOossCard(media, usuarioId);
            setProfile(updated);
            setCarnet({
                uri: updated.carnetObraSocialUrl ?? media.uri,
                fileName: media.fileName ?? 'carnet-obra-social.jpg',
                mimeType: 'image/jpeg',
            });
        }, (message) => showNotice({ type: 'danger', title: language === 'en' ? 'We could not attach the card' : 'No pudimos adjuntar el carnet', message }));
    };
    const handleSave = async () => {
        const values: ProfileSaveValues = { needsOtherDetails, observacionesOtro, obraSocialId, profile, institucionCabecera, medicoCabecera, email, telefono, numeroAfiliado };
        const validationNotice = profileValidationNotice(values, language);
        if (validationNotice) {
            showNotice(validationNotice);
            return;
        }
        try {
            setSaving(true);
            const updated = await userService.updateProfile(usuarioId ?? '', profileUpdatePayload(values));
            setProfile(updated);
            showNotice({ type: 'success', title: t('profile.saved'), message: t('profile.savedMsg') });
        }
        catch (error: unknown) {
            showNotice({ type: 'danger', title: language === 'en' ? 'Could not save' : 'No se pudo guardar', message: readableError(error) });
        }
        finally {
            setSaving(false);
        }
    };
    if (loading)
        return <MtLoading text={t('common.loading')}/>;
    return <MtScreen scroll scrollRef={scrollRef}><MtHeader eyebrow={t('profile.eyebrow')} title={t('profile.title')} subtitle={t('profile.subtitle')}/>{notice ? <MtNotice type={notice.type} title={notice.title} message={notice.message} style={{ marginBottom: 14 }}/> : null}<ProfileHero profile={profile} photoUri={photoUri} pickPhoto={pickProfilePhoto} styles={styles} language={language}/><ProfileFormCard catalogLoading={catalogLoading} email={email} setEmail={setEmail} telefono={telefono} setTelefono={setTelefono} obraSocialId={obraSocialId} setObraSocialId={setObraSocialId} numeroAfiliado={numeroAfiliado} setNumeroAfiliado={setNumeroAfiliado} institucionCabecera={institucionCabecera} setInstitucionCabecera={setInstitucionCabecera} medicoCabecera={medicoCabecera} setMedicoCabecera={setMedicoCabecera} obraOptions={obraSocialOptions} institutionOptions={institucionOptions} doctorOptions={medicoOptions} needsOtherDetails={needsOtherDetails} observacionesOtro={observacionesOtro} setObservacionesOtro={setObservacionesOtro} carnet={carnet} pickCarnet={pickCarnet} saving={saving} save={handleSave} styles={styles} theme={theme} language={language}/><MtBottomNav active="perfil"/></MtScreen>;
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

