// Stato degli abbonamenti letto direttamente dalle API di Apple e Google.
// I dati arrivano dagli store su connessione autenticata: sono la fonte affidabile.
import { decodeJws, signJwt } from './jwt.ts';

export type Prodotto = 'mensile' | 'annuale';
export type Stato = 'attivo' | 'scaduto' | 'annullato' | 'rimborsato';

export interface StoreStatus {
  piattaforma: 'ios' | 'android';
  prodotto: Prodotto;
  stato: Stato;
  scadenza: string | null;
  transaction_id_originale: string;
}

const env = (k: string) => {
  const v = Deno.env.get(k);
  if (!v) throw new Error(`Segreto mancante: ${k}`);
  return v;
};

export function prodottoDa(productId: string): Prodotto {
  if (productId === env('IAP_PRODUCT_MONTHLY')) return 'mensile';
  if (productId === env('IAP_PRODUCT_YEARLY')) return 'annuale';
  throw new Error(`Prodotto sconosciuto: ${productId}`);
}

// --- Apple: App Store Server API ------------------------------------------------

async function appleToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return signJwt(
    'ES256',
    { kid: env('APPLE_KEY_ID') },
    { iss: env('APPLE_ISSUER_ID'), iat: now, exp: now + 1200, aud: 'appstoreconnect-v1', bid: env('APPLE_BUNDLE_ID') },
    env('APPLE_PRIVATE_KEY'),
  );
}

async function appleGet(path: string): Promise<Response> {
  const token = await appleToken();
  const headers = { Authorization: `Bearer ${token}` };
  // Prima produzione, poi sandbox (build di TestFlight).
  const prod = await fetch(`https://api.storekit.itunes.apple.com${path}`, { headers });
  if (prod.status !== 404) return prod;
  return fetch(`https://api.storekit-sandbox.itunes.apple.com${path}`, { headers });
}

interface AppleTx {
  bundleId: string;
  productId: string;
  originalTransactionId: string;
  expiresDate?: number;
  revocationDate?: number;
}

/** Stato attuale di un abbonamento Apple a partire da una transazione qualsiasi. */
export async function appleStatus(transactionId: string): Promise<StoreStatus> {
  const res = await appleGet(`/inApps/v1/subscriptions/${encodeURIComponent(transactionId)}`);
  if (!res.ok) throw new Error(`App Store: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as {
    data: { lastTransactions: { status: number; originalTransactionId: string; signedTransactionInfo: string }[] }[];
  };
  const last = body.data.flatMap((g) => g.lastTransactions)[0];
  if (!last) throw new Error('App Store: nessuna transazione');
  const tx = decodeJws<AppleTx>(last.signedTransactionInfo);
  if (tx.bundleId !== env('APPLE_BUNDLE_ID')) throw new Error('App Store: bundle non valido');
  // status: 1 attivo, 2 scaduto, 3 tentativo di rinnovo, 4 periodo di grazia, 5 revocato
  const stato: Stato = tx.revocationDate
    ? 'rimborsato'
    : last.status === 1 || last.status === 4
      ? 'attivo'
      : last.status === 5
        ? 'rimborsato'
        : 'scaduto';
  return {
    piattaforma: 'ios',
    prodotto: prodottoDa(tx.productId),
    stato,
    scadenza: tx.expiresDate ? new Date(tx.expiresDate).toISOString() : null,
    transaction_id_originale: tx.originalTransactionId,
  };
}

// --- Google: Play Developer API ---------------------------------------------------

async function googleAccessToken(): Promise<string> {
  const sa = JSON.parse(env('GOOGLE_SERVICE_ACCOUNT_JSON')) as { client_email: string; private_key: string };
  const now = Math.floor(Date.now() / 1000);
  const assertion = await signJwt(
    'RS256',
    {},
    {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    sa.private_key,
  );
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!res.ok) throw new Error(`Google OAuth: ${res.status}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

export async function googleStatus(purchaseToken: string): Promise<StoreStatus> {
  const pkg = env('GOOGLE_PACKAGE_NAME');
  const res = await fetch(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`,
    { headers: { Authorization: `Bearer ${await googleAccessToken()}` } },
  );
  if (!res.ok) throw new Error(`Google Play: ${res.status} ${await res.text()}`);
  const s = (await res.json()) as { subscriptionState: string; lineItems: { productId: string; expiryTime?: string }[] };
  const item = s.lineItems[0]!;
  const map: Record<string, Stato> = {
    SUBSCRIPTION_STATE_ACTIVE: 'attivo',
    SUBSCRIPTION_STATE_IN_GRACE_PERIOD: 'attivo',
    SUBSCRIPTION_STATE_CANCELED: 'annullato',
    SUBSCRIPTION_STATE_EXPIRED: 'scaduto',
    SUBSCRIPTION_STATE_ON_HOLD: 'scaduto',
    SUBSCRIPTION_STATE_PAUSED: 'scaduto',
  };
  // "Annullato" ma non ancora scaduto: l'utente ha accesso fino alla fine del periodo pagato.
  let stato = map[s.subscriptionState] ?? 'scaduto';
  if (stato === 'annullato' && item.expiryTime && new Date(item.expiryTime) > new Date()) stato = 'attivo';
  return {
    piattaforma: 'android',
    prodotto: prodottoDa(item.productId),
    stato,
    scadenza: item.expiryTime ?? null,
    transaction_id_originale: purchaseToken,
  };
}
