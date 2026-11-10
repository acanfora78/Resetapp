import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { StepHeader } from '@/components/StepHeader';
import it from '@/i18n/it';
import { updateProfile } from '@/lib/profile';
import { useSession, useUserId } from '@/lib/session';
import { colors, radius, spacing } from '@/theme';

/** Onboarding, passo 9: paywall. SEGNAPOSTO fino alla Fase 6 (pagamenti). */
export default function Paywall() {
  const userId = useUserId();
  const { refreshProfile } = useSession();
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    setSaving(true);
    try {
      await updateProfile(userId, { onboarding_completato_at: new Date().toISOString() });
      await refreshProfile(); // il navigatore passa automaticamente all'app
    } catch {
      Alert.alert(it.common.error, it.common.retry);
      setSaving(false);
    }
  };

  return (
    <Screen footer={<Button title={it.common.continue} onPress={finish} loading={saving} />}>
      <StepHeader step={9} title={it.onboarding.paywall.title} />
      <View style={styles.box}>
        <AppText secondary center>
          {it.onboarding.paywall.placeholder}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
});
