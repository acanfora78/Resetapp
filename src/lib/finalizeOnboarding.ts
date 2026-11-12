import type { OnboardingDraft } from './onboardingDraft';
import { fetchProfile, updateProfile } from './profile';
import { savePattern, saveShiftTypes } from './shifts';

/**
 * Scrive su Supabase i dati raccolti nell'onboarding, subito dopo la
 * registrazione. Restituisce 'already_onboarded' se l'account aveva già
 * completato l'onboarding (in quel caso non sovrascrive nulla).
 */
export async function finalizeOnboarding(
  userId: string,
  draft: OnboardingDraft,
  consentAt: string,
): Promise<'saved' | 'already_onboarded'> {
  const existing = await fetchProfile(userId);
  if (existing?.onboarding_completato_at) return 'already_onboarded';

  await updateProfile(userId, {
    ...(draft.nome.trim() ? { nome: draft.nome.trim() } : {}),
    lavoro: draft.lavoro,
    consenso_dati_at: existing?.consenso_dati_at ?? consentAt,
    termini_accettati_at: existing?.termini_accettati_at ?? consentAt,
    sveglia_preferita: draft.wake,
    tragitto_min: draft.commuteMin,
    fabbisogno_sonno_min: draft.sleepNeedMin,
    tipo_turni: draft.tipoTurni,
  });
  await saveShiftTypes(userId, draft.hours, draft.enabled);
  if (!draft.patternSkipped && draft.sequence.length > 0) {
    await savePattern(userId, draft.sequence, draft.startDate);
  }
  return 'saved';
}
