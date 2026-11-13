/**
 * Tutti i testi dell'interfaccia, in italiano.
 * Per aggiungere l'inglese in futuro basterà creare en.ts con la stessa struttura.
 */
import type { DayContext, PlanItemKey, ShiftCode } from '@/plan/types';

interface PlanItemText {
  title: string;
  why: string;
  whyBy?: Partial<Record<DayContext, string>>;
}

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
    nightShiftOf: (shiftName: string) => `Stanotte: ${shiftName}`,
    noShift: 'Oggi non hai turni inseriti.',
    planTitle: 'Il tuo piano di oggi',
    nightPlanTitle: 'Il piano della notte',
    eveningPlanTitle: 'Il piano di ieri sera',
    yesterdayOf: (shiftName: string) => `Ieri: ${shiftName}`,
    progress: (done: number, total: number) => `${done} di ${total} fatte`,
    allDone: 'Tutto fatto. Ottimo lavoro.',
    next: 'Prossima',
    markDone: (title: string) => `Segna come fatta: ${title}`,
    markUndone: (title: string) => `Segna come da fare: ${title}`,
    doneGroup: (n: number) => `Fatte (${n})`,
    nextDay: (label: 'Domani' | 'Oggi', shiftName: string, hours: string | null) =>
      hours ? `${label}: ${shiftName} ${hours}` : `${label}: ${shiftName}`,
    nextDayFree: (label: 'Domani' | 'Oggi') => `${label}: nessun turno`,
    loadError: 'Non riesco a caricare il piano.',
    tapToRetry: 'Tocca per riprovare.',
    nightModeOn: 'Modalità notte attiva',
    notifCard: {
      title: 'Attiva i promemoria',
      body: 'Ti avviso quando è ora di dormire, staccare dalla caffeina o fare il pisolino.',
      enable: 'Attiva',
      later: 'Non ora',
      compact: 'Promemoria spenti',
    },
  },

  transitions: {
    card: {
      to_nights: 'Cambio turno in arrivo: notti',
      from_nights: 'Cambio turno in arrivo: fine delle notti',
      to_mornings: 'Cambio turno in arrivo: si torna alla mattina',
    },
    when: (days: number) => (days === 0 ? 'Oggi' : days === 1 ? 'Domani' : `Tra ${days} giorni`),
    open: 'Vedi i prossimi 3 giorni',
    screenTitle: 'Prossimi 3 giorni',
    intro: {
      to_nights: 'Il giorno prima vai a letto e ti alzi più tardi, il pomeriggio della prima notte fai un pisolino lungo. Così il corpo si sposta un po’ alla volta.',
      from_nights: 'Dopo l’ultima notte: sonno breve, luce naturale nel pomeriggio e a letto presto. Il giorno dopo sei di nuovo sul ritmo del giorno.',
      to_mornings: 'Nei due giorni prima anticipi l’ora a letto un po’ alla volta, invece di un salto brusco la sera prima.',
    },
    dayLabel: (label: string) => label,
    notification: {
      to_nights: { title: 'Domani inizi le notti', body: 'Stasera puoi fare un po’ più tardi: apri Reset per il piano dei prossimi giorni.' },
      from_nights: { title: 'Stanotte è l’ultima notte', body: 'Domani sonno breve e a letto presto: apri Reset per il piano.' },
      to_mornings: { title: 'Si torna alla mattina', body: 'Stasera a letto un po’ prima del solito: apri Reset per il piano.' },
    },
  },

  caffeine: {
    quickButton: '☕ Ho preso un caffè',
    sheetTitle: 'Cosa hai preso?',
    types: {
      espresso: 'Espresso',
      moka: 'Moka / caffè lungo',
      energy: 'Energy drink',
      te_cola: 'Tè / Cola',
    },
    mg: (n: number) => `circa ${n} mg`,
    saved: 'Registrato.',
    lateTitle: 'Capita',
    lateBody: 'Era dopo l’orario “Stop caffeina”: potresti metterci un po’ di più ad addormentarti. Stasera tieni la luce bassa e il telefono lontano.',
    cardTitle: 'Caffeina in circolo',
    ok: 'Ok: quando vai a letto sarà sotto la soglia.',
    high: (time: string, percent: number) =>
      `Alle ${time} avrai ancora circa il ${percent}% della caffeina di oggi.`,
    open: 'Vedi il grafico',
    screenTitle: 'Caffeina',
    chartLegendThreshold: 'Soglia sonno',
    chartLegendBed: 'A letto',
    nowLabel: 'Adesso',
    todayList: 'Ultime 24 ore',
    empty: 'Nessun caffè nelle ultime 24 ore.',
    remove: 'Elimina',
    note: 'Stima educativa: ogni persona smaltisce la caffeina in modo diverso. Non sostituisce il parere medico.',
  },

  events: {
    quickButton: '🎉 Posso andarci?',
    screenTitle: 'Posso andarci?',
    subtitle: 'Cena, compleanno, una domenica fuori: vediamo come incastrarlo con i turni.',
    titleLabel: 'Cosa',
    titlePlaceholder: 'Es. Cena da Luca',
    dayLabel: 'Giorno',
    startLabel: 'Inizio',
    durationLabel: 'Durata',
    duration: (min: number) => `${String(min / 60).replace('.', ',')} h`,
    check: 'Valuta',
    save: 'Salva l’evento',
    saved: 'Evento salvato: lo trovi nel calendario e nel piano di quel giorno.',
    verdict: {
      yes: 'Sì',
      yes_tips: 'Sì, con qualche accorgimento',
      no: 'Sconsigliato',
      on_shift: 'Sei in turno',
    },
    reason: {
      on_shift: (shift: string) => `In quell’orario sei in turno (${shift}), tragitto compreso.`,
      free: 'Non tocca né i turni né il sonno: goditela.',
      before_early: (end: string, shift: string, start: string, sleep: string) =>
        `Finisce alle ${end} e domani alle ${start} hai ${shift}: dormiresti ${sleep}.`,
      during_day_sleep: 'Cade nel sonno principale dopo la notte, e stanotte lavori ancora: meglio rinunciare o spostarlo.',
      during_short_sleep: 'Cade nel sonno breve dello smonto: si può fare, poi dormi subito dopo.',
      pre_night_nap: (dep: string) => `Cade nel pisolino prima della notte (si parte alle ${dep}).`,
      late_free: (wake: string) => `Domani hai margine: sposta la sveglia alle ${wake}.`,
      cuts_sleep: (sleep: string) => `Dormiresti solo ${sleep}.`,
    },
    tip: {
      nap: (time: string, min: number) => `Pisolino di ${min} minuti alle ${time}.`,
      wake: (time: string) => `Sveglia alle ${time}, non più tardi: il ritmo resta stabile.`,
      bed: (time: string) => `A letto appena possibile, entro le ${time}.`,
      caffeine: (time: string) => `Niente caffè dopo le ${time}.`,
      sleep_after: (time: string) => `Sonno breve subito dopo, dalle ${time}.`,
      next_day: (time: string) => `Domani luce forte appena sveglio e, se puoi, 20 minuti di pisolino alle ${time}.`,
    },
    hours: (min: number) => {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return m ? `${h} ore e ${m === 30 ? 'mezza' : `${m} minuti`}` : `${h} ore`;
    },
    listTitle: 'Eventi',
    remove: 'Elimina evento',
    tooLong: 'La durata massima è di 24 ore.',
    titleMissing: 'Scrivi cosa devi fare.',
  },

  vigilance: {
    quickButton: '🎯 Test prima di guidare',
    screenTitle: 'Test di vigilanza',
    intro: 'Tocca lo schermo appena il cerchio si accende. Dura 30 secondi.',
    start: 'Inizia il test',
    waiting: 'Aspetta…',
    tap: 'Tocca!',
    tooSoon: 'Troppo presto',
    remaining: (s: number) => `${s} s`,
    result: {
      green: 'Reazioni nella tua norma.',
      yellow: 'Sei più lento del solito. Se puoi, fai 15–20 minuti di pisolino prima di metterti alla guida.',
      red: 'Sei molto più lento del solito. Valuta di non guidare adesso: pisolino o fatti venire a prendere.',
    },
    medianLabel: (ms: number) => `Tempo di reazione: ${ms} ms`,
    baselineLabel: (ms: number) => `Il tuo riferimento: ${ms} ms`,
    genericBaseline: 'Riferimento generico: diventa personale dopo 3 test fatti nei giorni di riposo o a metà mattina.',
    errors: (n: number) => (n === 1 ? '1 tocco in anticipo' : `${n} tocchi in anticipo`),
    again: 'Rifai il test',
    disclaimer:
      'Questo test è un indicatore, non un esame medico e non certifica l’idoneità alla guida. Se ti senti assonnato, non guidare.',
    notification: { title: 'Prima di guidare', body: 'Test di 30 secondi: controlla quanto sei reattivo.' },
  },

  diary: {
    title: 'Diario',
    quickTitle: 'Com’è andata la notte?',
    bed: 'A letto',
    wake: 'Sveglia',
    energy: 'Energia',
    energyLabels: ['Ko', 'Bassa', 'Così così', 'Buona', 'Al top'],
    note: 'Nota (facoltativa)',
    notePlaceholder: 'Es. rumori, sveglia a metà…',
    save: 'Salva',
    saved: 'Salvato.',
    invalid: 'L’ora di sveglia deve essere dopo l’ora a letto.',
    debtTitle: 'Debito di sonno',
    debtWeek: (s: string) => `Questa settimana: ${s}`,
    noDebt: 'Questa settimana sei in pari.',
    debtNote: 'Il debito non si recupera tutto in una notte: lo distribuiamo sui prossimi riposi.',
    estimateNote: 'Stima educativa, non sostituisce il parere medico.',
    chartTitle: 'Ore dormite, ultimi 7 giorni',
    needLine: 'Fabbisogno',
    noData: 'Nessun dato',
  },

  phoneCalendar: {
    calendarName: 'Reset – Turni',
    eventNote: 'Turno inserito da Reset.',
    toggle: 'Mostra i turni nel calendario del telefono',
    hint: 'Reset crea il calendario “Reset – Turni” con i turni dei prossimi 60 giorni e lo aggiorna da solo. Se il calendario è condiviso (per esempio su iCloud con il partner), lo vedrà anche lui.',
    explainTitle: 'Turni nel calendario',
    explainBody: 'Reset ti chiederà il permesso di usare il calendario e creerà “Reset – Turni”, separato dagli altri. Se lo spegni, il calendario viene rimosso.',
    deniedTitle: 'Calendario non disponibile',
    deniedBody: 'Per mostrare i turni, consenti a Reset l’accesso al calendario nelle Impostazioni dell’iPhone.',
    allow: 'Continua',
  },

  notifications: {
    channelName: 'Piano del giorno',
    deniedTitle: 'Notifiche bloccate',
    deniedBody: 'Per ricevere i promemoria, attiva le notifiche di Reset nelle Impostazioni dell’iPhone.',
    openSettings: 'Apri Impostazioni',
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
    sections: {
      plan: 'Il tuo piano',
      reminders: 'Promemoria',
      calendar: 'Calendario del telefono',
      nightMode: 'Modalità notte',
      info: 'Informazioni',
    },
    shifts: 'Turni e orari',
    sleep: 'Sonno e tragitto',
    sleepSummary: (wake: string, commute: number, need: string) => `Sveglia ${wake} · ${commute} min · ${need}`,
    notifications: 'Notifiche del piano',
    notificationsHint: 'Promemoria per sonno, luce, caffeina e pisolini.',
    nightModeOptions: { auto: 'Automatica', on: 'Sempre', off: 'Mai' },
    nightModeHint: 'Automatica: si attiva durante i turni di notte, fino al rientro a casa.',
    terms: 'Termini di servizio',
    privacy: 'Informativa privacy',
    disclaimer: 'Reset offre contenuti educativi su abitudini e organizzazione. Non è un dispositivo medico e non sostituisce il parere di un medico.',
    version: (v: string) => `Versione ${v}`,
  },

  settings: {
    shiftsTitle: 'Turni e orari',
    sleepTitle: 'Sonno e tragitto',
    save: 'Salva',
    saved: 'Salvato. Il piano e i promemoria sono aggiornati.',
  },

  plan: {
    /**
     * Titolo e spiegazione di ogni azione. `why` è il testo predefinito; `whyBy`
     * lo sostituisce per tipo di giornata (M, P, N, G, S, R, prima notte, ultima notte,
     * primo giorno di riposo). Per "A letto" il tipo di giornata è quello di domani.
     */
    items: {
      wake: {
        title: 'Sveglia',
        why: 'Un orario regolare aiuta il corpo a tenere il ritmo.',
        whyBy: {
          P: 'Turno di pomeriggio: la mattina è tua, alzati senza fretta.',
          first_night: 'Ti alzi a orario normale: il pisolino del pomeriggio ti ricarica per stanotte.',
          N: 'Hai recuperato il sonno: mangia qualcosa e prepara la notte con calma.',
          last_night: 'Ultima notte in arrivo: alzati, mangia bene e tieni da parte le energie.',
          S: 'Basta così: alzarti adesso ti fa dormire bene stanotte.',
        },
      },
      wake_bright_light: {
        title: 'Sveglia + luce forte',
        why: 'Accendi tutte le luci o esci entro 30 minuti: il corpo capisce che la giornata è iniziata.',
        whyBy: {
          M: 'Turno presto: luci accese subito, così il corpo si sveglia anche se fuori è buio.',
          G: 'Giornata lunga: luce forte appena sveglio per partire con energia.',
        },
      },
      wake_morning_light: {
        title: 'Sveglia + luce naturale',
        why: 'Esci o apri le finestre appena sveglio: tiene il ritmo regolare.',
        whyBy: {
          R: 'Giorno libero: alzati a orario regolare e prendi luce, il ritmo resta stabile.',
          first_rest: 'Primo giorno libero: alzati a orario normale anche se hai sonno, così il ritmo si sistema prima.',
        },
      },
      bedtime: {
        title: 'A letto',
        why: 'Così dormi le ore che ti servono.',
        whyBy: {
          M: 'Domani si parte presto: a letto adesso per dormire le ore che ti servono.',
          G: 'Domani 12 ore dalla mattina: ti serve un sonno pieno, a letto adesso.',
          P: 'Domani lavori il pomeriggio: dormi con calma fino al mattino.',
          first_night: 'Domani c’è la prima notte: dormi pieno stanotte, al resto pensa il pisolino.',
          first_rest: 'Domani sei libero: a letto comunque a orario regolare, non fare tardi.',
          R: 'Domani sei libero: tieni l’orario regolare, il ritmo ringrazia.',
        },
      },
      low_light: {
        title: 'Luce bassa e decompressione',
        why: 'Luci soffuse dopo il turno aiutano a prendere sonno.',
      },
      caffeine_stop: {
        title: 'Stop caffeina',
        why: 'La caffeina resta in circolo per ore e disturba il sonno.',
        whyBy: {
          M: 'Stasera vai a letto presto: da adesso niente caffè, così ti addormenti senza fatica.',
          P: 'Ultimo caffè adesso: dopo il turno vuoi riuscire a dormire.',
          G: 'Ultimo caffè della giornata: per la seconda metà del turno punta su pausa e acqua.',
        },
      },
      nap_short: {
        title: 'Pisolino di 20 minuti',
        why: 'Hai dormito poco: un pisolino breve recupera senza intontirti.',
      },
      shift_break: {
        title: 'Pausa + pasto leggero',
        why: 'A metà turno mangia leggero e bevi acqua: arrivi alla fine con più energia.',
      },
      nap_pre_night: {
        title: 'Pisolino di 90 minuti',
        why: 'Un ciclo completo di sonno prima della notte ti tiene più lucido.',
        whyBy: {
          first_night: 'Prima notte: questo pisolino è il tuo pieno di energia. Stanza buia, sveglia puntata.',
          N: 'Un ciclo completo prima di ripartire ti tiene lucido fino al mattino.',
          last_night: 'Ultima notte: è quella in cui la stanchezza si sente di più, ricarica bene.',
        },
      },
      night_bright_light: {
        title: 'Luce forte a inizio turno',
        why: 'Nella prima metà della notte la luce aiuta a restare sveglio.',
        whyBy: {
          first_night: 'Prima notte: luce forte nella prima metà del turno, il corpo si adatta più in fretta.',
        },
      },
      night_caffeine_stop: {
        title: 'Ultima caffeina',
        why: 'Dopo metà turno la caffeina rovina il sonno di domani.',
        whyBy: {
          last_night: 'Da qui niente caffè: domattina devi riuscire a dormire subito, anche se è un sonno breve.',
        },
      },
      night_light_meal: {
        title: 'Pasti leggeri stanotte',
        why: 'Tra mezzanotte e le 6 evita i pasti pesanti.',
      },
      drive_alert: {
        title: 'Occhiali scuri e guida prudente',
        why: 'Meno luce sulla via di casa. Dopo la notte i riflessi sono più lenti: se hai sonno, fermati.',
        whyBy: {
          last_night: 'Fine delle notti: la stanchezza si somma. Occhiali scuri e, se hai sonno, non guidare.',
        },
      },
      post_night_routine: {
        title: 'Routine post-notte',
        why: 'Doccia tiepida, luce bassa, telefono lontano, stanza buia e fresca.',
        whyBy: {
          N: 'Stasera lavori di nuovo: routine breve, poi sonno pieno.',
          last_night: 'Notti finite: routine breve, poi solo un sonno corto per tornare al giorno.',
        },
      },
      day_sleep: {
        title: 'Sonno pieno',
        why: 'Stanotte lavori ancora: recupera tutto il sonno che ti serve.',
        whyBy: {
          last_night: 'Stanotte è l’ultima: dormi pieno adesso, ti servirà.',
        },
      },
      short_sleep: {
        title: 'Sonno breve (3–4 ore)',
        why: 'Poi in piedi, per dormire stanotte. Niente caffeina fino al risveglio.',
      },
      natural_light: {
        title: 'Luce naturale',
        why: 'Un po’ di luce nel pomeriggio ti riporta sul ritmo del giorno.',
      },
      light_activity: {
        title: 'Attività fisica leggera',
        why: 'Una camminata o un po’ di movimento aiutano il recupero.',
        whyBy: {
          first_rest: 'Una camminata all’aperto aiuta a scaricare la stanchezza dei turni.',
        },
      },
      event: {
        title: 'Evento',
        why: 'L’hai pianificato con “Posso andarci?”: il piano tiene conto degli accorgimenti.',
      },
      event_nap: {
        title: 'Pisolino prima dell’evento',
        why: 'Stasera fai tardi: un pisolino breve adesso ti fa arrivare più lucido.',
      },
      event_caffeine: {
        title: 'Stop caffeina (evento)',
        why: 'Stasera vai a letto più tardi: niente caffè da adesso, così ti addormenti subito.',
      },
    } satisfies Record<PlanItemKey, PlanItemText>,
  },
} as const;

export type Strings = typeof it;
export default it;
