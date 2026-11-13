/**
 * Abbonamenti con react-native-iap (StoreKit 2 / Google Play Billing).
 * Ogni acquisto viene verificato dalla Edge Function "verifica-acquisto", che
 * aggiorna la tabella subscriptions; solo dopo la verifica si chiude la transazione.
 */
import { Platform } from 'react-native';
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
} from 'react-native-iap';
import type { Purchase } from 'react-native-iap';

import { APP } from '@/constants/app';

import { supabase } from './supabase';

export type Plan = keyof typeof APP.IAP_PRODUCTS;
const SKUS: string[] = Object.values(APP.IAP_PRODUCTS);
const supported = Platform.OS === 'ios' || Platform.OS === 'android';

let connected = false;
/** Prodotti caricati dallo store (servono i token delle offerte su Android). */
let products: Record<string, unknown>[] = [];

async function ensureConnected() {
  if (!supported) throw new Error('Acquisti non disponibili su questa piattaforma.');
  if (!connected) connected = await initConnection();
  if (!connected) throw new Error('Store non raggiungibile.');
}

/** Prezzi localizzati dallo store (null se non disponibili). */
export async function loadPrices(): Promise<Record<Plan, string | null>> {
  const out: Record<Plan, string | null> = { mensile: null, annuale: null };
  try {
    await ensureConnected();
    products = ((await fetchProducts({ skus: SKUS, type: 'subs' })) ?? []) as unknown as Record<string, unknown>[];
    for (const [plan, sku] of Object.entries(APP.IAP_PRODUCTS) as [Plan, string][]) {
      const p = products.find((x) => x.id === sku || x.productId === sku);
      out[plan] = typeof p?.displayPrice === 'string' ? p.displayPrice : null;
    }
  } catch {
    // restano i prezzi di riferimento scritti nell'app
  }
  return out;
}

/** Avvia l'acquisto: il risultato arriva a `listenPurchases`. */
export async function buy(plan: Plan) {
  await ensureConnected();
  const sku = APP.IAP_PRODUCTS[plan];
  const product = products.find((x) => x.id === sku || x.productId === sku) as
    | { subscriptionOffers?: { offerTokenAndroid?: string | null }[] }
    | undefined;
  const offerToken = product?.subscriptionOffers?.[0]?.offerTokenAndroid ?? undefined;
  await requestPurchase({
    type: 'subs',
    request: {
      apple: { sku },
      google: { skus: [sku], ...(offerToken ? { subscriptionOffers: [{ sku, offerToken }] } : {}) },
    },
  });
}

/** Invia l'acquisto al server per la verifica. true se l'abbonamento risulta attivo. */
async function verify(p: Purchase): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('verifica-acquisto', {
    body: {
      platform: Platform.OS,
      productId: p.productId,
      transactionId: (p as { transactionId?: string }).transactionId ?? p.id,
      purchaseToken: p.purchaseToken ?? null,
    },
  });
  if (error) throw error;
  return (data as { active?: boolean })?.active === true;
}

/** Ascolta gli acquisti completati e gli errori. Restituisce la funzione per smettere. */
export function listenPurchases(onResult: (ok: boolean, error?: unknown) => void): () => void {
  if (!supported) return () => {};
  const ok = purchaseUpdatedListener(async (purchase) => {
    try {
      const active = await verify(purchase);
      await finishTransaction({ purchase, isConsumable: false });
      onResult(active);
    } catch (e) {
      onResult(false, e);
    }
  });
  const ko = purchaseErrorListener((e) => onResult(false, e));
  return () => {
    ok.remove();
    ko.remove();
  };
}

/** "Ripristina acquisti": verifica gli abbonamenti già comprati con questo account dello store. */
export async function restore(): Promise<boolean> {
  await ensureConnected();
  const purchases = (await getAvailablePurchases()) ?? [];
  let active = false;
  for (const p of purchases) {
    if (!SKUS.includes(p.productId)) continue;
    try {
      if (await verify(p)) active = true;
    } catch {
      // si prova con il prossimo
    }
  }
  return active;
}

export async function disconnect() {
  if (connected) await endConnection().catch(() => {});
  connected = false;
}
