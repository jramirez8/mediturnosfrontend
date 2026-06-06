import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  size?: number;
  dark?: boolean;
  withText?: boolean;
  compact?: boolean;
};

export default function BrandMark({ size = 58, dark = false, withText = false, compact = false }: Props) {
  const iconSize = compact ? size : size;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.badge,
          {
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize * 0.28,
            backgroundColor: dark ? 'rgba(216,200,255,0.16)' : 'rgba(124,58,237,0.12)',
            borderColor: dark ? 'rgba(216,200,255,0.20)' : 'rgba(124,58,237,0.18)',
          },
        ]}
      >
        <Text
          style={[
            styles.mark,
            {
              fontSize: iconSize * 0.42,
              color: dark ? '#D9C8FF' : '#7C3AED',
            },
          ]}
        >
          M⁺
        </Text>
      </View>

      {withText ? (
        <Text style={[styles.name, { color: dark ? '#EEE8FF' : '#7C3AED' }]}>Mediturnos</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.20,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },
  mark: {
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
