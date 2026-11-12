import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { SocialSignIn } from '@/components/SocialSignIn';
import { TextField } from '@/components/TextField';
import it from '@/i18n/it';
import { AuthError, signInWithEmail } from '@/lib/auth';
import { useColors } from '@/theme';

export default function Login() {
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (e) {
      Alert.alert(it.common.error, e instanceof AuthError ? e.message : it.auth.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      {router.canGoBack() ? (
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={it.common.back}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
      ) : null}
      <AppText variant="title">{it.auth.loginTitle}</AppText>
      <AppText secondary>{it.auth.loginSubtitle}</AppText>
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
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
      />
      <Button title={it.auth.login} onPress={submit} loading={loading} />
      <SocialSignIn />
      <Pressable onPress={() => router.replace('/benvenuto')} hitSlop={8} style={{ alignSelf: 'center' }}>
        <AppText variant="label" color={colors.accent}>
          {it.auth.goToRegister}
        </AppText>
      </Pressable>
    </Screen>
  );
}
