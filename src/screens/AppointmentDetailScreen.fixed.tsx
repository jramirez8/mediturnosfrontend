import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MedButton from "../components/MedButton";

/**
 * Detalle de turno actualizado a la estética nueva.
 * Incluye fondo, header redondeado, card glass y bottom nav seguro.
 */
export default function AppointmentDetailScreenFixed() {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.back}>←</Text>
          <Text style={styles.headerTitle}>Detalle de turno</Text>
        </View>

        <View style={styles.doctorCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>DR</Text></View>
          <View>
            <Text style={styles.doctorName}>Javier Lopez</Text>
            <Text style={styles.specialty}>Cardiología</Text>
          </View>
        </View>

        <InfoCard label="Fecha y hora" value="📅 2026-04-16 a las 13:00" />
        <InfoCard label="Sede" value="📍 María Auxiliadora" />
        <InfoCard label="Estado" value="CONFIRMADO" />

        <View style={styles.actions}>
          <MedButton title="Reprogramar turno" />
          <MedButton title="Cancelar turno" variant="danger" />
        </View>
      </ScrollView>
    </View>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FBF9FF",
  },
  content: {
    paddingBottom: 116,
  },
  header: {
    minHeight: 168,
    backgroundColor: "#7E35F2",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingTop: 62,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 22,
  },
  back: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 44,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 44,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  doctorCard: {
    marginTop: 26,
    marginHorizontal: 26,
    borderRadius: 22,
    backgroundColor: "#7E35F2",
    padding: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    shadowColor: "#2D145F",
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "500",
  },
  doctorName: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
    marginBottom: 8,
  },
  specialty: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 17,
    fontWeight: "700",
  },
  infoCard: {
    marginTop: 22,
    marginHorizontal: 26,
    borderRadius: 18,
    backgroundColor: "rgba(126,58,242,0.07)",
    borderWidth: 1,
    borderColor: "rgba(126,58,242,0.22)",
    padding: 20,
  },
  infoLabel: {
    color: "#8057C8",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
  },
  infoValue: {
    color: "#302A3A",
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 1,
  },
  actions: {
    marginTop: 30,
    marginHorizontal: 26,
  },
});
