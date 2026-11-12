import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Screen } from '@/components/Screen';
import { SocialSignIn } from '@/components/SocialSignIn';
import { StepHeader } from '@/components/StepHeader';
import { TextField } from '@/components/TextField';
import { LEGAL_LINKS } from '@/content/legal';
import it from '@/i18n/it';
import { AuthError, signUpWithEmail, validateEmailPassword } from '@/lib/auth';
import { errorText } from '@/lib/errors';
import { finalizeOnboarding } from '@/lib/finalizeOnboarding';
import { useOnboardingDraft } from '@/lib/onboardingDraft';
import { useSession } from '@/lib/session';
import { colors, radius, spacing } from '@/theme';

/**
 * Onboarding, passo 8: "Salva il tuo piano".
 * Senza account: registrazione + nome + consensi. Con account (es. login da
 * "Ho già un account" o dopo la conferma email): solo nome + consensi.
 * Subito dopo, i dati dell'onboarding vengono scritti su Supabase.
 */
export default function SavePlan() {
  const { session, userId, refreshProfile } = useSession();
  const { draft, update, reset } = useOnboardingDraft();

  const [nome, setNome] = useState(draft.nome);
  const [dataOk, setDataOk] = useState(!!draft.consentAt);
  const [termsOk, setTermsOk] = useState(!!draft.consentAt);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingUp, setSigningUp] = useState(false);
  const [saving, setSaving] = useState(false);
  const running = useRef(false);

  const consentGiven = dataOk && termsOk;

  /** Registra consenso e nome nei dati locali, prima di creare l'account. */
  const rememberConsent = () => update({ nome, consentAt: draft.consentAt ?? new Date().toISOString() });

  const finalize = useCallback(
    async (uid: string, consentAt: string) => {
      if (running.current) return;
      running.current = true;
      setSaving(true);
      try {
        const result = await finalizeOnboarding(uid, { ...draft, nome }, consentAt);
        if (result === 'already_onboarded') {
          await reset();
          await refreshProfile(); // il navigatore porta all'app
          return;
        }
        await refreshProfile();
        router.replace('/abbonamento');
      } catch (e) {
        Alert.alert(it.common.error, errorText(e));
      } finally {
        running.current = false;
        setSaving(false);
      }
    },
    [draft, nome, refreshProfile, reset],
  );

  // Appena c'è un account e il consenso è già stato dato, salva tutto.
  useEffect(() => {
    if (userId && draft.consentAt) finalize(userId, draft.consentAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, draft.consentAt]);

  const continueLoggedIn = () => {
    if (!consentGiven) return;
    rememberConsent();
  };

  const signUp = async () => {
    if (!consentGiven) return Alert.alert(it.onboarding.save.consentFirst);
    const invalid = validateEmailPassword(email, password);
    if (invalid) return Alert.alert(it.common.error, invalid);
    setSigningUp(true);
    rememberConsent();
    try {
      const { needsConfirmation } = await signUpWithEmail(email, password);
      if (needsConfirmation) {
        Alert.alert(it.auth.checkEmailTitle, it.auth.checkEmailBody, [
          { text: 'OK', onPress: () => router.push('/accedi') },
        ]);
      }
    } catch (e) {
      Alert.alert(it.common.error, e instanceof AuthError ? e.message : it.auth.errors.generic);
    } finally {
      setSigningUp(false);
    }
  };

  if (saving) {
    return (
      <Screen scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
          <AppText secondary center>
            {it.onboarding.save.saving}
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        session ? <Button title={it.common.continue} onPress={continueLoggedIn} disabled={!consentGiven} /> : undefined
      }
    >
      <StepHeader
        step={8}
        title={it.onboarding.save.title}
        subtitle={session ? it.onboarding.save.subtitleLoggedIn : it.onboarding.save.subtitle}
      />

      <TextField
        label={it.onboarding.save.nameLabel}
        placeholder={it.onboarding.save.namePlaceholder}
        value={nome}
        onChangeText={setNome}
        autoComplete="given-name"
        textContentType="givenName"
      />

      <View style={styles.consents}>
        <Checkbox checked={dataOk} onChange={setDataOk}>
          <AppText>{it.onboarding.consent.sleepData}</AppText>
        </Checkbox>
        <Checkbox checked={termsOk} onChange={setTermsOk}>
          <AppText>{it.onboarding.consent.terms}</AppText>
        </Checkbox>
        <View style={styles.links}>
          <AppText variant="label" color={colors.accent} onPress={() => WebBrowser.openBrowserAsync(LEGAL_LINKS.terms)}>
            {it.onboarding.consent.termsLink}
          </AppText>
          <AppText variant="label" color={colors.accent} onPress={() => WebBrowser.openBrowserAsync(LEGAL_LINKS.privacy)}>
            {it.onboarding.consent.privacyLink}
          </AppText>
        </View>
      </View>

      {!session ? (
        <>
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
          <Button title={it.auth.register} onPress={signUp} loading={signingUp} disabled={!consentGiven} />
          <SocialSignIn disabled={!consentGiven} onBeforeSignIn={rememberConsent} />
          {!consentGiven ? (
            <AppText variant="caption" center>
              {it.onboarding.save.consentFirst}
            </AppText>
          ) : null}
          <Pressable onPress={() => router.push('/accedi')} hitSlop={8} style={{ alignSelf: 'center' }}>
            <AppText variant="label" color={colors.accent}>
              {it.auth.goToLogin}
            </AppText>
          </Pressable>
        </>
      ) : null}

      <View style={styles.disclaimer}>
        <AppText variant="caption">{it.onboarding.consent.disclaimer}</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  consents: { gap: spacing.xs },
  links: { flexDirection: 'row', gap: spacing.lg, paddingLeft: 40 },
  disclaimer: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface },
});
