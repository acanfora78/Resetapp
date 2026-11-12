import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { StepHeader } from '@/components/StepHeader';
import { LEGAL_LINKS } from '@/content/legal';
import it from '@/i18n/it';
import { errorText } from '@/lib/errors';
import { useOnboardingDraft } from '@/lib/onboardingDraft';
import { updateProfile } from '@/lib/profile';
import { useSession } from '@/lib/session';
import { colors, fonts, radius, spacing } from '@/theme';

type Plan = 'annuale' | 'mensile';

/**
 * Onboarding, passo 9: paywall. Solo grafica: gli acquisti arrivano nella Fase 6,
 * per ora "Continua" completa l'onboarding.
 */
export default function Paywall() {
  const { userId, refreshProfile } = useSession();
  const { reset } = useOnboardingDraft();
  const [plan, setPlan] = useState<Plan>('annuale');
  const [saving, setSaving] = useState(false);
  const p = it.onboarding.paywall;

  if (!userId) return <Redirect href="/salva" />;

  const choose = (v: Plan) => {
    Haptics.selectionAsync().catch(() => {});
    setPlan(v);
  };

  const finish = async () => {
    setSaving(true);
    try {
      await updateProfile(userId, { onboarding_completato_at: new Date().toISOString() });
      await reset();
      await refreshProfile(); // il navigatore passa automaticamente all'app
    } catch (e) {
      Alert.alert(it.common.error, errorText(e));
      setSaving(false);
    }
  };

  return (
    <Screen footer={<Button title={it.common.continue} onPress={finish} loading={saving} />}>
      <StepHeader step={9} title={p.title} />

      <View style={styles.benefits}>
        {p.benefits.map((b) => (
          <View key={b.text} style={styles.benefit}>
            <Text style={styles.benefitIcon}>{b.icon}</Text>
            <AppText variant="bodyMedium" style={{ flex: 1 }}>
              {b.text}
            </AppText>
          </View>
        ))}
      </View>

      <PlanCard
        selected={plan === 'annuale'}
        onPress={() => choose('annuale')}
        title={p.yearly}
        price={p.yearlyPrice}
        detail={p.yearlyMonthly}
        badge={p.yearlyBadge}
      />
      <PlanCard selected={plan === 'mensile'} onPress={() => choose('mensile')} title={p.monthly} price={p.monthlyPrice} />

      <View style={styles.legal}>
        <AppText variant="caption" center>
          {p.renewal}
        </AppText>
        <View style={styles.legalLinks}>
          <AppText variant="caption" color={colors.textSecondary} onPress={() => Alert.alert(p.restore, p.restoreSoon)}>
            {p.restore}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} onPress={() => WebBrowser.openBrowserAsync(LEGAL_LINKS.terms)}>
            {p.terms}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} onPress={() => WebBrowser.openBrowserAsync(LEGAL_LINKS.privacy)}>
            {p.privacy}
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

function PlanCard(props: {
  selected: boolean;
  onPress: () => void;
  title: string;
  price: string;
  detail?: string;
  badge?: string;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: props.selected }}
      style={[styles.card, props.selected && styles.cardOn]}
    >
      <View style={[styles.radio, props.selected && styles.radioOn]}>
        {props.selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="heading">{props.title}</AppText>
        <AppText secondary>{props.price}</AppText>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        {props.badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{props.badge}</Text>
          </View>
        ) : null}
        {props.detail ? <AppText variant="label">{props.detail}</AppText> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  benefits: { gap: spacing.sm, marginBottom: spacing.sm },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  benefitIcon: { fontSize: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.surface,
    padding: spacing.md,
  },
  cardOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.accent },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent },
  badge: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.onAccent },
  legal: { gap: spacing.sm, marginTop: spacing.sm },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
});
