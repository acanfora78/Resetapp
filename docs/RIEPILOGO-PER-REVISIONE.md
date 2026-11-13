# Reset: riepilogo dell'app per una revisione esterna

> **Richiesta per chi legge (Claude):** sei un revisore esperto di app mobile, App Store / Google Play, GDPR e prodotti per la salute "educativi". Leggi questo riepilogo e dimmi:
> 1. cosa **manca** o è debole per pubblicare su App Store e Google Play (rischi di rifiuto, in ordine di gravità);
> 2. cosa manca per il **GDPR** (dati sul sonno = dati relativi alla salute);
> 3. se le **regole del piano** (sezione 4) ti sembrano sensate o rischiose, e cosa chiederesti a un esperto del sonno;
> 4. cosa aggiungeresti o toglieresti prima della **beta con 10–20 turnisti**;
> 5. un giudizio finale: "siamo a posto?" e una lista di cose da fare, numerata e in ordine di priorità.
> Rispondi in italiano, in modo concreto.

---

## 1. Cos'è

**Reset** aiuta chi lavora su turni a rotazione, notti comprese, a dormire abbastanza e a recuperare energia.
Promessa: *ogni giorno l'app ti dice cosa fare in base al tuo turno.*

- **Target:** turnisti di 25–50 anni (sanità, industria, logistica, sicurezza, trasporti, forze dell'ordine).
- **Piattaforme:** iOS e Android. Solo italiano, con tutti i testi in un unico file per aggiungere altre lingue in futuro.
- **Account:** obbligatorio, con email, Accedi con Apple o Google. I dati sono salvati online su Supabase (UE).
- **Modello:** abbonamento senza prova, 4,99 €/mese o 44,99 €/anno.
- **Posizionamento:** educativo, **non medico**. Niente consigli su farmaci, melatonina o integratori. Le stime riportano la nota "Stima educativa, non sostituisce il parere medico".
- **Tono:** diretto ed empatico, da collega.

## 2. Tecnologia

- **App:** Expo SDK 58 con React Native, TypeScript ed Expo Router. Build in cloud con EAS e test su iPhone tramite TestFlight. Lo sviluppatore lavora da Chromebook, senza Mac.
- **Backend: Supabase**
  - Auth, Postgres con Row Level Security su ogni tabella, cancellazione a cascata quando si elimina l'utente.
  - Edge Functions (Deno):
    - `elimina-account`: online.
    - `verifica-acquisto` e `notifiche-store`: pronte, da pubblicare.
- **Abbonamenti:** `react-native-iap` (StoreKit 2 / Play Billing), senza RevenueCat.
  - La verifica avviene sul server tramite App Store Server API e Google Play Developer API.
  - Le notifiche server-to-server rileggono sempre lo stato dalle API degli store.
- **Notifiche:** solo locali, nessuna push. Coprono i prossimi 7 giorni, con al massimo 60 in attesa.
- **Logica del piano:** funzioni pure sul dispositivo. Tutte le costanti stanno in un unico file (`src/plan/rules.ts`) per la validazione di un esperto.
- **Test:** 148 test Jest, verificati con 3 fusi orari, compresi ora legale, mezzanotte e turni a cavallo di due giorni.

## 3. Funzioni presenti

**Onboarding (9 passi), con registrazione dopo l'anteprima del piano**
1. Benvenuto.
2. Lavoro.
3. Tipo di turni (8 h, 12 h o personalizzati) con orari.
4. Schema ciclico, per esempio M-P-N-S-R, con data di inizio.
5. Sveglia nei giorni liberi, tragitto e fabbisogno di sonno (6–9 h).
6. Caricamento.
7. Anteprima del piano di domani.
8. Registrazione con consenso esplicito al trattamento dei dati sul sonno e accettazione di Termini e Privacy.
9. Paywall.

**Oggi**
- Turno del giorno e di domani, con il punteggio di recupero da 0 a 100.
- Azioni con orario, da spuntare. Ogni azione ha il suo "perché", che cambia in base al tipo di giornata.
- Card per attivare i promemoria, che non chiede mai il permesso a sorpresa.
- Card "Cambio turno in arrivo".
- Pulsanti rapidi: caffè, pisolino, routine, "Posso andarci?" e test di vigilanza.

**Uso quotidiano**
- **Piano di transizione tra turni:** in vista delle notti o del rientro alla mattina sposta il sonno di al massimo 90 min al giorno.
- **Caffeina residua:** registri il caffè e vedi una stima della caffeina ancora in circolo, con grafico a 24 ore e soglia per il sonno. Emivita stimata: 5 ore.
- **Turni nel calendario del telefono**, in un calendario dedicato.
- **"Posso andarci?":** inserisci un evento e ricevi un verdetto (Sì / Sì, con accorgimenti / Sconsigliato / Sei in turno) con gli accorgimenti concreti.
- **Test di vigilanza** di 30 secondi sui tempi di reazione.
  - Il riferimento è personale: la mediana dei primi 3 test validi.
  - L'esito è verde, giallo o rosso.
  - Testo fisso: "indicatore, non esame medico, non certifica l'idoneità alla guida".
- **Promemoria di sicurezza alla guida** a fine notte: "Occhiali scuri e guida prudente".

**Monitoraggio**
- **Diario del sonno** da compilare in 10 secondi: ora a letto, sveglia, energia da 1 a 5, nota.
- **Debito di sonno** degli ultimi 7 giorni, con grafico. Il recupero è distribuito sui prossimi riposi, con sveglia spostata al massimo di 90 min e mai oltre le 10:00.
- **Punteggio di recupero:** 50% sonno rispetto al fabbisogno, 30% energia, 20% azioni completate.
- **Serie:** giorni consecutivi con almeno il 70% delle azioni completate.
- **Energia della settimana.**

**Recupero e contenuti**
- **Routine post-notte:** checklist più un audio di rilassamento in italiano di 5 minuti e 18 secondi, con voce generata dall'IA (ElevenLabs).
- **Timer pisolino** da 20 o 90 minuti, con sveglia anche a telefono bloccato.
- **6 mini-guide:** orologio interno, luce, caffeina, pisolini, camera, guida dopo la notte.
- **Guida ai pasti** per tipo di turno.

**Profilo**
- Orari, tragitto e fabbisogno di sonno.
- Notifiche.
- Modalità notte: Automatica (durante i turni di notte) / Sempre / Mai. È un tema scuro e caldo, con contrasto AA verificato.
- Calendario del telefono.
- Report mensile in PDF da condividere.
- Stato dell'abbonamento e "Ripristina acquisti".
- Termini, Privacy e disclaimer.
- **Elimina account**, con doppia conferma: cancella tutti i dati.
- Pagina web per l'eliminazione dell'account, richiesta da Google Play.

**Rimandato a dopo il lancio:**
- widget per la schermata home;
- stato "Sto dormendo" da condividere;
- import dei turni da foto o PDF;
- versione inglese.

## 4. Regole del piano (da validare con un esperto)

Definizioni:
- partenza = inizio turno − tragitto − 30 min;
- rientro = fine turno + tragitto;
- fabbisogno = 7,5 h (modificabile da 6 a 9 h).

| Turno | Azioni |
|---|---|
| Mattina (M) | Sveglia = partenza − 30 min, con luce forte. La sera prima, a letto = sveglia − fabbisogno − 15 min. Stop caffeina = ora a letto − 8 h. Pisolino di 20 min alle 14:00 se la notte prima hai dormito meno di 6 h. |
| Pomeriggio (P) | Luce bassa dal rientro. A letto = rientro + 60 min. Sveglia = a letto + fabbisogno. Stop caffeina = ora a letto − 8 h. |
| Notte (N) | Pisolino di 90 min che finisce 60 min prima della partenza. Caffeina solo fino a metà turno. Luce forte nella prima metà del turno. Pasto leggero a mezzanotte, evitando i pasti pesanti tra mezzanotte e le 6. Occhiali scuri e guida prudente all'uscita. Routine post-notte di 30 min, poi il sonno: pieno se domani è ancora notte, altrimenti si passa allo Smonto. |
| Smonto (S) | Sonno breve di 3 h 30 dopo il rientro, niente caffeina fino al risveglio. Luce naturale alle 15:00. A letto presto: sveglia preferita − fabbisogno. |
| Riposo (R) | Sveglia preferita con luce naturale. A letto = sveglia − fabbisogno. Attività fisica leggera 2 h dopo la sveglia. |
| Giorno (G, 12 h) | Come la Mattina, più pausa e pasto leggero a metà turno. La sera: a letto al più tardi tra "sveglia di domani − fabbisogno" e "rientro + 60 min". |

**Altre costanti:**
- Caffeina: emivita 5 h, soglia per il sonno 50 mg.
- "Posso andarci?": sonno minimo 5 h prima di un turno del mattino.
- Test di vigilanza: giallo se +20% rispetto al riferimento, rosso se +40%.
- Cambio turno: spostamento massimo di 90 min al giorno.

## 5. Stato attuale

**Fatto:**
- Tutte le funzioni sopra.
- Build iOS su TestFlight: le precedenti sono state provate su iPhone 17 Pro, la nuova è in arrivo.
- Migrazioni del database eseguite.
- Funzione di eliminazione dell'account pubblicata.

**Non ancora fatto:**
1. **Abbonamenti spenti:** il blocco "senza abbonamento non si entra" è disattivato con un flag. Mancano:
   - accordo Paid Apps su App Store Connect;
   - prodotti in abbonamento creati sugli store;
   - chiavi API in-app;
   - pubblicazione delle 2 funzioni di verifica;
   - URL per le notifiche Apple.
2. **Termini e Privacy:** i link sono segnaposto (`example.com`). Anche l'email privacy nella pagina di eliminazione è un segnaposto, e la pagina va messa online.
3. **Revoca del consenso ai dati sul sonno:** il consenso si chiede nell'onboarding, ma **non c'è ancora un modo per revocarlo dall'app**. Oggi l'unico modo è eliminare l'account.
4. **Accedi con Google:** il codice c'è, ma la configurazione OAuth non è ancora completa.
5. **Android:** non è stato ancora compilato né provato. Manca l'account Play Console.
6. **Regole del piano:** non ancora validate da un esperto del sonno o della medicina del lavoro.
7. **Etichette privacy** App Store e modulo "Sicurezza dei dati" di Play: da compilare.
8. **Nome sullo store:** "Reset" potrebbe essere già preso, l'alternativa è "Reset – Sonno su turni".
9. **Beta** con 10–20 turnisti reali: non ancora iniziata.
10. **Analytics e crash reporting:** non ci sono.
11. **Supporto in app** (contatto o feedback): non c'è.
