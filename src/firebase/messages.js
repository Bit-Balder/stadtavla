export function authMessage(e) {
  const messages = {
    "auth/invalid-credential":
      "Fel e-postadress eller lösenord. Försök igen eller återställ lösenordet.",
    "auth/wrong-password": "Fel e-postadress eller lösenord.",
    "auth/user-not-found": "Fel e-postadress eller lösenord.",
    "auth/invalid-email": "Ange en giltig e-postadress.",
    "auth/weak-password":
      "Lösenordet uppfyller inte kraven. Välj ett starkare lösenord.",
    "auth/password-does-not-meet-requirements":
      "Lösenordet uppfyller inte kontots lösenordskrav.",
    "auth/email-already-in-use":
      "Kunde inte skapa kontot. Prova att logga in eller återställa lösenordet.",
    "auth/account-exists-with-different-credential":
      "Logga in med ditt befintliga inloggningssätt. Koppla sedan Google under Mitt konto.",
    "auth/credential-already-in-use":
      "Inloggningen tillhör redan ett annat konto. Kontona har inte slagits ihop.",
    "auth/provider-already-linked":
      "Det inloggningssättet är redan kopplat till kontot.",
    "auth/requires-recent-login":
      "Logga ut och logga in igen innan du ändrar kontot.",
    "auth/too-many-requests":
      "För många försök. Vänta en stund och försök igen.",
    "auth/network-request-failed":
      "Kontrollera internetanslutningen och försök igen.",
    "auth/popup-blocked": "Tillåt popupfönster för sidan och försök igen.",
    "auth/popup-closed-by-user": "Inloggningen avbröts.",
    "auth/cancelled-popup-request": "Inloggningen avbröts.",
    "auth/unauthorized-domain":
      "Webbplatsen saknas bland tillåtna domäner i Firebase Authentication.",
    "auth/operation-not-allowed":
      "Inloggningssättet behöver aktiveras i Firebase Authentication.",
  };
  return messages[e?.code] || "Kunde inte slutföra åtgärden. Försök igen.";
}
