import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { ShiftBadge } from '@/components/ShiftBadge';
import { GUIDES, MEAL_GUIDE } from '@/content/guides';
import it from '@/i18n/it';
import { makeStyles, radius, spacing, useColors } from '@/theme';

/** Una mini-guida, oppure la guida ai pasti (id "pasti"). */
export default function GuideDetail() {
  const colors = useColors();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const guide = GUIDES.find((g) => g.id === id);

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={it.common.back}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>
      {id === 'pasti' ? (
        <>
          <AppText variant="title">🍽️ {it.guides.mealsTitle}</AppText>
          {MEAL_GUIDE.map((m) => (
            <View key={m.title} style={styles.card}>
              <View style={styles.header}>
                {m.codes.map((c) => (
                  <ShiftBadge key={c} code={c} size={28} />
                ))}
                <AppText variant="heading" style={{ flex: 1 }}>
                  {m.title}
                </AppText>
              </View>
              {m.tips.map((t) => (
                <View key={t} style={styles.tip}>
                  <AppText color={colors.accent}>•</AppText>
                  <AppText style={{ flex: 1 }}>{t}</AppText>
                </View>
              ))}
            </View>
          ))}
        </>
      ) : guide ? (
        <>
          <Text style={{ fontSize: 40 }}>{guide.icon}</Text>
          <AppText variant="title">{guide.title}</AppText>
          {guide.sections.map((s) => (
            <View key={s.heading} style={styles.card}>
              <AppText variant="heading">{s.heading}</AppText>
              <AppText>{s.body}</AppText>
            </View>
          ))}
        </>
      ) : null}
      <AppText variant="caption">{it.guides.disclaimer}</AppText>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tip: { flexDirection: 'row', gap: spacing.sm },
}));
