-- Reset: "Cosa vuoi nel tuo piano" (categorie di azioni facoltative).
-- Colonna sul profilo: la tabella profiles ha già la Row Level Security attiva
-- e viene cancellata a cascata con l'account. Chiavi: meals, movement,
-- organization, habits (true/false). Una chiave mancante = categoria accesa.

alter table public.profiles
  add column if not exists preferenze_piano jsonb not null default '{}'::jsonb;
