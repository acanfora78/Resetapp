import { addDays, differenceInMinutes, format } from 'date-fns';

import { POST_NIGHT_CHECKLIST } from '@/content/guides';
import strings from '@/i18n/it';

import { planForDay, mainPlanForDay } from '../context';
import type { PlanContext } from '../context';
import { resolveShift, toISODate } from '../cycle';
import { computePlan } from '../engine';
import { findMovementWindow } from '../movement';
import { ITEM_CATEGORY, ITEM_PRIORITY, RULES } from '../rules';
import { DEFAULT_HOURS_12H, DEFAULT_HOURS_8H } from '../shiftSetup';
import { notificationSchedule } from '../today';
import { applyVisibility, showsAlcoholTip } from '../visibility';
import type { DayContext, PlanInput, PlanItem, PlanItemKey, ShiftCode } from '../types';

const base: Omit<PlanInput, 'date' | 'prevShift' | 'shift' | 'nextShift'> = {
  shiftHours: DEFAULT_HOURS_8H,
  commuteMin: 30,
  preferredWake: '08:00',
  sleepNeedMin: 450,
};
const base12 = { ...base, shiftHours: DEFAULT_HOURS_12H };

const DAY = new Date(2026, 2, 10); // 10 marzo 2026
/** Giorno dell'ora legale in Italia (29 marzo 2026: alle 02:00 si va alle 03:00). */
const DST_DAY = new Date(2026, 2, 28);

function plan(
  prev: ShiftCode | null,
  shift: ShiftCode | null,
  next: ShiftCode | null,
  extra: Partial<PlanInput> = {},
  b: typeof base = base,
) {
  const items = computePlan({ ...b, date: DAY, prevShift: prev, shift, nextShift: next, ...extra });
  const map = new Map<PlanItemKey, string>();
  const at = new Map<PlanItemKey, Date>();
  for (const i of items) {
    map.set(i.key, format(i.time, 'dd HH:mm'));
    at.set(i.key, i.time);
  }
  return { items, map, at };
}

const ctxFrom = (codes: Record<string, ShiftCode>, over: Partial<PlanContext> = {}): PlanContext => ({
  shiftHours: DEFAULT_HOURS_8H,
  commuteMin: 30,
  preferredWake: '08:00',
  sleepNeedMin: 450,
  shiftOn: (d) => codes[toISODate(d)] ?? null,
  ...over,
});

const ctxCycle = (sequenza: ShiftCode[], dataInizio = '2026-03-09', over: Partial<PlanContext> = {}): PlanContext => ({
  shiftHours: DEFAULT_HOURS_8H,
  commuteMin: 30,
  preferredWake: '08:00',
  sleepNeedMin: 450,
  shiftOn: (d) => resolveShift(new Map(), { sequenza, dataInizio }, d),
  ...over,
});

const keys = (items: PlanItem[]) => items.map((i) => i.key);

// --- 1. Stacca dallo schermo -------------------------------------------------

