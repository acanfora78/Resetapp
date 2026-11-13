/**
 * Piano automatico: funzioni pure, calcolate sul dispositivo.
 *
 * Il "piano del giorno D" va dalla sveglia del giorno D fino all'ora in cui
 * si va a letto quella sera (anche se è dopo mezzanotte). Per i turni di
 * notte arriva fino al rientro a casa la mattina dopo.
 */
import { addDays, addMinutes, startOfDay } from 'date-fns';

import { NOTIFY, RULES } from './rules';
import { atClock, shiftWindow } from './time';
import type { DayContext, PlanInput, PlanItem, PlanItemKey, ShiftCode, WorkShiftCode } from './types';

interface SleepWindow {
  bed: Date;
  wake: Date;
}

type Ctx = Pick<PlanInput, 'shiftHours' | 'commuteMin' | 'preferredWake' | 'sleepNeedMin'>;

/** Turni che iniziano al mattino presto: Mattina e Giorno (12 h). */
const isEarlyShift = (c: ShiftCode | null): c is 'M' | 'G' => c === 'M' || c === 'G';

function workWindow(day: Date, code: WorkShiftCode, ctx: Ctx) {
  const h = ctx.shiftHours[code];
  return shiftWindow(day, h.start, h.end);
}

/** partenza = inizio_turno − tragitto − preparazione */
function departure(day: Date, code: WorkShiftCode, ctx: Ctx): Date {
  return addMinutes(workWindow(day, code, ctx).start, -(ctx.commuteMin + RULES.PREPARATION_MIN));
}

/** rientro = fine_turno + tragitto */
function homecoming(day: Date, code: WorkShiftCode, ctx: Ctx): Date {
  return addMinutes(workWindow(day, code, ctx).end, ctx.commuteMin);
}

/** Sveglia richiesta la mattina del giorno `day` in base al suo turno. */
function requiredMorningWake(day: Date, code: ShiftCode | null, ctx: Ctx): Date {
  if (isEarlyShift(code)) return addMinutes(departure(day, code, ctx), -RULES.WAKE_BEFORE_DEPARTURE_MIN);
  return atClock(day, ctx.preferredWake);
}

const later = (a: Date, b: Date) => (a > b ? a : b);

/**
 * Sonno notturno tra il giorno `day` e il giorno dopo.
 * Null se `day` è un turno di notte (si lavora).
 */
export function nightSleep(
  day: Date,
  shift: ShiftCode | null,
  nextShift: ShiftCode | null,
  ctx: Ctx,
  shiftAfterNext: ShiftCode | null = null,
): SleepWindow | null {
  const base = baseNightSleep(day, shift, nextShift, ctx);
  if (!base) return null;
  return applyTransition(day, base, shift, nextShift, shiftAfterNext, ctx);
}

const isFree = (c: ShiftCode | null) => c === 'R' || c === null;

/**
 * Transizioni graduali (al massimo TRANSITION_MAX_SHIFT_MIN al giorno):
 * - verso le notti: la notte prima della prima notte si va a letto e ci si sveglia più tardi;
 * - verso la mattina dopo i riposi: due notti prima si anticipa l'ora a letto,
 *   la sera prima vale già l'orario della mattina.
 */
function applyTransition(
  day: Date,
  base: SleepWindow,
  shift: ShiftCode | null,
  nextShift: ShiftCode | null,
  shiftAfterNext: ShiftCode | null,
  ctx: Ctx,
): SleepWindow {
  const step = RULES.TRANSITION_MAX_SHIFT_MIN;
  if (nextShift === 'N' && (isFree(shift) || shift === 'P')) {
    return { bed: addMinutes(base.bed, step), wake: addMinutes(base.wake, step) };
  }
  if ((isFree(shift) || shift === 'S') && isFree(nextShift) && isEarlyShift(shiftAfterNext)) {
    // Non prima dell'orario che servirà la sera dopo per il turno del mattino.
    const nextBed = baseNightSleep(addDays(day, 1), nextShift, shiftAfterNext, ctx)!.bed;
    const bed = later(addMinutes(base.bed, -step), addMinutes(nextBed, -24 * 60));
    return { bed, wake: addMinutes(bed, ctx.sleepNeedMin) };
  }
  return base;
}

