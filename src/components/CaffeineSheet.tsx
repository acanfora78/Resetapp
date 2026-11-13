import * as Haptics from 'expo-haptics';
import { Modal, Pressable, Text, View } from 'react-native';

import it from '@/i18n/it';
import { CAFFEINE_DOSES_MG } from '@/plan/rules';
import type { CaffeineType } from '@/plan/rules';
import { makeStyles, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';

const TYPES: { type: CaffeineType; icon: string }[] = [
  { type: 'espresso', icon: '☕' },
  { type: 'moka', icon: '🫖' },
  { type: 'energy', icon: '⚡' },
  { type: 'te_cola', icon: '🥤' },
];

/** Scelta veloce del tipo di caffè. */
export function CaffeineSheet({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (t: CaffeineType) => void;
}) {
  const styles = useStyles();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <AppText variant="heading">{it.caffeine.sheetTitle}</AppText>
          <View style={styles.grid}>
            {TYPES.map(({ type, icon }) => (
              <Pressable
                key={type}
                accessibilityRole="button"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  onPick(type);
                }}
                style={({ pressed }) => [styles.option, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.icon}>{icon}</Text>
                <AppText variant="bodyMedium" center>
                  {it.caffeine.types[type]}
                </AppText>
                <AppText variant="caption" center>
                  {it.caffeine.mg(CAFFEINE_DOSES_MG[type])}
                </AppText>
              </Pressable>
            ))}
          </View>
          <Button variant="ghost" title={it.common.cancel} onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
    minHeight: 44,
  },
  icon: { fontSize: 28 },
}));
