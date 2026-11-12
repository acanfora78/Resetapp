import { notificationCardState, snoozeNotificationCard } from '../notificationCard';

const day = (d: number) => new Date(2026, 10, d, 10, 0);

describe('Card "Attiva i promemoria"', () => {
  it('versione completa la prima volta', () => {
    expect(notificationCardState({}, day(1))).toBe('full');
  });

  it('con le notifiche attive non compare mai', () => {
    expect(notificationCardState({ abilitate: true }, day(1))).toBe('hidden');
    expect(notificationCardState({ abilitate: true, rimandi: 1 }, day(20))).toBe('hidden');
  });

  it('"Non ora": sparisce per 3 giorni, poi torna compatta', () => {
    const p1 = snoozeNotificationCard({}, day(1));
    expect(p1.rimandi).toBe(1);
    expect(notificationCardState(p1, day(2))).toBe('hidden');
    expect(notificationCardState(p1, new Date(2026, 10, 4, 9, 59))).toBe('hidden');
    expect(notificationCardState(p1, new Date(2026, 10, 4, 10, 0))).toBe('compact');
  });

  it('dopo 3 "Non ora" non compare più', () => {
    let p = snoozeNotificationCard({}, day(1));
    p = snoozeNotificationCard(p, day(5));
    expect(notificationCardState(p, day(9))).toBe('compact');
    p = snoozeNotificationCard(p, day(9));
    expect(p.rimandi).toBe(3);
    expect(notificationCardState(p, day(30))).toBe('hidden');
  });

  it('installazioni precedenti con abilitate = false contano come un "Non ora"', () => {
    expect(notificationCardState({ abilitate: false }, day(1))).toBe('compact');
    expect(snoozeNotificationCard({ abilitate: false }, day(1)).rimandi).toBe(2);
  });
});
