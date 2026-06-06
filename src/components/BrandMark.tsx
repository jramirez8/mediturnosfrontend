import React from "react";
import { StyleSheet, Text, View } from "react-native";

/**
 * Marca minimalista SIN imagen blanca.
 * Usar en empty states, loaders, cards y cualquier fondo oscuro/claro.
 */
type Props = {
  dark?: boolean;
  size?: number;
  compact?: boolean;
};

export default function BrandMark({ dark = false, size = 64, compact = false }: Props) {
  return (
    <View
      style={[
        styles.root,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: dark ? "rgba(199,180,255,0.14)" : "rgba(126,58,242,0.10)",
          borderColor: dark ? "rgba(199,180,255,0.20)" : "rgba(126,58,242,0.18)",
        },
      ]}
    >
      <Text
        style={[
          styles.m,
          {
            fontSize: size * 0.36,
            color: dark ? "#C7B4FF" : "#7E3AF2",
          },
        ]}
      >
        M
      </Text>
      {!compact && (
        <Text
          style={[
            styles.plus,
            {
              fontSize: size * 0.20,
              color: dark ? "#E5D9FF" : "#9B5CF6",
            },
          ]}
        >
          +
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#7E3AF2",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  m: {
    fontWeight: "900",
    letterSpacing: -1,
  },
  plus: {
    position: "absolute",
    top: 10,
    right: 11,
    fontWeight: "900",
  },
});
