/**
 * Regole per non appesantire la lista del piano. Funzioni pure.
 * - Le azioni essenziali sono sempre visibili.
 * - Al massimo MAX_VISIBLE_ACTIONS azioni visibili: le facoltative con priorità più bassa
 *   vanno in "Altri consigli", non vengono notificate e non contano per punteggio e serie.
 */
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';

import { ALWAYS_EXTRA, ITEM_CATEGORY, ITEM_PRIORITY, RULES } from './rules';
import type { PlanItem, ShiftCode } from './types';

export function applyVisibility(items: PlanItem[], max: number = RULES.MAX_VISIBLE_ACTIONS): PlanItem[] {
  const essentials = items.filter((i) => ITEM_CATEGORY[i.key] === null);
  const optional = items
    .filter((i) => ITEM_CATEGORY[i.key] !== null && !ALWAYS_EXTRA.has(i.key))
    .sort((a, b) => ITEM_PRIORITY[a.key] - ITEM_PRIORITY[b.key] || a.time.getTime() - b.time.getTime());
  const visible = new Set<PlanItem>([...essentials, ...optional.slice(0, Math.max(0, max - essentials.length))]);
  return items.map((i) => (visible.has(i) ? i : { ...i, extra: true, notify: false }));
}

/** Azioni della lista principale (escluse quelle in "Altri consigli"). */
export const visibleItems = (items: PlanItem[]) => items.filter((i) => !i.extra);
/** Azioni in "Altri consigli". */
export const extraItems = (items: PlanItem[]) => items.filter((i) => i.extra);

/** Giorno di smonto o primo giorno dopo l'ultima notte. */
const afterLastNight = (shiftOn: (d: Date) => ShiftCode | null, d: Date) =>
  shiftOn(addDays(d, -1)) === 'N' && shiftOn(d) !== 'N';

/**
 * Il consiglio sull'alcol compare nel giorno di smonto (o dopo l'ultima notte),
 * al massimo una volta ogni ALCOHOL_TIP_EVERY_DAYS giorni.
 */
export function showsAlcoholTip(shiftOn: (d: Date) => ShiftCode | null, day: Date): boolean {
  const every = RULES.ALCOHOL_TIP_EVERY_DAYS;
  const target = startOfDay(day);
  if (!afterLastNight(shiftOn, target)) return false;
  // Si ripercorrono le settimane precedenti per sapere quando è comparso l'ultima volta.
  let last: Date | null = null;
  for (let i = every * 6; i >= 0; i--) {
    const d = addDays(target, -i);
    if (afterLastNight(shiftOn, d) && (!last || differenceInCalendarDays(d, last) >= every)) last = d;
  }
  return last !== null && differenceInCalendarDays(target, last) === 0;
}
