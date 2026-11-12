import { format, isSameDay } from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PlanChecklist } from '@/components/PlanChecklist';
import { ShiftBadge } from '@/components/ShiftBadge';
import it from '@/i18n/it';
import { fetchCheckIds, setCheck } from '@/lib/checks';
import { errorText } from '@/lib/errors';
import { useNightMode } from '@/lib/nightMode';
import { notificationPrefs, openSystemSettings, requestPermission } from '@/lib/notifications';
import { usePlanData } from '@/lib/planData';
import { updateProfile } from '@/lib/profile';
import { useSession, useUserId } from '@/lib/session';
import { planForDay } from '@/plan/context';
import { toISODate } from '@/plan/cycle';
import { capitalizeFirst } from '@/plan/time';
import { currentPlanDay, nextPendingItem } from '@/plan/today';
import { isWorkShift } from '@/plan/types';
import type { PlanItemKey } from '@/plan/types';
import { colors, radius, spacing } from '@/theme';

const TICK_MS = 60_000;

/** Oggi: turno del giorno e azioni del piano con spunta. */
export default function Today() {
  const userId = useUserId();
  const { profile, refreshProfile } = useSession();
  const { ctx, error, loading, reload, resync } = usePlanData();
  const night = useNightMode();
  const [now, setNow] = useState(() => new Date());
  const [done, setDone] = useState<Set<PlanItemKey>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // L'orario "adesso" si aggiorna ogni minuto e quando si torna sulla schermata.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(t);
  }, []);
  useFocusEffect(useCallback(() => setNow(new Date()), []));

  const planDay = useMemo(() => (ctx ? currentPlanDay(ctx, now) : now), [ctx, now]);
  const planDayISO = toISODate(planDay);
  const items = useMemo(() => (ctx ? planForDay(ctx, planDay) : []), [ctx, planDay]);
  const isYesterday = !isSameDay(planDay, now);

  const loadChecks = useCallback(async () => {
    try {
      const ids = await fetchCheckIds(planDayISO, planDayISO);
      const prefix = `${planDayISO}_`;
      setDone(new Set([...ids].map((id) => id.slice(prefix.length) as PlanItemKey)));
    } catch {
      // le spunte restano quelle già mostrate
    }
  }, [planDayISO]);

  useFocusEffect(
    useCallback(() => {
      loadChecks();
    }, [loadChecks]),
  );

  const toggle = async (key: PlanItemKey, value: boolean) => {
    setDone((d) => {
      const n = new Set(d);
      if (value) n.add(key);
      else n.delete(key);
      return n;
    });
    try {
      await setCheck(userId, planDayISO, key, value);
      resync(); // una spunta toglie il promemoria di quell'azione
    } catch (e) {
      setDone((d) => {
        const n = new Set(d);
        if (value) n.delete(key);
        else n.add(key);
        return n;
      });
      Alert.alert(it.common.error, errorText(e));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setNow(new Date());
    await Promise.all([reload(), loadChecks()]);
    setRefreshing(false);
  };

  const prefs = notificationPrefs(profile);
  const askNotifications = prefs.abilitate === undefined;

  const enableNotifications = async () => {
    const res = await requestPermission();
    await updateProfile(userId, { notifiche: { ...prefs, abilitate: res === 'granted' } });
    await refreshProfile();
    if (res === 'denied') {
      Alert.alert(it.notifications.deniedTitle, it.notifications.deniedBody, [
        { text: it.common.cancel, style: 'cancel' },
        { text: it.notifications.openSettings, onPress: openSystemSettings },
      ]);
    }
  };

  const skipNotifications = async () => {
    await updateProfile(userId, { notifiche: { ...prefs, abilitate: false } });
    await refreshProfile();
  };

  const shift = ctx?.shiftOn(planDay) ?? null;
  const hours = ctx && shift && isWorkShift(shift) ? ctx.shiftHours[shift] : null;
  const next = nextPendingItem(items, done, now);
  const doneCount = items.filter((i) => done.has(i.key)).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <View style={styles.topRow}>
          <AppText variant="caption">{capitalizeFirst(format(now, 'EEEE d MMMM', { locale: itLocale }))}</AppText>
          {night.active ? (
            <View style={styles.nightChip}>
              <AppText variant="caption" color={colors.text}>
                🌙 {it.today.nightModeOn}
              </AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="title">{it.today.greeting(profile?.nome ?? null)}</AppText>

        {!ctx && loading ? <ActivityIndicator color={colors.accent} /> : null}
        {!ctx && error && !loading ? (
          <Pressable onPress={reload} style={styles.card}>
            <AppText variant="label" color={colors.danger}>
              {it.today.loadError}
            </AppText>
            <AppText variant="caption">{`${it.today.tapToRetry}\n${errorText(error)}`}</AppText>
          </Pressable>
        ) : null}

        {ctx ? (
          <>
            <View style={[styles.card, styles.shiftRow]}>
              {shift ? <ShiftBadge code={shift} size={44} /> : null}
              <View style={{ flex: 1 }}>
                <AppText variant="heading">
                  {shift
                    ? (isYesterday ? (shift === 'N' ? it.today.nightShiftOf : it.today.yesterdayOf) : it.today.shiftOf)(
                        it.shifts.names[shift],
                      )
                    : it.today.noShift}
                </AppText>
                {hours ? <AppText secondary>{`${hours.start}–${hours.end}`}</AppText> : null}
              </View>
            </View>

            {askNotifications ? (
              <View style={[styles.card, styles.notifCard]}>
                <AppText variant="bodyMedium">🔔 {it.today.notifCard.title}</AppText>
                <AppText variant="caption">{it.today.notifCard.body}</AppText>
                <View style={styles.notifButtons}>
                  <Button title={it.today.notifCard.enable} onPress={enableNotifications} style={{ flex: 1 }} />
                  <Button variant="ghost" title={it.today.notifCard.later} onPress={skipNotifications} style={{ flex: 1 }} />
                </View>
              </View>
            ) : null}

            <View style={styles.sectionHeader}>
              <AppText variant="label" secondary>
                {isYesterday ? (shift === 'N' ? it.today.nightPlanTitle : it.today.eveningPlanTitle) : it.today.planTitle}
              </AppText>
              <AppText variant="caption">{it.today.progress(doneCount, items.length)}</AppText>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${items.length ? (doneCount / items.length) * 100 : 0}%` }]} />
            </View>
            {items.length > 0 && doneCount === items.length ? (
              <AppText variant="bodyMedium" color={colors.accent}>
                {it.today.allDone}
              </AppText>
            ) : null}

            <PlanChecklist items={items} done={done} nextKey={next?.key ?? null} onToggle={toggle} />
            <AppText variant="caption">{it.today.comingSoon}</AppText>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nightChip: { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 2 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: 4 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  notifCard: { gap: spacing.sm, borderWidth: 1, borderColor: colors.accent },
  notifButtons: { flexDirection: 'row', gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: 6, borderRadius: radius.pill, backgroundColor: colors.accent },
});
