# Reset: configurazione e prima build (Fase 2)

Guida passo passo per arrivare all'app su iPhone tramite TestFlight, lavorando da Chromebook.

## 1. Supabase: crea le tabelle

1. Apri supabase.com → il tuo progetto → **SQL Editor** → **New query**.
2. Incolla tutto il contenuto di `supabase/migrations/20261110000000_schema_iniziale.sql` e premi **Run**.
   Deve comparire "Success. No rows returned".
3. **Authentication → Sign In / Providers → Email**: deve essere attivo.
   - Con "Confirm email" attivo, dopo la registrazione bisogna aprire il link nell'email e poi fare "Accedi".
   - Per i test puoi spegnerlo e riaccenderlo prima del lancio.
4. **Authentication → Sign In / Providers → Apple** → attiva.
   - In **Client IDs** scrivi `it.acanfora.reset`.
   - Il campo Secret Key non serve per l'accesso dall'app iPhone. Salva.

## 2. Chromebook: prepara il terminale (una volta sola)

Attiva Linux da Impostazioni → Informazioni su ChromeOS → Sviluppatori → Ambiente di sviluppo Linux. Poi apri l'app **Terminale** e incolla un comando per volta:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

Chiudi e riapri il Terminale, poi:

```bash
nvm install 22
```

```bash
sudo apt update && sudo apt install -y git gh
```

```bash
gh auth login
```

Rispondi: GitHub.com → HTTPS → Yes → Login with a web browser. Poi presentati a git (nome e email che compariranno nei commit):

```bash
git config --global user.name "Il tuo nome"
```

```bash
git config --global user.email "la-tua-email@esempio.it"
```

```bash
git clone https://github.com/acanfora78/Resetapp.git && cd Resetapp && git checkout claude/adoring-planck-bgo9c5 && npm install
```

```bash
npx eas-cli login
```

```bash
npx eas-cli init
```

`eas init` collega il progetto al tuo account Expo e scrive `projectId` e `owner` in `app.json`. Salva la modifica su GitHub:

```bash
git add app.json && git commit -m "Collega progetto EAS" && git push
```

## 3. Expo: variabili d'ambiente per le build in cloud

```bash
npx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_URL --value https://tkskfgdocyhnspropafh.supabase.co --environment production --environment preview --environment development --visibility plaintext
```

```bash
npx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value LA_TUA_CHIAVE_PUBLISHABLE --environment production --environment preview --environment development --visibility plaintext
```

Le trovi poi su expo.dev → progetto → **Environment variables**.

## 4. Apple: build e invio a TestFlight

1. Su appstoreconnect.apple.com controlla che non ci siano accordi da accettare (banner in alto o sezione **Accordi**).
2. Dal Terminale:

   ```bash
   npx eas-cli build --platform ios --profile production --auto-submit
   ```

   Risposte alle domande:
   - "Log in to your Apple account?" → **Yes**: Apple ID e password, poi il codice a due fattori che arriva sull'iPhone.
   - Certificato di distribuzione e provisioning profile → **Yes** (li genera EAS).
   - Push notifications → **No** per ora (le notifiche dell'app sono locali).
   - App Store Connect API key per l'invio → lascia che la crei EAS (**Yes**).
   - Se l'app non esiste su App Store Connect, EAS la crea. Il nome deve essere unico su tutto l'App Store: se "Reset" è occupato, usa per esempio "Reset - Sonno su turni".
3. La build dura 15–30 minuti. Poi Apple elabora l'invio, di solito in 10–30 minuti, e ti arriva un'email.
4. App Store Connect → la tua app → **TestFlight** → **Test interni** → **+** → crea un gruppo e aggiungi te stesso.
5. Sull'iPhone installa l'app **TestFlight** e accetta l'invito: Reset si installa da lì.

Per le build successive basta rilanciare il comando del punto 2: il numero di build aumenta da solo.

## 5. Google (quando sei pronto)

1. **Google Cloud Console**: crea i client OAuth iOS (bundle `it.acanfora.reset`) e Web, seguendo le istruzioni che ti ho già dato.
   - Nel client Web metti come URI di reindirizzamento `https://tkskfgdocyhnspropafh.supabase.co/auth/v1/callback`.
2. **Supabase → Authentication → Sign In / Providers → Google** → attiva:
   - **Client IDs**: l'ID client Web e l'ID client iOS, separati da virgola, prima quello Web.
   - **Client Secret**: il secret del client Web.
   - Attiva **Skip nonce checks**, necessario per l'accesso dall'iPhone.
   - Salva.
3. Aggiungi le variabili su Expo:

   ```bash
   npx eas-cli env:create --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value ID_CLIENT_IOS --environment production --environment preview --environment development --visibility plaintext
   ```

   ```bash
   npx eas-cli env:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value ID_CLIENT_WEB --environment production --environment preview --environment development --visibility plaintext
   ```

4. Fai una nuova build: serve, perché cambia la configurazione nativa.

## 6. (Facoltativo) Development build

Serve per provare le modifiche senza passare da TestFlight ogni volta.

```bash
npx eas-cli device:create
```

Apri il link sull'iPhone e installa il profilo. Poi su iPhone attiva Impostazioni → Privacy e sicurezza → **Modalità sviluppatore**.

```bash
npx eas-cli build --platform ios --profile development
```

Installa la build dal link che ricevi, poi avvia il server dal Chromebook:

```bash
npx expo start --tunnel
```

## Comandi utili

```bash
npm test
```

```bash
npm run typecheck
```
