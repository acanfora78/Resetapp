import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Screen } from '@/components/Screen';
import { StepHeader } from '@/components/StepHeader';
import { LEGAL_LINKS } from '@/content/legal';
import it from '@/i18n/it';
import { updateProfile } from '@/lib/profile';
import { useSession, useUserId } from '@/lib/session';
import { colors, radius, spacing } from '@/theme';

/** Onboarding, passo 3: consenso GDPR e accettazione Termini e Privacy. */
export default function Consent() {
  const userId = useUserId();
  const { profile, refreshProfile } = useSession();
  const [dataOk, setDataOk] = useState(!!profile?.consenso_dati_at);
  const [termsOk, setTermsOk] = useState(!!profile?.termini_accettati_at);
  const [saving, setSaving] = useState(false);

  const next = async () => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await updateProfile(userId, {
        consenso_dati_at: profile?.consenso_dati_at ?? now,
        termini_accettati_at: profile?.termini_accettati_at ?? now,
      });
      await refreshProfile();
      router.push('/lavoro');
    } catch {
      Alert.alert(it.common.error, it.common.retry);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      footer={
        <Button title={it.common.continue} onPress={next} disabled={!dataOk || !termsOk} loading={saving} />
      }
    >
      <StepHeader step={3} title={it.onboarding.consent.title} canGoBack={false} />
      <AppText secondary>{it.onboarding.consent.body}</AppText>

      <Checkbox checked={dataOk} onChange={setDataOk}>
        <AppText>{it.onboarding.consent.sleepData}</AppText>
      </Checkbox>
      <Checkbox checked={termsOk} onChange={setTermsOk}>
        <AppText>{it.onboarding.consent.terms}</AppText>
      </Checkbox>

      <View style={styles.links}>
        <AppText
          variant="label"
          color={colors.accent}
          onPress={() => WebBrowser.openBrowserAsync(LEGAL_LINKS.terms)}
        >
          {it.onboarding.consent.termsLink}
        </AppText>
        <AppText
          variant="label"
          color={colors.accent}
          onPress={() => WebBrowser.openBrowserAsync(LEGAL_LINKS.privacy)}
        >
          {it.onboarding.consent.privacyLink}
        </AppText>
      </View>

      <View style={styles.disclaimer}>
        <AppText variant="caption">{it.onboarding.consent.disclaimer}</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  links: { flexDirection: 'row', gap: spacing.lg, paddingLeft: 40 },
  disclaimer: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
});
