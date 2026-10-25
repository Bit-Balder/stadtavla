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

## Nästa steg: Firebase

Firebase ingår inte i den här ändringen.
Inloggning, molnlagring och delning är ännu inte aktiverade.

Börja med att definiera hushåll, medlemmar och deras behörigheter.
Lägg sedan till Firebase Authentication och Firestore med tillhörande säkerhetsregler.
Byt lagringsdelen via `read()` och `write(board)` i `useBoard`.
Behåll schemareglerna och React-vyerna.

`useBoard` väntar på läsningen innan appen visar uppgifter.
Den ordnar skrivningar så att senare ändringar sparas efter tidigare ändringar.
Realtidslyssnare, konflikthantering och sparande utan nät kräver ytterligare arbete.
Undvik att skriva hela hushållets dokument från flera enheter samtidigt.
Använd separata dokument och riktade ändringar när Firebase införs.
Importera lokala data efter ett uttryckligt val vid första inloggningen.

## Nästa steg: PWA

PWA ingår inte i den här ändringen.
Lägg senare till manifest, appikoner, Apple-touch-ikon och hantering av uppdateringar.
Bestäm också vad appen ska kunna göra utan nät.
Nuvarande Apple-metataggar finns kvar.
Ingen service worker lagrar gamla byggfiler i den här versionen.

## iPad

Bygget anpassar JavaScript-syntax och CSS för Safari 12.
Det garanterar inte stöd för alla äldre iPad-modeller.
Kontrollera appen på den faktiska paddan före byte.
Skärmlås fungerar bara när webbläsaren erbjuder funktionen.
Använd annars paddans inställning för Autolås.

## Kontroller

`npm test` kontrollerar återkommande scheman, delmoment, flyttar, historik, säkerhetskopior och lagringsfel.
GitHub kör testerna och produktionsbygget för varje ändringsförslag.

`npm run test:ui` kontrollerar det byggda programmet med en simulerad webbsida.
Det kontrollerar formulär, delmoment, kalender, inköp, navigation och teman.
Det ersätter inte en visuell kontroll på paddan.

## Navigation och konto

Mobilvyn visar loggan högst upp och sex lika breda menyknappar längst ned.
Menyn tar hänsyn till telefonens skärmkant och ligger kvar när innehållet rullas.
På större skärmar ligger kontoknappen efter Inställningar i navigationen.
Inställningar innehåller också en egen del för kontot.

`App` tar emot `user`, `onSignIn` och `onSignOut` när Firebase ansluts.
`user` använder fälten `displayName`, `email` och `photoURL` från Firebase Authentication.
Liggande vy och större skärmar visar en profilcirkel till vänster om loggans text.
Profilcirkeln använder initialer om bilden saknas eller inte kan laddas.
Kontodelen visar tydligt att inloggningen ännu inte är ansluten.
Ingen knapp skapar ett låtsaskonto eller ändrar lokal lagring till molnlagring.
