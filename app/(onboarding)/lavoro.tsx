import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { Button } from '@/components/Button';
import { OptionButton } from '@/components/OptionButton';
import { Screen } from '@/components/Screen';
import { StepHeader } from '@/components/StepHeader';
import { TextField } from '@/components/TextField';
import it from '@/i18n/it';
import { errorText } from '@/lib/errors';
import { updateProfile } from '@/lib/profile';
import { useSession, useUserId } from '@/lib/session';

const OPTIONS: readonly string[] = it.onboarding.job.options;

/** Onboarding, passo 4: che lavoro fai. */
export default function Job() {
  const userId = useUserId();
  const { profile, refreshProfile } = useSession();
  const initial = profile?.lavoro ?? '';
  const initialIsOther = !!initial && !OPTIONS.includes(initial);

  const [nome, setNome] = useState(profile?.nome ?? '');
  const [choice, setChoice] = useState<string | null>(initialIsOther ? 'other' : initial || null);
  const [other, setOther] = useState(initialIsOther ? initial : '');
  const [saving, setSaving] = useState(false);

  const lavoro = choice === 'other' ? other.trim() : choice;

  const next = async () => {
    if (!lavoro) return;
    setSaving(true);
    try {
      await updateProfile(userId, { lavoro, nome: nome.trim() || null });
      await refreshProfile();
      router.push('/orari');
    } catch (e) {
      Alert.alert(it.common.error, errorText(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen footer={<Button title={it.common.continue} onPress={next} disabled={!lavoro} loading={saving} />}>
      <StepHeader step={4} title={it.onboarding.job.title} subtitle={it.onboarding.job.subtitle} />
      <TextField
        label={it.onboarding.job.nameLabel}
        placeholder={it.onboarding.job.namePlaceholder}
        value={nome}
        onChangeText={setNome}
        autoComplete="given-name"
        textContentType="givenName"
      />
      {OPTIONS.map((o) => (
        <OptionButton key={o} label={o} selected={choice === o} onPress={() => setChoice(o)} />
      ))}
      <OptionButton label={it.onboarding.job.other} selected={choice === 'other'} onPress={() => setChoice('other')} />
      {choice === 'other' ? (
        <TextField
          placeholder={it.onboarding.job.otherPlaceholder}
          value={other}
          onChangeText={setOther}
          autoFocus
        />
      ) : null}
    </Screen>
  );
}
