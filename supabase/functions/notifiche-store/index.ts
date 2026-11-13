// Notifiche server-to-server degli store:
// - Apple App Store Server Notifications V2: POST { signedPayload }
// - Google Real-time Developer Notifications (Pub/Sub push): POST { message: { data } }
// Per entrambe lo stato viene riletto dalle API ufficiali (non ci si fida del contenuto).
// Va pubblicata con --no-verify-jwt; l'URL contiene ?token=STORE_NOTIFICATIONS_TOKEN.
import { admin, json } from '../_shared/auth.ts';
import { decodeJws } from '../_shared/jwt.ts';
import { appleStatus, googleStatus } from '../_shared/stores.ts';
import type { StoreStatus } from '../_shared/stores.ts';

async function save(status: StoreStatus) {
  const { error } = await admin()
    .from('subscriptions')
    .update({ ...status, aggiornato_at: new Date().toISOString() })
    .eq('transaction_id_originale', status.transaction_id_originale);
  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'metodo non consentito' }, 405);
  if (new URL(req.url).searchParams.get('token') !== Deno.env.get('STORE_NOTIFICATIONS_TOKEN')) {
    return json({ error: 'non autorizzato' }, 401);
  }
  try {
    const body = (await req.json()) as { signedPayload?: string; message?: { data?: string } };

    if (body.signedPayload) {
      const payload = decodeJws<{ data?: { signedTransactionInfo?: string } }>(body.signedPayload);
      const info = payload.data?.signedTransactionInfo;
      if (info) {
        const tx = decodeJws<{ originalTransactionId: string }>(info);
        await save(await appleStatus(tx.originalTransactionId));
      }
      return json({ ok: true });
    }

    if (body.message?.data) {
      const msg = JSON.parse(atob(body.message.data)) as { subscriptionNotification?: { purchaseToken: string } };
      const token = msg.subscriptionNotification?.purchaseToken;
      if (token) await save(await googleStatus(token));
      return json({ ok: true });
    }

    return json({ ok: true, ignorata: true });
  } catch (e) {
    // 500: lo store riproverà più tardi.
    return json({ error: (e as Error).message }, 500);
  }
});
