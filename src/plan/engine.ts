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
import type { PlanInput, PlanItem, PlanItemKey, ShiftCode } from './types';

interface SleepWindow {
  bed: Date;
  wake: Date;
}

type Ctx = Pick<PlanInput, 'shiftHours' | 'commuteMin' | 'preferredWake' | 'sleepNeedMin'>;

function workWindow(day: Date, code: 'M' | 'P' | 'N', ctx: Ctx) {
  const h = ctx.shiftHours[code];
  return shiftWindow(day, h.start, h.end);
}

/** partenza = inizio_turno − tragitto − preparazione */
function departure(day: Date, code: 'M' | 'P' | 'N', ctx: Ctx): Date {
  return addMinutes(workWindow(day, code, ctx).start, -(ctx.commuteMin + RULES.PREPARATION_MIN));
}

/** rientro = fine_turno + tragitto */
function homecoming(day: Date, code: 'M' | 'P' | 'N', ctx: Ctx): Date {
  return addMinutes(workWindow(day, code, ctx).end, ctx.commuteMin);
}

/** Sveglia richiesta la mattina del giorno `day` in base al suo turno. */
function requiredMorningWake(day: Date, code: ShiftCode | null, ctx: Ctx): Date {
  if (code === 'M') return addMinutes(departure(day, 'M', ctx), -RULES.WAKE_BEFORE_DEPARTURE_MIN);
  return atClock(day, ctx.preferredWake);
}

/**
 * Sonno notturno tra il giorno `day` e il giorno dopo.
 * Null se `day` è un turno di notte (si lavora).
 */
export function nightSleep(
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
    if (nextShift === 'M') {
      const required = requiredMorningWake(next, 'M', ctx);
      if (required < wake) wake = required;
    }
    return { bed, wake };
  }

  const wake = requiredMorningWake(next, nextShift, ctx);
  const buffer = nextShift === 'M' ? RULES.FALL_ASLEEP_BUFFER_MIN : 0;
  return { bed: addMinutes(wake, -(ctx.sleepNeedMin + buffer)), wake };
}

/** Calcola le azioni del piano per il giorno indicato, ordinate per orario. */
export function computePlan(input: PlanInput): PlanItem[] {
  const day = startOfDay(input.date);
  const items: PlanItem[] = [];
  const add = (key: PlanItemKey, time: Date) => items.push({ key, time, notify: NOTIFY[key] });

  const shift = input.shift;
  const afterNight = input.prevShift === 'N';

  // 1. Il risveglio con cui comincia la giornata.
  let wake: Date | null = null;
  if (afterNight) {
    const sleepStart = addMinutes(
      homecoming(addDays(day, -1), 'N', input),
      RULES.POST_NIGHT_ROUTINE_MIN,
    );
    if (shift === 'N') {
      // Di nuovo notte: sonno pieno.
      add('day_sleep', sleepStart);
      wake = addMinutes(sleepStart, input.sleepNeedMin);
    } else {
      // Smonto: sonno breve, poi in piedi.
      add('short_sleep', sleepStart);
      wake = addMinutes(sleepStart, RULES.SMONTO_SLEEP_MIN);
    }
  } else {
    wake = nightSleep(addDays(day, -1), input.prevShift, shift, input)?.wake ?? null;
  }
  if (wake) add('wake', wake);

  // 2. La notte che segue.
  const tonight = nightSleep(day, shift, input.nextShift, input);

  // 3. Azioni specifiche del turno.
  const effective: ShiftCode = afterNight && (shift === 'R' || shift === null) ? 'S' : (shift ?? 'R');

  switch (effective) {
    case 'M': {
      if (wake) add('bright_light', wake);
      if (
        input.lastNightSleepMin != null &&
        input.lastNightSleepMin < RULES.SHORT_SLEEP_THRESHOLD_MIN
      ) {
        add('nap_short', atClock(day, RULES.NAP_SHORT_TIME));
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
      add('night_light_meal', w.start);
      add('dark_glasses', w.end);
      add('drive_alert', w.end);
      add('post_night_routine', homecoming(day, 'N', input));
      break;
    }
    case 'S': {
      add('natural_light', atClock(day, RULES.NATURAL_LIGHT_TIME));
      break;
    }
    case 'R': {
      if (wake) {
        add('morning_light', wake);
        add('light_activity', addMinutes(wake, RULES.LIGHT_ACTIVITY_AFTER_WAKE_MIN));
      }
      break;
    }
  }

  // 4. Caffeina e ora di andare a letto.
  if (tonight) {
    if (effective === 'M' || effective === 'P') {
      add('caffeine_stop', addMinutes(tonight.bed, -RULES.CAFFEINE_CUTOFF_BEFORE_BED_MIN));
    }
    add('bedtime', tonight.bed);
  }

  return items.sort((a, b) => a.time.getTime() - b.time.getTime());
}
