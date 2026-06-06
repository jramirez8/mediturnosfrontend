import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type SplashGateProps = PropsWithChildren<{
  minimumMs?: number;
  dark?: boolean;
}>;

export default function SplashGate({ children, minimumMs = 1100, dark = true }: SplashGateProps) {
  const [showSplash, setShowSplash] = useState(true);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 55,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start(() => setShowSplash(false));
    }, minimumMs);

    return () => clearTimeout(timeout);
  }, [minimumMs, opacity, scale]);

  if (!showSplash) return <>{children}</>;

  return (
    <LinearGradient
      colors={dark ? ["#120522", "#241044", "#3B1672"] : ["#F8F3FF", "#EFE7FF", "#FFFFFF"]}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>

        <Text style={[styles.brand, { color: dark ? "#FFFFFF" : "#25113F" }]}>Mediturnos</Text>
        <Text style={[styles.subtitle, { color: dark ? "#D9C8FF" : "#6F6384" }]}>Turnos médicos simples y seguros</Text>

        <View style={[styles.loaderTrack, { backgroundColor: dark ? "rgba(255,255,255,0.14)" : "rgba(126,58,242,0.12)" }]}> 
          <View style={styles.loaderFill} />
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  brand: {
    marginTop: 28,
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    textAlign: "center",
  },
  loaderTrack: {
    marginTop: 34,
    width: 180,
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  loaderFill: {
    width: "62%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#A855F7",
  },
});
