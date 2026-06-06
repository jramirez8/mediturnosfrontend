import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  onToggleSecure?: () => void;
  secureVisible?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "number-pad";
  icon?: React.ReactNode;
};

export default function MedInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  onToggleSecure,
  secureVisible,
  keyboardType = "default",
  icon,
}: Props) {
  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A7A0B8"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          style={styles.input}
        />
        {onToggleSecure ? (
          <Pressable onPress={onToggleSecure} hitSlop={12} style={styles.eyeButton}>
            <Text style={styles.eye}>{secureVisible ? "◉" : "◎"}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 10,
    marginBottom: 18,
  },
  label: {
    color: "#2B174D",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  inputWrap: {
    minHeight: 62,
    borderRadius: 18,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.62)",
    borderWidth: 1,
    borderColor: "rgba(126,58,242,0.16)",
    shadowColor: "#2D145F",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  icon: {
    width: 32,
    alignItems: "flex-start",
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#2B174D",
    fontSize: 20,
    fontWeight: "500",
    letterSpacing: 2,
  },
  eyeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  eye: {
    color: "#7434D9",
    fontSize: 22,
    fontWeight: "900",
  },
});
