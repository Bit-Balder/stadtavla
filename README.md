# Hemma · Städtavlan

Städtavlan använder React och Vite. Alla vyer och formulär består av React-komponenter.
Appen behåller tidigare utseende, scheman, delmoment, inköpslista, teman och säkerhetskopior.

## Starta lokalt

Installera Node.js 24.15 eller senare inom version 24.
Kör följande kommandon i projektets mapp:

```sh
npm ci
npm run dev
```

Öppna adressen som terminalen visar.
Vite uppdaterar sidan när du sparar ändringar.
Öppna inte index.html direkt från filsystemet.

```sh
npm test
npm run test:ui
npm run build
npm run preview
```

Vite skapar publiceringsfilerna i `dist/`.

## Publicera på GitHub Pages

1. Granska och slå ihop ändringen till `main`.
2. Öppna projektets **Settings → Pages** på GitHub.
3. Välj **GitHub Actions** under **Source**.
4. Kör **Deploy GitHub Pages** från **Actions** om publiceringen redan misslyckades.
5. Använd adressen som publiceringen visar.

Arbetsflödet bygger och testar appen före publicering.
Vites relativa sökvägar fungerar även under `/stadtavla/`.
Publicera byggresultatet från `dist/`, inte projektets källfiler.

## Befintliga data

Appen använder fortfarande nyckeln `hemma-stadtavla-v1` och dataversion 2.
Samma webbläsare och webbadressens ursprung kan därför läsa befintliga data.
Ett ursprung består av protokoll, domän och port.
En annan domän, webbläsare eller enhet delar inte dessa data.

Exportera först en säkerhetskopia från den befintliga appens Inställningar.
Importera säkerhetskopian vid byte av ursprung eller enhet.
Importen stöder samma JSON-format som tidigare.
Appen skriver inte över oläsbara data med standarduppgifter.
Appen visar ett fel om lagringen misslyckas.

## Projektets delar

| Sökväg                              | Ansvar                                         |
| ----------------------------------- | ---------------------------------------------- |
| `src/App.jsx`                       | Navigation och samordning av ändringar         |
| `src/components/BoardViews.jsx`     | Dag, vecka, månad, uppgifter och inköpslista   |
| `src/components/TaskEditor.jsx`     | Uppgifter och delmoment                        |
| `src/components/ScheduleFields.jsx` | Schemainställningar                            |
| `src/components/DatePicker.jsx`     | Kalender för datumfält                         |
| `src/components/SettingsView.jsx`   | Inställningar och säkerhetskopior              |
| `src/domain/`                       | Datum, återkommande scheman och uppgiftsregler |
| `src/hooks/useBoard.js`             | Appens data, ångra och ordnade skrivningar     |
| `src/storage/localRepository.js`    | Lokal lagring bakom ett separat gränssnitt     |
| `src/hooks/useDevice.js`            | Tema, klocka och skärmlås                      |

## Firebase

Appen använder Google-inloggning och Firestore när ett konto är inloggat.
Följ [Firebase-guiden](docs/FIREBASE.md) innan du aktiverar versionen.
Guiden beskriver Google-inloggning, tillåtna domäner, databas, säkerhetsregler och App Check.
App Check kräver en offentlig reCAPTCHA Enterprise-webbplatsnyckel innan molnlagringen startar.
Aktivera även tjänsternas App Check-kontroll i Firebase efter verifierad testning.

Utan inloggning fungerar lokal lagring som tidigare.
Första inloggningen kräver ett uttryckligt val innan lokala uppgifter förs över.
Molnuppgifter och lokala uppgifter hålls åtskilda.
Varje konto får endast läsa och ändra sina egna uppgifter.
Synkning sker mellan enheter som använder samma konto.
Vid samtidiga ändringar stoppar versionskontrollen en tyst överskrivning.
Gemensamma hushåll återstår som nästa steg. QR-delning överför en separat kopia.

## Nästa steg: PWA