function baseNightSleep(
  day: Date,
  shift: ShiftCode | null,
  nextShift: ShiftCode | null,
  ctx: Ctx,
): SleepWindow | null {
  if (shift === 'N') return null;
  const next = addDays(day, 1);

  if (shift === 'P') {
    const bed = addMinutes(homecoming(day, 'P', ctx), RULES.DECOMPRESSION_MIN);
    let wake = addMinutes(bed, ctx.sleepNeedMin);
    if (isEarlyShift(nextShift)) {
      const required = requiredMorningWake(next, nextShift, ctx);
      if (required < wake) wake = required;
    }
    return { bed, wake };
  }

  const wake = requiredMorningWake(next, nextShift, ctx);
  const buffer = isEarlyShift(nextShift) ? RULES.FALL_ASLEEP_BUFFER_MIN : 0;
  let bed = addMinutes(wake, -(ctx.sleepNeedMin + buffer));

  if (shift === 'G') {
    // Dopo un turno da 12 ore serve comunque la decompressione.
    bed = later(bed, addMinutes(homecoming(day, 'G', ctx), RULES.DECOMPRESSION_MIN));
  }
  return { bed, wake };
}

/**
 * Tipo di giornata. Un riposo subito dopo la notte vale come Smonto; la prima
 * notte di una serie (anche singola) è "first_night", l'ultima di una serie "last_night";
 * il primo riposo dopo un turno o uno smonto è "first_rest".
 */
export function dayContext(prev: ShiftCode | null, shift: ShiftCode | null, next: ShiftCode | null): DayContext {
  if (shift === 'N') {
    if (prev !== 'N') return 'first_night';
    if (next !== 'N') return 'last_night';
    return 'N';
  }
  if (prev === 'N' && (shift === 'R' || shift === null)) return 'S';
  if (shift === 'R' || shift === null) {
    return prev !== null && prev !== 'R' ? 'first_rest' : 'R';
  }
  return shift;
}

/** Sposta le azioni che cadono alla stessa ora, così nessun orario si ripete. */
function spreadCollisions(items: PlanItem[]): PlanItem[] {
  const sorted = [...items].sort((a, b) => a.time.getTime() - b.time.getTime());
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    if (cur.time.getTime() <= prev.time.getTime()) {
      sorted[i] = { ...cur, time: addMinutes(prev.time, RULES.COLLISION_SHIFT_MIN) };
    }
  }
  return sorted;
}

