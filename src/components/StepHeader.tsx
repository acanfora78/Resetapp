import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import it from '@/i18n/it';
import { colors, radius } from '@/theme';

import { AppText } from './AppText';

interface Props {
  step: number;
  title?: string;
  subtitle?: string;
  /** false solo per il caricamento (e il benvenuto, che non ha un passo precedente). */
  showBack?: boolean;
}

/** Intestazione dei passi dell'onboarding con barra di avanzamento. */
export function StepHeader({ step, title, subtitle, showBack = true }: Props) {
  const total = it.onboarding.totalSteps;
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        {showBack && router.canGoBack() ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={it.common.back}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
        ) : (
          <View style={{ width: 26 }} />
        )}
        <AppText variant="caption">{it.common.step(step, total)}</AppText>
        <View style={{ width: 26 }} />
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(step / total) * 100}%` }]} />
      </View>
      {title ? <AppText variant="title">{title}</AppText> : null}
      {subtitle ? <AppText secondary>{subtitle}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, marginBottom: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  track: { height: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: colors.accent, borderRadius: radius.pill },
});
