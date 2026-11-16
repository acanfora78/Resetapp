import { findFreeTrial, freeTrialDays } from '../iapOffers';

describe('prova gratuita dalle offerte dello store', () => {
  it('3 giorni gratis (iOS: periodo 3 giorni, 1 periodo)', () => {
    expect(freeTrialDays({ type: 'introductory', paymentMode: 'free-trial', period: { unit: 'day', value: 3 }, periodCount: 1 })).toBe(3);
  });

  it('1 settimana gratis = 7 giorni', () => {
    expect(freeTrialDays({ paymentMode: 'free-trial', period: { unit: 'week', value: 1 } })).toBe(7);
  });

  it('le offerte a pagamento non sono prove gratuite', () => {
    expect(freeTrialDays({ paymentMode: 'pay-as-you-go', period: { unit: 'month', value: 1 } })).toBeNull();
    expect(freeTrialDays(null)).toBeNull();
    expect(freeTrialDays({ paymentMode: 'free-trial', period: { unit: 'unknown', value: 3 } })).toBeNull();
  });

  it('trova la prova gratuita tra più offerte (Android: piano base + prova)', () => {
    const offers = [
      { paymentMode: 'pay-as-you-go', period: { unit: 'month', value: 1 }, offerTokenAndroid: 'base' },
      { paymentMode: 'free-trial', period: { unit: 'day', value: 3 }, offerTokenAndroid: 'trial' },
    ];
    expect(findFreeTrial(offers)?.offerTokenAndroid).toBe('trial');
    expect(findFreeTrial([])).toBeNull();
    expect(findFreeTrial(undefined)).toBeNull();
  });
});
