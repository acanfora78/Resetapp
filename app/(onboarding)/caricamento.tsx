import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { StepHeader } from '@/components/StepHeader';
import it from '@/i18n/it';
import { colors, spacing } from '@/theme';

const LINE_INTERVAL_MS = 700;
const TOTAL_MS = 2700;

/** Onboarding, passo 6: "Sto creando il tuo piano…". Senza tasto indietro. */
export default function Loading() {
  const spin = useRef(new Animated.Value(0)).current;
  const [done, setDone] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    const timers = it.onboarding.loading.lines.map((_, i) =>
      setTimeout(() => setDone(i + 1), LINE_INTERVAL_MS * (i + 1)),
    );
    timers.push(setTimeout(() => router.replace('/anteprima'), TOTAL_MS));
    return () => {
      loop.stop();
      timers.forEach(clearTimeout);
    };
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Screen scroll={false}>
      <StepHeader step={6} showBack={false} />
      <View style={styles.center}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Image
            source={require('../../assets/brand/reset-simbolo-1024.png')}
            style={styles.logo}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
        </Animated.View>
        <AppText variant="heading" center>
          {it.onboarding.loading.title}
        </AppText>
        <View style={styles.lines}>
          {it.onboarding.loading.lines.map((line, i) => {
            const ok = done > i;
            return (
              <View key={line} style={[styles.line, { opacity: ok ? 1 : 0.35 }]}>
                <Ionicons
                  name={ok ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={ok ? colors.accent : colors.textMuted}
                />
                <AppText variant="bodyMedium">{line}</AppText>
              </View>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  logo: { width: 120, height: 120 },
  lines: { gap: spacing.md, alignSelf: 'center' },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
