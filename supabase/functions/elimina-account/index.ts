// Elimina l'account dell'utente che chiama la funzione.
// Tutte le tabelle hanno `on delete cascade` su auth.users: cancellando l'utente
// si cancellano profilo, turni, diario, eventi, test, caffè e abbonamento.
import { admin, cors, json, requireUser } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'metodo non consentito' }, 405);

  const user = await requireUser(req);
  if (!user) return json({ error: 'non autenticato' }, 401);

  const { error } = await admin().auth.admin.deleteUser(user.id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
});
