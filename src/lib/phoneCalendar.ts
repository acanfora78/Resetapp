/**
 * Turni nel calendario del telefono: calendario dedicato "Reset – Turni",
 * con i turni dei prossimi 60 giorni. Preferenza e id del calendario sono del
 * dispositivo (AsyncStorage).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar/legacy';
import { addDays, startOfDay } from 'date-fns';
import { Platform } from 'react-native';

import it from '@/i18n/it';
import { shiftEvents } from '@/plan/calendarEvents';
import { shiftEmoji } from '@/theme';

import type { ProfileRow } from './database.types';
import { loadPlanContext } from './plan';

export const PHONE_CALENDAR_DAYS = 60;
const KEY_ENABLED = 'reset.phoneCalendar.enabled.v1';
const KEY_ID = 'reset.phoneCalendar.id.v1';
const CALENDAR_COLOR = '#FFA529';
const supported = Platform.OS === 'ios' || Platform.OS === 'android';

export async function isPhoneCalendarEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY_ENABLED).catch(() => null)) === '1';
}

export type EnableResult = 'enabled' | 'denied' | 'unsupported';

/** Chiede il permesso, crea il calendario e scrive i turni. */
export async function enablePhoneCalendar(profile: ProfileRow): Promise<EnableResult> {
  if (!supported) return 'unsupported';
  const { granted } = await Calendar.requestCalendarPermissionsAsync();
  if (!granted) return 'denied';
  await AsyncStorage.setItem(KEY_ENABLED, '1');
  await syncPhoneCalendar(profile);
  return 'enabled';
}

/** Rimuove il calendario dedicato (e con lui tutti i turni). */
export async function disablePhoneCalendar() {
  await AsyncStorage.setItem(KEY_ENABLED, '0');
  const id = await AsyncStorage.getItem(KEY_ID);
  if (id && supported) {
    try {
      await Calendar.deleteCalendarAsync(id);
    } catch {
      // già rimosso dall'utente
    }
  }
  await AsyncStorage.removeItem(KEY_ID);
}

async function ensureCalendar(): Promise<string> {
  const saved = await AsyncStorage.getItem(KEY_ID);
  if (saved) {
    const all = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    if (all.some((c) => c.id === saved)) return saved;
  }
  const title = it.phoneCalendar.calendarName;
  let details: Partial<Calendar.Calendar>;
  if (Platform.OS === 'ios') {
    const def = await Calendar.getDefaultCalendarAsync();
    details = { title, color: CALENDAR_COLOR, entityType: Calendar.EntityTypes.EVENT, sourceId: def.source.id };
  } else {
    details = {
      title,
      color: CALENDAR_COLOR,
      entityType: Calendar.EntityTypes.EVENT,
      name: 'reset-turni',
      ownerAccount: 'Reset',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
      source: { isLocalAccount: true, name: 'Reset', type: Calendar.SourceType.LOCAL },
    };
  }
  const id = await Calendar.createCalendarAsync(details);
  await AsyncStorage.setItem(KEY_ID, id);
  return id;
}

let queue: Promise<void> = Promise.resolve();

/**
 * Riscrive i turni dei prossimi 60 giorni nel calendario dedicato (solo se attivo
 * e con il permesso). Le chiamate sono in fila per non sovrapporsi.
 */
export function syncPhoneCalendar(profile: ProfileRow | null): Promise<void> {
  queue = queue.then(() => doSync(profile)).catch((e) => console.warn('Calendario non aggiornato', e));
  return queue;
}

async function doSync(profile: ProfileRow | null) {
  if (!supported || !profile?.onboarding_completato_at || !(await isPhoneCalendarEnabled())) return;
  const { granted } = await Calendar.getCalendarPermissionsAsync();
  if (!granted) return;

  const calendarId = await ensureCalendar();
  const from = startOfDay(new Date());
  const to = addDays(from, PHONE_CALENDAR_DAYS + 1);

  // Il calendario è solo di Reset: si svuota l'intervallo e si riscrive.
  const existing = await Calendar.getEventsAsync([calendarId], addDays(from, -1), to);
  for (const e of existing) await Calendar.deleteEventAsync(e.id);

  const ctx = await loadPlanContext(profile, from, PHONE_CALENDAR_DAYS + 1);
  for (const ev of shiftEvents(ctx, from, PHONE_CALENDAR_DAYS)) {
    await Calendar.createEventAsync(calendarId, {
      title: `${shiftEmoji[ev.code]} ${it.shifts.names[ev.code]}`,
      startDate: ev.start,
      endDate: ev.end,
      allDay: ev.allDay,
      notes: it.phoneCalendar.eventNote,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }
}
