# Anslut Firebase till Städtavla

Projektet heter `stadtavla`.
Koden använder Google-inloggning och Cloud Firestore.
Google Analytics används inte.

## 1. Aktivera Google-inloggning

Öppna Firebase Console och välj projektet `stadtavla`.
Gå till **Security → Authentication → Sign-in method**.
Aktivera **Google**, välj supportadress och spara.

Öppna **Authentication → Settings → Authorized domains**.
Lägg till `bit-balder.github.io` utan `https://` och utan `/stadtavla/`.
Behåll projektets befintliga Firebase-domäner.
Lägg till `localhost` separat om du vill testa lokalt.

## 2. Skapa databasen

Gå till **Databases & Storage → Firestore Database → Create database**.
Välj **Standard edition** och databas-ID `(default)` om guiden frågar.
Välj en lämplig europeisk plats, exempelvis Stockholm om det alternativet visas.
Platsen går inte att ändra för den skapade databasen.
Välj **Production mode**, inte öppna testregler.

## 3. Publicera reglerna

Öppna databasens flik **Rules**.
Ersätt innehållet med hela projektets `firestore.rules` och klicka **Publish**.
GitHub Pages publicerar inte Firestore-regler.

Reglerna tillåter endast den inloggade användarens eget dokument:

`users/{användarens UID}/boards/home`

Andra konton och personer utan inloggning får ingen åtkomst.
Reglerna kontrollerar också datatyp och versionsnummer.

Du kan alternativt publicera reglerna från en lokal projektkopia:

```sh
npx firebase login
npx firebase deploy --only firestore:rules --project stadtavla
```

Kommandot ändrar endast Firestore-reglerna.
Skicka aldrig administratörsnycklar eller inloggningstoken till chatten.
Webbappens Firebase-konfiguration är avsedd att finnas i klientkoden.

## 4. Registrera App Check

Molnlagringen startar inte förrän en App Check-webbplatsnyckel finns i koden.
Grundappen fortsätter fungera med lokal lagring under tiden.

1. Öppna Google Cloud Console och välj projektet `stadtavla`.
2. Öppna **reCAPTCHA / Fraud Defense** och aktivera reCAPTCHA Enterprise API om guiden frågar.
3. Skapa en nyckel för **Web** med domänen `bit-balder.github.io`.
4. Lämna **Use checkbox challenge** avstängd. App Check kräver en poängbaserad nyckel.
5. Lägg inte till `localhost` för den här produktionsnyckeln.
6. Kopiera den offentliga webbplatsnyckeln.
7. Öppna **Firebase → Security → App Check → Apps**.
8. Registrera Städtavlas webbapp med **reCAPTCHA Enterprise** och ange samma webbplatsnyckel.
9. Behåll till att börja med standardvärdena för poänggräns och giltighetstid.
10. Spara webbplatsnyckeln som repository secret `RECAPTCHA_ENTERPRISE_SITE_KEY` i GitHub.

Webbplatsnyckeln är offentlig och får finnas i klientkoden.
Ingen hemlig reCAPTCHA-nyckel ska finnas i GitHub eller skickas till chatten.
Koden startar App Check före Authentication och Firestore.
Den verifierar appen innan den återställer användarens konto.
Automatisk förnyelse av App Check-token är aktiverad.
Ingen felsökningsnyckel eller alternativ väg runt kontrollen finns i produktionskoden.

## 5. Publicera och testa appen

Slå ihop ändringsförslaget när kontrollerna är gröna.
Vänta på GitHub Pages-publiceringen.
Logga in via **Inställningar → Mitt konto → Logga in med Google**.
Tillåt popupfönstret om webbläsaren blockerar det.

Första gången väljer du mellan två alternativ:

- **Använd mina lokala uppgifter** kopierar enhetens befintliga uppgifter till kontot.
- **Börja med nya uppgifter** skapar standarduppgifter på kontot.

Appen behåller den ursprungliga lokala kopian.
Finns det redan molnuppgifter hämtar appen dem utan att importera den lokala kopian.

Logga in med samma Google-konto på den andra enheten.
Bocka av en vara och kontrollera att ändringen visas på båda enheterna.
Kontrollera statusen **Sparat i molnet** före utloggning.

## 6. Kräv App Check efter testning

När den uppdaterade appen fungerar på mobilen och paddan:

1. Öppna **Firebase → Security → App Check → APIs**.
2. Kontrollera att appens anrop till **Cloud Firestore** visas som verifierade.
3. Välj **Enforce** för Cloud Firestore och bekräfta.
4. Kontrollera motsvarande stöd och verifierade anrop för **Authentication** innan du aktiverar dess kontroll.
5. Testa inloggning och avbockning från båda enheterna igen.

App Check blockerar inte ogiltiga anrop till en tjänst förrän tjänstens kontroll har aktiverats i Firebase.
Enbart klientkoden räcker därför inte.
Kontrollen kan ta upp till 15 minuter att börja gälla.
Äldre öppna versioner utan App Check förlorar molnåtkomsten när kontrollen aktiveras.

