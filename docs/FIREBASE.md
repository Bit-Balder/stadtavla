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

## 4. Publicera och testa appen

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
