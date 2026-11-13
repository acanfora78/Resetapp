import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { GUIDES } from '@/content/guides';
import it from '@/i18n/it';
import { makeStyles, radius, spacing } from '@/theme';

/** Guide: mini-guide e guida ai pasti in turno. */
export default function Guides() {
  const styles = useStyles();
  return (
    <Screen edges={['top']}>
      <AppText variant="title">{it.guides.title}</AppText>
      <AppText secondary>{it.guides.subtitle}</AppText>

      <Pressable style={[styles.card, styles.meals]} onPress={() => router.push('/guida/pasti')} accessibilityRole="button">
        <Text style={styles.icon}>🍽️</Text>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyMedium">{it.guides.mealsTitle}</AppText>
          <AppText variant="caption">{it.guides.mealsSubtitle}</AppText>
        </View>
      </Pressable>

      {GUIDES.map((g) => (
        <Pressable key={g.id} style={styles.card} onPress={() => router.push({ pathname: '/guida/[id]', params: { id: g.id } })} accessibilityRole="button">
          <Text style={styles.icon}>{g.icon}</Text>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyMedium">{g.title}</AppText>
            <AppText variant="caption">{it.guides.minutes(g.minutes)}</AppText>
          </View>
        </Pressable>
      ))}
      <AppText variant="caption">{it.guides.disclaimer}</AppText>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 64,
  },
  meals: { borderWidth: 1, borderColor: colors.accent },
  icon: { fontSize: 28 },
}));
