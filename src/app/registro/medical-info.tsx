import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRegistrationStore } from '../../auth/registrationStore';
import { authService } from '../../api/authService';
import { catalogService, CatalogItem } from '../../api/catalogService';
import { Professional } from '../../api/professionalService';
import { readableError } from '../../utils/errors';

type Option = { label: string; value: string };

const BLOOD_TYPES: Option[] = [
  { label: 'A+ (A positivo)', value: 'A_POSITIVO' },
  { label: 'A- (A negativo)', value: 'A_NEGATIVO' },
  { label: 'B+ (B positivo)', value: 'B_POSITIVO' },
  { label: 'B- (B negativo)', value: 'B_NEGATIVO' },
  { label: 'AB+ (AB positivo)', value: 'AB_POSITIVO' },
  { label: 'AB- (AB negativo)', value: 'AB_NEGATIVO' },
  { label: 'O+ (O positivo)', value: 'O_POSITIVO' },
  { label: 'O- (O negativo)', value: 'O_NEGATIVO' },
];

const MONTHS: Option[] = [
  { label: 'Enero', value: '01' },
  { label: 'Febrero', value: '02' },
  { label: 'Marzo', value: '03' },
  { label: 'Abril', value: '04' },
  { label: 'Mayo', value: '05' },
  { label: 'Junio', value: '06' },
  { label: 'Julio', value: '07' },
  { label: 'Agosto', value: '08' },
  { label: 'Septiembre', value: '09' },
  { label: 'Octubre', value: '10' },
  { label: 'Noviembre', value: '11' },
  { label: 'Diciembre', value: '12' },
];

function daysInMonth(year: string, month: string) {
  const y = Number(year);
  const m = Number(month);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return 31;
  return new Date(y, m, 0).getDate();
}

