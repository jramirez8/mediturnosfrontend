import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

type Variant = "primary" | "secondary" | "danger";

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  arrow?: boolean;
};

export default function MedButton({ title, onPress, variant = "primary", arrow = false }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.button, styles[variant]]}>
      <Text style={[styles.text, styles[`${variant}Text` as const]]}>{title}</Text>
      {arrow ? <Text style={styles.arrow}>→</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 18,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  text: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  primary: {
    backgroundColor: "#7E35F2",
    shadowColor: "#6D28D9",
    shadowOpacity: 0.26,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },
  primaryText: {
    color: "#FFFFFF",
  },
  secondary: {
    backgroundColor: "rgba(255,255,255,0.56)",
    borderWidth: 1.5,
    borderColor: "rgba(126,58,242,0.48)",
  },
  secondaryText: {
    color: "#6D28D9",
  },
  danger: {
    backgroundColor: "rgba(255,255,255,0.58)",
    borderWidth: 1.5,
    borderColor: "rgba(220,38,38,0.25)",
  },
  dangerText: {
    color: "#C23B3B",
  },
  arrow: {
    color: "#FFFFFF",
    fontSize: 40,
    lineHeight: 42,
    fontWeight: "300",
  },
});
