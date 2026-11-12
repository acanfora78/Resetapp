import { router } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { OptionButton } from '@/components/OptionButton';
import { Screen } from '@/components/Screen';
import { StepHeader } from '@/components/StepHeader';
import { TextField } from '@/components/TextField';
import it from '@/i18n/it';
import { useOnboardingDraft } from '@/lib/onboardingDraft';

const OPTIONS = it.onboarding.job.options.map((o) => o.label as string);

/** Onboarding, passo 2: che lavoro fai. */
export default function Job() {
  const { draft, update } = useOnboardingDraft();
  const initial = draft.lavoro ?? '';
  const initialIsOther = !!initial && !OPTIONS.includes(initial);

  const [choice, setChoice] = useState<string | null>(initialIsOther ? 'other' : initial || null);
  const [other, setOther] = useState(initialIsOther ? initial : '');

  const lavoro = choice === 'other' ? other.trim() : choice;

  const next = () => {
    if (!lavoro) return;
    update({ lavoro });
    router.push('/orari');
  };

  return (
    <Screen footer={<Button title={it.common.continue} onPress={next} disabled={!lavoro} />}>
      <StepHeader step={2} title={it.onboarding.job.title} subtitle={it.onboarding.job.subtitle} />
      {it.onboarding.job.options.map((o) => (
        <OptionButton
          key={o.label}
          icon={o.icon}
          label={o.label}
          selected={choice === o.label}
          onPress={() => setChoice(o.label)}
        />
      ))}
      <OptionButton
        icon={it.onboarding.job.other.icon}
        label={it.onboarding.job.other.label}
        selected={choice === 'other'}
        onPress={() => setChoice('other')}
      />
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
