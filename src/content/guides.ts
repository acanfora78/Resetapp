/**
 * Mini-guide e guida ai pasti: contenuti statici ed educativi.
 * Niente consigli su farmaci, melatonina o integratori.
 */
import type { ShiftCode } from '@/plan/types';

export interface Guide {
  id: string;
  icon: string;
  title: string;
  minutes: number;
  sections: { heading: string; body: string }[];
}

export const GUIDES: Guide[] = [
  {
    id: 'orologio',
    icon: '🕰️',
    title: 'Il tuo orologio interno',
    minutes: 3,
    sections: [
      { heading: 'Cos’è', body: 'Il corpo segue un ritmo di circa 24 ore: decide quando hai sonno, fame, energia. Si regola soprattutto con la luce, poi con pasti, movimento e orari.' },
      { heading: 'Perché i turni lo mettono alla prova', body: 'Quando lavori di notte chiedi al corpo di stare sveglio quando il ritmo dice “dormi”. Non è debolezza: è biologia. Lo scopo non è “abituarsi” del tutto, ma aiutarlo con piccoli segnali coerenti.' },
      { heading: 'Cosa puoi fare', body: 'Luce forte quando vuoi essere sveglio, buio quando devi dormire. Orari il più possibile regolari nei giorni liberi. Spostamenti graduali quando cambi turno, come fa il piano di Reset.' },
    ],
  },
  {
    id: 'luce',
    icon: '☀️',
    title: 'Luce: l’interruttore del ritmo',
    minutes: 3,
    sections: [
      { heading: 'Luce che sveglia', body: 'La luce del giorno, o una stanza molto illuminata, dice al corpo “è mattina”. È utile appena sveglio prima di un turno del mattino e nella prima metà di una notte.' },
      { heading: 'Luce che disturba', body: 'Tornare a casa alle 7 con il sole in faccia dice al corpo che la giornata comincia proprio quando devi dormire. Occhiali scuri e luci basse a casa aiutano.' },
      { heading: 'In camera', body: 'Buio vero: tende oscuranti o una mascherina. Schermi lontani prima di dormire, o almeno al minimo della luminosità.' },
    ],
  },
  {
    id: 'caffeina',
    icon: '☕',
    title: 'Caffeina senza autogol',
    minutes: 2,
    sections: [
      { heading: 'Quanto dura', body: 'La caffeina resta in circolo per ore: dopo circa 5 ore ne hai ancora metà. Un caffè a fine turno può rovinare il sonno di dopo.' },
      { heading: 'Quando prenderla', body: 'Meglio a inizio turno o prima della parte più difficile. Smetti con anticipo rispetto al sonno: il piano ti indica l’orario “Stop caffeina”.' },
      { heading: 'Ognuno è diverso', body: 'C’è chi la smaltisce in fretta e chi no. Se dormi male, prova ad anticipare l’ultimo caffè. Il grafico di Reset è una stima educativa, non una misura.' },
    ],
  },
  {
    id: 'pisolino',
    icon: '😴',
    title: 'Pisolini che funzionano',
    minutes: 2,
    sections: [
      { heading: '20 minuti', body: 'Ricarica senza farti cadere nel sonno profondo: ti alzi lucido. Ottimo nel primo pomeriggio o in pausa.' },
      { heading: '90 minuti', body: 'Un ciclo completo di sonno. Utile prima di una notte di lavoro, finito almeno un’ora prima di uscire.' },
      { heading: 'Da evitare', body: 'Tra 30 e 60 minuti rischi di svegliarti in pieno sonno profondo, più rintronato di prima.' },
    ],
  },
  {
    id: 'camera',
    icon: '🛏️',
    title: 'La camera per dormire di giorno',
    minutes: 2,
    sections: [
      { heading: 'Buio', body: 'Tende oscuranti, nastro sulle lucine degli apparecchi, mascherina se serve.' },
      { heading: 'Fresco e silenzioso', body: 'Una stanza fresca aiuta ad addormentarsi. Tappi o rumore bianco coprono i rumori del giorno. Avvisa chi vive con te: il tuo sonno di giorno vale come quello di notte.' },
      { heading: 'Telefono', body: 'Silenzioso e lontano dal letto. Le notifiche le leggi dopo.' },
    ],
  },
  {
    id: 'guida',
    icon: '🚗',
    title: 'Tornare a casa dopo la notte',
    minutes: 2,
    sections: [
      { heading: 'Il momento più a rischio', body: 'Dopo un turno di notte la stanchezza si fa sentire proprio quando ti metti alla guida. I riflessi sono più lenti anche se ti senti “ok”.' },
      { heading: 'Segnali da non ignorare', body: 'Sbadigli continui, palpebre pesanti, non ricordare gli ultimi chilometri: fermati in un posto sicuro.' },
      { heading: 'Cosa fare', body: 'Un pisolino di 15–20 minuti prima di partire, un passaggio da un collega o i mezzi pubblici. Il test di vigilanza di Reset è un indicatore, non un permesso a guidare.' },
    ],
  },
];

/** Guida ai pasti per tipo di turno. */
export const MEAL_GUIDE: { codes: ShiftCode[]; title: string; tips: string[] }[] = [
  {
    codes: ['M', 'G'],
    title: 'Turno del mattino / Giorno',
    tips: [
      'Colazione anche se è presto: qualcosa di semplice, come yogurt, pane o frutta.',
      'Pranzo normale, senza esagerare: il calo del primo pomeriggio si sente di più dopo un pasto pesante.',
      'Cena presto e leggera, così vai a letto presto senza digestione in corso.',
    ],
  },
  {
    codes: ['P'],
    title: 'Pomeriggio',
    tips: [
      'Pasto principale a pranzo, prima di uscire.',
      'In turno uno spuntino a metà: frutta, yogurt, frutta secca in piccole quantità.',
      'Al rientro qualcosa di leggero, non una cena completa a mezzanotte.',
    ],
  },
  {
    codes: ['N'],
    title: 'Notte',
    tips: [
      'Pasto vero prima di uscire, a orario di cena.',
      'Tra mezzanotte e le 6 il corpo digerisce male: meglio piccoli spuntini leggeri che un pasto pesante.',
      'Bevi acqua durante il turno; limita zuccheri e bibite.',
      'Al rientro una colazione leggera, poi a dormire: niente pasti abbondanti prima del sonno.',
    ],
  },
  {
    codes: ['S', 'R'],
    title: 'Smonto e Riposo',
    tips: [
      'Torna ai pasti a orari normali: aiuta il corpo a ritrovare il ritmo del giorno.',
      'Pranzo e cena regolari, senza saltarli per “recuperare” il sonno.',
    ],
  },
];

/** Checklist della routine post-notte. */
export const POST_NIGHT_CHECKLIST = [
  { id: 'doccia', icon: '🚿', text: 'Doccia tiepida' },
  { id: 'luce', icon: '🕯️', text: 'Luce bassa in casa' },
  { id: 'telefono', icon: '📵', text: 'Telefono lontano, in silenzioso' },
  { id: 'stanza', icon: '🌑', text: 'Stanza buia e fresca' },
] as const;
