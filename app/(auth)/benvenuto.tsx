import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import it from '@/i18n/it';
import { spacing } from '@/theme';

/** Onboarding, passo 1: benvenuto e promessa. */
export default function Welcome() {
  return (
    <Screen
      scroll={false}
      footer={
        <>
          <Button title={it.welcome.start} onPress={() => router.push('/registrazione')} />
          <Button variant="ghost" title={it.welcome.haveAccount} onPress={() => router.push('/accedi')} />
        </>
      }
    >
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
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  logo: { width: 260, height: 67 },
  title: { marginTop: spacing.md },
});
