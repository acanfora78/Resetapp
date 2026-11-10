import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import it from '@/i18n/it';
import { atClock, capitalizeFirst, formatClock } from '@/plan/time';
import type { ClockTime } from '@/plan/types';
import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';

type Props =
  | { mode: 'time'; value: ClockTime; onChange: (v: ClockTime) => void; label?: string; compact?: boolean }
  | { mode: 'date'; value: Date; onChange: (v: Date) => void; label?: string; compact?: boolean };

/** Campo che apre il selettore di ora o data nativo. */
export function PickerField(props: Props) {
  const [open, setOpen] = useState(false);
  const dateValue = props.mode === 'time' ? atClock(new Date(), props.value) : props.value;
  const [draft, setDraft] = useState<Date>(dateValue);

  const display =
    props.mode === 'time'
      ? props.value
      : capitalizeFirst(format(props.value, 'EEEE d MMMM yyyy', { locale: itLocale }));

  const commit = (d: Date) => {
    if (props.mode === 'time') props.onChange(formatClock(d));
    else props.onChange(d);
  };

  const onPress = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dateValue,
        mode: props.mode,
        is24Hour: true,
        onValueChange: (_e, d) => commit(d),
      });
      return;
    }
    setDraft(dateValue);
    setOpen(true);
  };

  return (
    <View style={styles.wrap}>
      {props.label ? <AppText variant="label">{props.label}</AppText> : null}
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.field, props.compact && styles.compact, pressed && { opacity: 0.8 }]}
      >
        <AppText variant="bodyMedium">
          {display}
        </AppText>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <Pressable style={styles.sheet}>
              <DateTimePicker
                value={draft}
                mode={props.mode}
                display="spinner"
                themeVariant="dark"
                locale="it-IT"
                is24Hour
                minuteInterval={props.mode === 'time' ? 5 : undefined}
                onValueChange={(_e, d) => setDraft(d)}
              />
              <Button
                title={it.common.done}
                onPress={() => {
                  commit(draft);
                  setOpen(false);
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  field: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  compact: { paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
});
