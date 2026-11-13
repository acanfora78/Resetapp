// Verifica un acquisto fatto nell'app e aggiorna la tabella subscriptions.
// Body: { platform: 'ios'|'android', productId, transactionId, purchaseToken }
import { admin, cors, json, requireUser } from '../_shared/auth.ts';
import { appleStatus, googleStatus } from '../_shared/stores.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'metodo non consentito' }, 405);
  const user = await requireUser(req);
  if (!user) return json({ error: 'non autenticato' }, 401);

  try {
    const b = (await req.json()) as { platform?: string; transactionId?: string; purchaseToken?: string };
    const status =
      b.platform === 'ios' && b.transactionId
        ? await appleStatus(b.transactionId)
        : b.platform === 'android' && b.purchaseToken
          ? await googleStatus(b.purchaseToken)
          : null;
    if (!status) return json({ error: 'richiesta non valida' }, 400);

    const db = admin();
    // Un abbonamento dello store appartiene a un solo account Reset.
    const { data: owner } = await db
      .from('subscriptions')
      .select('user_id')
      .eq('transaction_id_originale', status.transaction_id_originale)
      .maybeSingle();
    if (owner && owner.user_id !== user.id) return json({ error: 'abbonamento collegato a un altro account' }, 409);

    const { error } = await db
      .from('subscriptions')
      .upsert({ user_id: user.id, ...status, aggiornato_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    return json({ active: status.stato === 'attivo', stato: status.stato, scadenza: status.scadenza });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