/** Calcola le azioni del piano per il giorno indicato, ordinate per orario e senza orari ripetuti. */
export function computePlan(input: PlanInput): PlanItem[] {
  const day = startOfDay(input.date);
  const items: PlanItem[] = [];
  const context = dayContext(input.prevShift, input.shift, input.nextShift);
  const add = (key: PlanItemKey, time: Date, ctx: DayContext = context) =>
    items.push({ key, time, notify: NOTIFY[key], context: ctx });

  const shift = input.shift;
  const afterNight = input.prevShift === 'N';

  // Turno "effettivo": un riposo subito dopo la notte segue le regole dello smonto.
  const effective: ShiftCode = afterNight && (shift === 'R' || shift === null) ? 'S' : (shift ?? 'R');

  // 1. Il risveglio con cui comincia la giornata.
  let wake: Date | null = null;
  if (afterNight) {
    const sleepStart = addMinutes(homecoming(addDays(day, -1), 'N', input), RULES.POST_NIGHT_ROUTINE_MIN);
    if (shift === 'N') {
      add('day_sleep', sleepStart); // di nuovo notte: sonno pieno
      wake = addMinutes(sleepStart, input.sleepNeedMin);
    } else {
      add('short_sleep', sleepStart); // smonto: sonno breve, poi in piedi
      wake = addMinutes(sleepStart, RULES.SMONTO_SLEEP_MIN);
    }
  } else {
    wake = nightSleep(addDays(day, -1), input.prevShift, shift, input, input.nextShift)?.wake ?? null;
  }

  // Recupero del debito di sonno nei giorni di riposo: sveglia più tardi,
  // al massimo RECOVERY_MAX_EXTRA_MIN e non oltre RECOVERY_LATEST_WAKE.
  if (wake && effective === 'R' && !afterNight && (input.recoveryExtraMin ?? 0) > 0) {
    const extra = Math.min(input.recoveryExtraMin!, RULES.RECOVERY_MAX_EXTRA_MIN);
    const latest = atClock(day, RULES.RECOVERY_LATEST_WAKE);
    const later = addMinutes(wake, extra);
    if (wake < latest) wake = later < latest ? later : latest;
  }

  if (wake) {
    // Sveglia e luce allo stesso orario diventano un'unica azione.
    if (isEarlyShift(effective)) add('wake_bright_light', wake);
    else if (effective === 'R') add('wake_morning_light', wake);
    else add('wake', wake);
  }

  // 2. La notte che segue.
  const tonight = nightSleep(day, shift, input.nextShift, input, input.shiftAfterNext ?? null);

  // 3. Azioni specifiche del turno.
  switch (effective) {
    case 'M':
    case 'G': {
      if (
        input.lastNightSleepMin != null &&
        input.lastNightSleepMin < RULES.SHORT_SLEEP_THRESHOLD_MIN
      ) {
        add('nap_short', atClock(day, RULES.NAP_SHORT_TIME));
      }
      if (effective === 'G') {
        const w = workWindow(day, 'G', input);
        const mid = (w.end.getTime() - w.start.getTime()) * RULES.SHIFT_BREAK_FRACTION;
        add('shift_break', new Date(w.start.getTime() + mid));
      }
      break;
    }
    case 'P': {
      add('low_light', homecoming(day, 'P', input));
      break;
    }
    case 'N': {
      const w = workWindow(day, 'N', input);
      const napEnd = addMinutes(departure(day, 'N', input), -RULES.NAP_PRE_NIGHT_END_BEFORE_DEPARTURE_MIN);
      add('nap_pre_night', addMinutes(napEnd, -RULES.NAP_PRE_NIGHT_DURATION_MIN));
      add('night_bright_light', w.start);
      const half = (w.end.getTime() - w.start.getTime()) / 2;
      add('night_caffeine_stop', new Date(w.start.getTime() + half));
      const midnight = startOfDay(addDays(day, 1));
      add(
        'night_light_meal',
        midnight > w.start && midnight < w.end
          ? midnight
          : addMinutes(w.start, RULES.NIGHT_MEAL_FALLBACK_AFTER_START_MIN),
      );
      add('drive_alert', w.end); // occhiali scuri e guida prudente
      add('post_night_routine', homecoming(day, 'N', input));
      break;
    }
    case 'S': {
      add('natural_light', atClock(day, RULES.NATURAL_LIGHT_TIME));
      break;
    }
    case 'R': {
      if (wake) add('light_activity', addMinutes(wake, RULES.LIGHT_ACTIVITY_AFTER_WAKE_MIN));
      break;
    }
  }

  // 4. Caffeina e ora di andare a letto.
  if (tonight) {
    if (effective === 'M' || effective === 'G' || effective === 'P') {
      add('caffeine_stop', addMinutes(tonight.bed, -RULES.CAFFEINE_CUTOFF_BEFORE_BED_MIN));
    }
    // L'ora di andare a letto si spiega con il turno di domani.
    add('bedtime', tonight.bed, dayContext(shift, input.nextShift, null));
  }

  return spreadCollisions(items);
}