PWA ingår inte i den här ändringen.
Lägg senare till manifest, appikoner, Apple-touch-ikon och hantering av uppdateringar.
Bestäm också vad appen ska kunna göra utan nät.
Nuvarande Apple-metataggar finns kvar.
Ingen service worker lagrar gamla byggfiler i den här versionen.

## iPad

Grundappen anpassar JavaScript-syntax och CSS för Safari 12.
Firebase laddas separat och kräver en nyare webbläsare med BigInt-stöd.
Det garanterar inte stöd för alla äldre iPad-modeller.
Kontrollera appen på den faktiska paddan före byte.
Skärmlås fungerar bara när webbläsaren erbjuder funktionen.
Använd annars paddans inställning för Autolås.

## Kontroller

`npm test` kontrollerar återkommande scheman, delmoment, flyttar, historik, säkerhetskopior och lagringsfel.
GitHub kör testerna och produktionsbygget för varje ändringsförslag.

`npm run test:ui` bygger programmet och kontrollerar React-vyerna med en simulerad webbsida.
Det kontrollerar formulär, delmoment, kalender, inköp, navigation och teman.
Det ersätter inte en visuell kontroll på paddan.

## Navigation och konto

Mobilvyn visar loggan högst upp och sex lika breda menyknappar längst ned.
Samma meny visas på liggande plattor upp till 1440 bildpunkters bredd.
Plattans rubrik och datumknappar ligger kvar på samma rad.
Profilcirkeln visas även i detta läge när en användare finns.
Menyn tar hänsyn till telefonens skärmkant och ligger kvar när innehållet rullas.
På större skärmar ligger kontoknappen efter Inställningar i navigationen.
Inställningar innehåller också en egen del för kontot.

`AuthApp` kopplar Firebase-kontot och inloggningsfunktionerna till `App`.
`user` använder fälten `displayName`, `email` och `photoURL` från Firebase Authentication.
Sidhuvudet visar en profilknapp till höger efter inloggning.
Profilcirkeln använder en profilsymbol om bilden saknas eller inte kan laddas.
Kontodelen visar inloggning, profilbild, kontokoppling och utloggning.
Överföring av lokala uppgifter kräver ett uttryckligt val.

## Konto, inköp och QR-kopia

Logga in öppnar en popup för e-post och lösenord, återställning, Google och registrering.
Profilmenyn visar konto, synkstatus och utloggning.
Kontodelen i Inställningar visar kontrollfel och koppling av inloggningssätt.

Dagsvyn börjar med Kvarvarande, följt av Färdiga och Alla.
Håll inne en uppgift eller vara i ungefär en halv sekund och dra för att ordna listan.
Delmoment kan flyttas inom sin huvuduppgift.
Menyn innehåller även Flytta upp och Flytta ned för tangentbord och enklare användning.
Ordningen sparas i den aktiva tavlan och synkas för inloggade konton.
Avbockade varor behåller sin plats i den valda ordningen.

Inköp har frivilligt pris, butik, typ och kampanjdatum under Fler uppgifter.
Denna vecka sparar konkreta datum från måndag till söndag.
Redigering och radering finns i varans meny.
Ångra visas vid radering. En senare ändring stänger den gamla notisen.

Visa QR-kod skapar en komprimerad kopia av hela inköpslistan, inklusive avbockade varor.
Mobilen öppnar en separat sida utan navigation eller Firebase.
Listan ligger i länkens fragment och skickas inte som frågeparameter till webbservern.
Alla som har länken eller QR-koden kan läsa kopian.
Kopian skriver aldrig över mobilens vanliga tavla.
Mobilen sparar avbockningar för den senast öppnade kopian separat i localStorage.
Om lagringen inte fungerar visas ett meddelande och kopian fungerar medan sidan är öppen.
Det krävs internet för att öppna sidan första gången. Ingen offline-PWA ingår ännu.
QR-koden begränsas till 100 varor och en länk på högst 2200 tecken.
Vid för stora listor visas ett fel; inga varor kapas bort.
Testa skanning och långtryck på den faktiska paddan före normal användning.
