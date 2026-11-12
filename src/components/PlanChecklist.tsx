import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import it from '@/i18n/it';
import { formatClock } from '@/plan/time';
import type { PlanItem, PlanItemKey } from '@/plan/types';
import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { planItemStyle } from './planStyle';

interface Props {
  items: PlanItem[];
  done: ReadonlySet<PlanItemKey>;
  nextKey: PlanItemKey | null;
  onToggle: (key: PlanItemKey, done: boolean) => void;
}

/** Azioni del piano con spunta. La prossima azione da fare è evidenziata. */
export function PlanChecklist({ items, done, nextKey, onToggle }: Props) {
  return (
    <View style={styles.list}>
      {items.map((item) => {
        const isDone = done.has(item.key);
        const isNext = item.key === nextKey;
        const s = it.plan.items[item.key];
        const style = planItemStyle(item.key);
        return (
          <Pressable
            key={item.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onToggle(item.key, !isDone);
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isDone }}
            accessibilityLabel={`${formatClock(item.time)}, ${isDone ? it.today.markUndone(s.title) : it.today.markDone(s.title)}`}
            style={({ pressed }) => [styles.row, isNext && styles.next, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.check, isDone && styles.checkOn]}>
              {isDone ? <Ionicons name="checkmark" size={18} color={colors.onAccent} /> : null}
            </View>
            <View style={[styles.texts, isDone && { opacity: 0.5 }]}>
              <View style={styles.topLine}>
                <AppText variant="label" color={colors.accent}>
                  {formatClock(item.time)}
                </AppText>
                <Text style={styles.icon}>{style.icon}</Text>
                {isNext ? (
                  <View style={styles.nextBadge}>
                    <AppText variant="caption" color={colors.onAccent}>
                      {it.today.next}
                    </AppText>
                  </View>
                ) : null}
              </View>
              <AppText variant="bodyMedium" style={isDone && styles.strike}>
                {s.title}
              </AppText>
              {!isDone ? <AppText variant="caption">{s.why}</AppText> : null}
            </View>
          </Pressable>
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
    borderWidth: 2,
    borderColor: colors.surface,
    padding: spacing.md,
  },
  next: { borderColor: colors.accent },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  texts: { flex: 1, gap: 2 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { fontSize: 16 },
  nextBadge: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 8 },
  strike: { textDecorationLine: 'line-through' },
});
