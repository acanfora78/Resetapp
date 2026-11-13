import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { CaffeineChart } from '@/components/CaffeineChart';
import { CaffeineSheet } from '@/components/CaffeineSheet';
import { Screen } from '@/components/Screen';
import it from '@/i18n/it';
import { deleteCaffeine, toDoses } from '@/lib/caffeine';
import { errorText } from '@/lib/errors';
import { usePlanData } from '@/lib/planData';
import { useUserId } from '@/lib/session';
import { useCaffeine } from '@/lib/useCaffeine';
import { caffeineCurve, caffeineVerdict } from '@/plan/caffeine';
import { formatClock } from '@/plan/time';
import { makeStyles, radius, spacing, useColors } from '@/theme';

/** Caffeina residua: grafico delle prossime 24 ore e caffè registrati. */
export default function CaffeineScreen() {
  const colors = useColors();
  const styles = useStyles();
  const userId = useUserId();
  const { ctx } = usePlanData();
  const { rows, load, add } = useCaffeine(userId, ctx);
  const [sheet, setSheet] = useState(false);

  const now = useMemo(() => new Date(), [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const doses = toDoses(rows);
  const points = caffeineCurve(doses, now);
  const verdict = ctx ? caffeineVerdict(ctx, doses, now) : null;

  const remove = async (id: string) => {
    try {
      await deleteCaffeine(id);
      await load();
    } catch (e) {
      Alert.alert(it.common.error, errorText(e));
    }
  };

  return (
    <Screen footer={<Button title={it.caffeine.quickButton} onPress={() => setSheet(true)} />}>
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={it.common.back}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>
      <AppText variant="title">{it.caffeine.screenTitle}</AppText>

      {verdict && verdict.status !== 'none' ? (
        <AppText variant="bodyMedium">
          {verdict.status === 'ok'
            ? it.caffeine.ok
            : it.caffeine.high(formatClock(verdict.sleepAt!), verdict.percentAtSleep)}
        </AppText>
      ) : null}

      <View style={styles.card}>
        <CaffeineChart points={points} sleepAt={verdict?.sleepAt ?? null} />
      </View>

      <AppText variant="label" secondary>
        {it.caffeine.todayList}
      </AppText>
      {rows.length === 0 ? <AppText secondary>{it.caffeine.empty}</AppText> : null}
      {rows.map((r) => (
        <View key={r.id} style={[styles.card, styles.row]}>
          <AppText variant="label" color={colors.accent}>
            {formatClock(new Date(r.consumato_at))}
          </AppText>
          <AppText variant="bodyMedium" style={{ flex: 1 }}>
            {it.caffeine.types[r.tipo]}
          </AppText>
          <AppText variant="caption">{it.caffeine.mg(r.quantita_mg)}</AppText>
          <Pressable onPress={() => remove(r.id)} hitSlop={10} accessibilityLabel={it.caffeine.remove} style={styles.del}>
            <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      ))}

      <AppText variant="caption">{it.caffeine.note}</AppText>

      <CaffeineSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        onPick={(t) => {
          setSheet(false);
          add(t);
        }}
      />
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  del: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
}));