describe('📵 Stacca dallo schermo', () => {
  it('45 minuti prima di andare a letto, in tutti i giorni con un sonno notturno', () => {
    for (const [prev, shift, next] of [
      ['R', 'R', 'M'],
      ['P', 'P', 'P'],
      ['R', 'M', 'M'],
      ['R', 'R', 'R'],
      ['N', 'S', 'R'],
      ['R', 'R', 'N'],
    ] as (ShiftCode | null)[][]) {
      const { at } = plan(prev!, shift!, next!);
      expect(differenceInMinutes(at.get('bedtime')!, at.get('screen_off')!)).toBe(RULES.SCREEN_OFF_BEFORE_BED_MIN);
    }
  });

  it('prima di un turno del mattino: 20:00 (a letto 20:45)', () => {
    expect(plan('R', 'R', 'M').map.get('screen_off')).toBe('10 20:00');
  });

  it('a cavallo della mezzanotte: smonto con a letto alle 00:30 → stacca alle 23:45', () => {
    const { map } = plan('N', 'S', 'R');
    expect(map.get('bedtime')).toBe('11 00:30');
    expect(map.get('screen_off')).toBe('10 23:45');
  });

  it('nessuna azione separata prima del sonno dopo la notte: è un passo della routine', () => {
    expect(plan('R', 'N', 'N').map.has('screen_off')).toBe(false);
    expect(plan('N', 'N', 'S').map.has('screen_off')).toBe(false);
    expect(POST_NIGHT_CHECKLIST.some((s) => /schermo/i.test(s.text))).toBe(true);
  });

  it('ora legale: sempre 45 minuti reali prima di andare a letto', () => {
    const items = computePlan({ ...base, date: DST_DAY, prevShift: 'R', shift: 'R', nextShift: 'R' });
    const bed = items.find((i) => i.key === 'bedtime')!.time;
    const off = items.find((i) => i.key === 'screen_off')!.time;
    expect(bed.getTime() - off.getTime()).toBe(45 * 60_000);
  });

  it('ora legale: notte del cambio prima di un turno del mattino', () => {
    const items = computePlan({ ...base, date: DST_DAY, prevShift: 'R', shift: 'R', nextShift: 'M' });
    const bed = items.find((i) => i.key === 'bedtime')!.time;
    const tomorrow = computePlan({ ...base, date: addDays(DST_DAY, 1), prevShift: 'R', shift: 'M', nextShift: 'M' });
    const wake = tomorrow.find((i) => i.key === 'wake_bright_light')!.time;
    // Sonno reale = fabbisogno + 15 min, anche se l'orologio salta un'ora.
    expect(differenceInMinutes(wake, bed)).toBe(450 + 15);
    expect(differenceInMinutes(bed, items.find((i) => i.key === 'screen_off')!.time)).toBe(45);
    expect(differenceInMinutes(bed, items.find((i) => i.key === 'prepare_evening')!.time)).toBe(75);
  });
});

// --- 2. Pasto principale --------------------------------------------------

describe('🍽️ Pasto principale prima del turno di notte', () => {
  it('8 ore: alla fine del pisolino pre-notte (20:00, partenza 21:00)', () => {
    const { map } = plan('R', 'N', 'N');
    expect(map.get('nap_pre_night')).toBe('10 18:30');
    expect(map.get('main_meal')).toBe('10 20:00');
  });

  it('notte da 12 ore (19–07): alle 17:00, partenza alle 18:00', () => {
    const { map } = plan('R', 'N', 'N', {}, base12);
    expect(map.get('main_meal')).toBe('10 17:00');
  });

  it('non prima di partenza − 120 minuti e mai durante il pisolino', () => {
    for (const commuteMin of [0, 15, 30, 45, 60, 90, 120]) {
      for (const b of [base, base12]) {
        for (const prev of ['R', 'N', 'P'] as ShiftCode[]) {
          const { at } = plan(prev, 'N', 'N', { commuteMin }, { ...b, commuteMin });
          const meal = at.get('main_meal')!;
          const nap = at.get('nap_pre_night');
          const leave = new Date(
            at.get('night_bright_light')!.getTime() - (commuteMin + RULES.PREPARATION_MIN) * 60_000,
          );
          if (nap) {
            const napEnd = nap.getTime() + RULES.NAP_PRE_NIGHT_DURATION_MIN * 60_000;
            expect(meal.getTime()).toBeGreaterThanOrEqual(napEnd);
            expect(differenceInMinutes(leave, meal)).toBeLessThanOrEqual(RULES.MAIN_MEAL_BEFORE_SHIFT_MAX_MIN);
          }
          expect(meal < leave).toBe(true);
        }
      }
    }
  });

  it('senza pisolino pre-notte: partenza − 90 minuti', () => {
    // Notti da 12 ore di fila, 45 min di tragitto: sonno 08:15–15:45, partenza 17:45.
    // Il pisolino (15:15–16:45) si sovrapporrebbe al sonno: niente pisolino.
    const { map } = plan('N', 'N', 'N', { commuteMin: 45 }, { ...base12, commuteMin: 45 });
    expect(map.get('wake')).toBe('10 15:45');
    expect(map.has('nap_pre_night')).toBe(false);
    expect(map.get('main_meal')).toBe('10 16:15');
  });

  it('solo nei giorni di notte', () => {
    for (const s of ['M', 'P', 'G', 'S', 'R'] as ShiftCode[]) {
      expect(plan('R', s, 'R').map.has('main_meal')).toBe(false);
    }
  });
});

