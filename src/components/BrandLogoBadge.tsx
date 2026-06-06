import React from "react";
import { Image, StyleSheet, View } from "react-native";

type BrandLogoBadgeProps = {
  dark?: boolean;
  size?: number;
};

export default function BrandLogoBadge({ dark = false, size = 58 }: BrandLogoBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: dark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.72)",
          borderColor: dark ? "rgba(255,255,255,0.16)" : "rgba(126,58,242,0.14)",
        },
      ]}
    >
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#7E3AF2",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
