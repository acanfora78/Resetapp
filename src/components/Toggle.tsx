import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { accentGradientOf, useColors } from '@/theme';

const TRACK_W = 52;
const TRACK_H = 32;
const THUMB = 26;
const PAD = (TRACK_H - THUMB) / 2;

interface Props {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
}

/**
 * Interruttore unico dell'app. Acceso: traccia con il gradiente del brand e
 * pallino chiaro. Spento: traccia grigio-blu visibile. Vibrazione leggera al cambio.
 */
export function Toggle({ value, onValueChange, disabled, accessibilityLabel }: Props) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [anim, value]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [PAD, TRACK_W - THUMB - PAD] });
  const thumbColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.switchOffThumb, colors.switchOnThumb],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onValueChange(!value);
      }}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <View style={[styles.track, { backgroundColor: colors.switchOffTrack }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: anim }]}>
          <LinearGradient
            colors={accentGradientOf(colors)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View style={[styles.thumb, { backgroundColor: thumbColor, transform: [{ translateX }] }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: TRACK_W, height: TRACK_H, borderRadius: TRACK_H / 2, overflow: 'hidden', justifyContent: 'center' },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
