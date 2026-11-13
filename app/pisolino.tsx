import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { OptionButton } from '@/components/OptionButton';
import { Screen } from '@/components/Screen';
import it from '@/i18n/it';
import { requestPermission } from '@/lib/notifications';
import { RULES } from '@/plan/rules';
import { formatClock } from '@/plan/time';
import { makeStyles, radius, spacing, useColors } from '@/theme';

const KEY = 'reset.nap.endsAt.v1';
const NOTIF_ID = 'pisolino';

/** Timer del pisolino (20 o 90 minuti) con sveglia tramite notifica locale. */
export default function NapTimer() {
  const colors = useColors();
  const styles = useStyles();
  const [minutes, setMinutes] = useState<number>(RULES.NAP_TIMER_OPTIONS_MIN[0]);
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v && Number(v) > Date.now()) setEndsAt(new Date(Number(v)));
    });
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const start = async () => {
    const perm = await requestPermission();
    if (perm !== 'granted') Alert.alert(it.nap.needNotifications);
    const end = new Date(Date.now() + minutes * 60_000);
    await Notifications.cancelScheduledNotificationAsync(NOTIF_ID).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIF_ID,
      content: { title: it.nap.alarmTitle, body: it.nap.alarmBody, sound: true, interruptionLevel: 'timeSensitive' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: end },
    }).catch(() => {});
    await AsyncStorage.setItem(KEY, String(end.getTime()));
    setEndsAt(end);
  };

  const cancel = async () => {
    await Notifications.cancelScheduledNotificationAsync(NOTIF_ID).catch(() => {});
    await AsyncStorage.removeItem(KEY);
    setEndsAt(null);
  };

  const left = endsAt ? Math.max(0, endsAt.getTime() - now) : 0;
  const mm = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}`;
  const running = !!endsAt && left > 0;

  return (
    <Screen footer={running ? <Button variant="danger" title={it.nap.cancel} onPress={cancel} /> : <Button title={it.nap.start} onPress={start} />}>
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={it.common.back}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>
      <AppText variant="title">{it.nap.title}</AppText>
      {running ? (
        <View style={styles.timer}>
          <AppText variant="title" center style={{ fontSize: 56, lineHeight: 68 }}>
            {mm}
          </AppText>
          <AppText secondary center>
            {it.nap.endsAt(formatClock(endsAt!))}
          </AppText>
        </View>
      ) : (
        <>
          <AppText secondary>{it.nap.subtitle}</AppText>
          <OptionButton icon="⚡" label={`${it.nap.short} · ${it.nap.shortHint}`} selected={minutes === 20} onPress={() => setMinutes(20)} />
          <OptionButton icon="🌙" label={`${it.nap.long} · ${it.nap.longHint}`} selected={minutes === 90} onPress={() => setMinutes(90)} />
        </>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  timer: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    minHeight: 260,
  },
}));
