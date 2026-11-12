import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { LayoutAnimation, Pressable, Text, View } from 'react-native';

import it from '@/i18n/it';
import { planText } from '@/i18n/planText';
import { formatClock } from '@/plan/time';
import type { PlanItem, PlanItemKey } from '@/plan/types';
import { makeStyles, radius, spacing, useColors } from '@/theme';

import { AppText } from './AppText';
import { planItemStyle } from './planStyle';

interface Props {
  /** Da fare: la prima è la prossima azione. */
  pending: PlanItem[];
  completed: PlanItem[];
  nextKey: PlanItemKey | null;
  onToggle: (key: PlanItemKey, done: boolean) => void;
}

/** Animazione morbida quando un'azione cambia gruppo. */
export const animateChecklist = () =>
  LayoutAnimation.configureNext(LayoutAnimation.create(260, 'easeInEaseOut', 'opacity'));

/**
 * Azioni del piano con spunta. In cima la prossima azione, poi le altre da fare;
 * le azioni fatte scendono nel gruppo ripiegabile "Fatte (n)".
 */
export function PlanChecklist({ pending, completed, nextKey, onToggle }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const [showDone, setShowDone] = useState(false);

  return (
    <View style={styles.list}>
      {pending.map((item) => (
        <Row key={item.key} item={item} done={false} isNext={item.key === nextKey} onToggle={onToggle} />
      ))}

      {completed.length > 0 ? (
        <>
          <Pressable
            onPress={() => {
              animateChecklist();
              setShowDone((v) => !v);
            }}
            style={styles.groupHeader}
            accessibilityRole="button"
            accessibilityState={{ expanded: showDone }}
          >
            <AppText variant="label" secondary>
              {it.today.doneGroup(completed.length)}
            </AppText>
            <Ionicons name={showDone ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
          </Pressable>
          {showDone
            ? completed.map((item) => (
                <Row key={item.key} item={item} done isNext={false} onToggle={onToggle} />
              ))
            : null}
        </>
      ) : null}
    </View>
  );
}

function Row({
  item,
  done,
  isNext,
  onToggle,
}: {
  item: PlanItem;
  done: boolean;
  isNext: boolean;
  onToggle: (key: PlanItemKey, done: boolean) => void;
}) {
  const colors = useColors();
  const styles = useStyles();
  const s = planText(item);
  const style = planItemStyle(item.key);
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        animateChecklist();
        onToggle(item.key, !done);
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={`${formatClock(item.time)}, ${done ? it.today.markUndone(s.title) : it.today.markDone(s.title)}`}
      style={({ pressed }) => [styles.row, isNext && styles.next, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.check, done && styles.checkOn]}>
        {done ? <Ionicons name="checkmark" size={18} color={colors.onAccent} /> : null}
      </View>
      <View style={[styles.texts, done && { opacity: 0.6 }]}>
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
        <AppText variant="bodyMedium" style={done && styles.strike}>
          {s.title}
        </AppText>
        {!done ? <AppText variant="caption">{s.why}</AppText> : null}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
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
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    minHeight: 44,
  },
}));
