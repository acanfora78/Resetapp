-- Reset — schema iniziale (Fase 2)
-- Tutte le tabelle hanno Row Level Security: ogni utente vede e modifica solo le sue righe.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  lavoro text,
  sveglia_preferita time not null default '08:00',
  tragitto_min integer not null default 30 check (tragitto_min between 0 and 300),
  fabbisogno_sonno_min integer not null default 450 check (fabbisogno_sonno_min between 240 and 720),
  consenso_dati_at timestamptz,
  termini_accettati_at timestamptz,
  onboarding_completato_at timestamptz,
  notifiche jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on column public.profiles.consenso_dati_at is 'Consenso esplicito al trattamento dei dati sul sonno (GDPR). Null = nessun consenso / revocato.';
comment on column public.profiles.termini_accettati_at is 'Accettazione di Termini di servizio e Privacy.';
comment on column public.profiles.onboarding_completato_at is 'Momento in cui l''utente ha finito l''onboarding.';

alter table public.profiles enable row level security;

create policy "profiles: lettura propria" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: inserimento proprio" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles: modifica propria" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles: eliminazione propria" on public.profiles
  for delete to authenticated using ((select auth.uid()) = id);

-- Crea il profilo automaticamente alla registrazione.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- shift_types: tipi di turno con orari
-- ---------------------------------------------------------------------------
create table public.shift_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  codice text not null check (codice in ('M', 'P', 'N', 'S', 'R')),
  nome text not null,
  inizio time,
  fine time,
  unique (user_id, codice)
);

-- ---------------------------------------------------------------------------
-- shift_patterns: schema ciclico
-- ---------------------------------------------------------------------------
create table public.shift_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sequenza text[] not null check (
    cardinality(sequenza) between 1 and 60
    and sequenza <@ array['M', 'P', 'N', 'S', 'R']::text[]
  ),
  data_inizio date not null,
  attivo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Al massimo uno schema attivo per utente.
create unique index shift_patterns_un_attivo_per_utente
  on public.shift_patterns (user_id) where attivo;

-- ---------------------------------------------------------------------------
-- shifts: un turno per giorno
-- ---------------------------------------------------------------------------
create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data date not null,
  codice text not null check (codice in ('M', 'P', 'N', 'S', 'R')),
  manuale boolean not null default false,
  unique (user_id, data)
);

-- ---------------------------------------------------------------------------
-- sleep_logs: diario del sonno
-- ---------------------------------------------------------------------------
create table public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data date not null,
  a_letto timestamptz not null,
  sveglia timestamptz not null,
  minuti_dormiti integer not null check (minuti_dormiti between 0 and 1440),
  energia smallint not null check (energia between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, data),
  check (sveglia > a_letto)
);

-- ---------------------------------------------------------------------------
-- plan_checks: azioni del piano completate
-- ---------------------------------------------------------------------------
create table public.plan_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data date not null,
  item_key text not null,
  fatto_at timestamptz not null default now(),
  unique (user_id, data, item_key)
);

-- ---------------------------------------------------------------------------
-- daily_scores: punteggio recupero giornaliero
-- ---------------------------------------------------------------------------
create table public.daily_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data date not null,
  punteggio smallint not null check (punteggio between 0 and 100),
  unique (user_id, data)
);

-- ---------------------------------------------------------------------------
-- RLS "solo le proprie righe" per le tabelle con user_id
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['shift_types', 'shift_patterns', 'shifts', 'sleep_logs', 'plan_checks', 'daily_scores']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "%s: lettura propria" on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      t, t);
    execute format(
      'create policy "%s: inserimento proprio" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      t, t);
    execute format(
      'create policy "%s: modifica propria" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t, t);
    execute format(
      'create policy "%s: eliminazione propria" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      t, t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- subscriptions: stato abbonamento
-- L'utente può solo leggere il proprio stato. Scrive solo la Edge Function
-- di verifica acquisti (service role, che ignora la RLS).
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  piattaforma text not null check (piattaforma in ('ios', 'android')),
  prodotto text not null check (prodotto in ('mensile', 'annuale')),
  stato text not null check (stato in ('attivo', 'scaduto', 'annullato', 'rimborsato')),
  scadenza timestamptz,
  transaction_id_originale text unique,
  aggiornato_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions: lettura propria" on public.subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Generazione turni da schema ciclico.
-- Inserisce i turni automatici calcolati dall'app. Le righe modificate a mano
-- (manuale = true) non vengono mai sovrascritte.
-- Gira con i permessi dell'utente (security invoker), quindi vale la RLS.
-- ---------------------------------------------------------------------------
create function public.upsert_turni_automatici(p_turni jsonb)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.shifts (user_id, data, codice, manuale)
  select (select auth.uid()), (t ->> 'data')::date, t ->> 'codice', false
  from jsonb_array_elements(p_turni) as t
  on conflict (user_id, data) do update
    set codice = excluded.codice
    where public.shifts.manuale = false
      and public.shifts.codice is distinct from excluded.codice;
$$;

revoke execute on function public.upsert_turni_automatici(jsonb) from public, anon;
grant execute on function public.upsert_turni_automatici(jsonb) to authenticated;
