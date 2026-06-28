import React from "react";
import { StyleSheet, Text, View } from "react-native";

type EmptyStateMarkProps = Readonly<{
  dark?: boolean;
  size?: number;
}>;

export default function EmptyStateMark({ dark = false, size = 72 }: EmptyStateMarkProps) {
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size * 0.34,
          backgroundColor: dark ? "rgba(199,180,255,0.16)" : "rgba(126,58,242,0.1)",
          borderColor: dark ? "rgba(199,180,255,0.22)" : "rgba(126,58,242,0.16)",
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: size * 0.39,
            color: dark ? "#C7B4FF" : "#7E3AF2",
          },
        ]}
      >
        M+
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 24,
  },
  text: {
    fontWeight: "800",
    letterSpacing: -1,
  },
});

