-- Reset — registro della caffeina (Fase B)
-- Si cancella insieme all'account (on delete cascade su auth.users).

create table public.caffeine_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  consumato_at timestamptz not null default now(),
  tipo text not null check (tipo in ('espresso', 'moka', 'energy', 'te_cola')),
  quantita_mg integer not null check (quantita_mg between 1 and 1000),
  created_at timestamptz not null default now()
);

create index caffeine_logs_utente_data on public.caffeine_logs (user_id, consumato_at desc);

alter table public.caffeine_logs enable row level security;

create policy "caffeine_logs: lettura propria" on public.caffeine_logs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "caffeine_logs: inserimento proprio" on public.caffeine_logs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "caffeine_logs: modifica propria" on public.caffeine_logs
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "caffeine_logs: eliminazione propria" on public.caffeine_logs
  for delete to authenticated using ((select auth.uid()) = user_id);
