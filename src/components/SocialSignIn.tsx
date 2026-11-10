import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import it from '@/i18n/it';
import { AuthCancelled, isAppleAvailable, signInWithApple, signInWithGoogle } from '@/lib/auth';
import { colors, radius } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';

/** Pulsanti Accedi con Apple e Accedi con Google. */
export function SocialSignIn() {
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState<'apple' | 'google' | null>(null);

  useEffect(() => {
    isAppleAvailable().then(setAppleAvailable).catch(() => setAppleAvailable(false));
  }, []);

  const run = async (which: 'apple' | 'google', fn: () => Promise<void>) => {
    setBusy(which);
    try {
      await fn();
    } catch (e) {
      if (!(e instanceof AuthCancelled)) {
        Alert.alert(it.common.error, e instanceof Error ? e.message : it.auth.errors.generic);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <AppText variant="caption">{it.auth.or}</AppText>
        <View style={styles.line} />
      </View>

      {appleAvailable ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={radius.pill}
          style={styles.apple}
          onPress={() => run('apple', signInWithApple)}
        />
      ) : null}

      <Button
        variant="secondary"
        title={it.auth.google}
        loading={busy === 'google'}
        icon={<Ionicons name="logo-google" size={20} color={colors.text} />}
        onPress={() => run('google', signInWithGoogle)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  apple: { height: 54, width: '100%' },
});
