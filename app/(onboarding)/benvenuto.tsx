import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { StepHeader } from '@/components/StepHeader';
import it from '@/i18n/it';
import { makeStyles, radius, spacing, useColors } from '@/theme';

/** Onboarding, passo 1: benvenuto e promessa. */
export default function Welcome() {
  const colors = useColors();
  const styles = useStyles();
  return (
    <Screen
      footer={
        <>
          <Button title={it.welcome.start} onPress={() => router.push('/lavoro')} />
          <Button variant="ghost" title={it.welcome.haveAccount} onPress={() => router.push('/accedi')} />
        </>
      }
    >
      <StepHeader step={1} showBack={false} />
      <View style={styles.center}>
        <Image
          source={require('../../assets/brand/reset-logo-orizzontale-bianco.png')}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="Reset"
        />
        <AppText variant="title" center style={styles.title}>
          {it.welcome.title}
        </AppText>
        <AppText secondary center>
          {it.welcome.promise}
        </AppText>
        <View style={styles.benefits}>
          {it.welcome.benefits.map((b) => (
            <View key={b.text} style={styles.benefit}>
              <Text style={styles.benefitIcon}>{b.icon}</Text>
              <AppText variant="bodyMedium" style={{ flex: 1 }}>
                {b.text}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  logo: { width: 220, height: 57 },
  title: { marginTop: spacing.sm },
  benefits: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.md },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  benefitIcon: { fontSize: 24 },
}));
