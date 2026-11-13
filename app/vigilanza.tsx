import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import it from '@/i18n/it';
import { errorText } from '@/lib/errors';
import { usePlanData } from '@/lib/planData';
import { useUserId } from '@/lib/session';
import { fetchVigilanceTests, saveVigilanceTest } from '@/lib/userData';
import { RULES } from '@/plan/rules';
import { baseline, isBaselineEligible, median, nextInterval, outcome } from '@/plan/vigilance';
import type { VigilanceOutcome } from '@/plan/vigilance';
import { makeStyles, radius, spacing, useColors } from '@/theme';

type Phase = 'intro' | 'running' | 'done';

interface Result {
  medianMs: number;
  errors: number;
  outcome: VigilanceOutcome;
  baselineMs: number;
  personal: boolean;
}

/** Schermo sempre acceso durante il test. */
function KeepAwake() {
  useKeepAwake();
  return null;
}

/** Test di vigilanza di 30 secondi prima di guidare. */
export default function VigilanceTest() {
  const colors = useColors();
  const styles = useStyles();
  const userId = useUserId();
  const { ctx } = usePlanData();
  const [phase, setPhase] = useState<Phase>('intro');
  const [lit, setLit] = useState(false);
  const [tooSoon, setTooSoon] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(RULES.VIGILANCE_DURATION_S);
  const [result, setResult] = useState<Result | null>(null);

  const litAt = useRef(0);
  const times = useRef<number[]>([]);
  const errors = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endAt = useRef(0);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clear, []);

  const scheduleNext = useCallback(() => {
    clear();
    setLit(false);
    timer.current = setTimeout(() => {
      litAt.current = Date.now();
      setLit(true);
    }, nextInterval(Math.random()));
  }, []);

  const finish = useCallback(async () => {
    clear();
    setLit(false);
    const medianMs = median(times.current);
    const now = new Date();
    const todayShift = ctx?.shiftOn(now) ?? null;
    let past: Awaited<ReturnType<typeof fetchVigilanceTests>> = [];
    try {
      past = await fetchVigilanceTests();
    } catch {
      // senza storico si usa il riferimento generico
    }
    const base = baseline(
      past.map((t) => ({ doneAt: new Date(t.fatto_at), medianMs: t.mediana_ms, eligible: t.valido_riferimento })),
    );
    const res = outcome(medianMs, base.ms);
    setResult({ medianMs, errors: errors.current, outcome: res, baselineMs: base.ms, personal: base.personal });
    setPhase('done');
    try {
      await saveVigilanceTest({
        user_id: userId,
        fatto_at: now.toISOString(),
        mediana_ms: medianMs,
        errori: errors.current,
        esito: res,
        valido_riferimento: isBaselineEligible(now, todayShift === 'R' || todayShift === null),
      });
    } catch (e) {
      Alert.alert(it.common.error, errorText(e));
    }
  }, [ctx, userId]);

  // Conto alla rovescia.
  useEffect(() => {
    if (phase !== 'running') return;
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        clearInterval(t);
        finish();
      }
    }, 250);
    return () => clearInterval(t);
  }, [phase, finish]);

  const start = () => {
    times.current = [];
    errors.current = 0;
    endAt.current = Date.now() + RULES.VIGILANCE_DURATION_S * 1000;
    setSecondsLeft(RULES.VIGILANCE_DURATION_S);
    setResult(null);
    setPhase('running');
    scheduleNext();
  };

  const onTap = () => {
    if (phase !== 'running') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (lit) {
      times.current.push(Date.now() - litAt.current);
      setTooSoon(false);
    } else {
      errors.current += 1;
      setTooSoon(true);
    }
    scheduleNext();
  };

  const resultColor =
    result?.outcome === 'green' ? colors.shift.S : result?.outcome === 'yellow' ? colors.accent : colors.danger;

  return (
    <Screen scroll={phase !== 'running'}>
      {phase === 'running' ? <KeepAwake /> : null}
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={it.common.back}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>
      <AppText variant="title">{it.vigilance.screenTitle}</AppText>

      {phase === 'intro' ? (
        <>
          <AppText secondary>{it.vigilance.intro}</AppText>
          <Button title={it.vigilance.start} onPress={start} />
        </>
      ) : null}

      {phase === 'running' ? (
        <Pressable
          onPressIn={onTap}
          style={styles.area}
          accessibilityRole="button"
          accessibilityLabel={lit ? it.vigilance.tap : it.vigilance.waiting}
        >
          <AppText variant="caption">{it.vigilance.remaining(secondsLeft)}</AppText>
          <View style={[styles.circle, lit && { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}>
            <Image
              source={require('../assets/brand/reset-simbolo-1024.png')}
              style={[styles.logo, { opacity: lit ? 1 : 0.15 }]}
              contentFit="contain"
            />
          </View>
          <AppText variant="heading" center color={tooSoon ? colors.danger : colors.text}>
            {lit ? it.vigilance.tap : tooSoon ? it.vigilance.tooSoon : it.vigilance.waiting}
          </AppText>
        </Pressable>
      ) : null}

      {phase === 'done' && result ? (
        <>
          <View style={[styles.card, { borderColor: resultColor }]}>
            <AppText variant="heading" color={resultColor}>
              {it.vigilance.result[result.outcome]}
            </AppText>
            <AppText>{it.vigilance.medianLabel(result.medianMs)}</AppText>
            <AppText secondary>{it.vigilance.baselineLabel(result.baselineMs)}</AppText>
            {result.errors > 0 ? <AppText secondary>{it.vigilance.errors(result.errors)}</AppText> : null}
            {!result.personal ? <AppText variant="caption">{it.vigilance.genericBaseline}</AppText> : null}
          </View>
          <Button variant="secondary" title={it.vigilance.again} onPress={start} />
        </>
      ) : null}

      <AppText variant="caption">{it.vigilance.disclaimer}</AppText>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  area: { flex: 1, minHeight: 380, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 140, height: 140 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 2, padding: spacing.md, gap: spacing.sm },
}));
