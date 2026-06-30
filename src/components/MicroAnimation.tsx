import React from 'react';
import { Animated, Easing, Platform, StyleProp, ViewStyle } from 'react-native';

type AnimatedEntranceProps = Readonly<{
  children: React.ReactNode;
  distance?: number;
  duration?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}>;

const canUseNativeDriver = Platform.OS !== 'web';

export function AnimatedEntrance({ children, distance = 8, duration = 180, delay = 0, style }: AnimatedEntranceProps) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(distance)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: canUseNativeDriver,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: canUseNativeDriver,
      }),
    ]).start();
  }, [delay, duration, opacity, translateY]);

  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export function AnimatedPopup({ children, style }: Readonly<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }>) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(10)).current;
  const scale = React.useRef(new Animated.Value(0.985)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: canUseNativeDriver,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: canUseNativeDriver,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: canUseNativeDriver,
      }),
    ]).start();
  }, [opacity, scale, translateY]);

  return <Animated.View style={[style, { opacity, transform: [{ translateY }, { scale }] }]}>{children}</Animated.View>;
}