// --- 3. Prepara tutto la sera prima ----------------------------------------------

describe('🎒 Prepara tutto la sera prima', () => {
  it('la sera prima della Mattina: a letto − 75 minuti, prima di "Stacca dallo schermo"', () => {
    const { map, at } = plan('R', 'R', 'M');
    expect(map.get('prepare_evening')).toBe('10 19:30');
    expect(at.get('prepare_evening')! < at.get('screen_off')!).toBe(true);
  });

  it('la sera prima di un Giorno da 12 ore (a letto 21:45 → 20:30)', () => {
    const { map } = plan('R', 'R', 'G', {}, base12);
    expect(map.get('bedtime')).toBe('10 21:45');
    expect(map.get('prepare_evening')).toBe('10 20:30');
  });

  it('dopo un turno G con domani di nuovo G', () => {
    const { at } = plan('R', 'G', 'G', {}, base12);
    expect(differenceInMinutes(at.get('bedtime')!, at.get('prepare_evening')!)).toBe(RULES.PREPARE_BEFORE_BED_MIN);
  });

  it('non prima di Pomeriggio, Notte o Riposo', () => {
    for (const next of ['P', 'N', 'R', null] as (ShiftCode | null)[]) {
      expect(plan('R', 'R', next).map.has('prepare_evening')).toBe(false);
    }
  });
});

// --- 4. Prepara la camera ------------------------------------------------

describe('🛏️ Prepara la camera', () => {
  it('al rientro dalla notte, prima della routine (notti di fila: sonno pieno)', () => {
    const { map } = plan('N', 'N', 'N');
    expect(map.get('prepare_room')).toBe('11 06:30');
    expect(map.get('post_night_routine')).toBe('11 06:45');
  });

  it('anche prima del sonno breve dello smonto (ultima notte)', () => {
    const { items } = plan('N', 'N', 'S');
    const k = keys(items);
    expect(k.indexOf('prepare_room')).toBeLessThan(k.indexOf('post_night_routine'));
    expect(items.find((i) => i.key === 'prepare_room')!.context).toBe('last_night');
  });

  it('notte da 12 ore: rientro alle 07:30 del giorno dopo', () => {
    expect(plan('R', 'N', 'S', {}, base12).map.get('prepare_room')).toBe('11 07:30');
  });

  it('con "Organizzazione" spenta la routine resta al rientro', () => {
    const { map } = plan('N', 'N', 'N', { prefs: { organization: false } });
    expect(map.has('prepare_room')).toBe(false);
    expect(map.get('post_night_routine')).toBe('11 06:30');
  });
});

// --- 5. Movimento ---------------------------------------------------

