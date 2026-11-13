import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { AppText } from './AppText';
import { Button } from './Button';
import { Screen } from './Screen';
import { StepHeader } from './StepHeader';
import { LEGAL_LINKS } from '@/content/legal';
import it from '@/i18n/it';
import { errorText } from '@/lib/errors';
import { APP } from '@/constants/app';
import { buy, listenPurchases, loadPrices, restore } from '@/lib/iap';
import type { Plan } from '@/lib/iap';
import { useSubscription } from '@/lib/subscription';
import { fonts, makeStyles, radius, spacing, useColors } from '@/theme';


const isUserCancel = (e: unknown) => /cancel/i.test(String((e as { code?: string })?.code ?? (e as Error)?.message ?? ''));

/**
 * Paywall: piani, acquisto, "Ripristina acquisti". Con APP.PAYWALL_ENFORCED spento,
 * "Continua" prosegue senza acquisto (prodotti non ancora configurati sugli store).
 */
export function PaywallView({ step, onUnlocked }: { step?: number; onUnlocked: () => Promise<void> }) {
  const colors = useColors();
  const styles = useStyles();
  const sub = useSubscription();
  const [plan, setPlan] = useState<Plan>('annuale');
  const [saving, setSaving] = useState(false);
  const [prices, setPrices] = useState<Record<Plan, string | null>>({ mensile: null, annuale: null });
  const p = it.onboarding.paywall;

  useEffect(() => {
    if (!APP.PAYWALL_ENFORCED) return;
    loadPrices().then(setPrices);
    return listenPurchases(async (ok, error) => {
      if (ok) {
        await sub.refresh();
        await onUnlocked();
      } else if (error && !isUserCancel(error)) {
        Alert.alert(it.common.error, errorText(error));
      }
      setSaving(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (v: Plan) => {
    Haptics.selectionAsync().catch(() => {});
    setPlan(v);
  };

  const finish = async () => {
    setSaving(true);
    try {
      if (!APP.PAYWALL_ENFORCED) {
        await onUnlocked();
        return;
      }
      await buy(plan); // il risultato arriva a listenPurchases
    } catch (e) {
      if (!isUserCancel(e)) Alert.alert(it.common.error, errorText(e));
      setSaving(false);
    }
  };

  const onRestore = async () => {
    if (!APP.PAYWALL_ENFORCED) return Alert.alert(p.restore, p.restoreSoon);
    try {
      if (await restore()) {
        await sub.refresh();
        await onUnlocked();
      } else Alert.alert(p.restore, p.restoreNone);
    } catch (e) {
      Alert.alert(it.common.error, errorText(e));
    }
  };

  return (
    <Screen footer={<Button title={it.common.continue} onPress={finish} loading={saving} />}>
      {step ? <StepHeader step={step} title={p.title} /> : <AppText variant="title">{p.title}</AppText>}

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
        price={prices.annuale ? p.perYear(prices.annuale) : p.yearlyPrice}
        detail={p.yearlyMonthly}
        badge={p.yearlyBadge}
      />
      <PlanCard selected={plan === 'mensile'} onPress={() => choose('mensile')} title={p.monthly} price={prices.mensile ? p.perMonth(prices.mensile) : p.monthlyPrice} />

      <View style={styles.legal}>
        <AppText variant="caption" center>
          {p.renewal}
        </AppText>
        <View style={styles.legalLinks}>
          <AppText variant="caption" color={colors.textSecondary} onPress={onRestore}>
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
  const colors = useColors();
  const styles = useStyles();
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

const useStyles = makeStyles((colors) => ({
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
}));
