import { addDays, format } from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import { StyleSheet, View } from 'react-native';

import it from '@/i18n/it';
import { shiftFromPattern, toISODate } from '@/plan/cycle';
import type { ShiftCode } from '@/plan/types';
import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { PickerField } from './PickerField';
import { SequenceEditor } from './SequenceEditor';
import { ShiftBadge } from './ShiftBadge';

interface Props {
  sequence: ShiftCode[];
  onSequenceChange: (v: ShiftCode[]) => void;
  startDate: Date;
  onStartDateChange: (d: Date) => void;
  available: ShiftCode[];
}

const PREVIEW_DAYS = 14;

/** Editor dello schema ciclico con anteprima dei prossimi 14 giorni. */
export function PatternForm({ sequence, onSequenceChange, startDate, onStartDateChange, available }: Props) {
  const pattern = { sequenza: sequence, dataInizio: toISODate(startDate) };
  const days = Array.from({ length: PREVIEW_DAYS }, (_, i) => addDays(startDate, i));

  return (
    <View style={styles.wrap}>
      <SequenceEditor value={sequence} onChange={onSequenceChange} available={available} />
      <PickerField
        mode="date"
        label={it.onboarding.pattern.startDate}
        value={startDate}
        onChange={onStartDateChange}
      />
      {sequence.length > 0 ? (
        <View style={styles.preview}>
          {days.map((d) => {
            const code = shiftFromPattern(pattern, d);
            return (
              <View key={d.toISOString()} style={styles.day}>
                <AppText variant="caption" style={styles.dayLabel}>
                  {format(d, 'EEEEEE', { locale: itLocale })}
                </AppText>
                <AppText variant="caption">{format(d, 'd')}</AppText>
                {code ? <ShiftBadge code={code} size={24} /> : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  preview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    rowGap: spacing.sm,
  },
  day: { width: `${100 / 7}%`, alignItems: 'center', gap: 2 },
  dayLabel: { textTransform: 'capitalize' },
});
