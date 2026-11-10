import { StyleSheet, View } from 'react-native';

import it from '@/i18n/it';
import { formatClock } from '@/plan/time';
import type { PlanItem } from '@/plan/types';
import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';

export function PlanList({ items }: { items: PlanItem[] }) {
  return (
    <View style={styles.list}>
      {items.map((item) => {
        const s = it.plan.items[item.key];
        return (
          <View key={`${item.key}-${item.time.getTime()}`} style={styles.row}>
            <AppText variant="label" color={colors.accent} style={styles.time}>
              {formatClock(item.time)}
            </AppText>
            <View style={styles.texts}>
              <AppText variant="bodyMedium">{s.title}</AppText>
              <AppText variant="caption">{s.why}</AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  time: { width: 48, marginTop: 2 },
  texts: { flex: 1, gap: 2 },
});
