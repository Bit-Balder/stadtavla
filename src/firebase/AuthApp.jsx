import { useEffect, useMemo, useState } from "react";
import App from "../App.jsx";
import { createCloudRepository } from "../storage/cloudRepository.js";
import { database, login, logout, watchUser } from "./client.js";
export default function AuthApp() {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const repository = useMemo(
    () => (user ? createCloudRepository(database, user.uid) : null),
    [user?.uid],
  );
  useEffect(
    () =>
      watchUser(
        (next) => {
          setUser(next);
          setReady(true);
          setError("");
        },
        () => {
          setError(
            "Kunde inte återställa inloggningen. Du kan fortsätta utan konto.",
          );
          setReady(true);
        },
      ),
    [],
  );
  async function signIn() {
    try {
      setError("");
      await login();
    } catch (e) {
      if (
        e.code === "auth/popup-closed-by-user" ||
        e.code === "auth/cancelled-popup-request"
      )
        return;
      const message =
        e.code === "auth/unauthorized-domain"
          ? "Lägg till bit-balder.github.io under tillåtna domäner i Firebase Authentication."
          : e.code === "auth/popup-blocked"
            ? "Tillåt popupfönster för sidan och försök igen."
            : e.code === "auth/operation-not-allowed"
              ? "Aktivera Google under Firebase Authentication → Sign-in method."
              : "Kunde inte logga in. Kontrollera anslutningen och försök igen.";
      setError(message);
      throw Error(message);
    }
  }
  return (
    <App
      key={user?.uid || "guest"}
      user={user}
      cloudRepository={repository}
      onSignIn={ready ? signIn : undefined}
      onSignOut={logout}
      authError={error}
      authLoading={!ready}
    />
  );
}
