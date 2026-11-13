/**
 * Tipi delle tabelle Supabase (scritti a mano, allineati a supabase/migrations).
 * In futuro si possono rigenerare con `supabase gen types typescript`.
 */
import type { CaffeineType } from '@/plan/rules';
import type { ShiftCode, ShiftMode } from '@/plan/types';

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type ProfileRow = {
  id: string;
  nome: string | null;
  lavoro: string | null;
  sveglia_preferita: string;
  tragitto_min: number;
  fabbisogno_sonno_min: number;
  consenso_dati_at: string | null;
  termini_accettati_at: string | null;
  onboarding_completato_at: string | null;
  tipo_turni: ShiftMode;
  notifiche: Record<string, unknown>;
  /** Categorie facoltative del piano (meals, movement, organization, habits). */
  preferenze_piano: Record<string, unknown>;
  created_at: string;
};

export type ShiftTypeRow = {
  id: string;
  user_id: string;
  codice: ShiftCode;
  nome: string;
  inizio: string | null;
  fine: string | null;
  attivo: boolean;
};

export type ShiftPatternRow = {
  id: string;
  user_id: string;
  sequenza: ShiftCode[];
  data_inizio: string;
  attivo: boolean;
  created_at: string;
};

export type ShiftRow = {
  id: string;
  user_id: string;
  data: string;
  codice: ShiftCode;
  manuale: boolean;
};

export type SleepLogRow = {
  id: string;
  user_id: string;
  data: string;
  a_letto: string;
  sveglia: string;
  minuti_dormiti: number;
  energia: number;
  note: string | null;
  created_at: string;
};

export type PlanCheckRow = {
  id: string;
  user_id: string;
  data: string;
  item_key: string;
  fatto_at: string;
};

export type DailyScoreRow = {
  id: string;
  user_id: string;
  data: string;
  punteggio: number;
};

export type CaffeineLogRow = {
  id: string;
  user_id: string;
  consumato_at: string;
  tipo: CaffeineType;
  quantita_mg: number;
  created_at: string;
};

export type EventRow = {
  id: string;
  user_id: string;
  titolo: string;
  inizio: string;
  fine: string;
  created_at: string;
};

export type VigilanceTestRow = {
  id: string;
  user_id: string;
  fatto_at: string;
  mediana_ms: number;
  errori: number;
  esito: 'green' | 'yellow' | 'red';
  valido_riferimento: boolean;
};

export type SubscriptionRow = {
  user_id: string;
  piattaforma: 'ios' | 'android';
  prodotto: 'mensile' | 'annuale';
  stato: 'attivo' | 'scaduto' | 'annullato' | 'rimborsato';
  scadenza: string | null;
  transaction_id_originale: string | null;
  aggiornato_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      shift_types: Table<ShiftTypeRow, Omit<ShiftTypeRow, 'id' | 'attivo'> & { id?: string; attivo?: boolean }>;
      shift_patterns: Table<
        ShiftPatternRow,
        Omit<ShiftPatternRow, 'id' | 'created_at' | 'attivo'> & { attivo?: boolean }
      >;
      shifts: Table<ShiftRow, Omit<ShiftRow, 'id'> & { id?: string }>;
      sleep_logs: Table<SleepLogRow, Omit<SleepLogRow, 'id' | 'created_at' | 'note'> & { note?: string | null }>;
      plan_checks: Table<PlanCheckRow>;
      daily_scores: Table<DailyScoreRow, Omit<DailyScoreRow, 'id'>>;
      subscriptions: Table<SubscriptionRow>;
      events: Table<EventRow, Omit<EventRow, 'id' | 'created_at'>>;
      vigilance_tests: Table<VigilanceTestRow, Omit<VigilanceTestRow, 'id'>>;
      caffeine_logs: Table<CaffeineLogRow, Omit<CaffeineLogRow, 'id' | 'created_at'>>;
    };
    Views: Record<string, never>;
    Functions: {
      upsert_turni_automatici: {
        Args: { p_turni: { data: string; codice: ShiftCode }[] };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
