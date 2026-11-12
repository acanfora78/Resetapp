import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import it from '@/i18n/it';
import { AuthCancelled, isAppleAvailable, signInWithApple, signInWithGoogle } from '@/lib/auth';
import { makeStyles, radius, useColors } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';

interface Props {
  /** Pulsanti disattivati (es. consensi non ancora spuntati). */
  disabled?: boolean;
  /** Chiamata subito prima di avviare l'accesso. */
  onBeforeSignIn?: () => void;
}

/** Pulsanti Accedi con Apple e Accedi con Google. */
export function SocialSignIn({ disabled, onBeforeSignIn }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState<'apple' | 'google' | null>(null);

  useEffect(() => {
    isAppleAvailable().then(setAppleAvailable).catch(() => setAppleAvailable(false));
  }, []);

  const run = async (which: 'apple' | 'google', fn: () => Promise<void>) => {
    setBusy(which);
    onBeforeSignIn?.();
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
        <View style={disabled && styles.disabled} pointerEvents={disabled ? 'none' : 'auto'}>
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={radius.pill}
          style={styles.apple}
          onPress={() => run('apple', signInWithApple)}
        />
        </View>
      ) : null}

      <Button
        variant="secondary"
        title={it.auth.google}
        loading={busy === 'google'}
        disabled={disabled}
        icon={<Ionicons name="logo-google" size={20} color={disabled ? colors.disabledText : colors.text} />}
        onPress={() => run('google', signInWithGoogle)}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { gap: 12 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  apple: { height: 54, width: '100%' },
  disabled: { opacity: 0.4 },
}));
