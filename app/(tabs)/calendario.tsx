import { Ionicons } from '@expo/vector-icons';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ShiftBadge } from '@/components/ShiftBadge';
import it from '@/i18n/it';
import { errorText } from '@/lib/errors';
import type { ShiftRow } from '@/lib/database.types';
import { fetchActivePattern, fetchShifts, generateRange, toCyclePattern } from '@/lib/shifts';
import { toISODate } from '@/plan/cycle';
import { SHIFT_CODES } from '@/plan/types';
import { colors, radius, spacing } from '@/theme';

const WEEK = { weekStartsOn: 1 as const };

export default function Calendar() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [shifts, setShifts] = useState<Map<string, ShiftRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const gridStart = startOfWeek(startOfMonth(month), WEEK);
  const gridEnd = endOfWeek(endOfMonth(month), WEEK);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      // Se c'è uno schema attivo, completa i turni mancanti del mese mostrato.
      const pattern = await fetchActivePattern();
      if (pattern) await generateRange(toCyclePattern(pattern), gridStart, gridEnd);
      const rows = await fetchShifts(toISODate(gridStart), toISODate(gridEnd));
      if (id === requestId.current) setShifts(new Map(rows.map((r) => [r.data, r])));
    } catch (e) {
      console.warn('Calendario non caricato', e);
      if (id === requestId.current) setError(errorText(e));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
    // gridStart/gridEnd dipendono solo da month
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);
  const today = new Date();

  return (
    <Screen edges={['top']}>
      <AppText variant="title">{it.calendar.title}</AppText>

      <View style={styles.monthRow}>
        <Pressable onPress={() => setMonth((m) => addMonths(m, -1))} hitSlop={12} accessibilityLabel="Mese precedente">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Pressable onPress={() => setMonth(startOfMonth(new Date()))} accessibilityLabel={it.calendar.today}>
          <AppText variant="heading" style={styles.monthLabel}>
            {format(month, 'LLLL yyyy', { locale: itLocale })}
          </AppText>
        </Pressable>
        <Pressable onPress={() => setMonth((m) => addMonths(m, 1))} hitSlop={12} accessibilityLabel="Mese successivo">
          <Ionicons name="chevron-forward" size={26} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {it.calendar.weekdays.map((w, i) => (
          <View key={i} style={styles.cell}>
            <AppText variant="caption">{w}</AppText>
          </View>
        ))}
        {days.map((d) => {
          const iso = toISODate(d);
          const shift = shifts.get(iso);
          const inMonth = isSameMonth(d, month);
          const isToday = isSameDay(d, today);
          return (
            <Pressable
              key={iso}
              onPress={() => router.push({ pathname: '/giorno/[data]', params: { data: iso } })}
              style={({ pressed }) => [styles.cell, styles.dayCell, pressed && { opacity: 0.6 }]}
              accessibilityLabel={`${format(d, 'd MMMM', { locale: itLocale })}${
                shift ? `, ${it.shifts.names[shift.codice]}` : ''
              }`}
            >
              <View style={[styles.dayInner, isToday && styles.today, !inMonth && { opacity: 0.35 }]}>
                <AppText variant="caption" color={isToday ? colors.accent : colors.text}>
                  {format(d, 'd')}
                </AppText>
                {shift ? <ShiftBadge code={shift.codice} size={24} /> : <View style={{ height: 24 }} />}
                {shift?.manuale ? <View style={styles.manualDot} /> : <View style={styles.dotSpacer} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {loading ? <ActivityIndicator color={colors.accent} /> : null}
      {error ? (
        <Pressable onPress={load} style={styles.error}>
          <AppText variant="label" color={colors.danger}>
            {it.calendar.loadError}
          </AppText>
          <AppText variant="caption">{error}</AppText>
        </Pressable>
      ) : null}

      <View style={styles.legend}>
        {SHIFT_CODES.map((c) => (
          <View key={c} style={styles.legendItem}>
            <ShiftBadge code={c} size={18} />
            <AppText variant="caption">{it.shifts.names[c]}</AppText>
          </View>
        ))}
        <View style={styles.legendItem}>
          <View style={styles.manualDot} />
          <AppText variant="caption">{it.calendar.manualLegend}</AppText>
        </View>
      </View>

      <Button
        variant="secondary"
        title={it.calendar.pattern}
        icon={<Ionicons name="repeat" size={20} color={colors.text} />}
        onPress={() => router.push('/schema-turni')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthLabel: { textTransform: 'capitalize' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  dayCell: { paddingVertical: 3 },
  dayInner: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    width: '92%',
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  today: { borderWidth: 1.5, borderColor: colors.accent },
  manualDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  dotSpacer: { width: 6, height: 6 },
  error: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: 4 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