describe('🏃 Movimento al momento giusto', () => {
  it('riposo: un’ora dopo la sveglia', () => {
    expect(plan('R', 'R', 'R').map.get('movement')).toBe('10 09:00');
  });

  it('mattina: dopo il rientro (14:30)', () => {
    expect(plan('R', 'M', 'M').map.get('movement')).toBe('10 14:30');
  });

  it('mattina con pisolino breve: almeno 60 minuti dopo il pisolino', () => {
    // pisolino 14:00–14:20 → movimento dalle 15:20
    expect(plan('R', 'M', 'M', { lastNightSleepMin: 300 }).map.get('movement')).toBe('10 15:20');
  });

  it('pomeriggio: la mattina, prima di partire', () => {
    expect(plan('P', 'P', 'P').map.get('movement')).toBe('10 08:00');
  });

  it('prima notte: la mattina, lontano dal pisolino', () => {
    expect(plan('R', 'N', 'N').map.get('movement')).toBe('10 10:30');
  });

  it('Giorno da 12 ore con altro G domani: nessuna finestra, l’azione non compare', () => {
    expect(plan('R', 'G', 'G', {}, base12).map.has('movement')).toBe(false);
  });

  it('notti di fila: tra sonno e pisolino non c’è spazio, l’azione non compare', () => {
    expect(plan('N', 'N', 'N').map.has('movement')).toBe(false);
  });

  it('smonto: diventa la passeggiata delle 15 (una sola azione)', () => {
    const { map } = plan('N', 'S', 'R');
    expect(map.get('light_walk')).toBe('10 15:00');
    expect(map.has('movement')).toBe(false);
  });

  it('mai nelle 3 ore prima di un sonno o di un pisolino, mai prima di 60 min dalla sveglia', () => {
    const shifts: (ShiftCode | null)[] = ['M', 'P', 'N', 'S', 'R', null];
    for (const b of [base, base12]) {
      for (const prev of shifts) {
        for (const s of shifts) {
          for (const next of shifts) {
            const { items, at } = plan(prev, s, next, {}, b);
            const m = at.get('movement');
            if (!m) continue;
            const end = m.getTime() + RULES.MOVEMENT_DURATION_MIN * 60_000;
            const bed = at.get('bedtime');
            if (bed) expect(bed.getTime() - end).toBeGreaterThanOrEqual(RULES.MOVEMENT_MIN_BEFORE_SLEEP_H * 3_600_000);
            const nap = at.get('nap_pre_night') ?? at.get('nap_short');
            if (nap && nap > m) expect(nap.getTime() - end).toBeGreaterThanOrEqual(RULES.MOVEMENT_MIN_BEFORE_SLEEP_H * 3_600_000);
            const wake = items.find((i) => i.key.startsWith('wake'))?.time;
            if (wake) expect(differenceInMinutes(m, wake)).toBeGreaterThanOrEqual(RULES.MOVEMENT_MIN_AFTER_WAKE_MIN);
          }
        }
      }
    }
  });

  it('non si sovrappone a un evento', () => {
    const ctx = ctxFrom({ '2026-03-10': 'R', '2026-03-09': 'R', '2026-03-11': 'R' }, {
      extraItems: (d) =>
        toISODate(d) === '2026-03-10'
          ? [{ key: 'event', time: new Date(2026, 2, 10, 9), end: new Date(2026, 2, 10, 11), notify: false, context: 'R' }]
          : [],
    });
    const m = planForDay(ctx, DAY).find((i) => i.key === 'movement')!;
    expect(format(m.time, 'HH:mm')).toBe('11:00');
  });

  it('funzione pura: nessuna finestra se tutto è occupato', () => {
    const from = new Date(2026, 2, 10, 8);
    expect(
      findMovementWindow({
        from,
        until: new Date(2026, 2, 10, 12),
        sleeps: [{ start: new Date(2026, 2, 10, 0), end: from }],
        busy: [{ start: new Date(2026, 2, 10, 9), end: new Date(2026, 2, 10, 12) }],
      }),
    ).toBeNull();
  });

  it('ora legale: 60 minuti reali dopo la sveglia', () => {
    const items = computePlan({ ...base, date: addDays(DST_DAY, 1), prevShift: 'R', shift: 'R', nextShift: 'R' });
    const wake = items.find((i) => i.key === 'wake_morning_light')!.time;
    const m = items.find((i) => i.key === 'movement')!.time;
    expect(m.getTime() - wake.getTime()).toBe(60 * 60_000);
  });
});

// --- 6. Consiglio sull'alcol --------------------------------------------------

describe('🍷 Niente alcol per addormentarti', () => {
  // Schema M-P-N-S-R: smonto ogni 5 giorni (12, 17, 22, 27 marzo…).
  const ctx = ctxCycle(['M', 'P', 'N', 'S', 'R']);

  it('solo il giorno dopo l’ultima notte, al massimo una volta ogni 7 giorni', () => {
    const shown = [];
    for (let d = 9; d <= 31; d++) if (showsAlcoholTip(ctx.shiftOn, new Date(2026, 2, d))) shown.push(d);
    // 12 sì, 17 no (5 giorni), 22 sì (10 dal 12), 27 no, …
    expect(shown).toEqual([12, 22]);
  });

  it('è un consiglio senza orario, sempre in "Altri consigli" e mai notificato', () => {
    const tip = planForDay(ctx, new Date(2026, 2, 12)).find((i) => i.key === 'alcohol_tip')!;
    expect(tip).toBeDefined();
    expect(tip.tip).toBe(true);
    expect(tip.extra).toBe(true);
    expect(tip.notify).toBe(false);
  });

  it('dopo l’ultima notte anche se il giorno dopo si lavora', () => {
    const c = ctxFrom({ '2026-03-09': 'N', '2026-03-10': 'P' });
    expect(showsAlcoholTip(c.shiftOn, DAY)).toBe(true);
  });

  it('con "Abitudini" spenta non compare', () => {
    const off = ctxCycle(['M', 'P', 'N', 'S', 'R'], '2026-03-09', { prefs: { habits: false } });
    expect(planForDay(off, new Date(2026, 2, 12)).some((i) => i.key === 'alcohol_tip')).toBe(false);
  });

  it('testo senza toni moralistici', () => {
    expect(strings.plan.items.alcohol_tip.why).toMatch(/sonno più leggero e spezzato/);
  });
});

