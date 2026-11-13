-- Reset — eventi ("Posso andarci?") e test di vigilanza
-- Si cancellano insieme all'account (on delete cascade su auth.users).

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titolo text not null check (char_length(titolo) between 1 and 120),
  inizio timestamptz not null,
  fine timestamptz not null,
  created_at timestamptz not null default now(),
  check (fine > inizio)
);
create index events_utente_inizio on public.events (user_id, inizio);

create table public.vigilance_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fatto_at timestamptz not null default now(),
  mediana_ms integer not null check (mediana_ms between 0 and 10000),
  errori integer not null default 0 check (errori >= 0),
  esito text not null check (esito in ('green', 'yellow', 'red')),
  valido_riferimento boolean not null default false
);
create index vigilance_tests_utente_data on public.vigilance_tests (user_id, fatto_at);

do $$
declare
  t text;
begin
  foreach t in array array['events', 'vigilance_tests']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: lettura propria" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s: inserimento proprio" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s: modifica propria" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s: eliminazione propria" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t, t);
  end loop;
end;
$$;
