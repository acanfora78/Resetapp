import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { SocialSignIn } from '@/components/SocialSignIn';
import { StepHeader } from '@/components/StepHeader';
import { TextField } from '@/components/TextField';
import it from '@/i18n/it';
import { AuthError, signUpWithEmail, validateEmailPassword } from '@/lib/auth';
import { colors } from '@/theme';

/** Onboarding, passo 2: registrazione. */
export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const invalid = validateEmailPassword(email, password);
    if (invalid) return Alert.alert(it.common.error, invalid);
    setLoading(true);
    try {
      const { needsConfirmation } = await signUpWithEmail(email, password);
      if (needsConfirmation) {
        Alert.alert(it.auth.checkEmailTitle, it.auth.checkEmailBody, [
          { text: 'OK', onPress: () => router.replace('/accedi') },
        ]);
      }
      // Altrimenti la sessione è attiva e il navigatore passa all'onboarding.
    } catch (e) {
      Alert.alert(it.common.error, e instanceof AuthError ? e.message : it.auth.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <StepHeader step={2} title={it.auth.registerTitle} subtitle={it.auth.registerSubtitle} />
      <TextField
        label={it.auth.email}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label={it.auth.password}
        hint={it.auth.passwordHint}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Button title={it.auth.register} onPress={submit} loading={loading} />
      <SocialSignIn />
      <Pressable onPress={() => router.replace('/accedi')} hitSlop={8} style={{ alignSelf: 'center' }}>
        <AppText variant="label" color={colors.accent}>
          {it.auth.goToLogin}
        </AppText>
      </Pressable>
    </Screen>
  );
}