// --- Spiegazioni per tipo di giornata ------------------------------------------

describe('Spiegazioni delle nuove azioni', () => {
  const NEW: PlanItemKey[] = ['screen_off', 'main_meal', 'prepare_evening', 'prepare_room', 'movement', 'light_walk', 'alcohol_tip'];
  const CONTEXTS: DayContext[] = ['M', 'P', 'N', 'G', 'S', 'R', 'first_night', 'last_night', 'first_rest'];
  it('ogni azione nuova ha titolo e perché', () => {
    for (const k of NEW) {
      const t = strings.plan.items[k] as { title: string; why: string; whyBy?: Record<string, string> };
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.why.length).toBeGreaterThan(0);
      for (const c of Object.keys(t.whyBy ?? {})) expect(CONTEXTS).toContain(c);
    }
  });

  it('il movimento non parla mai di allenamento intenso', () => {
    const t = strings.plan.items.movement;
    for (const s of [t.why, ...Object.values(t.whyBy)]) expect(s).not.toMatch(/allenamento intenso|HIIT/i);
  });
});

// --- Regola 1: categorie -----------------------------------------------------------

describe('Regola 1: azioni essenziali e facoltative', () => {
  it('le essenziali non hanno categoria (non disattivabili)', () => {
    const essential: PlanItemKey[] = [
      'wake', 'wake_bright_light', 'wake_morning_light', 'bedtime', 'short_sleep', 'day_sleep',
      'nap_short', 'nap_pre_night', 'caffeine_stop', 'night_caffeine_stop', 'night_bright_light',
      'natural_light', 'post_night_routine', 'drive_alert', 'shift_break',
    ];
    for (const k of essential) expect(ITEM_CATEGORY[k]).toBeNull();
  });

  it('categorie facoltative', () => {
    expect(ITEM_CATEGORY.main_meal).toBe('meals');
    expect(ITEM_CATEGORY.night_light_meal).toBe('meals');
    expect(ITEM_CATEGORY.movement).toBe('movement');
    expect(ITEM_CATEGORY.prepare_evening).toBe('organization');
    expect(ITEM_CATEGORY.prepare_room).toBe('organization');
    expect(ITEM_CATEGORY.screen_off).toBe('habits');
    expect(ITEM_CATEGORY.alcohol_tip).toBe('habits');
  });

  it('una categoria spenta toglie le sue azioni da lista e notifiche', () => {
    const ctx = ctxCycle(['M', 'P', 'N', 'S', 'R'], '2026-03-09', {
      prefs: { meals: false, movement: false, organization: false, habits: false },
    });
    const now = new Date(2026, 2, 9, 0, 1);
    const all = [];
    for (let i = 0; i < 7; i++) all.push(...planForDay(ctx, addDays(now, i)));
    for (const k of ['main_meal', 'night_light_meal', 'movement', 'light_walk', 'prepare_evening', 'prepare_room', 'screen_off', 'alcohol_tip']) {
      expect(all.some((i) => i.key === k)).toBe(false);
    }
    const sched = notificationSchedule(ctx, now);
    expect(sched.some((r) => ITEM_CATEGORY[r.key] !== null)).toBe(false);
  });

  it('tutte accese di default', () => {
    const ctx = ctxCycle(['M', 'P', 'N', 'S', 'R']);
    const k = keys(planForDay(ctx, new Date(2026, 2, 11))); // prima notte
    expect(k).toEqual(expect.arrayContaining(['main_meal', 'night_light_meal', 'prepare_room', 'movement']));
  });
});