function SelectField({ label, value, placeholder, options, onChange, disabled }: {
  label: string;
  value: string;
  placeholder: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((item) => item.value === value);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.selectButton, disabled && styles.disabledSelect]}
        onPress={() => !disabled && setOpen((current) => !current)}
        disabled={disabled}
      >
        <Text style={[styles.selectText, !selected && styles.placeholderText]}>
          {selected?.label || placeholder}
        </Text>
        <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.optionList}>
          {options.map((option) => (
            <TouchableOpacity
              key={`${label}-${option.value}`}
              style={[styles.optionItem, option.value === value && styles.optionItemActive]}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <Text style={[styles.optionText, option.value === value && styles.optionTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function MedicalInfoScreen() {
  const { data, reset } = useRegistrationStore();
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError] = useState('');

  const [obrasSociales, setObrasSociales] = useState<CatalogItem[]>([]);
  const [instituciones, setInstituciones] = useState<CatalogItem[]>([]);
  const [profesionales, setProfesionales] = useState<Professional[]>([]);

  const [obraSocialId, setObraSocialId] = useState('');
  const [tipoSangre, setTipoSangre] = useState('');
  const [dia, setDia] = useState('');
  const [mes, setMes] = useState('');
  const [anio, setAnio] = useState('');
  const [numCarnet, setNumCarnet] = useState('');
  const [clinicaCabecera, setClinicaCabecera] = useState('');
  const [medicoCabecera, setMedicoCabecera] = useState('');
  const [otroClinica, setOtroClinica] = useState('');
  const [otroMedico, setOtroMedico] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadCatalogs() {
      try {
        setCatalogLoading(true);
        setError('');
        const [obras, insts, pros] = await Promise.all([
          catalogService.obrasSociales(),
          catalogService.instituciones(),
          catalogService.profesionales(),
        ]);
        if (!mounted) return;
        setObrasSociales(obras);
        setInstituciones(insts);
        setProfesionales(pros);
      } catch (err) {
        if (!mounted) return;
        setError(readableError(err, 'No pudimos cargar obras sociales, instituciones o profesionales.'));
      } finally {
        if (mounted) setCatalogLoading(false);
      }
    }
    loadCatalogs();
    return () => { mounted = false; };
  }, []);

  const obraSocialOptions = useMemo<Option[]>(() => obrasSociales.map((obra) => ({ label: obra.nombre, value: String(obra.id) })), [obrasSociales]);
  const institucionOptions = useMemo<Option[]>(() => [
    ...instituciones.map((inst) => ({ label: inst.nombre, value: inst.nombre })),
    { label: 'Otro', value: 'Otro' },
  ], [instituciones]);
  const medicoOptions = useMemo<Option[]>(() => {
    const seen = new Set<string>();
    const items = profesionales
      .map((p) => ({ label: `${p.apellido}, ${p.nombre} · ${p.especialidad}`, value: `${p.nombre} ${p.apellido}`.trim() }))
      .filter((item) => {
        const key = item.value.toLowerCase();
        if (!item.value || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    return [...items, { label: 'Otro', value: 'Otro' }];
  }, [profesionales]);
  const yearOptions = useMemo<Option[]>(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: current - 1900 + 1 }, (_, index) => {
      const year = String(current - index);
      return { label: year, value: year };
    });
  }, []);
  const dayOptions = useMemo<Option[]>(() => {
    const max = daysInMonth(anio || '2000', mes || '01');
    return Array.from({ length: max }, (_, index) => {
      const day = String(index + 1).padStart(2, '0');
      return { label: String(index + 1), value: day };
    });
  }, [anio, mes]);

  const fechaNacimiento = dia && mes && anio ? `${anio}-${mes}-${dia}` : '';

  const handleFinishRegistration = async () => {
    try {
      setLoading(true);
      setError('');

      if (!obraSocialId || !tipoSangre || !fechaNacimiento || !numCarnet.trim() || !clinicaCabecera || !medicoCabecera) {
        setError('Completá obra social, fecha de nacimiento, grupo sanguíneo, número de carnet, hospital/clínica y médico de cabecera.');
        return;
      }

      if (clinicaCabecera === 'Otro' && !otroClinica.trim()) {
        setError('Completá Observaciones con el hospital o clínica de cabecera.');
        return;
      }

      if (medicoCabecera === 'Otro' && !otroMedico.trim()) {
        setError('Completá Observaciones con el médico de cabecera.');
        return;
      }

      const registrationData = {
        ...data,
        obraSocialId: Number(obraSocialId),
        tipoSangre,
        fechaNacimiento,
        numeroAfiliado: numCarnet.trim(),
        numeroCarnet: numCarnet.trim(),
        institucionCabecera: clinicaCabecera === 'Otro' ? otroClinica.trim() : clinicaCabecera,
        hospitalClinicaCabecera: clinicaCabecera === 'Otro' ? otroClinica.trim() : clinicaCabecera,
        medicoCabecera: medicoCabecera === 'Otro' ? otroMedico.trim() : medicoCabecera,
        doctorCabecera: medicoCabecera === 'Otro' ? otroMedico.trim() : medicoCabecera,
      };

      await authService.register(registrationData);
      reset();
      router.replace('/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(readableError(err, 'No se pudo completar el registro. Revisá los datos e intentá nuevamente.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.kicker}>PASO 3</Text>
            <Text style={styles.title}>Información médica</Text>
            <Text style={styles.subtitle}>Completá los datos clínicos básicos. La historia clínica la genera el sistema.</Text>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>No pudimos continuar</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {catalogLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#0F766E" />
              <Text style={styles.loadingText}>Cargando catálogos...</Text>
            </View>
          ) : (
            <View style={styles.form}>
              <SelectField
                label="Obra social"
                value={obraSocialId}
                placeholder="Seleccioná tu obra social"
                options={obraSocialOptions}
                onChange={setObraSocialId}
              />

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fecha de nacimiento</Text>
                <View style={styles.dateRow}>
                  <View style={styles.dateColumn}>
                    <SelectField label="Día" value={dia} placeholder="Día" options={dayOptions} onChange={setDia} />
                  </View>
                  <View style={styles.dateColumnWide}>
                    <SelectField label="Mes" value={mes} placeholder="Mes" options={MONTHS} onChange={setMes} />
                  </View>
                  <View style={styles.dateColumn}>
                    <SelectField label="Año" value={anio} placeholder="Año" options={yearOptions} onChange={setAnio} />
                  </View>
                </View>
              </View>

              <SelectField
                label="Grupo sanguíneo"
                value={tipoSangre}
                placeholder="Grupo sanguíneo: seleccioná una opción"
                options={BLOOD_TYPES}
                onChange={setTipoSangre}
              />

              <View style={styles.inputGroup}>
                <Text style={styles.label}>N° Carnet</Text>
                <View style={styles.inputContainer}>
                  <TextInput style={styles.input} value={numCarnet} onChangeText={setNumCarnet} placeholder="Número de afiliado / carnet" />
                </View>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>N° Historia clínica</Text>
                <Text style={styles.infoText}>No lo elige el usuario. La base de datos lo genera automáticamente al crear la cuenta.</Text>
              </View>

              <SelectField
                label="Hospital o clínica de cabecera"
                value={clinicaCabecera}
                placeholder="Seleccioná institución"
                options={institucionOptions}
                onChange={setClinicaCabecera}
              />

              <SelectField
                label="Médico de cabecera"
                value={medicoCabecera}
                placeholder="Seleccioná médico"
                options={medicoOptions}
                onChange={setMedicoCabecera}
              />

              {clinicaCabecera === 'Otro' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Observaciones:</Text>
                  <View style={styles.inputContainer}>
                    <TextInput style={styles.input} value={otroClinica} onChangeText={setOtroClinica} placeholder="Completá hospital o clínica de cabecera" />
                  </View>
                </View>
              )}

              {medicoCabecera === 'Otro' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Observaciones:</Text>
                  <View style={styles.inputContainer}>
                    <TextInput style={styles.input} value={otroMedico} onChangeText={setOtroMedico} placeholder="Completá médico de cabecera" />
                  </View>
                </View>
              )}

            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, (loading || catalogLoading) && styles.disabled]}
              onPress={handleFinishRegistration}
              disabled={loading || catalogLoading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Finalizar registro</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={loading}>
              <Text style={styles.backButtonText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  header: { marginBottom: 24 },
  kicker: { color: '#0F766E', fontSize: 13, fontWeight: '900', letterSpacing: 1.2, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '900', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6b7280', lineHeight: 21 },
  form: { gap: 18, flex: 1 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '800', color: '#374151', marginLeft: 4 },
  inputContainer: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16 },
  input: { paddingVertical: 14, fontSize: 16, color: '#111827' },
  selectButton: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  disabledSelect: { opacity: 0.6 },
  selectText: { color: '#111827', fontSize: 15, fontWeight: '700', flex: 1 },
  placeholderText: { color: '#9ca3af', fontWeight: '600' },
  chevron: { color: '#0F766E', fontSize: 12, fontWeight: '900' },
  optionList: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, overflow: 'hidden', backgroundColor: '#ffffff', marginTop: 4 },
  optionItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  optionItemActive: { backgroundColor: '#CCFBF1' },
  optionText: { color: '#374151', fontSize: 14, fontWeight: '600' },
  optionTextActive: { color: '#115E59', fontWeight: '900' },
  dateRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  dateColumn: { flex: 0.9 },
  dateColumnWide: { flex: 1.25 },
  loadingBox: { borderWidth: 1, borderColor: '#DDEBE8', backgroundColor: '#F0FDFA', borderRadius: 16, padding: 18, alignItems: 'center', gap: 10 },
  loadingText: { color: '#115E59', fontWeight: '700', textAlign: 'center' },
  infoBox: { borderWidth: 1, borderColor: '#DDEBE8', backgroundColor: '#F0FDFA', borderRadius: 14, padding: 14 },
  infoTitle: { color: '#115E59', fontWeight: '900', fontSize: 15, marginBottom: 4 },
  infoText: { color: '#334155', fontSize: 13, lineHeight: 19, fontWeight: '600' },
  errorBox: { borderWidth: 1, borderColor: '#EF4444', backgroundColor: '#FEF2F2', borderRadius: 16, padding: 16, marginBottom: 20 },
  errorTitle: { color: '#991B1B', fontWeight: '900', fontSize: 17, marginBottom: 8 },
  errorText: { color: '#7F1D1D', fontWeight: '700', fontSize: 15, lineHeight: 21 },
  footer: { marginTop: 36, gap: 12 },
  button: { backgroundColor: '#0F766E', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 56 },
  disabled: { opacity: 0.7 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '800' },
  backButton: { paddingVertical: 12, alignItems: 'center' },
  backButtonText: { color: '#6b7280', fontSize: 14, fontWeight: '700' },
});
