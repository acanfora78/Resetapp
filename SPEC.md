# Reset — Specifica dell'app

Documento di riferimento per lo sviluppo. Leggilo per intero prima di scrivere codice e rispettalo. Se qualcosa non è chiaro o va in conflitto con un requisito tecnico, chiedi prima di decidere.

---

## 1. Visione

Reset aiuta chi lavora su turni a rotazione con le notti a dormire abbastanza e recuperare energia, senza cambiare lavoro.
**Promessa:** ogni giorno l'app ti dice cosa fare in base al tuo turno.

| Decisione | Scelta |
|---|---|
| Target | Turnisti 25–50 anni: sanità, industria, logistica, sicurezza, trasporti, forze dell'ordine |
| Piattaforme | iOS (App Store) e Android (Google Play) |
| Lingua | Solo italiano (testi centralizzati in un file, per poter aggiungere l'inglese in futuro) |
| Account | Obbligatorio, dati salvati online |
| Modello | Abbonamento senza prova: 4,99 €/mese o 44,99 €/anno |
| Posizionamento | Educativo su abitudini e organizzazione, **non medico** |
| Tono dei testi | Diretto, empatico, da collega. Frasi brevi. Niente toni motivazionali da guru, niente gergo medico |

---

## 2. Brand

- Nome: **Reset**
- Colori:
  - Blu notte (sfondo principale): `#0B1838`
  - Arancio sfumato (accento): da `#FFB43A` a `#FF9318`
  - Testo chiaro: `#FFFFFF`, testo secondario: bianco al 60–70% di opacità
- Font: **Poppins** (Bold per i titoli, Regular/Medium per il testo)
- Tema: scuro di default. L'app viene usata soprattutto di notte o appena svegli.
- **Modalità notte** (tema dedicato, non un velo sopra l'interfaccia): sfondo `#05091A`, superfici `#0B1430`, accento ambra tenue `#E8A33D`, testo bianco caldo `#F2E6D8` all'85%; contrasto del testo almeno AA (verificato da test), nessun elemento bianco puro grande. Palette in `src/theme/palettes.ts`.
- **Interruttori:** un solo componente in tutta l'app. Acceso: traccia con il gradiente del brand e pallino chiaro; spento: traccia `#2A3A66` e pallino `#C9D1E6`; vibrazione leggera al cambio.
- **Barra in basso:** rispetta la safe area; icone 24 px, etichette 11 px, area di tocco minima 44 px.
- Logo e icone: nella cartella `assets/brand/` (SVG e PNG). Icona app: `reset-icona-AppStore-1024.png`.

---

## 3. Funzioni (prima versione)

### Base
1. **Calendario turni:** turni per giorno: Mattina (M), Pomeriggio (P), Notte (N), Smonto (S), Riposo (R). Per i **turni da 12 ore**: Giorno (G, es. 07:00–19:00) e Notte (N, es. 19:00–07:00), più Smonto e Riposo. Nell'interfaccia i turni si mostrano con badge colorati ed emoji (🌅 M, 🌇 P, 🌙 N, ☀️ G, 😴 S, 🛋️ R); nel database restano i codici a una lettera.
   - Tipi di turno: "Turni da 8 ore" (M, P, N), "Turni da 12 ore" (G, N) o "Personalizzati" (M, P, N, G con orari liberi).
   - Ogni tipo ha l'interruttore "Non faccio questo turno": un turno disattivato non compare nello schema né nella modifica del giorno.
2. **Turni ciclici automatici:** l'utente imposta il suo schema una volta (es. M-P-N-S-R) e una data di partenza. L'app genera i turni dei mesi successivi. Ogni giorno resta modificabile a mano, e la modifica manuale non viene sovrascritta dallo schema.
3. **Piano automatico:** per ogni giorno, le azioni con orario (vedi sezione 4).
4. **Diario del sonno:** ora a letto, ora di sveglia, energia da 1 a 5, nota facoltativa. Deve richiedere al massimo 10 secondi.
5. **Notifiche:** promemoria locali delle azioni del piano per i 7 giorni successivi (massimo 60 in attesa, limite iOS), riprogrammati a ogni modifica di turni, orari, preferenze o spunte; le azioni già spuntate non vengono notificate. Il permesso si chiede con la card "Attiva i promemoria" nella schermata Oggi (o dal Profilo), mai a sorpresa. Preferenza salvata in `profiles.notifiche` (`{ "abilitate": true/false }`).
6. **Statistiche:** grafico settimanale di ore dormite ed energia.

### Uso quotidiano (Fase B)
- **Piano di transizione tra turni:** rileva nei prossimi 7 giorni l'ingresso nelle notti, l'uscita dalle notti e il rientro alla mattina dopo almeno un riposo. Il sonno si sposta al massimo di `TRANSITION_MAX_SHIFT_MIN` (90 min) al giorno. Verso le notti: se il giorno prima è libero o di pomeriggio, a letto e sveglia 90 min più tardi, più il pisolino lungo prima della notte. Uscita dalle notti: regole dello Smonto. Verso la mattina: due notti prima l'ora a letto si anticipa di 90 min, la sera prima vale l'orario della mattina. Card "Cambio turno in arrivo" su Oggi entro 3 giorni, vista "Prossimi 3 giorni", promemoria alle 19:00 della sera prima.
- **Caffeina residua:** pulsante "☕ Ho preso un caffè" su Oggi (Espresso, Moka/caffè lungo, Energy drink, Tè/Cola; porzioni in `CAFFEINE_DOSES_MG`). Stima a decadimento esponenziale con emivita `CAFFEINE_HALF_LIFE_H` (5 h), grafico delle prossime 24 h con soglia sonno (`CAFFEINE_SLEEP_THRESHOLD_MG`) e ora a letto del piano, messaggio sulla percentuale residua. Avviso gentile se il caffè è dopo lo "Stop caffeina". Nota: "Stima educativa: ogni persona smaltisce la caffeina in modo diverso."
- **Turni nel calendario del telefono:** interruttore in Profilo; calendario dedicato "Reset – Turni" con i turni dei prossimi 60 giorni (orari veri per i turni di lavoro, tutto il giorno per Smonto e Riposo), aggiornato a ogni modifica; disattivandolo il calendario viene rimosso. Preferenza del dispositivo.

### Recupero
7. **Routine post-notte guidata:** checklist di decompressione (doccia tiepida, luce bassa, telefono lontano, stanza buia e fresca) più un audio di rilassamento di circa 5–10 minuti.
8. **Timer pisolino strategico:** scegli 20 minuti (pisolino breve) o 90 minuti (ciclo completo), con sveglia.
9. **Guida pasti in turno:** cosa e quando mangiare per ogni tipo di turno (contenuto testuale).
10. **Allerta guida dopo la notte:** notifica a fine turno di notte con consigli di sicurezza prima di guidare.

### Organizzazione
11. **Modalità notte:** interfaccia più scura e poco luminosa, attivata in automatico durante i turni di notte (dall'inizio del turno fino a rientro + routine post-notte + 30 min) o a mano. Nel Profilo: Automatica / Sempre / Mai (preferenza del dispositivo).
12. **Widget per la schermata home:** mostra la prossima azione del piano. **Rimandato all'aggiornamento dopo il lancio.**

### Contenuti e motivazione
13. **Libreria di mini-guide:** brevi lezioni su sonno, luce, caffeina e turni.
14. **Report mensile PDF:** riepilogo di sonno, energia e punteggi del mese, da esportare e condividere.
15. **Obiettivi e serie:** giorni consecutivi di piano rispettato.
16. **Punteggio recupero giornaliero:** numero da 0 a 100.

---

## 4. Logica del piano automatico

Il piano si calcola **sul dispositivo** a partire da:
- orari dei turni dell'utente;
- turno del giorno e turno del giorno dopo;
- minuti di tragitto casa-lavoro;
- orario di sveglia preferito nei giorni liberi;
- fabbisogno di sonno (default 7,5 ore, modificabile).

Il piano non si salva sul server. Si salvano solo le azioni completate (tabella `plan_checks`).

Il "piano del giorno D" va dalla sveglia del giorno D fino all'ora di andare a letto quella sera (anche dopo mezzanotte); per un turno di notte arriva al rientro a casa la mattina dopo. La schermata Oggi mostra il piano di ieri finché non è finito (fino a 60 min dopo la sua ultima azione) e quello di oggi non è cominciato: così durante la notte resta visibile il piano del turno in corso.

Tutti gli orari sono configurabili come costanti in un unico file (es. `src/plan/rules.ts`), così le regole si possono correggere dopo la validazione di un esperto senza toccare il resto del codice.

Definizioni:
- `partenza = inizio_turno − tragitto − 30 min` (preparazione)
- `rientro = fine_turno + tragitto`
- `fabbisogno = 7,5 h` (default)

| Turno | Azioni e orari |
|---|---|
| **Mattina (M)** | Sveglia = `partenza − 30 min`. A letto (la sera prima) = `sveglia − fabbisogno − 15 min`. Luce forte entro 30 min dalla sveglia. Stop caffeina = `ora a letto − 8 h`. Se il sonno registrato la notte prima è sotto le 6 ore: pisolino di 20 min nel primo pomeriggio. |
| **Pomeriggio (P)** | A letto = `rientro + 60 min` (routine di decompressione). Sveglia = `a letto + fabbisogno`. Stop caffeina = `a letto − 8 h`. Luce bassa dal rientro. |
| **Notte (N)** | Pisolino di 90 min che finisce 60 min prima della `partenza`. Caffeina permessa solo fino a metà turno. Luce forte nella prima metà del turno. Occhiali scuri all'uscita dal lavoro. Pasto leggero: evitare pasti pesanti tra mezzanotte e le 6. Allerta guida alla fine del turno. Dopo il rientro: routine post-notte, poi sonno. **Se il giorno dopo è di nuovo N:** sonno pieno (`fabbisogno`). **Altrimenti:** vedi Smonto. |
| **Smonto (S)** | Sonno breve dopo il rientro (3–4 h), poi in piedi. Niente caffeina fino al risveglio. Luce naturale nel pomeriggio. A letto presto la sera (`sveglia_preferita − fabbisogno`), per riallinearsi al giorno. |
| **Riposo (R)** | Sveglia = `sveglia_preferita`. A letto = `sveglia − fabbisogno`. Luce al mattino. Suggerimento di attività fisica leggera. |
| **Giorno (G, 12 h)** | Come la Mattina: Sveglia = `partenza − 30 min`. A letto (la sera prima) = `sveglia − fabbisogno − 15 min`. Luce forte al risveglio. Stop caffeina = `ora a letto − 8 h`. Pisolino di 20 min se il sonno della notte prima è sotto le 6 ore. In più: **Pausa + pasto leggero** a metà turno (mangiare leggero, bere acqua). **Sera dopo il turno:** a letto = il più tardi tra (`sveglia del giorno dopo − fabbisogno`) e (`rientro + 60 min`). |

Regole di presentazione:
- Due azioni non hanno mai lo stesso orario. Sveglia e luce si uniscono in un'unica azione ("Sveglia + luce forte" nei turni del mattino, "Sveglia + luce naturale" nei giorni di riposo); occhiali scuri e allerta guida diventano "Occhiali scuri e guida prudente". Il promemoria del pasto leggero di notte è a mezzanotte (se cade nel turno). Se due azioni coincidono comunque, la seconda slitta di 15 minuti.
- Se per un giorno non c'è un turno salvato, si usa quello previsto dallo schema ciclico attivo.

**Spiegazioni secondo il tipo di giornata.** Il "perché" di ogni azione dipende dal tipo di giornata: M, P, N, G, S, R, prima notte (anche notte singola), ultima notte di una serie, primo giorno di riposo. Un riposo subito dopo la notte vale come Smonto. Per "A letto" conta il tipo di giornata di domani. Tabella dei testi in `src/i18n/it.ts` (`plan.items[…].whyBy`), con un testo predefinito per ogni azione.

**Card "Attiva i promemoria" su Oggi.** Non compare mai se le notifiche sono attive. "Non ora" la nasconde per 3 giorni; poi torna in versione compatta (una riga con "Attiva"). Dopo 3 "Non ora" non compare più su Oggi e resta solo in Profilo. Costanti in `src/constants/app.ts`; stato in `profiles.notifiche` (`abilitate`, `rimandi`, `rimandato_at`).

Ogni azione del piano ha:
- `key` stabile (es. `caffeine_stop`, `nap_pre_night`);
- orario;
- titolo breve;
- spiegazione di una riga ("perché");
- se va notificata o no.

### Punteggio recupero (0–100)
- 50%: ore dormite rispetto al fabbisogno (al massimo 100%)
- 30%: energia dichiarata (1 = 0 punti, 5 = massimo)
- 20%: percentuale di azioni del piano completate

### Serie
Giorni consecutivi con almeno il 70% delle azioni del piano completate.

---

## 5. Schermate e flusso

### Onboarding

La registrazione arriva dopo l'anteprima del piano. Tutti i dati inseriti prima restano sul telefono e vengono scritti su Supabase subito dopo la registrazione e il consenso. "Ho già un account" nel benvenuto porta direttamente al login. La barra "Passo X di 9" e il tasto indietro ci sono in tutti i passi (tranne il caricamento, senza tasto indietro, e il benvenuto, che non ha un passo precedente).

1. Benvenuto e promessa, con 3 vantaggi
2. Che lavoro fai (scelta da elenco con icone + "Altro")
3. Orari dei turni: scelta "Turni da 8 ore / Turni da 12 ore / Personalizzati", inizio e fine di ogni turno con valori di partenza modificabili (8 ore: 6–14, 14–22, 22–6; 12 ore: 7–19, 19–7), interruttore "Non faccio questo turno"
4. Schema ciclico e data di inizio (schemi comuni, "Personalizzato", possibilità di saltare e inserire i turni a mano)
5. Orario di sveglia nei giorni liberi, minuti di tragitto e fabbisogno di sonno (da 6 a 9 ore, a passi di 30 minuti, default 7,5)
6. Caricamento "Sto creando il tuo piano…" (2–3 s)
7. **Anteprima del piano di domani** (timeline con icone)
8. **Salva il tuo piano:** registrazione (email + password, Accedi con Apple, Accedi con Google), nome facoltativo, consenso esplicito al trattamento dei dati sul sonno (GDPR) e accettazione di Termini e Privacy
9. **Paywall:** mensile 4,99 € / annuale 44,99 € (preselezionato, "Risparmi 25%", 3,75 €/mese)

L'app non è utilizzabile senza un abbonamento attivo.

### Barra in basso (5 sezioni)
| Sezione | Contenuto |
|---|---|
| **Oggi** | Turno del giorno con la riga del turno di domani (spazio a destra per l'anello del punteggio di recupero), punteggio di recupero, azioni con spunta (in cima la prossima, le fatte nel gruppo ripiegabile "Fatte (n)"), card "Attiva i promemoria", pulsanti rapidi (pisolino, routine post-notte). Nessun testo segnaposto. |
| **Calendario** | Vista mensile dei turni, tocca un giorno per modificarlo, gestione dello schema ciclico |
| **Diario** | Inserimento rapido del sonno, grafico settimanale, serie |
| **Guide** | Mini-guide, guida ai pasti in turno |
| **Profilo** | Orari e tragitto, notifiche, modalità notte, report PDF, gestione abbonamento, Ripristina acquisti, Termini, Privacy, disclaimer, **Elimina account** |

---

## 6. Dati (Supabase / Postgres)

Ogni tabella ha `user_id` collegato a `auth.users`, con **Row Level Security attiva**: ogni utente vede e modifica solo le sue righe.

| Tabella | Campi principali |
|---|---|
| `profiles` | `id` (= user id), `nome`, `lavoro`, `sveglia_preferita` (time), `tragitto_min` (int), `fabbisogno_sonno_min` (int, default 450), `consenso_dati_at` (timestamp), `termini_accettati_at` (timestamp), `onboarding_completato_at` (timestamp), `tipo_turni` (8h/12h/personalizzati), `notifiche` (jsonb), `created_at` |
| `shift_types` | `id`, `user_id`, `codice` (M/P/N/G/S/R), `nome`, `inizio` (time), `fine` (time), `attivo` (bool, false = "Non faccio questo turno") |
| `shift_patterns` | `id`, `user_id`, `sequenza` (text[] es. {M,P,N,S,R}), `data_inizio` (date), `attivo` (bool) |
| `shifts` | `id`, `user_id`, `data` (date, unico per utente), `codice`, `manuale` (bool) |
| `sleep_logs` | `id`, `user_id`, `data` (date), `a_letto` (timestamptz), `sveglia` (timestamptz), `minuti_dormiti` (int), `energia` (1–5), `note` |
| `plan_checks` | `id`, `user_id`, `data` (date), `item_key` (text), `fatto_at` (timestamptz) |
| `daily_scores` | `id`, `user_id`, `data` (date), `punteggio` (0–100) |
| `caffeine_logs` | `id`, `user_id`, `consumato_at` (timestamptz), `tipo` (espresso/moka/energy/te_cola), `quantita_mg` (int) |
| `subscriptions` | `user_id`, `piattaforma` (ios/android), `prodotto` (mensile/annuale), `stato` (attivo/scaduto/annullato/rimborsato), `scadenza` (timestamptz), `transaction_id_originale`, `aggiornato_at` |

- Le mini-guide e la guida ai pasti sono contenuti statici dentro l'app (file TypeScript o JSON).
- Le migrazioni SQL stanno in `supabase/migrations/`.

---

## 7. Tecnologia

| Cosa | Strumento |
|---|---|
| App | Expo (ultima versione SDK stabile), React Native, TypeScript, Expo Router |
| Backend | Supabase: Auth (email, Apple, Google), Postgres, Edge Functions |
| Abbonamenti | `react-native-iap` (StoreKit 2 / Google Play Billing). **Niente RevenueCat né altri servizi a pagamento.** |
| Verifica acquisti | Edge Function Supabase che verifica le ricevute (App Store Server API, Google Play Developer API) e riceve le notifiche server-to-server (App Store Server Notifications V2, Google Real-time Developer Notifications), aggiornando `subscriptions` |
| Notifiche | `expo-notifications`, notifiche locali programmate per i 7 giorni successivi e riprogrammate a ogni modifica di turni o impostazioni |
| Audio | `expo-audio` |
| PDF | `expo-print` + `expo-sharing` |
| Grafici | Libreria leggera compatibile con Expo (es. `react-native-svg` + componenti propri, oppure `victory-native`) |
| Date | `date-fns` con fuso orario del dispositivo |
| Build e pubblicazione | EAS Build ed EAS Submit (in cloud) |
| Test | TestFlight su iPhone. Android su Chromebook o emulatore |

### Ambiente di lavoro
Lo sviluppatore usa un **Chromebook** e un **iPhone 17 Pro**, con Claude Code nel browser. Non c'è un Mac. Tutto passa da GitHub, EAS Build in cloud e TestFlight. Funzioni come Accedi con Apple e gli acquisti in-app richiedono una **development build** (non funzionano in Expo Go).

### Convenzioni
- Struttura: `app/` (route Expo Router), `src/components`, `src/plan` (logica del piano, pura e testata), `src/lib` (supabase, iap, notifiche), `src/content` (guide e testi), `src/i18n/it.ts` (tutti i testi).
- La logica del piano e il punteggio sono funzioni pure con test unitari (Jest).
- Chiavi e segreti mai nel codice: si usano variabili d'ambiente (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) e i segreti EAS e Supabase.

---

## 8. Requisiti store e legali

- [ ] Eliminazione dell'account dentro l'app (obbligo Apple) e tramite pagina web (obbligo Google). Cancella tutti i dati dell'utente.
- [ ] Accedi con Apple disponibile, dato che c'è anche Google.
- [ ] Paywall con prezzo, durata, rinnovo automatico, come disdire, link a Termini e Privacy, pulsante "Ripristina acquisti".
- [ ] Privacy policy e Termini di servizio pubblicati online.
- [ ] Dati sul sonno trattati come dati sensibili (GDPR): consenso esplicito all'onboarding e revocabile.
- [ ] Disclaimer visibile: contenuti educativi, non sostituiscono il parere medico. Nessun consiglio su farmaci, melatonina o integratori.
- [ ] Etichette privacy su App Store e modulo "Sicurezza dei dati" su Play Console.
- [ ] Regole del piano validate da un esperto prima del lancio.

---

## 9. Fasi di sviluppo

Ogni fase termina con una build provata su iPhone tramite TestFlight.

1. **Preparazione:** account pronti (GitHub, Expo, Supabase). App da creare su App Store Connect e Play Console.
2. **Fondamenta:** progetto Expo, tema e brand, Supabase con migrazioni e RLS, login (email, Apple, Google), onboarding (paywall solo grafico), turni da 8 e da 12 ore e turni ciclici, calendario, struttura delle 5 sezioni.
3. **Cuore:** piano automatico (con test), schermata Oggi, spunte azioni, notifiche, modalità notte.
4. **Monitoraggio:** diario del sonno, statistiche, punteggio di recupero, serie.
5. **Recupero:** routine post-notte con audio, timer pisolino, guida pasti, allerta guida, libreria mini-guide.
6. **Pagamenti:** prodotti in abbonamento sugli store, `react-native-iap`, Edge Functions di verifica, paywall, blocco dei contenuti, report PDF, eliminazione account.
7. **Beta:** 10–20 turnisti reali la provano per 2 settimane; si correggono i problemi.
8. **Pubblicazione** su App Store e Play Store. Poi aggiornamento con il widget per la schermata home.