// --- Regola 2: massimo 7 azioni visibili ---------------------------------------------

describe('Regola 2: massimo 7 azioni visibili', () => {
  it('notti di fila: 7 essenziali visibili, il resto in "Altri consigli"', () => {
    const ctx = ctxCycle(['N']);
    const items = planForDay(ctx, DAY);
    const visible = items.filter((i) => !i.extra);
    expect(visible.length).toBe(RULES.MAX_VISIBLE_ACTIONS);
    expect(items.filter((i) => i.extra).map((i) => i.key).sort()).toEqual(['main_meal', 'night_light_meal', 'prepare_room']);
  });

  it('prima notte: il pasto principale (priorità più alta) resta visibile', () => {
    const ctx = ctxCycle(['M', 'P', 'N', 'S', 'R']);
    const items = planForDay(ctx, new Date(2026, 2, 11));
    expect(items.filter((i) => !i.extra)).toHaveLength(7);
    expect(items.find((i) => i.key === 'main_meal')!.extra).toBeUndefined();
    expect(items.find((i) => i.key === 'movement')!.extra).toBe(true);
  });

  it('le azioni in "Altri consigli" non mandano notifiche', () => {
    const ctx = ctxCycle(['N']);
    const now = new Date(2026, 2, 10, 0, 1);
    const extraIds = new Set(
      planForDay(ctx, DAY).filter((i) => i.extra).map((i) => `${toISODate(DAY)}_${i.key}`),
    );
    for (const r of notificationSchedule(ctx, now)) expect(extraIds.has(r.id)).toBe(false);
  });

  it('le essenziali restano visibili anche oltre il limite', () => {
    const t = new Date(2026, 2, 10, 8);
    const mk = (key: PlanItemKey, m: number): PlanItem => ({ key, time: new Date(t.getTime() + m * 60_000), notify: true, context: 'R' });
    const items = [
      mk('wake', 0), mk('nap_short', 10), mk('caffeine_stop', 20), mk('drive_alert', 30), mk('natural_light', 40),
      mk('post_night_routine', 50), mk('shift_break', 60), mk('event', 70), mk('bedtime', 80), mk('movement', 90),
    ];
    const out = applyVisibility(items, 7);
    expect(out.filter((i) => !i.extra)).toHaveLength(9);
    expect(out.find((i) => i.key === 'movement')!.extra).toBe(true);
  });

  it('ordine di priorità configurabile: a letto, sveglia, pisolini, caffeina, guida, luce, routine, pausa, pasto, camera, schermo, prepara, movimento, alcol', () => {
    const order: PlanItemKey[] = [
      'bedtime', 'wake', 'nap_pre_night', 'caffeine_stop', 'drive_alert', 'night_bright_light',
      'post_night_routine', 'shift_break', 'main_meal', 'prepare_room', 'screen_off', 'prepare_evening',
      'movement', 'alcohol_tip',
    ];
    for (let i = 1; i < order.length; i++) {
      expect(ITEM_PRIORITY[order[i]!]).toBeGreaterThan(ITEM_PRIORITY[order[i - 1]!]);
    }
  });

  it('le facoltative più importanti restano visibili quando c’è spazio', () => {
    const t = new Date(2026, 2, 10, 8);
    const mk = (key: PlanItemKey, m: number): PlanItem => ({ key, time: new Date(t.getTime() + m * 60_000), notify: true, context: 'R' });
    const out = applyVisibility([
      mk('wake', 0), mk('movement', 5), mk('prepare_evening', 10), mk('screen_off', 20), mk('bedtime', 30),
    ], 4);
    expect(out.filter((i) => i.extra).map((i) => i.key)).toEqual(['movement']);
  });

  it('punteggio e serie contano solo le azioni visibili', () => {
    const ctx = ctxCycle(['N']);
    expect(mainPlanForDay(ctx, DAY)).toHaveLength(7);
    expect(planForDay(ctx, DAY).length).toBeGreaterThan(7);
  });
});
