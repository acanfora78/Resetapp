/**
 * Promemoria locali delle azioni del piano (expo-notifications).
 * Programmati per i prossimi 7 giorni e riprogrammati a ogni modifica.
 */
import { addDays } from 'date-fns';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import it from '@/i18n/it';
import { planText } from '@/i18n/planText';
import type { PlanContext } from '@/plan/context';
import { toISODate } from '@/plan/cycle';
import { notificationSchedule } from '@/plan/today';
import { transitionReminders } from '@/plan/transitions';

import { fetchCheckIds } from './checks';
import type { NotificationPrefs } from './notificationCard';
import type { ProfileRow } from './database.types';

const ANDROID_CHANNEL = 'piano';
const supported = Platform.OS === 'ios' || Platform.OS === 'android';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export type { NotificationPrefs } from './notificationCard';

export const notificationPrefs = (profile: ProfileRow | null): NotificationPrefs =>
  (profile?.notifiche ?? {}) as NotificationPrefs;

export type PermissionResult = 'granted' | 'denied' | 'unsupported';

export async function hasPermission(): Promise<boolean> {
  if (!supported) return false;
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

export async function requestPermission(): Promise<PermissionResult> {
  if (!supported) return 'unsupported';
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
      name: it.notifications.channelName,
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (!current.canAskAgain) return 'denied';
  const res = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return res.granted ? 'granted' : 'denied';
}

export const openSystemSettings = () => Linking.openSettings();

let queue: Promise<void> = Promise.resolve();

/**
 * Cancella e riprogramma tutti i promemoria. Le chiamate vengono messe in fila,
 * così due riprogrammazioni non si sovrappongono.
 */
export function syncNotifications(ctx: PlanContext | null, profile: ProfileRow | null): Promise<void> {
  queue = queue.then(() => doSync(ctx, profile)).catch((e) => console.warn('Notifiche non programmate', e));
  return queue;
}

async function doSync(ctx: PlanContext | null, profile: ProfileRow | null) {
  if (!supported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!ctx || !profile || notificationPrefs(profile).abilitate !== true) return;
  if (!(await hasPermission())) return;

  const now = new Date();
  const done = await fetchCheckIds(toISODate(addDays(now, -1)), toISODate(addDays(now, 1)));
  const reminders = notificationSchedule(ctx, now, done);

  for (const t of transitionReminders(ctx, now)) {
    const text = it.transitions.notification[t.type];
    await Notifications.scheduleNotificationAsync({
      identifier: t.id,
      content: { title: text.title, body: text.body, sound: true, data: { url: '/oggi' } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: t.date,
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL } : {}),
      },
    });
  }

  for (const r of reminders) {
    const s = planText(r);
    await Notifications.scheduleNotificationAsync({
      identifier: r.id,
      content: { title: s.title, body: s.why, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: r.date,
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL } : {}),
      },
    });
  }
}
