-- Reset — turni da 12 ore (Fase 2, aggiornamento)
-- Aggiunge il turno Giorno (G), l'interruttore "Non faccio questo turno"
-- e il tipo di organizzazione dei turni scelto nell'onboarding.

alter table public.shift_types
  drop constraint shift_types_codice_check,
  add constraint shift_types_codice_check check (codice in ('M', 'P', 'N', 'G', 'S', 'R')),
  add column attivo boolean not null default true;

comment on column public.shift_types.attivo is 'false = "Non faccio questo turno".';

alter table public.shifts
  drop constraint shifts_codice_check,
  add constraint shifts_codice_check check (codice in ('M', 'P', 'N', 'G', 'S', 'R'));

alter table public.shift_patterns
  drop constraint shift_patterns_sequenza_check,
  add constraint shift_patterns_sequenza_check check (
    cardinality(sequenza) between 1 and 60
    and sequenza <@ array['M', 'P', 'N', 'G', 'S', 'R']::text[]
  );

alter table public.profiles
  add column tipo_turni text not null default '8h'
    check (tipo_turni in ('8h', '12h', 'personalizzati'));
