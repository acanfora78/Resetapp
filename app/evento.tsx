import { Ionicons } from '@expo/vector-icons';
import { addDays, addMinutes, startOfDay } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PickerField } from '@/components/PickerField';
import { Screen } from '@/components/Screen';
import { Stepper } from '@/components/Stepper';
import { TextField } from '@/components/TextField';
import it from '@/i18n/it';
import { errorText } from '@/lib/errors';
import { usePlanData } from '@/lib/planData';
import { useUserId } from '@/lib/session';
import { saveEvent } from '@/lib/userData';
import { fromISODate } from '@/plan/cycle';
import { evaluateEvent } from '@/plan/events';
import type { EventAssessment, EventReason, EventTip } from '@/plan/events';
import { atClock, formatClock } from '@/plan/time';
import { makeStyles, radius, spacing, useColors } from '@/theme';

const MAX_DURATION_MIN = 24 * 60;

function reasonText(r: EventReason): string {
  const t = it.events.reason;
  switch (r.key) {
    case 'on_shift':
      return t.on_shift(it.shifts.names[r.shift]);
    case 'free':
      return t.free;
    case 'before_early':
      return t.before_early(formatClock(r.end), it.shifts.names[r.shift], formatClock(r.shiftStart), it.events.hours(r.sleepMin));
    case 'during_day_sleep':
      return t.during_day_sleep;
    case 'during_short_sleep':
      return t.during_short_sleep;
    case 'pre_night_nap':
      return t.pre_night_nap(formatClock(r.departure));
    case 'late_free':
      return t.late_free(formatClock(r.wake));
    case 'cuts_sleep':
      return t.cuts_sleep(it.events.hours(Math.max(0, r.sleepMin)));
  }
}

function tipText(tip: EventTip): string {
  const t = it.events.tip;
  switch (tip.key) {
    case 'nap':
      return t.nap(formatClock(tip.time), tip.durationMin);
    case 'wake':
      return t.wake(formatClock(tip.time));
    case 'bed':
      return t.bed(formatClock(tip.time));
    case 'caffeine':
      return t.caffeine(formatClock(tip.time));
    case 'sleep_after':
      return t.sleep_after(formatClock(tip.time));
    case 'next_day':
      return t.next_day(formatClock(tip.napTime));
  }
}

/** "Posso andarci?": valuta un evento rispetto a turni e sonno, e lo salva. */
export default function EventPlanner() {
  const colors = useColors();
  const styles = useStyles();
  const userId = useUserId();
  const { ctx, reload } = usePlanData();
  const params = useLocalSearchParams<{ d?: string }>();

  const [title, setTitle] = useState('');
  const [day, setDay] = useState(params.d ? fromISODate(params.d) : startOfDay(addDays(new Date(), 1)));
  const [start, setStart] = useState('21:00');
  const [duration, setDuration] = useState(180);
  const [result, setResult] = useState<EventAssessment | null>(null);
  const [saving, setSaving] = useState(false);

  const event = () => {
    const s = atClock(day, start);
    return { title: title.trim(), start: s, end: addMinutes(s, duration) };
  };

  const check = () => {
    if (!ctx) return;
    setResult(evaluateEvent(ctx, event()));
  };

  const save = async () => {
    const ev = event();
    if (!ev.title) return Alert.alert(it.events.titleMissing);
    setSaving(true);
    try {
      await saveEvent(userId, ev.title, ev.start, ev.end);
      await reload(); // gli accorgimenti entrano nel piano e nei promemoria
      Alert.alert(it.events.saved);
      router.back();
    } catch (e) {
      Alert.alert(it.common.error, errorText(e));
      setSaving(false);
    }
  };

  const verdictColor =
    result?.verdict === 'yes' ? colors.shift.S : result?.verdict === 'yes_tips' ? colors.accent : colors.danger;

  return (
    <Screen
      footer={
        result && result.verdict !== 'on_shift' ? (
          <Button title={it.events.save} onPress={save} loading={saving} disabled={!title.trim()} />
        ) : (
          <Button title={it.events.check} onPress={check} disabled={!ctx} />
        )
      }
    >
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={it.common.back}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>
      <AppText variant="title">{it.events.screenTitle}</AppText>
      <AppText secondary>{it.events.subtitle}</AppText>

      <TextField
        label={it.events.titleLabel}
        placeholder={it.events.titlePlaceholder}
        value={title}
        onChangeText={(v) => {
          setTitle(v);
        }}
      />
      <PickerField
        mode="date"
        label={it.events.dayLabel}
        value={day}
        onChange={(d) => {
          setDay(startOfDay(d));
          setResult(null);
        }}
      />
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 6 }}>
          <AppText variant="label">{it.events.startLabel}</AppText>
          <PickerField
            mode="time"
            compact
            value={start}
            onChange={(v) => {
              setStart(v);
              setResult(null);
            }}
          />
        </View>
        <View style={{ flex: 1.4, gap: 6 }}>
          <AppText variant="label">{it.events.durationLabel}</AppText>
          <Stepper
            value={duration}
            onChange={(v) => {
              setDuration(v);
              setResult(null);
            }}
            step={30}
            min={30}
            max={MAX_DURATION_MIN}
            format={it.events.duration}
          />
        </View>
      </View>

      {result ? (
        <View style={[styles.card, { borderColor: verdictColor }]}>
          <AppText variant="heading" color={verdictColor}>
            {it.events.verdict[result.verdict]}
          </AppText>
          <AppText>{reasonText(result.reason)}</AppText>
          {result.tips.map((tip, i) => (
            <View key={i} style={styles.tip}>
              <AppText color={colors.accent}>•</AppText>
              <AppText style={{ flex: 1 }}>{tipText(tip)}</AppText>
            </View>
          ))}
          <Button variant="ghost" title={it.events.check} onPress={check} />
        </View>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    padding: spacing.md,
    gap: spacing.sm,
  },
  tip: { flexDirection: 'row', gap: spacing.sm },
}));
