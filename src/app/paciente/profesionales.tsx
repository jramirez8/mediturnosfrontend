import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { professionalService, Professional } from '../../api/professionalService';
import { MtBottomNav, MtButton, MtCard, MtEmptyState, MtHeader, MtInput, MtLoading, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme } from '../../theme/themeStore';
import { AppLanguage, useTranslation } from '../../i18n/languageStore';

export default function ProfesionalesScreen() {
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const { t, language } = useTranslation();
  const [selectedSpecialty, setSelectedSpecialty] = useState('Todos');
  const [specialties, setSpecialties] = useState<string[]>(['Todos']);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    loadProfessionals();
  }, [selectedSpecialty]);

  const loadInitial = async () => {
    setLoading(true);
    const [specialtiesData, professionalsData] = await Promise.all([
      professionalService.getEspecialidades(),
      professionalService.getAll(),
    ]);
    setSpecialties(['Todos', ...specialtiesData.filter(Boolean)]);
    setProfessionals(professionalsData);
    setLoading(false);
  };

  const loadProfessionals = async () => {
    const data = await professionalService.getAll(selectedSpecialty);
    setProfessionals(data);
  };

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return professionals;
    return professionals.filter((p) => `${p.nombre} ${p.apellido} ${p.especialidad} ${p.institucion}`.toLowerCase().includes(query));
  }, [professionals, searchQuery]);

  if (loading) return <MtLoading text={t('common.loading')} />;

  return (
      <MtScreen scroll={false}>
        <MtHeader eyebrow={language === 'en' ? 'DIRECTORY' : 'CARTILLA'} title={t('professionals.title')} subtitle={t('professionals.subtitle')} />

        <View style={styles.searchBox}>
          <MtInput label={t('common.search')} value={searchQuery} onChangeText={setSearchQuery} placeholder={language === 'en' ? 'Example: cardiology, Smith, Central Clinic' : 'Ej: cardiología, López, Clínica Central'} />
        </View>

        <FlatList
          horizontal
          data={specialties}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          renderItem={({ item }) => {
            const selected = selectedSpecialty === item;
            return (
              <Pressable style={[styles.specialtyChip, selected && styles.specialtyChipSelected]} onPress={() => setSelectedSpecialty(item)}>
                <Text style={[styles.specialtyChipText, selected && styles.specialtyChipTextSelected]}>{item}</Text>
              </Pressable>
            );
          }}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.profesionalInstitucionId ?? item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<MtEmptyState title={language === 'en' ? 'No professionals found' : 'No encontramos profesionales'} subtitle={language === 'en' ? 'Try changing the filter or search.' : 'Probá cambiar el filtro o la búsqueda.'} />}
          renderItem={({ item }) => <ProfessionalCard item={item} styles={styles} theme={theme} language={language} />}
        />
        <MtBottomNav active="solicitar" />
      </MtScreen>
  );
}

function ProfessionalCard({ item, styles, theme, language }: Readonly<{ item: Professional; styles: ReturnType<typeof createStyles>; theme: MediturnosTheme; language: AppLanguage }>) {
  const initials = `${item.nombre?.[0] ?? ''}${item.apellido?.[0] ?? ''}`.toUpperCase() || 'Dr';
  return (
    <MtCard style={styles.card}>
      <Pressable
        style={styles.row}
        onPress={() => router.push({
          pathname: '/paciente/solicitar',
          params: {
            professionalId: item.id,
            profesionalInstitucionId: item.profesionalInstitucionId ?? item.id,
            professionalName: `${item.apellido}, ${item.nombre}`,
            specialty: item.especialidad,
            institution: item.institucion,
          },
        })}
      >
        <View style={styles.avatar}><Text style={[styles.avatarText, { color: theme.mode === 'dark' ? '#06201D' : '#FFFFFF' }]}>{initials}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.apellido}, {item.nombre}</Text>
          <Text style={styles.specialty}>{item.especialidad}</Text>
          <Text style={styles.institution}>{item.institucion}</Text>
          {!!item.matricula && <Text style={styles.matricula}>Matrícula {item.matricula}</Text>}
        </View>
      </Pressable>
      <View style={styles.footer}>
        <Text style={styles.next}>🕒 {item.proximaDisponibilidad || (language === 'en' ? 'Check availability' : 'Consultar disponibilidad')}</Text>
        <MtButton title={language === 'en' ? 'Request appointment' : 'Pedir turno'} onPress={() => router.push({ pathname: '/paciente/solicitar', params: { professionalId: item.id, profesionalInstitucionId: item.profesionalInstitucionId ?? item.id, professionalName: `${item.apellido}, ${item.nombre}`, specialty: item.especialidad, institution: item.institucion } })} style={{ minHeight: 42 }} />
      </View>
    </MtCard>
  );
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    searchBox: { marginBottom: 12 },
    chips: { paddingVertical: 8, paddingRight: 20, gap: 8 },
    specialtyChip: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, marginRight: 8 },
    specialtyChipSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
    specialtyChipText: { color: theme.colors.ink, fontWeight: '900', fontSize: 12 },
    specialtyChipTextSelected: { color: theme.mode === 'dark' ? '#06201D' : theme.colors.primaryDark },
    list: { gap: 14, paddingBottom: 120, paddingTop: 8 },
    card: { gap: 14 },
    row: { flexDirection: 'row', gap: 14 },
    avatar: { width: 54, height: 54, borderRadius: 19, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontWeight: '900', fontSize: 17 },
    name: { color: theme.colors.ink, fontSize: 17, fontWeight: '900' },
    specialty: { color: theme.colors.primary, fontWeight: '900', marginTop: 3 },
    institution: { color: theme.colors.muted, marginTop: 3, lineHeight: 19 },
    matricula: { color: theme.colors.soft, marginTop: 4, fontSize: 12, fontWeight: '700' },
    footer: { flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 },
    next: { flex: 1, color: theme.colors.muted, fontWeight: '700', fontSize: 12 },
  });
}