App Check kompletterar databasreglerna och begränsningarna för Firebase-nyckeln.
Det minskar missbruk men garanterar inte att allt missbruk förhindras.
Nyckeln för Firebase bör endast tillåta nödvändiga Firebase-tjänster i Google Cloud.

Officiella instruktioner:

- https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider
- https://firebase.google.com/docs/app-check/enable-enforcement

## Fel och återställning

**Åtkomst nekad** innebär oftast att reglerna ännu inte har publicerats.
Kontrollera också att rätt projekt och standarddatabas används.

**Otillåten domän** betyder att `bit-balder.github.io` saknas bland tillåtna domäner.

Vid nätfel behåller appen en separat lokal kopia för kontot.
Appen pausar redigering och visar **Försök igen**.
Den visar inte att uppgifterna är sparade i molnet när en skrivning misslyckas.

Vid samtidiga ändringar stoppar appen överskrivningen.
Exportera egna ändringar under Inställningar innan du väljer **Hämta molnversionen**.
Återstående lokala ändringar visas igen nästa gång samma konto öppnas.

**Logga ut** återgår till uppgifterna som hör till läget utan konto.
Det kopierar inte kontots molnuppgifter till läget utan konto.
Kontots lokala kopia finns kvar i webbläsaren för återställning vid nästa inloggning.
Använd en egen webbläsarprofil om flera personer delar enheten.

## Begränsningar i första versionen

Synkning gäller en användares egna enheter.
Hushåll med flera konton och delningslänkar ingår inte ännu.
Varje konto har ett dokument med versionskontroll.
Mycket stora tavlor kan nå Firestores dokumentgräns.

Molnlagringen kräver en webbläsare med stöd för de funktioner Firebase använder.
Appen laddar Firebase separat och kontrollerar stöd för BigInt först.
Äldre iPad-webbläsare kan fortsätta använda lokal lagring.
Det garanterar inte molnstöd på Safari 12.
Testa den faktiska paddan innan du förlitar dig på synkningen.

## Tester

```sh
npm test
npm run test:ui
npm run test:rules
```

Regeltesterna kräver Java 21 eller senare.
De körs mot projektet `demo-stadtavla` i en lokal emulator.
De använder aldrig den riktiga databasen.
GitHub kör också regeltesterna med Java 21.
Det riktiga Google-inloggningsflödet testas manuellt efter Firebase-inställningarna.

## GitHub Secrets och nyckelbyte

Öppna Settings → Secrets and variables → Actions → New repository secret.
Skapa `FIREBASE_API_KEY` med Firebase-webbappens API-nyckel.
Skapa `RECAPTCHA_ENTERPRISE_SITE_KEY` med App Check-webbplatsnyckeln när den finns.
Publiceringen hämtar värdena från Secrets under det sista bygget.
Kontrollerna använder inga produktionsnycklar.
Saknas API-nyckeln stoppar publiceringen.
Saknas App Check-webbplatsnyckeln förblir molnlagringen avstängd.

Nyckeln finns fortfarande i den byggda webbappen och tidigare GitHub-historik.
Secrets tar inte bort historiken och återkallar inte en gammal nyckel.
Skapa en ersättningsnyckel i Google Cloud → APIs & Services → Credentials.
Begränsa ersättningsnyckeln till nödvändiga Firebase-tjänster.
Uppdatera `FIREBASE_API_KEY`, bygg om och testa inloggning och synkning.
Återkalla sedan den gamla nyckeln i Google Cloud.
Att ta bort en Firebase-webbapp byter inte projektets API-nyckel.

För lokal utveckling används en ignorerad `.env.local` med motsvarande `VITE_`-variabler.
Lägg aldrig privata administratörsnycklar i `VITE_`-variabler.
Framtida nycklar ska sparas i Secrets och aldrig skrivas direkt i källkoden.
Privata nycklar får endast användas på servern.
Google Analytics används fortfarande inte.

## E-post och lösenord

Aktivera Email/Password under Authentication → Sign-in method.
Email link behöver inte aktiveras.
Inloggningsrutan innehåller e-post, lösenord, återställning och Google-inloggning.
Registrering skickar ett bekräftelsemejl.
Kontodelen visar en knapp för att skicka mejlet igen när adressen saknar bekräftelse.
Firebase lagrar lösenorden. Appen lagrar dem aldrig i tavlan eller localStorage.

Ett befintligt Google-konto kan lägga till lösenordsinloggning under Mitt konto.
Användaren bekräftar sitt Google-konto innan lösenordet kopplas.
Ett lösenordskonto kan koppla Google under samma kontodel.
Kopplingen behåller användarens UID och molnuppgifter.
Om inloggningen redan tillhör ett annat konto stoppas kopplingen.
Appen slår aldrig ihop två olika kontons uppgifter automatiskt.

Testa registrering, bekräftelsemejl, återställning och båda inloggningssätten efter publicering.
Kontrollera också att koppling av inloggningssätt behåller städuppgifter och inköpslista.
Databasreglerna använder UID och kräver ingen ändring för dessa inloggningssätt.
