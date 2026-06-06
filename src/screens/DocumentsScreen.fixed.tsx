import React, { useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import BrandMark from "../components/BrandMark";
import MedButton from "../components/MedButton";

type DocType = "receta" | "carnet" | "dni" | "poder" | "estudio" | "orden" | "otros";

type LocalDocument = {
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
  type: DocType;
};

const DOC_TYPES: { key: DocType; label: string }[] = [
  { key: "receta", label: "Receta" },
  { key: "carnet", label: "Carnet" },
  { key: "dni", label: "DNI" },
  { key: "poder", label: "Poder" },
  { key: "estudio", label: "Estudio" },
  { key: "orden", label: "Orden médica" },
  { key: "otros", label: "Otros" },
];

const MAX_SIZE = 1024 * 1024;

/**
 * Documentos implementado.
 * Soporta PDF/JPG/JPEG/PNG hasta 1 MB.
 * Para instalar:
 * npx expo install expo-document-picker expo-image-picker
 */
export default function DocumentsScreenFixed() {
  const [selectedType, setSelectedType] = useState<DocType>("receta");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [documents, setDocuments] = useState<LocalDocument[]>([]);

  const typeLabel = useMemo(
    () => DOC_TYPES.find((item) => item.key === selectedType)?.label ?? "Tipo",
    [selectedType]
  );

  const validateAndAdd = (doc: Omit<LocalDocument, "type">) => {
    const mime = (doc.mimeType ?? "").toLowerCase();
    const name = doc.name.toLowerCase();
    const isPdf = mime.includes("pdf") || name.endsWith(".pdf");
    const isImage = mime.includes("jpeg") || mime.includes("jpg") || mime.includes("png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");

    if (!isPdf && !isImage) {
      Alert.alert("Formato no permitido", "Subí un PDF, JPG, JPEG o PNG.");
      return;
    }

    if ((doc.size ?? 0) > MAX_SIZE) {
      Alert.alert("Archivo demasiado grande", "El máximo permitido es 1 MB.");
      return;
    }

    setDocuments((prev) => [{ ...doc, type: selectedType }, ...prev]);
  };

  const pickPdfOrImage = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/jpeg", "image/png"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return;
    const file = result.assets[0];
    validateAndAdd({
      name: file.name,
      uri: file.uri,
      mimeType: file.mimeType,
      size: file.size,
    });
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso necesario", "Necesito acceso a la galería para adjuntar imágenes.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.78,
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    validateAndAdd({
      name: asset.fileName ?? "imagen.jpg",
      uri: asset.uri,
      mimeType: asset.mimeType ?? "image/jpeg",
      size: asset.fileSize,
    });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>HISTORIA CLÍNICA</Text>
      <Text style={styles.title}>Documentos</Text>
      <Text style={styles.subtitle}>Adjuntá estudios, recetas, carnets o documentación médica.</Text>

      <View style={styles.card}>
        <BrandMark dark size={58} />
        <Text style={styles.cardTitle}>Nuevo documento</Text>
        <Text style={styles.cardText}>PDF, JPG, JPEG o PNG. Máximo 1 MB.</Text>

        <Pressable style={styles.dropdown} onPress={() => setPickerOpen((v) => !v)}>
          <Text style={styles.dropdownLabel}>Tipo de documento</Text>
          <Text style={styles.dropdownValue}>{typeLabel}  ▾</Text>
        </Pressable>

        {pickerOpen ? (
          <View style={styles.options}>
            {DOC_TYPES.map((item) => (
              <Pressable
                key={item.key}
                style={[styles.option, selectedType === item.key && styles.optionActive]}
                onPress={() => {
                  setSelectedType(item.key);
                  setPickerOpen(false);
                }}
              >
                <Text style={[styles.optionText, selectedType === item.key && styles.optionTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <MedButton title="Adjuntar PDF o imagen" onPress={pickPdfOrImage} />
        <MedButton title="Elegir desde galería" variant="secondary" onPress={pickFromGallery} />
      </View>

      <Text style={styles.sectionTitle}>Adjuntos cargados</Text>

      {documents.length === 0 ? (
        <View style={styles.emptyCard}>
          <BrandMark dark size={56} compact />
          <Text style={styles.emptyTitle}>Todavía no hay documentos</Text>
          <Text style={styles.emptyText}>Cuando adjuntes uno, aparecerá en esta lista.</Text>
        </View>
      ) : (
        documents.map((doc, index) => (
          <View key={`${doc.uri}-${index}`} style={styles.documentRow}>
            {doc.mimeType?.includes("image") ? <Image source={{ uri: doc.uri }} style={styles.thumb} /> : <View style={styles.pdf}><Text style={styles.pdfText}>PDF</Text></View>}
            <View style={styles.docInfo}>
              <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
              <Text style={styles.docMeta}>{DOC_TYPES.find((x) => x.key === doc.type)?.label} · {formatSize(doc.size)}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function formatSize(size?: number) {
  if (!size) return "sin tamaño";
  if (size < 1024) return `${size} B`;
  return `${Math.round(size / 1024)} KB`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#130A24",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 62,
    paddingBottom: 130,
  },
  kicker: {
    color: "#C7B4FF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 5,
    marginBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 43,
    fontWeight: "800",
    letterSpacing: -1.4,
    marginBottom: 16,
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 21,
    lineHeight: 31,
    fontWeight: "700",
    marginBottom: 28,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(199,180,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.045)",
    padding: 24,
    gap: 16,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
  },
  cardText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  dropdown: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(199,180,255,0.24)",
    backgroundColor: "rgba(255,255,255,0.07)",
    padding: 18,
  },
  dropdownLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
  },
  dropdownValue: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  option: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(199,180,255,0.24)",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionActive: {
    backgroundColor: "#FBC02D",
    borderColor: "#FBC02D",
  },
  optionText: {
    color: "#D9C8FF",
    fontWeight: "800",
  },
  optionTextActive: {
    color: "#211233",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 30,
    marginBottom: 16,
  },
  emptyCard: {
    minHeight: 210,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(199,180,255,0.20)",
    backgroundColor: "rgba(255,255,255,0.035)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 18,
    textAlign: "center",
  },
  emptyText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  documentRow: {
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(199,180,255,0.16)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  thumb: {
    width: 54,
    height: 54,
    borderRadius: 14,
  },
  pdf: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.16)",
  },
  pdfText: {
    color: "#FFB4B4",
    fontWeight: "900",
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  docMeta: {
    color: "rgba(255,255,255,0.58)",
    fontWeight: "700",
  },
});
