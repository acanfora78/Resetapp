import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PlanTimeline } from '@/components/PlanTimeline';
import { Screen } from '@/components/Screen';
import { ShiftBadge } from '@/components/ShiftBadge';
import it from '@/i18n/it';
import { usePlanData } from '@/lib/planData';
import { planForDay } from '@/plan/context';
import { toISODate } from '@/plan/cycle';
import { capitalizeFirst } from '@/plan/time';
import { detectTransitions } from '@/plan/transitions';
import { makeStyles, radius, spacing, useColors } from '@/theme';

/** "Prossimi 3 giorni": timeline per giorno intorno a un cambio turno. */
export default function TransitionScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { ctx } = usePlanData();
  const { d } = useLocalSearchParams<{ d: string }>();

  const transition = ctx ? detectTransitions(ctx, new Date()).find((t) => toISODate(t.date) === d) : null;

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={it.common.back}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>
      <AppText variant="title">{it.transitions.screenTitle}</AppText>
      {!ctx ? <ActivityIndicator color={colors.accent} /> : null}
      {transition ? (
        <>
          <AppText variant="bodyMedium">{it.transitions.card[transition.type]}</AppText>
          <AppText secondary>{it.transitions.intro[transition.type]}</AppText>
          {transition.days.map((day, i) => {
            const shift = ctx!.shiftOn(day);
            return (
              <View key={toISODate(day)} style={styles.day}>
                <View style={styles.dayHeader}>
                  {shift ? <ShiftBadge code={shift} size={30} /> : null}
                  <AppText variant="heading" style={{ flex: 1 }}>
                    {capitalizeFirst(format(day, 'EEEE d MMMM', { locale: itLocale }))}
                  </AppText>
                  <AppText variant="caption">{shift ? it.shifts.names[shift] : it.shifts.freeDay}</AppText>
                </View>
                <PlanTimeline items={planForDay(ctx!, day)} startIndex={i * 3} />
              </View>
            );
          })}
        </>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  day: { gap: spacing.sm, marginTop: spacing.sm },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    borderRadius: radius.sm,
  },
}));
