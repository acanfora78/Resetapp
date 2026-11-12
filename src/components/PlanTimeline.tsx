import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import it from '@/i18n/it';
import { formatClock } from '@/plan/time';
import type { PlanItem } from '@/plan/types';
import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { planItemStyle } from './planStyle';

const STAGGER_MS = 80;

/** Timeline verticale del piano: linea a sinistra, pallini colorati, icona, orario in arancione. */
export function PlanTimeline({ items, startIndex = 0 }: { items: PlanItem[]; startIndex?: number }) {
  return (
    <View>
      {items.map((item, i) => (
        <TimelineRow
          key={`${item.key}-${item.time.getTime()}`}
          item={item}
          index={startIndex + i}
          isLast={i === items.length - 1}
        />
      ))}
    </View>
  );
}

function TimelineRow({ item, index, isLast }: { item: PlanItem; index: number; isLast: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      delay: index * STAGGER_MS,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const style = planItemStyle(item.key);
  const s = it.plan.items[item.key];

  return (
    <Animated.View
      style={[
        styles.row,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      <View style={styles.rail}>
        <View style={[styles.dot, { backgroundColor: style.color }]} />
        {!isLast ? <View style={styles.line} /> : null}
      </View>
      <View style={styles.card}>
        <Text style={styles.icon}>{style.icon}</Text>
        <View style={styles.texts}>
          <AppText variant="label" color={colors.accent}>
            {formatClock(item.time)}
          </AppText>
          <AppText variant="bodyMedium">{s.title}</AppText>
          <AppText variant="caption">{s.why}</AppText>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  rail: { width: 16, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 20, borderWidth: 2, borderColor: colors.background },
  line: { flex: 1, width: 2, backgroundColor: colors.surfaceAlt, marginTop: 2 },
  card: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  icon: { fontSize: 22, marginTop: 2 },
  texts: { flex: 1, gap: 2 },
});
