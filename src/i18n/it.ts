/**
 * Tutti i testi dell'interfaccia, in italiano.
 * Per aggiungere l'inglese in futuro basterà creare en.ts con la stessa struttura.
 */
import type { PlanItemKey, ShiftCode } from '@/plan/types';

export const it = {
  common: {
    continue: 'Continua',
    save: 'Salva',
    cancel: 'Annulla',
    done: 'Fatto',
    back: 'Indietro',
    skip: 'Salta',
    error: 'Qualcosa è andato storto',
    retry: 'Riprova',
    loading: 'Caricamento…',
    step: (n: number, total: number) => `Passo ${n} di ${total}`,
    minutes: (n: number) => `${n} min`,
  },

  shifts: {
    names: {
      M: 'Mattina',
      P: 'Pomeriggio',
      N: 'Notte',
      G: 'Giorno',
      S: 'Smonto',
      R: 'Riposo',
    } satisfies Record<ShiftCode, string>,
    noShift: 'Nessun turno',
    freeDay: 'Giorno libero',
  },

  welcome: {
    title: 'Dormi meglio.\nAnche su turni.',
    promise: 'Ogni giorno Reset ti dice cosa fare in base al tuo turno: quando dormire, quando fare il pisolino e quando staccare dalla caffeina.',
    benefits: [
      { icon: '🌙', text: 'Sai quando andare a letto, anche dopo la notte' },
      { icon: '😴', text: 'Pisolini al momento giusto, della durata giusta' },
      { icon: '☕', text: 'Sai quando staccare dalla caffeina' },
    ],
    start: 'Inizia',
    haveAccount: 'Ho già un account',
  },

  auth: {
    registerTitle: 'Crea il tuo account',
    registerSubtitle: 'Così i tuoi turni e i tuoi dati restano salvati, anche se cambi telefono.',
    loginTitle: 'Bentornato',
    loginSubtitle: 'Accedi per ritrovare turni e piano.',
    email: 'Email',
    password: 'Password',
    passwordHint: 'Almeno 8 caratteri',
    register: 'Registrati',
    login: 'Accedi',
    or: 'oppure',
    apple: 'Continua con Apple',
    google: 'Continua con Google',
    goToLogin: 'Hai già un account? Accedi',
    goToRegister: 'Non hai un account? Registrati',
    checkEmailTitle: 'Controlla la tua email',
    checkEmailBody: 'Ti abbiamo mandato un link per confermare l’indirizzo. Dopo averlo aperto, torna qui e accedi.',
    errors: {
      invalidEmail: 'Inserisci un’email valida.',
      shortPassword: 'La password deve avere almeno 8 caratteri.',
      invalidCredentials: 'Email o password non corretti.',
      emailNotConfirmed: 'Devi prima confermare l’email. Controlla la posta.',
      userExists: 'Esiste già un account con questa email. Prova ad accedere.',
      googleNotConfigured: 'L’accesso con Google non è ancora configurato.',
      appleUnavailable: 'Accedi con Apple non è disponibile su questo dispositivo.',
      generic: 'Accesso non riuscito. Riprova tra poco.',
    },
  },

  onboarding: {
    totalSteps: 9,
    job: {
      title: 'Che lavoro fai?',
      subtitle: 'Ci serve per darti consigli più adatti.',
      options: [
        { icon: '🏥', label: 'Sanità' },
        { icon: '🏭', label: 'Industria' },
        { icon: '📦', label: 'Logistica' },
        { icon: '🛡️', label: 'Sicurezza' },
        { icon: '🚚', label: 'Trasporti' },
        { icon: '👮', label: 'Forze dell’ordine' },
      ],
      other: { icon: '➕', label: 'Altro' },
      otherPlaceholder: 'Scrivi il tuo lavoro',
    },
    hours: {
      title: 'Orari dei tuoi turni',
      subtitle: 'Tocca un orario per cambiarlo.',
      modes: {
        '8h': 'Turni da 8 ore',
        '12h': 'Turni da 12 ore',
        personalizzati: 'Personalizzati',
      },
      start: 'Inizio',
      end: 'Fine',
      notDone: 'Non faccio questo turno',
      atLeastOne: 'Tieni attivo almeno un turno.',
    },
    pattern: {
      title: 'Il tuo schema di turni',
      subtitle: 'Imposta la sequenza che si ripete e il giorno da cui parte. Reset compila il calendario dei prossimi mesi.',
      presets: 'Schemi comuni',
      custom: 'Personalizzato',
      sequence: 'Sequenza',
      sequenceEmpty: 'Tocca i turni qui sotto per comporre la sequenza.',
      add: 'Aggiungi',
      removeLast: 'Togli l’ultimo',
      clear: 'Svuota',
      startDate: 'Il primo turno della sequenza è il',
      skip: 'Salta, inserisco i turni a mano',
      tooShort: 'Aggiungi almeno un turno alla sequenza.',
    },
    habits: {
      title: 'Sonno e tragitto',
      wake: 'Nei giorni liberi ti svegli alle',
      commute: 'Minuti di tragitto casa-lavoro',
      commuteHint: 'Solo andata',
      sleepNeed: 'Di quante ore di sonno hai bisogno?',
      sleepNeedHint: 'Se non lo sai, lascia 7,5 ore.',
      hours: (min: number) => `${String(min / 60).replace('.', ',')} ore`,
    },
    loading: {
      title: 'Sto creando il tuo piano…',
      lines: ['Turni letti', 'Orari calcolati', 'Piano pronto'],
    },
    preview: {
      title: 'Il tuo piano di domani',
      header: (shiftName: string, hours: string | null) =>
        hours ? `Domani · ${shiftName} ${hours}` : `Domani · ${shiftName}`,
      tonight: 'Stasera',
      tomorrow: 'Domani',
      note: 'Il piano si aggiorna da solo quando cambi turni o orari.',
    },
    save: {
      title: 'Salva il tuo piano',
      subtitle: 'Crea un account per non perdere turni e progressi.',
      subtitleLoggedIn: 'Ancora un passo: conferma i consensi per salvare il tuo piano.',
      nameLabel: 'Come ti chiami? (facoltativo)',
      namePlaceholder: 'Il tuo nome',
      consentFirst: 'Spunta le due caselle per continuare.',
      saving: 'Salvo il tuo piano…',
    },
    consent: {
      sleepData: 'Acconsento al trattamento dei miei dati sul sonno e sull’energia, per ricevere il piano personalizzato.',
      terms: 'Ho letto e accetto i Termini di servizio e l’Informativa privacy.',
      termsLink: 'Termini di servizio',
      privacyLink: 'Informativa privacy',
      disclaimer: 'Reset offre contenuti educativi su abitudini e organizzazione. Non è un dispositivo medico e non sostituisce il parere di un medico.',
    },
    paywall: {
      title: 'Sblocca il tuo piano',
      benefits: [
        { icon: '🗓️', text: 'Il piano di ogni giorno, calcolato sul tuo turno' },
        { icon: '🔔', text: 'Promemoria per sonno, luce, caffeina e pisolini' },
        { icon: '📈', text: 'Diario del sonno, statistiche e punteggio di recupero' },
      ],
      yearly: 'Annuale',
      yearlyPrice: '44,99 € all’anno',
      yearlyMonthly: '3,75 €/mese',
      yearlyBadge: 'Risparmi 25%',
      monthly: 'Mensile',
      monthlyPrice: '4,99 € al mese',
      renewal: 'Rinnovo automatico, disdici quando vuoi dalle impostazioni dell’App Store.',
      restore: 'Ripristina acquisti',
      restoreSoon: 'Gli acquisti arrivano nel prossimo aggiornamento.',
      terms: 'Termini',
      privacy: 'Privacy',
    },
  },

  tabs: {
    today: 'Oggi',
    calendar: 'Calendario',
    diary: 'Diario',
    guides: 'Guide',
    profile: 'Profilo',
  },

  today: {
    greeting: (nome: string | null) => (nome ? `Ciao ${nome}` : 'Ciao'),
    shiftOf: (shiftName: string) => `Oggi: ${shiftName}`,
    noShift: 'Oggi non hai turni inseriti.',
    planTitle: 'Il tuo piano di oggi',
    comingSoon: 'Spunte, punteggio di recupero e notifiche arrivano nel prossimo aggiornamento.',
    loadError: 'Non riesco a caricare il piano.',
  },

  placeholder: {
    comingSoon: 'In arrivo nei prossimi aggiornamenti.',
  },

  calendar: {
    title: 'Calendario',
    pattern: 'Schema ciclico',
    manualLegend: 'Modificato a mano',
    weekdays: ['L', 'M', 'M', 'G', 'V', 'S', 'D'],
    today: 'Oggi',
    loadError: 'Non riesco a caricare i turni.',
  },

  day: {
    chooseShift: 'Scegli il turno',
    restoreFromPattern: 'Ripristina dallo schema',
    restoreHint: (shiftName: string) => `Lo schema prevede: ${shiftName}`,
    removeShift: 'Rimuovi turno',
    manualNote: 'Questo giorno è stato modificato a mano: lo schema non lo cambierà.',
  },

  patternScreen: {
    title: 'Schema ciclico',
    active: (seq: string, date: string) => `Attivo: ${seq} dal ${date}`,
    none: 'Nessuno schema attivo. I turni si inseriscono a mano.',
    save: 'Salva e aggiorna il calendario',
    disable: 'Disattiva lo schema',
    disableConfirmTitle: 'Disattivare lo schema?',
    disableConfirmBody: 'I turni automatici da oggi in poi verranno tolti. Quelli modificati a mano restano.',
    saved: 'Calendario aggiornato.',
  },

  profile: {
    signOut: 'Esci',
    signedInAs: (email: string) => `Accesso come ${email}`,
  },

  plan: {
    items: {
      wake: { title: 'Sveglia', why: 'Un orario regolare aiuta il corpo a tenere il ritmo.' },
      wake_bright_light: { title: 'Sveglia + luce forte', why: 'Accendi tutte le luci o esci entro 30 minuti: il corpo capisce che la giornata è iniziata.' },
      wake_morning_light: { title: 'Sveglia + luce naturale', why: 'Esci o apri le finestre appena sveglio: tiene il ritmo regolare.' },
      bedtime: { title: 'A letto', why: 'Così dormi le ore che ti servono.' },
      low_light: { title: 'Luce bassa e decompressione', why: 'Luci soffuse dopo il turno aiutano a prendere sonno.' },
      caffeine_stop: { title: 'Stop caffeina', why: 'La caffeina resta in circolo per ore e disturba il sonno.' },
      nap_short: { title: 'Pisolino di 20 minuti', why: 'Hai dormito poco: un pisolino breve recupera senza intontirti.' },
      shift_break: { title: 'Pausa + pasto leggero', why: 'A metà turno mangia leggero e bevi acqua: arrivi alla fine con più energia.' },
      nap_pre_night: { title: 'Pisolino di 90 minuti', why: 'Un ciclo completo di sonno prima della notte ti tiene più lucido.' },
      night_bright_light: { title: 'Luce forte a inizio turno', why: 'Nella prima metà della notte la luce aiuta a restare sveglio.' },
      night_caffeine_stop: { title: 'Ultima caffeina', why: 'Dopo metà turno la caffeina rovina il sonno di domani.' },
      night_light_meal: { title: 'Pasti leggeri stanotte', why: 'Tra mezzanotte e le 6 evita i pasti pesanti.' },
      drive_alert: { title: 'Occhiali scuri e guida prudente', why: 'Meno luce sulla via di casa. Dopo la notte i riflessi sono più lenti: se hai sonno, fermati.' },
      post_night_routine: { title: 'Routine post-notte', why: 'Doccia tiepida, luce bassa, telefono lontano, stanza buia e fresca.' },
      day_sleep: { title: 'Sonno pieno', why: 'Stanotte lavori ancora: recupera tutto il sonno che ti serve.' },
      short_sleep: { title: 'Sonno breve (3–4 ore)', why: 'Poi in piedi, per dormire stanotte. Niente caffeina fino al risveglio.' },
      natural_light: { title: 'Luce naturale', why: 'Un po’ di luce nel pomeriggio ti riporta sul ritmo del giorno.' },
      light_activity: { title: 'Attività fisica leggera', why: 'Una camminata o un po’ di movimento aiutano il recupero.' },
    } satisfies Record<PlanItemKey, { title: string; why: string }>,
  },
} as const;

export type Strings = typeof it;
export default it;
