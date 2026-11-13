import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Toggle } from '@/components/Toggle';
import { LEGAL_LINKS } from '@/content/legal';
import it from '@/i18n/it';
import { deleteAccount } from '@/lib/account';
import { giveSleepConsent } from '@/lib/consent';
import { errorText } from '@/lib/errors';
import { useSession, useUserId } from '@/lib/session';
import { spacing, useColors } from '@/theme';

/**
 * Consenso revocato: senza il consenso ai dati sul sonno il piano non funziona.
 * Si può ridare il consenso o eliminare l'account.
 */
export default function ConsentRequired() {
  const colors = useColors();
  const userId = useUserId();
  const { refreshProfile } = useSession();
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    setSaving(true);
    try {
      await giveSleepConsent(userId);
      await refreshProfile();
      router.replace('/oggi');
    } catch (e) {
      Alert.alert(it.common.error, errorText(e));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () =>
    Alert.alert(it.account.deleteTitle, it.account.deleteBody, [
      { text: it.common.cancel, style: 'cancel' },
      {
        text: it.account.deleteConfirm,
        style: 'destructive',
        onPress: () =>
          Alert.alert(it.account.deleteFinalTitle, it.account.deleteFinalBody, [
            { text: it.common.cancel, style: 'cancel' },
            {
              text: it.account.deleteConfirm,
              style: 'destructive',
              onPress: () => deleteAccount().catch((e) => Alert.alert(it.common.error, errorText(e))),
            },
          ]),
      },
    ]);

  return (
    <Screen edges={['top', 'bottom']}>
      <AppText variant="title">{it.consent.requiredTitle}</AppText>
      <AppText secondary>{it.consent.requiredBody}</AppText>
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <AppText style={{ flex: 1 }}>{it.onboarding.consent.sleepData}</AppText>
        <Toggle value={ok} onValueChange={setOk} accessibilityLabel={it.onboarding.consent.sleepData} />
      </View>
      <Pressable onPress={() => WebBrowser.openBrowserAsync(LEGAL_LINKS.privacy)} accessibilityRole="link">
        <AppText variant="label" color={colors.accent}>
          {it.onboarding.consent.privacyLink}
        </AppText>
      </Pressable>
      <Button title={it.consent.giveAgain} onPress={confirm} disabled={!ok} loading={saving} />
      <Button variant="danger" title={it.account.deleteButton} onPress={onDelete} />
    </Screen>
  );
}
