import * as Haptics from 'expo-haptics';
import { addDays, startOfDay } from 'date-fns';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PickerField } from '@/components/PickerField';
import { Screen } from '@/components/Screen';
import { SleepBars } from '@/components/SleepBars';
import { TextField } from '@/components/TextField';
import it from '@/i18n/it';
import type { SleepLogRow } from '@/lib/database.types';
import { errorText } from '@/lib/errors';
import { usePlanData } from '@/lib/planData';
import { useSession, useUserId } from '@/lib/session';
import { fetchSleepLogs, saveSleepLog } from '@/lib/userData';
import { loadStreak } from '@/lib/streak';
import { toISODate } from '@/plan/cycle';
import { RULES } from '@/plan/rules';
import { formatDebt, sleepDebt } from '@/plan/sleepDebt';
import { atClock } from '@/plan/time';
import { makeStyles, radius, spacing, useColors } from '@/theme';

/** Diario: inserimento rapido del sonno, debito della settimana e grafico. */
export default function Diary() {
  const colors = useColors();
  const styles = useStyles();
  const userId = useUserId();
  const { profile } = useSession();
  const { reload } = usePlanData();
  const [bed, setBed] = useState('23:00');
  const [wake, setWake] = useState('07:00');
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState('');
  const [logs, setLogs] = useState<SleepLogRow[]>([]);
  const [saving, setSaving] = useState(false);

  const need = profile?.fabbisogno_sonno_min ?? RULES.DEFAULT_SLEEP_NEED_MIN;

  const [streakDays, setStreakDays] = useState(0);

  const load = useCallback(async () => {
    try {
      setLogs(await fetchSleepLogs(toISODate(addDays(new Date(), -RULES.SLEEP_DEBT_DAYS))));
    } catch {
      // restano i dati già mostrati
    }
    if (!profile) return;
    loadStreak(profile)
      .then(setStreakDays)
      .catch(() => {});
  }, [profile]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const save = async () => {
    const today = startOfDay(new Date());
    const wakeAt = atClock(today, wake);
    let bedAt = atClock(today, bed);
    if (bedAt >= wakeAt) bedAt = addDays(bedAt, -1); // a letto la sera prima
    const minutes = (wakeAt.getTime() - bedAt.getTime()) / 60000;
    if (minutes <= 0 || minutes > 16 * 60) return Alert.alert(it.diary.invalid);
    setSaving(true);
    try {
      await saveSleepLog(userId, { data: toISODate(today), a_letto: bedAt, sveglia: wakeAt, energia: energy, note: note.trim() || null });
      setNote('');
      await load();
      reload(); // il recupero del debito entra nel piano dei prossimi riposi
      Alert.alert(it.diary.saved);
    } catch (e) {
      Alert.alert(it.common.error, errorText(e));
    } finally {
      setSaving(false);
    }
  };

  const debtDays = new Set(sleepDebt([], need, new Date()).perDay.map((d) => d.data));
  const logged = logs.filter((l) => debtDays.has(l.data));
  const avgSleep = logged.length ? logged.reduce((a, l) => a + l.minuti_dormiti, 0) / logged.length : null;
  const avgEnergy = logged.length ? logged.reduce((a, l) => a + l.energia, 0) / logged.length : null;
  const energyColor = (e: number) => (e >= 4 ? colors.shift.S : e === 3 ? colors.accent : colors.danger);

  const debt = sleepDebt(logs.map((l) => ({ data: l.data, minutes: l.minuti_dormiti })), need, new Date());

  return (
    <Screen edges={['top']}>
      <AppText variant="title">{it.diary.title}</AppText>

      <View style={styles.card}>
        <AppText variant="heading">{it.diary.quickTitle}</AppText>
        <View style={styles.row}>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="caption">{it.diary.bed}</AppText>
            <PickerField mode="time" compact value={bed} onChange={setBed} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="caption">{it.diary.wake}</AppText>
            <PickerField mode="time" compact value={wake} onChange={setWake} />
          </View>
        </View>
        <AppText variant="caption">{it.diary.energy}</AppText>
        <View style={styles.energyRow}>
          {[1, 2, 3, 4, 5].map((n) => {
            const on = n === energy;
            return (
              <Pressable
                key={n}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setEnergy(n);
                }}
                style={[styles.energy, on && styles.energyOn]}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${it.diary.energy} ${n}: ${it.diary.energyLabels[n - 1]}`}
              >
                <AppText variant="heading" color={on ? colors.onAccent : colors.text}>
                  {n}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText variant="caption" center>
          {it.diary.energyLabels[energy - 1]}
        </AppText>
        <TextField placeholder={it.diary.notePlaceholder} value={note} onChangeText={setNote} />
        <Button title={it.diary.save} onPress={save} loading={saving} />
      </View>

      <View style={[styles.card, styles.streak]}>
        <AppText variant="heading">🔥 {it.diary.streak(streakDays)}</AppText>
        <AppText variant="caption">{it.diary.streakHint}</AppText>
      </View>

      <View style={styles.card}>
        <AppText variant="heading">{it.diary.debtTitle}</AppText>
        <AppText variant="bodyMedium" color={debt.totalMin > 0 ? colors.accent : colors.shift.S}>
          {debt.totalMin > 0 ? it.diary.debtWeek(formatDebt(debt.totalMin)) : it.diary.noDebt}
        </AppText>
        {debt.totalMin > 0 ? <AppText variant="caption">{it.diary.debtNote}</AppText> : null}
        <AppText variant="label" secondary>
          {it.diary.chartTitle}
        </AppText>
        <SleepBars days={debt.perDay} needMin={need} />
        {avgSleep !== null ? (
          <AppText variant="caption">{it.diary.avg(it.onboarding.habits.hours(Math.round(avgSleep / 30) * 30), avgEnergy!.toFixed(1).replace('.', ','))}</AppText>
        ) : null}
        <AppText variant="label" secondary>
          {it.diary.energyTitle}
        </AppText>
        <View style={styles.energyWeek}>
          {debt.perDay.map((d) => {
            const log = logs.find((l) => l.data === d.data);
            return (
              <View key={d.data} style={[styles.energyCell, log && { backgroundColor: energyColor(log.energia) }]}>
                <AppText variant="label" color={log ? colors.onAccent : colors.textMuted}>
                  {log ? log.energia : '–'}
                </AppText>
              </View>
            );
          })}
        </View>
        <AppText variant="caption">{it.diary.estimateNote}</AppText>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  energyRow: { flexDirection: 'row', gap: spacing.sm },
  energy: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyOn: { backgroundColor: colors.accent },
  streak: { gap: 2 },
  energyWeek: { flexDirection: 'row', gap: 6 },
  energyCell: {
    flex: 1,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
